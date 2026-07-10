(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO — APPLICATION CORE
  // Premium Boutique Engine — v4.0
  // ============================================================

  // ---- Constants ----
  const SUPABASE_URL = 'https://ghhnnfrmftttptcejizp.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE';
  const WA_NUMBER = '6289677161680';
  const STORE_LAT = -6.2165414;
  const STORE_LNG = 107.0177395;
  const DISCOUNT_THRESHOLD = 100000;
  const DISCOUNT_AMOUNT = 5000;

  // ---- Data ----
  const PRODUCTS = [
    { id: 'p_m1', name: 'Rujak Segar', desc: 'Kurasi klasik lima varietas buah tropis pilihan.', price: 35000, cat: 'classic', container: 'Thinwall 1000ml', size: '1-2 Orang', sambal: 'Original Signature (1 Cup)', defaultSpice: 3, thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp' },
    { id: 'p_m2', name: 'Rujak Serut', desc: 'Buah diserut mikro untuk tekstur premium.', price: 26000, cat: 'classic', container: 'Thinwall 750ml', size: 'Reguler', sambal: 'Original Terbawa', defaultSpice: 3, thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp' },
    { id: 'p_m3', name: 'Rujak Gaco Premium', desc: 'Sajian terlaris dengan sambal mete premium.', price: 40000, cat: 'signature', badge: 'Signature', badgeColor: 'gold', container: 'Thinwall Sealed 1000ml', size: 'Eksklusif', sambal: 'Karamel Mete (1 Cup)', defaultSpice: 3, thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp' },
    { id: 'p_m4', name: 'Rujak Rama Sharing', desc: 'Porsi berlimpah untuk kebersamaan.', price: 48000, cat: 'signature', container: 'Jumbo 1000ml', size: '2-3 Orang', sambal: 'Karamel Mete Duet (2 Cup)', defaultSpice: 4, thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp' },
    { id: 'p_m5', name: 'Mahkota Reserve', desc: 'Shine Muscat impor & kurasi eksklusif.', price: 85000, cat: 'reserve', badge: 'Reserve', badgeColor: 'gold', container: 'Luxury Box + Silk Ribbon', size: 'Vault Single', sambal: 'Grand Reserve (2 Cup)', defaultSpice: 3, thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp' },
    { id: 'p_m6', name: 'Tampah Nusantara', desc: 'Tradisi rasa dalam tampah bambu artisanal.', price: 200000, cat: 'reserve', badge: 'Pre-Order', badgeColor: 'gold', container: 'Tampah Bambu Ø40cm', size: '8-10 Orang', sambal: 'Original & Mete (4 Cup)', defaultSpice: 3, thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp' }
  ];

  const ADDONS = [
    { id: 'a_sambal1', name: 'Saus Original Ekstra', price: 8000 },
    { id: 'a_sambal2', name: 'Saus Karamel Mete Ekstra', price: 12000 },
    { id: 'a_extra_jambu', name: 'Jambu Kristal Tambahan', price: 10000 },
    { id: 'a_extra_muscat', name: 'Shine Muscat Tambahan', price: 15000 }
  ];

  const DISTRICT_MAP = {
    'bekasi barat': 5, 'bekasi timur': 7, 'bekasi selatan': 9, 'bekasi utara': 11,
    'rawalumbu': 8, 'jatiasih': 12, 'pondokgede': 14, 'cikarang': 23, 'tambun': 16,
    'cibitung': 20, 'gambir': 18, 'menteng': 19, 'tebet': 20, 'pancoran': 21,
    'pasar minggu': 22, 'kebayoran lama': 24, 'kebayoran baru': 22, 'mampang prapatan': 21,
    'pulo gadung': 16, 'jatinegara': 18, 'duren sawit': 15, 'kramat jati': 19,
    'pasar rebo': 20, 'cakung': 12, 'kembangan': 25, 'kelapa gading': 27,
    'depok': 35, 'tangerang': 38, 'bogor': 50
  };

  // ---- State Store ----
  const store = {
    cart: {},
    filter: 'all',
    search: '',
    location: null,
    district: null,
    isPriority: false,
    provider: 'rujakco',
    vehicle: 'motor',
    customer: { name: '', phone: '', address: '' },
    deliveryTime: '',
    notes: '',
    detail: { id: null, spice: 3, qty: 1 }
  };

  let cachedSummary = null;
  let toastTimer = null;
  let checkoutLocked = false;

  // ---- Helpers ----
  const fmt = (n) => `Rp${n.toLocaleString('id-ID')}`;
  const escape = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const toast = (msg) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3000);
  };

  const getSupabase = () => {
    if (window.supabase?.createClient) {
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return null;
  };

  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const estimateRoad = (km) => Math.round(km * (km <= 10 ? 1.35 : km <= 20 ? 1.30 : 1.20));

  const getItem = (id) => {
    let item = PRODUCTS.find(p => p.id === id);
    if (item) return item;
    const match = id.match(/^(.+)_spice(\d+)$/);
    if (match) {
      item = PRODUCTS.find(p => p.id === match[1]);
      if (item) return item;
    }
    return ADDONS.find(a => a.id === id) || null;
  };

  // ---- Cart Summary ----
  const getSummary = () => {
    const items = [];
    let subtotal = 0, totalQty = 0, mainQty = 0;
    for (const [id, entry] of Object.entries(store.cart)) {
      const item = getItem(id);
      if (!item || entry.qty <= 0) { delete store.cart[id]; continue; }
      const price = item.price || 0;
      subtotal += price * entry.qty;
      totalQty += entry.qty;
      if (PRODUCTS.some(p => p.id === id.split('_spice')[0])) mainQty += entry.qty;
      items.push({
        cartId: id,
        id,
        name: item.name,
        price,
        qty: entry.qty,
        spice: entry.spice || null,
        lineTotal: price * entry.qty
      });
    }
    const discount = subtotal >= DISCOUNT_THRESHOLD ? DISCOUNT_AMOUNT : 0;
    return { items, totalQty, mainQty, subtotal, discount };
  };

  const getCachedSummary = () => {
    if (!cachedSummary) cachedSummary = getSummary();
    return cachedSummary;
  };
  const invalidateCache = () => {
    cachedSummary = null;
    try { localStorage.setItem('rujak_cart', JSON.stringify(store.cart)); } catch (_) {}
  };

  // ---- Shipping ----
  const calcShipping = (dist, priority, mainQty) => {
    const d = dist || 2;
    if (d > 50) return { cost: null, label: 'Di luar jangkauan' };
    if (store.provider === 'paxel') {
      const large = Math.floor(mainQty / 2);
      const med = mainQty % 2;
      return { cost: large * 25000 + med * 20000 + (large + med) * 3000, label: 'Paxel Same Day' };
    }
    let cost = d <= 3 ? 8000 : d <= 10 ? 8000 + (d-3)*1800 : d <= 20 ? 20600 + (d-10)*1600 : d <= 30 ? 36600 + (d-20)*1400 : 50600 + (d-30)*1150;
    if (store.vehicle === 'mobil') cost = d <= 3 ? 24000 : d <= 10 ? 24000 + (d-3)*4500 : d <= 20 ? 55500 + (d-10)*4000 : 95500 + (d-20)*3500;
    if (priority) cost += 8000;
    return { cost, label: store.vehicle === 'motor' ? 'Kurir Instan' : 'Secure Vault' };
  };

  // ---- Render Functions ----
  const renderProducts = () => {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    let items = store.filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === store.filter);
    if (store.search.length >= 2) {
      items = items.filter(p => p.name.toLowerCase().includes(store.search.toLowerCase()));
    }
    if (items.length === 0) {
      grid.innerHTML = `<p class="empty-state">Tidak ada sajian dalam kurasi ini.</p>`;
      return;
    }
    grid.innerHTML = items.map(p => {
      let qty = 0, firstKey = p.id + '_spice3';
      for (const [k, v] of Object.entries(store.cart)) {
        if (k.startsWith(p.id)) { qty += v.qty; firstKey = k; }
      }
      const badge = p.badge ? `<span class="product-card__badge ${p.badgeColor}">${p.badge}</span>` : '';
      const controls = qty === 0
        ? `<button class="btn-add" data-action="add" data-id="${p.id}">Tambahkan</button>`
        : `<div class="qty-control"><button class="qty-control__btn" data-action="dec" data-id="${firstKey}">−</button><span class="qty-control__number">${qty}</span><button class="qty-control__btn" data-action="inc" data-id="${firstKey}">+</button></div>`;
      return `
        <div class="product-card" data-id="${p.id}">
          <div class="product-card__image"><img src="${p.thumbnail}" alt="" loading="lazy" class="img-cover" /></div>
          <div class="product-card__body">
            <div class="product-card__row"><h3 class="product-card__name">${p.name}</h3>${badge}</div>
            <p class="product-card__desc">${p.desc}</p>
            <div class="product-card__footer"><span class="product-card__price">${fmt(p.price)}</span>${controls}</div>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderAddons = () => {
    const grid = document.getElementById('addonGrid');
    if (!grid) return;
    grid.innerHTML = ADDONS.map(a => {
      const qty = store.cart[a.id]?.qty || 0;
      const controls = qty === 0
        ? `<button class="btn-add" data-action="add" data-id="${a.id}">Tambahkan</button>`
        : `<div class="qty-control"><button class="qty-control__btn" data-action="dec" data-id="${a.id}">−</button><span class="qty-control__number">${qty}</span><button class="qty-control__btn" data-action="inc" data-id="${a.id}">+</button></div>`;
      return `
        <div class="addon-card">
          <div class="addon-card__name">${a.name}</div>
          <div class="addon-card__price">${fmt(a.price)}</div>
          <div style="display:flex;justify-content:flex-end;margin-top:var(--space-2)">${controls}</div>
        </div>
      `;
    }).join('');
  };

  const renderBottomBar = () => {
    const sum = getCachedSummary();
    const bar = document.getElementById('bottomBar');
    if (sum.totalQty === 0) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    document.getElementById('cartCount').textContent = `${sum.totalQty} sajian`;
    document.getElementById('cartTotal').textContent = fmt(sum.subtotal - sum.discount);
    const discLabel = document.getElementById('discountLabel');
    if (discLabel) discLabel.style.display = sum.discount > 0 ? 'inline-block' : 'none';
  };

  const renderMiniCart = () => {
    const sum = getCachedSummary();
    const container = document.getElementById('cartItems');
    if (!container) return;
    if (sum.items.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:var(--space-8)0;">Keranjang kosong.</p>';
    } else {
      container.innerHTML = sum.items.map(i => `
        <div class="cart-item">
          <div class="cart-item__info">
            <div class="cart-item__name">${i.name}${i.spice ? ` (Lv${i.spice})` : ''}</div>
            <div class="cart-item__meta">${fmt(i.price)}</div>
          </div>
          <div class="qty-control">
            <button class="qty-control__btn" data-action="dec" data-id="${i.cartId}">−</button>
            <span class="qty-control__number">${i.qty}</span>
            <button class="qty-control__btn" data-action="inc" data-id="${i.cartId}">+</button>
          </div>
        </div>
      `).join('');
    }
    document.getElementById('cartSubtotal').textContent = fmt(sum.subtotal);
    updateShippingUI();
  };

  const updateShippingUI = () => {
    const sum = getCachedSummary();
    const dist = store.district ? (DISTRICT_MAP[store.district] || estimateRoad(10)) : (store.location || null);
    const shipSec = document.getElementById('shippingSection');
    if (dist !== null && shipSec) shipSec.hidden = false;
    const ship = calcShipping(dist || 2, store.isPriority, sum.mainQty || 1);
    document.getElementById('shippingCost').textContent = ship.cost ? fmt(ship.cost) : '⏳';
    document.getElementById('shippingDistance').textContent = dist ? `~${dist} km` : '';
    const bd = document.getElementById('shippingBreakdown');
    if (bd) bd.innerHTML = `
      <div>Jarak: <strong>${dist || '?'} km</strong></div>
      <div>Layanan: <strong>${ship.label}</strong></div>
      <div style="font-weight:600;color:var(--green);margin-top:var(--space-2)">Ongkir: <strong>${ship.cost ? fmt(ship.cost) : 'Menunggu'}</strong></div>
    `;
    document.getElementById('finalSubtotal').textContent = fmt(sum.subtotal);
    const dr = document.getElementById('discountRow');
    const dd = document.getElementById('finalDiscount');
    if (dr && dd) {
      dr.hidden = sum.discount === 0;
      dd.textContent = `-${fmt(sum.discount)}`;
    }
    document.getElementById('finalShipping').textContent = ship.cost ? fmt(ship.cost) : 'Rp0';
    document.getElementById('finalTotal').textContent = ship.cost ? fmt(sum.subtotal - sum.discount + ship.cost) : 'Menunggu';
  };

  const renderAll = () => {
    invalidateCache();
    renderProducts();
    renderAddons();
    renderBottomBar();
    if (document.getElementById('cartModal') && !document.getElementById('cartModal').hidden) {
      renderMiniCart();
    }
  };

  // ---- Product Detail ----
  const openDetail = (id) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const img = document.getElementById('detailImage');
    img.innerHTML = `<img src="${p.image}" alt="${p.name}" class="img-cover" />`;
    document.getElementById('detailName').textContent = p.name;
    document.getElementById('detailDesc').textContent = p.desc;
    document.getElementById('detailContainer').textContent = p.container;
    document.getElementById('detailSize').textContent = p.size;
    document.getElementById('detailSambal').textContent = p.sambal;
    document.getElementById('detailPrice').textContent = fmt(p.price);
    const badge = document.getElementById('detailBadge');
    if (p.badge) {
      badge.textContent = p.badge;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }

    const spiceSel = document.getElementById('spiceSelector');
    spiceSel.innerHTML = [1,2,3,4,5].map(i => `
      <button class="${i === (p.defaultSpice || 3) ? 'is-active' : ''}" data-spice="${i}">${i}</button>
    `).join('');
    store.detail = { id, spice: p.defaultSpice || 3, qty: 1 };
    document.getElementById('detailQty').textContent = '1';

    document.getElementById('productDetail').hidden = false;
    document.getElementById('mainContent').style.display = 'none';
    window.history.pushState({ product: id }, '', `?product=${id}`);
  };

  const closeDetail = () => {
    document.getElementById('productDetail').hidden = true;
    document.getElementById('mainContent').style.display = 'block';
    if (window.history.state && window.history.state.product) window.history.back();
    else window.history.replaceState(null, '', window.location.pathname);
  };

  // ---- Event Delegation ----
  const setupEvents = () => {
    document.addEventListener('click', (e) => {
      // Product card -> open detail
      const card = e.target.closest('.product-card');
      if (card && !e.target.closest('.btn-add') && !e.target.closest('.qty-control')) {
        openDetail(card.dataset.id);
        return;
      }

      // Action buttons: add, inc, dec
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'add') {
          const item = getItem(id);
          if (item) {
            const key = PRODUCTS.some(p => p.id === id) ? `${id}_spice${store.detail.spice || 3}` : id;
            if (!store.cart[key]) store.cart[key] = { qty: 0, spice: store.detail.spice || null };
            store.cart[key].qty = (store.cart[key].qty || 0) + 1;
            renderAll();
            toast('✅ Ditambahkan ke keranjang.');
          }
        } else if (action === 'inc') {
          if (store.cart[id]) { store.cart[id].qty++; renderAll(); }
        } else if (action === 'dec') {
          if (store.cart[id]) {
            store.cart[id].qty--;
            if (store.cart[id].qty <= 0) delete store.cart[id];
            renderAll();
          }
        } else if (action === 'confirm-wa') {
          handleConfirmWa();
        }
        return;
      }

      // Category filter
      const pill = e.target.closest('.category-nav__pill');
      if (pill) {
        document.querySelectorAll('.category-nav__pill').forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        store.filter = pill.dataset.category;
        renderAll();
        return;
      }

      // Bottom bar summary -> open cart modal
      if (e.target.closest('#cartSummary') || e.target.closest('#checkoutTrigger')) {
        openCartModal();
        return;
      }

      // Close modal via overlay
      if (e.target.closest('.modal') && !e.target.closest('.modal__sheet')) {
        closeCartModal();
        return;
      }

      // Shipping provider & vehicle
      const shipOpt = e.target.closest('.shipping-option');
      if (shipOpt) {
        document.querySelectorAll('.shipping-option').forEach(b => b.classList.remove('is-active'));
        shipOpt.classList.add('is-active');
        store.provider = shipOpt.dataset.provider;
        updateShippingUI();
        return;
      }
      const vehOpt = e.target.closest('.vehicle-option');
      if (vehOpt) {
        document.querySelectorAll('.vehicle-option').forEach(b => b.classList.remove('is-active'));
        vehOpt.classList.add('is-active');
        store.vehicle = vehOpt.dataset.vehicle;
        updateShippingUI();
        return;
      }

      // Priority toggle
      if (e.target.id === 'priorityToggle') {
        store.isPriority = e.target.checked;
        updateShippingUI();
        return;
      }

      // Detail back
      if (e.target.closest('#detailBack')) {
        closeDetail();
        return;
      }

      // Detail add
      if (e.target.closest('#detailAdd')) {
        const { id, spice, qty } = store.detail;
        const key = `${id}_spice${spice}`;
        if (!store.cart[key]) store.cart[key] = { qty: 0, spice };
        store.cart[key].qty += qty;
        renderAll();
        toast('✅ Sajian ditambahkan.');
        setTimeout(closeDetail, 400);
        return;
      }

      // Spice selector
      const spiceBtn = e.target.closest('#spiceSelector button');
      if (spiceBtn) {
        document.querySelectorAll('#spiceSelector button').forEach(b => b.classList.remove('is-active'));
        spiceBtn.classList.add('is-active');
        store.detail.spice = parseInt(spiceBtn.dataset.spice);
        return;
      }

      // Qty controls in detail
      if (e.target.closest('#detailQtyMinus')) {
        if (store.detail.qty > 1) store.detail.qty--;
        document.getElementById('detailQty').textContent = store.detail.qty;
        return;
      }
      if (e.target.closest('#detailQtyPlus')) {
        store.detail.qty++;
        document.getElementById('detailQty').textContent = store.detail.qty;
        return;
      }

      // Payment button
      if (e.target.closest('#paymentBtn')) {
        handlePayment();
        return;
      }

      // Modal close
      if (e.target.closest('#cartModalClose')) { closeCartModal(); return; }
      if (e.target.closest('#paymentModalClose')) { closePaymentModal(); return; }
      if (e.target.closest('#conciergeClose')) { toggleConcierge(false); return; }
    });

    // ---- Input events ----
    document.getElementById('districtInput')?.addEventListener('input', function(e) {
      const val = this.value.toLowerCase();
      const matches = Object.keys(DISTRICT_MAP).filter(k => k.includes(val));
      const dd = document.getElementById('districtDropdown');
      if (matches.length && val.length > 0) {
        dd.hidden = false;
        dd.innerHTML = matches.map(k => `<div data-val="${k}">${k.replace(/\b\w/g, l=>l.toUpperCase())}</div>`).join('');
      } else {
        dd.hidden = true;
      }
    });

    document.getElementById('districtDropdown')?.addEventListener('click', function(e) {
      const div = e.target.closest('[data-val]');
      if (!div) return;
      store.district = div.dataset.val;
      this.hidden = true;
      document.getElementById('districtInput').value = store.district.replace(/\b\w/g, l=>l.toUpperCase());
      updateShippingUI();
    });

    // Delivery time
    const times = ['Pagi (09-11 WIB)', 'Siang (11-13 WIB)', 'Sore (14-17 WIB)'];
    let timeIdx = 0;
    document.getElementById('deliveryTrigger')?.addEventListener('click', function() {
      const label = document.getElementById('deliveryLabel');
      const input = document.getElementById('deliveryTime');
      label.textContent = times[timeIdx];
      input.value = times[timeIdx];
      store.deliveryTime = times[timeIdx];
      timeIdx = (timeIdx + 1) % times.length;
    });

    // GPS
    document.getElementById('gpsTrigger')?.addEventListener('click', function() {
      if (!navigator.geolocation) { toast('GPS tidak tersedia.'); return; }
      toast('Mendeteksi lokasi...');
      navigator.geolocation.getCurrentPosition(pos => {
        const dist = estimateRoad(haversine(STORE_LAT, STORE_LNG, pos.coords.latitude, pos.coords.longitude));
        store.location = dist;
        store.district = null;
        document.getElementById('districtInput').value = '📍 GPS Terdeteksi';
        updateShippingUI();
        toast('✅ Lokasi diperbarui.');
      }, () => { toast('Akses lokasi ditolak. Masukkan manual.'); }, { timeout: 8000 });
    });

    // Search toggle
    document.getElementById('searchToggle')?.addEventListener('click', function() {
      const input = document.getElementById('searchInput');
      if (input) {
        const hidden = input.hidden;
        input.hidden = !hidden;
        if (hidden) input.focus();
      }
    });

    document.getElementById('searchInput')?.addEventListener('input', function() {
      store.search = this.value;
      renderProducts();
    });

    // Concierge toggle
    document.getElementById('conciergeToggle')?.addEventListener('click', function(e) {
      e.preventDefault();
      toggleConcierge();
    });

    document.getElementById('conciergeSend')?.addEventListener('click', sendConciergeMessage);
    document.getElementById('conciergeInput')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendConciergeMessage();
    });

    // Copy amount
    document.getElementById('copyAmount')?.addEventListener('click', function() {
      const total = document.getElementById('finalTotal').textContent;
      navigator.clipboard?.writeText(total).then(() => toast('Nominal disalin.')).catch(() => toast('Gagal menyalin.'));
    });

    // History popstate
    window.addEventListener('popstate', closeDetail);

    // Load cart from localStorage
    try {
      const saved = localStorage.getItem('rujak_cart');
      if (saved) store.cart = JSON.parse(saved);
    } catch (_) {}

    renderAll();
  };

  // ---- Concierge ----
  const toggleConcierge = (show) => {
    const box = document.getElementById('conciergeBox');
    if (show !== undefined) {
      box.hidden = !show;
    } else {
      box.hidden = !box.hidden;
    }
    if (!box.hidden) document.getElementById('conciergeInput')?.focus();
  };

  const sendConciergeMessage = () => {
    const input = document.getElementById('conciergeInput');
    const msg = input.value.trim();
    if (!msg) return;
    const container = document.getElementById('conciergeMessages');
    container.innerHTML += `<div class="concierge__bubble user">${escape(msg)}</div>`;
    input.value = '';
    container.scrollTop = container.scrollHeight;
    setTimeout(() => {
      container.innerHTML += `<div class="concierge__bubble bot">Terima kasih. Preferensi Anda telah tercatat. Ada lagi yang bisa saya bantu?</div>`;
      container.scrollTop = container.scrollHeight;
    }, 600);
  };

  // ---- Cart Modal ----
  const openCartModal = () => {
    const modal = document.getElementById('cartModal');
    modal.hidden = false;
    renderMiniCart();
    document.body.style.overflow = 'hidden';
  };

  const closeCartModal = () => {
    document.getElementById('cartModal').hidden = true;
    document.body.style.overflow = '';
  };

  const closePaymentModal = () => {
    document.getElementById('paymentModal').hidden = true;
    document.body.style.overflow = '';
  };

  // ---- Payment ----
  const handlePayment = () => {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const dist = store.district || store.location;
    if (!name || !phone || !address || !dist) {
      toast('Harap lengkapi semua data.');
      return;
    }
    store.customer = { name, phone, address };
    const total = document.getElementById('finalTotal').textContent;
    document.getElementById('paymentTotal').textContent = total;
    document.getElementById('paymentModal').hidden = false;
  };

  // ---- Confirm WA ----
  const handleConfirmWa = () => {
    if (checkoutLocked) return;
    checkoutLocked = true;

    const sum = getCachedSummary();
    const distNum = store.district ? (DISTRICT_MAP[store.district] || 10) : (store.location || 2);
    const ship = calcShipping(distNum, store.isPriority, sum.mainQty || 1);
    const orderId = 'RJ' + Date.now().toString(36).toUpperCase().slice(-6);
    const locLabel = store.district ? `Kec. ${store.district.replace(/\b\w/g, l=>l.toUpperCase())}` : 'GPS';
    const fullAddress = `${store.customer.address}, ${locLabel}`;
    const time = document.getElementById('deliveryTime')?.value || 'Esok Hari';
    const notes = document.getElementById('orderNotes')?.value || '-';

    let msg = `*RESERVASI RUJAK.CO*\nID: #${orderId}\nKlien: ${store.customer.name}\nKontak: ${store.customer.phone}\nAlamat: ${fullAddress}\nWaktu: ${time}\nCatatan: ${notes}\n\n*Kurasi:*\n`;
    sum.items.forEach(i => msg += `• ${i.name} ${i.spice ? `(Lv${i.spice})` : ''} x${i.qty}\n`);
    msg += `\nSubtotal: ${fmt(sum.subtotal)}\nOngkir: ${fmt(ship.cost)}\n*TOTAL: ${fmt(sum.subtotal + ship.cost)}*`;

    // Save to Supabase
    const client = getSupabase();
    if (client) {
      client.from('orders').insert([{
        order_id: orderId,
        customer_name: store.customer.name,
        customer_phone: store.customer.phone,
        customer_address: fullAddress,
        items: sum.items,
        total: sum.subtotal + (ship.cost || 0),
        status: 'pending'
      }]).then(({ error }) => { if (error) console.error(error); });
    }

    setTimeout(() => {
      checkoutLocked = false;
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
      store.cart = {};
      renderAll();
      closePaymentModal();
      closeCartModal();
      toast('✅ Pesanan dikirim.');
    }, 500);
  };

  // ---- Init ----
  const init = () => {
    setupEvents();
    // Update store status
    const now = new Date();
    const hour = now.getHours();
    const statusText = document.getElementById('storeStatusText');
    if (statusText) {
      statusText.textContent = (hour >= 10 && hour < 20) ? 'Buka' : 'Tutup';
    }
    // Initial render
    renderAll();
    // Show toast on load
    setTimeout(() => toast('Selamat datang di Rujak.Co'), 500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();