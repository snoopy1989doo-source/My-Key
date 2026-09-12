import React,{useState} from 'react';
import {useVault} from '../context/VaultContext';
import {Action,Field,RestorePanel,CloudPanel} from './SettingsModal';
export default function UnlockScreen(){
 const v=useVault();const [mode,setMode]=useState('master'),[value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const run=async fn=>{setBusy(true);setError('');try{await fn();setValue('');}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <div className="min-h-screen flex items-center justify-center p-4"><div className="w-full max-w-lg bg-surface-900 p-5 rounded-3xl border border-slate-700 space-y-4"><img src="./logo.png" alt="My Key" className="w-20 h-20 rounded-2xl mx-auto"/><h1 className="text-xl text-center font-bold">ปลดล็อก My Key</h1>{(error||v.error)&&<p role="alert" className="text-amber-300">{error||v.error}</p>}
 {v.biometrics.enrolled&&<Action disabled={busy} onClick={()=>run(v.unlockBiometrics)}>ปลดล็อกด้วยสแกนนิ้ว</Action>}
 <div className="flex gap-3 flex-wrap text-sm">{[['master','Master Password'],['recovery','Recovery Key'],...(v.hasLegacyPin?[['pin','PIN เดิม']]:[]),['restore','นำเข้าไฟล์'],['cloud','กู้คืน Cloud']].map(([id,label])=><button key={id} className={mode===id?'text-emerald-400':''} onClick={()=>{setMode(id);setValue('');setError('');}}>{label}</button>)}</div>
 {mode==='restore'?<RestorePanel/>:mode==='cloud'?<CloudPanel/>:<form className="space-y-3" onSubmit={e=>{e.preventDefault();run(()=>mode==='master'?v.unlockWithMasterPassword(value):mode==='recovery'?v.unlockWithEmergencyKey(value):v.unlockWithPin(value));}}><Field type="password" aria-label="รหัสปลดล็อก" autoComplete="off" placeholder={mode==='master'?'กรอก Master Password':mode==='recovery'?'MK-XXXX-…':'PIN เดิม 4–6 หลัก'} inputMode={mode==='pin'?'numeric':'text'} value={value} onChange={e=>setValue(e.target.value)} required/><Action disabled={busy||!value}>{busy?'กำลังถอดรหัส…':'ปลดล็อกตู้เซฟ'}</Action>{mode==='pin'&&<p className="text-xs text-amber-300">PIN เดิมมีไว้ย้ายข้อมูล แนะนำเปลี่ยนไปใช้ Master Password หรือสแกนนิ้วในหน้าความปลอดภัย</p>}</form>}
 </div></div>;
}
