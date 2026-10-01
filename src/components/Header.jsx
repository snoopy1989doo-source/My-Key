import React, { useState } from 'react';
import { Lock, Search, Menu, ShieldCheck } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export default function Header({ onOpenGenerator, onOpenSettings, onOpenPrint, onOpenTools, tab }) {
  const vault = useVault();
  const [menu, setMenu] = useState(false);
  const actions = [
    ['สุขภาพรหัส / ถังขยะ', onOpenTools],
    ['สำรอง / ทดลองกู้คืน', () => onOpenSettings('backup')],
    ['สแกนนิ้ว / Autofill', () => onOpenSettings('security')],
    ['บัญชี Cloud', () => onOpenSettings('cloud')],
    ['สุ่มรหัสผ่าน', onOpenGenerator],
    ['พิมพ์สมุดรหัสผ่าน', onOpenPrint],
    ['ธีมสี', () => onOpenSettings('theme')],
    ['พรางหน้าจอ', vault.toggleStealthMode]
  ];
  return <header className="mykey-header safe-top no-print"><div className="max-w-4xl mx-auto px-4 py-3"><div className="flex items-center gap-3"><img src="./logo.png" alt="" className="w-10 h-10 rounded-xl"/><div className="flex-1 min-w-0"><strong className="block text-lg leading-tight">My Key</strong><span className="text-[10px] tracking-[.13em] text-emerald-400 uppercase flex items-center gap-1"><ShieldCheck size={11}/> PRIVATE VAULT</span></div><button title="เครื่องมือและการตั้งค่า" aria-expanded={menu} onClick={() => setMenu(!menu)} className="mykey-header-action"><Menu size={20}/></button><button title="ล็อกตู้เซฟทันที" onClick={vault.lockVault} className="mykey-header-action"><Lock size={19}/></button></div>
  {menu && <nav aria-label="เครื่องมือตู้เซฟ" className="mykey-tools-menu">{actions.map(([name, fn]) => <button key={name} onClick={() => { setMenu(false); fn(); }}>{name}</button>)}</nav>}
  {tab === 'passwords' && <div className="mykey-search mt-4"><Search size={18}/><input aria-label="ค้นหารหัสผ่าน" placeholder="ค้นหารหัสผ่าน บัญชี หรือโน้ต" value={vault.searchQuery} onChange={e => vault.setSearchQuery(e.target.value)}/></div>}
  </div></header>;
}
