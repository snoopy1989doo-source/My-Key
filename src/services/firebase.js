/**
 * Firebase Cloud Sync Service for My Key
 * Only encrypted blobs (Ciphertext) and salt/meta are synced.
 * Plaintext passwords NEVER reach Firebase.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

let app = null;
let auth = null;
let db = null;
let currentUser = null;

export const firebaseService = {
  /**
   * Initialize or reconfigure Firebase with config object
   */
  init(config) {
    if (!config || !config.apiKey || !config.projectId) {
      return false;
    }

    try {
      if (getApps().length > 0) {
        app = getApp();
      } else {
        app = initializeApp(config);
      }

      auth = getAuth(app);
      db = getFirestore(app);

      // Listen for auth state
      onAuthStateChanged(auth, (user) => {
        currentUser = user;
      });

      // Auto sign-in anonymously if not signed in
      if (!auth.currentUser) {
        signInAnonymously(auth).catch((err) => {
          console.warn('Firebase anonymous sign-in error:', err);
        });
      }

      return true;
    } catch (error) {
      console.error('Firebase init failed:', error);
      return false;
    }
  },

  isConfigured() {
    return !!(app && db && auth);
  },

  async ensureAuth() {
    if (!auth) throw new Error('Firebase ยังไม่ได้ถูกตั้งค่า');
    if (currentUser) return currentUser;

    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          currentUser = user;
          resolve(user);
        } else {
          signInAnonymously(auth)
            .then((res) => {
              currentUser = res.user;
              resolve(res.user);
            })
            .catch(reject);
        }
      });
    });
  },

  /**
   * Sync encrypted vault to Firestore
   */
  async uploadVault(meta, encryptedData) {
    if (!this.isConfigured()) {
      return { success: false, message: 'Firebase ยังไม่ได้เชื่อมต่อ' };
    }

    try {
      const user = await this.ensureAuth();
      const vaultDocRef = doc(db, 'mykey_vaults', user.uid);

      await setDoc(vaultDocRef, {
        meta,
        vault: encryptedData,
        updatedAt: serverTimestamp(),
        deviceInfo: navigator.userAgent
      }, { merge: true });

      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Upload to Firebase failed:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Download encrypted vault from Firestore
   */
  async downloadVault() {
    if (!this.isConfigured()) {
      return { success: false, message: 'Firebase ยังไม่ได้เชื่อมต่อ' };
    }

    try {
      const user = await this.ensureAuth();
      const vaultDocRef = doc(db, 'mykey_vaults', user.uid);
      const snapshot = await getDoc(vaultDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          success: true,
          meta: data.meta,
          vault: data.vault,
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      } else {
        return { success: false, message: 'ไม่พบข้อมูล Vault บนคลาวด์' };
      }
    } catch (error) {
      console.error('Download from Firebase failed:', error);
      return { success: false, message: error.message };
    }
  }
};
