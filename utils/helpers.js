// utils/helpers.js — Final (singleton Supabase client)
export function fmt(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0);
}

export function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let toastTimer = null;
export function showToast(msg) {
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

// ✅ Singleton Supabase client
let supabaseClient = null;
export function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (window.supabase?.createClient) {
    const url = window.__SUPABASE_URL__ || '';
    const key = window.__SUPABASE_KEY__ || '';
    if (!url || !key) {
      console.warn('Supabase URL/Key tidak ditemukan.');
      return null;
    }
    supabaseClient = window.supabase.createClient(url, key);
    return supabaseClient;
  }
  console.warn('Supabase tidak tersedia (supabase-js belum dimuat).');
  return null;
}