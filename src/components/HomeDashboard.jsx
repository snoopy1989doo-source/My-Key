import React from 'react';
import { KeyRound, Building2, ArrowUpRight, ShieldCheck, Plus, ChevronRight } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { maskAccount } from './BankAccounts';

export default function HomeDashboard({ onNavigate, onAddPassword, onAddBank, onSelectPassword, onSelectBank }) {
  const { vaultItems, syncStatus, backupStatus } = useVault();
  const passwords = vaultItems.filter(i => i.type !== 'bank');
  const banks = vaultItems.filter(i => i.type === 'bank');
  const recent = list => [...list].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 2);
  return <main className="max-w-4xl mx-auto px-4 pt-7 pb-36 w-full">
    <p className="mykey-eyebrow">PRIVATE VAULT</p><h1 className="mykey-page-title mt-1">สวัสดี, ยินดีต้อนรับ</h1><p className="text-slate-400 text-sm mt-2">ข้อมูลสำคัญของคุณ อยู่ในที่เดียวอย่างปลอดภัย</p>
    <div className="mykey-hero"><span className="mykey-hero-icon"><ShieldCheck size={24}/></span><div><strong>ตู้เซฟพร้อมใช้งาน</strong><p>{syncStatus === 'synced' ? 'ซิงก์ Cloud สำเร็จ' : syncStatus === 'error' ? 'ควรตรวจสอบการซิงก์ Cloud' : 'ข้อมูลเข้ารหัสในเครื่อง'} · {backupStatus.exportedAt ? 'มีไฟล์สำรองแล้ว' : 'ยังไม่มีไฟล์สำรอง'}</p></div></div>
    <div className="grid grid-cols-2 gap-3 mt-5"><button className="mykey-stat" onClick={() => onNavigate('passwords')}><span className="mykey-stat-icon"><KeyRound size={20}/></span><ArrowUpRight size={17} className="text-slate-500"/><strong>{passwords.length}</strong><span>รหัสผ่าน</span></button><button className="mykey-stat" onClick={() => onNavigate('banks')}><span className="mykey-stat-icon"><Building2 size={20}/></span><ArrowUpRight size={17} className="text-slate-500"/><strong>{banks.length}</strong><span>บัญชีธนาคาร</span></button></div>
    <div className="mykey-section-title"><h2>รหัสผ่านล่าสุด</h2><button onClick={() => onNavigate('passwords')}>ดูทั้งหมด <ChevronRight size={17}/></button></div>
    {passwords.length ? <div className="space-y-2">{recent(passwords).map(i => <button key={i.id} className="mykey-recent" onClick={() => onSelectPassword(i)}><span className="mykey-recent-icon"><KeyRound size={19}/></span><span className="min-w-0 flex-1 text-left"><strong className="block truncate">{i.title}</strong><small className="text-slate-400 truncate block">{i.username || 'รหัสผ่านที่บันทึกไว้'}</small></span><ChevronRight size={18} className="text-slate-500"/></button>)}</div> : <button className="mykey-mini-empty" onClick={onAddPassword}><Plus size={18}/> เพิ่มรหัสผ่านแรก</button>}
    <div className="mykey-section-title"><h2>บัญชีธนาคารล่าสุด</h2><button onClick={() => onNavigate('banks')}>ดูทั้งหมด <ChevronRight size={17}/></button></div>
    {banks.length ? <div className="space-y-2">{recent(banks).map(i => <button key={i.id} className="mykey-recent" onClick={() => onSelectBank(i)}><span className="mykey-recent-icon bank"><Building2 size={19}/></span><span className="min-w-0 flex-1 text-left"><strong className="block truncate">{i.bankName}</strong><small className="text-slate-400 truncate block">{i.accountName} · {maskAccount(i.accountNumber)}</small></span><ChevronRight size={18} className="text-slate-500"/></button>)}</div> : <button className="mykey-mini-empty" onClick={onAddBank}><Plus size={18}/> เพิ่มบัญชีธนาคารแรก</button>}
  </main>;
}
