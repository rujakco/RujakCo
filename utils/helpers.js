// utils/helpers.js

// Format mata uang Rupiah (konsisten, tanpa desimal jika tidak perlu)
export function fmt(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0);
}

// Escape string untuk mencegah XSS (lebih ringan dari DOM parsing)
export function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Toast notification
let toastTimer = null;
export function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth;          // force reflow agar animasi bisa dipicu ulang
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// Debounce utility
export function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Supabase client (baca URL & KEY dari config.js – JANGAN hardcode di sini)
export function getSupabase() {
  if (window.supabase?.createClient) {
    // Ganti dengan import dari config Anda sendiri
    // Misalnya: import { SUPABASE_URL, SUPABASE_KEY } from '../data/config.js';
    // Karena helpers.js tidak boleh import dari config (sirkular?), ambil dari global atau parameter.
    // Untuk saat ini fallback ke nilai window.__SUPABASE__ jika ada, atau return null.
    const url = window.__SUPABASE_URL__ || '';
    const key = window.__SUPABASE_KEY__ || '';
    if (!url || !key) {
      console.warn('Supabase URL/Key tidak ditemukan.');
      return null;
    }
    return window.supabase.createClient(url, key);
  }
  console.warn('Supabase tidak tersedia (supabase-js belum dimuat).');
  return null;
}