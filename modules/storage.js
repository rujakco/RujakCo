export function loadState() {
  try {
    const cart = JSON.parse(localStorage.getItem('rj_crt_v7')) || {};
    const name = localStorage.getItem('rj_client_name') || '';
    const district = localStorage.getItem('rj_selected_address') || localStorage.getItem('rj_client_district') || '';
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
    ['rj_client_name','rj_client_district','rj_selected_address','rj_user_distance'].forEach(k => localStorage.removeItem(k));
  } catch {}
}

export function saveCustomer(phone, address, district, distance = null) {
  try {
    localStorage.setItem('rj_customer_phone', phone || '');
    localStorage.setItem('rj_customer_address', address || '');
    if (district) localStorage.setItem('rj_selected_address', district);
    if (distance !== null && distance !== undefined) localStorage.setItem('rj_user_distance', distance);
  } catch {}
}

export function loadCustomer() {
  try {
    const phone = localStorage.getItem('rj_customer_phone') || '';
    const address = localStorage.getItem('rj_customer_address') || '';
    const district = localStorage.getItem('rj_selected_address') || localStorage.getItem('rj_client_district') || '';
    const distance = parseFloat(localStorage.getItem('rj_user_distance')) || null;
    return { phone, address, district, distance };
  } catch { return { phone: '', address: '', district: '', distance: null }; }
}