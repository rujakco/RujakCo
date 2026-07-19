// utils/helpers.js
import { searchAddressOSM } from '../modules/shipping.js';

export function fmt(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num || 0);
}

export function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let toastTimer = null;
export function showToast(msg) {
  if (!msg) return;
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

export function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

let supabaseClient = null;
export function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (window.supabase?.createClient && window.__SUPABASE_URL__ && window.__SUPABASE_KEY__) {
    supabaseClient = window.supabase.createClient(window.__SUPABASE_URL__, window.__SUPABASE_KEY__);
    return supabaseClient;
  }
  return null;
}

// --- Rate limiter untuk Nominatim (mencegah 429) ---
let nominatimQueue = Promise.resolve();
export function queuedSearch(query) {
  nominatimQueue = nominatimQueue.then(
    () => new Promise(resolve => setTimeout(resolve, 1100))
  );
  return nominatimQueue.then(() => searchAddressOSM(query));
}