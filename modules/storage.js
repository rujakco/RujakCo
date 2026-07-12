// modules/storage.js
export function loadState() {
  try {
    const cart = JSON.parse(localStorage.getItem('rj_crt_v7')) || {};
    const name = localStorage.getItem('rj_client_name') || '';
    const district = localStorage.getItem('rj_client_district') || '';
    return { cart, name, district };
  } catch { return { cart: {}, name: '', district: '' }; }
}

export function saveCart(cart) {
  try { localStorage.setItem('rj_crt_v7', JSON.stringify(cart)); } catch {}
}

export function saveUser(name, district) {
  try {
    localStorage.setItem('rj_client_name', name);
    localStorage.setItem('rj_client_district', district);
  } catch {}
}

export function clearUser() {
  try {
    localStorage.removeItem('rj_client_name');
    localStorage.removeItem('rj_client_district');
  } catch {}
}