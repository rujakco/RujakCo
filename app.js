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
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original Rujak.Co.', price:28000, cat:'classic', tags:['Pilihan Klasik','5 Buah'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Segar & Autentik', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp' },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk pengalaman rasa yang lebih menyatu.', price:26000, cat:'classic', tags:['Renyah','Serut'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Merah'], flavor:'Renyah Segar', flavorTag:'Renyah', defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp' },
    { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah pilihan dengan sambal mete premium.', price:40000, cat:'signature', tags:['Mete Premium','Bestseller'], badge:'Koleksi Favorit', badgeColor:'red', container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Mete Premium (1 Cup)', buah:['Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Premium', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp' },
    { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah untuk dua hingga tiga orang.', price:48000, cat:'signature', tags:['Porsi Besar','Sharing'], badge:'Untuk Dibagi Bersama', badgeColor:'red', container:'Thinwall Jumbo 1000ml (PP Food Grade)', size:'Porsi Sharing', sambal:'Sambal Mete Premium (2 Cup)', buah:['Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Extra Pedas', flavorTag:null, defaultSpice:4, portion:'2-3 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp' },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi premium dengan Shine Muscat.', price:85000, cat:'reserve', tags:['Eksklusif','Shine Muscat'], badge:'Reserve Collection', badgeColor:'gold', container:'Thinwall Jumbo 1000ml + Paper Bag', size:'Porsi Premium', sambal:'Sambal Mete Premium (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Eksklusif & Premium', flavorTag:null, defaultSpice:3, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp' },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Sajian kebersamaan dalam tampah bambu.', price:200000, cat:'reserve', tags:['Tampah','Pre-Order'], badge:'Untuk 8-10 Orang', badgeColor:'gold', container:'Tampah Bambu Ø40cm + Kardus + Wrap', size:'Porsi Besar', sambal:'Varian Original & Mete (4 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi Merah'], flavor:'Kemegahan Berbagai Rasa', flavorTag:null, defaultSpice:3, portion:'8-10 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp' }
  ];

  const VIP_PRODUCT = {
    id:'p_vip', name:'Mahkota VIP', desc:'Menu rahasia eksklusif dengan komposisi premium.', price:125000, cat:'reserve', tags:['Eksklusif','VIP Only'], badge:'Menu Rahasia', badgeColor:'gold', container:'Box Premium + Paper Bag', size:'Porsi Eksklusif', sambal:'Sambal Mete Premium Spesial (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Harum Manis','Nanas Madu','Bengkoang','Strawberry'], flavor:'Premium & Misterius', flavorTag:'Limited', defaultSpice:2, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp'
  };

  const ADDONS = [
    { id:'a_sambal1', name:'Sambal Original', price:8000, icon:'flame', iconColor:'text-red-500', desc:'Warisan rasa klasik.' },
    { id:'a_sambal2', name:'Sambal Mete Premium', price:12000, icon:'flame', iconColor:'text-red-600', desc:'Lebih gurih dan kaya rasa.' },
    { id:'a_extra_jambu', name:'Extra Jambu Kristal', price:10000, icon:'apple', iconColor:'text-green-500', desc:'Tambahan jambu kristal segar' },
    { id:'a_extra_muscat', name:'Extra Shine Muscat', price:15000, icon:'grape', iconColor:'text-purple-500', desc:'Tambahan anggur Shine Muscat impor' }
  ];

  const SYSTEM = {
    DISCOUNT_THRESHOLD: 100000,
    WA_NUMBER: '6289677161680',
    TOAST_DURATION: 3000,
    MAX_DISTANCE: 50,
    DEFAULT_DISTANCE: 2
  };

  const DISTRICT_MAP = {
    'bekasi barat': 3, 'bekasi timur': 5, 'bekasi selatan': 7, 'bekasi utara': 8,
    'rawalumbu': 6, 'jatiasih': 9, 'pondokgede': 12, 'cikarang': 18,
    'jakarta pusat': 18, 'jakarta selatan': 20, 'jakarta timur': 15, 'jakarta barat': 22, 'jakarta utara': 25,
    'depok': 28, 'bogor': 35, 'tangerang': 30, 'tangerang selatan': 27
  };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null,
    isPriority: false, orderNotes: '', isCartMinimized: false, customerName: '',
    customerPhone: '', customerAddress: '', isGift: false, giftSender: '',
    giftMessage: '', useManualDistrict: false, selectedDistrict: '',
    hasShared: false, shippingProvider: 'pembeli', vehicleType: 'motor'
  };

  // ===================== FUNGSI UTILITY =====================
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function loadCart() { try { const s = localStorage.getItem('rujak_cart'); if (s) { const p = JSON.parse(s); if (typeof p === 'object' && p !== null) state.cart = p; } } catch (_) { state.cart = {}; } }
  function saveCart() { try { localStorage.setItem('rujak_cart', JSON.stringify(state.cart)); } catch (_) {} }
  
  function getItemById(id) {
    if (id === 'p_vip' || id.startsWith('p_vip_')) return VIP_PRODUCT;
    let item = PRODUCTS.find(p => p.id === id) || ADDONS.find(a => a.id === id);
    if (item) return item;
    return PRODUCTS.find(p => id.startsWith(p.id + '_'));
  }
  
  function debounce(fn, delay) { let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); }; }

  // ===================== DISKON =====================
  function calculateDiscount(subtotal) {
    let discount = 0;
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) discount += 5000;
    if (state.hasShared) discount += 5000;
    return discount;
  }

  // ===================== ONGKIR & LOKASI =====================
  function calculateShipping(d, priority) {
    const rawDistance = (d === null || d === undefined || isNaN(d)) ? SYSTEM.DEFAULT_DISTANCE : d;
    const dist = rawDistance * 1.3;
    const rounded = Math.ceil(dist);
    if (rounded > SYSTEM.MAX_DISTANCE) return { cost: Infinity, label: 'Luar jangkauan', distance: rawDistance };
    let base, perKm, label;
    if (priority) { base = 15000; perKm = 3000; label = 'Prioritas'; }
    else { base = 10000; perKm = 2000; label = 'Reguler'; }
    const extraKm = Math.max(0, rounded - 3);
    const cost = base + extraKm * perKm;
    return { cost, label: label + ' (' + Math.ceil(rawDistance) + ' km)', distance: rawDistance };
  }

  function getLocationFallback() {
    return new Promise(resolve => {
      fetch('https://ipapi.co/json/').then(r => r.json()).then(data => {
        const city = data.city || data.region || 'Lokasi'; let distance = 999;
        const c = city.toLowerCase();
        if (c.includes('bekasi')) distance = 2;
        else if (c.includes('jakarta')) distance = 15;
        else if (c.includes('depok')) distance = 20;
        else if (c.includes('tangerang')) distance = 25;
        else if (c.includes('bogor')) distance = 30;
        resolve({ city, distance });
      }).catch(() => resolve({ city: 'Lokasi Tidak Diketahui', distance: 999 }));
    });
  }

  function updateShippingUI(distance, isPriority) {
    const r = calculateShipping(distance, isPriority);
    const out = distance > SYSTEM.MAX_DISTANCE;
    document.getElementById('shippingDistance').textContent = '~' + Math.ceil(distance) + ' km';
    const costEl = document.getElementById('shippingCost');
    if (out) { costEl.textContent = '❌'; costEl.style.color = 'var(--red)'; document.getElementById('outOfRange').style.display = 'block'; }
    else { costEl.textContent = 'Rp' + r.cost.toLocaleString('id-ID'); costEl.style.color = 'var(--red)'; document.getElementById('outOfRange').style.display = 'none'; }
    if (document.getElementById('miniCartModal').classList.contains('active')) renderMiniCart();
  }

  function detectLocation() {
    const STORE_LAT = -6.2333, STORE_LNG = 107.0;
    document.getElementById('shippingCost').textContent = '⏳';
    if (state.useManualDistrict && state.selectedDistrict) {
      const dist = DISTRICT_MAP[state.selectedDistrict] || SYSTEM.DEFAULT_DISTANCE;
      state.userDistance = dist;
      const distName = state.selectedDistrict.replace(/\b\w/g, l => l.toUpperCase());
      document.getElementById('locationDisplay').textContent = distName + ' ▾';
      updateShippingUI(dist, state.isPriority);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        const R = 6371; const dLat = (lat - STORE_LAT) * Math.PI / 180; const dLon = (lng - STORE_LNG) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(STORE_LAT * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLon/2)**2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=id`).then(r => r.json()).then(data => {
          const city = data.address?.city || data.address?.town || 'Lokasi Anda';
          state.userDistance = distance; document.getElementById('locationDisplay').textContent = city + ' ▾'; updateShippingUI(distance, state.isPriority);
        }).catch(() => { state.userDistance = distance; document.getElementById('locationDisplay').textContent = 'Lokasi Anda ▾'; updateShippingUI(distance, state.isPriority); });
      }, () => {
        getLocationFallback().then(({ city, distance }) => { state.userDistance = distance; document.getElementById('locationDisplay').textContent = city + ' ▾'; updateShippingUI(distance, state.isPriority); });
      }, { enableHighAccuracy: true, timeout: 10000 });
    } else {
      getLocationFallback().then(({ city, distance }) => { state.userDistance = distance; document.getElementById('locationDisplay').textContent = city + ' ▾'; updateShippingUI(distance, state.isPriority); });
    }
  }

  // ===================== CART ENGINE =====================
  function getCartSummary() {
    const items = [];
    let subtotal = 0;
    let totalQty = 0;
    Object.keys(state.cart).forEach(id => {
      const entry = state.cart[id];
      const item = getItemById(id);
      if (item && entry && entry.qty > 0) {
        const lineTotal = item.price * entry.qty;
        subtotal += lineTotal;
        totalQty += entry.qty;
        items.push({ id, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice || null, lineTotal });
      } else {
        delete state.cart[id];
      }
    });
    const discount = calculateDiscount(subtotal);
    const distance = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
    const shipping = calculateShipping(distance, state.isPriority);
    const shippingCost = state.shippingProvider === 'pembeli' ? 0 : (shipping.cost === Infinity ? 0 : shipping.cost);
    const total = subtotal - discount + shippingCost;
    return {
      items, totalQty, subtotal, discount, shippingCost,
      shippingLabel: shipping.label, shippingDistance: shipping.distance,
      total, isOutOfRange: distance > SYSTEM.MAX_DISTANCE
    };
  }

  // ===================== UI RENDER =====================
  function renderMenu() {
    const container = document.getElementById('menuList');
    const empty = document.getElementById('emptyState');
    const skeleton = document.getElementById('skeletonContainer');
    skeleton.style.display = 'none';
    container.style.display = 'block';
    if (state.activeFilter === 'addon') { container.innerHTML = ''; empty.style.display = 'none'; return; }

    let filtered = PRODUCTS.filter(p => {
      const matchCat = (state.activeFilter === 'all' || p.cat === state.activeFilter);
      const q = state.searchQuery.toLowerCase();
      return matchCat && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    });
    if (state.searchQuery.toLowerCase().includes('vip')) {
      if (!filtered.some(p => p.id === 'p_vip')) filtered = [VIP_PRODUCT, ...filtered];
    }
    if (!filtered.length) { empty.style.display = 'block'; container.innerHTML = ''; return; }
    empty.style.display = 'none';

    let html = '';
    filtered.forEach(p => {
      let qty = 0; let firstCartKey = p.id;
      Object.keys(state.cart).forEach(k => {
        if (k === p.id || k.startsWith(p.id + '_')) { qty += state.cart[k].qty; if (qty === state.cart[k].qty) firstCartKey = k; }
      });
      const control = qty === 0
        ? `<button type="button" class="add-btn" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>`
        : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${firstCartKey}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${firstCartKey}">+</button></div>`;
      const badgeRight = p.badge ? `<span class="item-badge-right ${p.badgeColor}">${p.badge}</span>` : '';
      const flavorTag = p.flavorTag ? `<span class="item-flavor-tag">${p.flavorTag}</span>` : '';
      const buahChips = (p.buah || []).slice(0,4).map(b => `<span class="item-buah-chip">${b}</span>`).join('');
      const moreChips = (p.buah || []).length > 4 ? `<span class="item-buah-chip">+${p.buah.length - 4}</span>` : '';
      html += `<div class="menu-item" data-id="${p.id}" tabindex="0" role="button" aria-label="Detail ${p.name}"><div class="item-img-wrap"><img src="${p.thumbnail}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.nextElementSibling.textContent='${p.name.substring(0,20)}'"><div class="fallback" style="display:none;">${p.name.substring(0,20)}</div></div><div class="item-body"><div class="item-name-row"><span class="item-name">${p.name}</span>${badgeRight}</div><div class="item-flavor-row"><span class="item-flavor">${p.flavor}</span>${flavorTag}</div><div class="item-spice">🌶️ Level 1–5</div><p class="item-desc">${p.desc}</p><div class="item-buah-chips">${buahChips}${moreChips}</div><div class="item-footer"><div><span class="item-price">${fmt(p.price)}</span><span class="item-portion"> · ${p.portion}</span></div>${control}</div></div></div>`;
    });
    container.innerHTML = html;
  }

  function renderAddons() {
    const container = document.getElementById('addonList');
    const q = state.searchQuery.toLowerCase();
    const filtered = ADDONS.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    let html = '';
    filtered.forEach(a => {
      const entry = state.cart[a.id]; const qty = entry ? entry.qty : 0;
      const control = qty === 0
        ? `<button type="button" class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>`
        : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      html += `<div class="addon-card"><div class="addon-icon ${a.iconColor}"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div><div class="addon-name">${a.name}</div><div class="addon-desc">${a.desc}</div><div class="addon-footer"><span class="addon-price">${fmt(a.price)}</span>${control}</div></div>`;
    });
    container.innerHTML = html;
    const header = document.getElementById('addonHeader'), divider = document.getElementById('addonDivider');
    const show = filtered.length > 0;
    header.style.display = show ? 'flex' : 'none'; divider.style.display = show ? 'block' : 'none';
  }

  function updateProgressBar(subtotal) {
    const container = document.getElementById('progressContainer');
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) { container.style.display = 'none'; return; }
    const remaining = SYSTEM.DISCOUNT_THRESHOLD - subtotal;
    const progressPercent = Math.min(100, Math.round((subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
    container.style.display = 'block';
    document.getElementById('progressLabel').textContent = `Tambah ${fmt(remaining)} lagi untuk potongan Rp5.000`;
    document.getElementById('progressPercent').textContent = progressPercent + '%';
    document.getElementById('progressFill').style.width = progressPercent + '%';
    document.getElementById('progressFill').style.background = progressPercent >= 80 ? 'var(--green)' : 'var(--red)';
  }

  function updateMissionCheckboxes(subtotal) {
    const missionSpend = document.getElementById('missionSpend');
    const checkShare = document.getElementById('checkShare');
    if (missionSpend) missionSpend.checked = subtotal >= SYSTEM.DISCOUNT_THRESHOLD;
    if (checkShare) checkShare.checked = state.hasShared;
  }

  function renderCart() {
    const summary = getCartSummary();
    updateProgressBar(summary.subtotal); updateMissionCheckboxes(summary.subtotal);
    const bar = document.getElementById('bottom-bar');
    const discountLabel = document.getElementById('discountLabel'), totalEl = document.getElementById('cartTotalDisplay');
    const footer = document.querySelector('.footer-brand');

    if (summary.totalQty > 0 && !state.isCartMinimized) {
      bar.classList.add('visible');
      if (footer) footer.style.paddingBottom = '180px';
      document.getElementById('cartPreview').textContent = summary.totalQty + ' item' + (summary.totalQty > 1 ? 's' : '');
      if (summary.discount > 0) {
        discountLabel.style.display = 'inline-block';
        discountLabel.textContent = '-Rp' + summary.discount.toLocaleString('id-ID');
        totalEl.innerHTML = `<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;margin-right:4px;">${fmt(summary.subtotal)}</span>${fmt(summary.subtotal - summary.discount)}`;
      } else {
        discountLabel.style.display = 'none';
        totalEl.textContent = fmt(summary.subtotal);
      }
    } else {
      bar.classList.remove('visible');
      if (footer) footer.style.paddingBottom = '0';
    }
    saveCart(); updateFloatingButton();
  }

  function renderMiniCart() {
    const summary = getCartSummary();
    
    // Step 1: List item
    const list = document.getElementById('miniCartList');
    let html = '';
    if (summary.items.length === 0) {
      html = '<p style="color:var(--gray-500);text-align:center;padding:20px 0;">Keranjang kosong</p>';
    } else {
      summary.items.forEach(item => {
        const spiceText = item.spice ? ' (Level ' + item.spice + ')' : '';
        html += `<div class="mini-cart-item"><div class="mini-cart-info"><div class="mini-cart-name">${item.name}${spiceText}</div><div class="mini-cart-detail">${fmt(item.price)}</div></div><div class="mini-cart-qty"><button data-action="decrease" data-id="${item.id}">−</button><span>${item.qty}</span><button data-action="increase" data-id="${item.id}">+</button><button class="mini-cart-remove" data-action="remove" data-id="${item.id}">🗑️</button></div></div>`;
      });
    }
    list.innerHTML = html;

    // Subtotal
    document.getElementById('cartSubtotalDisplay').textContent = fmt(summary.subtotal);

    // ✅ STEP 1: Progress bar diskon
    const step1Progress = document.getElementById('step1Progress');
    if (step1Progress) {
      const remaining = SYSTEM.DISCOUNT_THRESHOLD - summary.subtotal;
      const progressPercent = Math.min(100, Math.round((summary.subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
      step1Progress.innerHTML = remaining > 0 ? `
        <div style="background:white;border:1px solid var(--gray-200);border-radius:12px;padding:12px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;">
            <span>🎯 Tambah ${fmt(remaining)} lagi dapat potongan Rp5.000</span>
            <span style="color:var(--green);">${progressPercent}%</span>
          </div>
          <div style="width:100%;height:6px;background:var(--gray-200);border-radius:10px;overflow:hidden;">
            <div style="width:${progressPercent}%;height:100%;background:${progressPercent >= 80 ? 'var(--green)' : 'var(--red)'};border-radius:10px;transition:width 0.4s;"></div>
          </div>
        </div>
      ` : `
        <div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">
          ✅ Diskon Rp5.000 aktif!
        </div>
      `;
    }

    // ✅ STEP 2: Update ongkir
    const step2Cost = document.getElementById('step2ShippingCost');
    const step2Dist = document.getElementById('step2Distance');
    if (step2Cost) step2Cost.textContent = summary.shippingCost === Infinity ? '❌' : fmt(summary.shippingCost);
    if (step2Dist) step2Dist.textContent = '~' + Math.ceil(summary.shippingDistance) + ' km';

    // Step 3: Final summary
    document.getElementById('finalSubtotal').textContent = fmt(summary.subtotal);
    document.getElementById('finalDiscount').textContent = summary.discount > 0 ? '-Rp' + summary.discount.toLocaleString('id-ID') : 'Rp0';
    document.getElementById('finalShipping').textContent = summary.shippingCost === Infinity ? '❌' : fmt(summary.shippingCost);
    document.getElementById('finalTotal').textContent = summary.isOutOfRange ? '❌' : fmt(summary.total);

    // Set form values
    document.getElementById('orderNotes').value = state.orderNotes;
    document.getElementById('customerName').value = state.customerName;
    document.getElementById('customerPhone').value = state.customerPhone;
    document.getElementById('customerAddress').value = state.customerAddress;
    document.getElementById('giftToggle').checked = state.isGift;
    document.getElementById('giftSender').value = state.giftSender;
    document.getElementById('giftMessage').value = state.giftMessage;
    document.getElementById('giftFields').style.display = state.isGift ? 'block' : 'none';

    // Shipping buttons
    document.querySelectorAll('.ship-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.provider === state.shippingProvider);
    });
    document.getElementById('rujakcoOptions').style.display = state.shippingProvider === 'rujakco' ? 'block' : 'none';
    document.querySelectorAll('.veh-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.vehicle === state.vehicleType);
    });

    // Button bayar
    const btnPay = document.getElementById('btnOpenPayment');
    if (state.userDistance === null) { btnPay.disabled = true; btnPay.textContent = '⏳ Mencari lokasi...'; }
    else if (summary.isOutOfRange) { btnPay.disabled = true; btnPay.textContent = 'Di luar jangkauan'; }
    else if (summary.items.length === 0) { btnPay.disabled = true; btnPay.textContent = 'Keranjang kosong'; }
    else { btnPay.disabled = false; btnPay.textContent = '💳 Bayar Via QRIS'; }

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  function updateUI() {
    renderMenu(); renderAddons(); renderCart();
    if (document.getElementById('miniCartModal').classList.contains('active')) renderMiniCart();
    updateClearButton(); updateFloatingButton();
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  // ===================== STEP NAVIGATION =====================
  function goToStep(step) {
    state.currentStep = step;
    
    document.querySelectorAll('.cart-step').forEach(el => {
      el.style.display = 'none';
      el.classList.remove('active');
    });
    
    const stepEl = document.getElementById(`cartStep${step}`);
    if (stepEl) {
      stepEl.style.display = 'block';
      stepEl.classList.add('active');
    }
    
    document.querySelectorAll('.step').forEach((el, i) => {
      el.classList.remove('active', 'done');
      if (i + 1 === step) el.classList.add('active');
      else if (i + 1 < step) el.classList.add('done');
    });
    
    renderMiniCart();
  }
  
  // ✅ Bikin global untuk onclick di HTML
  window.goToStep = goToStep;

  // ===================== MODALS =====================
  const productModal = document.getElementById('productModal');
  let currentProductId = null;
  const SPICE_NAMES = ['Mild', 'Sedang', 'Pedas', 'Extra Pedas', 'Very Hot'];

  function openProductModal(id) {
    const product = PRODUCTS.find(p => p.id === id) || VIP_PRODUCT;
    if (!product) return;
    currentProductId = id;
    document.getElementById('modalImg').innerHTML = `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.textContent='${product.name.substring(0,20)}';">`;
    const badgeEl = document.getElementById('modalBadge');
    if (product.badge) { badgeEl.style.display = 'inline-block'; badgeEl.textContent = product.badge; badgeEl.className = 'modal-badge-eyebrow ' + (product.badgeColor || ''); }
    else badgeEl.style.display = 'none';
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalDesc').textContent = product.desc;
    document.getElementById('modalContainer').textContent = product.container || '-';
    document.getElementById('modalSize').textContent = product.size || '-';
    document.getElementById('modalSambal').textContent = product.sambal || '-';
    document.getElementById('modalBuahText').textContent = (product.buah || []).join(', ');
    document.getElementById('modalTags').innerHTML = (product.tags || []).map(t => `<span class="modal-tag">${t}</span>`).join('');
    document.getElementById('btnPrice').textContent = fmt(product.price);
    document.getElementById('modalAdd').dataset.id = product.id;
    const select = document.getElementById('spiceSelect');
    const defaultVal = product.defaultSpice || 3;
    select.value = defaultVal; updateSpiceHighlight(defaultVal);
    select.onchange = function() { updateSpiceHighlight(parseInt(this.value, 10)); };
    productModal.classList.add('active'); document.body.style.overflow = 'hidden';
  }

  function updateSpiceHighlight(level) { document.getElementById('modalSpiceLabel').textContent = level + ' - ' + (SPICE_NAMES[level-1] || 'Pedas'); }
  function closeProductModal() { productModal.classList.remove('active'); document.body.style.overflow = ''; currentProductId = null; }

  const miniCartModal = document.getElementById('miniCartModal');
  function openMiniCart() { goToStep(1); miniCartModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeMiniCart() {
    state.orderNotes = document.getElementById('orderNotes').value;
    state.customerName = document.getElementById('customerName').value.trim();
    state.customerPhone = document.getElementById('customerPhone').value.trim();
    state.customerAddress = document.getElementById('customerAddress').value.trim();
    state.isGift = document.getElementById('giftToggle').checked;
    state.giftSender = document.getElementById('giftSender').value.trim();
    state.giftMessage = document.getElementById('giftMessage').value.trim();
    miniCartModal.classList.remove('active'); document.body.style.overflow = ''; saveCustomerData();
  }
  function clearCart() {
    if (Object.keys(state.cart).length === 0) return showToast('Keranjang sudah kosong');
    if (confirm('Yakin ingin mengosongkan keranjang?')) {
      state.cart = {}; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart();
      showToast('Keranjang dikosongkan');
    }
  }

  // ===================== SUPABASE =====================
  async function saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount) {
    if (!supabase) return false;
    try {
      const payload = {
        customer_name: state.customerName || 'Guest', customer_phone: state.customerPhone || '',
        customer_address: state.customerAddress || '', items: orderItems, subtotal, shipping_cost: shippingCost,
        discount, total, status: 'pending', is_gift: state.isGift, gift_sender: state.giftSender || null,
        gift_message: state.giftMessage || null, mission_shared: state.hasShared,
        shipping_provider: state.shippingProvider, vehicle: state.vehicleType, priority: state.isPriority
      };
      const { error } = await supabase.from('orders').insert([payload]);
      if (error) throw error; return true;
    } catch (err) { console.error('Supabase error:', err); return false; }
  }

  function handleCheckout() {
    const summary = getCartSummary();
    if (summary.isOutOfRange) return showToast('Maaf, pengiriman hanya tersedia untuk Jabodetabek');
    const name = state.customerName.trim(), phone = state.customerPhone.trim(), address = state.customerAddress.trim();
    if (!name || name.length < 2) return showToast('❌ Nama penerima tidak valid'), document.getElementById('customerName').focus();
    if (!phone || phone.length < 8) return showToast('❌ Nomor HP tidak valid'), document.getElementById('customerPhone').focus();
    if (!address || address.length < 5) return showToast('❌ Alamat pengiriman tidak valid'), document.getElementById('customerAddress').focus();
    if (summary.items.length === 0) return showToast('Keranjang kosong');

    const payBtn = document.querySelector('[data-action="confirm-wa"]');
    if (payBtn) { payBtn.textContent = '⏳ Menyimpan...'; payBtn.disabled = true; }

    saveOrderToDatabase(summary.items, summary.total, summary.subtotal, summary.shippingCost, summary.discount)
      .then((saved) => {
        showToast(saved ? '✅ Pesanan tersimpan!' : '⚠️ Lanjut WhatsApp tanpa simpan');
      })
      .catch(() => {
        showToast('⚠️ Gagal menyimpan, lanjut WhatsApp');
      })
      .finally(() => {
        // ✅ Balikin tombol setelah 1 detik
        setTimeout(() => {
          if (payBtn) {
            payBtn.textContent = '💳 Kirim Bukti Transfer';
            payBtn.disabled = false;
          }
        }, 1000);

        // Buka WhatsApp
        setTimeout(() => {
          let msg = 'Halo Rujak.Co! Saya ingin memesan:\n\n';
          summary.items.forEach(item => {
            const spiceText = item.spice ? ' (Level ' + item.spice + ')' : '';
            msg += '• ' + item.name + spiceText + ' (x' + item.qty + ') — ' + fmt(item.lineTotal) + '\n';
          });
          if (state.orderNotes) msg += '\n*Catatan Pesanan:*\n' + state.orderNotes + '\n';
          if (state.isGift) {
            msg += '\n🎁 *PESANAN KADO*\n';
            if (state.giftSender) msg += 'Dari: ' + state.giftSender + '\n';
            if (state.giftMessage) msg += 'Ucapan: ' + state.giftMessage + '\n';
          }
          msg += '\n*Pengiriman:* ' + (state.shippingProvider === 'pembeli' ? 'Kurir Saya' : 'Kurir Rujak.Co - ' + state.vehicleType + (state.isPriority ? ' (Prioritas)' : ''));
          msg += '\n*Data:*\nNama : ' + name + '\nNo. HP : ' + phone + '\nAlamat : ' + address + '\n';
          if (state.shippingProvider === 'rujakco') msg += '\nOngkir: ' + fmt(summary.shippingCost) + ' (' + summary.shippingLabel + ')';
          msg += '\nSubtotal: ' + fmt(summary.subtotal);
          if (summary.discount > 0) msg += '\nDiskon Misi Jajan: -' + fmt(summary.discount);
          msg += '\n*Total Akhir: ' + fmt(summary.total) + '*\n\n*Saya sudah transfer via QRIS, ini bukti transfernya:*\n*(sertakan foto)*';
          window.location.href = 'https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg);
        }, 500);
      });
  }

  // ===================== CUSTOMER DATA =====================
  function saveCustomerData() {
    try { localStorage.setItem('rujak_customer', JSON.stringify({ name: state.customerName, phone: state.customerPhone, address: state.customerAddress, isGift: state.isGift, giftSender: state.giftSender, giftMessage: state.giftMessage, hasShared: state.hasShared, shippingProvider: state.shippingProvider, vehicleType: state.vehicleType })); } catch (_) {}
  }
  function loadCustomerData() {
    try {
      const raw = localStorage.getItem('rujak_customer');
      if (raw) { const data = JSON.parse(raw); state.customerName = data.name || ''; state.customerPhone = data.phone || ''; state.customerAddress = data.address || ''; state.isGift = data.isGift || false; state.giftSender = data.giftSender || ''; state.giftMessage = data.giftMessage || ''; state.hasShared = data.hasShared || false; if (data.shippingProvider) state.shippingProvider = data.shippingProvider; if (data.vehicleType) state.vehicleType = data.vehicleType; }
    } catch (_) {}
  }

  // ===================== TOAST =====================
  let toastTimer;
  function showToast(msg) {
    const el = document.getElementById('toast'); el.textContent = msg; el.classList.remove('show');
    void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), SYSTEM.TOAST_DURATION);
  }

  // ===================== FLOATING BUTTON =====================
  function updateFloatingButton() {
    const btn = document.getElementById('floatingCartBtn'), badge = document.getElementById('floatingBadge');
    const summary = getCartSummary();
    if (state.isCartMinimized && summary.totalQty > 0) { btn.classList.add('visible'); badge.textContent = summary.totalQty; }
    else btn.classList.remove('visible');
  }
  function minimizeCart() {
    state.isCartMinimized = true; localStorage.setItem('rujak_cart_minimized', 'true');
    document.getElementById('bottom-bar').classList.remove('visible'); updateFloatingButton();
    const footer = document.querySelector('.footer-brand'); if (footer) footer.style.paddingBottom = '0';
  }
  function expandCart() { state.isCartMinimized = false; localStorage.setItem('rujak_cart_minimized', 'false'); updateFloatingButton(); renderCart(); }

  function handlePriorityToggle(checked) {
    state.isPriority = checked; document.getElementById('priorityToggle').checked = checked;
    document.getElementById('priorityToggleMini').checked = checked;
    if (state.userDistance !== null) updateShippingUI(state.userDistance, checked);
  }

  function updateStoreStatus() { document.getElementById('storeStatusText').textContent = 'Buka'; document.getElementById('storeStatus')?.classList.remove('closed'); }
  function shareToWhatsApp() { window.location.href = 'https://wa.me/?text=' + encodeURIComponent('Hai! Cobain Rujak.Co yuk — rujak premium dengan buah segar pilihan dan sambal khas Indonesia. Lihat menu dan pesan langsung di sini:\n' + window.location.href); }

  const promoModal = document.getElementById('promoModal');
  function openPromoModal() { const summary = getCartSummary(); updateMissionCheckboxes(summary.subtotal); promoModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closePromoModal() { promoModal.classList.remove('active'); document.body.style.overflow = ''; }

  const searchInput = document.getElementById('searchInput'), clearSearchBtn = document.getElementById('clearSearchBtn');
  function updateClearButton() { clearSearchBtn.classList.toggle('visible', searchInput.value.length > 0); }

  // ===================== EVENT BINDING =====================
  function bindEvents() {
    document.getElementById('modalAdd').addEventListener('click', function() {
      const baseId = this.dataset.id;
      if (baseId) {
        const spice = parseInt(document.getElementById('spiceSelect').value, 10) || 3;
        const cartKey = baseId + '_' + spice;
        const entry = state.cart[cartKey] || { qty: 0, spice: spice };
        entry.qty += 1; entry.spice = spice; state.cart[cartKey] = entry;
        updateUI(); showToast('Berhasil ditambahkan ✓'); closeProductModal();
      }
    });

    document.getElementById('priorityToggle').addEventListener('change', function() { handlePriorityToggle(this.checked); });
    document.getElementById('priorityToggleMini').addEventListener('change', function() { handlePriorityToggle(this.checked); });

    document.getElementById('btnAutoDetect').addEventListener('click', function() {
      state.useManualDistrict = false; state.selectedDistrict = '';
      this.classList.add('active'); document.getElementById('btnManualDistrict').classList.remove('active');
      document.getElementById('districtSelectWrap').style.display = 'none'; detectLocation();
    });
    document.getElementById('btnManualDistrict').addEventListener('click', function() {
      state.useManualDistrict = true; this.classList.add('active'); document.getElementById('btnAutoDetect').classList.remove('active');
      document.getElementById('districtSelectWrap').style.display = 'block';
    });
    document.getElementById('districtSelect').addEventListener('change', function() {
      state.selectedDistrict = this.value; if (state.selectedDistrict) detectLocation();
    });

    document.getElementById('shareBtnModal').addEventListener('click', function() {
      state.hasShared = true; saveCustomerData(); updateUI(); showToast('Diskon Rp5.000 berhasil diaktifkan!'); shareToWhatsApp();
    });
    document.getElementById('promoTrigger').addEventListener('click', openPromoModal);
    document.getElementById('promoClose').addEventListener('click', closePromoModal);
    promoModal.addEventListener('click', function(e) { if (e.target === promoModal) closePromoModal(); });

    document.getElementById('closeBottomBar').addEventListener('click', e => { e.stopPropagation(); minimizeCart(); });
    document.getElementById('floatingCartBtn').addEventListener('click', expandCart);

    const searchToggleWrap = document.getElementById('searchToggleWrap');
    const searchIconBtn = document.getElementById('searchIconBtn');
    const searchInputWrap = document.getElementById('searchInputWrap');
    if (searchIconBtn) {
      searchIconBtn.addEventListener('click', () => { searchInputWrap.classList.toggle('open'); if (searchInputWrap.classList.contains('open')) searchInput.focus(); });
      document.addEventListener('click', (e) => { if (!searchToggleWrap.contains(e.target)) searchInputWrap.classList.remove('open'); });
    }

    document.getElementById('giftToggle').addEventListener('change', function() {
      state.isGift = this.checked; document.getElementById('giftFields').style.display = this.checked ? 'block' : 'none'; saveCustomerData();
    });

    // Shipping provider
    document.querySelectorAll('.ship-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.shippingProvider = this.dataset.provider;
        document.getElementById('rujakcoOptions').style.display = state.shippingProvider === 'rujakco' ? 'block' : 'none';
        updateUI();
      });
    });

    // Vehicle type
    document.querySelectorAll('.veh-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.vehicleType = this.dataset.vehicle;
        updateUI();
      });
    });

    // Step navigation
    document.getElementById('step1Next')?.addEventListener('click', () => { goToStep(2); });
    document.getElementById('step2Next')?.addEventListener('click', () => { goToStep(3); });

    searchInput.addEventListener('input', debounce(function() { state.searchQuery = this.value; updateUI(); updateClearButton(); }, 300));
    searchInput.addEventListener('keyup', updateClearButton);

    document.addEventListener('click', function(e) {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const { action, id } = actionBtn.dataset;
        if (action === 'open-modal' && id) return openProductModal(id);
        if (action === 'open-cart') return openMiniCart();
        if (action === 'add-addon' && id) { state.cart[id] = state.cart[id] || { qty:0 }; state.cart[id].qty++; updateUI(); showToast('Berhasil ditambahkan ✓'); return; }
        if (action === 'increase' && id && state.cart[id]) { state.cart[id].qty++; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); return; }
        if (action === 'decrease' && id && state.cart[id]) { state.cart[id].qty--; if (state.cart[id].qty <= 0) delete state.cart[id]; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); return; }
        if (action === 'remove' && id && state.cart[id]) { delete state.cart[id]; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); showToast('Item dihapus'); return; }
        if (action === 'confirm-wa') return handleCheckout();
        if (action === 'toast') return showToast(actionBtn.dataset.msg);
        if (action === 'share') return shareToWhatsApp();
        if (action === 'open-promo') return openPromoModal();
      }

      if (e.target.closest('#btnOpenPayment')) {
        if (getCartSummary().items.length === 0) return showToast('Keranjang kosong');
        if (state.userDistance === null) return showToast('Mohon tunggu, menghitung jarak pengiriman...');
        if (state.userDistance > SYSTEM.MAX_DISTANCE) return showToast('Maaf, pengiriman di luar jangkauan');
        document.getElementById('paymentTotalDisplay').textContent = document.getElementById('finalTotal').textContent;
        closeMiniCart(); document.getElementById('paymentModal').classList.add('active'); document.body.style.overflow = 'hidden'; return;
      }

      const menuItem = e.target.closest('.menu-item');
      if (menuItem && !e.target.closest('.add-btn') && !e.target.closest('.qty-btn')) return openProductModal(menuItem.dataset.id);

      const catBtn = e.target.closest('.cat-pill');
      if (catBtn && catBtn.dataset.cat) {
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        catBtn.classList.add('active'); state.activeFilter = catBtn.dataset.cat; updateUI(); return;
      }

      const faqToggle = e.target.closest('[data-toggle="faq"]');
      if (faqToggle) return faqToggle.closest('.faq-item')?.classList.toggle('open');

      if (e.target.closest('#modalClose') || e.target === productModal) return closeProductModal();
      if (e.target.closest('#miniCartClose') || e.target === miniCartModal) return closeMiniCart();
      if (e.target.closest('#paymentClose') || e.target === document.getElementById('paymentModal')) {
        document.getElementById('paymentModal').classList.remove('active'); document.body.style.overflow = ''; return;
      }
      if (e.target.closest('#clearCartBtn')) return clearCart();
      if (e.target.closest('.cart-summary')) return openMiniCart();

      if (e.target.closest('#downloadQrisBtnPayment')) {
        const url = document.getElementById('qrisImagePayment').src;
        fetch(url).then(r => r.blob()).then(blob => {
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'QRIS-RujakCo.jpg';
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
        }).catch(() => { window.location.href = url; });
        return;
      }
      if (e.target.closest('#clearSearchBtn')) {
        searchInput.value = ''; state.searchQuery = ''; updateUI(); updateClearButton(); return;
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (productModal.classList.contains('active')) closeProductModal();
        if (miniCartModal.classList.contains('active')) closeMiniCart();
        if (document.getElementById('paymentModal').classList.contains('active')) {
          document.getElementById('paymentModal').classList.remove('active'); document.body.style.overflow = '';
        }
        if (promoModal.classList.contains('active')) closePromoModal();
      }
    });

    const qrisImg = document.getElementById('qrisImagePayment');
    qrisImg.addEventListener('click', function() { this.classList.toggle('qr-zoomed'); });
    qrisImg.addEventListener('dblclick', function() { this.classList.toggle('qr-zoomed'); });

    window.addEventListener('scroll', () => { document.getElementById('header')?.classList.toggle('shadowed', window.scrollY > 4); });
  }

  // ===================== INIT =====================
  function init() {
    loadCart(); loadCustomerData(); updateStoreStatus();
    document.getElementById('shareStrip').style.display = 'none';
    try { const s = localStorage.getItem('rujak_cart_minimized'); if (s !== null) state.isCartMinimized = s === 'true'; } catch (_) {}
    updateUI(); detectLocation(); bindEvents();

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    else { const int = setInterval(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) { lucide.createIcons(); clearInterval(int); } }, 100); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();