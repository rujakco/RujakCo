// =========================================
// modules/storage.js 
// FINAL: Aman dari In-App Browser & Incognito Mode
// =========================================

let storageAvailable = true;
const memoryStorage = {}; // Penampung darurat (RAM Fallback)

// 1. Deteksi Keamanan Penyimpanan
try {
  const testKey = '__rj_test__';
  localStorage.setItem(testKey, '1');
  localStorage.removeItem(testKey);
} catch (e) {
  storageAvailable = false;
  console.warn('⚠️ Mode Privat / In-App Browser terdeteksi. Data reservasi hanya tersimpan selama halaman ini terbuka.');
}

// =========================================
// FUNGSI BANTUAN INTERNAL (SAFE WRAPPERS)
// =========================================

function safeSet(key, value) {
  if (value === undefined) value = '';
  
  if (storageAvailable) {
    try { 
      localStorage.setItem(key, value); 
    } catch (e) { 
      // Fallback ganda: Jika memori perangkat penuh (QuotaExceededError)
      memoryStorage[key] = value; 
    }
  } else {
    // Simpan di RAM jika peramban memblokir penyimpanan permanen
    memoryStorage[key] = value;
  }
}

function safeGet(key) {
  if (storageAvailable) {
    try { 
      const data = localStorage.getItem(key);
      return data !== null ? data : memoryStorage[key];
    } catch (e) { 
      return memoryStorage[key]; 
    }
  }
  return memoryStorage[key] || null;
}

function safeRemove(key) {
  if (storageAvailable) {
    try { 
      localStorage.removeItem(key); 
    } catch (e) {
      // Abaikan error saat menghapus
    }
  }
  delete memoryStorage[key];
}

// =========================================
// EKSPOR UTAMA (DIPANGGIL OLEH APP.JS)
// =========================================

export function isStorageAvailable() { 
  return storageAvailable; 
}

// Diekspor supaya pemanggil lain (mis. app.js) tidak perlu mengakses
// localStorage mentah saat butuh baca satu key secara langsung —
// tetap lewat wrapper yang sudah aman dari in-app browser/incognito.
export function readRaw(key) {
  return safeGet(key);
}

export function loadState() {
  try {
    const cartData = safeGet('rj_crt_v7');
    const cart = cartData ? JSON.parse(cartData) : {};
    
    const name = safeGet('rj_client_name') || '';
    let district = safeGet('rj_selected_address');
    
    // Migrasi data lama jika pengguna masih pakai format versi sebelumnya
    if (!district) {
      district = safeGet('rj_client_district') || '';
      if (district) {
        safeSet('rj_selected_address', district);
        safeRemove('rj_client_district');
      }
    }
    return { cart, name, district };
  } catch { 
    return { cart: {}, name: '', district: '' }; 
  }
}

export function saveCart(cart) { 
  safeSet('rj_crt_v7', JSON.stringify(cart)); 
}

export function saveUser(name, district) {
  safeSet('rj_client_name', name);
  safeSet('rj_selected_address', district);
}

export function clearUser() {
  const keysToClear = [
    'rj_client_name',
    'rj_client_district',
    'rj_selected_address',
    'rj_customer_phone',
    'rj_customer_address',
    'rj_user_distance',
    'rj_customer_saved_at',
    'rj_crt_v7'
  ];
  keysToClear.forEach(k => safeRemove(k));
}

export function saveCustomer(phone, address, district, distance = null) {
  safeSet('rj_customer_phone', phone || '');
  safeSet('rj_customer_address', address || '');
  
  if (district) {
    safeSet('rj_selected_address', district);
  }
  
  if (distance !== null && distance !== undefined && !Number.isNaN(distance)) {
    // Pastikan angka diubah ke string sebelum masuk ke storage
    safeSet('rj_user_distance', distance.toString());
  }
  
  safeSet('rj_customer_saved_at', Date.now().toString());
}

export function loadCustomer() {
  try {
    const phone = safeGet('rj_customer_phone') || '';
    const address = safeGet('rj_customer_address') || '';
    const district = safeGet('rj_selected_address') || safeGet('rj_client_district') || '';
    
    const distanceRaw = safeGet('rj_user_distance');
    let distance = null;
    
    if (distanceRaw !== null && distanceRaw !== undefined) {
      const parsed = parseFloat(distanceRaw);
      distance = Number.isNaN(parsed) ? null : parsed;
    }
    
    return { phone, address, district, distance };
  } catch { 
    return { phone: '', address: '', district: '', distance: null }; 
  }
}