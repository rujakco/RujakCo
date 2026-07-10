(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO v4.0 — LUXURY MINIMALIST (FULL)
  // ============================================================

  // ---------- HELPER ----------
  const $ = (id) => document.getElementById(id);
  const escapeHTML = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const fmt = (num) => 'Rp' + Number(num).toLocaleString('id-ID');
  const debounce = (fn, delay) => { let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); }; };

  function normalizePhone(phone) {
    const cleaned = String(phone || '').replace(/[\s\-\(\)\.]/g, '');
    if (/^08[1-9][0-9]{7,10}$/.test(cleaned)) return '62' + cleaned.slice(1);
    if (/^\+628[1-9][0-9]{7,10}$/.test(cleaned)) return cleaned.slice(1);
    if (/^628[1-9][0-9]{7,10}$/.test(cleaned)) return cleaned;
    return cleaned;
  }

  function isValidPhone(phone) {
    const cleaned = String(phone || '').replace(/[\s\-\(\)\.]/g, '');
    return /^(08[1-9][0-9]{7,10}|\+628[1-9][0-9]{7,10}|628[1-9][0-9]{7,10})$/.test(cleaned);
  }

  function showToast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    if (window._toastTimer) clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // ---------- SUPABASE ----------
  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";
  let supabase = null;
  async function getSupabase() {
    if (supabase) return supabase;
    if (window.supabase?.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return supabase;
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = () => {
        if (window.supabase?.createClient) {
          supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
          resolve(supabase);
        } else resolve(null);
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }

  // ---------- DATA ----------
  const PRODUCTS = [
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original Rujak.Co.', price:35000, cat:'classic', container:'Thinwall 1000ml', size:'Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Segar & Autentik', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp', isHidden:false },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk pengalaman rasa yang lebih menyatu.', price:26000, cat:'classic', container:'Thinwall 750ml', size:'Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Merah'], flavor:'Renyah Segar', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp', isHidden:false },
    { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah pilihan dengan sambal mete premium.', price:40000, cat:'signature', container:'Thinwall 1000ml', size:'Reguler', sambal:'Sambal Mete Premium (1 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp', isHidden:false },
    { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah untuk dua hingga tiga orang.', price:48000, cat:'signature', container:'Thinwall Jumbo 1000ml', size:'Sharing', sambal:'Sambal Mete Premium (2 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Extra', defaultSpice:4, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp', isHidden:false },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi premium dengan Shine Muscat.', price:85000, cat:'reserve', container:'Thinwall Jumbo + Paper Bag', size:'Premium', sambal:'Sambal Mete Premium (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Eksklusif', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:false },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Sajian kebersamaan dalam tampah bambu.', price:200000, cat:'reserve', container:'Tampah Bambu Ø40cm', size:'Besar', sambal:'Varian Original & Mete (4 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi Merah'], flavor:'Megah', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp', isHidden:false },
    { id:'p_vip', name:'Mahkota VIP', desc:'Menu rahasia eksklusif dengan komposisi premium.', price:125000, cat:'reserve', container:'Box Premium', size:'Eksklusif', sambal:'Sambal Mete Spesial (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Harum Manis','Nanas Madu','Bengkoang','Strawberry'], flavor:'Premium', defaultSpice:2, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:true }
  ];

  const ADDONS = [
    { id:'a_sambal1', name:'Sambal Original', price:8000 },
    { id:'a_sambal2', name:'Sambal Mete Premium', price:12000 },
    { id:'a_extra_jambu', name:'Extra Jambu Kristal', price:10000 },
    { id:'a_extra_muscat', name:'Extra Shine Muscat', price:15000 }
  ];

  const SYSTEM = {
    STORE_LAT: -6.2165414,
    STORE_LNG: 107.0177395,
    WA_NUMBER: '6289677161680',
    TOAST_DURATION: 3000,
    PRIORITY_SURCHARGE: 8000,
    MAX_DISTANCE: 9999,
    DEFAULT_DISTANCE: 2,
    LOCATION_TIMEOUT: 12000
  };

  const DISTRICT_MAP = {
    'bekasi barat':5, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11,
    'rawalumbu':8, 'jatiasih':12, 'pondokgede':14, 'cikarang':23,
    'tambun':16, 'cibitung':20, 'karawang':44, 'cikampek':60,
    'serang':63, 'cilegon':80,
    'gambir':18, 'menteng':19, 'senen':18, 'cempaka putih':19,
    'kemayoran':20, 'sawah besar':20, 'taman sari':21, 'tanah abang':20,
    'setiabudi':19, 'tebet':20, 'pancoran':21, 'pasar minggu':22,
    'kebayoran lama':24, 'kebayoran baru':22, 'mampang prapatan':21,
    'jagakarsa':23, 'cilandak':24, 'pesanggrahan':25,
    'pulo gadung':16, 'jatinegara':18, 'duren sawit':15,
    'kramat jati':19, 'pasar rebo':20, 'ciracas':22,
    'cipayung':23, 'makasar':16, 'cakung':12,
    'tambora':24, 'grogol petamburan':23, 'palmerah':22,
    'kembangan':25, 'cengkareng':28, 'kalideres':30,
    'kemanggisan':23, 'kedoya':25, 'meruya':25,
    'penjaringan':30, 'pademangan':28, 'tanjung priok':29,
    'koja':30, 'cilincing':31, 'kelapa gading':27,
    'depok':35, 'beji':36, 'pancoran mas':36, 'cipayung depok':38,
    'sukmajaya':38, 'cilodong':39, 'limo':40, 'cinere':41,
    'cimanggis':34, 'tapos':36, 'sawangan':42, 'bojongsari':44,
    'tangerang':38, 'tangerang selatan':34, 'batuceper':39,
    'benda':40, 'cibodas':39, 'ciledug':35, 'cipondoh':38,
    'jatiuwung':41, 'karawaci':39, 'periuk':40, 'pinang':38,
    'serpong':40, 'serpong utara':41, 'pamulang':38,
    'pondok aren':36, 'ciputat':35, 'ciputat timur':36,
    'bogor':50, 'bogor barat':50, 'bogor selatan':49,
    'bogor timur':50, 'bogor utara':48, 'tanah sareal':49,
    'ciawi':54, 'cibinong':47, 'citeureup':50,
    'gunung putri':44, 'cileungsi':41, 'jonggol':56,
    'parung':52, 'dramaga':60
  };

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    cart: {},
    activeFilter: 'all',
    searchQuery: '',
    userDistance: null,
    isPriority: false,
    orderNotes: '',
    isCartMinimized: false,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    isGift: false,
    giftSender: '',
    giftMessage: '',
    useManualDistrict: false,
    selectedDistrict: '',
    hasShared: false,
    shippingProvider: 'rujakco',
    vehicleType: 'motor'
  };

  let addToCartLocked = false;
  let checkoutLocked = false;
  let cachedSummary = null;
  let cachedSummaryKey = '';

  // ============================================================
  // CART & STORAGE
  // ============================================================
  function loadCart() {
    try { const s = localStorage.getItem('rujak_cart'); if (s) state.cart = JSON.parse(s); } catch (_) { state.cart = {}; }
  }
  function saveCart() { try { localStorage.setItem('rujak_cart', JSON.stringify(state.cart)); } catch(e) {} }
  function getItemById(id) { return PRODUCTS.find(p => p.id === id) || ADDONS.find(a => a.id === id) || null; }

  function getCartSummary() {
    const items = []; let subtotal = 0, totalQty = 0;
    Object.keys(state.cart).forEach(id => {
      const entry = state.cart[id];
      const item = getItemById(id);
      if (item && entry.qty > 0) {
        const lt = item.price * entry.qty;
        subtotal += lt; totalQty += entry.qty;
        items.push({ cartId: id, id, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice, lineTotal: lt });
      } else delete state.cart[id];
    });
    return { items, totalQty, subtotal, discount: 0 };
  }

  function getCartSummaryCached() {
    const key = JSON.stringify(state.cart);
    if (cachedSummary && cachedSummaryKey === key) return cachedSummary;
    cachedSummary = getCartSummary();
    cachedSummaryKey = key;
    return cachedSummary;
  }
  function invalidateCache() { cachedSummary = null; }

  // ============================================================
  // SHIPPING
  // ============================================================
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function estimateRoadDistance(straightKm) {
    if (straightKm <= 10) return Math.round(straightKm * 1.35);
    if (straightKm <= 20) return Math.round(straightKm * 1.30);
    if (straightKm <= 35) return Math.round(straightKm * 1.25);
    if (straightKm <= 50) return Math.round(straightKm * 1.20);
    return Math.round(straightKm * 1.15);
  }

  function calculateLalamoveCost(distance, vehicleType) {
    const dist = Math.ceil(distance);
    if (vehicleType === 'motor') {
      if (dist <= 3) return 8000;
      if (dist <= 10) return 8000 + (dist - 3) * 1800;
      if (dist <= 20) return 20600 + (dist - 10) * 1600;
      if (dist <= 30) return 36600 + (dist - 20) * 1400;
      if (dist <= 50) return 50600 + (dist - 30) * 1150;
      return 73600 + (dist - 50) * 1000;
    } else {
      if (dist <= 3) return 24000;
      if (dist <= 10) return 24000 + (dist - 3) * 4500;
      if (dist <= 20) return 55500 + (dist - 10) * 4000;
      if (dist <= 30) return 95500 + (dist - 20) * 3500;
      if (dist <= 50) return 130500 + (dist - 30) * 3000;
      return 190500 + (dist - 50) * 2500;
    }
  }

  function calculatePaxelCost(distance, vehicleType, totalQty) {
    const qty = totalQty || 1;
    const large = Math.floor(qty / 2);
    const medium = qty % 2;
    return large * 25000 + medium * 20000 + (large + medium) * 3000;
  }

  function calculateShipping(distance, priority, totalQty) {
    if (state.shippingProvider === 'pembeli') {
      return { cost: 0, label: 'Kurir Pembeli', distance, zone: null };
    }
    const rawDistance = distance || SYSTEM.DEFAULT_DISTANCE;
    if (rawDistance > SYSTEM.MAX_DISTANCE) {
      return { cost: null, label: 'Admin Konfirmasi', distance: rawDistance, zone: 'E' };
    }
    let base = 0, total = 0, zone = 'F', label = '';
    if (state.shippingProvider === 'paxel') {
      total = base = calculatePaxelCost(rawDistance, state.vehicleType, totalQty);
      label = 'Paxel Same Day';
      if (rawDistance <= 20) zone = rawDistance <= 5 ? 'A' : rawDistance <= 10 ? 'B' : rawDistance <= 15 ? 'C' : 'D';
    } else {
      base = calculateLalamoveCost(rawDistance, state.vehicleType);
      total = base + (priority ? SYSTEM.PRIORITY_SURCHARGE : 0);
      label = (rawDistance <= 5 ? 'Zona A' : rawDistance <= 10 ? 'Zona B' : rawDistance <= 15 ? 'Zona C' : rawDistance <= 20 ? 'Zona D' : 'Zona Jauh') + ' • ' + (state.vehicleType === 'motor' ? 'Motor' : 'Mobil');
      if (rawDistance <= 20) zone = rawDistance <= 5 ? 'A' : rawDistance <= 10 ? 'B' : rawDistance <= 15 ? 'C' : 'D';
    }
    return { cost: total, lalamoveCost: base, label, distance: rawDistance, zone };
  }

  function calculateShippingCost() {
    const summary = getCartSummaryCached();
    if (!state.selectedDistrict && state.userDistance === null) return null;
    const dist = state.selectedDistrict ? (DISTRICT_MAP[state.selectedDistrict] || estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, -6.2, 106.8))) : state.userDistance;
    const shipping = calculateShipping(dist, state.isPriority, summary.totalQty);
    const cost = state.shippingProvider === 'pembeli' ? 0 : (shipping.cost === null ? 0 : shipping.cost);
    return {
      shippingCost: cost,
      shippingLabel: shipping.label,
      shippingDistance: shipping.distance,
      isOutOfRange: shipping.zone === 'E',
      total: summary.subtotal - summary.discount + cost
    };
  }

  // ============================================================
  // RENDER UI (MINIMALIS)
  // ============================================================
  function renderMenu() {
    const container = $('menuList');
    if (!container || state.activeFilter === 'addon') return;
    let filtered = state.searchQuery ? PRODUCTS.filter(p => !p.isHidden && (p.name.toLowerCase().includes(state.searchQuery) || p.flavor.toLowerCase().includes(state.searchQuery))) : PRODUCTS.filter(p => !p.isHidden);
    if (state.activeFilter !== 'all') filtered = filtered.filter(p => p.cat === state.activeFilter);
    let html = '';
    filtered.forEach(p => {
      html += `<div class="menu-item" data-id="${p.id}">
        <div class="item-img-wrap">
          <img src="${p.thumbnail}" alt="${escapeHTML(p.name)}" loading="lazy" />
          <div class="more-dot" data-action="open-modal" data-id="${p.id}">…</div>
        </div>
        <div class="item-name">${escapeHTML(p.name)}</div>
        <div class="item-price">${fmt(p.price)}</div>
      </div>`;
    });
    container.innerHTML = html || '<div style="padding:40px;text-align:center;color:var(--gray-500);">Tidak ditemukan.</div>';
  }

  function renderAddons() {
    const container = $('addonList');
    if (!container) return;
    let html = '';
    ADDONS.forEach(a => {
      const qty = (state.cart[a.id]?.qty) || 0;
      const btn = qty === 0
        ? `<button class="addon-add" data-action="add-addon" data-id="${a.id}">+</button>`
        : `<div class="qty-control" style="display:flex;align-items:center;gap:4px;margin-top:8px;"><button data-action="decrease" data-id="${a.id}">−</button><span style="font-weight:700;">${qty}</span><button data-action="increase" data-id="${a.id}">+</button></div>`;
      html += `<div class="addon-card">
        <div class="addon-name">${escapeHTML(a.name)}</div>
        <div class="addon-price">${fmt(a.price)}</div>
        ${btn}
      </div>`;
    });
    container.innerHTML = html;
  }

  function renderCart() {
    const summary = getCartSummaryCached();
    const bar = $('bottom-bar');
    const preview = $('cartPreview');
    const totalEl = $('cartTotalDisplay');
    if (summary.totalQty > 0 && !state.isCartMinimized) {
      bar.classList.add('visible');
      preview.textContent = summary.totalQty + ' item';
      totalEl.textContent = fmt(summary.subtotal);
      $('floatingCartBtn').style.display = 'none';
    } else {
      bar.classList.remove('visible');
    }
    saveCart();
    updateFloatingButton();
  }

  function updateFloatingButton() {
    const btn = $('floatingCartBtn'), badge = $('floatingBadge');
    if (!btn) return;
    const summary = getCartSummaryCached();
    const barVisible = $('bottom-bar').classList.contains('visible');
    if (summary.totalQty > 0 && !barVisible) {
      btn.style.display = 'flex';
      badge.textContent = summary.totalQty;
    } else {
      btn.style.display = 'none';
    }
  }

  function updateUI() {
    invalidateCache();
    renderMenu();
    renderAddons();
    renderCart();
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  // ============================================================
  // PRODUCT MODAL (DETAIL LENGKAP + SPICE)
  // ============================================================
  const SPICE_NAMES = ['Mild Sweet', 'Light Spice', 'Signature', 'Bold', 'Extreme'];
  function getSpiceEmoji(level) { return ['🌶️','🌶️🌶️','🌶️🌶️🌶️','🌶️🌶️🌶️🌶️','🌶️🌶️🌶️🌶️🌶️'][level-1] || '🌶️🌶️🌶️'; }

  function openProductModal(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;
    $('modalImg').innerHTML = `<img src="${product.image}" alt="${escapeHTML(product.name)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px;">`;
    $('modalTitle').textContent = product.name;
    $('modalDesc').textContent = product.desc;
    $('modalContainer').textContent = product.container;
    $('modalSize').textContent = product.size;
    $('modalSambal').textContent = product.sambal;
    $('modalBuahText').textContent = (product.buah || []).join(' • ');
    $('btnPrice').textContent = fmt(product.price);
    $('modalAdd').dataset.id = product.id;
    const spice = product.defaultSpice || 3;
    $('spiceHidden').value = spice;
    $('spiceLabel').innerHTML = spice + ' - ' + SPICE_NAMES[spice-1] + ' ' + getSpiceEmoji(spice);
    $('spiceTrigger').classList.add('selected');
    $('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    $('productModal').classList.remove('active');
    document.body.style.overflow = '';
  }

  // ============================================================
  // MINI CART & CHECKOUT
  // ============================================================
  const miniCartModal = $('miniCartModal');
  function openMiniCart() {
    miniCartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderMiniCart();
  }
  function closeMiniCart() {
    state.customerName = $('customerName').value.trim();
    state.customerPhone = $('customerPhone').value.trim();
    state.customerAddress = $('customerAddress').value.trim();
    state.orderNotes = $('orderNotes').value.trim();
    miniCartModal.classList.remove('active');
    document.body.style.overflow = '';
    saveCustomerData();
  }

  function updateShippingDisplay() {
    const data = calculateShippingCost();
    if (!data) { $('shippingSection').style.display = 'none'; return; }
    $('shippingSection').style.display = 'block';
    $('breakdownContent').innerHTML = data.isOutOfRange
      ? '⚠️ Di luar jangkauan.'
      : `Jarak: ${Math.ceil(data.shippingDistance)} km • ${data.shippingLabel}<br>Ongkir: <strong>${fmt(data.shippingCost)}</strong>`;
    $('finalSubtotal').textContent = fmt(getCartSummaryCached().subtotal);
    $('finalShipping').textContent = data.isOutOfRange ? 'Konfirmasi' : fmt(data.shippingCost);
    $('finalTotal').textContent = data.isOutOfRange ? 'Konfirmasi' : fmt(data.total);
  }

  function renderMiniCart() {
    const summary = getCartSummaryCached();
    let html = '';
    summary.items.forEach(item => {
      html += `<div class="mini-cart-item">
        <div class="mini-cart-info">
          <div class="mini-cart-name">${escapeHTML(item.name)} ${item.spice ? '(Lv.'+item.spice+')' : ''}</div>
          <div>${fmt(item.price)}</div>
        </div>
        <div class="mini-cart-qty">
          <button data-action="decrease" data-id="${item.cartId}">−</button>
          <span>${item.qty}</span>
          <button data-action="increase" data-id="${item.cartId}">+</button>
          <button data-action="remove" data-id="${item.cartId}">🗑️</button>
        </div>
      </div>`;
    });
    $('miniCartList').innerHTML = html || '<p style="color:var(--gray-500);text-align:center;">Keranjang kosong</p>';
    $('cartSubtotalDisplay').textContent = fmt(summary.subtotal);
    $('customerName').value = state.customerName;
    $('customerPhone').value = state.customerPhone;
    $('customerAddress').value = state.customerAddress;
    if (state.selectedDistrict) $('districtInput').value = state.selectedDistrict.replace(/\b\w/g, l => l.toUpperCase());
    document.querySelectorAll('.ship-btn').forEach(b => b.classList.toggle('active', b.dataset.provider === state.shippingProvider));
    document.querySelectorAll('.veh-btn').forEach(b => b.classList.toggle('active', b.dataset.vehicle === state.vehicleType));
    $('paxelOptions').style.display = state.shippingProvider === 'paxel' ? 'block' : 'none';
    $('rujakcoOptions').style.display = state.shippingProvider === 'rujakco' ? 'block' : 'none';
    $('deliveryTimeSection').style.display = state.shippingProvider === 'paxel' ? 'none' : 'block';
    if (state.selectedDistrict || state.userDistance !== null) updateShippingDisplay();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function validateOrderForm() {
    const name = $('customerName').value.trim();
    const phone = $('customerPhone').value.trim().replace(/[\s\-\(\)]/g, '');
    const address = $('customerAddress').value.trim();
    let valid = true;
    if (!name || name.length < 2) { showFieldError($('customerName'), 'Nama minimal 2 karakter'); valid = false; } else clearFieldError($('customerName'));
    if (!phone || !isValidPhone(phone)) { showFieldError($('customerPhone'), 'Format HP tidak valid'); valid = false; } else clearFieldError($('customerPhone'));
    if (!address || address.length < 5) { showFieldError($('customerAddress'), 'Alamat terlalu pendek'); valid = false; } else clearFieldError($('customerAddress'));
    if (!state.selectedDistrict && state.shippingProvider !== 'pembeli') { showFieldError($('districtInput'), 'Pilih kecamatan'); valid = false; } else clearFieldError($('districtInput'));
    if (!valid) showToast('❌ Mohon periksa isian bertanda merah');
    return valid ? { name, phone: normalizePhone(phone), address } : null;
  }

  function showFieldError(el, msg) {
    el.classList.add('input-error');
    let err = el.parentElement.querySelector('.field-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'field-error';
      err.style.cssText = 'color:#C5A059; font-size:11px; margin-top:4px;';
      el.parentElement.appendChild(err);
    }
    err.textContent = msg;
  }
  function clearFieldError(el) {
    el.classList.remove('input-error');
    const err = el.parentElement.querySelector('.field-error');
    if (err) err.remove();
  }

  function handleCheckout() {
    if (checkoutLocked) return;
    const valid = validateOrderForm();
    if (!valid) return;
    const summary = getCartSummaryCached();
    const shipping = calculateShippingCost();
    if (!shipping) { showToast('⚠️ Hitung ongkir gagal.'); return; }
    if (shipping.isOutOfRange && state.shippingProvider !== 'pembeli') {
      showToast('⚠️ Di luar jangkauan. Pilih "Kurir Pembeli".');
      return;
    }
    state.customerName = valid.name;
    state.customerPhone = valid.phone;
    state.customerAddress = valid.address;
    saveCustomerData();
    checkoutLocked = true;
    const orderNo = 'RJ' + Date.now().toString(36).slice(-6) + Math.random().toString(36).substring(2,5).toUpperCase();
    let wa = `🍜 *PESANAN RUJAK.CO*\n\n📋 Order: ${orderNo}\n👤 ${valid.name}\n📱 ${valid.phone}\n📍 ${valid.address}\n\n📦 *Pesanan:*\n`;
    summary.items.forEach(i => wa += `• ${i.name} ${i.spice ? '(Lv.'+i.spice+')' : ''} x${i.qty} — ${fmt(i.lineTotal)}\n`);
    wa += `\n💰 *Total: ${fmt(shipping.total)}*\n\n📸 *Sertakan bukti transfer.*`;
    getSupabase().then(client => {
      if (client) {
        client.from('orders').insert([{
          order_id: orderNo, customer_name: valid.name.substring(0,50), customer_phone: valid.phone, customer_address: valid.address.substring(0,500),
          items: summary.items.map(({ cartId, ...rest }) => rest), subtotal: summary.subtotal, shipping_cost: shipping.shippingCost,
          discount: 0, total: shipping.total, status: 'pending',
          shipping_provider: state.shippingProvider, vehicle: state.vehicleType, priority: state.isPriority
        }]).then(({error}) => { if (error) console.error(error); });
      }
    });
    setTimeout(() => {
      checkoutLocked = false;
      $('paymentModal').classList.remove('active');
      document.body.style.overflow = '';
      state.cart = {}; invalidateCache(); saveCart(); updateUI();
      window.open('https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(wa), '_blank');
      showToast('✅ Pesanan dikirim via WhatsApp.');
    }, 500);
  }

  function saveCustomerData() {
    try { localStorage.setItem('rujak_customer', JSON.stringify({
      name: state.customerName, phone: state.customerPhone, address: state.customerAddress,
      isGift: state.isGift, giftSender: state.giftSender, giftMessage: state.giftMessage,
      shippingProvider: state.shippingProvider, vehicleType: state.vehicleType,
      selectedDistrict: state.selectedDistrict, useManualDistrict: state.useManualDistrict
    })); } catch(_) {}
  }

  function loadCustomerData() {
    try {
      const d = JSON.parse(localStorage.getItem('rujak_customer') || '{}');
      state.customerName = d.name || ''; state.customerPhone = d.phone || ''; state.customerAddress = d.address || '';
      state.isGift = d.isGift || false; state.giftSender = d.giftSender || ''; state.giftMessage = d.giftMessage || '';
      if (d.shippingProvider) state.shippingProvider = d.shippingProvider;
      if (d.vehicleType) state.vehicleType = d.vehicleType;
      if (d.selectedDistrict) state.selectedDistrict = d.selectedDistrict;
      if (d.useManualDistrict !== undefined) state.useManualDistrict = d.useManualDistrict;
    } catch(_) {}
  }

  // ============================================================
  // LOCATION & DISTRICT AUTOCOMPLETE
  // ============================================================
  function createDistrictAutocomplete() {
    const input = $('districtInput');
    const dropdown = $('customDistrictDropdown');
    if (!input || !dropdown) return;
    input.addEventListener('input', function() {
      const val = this.value.toLowerCase().trim();
      if (!val) { dropdown.style.display = 'none'; return; }
      const matches = Object.keys(DISTRICT_MAP).filter(k => k.includes(val));
      dropdown.innerHTML = matches.length ? matches.slice(0,15).map(m => `<div data-value="${m}" style="padding:10px;cursor:pointer;">${m.replace(/\b\w/g, l => l.toUpperCase())}</div>`).join('') : '<div style="padding:10px;color:var(--gray-400);">Tidak ditemukan</div>';
      dropdown.style.display = 'block';
    });
    dropdown.addEventListener('click', function(e) {
      const t = e.target.closest('[data-value]');
      if (!t) return;
      state.selectedDistrict = t.dataset.value;
      input.value = t.dataset.value.replace(/\b\w/g, l => l.toUpperCase());
      dropdown.style.display = 'none';
      detectLocation();
      renderMiniCart();
    });
    document.addEventListener('click', e => { if (!input.parentElement.contains(e.target)) dropdown.style.display = 'none'; });
  }

  function detectLocation() {
    if (state.useManualDistrict && state.selectedDistrict) {
      const dist = DISTRICT_MAP[state.selectedDistrict] || estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, -6.2, 106.8));
      state.userDistance = dist;
      updateShippingUI(dist);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const dist = estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, pos.coords.latitude, pos.coords.longitude));
        state.userDistance = dist;
        updateShippingUI(dist);
        $('locationDisplay').textContent = 'Lokasi GPS ▾';
      }, () => showToast('📍 GPS tidak aktif. Silakan pilih kecamatan.'));
    }
  }

  function updateShippingUI(distance) {
    const shipping = calculateShipping(distance, state.isPriority, getCartSummaryCached().totalQty);
    const costEl = $('shippingCost');
    if (costEl) costEl.textContent = shipping.zone === 'E' ? 'Konfirmasi' : fmt(shipping.cost || 0);
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================
  function bindEvents() {
    document.addEventListener('click', function(e) {
      if (e.target.closest('[data-action="open-modal"]')) {
        openProductModal(e.target.closest('[data-action="open-modal"]').dataset.id);
        return;
      }
      if (e.target.closest('#modalClose') || e.target === $('productModal')) { closeProductModal(); return; }
      if (e.target.closest('#cartSummary') || e.target.closest('[data-action="open-cart"]')) { openMiniCart(); return; }
      if (e.target.closest('#miniCartClose') || e.target === miniCartModal) { closeMiniCart(); return; }
      if (e.target.closest('#btnOpenPayment')) {
        if (validateOrderForm()) {
          $('paymentTotalDisplay').textContent = $('finalTotal').textContent;
          $('paymentModal').classList.add('active');
        }
        return;
      }
      if (e.target.closest('[data-action="confirm-wa"]')) { handleCheckout(); return; }
      if (e.target.closest('[data-action="add-addon"]')) {
        if (addToCartLocked) return;
        addToCartLocked = true; setTimeout(() => addToCartLocked = false, 300);
        const id = e.target.closest('[data-action="add-addon"]').dataset.id;
        state.cart[id] = state.cart[id] || { qty: 0 };
        state.cart[id].qty++;
        invalidateCache(); updateUI();
        if (miniCartModal.classList.contains('active')) renderMiniCart();
        return;
      }
      if (e.target.closest('[data-action="increase"]')) {
        const id = e.target.closest('[data-action="increase"]').dataset.id;
        if (state.cart[id]) { state.cart[id].qty++; invalidateCache(); updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); }
        return;
      }
      if (e.target.closest('[data-action="decrease"]')) {
        const id = e.target.closest('[data-action="decrease"]').dataset.id;
        if (state.cart[id]) {
          state.cart[id].qty--;
          if (state.cart[id].qty <= 0) delete state.cart[id];
          invalidateCache(); updateUI();
          if (miniCartModal.classList.contains('active')) renderMiniCart();
        }
        return;
      }
      if (e.target.closest('[data-action="remove"]')) {
        const id = e.target.closest('[data-action="remove"]').dataset.id;
        delete state.cart[id]; invalidateCache(); updateUI();
        if (miniCartModal.classList.contains('active')) renderMiniCart();
        return;
      }
      if (e.target.closest('.cat-pill')) {
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        e.target.closest('.cat-pill').classList.add('active');
        state.activeFilter = e.target.closest('.cat-pill').dataset.cat;
        updateUI();
        return;
      }
      if (e.target.closest('#floatingCartBtn')) { openMiniCart(); return; }
      if (e.target.closest('#paymentClose') || e.target === $('paymentModal')) {
        $('paymentModal').classList.remove('active');
        document.body.style.overflow = '';
        checkoutLocked = false;
        return;
      }
      if (e.target.closest('#downloadQrisBtnPayment')) {
        const qi = $('qrisImagePayment');
        if (qi) { const a = document.createElement('a'); a.href = qi.src; a.download = 'QRIS-RujakCo.jpg'; a.click(); }
      }
      if (e.target.closest('#copyAmountBtn')) {
        const txt = $('paymentTotalDisplay').textContent.replace(/[^0-9]/g, '');
        if (txt) navigator.clipboard.writeText(txt).then(() => showToast('✅ Nominal disalin'));
      }
      if (e.target.closest('#clearCartBtn')) {
        state.cart = {}; invalidateCache(); saveCart(); updateUI();
        if (miniCartModal.classList.contains('active')) renderMiniCart();
        showToast('🧹 Keranjang dikosongkan');
        return;
      }
    });

    // Shipping provider
    document.querySelectorAll('.ship-btn').forEach(b => {
      b.addEventListener('click', function() {
        document.querySelectorAll('.ship-btn').forEach(x => x.classList.remove('active'));
        this.classList.add('active');
        state.shippingProvider = this.dataset.provider;
        $('paxelOptions').style.display = state.shippingProvider === 'paxel' ? 'block' : 'none';
        $('rujakcoOptions').style.display = state.shippingProvider === 'rujakco' ? 'block' : 'none';
        $('deliveryTimeSection').style.display = state.shippingProvider === 'paxel' ? 'none' : 'block';
        if (state.selectedDistrict || state.userDistance !== null) updateShippingDisplay();
        renderMiniCart();
      });
    });

    document.querySelectorAll('.veh-btn').forEach(b => {
      b.addEventListener('click', function() {
        document.querySelectorAll('.veh-btn').forEach(x => x.classList.remove('active'));
        this.classList.add('active');
        state.vehicleType = this.dataset.vehicle;
        if (state.selectedDistrict || state.userDistance !== null) updateShippingDisplay();
        renderMiniCart();
      });
    });

    $('deliveryTimeTrigger').addEventListener('click', function() {
      openCustomSelect('Jam Pengiriman Besok', [
        { value: 'Pagi (09:00 - 11:00)', label: 'Pagi (09:00 - 11:00)' },
        { value: 'Siang (11:00 - 13:00)', label: 'Siang (11:00 - 13:00)' },
        { value: 'Sore (14:00 - 17:00)', label: 'Sore (14:00 - 17:00)' }
      ], (value, label) => {
        $('deliveryTime').value = value;
        $('deliveryTimeLabel').textContent = label;
        $('deliveryTimeTrigger').classList.add('selected');
      });
    });

    $('priorityToggleMini').addEventListener('change', function() {
      state.isPriority = this.checked;
      if (state.selectedDistrict || state.userDistance !== null) updateShippingDisplay();
    });

    $('modalAdd').addEventListener('click', function() {
      if (addToCartLocked) return;
      addToCartLocked = true; setTimeout(() => addToCartLocked = false, 300);
      const baseId = this.dataset.id;
      const spice = parseInt($('spiceHidden').value, 10);
      const cartKey = baseId + '_spice' + spice;
      state.cart[cartKey] = state.cart[cartKey] || { qty: 0, spice };
      state.cart[cartKey].qty++;
      state.cart[cartKey].spice = spice;
      invalidateCache(); updateUI();
      showToast('✅ Ditambahkan!');
      closeProductModal();
    });

    // Spice modal
    const spiceTrigger = $('spiceTrigger');
    const spiceModal = $('spiceModal');
    if (spiceTrigger && spiceModal) {
      spiceTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        spiceModal.classList.add('active');
      });
      spiceModal.querySelectorAll('.select-option').forEach(opt => {
        opt.addEventListener('click', function() {
          $('spiceLabel').innerHTML = this.innerHTML;
          $('spiceHidden').value = this.dataset.value;
          spiceModal.classList.remove('active');
        });
      });
      document.addEventListener('click', function(e) {
        if (!spiceTrigger.contains(e.target) && !spiceModal.contains(e.target)) {
          spiceModal.classList.remove('active');
        }
      });
    }

    // Minimize bottom bar
    let pressTimer;
    document.addEventListener('touchstart', function(e) {
      if (e.target.closest('#bottom-bar') && !e.target.closest('button')) {
        pressTimer = setTimeout(() => {
          state.isCartMinimized = true;
          $('bottom-bar').classList.remove('visible');
          updateFloatingButton();
        }, 500);
      }
    });
    document.addEventListener('touchend', () => clearTimeout(pressTimer));
    document.addEventListener('touchmove', () => clearTimeout(pressTimer));

    $('floatingCartBtn').addEventListener('click', function() {
      state.isCartMinimized = false;
      renderCart();
    });
  }

  function openCustomSelect(title, options, onSelect) {
    const backdrop = document.createElement('div');
    backdrop.className = 'select-backdrop';
    document.body.appendChild(backdrop);
    const modal = document.createElement('div');
    modal.className = 'select-modal';
    modal.innerHTML = `<h3 style="margin:0 0 16px;">${title}</h3>` + options.map(o => `<div class="select-option" data-value="${o.value}">${o.label}</div>`).join('');
    document.body.appendChild(modal);
    const close = () => {
      modal.classList.remove('active');
      backdrop.classList.remove('active');
      setTimeout(() => { modal.remove(); backdrop.remove(); }, 300);
    };
    modal.querySelectorAll('.select-option').forEach(opt => {
      opt.addEventListener('click', function() {
        onSelect(this.dataset.value, this.textContent);
        close();
      });
    });
    backdrop.addEventListener('click', close);
    requestAnimationFrame(() => { backdrop.classList.add('active'); modal.classList.add('active'); });
  }

  // ============================================================
  // CONCIERGE & LONG-PRESS
  // ============================================================
  function initConcierge() {
    const dot = $('concierge-dot');
    if (!dot) return;
    dot.addEventListener('click', () => {
      const existing = document.getElementById('concierge-panel');
      if (existing) { existing.remove(); return; }
      const panel = document.createElement('div');
      panel.id = 'concierge-panel';
      panel.style.cssText = 'position:fixed;bottom:80px;right:24px;background:var(--ivory);border:0.5px solid rgba(45,45,45,0.12);border-radius:12px;padding:12px;z-index:301;';
      panel.innerHTML = `
        <button data-action="curated" style="display:block;width:100%;background:none;border:none;padding:12px;text-align:left;font-family:Inter,sans-serif;color:var(--text-main);">✨ Curated Selection</button>
        <button data-action="gift" style="display:block;width:100%;background:none;border:none;padding:12px;text-align:left;font-family:Inter,sans-serif;color:var(--text-main);">🎁 Gift Consultation</button>
        <button data-action="human" style="display:block;width:100%;background:none;border:none;padding:12px;text-align:left;font-family:Inter,sans-serif;color:var(--text-main);">🛎️ Human Help</button>`;
      document.body.appendChild(panel);
      panel.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', (e) => {
          const a = e.target.dataset.action;
          if (a === 'curated') showToast('🔍 Mencari rekomendasi...');
          if (a === 'gift') showToast('🎁 Pilih menu kado...');
          if (a === 'human') window.open('https://wa.me/' + SYSTEM.WA_NUMBER, '_blank');
          panel.remove();
        });
      });
    });
  }

  function initLongPress() {
    document.addEventListener('touchstart', function(e) {
      const imgWrap = e.target.closest('.item-img-wrap');
      if (imgWrap) {
        const menuItem = imgWrap.closest('.menu-item');
        if (menuItem) {
          const id = menuItem.dataset.id;
          window._pressTimer = setTimeout(() => {
            const p = PRODUCTS.find(p => p.id === id);
            if (p) showToast(`🌿 ${p.name}: ${p.buah.join(', ')}`);
          }, 1000);
        }
      }
    }, { passive: true });
    document.addEventListener('touchend', () => clearTimeout(window._pressTimer));
    document.addEventListener('touchmove', () => clearTimeout(window._pressTimer));
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    loadCart();
    loadCustomerData();
    createDistrictAutocomplete();
    detectLocation();
    updateUI();
    bindEvents();
    initConcierge();
    initLongPress();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    setInterval(() => {
      const el = $('storeStatusText');
      if (!el) return;
      const now = new Date(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
      const isOpen = (day >= 1 && day <= 5) ? (mins >= 600 && mins < 1200) : (mins >= 540 && mins < 1080);
      el.textContent = isOpen ? 'Buka' : 'Tutup';
      document.querySelector('.status-dot').style.background = isOpen ? '#4CAF50' : '#C5A059';
    }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();