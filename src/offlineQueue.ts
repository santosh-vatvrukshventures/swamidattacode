/**
 * Offline Queue — IndexedDB-based mutation queue for offline-first PWA support.
 * Queues POST/PUT/DELETE API requests when offline and replays them when back online.
 */

const DB_NAME = 'swamidatta_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_requests';

export interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
}

type SyncListener = (event: { type: 'queued' | 'syncing' | 'synced' | 'error'; count: number; message?: string }) => void;

const listeners: Set<SyncListener> = new Set();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Add a failed mutation request to the offline queue */
export async function enqueueRequest(url: string, method: string, headers: Record<string, string>, body: string | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({ url, method, headers, body, timestamp: Date.now() } as QueuedRequest);
    tx.oncomplete = () => {
      getQueueCount().then(count => {
        notifyListeners({ type: 'queued', count, message: `Request queued for sync (${count} pending)` });
      });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/** Get count of pending requests */
export async function getQueueCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();
    countReq.onsuccess = () => resolve(countReq.result);
    countReq.onerror = () => reject(countReq.error);
  });
}

/** Get all pending requests */
async function getAllPending(): Promise<QueuedRequest[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getAll = store.getAll();
    getAll.onsuccess = () => resolve(getAll.result);
    getAll.onerror = () => reject(getAll.error);
  });
}

/** Remove a request from the queue after successful replay */
async function removeRequest(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Replay all queued requests in order */
export async function replayQueue(): Promise<{ success: number; failed: number }> {
  const pending = await getAllPending();
  if (pending.length === 0) return { success: 0, failed: 0 };

  notifyListeners({ type: 'syncing', count: pending.length, message: `Syncing ${pending.length} queued request(s)...` });

  let success = 0;
  let failed = 0;

  for (const req of pending) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });

      if (response.ok) {
        await removeRequest(req.id!);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  const remainingCount = await getQueueCount();
  notifyListeners({
    type: failed > 0 ? 'error' : 'synced',
    count: remainingCount,
    message: failed > 0
      ? `Synced ${success} request(s), ${failed} failed. Will retry later.`
      : `All ${success} queued request(s) synced successfully!`,
  });

  return { success, failed };
}

/** Enhanced fetch that queues mutations when offline */
export async function offlineFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();

  // GET requests — always try network, don't queue
  if (method === 'GET') {
    return fetch(url, options);
  }

  // Mutations (POST/PUT/DELETE) — try network, queue if offline
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    // Network error — queue the request
    const headers: Record<string, string> = {};
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((v, k) => { headers[k] = v; });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([k, v]) => { headers[k] = v; });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    await enqueueRequest(url, method, headers, options.body as string | null);

    // Return a fake successful response so the UI can continue
    return new Response(JSON.stringify({ success: true, mode: 'offline_queued' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Subscribe to sync status events */
export function onSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(event: { type: 'queued' | 'syncing' | 'synced' | 'error'; count: number; message?: string }) {
  listeners.forEach(fn => fn(event));
}

// Auto-replay when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(() => replayQueue(), 1500);
  });
}
