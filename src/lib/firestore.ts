import { getFirestore, doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Get Firestore instance from the existing app
function getDb() {
  const app = getApps()[0];
  if (!app) throw new Error('Firebase app not initialized');
  return getFirestore(app);
}

function getUserId(): string | null {
  const auth = getAuth();
  return auth.currentUser?.uid || null;
}

// Store names and their localStorage keys
const STORE_KEYS = [
  'scholify-courses',
  'scholify-attendance',
  'scholify-grades',
  'scholify-assignments',
  'scholify-settings',
  'scholify-holidays',
  'scholify-notes',
];

/**
 * Sync all local stores to Firestore (write-through)
 */
export async function syncToFirestore(): Promise<void> {
  const uid = getUserId();
  if (!uid) return;

  const db = getDb();

  for (const key of STORE_KEYS) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        await setDoc(doc(db, 'users', uid, 'stores', key), {
          data: data,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`Failed to sync ${key} to Firestore:`, err);
      }
    }
  }
}

/**
 * Pull all data from Firestore and hydrate local stores
 */
export async function pullFromFirestore(): Promise<boolean> {
  const uid = getUserId();
  if (!uid) return false;

  const db = getDb();
  let hydrated = false;

  for (const key of STORE_KEYS) {
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'stores', key));
      if (snap.exists()) {
        const { data } = snap.data();
        if (data && data !== localStorage.getItem(key)) {
          localStorage.setItem(key, data);
          hydrated = true;
        }
      }
    } catch (err) {
      console.warn(`Failed to pull ${key} from Firestore:`, err);
    }
  }

  return hydrated;
}

/**
 * Sync a single store to Firestore
 */
export async function syncStoreToFirestore(storeKey: string): Promise<void> {
  const uid = getUserId();
  if (!uid) return;

  const db = getDb();
  const data = localStorage.getItem(storeKey);
  if (!data) return;

  try {
    await setDoc(doc(db, 'users', uid, 'stores', storeKey), {
      data: data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`Failed to sync ${storeKey} to Firestore:`, err);
  }
}

/**
 * Set up localStorage listener for auto-sync
 * Every time a store changes, sync it to Firestore
 */
export function setupAutoSync(): () => void {
  const originalSetItem = localStorage.setItem.bind(localStorage);

  localStorage.setItem = (key: string, value: string) => {
    originalSetItem(key, value);

    // Only sync scholify stores
    if (STORE_KEYS.includes(key)) {
      // Debounce: wait 2 seconds before syncing to avoid rapid writes
      const debounceKey = `__sync_timeout_${key}`;
      const existing = (window as any)[debounceKey];
      if (existing) clearTimeout(existing);

      (window as any)[debounceKey] = setTimeout(() => {
        syncStoreToFirestore(key).catch(console.warn);
      }, 2000);
    }
  };

  // Return cleanup function
  return () => {
    localStorage.setItem = originalSetItem;
  };
}
