(function() {
  'use strict';

  // ===================== SUPABASE =====================
  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";

  let supabase = null;
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.info('ℹ️ Mode offline - pesan via WhatsApp tetap bisa');
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
    DEFAULT_DISTANCE: 2,
    OSRM_TIMEOUT: 5000
  };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null,
    isPriority: false, orderNotes: '', isCartMinimized: false, customerName: '',
    customerPhone: '', customerAddress: '', isGift: false, giftSender: '',
    giftMessage: '', hasShared: false,
    shippingProvider: 'pembeli', vehicleType: 'motor', currentStep: 1
  };

  // ===================== VALIDASI & SANITASI =====================
  function sanitize(str) {
    return String(str || '')
      .replace(/[<>]/g, '')
      .trim()
      .substring(0, 500);
  }

  function validateName(name) {
    return sanitize(name).length >= 2;
  }

  function validatePhone(phone) {
    const cleaned = String(phone || '').replace(/\D/g, '');
    return /^08\d{8,12}$/.test(cleaned);
  }

  function validateAddress(address) {
    return sanitize(address).length >= 5;
  }

  // ===================== UTILITIES =====================
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  
  function loadCart() { 
    try { 
      const s = localStorage.getItem('rujak_cart'); 
      if (s) { 
        const p = JSON.parse(s); 
        if (typeof p === 'object' && p !== null) state.cart = p; 
      } 
    } catch (_) { 
      console.info('ℹ️ Data keranjang tidak terbaca, mulai dari awal');
      state.cart = {}; 
    } 
  }
  
  function saveCart() { 
    try { 
      localStorage.setItem('rujak_cart', JSON.stringify(state.cart)); 
    } catch (e) { 
      console.warn('⚠️ Penyimpanan penuh, bersihkan data browser:', e.message);
      showToast('⚠️ Penyimpanan penuh! Hapus data browser');
    } 
  }
  
  function getItemById(id) {
    if (id === 'p_vip' || id.startsWith('p_vip_')) return VIP_PRODUCT;
    let item = PRODUCTS.find(p => p.id === id) || ADDONS.find(a => a.id === id);
    if (item) return item;
    return PRODUCTS.find(p => id.startsWith(p.id + '_'));
  }
  
  function debounce(fn, delay) { 
    let t; 
    return function(...args) { 
      clearTimeout(t); 
      t = setTimeout(() => fn.apply(this, args), delay); 
    }; 
  }

  // ===================== LOCATION SERVICE =====================
  async function fetchOSRMDistance(originLat, originLng, destLat, destLng) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SYSTEM.OSRM_TIMEOUT);
    
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.warn('⚠️ OSRM API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        return Math.round((data.routes[0].distance / 1000) * 10) / 10;
      }
      return null;
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') {
        console.info('⏱️ OSRM timeout, menggunakan fallback');
      } else {
        console.warn('⚠️ OSRM error:', e.message);
      }
      return null;
    }
  }

  // ===================== DISCOUNT & SHIPPING =====================
  function calculateDiscount(subtotal) {
    let discount = 0;
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) discount += 5000;
    if (state.hasShared) discount += 5000;
    return discount;
  }

  function calculateShippingCost(distance) {
    if (state.shippingProvider === 'pembeli') return 0;
    if (distance === null || distance === undefined || distance > SYSTEM.MAX_DISTANCE) 
      return Infinity;
    
    if (distance < 0.5) return 0;
    
    const distKm = Math.ceil(distance);
    const extraKm = Math.max(0, distKm - 3);
    let base = state.vehicleType === 'mobil' ? 20000 : 11000;
    let perKm = state.vehicleType === 'mobil' ? 4000 : 2000;
    if (state.isPriority) base += 8000;
    return base + (extraKm * perKm);
  }

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
    const shippingCost = calculateShippingCost(distance);
    const total = subtotal - discount + (shippingCost === Infinity ? 0 : shippingCost);
    const isOutOfRange = distance > SYSTEM.MAX_DISTANCE && state.shippingProvider === 'rujakco';
    return { items, totalQty, subtotal, discount, shippingCost, shippingDistance: distance, total, isOutOfRange };
  }

  // ===================== UI RENDERING =====================
  function renderMenu() {
    const container = document.getElementById('menuList');
    const empty = document.getElementById('emptyState');
    const skeleton = document.getElementById('skeletonContainer');
    if (!container) return;
    
    if (skeleton) skeleton.style.display = 'none';
    container.style.display = 'block';
    
    if (state.activeFilter === 'addon') { 
      container.innerHTML = ''; 
      if (empty) empty.style.display = 'none'; 
      return; 
    }
    
    let filtered = PRODUCTS.filter(p => {
      const matchCat = (state.activeFilter === 'all' || p.cat === state.activeFilter);
      const q = state.searchQuery.toLowerCase();
      return matchCat && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    });
    
    if (state.searchQuery.toLowerCase().includes('vip') && !filtered.some(p => p.id === 'p_vip')) {
      filtered = [VIP_PRODUCT, ...filtered];
    }
    
    if (!filtered.length) { 
      if (empty) empty.style.display = 'block'; 
      container.innerHTML = ''; 
      return; 
    }
    
    if (empty) empty.style.display = 'none';
    let html = '';
    
    filtered.forEach(p => {
      const cartKeys = Object.keys(state.cart).filter(k => 
        k === p.id || k.startsWith(p.id + '_')
      );
      const qty = cartKeys.reduce((sum, k) => sum + (state.cart[k]?.qty || 0), 0);
      const firstCartKey = cartKeys[0] || p.id;
      
      const control = qty === 0 
        ? `<button type="button" class="add-btn" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` 
        : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${firstCartKey}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${firstCartKey}">+</button></div>`;
      
      const badgeRight = p.badge ? `<span class="item-badge-right ${p.badgeColor || ''}">${p.badge}</span>` : '';
      const flavorTag = p.flavorTag ? `<span class="item-flavor-tag">${p.flavorTag}</span>` : '';
      const buahChips = (p.buah || []).slice(0, 4).map(b => `<span class="item-buah-chip">${b}</span>`).join('');
      const moreChips = (p.buah || []).length > 4 ? `<span class="item-buah-chip">+${p.buah.length - 4}</span>` : '';
      
      html += `<div class="menu-item" data-id="${p.id}" tabindex="0" role="button" aria-label="Detail ${p.name}"><div class="item-img-wrap"><img src="${p.thumbnail}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.nextElementSibling.textContent='${p.name.substring(0,20)}'"><div class="fallback" style="display:none;">${p.name.substring(0,20)}</div></div><div class="item-body"><div class="item-name-row"><span class="item-name">${p.name}</span>${badgeRight}</div><div class="item-flavor-row"><span class="item-flavor">${p.flavor}</span>${flavorTag}</div><div class="item-spice">🌶️ Level 1–5</div><p class="item-desc">${p.desc}</p><div class="item-buah-chips">${buahChips}${moreChips}</div><div class="item-footer"><div><span class="item-price">${fmt(p.price)}</span><span class="item-portion"> · ${p.portion}</span></div>${control}</div></div></div>`;
    });
    container.innerHTML = html;
  }

  function renderAddons() {
    const container = document.getElementById('addonList');
    if (!container) return;
    
    const q = state.searchQuery.toLowerCase();
    const filtered = ADDONS.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    let html = '';
    
    filtered.forEach(a => {
      const entry = state.cart[a.id]; const qty = entry ? entry.qty : 0;
      const control = qty === 0 
        ? `<button type="button" class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` 
        : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      
      html += `<div class="addon-card"><div class="addon-icon ${a.iconColor || ''}"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div><div class="addon-name">${a.name}</div><div class="addon-desc">${a.desc}</div><div class="addon-footer"><span class="addon-price">${fmt(a.price)}</span>${control}</div></div>`;
    });
    
    container.innerHTML = html;
    const header = document.getElementById('addonHeader');
    const divider = document.getElementById('addonDivider');
    const show = filtered.length > 0;
    if (header) header.style.display = show ? 'flex' : 'none'; 
    if (divider) divider.style.display = show ? 'block' : 'none';
  }

  function updateProgressBar(subtotal) {
    const container = document.getElementById('progressContainer');
    if (!container) return;
    
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) { 
      container.style.display = 'none'; 
      return; 
    }
    const remaining = SYSTEM.DISCOUNT_THRESHOLD - subtotal;
    const progressPercent = Math.min(100, Math.round((subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
    container.style.display = 'block';
    
    const label = document.getElementById('progressLabel');
    const percent = document.getElementById('progressPercent');
    const fill = document.getElementById('progressFill');
    
    if (label) label.textContent = `Tambah ${fmt(remaining)} lagi untuk potongan Rp5.000`;
    if (percent) percent.textContent = progressPercent + '%';
    if (fill) {
      fill.style.width = progressPercent + '%';
      fill.style.background = progressPercent >= 80 ? 'var(--green)' : 'var(--red)';
    }
  }

  function updateMissionCheckboxes(subtotal) {
    const missionSpend = document.getElementById('missionSpend');
    const checkShare = document.getElementById('checkShare');
    if (missionSpend) missionSpend.checked = subtotal >= SYSTEM.DISCOUNT_THRESHOLD;
    if (checkShare) checkShare.checked = state.hasShared;
  }

  function renderCart() {
    const summary = getCartSummary();
    updateProgressBar(summary.subtotal); 
    updateMissionCheckboxes(summary.subtotal);
    
    const bar = document.getElementById('bottom-bar');
    const discountLabel = document.getElementById('discountLabel');
    const totalEl = document.getElementById('cartTotalDisplay');
    const footerEl = document.querySelector('.footer-brand');
    
    if (summary.totalQty > 0 && !state.isCartMinimized) {
      if (bar) bar.classList.add('visible');
      if (footerEl) footerEl.style.paddingBottom = '180px';
      
      const preview = document.getElementById('cartPreview');
      if (preview) preview.textContent = summary.totalQty + ' item' + (summary.totalQty > 1 ? 's' : '');
      
      if (summary.discount > 0) {
        if (discountLabel) {
          discountLabel.style.display = 'inline-block';
          discountLabel.textContent = '-Rp' + summary.discount.toLocaleString('id-ID');
        }
        if (totalEl) totalEl.innerHTML = `<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;margin-right:4px;">${fmt(summary.subtotal)}</span>${fmt(summary.subtotal - summary.discount)}`;
      } else { 
        if (discountLabel) discountLabel.style.display = 'none'; 
        if (totalEl) totalEl.textContent = fmt(summary.subtotal); 
      }
    } else {
      if (bar) bar.classList.remove('visible');
      if (footerEl) footerEl.style.paddingBottom = '0';
    }
    saveCart(); 
    updateFloatingButton();
  }

  function renderMiniCart() {
    const summary = getCartSummary();
    
    const list = document.getElementById('miniCartList');
    if (list) {
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
    }
    
    const subtotalEl = document.getElementById('cartSubtotalDisplay');
    if (subtotalEl) subtotalEl.textContent = fmt(summary.subtotal);

    const finalSubtotal = document.getElementById('finalSubtotal');
    const finalDiscount = document.getElementById('finalDiscount');
    const finalShipping = document.getElementById('finalShipping');
    const finalTotal = document.getElementById('finalTotal');
    
    if (finalSubtotal) finalSubtotal.textContent = fmt(summary.subtotal);
    if (finalDiscount) finalDiscount.textContent = summary.discount > 0 ? '-Rp' + summary.discount.toLocaleString('id-ID') : 'Rp0';
    if (finalShipping) finalShipping.textContent = summary.shippingCost === Infinity ? '❌ Luar jangkauan' : fmt(summary.shippingCost);
    if (finalTotal) finalTotal.textContent = summary.isOutOfRange ? '❌' : fmt(summary.total);

    const btnPay = document.getElementById('btnOpenPayment');
    if (btnPay) {
      if (state.userDistance === null) { 
        btnPay.disabled = true; 
        btnPay.textContent = '⏳ Mencari lokasi...'; 
      }
      else if (summary.isOutOfRange) { 
        btnPay.disabled = true; 
        btnPay.textContent = 'Di luar jangkauan'; 
      }
      else if (summary.items.length === 0) { 
        btnPay.disabled = true; 
        btnPay.textContent = 'Keranjang kosong'; 
      }
      else { 
        btnPay.disabled = false; 
        btnPay.textContent = '💳 Bayar Via QRIS'; 
      }
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  function updateUI() {
    renderMenu(); 
    renderAddons(); 
    renderCart();
    const miniCart = document.getElementById('miniCartModal');
    if (miniCart && miniCart.classList.contains('active')) {
      renderMiniCart();
    }
    updateClearButton(); 
    updateFloatingButton();
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  // ===================== STEP NAVIGATION =====================
  function goToStep(step) {
    state.currentStep = step;
    document.querySelectorAll('.cart-step').forEach(el => el.classList.remove('active'));
    const stepEl = document.getElementById(`cartStep${step}`);
    if (stepEl) stepEl.classList.add('active');
    
    document.querySelectorAll('.step').forEach((el, i) => {
      el.classList.remove('active', 'done');
      if (i + 1 === step) el.classList.add('active');
      else if (i + 1 < step) el.classList.add('done');
    });
    
    if (step === 3) renderMiniCart();
  }

  // ===================== MODALS =====================
  const productModal = document.getElementById('productModal');
  let currentProductId = null;
  const SPICE_NAMES = ['Mild', 'Sedang', 'Pedas', 'Extra Pedas', 'Very Hot'];

  function openProductModal(id) {
    const product = PRODUCTS.find(p => p.id === id) || VIP_PRODUCT;
    if (!product || !productModal) return;
    currentProductId = id;
    
    const modalImg = document.getElementById('modalImg');
    if (modalImg) {
      modalImg.innerHTML = `<img src="${product.thumbnail}" data-hd="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.textContent='${product.name.substring(0,20)}';" onload="if(this.dataset.hd && this.src !== this.dataset.hd) { const hd = new Image(); hd.onload = () => { this.src = this.dataset.hd; }; hd.src = this.dataset.hd; }">`;
    }
    
    const badgeEl = document.getElementById('modalBadge');
    if (badgeEl) {
      if (product.badge) { 
        badgeEl.style.display = 'inline-block'; 
        badgeEl.textContent = product.badge; 
        badgeEl.className = 'modal-badge-eyebrow ' + (product.badgeColor || ''); 
      } else {
        badgeEl.style.display = 'none';
      }
    }
    
    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');
    const containerEl = document.getElementById('modalContainer');
    const sizeEl = document.getElementById('modalSize');
    const sambalEl = document.getElementById('modalSambal');
    const buahEl = document.getElementById('modalBuahText');
    const tagsEl = document.getElementById('modalTags');
    const priceEl = document.getElementById('btnPrice');
    const addBtn = document.getElementById('modalAdd');
    
    if (titleEl) titleEl.textContent = product.name;
    if (descEl) descEl.textContent = product.desc;
    if (containerEl) containerEl.textContent = product.container || '-';
    if (sizeEl) sizeEl.textContent = product.size || '-';
    if (sambalEl) sambalEl.textContent = product.sambal || '-';
    if (buahEl) buahEl.textContent = (product.buah || []).join(', ');
    if (tagsEl) tagsEl.innerHTML = (product.tags || []).map(t => `<span class="modal-tag">${t}</span>`).join('');
    if (priceEl) priceEl.textContent = fmt(product.price);
    if (addBtn) addBtn.dataset.id = product.id;
    
    const select = document.getElementById('spiceSelect');
    if (select) {
      const defaultVal = product.defaultSpice || 3;
      select.value = defaultVal; 
      updateSpiceHighlight(defaultVal);
      select.onchange = function() { updateSpiceHighlight(parseInt(this.value, 10)); };
    }
    
    productModal.classList.add('active'); 
    document.body.style.overflow = 'hidden';
  }

  function updateSpiceHighlight(level) { 
    const label = document.getElementById('modalSpiceLabel');
    if (label) label.textContent = level + ' - ' + (SPICE_NAMES[level - 1] || 'Pedas'); 
  }
  
  function closeProductModal() { 
    if (productModal) {
      productModal.classList.remove('active'); 
      document.body.style.overflow = ''; 
    }
    currentProductId = null; 
  }

  const miniCartModal = document.getElementById('miniCartModal');
  function openMiniCart() {
    goToStep(1);
    renderMiniCart();
    if (miniCartModal) {
      miniCartModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  
  function closeMiniCart() {
    const notesEl = document.getElementById('orderNotes');
    const nameEl = document.getElementById('customerName');
    const phoneEl = document.getElementById('customerPhone');
    const addressEl = document.getElementById('customerAddress');
    const giftToggle = document.getElementById('giftToggle');
    const senderEl = document.getElementById('giftSender');
    const messageEl = document.getElementById('giftMessage');
    
    state.orderNotes = sanitize(notesEl?.value || '');
    state.customerName = sanitize(nameEl?.value || '');
    state.customerPhone = sanitize(phoneEl?.value || '');
    state.customerAddress = sanitize(addressEl?.value || '');
    state.isGift = giftToggle?.checked || false;
    state.giftSender = sanitize(senderEl?.value || '');
    state.giftMessage = sanitize(messageEl?.value || '');
    
    if (miniCartModal) {
      miniCartModal.classList.remove('active'); 
      document.body.style.overflow = ''; 
    }
    saveCustomerData();
  }
  
  function clearCart() {
    if (Object.keys(state.cart).length === 0) return showToast('Keranjang sudah kosong');
    if (confirm('Yakin ingin mengosongkan keranjang?')) { 
      state.cart = {}; 
      updateUI(); 
      if (miniCartModal && miniCartModal.classList.contains('active')) renderMiniCart(); 
      showToast('Keranjang dikosongkan'); 
    }
  }

  // ===================== DATABASE & CHECKOUT =====================
  async function saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount) {
    if (!supabase) {
      console.info('ℹ️ Mode offline - order tetap lanjut ke WhatsApp');
      return false;
    }
    
    try {
      const payload = { 
        customer_name: sanitize(state.customerName || 'Guest'), 
        customer_phone: sanitize(state.customerPhone || ''), 
        customer_address: sanitize(state.customerAddress || ''), 
        items: orderItems.map(item => ({
          id: item.id,
          name: sanitize(item.name),
          price: item.price,
          qty: item.qty,
          spice: item.spice,
          lineTotal: item.lineTotal
        })), 
        subtotal, 
        shipping_cost: shippingCost, 
        discount, 
        total, 
        status: 'pending', 
        is_gift: state.isGift, 
        gift_sender: sanitize(state.giftSender || null), 
        gift_message: sanitize(state.giftMessage || null), 
        mission_shared: state.hasShared, 
        shipping_provider: sanitize(state.shippingProvider), 
        vehicle: sanitize(state.vehicleType), 
        priority: state.isPriority 
      };
      
      const { error } = await supabase.from('orders').insert([payload]);
      if (error) throw error; 
      return true;
    } catch (err) { 
      console.error('⚠️ Gagal menyimpan ke database:', err.message); 
      return false; 
    }
  }

  function handleCheckout() {
    const summary = getCartSummary();
    
    if (summary.isOutOfRange) return showToast('Maaf, pengiriman di luar jangkauan');
    
    const name = sanitize(state.customerName);
    const phone = sanitize(state.customerPhone);
    const address = sanitize(state.customerAddress);
    
    if (!validateName(name)) return showToast('❌ Nama minimal 2 karakter'), document.getElementById('customerName')?.focus();
    if (!validatePhone(phone)) return showToast('❌ Nomor HP tidak valid (08xx)'), document.getElementById('customerPhone')?.focus();
    if (!validateAddress(address)) return showToast('❌ Alamat minimal 5 karakter'), document.getElementById('customerAddress')?.focus();
    if (summary.items.length === 0) return showToast('Keranjang kosong');

    const payBtn = document.querySelector('[data-action="confirm-wa"]');
    if (payBtn) {
      payBtn.textContent = '⏳ Menyimpan...';
      payBtn.disabled = true;
    }

    saveOrderToDatabase(summary.items, summary.total, summary.subtotal, summary.shippingCost, summary.discount)
      .then((saved) => {
        showToast(saved ? '✅ Pesanan tersimpan' : '⚠️ Lanjut WhatsApp tanpa simpan');
      })
      .catch(() => {
        showToast('⚠️ Gagal menyimpan, lanjut WhatsApp');
        if (payBtn) {
          payBtn.textContent = '💳 Bayar Via QRIS';
          payBtn.disabled = false;
        }
      })
      .finally(() => {
        let msg = 'Halo Rujak.Co! Saya ingin memesan:\n\n';
        summary.items.forEach(item => { 
          const spiceText = item.spice ? ' (Level ' + item.spice + ')' : ''; 
          msg += '• ' + item.name + spiceText + ' (x' + item.qty + ') — ' + fmt(item.lineTotal) + '\n'; 
        });
        msg += '\n*Pengiriman:* ' + (state.shippingProvider === 'pembeli' ? 'Kirim Sendiri (diambil)' : 'Kirim Rujak.Co - ' + state.vehicleType + (state.isPriority ? ' (Prioritas)' : ''));
        if (state.shippingProvider === 'rujakco') msg += '\n*Ongkir:* ' + fmt(summary.shippingCost);
        if (state.orderNotes) msg += '\n*Catatan:* ' + state.orderNotes;
        if (state.isGift) { 
          msg += '\n🎁 Kado dari: ' + (state.giftSender || '') + '\nPesan: ' + (state.giftMessage || ''); 
        }
        msg += '\n\n*Data:*\nNama: ' + name + '\nHP: ' + phone + '\nAlamat: ' + address;
        msg += '\n\nSubtotal: ' + fmt(summary.subtotal);
        if (summary.discount > 0) msg += '\nDiskon: -' + fmt(summary.discount);
        msg += '\n*Total QRIS: ' + fmt(summary.total) + '*\n\n*Saya sudah transfer, ini buktinya:*';
        
        setTimeout(() => {
          window.location.href = 'https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg);
        }, 800);
      });
  }

  function saveCustomerData() { 
    try { 
      localStorage.setItem('rujak_customer', JSON.stringify({ 
        name: sanitize(state.customerName), 
        phone: sanitize(state.customerPhone), 
        address: sanitize(state.customerAddress), 
        isGift: state.isGift, 
        giftSender: sanitize(state.giftSender), 
        giftMessage: sanitize(state.giftMessage), 
        hasShared: state.hasShared 
      })); 
    } catch (e) {
      console.warn('⚠️ Gagal menyimpan data pelanggan');
    } 
  }
  
  function loadCustomerData() { 
    try { 
      const raw = localStorage.getItem('rujak_customer'); 
      if (raw) { 
        const data = JSON.parse(raw); 
        state.customerName = sanitize(data.name || ''); 
        state.customerPhone = sanitize(data.phone || ''); 
        state.customerAddress = sanitize(data.address || ''); 
        state.isGift = data.isGift || false; 
        state.giftSender = sanitize(data.giftSender || ''); 
        state.giftMessage = sanitize(data.giftMessage || ''); 
        state.hasShared = data.hasShared || false; 
      } 
    } catch (_) {} 
  }

  // ===================== TOAST & NOTIFICATIONS =====================
  let toastTimer;
  function showToast(msg) { 
    const el = document.getElementById('toast'); 
    if (!el) return;
    el.textContent = msg; 
    el.classList.remove('show'); 
    void el.offsetWidth; 
    el.classList.add('show'); 
    clearTimeout(toastTimer); 
    toastTimer = setTimeout(() => el.classList.remove('show'), SYSTEM.TOAST_DURATION); 
  }

  // ===================== FLOATING BUTTON =====================
  function updateFloatingButton() { 
    const btn = document.getElementById('floatingCartBtn');
    const badge = document.getElementById('floatingBadge'); 
    const summary = getCartSummary(); 
    const bar = document.getElementById('bottom-bar');
    const barVisible = bar && bar.classList.contains('visible');
    
    if (state.isCartMinimized && summary.totalQty > 0 && !barVisible) { 
      if (btn) btn.classList.add('visible'); 
      if (badge) badge.textContent = summary.totalQty; 
    } else {
      if (btn) btn.classList.remove('visible'); 
    }
  }
  
  function minimizeCart() { 
    state.isCartMinimized = true; 
    try { localStorage.setItem('rujak_cart_minimized', 'true'); } catch(e) {}
    
    const bar = document.getElementById('bottom-bar');
    if (bar) bar.classList.remove('visible'); 
    updateFloatingButton(); 
    const footer = document.querySelector('.footer-brand'); 
    if (footer) footer.style.paddingBottom = '0'; 
  }
  
  function expandCart() { 
    state.isCartMinimized = false; 
    try { localStorage.setItem('rujak_cart_minimized', 'false'); } catch(e) {}
    
    updateFloatingButton(); 
    renderCart(); 
  }

  function updateStoreStatus() { 
    const status = document.getElementById('storeStatusText');
    const indicator = document.getElementById('storeStatus');
    if (status) status.textContent = 'Buka'; 
    if (indicator) indicator.classList.remove('closed'); 
  }
  
  function shareToWhatsApp() { 
    window.location.href = 'https://wa.me/?text=' + encodeURIComponent('Hai! Cobain Rujak.Co yuk — rujak premium dengan buah segar pilihan dan sambal khas Indonesia. Lihat menu dan pesan langsung di sini:\n' + window.location.href); 
  }

  // ===================== PROMO MODAL =====================
  const promoModal = document.getElementById('promoModal');
  function openPromoModal() { 
    const summary = getCartSummary(); 
    updateMissionCheckboxes(summary.subtotal); 
    if (promoModal) {
      promoModal.classList.add('active'); 
      document.body.style.overflow = 'hidden'; 
    }
  }
  
  function closePromoModal() { 
    if (promoModal) {
      promoModal.classList.remove('active'); 
      document.body.style.overflow = ''; 
    }
  }

  // ===================== SEARCH =====================
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  function updateClearButton() { 
    if (clearSearchBtn && searchInput) {
      clearSearchBtn.classList.toggle('visible', searchInput.value.length > 0); 
    }
  }

  // ===================== LOCATION DETECTION =====================
  async function detectLocation() {
    const STORE_LAT = -6.2333, STORE_LNG = 107.0;
    const costEl = document.getElementById('shippingCost');
    if (costEl) costEl.textContent = '⏳ Mencari lokasi...';
    
    const outOfRange = document.getElementById('outOfRange');
    if (outOfRange) outOfRange.style.display = 'none';
    
    if (!navigator.geolocation) { 
      showToast('❌ GPS tidak tersedia'); 
      if (costEl) costEl.textContent = '📍 Butuh GPS';
      return; 
    }
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      if (costEl) costEl.textContent = '🛣️ Menghitung rute...';
      
      const roadDistance = await fetchOSRMDistance(STORE_LAT, STORE_LNG, lat, lng);
      state.userDistance = roadDistance !== null ? roadDistance : Math.round(((() => { 
        const R = 6371; 
        const dLat = (lat - STORE_LAT) * Math.PI / 180; 
        const dLon = (lng - STORE_LNG) * Math.PI / 180; 
        const a = Math.sin(dLat/2)**2 + Math.cos(STORE_LAT * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLon/2)**2; 
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      })()) * 1.35 * 10) / 10;
      
      const cacheKey = `geocode_${lat.toFixed(2)}_${lng.toFixed(2)}`;
      let cityName = localStorage.getItem(cacheKey);
      
      if (!cityName) {
        try { 
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=id`); 
          const data = await res.json(); 
          cityName = data.address?.city || data.address?.town || 'Lokasi Anda'; 
          try { localStorage.setItem(cacheKey, cityName); } catch(e) {}
        } catch (_) { 
          cityName = 'Lokasi Anda'; 
        }
      }
      
      const locDisplay = document.getElementById('locationDisplay');
      if (locDisplay) locDisplay.textContent = cityName + ' ▾'; 
      
      updateShippingUI();
    }, () => { 
      if (costEl) costEl.textContent = '❌ GPS wajib'; 
      if (outOfRange) {
        outOfRange.style.display = 'block'; 
        outOfRange.textContent = '⚠️ GPS harus diaktifkan untuk memesan.'; 
      }
      showToast('❌ GPS wajib!'); 
      state.userDistance = null; 
    }, { enableHighAccuracy: true, timeout: 15000 });
  }

  function updateShippingUI() {
    const d = state.userDistance;
    const costEl = document.getElementById('shippingCost');
    const distEl = document.getElementById('shippingDistance');
    const outOfRange = document.getElementById('outOfRange');
    
    if (d === null || d === undefined) { 
      if (costEl) costEl.textContent = '⏳ Mencari lokasi...'; 
      if (distEl) distEl.textContent = ''; 
      return; 
    }
    
    if (distEl) distEl.textContent = '~' + Math.ceil(d) + ' km';
    
    if (d > SYSTEM.MAX_DISTANCE && state.shippingProvider === 'rujakco') { 
      if (costEl) costEl.textContent = '❌'; 
      if (outOfRange) outOfRange.style.display = 'block'; 
    } else { 
      if (outOfRange) outOfRange.style.display = 'none'; 
      const cost = calculateShippingCost(d); 
      if (costEl) costEl.textContent = cost === 0 ? 'Gratis' : fmt(cost); 
    }
    
    const miniCart = document.getElementById('miniCartModal');
    if (miniCart && miniCart.classList.contains('active')) renderMiniCart();
  }

  // ===================== EVENT BINDING =====================
  function bindEvents() {
    const modalAdd = document.getElementById('modalAdd');
    if (modalAdd) {
      modalAdd.addEventListener('click', function() {
        const baseId = this.dataset.id;
        if (baseId) { 
          const select = document.getElementById('spiceSelect');
          const spice = select ? (parseInt(select.value, 10) || 3) : 3; 
          const cartKey = baseId + '_' + spice; 
          const entry = state.cart[cartKey] || { qty: 0, spice: spice }; 
          entry.qty += 1; 
          entry.spice = spice; 
          state.cart[cartKey] = entry; 
          updateUI(); 
          showToast('Berhasil ditambahkan ✓'); 
          closeProductModal(); 
        }
      });
    }

    document.getElementById('step1Next')?.addEventListener('click', () => { goToStep(2); });
    document.getElementById('step2Back')?.addEventListener('click', () => { goToStep(1); });
    document.getElementById('step2Next')?.addEventListener('click', () => { goToStep(3); renderMiniCart(); });
    document.getElementById('step3Back')?.addEventListener('click', () => { goToStep(2); });

    document.querySelectorAll('.ship-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.shippingProvider = this.dataset.provider;
        const rujakOpts = document.getElementById('rujakcoOptions');
        if (rujakOpts) rujakOpts.style.display = state.shippingProvider === 'rujakco' ? 'block' : 'none';
        updateShippingUI();
      });
    });
    
    document.querySelectorAll('.veh-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.vehicleType = this.dataset.vehicle;
        updateShippingUI();
      });
    });
    
    document.getElementById('priorityToggleMini')?.addEventListener('change', function() {
      state.isPriority = this.checked;
      const priorityToggle = document.getElementById('priorityToggle');
      if (priorityToggle) priorityToggle.checked = this.checked;
      updateShippingUI();
    });
    
    document.getElementById('priorityToggle')?.addEventListener('change', function() {
      state.isPriority = this.checked;
      const priorityToggleMini = document.getElementById('priorityToggleMini');
      if (priorityToggleMini) priorityToggleMini.checked = this.checked;
      updateShippingUI();
    });

    document.getElementById('shareBtnModal')?.addEventListener('click', function() { 
      state.hasShared = true; 
      saveCustomerData(); 
      updateUI(); 
      showToast('Diskon Rp5.000 berhasil diaktifkan!'); 
      shareToWhatsApp(); 
    });
    
    document.getElementById('promoTrigger')?.addEventListener('click', openPromoModal);
    document.getElementById('promoClose')?.addEventListener('click', closePromoModal);
    promoModal?.addEventListener('click', function(e) { if (e.target === promoModal) closePromoModal(); });

    document.getElementById('closeBottomBar')?.addEventListener('click', e => { e.stopPropagation(); minimizeCart(); });
    document.getElementById('floatingCartBtn')?.addEventListener('click', expandCart);

    document.getElementById('giftToggle')?.addEventListener('change', function() {
      state.isGift = this.checked; 
      const giftFields = document.getElementById('giftFields');
      if (giftFields) giftFields.style.display = this.checked ? 'block' : 'none'; 
      saveCustomerData();
    });

    const searchToggleWrap = document.getElementById('searchToggleWrap');
    const searchIconBtn = document.getElementById('searchIconBtn');
    const searchInputWrap = document.getElementById('searchInputWrap');
    
    if (searchIconBtn && searchInputWrap) { 
      searchIconBtn.addEventListener('click', () => { 
        searchInputWrap.classList.toggle('open'); 
        if (searchInputWrap.classList.contains('open') && searchInput) searchInput.focus(); 
      }); 
      document.addEventListener('click', (e) => { 
        if (searchToggleWrap && !searchToggleWrap.contains(e.target)) searchInputWrap.classList.remove('open'); 
      }); 
    }

    if (searchInput) {
      searchInput.addEventListener('input', debounce(function() { 
        state.searchQuery = this.value; 
        updateUI(); 
        updateClearButton(); 
      }, 300));
      searchInput.addEventListener('keyup', updateClearButton);
    }

    document.addEventListener('click', function(e) {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const { action, id } = actionBtn.dataset;
        if (action === 'open-modal' && id) return openProductModal(id);
        if (action === 'open-cart') return openMiniCart();
        if (action === 'add-addon' && id) { 
          if (!state.cart[id]) state.cart[id] = { qty: 0 }; 
          state.cart[id].qty++; 
          updateUI(); 
          showToast('Berhasil ditambahkan ✓'); 
          return; 
        }
        if (action === 'increase' && id && state.cart[id]) { 
          state.cart[id].qty++; 
          updateUI(); 
          if (miniCartModal && miniCartModal.classList.contains('active')) renderMiniCart(); 
          return; 
        }
        if (action === 'decrease' && id && state.cart[id]) { 
          state.cart[id].qty--; 
          if (state.cart[id].qty <= 0) delete state.cart[id]; 
          updateUI(); 
          if (miniCartModal && miniCartModal.classList.contains('active')) renderMiniCart(); 
          return; 
        }
        if (action === 'remove' && id && state.cart[id]) { 
          delete state.cart[id]; 
          updateUI(); 
          if (miniCartModal && miniCartModal.classList.contains('active')) renderMiniCart(); 
          showToast('Item dihapus'); 
          return; 
        }
        if (action === 'confirm-wa') return handleCheckout();
        if (action === 'toast') return showToast(actionBtn.dataset.msg);
        if (action === 'share') return shareToWhatsApp();
        if (action === 'open-promo') return openPromoModal();
      }
      
      if (e.target.closest('#btnOpenPayment')) {
        const summary = getCartSummary();
        if (summary.items.length === 0) return showToast('Keranjang kosong');
        if (state.userDistance === null) return showToast('⏳ Menunggu lokasi...');
        if (summary.isOutOfRange) return showToast('Di luar jangkauan');
        const finalTotal = document.getElementById('finalTotal');
        const paymentTotal = document.getElementById('paymentTotalDisplay');
        if (paymentTotal && finalTotal) paymentTotal.textContent = finalTotal.textContent || 'Rp0';
        closeMiniCart(); 
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal) {
          paymentModal.classList.add('active'); 
          document.body.style.overflow = 'hidden'; 
        }
        return;
      }
      
      if (e.target.closest('#clearCartBtn')) return clearCart();
      
      if (e.target.closest('#downloadQrisBtnPayment')) {
        const qrisImg = document.getElementById('qrisImagePayment');
        if (qrisImg) {
          fetch(qrisImg.src)
            .then(r => r.blob())
            .then(blob => { 
              const a = document.createElement('a'); 
              a.href = URL.createObjectURL(blob); 
              a.download = 'QRIS-RujakCo.jpg'; 
              document.body.appendChild(a); 
              a.click(); 
              document.body.removeChild(a); 
            })
            .catch(() => showToast('⚠️ Gagal download QRIS'));
        }
        return;
      }
      
      if (e.target.closest('#clearSearchBtn')) { 
        if (searchInput) {
          searchInput.value = ''; 
          state.searchQuery = ''; 
          updateUI(); 
          updateClearButton(); 
        }
        return; 
      }
      
      const menuItem = e.target.closest('.menu-item');
      if (menuItem && !e.target.closest('.add-btn') && !e.target.closest('.qty-btn')) {
        return openProductModal(menuItem.dataset.id);
      }
      
      const catBtn = e.target.closest('.cat-pill');
      if (catBtn && catBtn.dataset.cat) { 
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active')); 
        catBtn.classList.add('active'); 
        state.activeFilter = catBtn.dataset.cat; 
        updateUI(); 
        return; 
      }
      
      if (e.target.closest('#miniCartClose') || e.target === miniCartModal) return closeMiniCart();
      if (e.target.closest('#modalClose') || e.target === productModal) return closeProductModal();
      
      if (e.target.closest('#paymentClose') || e.target === document.getElementById('paymentModal')) { 
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal) {
          paymentModal.classList.remove('active'); 
          document.body.style.overflow = ''; 
        }
      }
      
      // FAQ toggle
      const faqQuestion = e.target.closest('[data-toggle="faq"]');
      if (faqQuestion) {
        const faqItem = faqQuestion.closest('.faq-item');
        if (faqItem) faqItem.classList.toggle('open');
      }
    });
    
    // QRIS zoom
    const qrisImg = document.getElementById('qrisImagePayment');
    if (qrisImg) {
      qrisImg.addEventListener('click', function() {
        this.classList.toggle('qr-zoomed');
      });
    }
  }

  // ===================== INITIALIZATION =====================
  function init() {
    loadCart(); 
    loadCustomerData(); 
    updateStoreStatus();
    
    try { 
      const s = localStorage.getItem('rujak_cart_minimized'); 
      if (s !== null) state.isCartMinimized = s === 'true'; 
    } catch (_) {}
    
    const nameEl = document.getElementById('customerName');
    const phoneEl = document.getElementById('customerPhone');
    const addressEl = document.getElementById('customerAddress');
    const giftToggle = document.getElementById('giftToggle');
    const senderEl = document.getElementById('giftSender');
    const messageEl = document.getElementById('giftMessage');
    const giftFields = document.getElementById('giftFields');
    
    if (nameEl) nameEl.value = sanitize(state.customerName);
    if (phoneEl) phoneEl.value = sanitize(state.customerPhone);
    if (addressEl) addressEl.value = sanitize(state.customerAddress);
    if (giftToggle) giftToggle.checked = state.isGift;
    if (senderEl) senderEl.value = sanitize(state.giftSender);
    if (messageEl) messageEl.value = sanitize(state.giftMessage);
    if (giftFields) giftFields.style.display = state.isGift ? 'block' : 'none';
    
    state.shippingProvider = 'pembeli'; 
    state.isPriority = false;
    
    document.querySelectorAll('.ship-btn').forEach(b => b.classList.toggle('active', b.dataset.provider === 'pembeli'));
    document.querySelectorAll('.veh-btn').forEach(b => b.classList.toggle('active', b.dataset.vehicle === 'motor'));
    
    updateUI(); 
    detectLocation(); 
    bindEvents();
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    } else {
      const int = setInterval(() => { 
        if (typeof lucide !== 'undefined' && lucide.createIcons) { 
          lucide.createIcons(); 
          clearInterval(int); 
        } 
      }, 100); 
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();