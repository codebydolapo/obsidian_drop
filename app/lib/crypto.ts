// End-to-end encryption for chats, using the browser's Web Crypto API.
//
// Each side creates a fresh ECDH key pair per chat and sends only the public key
// through the server during the handshake. Both derive the same AES-GCM key, so the
// server relays ciphertext it cannot read. The safety code lets people check in
// person that the server didn't swap keys.

const ECDH = { name: 'ECDH', namedCurve: 'P-256' } as const;
const HKDF_INFO = new TextEncoder().encode('obsidian-drop-chat-v1');

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
}

// Web Crypto only exists in secure contexts (https or localhost)
export const isCryptoAvailable = () => typeof window !== 'undefined' && !!window.crypto?.subtle;

const toBase64 = (buffer: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const fromBase64 = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

export async function generateKeyPair(): Promise<{ keyPair: CryptoKeyPair; publicKey: string }> {
  // Private key is not extractable; public keys always are
  const keyPair = await crypto.subtle.generateKey(ECDH, false, ['deriveBits']);
  const raw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  return { keyPair, publicKey: toBase64(raw) };
}

export async function deriveChatKey(privateKey: CryptoKey, peerPublicKey: string): Promise<CryptoKey> {
  const peerKey = await crypto.subtle.importKey('raw', fromBase64(peerPublicKey), ECDH, false, []);
  const sharedSecret = await crypto.subtle.deriveBits({ name: 'ECDH', public: peerKey }, privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: HKDF_INFO },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// The sender's public key is bound as additional data, so the server cannot
// relabel one side's message as coming from the other.
export async function encryptMessage(key: CryptoKey, text: string, senderPublicKey: string): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: fromBase64(senderPublicKey) },
    key,
    new TextEncoder().encode(text)
  );
  return { iv: toBase64(iv), ciphertext: toBase64(ciphertext) };
}

export async function decryptMessage(key: CryptoKey, payload: EncryptedPayload, senderPublicKey: string): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv), additionalData: fromBase64(senderPublicKey) },
    key,
    fromBase64(payload.ciphertext)
  );
  return new TextDecoder().decode(plaintext);
}

// 20-digit code from both public keys; identical on both devices unless keys were swapped
export async function safetyCode(publicKeyA: string, publicKeyB: string): Promise<string> {
  const combined = [publicKeyA, publicKeyB].sort().join('|');
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined)));
  const groups: string[] = [];
  for (let i = 0; i < 4; i++) {
    // 5 bytes (40 bits) per group, reduced to 5 digits
    let value = 0;
    for (let j = 0; j < 5; j++) value = value * 256 + hash[i * 5 + j];
    groups.push(String(value % 100000).padStart(5, '0'));
  }
  return groups.join(' ');
}
