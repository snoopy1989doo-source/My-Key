import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { storageService } from '../services/storage.js';
import { VaultStore } from '../services/vaultStore.js';
import { portableEnvelope, parseBackup, openEnvelope, exportRawKey, importRawKey } from '../services/vaultModel.js';
import { generateEmergencyKey } from '../services/crypto.js';
import { firebaseService } from '../services/firebase.js';
import { isAndroid, NativeVault, nativeStatus, mirrorEnvelope, downloadFile } from '../services/native.js';
import { normalizeBackgroundLockSeconds, shouldLockAfterBackground } from '../services/lockPolicy.js';
const VaultContext = createContext(null);
export function VaultProvider({ children }) {
  const [store] = useState(() => new VaultStore(storageService));
  const [initial] = useState(() => { try { return { envelope: storageService.getEnvelope(), settings: storageService.getSettings() }; } catch (error) { return { error: error.message, settings: { categories: [], autoLockMinutes: 5 } }; } });
  const [isSetup, setIsSetup] = useState(!!initial.envelope);
  const [isLocked, setIsLocked] = useState(true);
  const [payload, setPayload] = useState(null);
  const [settings, setSettings] = useState(initial.settings);
  const [error, setError] = useState(initial.error || '');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSynced, setLastSynced] = useState(null);
  const [backupStatus, setBackupStatus] = useState(() => { try { return storageService.getBackupStatus(); } catch { return {}; } });
  const [biometrics, setBiometrics] = useState({ available: false, enrolled: false });
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStealthMode, setIsStealthMode] = useState(false);
  const pendingImport = useRef(null), clipboardTimer = useRef(null), backgroundTimer = useRef(null), hiddenAt = useRef(0), lockedRef = useRef(true), lastActivity = useRef(Date.now()), syncQueue = useRef(Promise.resolve());
  const mounted = useRef(true);
  const refreshNative = useCallback(async () => { try { const state = await nativeStatus(); if (mounted.current) setBiometrics(state); } catch { setBiometrics({ available: false, enrolled: false }); } }, []);
  const lockVault = useCallback(() => {
    lockedRef.current = true; clearTimeout(backgroundTimer.current); backgroundTimer.current = null; hiddenAt.current = 0; store.lock(); pendingImport.current = null; setPayload(null); setIsLocked(true); setSearchQuery(''); setActiveCategory('all'); setIsStealthMode(false);
  }, [store]);
  useEffect(() => () => store.lock(), [store]);
  useEffect(() => {
    mounted.current = true;
    const cancelBackgroundLock = () => { clearTimeout(backgroundTimer.current); backgroundTimer.current = null; };
    const scheduleBackgroundLock = () => {
      if (lockedRef.current || hiddenAt.current) return;
      hiddenAt.current = Date.now();
      const seconds = normalizeBackgroundLockSeconds(settings.backgroundLockSeconds);
      if (seconds === 0) lockVault();
      else backgroundTimer.current = setTimeout(lockVault, seconds * 1000);
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') { scheduleBackgroundLock(); return; }
      const mustLock = shouldLockAfterBackground(hiddenAt.current, Date.now(), settings.backgroundLockSeconds);
      cancelBackgroundLock(); hiddenAt.current = 0;
      if (mustLock) lockVault();
    };
    const external = event => { if (event.key === 'mykey_envelope_v2') lockVault(); };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', scheduleBackgroundLock); window.addEventListener('storage', external);
    let stopped = false, listener;
    if (isAndroid) NativeVault.addListener('background', scheduleBackgroundLock).then(handle => { if (stopped) handle.remove(); else listener = handle; });
    refreshNative();
    return () => { mounted.current = false; stopped = true; cancelBackgroundLock(); hiddenAt.current = 0; listener?.remove(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', scheduleBackgroundLock); window.removeEventListener('storage', external); };
  }, [settings.backgroundLockSeconds, lockVault, refreshNative]);
  useEffect(() => { firebaseService.init(settings.firebaseConfig).catch(e => setError(e.message)); }, [settings.firebaseConfig]);
  useEffect(() => { document.documentElement.dataset.theme = settings.theme || 'emerald'; }, [settings.theme]);
  useEffect(() => {
    if (isLocked) return;
    lastActivity.current = Date.now();
    const active = () => { lastActivity.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll']; events.forEach(e => window.addEventListener(e, active, { passive: true }));
    const timer = setInterval(() => { if (Date.now() - lastActivity.current >= Math.max(1, settings.autoLockMinutes || 5) * 60000) lockVault(); }, 1000);
    return () => { clearInterval(timer); events.forEach(e => window.removeEventListener(e, active)); };
  }, [isLocked, settings.autoLockMinutes, lockVault]);
  const show = () => { lockedRef.current = false; setPayload(structuredClone(store.payload)); setIsLocked(false); setIsSetup(true); setError(''); };
  const updateSettings = async next => {
    if (next.categories) { await store.mutate('categories', next.categories); setPayload(structuredClone(store.payload)); }
    const merged = { ...settings, ...next }; storageService.setSettings(merged); setSettings(merged);
    if (next.categories) await afterSave();
  };
  const triggerCloudSync = async () => {
    const envelope = storageService.getEnvelope();
    if (!envelope) throw new Error('ไม่มีข้อมูลให้ซิงก์');
    const job = syncQueue.current.catch(() => {}).then(async () => {
      setSyncStatus('syncing');
      try { const result = await firebaseService.uploadVault(envelope); setLastSynced(result.timestamp); setSyncStatus('synced'); return result; }
      catch (e) { setSyncStatus('error'); setError(e.message); throw e; }
    });
    syncQueue.current = job; return job;
  };
  async function afterSave() {
    if (store.payload) setPayload(structuredClone(store.payload));
    try { await mirrorEnvelope(portableEnvelope(storageService.getEnvelope())); } catch { setError('บันทึกในแอปแล้ว แต่สำเนา Autofill ยังอัปเดตไม่ได้ กรุณาเปิดแอปใหม่ก่อนใช้ Autofill'); }
    if (settings.firebaseConfig && await firebaseService.account()) triggerCloudSync().catch(() => {});
  }
  const unlock = async (password, mode) => {
    const attempts = JSON.parse(sessionStorage.getItem('mykey_attempts') || '{"count":0,"until":0}');
    if (Date.now() < attempts.until) throw new Error('ลองผิดหลายครั้ง กรุณารอหนึ่งนาที');
    try {
      await store.unlock(password, mode, settings.categories); sessionStorage.removeItem('mykey_attempts');
    } catch (e) { attempts.count++; if (attempts.count >= 5) { attempts.until = Date.now() + 60000; attempts.count = 0; } sessionStorage.setItem('mykey_attempts', JSON.stringify(attempts)); throw e; }
    // Legacy PIN remains local only until user explicitly upgrades with their master password.
    show();
    try { await mirrorEnvelope(portableEnvelope(store.envelope)); await refreshNative(); }
    catch { setError('ปลดล็อกสำเร็จ แต่สำเนา Autofill ยังอัปเดตไม่ได้ กรุณาลองเปิดแอปใหม่'); }
  };
  const setupNewVault = async master => { const emergencyKey = await store.create(master, settings.categories); return { success: true, emergencyKey }; };
  const completeSetup = async () => {
    if (!store.key) { setIsSetup(true); setIsLocked(true); return; }
    show();
    try { await mirrorEnvelope(portableEnvelope(store.envelope)); await refreshNative(); }
    catch { setError('สร้างตู้นิรภัยแล้ว แต่สำเนา Autofill ยังอัปเดตไม่ได้ กรุณาลองเปิดแอปใหม่'); }
  };
  const mutate = async (action, data) => { try { await store.mutate(action, data); await afterSave(); } catch (e) { if (!store.key) lockVault(); throw e; } };
  const verifyMaster = async password => { const session = store.session; const verified = await openEnvelope(storageService.getEnvelope(), password, 'master', settings.categories); if (!store.key || session !== store.session) throw new Error('กรุณาปลดล็อกอีกครั้ง'); return verified; };
  const enableBiometrics = async password => {
    const verified = await verifyMaster(password), session = store.session;
    await mirrorEnvelope(portableEnvelope(storageService.getEnvelope()));
    await NativeVault.enroll({ rawKey: await exportRawKey(verified.key), vaultId: store.envelope.meta.vaultId || store.envelope.meta.createdAt });
    if (session !== store.session) { await NativeVault.disable(); throw new Error('แอปถูกพัก กรุณาเปิดสแกนนิ้วใหม่'); }
    await store.removeLegacyPin(); await afterSave(); await refreshNative();
  };
  const unlockBiometrics = async () => {
    const session = store.session;
    const result = await NativeVault.unlock();
    if (session !== store.session || document.visibilityState === 'hidden') throw new Error('ยกเลิกการปลดล็อก');
    await store.unlockKey(await importRawKey(result.rawKey), settings.categories); show();
  };
  const recordBackupStatus = patch => { const status = { ...storageService.getBackupStatus(), ...patch }; storageService.setBackupStatus(status); setBackupStatus(status); };
  const exportEncryptedBackup = async () => {
    const envelope = portableEnvelope(storageService.getEnvelope());
    if (!store.key) throw new Error('กรุณาปลดล็อกก่อน');
    await downloadFile(`mykey_backup_${Date.now()}.json`, JSON.stringify(envelope, null, 2));
    recordBackupStatus({ exportedAt: new Date().toISOString(), count: store.payload?.items.length || 0 });
  };
  const checkBackup = async (text, password, mode = 'master', stage = false) => {
    const session = store.session, envelope = parseBackup(text);
    const result = await openEnvelope(envelope, password, mode, settings.categories);
    if (session !== store.session) throw new Error('เซสชันเปลี่ยน กรุณาตรวจไฟล์อีกครั้ง');
    const summary = { count: result.payload.items.length, trash: result.payload.trash.length, checkedAt: new Date().toISOString() };
    recordBackupStatus({ testedAt: summary.checkedAt, testedCount: summary.count });
    pendingImport.current = stage ? { envelope: portableEnvelope(envelope), ...result, session } : null;
    return summary;
  };
  const commitImport = async mode => {
    const pending = pendingImport.current;
    if (!pending || pending.session !== store.session) throw new Error('กรุณาตรวจไฟล์และรหัสก่อนนำเข้า');
    if (mode === 'merge') { await store.merge(pending.payload); await afterSave(); }
    else if (mode === 'replace') {
      await store.queue;
      if (pending.session !== store.session) throw new Error('เซสชันเปลี่ยน');
      // Invalidate native credentials first: an old biometric must not open a replaced vault.
      if (isAndroid) await NativeVault.disable();
      storageService.saveEnvelope(pending.envelope, true); store.lock();
      setPayload(null); setIsSetup(true); setIsLocked(true); await mirrorEnvelope(pending.envelope); await refreshNative();
    } else throw new Error('เลือกวิธีนำเข้า');
    pendingImport.current = null;
  };
  const copyToClipboard = async (text, sensitive = true) => {
    try {
      if (isAndroid) await NativeVault.copy({ text, seconds: sensitive ? settings.clearClipboardSeconds || 30 : 0 });
      else { await navigator.clipboard.writeText(text); if (sensitive) { clearTimeout(clipboardTimer.current); clipboardTimer.current = setTimeout(async () => { try { if (await navigator.clipboard.readText() === text) await navigator.clipboard.writeText(''); } catch { /* Browser may prohibit background reads. */ } }, (settings.clearClipboardSeconds || 30) * 1000); } }
      return true;
    } catch { setError('คัดลอกไม่สำเร็จ กรุณาลองใหม่'); return false; }
  };
  const rotateRecovery = async master => {
    await verifyMaster(master); const secret = generateEmergencyKey();
    await store.rotateRecovery(secret); await afterSave(); return secret;
  };
  const value = { isSetup, isLocked, vaultItems: payload?.items || [], trashItems: payload?.trash || [], history: payload?.history || {},
    settings: { ...settings, categories: payload?.categories || settings.categories }, error, setError, syncStatus, lastSynced, backupStatus,
    biometrics, refreshNative, enableBiometrics, unlockBiometrics, disableBiometrics: async () => { await NativeVault.disable(); await refreshNative(); },
    activeCategory, setActiveCategory, searchQuery, setSearchQuery, isStealthMode, toggleStealthMode: () => setIsStealthMode(v => !v),
    setupNewVault, completeSetup, lockVault, unlockWithPin: p => unlock(p, 'pin'), unlockWithMasterPassword: p => unlock(p, 'master'), unlockWithEmergencyKey: p => unlock(p, 'recovery'),
    saveVaultItem: data => mutate('save', data), deleteVaultItem: id => mutate('delete', id), restoreItem: id => mutate('restore', id), restoreHistory: (id, index) => mutate('history', { id, index }), toggleFavorite: id => mutate('favorite', id),
    changeMasterPassword: async (password, old) => { await verifyMaster(old); await store.changeMaster(password); await afterSave(); },
    removeLegacyPin: async master => { await verifyMaster(master); await store.removeLegacyPin(); await afterSave(); }, rotateRecovery,
    hasLegacyPin: !!storageService.getVaultMeta()?.wrappedByPin,
    updateSettings, setTheme: theme => updateSettings({ theme }), copyToClipboard, triggerCloudSync, exportEncryptedBackup, checkBackup, commitImport,
  };
  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}
export function useVault() { return useContext(VaultContext); }
