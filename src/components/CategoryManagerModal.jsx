import React, { useState } from 'react';
import {
  X, Plus, Trash2, Edit2, Check, AlertCircle, Sparkles, FolderPlus,
  Gamepad2, Globe, Briefcase, CreditCard, ShoppingBag, Shield, Film,
  Smartphone, BookOpen, Key, Car, Utensils, Music, Zap, Home, Gem,
  Lightbulb, Plane, HeartPulse, Bot, Coins, Package
} from 'lucide-react';
import { useVault } from '../context/VaultContext';

// Available icons for categories
export const AVAILABLE_ICONS = [
  { id: 'Gamepad2', icon: Gamepad2, label: 'เกม' },
  { id: 'Globe', icon: Globe, label: 'เว็บ/โซเชียล' },
  { id: 'Briefcase', icon: Briefcase, label: 'งาน/อีเมล' },
  { id: 'CreditCard', icon: CreditCard, label: 'การเงิน/บัตร' },
  { id: 'ShoppingBag', icon: ShoppingBag, label: 'ช้อปปิ้ง' },
  { id: 'Shield', icon: Shield, label: 'ความปลอดภัย' },
  { id: 'Film', icon: Film, label: 'สตรีมมิ่ง/หนัง' },
  { id: 'Smartphone', icon: Smartphone, label: 'มือถือ/แอป' },
  { id: 'BookOpen', icon: BookOpen, label: 'การเรียน/หนังสือ' },
  { id: 'Key', icon: Key, label: 'กุญแจ/รหัส' },
  { id: 'Car', icon: Car, label: 'รถยนต์/เดินทาง' },
  { id: 'Utensils', icon: Utensils, label: 'อาหาร' },
  { id: 'Music', icon: Music, label: 'เพลง' },
  { id: 'Zap', icon: Zap, label: 'บริการ/บิล' },
  { id: 'Home', icon: Home, label: 'บ้าน' },
  { id: 'Gem', icon: Gem, label: 'ของมีค่า' },
  { id: 'Lightbulb', icon: Lightbulb, label: 'ไอเดีย' },
  { id: 'Plane', icon: Plane, label: 'ท่องเที่ยว' },
  { id: 'HeartPulse', icon: HeartPulse, label: 'สุขภาพ/ประกัน' },
  { id: 'Bot', icon: Bot, label: 'AI/บอท' },
  { id: 'Coins', icon: Coins, label: 'คริปโต/เหรียญ' },
  { id: 'Package', icon: Package, label: 'พัสดุ' }
];

export const AVAILABLE_COLORS = [
  { id: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40', label: 'ม่วง' },
  { id: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40', label: 'น้ำเงิน' },
  { id: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: 'เขียว' },
  { id: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', label: 'เหลือง' },
  { id: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/40', label: 'ชมพู' },
  { id: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', label: 'ฟ้า' },
  { id: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', label: 'แดงกุหลาบ' },
  { id: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40', label: 'ส้ม' }
];

export default function CategoryManagerModal({ isOpen, onClose }) {
  const { settings, updateSettings, vaultItems, saveVaultItem } = useVault();

  const [categories, setCategories] = useState(() => settings.categories || []);
  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Gamepad2');
  const [selectedColor, setSelectedColor] = useState('text-emerald-400');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Add new category
  const handleAddCategory = (e) => {
    e.preventDefault();
    setError('');

    const trimmed = newCatName.trim();
    if (!trimmed) {
      setError('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    // Check duplicate
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('มีหมวดหมู่ชื่อนี้อยู่แล้ว');
      return;
    }

    const newCategory = {
      id: `cat_${Date.now()}`,
      name: trimmed,
      icon: selectedIcon,
      color: selectedColor
    };

    const updated = [...categories, newCategory];
    setCategories(updated);
    updateSettings({ categories: updated });
    setNewCatName('');
  };

  // Start editing category
  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setDeleteConfirmId(null);
  };

  // Save edit
  const handleSaveEdit = (catId) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    const updated = categories.map(c => c.id === catId ? { ...c, name: trimmed } : c);
    setCategories(updated);
    updateSettings({ categories: updated });
    setEditingId(null);
  };

  // Delete category and reassign existing items to 'others'
  const handleDeleteCategory = async (catId) => {
    // If items belong to this category, reassign to 'others'
    const itemsToReassign = vaultItems.filter(item => item.category === catId);
    if (itemsToReassign.length > 0) {
      for (const item of itemsToReassign) {
        await saveVaultItem({ ...item, category: 'others' });
      }
    }

    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    updateSettings({ categories: updated });
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-surface-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">จัดการหมวดหมู่</h3>
              <p className="text-[11px] text-slate-400">เพิ่ม แก้ไข หรือลบหมวดหมู่รหัสผ่านของคุณ</p>
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

        {error && (
          <div className="mb-3 p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-y-auto space-y-5 flex-1 pr-1">
          {/* SECTION 1: ADD NEW CATEGORY FORM */}
          <form onSubmit={handleAddCategory} className="bg-surface-850 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>สร้างหมวดหมู่ใหม่</span>
            </h4>

            <div>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => { setNewCatName(e.target.value); setError(''); }}
                placeholder="ชื่อหมวดหมู่ เช่น คริปโต, สตรีมมิ่ง, การเรียน..."
                className="w-full bg-surface-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Icon Picker Grid */}
            <div>
              <span className="block text-[11px] text-slate-400 mb-1.5">เลือกไอคอน:</span>
              <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5 max-h-28 overflow-y-auto p-1 bg-surface-900 rounded-xl border border-slate-800">
                {AVAILABLE_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      title={item.label}
                      className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-surface-950 shadow-md shadow-emerald-950 scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-surface-800'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <span className="block text-[11px] text-slate-400 mb-1.5">เลือกโทนสี:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVAILABLE_COLORS.map((c) => {
                  const isSelected = selectedColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${c.bg} ${
                        isSelected ? 'border-white scale-125' : 'border-transparent hover:scale-110'
                      }`}
                      title={c.label}
                    />
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มหมวดหมู่นี้</span>
            </button>
          </form>

          {/* SECTION 2: EXISTING CATEGORIES LIST */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">
              หมวดหมู่ปัจจุบัน ({categories.length})
            </h4>

            <div className="space-y-1.5">
              {categories.map((cat) => {
                const iconObj = AVAILABLE_ICONS.find(i => i.id === cat.icon) || AVAILABLE_ICONS[0];
                const IconComp = iconObj.icon;
                const itemCount = vaultItems.filter(i => i.category === cat.id).length;
                const isEditing = editingId === cat.id;
                const isConfirmingDelete = deleteConfirmId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-850 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg bg-surface-900 border border-slate-700/60 flex items-center justify-center ${cat.color || 'text-emerald-400'} shrink-0`}>
                        <IconComp className="w-4 h-4" />
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 mr-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-surface-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white flex-1 focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.id)}
                            className="p-1 text-emerald-400 hover:bg-surface-800 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-surface-800 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="truncate">
                          <span className="font-semibold text-white truncate block">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {itemCount} รายการ
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-950/80 border border-red-500/40 p-1 rounded-lg">
                            <span className="text-[10px] text-red-300 px-1">ลบ?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                            >
                              ยืนยัน
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1 text-[10px] text-slate-400 hover:text-white"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
                              title="แก้ไขชื่อหมวดหมู่"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(cat.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-surface-800 rounded-lg transition-colors"
                              title="ลบหมวดหมู่นี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
