# 🛡️ My Key - Personal Password & Secret Vault

แอปพลิเคชันและเว็บแอปสำหรับจัดเก็บรหัสผ่าน บัญชี และข้อมูลลับส่วนตัว พัฒนาด้วย **React 19 + Vite + Tailwind CSS + Capacitor (Android)** พร้อมสถาปัตยกรรม **Zero-Knowledge Encryption (AES-GCM-256)** และระบบสำรองข้อมูล **Firebase Cloud Sync** ป้องกันข้อมูลสูญหายเมื่อมือถือพังหรือสูญหาย 100%

---

## 🌟 ฟีเจอร์หลัก (Key Features)

- 🔒 **Zero-Knowledge Encryption:**
  - เข้ารหัสและถอดรหัสในเครื่องของคุณเท่านั้นด้วย **AES-GCM 256-bit**
  - อนุพันธ์คีย์ด้วย **PBKDF2-SHA256 (120,000 rounds)**
  - รหัสผ่านจริงไม่มีวันถูกส่งออกไปนอกเครื่อง
- 📱 **รองรับทั้ง Web App และ Android Mobile App:**
  - รันบนคอมพิวเตอร์/เบราว์เซอร์ผ่าน Web
  - ติดตั้งเป็นแอป Android ด้วยไฟล์ `app-debug.apk`
- ⚡ **ระบบปลดล็อกในชีวิตประจำวัน (Quick PIN):**
  - เข้าแอปได้รวดเร็วด้วย **PIN 4-6 หลัก** (มีแป้นพิมพ์ตัวเลขสวยงามและพิมพ์แป้นจริงได้)
  - รองรับการปลดล็อกด้วย **Master Password** และ **Emergency Recovery Key**
- ☁️ **ป้องกันมือถือหาย (Firebase Cloud Sync):**
  - ซิงก์ก้อนข้อมูลเข้ารหัส (Ciphertext) ไปยัง **Firebase Firestore**
  - เมื่อเปลี่ยนเครื่องหรือมือถือหาย แค่ล็อกอินแล้วใส่ Master Password ข้อมูลจะกลับมาทันที
- 🗂️ **หมวดหมู่ครอบคลุมทุกการใช้งาน:**
  - 🎮 **เกม (Games):** Steam, Epic, Riot, บัญชีเกมมือถือ
  - 🌐 **โซเชียลมีเดีย (Social):** Facebook, IG, TikTok, X (Twitter), Discord
  - 💼 **งาน & อีเมล (Work & Email):** Gmail, Outlook, บัญชีบริษัท
  - 💳 **การเงิน & ธนาคาร (Finance):** บัญชีธนาคาร, บัตรเครดิต, PayPal, Crypto
  - 🛍️ **ช้อปปิ้ง (Shopping):** Shopee, Lazada, Amazon
  - 🔒 **อื่นๆ & โน้ตลับ (Others):** รหัส Wi-Fi, โน้ตลับ, เลขบัตร
- 🔢 **ช่องเก็บ PIN พิเศษ:** เก็บ PIN บัตร ATM, รหัสเข้าแอปธนาคาร หรือรหัสเกม
- 🧬 **ตัวสุ่มรหัสผ่านปลอดภัย (Password Generator):** ปรับความยาวและสัญลักษณ์ได้ตามต้องการ
- 📋 **ระบบความปลอดภัยของคลิปบอร์ด (Clipboard Auto-Wipe):** ล้างข้อมูลรหัสผ่านในคลิปบอร์ดอัตโนมัติหลังคัดลอก (15, 30 หรือ 60 วินาที)
- 💾 **ส่งออก/นำเข้าไฟล์สำรอง (Encrypted Backup):** ดาวน์โหลดไฟล์ `.json` เก็บไว้ใน Flash Drive หรือส่งเข้าอีเมลสำรอง

---

## 🚀 วิธีการใช้งานและการติดตั้ง

