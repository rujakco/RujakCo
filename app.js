(function() {
  'use strict';

  // === SUPABASE CONFIG ===
  const SUPABASE_URL = "https://xkyduxhjlmvhzdavbbwk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_gBF7LJeRnFwLfmcH9M_DiA_FPLaYgvj";
  let supabase = null;
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  const PRODUCTS = [
    { id: 'p_m1', name: 'Rujak Segar', desc: 'Kombinasi buah pilihan dengan sambal original Rujak.Co. Ringan, segar, dan cocok untuk semua penikmat rujak.', price: 28000, cat: 'classic', tags: ['Pilihan Klasik', '5 Buah'], badge: null, badgeColor: null, container: 'Thinwall 750ml (PP Food Grade)', size: '150g Buah', sambal: 'Sambal Original (80g / 1 Cup)', buah: ['Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Segar & Autentik', flavorTag: null, defaultSpice: 3, portion: '1 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp' },
    { id: 'p_m2', name: 'Rujak Serut', desc: 'Buah diserut halus untuk pengalaman rasa yang lebih menyatu di setiap suapan.', price: 26000, cat: 'classic', tags: ['Renyah', 'Serut'], badge: null, badgeColor: null, container: 'Thinwall 750ml (PP Food Grade)', size: '150g Buah', sambal: 'Sambal Original (80g / 1 Cup)', buah: ['Mangga Muda', 'Bengkoang', 'Nanas', 'Ubi Merah'], flavor: 'Renyah Segar', flavorTag: 'Renyah', defaultSpice: 3, portion: '1 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp' },
    { id: 'p_m3', name: 'Rujak Gaco', desc: 'Enam buah pilihan dengan sambal mete premium yang kaya rasa dan menjadi favorit pelanggan.', price: 40000, cat: 'signature', tags: ['Mete Premium', 'Bestseller'], badge: 'Koleksi Favorit', badgeColor: 'red', container: 'Thinwall 750ml (PP Food Grade)', size: '150g Buah', sambal: 'Sambal Mete Premium (80g / 1 Cup)', buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Gurih Mete Premium', flavorTag: null, defaultSpice: 3, portion: '1 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp' },
    { id: 'p_m4', name: 'Rujak Rama', desc: 'Porsi melimpah untuk dua hingga tiga orang dengan cita rasa khas Rujak.Co.', price: 48000, cat: 'signature', tags: ['Porsi Besar', 'Sharing'], badge: 'Untuk Dibagi Bersama', badgeColor: 'red', container: 'Thinwall Jumbo 1000ml (PP Food Grade)', size: '250g Buah', sambal: 'Sambal Mete Premium (130g / 2 Cup)', buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Gurih Mete Extra Pedas', flavorTag: null, defaultSpice: 4, portion: '2-3 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp' },
    { id: 'p_m5', name: 'Rujak Mahkota', desc: 'Koleksi premium dengan Shine Muscat dan buah pilihan terbaik untuk momen istimewa.', price: 85000, cat: 'reserve', tags: ['Eksklusif', 'Shine Muscat'], badge: 'Reserve Collection', badgeColor: 'gold', container: 'Thinwall Jumbo 1000ml + Paper Bag', size: '165g Buah', sambal: 'Sambal Mete Premium (85g / 2 Cup)', buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Eksklusif & Premium', flavorTag: null, defaultSpice: 3, portion: '1-2 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp' },
    { id: 'p_m6', name: 'Tampah Nusantara', desc: 'Sajian kebersamaan dalam tampah bambu dengan koleksi buah pilihan dan sambal khas Rujak.Co.', price: 200000, cat: 'reserve', tags: ['Tampah', 'Pre-Order'], badge: 'Untuk 8-10 Orang', badgeColor: 'gold', container: 'Tampah Bambu Ø40cm + Kardus + Wrap', size: '400g Buah', sambal: 'Varian Original & Mete (200g / 4 Cup)', buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong', 'Ubi Merah'], flavor: 'Kemegahan Berbagai Rasa', flavorTag: null, defaultSpice: 3, portion: '8-10 Orang', thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp' }
  ];

  const ADDONS = [
    { id: 'a_sambal1', name: 'Sambal Original', price: 8000, icon: 'flame', iconColor: 'text-red-500', desc: 'Warisan rasa klasik.' },
    { id: 'a_sambal2', name: 'Sambal Mete Premium', price: 12000, icon: 'flame', iconColor: 'text-red-600', desc: 'Lebih gurih dan kaya rasa.' },
    { id: 'a_extra_jambu', name: 'Extra Jambu Kristal', price: 10000, icon: 'apple', iconColor: 'text-green-500', desc: 'Tambahan jambu kristal segar' },
    { id: 'a_extra_muscat', name: 'Extra Shine Muscat', price: 15000, icon: 'grape', iconColor: 'text-purple-500', desc: 'Tambahan anggur Shine Muscat impor' }
  ];

  const SYSTEM = { DISCOUNT_THRESHOLD: 100000, DISCOUNT_AMOUNT: 10000, WA_NUMBER: '6289677161680', TOAST_DURATION: 3000, MAX_DISTANCE: 50, DEFAULT_DISTANCE: 2 };
  const state = { cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null, isPriority: false, orderNotes: '', isCartMinimized: false, customerName: '', customerPhone: '', customerAddress: '' };

  function calculateShipping(d, priority) {
    const dist = (d === null || d === undefined || isNaN(d)) ? SYSTEM.DEFAULT_DISTANCE : d;
    const rounded = Math.ceil(dist);
    if (rounded > SYSTEM.MAX_DISTANCE) return { cost: Infinity, label: 'Luar jangkauan', distance: rounded };
    if (rounded <= 3) return { cost: 10000, label: 'Reguler (0-3 km)', distance: rounded };
    let base, perKm, label;
    if (priority) { base = 25000; perKm = 2500; label = 'Prioritas'; }
    else { base = 15000; perKm = 1500; label = 'Reguler'; }
    if (rounded < 10) return { cost: base, label: `${label} (${rounded} km)`, distance: rounded };
    const extra = rounded - 10;
    return { cost: base + (extra * perKm), label: `${label} (${rounded} km)`, distance: rounded };
  }

  function getLocationFallback() {
    return new Promise(resolve => {
      fetch('https://ipapi.co/json/').then(r => r.json()).then(data => {
        const city = data.city || data.region || 'Lokasi';
        let distance = SYSTEM.DEFAULT_DISTANCE;
        const c = city.toLowerCase();
        if (c.includes('bekasi')) distance = 2; else if (c.includes('jakarta')) distance = 15;
        else if (c.includes('depok')) distance = 20; else if (c.includes('tangerang')) distance = 25;
        else if (c.includes('bogor')) distance = 30;
        resolve({ city, distance });
      }).catch(() => resolve({ city: 'Bekasi', distance: 2 }));
    });
  }

  function updateShippingUI(distance, isPriority) {
    const r = calculateShipping(distance, isPriority);
    const out = distance > SYSTEM.MAX_DISTANCE;
    document.getElementById('shippingDistance').textContent = `~${Math.ceil(distance)} km`;
    const costEl = document.getElementById('shippingCost');
    if (out) { costEl.textContent = '❌'; costEl.style.color = 'var(--red)'; document.getElementById('outOfRange').style.display = 'block'; }
    else { costEl.textContent = 'Rp' + r.cost.toLocaleString('id-ID'); costEl.style.color = 'var(--red)'; document.getElementById('outOfRange').style.display = 'none'; }
    if (document.getElementById('miniCartModal').classList.contains('active')) renderMiniCart();
  }

  function detectLocation() {
    const STORE_LAT = -6.2333, STORE_LNG = 107.0;
    document.getElementById('shippingCost').textContent = '⏳';
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        const R = 6371; const dLat = (lat - STORE_LAT) * Math.PI / 180; const dLon = (lng - STORE_LNG) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(STORE_LAT * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLon/2)**2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=id`).then(r => r.json()).then(data => {
          const city = data.address?.city || data.address?.town || data.address?.village || 'Lokasi Anda';
          state.userDistance = distance; document.getElementById('locationDisplay').textContent = city + ' ▾'; updateShippingUI(distance, state.isPriority);
        }).catch(() => { state.userDistance = distance; document.getElementById('locationDisplay').textContent = 'Lokasi Anda ▾'; updateShippingUI(distance, state.isPriority); });
      }, () => getLocationFallback().then(({ city, distance }) => { state.userDistance = distance; document.getElementById('locationDisplay').textContent = city + ' ▾'; updateShippingUI(distance, state.isPriority); }), { enableHighAccuracy: true, timeout: 10000 });
    } else getLocationFallback().then(({ city, distance }) => { state.userDistance = distance; document.getElementById('locationDisplay').textContent = city + ' ▾'; updateShippingUI(distance, state.isPriority); });
  }

  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function loadCart() { try { const s = localStorage.getItem('rujak_cart'); if (s) { const p = JSON.parse(s); if (typeof p === 'object' && p !== null) state.cart = p; } } catch (_) { state.cart = {}; } }
  function saveCart() { try { localStorage.setItem('rujak_cart', JSON.stringify(state.cart)); } catch (_) {} }
  function getItemById(id) { return PRODUCTS.find(p => p.id === id) || ADDONS.find(a => a.id === id); }
  function debounce(fn, delay) { let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); }; }

  function renderMenu() {
    const container = document.getElementById('menuList'), empty = document.getElementById('emptyState'), skeleton = document.getElementById('skeletonContainer');
    skeleton.style.display = 'none'; container.style.display = 'block';
    if (state.activeFilter === 'addon') { container.innerHTML = ''; empty.style.display = 'none'; return; }
    const filtered = PRODUCTS.filter(p => { const matchCat = (state.activeFilter === 'all' || p.cat === state.activeFilter); const q = state.searchQuery.toLowerCase(); return matchCat && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)); });
    if (!filtered.length) { empty.style.display = 'block'; container.innerHTML = ''; return; }
    empty.style.display = 'none';
    let html = '';
    filtered.forEach(p => {
      const entry = state.cart[p.id], qty = entry ? entry.qty : 0;
      const control = qty === 0 ? `<button type="button" class="add-btn" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${p.id}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${p.id}">+</button></div>`;
      const badgeRight = p.badge ? `<span class="item-badge-right ${p.badgeColor}">${p.badge}</span>` : '';
      const flavorTag = p.flavorTag ? `<span class="item-flavor-tag">${p.flavorTag}</span>` : '';
      html += `<div class="menu-item" data-id="${p.id}" tabindex="0" role="button" aria-label="Detail ${p.name}"><div class="item-img-wrap"><img src="${p.thumbnail}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.nextElementSibling.textContent='${p.name.substring(0,20)}'"><div class="fallback" style="display:none;">${p.name.substring(0,20)}</div></div><div class="item-body"><div class="item-name-row"><span class="item-name">${p.name}</span>${badgeRight}</div><div class="item-flavor-row"><span class="item-flavor">${p.flavor}</span>${flavorTag}</div><div class="item-spice">🌶️ Level 1–5</div><p class="item-desc">${p.desc}</p><div class="item-buah-chips">${(p.buah || []).slice(0,4).map(b => `<span class="item-buah-chip">${b}</span>`).join('')}${(p.buah || []).length > 4 ? `<span class="item-buah-chip">+${p.buah.length - 4}</span>` : ''}</div><div class="item-footer"><div><span class="item-price">${fmt(p.price)}</span><span class="item-portion"> · ${p.portion}</span></div>${control}</div></div></div>`;
    });
    container.innerHTML = html;
  }

  function renderAddons() {
    const container = document.getElementById('addonList');
    const q = state.searchQuery.toLowerCase();
    const filtered = ADDONS.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    let html = '';
    filtered.forEach(a => {
      const entry = state.cart[a.id], qty = entry ? entry.qty : 0;
      const control = qty === 0 ? `<button type="button" class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      html += `<div class="addon-card"><div class="addon-icon ${a.iconColor}"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div><div class="addon-name">${a.name}</div><div class="addon-desc">${a.desc}</div><div class="addon-footer"><span class="addon-price">${fmt(a.price)}</span>${control}</div></div>`;
    });
    container.innerHTML = html;
    const header = document.getElementById('addonHeader'), divider = document.getElementById('addonDivider'), show = filtered.length > 0;
    header.style.display = show ? 'flex' : 'none'; divider.style.display = show ? 'block' : 'none';
  }

  function renderCart() {
    const keys = Object.keys(state.cart);
    let totalQty = 0, subtotal = 0;
    keys.forEach(id => { const entry = state.cart[id]; const item = getItemById(id); if (item && entry) { totalQty += entry.qty; subtotal += item.price * entry.qty; } else delete state.cart[id]; });
    const bar = document.getElementById('bottom-bar'), discountLabel = document.getElementById('discountLabel'), totalEl = document.getElementById('cartTotalDisplay'), footer = document.querySelector('.footer-brand');
    if (totalQty > 0 && !state.isCartMinimized) {
      bar.classList.add('visible'); if (footer) footer.style.paddingBottom = '180px';
      document.getElementById('cartPreview').textContent = `${totalQty} item${totalQty>1?'s':''}`;
      if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) { discountLabel.style.display = 'inline-block'; totalEl.innerHTML = `<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;margin-right:4px;">${fmt(subtotal)}</span>${fmt(subtotal - SYSTEM.DISCOUNT_AMOUNT)}`; }
      else { discountLabel.style.display = 'none'; totalEl.textContent = fmt(subtotal); }
    } else { bar.classList.remove('visible'); if (footer) footer.style.paddingBottom = '0'; }
    saveCart(); updateFloatingButton();
  }

  function renderMiniCart() {
    const list = document.getElementById('miniCartList'), shippingRow = document.getElementById('miniCartShipping'), shippingAmt = document.getElementById('miniCartShippingAmount'), finalTotal = document.getElementById('miniCartFinalTotal');
    const keys = Object.keys(state.cart); let subtotal = 0, html = '';
    document.getElementById('orderNotes').value = state.orderNotes;
    document.getElementById('customerName').value = state.customerName;
    document.getElementById('customerPhone').value = state.customerPhone;
    document.getElementById('customerAddress').value = state.customerAddress;
    if (keys.length === 0) { html = '<p style="color:var(--gray-500);text-align:center;padding:20px 0;">Keranjang kosong</p>'; shippingRow.style.display = 'none'; finalTotal.textContent = 'Rp0'; }
    else {
      keys.forEach(id => { const entry = state.cart[id]; const item = getItemById(id); if (!item || !entry) return; subtotal += item.price * entry.qty; const spiceText = entry.spice ? ` (Level ${entry.spice})` : ''; html += `<div class="mini-cart-item"><div class="mini-cart-info"><div class="mini-cart-name">${item.name}${spiceText}</div><div class="mini-cart-detail">${fmt(item.price)}</div></div><div class="mini-cart-qty"><button data-action="decrease" data-id="${id}">−</button><span>${entry.qty}</span><button data-action="increase" data-id="${id}">+</button><button class="mini-cart-remove" data-action="remove" data-id="${id}">🗑️</button></div></div>`; });
      const dist = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
      const ship = calculateShipping(dist, state.isPriority); const shippingCost = ship.cost === Infinity ? 0 : ship.cost;
      const discount = subtotal >= SYSTEM.DISCOUNT_THRESHOLD ? SYSTEM.DISCOUNT_AMOUNT : 0;
      shippingRow.style.display = 'flex'; shippingAmt.textContent = `Ongkir: ${fmt(shippingCost)}`; finalTotal.textContent = fmt(subtotal - discount + shippingCost);
    }
    list.innerHTML = html;
    const btnPay = document.getElementById('btnOpenPayment');
    if (state.userDistance !== null && state.userDistance > SYSTEM.MAX_DISTANCE) { btnPay.disabled = true; btnPay.style.opacity = '0.5'; btnPay.style.pointerEvents = 'none'; btnPay.textContent = 'Di luar jangkauan'; }
    else if (keys.length === 0) { btnPay.disabled = true; btnPay.style.opacity = '0.5'; btnPay.style.pointerEvents = 'none'; btnPay.textContent = 'Keranjang kosong'; }
    else { btnPay.disabled = false; btnPay.style.opacity = '1'; btnPay.style.pointerEvents = 'auto'; btnPay.textContent = 'Bayar Via QRIS'; }
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  function renderAll() { renderMenu(); renderAddons(); renderCart(); if (document.getElementById('miniCartModal').classList.contains('active')) renderMiniCart(); if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons(); }

  const productModal = document.getElementById('productModal'); let currentProductId = null;
  const SPICE_NAMES = ['Mild', 'Sedang', 'Pedas', 'Extra Pedas', 'Very Hot'];
  function openProductModal(id) {
    const product = PRODUCTS.find(p => p.id === id); if (!product) return; currentProductId = id;
    document.getElementById('modalImg').innerHTML = `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.textContent='${product.name.substring(0,20)}';">`;
    const badgeEl = document.getElementById('modalBadge');
    if (product.badge) { badgeEl.style.display = 'inline-block'; badgeEl.textContent = product.badge; badgeEl.className = `modal-badge-eyebrow ${product.badgeColor || ''}`; }
    else badgeEl.style.display = 'none';
    document.getElementById('modalTitle').textContent = product.name; document.getElementById('modalDesc').textContent = product.desc;
    document.getElementById('modalContainer').textContent = product.container || '-'; document.getElementById('modalSize').textContent = product.size || '-';
    document.getElementById('modalSambal').textContent = product.sambal || '-'; document.getElementById('modalBuahText').textContent = (product.buah || []).join(', ');
    document.getElementById('modalTags').innerHTML = (product.tags || []).map(t => `<span class="modal-tag">${t}</span>`).join('');
    document.getElementById('btnPrice').textContent = fmt(product.price); document.getElementById('modalAdd').dataset.id = product.id;
    const select = document.getElementById('spiceSelect'); const defaultVal = product.defaultSpice || 3; select.value = defaultVal;
    updateSpiceHighlight(defaultVal); select.onchange = function() { updateSpiceHighlight(parseInt(this.value, 10)); };
    productModal.classList.add('active'); document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
  function updateSpiceHighlight(level) { document.getElementById('modalSpiceLabel').textContent = `${level} - ${SPICE_NAMES[level-1] || 'Pedas'}`; }
  function closeProductModal() { productModal.classList.remove('active'); document.body.style.overflow = ''; currentProductId = null; }

  const miniCartModal = document.getElementById('miniCartModal');
  function openMiniCart() { renderMiniCart(); miniCartModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeMiniCart() {
    state.orderNotes = document.getElementById('orderNotes').value;
    state.customerName = document.getElementById('customerName').value.trim();
    state.customerPhone = document.getElementById('customerPhone').value.trim();
    state.customerAddress = document.getElementById('customerAddress').value.trim();
    miniCartModal.classList.remove('active'); document.body.style.overflow = '';
  }

  function clearCart() {
    if (Object.keys(state.cart).length === 0) { showToast('Keranjang sudah kosong'); return; }
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active'; modal.style.zIndex = '400';
    modal.innerHTML = `<div class="modal-content" style="max-width:300px; text-align:center; padding:24px;"><p style="margin:0 0 16px; font-weight:600; color:var(--gray-900);">Yakin ingin mengosongkan keranjang?</p><div style="display:flex; gap:8px; justify-content:center;"><button id="confirmClear" style="background:var(--red); color:white; border:none; border-radius:12px; padding:10px 20px; font-weight:700; cursor:pointer;">Ya, Kosongkan</button><button id="cancelClear" style="background:var(--gray-200); color:var(--gray-700); border:none; border-radius:12px; padding:10px 20px; font-weight:700; cursor:pointer;">Batal</button></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('confirmClear').addEventListener('click', () => { state.cart = {}; renderAll(); if (miniCartModal.classList.contains('active')) renderMiniCart(); showToast('Keranjang dikosongkan'); modal.remove(); });
    document.getElementById('cancelClear').addEventListener('click', () => modal.remove());
  }

  function downloadQRIS() {
    const img = document.getElementById('qrisImagePayment'), url = img.src;
    fetch(url).then(r => r.blob()).then(blob => { const blobUrl = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = blobUrl; a.download = 'QRIS-RujakCo.jpg'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(blobUrl); showToast('Gambar QRIS sedang diunduh...'); }).catch(() => { window.open(url, '_blank'); showToast('Klik kanan pada gambar untuk menyimpan'); });
  }

  // ===== FUNGSI SIMPAN KE SUPABASE =====
  async function saveOrderToDatabase(cart, total) {
    if (!supabase) {
      console.log('Supabase client not initialized');
      return;
    }
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: state.customerName || "Guest",
          items: cart,
          total: total,
          status: "pending"
        }
      ]);
    if (error) {
      alert("Gagal simpan order ❌");
      console.log(error);
    } else {
      alert("Order masuk ke database ✅");
    }
  }

  function handleCheckout() {
    if (state.userDistance !== null && state.userDistance > SYSTEM.MAX_DISTANCE) { showToast('Maaf, pengiriman hanya tersedia untuk wilayah Jabodetabek (maks. 50 km)'); return; }
    const keys = Object.keys(state.cart); if (keys.length === 0) { showToast('Keranjang kosong'); return; }
    const notes = state.orderNotes.trim(); let msg = 'Halo Rujak.Co! Saya ingin memesan:\n\n'; let subtotal = 0;
    keys.forEach(id => { const entry = state.cart[id]; const item = getItemById(id); if (item && entry) { const spiceText = entry.spice ? ` (Level ${entry.spice})` : ''; msg += `• ${item.name}${spiceText} (x${entry.qty}) — ${fmt(item.price * entry.qty)}\n`; subtotal += item.price * entry.qty; } });
    const dist = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE; const ship = calculateShipping(dist, state.isPriority); const shippingCost = ship.cost === Infinity ? 0 : ship.cost;
    const discount = subtotal >= SYSTEM.DISCOUNT_THRESHOLD ? SYSTEM.DISCOUNT_AMOUNT : 0;
    const total = subtotal - discount + shippingCost;

    if (notes) msg += `\n*Catatan Pesanan:*\n${notes}\n`;
    if (state.customerName || state.customerPhone || state.customerAddress) {
      msg += `\n*Data Pengiriman:*\n`;
      if (state.customerName) msg += `Nama : ${state.customerName}\n`;
      if (state.customerPhone) msg += `No. HP : ${state.customerPhone}\n`;
      if (state.customerAddress) msg += `Alamat : ${state.customerAddress}\n`;
    }
    msg += `\nOngkir: ${fmt(shippingCost)} (${ship.label})`; msg += `\nSubtotal: ${fmt(subtotal)}`; if (discount > 0) msg += `\nPotongan Khusus: -${fmt(discount)}`;
    msg += `\n*Total Akhir: ${fmt(total)}*\n\n`; msg += `*Saya sudah transfer via QRIS, ini bukti transfernya:*\n*(sertakan foto)*`;

    // Simpan ke database sebelum buka WhatsApp
    saveOrderToDatabase(state.cart, total);

    window.open(`https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  document.addEventListener('click', function(e) {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.action, id = actionBtn.dataset.id;
      if (action === 'open-modal' && id) { openProductModal(id); return; }
      if (action === 'open-cart') { openMiniCart(); return; }
      if (action === 'add-addon' && id) { const entry = state.cart[id] || { qty: 0 }; entry.qty += 1; state.cart[id] = entry; renderAll(); showToast('Berhasil ditambahkan ✓'); return; }
      if ((action === 'add' || action === 'increase') && id) { if (PRODUCTS.some(p => p.id === id)) { openProductModal(id); return; } const entry = state.cart[id] || { qty: 0 }; entry.qty += 1; state.cart[id] = entry; renderAll(); if (action === 'add') showToast('Berhasil ditambahkan ✓'); return; }
      if (action === 'decrease' && id && state.cart[id]) { const entry = state.cart[id]; entry.qty -= 1; if (entry.qty <= 0) delete state.cart[id]; renderAll(); if (miniCartModal.classList.contains('active')) renderMiniCart(); return; }
      if (action === 'remove' && id && state.cart[id]) { delete state.cart[id]; renderAll(); if (miniCartModal.classList.contains('active')) renderMiniCart(); showToast('Item dihapus'); return; }
      if (action === 'confirm-wa') { handleCheckout(); return; }
      if (action === 'toast') { showToast(actionBtn.dataset.msg); return; }
    }
    if (e.target.closest('#btnOpenPayment')) { const keys = Object.keys(state.cart); if (keys.length === 0) return showToast('Keranjang kosong'); if (state.userDistance !== null && state.userDistance > SYSTEM.MAX_DISTANCE) return showToast('Maaf, pengiriman di luar jangkauan'); document.getElementById('paymentTotalDisplay').textContent = document.getElementById('miniCartFinalTotal').textContent; state.orderNotes = document.getElementById('orderNotes').value; state.customerName = document.getElementById('customerName').value.trim(); state.customerPhone = document.getElementById('customerPhone').value.trim(); state.customerAddress = document.getElementById('customerAddress').value.trim(); closeMiniCart(); document.getElementById('paymentModal').classList.add('active'); document.body.style.overflow = 'hidden'; return; }
    const menuItem = e.target.closest('.menu-item'); if (menuItem && !e.target.closest('.add-btn') && !e.target.closest('.qty-btn')) { openProductModal(menuItem.dataset.id); return; }
    const catBtn = e.target.closest('.cat-pill'); if (catBtn && catBtn.dataset.cat) { document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active')); catBtn.classList.add('active'); state.activeFilter = catBtn.dataset.cat; renderAll(); return; }
    const faqToggle = e.target.closest('[data-toggle="faq"]'); if (faqToggle) { faqToggle.closest('.faq-item')?.classList.toggle('open'); return; }
    if (e.target.closest('#modalClose') || e.target === productModal) { closeProductModal(); return; }
    if (e.target.closest('#miniCartClose') || e.target === miniCartModal) { closeMiniCart(); return; }
    if (e.target.closest('#paymentClose') || e.target === document.getElementById('paymentModal')) { document.getElementById('paymentModal').classList.remove('active'); document.body.style.overflow = ''; return; }
    if (e.target.closest('#clearCartBtn')) { clearCart(); return; }
    if (e.target.closest('.cart-summary')) { openMiniCart(); return; }
    if (e.target.closest('#downloadQrisBtnPayment')) { downloadQRIS(); return; }
    if (e.target.closest('#clearSearchBtn')) { const input = document.getElementById('searchInput'); input.value = ''; state.searchQuery = ''; renderAll(); updateClearButton(); return; }
  });

  document.getElementById('modalAdd').addEventListener('click', function() { const id = this.dataset.id; if (id) { const spice = parseInt(document.getElementById('spiceSelect').value, 10) || 3; const entry = state.cart[id] || { qty: 0, spice }; entry.qty += 1; entry.spice = spice; state.cart[id] = entry; renderAll(); showToast('Berhasil ditambahkan ✓'); closeProductModal(); } });

  function handlePriorityToggle(checked) { state.isPriority = checked; document.getElementById('priorityToggle').checked = checked; document.getElementById('priorityToggleMini').checked = checked; if (state.userDistance !== null) updateShippingUI(state.userDistance, checked); }
  document.getElementById('priorityToggle').addEventListener('change', function() { handlePriorityToggle(this.checked); });
  document.getElementById('priorityToggleMini').addEventListener('change', function() { handlePriorityToggle(this.checked); });

  const searchInput = document.getElementById('searchInput'), clearSearchBtn = document.getElementById('clearSearchBtn');
  function updateClearButton() { if (searchInput.value.length > 0) clearSearchBtn.classList.add('visible'); else clearSearchBtn.classList.remove('visible'); }
  searchInput.addEventListener('input', debounce(function() { state.searchQuery = this.value; renderAll(); updateClearButton(); }, 300));
  searchInput.addEventListener('keyup', updateClearButton);
  clearSearchBtn.addEventListener('click', function() { searchInput.value = ''; state.searchQuery = ''; renderAll(); updateClearButton(); });

  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { if (productModal.classList.contains('active')) closeProductModal(); if (miniCartModal.classList.contains('active')) closeMiniCart(); if (document.getElementById('paymentModal').classList.contains('active')) { document.getElementById('paymentModal').classList.remove('active'); document.body.style.overflow = ''; } } });

  let toastTimer;
  function showToast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), SYSTEM.TOAST_DURATION); }

  const qrisImg = document.getElementById('qrisImagePayment');
  qrisImg.addEventListener('click', function(e) { this.classList.toggle('qr-zoomed'); });
  qrisImg.addEventListener('dblclick', function(e) { this.classList.toggle('qr-zoomed'); });

  function updateFloatingButton() {
    const btn = document.getElementById('floatingCartBtn'), badge = document.getElementById('floatingBadge');
    let totalQty = 0; Object.keys(state.cart).forEach(id => { const entry = state.cart[id]; if (entry) totalQty += entry.qty; });
    if (state.isCartMinimized && totalQty > 0) { btn.classList.add('visible'); badge.textContent = totalQty; }
    else { btn.classList.remove('visible'); }
  }

  function minimizeCart() { state.isCartMinimized = true; localStorage.setItem('rujak_cart_minimized', 'true'); document.getElementById('bottom-bar').classList.remove('visible'); updateFloatingButton(); const footer = document.querySelector('.footer-brand'); if (footer) footer.style.paddingBottom = '0'; }
  function expandCart() { state.isCartMinimized = false; localStorage.setItem('rujak_cart_minimized', 'false'); updateFloatingButton(); renderCart(); }

  document.getElementById('closeBottomBar').addEventListener('click', function(e) { e.stopPropagation(); minimizeCart(); });
  document.getElementById('floatingCartBtn').addEventListener('click', expandCart);

  function init() {
    loadCart();
    try { const savedMinimize = localStorage.getItem('rujak_cart_minimized'); if (savedMinimize !== null) state.isCartMinimized = savedMinimize === 'true'; } catch (_) {}
    renderAll(); detectLocation(); updateClearButton(); updateFloatingButton();

    window.addEventListener('scroll', () => {
      const header = document.getElementById('header');
      if (header) header.classList.toggle('shadowed', window.scrollY > 4);
    });

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    else { const int = setInterval(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) { lucide.createIcons(); clearInterval(int); } }, 100); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();