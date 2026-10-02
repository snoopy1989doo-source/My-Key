import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
globalThis.structuredClone ||= value => JSON.parse(JSON.stringify(value));

const model = await import('../src/services/vaultModel.js');
const lockPolicy = await import('../src/services/lockPolicy.js');

test('allows a short background grace period before locking', () => {
  const hiddenAt = 1_000;
  assert.equal(lockPolicy.shouldLockAfterBackground(hiddenAt, 30_999, 30), false);
  assert.equal(lockPolicy.shouldLockAfterBackground(hiddenAt, 31_000, 30), true);
  assert.equal(lockPolicy.shouldLockAfterBackground(hiddenAt, 1_000, 0), true);
  assert.equal(lockPolicy.normalizeBackgroundLockSeconds(999), 30);
});

test('creates, opens, and strips quick PIN material from portable backups', async () => {
  const created = await model.createEnvelope('Correct-Horse-2026', [{ id: 'work', name: 'Work' }]);
  const opened = await model.openEnvelope(created.envelope, 'Correct-Horse-2026', 'master');
  assert.equal(opened.payload.items.length, 0);
  const raw = await model.exportRawKey(created.key);
  const pinWrap = await model.wrapKey(raw, '135790');
  const localEnvelope = { ...created.envelope, meta: { ...created.envelope.meta, pinSalt: pinWrap.salt, wrappedByPin: pinWrap.wrapped, pinIterations: pinWrap.iterations } };
  const pinOpened = await model.openEnvelope(localEnvelope, '135790', 'pin');
  assert.equal(pinOpened.payload.items.length, 0);
  const portable = model.portableEnvelope(localEnvelope);
  assert.equal('pinSalt' in portable.meta, false);
  assert.equal('wrappedByPin' in portable.meta, false);
  assert.equal('pinIterations' in portable.meta, false);
});

test('rejects malformed backups before import', () => {
  assert.throws(() => model.parseBackup('{"meta":{},"vault":{}}'));
  assert.throws(() => model.parseBackup('not-json'));
});

test('keeps deleted items and restores prior versions', () => {
  let payload = model.emptyPayload([]);
  payload = model.revisePayload(payload, 'save', { title: 'Mail', password: 'first-password' });
  const id = payload.items[0].id;
  payload = model.revisePayload(payload, 'save', { ...payload.items[0], password: 'second-password' });
  assert.equal(payload.history[id].length, 1);
  payload = model.revisePayload(payload, 'history', { id, index: 0 });
  assert.equal(payload.items[0].password, 'first-password');
  payload = model.revisePayload(payload, 'delete', id);
  assert.equal(payload.items.length, 0);
  assert.equal(payload.trash.length, 1);
  payload = model.revisePayload(payload, 'restore', id);
  assert.equal(payload.items[0].title, 'Mail');
});

test('finds duplicate and weak passwords locally', () => {
  const findings = model.passwordHealth([
    { id: 'a', title: 'A', password: 'password' },
    { id: 'b', title: 'B', password: 'password' },
    { id: 'c', title: 'C', password: 'Long-Unique-Password-2026' },
  ]);
  assert.equal(findings.length, 2);
  assert.ok(findings.every(item => item.reasons.includes('ใช้รหัสซ้ำ')));
});

test('bank account lives in encrypted payload, history and trash without password health noise', async () => {
  let payload = model.emptyPayload([]);
  payload = model.revisePayload(payload, 'save', { type: 'bank', title: 'บัญชีสำรอง', bankName: 'ธนาคารทดสอบ', accountNumber: '012-345-6789', accountName: 'ผู้ทดสอบ', accountType: 'savings' });
  const id = payload.items[0].id;
  assert.equal(model.passwordHealth(payload.items).length, 0);
  payload = model.revisePayload(payload, 'save', { ...payload.items[0], branch: 'สาขากลาง' });
  assert.equal(payload.history[id][0].item.accountNumber, '012-345-6789');
  payload = model.revisePayload(payload, 'delete', id);
  assert.equal(payload.trash[0].type, 'bank');
  payload = model.revisePayload(payload, 'restore', id);
  assert.equal(payload.items[0].branch, 'สาขากลาง');
  const created = await model.createEnvelope('Correct-Horse-2026', []);
  const cryptoModule = await import('../src/services/crypto.js');
  created.envelope.vault = await cryptoModule.encryptData(payload, created.key);
  const opened = await model.openEnvelope(created.envelope, 'Correct-Horse-2026');
  assert.equal(opened.payload.items[0].accountNumber, '012-345-6789');
});
