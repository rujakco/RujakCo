(function() {
  'use strict';

  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";
  const SYSTEM = { WA_NUMBER: '6289677161680', STORE_LAT: -6.2165414, STORE_LNG: 107.0177395, DEFAULT_DISTANCE: 2 };

  const SPICE_LABELS = { 1: 'Ringan', 2: 'Sedang', 3: 'Pedas', 4: 'Sangat Pedas', 5: 'Neraka' };

  const PRODUCTS = [
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original Rujak.Co. Disiapkan seketika sesaat sebelum pengantaran untuk menjaga tekstur renyah alami.', price:35000, container:'Thinwall 1000ml Presisi', size:'Porsi Reguler', sambal:'Original Signature (1 Cup)', buah:['Mangga Mengkel','Nanas Hutan','Bengkoang','Jambu Air','Kedondong Kebun'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp' },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus secara presisi untuk pengalaman rasa yang lebih menyatu secara intim dengan saus karamelisasi mete.', price:26000, container:'Thinwall 750ml', size:'Porsi Reguler', sambal:'Original Terbawa', buah:['Mangga Muda Jawa','Bengkoang Garing','Nanas Madu','Ubi Ungu Manis'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp' },
    { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah eksklusif pilihan dengan sambal mete premium. Sebuah mahakarya harmoni rasa gurih, pedas, dan manis.', price:40000, container:'Thinwall 1000ml Tersiegel', size:'Porsi Eksklusif', sambal:'Karamelisasi Mete (1 Cup)', buah:['Jambu Kristal Tanpa Biji','Mangga Indramayu Mengkel','Nanas Subang','Bengkoang Air','Jambu Air Premium','Kedondong'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp' },
    { id:'p_m4', name:'Rujak Rama', desc:'Formula porsi melimpah yang dikonsepkan khusus untuk momentum kebersamaan atau perjamuan formal kerabat terdekat.', price:48000, container:'Jumbo Thinwall 1000ml', size:'Porsi Sharing', sambal:'Karamelisasi Mete (2 Cup)', buah:['Varian Jambu Kristal','Mangga Mengkel Pilihan','Nanas Madu','Bengkoang Super','Jambu Air','Kedondong'], defaultSpice:4, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp' },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi premium dengan anggur Shine Muscat impor pilihan. Menggabungkan kemewahan tekstur tanpa biji dengan buah tropis terbaik.', price:85000, container:'Premium Luxury Box', size:'Vault Single', sambal:'Mete Grand Reserve (2 Cup)', buah:['Shine Muscat Impor Jepang Grade A','Jambu Kristal Garing','Mangga Mengkel Kurasi','Nanas Hutan','Bengkoang Garing'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp' },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Representasi kemegahan tradisi rasa Indonesia dalam wadah tampah bambu rajutan tangan untuk perjamuan istimewa Anda.', price:200000, container:'Tampah Bambu Ø40cm', size:'Perjamuan (8-10 Orang)', sambal:'Original & Mete (4 Cup)', buah:['Shine Muscat Premium','Jambu Kristal Vault','Mangga Pilihan Utama','Nanas Hutan Subang','Bengkoang Garing','Jambu Air Rose','Kedondong Pilihan','Ubi Ungu Manis'], defaultSpice:3, thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp' }
  ];

  const DISTRICT_MAP = { 'bekasi barat':5, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11, 'rawalumbu':8, 'jatiasih':12, 'pondokgede':14, 'cikarang':23, 'tambun':16, 'cibitung':20, 'gambir':18, 'menteng':19, 'tebet':20, 'pancoran':21, 'pasar minggu':22, 'kebayoran lama':24, 'kebayoran baru':22, 'mampang prapatan':21, 'pulo gadung':16, 'jatinegara':18, 'duren sawit':15, 'kramat jati':19, 'pasar rebo':20, 'cakung':12, 'kembangan':25, 'kelapa gading':27, 'depok':35, 'tangerang':38, 'bogor':50 };

  const state = {
    cart: {}, drafts: {},
    customerName: '', customerPhone: '', customerAddress: '', selectedDistrict: '',
    shippingProvider: 'rujakco', vehicleType: 'motor',
    isPriority: false,
    userDistance: null
  };

  const LOOP_MULTIPLIER = 5; 
  let loopedProducts = [];
  for(let i=0; i<LOOP_MULTIPLIER; i++) { loopedProducts = loopedProducts.concat(PRODUCTS); }

  let checkoutLocked = false, toastTimer = null;

  PRODUCTS.forEach(p => { state.drafts[p.id] = { spice: p.defaultSpice || 3, qty: 1 }; });

  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function escapeHTML(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function showToast(msg) {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
  }

  function getSupabase() {
    if (window.supabase?.createClient) return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.warn('Supabase belum siap');
    return null;
  }

  function applyPersonalization() {
    const name = state.customerName || 'Klien';
    const heroName = document.getElementById('heroNameDisplay');
    if (heroName) heroName.textContent = name;

    if(document.getElementById('customerName')) document.getElementById('customerName').value = name;
    if(document.getElementById('districtInput') && state.selectedDistrict) { document.getElementById('districtInput').value = state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase()); }
    
    const aiWelcome = document.getElementById('aiWelcomeMsg');
    if(aiWelcome) aiWelcome.textContent = `Selamat siang, ${name}. Ada yang dapat kami bantu untuk pesanan Anda?`;
    updateShippingUI();
  }

  function initOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    let savedName = null, savedDistrict = null;
    try {
      savedName = localStorage.getItem('rj_client_name');
      savedDistrict = localStorage.getItem('rj_client_district');
    } catch(e) {}
    
    if (savedName && savedDistrict) {
      state.customerName = savedName; state.selectedDistrict = savedDistrict;
      document.getElementById('onbNewUser').style.display = 'none';
      document.getElementById('onbReturningUser').style.display = 'block';
      document.getElementById('onbWelcomeName').textContent = savedName;
      document.getElementById('onbWelcomeDistrict').textContent = savedDistrict.replace(/\b\w/g, l=>l.toUpperCase());
    } else {
      document.getElementById('onbNewUser').style.display = 'block';
      const step1 = document.getElementById('onbStep1');
      if (step1) step1.classList.add('active');
    }

    const onbName = document.getElementById('onbName'), onbNextBtn = document.getElementById('onbNextBtn'), onbStep1 = document.getElementById('onbStep1'), onbStep2 = document.getElementById('onbStep2'), onbDistrict = document.getElementById('onbDistrict'), onbDropdown = document.getElementById('onbDistrictDropdown'), onbStartBtn = document.getElementById('onbStartBtn');
    
    if(onbNextBtn) onbNextBtn.addEventListener('click', () => {
      const nameVal = onbName.value.trim(); if(!nameVal) { showToast('Mohon isi nama Anda.'); return; }
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
      if(!state.selectedDistrict) { showToast('Silakan pilih kecamatan tujuan.'); return; }
      try { localStorage.setItem('rj_client_name', state.customerName); localStorage.setItem('rj_client_district', state.selectedDistrict); } catch(e){}
      overlay.classList.add('hidden'); setTimeout(() => { overlay.style.display = 'none'; }, 600);
      applyPersonalization(); initScrollReveal();
    });

    document.getElementById('onbEnterBtn')?.addEventListener('click', () => {
      overlay.classList.add('hidden'); setTimeout(() => { overlay.style.display = 'none'; }, 600);
      applyPersonalization(); initScrollReveal();
    });

    document.getElementById('onbResetBtn')?.addEventListener('click', () => {
      try { localStorage.removeItem('rj_client_name'); localStorage.removeItem('rj_client_district'); } catch(e){}
      document.getElementById('onbReturningUser').style.display = 'none';
      document.getElementById('onbNewUser').style.display = 'block';
      const step1 = document.getElementById('onbStep1');
      if (step1) step1.classList.add('active');
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
    if (dist > 50) return { cost: null, label: 'Konfirmasi Pramutamu' };
    if (state.shippingProvider === 'paxel') {
      const large = Math.floor(mainQty/2), med = mainQty%2;
      return { cost: (large*25000)+(med*20000)+((large+med)*3000), label: 'Paxel Premium' };
    } else {
      let cost = dist<=3?8000:dist<=10?8000+(dist-3)*1800:dist<=20?20600+(dist-10)*1600:dist<=30?36600+(dist-20)*1400:50600+(dist-30)*1150;
      if (state.vehicleType === 'mobil') cost = dist<=3?24000:dist<=10?24000+(dist-3)*4500:dist<=20?55500+(dist-10)*4000:95500+(dist-20)*3500;
      if (state.isPriority) cost += 8000;
      return { cost, label: state.vehicleType==='motor'?'Motor':'Mobil' };
    }
  }

  function updateShippingUI() {
    const sum = getCartSummary();
    const dist = state.selectedDistrict ? (DISTRICT_MAP[state.selectedDistrict] || 10) : (state.userDistance || null);
    if (dist !== null) { document.getElementById('shippingSection').style.display = 'block'; }
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
        const itemWidth = track.children[0]?.offsetWidth ? track.children[0].offsetWidth + 20 : 0; 
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
        <span class="hairline"></span>
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
          <span class="hairline"></span>
          <h2>${p.name}</h2>
          <p class="detail-price">${fmt(p.price)}</p>
          <p class="detail-desc">${p.desc}</p>
          
          <div class="action-area">
            <div id="step1_${index}_${p.id}" class="action-step-1">
              <button class="step-1-btn btn-lanjutkan" data-idx="${index}" data-pid="${p.id}">Pilih Sajian Ini</button>
            </div>
            
            <div id="step2_${index}_${p.id}" class="step-2-content">
              <div class="spice-selector">
                <label>
                  <span>Tingkat Pedas</span>
                  <span class="spice-current" id="spiceLabel_${index}_${p.id}">${SPICE_LABELS[state.drafts[p.id].spice]}</span>
                </label>
                <div class="spice-options" id="spice_${index}_${p.id}">
                  ${[1,2,3,4,5].map(i => `<button class="spice-option ${i===(state.drafts[p.id].spice)?'active':''}" data-spice="${i}" data-pid="${p.id}">${i}</button>`).join('')}
                </div>
              </div>
              <div class="detail-actions" style="margin-bottom:0;">
                <div class="qty-minimal">
                  <button class="qty-minus" data-pid="${p.id}">−</button>
                  <span class="qty-num" data-valpid="${p.id}">${state.drafts[p.id].qty}</span>
                  <button class="qty-plus" data-pid="${p.id}">+</button>
                </div>
                <button class="btn-dark add-to-cart-btn" data-pid="${p.id}" data-idx="${index}">Tambahkan ke Keranjang</button>
              </div>
            </div>
          </div>

          <label class="section-label">Komposisi Buah</label>
          <ul class="fruit-list">
            ${p.buah.map(b => `<li>${b}</li>`).join('')}
          </ul>

          <div class="detail-specs">
            <div><span>Wadah</span> <span>${p.container}</span></div>
            <div><span>Porsi</span> <span>${p.size}</span></div>
            <div><span>Sambal</span> <span>${p.sambal}</span></div>
          </div>
          
          <div class="detail-manifesto">
            <h4><i data-lucide="shield-check" class="w-4 h-4 inline" style="margin-bottom:-2px;"></i> Komitmen Kesegaran</h4>
            <p>Kerenyahan adalah prioritas. Kami memotong buah tepat 15 menit sebelum diberangkatkan. Sambal dikemas terpisah.</p>
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
          if(targetItem) {
            track.scrollTo({ left: targetItem.offsetLeft, behavior: 'instant' });
          }
        }
      }, 150);
    });
  }

  function renderCart() {
    const sum = getCartSummary();
    const badges = [document.getElementById('cartBadgeNav')];
    badges.forEach(b => { if(b) { b.textContent = sum.totalQty; b.style.display = sum.totalQty > 0 ? 'flex' : 'none'; }});
  }

  function renderMiniCart() {
    const sum = getCartSummary();
    const list = document.getElementById('miniCartList');
    list.innerHTML = sum.items.length === 0 ? '<p style="text-align:center; color:var(--gray-500); padding:32px 0;">Keranjang Anda kosong.</p>' : sum.items.map(i => `
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

  function updateUI() { try{localStorage.setItem('rj_crt_v7', JSON.stringify(state.cart));}catch(e){} renderCart(); if(document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart(); }

  function openProductPage(globalIndex) {
    const page = document.getElementById('productPage');
    page.style.display = 'flex';
    page.setAttribute('aria-hidden', 'false');
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
    const page = document.getElementById('productPage');
    page.style.display = 'none'; 
    page.setAttribute('aria-hidden', 'true');
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
      activeSlide.style.transition = 'all 0.3s ease';
      if (isPulling === 'down' && dy > 120) { closeProductPage(); } else { activeSlide.style.transform = 'translateY(0)'; }
      setTimeout(() => { if(activeSlide) { activeSlide.style.transition = ''; activeSlide.style.transform = ''; } isPulling = false; activeSlide = null; }, 300);
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
      setTimeout(() => { messages.innerHTML += `<div class="msg-bot" style="margin-bottom:12px;"><span>Pesan Anda telah kami terima. Tim kami akan segera merespons.</span></div>`; messages.scrollTop = messages.scrollHeight; }, 800);
    };
    if(send) send.addEventListener('click', processMsg);
    if(input) input.addEventListener('keydown', e => { if(e.key === 'Enter') processMsg(); });
  }

  function bindEvents() {
    document.getElementById('backFromProduct')?.addEventListener('click', closeProductPage);

    const openCart = () => { 
      const modal = document.getElementById('miniCartModal');
      modal.classList.add('active'); 
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow='hidden'; 
      renderMiniCart(); 
    };
    document.getElementById('navCartBtn')?.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    document.getElementById('miniCartClose')?.addEventListener('click', () => { 
      const modal = document.getElementById('miniCartModal');
      modal.classList.remove('active'); 
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow=''; 
    });

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
        document.querySelectorAll(`[id^="spiceLabel_"][id$="_${pid}"]`).forEach(el => { el.textContent = SPICE_LABELS[val]; });
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
        state.drafts[pid].qty = 1;
        document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = 1);
        updateUI(); showToast('Sajian telah ditambahkan ke keranjang.');
        closeProductPage();
        
        setTimeout(() => {
          const step1 = document.getElementById(`step1_${idx}_${pid}`);
          const step2 = document.getElementById(`step2_${idx}_${pid}`);
          if(step1 && step2) { step1.style.display = 'block'; step2.style.display = 'none'; }
        }, 500);
      }

      const act = e.target.closest('[data-action]');
      if(act && !e.target.classList.contains('add-to-cart-btn') && !e.target.classList.contains('btn-lanjutkan')) { 
        const id = act.dataset.id, type = act.dataset.action;
        if(type === 'increase') { state.cart[id].qty++; updateUI(); }
        else if(type === 'decrease') { state.cart[id].qty--; if(state.cart[id].qty<=0) delete state.cart[id]; updateUI(); }
      }

      if(e.target.classList.contains('log-btn')) { document.querySelectorAll('.log-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); state.shippingProvider = e.target.dataset.provider; document.getElementById('rujakcoOptions').style.display = state.shippingProvider === 'paxel' ? 'none' : 'block'; document.getElementById('paxelOptions').style.display = state.shippingProvider === 'paxel' ? 'block' : 'none'; updateShippingUI(); }
      if(e.target.classList.contains('veh-btn')) { document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); state.vehicleType = e.target.dataset.vehicle; updateShippingUI(); }
      if(e.target.id === 'priorityToggleMini') { state.isPriority = e.target.checked; updateShippingUI(); }

      if(e.target.id === 'btnOpenPayment') {
        const name = document.getElementById('customerName')?.value.trim(), phone = document.getElementById('customerPhone')?.value.trim(), address = document.getElementById('customerAddress')?.value.trim();
        if(!name || !phone || !address || (!state.selectedDistrict && !state.userDistance)) { showToast('Mohon lengkapi data penerima.'); return; }
        state.customerPhone = escapeHTML(phone); state.customerAddress = escapeHTML(address); 
        document.getElementById('paymentTotalDisplay').textContent = document.getElementById('finalTotal').textContent;
        const pModal = document.getElementById('paymentModal');
        pModal.classList.add('active');
        pModal.setAttribute('aria-hidden', 'false');
      }

      if(e.target.id === 'paymentClose') { 
        const pModal = document.getElementById('paymentModal');
        pModal.classList.remove('active'); 
        pModal.setAttribute('aria-hidden', 'true');
      }
      
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
        
        const client = getSupabase();
        if(client) {
          client.from('orders').insert([{ order_id: orderId, customer_name: state.customerName, customer_phone: state.customerPhone, customer_address: state.customerAddress, items: sum.items, total: sum.subtotal + (ship.cost || 0), status: 'pending' }]).then(({error}) => { if (error) console.error(error); });
        }

        setTimeout(() => {
          checkoutLocked = false;
          window.open('https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
          state.cart = {}; updateUI(); 
          document.getElementById('paymentModal').classList.remove('active');
          document.getElementById('miniCartModal').classList.remove('active'); document.body.style.overflow='';
        }, 500);
      }

      if(e.target.closest('#aiChatToggle')) { 
        e.preventDefault(); 
        const cModal = document.getElementById('aiChatBox');
        cModal.classList.add('active'); 
        cModal.setAttribute('aria-hidden', 'false');
      }
      if(e.target.id === 'aiChatClose') { 
        const cModal = document.getElementById('aiChatBox');
        cModal.classList.remove('active'); 
        cModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  window.addEventListener('beforeunload', function (e) {
    const hasCart = Object.keys(state.cart).length > 0;
    if (hasCart) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  function init() {
    try { const s = localStorage.getItem('rj_crt_v7'); if(s) state.cart = JSON.parse(s); } catch(e){}
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
