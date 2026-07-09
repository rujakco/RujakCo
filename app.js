(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO v3.1 — STABLE ENGINE + PREMIUM UI
  // ============================================================

  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";
  const SYSTEM = { DISCOUNT_THRESHOLD: 100000, DISCOUNT_AMOUNT: 5000, WA_NUMBER: '6289677161680', STORE_LAT: -6.2165414, STORE_LNG: 107.0177395, DEFAULT_DISTANCE: 2 };
  
  const PRODUCTS = [
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi klasik 5 macam buah pilihan dengan sambal original kami.', price:35000, cat:'classic', container:'Thinwall 1000ml', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp', isHidden:false },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk tekstur yang lebih kaya dan menyatu di mulut.', price:26000, cat:'classic', container:'Thinwall 750ml', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Merah'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp', isHidden:false },
    { id:'p_m3', name:'Rujak Gaco', desc:'Koleksi favorit pelanggan dengan tambahan sambal mete premium.', price:40000, cat:'signature', badge:'Signature', badgeColor:'gold', container:'Thinwall 1000ml', size:'Porsi Reguler', sambal:'Sambal Mete Premium (1 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp', isHidden:false },
    { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah yang dirancang khusus untuk dinikmati bersama.', price:48000, cat:'signature', container:'Thinwall Jumbo 1000ml', size:'Porsi Sharing', sambal:'Sambal Mete Premium (2 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:4, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp', isHidden:false },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi eksklusif dengan sentuhan anggur Shine Muscat premium.', price:85000, cat:'reserve', badge:'Reserve', badgeColor:'gold', container:'Thinwall Jumbo 1000ml + Paper Bag', size:'Porsi Premium', sambal:'Sambal Mete Premium (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:false },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Sajian megah dalam tampah bambu untuk acara istimewa Anda.', price:200000, cat:'reserve', badge:'Pre-Order', badgeColor:'gold', container:'Tampah Bambu Ø40cm', size:'8-10 Orang', sambal:'Original & Mete (4 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi Merah'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp', isHidden:false }
  ];

  const ADDONS = [
    { id:'a_sambal1', name:'Sambal Original Ekstra', price:8000, icon:'flame', desc:'Klasik dan autentik.' },
    { id:'a_sambal2', name:'Sambal Mete Ekstra', price:12000, icon:'flame', desc:'Lebih kental dan gurih.' },
    { id:'a_extra_jambu', name:'Ekstra Jambu Kristal', price:10000, icon:'leaf', desc:'Potongan segar ekstra.' },
    { id:'a_extra_muscat', name:'Ekstra Shine Muscat', price:15000, icon:'sparkles', desc:'Anggur premium tanpa biji.' }
  ];

  const DISTRICT_MAP = { 'bekasi barat':5, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11, 'rawalumbu':8, 'jatiasih':12, 'pondokgede':14, 'cikarang':23, 'tambun':16, 'cibitung':20, 'gambir':18, 'menteng':19, 'tebet':20, 'pancoran':21, 'pasar minggu':22, 'kebayoran lama':24, 'kebayoran baru':22, 'mampang prapatan':21, 'pulo gadung':16, 'jatinegara':18, 'duren sawit':15, 'kramat jati':19, 'pasar rebo':20, 'cakung':12, 'kembangan':25, 'kelapa gading':27, 'depok':35, 'tangerang':38, 'bogor':50 };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null, orderNotes: '', isCartMinimized: false,
    customerName: '', customerPhone: '', customerAddress: '', isGift: false, giftSender: '', giftMessage: '',
    selectedDistrict: '', shippingProvider: 'rujakco', vehicleType: 'motor', isPriority: false, currentProductPage: { id: null, spice: 3, qty: 1 }
  };

  let checkoutLocked = false;
  let cachedSummary = null;
  let toastTimer = null;

  // --- Utilities ---
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function escapeHTML(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function haptic() { if (navigator.vibrate) navigator.vibrate(10); }
  function showToast(msg) {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
  }

  function getSupabase() { return window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null; }
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  function estimateRoadDistance(straightKm) { return Math.round(straightKm * (straightKm <= 10 ? 1.35 : straightKm <= 20 ? 1.30 : 1.20)); }

  // --- Cart Data ---
  function getItemById(id) { let item = PRODUCTS.find(p => p.id === id); if(item) return item; const sm = id.match(/^(.+)_spice(\d+)$/); if(sm){ item = PRODUCTS.find(p => p.id === sm[1]); if(item) return item; } return ADDONS.find(a => a.id === id) || null; }

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
    const discount = subtotal >= SYSTEM.DISCOUNT_THRESHOLD ? SYSTEM.DISCOUNT_AMOUNT : 0;
    return { items, totalQty, mainProductQty, subtotal, discount };
  }

  function getCartSummaryCached() { if(!cachedSummary) cachedSummary = getCartSummary(); return cachedSummary; }
  function invalidateCache() { cachedSummary = null; }
  function saveCart() { try { localStorage.setItem('rujak_cart_v3', JSON.stringify(state.cart)); } catch(e){} }
  function loadCart() { try { const s = localStorage.getItem('rujak_cart_v3'); if(s) state.cart = JSON.parse(s); } catch(e){} }

  // --- Logistics ---
  function calculateShipping(distance, mainQty) {
    const dist = distance || SYSTEM.DEFAULT_DISTANCE;
    if (dist > 50) return { cost: null, label: 'Konfirmasi Pramutamu' };
    
    if (state.shippingProvider === 'paxel') {
      const large = Math.floor(mainQty / 2), med = mainQty % 2;
      return { cost: (large * 25000) + (med * 20000) + ((large + med) * 3000), label: 'Paxel Same Day' };
    } else {
      let cost = dist <= 3 ? 8000 : dist <= 10 ? 8000 + (dist-3)*1800 : dist <= 20 ? 20600 + (dist-10)*1600 : dist <= 30 ? 36600 + (dist-20)*1400 : 50600 + (dist-30)*1150;
      if (state.vehicleType === 'mobil') cost = dist <= 3 ? 24000 : dist <= 10 ? 24000 + (dist-3)*4500 : dist <= 20 ? 55500 + (dist-10)*4000 : 95500 + (dist-20)*3500;
      if (state.isPriority) cost += 8000;
      return { cost, label: state.vehicleType === 'motor' ? 'Kurir Instan (Roda Dua)' : 'Kurir Instan (Roda Empat)' };
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
    if(breakdown) breakdown.innerHTML = `<div>Estimasi Jarak: <strong>${dist} km</strong></div><div>Layanan: <strong>${ship.label}</strong></div><div style="margin-top:8px; padding-top:8px; border-top:1px solid var(--gray-200);">Biaya Pengiriman: <strong>${ship.cost ? fmt(ship.cost) : 'Hubungi Kami'}</strong></div>`;
    
    const outRange = document.getElementById('outOfRange');
    if(outRange) outRange.style.display = dist > 50 ? 'block' : 'none';

    document.getElementById('finalSubtotal').textContent = fmt(summary.subtotal);
    document.getElementById('finalDiscount').textContent = summary.discount > 0 ? `-${fmt(summary.discount)}` : 'Rp0';
    document.getElementById('finalShipping').textContent = ship.cost ? fmt(ship.cost) : 'Rp0';
    document.getElementById('finalTotal').textContent = ship.cost ? fmt(summary.subtotal - summary.discount + ship.cost) : 'Konfirmasi';
  }

  // --- Rendering UI ---
  function renderMenu() {
    const container = document.getElementById('menuList'); if (!container) return;
    let items = state.activeFilter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === state.activeFilter);
    if(state.searchQuery.length >= 2) items = PRODUCTS.filter(p => p.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(state.searchQuery.toLowerCase()));

    document.getElementById('skeletonContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = items.length ? 'none' : 'block';
    
    container.innerHTML = items.map(p => {
      let qty = 0, firstKey = p.id + '_spice3';
      Object.keys(state.cart).forEach(k => { if(k.startsWith(p.id)) { qty += state.cart[k].qty; firstKey = k; } });
      const badge = p.badge ? `<span class="item-badge-right ${p.badgeColor}">${p.badge}</span>` : '';
      const control = qty === 0 ? `<button class="btn-add-unified" data-action="open-modal" data-id="${p.id}">Tambahkan</button>` : `<div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${firstKey}">−</button><span class="qty-num">${qty}</span><button class="qty-btn" data-action="increase" data-id="${firstKey}">+</button></div>`;
      return `<div class="menu-item" data-id="${p.id}"><div class="item-img-wrap"><img src="${p.thumbnail}" loading="lazy"></div><div class="item-body"><div class="item-name-row"><h3 class="item-name">${p.name}</h3>${badge}</div><p class="item-desc">${p.desc}</p><div class="item-footer"><span class="item-price">${fmt(p.price)}</span>${control}</div></div></div>`;
    }).join('');
    container.style.display = 'block';
  }

  function renderAddons() {
    const container = document.getElementById('addonList'); if (!container) return;
    container.innerHTML = ADDONS.map(a => {
      const qty = state.cart[a.id]?.qty || 0;
      const control = qty === 0 ? `<button class="btn-add-unified" data-action="add-addon" data-id="${a.id}">Tambahkan</button>` : `<div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      return `<div class="addon-card"><div class="addon-icon"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div><div class="addon-name">${a.name}</div><div class="addon-price">${fmt(a.price)}</div>${control}</div>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
  }

  function renderCart() {
    const sum = getCartSummaryCached(), bar = document.getElementById('bottom-bar');
    if (sum.totalQty > 0) {
      if(bar) bar.classList.add('visible');
      document.getElementById('cartPreview').textContent = `${sum.totalQty} sajian`;
      document.getElementById('cartTotalDisplay').textContent = fmt(sum.subtotal - sum.discount);
      document.getElementById('discountLabel').style.display = sum.discount > 0 ? 'inline-block' : 'none';
      
      const pContainer = document.getElementById('progressContainer'), pFill = document.getElementById('progressFill'), pLbl = document.getElementById('progressLabel');
      if(pContainer && pFill) {
        if(sum.subtotal < SYSTEM.DISCOUNT_THRESHOLD) {
          pContainer.style.display = 'block';
          const pct = Math.round((sum.subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100);
          pFill.style.width = pct + '%'; pLbl.textContent = `Belanja ${fmt(SYSTEM.DISCOUNT_THRESHOLD - sum.subtotal)} lagi untuk Privilege.`;
        } else { pContainer.style.display = 'none'; }
      }
    } else {
      if(bar) bar.classList.remove('visible');
      const mc = document.getElementById('miniCartModal'); if(mc) mc.classList.remove('active');
    }
    saveCart();
  }

  function renderMiniCart() {
    const sum = getCartSummaryCached();
    document.getElementById('miniCartList').innerHTML = sum.items.length === 0 ? '<p style="text-align:center;color:var(--gray-500);padding:20px 0;">Sajian belum dipilih.</p>' : sum.items.map(i => `<div class="mini-cart-item"><div class="mini-cart-info"><div class="mini-cart-name">${i.name}${i.spice?' (Level '+i.spice+')':''}</div><div class="mini-cart-detail">${fmt(i.price)}</div></div><div class="mini-cart-qty"><button class="qty-btn" data-action="decrease" data-id="${i.cartId}">−</button><span class="qty-num">${i.qty}</span><button class="qty-btn" data-action="increase" data-id="${i.cartId}">+</button></div></div>`).join('');
    document.getElementById('cartSubtotalDisplay').textContent = fmt(sum.subtotal);
    
    // AI Upsell di Mini Cart
    const upsell = document.getElementById('step1Upsell');
    if(upsell && sum.totalQty > 0) {
      const avail = PRODUCTS.filter(p => !sum.items.some(i => i.id.startsWith(p.id)));
      if(avail.length > 0) {
        const rec = avail[0];
        upsell.innerHTML = `<div class="ai-recommendation" style="margin:16px 0; padding:16px;"><div style="flex:1;"><div class="ai-rec-title" style="font-size:14px;">Koleksi Rekomendasi</div><div class="ai-rec-desc" style="margin-bottom:8px;">${rec.name} — ${fmt(rec.price)}</div><button onclick="window.addToCartAI('${rec.id}')" class="btn-add-unified" style="background:white;color:var(--green);">Tambahkan</button></div></div>`;
      } else { upsell.innerHTML = ''; }
    } else if (upsell) upsell.innerHTML = '';

    if(state.selectedDistrict) {
      document.getElementById('districtLabel').textContent = state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase());
      document.getElementById('districtInput').value = state.selectedDistrict;
    }
    updateShippingUI();
  }

  function updateUI() { invalidateCache(); renderMenu(); renderAddons(); renderCart(); if(document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart(); }

  // --- Product Page Flow ---
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

  window.addToCartAI = function(id) {
    const p = PRODUCTS.find(prod => prod.id === id); if(!p) return;
    state.cart[id + '_spice3'] = { qty: 1, spice: 3 }; invalidateCache(); updateUI(); showToast('✅ Sajian ditambahkan.');
  };

  // --- Init & Events ---
  function bindEvents() {
    document.getElementById('backFromProduct').addEventListener('click', closeProductPage);
    document.getElementById('addToCartPage').addEventListener('click', function() {
      const { id, spice, qty } = state.currentProductPage;
      const cartKey = id + '_spice' + spice;
      const entry = state.cart[cartKey] || { qty: 0, spice: spice };
      entry.qty += qty; entry.spice = spice; state.cart[cartKey] = entry;
      invalidateCache(); updateUI(); showToast('✅ Sajian ditambahkan.');
      setTimeout(() => closeProductPage(), 300);
    });

    document.getElementById('spiceOptionsPage').addEventListener('click', function(e) {
      if (e.target.classList.contains('spice-option')) {
        document.querySelectorAll('#spiceOptionsPage .spice-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active'); state.currentProductPage.spice = parseInt(e.target.dataset.spice);
      }
    });

    document.getElementById('qtyMinusPage').addEventListener('click', () => { if (state.currentProductPage.qty > 1) { state.currentProductPage.qty--; document.getElementById('qtyNumPage').textContent = state.currentProductPage.qty; } });
    document.getElementById('qtyPlusPage').addEventListener('click', () => { state.currentProductPage.qty++; document.getElementById('qtyNumPage').textContent = state.currentProductPage.qty; });

    document.getElementById('searchIconBtn')?.addEventListener('click', function() { const wrap = document.getElementById('searchInputWrap'); wrap.classList.toggle('open'); if (wrap.classList.contains('open')) document.getElementById('searchInput').focus(); });
    document.getElementById('clearSearchBtn')?.addEventListener('click', function() { const input = document.getElementById('searchInput'); if(input){ input.value=''; state.searchQuery=''; invalidateCache(); updateUI(); } });
    document.getElementById('searchInput')?.addEventListener('input', debounce(function() { state.searchQuery = this.value; invalidateCache(); updateUI(); }, 300));

    // District Dropdown
    const di = document.getElementById('districtInput'), dt = document.getElementById('districtTrigger'), dm = document.getElementById('customDistrictDropdown');
    if(dt) dt.addEventListener('click', () => {
      di.type = 'text'; di.style.marginBottom = '8px'; di.focus(); dm.style.display = 'block';
      dm.innerHTML = Object.keys(DISTRICT_MAP).map(k => `<div style="padding:14px 16px; border-bottom:1px solid #eee; cursor:pointer;" data-val="${k}">${k.replace(/\b\w/g, l=>l.toUpperCase())}</div>`).join('');
    });
    if(di) di.addEventListener('input', e => {
      const v = e.target.value.toLowerCase(), m = Object.keys(DISTRICT_MAP).filter(k => k.includes(v));
      dm.innerHTML = m.map(k => `<div style="padding:14px 16px; border-bottom:1px solid #eee; cursor:pointer;" data-val="${k}">${k.replace(/\b\w/g, l=>l.toUpperCase())}</div>`).join('');
    });
    if(dm) dm.addEventListener('click', e => {
      const v = e.target.closest('div[data-val]')?.dataset.val; if(!v) return;
      state.selectedDistrict = v; di.type = 'hidden'; dm.style.display = 'none';
      document.getElementById('districtLabel').textContent = v.replace(/\b\w/g, l=>l.toUpperCase()); updateShippingUI();
    });

    document.getElementById('deliveryTimeTrigger')?.addEventListener('click', function() {
      openCustomSelect('Waktu Pengiriman', [{value:'Pagi (09:00 - 11:00)',label:'Pagi (09:00 - 11:00 WIB)'},{value:'Siang (11:00 - 13:00)',label:'Siang (11:00 - 13:00 WIB)'},{value:'Sore (14:00 - 17:00)',label:'Sore (14:00 - 17:00 WIB)'}], function(val, lbl) { document.getElementById('deliveryTime').value = val; document.getElementById('deliveryTimeLabel').textContent = lbl; });
    });

    document.getElementById('giftToggle')?.addEventListener('change', function() { state.isGift = this.checked; document.getElementById('giftFields').style.display = this.checked ? 'block' : 'none'; });

    // Global Event Delegation
    document.addEventListener('click', e => {
      if(e.target.closest('[data-action="open-cart"]') || e.target.closest('.cart-summary')) { const m = document.getElementById('miniCartModal'); if(m){ m.classList.add('active'); document.body.style.overflow='hidden'; renderMiniCart(); } return; }
      if(e.target.closest('#miniCartClose') || (e.target.id === 'miniCartModal' && !e.target.closest('.modal-content'))) { const m = document.getElementById('miniCartModal'); if(m){ m.classList.remove('active'); document.body.style.overflow=''; } return; }
      
      const act = e.target.closest('[data-action]');
      if(act) {
        haptic(); const id = act.dataset.id, type = act.dataset.action;
        if(type === 'open-modal') { openProductPage(id); }
        else if(type === 'add-addon') { state.cart[id] = {qty:1}; invalidateCache(); updateUI(); }
        else if(type === 'increase') { state.cart[id].qty++; invalidateCache(); updateUI(); }
        else if(type === 'decrease') { state.cart[id].qty--; if(state.cart[id].qty<=0) delete state.cart[id]; invalidateCache(); updateUI(); }
      }

      if(e.target.closest('.cat-pill')) {
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        const btn = e.target.closest('.cat-pill'); btn.classList.add('active');
        state.activeFilter = btn.dataset.cat; updateUI();
      }

      if(e.target.closest('.ship-btn')) {
        document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active'));
        const btn = e.target.closest('.ship-btn'); btn.classList.add('active');
        state.shippingProvider = btn.dataset.provider;
        document.getElementById('rujakcoOptions').style.display = state.shippingProvider === 'paxel' ? 'none' : 'block';
        document.getElementById('paxelOptions').style.display = state.shippingProvider === 'paxel' ? 'block' : 'none';
        updateShippingUI();
      }

      if(e.target.closest('.veh-btn')) {
        document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
        const btn = e.target.closest('.veh-btn'); btn.classList.add('active');
        state.vehicleType = btn.dataset.vehicle; updateShippingUI();
      }

      if(e.target.id === 'priorityToggleMini') { state.isPriority = e.target.checked; updateShippingUI(); }
      if(e.target.id === 'clearCartBtn') { state.cart = {}; invalidateCache(); updateUI(); renderMiniCart(); showToast('Keranjang dikosongkan.'); }

      // Checkout Validate
      if(e.target.closest('#btnOpenPayment')) {
        const name = document.getElementById('customerName').value.trim(), phone = document.getElementById('customerPhone').value.trim(), address = document.getElementById('customerAddress').value.trim();
        if(!name || !phone || !address || !state.selectedDistrict) { showToast('Mohon lengkapi formulir pengiriman.'); return; }
        
        state.customerName = name; state.customerPhone = phone; state.customerAddress = address; state.orderNotes = document.getElementById('orderNotes').value;
        
        document.getElementById('paymentTotalDisplay').textContent = document.getElementById('finalTotal').textContent;
        document.getElementById('paymentModal').classList.add('active');
      }

      if(e.target.closest('#paymentClose')) { document.getElementById('paymentModal').classList.remove('active'); }
      
      // Confirm & Send WA
      if(e.target.closest('[data-action="confirm-wa"]')) {
        const sum = getCartSummaryCached(), ship = calculateShippingCost();
        const orderId = 'RJ' + Date.now().toString(36).toUpperCase().slice(-6);
        let msg = `*PESANAN RUJAK.CO*\n\nOrder: ${orderId}\nNama: ${state.customerName}\nTelp: ${state.customerPhone}\nAlamat: ${state.customerAddress}, Kec. ${state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase())}\n\n*Sajian:*\n`;
        sum.items.forEach(i => msg += `- ${i.name} ${i.spice?'(Lv '+i.spice+')':''} x${i.qty}\n`);
        msg += `\nSubtotal: ${fmt(sum.subtotal)}\nPrivilege: -${fmt(sum.discount)}\nOngkir: ${fmt(ship.shippingCost)}\n*TOTAL: ${fmt(ship.total)}*\n\n(Tolong lampirkan bukti transfer QRIS)`;
        
        const waUrl = 'https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg);
        window.open(waUrl, '_blank');
        
        state.cart = {}; invalidateCache(); updateUI();
        document.getElementById('paymentModal').classList.remove('active');
        const mc = document.getElementById('miniCartModal'); if(mc){ mc.classList.remove('active'); document.body.style.overflow=''; }
      }

      const mi = e.target.closest('.menu-item');
      if (mi && !e.target.closest('.btn-add-unified') && !e.target.closest('.qty-control')) { openProductPage(mi.dataset.id); }
    });

    const obs = new IntersectionObserver(e => e.forEach(x => { if(x.isIntersecting) x.target.classList.add('visible'); }), { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll, .stagger-children').forEach(el => obs.observe(el));
  }

  function init() {
    loadCart(); updateUI(); bindEvents();
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        state.userDistance = estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, pos.coords.latitude, pos.coords.longitude));
        document.getElementById('locationDisplay').textContent = 'Lokasi GPS ▾'; updateShippingUI();
      }, () => {}, { timeout: 10000 });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
