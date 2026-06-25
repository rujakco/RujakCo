// products.js — SATU SUMBER DATA PRODUK
// Digunakan oleh app.js dan studio.html

const PRODUCTS_DATA = [
  {
    id: 'p_m1', name: 'Rujak Segar',
    desc: 'Kombinasi buah pilihan dengan sambal original Rujak.Co. Ringan, segar, dan cocok untuk semua penikmat rujak.',
    price: 28000, cat: 'classic', tags: ['Pilihan Klasik', '5 Buah'], badge: null, badgeColor: null,
    container: 'Thinwall 750ml (PP Food Grade)', size: 'Porsi Reguler', sambal: 'Sambal Original (1 Cup)',
    buah: ['Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'],
    flavor: 'Segar & Autentik', flavorTag: null, defaultSpice: 3, portion: '1 Orang',
    thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp',
    image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp'
  },
  {
    id: 'p_m2', name: 'Rujak Serut',
    desc: 'Buah diserut halus untuk pengalaman rasa yang lebih menyatu di setiap suapan.',
    price: 26000, cat: 'classic', tags: ['Renyah', 'Serut'], badge: null, badgeColor: null,
    container: 'Thinwall 750ml (PP Food Grade)', size: 'Porsi Reguler', sambal: 'Sambal Original (1 Cup)',
    buah: ['Mangga Muda', 'Bengkoang', 'Nanas', 'Ubi Merah'],
    flavor: 'Renyah Segar', flavorTag: 'Renyah', defaultSpice: 3, portion: '1 Orang',
    thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp',
    image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp'
  },
  {
    id: 'p_m3', name: 'Rujak Gaco',
    desc: 'Enam buah pilihan dengan sambal mete premium yang kaya rasa dan menjadi favorit pelanggan.',
    price: 40000, cat: 'signature', tags: ['Mete Premium', 'Bestseller'], badge: 'Koleksi Favorit', badgeColor: 'red',
    container: 'Thinwall 750ml (PP Food Grade)', size: 'Porsi Reguler', sambal: 'Sambal Mete Premium (1 Cup)',
    buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'],
    flavor: 'Gurih Mete Premium', flavorTag: null, defaultSpice: 3, portion: '1 Orang',
    thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp',
    image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp'
  },
  {
    id: 'p_m4', name: 'Rujak Rama',
    desc: 'Porsi melimpah untuk dua hingga tiga orang dengan cita rasa khas Rujak.Co.',
    price: 48000, cat: 'signature', tags: ['Porsi Besar', 'Sharing'], badge: 'Untuk Dibagi Bersama', badgeColor: 'red',
    container: 'Thinwall Jumbo 1000ml (PP Food Grade)', size: 'Porsi Sharing', sambal: 'Sambal Mete Premium (2 Cup)',
    buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'],
    flavor: 'Gurih Mete Extra Pedas', flavorTag: null, defaultSpice: 4, portion: '2-3 Orang',
    thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp',
    image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp'
  },
  {
    id: 'p_m5', name: 'Rujak Mahkota',
    desc: 'Koleksi premium dengan Shine Muscat dan buah pilihan terbaik untuk momen istimewa.',
    price: 85000, cat: 'reserve', tags: ['Eksklusif', 'Shine Muscat'], badge: 'Reserve Collection', badgeColor: 'gold',
    container: 'Thinwall Jumbo 1000ml + Paper Bag', size: 'Porsi Premium', sambal: 'Sambal Mete Premium (2 Cup)',
    buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'],
    flavor: 'Eksklusif & Premium', flavorTag: null, defaultSpice: 3, portion: '1-2 Orang',
    thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp',
    image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp'
  },
  {
    id: 'p_m6', name: 'Tampah Nusantara',
    desc: 'Sajian kebersamaan dalam tampah bambu dengan koleksi buah pilihan dan sambal khas Rujak.Co.',
    price: 200000, cat: 'reserve', tags: ['Tampah', 'Pre-Order'], badge: 'Untuk 8-10 Orang', badgeColor: 'gold',
    container: 'Tampah Bambu Ø40cm + Kardus + Wrap', size: 'Porsi Besar', sambal: 'Varian Original & Mete (4 Cup)',
    buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong', 'Ubi Merah'],
    flavor: 'Kemegahan Berbagai Rasa', flavorTag: null, defaultSpice: 3, portion: '8-10 Orang',
    thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp',
    image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp'
  }
];

const VIP_PRODUCT_DATA = {
  id: 'p_vip',
  name: 'Mahkota VIP',
  desc: 'Menu rahasia eksklusif dengan komposisi premium dan sambal spesial. Hanya untuk yang tahu.',
  price: 125000,
  cat: 'reserve',
  tags: ['Eksklusif', 'VIP Only'],
  badge: 'Menu Rahasia',
  badgeColor: 'gold',
  container: 'Box Premium + Paper Bag',
  size: 'Porsi Eksklusif',
  sambal: 'Sambal Mete Premium Spesial (2 Cup)',
  buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Harum Manis', 'Nanas Madu', 'Bengkoang', 'Strawberry'],
  flavor: 'Premium & Misterius',
  flavorTag: 'Limited',
  defaultSpice: 2,
  portion: '1-2 Orang',
  thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp',
  image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp'
};