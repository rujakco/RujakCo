// utils/helpers.js – FINAL
import { searchAddressOSM } from '../modules/shipping.js';

/**
 * Format angka menjadi mata uang Rupiah.
 * @param {number} num
 * @returns {string}
 */
export function fmt(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num || 0);
}

/**
 * Escape HTML untuk mencegah XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let toastTimer = null;
/**
 * Menampilkan toast notifikasi.
 * @param {string} msg
 */
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

/**
 * Debounce sebuah fungsi.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

let supabaseClient = null;
/**
 * Mendapatkan instance Supabase client (singleton).
 * @returns {object|null}
 */
export function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (window.supabase?.createClient && window.__SUPABASE_URL__ && window.__SUPABASE_KEY__) {
    supabaseClient = window.supabase.createClient(window.__SUPABASE_URL__, window.__SUPABASE_KEY__);
    return supabaseClient;
  }
  return null;
}

let nominatimQueue = Promise.resolve();
/**
 * Antrian pencarian alamat via Nominatim dengan rate limiting.
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array>}
 */
export function queuedSearch(query, signal) {
  const result = nominatimQueue
    .then(() => new Promise(resolve => setTimeout(resolve, 1100)))
    .then(() => {
      if (signal?.aborted) return [];
      return searchAddressOSM(query, signal);
    });
  nominatimQueue = result.catch(() => {});
  return result;
}

/**
 * Animasi tekan mikro untuk tombol sekunder (Tutup, Kembali, Share, About).
 * Tidak digunakan untuk tombol Add to Cart yang sudah memiliki animasi sendiri.
 * @param {HTMLElement} el
 */
export function animatePress(el) {
  if (!el) return;
  el.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(.96)' },
      { transform: 'scale(1)' }
    ],
    {
      duration: 180,
      easing: 'cubic-bezier(.22,1,.36,1)'
    }
  );
}

/**
 * Membentuk kunci unik untuk item di keranjang berdasarkan ID produk dan level pedas.
 * @param {string} productId
 * @param {number} spiceLevel
 * @returns {string}
 */
export function createCartKey(productId, spiceLevel) {
  return `${productId}_spice${spiceLevel}`;
}