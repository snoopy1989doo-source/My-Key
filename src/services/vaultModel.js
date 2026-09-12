import { deriveKey, encryptData, decryptData, generateSalt, generateEmergencyKey, bufferToBase64, base64ToBuffer } from './crypto.js';

export const KDF_ROUNDS = 600000;
export const MAX_BACKUP_BYTES = 12 * 1024 * 1024;
const clone = value => structuredClone(value);
const stamp = () => new Date().toISOString();
export const emptyPayload = (categories = []) => ({ items: [], trash: [], categories, history: {} });

function validateItem(item) {
  if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string') throw new Error('รายการในไฟล์ไม่ถูกต้อง');
  for (const field of ['password', 'username', 'pin', 'notes', 'url', 'category', 'androidPackage', 'androidCertSha256']) {
    if (item[field] !== undefined && typeof item[field] !== 'string') throw new Error('ข้อมูลรายการไม่ถูกต้อง');
  }
}
export function normalizePayload(data, fallbackCategories = []) {
  const payload = Array.isArray(data) ? { ...emptyPayload(fallbackCategories), items: data } : data;
  if (!payload || !Array.isArray(payload.items) || !Array.isArray(payload.trash) || !Array.isArray(payload.categories) || !payload.history || typeof payload.history !== 'object' || Array.isArray(payload.history)) throw new Error('โครงสร้างตู้เซฟไม่ถูกต้อง');
  const ids = new Set();
  for (const item of [...payload.items, ...payload.trash]) { validateItem(item); if (ids.has(item.id)) throw new Error('รหัสรายการซ้ำในไฟล์'); ids.add(item.id); }
  for (const cat of payload.categories) if (!cat || typeof cat.id !== 'string' || typeof cat.name !== 'string') throw new Error('หมวดหมู่ไม่ถูกต้อง');
  for (const entries of Object.values(payload.history)) {
    if (!Array.isArray(entries) || entries.length > 50) throw new Error('ประวัติไม่ถูกต้อง');
    for (const entry of entries) { if (!entry || typeof entry.at !== 'string') throw new Error('ประวัติไม่ถูกต้อง'); validateItem(entry.item); }
  }
  return clone(payload);
}
function validBlob(blob) {
  if (!blob || typeof blob.iv !== 'string' || typeof blob.ciphertext !== 'string') return false;
  try { return base64ToBuffer(blob.iv).byteLength === 12 && base64ToBuffer(blob.ciphertext).byteLength >= 16; } catch { return false; }
}
export function validateEnvelope(data) {
  if (!data || data.app !== 'My Key' || !['1.0', '2.0'].includes(data.version)) throw new Error('ไม่ใช่ไฟล์สำรอง My Key ที่รองรับ');
  const m = data.meta;
  if (!m?.isInitialized || !validBlob(data.vault) || !validBlob(m.wrappedByMaster) || !validBlob(m.wrappedByRecovery)) throw new Error('ไฟล์สำรองไม่ครบหรือเสียหาย');
  for (const name of ['masterSalt', 'recoverySalt']) {
    try { if (typeof m[name] !== 'string' || base64ToBuffer(m[name]).byteLength !== 16) throw new Error(); } catch { throw new Error('Salt ในไฟล์ไม่ถูกต้อง'); }
  }
  for (const name of ['masterIterations', 'recoveryIterations']) if (m[name] !== undefined && (!Number.isInteger(m[name]) || m[name] < 120000 || m[name] > 2000000)) throw new Error('ค่าเข้ารหัสไม่รองรับ');
  return data;
}
export function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error('ไฟล์สำรองใหญ่เกิน 12 MB');
  return validateEnvelope(JSON.parse(text));
}
export function portableEnvelope(envelope) {
  const result = clone(envelope);
  // A portable copy must never contain the low-entropy quick-unlock wrapper.
  delete result.meta.pinSalt; delete result.meta.wrappedByPin; delete result.meta.pinIterations;
  return result;
}
export async function importRawKey(raw) {
  return crypto.subtle.importKey('raw', base64ToBuffer(raw), { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
export async function exportRawKey(key) { return bufferToBase64(await crypto.subtle.exportKey('raw', key)); }
export async function wrapKey(raw, password, iterations = KDF_ROUNDS) {
  const salt = generateSalt();
  return { salt, wrapped: await encryptData(raw, await deriveKey(password, salt, iterations)), iterations };
}
export async function openEnvelope(envelope, password, mode = 'master', categories = []) {
  validateEnvelope(envelope);
  if (!['master', 'recovery', 'pin'].includes(mode)) throw new Error('วิธีปลดล็อกไม่ถูกต้อง');
  const m = envelope.meta;
  const field = mode[0].toUpperCase() + mode.slice(1);
  if (!m[`wrappedBy${field}`]) throw new Error('เครื่องนี้ไม่มี PIN เดิม กรุณาใช้ Master Password');
  const secret = mode === 'recovery' ? password.trim().toUpperCase() : password;
  const derived = await deriveKey(secret, m[`${mode}Salt`], m[`${mode}Iterations`] || 120000);
  const wrapped = m[`wrappedBy${field}`];
  const raw = await decryptData(wrapped.ciphertext, wrapped.iv, derived);
  const key = await importRawKey(raw);
  const payload = normalizePayload(await decryptData(envelope.vault.ciphertext, envelope.vault.iv, key), categories);
  return { key, payload };
}
export async function createEnvelope(master, categories) {
  if (master.length < 12) throw new Error('Master Password ต้องมีอย่างน้อย 12 ตัวอักษร');
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const raw = await exportRawKey(key);
  const recoveryKey = generateEmergencyKey();
  const masterWrap = await wrapKey(raw, master), recoveryWrap = await wrapKey(raw, recoveryKey);
  const payload = emptyPayload(categories);
  return { key, payload, recoveryKey, envelope: { app: 'My Key', version: '2.0', meta: {
    isInitialized: true, vaultId: crypto.randomUUID(), createdAt: stamp(), updatedAt: stamp(), revision: 1,
    masterSalt: masterWrap.salt, wrappedByMaster: masterWrap.wrapped, masterIterations: KDF_ROUNDS,
    recoverySalt: recoveryWrap.salt, wrappedByRecovery: recoveryWrap.wrapped, recoveryIterations: KDF_ROUNDS,
  }, vault: await encryptData(payload, key) } };
}
export function revisePayload(payload, action, input) {
  const next = clone(payload);
  const remember = item => { next.history[item.id] = [{ at: stamp(), item: clone(item) }, ...(next.history[item.id] || [])].slice(0, 30); };
  if (action === 'save') {
    const old = next.items.find(i => i.id === input.id);
    const item = { ...input, id: input.id || crypto.randomUUID(), createdAt: old?.createdAt || stamp(), updatedAt: stamp(), favorite: !!input.favorite };
    validateItem(item);
    if (old) { remember(old); next.items = next.items.map(i => i.id === item.id ? item : i); } else next.items.unshift(item);
  } else if (action === 'delete') {
    const item = next.items.find(i => i.id === input);
    if (!item) throw new Error('ไม่พบรายการ');
    next.trash.unshift({ ...item, deletedAt: stamp() }); next.items = next.items.filter(i => i.id !== input);
  } else if (action === 'restore') {
    const item = next.trash.find(i => i.id === input);
    if (!item) throw new Error('ไม่พบรายการในถังขยะ');
    delete item.deletedAt; next.items.unshift({ ...item, updatedAt: stamp() }); next.trash = next.trash.filter(i => i.id !== input);
  } else if (action === 'history') {
    const item = next.items.find(i => i.id === input.id), snapshot = next.history[input.id]?.[input.index];
    if (!item || !snapshot) throw new Error('ไม่พบประวัติ');
    const restored = { ...snapshot.item, id: item.id, updatedAt: stamp() }; remember(item); next.items = next.items.map(i => i.id === item.id ? restored : i);
  } else if (action === 'favorite') next.items = next.items.map(i => i.id === input ? { ...i, favorite: !i.favorite } : i);
  else if (action === 'categories') next.categories = clone(input);
  else throw new Error('คำสั่งไม่รองรับ');
  return next;
}
export function mergePayload(current, incoming) {
  const result = clone(current);
  // Imported records receive new IDs: never overwrite newer local passwords silently.
  for (const item of incoming.items) {
    if (result.items.some(existing => existing.id === item.id && JSON.stringify(existing) === JSON.stringify(item))) continue;
    const id = crypto.randomUUID(); result.items.push({ ...item, id });
    if (incoming.history[item.id]) result.history[id] = clone(incoming.history[item.id]).map(entry => ({ ...entry, item: { ...entry.item, id } }));
  }
  for (const item of incoming.trash) { const id = crypto.randomUUID(); result.trash.push({ ...item, id }); }
  for (const cat of incoming.categories) if (!result.categories.some(c => c.id === cat.id)) result.categories.push(cat);
  return result;
}
export function passwordHealth(items) {
  const counts = new Map();
  for (const item of items) if (item.password) counts.set(item.password, (counts.get(item.password) || 0) + 1);
  return items.map(item => {
    const pass = item.password || '';
    const reasons = [];
    if (!pass) reasons.push('ยังไม่มีรหัสผ่าน');
    else {
      if (pass.length < 12) reasons.push('สั้นกว่า 12 ตัวอักษร');
      if (/^(.)\1+$/.test(pass) || /^(password|qwerty|123456|admin|letmein)/i.test(pass)) reasons.push('รูปแบบเดาง่าย');
      if ((counts.get(pass) || 0) > 1) reasons.push('ใช้รหัสซ้ำ');
    }
    return { id: item.id, title: item.title, reasons };
  }).filter(item => item.reasons.length);
}
