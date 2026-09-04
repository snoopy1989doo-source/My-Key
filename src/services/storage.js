/**
 * Storage management service for My Key
 * Encrypted data is stored in localStorage / IndexedDB.
 */

const STORAGE_KEYS = {
  VAULT_META: 'mykey_vault_meta_v1',
  VAULT_DATA: 'mykey_vault_data_v1',
  SETTINGS: 'mykey_settings_v1'
};

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAzFA9fBhM9nHYNVpVgCv7-n38JVUFy5FI",
  authDomain: "my-key-9d8f2.firebaseapp.com",
  projectId: "my-key-9d8f2",
  storageBucket: "my-key-9d8f2.firebasestorage.app",
  messagingSenderId: "166384650690",
  appId: "1:166384650690:web:5a30d5b8901386bb84ae5b",
  measurementId: "G-L0M5ZTSKW4"
};

const DEFAULT_SETTINGS = {
  theme: 'emerald', // 'emerald' | 'violet' | 'blue' | 'gold' | 'rose'
  autoLockMinutes: 5,
  clearClipboardSeconds: 30,
  biometricsEnabled: false,
  firebaseConfig: DEFAULT_FIREBASE_CONFIG,
  categories: [
    { id: 'games', name: 'เกม (Games)', icon: 'Gamepad2', color: 'text-purple-400' },
    { id: 'social', name: 'โซเชียลมีเดีย (Social)', icon: 'Globe', color: 'text-blue-400' },
    { id: 'work', name: 'งาน & อีเมล (Work & Email)', icon: 'Briefcase', color: 'text-amber-400' },
    { id: 'finance', name: 'การเงิน & ธนาคาร (Finance)', icon: 'CreditCard', color: 'text-emerald-400' },
    { id: 'shopping', name: 'ช้อปปิ้ง (Shopping)', icon: 'ShoppingBag', color: 'text-pink-400' },
    { id: 'others', name: 'อื่นๆ & โน้ตลับ (Others)', icon: 'Shield', color: 'text-cyan-400' }
  ]
};

export const storageService = {
  getVaultMeta() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VAULT_META);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to get vault meta', e);
      return null;
    }
  },

  setVaultMeta(meta) {
    try {
      localStorage.setItem(STORAGE_KEYS.VAULT_META, JSON.stringify(meta));
    } catch (e) {
      console.error('Failed to save vault meta', e);
    }
  },

  getEncryptedVaultData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VAULT_DATA);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to get encrypted vault data', e);
      return null;
    }
  },

  setEncryptedVaultData(encryptedData) {
    try {
      localStorage.setItem(STORAGE_KEYS.VAULT_DATA, JSON.stringify(encryptedData));
    } catch (e) {
      console.error('Failed to save encrypted vault data', e);
    }
  },

  getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        firebaseConfig: parsed.firebaseConfig || DEFAULT_FIREBASE_CONFIG
      };
    } catch (e) {
      console.error('Failed to get settings', e);
      return DEFAULT_SETTINGS;
    }
  },

  setSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.VAULT_META);
    localStorage.removeItem(STORAGE_KEYS.VAULT_DATA);
  }
};
