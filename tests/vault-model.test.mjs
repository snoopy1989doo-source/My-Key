import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
globalThis.structuredClone ||= value => JSON.parse(JSON.stringify(value));

const model = await import('../src/services/vaultModel.js');

test('creates, opens, and strips quick PIN material from portable backups', async () => {
  const created = await model.createEnvelope('Correct-Horse-2026', [{ id: 'work', name: 'Work' }]);
  const opened = await model.openEnvelope(created.envelope, 'Correct-Horse-2026', 'master');
  assert.equal(opened.payload.items.length, 0);
  const portable = model.portableEnvelope({ ...created.envelope, meta: { ...created.envelope.meta, pinSalt: 'x', wrappedByPin: {} } });
  assert.equal('pinSalt' in portable.meta, false);
  assert.equal('wrappedByPin' in portable.meta, false);
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
