import React, { useEffect, useState } from 'react';
import { X, Building2, Save, Trash2, Search } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { BANKS, ACCOUNT_TYPES, maskAccount } from './BankAccounts';

const blank = { type: 'bank', bankId: 'kbank', bankName: 'กสิกรไทย', accountNumber: '', accountName: '', accountType: 'savings', branch: '', promptPay: '', notes: '', passbookPattern: 'waves' };
const patterns = [['waves', 'เส้นคลื่น'], ['rings', 'วงแหวน'], ['grid', 'ตาราง'], ['plain', 'เรียบ']];

export default function BankAccountModal({ item, isOpen, onClose }) {
  const { saveVaultItem, deleteVaultItem } = useVault();
  const [form, setForm] = useState(blank);
  const [bankSearch, setBankSearch] = useState('');
  const [showBanks, setShowBanks] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { if (isOpen) { setForm(item ? { ...blank, ...item } : blank); setBankSearch(''); setShowBanks(false); setConfirmDelete(false); setError(''); } }, [item, isOpen]);
  if (!isOpen) return null;
  const set = (name, value) => setForm(v => ({ ...v, [name]: value }));
  const bankColor = BANKS.find(b => b[0] === form.bankId)?.[2] || '#10b981';
  const submit = async e => {
    e.preventDefault();
    if (!form.bankName.trim() || !form.accountName.trim() || !/^\d{6,20}$/.test(form.accountNumber.replace(/[\s-]/g, ''))) { setError('กรอกธนาคาร ชื่อบัญชี และเลขบัญชี 6–20 หลัก'); return; }
    setBusy(true); setError('');
    try { await saveVaultItem({ ...form, title: `${form.bankName.trim()} · ${form.accountName.trim()}` }); onClose(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const remove = async () => { setBusy(true); try { await deleteVaultItem(form.id); onClose(); } catch (err) { setError(err.message); setBusy(false); } };
  return <div className="mykey-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-labelledby="bank-modal-title" className="mykey-sheet">
    <div className="mykey-sheet-head"><div><p className="mykey-eyebrow">SECURE ACCOUNT</p><h2 id="bank-modal-title" className="text-xl font-bold">{item ? 'แก้ไขบัญชี' : 'เพิ่มบัญชีใหม่'}</h2></div><button aria-label="ปิด" onClick={onClose} className="mykey-icon-button"><X size={22}/></button></div>
    <form id="bank-form" onSubmit={submit} className="mykey-sheet-body">
      <div className="mykey-passbook" data-pattern={form.passbookPattern} style={{ '--bank-color': bankColor }}><div className="flex gap-3 items-center"><span className="mykey-bank-mark"><Building2 size={22}/></span><div><p className="font-bold">{form.bankName || 'ชื่อธนาคาร'}</p><p className="text-sm opacity-75">{ACCOUNT_TYPES[form.accountType]}</p></div></div><div><p className="text-xs opacity-70">ชื่อบัญชี / เลขที่บัญชี</p><p className="font-bold truncate">{form.accountName || 'ชื่อบัญชี'}</p><p className="font-mono tracking-wider">{maskAccount(form.accountNumber)}</p></div></div>
      <fieldset><legend className="mykey-label">ลายหน้าสมุด</legend><div className="mykey-pattern-row">{patterns.map(([id, label]) => <button type="button" key={id} aria-pressed={form.passbookPattern === id} onClick={() => set('passbookPattern', id)} className={`mykey-pattern ${form.passbookPattern === id ? 'selected' : ''}`} data-pattern={id} style={{ '--bank-color': bankColor }}><span>{label}</span></button>)}</div></fieldset>
      <div className="relative"><label className="mykey-label" htmlFor="bank-choice">ธนาคาร / e-Wallet *</label><button id="bank-choice" type="button" aria-expanded={showBanks} onClick={() => setShowBanks(v => !v)} className="mykey-field w-full text-left flex items-center gap-3"><span className="w-4 h-4 rounded-full" style={{ background: bankColor }}/>{form.bankName}<span className="ml-auto text-slate-400">⌄</span></button>{showBanks && <div className="mykey-bank-options"><div className="mykey-search m-2"><Search size={16}/><input autoFocus aria-label="ค้นหาธนาคาร" placeholder="ค้นหาธนาคาร" value={bankSearch} onChange={e => setBankSearch(e.target.value)}/></div><div className="max-h-56 overflow-y-auto">{BANKS.filter(b => b[1].toLowerCase().includes(bankSearch.toLowerCase())).map(b => <button type="button" key={b[0]} onClick={() => { setForm(v => ({ ...v, bankId: b[0], bankName: b[1] })); setShowBanks(false); }} className="mykey-bank-option"><span className="w-4 h-4 rounded-full" style={{ background: b[2] }}/>{b[1]}</button>)}</div></div>}</div>
      {form.bankId === 'other' && <label className="mykey-label">ชื่อธนาคาร / e-Wallet<input className="mykey-field" required value={form.bankName} onChange={e => set('bankName', e.target.value)}/></label>}
      <label className="mykey-label">เลขที่บัญชี *<input className="mykey-field font-mono" required inputMode="numeric" autoComplete="off" placeholder="123-4-56789-0" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} /></label>
      <label className="mykey-label">ชื่อบัญชี *<input className="mykey-field" required autoComplete="off" placeholder="ชื่อเจ้าของบัญชี" value={form.accountName} onChange={e => set('accountName', e.target.value)} /></label>
      <fieldset><legend className="mykey-label">ประเภทบัญชี</legend><div className="mykey-type-grid">{Object.entries(ACCOUNT_TYPES).map(([id, label]) => <button type="button" key={id} aria-pressed={form.accountType === id} onClick={() => set('accountType', id)} className={form.accountType === id ? 'selected' : ''}>{label}</button>)}</div></fieldset>
      <label className="mykey-label">พร้อมเพย์ (ถ้ามี)<input className="mykey-field" inputMode="numeric" autoComplete="off" placeholder="เบอร์มือถือหรือเลขที่ผูกพร้อมเพย์" value={form.promptPay} onChange={e => set('promptPay', e.target.value)}/></label>
      <label className="mykey-label">สาขา (ถ้ามี)<input className="mykey-field" value={form.branch} onChange={e => set('branch', e.target.value)}/></label>
      <label className="mykey-label">บันทึกช่วยจำ<textarea className="mykey-field min-h-24" value={form.notes} onChange={e => set('notes', e.target.value)}/></label>
      <p className="text-xs text-slate-500">ข้อมูลนี้เก็บในตู้เซฟที่เข้ารหัส ไม่เชื่อมต่อธนาคารและไม่ดึงยอดเงินจริง</p>
      {item && <div className="pt-3 border-t border-white/10">{confirmDelete ? <div className="flex gap-2 items-center"><span className="text-red-300 text-sm flex-1">ย้ายรายการนี้ไปถังขยะ?</span><button type="button" onClick={() => setConfirmDelete(false)} className="mykey-secondary">ยกเลิก</button><button type="button" disabled={busy} onClick={remove} className="mykey-danger">ยืนยันลบ</button></div> : <button type="button" onClick={() => setConfirmDelete(true)} className="text-red-300 text-sm flex items-center gap-2"><Trash2 size={16}/> ย้ายไปถังขยะ</button>}</div>}
      {error && <p role="alert" className="text-red-300 text-sm">{error}</p>}
    </form>
    <div className="mykey-sheet-foot"><button type="button" onClick={onClose} className="mykey-secondary">ยกเลิก</button><button form="bank-form" type="submit" disabled={busy} className="mykey-primary"><Save size={18}/>{busy ? 'กำลังบันทึก…' : 'บันทึกบัญชี'}</button></div>
  </div></div>;
}
