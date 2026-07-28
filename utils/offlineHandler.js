// utils/offlineHandler.js — Offline detection & sync
// Manages network state, queues actions when offline, and syncs when back online.
// Uses localStorage for persistence, with retry and conflict-handling strategies.

import { showToast } from './helpers.js';
import { logInfo, logWarn, logError } from './logger.js';

// ============================================================================
// Constants
// ============================================================================

const OFFLINE_QUEUE_KEY = 'rujak_offline_queue';
const SYNC_RETRY_KEY = 'rujak_sync_retry_count';

// Default configuration
const DEFAULT_CONFIG = {
  bannerId: 'offlineBanner',
  bannerClass: 'offline-banner',
  onlineClass: 'is-online',
  offlineClass: 'is-offline',
  maxRetries: 3,
  retryDelay: 2000, // ms
  autoSync: true,
};

// ============================================================================
// State
// ============================================================================

let config = { ...DEFAULT_CONFIG };
let syncCallback = null; // Function to call for processing each queued action
let isProcessing = false;

// ============================================================================
// Helper: get queue from localStorage
// ============================================================================

function getQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ============================================================================
// Helper: save queue to localStorage
// ============================================================================

function saveQueue(queue) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    logError('offline', error, { action: 'saveQueue' });
  }
}

// ============================================================================
// Helper: get retry count for a specific item (by timestamp)
// ============================================================================

function getRetryCount(timestamp) {
  try {
    const map = JSON.parse(localStorage.getItem(SYNC_RETRY_KEY) || '{}');
    return map[timestamp] || 0;
  } catch {
    return 0;
  }
}

function setRetryCount(timestamp, count) {
  try {
    const map = JSON.parse(localStorage.getItem(SYNC_RETRY_KEY) || '{}');
    if (count <= 0) {
      delete map[timestamp];
    } else {
      map[timestamp] = count;
    }
    localStorage.setItem(SYNC_RETRY_KEY, JSON.stringify(map));
  } catch {
    // silent fail
  }
}

// ============================================================================
// Helper: create offline banner element
// ============================================================================

function createBanner() {
  const existing = document.getElementById(config.bannerId);
  if (existing) return existing;

  const banner = document.createElement('div');
  banner.id = config.bannerId;
  banner.className = config.bannerClass;
  banner.setAttribute('role', 'status');
  banner.innerHTML = `
    <span class="offline-dot"></span>
    <span>Koneksi terputus. Data disimpan secara lokal.</span>
  `;
  document.body.appendChild(banner);
  return banner;
}

function updateBannerVisibility(banner, isOffline) {
  if (banner) {
    banner.style.display = isOffline ? 'block' : 'none';
  }
}

// ============================================================================
// Core: process one offline action with retries
// ============================================================================

/**
 * Processes a single queued action. If syncCallback is provided, it is called
 * with the action object. The function returns a promise that resolves to
 * true if successfully processed, false if it should be retried later,
 * or throws if it's a permanent failure.
 */
async function processAction(action, index, queue) {
  if (!syncCallback) {
    // No sync callback provided, just log and skip
    logWarn('offline', 'No sync callback registered; skipping action', { action });
    return true; // treat as success to remove from queue
  }

  const { action: actionData, timestamp } = action;
  const retryCount = getRetryCount(timestamp);

  try {
    // Call the user-provided sync function
    const result = await syncCallback(actionData, { timestamp, retryCount });

    // If callback returns false or throws, we treat as failure
    if (result === false) {
      // Indicate a temporary failure, we might retry later
      return false;
    }

    // Success – clear retry count
    setRetryCount(timestamp, 0);
    return true;
  } catch (error) {
    // Determine if this error is retryable (e.g., network errors)
    const isRetryable = error?.retryable !== false; // default true
    if (isRetryable && retryCount < config.maxRetries) {
      const newCount = retryCount + 1;
      setRetryCount(timestamp, newCount);
      logWarn('offline', `Retry ${newCount}/${config.maxRetries} for action`, {
        action: actionData,
        error: error.message,
        timestamp,
      });
      return false; // will be retried
    } else {
      // Permanent failure – log error and remove from queue
      logError('offline', error, { action: actionData, timestamp, retryCount });
      setRetryCount(timestamp, 0);
      // We return true to remove from queue, but it's a permanent failure
      return true;
    }
  }
}

// ============================================================================
// Core: process entire offline queue
// ============================================================================

/**
 * Processes all queued offline actions in order.
 * Actions that succeed are removed; actions that fail temporarily are kept for later.
 * If an action fails permanently, it is removed but logged as an error.
 */
