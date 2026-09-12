import React, { useState } from 'react';
import { X, Printer, Shield, Check, Eye, EyeOff, Hash, FileText } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export default function PrintVaultModal({ isOpen, onClose }) {
  const { vaultItems, settings } = useVault();

  const [maskPasswords, setMaskPasswords] = useState(true);
  const [includePins, setIncludePins] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Group items by category
  const categoriesWithItems = settings.categories.map(cat => ({
    ...cat,
    items: vaultItems.filter(item => item.category === cat.id)
  })).filter(cat => cat.items.length > 0);

  // Items without specific category or in 'others'
  const otherItems = vaultItems.filter(item =>
    !item.category || item.category === 'others' || !settings.categories.some(c => c.id === item.category)
  );

  return (
    <div className="print-vault fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-surface-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-6 max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="no-print flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">พิมพ์สมุดรหัสผ่านลับ (Printable Vault Sheet)</h3>
              <p className="text-[11px] text-slate-400">จัดหน้าสำหรับสั่งพิมพ์ใส่กระดาษ A4 หรือบันทึกเป็น PDF เพื่อเก็บในตู้เซฟที่บ้าน</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Options */}
        <div className="no-print bg-surface-850 border border-slate-800 rounded-2xl p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={maskPasswords}
                onChange={(e) => setMaskPasswords(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-surface-900 border-slate-700 focus:ring-0"
              />
              <span>ซ่อนรหัสผ่านบางส่วน (เช่น p***d)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={includePins}
                onChange={(e) => setIncludePins(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-surface-900 border-slate-700 focus:ring-0"
              />
              <span>รวมรหัส PIN บัตร/แอป</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-surface-900 border-slate-700 focus:ring-0"
              />
              <span>รวมโน้ตลับ</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all active:scale-95 ml-auto"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ / บันทึก PDF</span>
          </button>
        </div>

        {/* Sheet Preview Container */}
        <div className="overflow-y-auto flex-1 p-4 bg-white text-slate-900 rounded-2xl border border-slate-300 shadow-inner font-sans text-xs">
          {/* Paper Header */}
          <div className="border-b-2 border-slate-800 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>🛡️ MY KEY - CONFIDENTIAL PERSONAL VAULT</span>
              </h1>
              <p className="text-[11px] text-slate-600 mt-0.5">
                เอกสารบันทึกรหัสผ่านส่วนบุคคลความปลอดภัยสูงสุด • ฉบับพิมพ์เก็บสำรองฉุกเฉิน
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              <p>วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')}</p>
              <p>เวลา: {new Date().toLocaleTimeString('th-TH')}</p>
              <p>จำนวน: {vaultItems.length} รายการ</p>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-4">
            {vaultItems.length === 0 ? (
              <p className="text-center py-8 text-slate-400 italic">ยังไม่มีข้อมูลในตู้เซฟ</p>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700">
                    <th className="py-2 px-2.5 font-bold">#</th>
                    <th className="py-2 px-2.5 font-bold">ชื่อรายการ</th>
                    <th className="py-2 px-2.5 font-bold">หมวดหมู่</th>
                    <th className="py-2 px-2.5 font-bold">ชื่อผู้ใช้ / อีเมล</th>
                    <th className="py-2 px-2.5 font-bold">รหัสผ่าน (Password)</th>
                    {includePins && <th className="py-2 px-2.5 font-bold">PIN</th>}
                    {includeNotes && <th className="py-2 px-2.5 font-bold">โน้ต</th>}
                  </tr>
                </thead>
                <tbody>
                  {vaultItems.map((item, idx) => {
                    const catName = settings.categories.find(c => c.id === item.category)?.name || item.category || 'ทั่วไป';
                    const displayPassword = maskPasswords && item.password
                      ? (item.password.length > 3 ? `${item.password[0]}***${item.password.slice(-1)}` : '***')
                      : item.password || '-';

                    return (
                      <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-2.5 font-bold text-slate-900">{item.title}</td>
                        <td className="py-2 px-2.5 text-slate-600 text-[11px]">{catName}</td>
                        <td className="py-2 px-2.5 font-mono text-slate-700">{item.username || '-'}</td>
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-900">{displayPassword}</td>
                        {includePins && (
                          <td className="py-2 px-2.5 font-mono text-slate-800">{item.pin || '-'}</td>
                        )}
                        {includeNotes && (
                          <td className="py-2 px-2.5 text-slate-500 text-[11px] italic max-w-[180px] truncate">
                            {item.notes || '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Paper Footer Warning */}
          <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
            <p>⚠️ <strong>คำเตือน:</strong> เอกสารนี้มีความสำคัญสูงสุด ควรจัดเก็บในตู้เซฟหรือสถานที่ปลอดภัยที่บ้านเท่านั้น</p>
            <p className="font-mono">My Key v1.0 • Zero-Knowledge</p>
          </div>
        </div>
      </div>
    </div>
  );
}
