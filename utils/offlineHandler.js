import { showToast } from './helpers.js';
import { logInfo, logWarn, logError } from './logger.js';

const OFFLINE_QUEUE_KEY = 'rujak_offline_queue';
const SYNC_RETRY_KEY = 'rujak_sync_retry_count';
const DEFAULT_CONFIG = { bannerId: 'offlineBanner', bannerClass: 'offline-banner', onlineClass: 'is-online', offlineClass: 'is-offline', maxRetries: 3, retryDelay: 2000, autoSync: true };
let config = { ...DEFAULT_CONFIG };
let syncCallback = null;
let isProcessing = false;

function getQueue() { try { const raw = localStorage.getItem(OFFLINE_QUEUE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function saveQueue(queue) { try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue)); } catch (error) { logError('offline', error, { action: 'saveQueue' }); } }
function getRetryCount(timestamp) { try { const map = JSON.parse(localStorage.getItem(SYNC_RETRY_KEY) || '{}'); return map[timestamp] || 0; } catch { return 0; } }
function setRetryCount(timestamp, count) { try { const map = JSON.parse(localStorage.getItem(SYNC_RETRY_KEY) || '{}'); if (count <= 0) delete map[timestamp]; else map[timestamp] = count; localStorage.setItem(SYNC_RETRY_KEY, JSON.stringify(map)); } catch {} }

function createBanner() {
  const existing = document.getElementById(config.bannerId);
  if (existing) return existing;
  const banner = document.createElement('div');
  banner.id = config.bannerId;
  banner.className = config.bannerClass;
  banner.setAttribute('role', 'status');
  banner.innerHTML = '<span class="offline-dot"></span><span>Koneksi terputus. Data disimpan secara lokal.</span>';
  document.body.appendChild(banner);
  return banner;
}

function updateBannerVisibility(banner, isOffline) { if (banner) banner.style.display = isOffline ? 'block' : 'none'; }

async function processAction(action, index, queue) {
  if (!syncCallback) { logWarn('offline', 'No sync callback registered; skipping action', { action }); return true; }
  const { action: actionData, timestamp } = action;
  const retryCount = getRetryCount(timestamp);
  try {
    const result = await syncCallback(actionData, { timestamp, retryCount });
    if (result === false) return false;
    setRetryCount(timestamp, 0);
    return true;
  } catch (error) {
    const isRetryable = error?.retryable !== false;
    if (isRetryable && retryCount < config.maxRetries) { const newCount = retryCount + 1; setRetryCount(timestamp, newCount); logWarn('offline', `Retry ${newCount}/${config.maxRetries} for action`, { action: actionData, error: error.message, timestamp }); return false; }
    else { logError('offline', error, { action: actionData, timestamp, retryCount }); setRetryCount(timestamp, 0); return true; }
  }
}

export async function processOfflineQueue() {
  if (isProcessing) { logInfo('offline', 'Sync already in progress, skipping duplicate call'); return; }
  if (!syncCallback) { logWarn('offline', 'No sync callback registered; queue will not be processed'); return; }
  const queue = getQueue();
  if (queue.length === 0) { logInfo('offline', 'Queue is empty, nothing to sync'); return; }
  isProcessing = true;
  logInfo('offline', `Starting sync of ${queue.length} offline actions`);
  try {
    const remaining = [];
    for (let i = 0; i < queue.length; i++) { const action = queue[i]; const success = await processAction(action, i, queue); if (!success) remaining.push(action); }
    saveQueue(remaining);
    if (remaining.length > 0) { logWarn('offline', `${remaining.length} actions remain in queue for retry`); if (config.autoSync) setTimeout(() => { processOfflineQueue(); }, config.retryDelay); }
    else { logInfo('offline', 'All offline actions successfully synced'); localStorage.removeItem(SYNC_RETRY_KEY); }
  } catch (error) { logError('offline', error, { action: 'processOfflineQueue' }); }
  finally { isProcessing = false; }
}

export function initOfflineHandler(options = {}) {
  config = { ...DEFAULT_CONFIG, ...options };
  if (options.syncCallback) syncCallback = options.syncCallback;
  const banner = createBanner();
  const isOffline = !navigator.onLine;
  if (isOffline) { document.body.classList.add(config.offlineClass); document.body.classList.remove(config.onlineClass); updateBannerVisibility(banner, true); }
  else { document.body.classList.add(config.onlineClass); document.body.classList.remove(config.offlineClass); updateBannerVisibility(banner, false); if (config.autoSync && syncCallback) processOfflineQueue(); }
  const handleOffline = () => { document.body.classList.add(config.offlineClass); document.body.classList.remove(config.onlineClass); updateBannerVisibility(banner, true); showToast('Koneksi terputus. Data disimpan secara lokal.', 'warning'); logInfo('network', 'User went offline'); };
  const handleOnline = () => { document.body.classList.add(config.onlineClass); document.body.classList.remove(config.offlineClass); updateBannerVisibility(banner, false); showToast('Koneksi kembali. Sinkronisasi data...', 'success'); logInfo('network', 'User came back online'); if (config.autoSync && syncCallback) processOfflineQueue(); };
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);
  window.__offlineHandlerCleanup = () => { window.removeEventListener('offline', handleOffline); window.removeEventListener('online', handleOnline); };
}

export function queueOfflineAction(action) {
  const queue = getQueue(); queue.push({ action, timestamp: new Date().toISOString() }); saveQueue(queue);
  logInfo('offline', 'Action queued', { action });
  if (!navigator.onLine) showToast('Aksi disimpan lokal. Akan dikirim saat koneksi kembali.', 'info');
  else if (syncCallback && config.autoSync) processOfflineQueue();
}

export function isOnline() { return navigator.onLine; }
export function syncOfflineQueue() { if (syncCallback) processOfflineQueue(); else logWarn('offline', 'Cannot sync: no sync callback registered'); }
export function clearOfflineQueue() { saveQueue([]); localStorage.removeItem(SYNC_RETRY_KEY); logInfo('offline', 'Offline queue cleared'); }
export function setSyncCallback(callback) { if (typeof callback !== 'function') throw new Error('Sync callback must be a function'); syncCallback = callback; if (navigator.onLine && config.autoSync) processOfflineQueue(); }

export default { initOfflineHandler, queueOfflineAction, processOfflineQueue, isOnline, syncOfflineQueue, clearOfflineQueue, setSyncCallback };