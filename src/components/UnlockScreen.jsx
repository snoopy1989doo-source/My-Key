import React, { useEffect, useRef, useState } from 'react';
import { Fingerprint, KeyRound, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Action, Field, RestorePanel, CloudPanel } from './SettingsModal';

export default function UnlockScreen() {
  const vault = useVault();
  const { biometrics, unlockBiometrics } = vault;
  const [mode, setMode] = useState(vault.hasLegacyPin ? 'pin' : 'master');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const autoAttempted = useRef(false);
  const run = async fn => { setBusy(true); setError(''); try { await fn(); setValue(''); } catch (err) { setError(err.message); } finally { setBusy(false); } };

  useEffect(() => {
    if (!biometrics.enrolled || autoAttempted.current) return;
    autoAttempted.current = true;
    setBusy(true); setError('');
    unlockBiometrics().catch(err => setError(err.message)).finally(() => setBusy(false));
  }, [biometrics.enrolled, unlockBiometrics]);

  const choose = next => { setMode(next); setValue(''); setError(''); };
  const submit = event => {
    event.preventDefault();
    run(() => mode === 'master' ? vault.unlockWithMasterPassword(value) : mode === 'recovery' ? vault.unlockWithEmergencyKey(value) : vault.unlockWithPin(value));
  };

  return <main className="mykey-unlock-page">
    <div className="mykey-unlock-orb orb-one"/><div className="mykey-unlock-orb orb-two"/>
    <section className="mykey-unlock-card">
      <div className="mykey-unlock-brand"><img src="./logo.png" alt="My Key"/><span><strong>My Key</strong><small><ShieldCheck size={12}/> ZERO-KNOWLEDGE VAULT</small></span></div>
      <div className="mykey-unlock-copy"><span className="mykey-unlock-spark"><Sparkles size={18}/></span><p className="mykey-eyebrow">WELCOME BACK</p><h1>ข้อมูลสำคัญ<br/>พร้อมเมื่อเป็นคุณ</h1><p>ยืนยันตัวตนเพื่อเปิดตู้เซฟที่เข้ารหัสในเครื่องนี้</p></div>

      {biometrics.enrolled && <button className="mykey-biometric-button" disabled={busy} onClick={() => run(unlockBiometrics)}><span><Fingerprint size={34}/></span><div><strong>{busy ? 'กำลังยืนยันตัวตน…' : 'แตะเพื่อสแกนอีกครั้ง'}</strong><small>ไบโอเมตริกเป็นวิธีหลัก</small></div></button>}
      {!biometrics.enrolled && <div className="mykey-biometric-unavailable"><Fingerprint size={25}/><div><strong>เปิดไบโอเมตริกได้หลังปลดล็อก</strong><small>ครั้งนี้ใช้ Master Password ก่อน</small></div></div>}
      {(error || vault.error) && <p role="alert" className="mykey-unlock-error">{error || vault.error}</p>}

      <div className="mykey-unlock-divider"><span>วิธีสำรอง</span></div>
      {vault.hasLegacyPin && <button onClick={() => choose('pin')} className={`mykey-unlock-option ${mode === 'pin' ? 'active' : ''}`}><span><LockKeyhole size={19}/></span><div><strong>ปลดล็อกด้วย PIN</strong><small>ทางเลือกที่ 2 · ตัวเลข 6 หลัก</small></div></button>}
      <button onClick={() => choose('master')} className={`mykey-unlock-option ${mode === 'master' ? 'active' : ''}`}><span><KeyRound size={19}/></span><div><strong>Master Password</strong><small>{vault.hasLegacyPin ? 'ใช้เมื่อไบโอเมตริกและ PIN ไม่พร้อม' : 'ใช้ปลดล็อกและตั้ง PIN สำรอง'}</small></div></button>

      {(mode === 'pin' || mode === 'master' || mode === 'recovery') && <form onSubmit={submit} className="space-y-3 mt-4"><Field type="password" aria-label="รหัสปลดล็อก" autoFocus autoComplete="off" placeholder={mode === 'pin' ? 'กรอก PIN 6 หลัก' : mode === 'recovery' ? 'MK-XXXX-…' : 'กรอก Master Password'} inputMode={mode === 'pin' ? 'numeric' : 'text'} value={value} onChange={e => setValue(mode === 'pin' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value)} required/><Action disabled={busy || !value}>{busy ? 'กำลังถอดรหัส…' : 'ปลดล็อกตู้เซฟ'}</Action></form>}

      <details className="mykey-recovery-options"><summary>กู้คืนหรือใช้วิธีอื่น</summary><div className="flex flex-wrap gap-3 py-3 text-xs"><button onClick={() => choose('recovery')}>Recovery Key</button><button onClick={() => choose('restore')}>นำเข้าไฟล์</button><button onClick={() => choose('cloud')}>กู้คืน Cloud</button></div>{mode === 'restore' ? <RestorePanel/> : mode === 'cloud' ? <CloudPanel/> : null}</details>
      <p className="mykey-unlock-foot"><LockKeyhole size={13}/> My Key ไม่ส่งรหัสผ่านจริงไปยังเซิร์ฟเวอร์</p>
    </section>
  </main>;
}
