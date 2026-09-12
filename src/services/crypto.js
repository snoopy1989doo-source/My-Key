/**
 * Zero-Knowledge Cryptography Engine for "My Key"
 * Using Web Crypto API (AES-GCM-256 + PBKDF2-SHA256)
 */

// Helper: Convert ArrayBuffer to Base64
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Generate cryptographically secure random bytes
export function getRandomBytes(length = 16) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

// Helper: Generate Random Base64 Salt
export function generateSalt(length = 16) {
  return bufferToBase64(getRandomBytes(length));
}

// Helper: Generate Emergency Recovery Key (Format: MK-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX)
export function generateEmergencyKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid O, 0, 1, I for readability
  const segments = [];
  for (let s = 0; s < 6; s++) {
    let seg = '';
    const bytes = getRandomBytes(4);
    for (let i = 0; i < 4; i++) {
      seg += chars[bytes[i] % chars.length];
    }
    segments.push(seg);
  }
  return `MK-${segments.join('-')}`;
}

/**
 * Derive an AES-GCM-256 Key from a passphrase/password using PBKDF2
 * @param {string} passphrase - User's master password, PIN, or emergency key
 * @param {string} saltBase64 - Base64 encoded salt
 * @param {number} iterations - PBKDF2 iterations (default 120,000 for web smoothness & high security)
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(passphrase, saltBase64, iterations = 120000) {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);
  const saltBuffer = base64ToBuffer(saltBase64);

  // Import raw passphrase as a key
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM-256 key
  return await globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a JavaScript object or string using AES-GCM-256
 * @param {any} data - Data to encrypt
 * @param {CryptoKey} key - CryptoKey
 * @returns {Promise<{ciphertext: string, iv: string}>}
 */
export async function encryptData(data, key) {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);

  // 12-byte IV for AES-GCM
  const iv = getRandomBytes(12);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoded
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv)
  };
}

/**
 * Decrypt ciphertext using AES-GCM-256
 * @param {string} ciphertextBase64
 * @param {string} ivBase64
 * @param {CryptoKey} key
 * @returns {Promise<any>}
 */
export async function decryptData(ciphertextBase64, ivBase64, key) {
  try {
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
    const ivBuffer = base64ToBuffer(ivBase64);

    const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    const text = decoder.decode(decryptedBuffer);

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    throw new Error('รหัสผ่านไม่ถูกต้อง หรือข้อมูลเกิดความเสียหาย');
  }
}

/**
 * Generate a cryptographically strong random password
 */
export function generatePassword({ length = 18, useUpper = true, useLower = true, useNumbers = true, useSymbols = true } = {}) {
  const groups = [useUpper && 'ABCDEFGHJKLMNPQRSTUVWXYZ', useLower && 'abcdefghijkmnpqrstuvwxyz', useNumbers && '23456789', useSymbols && '!@#$%^&*()_+~|}{[]:;?><='].filter(Boolean);
  if (!groups.length) throw new Error('เลือกอักขระอย่างน้อยหนึ่งชนิด');
  if (!Number.isInteger(length) || length < groups.length || length > 128) throw new Error('ความยาวไม่ถูกต้อง');
  const pick = n => { const limit = 256 - (256 % n); let value; do { value = getRandomBytes(1)[0]; } while (value >= limit); return value % n; };
  const charset = groups.join('');
  const result = groups.map(group => group[pick(group.length)]);
  while (result.length < length) result.push(charset[pick(charset.length)]);
  for (let i=result.length-1; i>0; i--) { const j=pick(i+1); [result[i],result[j]]=[result[j],result[i]]; }
  return result.join('');
}
