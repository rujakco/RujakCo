(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO — ULTIMATE SILENT LUXURY ENGINE (SPACIOUS & SQUARE)
  // ============================================================

  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";
  const SYSTEM = { WA_NUMBER: '6289677161680', STORE_LAT: -6.2165414, STORE_LNG: 107.0177395, DEFAULT_DISTANCE: 2 };

  const PRODUCTS = [
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original Rujak.Co. Disiapkan seketika sesaat sebelum pengantaran untuk menjaga tekstur renyah alami.', price:35000, cat:'classic', container:'Thinwall 1000ml Presisi', size:'Porsi Reguler', sambal:'Original Signature (1 Cup)', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp' },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus secara presisi untuk pengalaman rasa yang lebih menyatu secara intim dengan saus karamelisasi mete.', price:26000, cat:'classic', container:'Thinwall 750ml', size:'Porsi Reguler', sambal:'Original Terbawa', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp' },
    { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah eksklusif pilihan dengan sambal mete premium. Sebuah mahakarya harmoni rasa gurih, pedas, dan manis.', price:40000, cat:'signature', container:'Thinwall 1000ml Tersiegel', size:'Porsi Eksklusif', sambal:'Karamelisasi Mete (1 Cup)', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp' },
    { id:'p_m4', name:'Rujak Rama', desc:'Formula porsi melimpah yang dikonsepkan khusus untuk momentum kebersamaan atau perjamuan formal kerabat terdekat.', price:48000, cat:'signature', container:'Jumbo Thinwall 1000ml', size:'Porsi Sharing', sambal:'Karamelisasi Mete (2 Cup)', defaultSpice:4, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp' },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi premium dengan anggur Shine Muscat impor pilihan. Menggabungkan kemewahan tekstur tanpa biji dengan buah tropis terbaik.', price:85000, cat:'reserve', container:'Premium Luxury Box', size:'Vault Single', sambal:'Mete Grand Reserve (2 Cup)', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp' },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Representasi kemegahan tradisi rasa Indonesia dalam wadah tampah bambu rajutan tangan untuk perjamuan istimewa Anda.', price:200000, cat:'reserve', container:'Tampah Bambu Ø40cm', size:'Perjamuan (8-10 Orang)', sambal:'Original & Mete (4 Cup)', defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp' }
  ];

  const DISTRICT_MAP = { 'bekasi barat':5, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11, 'rawalumbu':8, 'jatiasih':12, 'pondokgede':14, 'cikarang':23, 'tambun':16, 'cibitung':20, 'gambir':18, 'menteng':19, 'tebet':20, 'pancoran':21, 'pasar minggu':22, 'kebayoran lama':24, 'kebayoran baru':22, 'mampang prapatan':21, 'pulo gadung':16, 'jatinegara':18, 'duren sawit':15, 'kramat jati':19, 'pasar rebo':20, 'cakung':12, 'kembangan':25, 'kelapa gading':27, 'depok':35, 'tangerang':38, 'bogor':50 };

  const state = {
    cart: {}, activeFilter: 'all', userDistance: null, isPriority: false,
    customerName: '', customerPhone: '', customerAddress: '', selectedDistrict: '',
    shippingProvider: 'rujakco', vehicleType: 'motor', currentProductPage: { id: null, spice: 3, qty: 1 }
  };

  let checkoutLocked = false, toastTimer = null;

  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function escapeHTML(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function showToast(msg) {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
  }

  function haversineDistance(lat1, lon1, lat2, lon2) { const R = 6371; const dLat = (lat2-lat1)*Math.PI/180; const dLon = (lon2-lon1)*Math.PI/180; const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); }
  function estimateRoadDistance(straightKm) { return Math.round(straightKm * (straightKm <= 10 ? 1.35 : straightKm <= 20 ? 1.30 : 1.20)); }

  function getSupabase() { return window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null; }

  function getCartSummary() {
    const items = []; let subtotal = 0, totalQty = 0, mainProductQty = 0;
    Object.keys(state.cart).forEach(id => {
      const entry = state.cart[id], pid = id.split('_spice')[0], item = PRODUCTS.find(p=>p.id===pid);
      if (item && entry && entry.qty > 0) {
        subtotal += item.price * entry.qty; totalQty += entry.qty; mainProductQty += entry.qty;
        items.push({ cartId: id, id: pid, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice });
      } else { delete state.cart[id]; }
    });
    return { items, totalQty, mainProductQty, subtotal };
  }

  function calculateShipping(distance, mainQty) {
    const dist = distance || SYSTEM.DEFAULT_DISTANCE;
    if (dist > 50) return { cost: null, label: 'Konfirmasi Pramutamu' };
    if (state.shippingProvider === 'paxel') {
      const large = Math.floor(mainQty/2), med = mainQty%2;
      return { cost: (large*25000)+(med*20000)+((large+med)*3000), label: 'Paxel Premium' };
    } else {
      let cost = dist<=3?8000:dist<=10?8000+(dist-3)*1800:dist<=20?20600+(dist-10)*1600:dist<=30?36600+(dist-20)*1400:50600+(dist-30)*1150;
      if (state.vehicleType === 'mobil') cost = dist<=3?24000:dist<=10?24000+(dist-3)*4500:dist<=20?55500+(dist-10)*4000:95500+(dist-20)*3500;
      if (state.isPriority) cost += 8000;
      return { cost, label: state.vehicleType==='motor'?'Kurir Instan':'Secure Vault' };
    }
  }

  function updateShippingUI() {
    const sum = getCartSummary();
    const dist = state.selectedDistrict ? (DISTRICT_MAP[state.selectedDistrict] || estimateRoadDistance(10)) : (state.userDistance || null);
    
    if (dist !== null) { document.getElementById('shippingSection').style.display = 'block'; }

    const ship = calculateShipping(dist || SYSTEM.DEFAULT_DISTANCE, sum.mainProductQty || 1);
    
    document.getElementById('shippingDistance').textContent = dist ? `${dist} km` : '';
    document.getElementById('finalShipping').textContent = ship.cost ? fmt(ship.cost) : '...';
    document.getElementById('finalTotal').textContent = ship.cost ? fmt(sum.subtotal + ship.cost) : fmt(sum.subtotal);
  }

  function renderMenu() {
    const container = document.getElementById('menuList'); if (!container) return;
    let items = state.activeFilter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === state.activeFilter);
    
    document.getElementById('emptyState').style.display = items.length ? 'none' : 'block';
    
    // PERHATIKAN: Pemanggilan eksplisit p.thumbnail untuk etalase
    container.innerHTML = items.map((p, index) => `
      <div class="boutique-item" data-id="${p.id}" style="animation-delay: ${index * 0.05}s">
        <img src="${p.thumbnail}" class="btq-img" loading="lazy" alt="${p.name}">
        <h3 class="btq-name">${p.name}</h3>
        <span class="btq-price">${fmt(p.price)}</span>
      </div>
    `).join('');
  }

  function renderCart() {
    const sum = getCartSummary();
    const badges = [document.getElementById('cartBadgeTop'), document.getElementById('cartBadgeFloat')];
    badges.forEach(b => { if(b) { b.textContent = sum.totalQty; b.style.display = sum.totalQty > 0 ? 'flex' : 'none'; }});
    
    const floatBtn = document.getElementById('floatingCartBtn');
    if(floatBtn) floatBtn.style.display = (document.getElementById('productPage').style.display === 'block' || sum.totalQty === 0) ? 'none' : 'flex';
  }

  function renderMiniCart() {
    const sum = getCartSummary();
    const list = document.getElementById('miniCartList');
    list.innerHTML = sum.items.length === 0 ? '<p style="text-align:center; color:var(--gray-500); padding:32px 0;">Tas belanja Anda kosong.</p>' : sum.items.map(i => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <h4>${i.name}${i.spice?' (Lv '+i.spice+')':''}</h4>
          <p>${fmt(i.price)}</p>
        </div>
        <div class="qty-minimal">
          <button data-action="decrease" data-id="${i.cartId}">−</button>
          <span>${i.qty}</span>
          <button data-action="increase" data-id="${i.cartId}">+</button>
        </div>
      </div>
    `).join('');
    
    document.getElementById('cartSubtotalDisplay').textContent = fmt(sum.subtotal);
    if(state.selectedDistrict) { const di = document.getElementById('districtInput'); if(di) di.value = state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase()); }
    updateShippingUI();
  }

  function updateUI() { try{localStorage.setItem('rj_crt_v5', JSON.stringify(state.cart));}catch(e){} renderMenu(); renderCart(); if(document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart(); }

  // --- Navigasi Detail Produk ---
  function openProductPage(id) {
    const p = PRODUCTS.find(x => x.id === id); if(!p) return;
    
    // PERHATIKAN: Pemanggilan eksplisit p.image (High-Res) untuk detail produk
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
    
    document.getElementById('productPage').style.display = 'block'; document.getElementById('mainContent').style.display = 'none'; 
    document.getElementById('floatingCartBtn').style.display = 'none';
    window.scrollTo(0,0);
  }
  
  function closeProductPage() {
    document.getElementById('productPage').style.display = 'none'; document.getElementById('mainContent').style.display = 'block';
    renderCart();
  }

  // --- Animasi Scroll (Fade Up) ---
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    setTimeout(() => { document.querySelector('.hero-editorial')?.classList.add('visible'); }, 100);
  }

  // --- Chat Pramutamu AI ---
  function initAIChat() {
    const box = document.getElementById('aiChatBox'), input = document.getElementById('aiChatInput'), send = document.getElementById('aiChatSend'), messages = document.getElementById('aiChatMessages');
    
    const processMsg = () => {
      const txt = input.value.trim(); if(!txt) return;
      messages.innerHTML += `<div class="msg-user"><span>${escapeHTML(txt)}</span></div>`;
      input.value = ''; messages.scrollTop = messages.scrollHeight;
      setTimeout(() => { messages.innerHTML += `<div class="msg-bot" style="margin-bottom:12px;"><span>Pesan Anda telah kami terima. Pramutamu kami akan memastikan pengalaman terbaik untuk Anda.</span></div>`; messages.scrollTop = messages.scrollHeight; }, 800);
    };
    
    if(send) send.addEventListener('click', processMsg);
    if(input) input.addEventListener('keydown', e => { if(e.key === 'Enter') processMsg(); });
  }

  // --- Event Listeners Master ---
  function bindEvents() {
    document.getElementById('backFromProduct')?.addEventListener('click', closeProductPage);
    
    document.getElementById('addToCartPage')?.addEventListener('click', function() {
      const { id, spice, qty } = state.currentProductPage;
      const cartKey = id + '_spice' + spice;
      const entry = state.cart[cartKey] || { qty: 0, spice: spice };
      entry.qty += qty; entry.spice = spice; state.cart[cartKey] = entry;
      updateUI(); showToast('Sajian ditambahkan ke tas belanja.');
      closeProductPage();
    });

    document.getElementById('spiceOptionsPage')?.addEventListener('click', function(e) {
      if (e.target.classList.contains('spice-option')) {
        document.querySelectorAll('#spiceOptionsPage .spice-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active'); state.currentProductPage.spice = parseInt(e.target.dataset.spice);
      }
    });

    document.getElementById('qtyMinusPage')?.addEventListener('click', () => { if (state.currentProductPage.qty > 1) { state.currentProductPage.qty--; document.getElementById('qtyNumPage').textContent = state.currentProductPage.qty; } });
    document.getElementById('qtyPlusPage')?.addEventListener('click', () => { state.currentProductPage.qty++; document.getElementById('qtyNumPage').textContent = state.currentProductPage.qty; });

    const openCart = () => { document.getElementById('miniCartModal').classList.add('active'); document.body.style.overflow='hidden'; renderMiniCart(); };
    document.getElementById('topCartBtn')?.addEventListener('click', openCart);
    document.getElementById('floatingCartBtn')?.addEventListener('click', openCart);
    document.getElementById('miniCartClose')?.addEventListener('click', () => { document.getElementById('miniCartModal').classList.remove('active'); document.body.style.overflow=''; });

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

    document.getElementById('btnAutoDetect')?.addEventListener('click', function() {
      if(navigator.geolocation) {
        showToast('Menghubungkan ke satelit GPS...');
        navigator.geolocation.getCurrentPosition(pos => {
          state.userDistance = estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, pos.coords.latitude, pos.coords.longitude));
          state.selectedDistrict = ''; if(di) di.value = 'Titik Satelit Terhubung';
          updateShippingUI();
          showToast('Jarak berhasil disinkronisasi.');
        }, () => { showToast('Akses lokasi ditolak perangkat.'); }, { timeout: 8000 });
      }
    });

    document.addEventListener('click', e => {
      if(e.target.classList.contains('cat-link')) { 
        document.querySelectorAll('.cat-link').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); 
        state.activeFilter = e.target.dataset.cat; updateUI(); 
      }

      const mi = e.target.closest('.boutique-item');
      if (mi) { openProductPage(mi.dataset.id); }

      const act = e.target.closest('[data-action]');
      if(act) {
        const id = act.dataset.id, type = act.dataset.action;
        if(type === 'increase') { state.cart[id].qty++; updateUI(); }
        else if(type === 'decrease') { state.cart[id].qty--; if(state.cart[id].qty<=0) delete state.cart[id]; updateUI(); }
      }

      if(e.target.classList.contains('log-btn')) { document.querySelectorAll('.log-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); state.shippingProvider = e.target.dataset.provider; document.getElementById('rujakcoOptions').style.display = state.shippingProvider === 'paxel' ? 'none' : 'block'; document.getElementById('paxelOptions').style.display = state.shippingProvider === 'paxel' ? 'block' : 'none'; updateShippingUI(); }
      if(e.target.classList.contains('veh-btn')) { document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); state.vehicleType = e.target.dataset.vehicle; updateShippingUI(); }
      if(e.target.id === 'priorityToggleMini') { state.isPriority = e.target.checked; updateShippingUI(); }

      if(e.target.id === 'btnOpenPayment') {
        const name = document.getElementById('customerName')?.value.trim(), phone = document.getElementById('customerPhone')?.value.trim(), address = document.getElementById('customerAddress')?.value.trim();
        if(!name || !phone || !address || (!state.selectedDistrict && !state.userDistance)) { showToast('Mohon lengkapi formulir pengiriman.'); return; }
        state.customerName = name; state.customerPhone = phone; state.customerAddress = address; 
        document.getElementById('paymentTotalDisplay').textContent = document.getElementById('finalTotal').textContent;
        document.getElementById('paymentModal').classList.add('active');
      }

      if(e.target.id === 'paymentClose') { document.getElementById('paymentModal').classList.remove('active'); }
      
      if(e.target.closest('[data-action="confirm-wa"]')) {
        if (checkoutLocked) return; checkoutLocked = true;
        const sum = getCartSummary();
        const distNum = state.selectedDistrict ? DISTRICT_MAP[state.selectedDistrict] || 10 : (state.userDistance || 2);
        const ship = calculateShipping(distNum, sum.mainProductQty || 1);
        const orderId = 'RJ' + Date.now().toString(36).toUpperCase().slice(-6);
        const timeDel = document.getElementById('deliveryTime')?.value || 'Esok Hari';
        const notes = document.getElementById('orderNotes')?.value || '-';
        
        let msg = `*RESERVASI RUJAK.CO*\n\nID: #${orderId}\nKlien: ${state.customerName}\nAlamat: ${state.customerAddress}\nJam: ${timeDel}\nCatatan: ${notes}\n\n*Kurasi:*\n`;
        sum.items.forEach(i => msg += `- ${i.name} ${i.spice?'(Lv '+i.spice+')':''} x${i.qty}\n`);
        msg += `\nSajian: ${fmt(sum.subtotal)}\nLogistik: ${fmt(ship.cost)}\n*TOTAL: ${fmt(sum.subtotal + (ship.cost||0))}*\n\n(Mohon lampirkan struk validasi QRIS)`;
        
        getSupabase().then(client => {
          if(client) {
            client.from('orders').insert([{ order_id: orderId, customer_name: state.customerName, customer_phone: state.customerPhone, customer_address: state.customerAddress, items: sum.items, total: sum.subtotal + (ship.cost || 0), status: 'pending' }]).then(({error}) => { if (error) console.error(error); });
          }
        });

        setTimeout(() => {
          checkoutLocked = false;
          window.open('https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
          state.cart = {}; updateUI(); 
          document.getElementById('paymentModal').classList.remove('active');
          document.getElementById('miniCartModal').classList.remove('active'); document.body.style.overflow='';
        }, 500);
      }

      if(e.target.id === 'aiChatToggle') { e.preventDefault(); document.getElementById('aiChatBox').classList.add('active'); }
      if(e.target.id === 'aiChatClose') { document.getElementById('aiChatBox').classList.remove('active'); }
    });
  }

  function init() {
    initScrollReveal();
    initAIChat();
    try { const s = localStorage.getItem('rj_crt_v5'); if(s) state.cart = JSON.parse(s); } catch(e){}
    updateUI(); bindEvents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
