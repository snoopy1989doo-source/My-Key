import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { portableEnvelope, validateEnvelope } from './vaultModel.js';
let app, auth, db, configuredProjectId;
let pending = Promise.resolve();
const revisionKey = uid => `mykey_cloud_revision_${uid}`;
async function assertRulesProtected() {
  if (!configuredProjectId) throw new Error('Firebase config ไม่มี projectId');
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(configuredProjectId)}/databases/(default)/documents/mykey_vaults?pageSize=1&mask.fieldPaths=app`;
  const response = await fetch(url, { cache: 'no-store' });
  if (response.ok) throw new Error('กฎ Firestore ยังเปิดให้อ่านโดยไม่ล็อกอิน กรุณา deploy firestore.rules ก่อนใช้ Cloud');
  if (![401, 403].includes(response.status)) throw new Error(`ตรวจสอบกฎ Firestore ไม่สำเร็จ (HTTP ${response.status})`);
}
export const firebaseService = {
  init(config) {
    pending = pending.catch(() => {}).then(async () => {
      if (app) await deleteApp(app);
      app = auth = db = configuredProjectId = null;
      if (!config) return;
      if (!config.apiKey || !config.projectId) throw new Error('Firebase config ไม่ครบ');
      configuredProjectId = config.projectId;
      app = initializeApp(config, 'my-key-v2'); auth = getAuth(app); db = getFirestore(app);
      await auth.authStateReady();
    });
    return pending;
  },
  async account() { await pending; return auth?.currentUser && { email: auth.currentUser.email, anonymous: auth.currentUser.isAnonymous }; },
  async login(email, password, create = false) {
    await pending;
    if (!auth) throw new Error('กรุณาตั้งค่า Firebase ก่อน');
    if (create && auth.currentUser?.isAnonymous) await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password));
    else if (create) await createUserWithEmailAndPassword(auth, email, password);
    else await signInWithEmailAndPassword(auth, email, password);
    return this.account();
  },
  async logout() { await pending; if (auth) await signOut(auth); },
  async user() {
    await pending;
    if (!auth?.currentUser) throw new Error('เข้าสู่ระบบบัญชี Cloud ก่อน');
    return auth.currentUser;
  },
  async checkConnection() {
    const user = await this.user();
    await assertRulesProtected();
    const snap = await getDocFromServer(doc(db, 'mykey_vaults', user.uid));
    if (!snap.exists()) return { email: user.email, anonymous: user.isAnonymous, hasBackup: false, updatedAt: null };
    const data = snap.data();
    validateEnvelope({ app: data.app || 'My Key', version: data.version || '1.0', meta: data.meta, vault: data.vault });
    return { email: user.email, anonymous: user.isAnonymous, hasBackup: true, updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null };
  },
  async uploadVault(envelope) {
    const user = await this.user();
    await assertRulesProtected();
    const data = portableEnvelope(validateEnvelope(envelope));
    const expected = JSON.parse(localStorage.getItem(revisionKey(user.uid)) || 'null');
    const nextRevision = crypto.randomUUID();
    await runTransaction(db, async tx => {
      const ref = doc(db, 'mykey_vaults', user.uid), snap = await tx.get(ref);
      if (snap.exists()) {
        const remote = snap.data();
        const acceptedLegacy = expected === 'legacy-accepted' && !remote.cloudRevision;
        if (!acceptedLegacy && (!expected || expected !== remote.cloudRevision || remote.meta?.vaultId !== data.meta.vaultId)) throw new Error('Cloud มีข้อมูลอื่นหรือใหม่กว่า กรุณาดาวน์โหลดตรวจสอบและกู้คืนก่อนซิงก์');
      }
      tx.set(ref, { ...data, cloudRevision: nextRevision, updatedAt: serverTimestamp() });
    });
    localStorage.setItem(revisionKey(user.uid), JSON.stringify(nextRevision));
    return { success: true, timestamp: new Date().toISOString() };
  },
  async downloadVault() {
    const user = await this.user();
    await assertRulesProtected();
    const snap = await getDocFromServer(doc(db, 'mykey_vaults', user.uid));
    if (!snap.exists()) throw new Error('ไม่พบข้อมูลบน Cloud');
    const data = snap.data();
    const envelope = validateEnvelope({ app: data.app || 'My Key', version: data.version || '1.0', meta: data.meta, vault: data.vault });
    return { envelope, cloudRevision: data.cloudRevision, uid: user.uid };
  },
  async acceptDownload(download) {
    const user = await this.user();
    if (user.uid !== download.uid) throw new Error('บัญชี Cloud เปลี่ยน กรุณาดาวน์โหลดใหม่');
    localStorage.setItem(revisionKey(user.uid), JSON.stringify(download.cloudRevision || 'legacy-accepted'));
  }
};
