import React, { useState } from 'react';
import { Building2, Plus, Search, Copy, Check, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const BANKS = [
  ['kbank', 'กสิกรไทย', '#16a34a'], ['scb', 'ไทยพาณิชย์', '#7c3aed'],
  ['ktb', 'กรุงไทย', '#0ea5e9'], ['bbl', 'กรุงเทพ', '#2563eb'],
  ['bay', 'กรุงศรีอยุธยา', '#eab308'], ['ttb', 'ทีทีบี', '#1d4ed8'],
  ['gsb', 'ออมสิน', '#db2777'], ['baac', 'ธ.ก.ส.', '#15803d'],
  ['ghb', 'อาคารสงเคราะห์', '#f97316'], ['uob', 'ยูโอบี', '#dc2626'],
  ['cimb', 'ซีไอเอ็มบี', '#b91c1c'], ['truemoney', 'TrueMoney', '#f97316'],
  ['other', 'ธนาคาร / e-Wallet อื่น ๆ', '#10b981']
];

export const ACCOUNT_TYPES = { savings: 'ออมทรัพย์', current: 'กระแสรายวัน', fixed: 'ฝากประจำ', other: 'อื่น ๆ' };
export const maskAccount = value => value ? `•••• ${value.replace(/\D/g, '').slice(-4)}` : '••••';

export default function BankAccounts({ onAdd, onSelect }) {
  const { vaultItems, searchQuery, setSearchQuery, copyToClipboard, isStealthMode } = useVault();
  const [revealed, setRevealed] = useState({});
  const [copied, setCopied] = useState('');
  const items = vaultItems.filter(i => i.type === 'bank').filter(i =>
    [i.bankName, i.accountName, i.accountNumber, i.title, i.branch].some(value => value?.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  ).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const copy = async item => {
    if (await copyToClipboard(item.accountNumber, true)) {
      setCopied(item.id);
      setTimeout(() => setCopied(''), 2000);
    }
  };
  return <section className="max-w-4xl mx-auto px-4 pt-6 pb-36">
    <div className="flex items-end justify-between gap-3 mb-5">
      <div><p className="mykey-eyebrow">MY KEY / ACCOUNTS</p><h1 className="mykey-page-title">บัญชีธนาคาร</h1><p className="text-slate-400 text-sm mt-1">เก็บเลขหน้าสมุดบัญชีและ e-Wallet ไว้ในตู้เซฟ</p></div>
      <button onClick={onAdd} className="mykey-primary hidden sm:inline-flex"><Plus size={18}/> เพิ่มบัญชี</button>
    </div>
    <div className="mykey-search mb-5"><Search size={18}/><input aria-label="ค้นหาบัญชีธนาคาร" placeholder="ค้นหาธนาคาร ชื่อ หรือเลขบัญชี" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/></div>
    {items.length === 0 ? <div className="mykey-empty"><span className="mykey-empty-icon"><Building2 size={30}/></span><h2>{searchQuery ? 'ไม่พบบัญชีที่ค้นหา' : 'ยังไม่มีบัญชีที่บันทึกไว้'}</h2><p>{searchQuery ? 'ลองค้นด้วยชื่อธนาคารหรือชื่อบัญชี' : 'เพิ่มเลขหน้าสมุดบัญชีเพื่อคัดลอกใช้งานได้สะดวก'}</p>{!searchQuery && <button onClick={onAdd} className="mykey-primary mt-5"><Plus size={18}/> เพิ่มบัญชีแรก</button>}</div> : <div className="grid gap-4 sm:grid-cols-2">{items.map(item => {
      const bank = BANKS.find(b => b[0] === item.bankId);
      const show = revealed[item.id] && !isStealthMode;
      return <article key={item.id} className="mykey-bank-card">
        <div className="mykey-bank-art" data-pattern={item.passbookPattern || 'waves'} style={{ '--bank-color': bank?.[2] || '#10b981' }}>
          <div className="flex items-center gap-3"><span className="mykey-bank-mark">{item.bankName?.slice(0, 1)}</span><div className="min-w-0"><p className="text-white font-bold truncate">{item.bankName}</p><p className="text-emerald-50/70 text-xs">{ACCOUNT_TYPES[item.accountType] || 'บัญชีธนาคาร'}</p></div></div>
          <div><p className="text-emerald-50/70 text-xs">ชื่อบัญชี</p><p className="text-white font-semibold truncate">{isStealthMode ? '••••••••' : item.accountName}</p></div>
        </div>
        <div className="p-4"><p className="text-xs text-slate-400">เลขที่บัญชี</p><div className="flex items-center gap-2 mt-1"><span className="font-mono text-lg tracking-wide text-white flex-1 truncate">{show ? item.accountNumber : maskAccount(item.accountNumber)}</span><button className="mykey-icon-button" aria-label={show ? 'ซ่อนเลขบัญชี' : 'แสดงเลขบัญชี'} onClick={() => setRevealed(v => ({ ...v, [item.id]: !v[item.id] }))}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button><button className="mykey-icon-button" aria-label="คัดลอกเลขบัญชี" onClick={() => copy(item)}>{copied === item.id ? <Check size={18}/> : <Copy size={18}/>}</button></div><button className="mykey-card-link" onClick={() => onSelect(item)}>ดูและแก้ไขรายละเอียด <ChevronRight size={16}/></button></div>
      </article>;
    })}</div>}
  </section>;
}
