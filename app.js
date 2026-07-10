(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO v3.2 — ELITE ENTERPRISE CORE MACHINE (ROBUST PATCH)
  // ============================================================

  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";
  const SYSTEM = { DISCOUNT_THRESHOLD: 100000, DISCOUNT_AMOUNT: 5000, WA_NUMBER: '6289677161680', STORE_LAT: -6.2165414, STORE_LNG: 107.0177395, DEFAULT_DISTANCE: 2 };

  const PRODUCTS = [
    { id:'p_m1', name:'Rujak Segar', desc:'Kurasi klasik lima varietas buah tropis pilihan disajikan dengan harmoni sambal original.', price:35000, cat:'classic', container:'Thinwall 1000ml Presisi', size:'Porsi Reguler (1-2 Orang)', sambal:'Sambal Original Signature (1 Cup)', buah:['Mangga Mengkel','Nanas Hutan','Bengkoang','Jambu Air','Kedondong Kebun'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp' },
    { id:'p_m2', name:'Rujak Serut Artisanal', desc:'Buah-buahan segar diserut mikro secara presisi guna menghasilkan penyatuan saus karamelisasi mete optimal.', price:26000, cat:'classic', container:'Thinwall Food-Grade 750ml', size:'Porsi Reguler', sambal:'Sambal Original Terbawa', buah:['Mangga Muda Jawa','Bengkoang Garing','Nanas Madu','Ubi Ungu Manis'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp' },
    { id:'p_m3', name:'Rujak Gaco Premium', desc:'Sajian kulinari terlaris yang menggabungkan kesegaran eksklusif buah pilihan dan racikan sambal mete premium.', price:40000, cat:'signature', badge:'Signature', badgeColor:'gold', container:'Thinwall Sealed 1000ml', size:'Porsi Eksklusif Klien', sambal:'Sambal Karamelisasi Mete (1 Cup)', buah:['Jambu Kristal Tanpa Biji','Mangga Indramayu Mengkel','Nanas Subang','Bengkoang Air','Jambu Air Premium','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp' },
    { id:'p_m4', name:'Rujak Rama Sharing', desc:'Formula porsi melimpah yang dikonsepkan khusus untuk momentum kebersamaan atau perjamuan formal keluarga.', price:48000, cat:'signature', container:'Jumbo Thinwall Lock 1000ml', size:'Porsi Sharing (2-3 Orang)', sambal:'Sambal Karamelisasi Mete Duet (2 Cup)', buah:['Varian Jambu Kristal','Mangga Mengkel Pilihan','Nanas Madu','Bengkoang Super','Jambu Air','Kedondong'], defaultSpice:4, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp' },
    { id:'p_m5', name:'Rujak Mahkota Reserve', desc:'Mahakarya mahkota rasa yang memadukan keanggunan anggur Shine Muscat impor dengan kurasi buah eksklusif.', price:85000, cat:'reserve', badge:'Reserve', badgeColor:'gold', container:'Premium Luxury Box + Luxury Silk Ribbon', size:'Eksklusif Vault Single', sambal:'Sambal Mete Grand Reserve (2 Cup)', buah:['Shine Muscat Impor Jepang Grade A','Jambu Kristal Garing','Mangga Mengkel Kurasi','Nanas Hutan','Bengkoang Garing'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp' },
    { id:'p_m6', name:'Tampah Nusantara Grand Gala', desc:'Representasi kemegahan tradisi rasa Indonesia dalam wadah tampah artisanal bambu rajutan tangan.', price:200000, cat:'reserve', badge:'Pre-Order', badgeColor:'gold', container:'Tampah Bambu Ø40cm + Protective Shell Box', size:'Sajian Perjamuan (8-10 Orang)', sambal:'Aparatus Komplit Original & Mete (4 Cup)', buah:['Shine Muscat Premium','Jambu Kristal Vault','Mangga Pilihan Utama','Nanas Hutan Subang','Bengkoang Garing','Jambu Air Rose','Kedondong Pilihan','Ubi Ungu Manis'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp' }
  ];

  const ADDONS = [
    { id:'a_sambal1', name:'Saus Original Ekstra Cup', price:8000, desc:'Ekstensi rasa autentik klasik.' },
    { id:'a_sambal2', name:'Saus Karamel Mete Ekstra Cup', price:12000, desc:'Kedalaman rasa mete murni gurih.' },
    { id:'a_extra_jambu', name:'Tambahan Jambu Kristal Garing', price:10000, desc:'Tambahan irisan garing premium.' },
    { id:'a_extra_muscat', name:'Tambahan Anggur Shine Muscat', price:15000, desc:'Butiran premium anggur tanpa biji.' }
  ];

  const DISTRICT_MAP = { 'bekasi barat':5, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11, 'rawalumbu':8, 'jatiasih':12, 'pondokgede':14, 'cikarang':23, 'tambun':16, 'cibitung':20, 'gambir':18, 'menteng':19, 'tebet':20, 'pancoran':21, 'pasar minggu':22, 'kebayoran lama':24, 'kebayoran baru':22, 'mampang prapatan':21, 'pulo gadung':16, 'jatinegara':18, 'duren sawit':15, 'kramat jati':19, 'pasar rebo':20, 'cakung':12, 'kembangan':25, 'kelapa gading':27, 'depok':35, 'tangerang':38, 'bogor':50 };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null, isPriority: false, orderNotes: '',
    customerName: '', customerPhone: '', customerAddress: '', selectedDistrict: '',
    shippingProvider: 'rujakco', vehicleType: 'motor', currentProductPage: { id: null, spice: 3, qty: 1 }
  };

  let checkoutLocked = false, cachedSummary = null, toastTimer = null;

  // --- Core Functional Utilities ---
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function escapeHTML(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function showToast(msg) {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
  }

  function getSupabase() { return window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null; }
  function haversineDistance(lat1, lon1, lat2, lon2) { const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); }
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
    const discount = subtotal >= SYSTEM.DISCOUNT_THRESHOLD ? SYSTEM.DISCOUNT_AMOUNT : 0;
    return { items, totalQty, mainProductQty, subtotal, discount };
  }

  function getCartSummaryCached() { if(!cachedSummary) cachedSummary = getCartSummary(); return cachedSummary; }
  function invalidateCache() { cachedSummary = null; try { localStorage.setItem('rujak_cart_v3', JSON.stringify(state.cart)); } catch(e){} }

  // Logistics Apportionment Formula (Paxel Box Packing Architecture Checked)
  function calculateShipping(distance, priority, mainQty) {
    const dist = distance || SYSTEM.DEFAULT_DISTANCE;
    if (dist > 50) return { cost: null, label: 'Konfirmasi Finansial' };
    
    if (state.shippingProvider === 'paxel') {
      const large = Math.floor(mainQty / 2), med = mainQty % 2;
      return { cost: (large * 25000) + (med * 20000) + ((large + med) * 3000), label: 'Paxel Same Day Premium' };
    } else {
      let cost = dist <= 3 ? 8000 : dist <= 10 ? 8000 + (dist-3)*1800 : dist <= 20 ? 20600 + (dist-10)*1600 : dist <= 30 ? 36600 + (dist-20)*1400 : 50600 + (dist-30)*1150;
      if (state.vehicleType === 'mobil') cost = dist <= 3 ? 24000 : dist <= 10 ? 24000 + (dist-3)*4500 : dist <= 20 ? 55500 + (dist-10)*4000 : 95500 + (dist-20)*3500;
      if (priority) cost += 8000;
      return { cost, label: state.vehicleType === 'motor' ? 'Kurir Instan Pribadi' : 'Secure Vault Roda Empat' };
    }
  }

  // PATCHED REALTIME LOGISTICS INTERLOCK SYSTEM
  function updateShippingUI() {
    const summary = getCartSummaryCached();
    const dist = state.selectedDistrict ? (DISTRICT_MAP[state.selectedDistrict] || estimateRoadDistance(10)) : (state.userDistance || null);
    
    // Auto-reveal logistics sector if coordinate metrics or manual entries match verified parameters
    if (dist !== null) {
      const shipSec = document.getElementById('shippingSection');
      if (shipSec) shipSec.style.display = 'block';
    }

    const ship = calculateShipping(dist || SYSTEM.DEFAULT_DISTANCE, state.isPriority, summary.mainProductQty || 1);
    
    const costEl = document.getElementById('shippingCost'), distEl = document.getElementById('shippingDistance');
    if(costEl) costEl.textContent = ship.cost ? fmt(ship.cost) : 'Konfirmasi';
    if(distEl) distEl.textContent = dist ? `~${dist} km` : 'Tentukan Destinasi';
    
    const breakdown = document.getElementById('breakdownContent');
    if(breakdown) breakdown.innerHTML = `<div>Estimasi Orbit Pengantaran: <strong>${dist || '?'} km</strong></div><div>Jenis Layanan Logistik: <strong>${ship.label}</strong></div><div style="margin-top:8px; padding-top:8px; border-top:1px solid var(--gray-200); font-weight:600; color:var(--green);">Proteksi Logistik: <strong>${ship.cost ? fmt(ship.cost) : 'Menghubungi Pramutamu'}</strong></div>`;
    
    const outRange = document.getElementById('outOfRange');
    if(outRange) outRange.style.display = (dist && dist > 50) ? 'block' : 'none';

    const finalSub = document.getElementById('finalSubtotal'); if(finalSub) finalSub.textContent = fmt(summary.subtotal);
    const discRow = document.getElementById('discountRow'), discVal = document.getElementById('finalDiscount');
    if(discRow && discVal) {
      discRow.style.display = summary.discount > 0 ? 'flex' : 'none';
      discVal.textContent = `-${fmt(summary.discount)}`;
    }
    const finalShip = document.getElementById('finalShipping'); if(finalShip) finalShip.textContent = ship.cost ? fmt(ship.cost) : 'Rp0';
    const finalTot = document.getElementById('finalTotal'); if(finalTot) finalTot.textContent = ship.cost ? fmt(summary.subtotal - summary.discount + ship.cost) : 'Menunggu Konfirmasi';
  }

  // --- Rendering Architecture System ---
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
      const control = qty === 0 ? `<button class="btn-add-unified" data-action="open-modal" data-id="${p.id}">Tambahkan</button>` : `<div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${firstKey}">−</button><span class="qty-num">${qty}</span><button class="qty-btn" data-action="increase" data-id="${firstKey}">+</button></div>`;
      return `<div class="menu-item" data-id="${p.id}"><div class="item-img-wrap"><img src="${p.thumbnail}" loading="lazy" class="img-cover"></div><div class="item-body"><div class="item-name-row"><h3 class="item-name">${p.name}</h3>${badge}</div><p class="item-desc">${p.desc}</p><div class="item-footer"><span class="item-price">${fmt(p.price)}</span>${control}</div></div></div>`;
    }).join('');
    container.style.display = 'block';
  }

  function renderAddons() {
    const container = document.getElementById('addonList'); if (!container) return;
    container.innerHTML = ADDONS.map(a => {
      const qty = state.cart[a.id]?.qty || 0;
      const control = qty === 0 ? `<button class="btn-add-unified" data-action="add-addon" data-id="${a.id}">Tambahkan</button>` : `<div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      return `<div class="addon-card"><span class="addon-name">${a.name}</span><span class="addon-price">${fmt(a.price)}</span><div style="margin-top:auto; display:flex; justify-content:flex-end;">${control}</div></div>`;
    }).join('');
  }

  function renderCart() {
    const sum = getCartSummaryCached(), bar = document.getElementById('bottom-bar');
    if (sum.totalQty > 0) {
      if(bar) bar.classList.add('visible');
      const prev = document.getElementById('cartPreview'); if(prev) prev.textContent = `${sum.totalQty} sajian terpilih`;
      const tot = document.getElementById('cartTotalDisplay'); if(tot) tot.textContent = fmt(sum.subtotal - sum.discount);
      const disc = document.getElementById('discountLabel'); if(disc) disc.style.display = sum.discount > 0 ? 'inline-block' : 'none';
    } else {
      if(bar) bar.classList.remove('visible');
      const mc = document.getElementById('miniCartModal'); if(mc) mc.classList.remove('active');
    }
  }

  function renderMiniCart() {
    const sum = getCartSummaryCached();
    const list = document.getElementById('miniCartList');
    if(list) list.innerHTML = sum.items.length === 0 ? '<p style="text-align:center; color:var(--gray-400); padding:24px 0; font-size:13px;">Kurasi keranjang kosong.</p>' : sum.items.map(i => `<div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid var(--gray-100);"><div style="flex:1;"><div style="font-weight:600; font-size:14px; color:var(--green);">${i.name}${i.spice?' (Lv '+i.spice+')':''}</div><div style="font-size:12px; color:var(--gray-500); margin-top:2px;">${fmt(i.price)}</div></div><div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${i.cartId}">−</button><span class="qty-num">${i.qty}</span><button class="qty-btn" data-action="increase" data-id="${i.cartId}">+</button></div></div>`).join('');
    
    const subDisp = document.getElementById('cartSubtotalDisplay'); if(subDisp) subDisp.textContent = fmt(sum.subtotal);
    
    if(state.selectedDistrict) {
      const di = document.getElementById('districtInput'); if(di) di.value = state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase());
    }
    updateShippingUI();
  }

  function updateUI() { invalidateCache(); renderMenu(); renderAddons(); renderCart(); if(document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart(); }

  // --- Fullscreen History-API Stack Viewpage Navigation ---
  function openProductPage(id) {
    const p = PRODUCTS.find(x => x.id === id); if(!p) return;
    document.getElementById('productPageImg').innerHTML = `<img src="${p.image}" class="img-cover" alt="${p.name}">`;
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

  // --- Real-time Luxury AI Concierge Logic Module ---
  function initAIChat() {
    const toggle = document.getElementById('aiChatToggle'), box = document.getElementById('aiChatBox'), close = document.getElementById('aiChatClose'), input = document.getElementById('aiChatInput'), send = document.getElementById('aiChatSend'), messages = document.getElementById('aiChatMessages');
    if(toggle && box && close) {
      toggle.addEventListener('click', (e) => { e.preventDefault(); box.style.display = box.style.display === 'none' ? 'block' : 'none'; if(box.style.display==='block' && input) input.focus(); });
      close.addEventListener('click', () => { box.style.display = 'none'; });
      const processMsg = () => {
        const txt = input.value.trim(); if(!txt) return;
        if(messages) {
          messages.innerHTML += `<div style="text-align:right; margin-bottom:12px;"><span class="chat-bubble user">${escapeHTML(txt)}</span></div>`;
          input.value = ''; messages.scrollTop = messages.scrollHeight;
          setTimeout(() => { messages.innerHTML += `<div style="margin-bottom:12px;"><span class="chat-bubble bot">Preferensi kurasi rasa Anda telah terasimilasi secara personal ke dalam algoritma layanan pramutamu kami. Ada aspeknisasi rasa lainnya yang Anda butuhkan?</span></div>`; messages.scrollTop = messages.scrollHeight; }, 600);
        }
      };
      if(send) send.addEventListener('click', processMsg);
      if(input) input.addEventListener('keydown', e => { if(e.key === 'Enter') processMsg(); });
    }
  }

  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
      item.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  // --- Event Interlocking Architecture Array ---
  function bindEvents() {
    document.getElementById('backFromProduct')?.addEventListener('click', closeProductPage);
    
    document.getElementById('addToCartPage')?.addEventListener('click', function() {
      const { id, spice, qty } = state.currentProductPage;
      const cartKey = id + '_spice' + spice;
      const entry = state.cart[cartKey] || { qty: 0, spice: spice };
      entry.qty += qty; entry.spice = spice; state.cart[cartKey] = entry;
      invalidateCache(); updateUI(); showToast('✅ Sajian ditambahkan Ke Koleksi.');
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

    const di = document.getElementById('districtInput'), dm = document.getElementById('customDistrictDropdown');
    if(di) di.addEventListener('input', e => {
      const v = e.target.value.toLowerCase(), m = Object.keys(DISTRICT_MAP).filter(k => k.includes(v));
      if(dm) { dm.style.display = 'block'; dm.innerHTML = m.map(k => `<div data-val="${k}">${k.replace(/\b\w/g, l=>l.toUpperCase())}</div>`).join(''); }
    });
    
    if(dm) dm.addEventListener('click', e => {
      const v = e.target.closest('div[data-val]')?.dataset.val; if(!v) return;
      state.selectedDistrict = v; dm.style.display = 'none'; if(di) di.value = v.replace(/\b\w/g, l=>l.toUpperCase());
      updateShippingUI();
    });

    // Curated Delivery Time Interval Toggler
    const times = ['Pagi Hari (09.00 - 11.00 WIB)', 'Siang Hari (11.00 - 13.00 WIB)', 'Sore Hari (14.00 - 17.00 WIB)'];
    let timeIdx = 0;
    document.getElementById('deliveryTimeTrigger')?.addEventListener('click', function() {
      const lbl = document.getElementById('deliveryTimeLabel'), val = document.getElementById('deliveryTime');
      if (lbl && val) { lbl.textContent = times[timeIdx]; lbl.style.color = "var(--gray-900)"; val.value = times[timeIdx]; timeIdx = (timeIdx + 1) % times.length; }
    });

    // High Precision Satellite GPS Synchronizer Link
    document.getElementById('btnAutoDetect')?.addEventListener('click', function() {
      if(navigator.geolocation) {
        showToast('Menghubungkan Ke Jaringan Satelit Geolokasi...');
        navigator.geolocation.getCurrentPosition(pos => {
          state.userDistance = estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, pos.coords.latitude, pos.coords.longitude));
          state.selectedDistrict = ''; 
          if(di) di.value = 'Lokasi Terautentikasi (GPS)';
          updateShippingUI();
          showToast('✅ Orbit Jarak Sinkron.');
        }, () => { showToast('Akses Satelit Ditolak. Harap Tentukan Manual.'); }, { timeout: 8000 });
      }
    });

    document.addEventListener('click', e => {
      if(e.target.closest('[data-action="open-cart"]') || e.target.closest('.cart-summary')) { const m = document.getElementById('miniCartModal'); if(m){ m.classList.add('active'); document.body.style.overflow='hidden'; renderMiniCart(); } return; }
      if(e.target.closest('#miniCartClose') || (e.target.id === 'miniCartModal' && !e.target.closest('.modal-content'))) { const m = document.getElementById('miniCartModal'); if(m){ m.classList.remove('active'); document.body.style.overflow=''; } return; }
      if(e.target.id === 'priorityToggleMini') { state.isPriority = e.target.checked; updateShippingUI(); return; }

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

      // Structural Modal Validation Sequence
      if(e.target.closest('#btnOpenPayment')) {
        const name = document.getElementById('customerName')?.value.trim(), phone = document.getElementById('customerPhone')?.value.trim(), address = document.getElementById('customerAddress')?.value.trim();
        const dist = state.selectedDistrict || state.userDistance;
        if(!name || !phone || !address || !dist) { showToast('Mohon lengkapi informasi formulir destinasi.'); return; }
        state.customerName = name; state.customerPhone = phone; state.customerAddress = address; 
        const pt = document.getElementById('paymentTotalDisplay'), ft = document.getElementById('finalTotal');
        if(pt && ft) pt.textContent = ft.textContent;
        const pm = document.getElementById('paymentModal'); if(pm) pm.classList.add('active');
      }

      if(e.target.closest('#paymentClose')) { document.getElementById('paymentModal')?.classList.remove('active'); }
      
      // CRITICAL END-TO-END SYSTEM ROUTING LOGIC LOCKED
      if(e.target.closest('[data-action="confirm-wa"]')) {
        if (checkoutLocked) return; checkoutLocked = true;
        
        const sum = getCartSummaryCached();
        const distNum = state.selectedDistrict ? DISTRICT_MAP[state.selectedDistrict] || 10 : (state.userDistance || 2);
        const ship = calculateShipping(distNum, state.isPriority, sum.mainProductQty || 1);
        const orderId = 'RJ' + Date.now().toString(36).toUpperCase().slice(-6);
        const locLabel = state.selectedDistrict ? `Kec. ${state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase())}` : 'Titik Kordinat Satelit GPS';
        const fullAddress = `${state.customerAddress}, ${locLabel}`;
        const timeDel = document.getElementById('deliveryTime')?.value || 'As Soon As Prepared (Esok Hari)';
        const notes = document.getElementById('orderNotes')?.value || 'Nihil';
        
        let msg = `*RESERVASI RESERVED ORDER — RUJAK.CO*\n\nID Transaksi: #${orderId}\nNama Klien: ${state.customerName}\nKontak Klien: ${state.customerPhone}\nDestinasi Alamat: ${fullAddress}\nInterval Waktu: ${timeDel}\nInstruksi Khusus: ${notes}\n\n*Kurasi Menu Terpilih:*\n`;
        sum.items.forEach(i => msg += `• ${i.name} ${i.spice?'[Level Pedas '+i.spice+']':''} x${i.qty}\n`);
        msg += `\nSubtotal Nilai Sajian: ${fmt(sum.subtotal)}\nProteksi Logistik (${ship.label}): ${fmt(ship.cost)}\n*TOTAL INVESTASI RASA: ${fmt(sum.subtotal + (ship.cost||0))}*\n\n(Terlampir Bukti Autentikasi Struk Transfer QRIS)`;
        
        // Asynchronous Datastore Persistence Engine
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

      // Safe Dialogue Opener Validation
      const mi = e.target.closest('.menu-item');
      if (mi && !e.target.closest('.btn-add-unified') && !e.target.closest('.qty-control')) { openProductPage(mi.dataset.id); }
    });
  }

  function init() {
    initAIChat(); initFAQ();
    try { const s = localStorage.getItem('rujak_cart_v3'); if(s) state.cart = JSON.parse(s); } catch(e){}
    updateUI(); bindEvents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
]
