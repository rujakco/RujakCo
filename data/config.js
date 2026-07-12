// data/config.js
export const SYSTEM = {
  WA_NUMBER: '6289677161680',
  STORE_LAT: -6.2165414,
  STORE_LNG: 107.0177395,
  DEFAULT_DISTANCE: 2
};

export const SPICE_LABELS = {
  1: 'Ringan',
  2: 'Sedang',
  3: 'Pedas',
  4: 'Sangat Pedas',
  5: 'Neraka'
};

// FAQ untuk Concierge
export const FAQ_DATA = [
  { keywords: ['jam', 'buka', 'operasional'], answer: 'Rujak.Co buka setiap hari mulai pukul 09.00 - 21.00 WIB.' },
  { keywords: ['delivery', 'antar', 'kurir'], answer: 'Kami melayani pengantaran ke seluruh area Bekasi, Jakarta Timur, dan Depok. Biaya dihitung otomatis di keranjang.' },
  { keywords: ['pedas', 'level', 'spice'], answer: 'Tingkat pedas bisa disesuaikan dari level 1 (Ringan) hingga 5 (Neraka).' },
  { keywords: ['buah', 'komposisi'], answer: 'Setiap produk mencantumkan komposisi buahnya. Kami selalu menggunakan buah segar yang dipotong 15 menit sebelum antar.' },
  { keywords: ['promo', 'diskon'], answer: 'Saat ini belum ada promo khusus. Pantau terus Instagram kami untuk info terbaru!' },
  { keywords: ['area', 'bekasi', 'jakarta'], answer: 'Kami mencakup area Bekasi, Jakarta Timur, dan sebagian Depok. Cek kecamatan di dropdown saat checkout.' }
];