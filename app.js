(function() {
  'use strict';

  // ===================== SUPABASE =====================
  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";

  let supabase = null;
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('Supabase client tidak tersedia.');
  }

  // ===================== DATA PRODUK =====================
  const PRODUCTS = [
    {
      id: 'p_m1', name: 'Rujak Segar', desc: 'Kombinasi buah pilihan dengan sambal original Rujak.Co. Ringan, segar, dan cocok untuk semua penikmat rujak.',
      price: 28000, cat: 'classic', tags: ['Pilihan Klasik', '5 Buah'], badge: null, badgeColor: null, container: 'Thinwall 750ml (PP Food Grade)', size: 'Porsi Reguler', sambal: 'Sambal Original (1 Cup)', buah: ['Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Segar & Autentik', flavorTag: null, defaultSpice: 3, portion: '1 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp'
    },
    {
      id: 'p_m2', name: 'Rujak Serut', desc: 'Buah diserut halus untuk pengalaman rasa yang lebih menyatu di setiap suapan.', price: 26000, cat: 'classic', tags: ['Renyah', 'Serut'], badge: null, badgeColor: null, container: 'Thinwall 750ml (PP Food Grade)', size: 'Porsi Reguler', sambal: 'Sambal Original (1 Cup)', buah: ['Mangga Muda', 'Bengkoang', 'Nanas', 'Ubi Merah'], flavor: 'Renyah Segar', flavorTag: 'Renyah', defaultSpice: 3, portion: '1 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp'
    },
    {
      id: 'p_m3', name: 'Rujak Gaco', desc: 'Enam buah pilihan dengan sambal mete premium yang kaya rasa dan menjadi favorit pelanggan.', price: 40000, cat: 'signature', tags: ['Mete Premium', 'Bestseller'], badge: 'Koleksi Favorit', badgeColor: 'red', container: 'Thinwall 750ml (PP Food Grade)', size: 'Porsi Reguler', sambal: 'Sambal Mete Premium (1 Cup)', buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Gurih Mete Premium', flavorTag: null, defaultSpice: 3, portion: '1 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp'
    },
    {
      id: 'p_m4', name: 'Rujak Rama', desc: 'Porsi melimpah untuk dua hingga tiga orang dengan cita rasa khas Rujak.Co.', price: 48000, cat: 'signature', tags: ['Porsi Besar', 'Sharing'], badge: 'Untuk Dibagi Bersama', badgeColor: 'red', container: 'Thinwall Jumbo 1000ml (PP Food Grade)', size: 'Porsi Sharing', sambal: 'Sambal Mete Premium (2 Cup)', buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Gurih Mete Extra Pedas', flavorTag: null, defaultSpice: 4, portion: '2-3 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp'
    },
    {
      id: 'p_m5', name: 'Rujak Mahkota', desc: 'Koleksi premium dengan Shine Muscat dan buah pilihan terbaik untuk momen istimewa.', price: 85000, cat: 'reserve', tags: ['Eksklusif', 'Shine Muscat'], badge: 'Reserve Collection', badgeColor: 'gold', container: 'Thinwall Jumbo 1000ml + Paper Bag', size: 'Porsi Premium', sambal: 'Sambal Mete Premium (2 Cup)', buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Eksklusif & Premium', flavorTag: null, defaultSpice: 3, portion: '1-2 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp'
    },
    {
      id: 'p_m6', name: 'Tampah Nusantara', desc: 'Sajian kebersamaan dalam tampah bambu dengan koleksi buah pilihan dan sambal khas Rujak.Co.', price: 200000, cat: 'reserve', tags: ['Tampah', 'Pre-Order'], badge: 'Untuk 8-10 Orang', badgeColor: 'gold', container: 'Tampah Bambu Ø40cm + Kardus + Wrap', size: 'Porsi Besar', sambal: 'Varian Original & Mete (4 Cup)', buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong', 'Ubi Merah'], flavor: 'Kemegahan Berbagai Rasa', flavorTag: null, defaultSpice: 3, portion: '8-10 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp'
    }
  ];

  const VIP_PRODUCT = {
    id: 'p_vip', name: 'Mahkota VIP', desc: 'Menu rahasia eksklusif dengan komposisi premium dan sambal spesial. Hanya untuk yang tahu.', price: 125000, cat: 'reserve', tags: ['Eksklusif', 'VIP Only'], badge: 'Menu Rahasia', badgeColor: 'gold', container: 'Box Premium + Paper Bag', size: 'Porsi Eksklusif', sambal: 'Sambal Mete Premium Spesial (2 Cup)', buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Harum Manis', 'Nanas Madu', 'Bengkoang', 'Strawberry'], flavor: 'Premium & Misterius', flavorTag: 'Limited', defaultSpice: 2, portion: '1-2 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp'
  };

  const ADDONS = [
    { id: 'a_sambal1', name: 'Sambal Original', price: 8000, icon: 'flame', iconColor: 'text-red-500', desc: 'Warisan rasa klasik.' },
    { id: 'a_sambal2', name: 'Sambal Mete Premium', price: 12000, icon: 'flame', iconColor: 'text-red-600', desc: 'Lebih gurih dan kaya rasa.' },
    { id: 'a_extra_jambu', name: 'Extra Jambu Kristal', price: 10000, icon: 'apple', iconColor: 'text-green-500', desc: 'Tambahan jambu kristal segar' },
    { id: 'a_extra_muscat', name: 'Extra Shine Muscat', price: 15000, icon: 'grape', iconColor: 'text-purple-500', desc: 'Tambahan anggur Shine Muscat impor' }
  ];

  const SYSTEM = { DISCOUNT_THRESHOLD: 100000, WA_NUMBER: '6289677161680', TOAST_DURATION: 3000, MAX_DISTANCE: 50, DEFAULT_DISTANCE: 2 };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null,
    orderNotes: '', isCartMinimized: false, customerName: '',
    customerPhone: '', customerAddress: '', isGift: false, giftSender: '',
    giftMessage: '', hasShared: false, deliveryType: 'segera', deliveryDate: '', deliveryTime: '',
    selectedCourier: null, paymentMethod: 'bayar_kurir', courierRates: [],
    orderedBy: 'pembeli', isCustomerFormOpen: true 
  };

  // ===================== FUNGSI UTILITY =====================
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function loadCart() { try { const s = localStorage.getItem('rujak_cart'); if (s) { const p = JSON.parse(s); if (typeof p === 'object' && p !== null) state.cart = p; } } catch (_) { state.cart = {}; } }
  function saveCart() { try { localStorage.setItem('rujak_cart', JSON.stringify(state.cart)); } catch (_) {} }
  function getItemById(id) { if (id === 'p_vip' || id.startsWith('p_vip_')) return VIP_PRODUCT; let item = PRODUCTS.find(p => p.id === id) || ADDONS.find(a => a.id === id); if (item) return item; return PRODUCTS.find(p => id.startsWith(p.id + '_')); }
  function debounce(fn, delay) { let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); }; }

  // ===================== OSRM API =====================
  async function fetchOSRMDistance(originLat, originLng, destLat, destLng) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) { return Math.round((data.routes[0].distance / 1000) * 10) / 10; }
      return null;
    } catch (e) { return null; }
  }

  function calculateDiscount(subtotal) { let discount = 0; if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) discount += 5000; if (state.hasShared) discount += 5000; return discount; }

  // ===================== SIMULASI TARIF KURIR =====================
  function getCourierRates(distance) {
    if (distance > SYSTEM.MAX_DISTANCE) return [];
    const distKm = Math.ceil(distance * 1.35); 
    const extraKm = Math.max(0, distKm - 4);
    // Hanya 2 pilihan: Motor dan Mobil
    return [
      { id: 'instan_motor', name: 'Instan Motor', cost: 14000 + (extraKm * 2500) },
      { id: 'instan_mobil', name: 'Instan Mobil', cost: 20000 + (extraKm * 4000) }
    ];
  }

  function getLocationFallback() {
    return new Promise(resolve => {
      fetch('https://ipapi.co/json/').then(r => r.json()).then(data => {
        const city = data.city || data.region || 'Lokasi'; let distance = 999;
        const c = city.toLowerCase();
        if (c.includes('bekasi')) distance = 2; else if (c.includes('jakarta')) distance = 15; else if (c.includes('depok')) distance = 20; else if (c.includes('tangerang')) distance = 25; else if (c.includes('bogor')) distance = 30;
        resolve({ city, distance });
      }).catch(() => resolve({ city: 'Lokasi Tidak Diketahui', distance: 999 }));
    });
  }

  function updateShippingUI(distance) {
    const costEl = document.getElementById('shippingCost');
    const courierSection = document.getElementById('courierSection');
    const selectEl = document.getElementById('courierSelect');

    if (distance === null || distance === undefined) {
      costEl.textContent = '📍 Butuh GPS';
      state.courierRates = []; state.selectedCourier = null; return;
    }

    document.getElementById('shippingDistance').textContent = '~' + Math.ceil(distance) + ' km';

    if (state.orderedBy === 'pembeli') {
        costEl.textContent = 'Pesan Sendiri';
        if (courierSection) courierSection.style.display = 'none';
    } else {
        if (distance > SYSTEM.MAX_DISTANCE) {
          costEl.textContent = '❌';
          document.getElementById('outOfRange').style.display = 'block';
          if (courierSection) courierSection.style.display = 'none';
          state.courierRates = []; state.selectedCourier = null;
        } else {
          document.getElementById('outOfRange').style.display = 'none';
          if (courierSection) courierSection.style.display = 'block';

          const couriers = getCourierRates(distance);
          state.courierRates = couriers;
          let html = '';
          couriers.forEach(c => {
            const sel = (state.selectedCourier && state.selectedCourier.id === c.id) ? 'selected' : '';
            html += `<option value="${c.id}" data-cost="${c.cost}" ${sel}>${c.name} — Rp${c.cost.toLocaleString('id-ID')}</option>`;
          });
          selectEl.innerHTML = html;
          if (!state.selectedCourier || !couriers.find(c => c.id === state.selectedCourier.id)) { state.selectedCourier = couriers[0]; }
          costEl.textContent = state.selectedCourier ? fmt(state.selectedCourier.cost) : 'Pilih Kurir';
        }
    }
  }

  async function detectLocation() {
    const STORE_LAT = -6.2333, STORE_LNG = 107.0;
    const costEl = document.getElementById('shippingCost');
    document.getElementById('outOfRange').style.display = 'none';
    costEl.textContent = '📍 Butuh GPS';

    if (!navigator.geolocation) { showToast('❌ GPS tidak tersedia.'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        costEl.textContent = '🛣️ Menghitung rute...';
        const roadDistance = await fetchOSRMDistance(STORE_LAT, STORE_LNG, lat, lng);
        if (roadDistance !== null) { state.userDistance = roadDistance; } else {
          const R = 6371; const dLat = (lat - STORE_LAT) * Math.PI / 180; const dLon = (lng - STORE_LNG) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(STORE_LAT * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
          const straight = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          state.userDistance = Math.round(straight * 1.35 * 10) / 10;
        }
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=id`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || 'Lokasi Anda';
          document.getElementById('locationDisplay').textContent = city + ' ▾';
        } catch (_) { document.getElementById('locationDisplay').textContent = 'Lokasi Anda ▾'; }
        updateShippingUI(state.userDistance);
      },
      (err) => {
        costEl.textContent = '❌ GPS wajib diaktifkan';
        document.getElementById('outOfRange').style.display = 'block';
        showToast('❌ GPS wajib diaktifkan!'); state.userDistance = null;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  // ===================== CART ENGINE =====================
  function getCartSummary() {
    const items = []; let subtotal = 0; let totalQty = 0;
    Object.keys(state.cart).forEach(id => {
      const entry = state.cart[id]; const item = getItemById(id);
      if (item && entry && entry.qty > 0) {
        const lineTotal = item.price * entry.qty; subtotal += lineTotal; totalQty += entry.qty;
        items.push({ id, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice || null, lineTotal });
      } else { delete state.cart[id]; }
    });
    
    const discount = calculateDiscount(subtotal);
    const distance = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
    const isOutOfRange = distance > SYSTEM.MAX_DISTANCE;

    const estimatedShippingCost = state.selectedCourier ? state.selectedCourier.cost : 0;
    let appliedShippingCost = 0;
    // Logika harga ongkir masuk tagihan
    if (state.orderedBy === 'rujakco' && state.paymentMethod === 'digabung_qris') { 
        appliedShippingCost = estimatedShippingCost; 
    }

    const qrisTotal = subtotal - discount + appliedShippingCost;
    return { items, totalQty, subtotal, discount, shippingCost: estimatedShippingCost, appliedShippingCost, shippingDistance: distance, qrisTotal, isOutOfRange };
  }

  function updateCustomerSummaryUI() {
    const form = document.getElementById('customerFormFields');
    const text = document.getElementById('customerSummaryText');
    const icon = document.getElementById('customerSummaryIcon');
    if (!form || !text) return;
    
    if (state.isCustomerFormOpen) {
      form.style.display = 'block'; 
      text.textContent = 'Isi Data Pengiriman'; 
      if(icon) icon.style.transform = 'rotate(180deg)';
    } else {
      form.style.display = 'none'; 
      const name = state.customerName.trim();
      text.textContent = name ? name : 'Data Belum Lengkap'; 
      if(icon) icon.style.transform = 'rotate(0deg)';
    }
  }

  // ===================== UI RENDER =====================
  function renderMenu() {
    const container = document.getElementById('menuList'), empty = document.getElementById('emptyState'), skeleton = document.getElementById('skeletonContainer');
    skeleton.style.display = 'none'; container.style.display = 'block';
    if (state.activeFilter === 'addon') { container.innerHTML = ''; empty.style.display = 'none'; return; }
    let filtered = PRODUCTS.filter(p => { const matchCat = (state.activeFilter === 'all' || p.cat === state.activeFilter); const q = state.searchQuery.toLowerCase(); return matchCat && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)); });
    if (state.searchQuery.toLowerCase().includes('vip')) { if (!filtered.some(p => p.id === 'p_vip')) filtered = [VIP_PRODUCT, ...filtered]; }
    if (!filtered.length) { empty.style.display = 'block'; container.innerHTML = ''; return; }
    empty.style.display = 'none'; let html = '';
    filtered.forEach(p => {
      let qty = 0; let firstCartKey = p.id;
      Object.keys(state.cart).forEach(k => { if (k === p.id || k.startsWith(p.id + '_')) { qty += state.cart[k].qty; if (qty === state.cart[k].qty) firstCartKey = k; } });
      const control = qty === 0 ? `<button type="button" class="add-btn" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${firstCartKey}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${firstCartKey}">+</button></div>`;
      const badgeRight = p.badge ? `<span class="item-badge-right ${p.badgeColor}">${p.badge}</span>` : '';
      const flavorTag = p.flavorTag ? `<span class="item-flavor-tag">${p.flavorTag}</span>` : '';
      const buahChips = (p.buah || []).slice(0, 4).map(b => `<span class="item-buah-chip">${b}</span>`).join('');
      const moreChips = (p.buah || []).length > 4 ? `<span class="item-buah-chip">+${p.buah.length - 4}</span>` : '';
      html += `<div class="menu-item" data-id="${p.id}" tabindex="0" role="button" aria-label="Detail ${p.name}"><div class="item-img-wrap"><img src="${p.thumbnail}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';"><div class="fallback" style="display:none;">${p.name.substring(0,20)}</div></div><div class="item-body"><div class="item-name-row"><span class="item-name">${p.name}</span>${badgeRight}</div><div class="item-flavor-row"><span class="item-flavor">${p.flavor}</span>${flavorTag}</div><div class="item-spice">🌶️ Level 1–5</div><p class="item-desc">${p.desc}</p><div class="item-buah-chips">${buahChips}${moreChips}</div><div class="item-footer"><div><span class="item-price">${fmt(p.price)}</span><span class="item-portion"> · ${p.portion}</span></div>${control}</div></div></div>`;
    });
    container.innerHTML = html;
  }

  function renderAddons() {
    const container = document.getElementById('addonList'), q = state.searchQuery.toLowerCase();
    const filtered = ADDONS.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    let html = '';
    filtered.forEach(a => {
      const entry = state.cart[a.id]; const qty = entry ? entry.qty : 0;
      const control = qty === 0 ? `<button type="button" class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      html += `<div class="addon-card"><div class="addon-icon ${a.iconColor}"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div><div class="addon-name">${a.name}</div><div class="addon-desc">${a.desc}</div><div class="addon-footer"><span class="addon-price">${fmt(a.price)}</span>${control}</div></div>`;
    });
    container.innerHTML = html;
    const header = document.getElementById('addonHeader'), divider = document.getElementById('addonDivider'), show = filtered.length > 0;
    header.style.display = show ? 'flex' : 'none'; divider.style.display = show ? 'block' : 'none';
  }

  function renderCart() {
    const summary = getCartSummary();
    const container = document.getElementById('progressContainer');
    if (summary.subtotal >= SYSTEM.DISCOUNT_THRESHOLD) { container.style.display = 'none'; } else {
      const remaining = SYSTEM.DISCOUNT_THRESHOLD - summary.subtotal; const progressPercent = Math.min(100, Math.round((summary.subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
      container.style.display = 'block'; document.getElementById('progressLabel').textContent = `Tambah ${fmt(remaining)} lagi untuk diskon`; document.getElementById('progressPercent').textContent = progressPercent + '%'; document.getElementById('progressFill').style.width = progressPercent + '%'; document.getElementById('progressFill').style.background = progressPercent >= 80 ? 'var(--green)' : 'var(--red)';
    }
    const missionSpend = document.getElementById('missionSpend'), checkShare = document.getElementById('checkShare');
    if (missionSpend) missionSpend.checked = summary.subtotal >= SYSTEM.DISCOUNT_THRESHOLD; if (checkShare) checkShare.checked = state.hasShared;
    
    const bar = document.getElementById('bottom-bar'), discountLabel = document.getElementById('discountLabel'), totalEl = document.getElementById('cartTotalDisplay'), footerEl = document.querySelector('.footer-brand');
    if (summary.totalQty > 0 && !state.isCartMinimized) {
      bar.classList.add('visible'); if (footerEl) footerEl.style.paddingBottom = '180px';
      document.getElementById('cartPreview').textContent = summary.totalQty + ' item' + (summary.totalQty > 1 ? 's' : '');
      if (summary.discount > 0) { discountLabel.style.display = 'inline-block'; discountLabel.textContent = '-Rp' + summary.discount.toLocaleString('id-ID'); totalEl.innerHTML = `<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;margin-right:4px;">${fmt(summary.subtotal)}</span>${fmt(summary.subtotal - summary.discount)}`; } else { discountLabel.style.display = 'none'; totalEl.textContent = fmt(summary.subtotal); }
    } else { bar.classList.remove('visible'); if (footerEl) footerEl.style.paddingBottom = '0'; }
    saveCart(); updateFloatingButton();
  }

  function renderMiniCart() {
    updateCustomerSummaryUI(); // Mengontrol tutup/buka Accordion
    const summary = getCartSummary();
    const list = document.getElementById('miniCartList'), finalTotal = document.getElementById('miniCartFinalTotal'), warningEl = document.getElementById('ongkirWarning');

    document.getElementById('orderNotes').value = state.orderNotes;
    document.getElementById('customerName').value = state.customerName;
    document.getElementById('customerPhone').value = state.customerPhone;
    document.getElementById('customerAddress').value = state.customerAddress;
    document.getElementById('giftToggle').checked = state.isGift;
    document.getElementById('giftFields').style.display = state.isGift ? 'block' : 'none';

    const radioBayarKurir = document.getElementById('payBayarKurir'); const radioGabungQRIS = document.getElementById('payGabungQRIS');
    if (radioBayarKurir) radioBayarKurir.checked = (state.paymentMethod === 'bayar_kurir');
    if (radioGabungQRIS) radioGabungQRIS.checked = (state.paymentMethod === 'digabung_qris');
    if (state.paymentMethod === 'bayar_kurir') { if (warningEl) warningEl.style.display = 'block'; } else { if (warningEl) warningEl.style.display = 'none'; }

    let html = '';
    if (summary.items.length === 0) { html = '<p style="color:var(--gray-500);text-align:center;padding:20px 0;">Keranjang kosong</p>'; } else {
      summary.items.forEach(item => { const spiceText = item.spice ? ' (Level ' + item.spice + ')' : ''; html += `<div class="mini-cart-item"><div class="mini-cart-info"><div class="mini-cart-name">${item.name}${spiceText}</div><div class="mini-cart-detail">${fmt(item.price)}</div></div><div class="mini-cart-qty"><button data-action="decrease" data-id="${item.id}">−</button><span>${item.qty}</span><button data-action="increase" data-id="${item.id}">+</button><button class="mini-cart-remove" data-action="remove" data-id="${item.id}">🗑️</button></div></div>`; });
    }
    list.innerHTML = html;
    finalTotal.textContent = fmt(summary.qrisTotal);

    const btnPay = document.getElementById('btnOpenPayment');
    if (state.userDistance === null) { btnPay.disabled = true; btnPay.style.opacity = '0.5'; btnPay.textContent = '📍 Butuh GPS untuk Checkout'; }
    else if (summary.isOutOfRange) { btnPay.disabled = true; btnPay.style.opacity = '0.5'; btnPay.textContent = 'Di luar jangkauan'; }
    else if (summary.items.length === 0) { btnPay.disabled = true; btnPay.style.opacity = '0.5'; btnPay.textContent = 'Keranjang kosong'; }
    else if (state.isCustomerFormOpen && !state.customerName.trim()) { btnPay.disabled = true; btnPay.style.opacity = '0.5'; btnPay.textContent = 'Lengkapi Data Dulu'; }
    else { btnPay.disabled = false; btnPay.style.opacity = '1'; btnPay.textContent = 'Bayar Via QRIS'; }

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  function updateUI() { renderMenu(); renderAddons(); renderCart(); if (document.getElementById('miniCartModal').classList.contains('active')) renderMiniCart(); updateClearButton(); updateFloatingButton(); if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons(); }

  // ===================== MODALS =====================
  const productModal = document.getElementById('productModal'); let currentProductId = null; const SPICE_NAMES = ['Mild', 'Sedang', 'Pedas', 'Extra Pedas', 'Very Hot'];
  function openProductModal(id) {
    const product = PRODUCTS.find(p => p.id === id) || VIP_PRODUCT; if (!product) return; currentProductId = id;
    document.getElementById('modalImg').innerHTML = `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none';">`;
    const badgeEl = document.getElementById('modalBadge'); if (product.badge) { badgeEl.style.display = 'inline-block'; badgeEl.textContent = product.badge; badgeEl.className = 'modal-badge-eyebrow ' + (product.badgeColor || ''); } else badgeEl.style.display = 'none';
    document.getElementById('modalTitle').textContent = product.name; document.getElementById('modalDesc').textContent = product.desc; document.getElementById('modalContainer').textContent = product.container || '-'; document.getElementById('modalSize').textContent = product.size || '-'; document.getElementById('modalSambal').textContent = product.sambal || '-'; document.getElementById('modalBuahText').textContent = (product.buah || []).join(', '); document.getElementById('modalTags').innerHTML = (product.tags || []).map(t => `<span class="modal-tag">${t}</span>`).join(''); document.getElementById('btnPrice').textContent = fmt(product.price); document.getElementById('modalAdd').dataset.id = product.id;
    const select = document.getElementById('spiceSelect'); const defaultVal = product.defaultSpice || 3; select.value = defaultVal; updateSpiceHighlight(defaultVal); select.onchange = function() { updateSpiceHighlight(parseInt(this.value, 10)); }; productModal.classList.add('active'); document.body.style.overflow = 'hidden';
  }
  function updateSpiceHighlight(level) { document.getElementById('modalSpiceLabel').textContent = level + ' - ' + (SPICE_NAMES[level - 1] || 'Pedas'); }
  function closeProductModal() { productModal.classList.remove('active'); document.body.style.overflow = ''; currentProductId = null; }
  const miniCartModal = document.getElementById('miniCartModal');
  function openMiniCart() { renderMiniCart(); miniCartModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeMiniCart() { state.orderNotes = document.getElementById('orderNotes').value; state.customerName = document.getElementById('customerName').value.trim(); state.customerPhone = document.getElementById('customerPhone').value.trim(); state.customerAddress = document.getElementById('customerAddress').value.trim(); state.isGift = document.getElementById('giftToggle').checked; state.giftSender = document.getElementById('giftSender').value.trim(); state.giftMessage = document.getElementById('giftMessage').value.trim(); miniCartModal.classList.remove('active'); document.body.style.overflow = ''; saveCustomerData(); }
  function clearCart() { if (Object.keys(state.cart).length === 0) return showToast('Keranjang sudah kosong'); if (confirm('Yakin ingin mengosongkan keranjang?')) { state.cart = {}; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); showToast('Keranjang dikosongkan'); } }

  // ===================== CHECKOUT & DB =====================
  async function saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount) {
    if (!supabase) return false;
    try {
      const payload = { customer_name: state.customerName || 'Guest', customer_phone: state.customerPhone || '', customer_address: state.customerAddress || '', items: orderItems, subtotal, shipping_cost: shippingCost, discount, total, status: 'pending', is_gift: state.isGift, gift_sender: state.giftSender || null, gift_message: state.giftMessage || null, mission_shared: state.hasShared, delivery_type: state.deliveryType, delivery_date: state.deliveryDate, delivery_time: state.deliveryTime, courier: state.selectedCourier ? state.selectedCourier.name : '', payment_method: state.paymentMethod };
      const { error } = await supabase.from('orders').insert([payload]); if (error) throw error; return true;
    } catch (err) { return false; }
  }

  function handleCheckout() {
    const summary = getCartSummary();
    if (summary.isOutOfRange) return showToast('Maaf, pengiriman hanya tersedia untuk Jabodetabek');
    const name = state.customerName.trim(), phone = state.customerPhone.trim(), address = state.customerAddress.trim();
    if (!name || name.length < 2) { state.isCustomerFormOpen=true; updateCustomerSummaryUI(); return showToast('❌ Nama penerima wajib diisi'); }
    if (!phone || phone.length < 8) { state.isCustomerFormOpen=true; updateCustomerSummaryUI(); return showToast('❌ Nomor HP wajib diisi'); }
    if (!address || address.length < 5) { state.isCustomerFormOpen=true; updateCustomerSummaryUI(); return showToast('❌ Alamat wajib diisi'); }
    if (summary.items.length === 0) return showToast('Keranjang kosong');

    const payBtn = document.querySelector('[data-action="confirm-wa"]'); if (payBtn) payBtn.textContent = '⏳ Menyimpan...';
    saveOrderToDatabase(summary.items, summary.qrisTotal, summary.subtotal, summary.shippingCost, summary.discount).finally(() => {
        let msg = 'Halo Rujak.Co! Saya ingin memesan:\n\n';
        summary.items.forEach(item => { const spiceText = item.spice ? ' (Level ' + item.spice + ')' : ''; msg += '• ' + item.name + spiceText + ' (x' + item.qty + ') — ' + fmt(item.lineTotal) + '\n'; });
        
        let timeStr = state.deliveryType === 'po' ? `Terjadwal (PO) - Tanggal: ${state.deliveryDate || '-'}, Jam: ${state.deliveryTime || '-'}` : 'Kirim Segera (Hari Ini)';
        msg += '\n*Jadwal:* ' + timeStr + '\n';
        
        msg += '\n*Sistem Pengiriman:* ';
        if (state.orderedBy === 'pembeli') {
            msg += 'Kurir Dipesan Pembeli\n_(Pembeli order ojek mandiri setelah dikonfirmasi)_\n';
        } else {
            msg += 'Kurir Dipesan Rujak.Co\n';
            if (state.selectedCourier) msg += 'Layanan: ' + state.selectedCourier.name + ' — Estimasi: ' + fmt(state.selectedCourier.cost) + '\n';
            msg += 'Pembayaran Ongkir: ' + (state.paymentMethod === 'bayar_kurir' ? 'Bayar Tunai ke Kurir' : 'Digabung ke QRIS') + '\n';
            if (state.paymentMethod === 'bayar_kurir') msg += '⚠️ *Ongkir dibayar terpisah saat kurir sampai.*\n';
        }

        if (state.orderNotes) msg += '\n*Catatan Pesanan:*\n' + state.orderNotes;
        if (state.isGift) { msg += '\n\n🎁 *PESANAN KADO*\n'; if (state.giftSender) msg += 'Dari: ' + state.giftSender + '\n'; if (state.giftMessage) msg += 'Ucapan: ' + state.giftMessage; }
        
        msg += '\n\n*Data Pengiriman:*\nNama : ' + name + '\nNo. HP : ' + phone + '\nAlamat : ' + address + '\n';
        msg += '\nSubtotal: ' + fmt(summary.subtotal);
        if (summary.discount > 0) msg += '\nDiskon Misi Jajan: -' + fmt(summary.discount);
        msg += '\n*Total Tagihan QRIS: ' + fmt(summary.qrisTotal) + '*\n\n';
        
        if (state.orderedBy === 'rujakco' && state.paymentMethod === 'digabung_qris') msg += '_(Sudah termasuk ongkir: ' + fmt(summary.appliedShippingCost) + ')_\n\n';
        
        msg += '*Saya sudah transfer via QRIS, ini bukti transfernya:*\n*(sertakan foto)*';
        window.location.href = 'https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg);
      });
  }

  // ===================== EVENT BINDING =====================
  function saveCustomerData() { try { localStorage.setItem('rujak_customer', JSON.stringify({ name: state.customerName, phone: state.customerPhone, address: state.customerAddress, isGift: state.isGift, giftSender: state.giftSender, giftMessage: state.giftMessage, hasShared: state.hasShared })); } catch (_) {} }
  function loadCustomerData() { try { const raw = localStorage.getItem('rujak_customer'); if (raw) { const data = JSON.parse(raw); state.customerName = data.name || ''; state.customerPhone = data.phone || ''; state.customerAddress = data.address || ''; state.isGift = data.isGift || false; state.giftSender = data.giftSender || ''; state.giftMessage = data.giftMessage || ''; state.hasShared = data.hasShared || false; if(state.customerName) state.isCustomerFormOpen = false; } } catch (_) {} }
  function updateClearButton() { document.getElementById('clearSearchBtn').classList.toggle('visible', document.getElementById('searchInput').value.length > 0); }
  function updateFloatingButton() { const btn = document.getElementById('floatingCartBtn'), badge = document.getElementById('floatingBadge'), summary = getCartSummary(); if (state.isCartMinimized && summary.totalQty > 0) { btn.classList.add('visible'); badge.textContent = summary.totalQty; } else btn.classList.remove('visible'); }
  function minimizeCart() { state.isCartMinimized = true; localStorage.setItem('rujak_cart_minimized', 'true'); document.getElementById('bottom-bar').classList.remove('visible'); updateFloatingButton(); const footerEl = document.querySelector('.footer-brand'); if (footerEl) footerEl.style.paddingBottom = '0'; }
  function expandCart() { state.isCartMinimized = false; localStorage.setItem('rujak_cart_minimized', 'false'); updateFloatingButton(); renderCart(); }
  let toastTimer; function showToast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), SYSTEM.TOAST_DURATION); }

  function bindEvents() {
    // Event listener Accordion Data Pelanggan
    document.getElementById('customerSummaryToggle').addEventListener('click', function() { state.isCustomerFormOpen = !state.isCustomerFormOpen; updateCustomerSummaryUI(); });
    document.getElementById('btnSaveCustomer').addEventListener('click', function() {
      state.customerName = document.getElementById('customerName').value.trim(); state.customerPhone = document.getElementById('customerPhone').value.trim(); state.customerAddress = document.getElementById('customerAddress').value.trim(); state.orderNotes = document.getElementById('orderNotes').value;
      if(state.customerName && state.customerPhone && state.customerAddress) { state.isCustomerFormOpen = false; saveCustomerData(); updateCustomerSummaryUI(); renderMiniCart(); } else { showToast('Harap lengkapi nama, no HP, & alamat'); if(!state.customerName) document.getElementById('customerName').focus(); else if(!state.customerPhone) document.getElementById('customerPhone').focus(); else document.getElementById('customerAddress').focus(); }
    });

    const btnOrderPembeli = document.getElementById('btnOrderPembeli'), btnOrderRujakCo = document.getElementById('btnOrderRujakCo'), rujakCoWrap = document.getElementById('rujakCoShippingWrap'), pembeliWrap = document.getElementById('pembeliShippingWrap');
    if(btnOrderPembeli && btnOrderRujakCo) {
        btnOrderPembeli.addEventListener('click', function() { state.orderedBy = 'pembeli'; this.classList.add('active'); btnOrderRujakCo.classList.remove('active'); rujakCoWrap.style.display = 'none'; pembeliWrap.style.display = 'block'; updateShippingUI(state.userDistance); renderMiniCart(); });
        btnOrderRujakCo.addEventListener('click', function() { state.orderedBy = 'rujakco'; this.classList.add('active'); btnOrderPembeli.classList.remove('active'); rujakCoWrap.style.display = 'block'; pembeliWrap.style.display = 'none'; updateShippingUI(state.userDistance); renderMiniCart(); });
    }

    const btnSekarang = document.getElementById('btnWaktuSekarang'), btnPO = document.getElementById('btnWaktuPO'), poWrap = document.getElementById('poScheduleWrap');
    if (btnSekarang && btnPO && poWrap) {
      btnSekarang.addEventListener('click', function() { state.deliveryType = 'segera'; this.classList.add('active'); btnPO.classList.remove('active'); poWrap.style.display = 'none'; });
      btnPO.addEventListener('click', function() { state.deliveryType = 'po'; this.classList.add('active'); btnSekarang.classList.remove('active'); poWrap.style.display = 'flex'; if (!state.deliveryDate) { let tmr = new Date(); tmr.setDate(tmr.getDate() + 1); const dateStr = tmr.toISOString().split('T')[0]; document.getElementById('poDate').value = dateStr; state.deliveryDate = dateStr; } });
      document.getElementById('poDate').addEventListener('change', e => state.deliveryDate = e.target.value); document.getElementById('poTime').addEventListener('change', e => state.deliveryTime = e.target.value);
    }

    const courierSel = document.getElementById('courierSelect');
    if (courierSel) { courierSel.addEventListener('change', function() { const selectedId = this.value; const selected = state.courierRates.find(c => c.id === selectedId); if (selected) { state.selectedCourier = selected; document.getElementById('shippingCost').textContent = fmt(selected.cost); renderMiniCart(); } }); }
    
    const radioBayarKurir = document.getElementById('payBayarKurir'), radioGabungQRIS = document.getElementById('payGabungQRIS');
    if (radioBayarKurir) { radioBayarKurir.addEventListener('change', function() { if (this.checked) { state.paymentMethod = 'bayar_kurir'; renderMiniCart(); } }); }
    if (radioGabungQRIS) { radioGabungQRIS.addEventListener('change', function() { if (this.checked) { state.paymentMethod = 'digabung_qris'; renderMiniCart(); } }); }

    document.getElementById('modalAdd').addEventListener('click', function() { const baseId = this.dataset.id; if (baseId) { const spice = parseInt(document.getElementById('spiceSelect').value, 10) || 3; const cartKey = baseId + '_' + spice; const entry = state.cart[cartKey] || { qty: 0, spice: spice }; entry.qty += 1; entry.spice = spice; state.cart[cartKey] = entry; updateUI(); showToast('Berhasil ditambahkan ✓'); closeProductModal(); } });
    document.getElementById('shareBtnModal').addEventListener('click', function() { state.hasShared = true; saveCustomerData(); updateUI(); showToast('Diskon Rp5.000 berhasil diaktifkan!'); shareToWhatsApp(); });
    document.getElementById('promoTrigger').addEventListener('click', openPromoModal); document.getElementById('promoClose').addEventListener('click', closePromoModal); promoModal.addEventListener('click', function(e) { if (e.target === promoModal) closePromoModal(); });
    document.getElementById('closeBottomBar').addEventListener('click', e => { e.stopPropagation(); minimizeCart(); }); document.getElementById('floatingCartBtn').addEventListener('click', expandCart);

    const searchToggleWrap = document.getElementById('searchToggleWrap'), searchIconBtn = document.getElementById('searchIconBtn'), searchInputWrap = document.getElementById('searchInputWrap');
    if (searchIconBtn) { searchIconBtn.addEventListener('click', () => { searchInputWrap.classList.toggle('open'); if (searchInputWrap.classList.contains('open')) searchInput.focus(); }); document.addEventListener('click', (e) => { if (!searchToggleWrap.contains(e.target)) searchInputWrap.classList.remove('open'); }); }
    ['customerName', 'customerPhone', 'customerAddress', 'giftSender', 'giftMessage'].forEach(id => { document.getElementById(id).addEventListener('input', function() { state[id] = this.value.trim(); saveCustomerData(); }); });
    document.getElementById('orderNotes').addEventListener('input', function() { state.orderNotes = this.value; }); document.getElementById('giftToggle').addEventListener('change', function() { state.isGift = this.checked; document.getElementById('giftFields').style.display = this.checked ? 'block' : 'none'; saveCustomerData(); });
    searchInput.addEventListener('input', debounce(function() { state.searchQuery = this.value; updateUI(); updateClearButton(); }, 300)); searchInput.addEventListener('keyup', updateClearButton);

    document.addEventListener('click', function(e) {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const { action, id } = actionBtn.dataset;
        if (action === 'open-modal' && id) return openProductModal(id); if (action === 'open-cart') return openMiniCart(); if (action === 'add-addon' && id) { state.cart[id] = state.cart[id] || { qty: 0 }; state.cart[id].qty++; updateUI(); showToast('Berhasil ditambahkan ✓'); return; } if (action === 'increase' && id && state.cart[id]) { state.cart[id].qty++; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); return; } if (action === 'decrease' && id && state.cart[id]) { state.cart[id].qty--; if (state.cart[id].qty <= 0) delete state.cart[id]; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); return; } if (action === 'remove' && id && state.cart[id]) { delete state.cart[id]; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); showToast('Item dihapus'); return; } if (action === 'confirm-wa') return handleCheckout(); if (action === 'toast') return showToast(actionBtn.dataset.msg); if (action === 'share') return shareToWhatsApp(); if (action === 'open-promo') return openPromoModal();
      }
      if (e.target.closest('#btnOpenPayment')) {
        if (getCartSummary().items.length === 0) return showToast('Keranjang kosong');
        if (state.userDistance === null) return showToast('Mohon tunggu, menghitung jarak pengiriman...');
        if (state.userDistance > SYSTEM.MAX_DISTANCE) return showToast('Maaf, pengiriman di luar jangkauan');
        if (state.isCustomerFormOpen && !state.customerName.trim()) { showToast('Harap "Simpan & Lipat" data pengiriman dulu'); document.getElementById('customerName').focus(); return; }
        document.getElementById('paymentTotalDisplay').textContent = document.getElementById('miniCartFinalTotal').textContent; closeMiniCart(); document.getElementById('paymentModal').classList.add('active'); document.body.style.overflow = 'hidden'; return;
      }
      const menuItem = e.target.closest('.menu-item'); if (menuItem && !e.target.closest('.add-btn') && !e.target.closest('.qty-btn')) return openProductModal(menuItem.dataset.id);
      const catBtn = e.target.closest('.cat-pill'); if (catBtn && catBtn.dataset.cat) { document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active')); catBtn.classList.add('active'); state.activeFilter = catBtn.dataset.cat; updateUI(); return; }
      const faqToggle = e.target.closest('[data-toggle="faq"]'); if (faqToggle) return faqToggle.closest('.faq-item')?.classList.toggle('open');
      if (e.target.closest('#modalClose') || e.target === productModal) return closeProductModal(); if (e.target.closest('#miniCartClose') || e.target === miniCartModal) return closeMiniCart(); if (e.target.closest('#paymentClose') || e.target === document.getElementById('paymentModal')) { document.getElementById('paymentModal').classList.remove('active'); document.body.style.overflow = ''; return; } if (e.target.closest('#clearCartBtn')) return clearCart(); if (e.target.closest('.cart-summary')) return openMiniCart();
      if (e.target.closest('#downloadQrisBtnPayment')) { const url = document.getElementById('qrisImagePayment').src; fetch(url).then(r => r.blob()).then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'QRIS-RujakCo.jpg'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href); }).catch(() => { window.location.href = url; }); showToast('Gambar QRIS sedang diunduh...'); return; }
      if (e.target.closest('#clearSearchBtn')) { searchInput.value = ''; state.searchQuery = ''; updateUI(); updateClearButton(); return; }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (productModal.classList.contains('active')) closeProductModal(); if (miniCartModal.classList.contains('active')) closeMiniCart(); if (document.getElementById('paymentModal').classList.contains('active')) { document.getElementById('paymentModal').classList.remove('active'); document.body.style.overflow = ''; } if (promoModal.classList.contains('active')) closePromoModal(); } });
    const qrisImg = document.getElementById('qrisImagePayment'); qrisImg.addEventListener('click', function() { this.classList.toggle('qr-zoomed'); }); qrisImg.addEventListener('dblclick', function() { this.classList.toggle('qr-zoomed'); });
    window.addEventListener('scroll', () => { document.getElementById('header')?.classList.toggle('shadowed', window.scrollY > 4); });
  }

  // ===================== INIT =====================
  function init() {
    loadCart(); loadCustomerData(); updateStoreStatus(); document.getElementById('shareStrip').style.display = 'none';
    try { const s = localStorage.getItem('rujak_cart_minimized'); if (s !== null) state.isCartMinimized = s === 'true'; } catch (_) {}
    document.getElementById('customerName').value = state.customerName; document.getElementById('customerPhone').value = state.customerPhone; document.getElementById('customerAddress').value = state.customerAddress; document.getElementById('giftToggle').checked = state.isGift; document.getElementById('giftSender').value = state.giftSender; document.getElementById('giftMessage').value = state.giftMessage; document.getElementById('giftFields').style.display = state.isGift ? 'block' : 'none';
    
    // Pastikan status kurir dire-set dengan benar saat halaman direfresh
    state.orderedBy = 'pembeli'; 
    state.paymentMethod = 'bayar_kurir';
    
    updateUI(); detectLocation(); bindEvents();
    if ('serviceWorker' in navigator) { navigator.serviceWorker.addEventListener('message', event => { if (event.data && event.data.type === 'SW_UPDATED') { showToast('🔄 Versi baru tersedia! Segarkan halaman.'); } }); }
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons(); else { const int = setInterval(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) { lucide.createIcons(); clearInterval(int); } }, 100); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
