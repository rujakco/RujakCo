let storageAvailable = true;
try {
  const testKey = '__rj_test__';
  localStorage.setItem(testKey, '1');
  localStorage.removeItem(testKey);
} catch (e) {
  storageAvailable = false;
  console.warn('⚠️ localStorage tidak tersedia. Data tidak akan disimpan.');
}

function safeSet(key, value) {
  if (!storageAvailable) return;
  try { localStorage.setItem(key, value); } catch (e) { console.error(`Gagal menyimpan ${key}:`, e); }
}

export function isStorageAvailable() { return storageAvailable; }

export function loadState() {
  if (!storageAvailable) return { cart: {}, name: '', district: '' };
  try {
    const cart = JSON.parse(localStorage.getItem('rj_crt_v7')) || {};
    const name = localStorage.getItem('rj_client_name') || '';
    let district = localStorage.getItem('rj_selected_address');
    if (!district) {
      district = localStorage.getItem('rj_client_district') || '';
      if (district) {
        safeSet('rj_selected_address', district);
        try { localStorage.removeItem('rj_client_district'); } catch {}
      }
    }
    return { cart, name, district };
  } catch { return { cart: {}, name: '', district: '' }; }
}

export function saveCart(cart) { safeSet('rj_crt_v7', JSON.stringify(cart)); }

export function saveUser(name, district) {
  safeSet('rj_client_name', name);
  safeSet('rj_selected_address', district);
}

export function clearUser() {
  if (!storageAvailable) return;
  ['rj_client_name','rj_client_district','rj_selected_address','rj_customer_phone','rj_customer_address','rj_user_distance','rj_customer_saved_at','rj_crt_v7'].forEach(k => { try { localStorage.removeItem(k); } catch {} });
}

export function saveCustomer(phone, address, district, distance = null) {
  safeSet('rj_customer_phone', phone || '');
  safeSet('rj_customer_address', address || '');
  if (district) safeSet('rj_selected_address', district);
  if (distance !== null && distance !== undefined && !Number.isNaN(distance)) safeSet('rj_user_distance', distance);
  safeSet('rj_customer_saved_at', Date.now().toString());
}

export function loadCustomer() {
  if (!storageAvailable) return { phone: '', address: '', district: '', distance: null };
  try {
    const phone = localStorage.getItem('rj_customer_phone') || '';
    const address = localStorage.getItem('rj_customer_address') || '';
    const district = localStorage.getItem('rj_selected_address') || localStorage.getItem('rj_client_district') || '';
    const distanceRaw = localStorage.getItem('rj_user_distance');
    let distance = null;
    if (distanceRaw !== null) {
      const parsed = parseFloat(distanceRaw);
      distance = Number.isNaN(parsed) ? null : parsed;
    }
    return { phone, address, district, distance };
  } catch { return { phone: '', address: '', district: '', distance: null }; }
}