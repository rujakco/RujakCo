(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO v3.0 — STABLE ENGINE FIX (TRACED & PATCHED)
  // ============================================================

  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";
  const SYSTEM = { DISCOUNT_THRESHOLD: 100000, WA_NUMBER: '6289677161680', STORE_LAT: -6.2165414, STORE_LNG: 107.0177395, DEFAULT_DISTANCE: 2 };

  const PRODUCTS = [
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original Rujak.Co.', price:35000, cat:'classic', tags:['Pilihan Klasik','5 Buah'], badge:null, badgeColor:null, container:'Thinwall 1000ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Segar & Autentik', defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp', isHidden:false },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk pengalaman rasa yang lebih menyatu.', price:26000, cat:'classic', tags:['Renyah','Serut'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Merah'], flavor:'Renyah Segar', defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp', isHidden:false },
    { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah pilihan dengan sambal mete premium.', price:40000, cat:'signature', tags:['Mete Premium','Bestseller'], badge:'Koleksi Favorit', badgeColor:'red', container:'Thinwall 1000ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Mete Premium (1 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Premium', defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp', isHidden:false },
    { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah untuk dua hingga tiga orang.', price:48000, cat:'signature', tags:['Porsi Besar','Sharing'], badge:'Untuk Dibagi Bersama', badgeColor:'red', container:'Thinwall Jumbo 1000ml (PP Food Grade)', size:'Porsi Sharing', sambal:'Sambal Mete Premium (2 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Extra Pedas', defaultSpice:4, portion:'2-3 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp', isHidden:false },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi premium dengan Shine Muscat.', price:85000, cat:'reserve', tags:['Eksklusif','Shine Muscat'], badge:'Reserve Collection', badgeColor:'gold', container:'Thinwall Jumbo 1000ml + Paper Bag', size:'Porsi Premium', sambal:'Sambal Mete Premium (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Eksklusif & Premium', defaultSpice:3, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:false },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Sajian kebersamaan dalam tampah bambu.', price:200000, cat:'reserve', tags:['Tampah','Pre-Order'], badge:'Untuk 8-10 Orang', badgeColor:'gold', container:'Tampah Bambu Ø40cm + Kardus + Wrap', size:'Porsi Besar', sambal:'Varian Original & Mete (4 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi Merah'], flavor:'Kemegahan Berbagai Rasa', defaultSpice:3, portion:'8-10 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp', isHidden:false }
  ];

  const ADDONS = [
    { id:'a_sambal1', name:'Sambal Original', price:8000, icon:'flame', iconColor:'text-red-500', desc:'Warisan rasa klasik.' },
    { id:'a_sambal2', name:'Sambal Mete Premium', price:12000, icon:'flame', iconColor:'text-red-600', desc:'Lebih gurih dan kaya rasa.' },
    { id:'a_extra_jambu', name:'Extra Jambu Kristal', price:10000, icon:'apple', iconColor:'text-green-500', desc:'Tambahan jambu kristal segar' },
    { id:'a_extra_muscat', name:'Extra Shine Muscat', price:15000, icon:'grape', iconColor:'text-purple-500', desc:'Tambahan anggur Shine Muscat' }
  ];

  const DISTRICT_MAP = { 'bekasi barat':5, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11, 'rawalumbu':8, 'jatiasih':12, 'pondokgede':14, 'cikarang':23, 'tambun':16, 'cibitung':20, 'gambir':18, 'menteng':19, 'tebet':20, 'pancoran':21, 'pasar minggu':22, 'kebayoran lama':24, 'kebayoran baru':22, 'mampang prapatan':21, 'pulo gadung':16, 'jatinegara':18, 'duren sawit':15, 'kramat jati':19, 'pasar rebo':20, 'cakung':12, 'kembangan':25, 'kelapa gading':27, 'depok':35, 'tangerang':38, 'bogor':50 };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null, isPriority: false, orderNotes: '', isCartMinimized: false,
    customerName: '', customerPhone: '', customerAddress: '', selectedDistrict: '', useManualDistrict: false,
    shippingProvider: 'rujakco', vehicleType: 'motor', currentProductPage: { id: null, spice: 3, qty: 1 }
  };

  let checkoutLocked = false, cachedSummary = null, toastTimer = null;

  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function showToast(msg) {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
  }

  function getSupabase() { return window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null; }
  function haversineDistance(lat1, lon1, lat2, lon2) { const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); }
  function estimateRoadDistance(straightKm) { return Math.round(straightKm * (straightKm <= 10 ? 1.35 : straightKm <= 20 ? 1.30 : 1.20)); }

  function getItemById(id) {
    let item = PRODUCTS.find(p => p.id === id); if(item) return item;
    const sm = id.match(/^(.+)_spice(\d+)$/); if(sm){ item = PRODUCTS.find(p => p.id === sm[1]); if(item) return item; }
    return ADDONS.find(a => a.id === id) || null;
  }

  function getCartSummary() {
    const items = []; let subtotal = 0, totalQty = 0, mainProductQty = 0;
    Object.keys(state.cart).forEach(id => {
      const entry = state.cart[id], item = getItemById(id);
      if (item && entry && entry.qty > 0) {
        subtotal += item.price * entry.qty; totalQty += entry.qty;
        if (PRODUCTS.some(p => p.id === id.split('_spice')[0])) mainProductQty += entry.qty;
        items.push({ cartId: id, id, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice || null, lineTotal: item.price * entry.qty });
      } else { delete state.cart[id]; }
    });
    return { items, totalQty, mainProductQty, subtotal, discount: 0 };
  }

  function getCartSummaryCached() { if(!cachedSummary) cachedSummary = getCartSummary(); return cachedSummary; }
  function invalidateCache() { cachedSummary = null; try { localStorage.setItem('rujak_cart_v3', JSON.stringify(state.cart)); } catch(e){} }

  function calculateShipping(distance, mainQty) {
    const dist = distance || SYSTEM.DEFAULT_DISTANCE;
    if (dist > 50) return { cost: null, label: 'Konfirmasi Admin' };
    
    if (state.shippingProvider === 'paxel') {
      const large = Math.floor(mainQty / 2), med = mainQty % 2;
      return { cost: (large * 25000) + (med * 20000) + ((large + med) * 3000), label: 'Paxel Same Day' };
    } else {
      let cost = dist <= 3 ? 8000 : dist <= 10 ? 8000 + (dist-3)*1800 : dist <= 20 ? 20600 + (dist-10)*1600 : dist <= 30 ? 36600 + (dist-20)*1400 : 50600 + (dist-30)*1150;
      if (state.vehicleType === 'mobil') cost = dist <= 3 ? 24000 : dist <= 10 ? 24000 + (dist-3)*4500 : dist <= 20 ? 55500 + (dist-10)*4000 : 95500 + (dist-20)*3500;
      if (state.isPriority) cost += 8000;
      return { cost, label: state.vehicleType === 'motor' ? 'Motor' : 'Mobil' };
    }
  }

  function updateShippingUI() {
    const summary = getCartSummaryCached();
    const dist = state.selectedDistrict ? (DISTRICT_MAP[state.selectedDistrict] || estimateRoadDistance(10)) : (state.userDistance || SYSTEM.DEFAULT_DISTANCE);
    const ship = calculateShipping(dist, summary.mainProductQty || 1);
    
    const costEl = document.getElementById('shippingCost'), distEl = document.getElementById('shippingDistance');
    if(costEl) costEl.textContent = ship.cost ? fmt(ship.cost) : 'Konfirmasi';
    if(distEl) distEl.textContent = `~${dist} km`;
    
    const breakdown = document.getElementById('breakdownContent');
    if(breakdown) breakdown.innerHTML = `<div>Jarak: <strong>${dist} km</strong></div><div>Layanan: <strong>${ship.label}</strong></div><div style="border-top:1px solid var(--gray-200); margin-top:6px; padding-top:6px;">Total Ongkir: <strong>${ship.cost ? fmt(ship.cost) : 'Hubungi Kami'}</strong></div>`;
    
    const outRange = document.getElementById('outOfRange');
    if(outRange) outRange.style.display = dist > 50 ? 'block' : 'none';

    const elSubtotal = document.getElementById('finalSubtotal'); if (elSubtotal) elSubtotal.textContent = fmt(summary.subtotal);
    const elShipping = document.getElementById('finalShipping'); if (elShipping) elShipping.textContent = ship.cost ? fmt(ship.cost) : 'Rp0';
    const elTotal = document.getElementById('finalTotal'); if (elTotal) elTotal.textContent = ship.cost ? fmt(summary.subtotal + ship.cost) : 'Konfirmasi';
  }

  function renderMenu() {
    const container = document.getElementById('menuList'); if (!container) return;
    let items = state.activeFilter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === state.activeFilter);
    if(state.searchQuery.length >= 2) items = PRODUCTS.filter(p => p.name.toLowerCase().includes(state.searchQuery.toLowerCase()));

    const empty = document.getElementById('emptyState'), skeleton = document.getElementById('skeletonContainer');
    if(skeleton) skeleton.style.display = 'none';
    if(empty) empty.style.display = items.length ? 'none' : 'block';
    
    container.innerHTML = items.map(p => {
      let qty = 0, firstKey = p.id + '_spice3';
      Object.keys(state.cart).forEach(k => { if(k.startsWith(p.id)) { qty += state.cart[k].qty; firstKey = k; } });
      const badge = p.badge ? `<span class="item-badge-right ${p.badgeColor}">${p.badge}</span>` : '';
      const control = qty === 0 ? `<button class="btn-add-unified" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` : `<div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${firstKey}">-</button><span class="qty-num">${qty}</span><button class="qty-btn" data-action="increase" data-id="${firstKey}">+</button></div>`;
      return `<div class="menu-item" data-id="${p.id}"><div class="item-img-wrap"><img src="${p.thumbnail}" loading="lazy"></div><div class="item-body"><div class="item-name-row"><span class="item-name">${p.name}</span>${badge}</div><p class="item-desc">${p.desc}</p><div class="item-footer"><span class="item-price">${fmt(p.price)}</span>${control}</div></div></div>`;
    }).join('');
    container.style.display = 'block';
    if(window.lucide) window.lucide.createIcons();
  }

  function renderAddons() {
    const container = document.getElementById('addonList'); if (!container) return;
    container.innerHTML = ADDONS.map(a => {
      const qty = state.cart[a.id]?.qty || 0;
      const control = qty === 0 ? `<button class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` : `<div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${a.id}">-</button><span class="qty-num">${qty}</span><button class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      return `<div class="addon-card"><div class="addon-icon ${a.iconColor}"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div><div class="addon-name">${a.name}</div><div class="addon-desc">${a.desc}</div><div class="addon-footer"><span class="addon-price">${fmt(a.price)}</span>${control}</div></div>`;
    }).join('');
    if(window.lucide) window.lucide.createIcons();
  }

  function renderCart() {
    const sum = getCartSummaryCached(), bar = document.getElementById('bottom-bar');
    if (sum.totalQty > 0) {
      if(bar) bar.classList.add('visible');
      const prev = document.getElementById('cartPreview'); if(prev) prev.textContent = `${sum.totalQty} item`;
      const tot = document.getElementById('cartTotalDisplay'); if(tot) tot.textContent = fmt(sum.subtotal);
    } else {
      if(bar) bar.classList.remove('visible');
      const mc = document.getElementById('miniCartModal'); if(mc) mc.classList.remove('active');
    }
  }

  function renderMiniCart() {
    const sum = getCartSummaryCached();
    const list = document.getElementById('miniCartList');
    if(list) list.innerHTML = sum.items.length === 0 ? '<p style="text-align:center;color:#999;padding:20px;">Keranjang kosong.</p>' : sum.items.map(i => `<div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;"><div style="flex:1;"><div style="font-weight:600; font-size:14px; color:var(--green);">${i.name}${i.spice?' (Lv '+i.spice+')':''}</div><div style="font-size:12px; color:var(--gray-500);">${fmt(i.price)}</div></div><div class="qty-control"><button class="qty-btn" style="width:24px;height:24px;background:#f0f0f0;border:none;border-radius:50%;cursor:pointer;" data-action="decrease" data-id="${i.cartId}">-</button><span style="font-weight:600;font-size:13px;width:20px;text-align:center;">${i.qty}</span><button class="qty-btn" style="width:24px;height:24px;background:#f0f0f0;border:none;border-radius:50%;cursor:pointer;" data-action="increase" data-id="${i.cartId}">+</button></div></div>`).join('');
    
    const subDisp = document.getElementById('cartSubtotalDisplay'); if(subDisp) subDisp.textContent = fmt(sum.subtotal);
    
    if(state.selectedDistrict) {
      const di = document.getElementById('districtInput'); if(di) di.value = state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase());
    }
    updateShippingUI();
  }

  function updateUI() { invalidateCache(); renderMenu(); renderAddons(); renderCart(); if(document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart(); }

  // --- Navigasi Halaman Produk ---
  function openProductPage(id) {
    const p = PRODUCTS.find(x => x.id === id); if(!p) return;
    document.getElementById('productPageImg').innerHTML = `<img src="${p.image}">`;
    document.getElementById('productPageName').textContent = p.name;
    document.getElementById('productPageDesc').textContent = p.desc;
    document.getElementById('productPageContainer').textContent = p.container;
    document.getElementById('productPageSize').textContent = p.size;
    document.getElementById('productPageSambal').textContent = p.sambal;
    document.getElementById('productPagePrice').textContent = fmt(p.price);
    
    document.getElementById('spiceOptionsPage').innerHTML = [1,2,3,4,5].map(i => `<button class="spice-option ${i===(p.defaultSpice||3)?'active':''}" data-spice="${i}">${i}</button>`).join('');
    state.currentProductPage = { id, spice: p.defaultSpice||3, qty: 1 };
    document.getElementById('qtyNumPage').textContent = '1';
    
    document.getElementById('productPage').style.display = 'block'; document.getElementById('mainContent').style.display = 'none'; window.scrollTo(0,0);
    window.history.pushState({ product: id }, '', '?product='+id);
  }
  
  function closeProductPage() {
    document.getElementById('productPage').style.display = 'none'; document.getElementById('mainContent').style.display = 'block';
    if(window.history.state && window.history.state.product) window.history.back();
    else window.history.replaceState(null, '', window.location.pathname);
  }
  
  window.addEventListener('popstate', e => {
    const pp = document.getElementById('productPage');
    if(pp && pp.style.display === 'block') { pp.style.display = 'none'; document.getElementById('mainContent').style.display = 'block'; }
  });

  // --- TRACED FIX 4: Chat AI ---
  function initAIChat() {
    const toggle = document.getElementById('aiChatToggle');
    const box = document.getElementById('aiChatBox');
    const close = document.getElementById('aiChatClose');
    if(toggle && box && close) {
      toggle.addEventListener('click', () => { box.style.display = box.style.display === 'none' ? 'block' : 'none'; });
      close.addEventListener('click', () => { box.style.display = 'none'; });
    }
  }

  // --- Event Listeners ---
  function bindEvents() {
    document.getElementById('backFromProduct')?.addEventListener('click', closeProductPage);
    
    document.getElementById('addToCartPage')?.addEventListener('click', function() {
      const { id, spice, qty } = state.currentProductPage;
      const cartKey = id + '_spice' + spice;
      const entry = state.cart[cartKey] || { qty: 0, spice: spice };
      entry.qty += qty; entry.spice = spice; state.cart[cartKey] = entry;
      invalidateCache(); updateUI(); showToast('✅ Ditambahkan!');
      setTimeout(() => closeProductPage(), 300);
    });

    document.getElementById('spiceOptionsPage')?.addEventListener('click', function(e) {
      if (e.target.classList.contains('spice-option')) {
        document.querySelectorAll('#spiceOptionsPage .spice-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active'); state.currentProductPage.spice = parseInt(e.target.dataset.spice);
      }
    });

    document.getElementById('qtyMinusPage')?.addEventListener('click', () => { if (state.currentProductPage.qty > 1) { state.currentProductPage.qty--; document.getElementById('qtyNumPage').textContent = state.currentProductPage.qty; } });
    document.getElementById('qtyPlusPage')?.addEventListener('click', () => { state.currentProductPage.qty++; document.getElementById('qtyNumPage').textContent = state.currentProductPage.qty; });

    let tOut;
    document.getElementById('searchInput')?.addEventListener('input', e => {
      document.getElementById('clearSearchBtn').style.display = e.target.value.length ? 'inline-block' : 'none';
      clearTimeout(tOut); tOut = setTimeout(() => { state.searchQuery = e.target.value; invalidateCache(); updateUI(); }, 300);
    });
    document.getElementById('searchIconBtn')?.addEventListener('click', () => { document.getElementById('searchInputWrap').classList.toggle('open'); document.getElementById('searchInput').focus(); });
    document.getElementById('clearSearchBtn')?.addEventListener('click', () => { document.getElementById('searchInput').value = ''; state.searchQuery = ''; document.getElementById('clearSearchBtn').style.display = 'none'; invalidateCache(); updateUI(); });

    const di = document.getElementById('districtInput'), dm = document.getElementById('customDistrictDropdown');
    if(di) di.addEventListener('input', e => {
      const v = e.target.value.toLowerCase(), m = Object.keys(DISTRICT_MAP).filter(k => k.includes(v));
      if(dm) { dm.style.display = 'block'; dm.innerHTML = m.map(k => `<div style="padding:14px 16px; border-bottom:1px solid #eee; cursor:pointer;" data-val="${k}">${k.replace(/\b\w/g, l=>l.toUpperCase())}</div>`).join(''); }
    });
    
    // TRACED FIX 1: Memunculkan Opsi Kurir Setelah Pilih Kecamatan
    if(dm) dm.addEventListener('click', e => {
      const v = e.target.closest('div[data-val]')?.dataset.val; if(!v) return;
      state.selectedDistrict = v; dm.style.display = 'none'; if(di) di.value = v.replace(/\b\w/g, l=>l.toUpperCase());
      
      const shipSec = document.getElementById('shippingSection');
      if(shipSec) shipSec.style.display = 'block'; 
      
      updateShippingUI();
    });

    // TRACED FIX 2: Tombol Waktu Pengiriman
    const times = ['Pagi (09:00 - 11:00 WIB)', 'Siang (11:00 - 13:00 WIB)', 'Sore (14:00 - 17:00 WIB)'];
    let timeIdx = 0;
    document.getElementById('deliveryTimeTrigger')?.addEventListener('click', function() {
      const lbl = document.getElementById('deliveryTimeLabel');
      const val = document.getElementById('deliveryTime');
      if (lbl && val) {
        lbl.textContent = times[timeIdx];
        lbl.style.color = "var(--gray-900)";
        val.value = times[timeIdx];
        timeIdx = (timeIdx + 1) % times.length;
      }
    });

    // TRACED FIX 3: Tombol Lokasi Bawah
    document.getElementById('btnAutoDetect')?.addEventListener('click', function() {
      document.getElementById('btnManualDistrict')?.classList.remove('active'); this.classList.add('active');
      showToast('Mendeteksi GPS...');
      const dt = document.getElementById('districtTrigger'); if(dt) dt.style.display = 'none';
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          state.userDistance = estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, pos.coords.latitude, pos.coords.longitude));
          state.selectedDistrict = ''; 
          updateShippingUI();
          showToast('✅ Jarak ditemukan.');
        }, () => { showToast('GPS gagal.'); }, { timeout: 8000 });
      }
    });
    document.getElementById('btnManualDistrict')?.addEventListener('click', function() {
      document.getElementById('btnAutoDetect')?.classList.remove('active'); this.classList.add('active');
      const dt = document.getElementById('districtTrigger'); if(dt) dt.style.display = 'flex';
    });

    // Tombol Tutup X di Bottom Bar
    document.getElementById('closeBottomBar')?.addEventListener('click', function() {
      document.getElementById('bottom-bar')?.classList.remove('visible');
    });

    document.addEventListener('click', e => {
      if(e.target.closest('[data-action="open-cart"]') || e.target.closest('.cart-summary')) { const m = document.getElementById('miniCartModal'); if(m){ m.classList.add('active'); document.body.style.overflow='hidden'; renderMiniCart(); } return; }
      if(e.target.closest('#miniCartClose') || (e.target.id === 'miniCartModal' && !e.target.closest('.modal-content'))) { const m = document.getElementById('miniCartModal'); if(m){ m.classList.remove('active'); document.body.style.overflow=''; } return; }
      if(e.target.id === 'priorityToggle' || e.target.id === 'priorityToggleMini') { state.isPriority = e.target.checked; const pm = document.getElementById('priorityToggleMini'), pt = document.getElementById('priorityToggle'); if(pm) pm.checked=state.isPriority; if(pt) pt.checked=state.isPriority; updateShippingUI(); return; }

      const act = e.target.closest('[data-action]');
      if(act) {
        const id = act.dataset.id, type = act.dataset.action;
        if(type === 'open-modal') { openProductPage(id); }
        else if(type === 'add-addon') { state.cart[id] = {qty:1}; invalidateCache(); updateUI(); }
        else if(type === 'increase') { state.cart[id].qty++; invalidateCache(); updateUI(); }
        else if(type === 'decrease') { state.cart[id].qty--; if(state.cart[id].qty<=0) delete state.cart[id]; invalidateCache(); updateUI(); }
      }

      if(e.target.closest('.cat-pill')) { document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active')); e.target.closest('.cat-pill').classList.add('active'); state.activeFilter = e.target.closest('.cat-pill').dataset.cat; updateUI(); }
      if(e.target.closest('.ship-btn')) { document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active')); const btn = e.target.closest('.ship-btn'); btn.classList.add('active'); state.shippingProvider = btn.dataset.provider; const ro = document.getElementById('rujakcoOptions'), po = document.getElementById('paxelOptions'); if(ro) ro.style.display = state.shippingProvider === 'paxel' ? 'none' : 'block'; if(po) po.style.display = state.shippingProvider === 'paxel' ? 'block' : 'none'; updateShippingUI(); }
      if(e.target.closest('.veh-btn')) { document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active')); e.target.closest('.veh-btn').classList.add('active'); state.vehicleType = e.target.closest('.veh-btn').dataset.vehicle; updateShippingUI(); }
      if(e.target.id === 'clearCartBtn') { state.cart = {}; invalidateCache(); updateUI(); renderMiniCart(); showToast('Keranjang dikosongkan.'); }

      if(e.target.closest('#btnOpenPayment')) {
        const name = document.getElementById('customerName')?.value.trim(), phone = document.getElementById('customerPhone')?.value.trim(), address = document.getElementById('customerAddress')?.value.trim();
        const dist = state.selectedDistrict || state.userDistance;
        if(!name || !phone || !address || !dist) { showToast('Mohon lengkapi alamat dan nama.'); return; }
        
        state.customerName = name; state.customerPhone = phone; state.customerAddress = address; 
        const pt = document.getElementById('paymentTotalDisplay'), ft = document.getElementById('finalTotal');
        if(pt && ft) pt.textContent = ft.textContent;
        const pm = document.getElementById('paymentModal'); if(pm) pm.classList.add('active');
      }

      if(e.target.closest('#paymentClose')) { document.getElementById('paymentModal')?.classList.remove('active'); }
      
      if(e.target.closest('[data-action="confirm-wa"]')) {
        if (checkoutLocked) return;
        checkoutLocked = true;
        
        const sum = getCartSummaryCached();
        const distNum = state.selectedDistrict ? DISTRICT_MAP[state.selectedDistrict] || 10 : (state.userDistance || 2);
        const ship = calculateShipping(distNum, state.isPriority, sum.mainProductQty || 1);
        const orderId = 'RJ' + Date.now().toString(36).toUpperCase().slice(-6);
        const locLabel = state.selectedDistrict ? `Kec. ${state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase())}` : 'Lokasi GPS';
        const fullAddress = `${state.customerAddress}, ${locLabel}`;
        const timeDel = document.getElementById('deliveryTime')?.value || 'Belum dipilih';
        const notes = document.getElementById('orderNotes')?.value || '-';
        
        let msg = `*PESANAN RUJAK.CO*\n\nOrder: ${orderId}\nNama: ${state.customerName}\nTelp: ${state.customerPhone}\nAlamat: ${fullAddress}\nJam: ${timeDel}\nCatatan: ${notes}\n\n*Sajian:*\n`;
        sum.items.forEach(i => msg += `- ${i.name} ${i.spice?'(Lv '+i.spice+')':''} x${i.qty}\n`);
        msg += `\nSubtotal: ${fmt(sum.subtotal)}\nOngkir: ${fmt(ship.cost)}\n*TOTAL: ${fmt(sum.subtotal + (ship.cost||0))}*\n\n(Mohon lampirkan bukti transfer QRIS)`;
        
        getSupabase().then(client => {
          if (client) {
            client.from('orders').insert([{ order_id: orderId, customer_name: state.customerName, customer_phone: state.customerPhone, customer_address: fullAddress, items: sum.items, total: sum.subtotal + (ship.cost || 0), status: 'pending' }]).then(({error}) => { if (error) console.error(error); });
          }
        });

        setTimeout(() => {
          checkoutLocked = false;
          window.open('https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
          state.cart = {}; invalidateCache(); updateUI(); 
          document.getElementById('paymentModal')?.classList.remove('active');
          const mc = document.getElementById('miniCartModal'); if(mc){ mc.classList.remove('active'); document.body.style.overflow=''; }
        }, 500);
      }

      const mi = e.target.closest('.menu-item');
      if (mi && !e.target.closest('.btn-add-unified') && !e.target.closest('.qty-control')) { openProductPage(mi.dataset.id); }
    });
    
    const obs = new IntersectionObserver(e => e.forEach(x => { if(x.isIntersecting) x.target.classList.add('visible'); }), { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll, .stagger-children').forEach(el => obs.observe(el));
  }

  function init() {
    initAIChat();
    try { const s = localStorage.getItem('rujak_cart_v3'); if(s) state.cart = JSON.parse(s); } catch(e){}
    updateUI(); bindEvents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
