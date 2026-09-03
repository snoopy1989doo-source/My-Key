import React from 'react';
import { Shield, Lock, Cloud, CloudOff, RefreshCw, Sliders, Dna, Search, Plus, Check } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export default function Header({ onOpenGenerator, onOpenSettings, onAddNew }) {
  const { lockVault, syncStatus, lastSynced, triggerCloudSync, settings, searchQuery, setSearchQuery } = useVault();

  const isFirebaseConfigured = !!settings.firebaseConfig;

  return (
    <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-slate-800/80 safe-top">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & App Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/50">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">My Key</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 rounded-md">
                  Zero-Knowledge
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Personal Password & Secret Vault</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Cloud Sync Status Button */}
            <button
              type="button"
              onClick={() => {
                if (isFirebaseConfigured) {
                  triggerCloudSync();
                } else {
                  onOpenSettings('cloud');
                }
              }}
              title={isFirebaseConfigured ? `ซิงก์ล่าสุด: ${lastSynced || 'เมื่อสักครู่'}` : 'คลิกเพื่อตั้งค่า Firebase Cloud Sync'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-400 hidden sm:inline">กำลังซิงก์...</span>
                </>
              ) : isFirebaseConfigured ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 hidden sm:inline">คลาวด์เชื่อมต่อแล้ว</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 hidden sm:inline">เชื่อมต่อคลาวด์</span>
                </>
              )}
            </button>

            {/* Password Generator Tool Button */}
            <button
              type="button"
              onClick={onOpenGenerator}
              title="สุ่มรหัสผ่านปลอดภัย"
              className="p-2 rounded-xl bg-surface-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <Dna className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => onOpenSettings()}
              title="การตั้งค่า"
              className="p-2 rounded-xl bg-surface-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Lock Vault Button */}
            <button
              type="button"
              onClick={lockVault}
              title="ล็อกตู้เซฟทันที"
              className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-950/60 text-red-400 text-xs font-semibold transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">ล็อก</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Add Button */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสผ่าน, บัญชี, หรือโน้ต..."
              className="w-full bg-surface-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 text-sm font-bold shadow-md shadow-emerald-950/50 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>เพิ่มรายการ</span>
          </button>
        </div>
      </div>
    </header>
  );
}
