import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, Eye, EyeOff, ArrowRight, Upload, AlertCircle, Sparkles, Delete } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export default function UnlockScreen() {
  const { unlockWithPin, unlockWithMasterPassword, unlockWithEmergencyKey, importEncryptedBackup } = useVault();

  // Mode: 'pin' | 'master' | 'emergency' | 'import'
  const [mode, setMode] = useState('pin');
  const [pin, setPin] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [emergencyKey, setEmergencyKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle PIN button click
  const handlePinPress = (digit) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length >= 4) {
        // Automatically attempt unlock if 4-6 digits
        attemptUnlockPin(nextPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const attemptUnlockPin = async (pinToTry) => {
    try {
      setLoading(true);
      setError('');
      await unlockWithPin(pinToTry);
    } catch (err) {
      if (pinToTry.length >= 4) {
        setError(err.message || 'รหัส PIN ไม่ถูกต้อง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMasterPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!masterPassword) return;
    try {
      setLoading(true);
      setError('');
      await unlockWithMasterPassword(masterPassword);
    } catch (err) {
      setError(err.message || 'Master Password ไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyKeySubmit = async (e) => {
    e.preventDefault();
    if (!emergencyKey) return;
    try {
      setLoading(true);
      setError('');
      await unlockWithEmergencyKey(emergencyKey);
    } catch (err) {
      setError(err.message || 'กุญแจกู้คืนฉุกเฉินไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const res = importEncryptedBackup(content);
      if (res.success) {
        alert('นำเข้าไฟล์สำรองสำเร็จ! กรุณาปลดล็อกด้วยรหัสผ่านของไฟล์สำรองนั้น');
        setMode('pin');
        setPin('');
      } else {
        setError('เกิดข้อผิดพลาด: ' + res.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-surface-900 via-surface-950 to-black select-none">
      <div className="w-full max-w-sm bg-surface-850/90 border border-slate-700/60 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl border border-emerald-500/30 overflow-hidden mb-3 shadow-xl shadow-emerald-950/60 bg-surface-900">
            <img src="./logo.png" alt="My Key Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">My Key</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'pin' && 'ปลดล็อกด้วยรหัส PIN'}
            {mode === 'master' && 'ปลดล็อกด้วย Master Password'}
            {mode === 'emergency' && 'กู้คืนด้วย Emergency Recovery Key'}
            {mode === 'import' && 'นำเข้าไฟล์สำรองข้อมูล'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-950/70 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* MODE: PIN UNLOCK */}
        {mode === 'pin' && (
          <div>
            {/* PIN Display Dots */}
            <div className="flex items-center justify-center gap-3 mb-6 py-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                      filled
                        ? 'bg-emerald-400 border-emerald-400 shadow-md shadow-emerald-500/50 scale-110'
                        : 'border-slate-600 bg-surface-900/60'
                    }`}
                  />
                );
              })}
            </div>

            {/* Numeric Keypad for fast touch / click */}
            <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinPress(digit.toString())}
                  disabled={loading}
                  className="w-16 h-16 rounded-2xl bg-surface-900 hover:bg-surface-800 active:bg-emerald-500 active:text-surface-950 border border-slate-700/60 text-xl font-bold text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handlePinPress('0')}
                disabled={loading}
                className="w-16 h-16 rounded-2xl bg-surface-900 hover:bg-surface-800 active:bg-emerald-500 active:text-surface-950 border border-slate-700/60 text-xl font-bold text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinDelete}
                disabled={loading || pin.length === 0}
                className="w-16 h-16 rounded-2xl bg-surface-900 hover:bg-surface-800 active:bg-red-500 border border-slate-700/60 text-slate-400 active:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Physical keyboard support */}
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                if (val.length >= 4) attemptUnlockPin(val);
              }}
              className="sr-only"
              autoFocus
            />

            {/* Switch Mode Links */}
            <div className="space-y-2 text-center pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => { setMode('master'); setError(''); }}
                className="text-slate-400 hover:text-emerald-400 transition-colors"
              >
                ใช้ Master Password
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => { setMode('emergency'); setError(''); }}
                  className="text-slate-500 hover:text-amber-400 text-[11px] transition-colors"
                >
                  กู้คืนด้วย Recovery Key / ลืมรหัส
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE: MASTER PASSWORD */}
        {mode === 'master' && (
          <form onSubmit={handleMasterPasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showMasterPassword ? 'text' : 'password'}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="กรอก Master Password"
                autoFocus
                required
                className="w-full bg-surface-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowMasterPassword(!showMasterPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !masterPassword}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-950"
            >
              {loading ? 'กำลังถอดรหัส...' : 'ปลดล็อกตู้เซฟ'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('pin'); setError(''); }}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← กลับไปใช้ PIN
              </button>
            </div>
          </form>
        )}

        {/* MODE: EMERGENCY RECOVERY KEY */}
        {mode === 'emergency' && (
          <form onSubmit={handleEmergencyKeySubmit} className="space-y-4">
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>กรอก Emergency Recovery Key ที่คุณได้บันทึกไว้ในขั้นตอนแรก (รูปแบบ: MK-XXXX-...)</span>
            </div>

            <input
              type="text"
              value={emergencyKey}
              onChange={(e) => setEmergencyKey(e.target.value.toUpperCase())}
              placeholder="MK-XXXX-XXXX-XXXX..."
              autoFocus
              required
              className="w-full bg-surface-900 border border-slate-700 rounded-xl px-3.5 py-3 font-mono text-center text-sm text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={loading || !emergencyKey}
              className="w-full bg-amber-500 hover:bg-amber-400 text-surface-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-950"
            >
              {loading ? 'กำลังกู้คืนข้อมูล...' : 'กู้คืนและปลดล็อก'}
              <Sparkles className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-center pt-2 text-xs">
              <button
                type="button"
                onClick={() => { setMode('pin'); setError(''); }}
                className="text-slate-400 hover:text-white"
              >
                ← กลับไปใช้ PIN
              </button>
              <button
                type="button"
                onClick={() => { setMode('import'); setError(''); }}
                className="text-teal-400 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                นำเข้าไฟล์สำรอง
              </button>
            </div>
          </form>
        )}

        {/* MODE: IMPORT BACKUP */}
        {mode === 'import' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-300">
              เลือกไฟล์สำรองนามสกุล <code>.json</code> ที่คุณเคยส่งออกไว้จากเครื่องอื่น
            </p>

            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-900/40">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-medium text-slate-200">แตะเพื่อเลือกไฟล์สำรอง (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => { setMode('pin'); setError(''); }}
              className="text-xs text-slate-400 hover:text-white block mx-auto"
            >
              ← ยกเลิกและกลับไปหน้าล็อก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
