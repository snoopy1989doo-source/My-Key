import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { storageService } from '../services/storage';
import { firebaseService } from '../services/firebase';
import { isAndroid, NativeVault } from '../services/native';
export const Field = props => <input {...props} className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white" />;
export const Action = ({ children, ...props }) => <button {...props} className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">{children}</button>;
export function RestorePanel() {
  const { checkBackup, commitImport, isLocked } = useVault();
  const [text, setText] = useState(''), [password, setPassword] = useState(''), [mode, setMode] = useState('master');
  const [summary, setSummary] = useState(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const run = async fn => { setBusy(true); setMessage(''); try { await fn(); } catch(e) { setMessage(e.message); } finally { setBusy(false); } };
  return <section className="space-y-3 rounded-xl border border-slate-700 p-4">
    <h3 className="font-bold">ตรวจไฟล์สำรอง / กู้คืน</h3>
    <p className="text-xs text-slate-400">ทดลองถอดรหัสในเครื่องก่อน ข้อมูลเดิมจะไม่เปลี่ยนจนกดนำเข้า รองรับไฟล์รุ่นเดิมด้วย Master Password หรือ Recovery Key</p>
    <label className="block text-sm">เลือกไฟล์สำรอง JSON<input aria-label="เลือกไฟล์สำรอง" type="file" accept=".json,application/json" disabled={busy} className="block w-full mt-2" onChange={e => { const file = e.target.files?.[0]; setSummary(null); if (file) run(async () => { if(file.size > 12*1024*1024) throw new Error('ไฟล์ใหญ่เกิน 12 MB'); setText(await file.text()); }); }} /></label>
    <button className="text-xs underline" onClick={() => run(async () => { const previous=storageService.getRollback(); if(!previous) throw new Error('ยังไม่มีสำเนาก่อนนำเข้า'); setText(JSON.stringify(previous)); setSummary(null); setMessage('เลือกสำเนาก่อนนำเข้าแล้ว กรุณากรอกรหัสของสำเนานั้น'); })}>ใช้สำเนาก่อนนำเข้าครั้งล่าสุด</button>
    <select aria-label="รหัสที่ใช้ตรวจสำรอง" className="bg-surface-950 rounded-xl p-3 w-full" value={mode} onChange={e=>{setMode(e.target.value);setSummary(null);}}><option value="master">Master Password ของไฟล์</option><option value="recovery">Recovery Key ของไฟล์</option></select>
    <Field type="password" autoComplete="off" aria-label="รหัสผ่านไฟล์สำรอง" placeholder="รหัสผ่านของไฟล์สำรอง" value={password} onChange={e=>{setPassword(e.target.value);setSummary(null);}} />
    <Action disabled={!text || !password || busy} onClick={()=>run(async()=>{setSummary(null); const result=await checkBackup(text,password,mode,true);setSummary(result);setPassword('');setMessage('ทดลองกู้คืนผ่าน ข้อมูลเดิมยังไม่เปลี่ยน');})}>ทดลองกู้คืนโดยไม่เขียนทับ</Action>
    {summary && <div className="space-y-3"><p>พบ {summary.count} รายการ และ {summary.trash} รายการในถังขยะ</p><div className="flex flex-wrap gap-2">
      {!isLocked && <Action disabled={busy} onClick={()=>run(async()=>{await commitImport('merge');setSummary(null);setText('');setMessage('รวมรายการสำเร็จ');})}>รวมกับข้อมูลปัจจุบัน</Action>}
      <Action disabled={busy} onClick={()=>run(async()=>{if(!window.confirm('แทนที่ตู้เซฟปัจจุบันด้วยไฟล์นี้? จะเก็บสำเนาก่อนนำเข้าไว้ให้')) return; await commitImport('replace');setSummary(null);setText('');setMessage('นำเข้าสำเร็จ กรุณาปลดล็อกด้วยรหัสของไฟล์');})}>นำเข้าแทนที่ตู้เซฟ</Action>
    </div></div>}
    {message && <p role="status" className="text-sm text-amber-300 break-words">{message}</p>}
  </section>;
}
export function CloudPanel() {
  const { settings, updateSettings, triggerCloudSync, lastSynced, checkBackup, commitImport } = useVault();
  const [config,setConfig]=useState(JSON.stringify(settings.firebaseConfig || {},null,2)), [email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [master,setMaster]=useState(''),[account,setAccount]=useState(''),[download,setDownload]=useState(null),[checked,setChecked]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const run=async fn=>{setBusy(true);setMessage('');try{await fn();}catch(e){setMessage(e.message);}finally{setBusy(false);}};
  return <section className="space-y-3"><h3 className="font-bold">บัญชีสำรอง Cloud</h3><p className="text-xs text-slate-400">ใช้อีเมลบัญชีเดียวกันบนทุกเครื่อง รหัสบัญชี Cloud แยกจาก Master Password ต้องเปิด Email/Password และตั้ง Firestore rules ใน Firebase ก่อน</p>
    <details><summary>ตั้งค่า Firebase</summary><textarea aria-label="Firebase Config" className="w-full bg-surface-950 p-3 mt-2 text-xs" rows={6} value={config} onChange={e=>setConfig(e.target.value)} /><div className="flex gap-2"><Action disabled={busy} onClick={()=>run(async()=>{const parsed=JSON.parse(config);if(!parsed.apiKey||!parsed.projectId)throw new Error('Config ไม่ครบ');await updateSettings({firebaseConfig:parsed});setMessage('บันทึก config แล้ว กรุณาเข้าสู่ระบบ');})}>บันทึก Config</Action><Action disabled={busy} onClick={()=>run(async()=>{await updateSettings({firebaseConfig:null});setAccount('');setMessage('ปิด Cloud แล้ว');})}>ปิด Cloud</Action></div></details>
    <Field aria-label="อีเมล Cloud" type="email" placeholder="อีเมลบัญชี Cloud" value={email} onChange={e=>setEmail(e.target.value)} />
    <Field aria-label="รหัสบัญชี Cloud" type="password" placeholder="รหัสบัญชี Cloud (ไม่ใช่ Master Password)" value={password} onChange={e=>setPassword(e.target.value)} />
    <div className="flex flex-wrap gap-2"><Action disabled={busy} onClick={()=>run(async()=>{const user=await firebaseService.login(email,password);setAccount(user.email);setPassword('');setMessage('เข้าสู่ระบบแล้ว');})}>เข้าสู่ระบบ</Action><Action disabled={busy} onClick={()=>run(async()=>{if(password.length<12)throw new Error('ตั้งรหัสบัญชีอย่างน้อย 12 ตัวอักษร'); const user=await firebaseService.login(email,password,true);setAccount(user.email);setPassword('');setMessage('สร้าง/เชื่อมบัญชีแล้ว');})}>สร้าง / เชื่อมบัญชีเดิม</Action></div>
    <button className="text-xs underline" onClick={()=>run(async()=>{const user=await firebaseService.account();setAccount(user?.email||'');setMessage(user?.anonymous?'บัญชีเดิมเป็น anonymous กรุณาสร้าง/เชื่อมบัญชี':user?.email||'ยังไม่ได้เข้าสู่ระบบ');})}>ตรวจบัญชีที่เชื่อมต่อ</button>
    {account && <p className="text-sm break-all">บัญชี: {account} <button className="underline" onClick={()=>run(async()=>{await firebaseService.logout();setAccount('');setDownload(null);})}>ออกจากระบบ Cloud</button></p>}
    <p className="text-xs">ซิงก์สำเร็จในครั้งนี้: {lastSynced ? new Date(lastSynced).toLocaleString('th-TH') : 'ยังไม่มี'}</p>
    <div className="flex flex-wrap gap-2"><Action disabled={busy} onClick={()=>run(async()=>{await triggerCloudSync();setMessage('ซิงก์สำเร็จ');})}>ซิงก์ทันที</Action><Action disabled={busy} onClick={()=>run(async()=>{setDownload(await firebaseService.downloadVault());setChecked(null);setMessage('ดาวน์โหลดข้อมูลเข้ารหัสแล้ว กรุณาตรวจด้วย Master Password');})}>ดึงข้อมูลจาก Cloud</Action></div>
    {download && <div className="space-y-3"><Field type="password" aria-label="Master Password ของ Cloud" placeholder="Master Password ของข้อมูล Cloud" value={master} onChange={e=>{setMaster(e.target.value);setChecked(null);}} /><Action disabled={busy} onClick={()=>run(async()=>{setChecked(await checkBackup(JSON.stringify(download.envelope),master,'master',true));setMaster('');})}>ตรวจข้อมูล Cloud</Action>{checked&&<><p>{checked.count} รายการ พร้อมนำเข้า</p><Action disabled={busy} onClick={()=>run(async()=>{if(!window.confirm('แทนที่ด้วยข้อมูล Cloud ที่ตรวจแล้ว?'))return; await commitImport('replace');await firebaseService.acceptDownload(download);setDownload(null);setChecked(null);setMessage('กู้คืนแล้ว กรุณาปลดล็อก');})}>กู้คืนตู้เซฟจาก Cloud</Action></>}</div>}
    {message&&<p role="status" className="text-sm text-amber-300 break-words">{message}</p>}
  </section>;
}
export function DevicePanel() {
  const vault=useVault();const [master,setMaster]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[next,setNext]=useState(''),[recovery,setRecovery]=useState('');
  const run=async fn=>{setBusy(true);setMessage('');try{await fn();setMaster('');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
  return <section className="space-y-4"><p className="text-sm">ล็อกทันทีเมื่อสลับออกจากแอป และซ่อนภาพในหน้ารวมแอปล่าสุดบน Android</p>
    <label className="block text-sm">ล็อกเมื่อไม่ใช้งาน<select aria-label="เวลาล็อกอัตโนมัติ" className="w-full bg-surface-950 p-3 rounded-xl" value={vault.settings.autoLockMinutes} onChange={e=>run(()=>vault.updateSettings({autoLockMinutes:Number(e.target.value)}))}>{[1,2,5,10].map(n=><option key={n} value={n}>{n} นาที</option>)}</select></label>
    <Field type="password" autoComplete="off" aria-label="ยืนยัน Master Password" placeholder="Master Password ปัจจุบัน เพื่อยืนยันการเปลี่ยนความปลอดภัย" value={master} onChange={e=>setMaster(e.target.value)} />
    <h3 className="font-bold">สแกนนิ้ว / ไบโอเมตริก</h3><p className="text-xs text-slate-400">{isAndroid?'ต้องมีไบโอเมตริกที่ปลอดภัยและลงทะเบียนไว้ในเครื่อง Android 9 ขึ้นไป':'ใช้ได้ในแอป Android; เว็บใช้ Master Password'}</p>
    <p className="text-sm">{vault.biometrics.enrolled?'เปิดใช้งานแล้ว':'ยังไม่เปิดใช้งาน'}</p><div className="flex flex-wrap gap-2"><Action disabled={!isAndroid||!vault.biometrics.available||!master||busy} onClick={()=>run(async()=>{await vault.enableBiometrics(master);setMessage('เปิดสแกนนิ้วแล้ว และยกเลิก PIN แบบเดิมในเครื่องนี้');})}>เปิดสแกนนิ้ว</Action>{vault.biometrics.enrolled&&<Action disabled={busy} onClick={()=>run(()=>vault.disableBiometrics())}>ปิดสแกนนิ้ว</Action>}</div>
    {vault.hasLegacyPin&&<Action disabled={!master||busy} onClick={()=>run(async()=>{await vault.removeLegacyPin(master);setMessage('ยกเลิก PIN เดิมแล้ว');})}>ยกเลิก PIN เดิม ใช้ Master Password</Action>}
    <h3 className="font-bold">Autofill บน Android</h3><p className="text-xs text-slate-400">เลือกแอปเป้าหมายในรายละเอียดรหัสก่อน จากนั้นเลือก My Key เป็นบริการกรอกอัตโนมัติ ยืนยันสแกนนิ้วและเลือกรายการทุกครั้ง รุ่นนี้รองรับฟอร์มแอป Android โดยตรง ยังไม่กรอกหน้าเว็บในเบราว์เซอร์/WebView</p><Action disabled={!isAndroid||!vault.biometrics.enrolled||busy} onClick={()=>run(()=>NativeVault.openAutofillSettings())}>เลือก My Key เป็นบริการ Autofill</Action>
    <h3 className="font-bold">เปลี่ยน Master Password</h3><Field type="password" aria-label="Master Password ใหม่" placeholder="รหัสใหม่อย่างน้อย 12 ตัวอักษร" value={next} onChange={e=>setNext(e.target.value)} /><Action disabled={!master||next.length<12||busy} onClick={()=>run(async()=>{await vault.changeMasterPassword(next,master);setNext('');setMessage('เปลี่ยน Master Password แล้ว กรุณาสำรองไฟล์ใหม่');})}>บันทึก Master Password ใหม่</Action>
    <h3 className="font-bold">กุญแจฉุกเฉิน</h3><Action disabled={!master||busy} onClick={()=>run(async()=>{if(!window.confirm('สร้างกุญแจใหม่? กุญแจเดิมจะเปิดข้อมูลฉบับปัจจุบันไม่ได้'))return;setRecovery(await vault.rotateRecovery(master));})}>สร้าง Recovery Key ใหม่</Action>{recovery&&<div className="rounded-xl border border-amber-500 p-4"><p className="text-xs">จดกุญแจนี้ในที่ปลอดภัย แล้วสำรองไฟล์ใหม่</p><code className="block break-all select-all my-3">{recovery}</code><button onClick={()=>setRecovery('')}>บันทึกแล้ว / ซ่อนกุญแจ</button></div>}
    {message&&<p role="status" className="text-amber-300 text-sm">{message}</p>}
  </section>;
}
export default function SettingsModal({ isOpen, onClose, initialTab='security' }) {
  const vault=useVault();const [active,setActive]=useState(initialTab),[message,setMessage]=useState('');
  if(!isOpen)return null;
  return <div className="fixed inset-0 z-50 bg-black/80 p-3 flex items-center justify-center"><div role="dialog" aria-modal="true" aria-label="การตั้งค่า My Key" className="w-full max-w-xl max-h-[90dvh] flex flex-col bg-surface-900 border border-slate-700 rounded-2xl"><div className="p-4 flex justify-between"><h2 className="font-bold">การตั้งค่า My Key</h2><button aria-label="ปิดการตั้งค่า" onClick={onClose}>ปิด</button></div><div className="flex overflow-x-auto border-y border-slate-700">{[['security','ความปลอดภัย'],['backup','สำรอง / กู้คืน'],['cloud','Cloud'],['theme','ธีม']].map(([id,label])=><button key={id} className={`shrink-0 px-4 py-3 text-sm ${active===id?'text-emerald-400':'text-slate-400'}`} onClick={()=>setActive(id)}>{label}</button>)}</div><div className="p-4 overflow-y-auto space-y-4">
    {active==='security'&&<DevicePanel/>}{active==='cloud'&&<CloudPanel/>}{active==='backup'&&<><p className="text-sm">ส่งออกล่าสุด: {vault.backupStatus.exportedAt?new Date(vault.backupStatus.exportedAt).toLocaleString('th-TH'):'ยังไม่มี'} ({vault.backupStatus.count||0} รายการ)</p><p className="text-xs text-slate-400">บนเว็บเวลานี้หมายถึงเริ่มดาวน์โหลด กรุณาตรวจไฟล์ที่บันทึกจริง</p><p className="text-sm">ทดลองกู้คืนล่าสุด: {vault.backupStatus.testedAt?new Date(vault.backupStatus.testedAt).toLocaleString('th-TH'):'ยังไม่เคยตรวจ'}</p><Action onClick={async()=>{try{await vault.exportEncryptedBackup();setMessage('ส่งออกไฟล์สำรองแล้ว');}catch(e){setMessage(e.message);}}}>ดาวน์โหลดไฟล์สำรอง</Action>{message&&<p role="status">{message}</p>}<RestorePanel/></>}
    {active==='theme'&&<div className="flex flex-wrap gap-3">{['emerald','violet','blue','gold','rose'].map(theme=><Action key={theme} onClick={()=>vault.setTheme(theme).catch(e=>setMessage(e.message))}>{theme}</Action>)}</div>}
  </div></div></div>;
}
