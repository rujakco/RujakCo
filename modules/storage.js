// ✅ Perbaikan:
// 1. distance = 0 tidak lagi dianggap null.
// 2. clearUser() menghapus SEMUA data pribadi (termasuk telepon, alamat, keranjang).
// 3. Deteksi ketersediaan localStorage & peringatan jika tidak ada.
// 4. Konsistensi kunci district (hanya gunakan rj_selected_address).
// 5. Tidak ada silent failure – kegagalan setItem dicatat di console.

// ---------------------------------------------------------------------------
// Cek ketersediaan localStorage (hanya sekali, saat modul dimuat)
// ---------------------------------------------------------------------------
let storageAvailable = true;
try {
  const testKey = '__rj_test__';
  localStorage.setItem(testKey, '1');
  localStorage.removeItem(testKey);
} catch (e) {
  storageAvailable = false;
  console.warn('⚠️ localStorage tidak tersedia. Data tidak akan disimpan.');
}

// ---------------------------------------------------------------------------
// Helper: aman menyimpan ke localStorage
// ---------------------------------------------------------------------------
function safeSet(key, value) {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`Gagal menyimpan ${key}:`, e);
    // Opsional: bisa trigger toast peringatan sekali, tapi jangan di sini
  }
}

// ---------------------------------------------------------------------------
// Muat state utama (cart, nama, district pendek)
// ---------------------------------------------------------------------------
export function loadState() {
  if (!storageAvailable) return { cart: {}, name: '', district: '' };
  try {
    const cart = JSON.parse(localStorage.getItem('rj_crt_v7')) || {};
    const name = localStorage.getItem('rj_client_name') || '';
    // Hanya gunakan satu sumber: rj_selected_address (alamat lengkap), 
    // tapi fallback ke rj_client_district untuk data lama (backward compatible)
    const district = localStorage.getItem('rj_selected_address') || 
                     localStorage.getItem('rj_client_district') || '';
    return { cart, name, district };
  } catch {
    return { cart: {}, name: '', district: '' };
  }
}

// ---------------------------------------------------------------------------
// Simpan keranjang
// ---------------------------------------------------------------------------
export function saveCart(cart) {
  safeSet('rj_crt_v7', JSON.stringify(cart));
}

// ---------------------------------------------------------------------------
// Simpan data user dasar (nama, district pendek) – digunakan oleh onboarding
// ---------------------------------------------------------------------------
export function saveUser(name, district) {
  safeSet('rj_client_name', name);
  // Sekarang tulis juga ke rj_selected_address (kunci utama)
  safeSet('rj_selected_address', district);
}

// ---------------------------------------------------------------------------
// Hapus SEMUA data pribadi user (reset penuh)
// ---------------------------------------------------------------------------
export function clearUser() {
  if (!storageAvailable) return;
  const keysToRemove = [
    'rj_client_name',
    'rj_client_district',      // kunci lama (dihapus untuk migrasi bersih)
    'rj_selected_address',
    'rj_customer_phone',
    'rj_customer_address',
    'rj_user_distance',
    'rj_crt_v7'                // keranjang juga dihapus agar benar-benar bersih
  ];
  keysToRemove.forEach(key => {
    try { localStorage.removeItem(key); } catch {}
  });
}

// ---------------------------------------------------------------------------
// Simpan data pelanggan lengkap (telepon, alamat detail, district, jarak)
// ---------------------------------------------------------------------------
export function saveCustomer(phone, address, district, distance = null) {
  safeSet('rj_customer_phone', phone || '');
  safeSet('rj_customer_address', address || '');
  if (district) {
    safeSet('rj_selected_address', district);
  }
  if (distance !== null && distance !== undefined && !Number.isNaN(distance)) {
    safeSet('rj_user_distance', distance);
  }
}

// ---------------------------------------------------------------------------
// Muat data pelanggan (telepon, alamat, district lengkap, jarak)
// ---------------------------------------------------------------------------
export function loadCustomer() {
  if (!storageAvailable) return { phone: '', address: '', district: '', distance: null };
  try {
    const phone = localStorage.getItem('rj_customer_phone') || '';
    const address = localStorage.getItem('rj_customer_address') || '';
    // Hanya satu kunci untuk alamat lengkap
    const district = localStorage.getItem('rj_selected_address') || 
                     localStorage.getItem('rj_client_district') || '';
    const distanceRaw = localStorage.getItem('rj_user_distance');
    let distance = null;
    if (distanceRaw !== null) {
      const parsed = parseFloat(distanceRaw);
      // Perbaikan: 0 tetap 0, hanya null jika bukan angka
      distance = Number.isNaN(parsed) ? null : parsed;
    }
    return { phone, address, district, distance };
  } catch {
    return { phone: '', address: '', district: '', distance: null };
  }
}

// ---------------------------------------------------------------------------
// Opsional: deteksi penyimpanan tidak tersedia (bisa dipanggil dari app.js)
// ---------------------------------------------------------------------------
export function isStorageAvailable() {
  return storageAvailable;
}