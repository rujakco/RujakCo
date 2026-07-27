// data/config.js
export const SYSTEM = {
  WA_NUMBER: '6289677161680',
  STORE_LAT: -6.2164777,
  STORE_LNG: 107.0177636,
  DEFAULT_DISTANCE: 2
};

export const SPICE_LABELS = { 
  1: 'Ringan', 
  2: 'Sedang', 
  3: 'Pedas', 
  4: 'Sangat Pedas', 
  5: 'Neraka' 
};

export const FAQ_DATA = [
  // --------------------------------
  // FAQ LINI ASINAN (di atas, lebih spesifik)
  // --------------------------------
  { keywords: ["asinan", "beda", "rujak", "perbedaan"], answer: "Rujak pakai sambal kacang/mete, sedangkan asinan pakai kuah cair asam-manis-pedas khas Nusantara. Dua-duanya sama-sama pakai buah segar pilihan, cuma beda karakter rasa aja, Kak." },
  { keywords: ["kiamboy", "apa itu", "asinan kiamboy"], answer: "Kiamboy itu manisan dari buah plum kering yang punya rasa asam-asin khas. RUJAK.Co pakai kiamboy asli, dipadukan buah segar musiman dan kuah racikan sendiri — konsep yang lagi digandrungi banyak orang." },
  { keywords: ["mahkota", "mahal", "harga", "premium"], answer: "Asinan Mahkota pakai buah impor eksklusif — Shine Muscat, anggur Moondrop, ceri impor, dan delima — plus kuah premium beraroma ceri-delima. Ini varian limited yang cuma ada saat buah impornya lagi prima kualitasnya." },
  { keywords: ["asinan", "cabai", "kuah"], answer: "Level pedas asinan bisa Kakak atur sendiri, dari Ringan sampai Neraka — sama seperti rujak. Defaultnya kami set di level Pedas (level 3), tapi bebas disesuaikan pas pesan." },
  { keywords: ["simpan", "tahan", "kadaluarsa", "kulkas", "asinan"], answer: "Sama seperti sambal, kuah asinan bisa tahan sampai 3 hari di kulkas. Tapi buahnya paling enak langsung disantap di hari pengantaran ya, Kak, biar teksturnya masih maksimal." },

  // --------------------------------
  // FAQ UMUM (di bawah, lebih generik)
  // --------------------------------
  { keywords: ['jam', 'buka', 'operasional'], answer: 'Rujak.Co buka Senin-Jumat pukul 10.00-20.00 WIB, dan Sabtu-Minggu pukul 09.00-18.00 WIB.' },
  { keywords: ['delivery', 'antar', 'kurir', 'ongkir', 'biaya'], answer: 'Kami melayani pengantaran ke seluruh area Jabodetabek. Biaya dihitung otomatis setelah Anda mengetik alamat lengkap di keranjang.' },
  { keywords: ['pedas', 'level', 'spice'], answer: 'Tingkat pedas bisa disesuaikan dari level 1 (Ringan) hingga 5 (Neraka).' },
  { keywords: ['buah', 'komposisi'], answer: 'Setiap produk mencantumkan komposisi buahnya. Kami selalu menggunakan buah segar yang dipotong 15 menit sebelum antar.' },
  { keywords: ['promo', 'diskon'], answer: 'Saat ini belum ada promo khusus. Pantau terus Instagram kami untuk info terbaru!' },
  { keywords: ['area', 'bekasi', 'jakarta', 'depok'], answer: 'Kami mencakup area Jabodetabek. Ketik alamat lengkap Anda di keranjang untuk mengecek ketersediaan pengantaran.' },
  { keywords: ['sambal', 'terpisah', 'tumpah'], answer: 'Sambal selalu dikemas terpisah agar buah tetap segar dan renyah saat diterima.' },
  { keywords: ['bayar', 'pembayaran', 'qris'], answer: 'Kami menerima pembayaran via QRIS. Scan kode QR yang muncul setelah Anda menyelesaikan reservasi.' }
];