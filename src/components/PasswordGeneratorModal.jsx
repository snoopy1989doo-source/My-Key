import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, Check, ShieldCheck, Dna } from 'lucide-react';
import { generatePassword } from '../services/crypto';

export default function PasswordGeneratorModal({ isOpen, onClose, onSelectPassword }) {
  const [length, setLength] = useState(18);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const pass = generatePassword({
      length,
      useUpper,
      useLower,
      useNumbers,
      useSymbols
    });
    setPassword(pass);
  };

  useEffect(() => {
    if (isOpen) {
      generate();
    }
  }, [isOpen, length, useUpper, useLower, useNumbers, useSymbols]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check strength
  const getStrengthText = () => {
    if (length >= 20 && useUpper && useLower && useNumbers && useSymbols) return { label: 'ปลอดภัยระดับสูงสุด', color: 'text-emerald-400' };
    if (length >= 14) return { label: 'แข็งแรงมาก', color: 'text-teal-400' };
    if (length >= 10) return { label: 'ปานกลาง', color: 'text-amber-400' };
    return { label: 'ง่ายเกินไป', color: 'text-red-400' };
  };

  const strength = getStrengthText();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Dna className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">สุ่มรหัสผ่านปลอดภัย</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Password */}
        <div className="bg-surface-950 border border-slate-700/80 rounded-2xl p-4 mb-4 text-center relative group">
          <div className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider break-all select-all py-1">
            {password}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-xs">
            <span className={`font-semibold ${strength.color} flex items-center gap-1`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {strength.label}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generate}
                className="p-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 text-slate-400 hover:text-white transition-colors"
                title="สุ่มใหม่"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4 text-xs">
          {/* Length Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-slate-300">ความยาวตัวอักษร</span>
              <span className="font-mono font-bold text-emerald-400 text-sm bg-surface-850 px-2 py-0.5 rounded-lg border border-slate-700">
                {length}
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="40"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-1.5 bg-surface-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-850 border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useUpper}
                onChange={(e) => setUseUpper(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-surface-900 border-slate-700"
              />
              <span className="text-slate-300">ตัวพิมพ์ใหญ่ (A-Z)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-850 border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useLower}
                onChange={(e) => setUseLower(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-surface-900 border-slate-700"
              />
              <span className="text-slate-300">ตัวพิมพ์เล็ก (a-z)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-850 border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useNumbers}
                onChange={(e) => setUseNumbers(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-surface-900 border-slate-700"
              />
              <span className="text-slate-300">ตัวเลข (0-9)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-850 border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useSymbols}
                onChange={(e) => setUseSymbols(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-surface-900 border-slate-700"
              />
              <span className="text-slate-300">สัญลักษณ์ (!@#$)</span>
            </label>
          </div>
        </div>

        {/* Use Password Button */}
        {onSelectPassword && (
          <button
            type="button"
            onClick={() => {
              onSelectPassword(password);
              onClose();
            }}
            className="w-full mt-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold rounded-xl text-xs transition-colors"
          >
            นำรหัสผ่านนี้ไปใช้
          </button>
        )}
      </div>
    </div>
  );
}
