import { encryptData, decryptData } from './crypto.js';
import { createEnvelope, openEnvelope, normalizePayload, portableEnvelope, revisePayload, mergePayload, wrapKey, exportRawKey, KDF_ROUNDS } from './vaultModel.js';

// Serializes commits and rejects writes from another tab or an expired unlock session.
export class VaultStore {
  constructor(storage) { this.storage = storage; this.key = null; this.payload = null; this.envelope = null; this.session = 0; this.queue = Promise.resolve(); }
  lock() { this.session++; this.key = null; this.payload = null; this.envelope = null; }
  async create(master, categories) {
    if (this.storage.getEnvelope()) throw new Error('มีตู้เซฟอยู่แล้ว กรุณาปลดล็อกหรือกู้คืน');
    const token = this.session;
    const result = await createEnvelope(master, categories);
    if (token !== this.session) throw new Error('ยกเลิกการสร้าง กรุณาลองใหม่');
    this.storage.saveEnvelope(result.envelope); Object.assign(this, { key: result.key, payload: result.payload, envelope: result.envelope });
    return result.recoveryKey;
  }
  async unlock(password, mode, categories) {
    const envelope = this.storage.getEnvelope();
    if (!envelope) throw new Error('ไม่พบตู้เซฟ');
    const token = this.session, snapshot = JSON.stringify(envelope);
    const opened = await openEnvelope(envelope, password, mode, categories);
    if (token !== this.session || JSON.stringify(this.storage.getEnvelope()) !== snapshot) throw new Error('ข้อมูลเปลี่ยนระหว่างปลดล็อก กรุณาลองใหม่');
    Object.assign(this, { ...opened, envelope });
  }
  async unlockKey(key, categories) {
    const envelope = this.storage.getEnvelope(), token = this.session;
    if (!envelope) throw new Error('ไม่พบตู้เซฟ');
    const payload = normalizePayload(await decryptData(envelope.vault.ciphertext, envelope.vault.iv, key), categories);
    if (token !== this.session || JSON.stringify(this.storage.getEnvelope()) !== JSON.stringify(envelope)) throw new Error('เซสชันหมดอายุ');
    Object.assign(this, { key, payload, envelope });
  }
  enqueue(operation) {
    const token = this.session;
    const work = this.queue.then(async () => {
      if (!this.key || token !== this.session) throw new Error('ตู้เซฟถูกล็อก กรุณาปลดล็อกอีกครั้ง');
      if (JSON.stringify(this.storage.getEnvelope()) !== JSON.stringify(this.envelope)) { this.lock(); throw new Error('ข้อมูลเปลี่ยนจากหน้าต่างอื่น กรุณาปลดล็อกใหม่'); }
      return operation(token);
    });
    this.queue = work.catch(() => {}); return work;
  }
  async commit(payload, meta, token, preserve = false) {
    const vault = await encryptData(payload, this.key);
    if (token !== this.session || !this.key) throw new Error('ตู้เซฟถูกล็อกก่อนบันทึก');
    if (JSON.stringify(this.storage.getEnvelope()) !== JSON.stringify(this.envelope)) throw new Error('ข้อมูลเปลี่ยนจากหน้าต่างอื่น');
    const envelope = { app: 'My Key', version: '2.0', meta: { ...meta, vaultId: meta.vaultId || meta.createdAt || crypto.randomUUID(), revision: (meta.revision || 0) + 1, updatedAt: new Date().toISOString() }, vault };
    this.storage.saveEnvelope(envelope, preserve);
    this.payload = payload; this.envelope = envelope;
    return envelope;
  }
  mutate(action, input) { return this.enqueue(token => this.commit(revisePayload(this.payload, action, input), this.envelope.meta, token)); }
  merge(payload) { return this.enqueue(token => this.commit(mergePayload(this.payload, payload), this.envelope.meta, token, true)); }
  changeMaster(password) {
    if (password.length < 12) throw new Error('ใช้ Master Password อย่างน้อย 12 ตัวอักษร');
    return this.enqueue(async token => {
      const wrap = await wrapKey(await exportRawKey(this.key), password);
      const meta = { ...this.envelope.meta, masterSalt: wrap.salt, wrappedByMaster: wrap.wrapped, masterIterations: KDF_ROUNDS };
      delete meta.pinSalt; delete meta.wrappedByPin;
      return this.commit(this.payload, meta, token);
    });
  }
  removeLegacyPin() { return this.enqueue(token => this.commit(this.payload, portableEnvelope(this.envelope).meta, token)); }
  rotateRecovery(secret) { return this.enqueue(async token => {
    const wrap = await wrapKey(await exportRawKey(this.key), secret);
    return this.commit(this.payload, { ...this.envelope.meta, recoverySalt: wrap.salt, wrappedByRecovery: wrap.wrapped, recoveryIterations: KDF_ROUNDS }, token);
  }); }
}
