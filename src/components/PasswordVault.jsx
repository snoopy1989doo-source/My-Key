import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, Eye, EyeOff, Folder, FolderHeart, FolderPlus, Globe, Plus, Star } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { AVAILABLE_ICONS } from './CategoryManagerModal';

const folderTones = [
  ['#22c55e', '#123b26'], ['#38bdf8', '#102f3d'], ['#f59e0b', '#3b2b10'],
  ['#a78bfa', '#2d2147'], ['#f472b6', '#401d31'], ['#2dd4bf', '#123b36']
];

export default function PasswordVault({ onSelectItem, onAddNew, onOpenCategoryManager }) {
  const vault = useVault();
  const [revealed, setRevealed] = useState({});
  const [copied, setCopied] = useState('');
  const passwords = vault.vaultItems.filter(item => item.type !== 'bank');
  const query = vault.searchQuery.trim().toLowerCase();
  const folderView = vault.activeCategory === 'all' && !query;
  const folders = [
    { id: 'favorites', name: 'รายการโปรด', icon: Star, count: passwords.filter(i => i.favorite).length, tone: ['#facc15', '#443810'] },
    ...vault.settings.categories.map((cat, index) => ({
      ...cat,
      icon: AVAILABLE_ICONS.find(icon => icon.id === cat.icon)?.icon || Folder,
      count: passwords.filter(item => item.category === cat.id).length,
      tone: folderTones[index % folderTones.length]
    }))
  ];
  const currentFolder = folders.find(folder => folder.id === vault.activeCategory);
  const items = passwords.filter(item => {
    if (query) return [item.title, item.username, item.notes, item.url].some(value => value?.toLowerCase().includes(query));
    if (vault.activeCategory === 'favorites') return item.favorite;
    return item.category === vault.activeCategory;
  }).sort((a, b) => Number(b.favorite) - Number(a.favorite) || new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const copy = async (item, field) => {
    if (!await vault.copyToClipboard(item[field], true)) return;
    const key = `${item.id}-${field}`; setCopied(key); setTimeout(() => setCopied(''), 2000);
  };

  return <main className="max-w-4xl mx-auto px-4 pt-6 pb-36 w-full">
    {folderView ? <>
      <div className="flex items-end justify-between gap-3 mb-5"><div><p className="mykey-eyebrow">PASSWORD COLLECTIONS</p><h1 className="mykey-page-title">โฟลเดอร์รหัสผ่าน</h1><p className="text-sm text-slate-400 mt-1">เลือกโฟลเดอร์เพื่อดูรหัสที่อยู่ข้างใน</p></div><button onClick={onOpenCategoryManager} className="mykey-header-action" title="จัดการโฟลเดอร์"><FolderPlus size={20}/></button></div>
      <div className="mykey-folder-grid">{folders.map((folder, index) => {
        const Icon = folder.icon || Globe; const tone = folder.tone || folderTones[index % folderTones.length];
        return <button key={folder.id} className="mykey-folder" style={{ '--folder-accent': tone[0], '--folder-dark': tone[1] }} onClick={() => vault.setActiveCategory(folder.id)}><span className="mykey-folder-tab"/><span className="mykey-folder-icon">{folder.id === 'favorites' ? <FolderHeart size={23}/> : <Icon size={23}/>}</span><span className="mykey-folder-count">{folder.count} รายการ</span><strong>{folder.name}</strong><small>{folder.count ? 'แตะเพื่อเปิดดู' : 'ยังไม่มีรหัสในโฟลเดอร์'}</small></button>;
      })}</div>
      {!passwords.length && <button onClick={onAddNew} className="mykey-mini-empty mt-5"><Plus size={18}/> เพิ่มรหัสผ่านแรก</button>}
    </> : <>
      <div className="flex items-center gap-3 mb-5"><button onClick={() => { vault.setActiveCategory('all'); vault.setSearchQuery(''); }} className="mykey-header-action" aria-label="กลับไปโฟลเดอร์"><ArrowLeft size={20}/></button><div className="min-w-0"><p className="mykey-eyebrow">{query ? 'SEARCH RESULTS' : 'PASSWORD FOLDER'}</p><h1 className="text-2xl font-bold truncate">{query ? `ผลการค้นหา “${vault.searchQuery}”` : currentFolder?.name || 'รหัสผ่าน'}</h1><p className="text-xs text-slate-400 mt-1">{items.length} รายการ</p></div></div>
      {vault.isStealthMode && <div className="mykey-privacy-banner">โหมดพรางหน้าจอเปิดอยู่ <button onClick={vault.toggleStealthMode}>ปิดโหมดพราง</button></div>}
      {!items.length ? <div className="mykey-empty"><span className="mykey-empty-icon"><Folder size={28}/></span><h2>{query ? 'ไม่พบรหัสที่ค้นหา' : 'โฟลเดอร์นี้ยังว่าง'}</h2><p>{query ? 'ลองใช้คำค้นหาอื่น' : 'เพิ่มรหัสผ่านใหม่ลงในโฟลเดอร์นี้ได้เลย'}</p>{!query && <button onClick={onAddNew} className="mykey-primary mt-5"><Plus size={18}/> เพิ่มรหัสผ่าน</button>}</div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{items.map(item => {
        const show = revealed[item.id] && !vault.isStealthMode;
        return <article key={item.id} className="mykey-password-card" onClick={() => onSelectItem(item)}>
          <div className="flex items-start gap-3"><span className="mykey-recent-icon"><Globe size={19}/></span><div className="min-w-0 flex-1"><h2 className={`font-bold truncate ${vault.isStealthMode ? 'blur-sm' : ''}`}>{item.title}</h2><p className={`text-xs text-slate-400 truncate ${vault.isStealthMode ? 'blur-sm' : ''}`}>{item.username || 'ไม่มีชื่อผู้ใช้'}</p></div><button className="mykey-icon-button" onClick={e => { e.stopPropagation(); vault.toggleFavorite(item.id).catch(err => vault.setError(err.message)); }} aria-label="รายการโปรด"><Star size={17} className={item.favorite ? 'fill-amber-400 text-amber-400' : ''}/></button></div>
          {item.password && <div className="mykey-secret-row"><code>{show ? item.password : '••••••••••••'}</code><button aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} onClick={e => { e.stopPropagation(); setRevealed(v => ({ ...v, [item.id]: !v[item.id] })); }}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button><button aria-label="คัดลอกรหัสผ่าน" onClick={e => { e.stopPropagation(); copy(item, 'password'); }}>{copied === `${item.id}-password` ? <Check size={17}/> : <Copy size={17}/>}</button></div>}
          {item.notes && <p className="text-xs text-slate-500 mt-3 truncate">{item.notes}</p>}
        </article>;
      })}</div>}
    </>}
  </main>;
}
