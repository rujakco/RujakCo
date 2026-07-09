(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO v3.0 — PREMIUM BOUTIQUE EXPERIENCE
  // ============================================================

  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";
  const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjAyYTNkOWQyZjk4ZDQ1YWQ5ZTk2Mzc1OWFkODA3Yzg5IiwiaCI6Im11cm11cjY0In0=';
  const SYSTEM = { DISCOUNT_THRESHOLD: 100000, DISCOUNT_AMOUNT: 5000, WA_NUMBER: '6289677161680', STORE_LAT: -6.2165414, STORE_LNG: 107.0177395 };
  
  // Data Produk
  const PRODUCTS = [
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi klasik 5 macam buah dengan sambal original kami.', price:35000, cat:'classic', container:'Thinwall 1000ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp', isHidden:false },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk tekstur yang lebih kaya dan menyatu.', price:26000, cat:'classic', container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Merah'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp', isHidden:false },
    { id:'p_m3', name:'Rujak Gaco', desc:'Koleksi favorit dengan tambahan sambal mete premium.', price:40000, cat:'signature', badge:'Signature', badgeColor:'gold', container:'Thinwall 1000ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Mete Premium (1 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp', isHidden:false },
    { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah yang dirancang untuk dinikmati bersama.', price:48000, cat:'signature', container:'Thinwall Jumbo 1000ml', size:'Porsi Sharing', sambal:'Sambal Mete Premium (2 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:4, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp', isHidden:false },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi eksklusif dengan sentuhan anggur Shine Muscat.', price:85000, cat:'reserve', badge:'Reserve', badgeColor:'gold', container:'Thinwall Jumbo 1000ml + Paper Bag', size:'Porsi Premium', sambal:'Sambal Mete Premium (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:false },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Sajian megah dalam tampah bambu untuk acara istimewa.', price:200000, cat:'reserve', badge:'Pre-Order', badgeColor:'gold', container:'Tampah Bambu Ø40cm', size:'8-10 Orang', sambal:'Original & Mete (4 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi Merah'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp', isHidden:false }
  ];

  const ADDONS = [
    { id:'a_sambal1', name:'Sambal Original Ekstra', price:8000, icon:'flame', desc:'Klasik dan autentik.' },
    { id:'a_sambal2', name:'Sambal Mete Premium Ekstra', price:12000, icon:'flame', desc:'Lebih kental dan gurih.' },
    { id:'a_extra_jambu', name:'Tambahan Jambu Kristal', price:10000, icon:'leaf', desc:'Potongan segar jambu kristal.' },
    { id:'a_extra_muscat', name:'Tambahan Shine Muscat', price:15000, icon:'sparkles', desc:'Anggur premium tanpa biji.' }
  ];

  const DISTRICT_MAP = { 'bekasi barat':5, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11, 'rawalumbu':8, 'jatiasih':12, 'pondokgede':14, 'cikarang':23, 'tambun':16, 'cibitung':20, 'gambir':18, 'menteng':19, 'tebet':20, 'pancoran':21, 'pasar minggu':22, 'kebayoran lama':24, 'kebayoran baru':22, 'mampang prapatan':21, 'pulo gadung':16, 'jatinegara':18, 'duren sawit':15, 'kramat jati':19, 'pasar rebo':20, 'cakung':12, 'kembangan':25, 'kelapa gading':27, 'depok':35, 'tangerang':38, 'bogor':50 };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null, orderNotes: '',
    customerName: '', customerPhone: '', customerAddress: '', isGift: false, giftSender: '', giftMessage: '',
    selectedDistrict: '', shippingProvider: 'rujakco', vehicleType: 'motor', currentProductPage: { id: null, spice: 3, qty: 1 }
  };

  let checkoutLocked = false;
  let cachedSummary = null;

  // Utilities
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function escapeHTML(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function haptic() { if (navigator.vibrate) navigator.vibrate(10); }

  // API Calls
  function fetchWithTimeout(url, options, timeoutMs=6000) { return Promise.race([fetch(url, options), new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))]); }
  function getSupabase() { return window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null; }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  function estimateRoadDistance(straightKm) { return Math.round(straightKm * (straightKm <= 10 ? 1.35 : straightKm <= 20 ? 1.30 : 1.20)); }

  // Shipping & Cart Logic
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

  function calculateShipping(distance, mainQty) {
    const dist = distance || 2;
    if (dist > 50) return { cost: null, label: 'Konfirmasi Pramutamu' };
    if (state.shippingProvider === 'paxel') {
      const large = Math.floor(mainQty / 2), med = mainQty % 2;
      return { cost: (large * 25000) + (med * 20000) + ((large + med) * 3000), label: 'Paxel Same Day' };
    } else {
      let cost = dist <= 3 ? 8000 : dist <= 10 ? 8000 + (dist-3)*1800 : dist <= 20 ? 20600 + (dist-10)*1600 : dist <= 30 ? 36600 + (dist-20)*1400 : 50600 + (dist-30)*1150;
      if (state.vehicleType === 'mobil') cost = dist <= 3 ? 24000 : dist <= 10 ? 24000 + (dist-3)*4500 : dist <= 20 ? 55500 + (dist-10)*4000 : 95500 + (dist-20)*3500;
      return { cost, label: state.vehicleType === 'motor' ? 'Kurir Instan (Roda Dua)' : 'Kurir Instan (Roda Empat)' };
    }
  }

  // AI Concierge
  function renderAIRecommendation() {
    const container = document.getElementById('aiRecommendationContainer'); if (!container) return;
    const history = JSON.parse(localStorage.getItem('rujak_order_history') || '[]');
    let recId = history.length > 0 ? history[history.length-1] : 'p_m3'; // Simple logic
    const product = PRODUCTS.find(p => p.id === recId && !Object.keys(state.cart).some(k=>k.startsWith(p.id)));
    
    if (!product) { container.style.display = 'none'; return; }
    container.style.display = 'flex';
    container.innerHTML = `<div style="flex-shrink:0; background:rgba(255,255,255,0.2); padding:12px; border-radius:12px;"><i data-lucide="sparkles" class="w-6 h-6"></i></div><div style="flex:1;"><div class="ai-rec-title">Kurasi Spesial Anda</div><div class="ai-rec-desc">${product.name} — ${fmt(product.price)}</div></div><button onclick="window.addToCartAI('${product.id}')" class="btn-add-unified" style="background:white;color:var(--green);">Pesan Ini</button>`;
  }

  window.addToCartAI = function(id) {
    const p = PRODUCTS.find(prod => prod.id === id); if(!p) return;
    state.cart[id + '_spice3'] = { qty: 1, spice: 3 }; invalidateCache(); updateUI();
    document.getElementById('aiRecommendationContainer').style.display = 'none';
  };

  // Rendering
  function renderMenu() {
    const container = document.getElementById('menuList'); if (!container) return;
    const filter = state.activeFilter;
    let items = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);
    
    if(state.searchQuery.length >= 2) {
      const q = state.searchQuery.toLowerCase();
      items = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    }

    document.getElementById('skeletonContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = items.length ? 'none' : 'block';
    
    container.innerHTML = items.map(p => {
      let qty = 0; Object.keys(state.cart).forEach(k => { if(k.startsWith(p.id)) qty += state.cart[k].qty; });
      const badge = p.badge ? `<span class="item-badge-right ${p.badgeColor}">${p.badge}</span>` : '';
      const control = qty === 0 ? `<button class="btn-add-unified" data-action="open-modal" data-id="${p.id}">Tambahkan</button>` : `<div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${p.id}_spice3"><i data-lucide="minus" class="w-3 h-3"></i></button><span class="qty-num">${qty}</span><button class="qty-btn" data-action="increase" data-id="${p.id}_spice3"><i data-lucide="plus" class="w-3 h-3"></i></button></div>`;
      return `<div class="menu-item" data-id="${p.id}"><div class="item-img-wrap"><img src="${p.thumbnail}" loading="lazy"></div><div class="item-body"><div class="item-name-row"><h3 class="item-name">${p.name}</h3>${badge}</div><p class="item-desc">${p.desc}</p><div class="item-footer"><span class="item-price">${fmt(p.price)}</span>${control}</div></div></div>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
  }

  function renderAddons() {
    const container = document.getElementById('addonList'); if (!container) return;
    container.innerHTML = ADDONS.map(a => {
      const qty = state.cart[a.id]?.qty || 0;
      const control = qty === 0 ? `<button class="btn-add-unified" data-action="add-addon" data-id="${a.id}">Tambahkan</button>` : `<div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${a.id}"><i data-lucide="minus" class="w-3 h-3"></i></button><span class="qty-num">${qty}</span><button class="qty-btn" data-action="increase" data-id="${a.id}"><i data-lucide="plus" class="w-3 h-3"></i></button></div>`;
      return `<div class="addon-card"><div class="addon-icon"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div><div class="addon-name">${a.name}</div><div class="addon-price">${fmt(a.price)}</div>${control}</div>`;
    }).join('');
  }

  function updateShippingUI() {
    const summary = getCartSummaryCached();
    const dist = state.selectedDistrict ? (DISTRICT_MAP[state.selectedDistrict] || estimateRoadDistance(10)) : (state.userDistance || 2);
    const ship = calculateShipping(dist, summary.mainProductQty || 1);
    
    document.getElementById('shippingCost').textContent = ship.cost ? fmt(ship.cost) : 'Konfirmasi';
    document.getElementById('shippingDistance').textContent = `~${dist} km`;
    
    const breakdown = document.getElementById('breakdownContent');
    if(breakdown) breakdown.innerHTML = `<div>Estimasi Jarak: <strong>${dist} km</strong></div><div>Layanan: <strong>${ship.label}</strong></div><div style="margin-top:8px; padding-top:8px; border-top:1px solid var(--gray-200);">Biaya Pengiriman: <strong>${ship.cost ? fmt(ship.cost) : 'Hubungi Kami'}</strong></div>`;
    
    document.getElementById('finalSubtotal').textContent = fmt(summary.subtotal);
    document.getElementById('finalDiscount').textContent = summary.discount > 0 ? `-${fmt(summary.discount)}` : 'Rp0';
    document.getElementById('finalShipping').textContent = ship.cost ? fmt(ship.cost) : 'Rp0';
    document.getElementById('finalTotal').textContent = fmt(summary.subtotal - summary.discount + (ship.cost || 0));
  }

  function renderCart() {
    const sum = getCartSummaryCached(), bar = document.getElementById('bottom-bar');
    if (sum.totalQty > 0) {
      if(bar) bar.classList.add('visible');
      document.getElementById('cartPreview').textContent = `${sum.totalQty} sajian`;
      document.getElementById('cartTotalDisplay').textContent = fmt(sum.subtotal - sum.discount);
      document.getElementById('discountLabel').style.display = sum.discount > 0 ? 'inline-block' : 'none';
    } else {
      if(bar) bar.classList.remove('visible');
      const mc = document.getElementById('miniCartModal'); if(mc && mc.classList.contains('active')) mc.classList.remove('active');
    }
    saveCart();
  }

  function renderMiniCart() {
    const sum = getCartSummaryCached();
    document.getElementById('miniCartList').innerHTML = sum.items.map(i => `<div class="mini-cart-item"><div class="mini-cart-info"><div class="mini-cart-name">${i.name}${i.spice?' (Level '+i.spice+')':''}</div><div class="mini-cart-detail">${fmt(i.price)}</div></div><div class="mini-cart-qty"><button data-action="decrease" data-id="${i.cartId}"><i data-lucide="minus" class="w-3 h-3"></i></button><span>${i.qty}</span><button data-action="increase" data-id="${i.cartId}"><i data-lucide="plus" class="w-3 h-3"></i></button></div></div>`).join('');
    document.getElementById('cartSubtotalDisplay').textContent = fmt(sum.subtotal);
    
    if(state.selectedDistrict) document.getElementById('districtLabel').textContent = state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase());
    updateShippingUI();
    if(window.lucide) lucide.createIcons();
  }

  function updateUI() { invalidateCache(); renderMenu(); renderAddons(); renderCart(); renderAIRecommendation(); if(document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart(); }

  // Product Page History
  function openProductPage(id) {
    const p = PRODUCTS.find(x => x.id === id); if(!p) return;
    document.getElementById('productPageImg').innerHTML = `<img src="${p.image}">`;
    document.getElementById('productPageName').textContent = p.name;
    document.getElementById('productPageDesc').textContent = p.desc;
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

  // Init & Events
  function init() {
    loadCart(); updateUI();
    
    // Concierge Chat
    const cb = document.getElementById('aiChatBox'), ci = document.getElementById('aiChatInput'), cm = document.getElementById('aiChatMessages');
    document.getElementById('aiChatToggle')?.addEventListener('click', () => { cb.style.display = cb.style.display === 'none' ? 'block' : 'none'; if(cb.style.display==='block') ci.focus(); });
    document.getElementById('aiChatClose')?.addEventListener('click', () => cb.style.display = 'none');
    document.getElementById('aiChatSend')?.addEventListener('click', () => {
      if(!ci.value.trim()) return;
      cm.innerHTML += `<div style="margin-bottom:8px; text-align:right;"><span class="chat-bubble user">${escapeHTML(ci.value)}</span></div>`;
      ci.value = ''; cm.scrollTop = cm.scrollHeight;
      setTimeout(() => {
        cm.innerHTML += `<div style="margin-bottom:8px;"><span class="chat-bubble bot">Tentu, saya akan mencatat preferensi tersebut. Ada hal lain yang bisa kami siapkan untuk Anda?</span></div>`;
        cm.scrollTop = cm.scrollHeight;
      }, 600);
    });

    // District Autocomplete
    const di = document.getElementById('districtInput'), dt = document.getElementById('districtTrigger'), dm = document.getElementById('customDistrictDropdown');
    if(dt) dt.addEventListener('click', () => {
      di.type = 'text'; di.style.marginBottom = '8px'; di.focus();
      dm.style.display = 'block';
      dm.innerHTML = Object.keys(DISTRICT_MAP).slice(0,15).map(k => `<div style="padding:12px 16px; border-bottom:1px solid #eee; cursor:pointer;" data-val="${k}">${k.replace(/\b\w/g, l=>l.toUpperCase())}</div>`).join('');
    });
    if(di) di.addEventListener('input', e => {
      const v = e.target.value.toLowerCase();
      const m = Object.keys(DISTRICT_MAP).filter(k => k.includes(v)).slice(0,10);
      dm.innerHTML = m.map(k => `<div style="padding:12px 16px; border-bottom:1px solid #eee; cursor:pointer;" data-val="${k}">${k.replace(/\b\w/g, l=>l.toUpperCase())}</div>`).join('');
    });
    if(dm) dm.addEventListener('click', e => {
      const v = e.target.closest('div[data-val]')?.dataset.val; if(!v) return;
      state.selectedDistrict = v; di.type = 'hidden'; dm.style.display = 'none';
      document.getElementById('districtLabel').textContent = v.replace(/\b\w/g, l=>l.toUpperCase());
      updateShippingUI();
    });

    // Global Clicks
    document.addEventListener('click', e => {
      if(e.target.closest('[data-action="open-cart"]')) { openMiniCart(); return; }
      if(e.target.closest('#miniCartClose') || (e.target.id === 'miniCartModal' && !e.target.closest('.modal-content'))) { closeMiniCart(); return; }
      if(e.target.closest('#backFromProduct')) { closeProductPage(); return; }
      
      const act = e.target.closest('[data-action]');
      if(act) {
        haptic(); const id = act.dataset.id, type = act.dataset.action;
        if(type === 'open-modal') { openProductPage(id); }
        else if(type === 'add-addon') { state.cart[id] = {qty:1}; updateUI(); }
        else if(type === 'increase') { state.cart[id].qty++; updateUI(); }
        else if(type === 'decrease') { state.cart[id].qty--; if(state.cart[id].qty<=0) delete state.cart[id]; updateUI(); }
      }

      // Shipping & Vehicles
      if(e.target.closest('.ship-btn')) {
        document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active'));
        const btn = e.target.closest('.ship-btn'); btn.classList.add('active');
        state.shippingProvider = btn.dataset.provider;
        document.getElementById('rujakcoOptions').style.display = state.shippingProvider === 'paxel' ? 'none' : 'block';
        updateShippingUI();
      }
      if(e.target.closest('.veh-btn')) {
        document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
        const btn = e.target.closest('.veh-btn'); btn.classList.add('active');
        state.vehicleType = btn.dataset.vehicle; updateShippingUI();
      }
      
      // Checkout
      if(e.target.closest('#btnOpenPayment')) {
        if(!state.selectedDistrict) { alert('Mohon pilih wilayah pengiriman terlebih dahulu.'); return; }
        document.getElementById('paymentTotalDisplay').textContent = document.getElementById('finalTotal').textContent;
        document.getElementById('paymentModal').classList.add('active');
      }
      if(e.target.closest('#paymentClose')) { document.getElementById('paymentModal').classList.remove('active'); }
      if(e.target.closest('[data-action="confirm-wa"]')) {
        const order = 'RJ' + Date.now().toString(36).toUpperCase().slice(-6);
        window.open('https://wa.me/' + SYSTEM.WA_NUMBER + '?text=Halo%20Concierge,%20saya%20ingin%20mengkonfirmasi%20pembayaran%20untuk%20pesanan%20' + order);
        state.cart = {}; invalidateCache(); updateUI();
        document.getElementById('paymentModal').classList.remove('active'); closeMiniCart();
      }
    });

    // Intersection Observer for Reveal
    const obs = new IntersectionObserver(e => e.forEach(x => { if(x.isIntersecting) x.target.classList.add('visible'); }), { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll, .stagger-children').forEach(el => obs.observe(el));
    if(window.lucide) lucide.createIcons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
