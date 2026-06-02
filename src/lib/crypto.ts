// AES-256-GCM field-level encryption for PHI data
// Uses Web Crypto API — no external dependencies

const KEY_MATERIAL = import.meta.env.VITE_PHI_ENCRYPTION_KEY || 'default-dev-key-32-chars-minimum!';

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const raw = encoder.encode(KEY_MATERIAL.padEnd(32, '0').slice(0, 32));
  const keyMaterial = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  return keyMaterial;
}

export async function encryptPHI(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;
  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    // Combine iv + ciphertext → base64
    const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.byteLength);
    return btoa(String.fromCharCode(...combined));
  } catch {
    return plaintext; // fallback: return as-is if encryption fails
  }
}

export async function decryptPHI(ciphertext: string): Promise<string> {
  if (!ciphertext) return ciphertext;
  try {
    const key = await getKey();
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch {
    return ciphertext; // fallback: return as-is (handles unencrypted legacy data)
  }
}

// Encrypt a plain JS object — encrypts only string leaf values
export async function encryptObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): Promise<T> {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      (result as any)[field] = await encryptPHI(result[field] as string);
    }
  }
  return result;
}

export async function decryptObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): Promise<T> {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      (result as any)[field] = await decryptPHI(result[field] as string);
    }
  }
  return result;
}
