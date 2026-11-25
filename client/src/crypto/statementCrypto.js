/**
 * Universal Client-Side Encryption Module (Version 1)
 *
 * Specification:
 * - Algorithm: AES-256-GCM
 * - Key derivation: PBKDF2-HMAC-SHA256
 * - Key size: 256 bits
 * - Salt: Random 16 bytes
 * - Nonce (IV): Random 12 bytes
 * - Authentication tag: 16 bytes (128 bits)
 * - PBKDF2 iterations: 600,000
 *
 * Uses the Web Crypto API (supported natively in browsers and modern Node.js).
 * Master password and derived keys remain strictly in memory and are never persisted.
 */

const ENCRYPTION_VERSION = 1;
const ALGORITHM_NAME = 'AES-256-GCM';
const KDF_NAME = 'PBKDF2-HMAC-SHA256';
const PBKDF2_ITERATIONS = 600000;
const SALT_BYTE_LENGTH = 16;
const NONCE_BYTE_LENGTH = 12;
const TAG_BYTE_LENGTH = 16; // 128 bits

/**
 * Convert Uint8Array to standard Base64 string
 */
export function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert standard Base64 string to Uint8Array
 */
export function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Get the Web Crypto implementation (browser or Node.js)
 */
function getCrypto() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto;
  }
  throw new Error('Web Crypto API is not available in this environment.');
}

/**
 * Derive an AES-256-GCM key from a master password and salt using PBKDF2-HMAC-SHA256
 */
async function deriveKey(masterPassword, saltBytes, iterations = PBKDF2_ITERATIONS) {
  const cryptoObj = getCrypto();
  const enc = new TextEncoder();
  const passwordBytes = enc.encode(masterPassword);

  const baseKey = await cryptoObj.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext string with master password into an encrypted JSON envelope
 *
 * @param {string} plaintext - The plain text statement content
 * @param {string} masterPassword - The user's master password
 * @returns {Promise<Object>} The encrypted envelope
 */
export async function encryptStatement(plaintext, masterPassword) {
  if (!masterPassword || typeof masterPassword !== 'string') {
    throw new Error('A valid master password is required for encryption.');
  }
  if (typeof plaintext !== 'string') {
    throw new Error('Statement content must be a string.');
  }

  const cryptoObj = getCrypto();

  // Generate cryptographically secure random 16-byte salt and 12-byte nonce
  const salt = cryptoObj.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const nonce = cryptoObj.getRandomValues(new Uint8Array(NONCE_BYTE_LENGTH));

  // Derive AES-256 key
  const aesKey = await deriveKey(masterPassword, salt, PBKDF2_ITERATIONS);

  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(plaintext);

  // Encrypt with AES-GCM (128-bit tag length)
  const encryptedBuffer = await cryptoObj.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      tagLength: 128,
    },
    aesKey,
    plaintextBytes
  );

  // In Web Crypto API, the resulting buffer contains ciphertext + 16-byte tag
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const ciphertextLength = encryptedBytes.length - TAG_BYTE_LENGTH;
  const ciphertextBytes = encryptedBytes.slice(0, ciphertextLength);
  const tagBytes = encryptedBytes.slice(ciphertextLength);

  return {
    version: ENCRYPTION_VERSION,
    algorithm: ALGORITHM_NAME,
    kdf: KDF_NAME,
    iterations: PBKDF2_ITERATIONS,
    salt: uint8ArrayToBase64(salt),
    nonce: uint8ArrayToBase64(nonce),
    ciphertext: uint8ArrayToBase64(ciphertextBytes),
    tag: uint8ArrayToBase64(tagBytes),
  };
}

/**
 * Decrypt an encrypted envelope back to plaintext using the master password
 *
 * @param {Object} envelope - The encrypted envelope object
 * @param {string} masterPassword - The user's master password
 * @returns {Promise<string>} The decrypted plaintext string
 */
export async function decryptStatement(envelope, masterPassword) {
  if (!masterPassword || typeof masterPassword !== 'string') {
    throw new Error('Master password is required for decryption.');
  }
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('Invalid encrypted envelope: envelope must be an object.');
  }

  // Validate metadata strictly
  if (envelope.version !== ENCRYPTION_VERSION && envelope.version !== String(ENCRYPTION_VERSION)) {
    throw new Error(`Unsupported encryption version: ${envelope.version}`);
  }
  if (envelope.algorithm !== ALGORITHM_NAME) {
    throw new Error(`Unsupported encryption algorithm: ${envelope.algorithm}`);
  }
  if (envelope.kdf !== KDF_NAME) {
    throw new Error(`Unsupported key derivation function: ${envelope.kdf}`);
  }
  if (!envelope.iterations || envelope.iterations < 10000) {
    throw new Error(`Invalid iteration count: ${envelope.iterations}`);
  }
  if (!envelope.salt || !envelope.nonce || !envelope.ciphertext || !envelope.tag) {
    throw new Error('Envelope is missing required cryptographic components (salt, nonce, ciphertext, or tag).');
  }

  const cryptoObj = getCrypto();

  let salt, nonce, ciphertext, tag;
  try {
    salt = base64ToUint8Array(envelope.salt);
    nonce = base64ToUint8Array(envelope.nonce);
    ciphertext = base64ToUint8Array(envelope.ciphertext);
    tag = base64ToUint8Array(envelope.tag);
  } catch (err) {
    throw new Error(`Failed to decode base64 cryptographic parameters: ${err.message}`);
  }

  if (salt.length !== SALT_BYTE_LENGTH) {
    throw new Error(`Invalid salt length: expected ${SALT_BYTE_LENGTH} bytes, got ${salt.length}.`);
  }
  if (nonce.length !== NONCE_BYTE_LENGTH) {
    throw new Error(`Invalid nonce length: expected ${NONCE_BYTE_LENGTH} bytes, got ${nonce.length}.`);
  }
  if (tag.length !== TAG_BYTE_LENGTH) {
    throw new Error(`Invalid tag length: expected ${TAG_BYTE_LENGTH} bytes, got ${tag.length}.`);
  }

  // Combine ciphertext and authentication tag back into single buffer for Web Crypto
  const combinedBytes = new Uint8Array(ciphertext.length + tag.length);
  combinedBytes.set(ciphertext, 0);
  combinedBytes.set(tag, ciphertext.length);

  try {
    const aesKey = await deriveKey(masterPassword, salt, envelope.iterations);

    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        tagLength: 128,
      },
      aesKey,
      combinedBytes
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    // Web Crypto throws OperationError if password is wrong or tag verification fails
    throw new Error('Decryption failed: Incorrect master password or corrupted/tampered data.');
  }
}
