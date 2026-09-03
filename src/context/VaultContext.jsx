import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  deriveKey,
  encryptData,
  decryptData,
  generateSalt,
  generateEmergencyKey,
  getRandomBytes,
  bufferToBase64,
  base64ToBuffer
} from '../services/crypto';
import { storageService } from '../services/storage';
import { firebaseService } from '../services/firebase';

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [isSetup, setIsSetup] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [vaultItems, setVaultItems] = useState([]);
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [lastSynced, setLastSynced] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active encryption key kept only in memory while unlocked
  const activeVaultKeyRef = useRef(null);
  const autoLockTimerRef = useRef(null);
  const clipboardClearTimerRef = useRef(null);

  // Check if vault is already setup
  useEffect(() => {
    const meta = storageService.getVaultMeta();
    if (meta && meta.isInitialized) {
      setIsSetup(true);
    } else {
      setIsSetup(false);
    }

    // Initialize Firebase if config exists in settings
    if (settings.firebaseConfig) {
      const ok = firebaseService.init(settings.firebaseConfig);
      if (ok) {
        setSyncStatus('idle');
      }
    }
  }, []);

  // Auto-lock timer on user inactivity
  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    if (!isLocked && settings.autoLockMinutes > 0) {
      autoLockTimerRef.current = setTimeout(() => {
        lockVault();
      }, settings.autoLockMinutes * 60 * 1000);
    }
  }, [isLocked, settings.autoLockMinutes]);

  useEffect(() => {
    if (isLocked) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetAutoLockTimer();

    events.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }));
    resetAutoLockTimer();

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleActivity));
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    };
  }, [isLocked, resetAutoLockTimer]);

  /**
   * Helper: Export Raw Key to JSON-serializable string
   */
  const exportRawKey = async (cryptoKey) => {
    const exported = await window.crypto.subtle.exportKey('raw', cryptoKey);
    return bufferToBase64(exported);
  };

  /**
   * Helper: Import Raw Key string back to CryptoKey
   */
  const importRawKey = async (rawKeyBase64) => {
    const buffer = base64ToBuffer(rawKeyBase64);
    return await window.crypto.subtle.importKey(
      'raw',
      buffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  /**
   * Step 1: Initialize a new Vault
   */
  const setupNewVault = async (masterPassword, pin) => {
    try {
      // 1. Generate master symmetric Vault Key
      const vaultKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const rawVaultKeyBase64 = await exportRawKey(vaultKey);

      // 2. Derive key from Master Password and wrap VaultKey
      const masterSalt = generateSalt(16);
      const masterDerivedKey = await deriveKey(masterPassword, masterSalt);
      const wrappedByMaster = await encryptData(rawVaultKeyBase64, masterDerivedKey);

      // 3. Derive key from PIN and wrap VaultKey
      const pinSalt = generateSalt(16);
      const pinDerivedKey = await deriveKey(pin, pinSalt);
      const wrappedByPin = await encryptData(rawVaultKeyBase64, pinDerivedKey);

      // 4. Generate Emergency Recovery Key and wrap VaultKey
      const emergencyKey = generateEmergencyKey();
      const recoverySalt = generateSalt(16);
      const recoveryDerivedKey = await deriveKey(emergencyKey, recoverySalt);
      const wrappedByRecovery = await encryptData(rawVaultKeyBase64, recoveryDerivedKey);

      // 5. Initial Vault Items (empty array)
      const initialItems = [];
      const encryptedVaultData = await encryptData(initialItems, vaultKey);

      // 6. Save metadata and initial encrypted payload
      const meta = {
        isInitialized: true,
        masterSalt,
        pinSalt,
        recoverySalt,
        wrappedByMaster,
        wrappedByPin,
        wrappedByRecovery,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      storageService.setVaultMeta(meta);
      storageService.setEncryptedVaultData(encryptedVaultData);

      // 7. Store active key in memory & unlock
      activeVaultKeyRef.current = vaultKey;
      setVaultItems(initialItems);
      setIsSetup(true);
      setIsLocked(false);

      // Return recovery key for user to save
      return { success: true, emergencyKey };
    } catch (error) {
      console.error('Setup vault failed:', error);
      throw error;
    }
  };

  /**
   * Unlock with PIN
   */
  const unlockWithPin = async (pin) => {
    const meta = storageService.getVaultMeta();
    if (!meta || !meta.wrappedByPin) throw new Error('ไม่พบข้อมูล Vault');

    const pinDerivedKey = await deriveKey(pin, meta.pinSalt);
    const rawVaultKeyBase64 = await decryptData(
      meta.wrappedByPin.ciphertext,
      meta.wrappedByPin.iv,
      pinDerivedKey
    );

    const vaultKey = await importRawKey(rawVaultKeyBase64);
    activeVaultKeyRef.current = vaultKey;

    // Decrypt items
    const encryptedData = storageService.getEncryptedVaultData();
    if (encryptedData) {
      const items = await decryptData(encryptedData.ciphertext, encryptedData.iv, vaultKey);
      setVaultItems(Array.isArray(items) ? items : []);
    } else {
      setVaultItems([]);
    }

    setIsLocked(false);
  };

  /**
   * Unlock with Master Password
   */
  const unlockWithMasterPassword = async (masterPassword) => {
    const meta = storageService.getVaultMeta();
    if (!meta || !meta.wrappedByMaster) throw new Error('ไม่พบข้อมูล Vault');

    const masterDerivedKey = await deriveKey(masterPassword, meta.masterSalt);
    const rawVaultKeyBase64 = await decryptData(
      meta.wrappedByMaster.ciphertext,
      meta.wrappedByMaster.iv,
      masterDerivedKey
    );

    const vaultKey = await importRawKey(rawVaultKeyBase64);
    activeVaultKeyRef.current = vaultKey;

    const encryptedData = storageService.getEncryptedVaultData();
    if (encryptedData) {
      const items = await decryptData(encryptedData.ciphertext, encryptedData.iv, vaultKey);
      setVaultItems(Array.isArray(items) ? items : []);
    } else {
      setVaultItems([]);
    }

    setIsLocked(false);
  };

  /**
   * Unlock with Emergency Recovery Key
   */
  const unlockWithEmergencyKey = async (emergencyKey) => {
    const cleanKey = emergencyKey.trim().toUpperCase();
    const meta = storageService.getVaultMeta();
    if (!meta || !meta.wrappedByRecovery) throw new Error('ไม่พบข้อมูล Vault');

    const recoveryDerivedKey = await deriveKey(cleanKey, meta.recoverySalt);
    const rawVaultKeyBase64 = await decryptData(
      meta.wrappedByRecovery.ciphertext,
      meta.wrappedByRecovery.iv,
      recoveryDerivedKey
    );

    const vaultKey = await importRawKey(rawVaultKeyBase64);
    activeVaultKeyRef.current = vaultKey;

    const encryptedData = storageService.getEncryptedVaultData();
    if (encryptedData) {
      const items = await decryptData(encryptedData.ciphertext, encryptedData.iv, vaultKey);
      setVaultItems(Array.isArray(items) ? items : []);
    } else {
      setVaultItems([]);
    }

    setIsLocked(false);
  };

  /**
   * Lock Vault
   */
  const lockVault = () => {
    activeVaultKeyRef.current = null;
    setVaultItems([]);
    setIsLocked(true);
  };

  /**
   * Persist Vault Items (Encrypt & Save & Sync)
   */
  const persistItems = async (items) => {
    if (!activeVaultKeyRef.current) throw new Error('Vault is locked');

    const encryptedVaultData = await encryptData(items, activeVaultKeyRef.current);
    storageService.setEncryptedVaultData(encryptedVaultData);

    const meta = storageService.getVaultMeta();
    if (meta) {
      meta.updatedAt = new Date().toISOString();
      storageService.setVaultMeta(meta);
    }

    // Auto-sync to Firebase if connected
    if (firebaseService.isConfigured()) {
      triggerCloudSync(meta, encryptedVaultData);
    }
  };

  /**
   * Cloud Sync Trigger
   */
  const triggerCloudSync = async (metaOverride, dataOverride) => {
    if (!firebaseService.isConfigured()) return;
    setSyncStatus('syncing');

    const meta = metaOverride || storageService.getVaultMeta();
    const data = dataOverride || storageService.getEncryptedVaultData();

    const result = await firebaseService.uploadVault(meta, data);
    if (result.success) {
      setSyncStatus('synced');
      setLastSynced(new Date().toLocaleTimeString('th-TH'));
    } else {
      setSyncStatus('error');
    }
  };

  /**
   * CRUD: Add or Update Item
   */
  const saveVaultItem = async (itemData) => {
    const isNew = !itemData.id;
    const now = new Date().toISOString();

    const item = {
      ...itemData,
      id: itemData.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      updatedAt: now,
      createdAt: itemData.createdAt || now,
      favorite: !!itemData.favorite
    };

    let updatedItems;
    if (isNew) {
      updatedItems = [item, ...vaultItems];
    } else {
      updatedItems = vaultItems.map(it => it.id === item.id ? item : it);
    }

    setVaultItems(updatedItems);
    await persistItems(updatedItems);
    return item;
  };

  /**
   * CRUD: Delete Item
   */
  const deleteVaultItem = async (id) => {
    const updatedItems = vaultItems.filter(it => it.id !== id);
    setVaultItems(updatedItems);
    await persistItems(updatedItems);
  };

  /**
   * Toggle Favorite
   */
  const toggleFavorite = async (id) => {
    const updatedItems = vaultItems.map(it =>
      it.id === id ? { ...it, favorite: !it.favorite } : it
    );
    setVaultItems(updatedItems);
    await persistItems(updatedItems);
  };

  /**
   * Reset/Change PIN
   */
  const changePin = async (newPin) => {
    if (!activeVaultKeyRef.current) throw new Error('Vault is locked');

    const meta = storageService.getVaultMeta();
    const rawVaultKeyBase64 = await exportRawKey(activeVaultKeyRef.current);

    const pinSalt = generateSalt(16);
    const pinDerivedKey = await deriveKey(newPin, pinSalt);
    const wrappedByPin = await encryptData(rawVaultKeyBase64, pinDerivedKey);

    meta.pinSalt = pinSalt;
    meta.wrappedByPin = wrappedByPin;
    meta.updatedAt = new Date().toISOString();

    storageService.setVaultMeta(meta);
    if (firebaseService.isConfigured()) {
      triggerCloudSync(meta);
    }
  };

  /**
   * Reset/Change Master Password
   */
  const changeMasterPassword = async (newMasterPassword) => {
    if (!activeVaultKeyRef.current) throw new Error('Vault is locked');

    const meta = storageService.getVaultMeta();
    const rawVaultKeyBase64 = await exportRawKey(activeVaultKeyRef.current);

    const masterSalt = generateSalt(16);
    const masterDerivedKey = await deriveKey(newMasterPassword, masterSalt);
    const wrappedByMaster = await encryptData(rawVaultKeyBase64, masterDerivedKey);

    meta.masterSalt = masterSalt;
    meta.wrappedByMaster = wrappedByMaster;
    meta.updatedAt = new Date().toISOString();

    storageService.setVaultMeta(meta);
    if (firebaseService.isConfigured()) {
      triggerCloudSync(meta);
    }
  };

  /**
   * Copy to Clipboard with auto-wipe security
   */
  const copyToClipboard = async (text, isSensitive = true) => {
    try {
      await navigator.clipboard.writeText(text);

      if (isSensitive && settings.clearClipboardSeconds > 0) {
        if (clipboardClearTimerRef.current) clearTimeout(clipboardClearTimerRef.current);

        clipboardClearTimerRef.current = setTimeout(async () => {
          try {
            // Check if clipboard still holds the sensitive text before clearing
            const current = await navigator.clipboard.readText();
            if (current === text) {
              await navigator.clipboard.writeText('');
            }
          } catch {
            // Ignore if clipboard reading fails
          }
        }, settings.clearClipboardSeconds * 1000);
      }
      return true;
    } catch (e) {
      console.error('Failed to copy', e);
      return false;
    }
  };

  /**
   * Save Settings
   */
  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    storageService.setSettings(merged);

    if (newSettings.firebaseConfig) {
      firebaseService.init(newSettings.firebaseConfig);
    }
  };

  /**
   * Export Backup File (Encrypted JSON)
   */
  const exportEncryptedBackup = () => {
    const meta = storageService.getVaultMeta();
    const vault = storageService.getEncryptedVaultData();
    const backupData = {
      app: 'My Key',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      meta,
      vault
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mykey_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Import Backup File
   */
  const importEncryptedBackup = (backupJsonString) => {
    try {
      const data = JSON.parse(backupJsonString);
      if (!data.meta || !data.vault) {
        throw new Error('รูปแบบไฟล์สำรองไม่ถูกต้อง');
      }

      storageService.setVaultMeta(data.meta);
      storageService.setEncryptedVaultData(data.vault);
      setIsSetup(true);
      lockVault();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <VaultContext.Provider
      value={{
        isSetup,
        isLocked,
        vaultItems,
        settings,
        syncStatus,
        lastSynced,
        activeCategory,
        searchQuery,
        setActiveCategory,
        setSearchQuery,
        setupNewVault,
        unlockWithPin,
        unlockWithMasterPassword,
        unlockWithEmergencyKey,
        lockVault,
        saveVaultItem,
        deleteVaultItem,
        toggleFavorite,
        changePin,
        changeMasterPassword,
        copyToClipboard,
        updateSettings,
        triggerCloudSync,
        exportEncryptedBackup,
        importEncryptedBackup
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
