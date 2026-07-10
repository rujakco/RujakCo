(function() {
  'use strict';

  // RUJAK.CO — THE SILENT LUXURY ENGINE
  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";
  const SYSTEM = { WA_NUMBER: '6289677161680', STORE_LAT: -6.2165414, STORE_LNG: 107.0177395, DEFAULT_DISTANCE: 2 };

  // Deskripsi disederhanakan
  const PRODUCTS = [
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original.', price:35000, container:'Thinwall 1000ml', size:'Reguler', sambal:'Original', buah:['Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp' },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk tekstur yang lebih menyatu.', price:26000, container:'Thinwall 750ml', size:'Reguler', sambal:'Original', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Ungu'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp' },
    { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah pilihan dengan sambal mete.', price:40000, container:'Thinwall 1000ml', size:'Eksklusif', sambal:'Mete', buah:['Jambu Kristal','Mangga Indramayu','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp' },
    { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah untuk dinikmati bersama.', price:48000, container:'Jumbo 1000ml', size:'Sharing', sambal:'Mete (2 Cup)', buah:['Jambu Kristal','Mangga','Nanas','Bengkoang','Jambu Air','Kedondong'], defaultSpice:4, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp' },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi dengan anggur Shine Muscat pilihan.', price:85000, container:'Luxury Box', size:'Premium', sambal:'Mete', buah:['Shine Muscat','Jambu Kristal','Mangga','Nanas','Bengkoang'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp' },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Tradisi rasa dalam wadah tampah bambu.', price:200000, container:'Tampah Bambu', size:'Perjamuan', sambal:'Original & Mete', buah:['Shine Muscat','Jambu Kristal','Mangga','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp' }
  ];

  const DISTRICT_MAP = { 'bekasi barat':5, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11, 'rawalumbu':8, 'jatiasih':12, 'pondokgede':14, 'cikarang':23, 'tambun':16, 'cibitung':20, 'gambir':18, 'menteng':19, 'tebet':20, 'pancoran':21, 'pasar minggu':22, 'kebayoran lama':24, 'kebayoran baru':22, 'mampang prapatan':21, 'pulo gadung':16, 'jatinegara':18, 'duren sawit':15, 'kramat jati':19, 'pasar rebo':20, 'cakung':12, 'kembangan':25, 'kelapa gading':27, 'depok':35, 'tangerang':38, 'bogor':50 };

  const state = {
    cart: {}, drafts: {},
    customerName: '', customerPhone: '', customerAddress: '', selectedDistrict: '',
    shippingProvider: 'rujakco', vehicleType: 'motor'
  };

  // Infinite loop multiplier yang ringan (5x cukup untuk ilusi)
  const LOOP_MULTIPLIER = 5; 
  let loopedProducts = [];
  for(let i=0; i<LOOP_MULTIPLIER; i++) { loopedProducts = loopedProducts.concat(PRODUCTS); }

  let checkoutLocked = false, toastTimer = null;
  PRODUCTS.forEach(p => { state.drafts[p.id] = { spice: p.defaultSpice || 3, qty: 1 }; });

  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function escapeHTML(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  
  // Toast Hening
  function showToast(msg) {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove('show'); }, 2000);
  }

  function haversineDistance(lat1, lon1, lat2, lon2) { const R = 6371; const dLat = (lat2-lat1)*Math.PI/180; const dLon = (lon2-lon1)*Math.PI/180; const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); }
  function estimateRoadDistance(straightKm) { return Math.round(straightKm * (straightKm <= 10 ? 1.35 : straightKm <= 20 ? 1.30 : 1.20)); }
  function getSupabase() { return window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null; }

  function applyPersonalization() {
    const name = state.customerName || 'Klien';
    if(document.getElementById('customerName')) document.getElementById('customerName').value = name;
    if(document.getElementById('districtInput') && state.selectedDistrict) { document.getElementById('districtInput').value = state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase()); }
    updateShippingUI();
  }

  function initOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    let savedName = null, savedDistrict = null;
    try { savedName = localStorage.getItem('rj_client_name'); savedDistrict = localStorage.getItem('rj_client_district'); } catch(e) {}
    
    if (savedName && savedDistrict) {
      state.customerName = savedName; state.selectedDistrict = savedDistrict;
      document.getElementById('onbNewUser').style.display = 'none';
      document.getElementById('onbReturningUser').style.display = 'block';
      document.getElementById('onbWelcomeName').textContent = savedName;
    } else {
      document.getElementById('onbNewUser').style.display = 'block';
    }

    const onbName = document.getElementById('onbName'), onbNextBtn = document.getElementById('onbNextBtn'), onbStep1 = document.getElementById('onbStep1'), onbStep2 = document.getElementById('onbStep2'), onbDistrict = document.getElementById('onbDistrict'), onbDropdown = document.getElementById('onbDistrictDropdown'), onbStartBtn = document.getElementById('onbStartBtn');
    
    if(onbNextBtn) onbNextBtn.addEventListener('click', () => {
      const nameVal = onbName.value.trim(); if(!nameVal) return;
      state.customerName = nameVal; onbStep1.classList.remove('active'); setTimeout(() => { onbStep2.classList.add('active'); onbDistrict.focus(); }, 100);
    });
    
    if(onbDistrict) onbDistrict.addEventListener('input', e => {
      const v = e.target.value.toLowerCase(), m = Object.keys(DISTRICT_MAP).filter(k => k.includes(v));
      if(onbDropdown) { onbDropdown.style.display = 'block'; onbDropdown.innerHTML = m.map(k => `<div data-val="${k}">${k.replace(/\b\w/g, l=>l.toUpperCase())}</div>`).join(''); }
    });
    
    if(onbDropdown) onbDropdown.addEventListener('click', e => {
      const v = e.target.closest('div[data-val]')?.dataset.val; if(!v) return;
      state.selectedDistrict = v; onbDropdown.style.display = 'none'; onbDistrict.value = v.replace(/\b\w/g, l=>l.toUpperCase());
    });
    
    if(onbStartBtn) onbStartBtn.addEventListener('click', () => {
      if(!state.selectedDistrict) return;
      try { localStorage.setItem('rj_client_name', state.customerName); localStorage.setItem('rj_client_district', state.selectedDistrict); } catch(e){}
      overlay.classList.add('hidden'); setTimeout(() => { overlay.style.display = 'none'; }, 800);
      applyPersonalization(); initScrollReveal();
    });

    document.getElementById('onbEnterBtn')?.addEventListener('click', () => {
      overlay.classList.add('hidden'); setTimeout(() => { overlay.style.display = 'none'; }, 800);
      applyPersonalization(); initScrollReveal();
    });

    document.getElementById('onbResetBtn')?.addEventListener('click', () => {
      try { localStorage.removeItem('rj_client_name'); localStorage.removeItem('rj_client_district'); } catch(e){}
      document.getElementById('onbReturningUser').style.display = 'none';
      document.getElementById('onbNewUser').style.display = 'block';
    });
  }

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
    if (dist > 50) return { cost: null, label: 'Konfirmasi Admin' };
    if (state.shippingProvider === 'paxel') {
      const large = Math.floor(mainQty/2), med = mainQty%2;
      return { cost: (large*25000)+(med*20000)+((large+med)*3000), label: 'Paxel' };
    } else {
      let cost = dist<=3?8000:dist<=10?8000+(dist-3)*1800:dist<=20?20600+(dist-10)*1600:dist<=30?36600+(dist-20)*1400:50600+(dist-30)*1150;
      if (state.vehicleType === 'mobil') cost = dist<=3?24000:dist<=10?24000+(dist-3)*4500:dist<=20?55500+(dist-10)*4000:95500+(dist-20)*3500;
      return { cost, label: state.vehicleType==='motor'?'Motor':'Mobil' };
    }
  }

  function updateShippingUI() {
    const sum = getCartSummary();
    const dist = state.selectedDistrict ? (DISTRICT_MAP[state.selectedDistrict] || 10) : null;
    const ship = calculateShipping(dist || SYSTEM.DEFAULT_DISTANCE, sum.mainProductQty || 1);
    
    document.getElementById('shippingDistance').textContent = dist ? `${dist} km` : '';
    document.getElementById('finalShipping').textContent = ship.cost ? fmt(ship.cost) : '...';
    document.getElementById('finalTotal').textContent = ship.cost ? fmt(sum.subtotal + ship.cost) : fmt(sum.subtotal);
  }

  function initCarousel() {
    const track = document.getElementById('menuList');
    if (!track) return;
    const updateCenter = () => {
      const items = track.querySelectorAll('.boutique-item');
      if(!items.length) return;
      const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
      let closestItem = null, minDistance = Infinity;
      items.forEach(item => {
        const itemCenter = item.getBoundingClientRect().left + item.clientWidth / 2;
        const distance = Math.abs(trackCenter - itemCenter);
        if (distance < minDistance) { minDistance = distance; closestItem = item; }
      });
      items.forEach(item => { if (item === closestItem) { item.classList.add('active-center'); } else { item.classList.remove('active-center'); } });
    };

    let isScrolling;
    track.addEventListener('scroll', () => {
      requestAnimationFrame(updateCenter);
      window.clearTimeout(isScrolling);
      isScrolling = setTimeout(() => {
        const itemWidth = track.children[0]?.offsetWidth ? track.children[0].offsetWidth + 24 : 0;
        if(itemWidth === 0) return;
        const currentIndex = Math.round(track.scrollLeft / itemWidth);
        const baseCount = PRODUCTS.length;
        if (currentIndex <= baseCount || currentIndex >= baseCount * (LOOP_MULTIPLIER - 2)) {
          const modulo = currentIndex % baseCount;
          const middleTarget = Math.floor(LOOP_MULTIPLIER / 2) * baseCount + modulo;
          const targetItem = track.children[middleTarget];
          if(targetItem) {
            track.scrollTo({ left: targetItem.offsetLeft - (track.clientWidth / 2) + (targetItem.clientWidth / 2), behavior: 'instant' });
          }
        }
      }, 150);
    });

    setTimeout(() => { 
      track.style.scrollBehavior = 'auto';
      const midPoint = Math.floor(LOOP_MULTIPLIER / 2) * PRODUCTS.length; 
      const targetItem = track.children[midPoint];
      if(targetItem) { track.scrollLeft = targetItem.offsetLeft - (track.clientWidth / 2) + (targetItem.clientWidth / 2); }
      track.style.scrollBehavior = 'smooth';
      updateCenter(); 
    }, 100);
  }

  function renderMenu() {
    const container = document.getElementById('menuList'); if (!container) return;
    container.innerHTML = loopedProducts.map((p, index) => `
      <div class="boutique-item" data-id="${p.id}" data-idx="${index}">
        <img src="${p.thumbnail}" class="btq-img" loading="lazy" alt="${p.name}">
        <h3 class="btq-name">${p.name}</h3>
        <span class="btq-price">${fmt(p.price)}</span>
      </div>
    `).join('');
    initCarousel();
  }

  function renderProductSwiper() {
    const track = document.getElementById('productSwiperTrack');
    if(!track) return;
    track.innerHTML = loopedProducts.map((p, index) => `
      <div class="product-slide" data-id="${p.id}" data-idx="${index}">
        <div class="detail-image-wrap"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
        <div class="detail-content">
          <h2>${p.name}</h2>
          <p class="detail-price">${fmt(p.price)}</p>
          
          <div class="action-area">
            <div id="step1_${index}_${p.id}">
              <button class="btn-primary full-width btn-lanjutkan" data-idx="${index}" data-pid="${p.id}">Lanjutkan</button>
            </div>
            <div id="step2_${index}_${p.id}" class="step-2-content">
              <div class="spice-selector">
                <label>Intensitas Pedas</label>
                <div class="spice-options" id="spice_${index}_${p.id}">
                  ${[1,2,3,4,5].map(i => `<button class="spice-option ${i===(state.drafts[p.id].spice)?'active':''}" data-spice="${i}" data-pid="${p.id}">${i}</button>`).join('')}
                </div>
              </div>
              <div class="detail-actions">
                <div class="qty-minimal">
                  <button class="qty-minus" data-pid="${p.id}">−</button>
                  <span class="qty-num" data-valpid="${p.id}">${state.drafts[p.id].qty}</span>
                  <button class="qty-plus" data-pid="${p.id}">+</button>
                </div>
                <button class="btn-primary full-width add-to-cart-btn" data-pid="${p.id}" data-idx="${index}">Konfirmasi</button>
              </div>
            </div>
          </div>

          <label class="section-label">Isi Sajian</label>
          <ul class="fruit-list">${p.buah.map(b => `<li>${b}</li>`).join('')}</ul>

          <div class="detail-specs">
            <div><span>Wadah</span> <span>${p.container}</span></div>
            <div><span>Porsi</span> <span>${p.size}</span></div>
            <div><span>Sambal</span> <span>${p.sambal}</span></div>
          </div>
        </div>
      </div>
    `).join('');
    if(window.lucide) window.lucide.createIcons();

    let isScrollingDetail;
    track.addEventListener('scroll', () => {
      window.clearTimeout(isScrollingDetail);
      isScrollingDetail = setTimeout(() => {
        const itemWidth = track.clientWidth;
        if(itemWidth === 0) return;
        const currentIndex = Math.round(track.scrollLeft / itemWidth);
        const baseCount = PRODUCTS.length;
        if (currentIndex <= baseCount || currentIndex >= baseCount * (LOOP_MULTIPLIER - 2)) {
          const modulo = currentIndex % baseCount;
          const middleTarget = Math.floor(LOOP_MULTIPLIER / 2) * baseCount + modulo;
          const targetItem = track.children[middleTarget];
          if(targetItem) { track.scrollTo({ left: targetItem.offsetLeft, behavior: 'instant' }); }
        }
      }, 150);
    });
  }

  function renderCart() {
    const sum = getCartSummary();
    const badge = document.getElementById('cartBadgeNav');
    if(badge) { badge.textContent = sum.totalQty; badge.style.display = sum.totalQty > 0 ? 'flex' : 'none'; }
  }

  function renderMiniCart() {
    const sum = getCartSummary();
    const list = document.getElementById('miniCartList');
    list.innerHTML = sum.items.length === 0 ? '<p style="text-align:center; color:var(--gray-500); padding:32px 0;">Tas belanja kosong.</p>' : sum.items.map(i => `
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

  function updateUI() { try{localStorage.setItem('rj_crt_v8', JSON.stringify(state.cart));}catch(e){} renderCart(); if(document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart(); }

  function openProductPage(globalIndex) {
    document.getElementById('productPage').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
    const targetSlide = document.querySelector(`.product-slide[data-idx="${globalIndex}"]`);
    if(targetSlide) { 
      const track = document.getElementById('productSwiperTrack');
      track.style.scrollBehavior = 'auto'; 
      track.scrollLeft = targetSlide.offsetLeft;
      track.style.scrollBehavior = 'smooth';
    }
  }
  
  function closeProductPage() {
    document.getElementById('productPage').style.display = 'none'; 
    document.body.style.overflow = '';
  }

  function initSwipeToClose() {
    const overlay = document.getElementById('productPage');
    let startY = 0, startX = 0, isPulling = false, activeSlide = null;

    overlay.addEventListener('touchstart', e => {
      if(e.touches.length > 1) return;
      startY = e.touches[0].clientY; startX = e.touches[0].clientX;
      activeSlide = e.target.closest('.product-slide');
      if (activeSlide) { if (activeSlide.scrollTop <= 0) { isPulling = 'down'; } else { isPulling = false; } }
    }, {passive: true});

    overlay.addEventListener('touchmove', e => {
      if(!isPulling || !activeSlide) return;
      const dy = e.touches[0].clientY - startY; const dx = e.touches[0].clientX - startX;
      if (Math.abs(dx) > Math.abs(dy)) { isPulling = false; activeSlide.style.transform = 'translateY(0)'; return; }
      if (isPulling === 'down' && dy > 0) {
        activeSlide.style.transform = `translateY(${dy * 0.4}px)`;
        if(e.cancelable) e.preventDefault(); 
      }
    }, {passive: false});

    overlay.addEventListener('touchend', e => {
      if(!isPulling || !activeSlide) return;
      const dy = e.changedTouches[0].clientY - startY;
      activeSlide.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      if (isPulling === 'down' && dy > 100) { closeProductPage(); } else { activeSlide.style.transform = 'translateY(0)'; }
      setTimeout(() => { if(activeSlide) { activeSlide.style.transition = ''; activeSlide.style.transform = ''; } isPulling = false; activeSlide = null; }, 400);
    });
  }

  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); } }); }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  }

  function initAIChat() {
    const box = document.getElementById('aiChatBox'), input = document.getElementById('aiChatInput'), send = document.getElementById('aiChatSend'), messages = document.getElementById('aiChatMessages');
    const processMsg = () => {
      const txt = input.value.trim(); if(!txt) return;
      messages.innerHTML += `<div class="msg-user"><span>${escapeHTML(txt)}</span></div>`;
      input.value = ''; messages.scrollTop = messages.scrollHeight;
      setTimeout(() => { messages.innerHTML += `<div class="msg-bot" style="margin-bottom:12px;"><span>Pesan Anda diterima. Kami akan segera membantu.</span></div>`; messages.scrollTop = messages.scrollHeight; }, 800);
    };
    if(send) send.addEventListener('click', processMsg);
    if(input) input.addEventListener('keydown', e => { if(e.key === 'Enter') processMsg(); });
  }

  function bindEvents() {
    document.getElementById('backFromProduct')?.addEventListener('click', closeProductPage);

    const openCart = () => { document.getElementById('miniCartModal').classList.add('active'); document.body.style.overflow='hidden'; renderMiniCart(); };
    document.getElementById('navCartBtn')?.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    document.getElementById('miniCartClose')?.addEventListener('click', () => { document.getElementById('miniCartModal').classList.remove('active'); document.body.style.overflow=''; });

    document.addEventListener('click', e => {
      const mi = e.target.closest('.boutique-item');
      if (mi) { openProductPage(mi.dataset.idx); }

      if (e.target.classList.contains('btn-lanjutkan')) {
        const idx = e.target.dataset.idx; const pid = e.target.dataset.pid;
        document.getElementById(`step1_${idx}_${pid}`).style.display = 'none';
        document.getElementById(`step2_${idx}_${pid}`).style.display = 'block';
      }

      if (e.target.classList.contains('spice-option')) {
        const pid = e.target.dataset.pid; const val = parseInt(e.target.dataset.spice);
        state.drafts[pid].spice = val;
        document.querySelectorAll(`.spice-option[data-pid="${pid}"]`).forEach(b => {
          b.classList.remove('active');
          if(parseInt(b.dataset.spice) === val) b.classList.add('active');
        });
      }

      if (e.target.classList.contains('qty-plus') && e.target.closest('.detail-actions')) {
        const pid = e.target.dataset.pid; state.drafts[pid].qty++; 
        document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = state.drafts[pid].qty);
      }
      if (e.target.classList.contains('qty-minus') && e.target.closest('.detail-actions')) {
        const pid = e.target.dataset.pid;
        if (state.drafts[pid].qty > 1) { 
          state.drafts[pid].qty--; 
          document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = state.drafts[pid].qty);
        }
      }

      if (e.target.classList.contains('add-to-cart-btn')) {
        const pid = e.target.dataset.pid; const draft = state.drafts[pid]; const idx = e.target.dataset.idx;
        const cartKey = pid + '_spice' + draft.spice;
        if(!state.cart[cartKey]) state.cart[cartKey] = {qty: 0, spice: draft.spice};
        state.cart[cartKey].qty += draft.qty;
        updateUI(); showToast('Ditambahkan.');
        closeProductPage();
        setTimeout(() => {
          document.getElementById(`step1_${idx}_${pid}`).style.display = 'block';
          document.getElementById(`step2_${idx}_${pid}`).style.display = 'none';
        }, 500);
      }

      const act = e.target.closest('[data-action]');
      if(act && !e.target.classList.contains('add-to-cart-btn') && !e.target.classList.contains('btn-lanjutkan')) { 
        const id = act.dataset.id, type = act.dataset.action;
        if(type === 'increase') { state.cart[id].qty++; updateUI(); }
        else if(type === 'decrease') { state.cart[id].qty--; if(state.cart[id].qty<=0) delete state.cart[id]; updateUI(); }
      }

      if(e.target.classList.contains('btn-secondary')) { 
        const parent = e.target.closest('.logistic-options');
        parent.querySelectorAll('.btn-secondary').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); 
        if(e.target.dataset.provider) { state.shippingProvider = e.target.dataset.provider; document.getElementById('rujakcoOptions').style.display = state.shippingProvider === 'paxel' ? 'none' : 'block'; document.getElementById('paxelOptions').style.display = state.shippingProvider === 'paxel' ? 'block' : 'none'; }
        if(e.target.dataset.vehicle) { state.vehicleType = e.target.dataset.vehicle; }
        updateShippingUI(); 
      }

      if(e.target.id === 'btnOpenPayment') {
        const name = document.getElementById('customerName')?.value.trim(), phone = document.getElementById('customerPhone')?.value.trim(), address = document.getElementById('customerAddress')?.value.trim();
        if(!name || !phone || !address || (!state.selectedDistrict)) { showToast('Lengkapi info pengiriman.'); return; }
        state.customerPhone = phone; state.customerAddress = address; 
        document.getElementById('paymentTotalDisplay').textContent = document.getElementById('finalTotal').textContent;
        document.getElementById('paymentModal').classList.add('active');
      }

      if(e.target.id === 'paymentClose') { document.getElementById('paymentModal').classList.remove('active'); }
      
      if(e.target.closest('[data-action="confirm-wa"]')) {
        if (checkoutLocked) return; checkoutLocked = true;
        const sum = getCartSummary();
        const distNum = state.selectedDistrict ? DISTRICT_MAP[state.selectedDistrict] || 10 : 2;
        const ship = calculateShipping(distNum, sum.mainProductQty || 1);
        const orderId = 'RJ' + Date.now().toString(36).toUpperCase().slice(-6);
        
        let msg = `*RESERVASI RUJAK.CO*\n\nID: #${orderId}\nKlien: ${state.customerName}\nAlamat: ${state.customerAddress}\n\n*Pesanan:*\n`;
        sum.items.forEach(i => msg += `- ${i.name} ${i.spice?'(Lv '+i.spice+')':''} x${i.qty}\n`);
        msg += `\nSubtotal: ${fmt(sum.subtotal)}\nPengiriman: ${fmt(ship.cost)}\n*TOTAL: ${fmt(sum.subtotal + (ship.cost||0))}*\n\n(Mohon sertakan bukti pembayaran)`;
        
        getSupabase().then(client => {
          if(client) { client.from('orders').insert([{ order_id: orderId, customer_name: state.customerName, customer_phone: state.customerPhone, customer_address: state.customerAddress, items: sum.items, total: sum.subtotal + (ship.cost || 0), status: 'pending' }]).then(({error}) => { if (error) console.error(error); }); }
        });

        setTimeout(() => {
          checkoutLocked = false;
          window.open('https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
          state.cart = {}; updateUI(); 
          document.getElementById('paymentModal').classList.remove('active');
          document.getElementById('miniCartModal').classList.remove('active'); document.body.style.overflow='';
        }, 500);
      }

      if(e.target.closest('#aiChatToggle')) { e.preventDefault(); document.getElementById('aiChatBox').classList.add('active'); }
      if(e.target.id === 'aiChatClose') { document.getElementById('aiChatBox').classList.remove('active'); }
    });
  }

  function init() {
    try { const s = localStorage.getItem('rj_crt_v8'); if(s) state.cart = JSON.parse(s); } catch(e){}
    initAIChat();
    renderMenu();
    renderProductSwiper(); 
    initSwipeToClose();    
    bindEvents();
    initOnboarding(); 
    updateUI(); 
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
