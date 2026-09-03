import React, { useState, useRef, useEffect } from 'react';
import {
  Gamepad2, Globe, Briefcase, CreditCard, ShoppingBag, Shield, Star,
  Copy, Check, Eye, EyeOff, ExternalLink, Plus, Key, Lock, Hash,
  ChevronLeft, ChevronRight, Settings2, FolderPlus
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { AVAILABLE_ICONS } from './CategoryManagerModal';

// Fallback icon mapper
const ICON_MAP = {
  games: Gamepad2,
  social: Globe,
  work: Briefcase,
  finance: CreditCard,
  shopping: ShoppingBag,
  others: Shield
};

export default function VaultList({ onSelectItem, onAddNew, onOpenCategoryManager }) {
  const { vaultItems, activeCategory, setActiveCategory, searchQuery, toggleFavorite, copyToClipboard, settings } = useVault();

  const [copiedField, setCopiedField] = useState(null); // `${itemId}-${field}`
  const [revealedPasswords, setRevealedPasswords] = useState({}); // { [itemId]: boolean }

  // Scroll Container Ref for Category Bar
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Mouse Drag state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);

  // Check scroll positions
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [settings.categories]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -250 : 250;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  // Mouse wheel horizontal scroll handler
  const handleWheel = (e) => {
    if (scrollRef.current && e.deltaY !== 0) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollStartRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollRef.current.scrollLeft = scrollStartRef.current - walk;
    checkScroll();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCopy = (itemId, field, text) => {
    copyToClipboard(text, field === 'password' || field === 'pin');
    const key = `${itemId}-${field}`;
    setCopiedField(key);
    setTimeout(() => {
      setCopiedField((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const toggleReveal = (itemId, e) => {
    e.stopPropagation();
    setRevealedPasswords((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Icon resolver
  const getCategoryIcon = (catOrId) => {
    if (typeof catOrId === 'object') {
      if (catOrId.id === 'favorites') return Star;
      const found = AVAILABLE_ICONS.find(i => i.id === catOrId.icon);
      if (found) return found.icon;
      return ICON_MAP[catOrId.id] || Shield;
    }
    const catObj = settings.categories.find(c => c.id === catOrId);
    if (catObj) {
      const found = AVAILABLE_ICONS.find(i => i.id === catObj.icon);
      if (found) return found.icon;
    }
    return ICON_MAP[catOrId] || Shield;
  };

  // Filter items
  const filteredItems = vaultItems.filter((item) => {
    // Category filter
    if (activeCategory === 'favorites' && !item.favorite) return false;
    if (activeCategory !== 'all' && activeCategory !== 'favorites' && item.category !== activeCategory) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      return matchTitle || matchUser || matchNotes || matchUrl;
    }

    return true;
  });

  // Sort: Favorites first, then updated recently
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  const categories = [
    { id: 'all', name: 'ทั้งหมด', count: vaultItems.length },
    { id: 'favorites', name: 'รายการโปรด', count: vaultItems.filter(i => i.favorite).length, isFav: true },
    ...settings.categories.map(c => ({
      ...c,
      count: vaultItems.filter(i => i.category === c.id).length
    }))
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Category Pills Header with Smooth Left/Right Navigation */}
      <div className="relative mb-3 flex items-center gap-1.5">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-surface-900 border border-slate-700 hover:border-emerald-500/60 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all z-10 shrink-0"
            title="เลื่อนซ้าย"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth cursor-grab active:cursor-grabbing select-none flex-1"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const CatIcon = getCategoryIcon(cat);

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'bg-emerald-500 text-surface-950 font-bold shadow-md shadow-emerald-950/60 scale-[1.02]'
                    : 'bg-surface-900/90 text-slate-400 hover:text-slate-200 hover:bg-surface-800 border border-slate-800'
                }`}
              >
                {cat.isFav ? (
                  <Star className={`w-3.5 h-3.5 ${isActive ? 'text-surface-950 fill-surface-950' : 'text-amber-400 fill-amber-400'}`} />
                ) : (
                  <CatIcon className={`w-3.5 h-3.5 ${isActive ? 'text-surface-950' : (cat.color || 'text-slate-400')}`} />
                )}
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-surface-950/20 text-surface-950' : 'bg-surface-800 text-slate-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}

          {/* Manage Categories Button inside bar */}
          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 hover:border-purple-400 transition-colors shrink-0"
            title="เพิ่ม ลบ หรือแก้ไขหมวดหมู่"
          >
            <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
            <span>+ จัดการหมวดหมู่</span>
          </button>
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-surface-900 border border-slate-700 hover:border-emerald-500/60 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all z-10 shrink-0"
            title="เลื่อนขวา"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Items List */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-surface-900/40 border border-dashed border-slate-800 rounded-3xl mt-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-850 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            {searchQuery ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ยังไม่มีรหัสผ่านในหมวดหมู่นี้'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'ลองพิมพ์คำค้นหาใหม่อีกครั้ง' : 'เริ่มต้นบันทึกรหัสผ่าน เกม เฟซบุ๊ก อีเมล หรือรหัส PIN บัตรของคุณ'}
          </p>
          {!searchQuery && (
            <button
              onClick={onAddNew}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-surface-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรหัสแรก
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {sortedItems.map((item) => {
            const CatIcon = getCategoryIcon(item.category);
            const catObj = settings.categories.find(c => c.id === item.category);
            const isRevealed = !!revealedPasswords[item.id];
            const isUserCopied = copiedField === `${item.id}-username`;
            const isPassCopied = copiedField === `${item.id}-password`;
            const isPinCopied = copiedField === `${item.id}-pin`;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group bg-surface-850/80 hover:bg-surface-850 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 cursor-pointer relative"
              >
                {/* Top Row: Icon, Title, Favorite */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl bg-surface-900 border border-slate-700/60 flex items-center justify-center ${catObj?.color || 'text-emerald-400'} group-hover:border-emerald-500/40 transition-colors`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {catObj?.name || item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.url && (
                      <a
                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="เปิดเว็บไซต์"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-800 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          item.favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-2 text-xs">
                  {/* Username / Email */}
                  {item.username && (
                    <div className="flex items-center justify-between bg-surface-900/90 rounded-xl px-2.5 py-1.5 border border-slate-800/80">
                      <span className="text-slate-400 truncate max-w-[200px]" title={item.username}>
                        {item.username}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item.id, 'username', item.username);
                        }}
                        className="p-1 text-slate-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors shrink-0"
                        title="คัดลอกชื่อผู้ใช้"
                      >
                        {isUserCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Password */}
                  {item.password && (
                    <div className="flex items-center justify-between bg-surface-900/90 rounded-xl px-2.5 py-1.5 border border-slate-800/80">
                      <span className="font-mono text-slate-300 truncate max-w-[170px]">
                        {isRevealed ? item.password : '••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => toggleReveal(item.id, e)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
                          title={isRevealed ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item.id, 'password', item.password);
                          }}
                          className="p-1 text-slate-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
                          title="คัดลอกรหัสผ่าน"
                        >
                          {isPassCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PIN (Card PIN or App PIN) */}
                  {item.pin && (
                    <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-2.5 py-1 text-[11px]">
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        <span>PIN:</span>
                        <span className="font-mono">{isRevealed ? item.pin : '••••'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item.id, 'pin', item.pin);
                        }}
                        className="p-0.5 text-emerald-400 hover:text-white rounded transition-colors"
                        title="คัดลอก PIN"
                      >
                        {isPinCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes snippet if present */}
                {item.notes && (
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-1 italic">
                    {item.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