export async function processOfflineQueue() {
  if (isProcessing) {
    logInfo('offline', 'Sync already in progress, skipping duplicate call');
    return;
  }

  if (!syncCallback) {
    logWarn('offline', 'No sync callback registered; queue will not be processed');
    return;
  }

  const queue = getQueue();
  if (queue.length === 0) {
    logInfo('offline', 'Queue is empty, nothing to sync');
    return;
  }

  isProcessing = true;
  logInfo('offline', `Starting sync of ${queue.length} offline actions`);

  try {
    // Process items sequentially to respect order
    const remaining = [];
    for (let i = 0; i < queue.length; i++) {
      const action = queue[i];
      const success = await processAction(action, i, queue);
      if (!success) {
        // Keep this action for later
        remaining.push(action);
      }
    }

    // Save the updated queue (only items that need retry)
    saveQueue(remaining);

    if (remaining.length > 0) {
      logWarn('offline', `${remaining.length} actions remain in queue for retry`);
      // Schedule another retry after a delay if there are remaining items
      if (config.autoSync) {
        setTimeout(() => {
          processOfflineQueue(); // retry later
        }, config.retryDelay);
      }
    } else {
      logInfo('offline', 'All offline actions successfully synced');
      // Clear retry counters for all items
      localStorage.removeItem(SYNC_RETRY_KEY);
    }
  } catch (error) {
    logError('offline', error, { action: 'processOfflineQueue' });
  } finally {
    isProcessing = false;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initializes the offline handler: creates banner, sets up event listeners,
 * and starts listening for network changes.
 *
 * @param {object} options - Configuration options.
 * @param {string} [options.bannerId='offlineBanner'] - ID for the offline banner.
 * @param {string} [options.bannerClass='offline-banner'] - CSS class for the banner.
 * @param {string} [options.onlineClass='is-online'] - Class added to body when online.
 * @param {string} [options.offlineClass='is-offline'] - Class added to body when offline.
 * @param {number} [options.maxRetries=3] - Maximum retry attempts per action.
 * @param {number} [options.retryDelay=2000] - Delay (ms) between sync attempts.
 * @param {boolean} [options.autoSync=true] - Automatically trigger sync when online.
 * @param {Function} [options.syncCallback] - Function called for each queued action.
 *   Receives `action` and an object `{ timestamp, retryCount }`.
 *   Should return a Promise that resolves to `true` on success, `false` to retry,
 *   or throw an error. If it throws with `{ retryable: false }`, the action is
 *   considered permanently failed and removed.
 */
export function initOfflineHandler(options = {}) {
  // Merge options
  config = { ...DEFAULT_CONFIG, ...options };
  if (options.syncCallback) {
    syncCallback = options.syncCallback;
  }

  // Create banner
  const banner = createBanner();

  // Update body classes and banner based on initial online status
  const isOffline = !navigator.onLine;
  if (isOffline) {
    document.body.classList.add(config.offlineClass);
    document.body.classList.remove(config.onlineClass);
    updateBannerVisibility(banner, true);
  } else {
    document.body.classList.add(config.onlineClass);
    document.body.classList.remove(config.offlineClass);
    updateBannerVisibility(banner, false);
    // If online initially, process any pending queue
    if (config.autoSync && syncCallback) {
      processOfflineQueue();
    }
  }

  // Event listeners
  const handleOffline = () => {
    document.body.classList.add(config.offlineClass);
    document.body.classList.remove(config.onlineClass);
    updateBannerVisibility(banner, true);
    showToast('Koneksi terputus. Data disimpan secara lokal.', 'warning');
    logInfo('network', 'User went offline');
  };

  const handleOnline = () => {
    document.body.classList.add(config.onlineClass);
    document.body.classList.remove(config.offlineClass);
    updateBannerVisibility(banner, false);
    showToast('Koneksi kembali. Sinkronisasi data...', 'success');
    logInfo('network', 'User came back online');
    if (config.autoSync && syncCallback) {
      processOfflineQueue();
    }
  };

  // Remove any existing listeners to avoid duplicates
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);

  // Store cleanup reference if needed
  window.__offlineHandlerCleanup = () => {
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * Queues an action to be performed when online.
 * The action should be an object that can be serialized and later processed
 * by the sync callback.
 *
 * @param {object} action - The action data (e.g., { type: 'addCart', productId: '...' }).
 */
export function queueOfflineAction(action) {
  const queue = getQueue();
  queue.push({
    action,
    timestamp: new Date().toISOString(),
  });
  saveQueue(queue);
  logInfo('offline', 'Action queued', { action });

  // If we are currently offline, show a toast notification
  if (!navigator.onLine) {
    showToast('Aksi disimpan lokal. Akan dikirim saat koneksi kembali.', 'info');
  } else {
    // If online, we could optionally process immediately, but we leave it to the sync flow.
    // Usually, we process automatically when online, but we can also trigger sync now.
    if (syncCallback && config.autoSync) {
      processOfflineQueue();
    }
  }
}

/**
 * Checks if the device is currently online.
 * @returns {boolean} true if online, false otherwise.
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Manually triggers the sync process for the offline queue.
 * Useful for forcing a sync (e.g., after a user action).
 */
export function syncOfflineQueue() {
  if (syncCallback) {
    processOfflineQueue();
  } else {
    logWarn('offline', 'Cannot sync: no sync callback registered');
  }
}

/**
 * Clears the entire offline queue (use with caution).
 */
export function clearOfflineQueue() {
  saveQueue([]);
  localStorage.removeItem(SYNC_RETRY_KEY);
  logInfo('offline', 'Offline queue cleared');
}

/**
 * Registers or updates the sync callback function.
 * @param {Function} callback - The new sync callback.
 */
export function setSyncCallback(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Sync callback must be a function');
  }
  syncCallback = callback;
  // If online, attempt to process the queue immediately
  if (navigator.onLine && config.autoSync) {
    processOfflineQueue();
  }
}

// ============================================================================
// Optional: Export a default object for convenience
// ============================================================================

export default {
  initOfflineHandler,
  queueOfflineAction,
  processOfflineQueue,
  isOnline,
  syncOfflineQueue,
  clearOfflineQueue,
  setSyncCallback,
};
