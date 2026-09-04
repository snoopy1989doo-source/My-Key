import React, { useState } from 'react';
import {
  X, Cloud, Lock, Shield, KeyRound, Download, Upload, Trash2,
  CheckCircle2, AlertTriangle, RefreshCw, Eye, EyeOff, FileText, Database,
  Palette, Printer, Check
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { storageService } from '../services/storage';

const THEMES_LIST = [
  { id: 'emerald', name: 'Cyber Emerald', desc: 'โทนเขียวมรกต แฮกเกอร์ & ไซเบอร์ (ค่าเริ่มต้น)', color: 'bg-emerald-500', border: 'border-emerald-500' },
  { id: 'violet', name: 'Midnight Violet', desc: 'โทนม่วงเข้ม ลึกลับ หรูหรา ไนท์โหมด', color: 'bg-purple-500', border: 'border-purple-500' },
  { id: 'blue', name: 'Cyberpunk Blue', desc: 'โทนน้ำเงิน-ฟ้า นีออน ดิจิทัลไฮเทค', color: 'bg-blue-500', border: 'border-blue-500' },
  { id: 'gold', name: 'Obsidian Gold', desc: 'โทนดำตัดทอง พรีเมียม เลอค่า', color: 'bg-amber-500', border: 'border-amber-500' },
  { id: 'rose', name: 'Crimson Rose', desc: 'โทนแดงกุหลาบ โฉบเฉี่ยว ทันสมัย', color: 'bg-rose-500', border: 'border-rose-500' }
];

export default function SettingsModal({ isOpen, onClose, initialTab = 'cloud', onOpenPrint }) {
  const {
    settings,
    updateSettings,
    syncStatus,
    lastSynced,
    triggerCloudSync,
    changePin,
    changeMasterPassword,
    exportEncryptedBackup,
    importEncryptedBackup
  } = useVault();

  const [activeTab, setActiveTab] = useState(initialTab); // 'cloud' | 'security' | 'backup'

  // Firebase Config State
  const [firebaseJson, setFirebaseJson] = useState(() => {
    return settings.firebaseConfig ? JSON.stringify(settings.firebaseConfig, null, 2) : '';
  });
  const [cloudMsg, setCloudMsg] = useState({ type: '', text: '' });

  // PIN change state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg] = useState({ type: '', text: '' });

  // Master Password change state
  const [newMaster, setNewMaster] = useState('');
  const [confirmMaster, setConfirmMaster] = useState('');
  const [showNewMaster, setShowNewMaster] = useState(false);
  const [masterMsg, setMasterMsg] = useState({ type: '', text: '' });

  // Reset state
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  // Handle Firebase Config Save
  const handleSaveFirebase = (e) => {
    e.preventDefault();
    setCloudMsg({ type: '', text: '' });

    try {
      if (!firebaseJson.trim()) {
        updateSettings({ firebaseConfig: null });
        setCloudMsg({ type: 'success', text: 'ยกเลิกการเชื่อมต่อ Firebase เรียบร้อย' });
        return;
      }

      const parsed = JSON.parse(firebaseJson);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('JSON ต้องมีอย่างน้อย apiKey และ projectId');
      }

      updateSettings({ firebaseConfig: parsed });
      setCloudMsg({ type: 'success', text: 'บันทึกการตั้งค่า Firebase สำเร็จ! กำลังทดสอบซิงก์...' });
      triggerCloudSync();
    } catch (err) {
      setCloudMsg({ type: 'error', text: 'รูปแบบ JSON ไม่ถูกต้อง: ' + err.message });
    }
  };

  // Handle PIN change
  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinMsg({ type: '', text: '' });

    if (!/^\d{4,6}$/.test(newPin)) {
      setPinMsg({ type: 'error', text: 'PIN ต้องเป็นตัวเลข 4-6 หลักเท่านั้น' });
      return;
    }
    if (newPin !== confirmPin) {
      setPinMsg({ type: 'error', text: 'รหัส PIN ทั้งสองช่องไม่ตรงกัน' });
      return;
    }

    try {
      await changePin(newPin);
      setNewPin('');
      setConfirmPin('');
      setPinMsg({ type: 'success', text: 'เปลี่ยนรหัส PIN เรียบร้อยแล้ว' });
    } catch (err) {
      setPinMsg({ type: 'error', text: err.message });
    }
  };

  // Handle Master Password change
  const handleChangeMaster = async (e) => {
    e.preventDefault();
    setMasterMsg({ type: '', text: '' });

    if (newMaster.length < 8) {
      setMasterMsg({ type: 'error', text: 'Master Password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร' });
      return;
    }
    if (newMaster !== confirmMaster) {
      setMasterMsg({ type: 'error', text: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' });
      return;
    }

    try {
      await changeMasterPassword(newMaster);
      setNewMaster('');
      setConfirmMaster('');
      setMasterMsg({ type: 'success', text: 'เปลี่ยน Master Password เรียบร้อยแล้ว' });
    } catch (err) {
      setMasterMsg({ type: 'error', text: err.message });
    }
  };

  // Handle Import Backup
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = importEncryptedBackup(event.target.result);
      if (res.success) {
        alert('นำเข้าไฟล์สำรองสำเร็จ! ระบบจะทำการรีโหลดหน้าจอเพื่อปลดล็อก');
        window.location.reload();
      } else {
        alert('เกิดข้อผิดพลาดในการนำเข้า: ' + res.message);
      }
    };
    reader.readAsText(file);
  };

  // Handle Factory Reset
  const handleFactoryReset = () => {
    storageService.clearAll();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-surface-900 border border-slate-700/80 rounded-3xl shadow-2xl relative my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>การตั้งค่า My Key</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-surface-950 px-4">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'cloud'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Firebase Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>ความปลอดภัย & PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>สำรอง & กู้คืน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'theme'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>ธีมสี</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* TAB 1: FIREBASE CLOUD SYNC */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-3.5 text-emerald-300 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <Shield className="w-4 h-4" />
                  <span>ระบบสำรองข้อมูลอัตโนมัติป้องกันมือถือหาย (Zero-Knowledge)</span>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  ข้อมูลจะถูกส่งขึ้น Firebase ในรูปแบบ Ciphertext ที่เข้ารหัสแล้วเท่านั้น ทาง Firebase หรือแฮกเกอร์จะไม่สามารถเปิดดูรหัสผ่านจริงของคุณได้
                </p>
              </div>

              {/* Status card */}
              <div className="bg-surface-850 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px]">สถานะการเชื่อมต่อ:</span>
                  <p className="font-bold text-sm text-white flex items-center gap-1.5 mt-0.5">
                    {settings.firebaseConfig ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        <span className="text-emerald-400">เชื่อมต่อแล้ว</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                        <span className="text-slate-400">ยังไม่ได้เชื่อมต่อ</span>
                      </>
                    )}
                  </p>
                  {lastSynced && (
                    <p className="text-[10px] text-slate-500 mt-0.5">ซิงก์ล่าสุด: {lastSynced}</p>
                  )}
                </div>

                {settings.firebaseConfig && (
                  <button
                    type="button"
                    onClick={triggerCloudSync}
                    disabled={syncStatus === 'syncing'}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{syncStatus === 'syncing' ? 'กำลังซิงก์...' : 'ซิงก์ทันที'}</span>
                  </button>
                )}
              </div>

              {/* Form Input for Firebase Config */}
              <form onSubmit={handleSaveFirebase} className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    วางการตั้งค่า Firebase Config (JSON) จาก Firebase Console
                  </label>
                  <textarea
                    rows={6}
                    value={firebaseJson}
                    onChange={(e) => setFirebaseJson(e.target.value)}
                    placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "mykey-vault.firebaseapp.com",\n  "projectId": "mykey-vault",\n  "storageBucket": "mykey-vault.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                    className="w-full bg-surface-950 font-mono text-[11px] border border-slate-700 rounded-xl p-3 text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    * วิธีหา: ไปที่ Firebase Console → Project Settings → General → Your apps → SDK setup and configuration → เลือก Config
                  </p>
                </div>

                {cloudMsg.text && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    cloudMsg.type === 'success' ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-red-950/50 border-red-500/40 text-red-300'
                  }`}>
                    {cloudMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                    <span>{cloudMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-950"
                >
                  บันทึกการตั้งค่า Firebase
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SECURITY & TIMERS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change PIN Form */}
              <div className="bg-surface-850 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>เปลี่ยนรหัส PIN ด่วน</span>
                </h4>
                <form onSubmit={handleChangePin} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="PIN ใหม่ (4-6 หลัก)"
                      required
                      className="w-full bg-surface-900 border border-slate-700 rounded-xl px-3 py-2 text-center font-mono text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="ยืนยัน PIN ใหม่"
                      required
                      className="w-full bg-surface-900 border border-slate-700 rounded-xl px-3 py-2 text-center font-mono text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {pinMsg.text && (
                    <p className={`text-[11px] ${pinMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pinMsg.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-surface-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors"
                  >
                    อัปเดตรหัส PIN
                  </button>
                </form>
              </div>

              {/* Change Master Password Form */}
              <div className="bg-surface-850 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>เปลี่ยน Master Password</span>
                </h4>
                <form onSubmit={handleChangeMaster} className="space-y-2">
                  <div className="relative">
                    <input
                      type={showNewMaster ? 'text' : 'password'}
                      value={newMaster}
                      onChange={(e) => setNewMaster(e.target.value)}
                      placeholder="Master Password ใหม่ (ขั้นต่ำ 8 ตัวอักษร)"
                      required
                      className="w-full bg-surface-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewMaster(!showNewMaster)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-white"
                    >
                      {showNewMaster ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <input
                    type={showNewMaster ? 'text' : 'password'}
                    value={confirmMaster}
                    onChange={(e) => setConfirmMaster(e.target.value)}
                    placeholder="ยืนยัน Master Password ใหม่"
                    required
                    className="w-full bg-surface-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />

                  {masterMsg.text && (
                    <p className={`text-[11px] ${masterMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {masterMsg.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-surface-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors"
                  >
                    อัปเดต Master Password
                  </button>
                </form>
              </div>

              {/* Timers Settings */}
              <div className="bg-surface-850 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-sm">การล็อกอัตโนมัติ & คลิปบอร์ด</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      ล็อกตู้เซฟอัตโนมัติเมื่อไม่ใช้งาน
                    </label>
                    <select
                      value={settings.autoLockMinutes}
                      onChange={(e) => updateSettings({ autoLockMinutes: parseInt(e.target.value) })}
                      className="w-full bg-surface-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value={1}>1 นาที</option>
                      <option value={5}>5 นาที (แนะนำ)</option>
                      <option value={15}>15 นาที</option>
                      <option value={30}>30 นาที</option>
                      <option value={0}>ปิด (ไม่ล็อกอัตโนมัติ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      ล้างข้อมูลรหัสในคลิปบอร์ดหลังคัดลอก
                    </label>
                    <select
                      value={settings.clearClipboardSeconds}
                      onChange={(e) => updateSettings({ clearClipboardSeconds: parseInt(e.target.value) })}
                      className="w-full bg-surface-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value={15}>15 วินาที</option>
                      <option value={30}>30 วินาที (แนะนำ)</option>
                      <option value={60}>60 วินาที</option>
                      <option value={0}>ปิด (ไม่ล้างคลิปบอร์ด)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP & RECOVERY */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-surface-850 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>ส่งออกไฟล์สำรอง (Export Encrypted Backup)</span>
                </h4>
                <p className="text-slate-400 text-[11px]">
                  ดาวน์โหลดไฟล์สำรองข้อมูลทั้งหมดในรูปแบบ <code>.json</code> ที่เข้ารหัสไว้แล้ว สำหรับเก็บไว้ใน Flash Drive หรือคอมพิวเตอร์ของคุณ
                </p>
                <button
                  type="button"
                  onClick={exportEncryptedBackup}
                  className="w-full py-2.5 bg-surface-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์สำรอง (.json)</span>
                </button>
              </div>

              <div className="bg-surface-850 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>นำเข้าไฟล์สำรอง (Import Backup)</span>
                </h4>
                <p className="text-slate-400 text-[11px]">
                  นำเข้าไฟล์สำรอง <code>.json</code> เพื่อกู้คืนข้อมูลรหัสผ่านทั้งหมด
                </p>
                <label className="w-full py-2.5 bg-surface-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>เลือกไฟล์เพื่อนำเข้า (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Printable Physical Sheet Card */}
              <div className="bg-surface-850 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-teal-400" />
                  <span>พิมพ์สมุดรหัสผ่านลับ (Print Physical Sheet)</span>
                </h4>
                <p className="text-slate-400 text-[11px]">
                  จัดหน้ารูปแบบตารางขนาดกระดาษ A4 สะอาดตา สั่งพิมพ์ใส่กระดาษหรือบันทึกเป็น PDF เก็บไว้ในตู้เซฟที่บ้าน
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrint?.();
                  }}
                  className="w-full py-2.5 bg-surface-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                >
                  <Printer className="w-4 h-4 text-teal-400" />
                  <span>เปิดหน้าต่างสั่งพิมพ์สมุดรหัสผ่าน</span>
                </button>
              </div>

              {/* Danger Zone: Factory Reset */}
              <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-red-400 text-sm flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>ล้างข้อมูลทั้งหมดในเครื่อง (Factory Reset)</span>
                </h4>
                <p className="text-slate-400 text-[11px]">
                  ลบตู้เซฟและรหัสผ่านทั้งหมดออกจากเบราว์เซอร์/เครื่องนี้ (ข้อมูลบน Firebase จะไม่ถูกลบ)
                </p>
                {confirmReset ? (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleFactoryReset}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      ยืนยันการล้างข้อมูล
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-2 text-slate-400 hover:text-white text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    ล้างข้อมูลในเครื่อง
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: THEMES */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="bg-surface-850 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span>เลือกธีมสีตู้เซฟ (Vault Accent Theme)</span>
                </h4>
                <p className="text-slate-400 text-[11px]">
                  ปรับแต่งโทนสีหลักและแสงนีออนของแอปตามสไตล์ที่คุณชอบ
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {THEMES_LIST.map((th) => {
                    const isSelected = (settings.theme || 'emerald') === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => updateSettings({ theme: th.id })}
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-surface-950 border-white/50 shadow-lg shadow-black/50 scale-[1.02]'
                            : 'bg-surface-900/70 border-slate-800 hover:border-slate-700 hover:bg-surface-900'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl ${th.color} flex items-center justify-center text-surface-950 font-bold shrink-0 shadow-md`}>
                          {isSelected ? <Check className="w-5 h-5 text-surface-950 stroke-[3]" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs">{th.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{th.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
