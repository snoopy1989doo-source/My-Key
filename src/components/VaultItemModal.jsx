import React, { useState, useEffect } from 'react';
import {
  X, Eye, EyeOff, Copy, Check, Dna, ExternalLink, Trash2, Star,
  Lock, User, Globe, FileText, Hash, AlertCircle, Save
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { generatePassword } from '../services/crypto';

export default function VaultItemModal({ item, isOpen, onClose, onOpenGenerator }) {
  const { saveVaultItem, deleteVaultItem, copyToClipboard, settings } = useVault();

  const isNew = !item?.id;

  const [formData, setFormData] = useState({
    title: '',
    category: 'games',
    username: '',
    password: '',
    pin: '',
    url: '',
    notes: '',
    favorite: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        title: item.title || '',
        category: item.category || 'games',
        username: item.username || '',
        password: item.password || '',
        pin: item.pin || '',
        url: item.url || '',
        notes: item.notes || '',
        favorite: !!item.favorite,
        createdAt: item.createdAt
      });
    } else {
      setFormData({
        title: '',
        category: 'games',
        username: '',
        password: '',
        pin: '',
        url: '',
        notes: '',
        favorite: false
      });
    }
    setConfirmDelete(false);
    setError('');
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (field, text) => {
    copyToClipboard(text, field === 'password' || field === 'pin');
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQuickGenerate = () => {
    const generated = generatePassword({ length: 16 });
    setFormData((prev) => ({ ...prev, password: generated }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('กรุณาระบุชื่อรายการ');
      return;
    }

    try {
      setLoading(true);
      await saveVaultItem(formData);
      onClose();
    } catch (err) {
      setError('บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    try {
      setLoading(true);
      await deleteVaultItem(formData.id);
      onClose();
    } catch (err) {
      setError('ลบรายการไม่สำเร็จ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-surface-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">
              {isNew ? 'เพิ่มรหัสผ่านใหม่' : 'รายละเอียดรหัสผ่าน'}
            </h3>
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, favorite: !p.favorite }))}
              className="p-1 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
            >
              <Star className={`w-5 h-5 ${formData.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ชื่อรายการ (Title) *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น Facebook ส่วนตัว, Steam"
                required
                className="w-full bg-surface-850 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                หมวดหมู่ (Category)
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-surface-850 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {settings.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Username / Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>ชื่อผู้ใช้ / อีเมล / เบอร์โทร</span>
              </label>
              {formData.username && (
                <button
                  type="button"
                  onClick={() => handleCopy('username', formData.username)}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {copiedField === 'username' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'username' ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              )}
            </div>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="example@gmail.com หรือ username"
              className="w-full bg-surface-850 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>รหัสผ่าน (Password)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickGenerate}
                  className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <Dna className="w-3 h-3" />
                  <span>สุ่มรหัส</span>
                </button>
                {formData.password && (
                  <button
                    type="button"
                    onClick={() => handleCopy('password', formData.password)}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedField === 'password' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'password' ? 'คัดลอกแล้ว' : 'คัดลอก'}
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="รหัสผ่าน"
                className="w-full bg-surface-850 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* PIN (Card PIN or Game PIN) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>รหัส PIN บัตร / PIN เข้าแอป (ถ้ามี)</span>
              </label>
              {formData.pin && (
                <button
                  type="button"
                  onClick={() => handleCopy('pin', formData.pin)}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {copiedField === 'pin' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'pin' ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="เช่น 1234 หรือ 6 หลัก"
                className="w-full bg-surface-850 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Website URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>เว็บไซต์ / URL</span>
              </label>
              {formData.url && (
                <a
                  href={formData.url.startsWith('http') ? formData.url : `https://${formData.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  เปิดเว็บ
                </a>
              )}
            </div>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              className="w-full bg-surface-850 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>โน้ตลับเพิ่มเติม (คำถามกันลืม, เลขอ้างอิง)</span>
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="บันทึกข้อความลับ..."
              className="w-full bg-surface-850 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {!isNew ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 font-semibold">ยืนยันลบ?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    ลบเลย
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl transition-colors"
                  title="ลบรายการนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                ปิด
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-surface-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
