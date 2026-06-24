(function() {
  'use strict';

  // === SUPABASE CONFIG (UPDATED) ===
  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";

  let supabase = null;
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('Supabase client tidak tersedia.');
  }

  // ===== DATA PRODUK =====
  const PRODUCTS = [
    {
      id: 'p_m1', name: 'Rujak Segar',
      desc: 'Kombinasi buah pilihan dengan sambal original Rujak.Co. Ringan, segar, dan cocok untuk semua penikmat rujak.',
      price: 28000, cat: 'classic', tags: ['Pilihan Klasik', '5 Buah'], badge: null, badgeColor: null,
      container: 'Thinwall 750ml (PP Food Grade)', size: 'Porsi Reguler', sambal: 'Sambal Original (1 Cup)',
      buah: ['Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'],
      flavor: 'Segar & Autentik', flavorTag: null, defaultSpice: 3, portion: '1 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp'
    },
    {
      id: 'p_m2', name: 'Rujak Serut',
      desc: 'Buah diserut halus untuk pengalaman rasa yang lebih menyatu di setiap suapan.',
      price: 26000, cat: 'classic', tags: ['Renyah', 'Serut'], badge: null, badgeColor: null,
      container: 'Thinwall 750ml (PP Food Grade)', size: 'Porsi Reguler', sambal: 'Sambal Original (1 Cup)',
      buah: ['Mangga Muda', 'Bengkoang', 'Nanas', 'Ubi Merah'],
      flavor: 'Renyah Segar', flavorTag: 'Renyah', defaultSpice: 3, portion: '1 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp'
    },
    {
      id: 'p_m3', name: 'Rujak Gaco',
      desc: 'Enam buah pilihan dengan sambal mete premium yang kaya rasa dan menjadi favorit pelanggan.',
      price: 40000, cat: 'signature', tags: ['Mete Premium', 'Bestseller'], badge: 'Koleksi Favorit', badgeColor: 'red',
      container: 'Thinwall 750ml (PP Food Grade)', size: 'Porsi Reguler', sambal: 'Sambal Mete Premium (1 Cup)',
      buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'],
      flavor: 'Gurih Mete Premium', flavorTag: null, defaultSpice: 3, portion: '1 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp'
    },
    {
      id: 'p_m4', name: 'Rujak Rama',
      desc: 'Porsi melimpah untuk dua hingga tiga orang dengan cita rasa khas Rujak.Co.',
      price: 48000, cat: 'signature', tags: ['Porsi Besar', 'Sharing'], badge: 'Untuk Dibagi Bersama', badgeColor: 'red',
      container: 'Thinwall Jumbo 1000ml (PP Food Grade)', size: 'Porsi Sharing', sambal: 'Sambal Mete Premium (2 Cup)',
      buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'],
      flavor: 'Gurih Mete Extra Pedas', flavorTag: null, defaultSpice: 4, portion: '2-3 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp'
    },
    {
      id: 'p_m5', name: 'Rujak Mahkota',
      desc: 'Koleksi premium dengan Shine Muscat dan buah pilihan terbaik untuk momen istimewa.',
      price: 85000, cat: 'reserve', tags: ['Eksklusif', 'Shine Muscat'], badge: 'Reserve Collection', badgeColor: 'gold',
      container: 'Thinwall Jumbo 1000ml + Paper Bag', size: 'Porsi Premium', sambal: 'Sambal Mete Premium (2 Cup)',
      buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'],
      flavor: 'Eksklusif & Premium', flavorTag: null, defaultSpice: 3, portion: '1-2 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp'
    },
    {
      id: 'p_m6', name: 'Tampah Nusantara',
      desc: 'Sajian kebersamaan dalam tampah bambu dengan koleksi buah pilihan dan sambal khas Rujak.Co.',
      price: 200000, cat: 'reserve', tags: ['Tampah', 'Pre-Order'], badge: 'Untuk 8-10 Orang', badgeColor: 'gold',
      container: 'Tampah Bambu Ø40cm + Kardus + Wrap', size: 'Porsi Besar', sambal: 'Varian Original & Mete (4 Cup)',
      buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong', 'Ubi Merah'],
      flavor: 'Kemegahan Berbagai Rasa', flavorTag: null, defaultSpice: 3, portion: '8-10 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp'
    }
  ];

  const VIP_PRODUCT = {
    id: 'p_vip',
    name: 'Mahkota VIP',
    desc: 'Menu rahasia eksklusif dengan komposisi premium dan sambal spesial. Hanya untuk yang tahu.',
    price: 125000,
    cat: 'reserve',
    tags: ['Eksklusif', 'VIP Only'],
    badge: 'Menu Rahasia',
    badgeColor: 'gold',
    container: 'Box Premium + Paper Bag',
    size: 'Porsi Eksklusif',
    sambal: 'Sambal Mete Premium Spesial (2 Cup)',
    buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Harum Manis', 'Nanas Madu', 'Bengkoang', 'Strawberry'],
    flavor: 'Premium & Misterius',
    flavorTag: 'Limited',
    defaultSpice: 2,
    portion: '1-2 Orang',
    thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp',
    image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp'
  };

  const ADDONS = [
    { id: 'a_sambal1', name: 'Sambal Original', price: 8000, icon: 'flame', iconColor: 'text-red-500', desc: 'Warisan rasa klasik.' },
    { id: 'a_sambal2', name: 'Sambal Mete Premium', price: 12000, icon: 'flame', iconColor: 'text-red-600', desc: 'Lebih gurih dan kaya rasa.' },
    { id: 'a_extra_jambu', name: 'Extra Jambu Kristal', price: 10000, icon: 'apple', iconColor: 'text-green-500', desc: 'Tambahan jambu kristal segar' },
    { id: 'a_extra_muscat', name: 'Extra Shine Muscat', price: 15000, icon: 'grape', iconColor: 'text-purple-500', desc: 'Tambahan anggur Shine Muscat impor' }
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
    hasShared: false
  };

  // ===== FUNGSI UTILITY =====
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

  // ===== FUNGSI DISKON MISI JAJAN =====
  function calculateDiscount(subtotal) {
    let discount = 0;
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) discount += 5000;
    if (state.hasShared) discount += 5000;
    return discount;
  }

  // ===== FUNGSI ONGKIR (LOGIKA BARU) =====
  function calculateShipping(d, priority) {
    const rawDistance = (d === null || d === undefined || isNaN(d)) ? SYSTEM.DEFAULT_DISTANCE : d;
    const dist = rawDistance * 1.3; // koreksi rute darat
    const rounded = Math.ceil(dist);

    if (rounded > SYSTEM.MAX_DISTANCE) {
      return { cost: Infinity, label: 'Luar jangkauan', distance: rawDistance };
    }

    let base, perKm, label;
    if (priority) {
      base = 15000; perKm = 3000; label = 'Prioritas';
    } else {
      base = 10000; perKm = 2000; label = 'Reguler';
    }

    // 3 km pertama sudah termasuk, sisanya dihitung per km
    const extraKm = Math.max(0, rounded - 3);
    const cost = base + extraKm * perKm;

    return {
      cost,
      label: label + ' (' + Math.ceil(rawDistance) + ' km)',
      distance: rawDistance   // tampilkan jarak asli di UI
    };
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

  // ===== RENDER FUNCTIONS =====
  function renderMenu() {
    const container = document.getElementById('menuList');
    const empty = document.getElementById('emptyState');
    const skeleton = document.getElementById('skeletonContainer');
    skeleton.style.display = 'none';
    container.style.display = 'block';

    if (state.activeFilter === 'addon') {
      container.innerHTML = '';
      empty.style.display = 'none';
      return;
    }

    let filtered = PRODUCTS.filter(p => {
      const matchCat = (state.activeFilter === 'all' || p.cat === state.activeFilter);
      const q = state.searchQuery.toLowerCase();
      return matchCat && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    });

    const vipKeyword = 'vip';
    if (state.searchQuery.toLowerCase().includes(vipKeyword)) {
      if (!filtered.some(p => p.id === 'p_vip')) {
        filtered = [VIP_PRODUCT, ...filtered];
      }
    }

    if (!filtered.length) {
      empty.style.display = 'block';
      container.innerHTML = '';
      return;
    }
    empty.style.display = 'none';

    let html = '';
    filtered.forEach(p => {
      let qty = 0;
      let firstCartKey = p.id;
      Object.keys(state.cart).forEach(k => {
        if (k === p.id || k.startsWith(p.id + '_')) {
          qty += state.cart[k].qty;
          if (qty === state.cart[k].qty) firstCartKey = k;
        }
      });

      const control = qty === 0
        ? `<button type="button" class="add-btn" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>`
        : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${firstCartKey}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${firstCartKey}">+</button></div>`;
      
      const badgeRight = p.badge ? `<span class="item-badge-right ${p.badgeColor}">${p.badge}</span>` : '';
      const flavorTag = p.flavorTag ? `<span class="item-flavor-tag">${p.flavorTag}</span>` : '';
      const buahChips = (p.buah || []).slice(0,4).map(b => `<span class="item-buah-chip">${b}</span>`).join('');
      const moreChips = (p.buah || []).length > 4 ? `<span class="item-buah-chip">+${p.buah.length - 4}</span>` : '';

      html += `
        <div class="menu-item" data-id="${p.id}" tabindex="0" role="button" aria-label="Detail ${p.name}">
          <div class="item-img-wrap">
            <img src="${p.thumbnail}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.nextElementSibling.textContent='${p.name.substring(0,20)}'">
            <div class="fallback" style="display:none;">${p.name.substring(0,20)}</div>
          </div>
          <div class="item-body">
            <div class="item-name-row"><span class="item-name">${p.name}</span>${badgeRight}</div>
            <div class="item-flavor-row"><span class="item-flavor">${p.flavor}</span>${flavorTag}</div>
            <div class="item-spice">🌶️ Level 1–5</div>
            <p class="item-desc">${p.desc}</p>
            <div class="item-buah-chips">${buahChips}${moreChips}</div>
            <div class="item-footer">
              <div><span class="item-price">${fmt(p.price)}</span><span class="item-portion"> · ${p.portion}</span></div>
              ${control}
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function renderAddons() {
    const container = document.getElementById('addonList');
    const q = state.searchQuery.toLowerCase();
    const filtered = ADDONS.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    let html = '';
    filtered.forEach(a => {
      const entry = state.cart[a.id];
      const qty = entry ? entry.qty : 0;
      const control = qty === 0
        ? `<button type="button" class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>`
        : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      html += `
        <div class="addon-card">
          <div class="addon-icon ${a.iconColor}"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div>
          <div class="addon-name">${a.name}</div>
          <div class="addon-desc">${a.desc}</div>
          <div class="addon-footer"><span class="addon-price">${fmt(a.price)}</span>${control}</div>
        </div>
      `;
    });
    container.innerHTML = html;
    const header = document.getElementById('addonHeader');
    const divider = document.getElementById('addonDivider');
    const show = filtered.length > 0;
    header.style.display = show ? 'flex' : 'none';
    divider.style.display = show ? 'block' : 'none';
  }

  function updateProgressBar(subtotal) {
    const container = document.getElementById('progressContainer');
    const label = document.getElementById('progressLabel');
    const percent = document.getElementById('progressPercent');
    const fill = document.getElementById('progressFill');
    
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) {
      container.style.display = 'none';
      return;
    }
    
    const remaining = SYSTEM.DISCOUNT_THRESHOLD - subtotal;
    const progressPercent = Math.min(100, Math.round((subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
    
    container.style.display = 'block';
    label.textContent = `Tambah ${fmt(remaining)} lagi untuk potongan Rp5.000`;
    percent.textContent = progressPercent + '%';
    fill.style.width = progressPercent + '%';
    fill.style.background = progressPercent >= 80 ? 'var(--green)' : 'var(--red)';
  }

  function updateMissionCheckboxes(subtotal) {
    const missionSpend = document.getElementById('missionSpend');
    const checkShare = document.getElementById('checkShare');
    if (missionSpend) missionSpend.checked = subtotal >= SYSTEM.DISCOUNT_THRESHOLD;
    if (checkShare) checkShare.checked = state.hasShared;
  }

  function renderCart() {
    const keys = Object.keys(state.cart);
    let totalQty = 0, subtotal = 0;
    keys.forEach(id => {
      const entry = state.cart[id];
      const item = getItemById(id);
      if (item && entry) {
        totalQty += entry.qty;
        subtotal += item.price * entry.qty;
      } else {
        delete state.cart[id];
      }
    });
    
    updateProgressBar(subtotal);
    updateMissionCheckboxes(subtotal);
    
    const discount = calculateDiscount(subtotal);
    const bar = document.getElementById('bottom-bar');
    const discountLabel = document.getElementById('discountLabel');
    const totalEl = document.getElementById('cartTotalDisplay');
    const footer = document.querySelector('.footer-brand');

    if (totalQty > 0 && !state.isCartMinimized) {
      bar.classList.add('visible');
      if (footer) footer.style.paddingBottom = '180px';
      document.getElementById('cartPreview').textContent = totalQty + ' item' + (totalQty > 1 ? 's' : '');
      if (discount > 0) {
        discountLabel.style.display = 'inline-block';
        discountLabel.textContent = '-Rp' + discount.toLocaleString('id-ID');
        totalEl.innerHTML = `<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;margin-right:4px;">${fmt(subtotal)}</span>${fmt(subtotal - discount)}`;
      } else {
        discountLabel.style.display = 'none';
        totalEl.textContent = fmt(subtotal);
      }
    } else {
      bar.classList.remove('visible');
      if (footer) footer.style.paddingBottom = '0';
    }
    saveCart();
    updateFloatingButton();
  }

  function renderMiniCart() {
    const list = document.getElementById('miniCartList');
    const shippingRow = document.getElementById('miniCartShipping');
    const shippingAmt = document.getElementById('miniCartShippingAmount');
    const finalTotal = document.getElementById('miniCartFinalTotal');
    const keys = Object.keys(state.cart);
    let subtotal = 0, html = '';

    document.getElementById('orderNotes').value = state.orderNotes;
    document.getElementById('customerName').value = state.customerName;
    document.getElementById('customerPhone').value = state.customerPhone;
    document.getElementById('customerAddress').value = state.customerAddress;
    document.getElementById('giftToggle').checked = state.isGift;
    document.getElementById('giftSender').value = state.giftSender;
    document.getElementById('giftMessage').value = state.giftMessage;
    document.getElementById('giftFields').style.display = state.isGift ? 'block' : 'none';

    if (keys.length === 0) {
      html = '<p style="color:var(--gray-500);text-align:center;padding:20px 0;">Keranjang kosong</p>';
      shippingRow.style.display = 'none';
      finalTotal.textContent = 'Rp0';
    } else {
      keys.forEach(id => {
        const entry = state.cart[id];
        const item = getItemById(id);
        if (!item || !entry) return;
        subtotal += item.price * entry.qty;
        const spiceText = entry.spice ? ' (Level ' + entry.spice + ')' : '';
        html += `
          <div class="mini-cart-item">
            <div class="mini-cart-info">
              <div class="mini-cart-name">${item.name}${spiceText}</div>
              <div class="mini-cart-detail">${fmt(item.price)}</div>
            </div>
            <div class="mini-cart-qty">
              <button data-action="decrease" data-id="${id}">−</button>
              <span>${entry.qty}</span>
              <button data-action="increase" data-id="${id}">+</button>
              <button class="mini-cart-remove" data-action="remove" data-id="${id}">🗑️</button>
            </div>
          </div>
        `;
      });
      const dist = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
      const ship = calculateShipping(dist, state.isPriority);
      const shippingCost = ship.cost === Infinity ? 0 : ship.cost;
      const discount = calculateDiscount(subtotal);
      shippingRow.style.display = 'flex';
      shippingAmt.textContent = 'Ongkir: ' + fmt(shippingCost);
      finalTotal.textContent = fmt(subtotal - discount + shippingCost);
    }
    list.innerHTML = html;

    const btnPay = document.getElementById('btnOpenPayment');
    if (state.userDistance === null) {
      btnPay.disabled = true;
      btnPay.style.opacity = '0.5';
      btnPay.textContent = '⏳ Menghitung Jarak...';
    } else if (state.userDistance > SYSTEM.MAX_DISTANCE) {
      btnPay.disabled = true;
      btnPay.style.opacity = '0.5';
      btnPay.textContent = 'Di luar jangkauan';
    } else if (keys.length === 0) {
      btnPay.disabled = true;
      btnPay.style.opacity = '0.5';
      btnPay.textContent = 'Keranjang kosong';
    } else {
      btnPay.disabled = false;
      btnPay.style.opacity = '1';
      btnPay.textContent = 'Bayar Via QRIS';
    }
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  function renderAll() {
    renderMenu();
    renderAddons();
    renderCart();
    if (document.getElementById('miniCartModal').classList.contains('active')) renderMiniCart();
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  // ===== MODAL PRODUK =====
  const productModal = document.getElementById('productModal');
  let currentProductId = null;
  const SPICE_NAMES = ['Mild', 'Sedang', 'Pedas', 'Extra Pedas', 'Very Hot'];

  function openProductModal(id) {
    const product = id === 'p_vip' ? VIP_PRODUCT : PRODUCTS.find(p => p.id === id);
    if (!product) return;
    currentProductId = id;

    document.getElementById('modalImg').innerHTML = `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.textContent='${product.name.substring(0,20)}';">`;
    const badgeEl = document.getElementById('modalBadge');
    if (product.badge) {
      badgeEl.style.display = 'inline-block';
      badgeEl.textContent = product.badge;
      badgeEl.className = 'modal-badge-eyebrow ' + (product.badgeColor || '');
    } else {
      badgeEl.style.display = 'none';
    }
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
    select.value = defaultVal;
    updateSpiceHighlight(defaultVal);
    select.onchange = function() {
      updateSpiceHighlight(parseInt(this.value, 10));
    };

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  function updateSpiceHighlight(level) {
    document.getElementById('modalSpiceLabel').textContent = level + ' - ' + (SPICE_NAMES[level-1] || 'Pedas');
  }

  function closeProductModal() {
    productModal.classList.remove('active');
    document.body.style.overflow = '';
    currentProductId = null;
  }

  document.getElementById('modalAdd').addEventListener('click', function() {
    const baseId = this.dataset.id;
    if (baseId) {
      const spice = parseInt(document.getElementById('spiceSelect').value, 10) || 3;
      const cartKey = baseId + '_' + spice;
      
      const entry = state.cart[cartKey] || { qty: 0, spice: spice };
      entry.qty += 1;
      entry.spice = spice;
      state.cart[cartKey] = entry;
      
      renderAll();
      showToast('Berhasil ditambahkan ✓');
      closeProductModal();
    }
  });

  // ===== MINI CART =====
  const miniCartModal = document.getElementById('miniCartModal');

  function openMiniCart() {
    renderMiniCart();
    miniCartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMiniCart() {
    state.orderNotes = document.getElementById('orderNotes').value;
    state.customerName = document.getElementById('customerName').value.trim();
    state.customerPhone = document.getElementById('customerPhone').value.trim();
    state.customerAddress = document.getElementById('customerAddress').value.trim();
    state.isGift = document.getElementById('giftToggle').checked;
    state.giftSender = document.getElementById('giftSender').value.trim();
    state.giftMessage = document.getElementById('giftMessage').value.trim();
    miniCartModal.classList.remove('active');
    document.body.style.overflow = '';
    saveCustomerData();
  }

  function clearCart() {
    if (Object.keys(state.cart).length === 0) return showToast('Keranjang sudah kosong');
    if (confirm('Yakin ingin mengosongkan keranjang?')) {
        state.cart = {};
        renderAll();
        if (miniCartModal.classList.contains('active')) renderMiniCart();
        showToast('Keranjang dikosongkan');
    }
  }

  // ===== SAVE TO SUPABASE =====
  async function saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount) {
    if (!supabase) return false;
    try {
      const payload = {
        customer_name: state.customerName || 'Guest',
        customer_phone: state.customerPhone || '',
        customer_address: state.customerAddress || '',
        items: orderItems,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        discount: discount,
        total: total,
        status: 'pending',
        is_gift: state.isGift,
        gift_sender: state.giftSender || null,
        gift_message: state.giftMessage || null,
        mission_shared: state.hasShared
      };
      const { error } = await supabase.from('orders').insert([payload]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase error:', err);
      return false;
    }
  }

  // ===== HANDLE CHECKOUT =====
  function handleCheckout() {
    if (state.userDistance !== null && state.userDistance > SYSTEM.MAX_DISTANCE) {
      showToast('Maaf, pengiriman hanya tersedia untuk Jabodetabek');
      return;
    }

    const name = state.customerName.trim();
    const phone = state.customerPhone.trim();
    const address = state.customerAddress.trim();

    if (!name || name.length < 2) return showToast('❌ Nama penerima tidak valid'), document.getElementById('customerName').focus();
    if (!phone || phone.length < 8) return showToast('❌ Nomor HP tidak valid'), document.getElementById('customerPhone').focus();
    if (!address || address.length < 5) return showToast('❌ Alamat pengiriman tidak valid'), document.getElementById('customerAddress').focus();

    const keys = Object.keys(state.cart);
    if (keys.length === 0) return showToast('Keranjang kosong');

    let subtotal = 0;
    const orderItems = [];
    keys.forEach(id => {
      const entry = state.cart[id];
      const item = getItemById(id);
      if (item && entry) {
        subtotal += item.price * entry.qty;
        orderItems.push({ product_id: id, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice || null });
      }
    });

    const dist = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
    const ship = calculateShipping(dist, state.isPriority);
    const shippingCost = ship.cost === Infinity ? 0 : ship.cost;
    const discount = calculateDiscount(subtotal);
    const total = subtotal - discount + shippingCost;

    const payBtn = document.querySelector('[data-action="confirm-wa"]');
    if (payBtn) payBtn.textContent = '⏳ Menyimpan...';

    saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount)
      .finally(() => {
        let msg = 'Halo Rujak.Co! Saya ingin memesan:\n\n';
        keys.forEach(id => {
          const entry = state.cart[id];
          const item = getItemById(id);
          if (item && entry) {
            const spiceText = entry.spice ? ' (Level ' + entry.spice + ')' : '';
            msg += '• ' + item.name + spiceText + ' (x' + entry.qty + ') — ' + fmt(item.price * entry.qty) + '\n';
          }
        });

        if (state.orderNotes) msg += '\n*Catatan Pesanan:*\n' + state.orderNotes + '\n';
        if (state.isGift) {
          msg += '\n🎁 *PESANAN KADO*\n';
          if (state.giftSender) msg += 'Dari: ' + state.giftSender + '\n';
          if (state.giftMessage) msg += 'Ucapan: ' + state.giftMessage + '\n';
        }

        msg += '\n*Data Pengiriman:*\nNama : ' + name + '\nNo. HP : ' + phone + '\nAlamat : ' + address + '\n';
        msg += '\nOngkir: ' + fmt(shippingCost) + ' (' + ship.label + ')';
        msg += '\nSubtotal: ' + fmt(subtotal);
        if (discount > 0) msg += '\nDiskon Misi Jajan: -' + fmt(discount);
        msg += '\n*Total Akhir: ' + fmt(total) + '*\n\n';
        msg += '*Saya sudah transfer via QRIS, ini bukti transfernya:*\n*(sertakan foto)*';

        window.location.href = 'https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg);
        
        setTimeout(() => { if (payBtn) payBtn.innerHTML = '<i data-lucide="message-circle" class="w-5 h-5"></i> Kirim Bukti Transfer'; lucide.createIcons(); }, 2000);
      });
  }

  // ===== SIMPAN DATA PELANGGAN =====
  function saveCustomerData() {
    try {
      localStorage.setItem('rujak_customer', JSON.stringify({
        name: state.customerName, phone: state.customerPhone, address: state.customerAddress,
        isGift: state.isGift, giftSender: state.giftSender, giftMessage: state.giftMessage,
        hasShared: state.hasShared
      }));
    } catch (_) {}
  }

  function loadCustomerData() {
    try {
      const raw = localStorage.getItem('rujak_customer');
      if (raw) {
        const data = JSON.parse(raw);
        state.customerName = data.name || ''; state.customerPhone = data.phone || '';
        state.customerAddress = data.address || ''; state.isGift = data.isGift || false;
        state.giftSender = data.giftSender || ''; state.giftMessage = data.giftMessage || '';
        state.hasShared = data.hasShared || false;
      }
    } catch (_) {}
  }

  // ===== TOAST =====
  let toastTimer;
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), SYSTEM.TOAST_DURATION);
  }

  // ===== FLOATING BUTTON =====
  function updateFloatingButton() {
    const btn = document.getElementById('floatingCartBtn');
    const badge = document.getElementById('floatingBadge');
    let totalQty = 0;
    Object.keys(state.cart).forEach(id => { if (state.cart[id]) totalQty += state.cart[id].qty; });
    if (state.isCartMinimized && totalQty > 0) {
      btn.classList.add('visible'); badge.textContent = totalQty;
    } else {
      btn.classList.remove('visible');
    }
  }

  function minimizeCart() {
    state.isCartMinimized = true;
    localStorage.setItem('rujak_cart_minimized', 'true');
    document.getElementById('bottom-bar').classList.remove('visible');
    updateFloatingButton();
    const footer = document.querySelector('.footer-brand');
    if (footer) footer.style.paddingBottom = '0';
  }

  function expandCart() {
    state.isCartMinimized = false;
    localStorage.setItem('rujak_cart_minimized', 'false');
    updateFloatingButton();
    renderCart();
  }

  function handlePriorityToggle(checked) {
    state.isPriority = checked;
    document.getElementById('priorityToggle').checked = checked;
    document.getElementById('priorityToggleMini').checked = checked;
    if (state.userDistance !== null) updateShippingUI(state.userDistance, checked);
  }

  // ===== STORE STATUS (SELALU BUKA) =====
  function updateStoreStatus() {
    const statusEl = document.getElementById('storeStatus');
    const statusText = document.getElementById('storeStatusText');
    if (statusEl) statusEl.classList.remove('closed');
    if (statusText) statusText.textContent = 'Buka';
  }

  function shareToWhatsApp() {
    const text = 'Hai! Cobain Rujak.Co yuk — rujak premium dengan buah segar pilihan dan sambal khas Indonesia. Lihat menu dan pesan langsung di sini:\n' + window.location.href;
    window.location.href = 'https://wa.me/?text=' + encodeURIComponent(text);
  }

  // ===== MODAL MISI JAJAN =====
  const promoModal = document.getElementById('promoModal');
  function openPromoModal() {
    const subtotal = Object.values(state.cart).reduce((sum, entry) => {
      const item = getItemById(Object.keys(state.cart).find(k => state.cart[k] === entry) || '');
      return sum + (item ? item.price * entry.qty : 0);
    }, 0);
    updateMissionCheckboxes(subtotal);
    promoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closePromoModal() {
    promoModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ===== INIT =====
  function init() {
    loadCart(); loadCustomerData(); updateStoreStatus();

    // Sembunyikan strip "Ajak Teman Jajan"
    const shareStrip = document.getElementById('shareStrip');
    if (shareStrip) shareStrip.style.display = 'none';

    try { const saved = localStorage.getItem('rujak_cart_minimized'); if (saved !== null) state.isCartMinimized = saved === 'true'; } catch (_) {}

    document.getElementById('customerName').value = state.customerName;
    document.getElementById('customerPhone').value = state.customerPhone;
    document.getElementById('customerAddress').value = state.customerAddress;
    document.getElementById('giftToggle').checked = state.isGift;
    document.getElementById('giftSender').value = state.giftSender;
    document.getElementById('giftMessage').value = state.giftMessage;
    document.getElementById('giftFields').style.display = state.isGift ? 'block' : 'none';

    renderAll(); detectLocation(); updateClearButton(); updateFloatingButton();

    // Search toggle logic (di samping "Koleksi Rasa")
    const searchToggleWrap = document.getElementById('searchToggleWrap');
    const searchIconBtn = document.getElementById('searchIconBtn');
    const searchInputWrap = document.getElementById('searchInputWrap');
    const searchInput = document.getElementById('searchInput');

    if (searchIconBtn) {
      searchIconBtn.addEventListener('click', () => {
        searchInputWrap.classList.toggle('open');
        if (searchInputWrap.classList.contains('open')) {
          searchInput.focus();
        }
      });
      document.addEventListener('click', (e) => {
        if (!searchToggleWrap.contains(e.target)) {
          searchInputWrap.classList.remove('open');
        }
      });
    }

    ['customerName', 'customerPhone', 'customerAddress', 'giftSender', 'giftMessage'].forEach(id => {
      document.getElementById(id).addEventListener('input', function() { state[id] = this.value.trim(); saveCustomerData(); });
    });
    document.getElementById('orderNotes').addEventListener('input', function() { state.orderNotes = this.value; });
    document.getElementById('giftToggle').addEventListener('change', function() {
      state.isGift = this.checked; document.getElementById('giftFields').style.display = this.checked ? 'block' : 'none'; saveCustomerData();
    });

    document.getElementById('btnAutoDetect').addEventListener('click', function() {
      state.useManualDistrict = false; state.selectedDistrict = '';
      this.classList.add('active'); document.getElementById('btnManualDistrict').classList.remove('active');
      document.getElementById('districtSelectWrap').style.display = 'none'; detectLocation();
    });
    document.getElementById('btnManualDistrict').addEventListener('click', function() {
      state.useManualDistrict = true;
      this.classList.add('active'); document.getElementById('btnAutoDetect').classList.remove('active');
      document.getElementById('districtSelectWrap').style.display = 'block';
    });
    document.getElementById('districtSelect').addEventListener('change', function() {
      state.selectedDistrict = this.value; if (state.selectedDistrict) detectLocation();
    });

    document.getElementById('shareBtnModal').addEventListener('click', function() {
      state.hasShared = true;
      saveCustomerData();
      renderAll();
      showToast('Diskon Rp5.000 berhasil diaktifkan!');
      shareToWhatsApp();
    });

    document.getElementById('promoTrigger').addEventListener('click', openPromoModal);
    document.getElementById('promoClose').addEventListener('click', closePromoModal);
    promoModal.addEventListener('click', function(e) { if (e.target === promoModal) closePromoModal(); });

    window.addEventListener('scroll', () => { document.getElementById('header')?.classList.toggle('shadowed', window.scrollY > 4); });

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    else { const int = setInterval(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) { lucide.createIcons(); clearInterval(int); } }, 100); }
  }

  // ===== EVENT LISTENER (DELEGASI) =====
  document.addEventListener('click', function(e) {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const { action, id } = actionBtn.dataset;
      if (action === 'open-modal' && id) return openProductModal(id);
      if (action === 'open-cart') return openMiniCart();
      if (action === 'add-addon' && id) {
        state.cart[id] = state.cart[id] || { qty: 0 }; state.cart[id].qty += 1;
        renderAll(); return showToast('Berhasil ditambahkan ✓');
      }
      if (action === 'increase' && id && state.cart[id]) {
        state.cart[id].qty += 1; renderAll();
        if (miniCartModal.classList.contains('active')) renderMiniCart(); return;
      }
      if (action === 'decrease' && id && state.cart[id]) {
        state.cart[id].qty -= 1; if (state.cart[id].qty <= 0) delete state.cart[id];
        renderAll(); if (miniCartModal.classList.contains('active')) renderMiniCart(); return;
      }
      if (action === 'remove' && id && state.cart[id]) {
        delete state.cart[id]; renderAll();
        if (miniCartModal.classList.contains('active')) renderMiniCart(); return showToast('Item dihapus');
      }
      if (action === 'confirm-wa') return handleCheckout();
      if (action === 'toast') return showToast(actionBtn.dataset.msg);
      if (action === 'share') return shareToWhatsApp();
      if (action === 'open-promo') return openPromoModal();
    }

    if (e.target.closest('#btnOpenPayment')) {
      if (Object.keys(state.cart).length === 0) return showToast('Keranjang kosong');
      if (state.userDistance === null) return showToast('Mohon tunggu, menghitung jarak pengiriman...');
      if (state.userDistance > SYSTEM.MAX_DISTANCE) return showToast('Maaf, pengiriman di luar jangkauan');
      
      document.getElementById('paymentTotalDisplay').textContent = document.getElementById('miniCartFinalTotal').textContent;
      closeMiniCart();
      document.getElementById('paymentModal').classList.add('active');
      document.body.style.overflow = 'hidden';
      return;
    }

    const menuItem = e.target.closest('.menu-item');
    if (menuItem && !e.target.closest('.add-btn') && !e.target.closest('.qty-btn')) return openProductModal(menuItem.dataset.id);

    const catBtn = e.target.closest('.cat-pill');
    if (catBtn && catBtn.dataset.cat) {
      document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      catBtn.classList.add('active'); state.activeFilter = catBtn.dataset.cat; return renderAll();
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
      return showToast('Gambar QRIS sedang diunduh...');
    }
    
    if (e.target.closest('#clearSearchBtn')) {
      document.getElementById('searchInput').value = ''; state.searchQuery = '';
      renderAll(); updateClearButton(); return;
    }
  });

  // === PRIORITY & SEARCH ===
  document.getElementById('priorityToggle').addEventListener('change', function() { handlePriorityToggle(this.checked); });
  document.getElementById('priorityToggleMini').addEventListener('change', function() { handlePriorityToggle(this.checked); });

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  function updateClearButton() { clearSearchBtn.classList.toggle('visible', searchInput.value.length > 0); }

  searchInput.addEventListener('input', debounce(function() { state.searchQuery = this.value; renderAll(); updateClearButton(); }, 300));
  searchInput.addEventListener('keyup', updateClearButton);
  
  // === MISC ===
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (productModal.classList.contains('active')) closeProductModal();
      if (miniCartModal.classList.contains('active')) closeMiniCart();
      if (document.getElementById('paymentModal').classList.contains('active')) { document.getElementById('paymentModal').classList.remove('active'); document.body.style.overflow = ''; }
      if (promoModal.classList.contains('active')) closePromoModal();
    }
  });

  const qrisImg = document.getElementById('qrisImagePayment');
  qrisImg.addEventListener('click', function() { this.classList.toggle('qr-zoomed'); });
  qrisImg.addEventListener('dblclick', function() { this.classList.toggle('qr-zoomed'); });

  document.getElementById('closeBottomBar').addEventListener('click', e => { e.stopPropagation(); minimizeCart(); });
  document.getElementById('floatingCartBtn').addEventListener('click', expandCart);

  // === START ===
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();