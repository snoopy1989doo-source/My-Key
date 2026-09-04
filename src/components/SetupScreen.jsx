import React, { useState } from 'react';
import { Shield, KeyRound, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2, Copy, Download, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useVault } from '../context/VaultContext';

export default function SetupScreen() {
  const { setupNewVault } = useVault();

  const [step, setStep] = useState(1); // 1: Master Password & PIN, 2: Emergency Key
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emergencyKey, setEmergencyKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [confirmedSavedKey, setConfirmedSavedKey] = useState(false);

  // Strength check
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'ว่างเปล่า', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, text: 'พอใช้', color: 'bg-red-500' };
    if (score <= 4) return { score, text: 'ปลอดภัย', color: 'bg-amber-500' };
    return { score, text: 'แข็งแรงมาก', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(masterPassword);

  const handleCreateVault = async (e) => {
    e.preventDefault();
    setError('');

    if (masterPassword.length < 8) {
      setError('Master Password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (masterPassword !== confirmPassword) {
      setError('Master Password ทั้งสองช่องไม่ตรงกัน');
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN ด่วนต้องเป็นตัวเลข 4 - 6 หลักเท่านั้น');
      return;
    }
    if (pin !== confirmPin) {
      setError('รหัส PIN ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    try {
      setLoading(true);
      const result = await setupNewVault(masterPassword, pin);
      setEmergencyKey(result.emergencyKey);
      setStep(2);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้าง Vault: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(emergencyKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleDownloadSheet = () => {
    const textContent = `=====================================================
MY KEY - EMERGENCY RECOVERY SHEET (เอกสารกู้คืนฉุกเฉิน)
=====================================================
วันที่สร้าง: ${new Date().toLocaleString('th-TH')}

[คำเตือนสำคัญด้านความปลอดภัย]
เอกสารนี้ใช้สำหรับกู้คืนรหัสผ่านทั้งหมดของคุณในกรณีที่:
1. คุณลืม Master Password
2. มือถือสูญหาย หรืออุปกรณ์พังเสียหาย

กุญแจกู้คืนฉุกเฉินของคุณ (EMERGENCY RECOVERY KEY):
>>> ${emergencyKey} <<<

คำแนะนำ:
- พิมพ์ (Print) หน้านี้ออกมา หรือจดรหัสข้างต้นใส่สมุดลับ
- เก็บไว้ในที่ปลอดภัยที่บ้าน (เช่น ในตู้เซฟ)
- อย่าถ่ายรูปส่งทางแชทหรือเก็บไว้ในเครื่องมือถือ
=====================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MyKey_Emergency_Recovery_Sheet.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-surface-900 to-surface-950">
      <div className="w-full max-w-md bg-surface-850 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl border border-emerald-500/30 overflow-hidden mb-3 shadow-xl shadow-emerald-950 bg-surface-900">
            <img src="./logo.png" alt="My Key Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ยินดีต้อนรับสู่ My Key</h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 1 ? 'เริ่มต้นสร้างตู้เซฟเก็บรหัสผ่านส่วนตัวของคุณ' : 'บันทึกกุญแจกู้คืนฉุกเฉิน'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleCreateVault} className="space-y-4">
            {/* Master Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>1. ตั้ง Master Password (ใช้กู้คืน/ล็อกอินเครื่องใหม่)</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${strength.score >= 3 ? 'text-emerald-300 bg-emerald-950/60' : 'text-slate-400 bg-slate-800'}`}>
                  {strength.text}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="รหัสผ่านหลัก (ขั้นต่ำ 8 ตัวอักษร)"
                  required
                  className="w-full bg-surface-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex gap-1">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`h-full flex-1 rounded-full transition-colors ${
                      idx <= strength.score ? strength.color : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Confirm Master Password */}
            <div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ยืนยัน Master Password อีกครั้ง"
                required
                className="w-full bg-surface-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Quick PIN */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>2. ตั้งรหัส PIN ด่วน (สำหรับปลดล็อกใช้งานประจำวัน)</span>
                <span className="text-[10px] text-slate-400">ตัวเลข 4-6 หลัก</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="PIN 4-6 หลัก"
                  required
                  className="w-full bg-surface-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-center tracking-widest text-base font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="ยืนยัน PIN"
                  required
                  className="w-full bg-surface-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-center tracking-widest text-base font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-300 flex items-start gap-2">
              <KeyRound className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                <strong>Zero-Knowledge:</strong> ระบบจะเข้ารหัสข้อมูลทั้งหมดในเครื่องของคุณด้วย AES-256 ก่อนส่งขึ้น Cloud
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-surface-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'กำลังสร้าง Vault เข้ารหัส...' : 'สร้างตู้เซฟ My Key'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Step 2: Emergency Key */
          <div className="space-y-4">
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300 mb-0.5">กุญแจกู้คืนฉุกเฉิน (ห้ามทำหายเด็ดขาด)</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  หากคุณลืม Master Password หรือมือถือเครื่องนี้หาย กุญแจนี้เป็นหนทางเดียวที่จะกู้คืนรหัสผ่านของคุณได้
                </p>
              </div>
            </div>

            <div className="bg-surface-900 border border-slate-700/90 rounded-2xl p-4 text-center">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Your Emergency Key</p>
              <p className="font-mono text-base sm:text-lg font-bold text-emerald-400 tracking-wider break-all select-all py-1">
                {emergencyKey}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyKey}
                className="py-2.5 px-3 bg-surface-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedKey ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedKey ? 'คัดลอกแล้ว!' : 'คัดลอกกุญแจ'}
              </button>
              <button
                type="button"
                onClick={handleDownloadSheet}
                className="py-2.5 px-3 bg-surface-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-teal-400" />
                ดาวน์โหลดเอกสาร
              </button>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-900/60 border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmedSavedKey}
                onChange={(e) => setConfirmedSavedKey(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-surface-900 border-slate-700 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <span className="text-xs text-slate-300">
                ฉันได้บันทึกกุญแจฉุกเฉินนี้ไว้ในที่ปลอดภัยเรียบร้อยแล้ว
              </span>
            </label>

            <button
              type="button"
              disabled={!confirmedSavedKey}
              onClick={() => {
                // The vault is already unlocked in memory, closing setup opens the main app!
                window.location.reload();
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            >
              เข้าสู่ My Key
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
