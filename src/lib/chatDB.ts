// IndexedDB cache for instant chat messages — PHI encrypted at rest
// Loads messages instantly on re-open, delta fetch only new ones

import { encryptPHI, decryptPHI } from '@/lib/crypto';

const DB_NAME = 'patient_chat_db';
const DB_VERSION = 1;
const STORE = 'messages';

// PHI fields in a chat message that must be encrypted
const PHI_FIELDS = ['content', 'file_name'] as const;

async function encryptMessage(msg: any): Promise<any> {
  const encrypted = { ...msg };
  for (const field of PHI_FIELDS) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = await encryptPHI(encrypted[field]);
    }
  }
  return encrypted;
}

async function decryptMessage(msg: any): Promise<any> {
  const decrypted = { ...msg };
  for (const field of PHI_FIELDS) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = await decryptPHI(decrypted[field]);
    }
  }
  return decrypted;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('session_id', 'session_id', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMessages(messages: any[]): Promise<void> {
  if (!messages.length) return;
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const encrypted = await Promise.all(messages.map(encryptMessage));
  encrypted.forEach(m => store.put(m));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMessages(sessionId: string): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const index = tx.objectStore(STORE).index('session_id');
    const req = index.getAll(sessionId);
    req.onsuccess = async () => {
      const sorted = (req.result ?? []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const decrypted = await Promise.all(sorted.map(decryptMessage));
      resolve(decrypted);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getLastMessageTime(sessionId: string): Promise<string | null> {
  const msgs = await getMessages(sessionId);
  if (!msgs.length) return null;
  return msgs[msgs.length - 1].created_at;
}

export async function appendMessage(msg: any): Promise<void> {
  await saveMessages([msg]);
}

export async function clearSession(sessionId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const index = tx.objectStore(STORE).index('session_id');
  const req = index.getAllKeys(sessionId);
  req.onsuccess = () => {
    req.result.forEach(key => tx.objectStore(STORE).delete(key));
  };
}
