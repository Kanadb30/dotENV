/**
 * dotENV — End-to-End Encryption Utilities
 *
 * Uses Web Crypto API with PBKDF2 key derivation + AES-256-GCM encryption.
 * The master password never leaves the browser — only ciphertext is sent to the server.
 */

/** Convert an ArrayBuffer to a Base64 string */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Convert a Base64 string to an ArrayBuffer */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/** Generate a random 16-byte salt */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/** Generate a random 12-byte IV for AES-GCM */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Derive an AES-256-GCM key from a master password and salt using PBKDF2.
 * Uses 100,000 iterations of SHA-256.
 */
async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  // Encode the master password as UTF-8 bytes
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);

  // Import the password as a raw key for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive an AES-256-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Result of an encryption operation */
export interface EncryptedData {
  ciphertext: string; // Base64-encoded
  iv: string;         // Base64-encoded
  salt: string;       // Base64-encoded
}

/**
 * Encrypt a plaintext secret using AES-256-GCM with a master password.
 *
 * @param plaintext - The secret value to encrypt
 * @param masterPassword - The user's master password (never stored/transmitted)
 * @returns Encrypted data with ciphertext, IV, and salt (all Base64)
 */
export async function encrypt(plaintext: string, masterPassword: string): Promise<EncryptedData> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(masterPassword, salt);

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    plaintextBytes
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
    salt: bufferToBase64(salt.buffer as ArrayBuffer),
  };
}

/**
 * Decrypt an encrypted secret using the master password.
 *
 * @param ciphertext - Base64-encoded ciphertext
 * @param iv - Base64-encoded initialization vector
 * @param salt - Base64-encoded salt
 * @param masterPassword - The user's master password
 * @returns Decrypted plaintext string
 * @throws Error if the master password is incorrect
 */
export async function decrypt(
  ciphertext: string,
  iv: string,
  salt: string,
  masterPassword: string
): Promise<string> {
  const saltBuffer = new Uint8Array(base64ToBuffer(salt));
  const ivBuffer = new Uint8Array(base64ToBuffer(iv));
  const ciphertextBuffer = base64ToBuffer(ciphertext);

  const key = await deriveKey(masterPassword, saltBuffer);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer as unknown as BufferSource,
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error('Incorrect master password. Unable to decrypt.');
  }
}
