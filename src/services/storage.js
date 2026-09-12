const DEFAULT_SETTINGS = {
  theme: 'emerald', // 'emerald' | 'violet' | 'blue' | 'gold' | 'rose'
  autoLockMinutes: 5,
  clearClipboardSeconds: 30,
  biometricsEnabled: false,
  firebaseConfig: null,
  categories: [
    { id: 'games', name: 'เกม (Games)', icon: 'Gamepad2', color: 'text-purple-400' },
    { id: 'social', name: 'โซเชียลมีเดีย (Social)', icon: 'Globe', color: 'text-blue-400' },
    { id: 'work', name: 'งาน & อีเมล (Work & Email)', icon: 'Briefcase', color: 'text-amber-400' },
    { id: 'finance', name: 'การเงิน & ธนาคาร (Finance)', icon: 'CreditCard', color: 'text-emerald-400' },
    { id: 'shopping', name: 'ช้อปปิ้ง (Shopping)', icon: 'ShoppingBag', color: 'text-pink-400' },
    { id: 'others', name: 'อื่นๆ & โน้ตลับ (Others)', icon: 'Shield', color: 'text-cyan-400' }
  ]
};


const KEY = 'mykey_envelope_v2';
const SETTINGS = 'mykey_settings_v1';
const read = key => { const raw = localStorage.getItem(key); return raw === null ? null : JSON.parse(raw); };
export const storageService = {
  getEnvelope() {
    const stored = read(KEY);
    if (stored) return stored;
    const meta = read('mykey_vault_meta_v1'), vault = read('mykey_vault_data_v1');
    if (!meta && !vault) return null;
    if (!meta || !vault) throw new Error('ข้อมูลเดิมไม่ครบ กรุณากู้คืนจากไฟล์สำรอง');
    return { app: 'My Key', version: '1.0', meta, vault };
  },
  saveEnvelope(envelope, preserve = false) {
    const old = this.getEnvelope();
    if (preserve && old) localStorage.setItem('mykey_rollback_v2', JSON.stringify(old));
    // One atomic localStorage write prevents metadata/payload tearing.
    localStorage.setItem(KEY, JSON.stringify(envelope));
    localStorage.removeItem('mykey_vault_meta_v1');
    localStorage.removeItem('mykey_vault_data_v1');
  },
  getRollback() { return read('mykey_rollback_v2'); },
  getVaultMeta() { return this.getEnvelope()?.meta || null; },
  getEncryptedVaultData() { return this.getEnvelope()?.vault || null; },
  getSettings() { const parsed = read(SETTINGS); return { ...structuredClone(DEFAULT_SETTINGS), ...parsed }; },
  setSettings(settings) { localStorage.setItem(SETTINGS, JSON.stringify(settings)); },
  getBackupStatus() { return read('mykey_backup_status_v2') || {}; },
  setBackupStatus(status) { localStorage.setItem('mykey_backup_status_v2', JSON.stringify(status)); },
};