### 1. รันบน Web Browser (Desktop / Mobile Browser)

```bash
cd "d:\Snoopy\WEB APP\My Key"
npm run dev
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

---

### 2. ติดตั้งแอปบนมือถือ Android (.apk)

ไฟล์ติดตั้ง APK ถูกบิลด์ไว้ให้เรียบร้อยแล้วที่:
👉 `d:\Snoopy\WEB APP\My Key\app-debug.apk`

**วิธีนำไปลงมือถือ:**
1. ส่งไฟล์ `app-debug.apk` ไปที่มือถือ (ผ่านสาย USB, Google Drive, LINE หรือ Telegram)
2. แตะไฟล์ `.apk` บนมือถือเพื่อกดติดตั้ง (หากมือถือถาม ให้อนุญาต "ติดตั้งจากแหล่งที่ไม่รู้จัก")
3. เปิดแอป **My Key** แล้วเริ่มใช้งานได้ทันที!

**หากแก้ไขโค้ดแล้วต้องการบิลด์ APK ใหม่:**
```bash
npm run build:apk
```

---

## ☁️ วิธีเชื่อมต่อ Firebase Cloud Sync (สำรองข้อมูลขึ้นคลาวด์)

1. เข้าไปที่ [Firebase Console](https://console.firebase.google.com/)
2. สร้างโปรเจกต์ใหม่ (เช่น `my-key-vault`) หรือใช้โปรเจกต์เดิมที่มีอยู่
3. ไปที่เมนู **Build** $\rightarrow$ **Firestore Database** $\rightarrow$ กด **Create database** (เลือก Start in production mode หรือ test mode)
4. ไปที่ **Project Settings** (ไอคอนฟันเฟือง) $\rightarrow$ แท็บ **General**
5. เลื่อนลงมาที่หัวข้อ **Your apps** $\rightarrow$ กดไอคอนเว็บ `</>` $\rightarrow$ ตั้งชื่อแล้วกด Register
6. เลือกดูโค้ดแบบ **Config** จะเห็น JSON หน้าตาประมาณนี้:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "my-key-vault.firebaseapp.com",
     "projectId": "my-key-vault",
     "storageBucket": "my-key-vault.appspot.com",
     "messagingSenderId": "...",
     "appId": "..."
   }
   ```
7. เปิดแอป **My Key** $\rightarrow$ กดไอคอน **Settings** (มุมขวาบน) $\rightarrow$ แท็บ **Firebase Sync** $\rightarrow$ วางโค้ด JSON ลงในช่องแล้วกด **บันทึกการตั้งค่า Firebase**
8. ระบบจะเริ่มซิงก์ข้อมูลเข้ารหัสให้อัตโนมัติทันที

---

## 🔑 แผนสำรองกรณีฉุกเฉิน (Disaster Recovery Plan)

1. **เมื่อเปิดใช้งานครั้งแรก:** แอปจะแสดง **Emergency Recovery Key (รูปแบบ `MK-XXXX-...`)** ให้คุณกดดาวน์โหลด **Emergency Sheet (.txt)** หรือจดเก็บไว้ในที่ปลอดภัยที่บ้าน
2. **หากลืม Master Password หรือลืม PIN:** สามารถกดปุ่ม **"กู้คืนด้วย Recovery Key"** ในหน้าปลดล็อก เพื่อนำกุญแจฉุกเฉินมาปลดล็อกได้ทันที
3. **หากมือถือหาย:**
   - โหลดไฟล์ `app-debug.apk` ลงเครื่องใหม่ หรือเปิดผ่าน Web Browser บนคอมพิวเตอร์
   - ใส่การตั้งค่า Firebase เดิม หรือกด **"นำเข้าไฟล์สำรอง (.json)"**
   - ใส่ Master Password หรือ Emergency Recovery Key ข้อมูลทั้งหมดจะกลับมาเหมือนเดิม 100%
