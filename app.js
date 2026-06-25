(function() {
  'use strict';

  // ===================== SUPABASE =====================
  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";

  let supabase = null;
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('Supabase client tidak tersedia.');
  }

  // ===================== DATA PRODUK =====================
  const PRODUCTS = typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : [];
  const VIP_PRODUCT = typeof VIP_PRODUCT_DATA !== 'undefined' ? VIP_PRODUCT_DATA : null;

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

  const state = {
    cart: {},
    activeFilter: 'all',
    searchQuery: '',
    userDistance: null,
    isPriority: false,
    orderNotes: '',
    isCartMinimized: false,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    isGift: false,
    giftSender: '',
    giftMessage: '',
    hasShared: false,
    shippingProvider: 'pembeli',
    selectedVehicle: 'motor',
    paymentMethod: 'bayar_kurir',
    isEditingCustomer: true,
    deliveryType: 'segera',
    deliveryDate: '',
    deliveryTime: ''
  };

  let currentStep = 1;

  // ===================== FUNGSI UTILITY =====================
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function loadCart() { try { const s = localStorage.getItem('rujak_cart'); if (s) { const p = JSON.parse(s); if (typeof p === 'object' && p !== null) state.cart = p; } } catch (_) { state.cart = {}; } }
  function saveCart() { try { localStorage.setItem('rujak_cart', JSON.stringify(state.cart)); } catch (_) { showToast('⚠️ Gagal menyimpan keranjang'); } }
  
  function getItemById(id) {
    if (id === 'p_vip' || id.startsWith('p_vip_')) return VIP_PRODUCT;
    let item = PRODUCTS.find(p => p.id === id) || ADDONS.find(a => a.id === id);
    if (item) return item;
    return PRODUCTS.find(p => id.startsWith(p.id + '_'));
  }
  
  function debounce(fn, delay) { let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); }; }

  // ===================== OSRM API =====================
  async function fetchOSRMDistance(originLat, originLng, destLat, destLng) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        return Math.round((data.routes[0].distance / 1000) * 10) / 10;
      }
      return null;
    } catch (e) {
      console.warn('Gagal mengambil jarak OSRM:', e);
      return null;
    }
  }

  // ===================== FUNGSI ONGKIR =====================
  function calculateShippingCost(vehicle, distance, isPriority) {
    if (state.shippingProvider === 'pembeli') return 0;
    const d = distance || SYSTEM.DEFAULT_DISTANCE;

    if (!isPriority) {
      const extra = Math.max(0, d - 3);
      if (vehicle === 'motor') {
        return 12000 + (extra * 2500);
      } else {
        return 25000 + (extra * 4000);
      }
    } else {
      let rate;
      if (d <= 20) {
        rate = (vehicle === 'motor') ? 2700 : 3500;
      } else {
        rate = (vehicle === 'motor') ? 2400 : 3000;
      }
      return Math.round(d * rate);
    }
  }

  // ===================== FUNGSI DISKON =====================
  function calculateDiscount(subtotal) {
    let discount = 0;
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) discount += 5000;
    if (state.hasShared) discount += 5000;
    return discount;
  }

  // ===================== GET CART SUMMARY =====================
  function getCartSummary() {
    const items = [];
    let subtotal = 0;
    let totalQty = 0;
    Object.keys(state.cart).forEach(id => {
      const entry = state.cart[id];
      const item = getItemById(id);
      if (item && entry && entry.qty > 0) {
        const lineTotal = item.price * entry.qty;
        subtotal += lineTotal;
        totalQty += entry.qty;
        items.push({ id, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice || null, lineTotal });
      } else {
        delete state.cart[id];
      }
    });
    const discount = calculateDiscount(subtotal);
    const distance = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
    const shippingCost = (state.shippingProvider === 'rujakco') ? calculateShippingCost(state.selectedVehicle, distance, state.isPriority) : 0;
    const isOutOfRange = distance > SYSTEM.MAX_DISTANCE;
    const qrisTotal = state.paymentMethod === 'digabung_qris'
      ? subtotal - discount + shippingCost
      : subtotal - discount;

    return { items, totalQty, subtotal, discount, shippingCost, shippingDistance: distance, qrisTotal, isOutOfRange };
  }

  // ===================== PERBARUI UI ONGKIR =====================
  function updateShippingUI(distance) {
    const costEl = document.getElementById('shippingCost');
    const courierSection = document.getElementById('courierSection');
    const vehicleOptions = document.getElementById('vehicleOptions');
    const motorPrice = document.getElementById('motorPrice');
    const mobilPrice = document.getElementById('mobilPrice');
    const priorityToggle = document.getElementById('priorityToggle');
    const priorityToggleMini = document.getElementById('priorityToggleMini');

    if (distance === null || distance === undefined) {
      costEl.textContent = '📍 Butuh GPS';
      if (courierSection) courierSection.style.display = 'none';
      return;
    }

    document.getElementById('shippingDistance').textContent = '~' + Math.ceil(distance) + ' km';

    if (distance > SYSTEM.MAX_DISTANCE) {
      costEl.textContent = '❌';
      document.getElementById('outOfRange').style.display = 'block';
      courierSection.style.display = 'none';
      return;
    }

    document.getElementById('outOfRange').style.display = 'none';
    courierSection.style.display = 'block';

    const motorReg = calculateShippingCost('motor', distance, false);
    const mobilReg = calculateShippingCost('mobil', distance, false);
    motorPrice.textContent = fmt(motorReg);
    mobilPrice.textContent = fmt(mobilReg);

    if (state.shippingProvider === 'rujakco') {
      vehicleOptions.style.display = 'block';
      const currentCost = calculateShippingCost(state.selectedVehicle, distance, state.isPriority);
      costEl.textContent = fmt(currentCost);
      priorityToggle.disabled = false;
      priorityToggleMini.disabled = false;
    } else {
      vehicleOptions.style.display = 'none';
      costEl.textContent = 'Rp0 (Kurir Pribadi)';
      priorityToggle.disabled = true;
      priorityToggleMini.disabled = true;
      if (state.isPriority) {
        state.isPriority = false;
        priorityToggle.checked = false;
        priorityToggleMini.checked = false;
      }
    }

    priorityToggle.checked = state.isPriority;
    priorityToggleMini.checked = state.isPriority;

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  // ===================== RENDER FUNCTIONS =====================
  function renderMenu() {
    const container = document.getElementById('menuList');
    const empty = document.getElementById('emptyState');
    const skeleton = document.getElementById('skeletonContainer');
    skeleton.style.display = 'none';
    container.style.display = 'block';
    if (state.activeFilter === 'addon') { container.innerHTML = ''; empty.style.display = 'none'; return; }

    let filtered = PRODUCTS.filter(p => {
      const matchCat = (state.activeFilter === 'all' || p.cat === state.activeFilter);
      const q = state.searchQuery.toLowerCase();
      return matchCat && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    });
    if (state.searchQuery.toLowerCase().includes('vip') && VIP_PRODUCT) {
      if (!filtered.some(p => p.id === 'p_vip')) filtered = [VIP_PRODUCT, ...filtered];
    }
    if (!filtered.length) { empty.style.display = 'block'; container.innerHTML = ''; return; }
    empty.style.display = 'none';

    let html = '';
    filtered.forEach(p => {
      let qty = 0; let firstCartKey = p.id;
      Object.keys(state.cart).forEach(k => {
        if (k === p.id || k.startsWith(p.id + '_')) { qty += state.cart[k].qty; if (qty === state.cart[k].qty) firstCartKey = k; }
      });
      const control = qty === 0
        ? `<button type="button" class="add-btn" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>`
        : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${firstCartKey}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${firstCartKey}">+</button></div>`;
      const badgeRight = p.badge ? `<span class="item-badge-right ${p.badgeColor}">${p.badge}</span>` : '';
      const flavorTag = p.flavorTag ? `<span class="item-flavor-tag">${p.flavorTag}</span>` : '';
      const buahChips = (p.buah || []).slice(0, 4).map(b => `<span class="item-buah-chip">${b}</span>`).join('');
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
      const entry = state.cart[a.id]; const qty = entry ? entry.qty : 0;
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
    const header = document.getElementById('addonHeader'), divider = document.getElementById('addonDivider');
    const show = filtered.length > 0;
    header.style.display = show ? 'flex' : 'none'; divider.style.display = show ? 'block' : 'none';
  }

  function updateProgressBar(subtotal) {
    const container = document.getElementById('progressContainer');
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) { container.style.display = 'none'; return; }
    const remaining = SYSTEM.DISCOUNT_THRESHOLD - subtotal;
    const progressPercent = Math.min(100, Math.round((subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
    container.style.display = 'block';
    document.getElementById('progressLabel').textContent = `Tambah ${fmt(remaining)} lagi untuk potongan Rp5.000`;
    document.getElementById('progressPercent').textContent = progressPercent + '%';
    document.getElementById('progressFill').style.width = progressPercent + '%';
    document.getElementById('progressFill').style.background = progressPercent >= 80 ? 'var(--green)' : 'var(--red)';
  }

  function updateMissionCheckboxes(subtotal) {
    const missionSpend = document.getElementById('missionSpend');
    const checkShare = document.getElementById('checkShare');
    if (missionSpend) missionSpend.checked = subtotal >= SYSTEM.DISCOUNT_THRESHOLD;
    if (checkShare) checkShare.checked = state.hasShared;
  }

  function renderCart() {
    const summary = getCartSummary();
    updateProgressBar(summary.subtotal); updateMissionCheckboxes(summary.subtotal);
    const bar = document.getElementById('bottom-bar');
    const discountLabel = document.getElementById('discountLabel'), totalEl = document.getElementById('cartTotalDisplay');
    const footerEl = document.querySelector('.footer-brand');

    if (summary.totalQty > 0 && !state.isCartMinimized) {
      bar.classList.add('visible');
      if (footerEl) footerEl.style.paddingBottom = '180px';
      document.getElementById('cartPreview').textContent = summary.totalQty + ' item' + (summary.totalQty > 1 ? 's' : '');
      if (summary.discount > 0) {
        discountLabel.style.display = 'inline-block';
        discountLabel.textContent = '-Rp' + summary.discount.toLocaleString('id-ID');
        totalEl.innerHTML = `<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;margin-right:4px;">${fmt(summary.subtotal)}</span>${fmt(summary.subtotal - summary.discount)}`;
      } else {
        discountLabel.style.display = 'none';
        totalEl.textContent = fmt(summary.subtotal);
      }
    } else {
      bar.classList.remove('visible');
      if (footerEl) footerEl.style.paddingBottom = '0';
    }
    saveCart(); updateFloatingButton();
  }

  // ===================== STEP FUNCTIONS =====================
  function goToStep(step) {
    currentStep = step;
    document.querySelectorAll('.cart-step').forEach(el => el.style.display = 'none');
    const target = document.getElementById('cartStep' + step);
    if (target) target.style.display = 'block';
    
    document.querySelectorAll('.step').forEach((el, i) => {
      el.classList.toggle('active', i+1 <= step);
    });
    document.querySelectorAll('.step-line').forEach((el, i) => {
      el.classList.toggle('active', i+1 < step);
    });
    
    if (step === 3) updateFinalSummary();
  }

  function updateFinalSummary() {
    const summary = getCartSummary();
    document.getElementById('finalSubtotal').textContent = fmt(summary.subtotal);
    document.getElementById('finalDiscount').textContent = '-' + fmt(summary.discount);
    document.getElementById('finalShipping').textContent = fmt(summary.shippingCost);
    document.getElementById('finalTotal').textContent = fmt(summary.qrisTotal);
  }

  // ===================== RENDER MINI CART (STEP 1) =====================
  function renderMiniCart() {
    const summary = getCartSummary();
    const list = document.getElementById('miniCartList');
    
    if (!list) return;
    
    if (summary.items.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:30px 0;color:var(--gray-400);">
          <div style="font-size:40px;margin-bottom:8px;">🛒</div>
          <div style="font-size:14px;font-weight:600;">Keranjang kosong</div>
          <div style="font-size:12px;">Tambahkan menu favoritmu</div>
        </div>
      `;
      document.getElementById('cartSubtotalDisplay').textContent = 'Rp0';
      return;
    }
    
    list.innerHTML = summary.items.map(item => `
      <div class="mini-cart-item">
        <div class="mini-cart-info">
          <div class="mini-cart-name">${item.name}${item.spice ? ' (Level ' + item.spice + ')' : ''}</div>
          <div class="mini-cart-detail">${fmt(item.price)}</div>
        </div>
        <div class="mini-cart-qty">
          <button data-action="decrease" data-id="${item.id}">−</button>
          <span>${item.qty}</span>
          <button data-action="increase" data-id="${item.id}">+</button>
          <button data-action="remove" data-id="${item.id}" class="mini-cart-remove">✕</button>
        </div>
      </div>
    `).join('');
    
    document.getElementById('cartSubtotalDisplay').textContent = fmt(summary.subtotal);
  }

  // ===================== UPDATE UI =====================
  function updateUI() {
    renderMenu(); renderAddons(); renderCart();
    if (document.getElementById('miniCartModal').classList.contains('active')) {
      renderMiniCart();
    }
    updateClearButton(); updateFloatingButton();
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  // ===================== MODALS =====================
  const productModal = document.getElementById('productModal');
  let currentProductId = null;
  const SPICE_NAMES = ['Mild', 'Sedang', 'Pedas', 'Extra Pedas', 'Very Hot'];

  function openProductModal(id) {
    const product = PRODUCTS.find(p => p.id === id) || VIP_PRODUCT;
    if (!product) return;
    currentProductId = id;
    document.getElementById('modalImg').innerHTML = `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.textContent='${product.name.substring(0,20)}';">`;
    const badgeEl = document.getElementById('modalBadge');
    if (product.badge) { badgeEl.style.display = 'inline-block'; badgeEl.textContent = product.badge; badgeEl.className = 'modal-badge-eyebrow ' + (product.badgeColor || ''); }
    else badgeEl.style.display = 'none';
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
    select.value = defaultVal; updateSpiceHighlight(defaultVal);
    select.onchange = function() { updateSpiceHighlight(parseInt(this.value, 10)); };
    productModal.classList.add('active'); document.body.style.overflow = 'hidden';
  }

  function updateSpiceHighlight(level) { document.getElementById('modalSpiceLabel').textContent = level + ' - ' + (SPICE_NAMES[level - 1] || 'Pedas'); }
  function closeProductModal() { productModal.classList.remove('active'); document.body.style.overflow = ''; currentProductId = null; }

  const miniCartModal = document.getElementById('miniCartModal');

  // ===================== OPEN MINI CART (LENGKAP) =====================
  function openMiniCart() {
    // Load data customer ke form
    const nameEl = document.getElementById('customerName');
    const phoneEl = document.getElementById('customerPhone');
    const addressEl = document.getElementById('customerAddress');
    const notesEl = document.getElementById('orderNotes');
    const giftToggleEl = document.getElementById('giftToggle');
    const giftFieldsEl = document.getElementById('giftFields');
    const giftSenderEl = document.getElementById('giftSender');
    const giftMessageEl = document.getElementById('giftMessage');
    
    if (nameEl) nameEl.value = state.customerName || '';
    if (phoneEl) phoneEl.value = state.customerPhone || '';
    if (addressEl) addressEl.value = state.customerAddress || '';
    if (notesEl) notesEl.value = state.orderNotes || '';
    if (giftToggleEl) {
      giftToggleEl.checked = state.isGift || false;
      if (giftFieldsEl) {
        giftFieldsEl.style.display = state.isGift ? 'block' : 'none';
      }
    }
    if (giftSenderEl) giftSenderEl.value = state.giftSender || '';
    if (giftMessageEl) giftMessageEl.value = state.giftMessage || '';
    
    // Set shipping provider buttons
    document.querySelectorAll('.ship-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.provider === state.shippingProvider);
    });
    
    const rujakcoOptions = document.getElementById('rujakcoOptions');
    if (rujakcoOptions) {
      rujakcoOptions.style.display = state.shippingProvider === 'rujakco' ? 'block' : 'none';
    }
    
    // Set vehicle buttons
    document.querySelectorAll('.veh-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.vehicle === state.selectedVehicle);
    });
    
    // Set priority toggle
    const priorityToggleMini = document.getElementById('priorityToggleMini');
    if (priorityToggleMini) {
      priorityToggleMini.checked = state.isPriority || false;
      priorityToggleMini.disabled = state.shippingProvider !== 'rujakco';
    }
    
    renderMiniCart();
    goToStep(1);
    miniCartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // ===================== CLOSE MINI CART (LENGKAP) =====================
  function closeMiniCart() {
    // Simpan semua data dari form
    const nameEl = document.getElementById('customerName');
    const phoneEl = document.getElementById('customerPhone');
    const addressEl = document.getElementById('customerAddress');
    const notesEl = document.getElementById('orderNotes');
    const giftToggleEl = document.getElementById('giftToggle');
    const giftSenderEl = document.getElementById('giftSender');
    const giftMessageEl = document.getElementById('giftMessage');
    
    if (notesEl) state.orderNotes = notesEl.value;
    if (nameEl) state.customerName = nameEl.value.trim();
    if (phoneEl) state.customerPhone = phoneEl.value.trim();
    if (addressEl) state.customerAddress = addressEl.value.trim();
    if (giftToggleEl) state.isGift = giftToggleEl.checked;
    if (giftSenderEl) state.giftSender = giftSenderEl.value.trim();
    if (giftMessageEl) state.giftMessage = giftMessageEl.value.trim();
    
    saveCustomerData();
    miniCartModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function clearCart() {
    if (Object.keys(state.cart).length === 0) return showToast('Keranjang sudah kosong');
    if (confirm('Yakin ingin mengosongkan keranjang?')) {
      state.cart = {}; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart();
      showToast('Keranjang dikosongkan');
    }
  }

  // ===================== SUPABASE =====================
  async function saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount) {
    if (!supabase) return false;
    try {
      const payload = {
        customer_name: state.customerName || 'Guest', customer_phone: state.customerPhone || '',
        customer_address: state.customerAddress || '', items: orderItems, subtotal, shipping_cost: shippingCost,
        discount, total, status: 'pending', is_gift: state.isGift, gift_sender: state.giftSender || null,
        gift_message: state.giftMessage || null, mission_shared: state.hasShared,
        delivery_type: state.deliveryType || 'segera', delivery_date: state.deliveryDate || '',
        delivery_time: state.deliveryTime || '', courier: state.shippingProvider === 'rujakco' ? 'Rujak.Co' : 'Pembeli',
        payment_method: state.paymentMethod
      };
      const { error } = await supabase.from('orders').insert([payload]);
      if (error) throw error; return true;
    } catch (err) { console.error('Supabase error:', err); return false; }
  }

  function handleCheckout() {
    const summary = getCartSummary();
    if (summary.isOutOfRange) return showToast('Maaf, pengiriman hanya tersedia untuk Jabodetabek');
    const name = state.customerName.trim(), phone = state.customerPhone.trim(), address = state.customerAddress.trim();
    if (!name || name.length < 2) return showToast('❌ Nama penerima tidak valid'), document.getElementById('customerName').focus();
    if (!phone || phone.length < 8) return showToast('❌ Nomor HP tidak valid'), document.getElementById('customerPhone').focus();
    if (!address || address.length < 5) return showToast('❌ Alamat pengiriman tidak valid'), document.getElementById('customerAddress').focus();
    if (summary.items.length === 0) return showToast('Keranjang kosong');

    const payBtn = document.querySelector('[data-action="confirm-wa"]');
    if (payBtn) payBtn.textContent = '⏳ Menyimpan...';

    saveOrderToDatabase(summary.items, summary.qrisTotal, summary.subtotal, summary.shippingCost, summary.discount)
      .finally(() => {
        let msg = 'Halo Rujak.Co! Saya ingin memesan:\n\n';
        summary.items.forEach(item => {
          const spiceText = item.spice ? ' (Level ' + item.spice + ')' : '';
          msg += '• ' + item.name + spiceText + ' (x' + item.qty + ') — ' + fmt(item.lineTotal) + '\n';
        });

        let timeStr = state.deliveryType === 'po'
          ? `Terjadwal (PO) - Tanggal: ${state.deliveryDate || '-'}, Jam: ${state.deliveryTime || '-'}`
          : 'Kirim Segera (Hari Ini)';
        msg += '\n*Jadwal:* ' + timeStr + '\n';

        const vehicleName = state.selectedVehicle === 'motor' ? 'Motor' : 'Mobil';
        const prioritasText = state.isPriority ? ' (Prioritas)' : '';
        if (state.shippingProvider === 'rujakco') {
          msg += '*Kurir:* Rujak.Co — ' + vehicleName + prioritasText + ' — Estimasi: ' + fmt(summary.shippingCost) + '\n';
        } else {
          msg += '*Kurir:* Dipesan oleh Pembeli\n';
        }
        msg += '*Metode Pembayaran Ongkir:* ' + (state.paymentMethod === 'bayar_kurir' ? 'Bayar ke Kurir (Di Tempat)' : 'Digabung ke QRIS') + '\n';

        if (state.paymentMethod === 'bayar_kurir') {
          msg += '\n⚠️ *Ongkir dibayar terpisah ke kurir.*\n';
        }

        if (state.orderNotes) msg += '\n*Catatan Pesanan:*\n' + state.orderNotes + '\n';
        if (state.isGift) {
          msg += '\n🎁 *PESANAN KADO*\n';
          if (state.giftSender) msg += 'Dari: ' + state.giftSender + '\n';
          if (state.giftMessage) msg += 'Ucapan: ' + state.giftMessage + '\n';
        }
        msg += '\n*Data Pengiriman:*\nNama : ' + name + '\nNo. HP : ' + phone + '\nAlamat : ' + address + '\n';
        msg += '\nSubtotal: ' + fmt(summary.subtotal);
        if (summary.discount > 0) msg += '\nDiskon Misi Jajan: -' + fmt(summary.discount);
        msg += '\n*Total Tagihan QRIS: ' + fmt(summary.qrisTotal) + '*\n\n';
        if (state.paymentMethod === 'digabung_qris' && state.shippingProvider === 'rujakco') {
          msg += 'Termasuk ongkir: ' + fmt(summary.shippingCost) + '\n';
        }
        msg += '*Saya sudah transfer via QRIS, ini bukti transfernya:*\n*(sertakan foto)*';

        window.location.href = 'https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg);
      });
  }

  // ===================== CUSTOMER DATA =====================
  function saveCustomerData() {
    try { localStorage.setItem('rujak_customer', JSON.stringify({ name: state.customerName, phone: state.customerPhone, address: state.customerAddress, isGift: state.isGift, giftSender: state.giftSender, giftMessage: state.giftMessage, hasShared: state.hasShared })); } catch (_) { showToast('⚠️ Gagal menyimpan data pelanggan'); }
  }
  function loadCustomerData() {
    try {
      const raw = localStorage.getItem('rujak_customer');
      if (raw) { const data = JSON.parse(raw); state.customerName = data.name || ''; state.customerPhone = data.phone || ''; state.customerAddress = data.address || ''; state.isGift = data.isGift || false; state.giftSender = data.giftSender || ''; state.giftMessage = data.giftMessage || ''; state.hasShared = data.hasShared || false; }
    } catch (_) {}
  }

  // ===================== TOAST =====================
  let toastTimer;
  function showToast(msg) {
    const el = document.getElementById('toast'); el.textContent = msg; el.classList.remove('show');
    void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), SYSTEM.TOAST_DURATION);
  }

  // ===================== FLOATING BUTTON =====================
  function updateFloatingButton() {
    const btn = document.getElementById('floatingCartBtn'), badge = document.getElementById('floatingBadge');
    const summary = getCartSummary();
    if (state.isCartMinimized && summary.totalQty > 0) { btn.classList.add('visible'); badge.textContent = summary.totalQty; }
    else btn.classList.remove('visible');
  }
  function minimizeCart() {
    state.isCartMinimized = true; localStorage.setItem('rujak_cart_minimized', 'true');
    document.getElementById('bottom-bar').classList.remove('visible'); updateFloatingButton();
    const footerEl = document.querySelector('.footer-brand'); if (footerEl) footerEl.style.paddingBottom = '0';
  }
  function expandCart() { state.isCartMinimized = false; localStorage.setItem('rujak_cart_minimized', 'false'); updateFloatingButton(); renderCart(); }

  function updateStoreStatus() { document.getElementById('storeStatusText').textContent = 'Buka'; document.getElementById('storeStatus')?.classList.remove('closed'); }
  function shareToWhatsApp() { window.location.href = 'https://wa.me/?text=' + encodeURIComponent('Hai! Cobain Rujak.Co yuk — rujak premium dengan buah segar pilihan dan sambal khas Indonesia. Lihat menu dan pesan langsung di sini:\n' + window.location.href); }

  const promoModal = document.getElementById('promoModal');
  function openPromoModal() { const summary = getCartSummary(); updateMissionCheckboxes(summary.subtotal); promoModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closePromoModal() { promoModal.classList.remove('active'); document.body.style.overflow = ''; }

  const searchInput = document.getElementById('searchInput'), clearSearchBtn = document.getElementById('clearSearchBtn');
  function updateClearButton() { clearSearchBtn.classList.toggle('visible', searchInput.value.length > 0); }

  // ===================== DETEKSI LOKASI =====================
  async function detectLocation() {
    const STORE_LAT = -6.2333, STORE_LNG = 107.0;
    const costEl = document.getElementById('shippingCost');
    const courierSection = document.getElementById('courierSection');

    costEl.textContent = '📍 Butuh GPS';
    if (courierSection) courierSection.style.display = 'none';
    document.getElementById('outOfRange').style.display = 'none';

    if (!navigator.geolocation) {
      showToast('❌ GPS tidak tersedia di perangkat ini. Tidak dapat memesan.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        costEl.textContent = '🛣️ Menghitung rute...';

        const roadDistance = await fetchOSRMDistance(STORE_LAT, STORE_LNG, lat, lng);

        if (roadDistance !== null) {
          state.userDistance = roadDistance;
        } else {
          const R = 6371;
          const dLat = (lat - STORE_LAT) * Math.PI / 180;
          const dLon = (lng - STORE_LNG) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(STORE_LAT * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
          const straight = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          state.userDistance = Math.round(straight * 1.35 * 10) / 10;
          console.warn('OSRM gagal, menggunakan fallback Haversine * 1.35');
        }

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=id`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || 'Lokasi Anda';
          document.getElementById('locationDisplay').textContent = city + ' ▾';
        } catch (_) {
          document.getElementById('locationDisplay').textContent = 'Lokasi Anda ▾';
        }

        updateShippingUI(state.userDistance);
      },
      (err) => {
        costEl.textContent = '❌ GPS wajib diaktifkan';
        document.getElementById('outOfRange').style.display = 'block';
        document.getElementById('outOfRange').textContent = '⚠️ GPS harus diaktifkan untuk memesan. Buka pengaturan browser/HP Anda.';
        showToast('❌ GPS wajib diaktifkan! Tidak dapat memesan tanpa GPS.');
        state.userDistance = null;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  // ===================== EVENT BINDING =====================
  function bindEvents() {
    // Tambah produk
    document.getElementById('modalAdd').addEventListener('click', function() {
      const baseId = this.dataset.id;
      if (baseId) {
        const spice = parseInt(document.getElementById('spiceSelect').value, 10) || 3;
        const cartKey = baseId + '_' + spice;
        const entry = state.cart[cartKey] || { qty: 0, spice: spice };
        entry.qty += 1; entry.spice = spice; state.cart[cartKey] = entry;
        updateUI(); showToast('Berhasil ditambahkan ✓'); closeProductModal();
      }
    });

    // Customer data: Ubah
    document.getElementById('editCustomerBtn').addEventListener('click', function() {
      state.isEditingCustomer = true;
      renderMiniCart();
    });

    // Customer data: Simpan
    document.getElementById('saveCustomerBtn').addEventListener('click', function() {
      state.customerName = document.getElementById('customerName').value.trim();
      state.customerPhone = document.getElementById('customerPhone').value.trim();
      state.customerAddress = document.getElementById('customerAddress').value.trim();
      state.isEditingCustomer = false;
      saveCustomerData();
      renderMiniCart();
      showToast('Data penerima disimpan ✓');
    });

    // Auto-collapse saat blur di alamat
    document.getElementById('customerAddress').addEventListener('blur', function() {
      const name = document.getElementById('customerName').value.trim();
      const phone = document.getElementById('customerPhone').value.trim();
      const address = this.value.trim();
      if (name && phone && address) {
        state.customerName = name;
        state.customerPhone = phone;
        state.customerAddress = address;
        state.isEditingCustomer = false;
        saveCustomerData();
        renderMiniCart();
        showToast('Data penerima tersimpan ✓');
      }
    });

    // Shipping provider radio (kompatibilitas)
    document.querySelectorAll('input[name="shippingProvider"]').forEach(radio => {
      radio.addEventListener('change', function() {
        state.shippingProvider = this.value;
        if (state.shippingProvider === 'rujakco') {
          document.querySelector('input[name="vehicle"][value="motor"]').checked = true;
          state.selectedVehicle = 'motor';
          document.getElementById('priorityToggle').disabled = false;
          document.getElementById('priorityToggleMini').disabled = false;
        } else {
          state.isPriority = false;
          document.getElementById('priorityToggle').checked = false;
          document.getElementById('priorityToggleMini').checked = false;
          document.getElementById('priorityToggle').disabled = true;
          document.getElementById('priorityToggleMini').disabled = true;
        }
        if (state.userDistance !== null) updateShippingUI(state.userDistance);
        renderMiniCart();
        updateUI();
      });
    });

    // Vehicle radio (kompatibilitas)
    document.querySelectorAll('input[name="vehicle"]').forEach(radio => {
      radio.addEventListener('change', function() {
        state.selectedVehicle = this.value;
        if (state.userDistance !== null) updateShippingUI(state.userDistance);
        renderMiniCart();
        updateUI();
      });
    });

    // Toggle prioritas
    const priorityToggle = document.getElementById('priorityToggle');
    const priorityToggleMini = document.getElementById('priorityToggleMini');
    if (priorityToggle) {
      priorityToggle.addEventListener('change', function() {
        state.isPriority = this.checked;
        if (priorityToggleMini) priorityToggleMini.checked = this.checked;
        if (state.userDistance !== null) updateShippingUI(state.userDistance);
        renderMiniCart();
        updateUI();
      });
    }
    if (priorityToggleMini) {
      priorityToggleMini.addEventListener('change', function() {
        state.isPriority = this.checked;
        if (priorityToggle) priorityToggle.checked = this.checked;
        if (state.userDistance !== null) updateShippingUI(state.userDistance);
        renderMiniCart();
        updateUI();
      });
    }

    // Promo & share
    document.getElementById('shareBtnModal').addEventListener('click', function() {
      state.hasShared = true; saveCustomerData(); updateUI(); showToast('Diskon Rp5.000 berhasil diaktifkan!'); shareToWhatsApp();
    });
    document.getElementById('promoTrigger').addEventListener('click', openPromoModal);
    document.getElementById('promoClose').addEventListener('click', closePromoModal);
    promoModal.addEventListener('click', function(e) { if (e.target === promoModal) closePromoModal(); });

    // Bottom bar
    document.getElementById('closeBottomBar').addEventListener('click', e => { e.stopPropagation(); minimizeCart(); });
    document.getElementById('floatingCartBtn').addEventListener('click', expandCart);

    // Search
    const searchToggleWrap = document.getElementById('searchToggleWrap');
    const searchIconBtn = document.getElementById('searchIconBtn');
    const searchInputWrap = document.getElementById('searchInputWrap');
    if (searchIconBtn) {
      searchIconBtn.addEventListener('click', () => { searchInputWrap.classList.toggle('open'); if (searchInputWrap.classList.contains('open')) searchInput.focus(); });
      document.addEventListener('click', (e) => { if (!searchToggleWrap.contains(e.target)) searchInputWrap.classList.remove('open'); });
    }

    // Input fields
    ['customerName', 'customerPhone', 'customerAddress', 'giftSender', 'giftMessage'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function() { state[id] = this.value.trim(); saveCustomerData(); });
      }
    });
    const orderNotes = document.getElementById('orderNotes');
    if (orderNotes) {
      orderNotes.addEventListener('input', function() { state.orderNotes = this.value; });
    }
    const giftToggle = document.getElementById('giftToggle');
    if (giftToggle) {
      giftToggle.addEventListener('change', function() {
        state.isGift = this.checked;
        const giftFields = document.getElementById('giftFields');
        if (giftFields) giftFields.style.display = this.checked ? 'block' : 'none';
        saveCustomerData();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', debounce(function() { state.searchQuery = this.value; updateUI(); updateClearButton(); }, 300));
      searchInput.addEventListener('keyup', updateClearButton);
    }

    // ===================== STEP NAVIGATION =====================
    const step1Next = document.getElementById('step1Next');
    const step2Back = document.getElementById('step2Back');
    const step2Next = document.getElementById('step2Next');
    const step3Back = document.getElementById('step3Back');

    if (step1Next) {
      step1Next.addEventListener('click', function() {
        const summary = getCartSummary();
        if (summary.items.length === 0) {
          showToast('❌ Keranjang kosong, tambahkan menu dulu');
          return;
        }
        goToStep(2);
      });
    }

    if (step2Back) step2Back.addEventListener('click', () => goToStep(1));

    if (step2Next) {
      step2Next.addEventListener('click', function() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();
        
        if (!name || name.length < 2) {
          showToast('❌ Masukkan nama penerima (min. 2 huruf)');
          document.getElementById('customerName').focus();
          return;
        }
        if (!phone || phone.length < 10 || phone.length > 15) {
          showToast('❌ Masukkan nomor HP yang valid (10-15 digit)');
          document.getElementById('customerPhone').focus();
          return;
        }
        if (!address || address.length < 5) {
          showToast('❌ Masukkan alamat lengkap (min. 5 huruf)');
          document.getElementById('customerAddress').focus();
          return;
        }
        
        state.customerName = name;
        state.customerPhone = phone;
        state.customerAddress = address;
        saveCustomerData();
        goToStep(3);
      });
    }

    if (step3Back) step3Back.addEventListener('click', () => goToStep(2));

    // ===================== SHIPPING OPTIONS (Tombol) =====================
    document.querySelectorAll('.ship-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.shippingProvider = this.dataset.provider;
        const rujakcoOptions = document.getElementById('rujakcoOptions');
        if (rujakcoOptions) {
          rujakcoOptions.style.display = this.dataset.provider === 'rujakco' ? 'block' : 'none';
        }
        if (state.userDistance !== null) updateShippingUI(state.userDistance);
        renderMiniCart();
        updateUI();
      });
    });

    document.querySelectorAll('.veh-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.selectedVehicle = this.dataset.vehicle;
        if (state.userDistance !== null) updateShippingUI(state.userDistance);
        renderMiniCart();
        updateUI();
      });
    });

    // ===================== GLOBAL CLICK DELEGATION =====================
    document.addEventListener('click', function(e) {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const { action, id } = actionBtn.dataset;
        if (action === 'open-modal' && id) return openProductModal(id);
        if (action === 'open-cart') return openMiniCart();
        if (action === 'add-addon' && id) { state.cart[id] = state.cart[id] || { qty: 0 }; state.cart[id].qty++; updateUI(); showToast('Berhasil ditambahkan ✓'); return; }
        if (action === 'increase' && id && state.cart[id]) { state.cart[id].qty++; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); return; }
        if (action === 'decrease' && id && state.cart[id]) { state.cart[id].qty--; if (state.cart[id].qty <= 0) delete state.cart[id]; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); return; }
        if (action === 'remove' && id && state.cart[id]) { delete state.cart[id]; updateUI(); if (miniCartModal.classList.contains('active')) renderMiniCart(); showToast('Item dihapus'); return; }
        if (action === 'confirm-wa') return handleCheckout();
        if (action === 'toast') return showToast(actionBtn.dataset.msg);
        if (action === 'share') return shareToWhatsApp();
        if (action === 'open-promo') return openPromoModal();
      }

      // ===================== BUTTON BAYAR QRIS =====================
      if (e.target.closest('#btnOpenPayment')) {
        const summary = getCartSummary();
        
        if (summary.items.length === 0) {
          showToast('❌ Keranjang kosong');
          return;
        }
        
        if (state.userDistance === null) {
          showToast('📍 Mohon tunggu, menghitung jarak pengiriman...');
          return;
        }
        
        if (state.userDistance > SYSTEM.MAX_DISTANCE) {
          showToast('⚠️ Maaf, pengiriman di luar jangkauan (maks. 50 km)');
          return;
        }
        
        const name = state.customerName.trim();
        const phone = state.customerPhone.trim();
        const address = state.customerAddress.trim();
        
        if (!name || !phone || !address) {
          showToast('❌ Lengkapi data penerima di step sebelumnya');
          goToStep(2);
          return;
        }
        
        document.getElementById('paymentTotalDisplay').textContent = 
          document.getElementById('finalTotal').textContent;
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
        catBtn.classList.add('active'); state.activeFilter = catBtn.dataset.cat; updateUI(); return;
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
        showToast('Gambar QRIS sedang diunduh...'); return;
      }
      if (e.target.closest('#clearSearchBtn')) {
        searchInput.value = ''; state.searchQuery = ''; updateUI(); updateClearButton(); return;
      }
    });

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (productModal.classList.contains('active')) closeProductModal();
        if (miniCartModal.classList.contains('active')) closeMiniCart();
        if (document.getElementById('paymentModal').classList.contains('active')) {
          document.getElementById('paymentModal').classList.remove('active'); document.body.style.overflow = '';
        }
        if (promoModal.classList.contains('active')) closePromoModal();
      }
    });

    // QRIS zoom
    const qrisImg = document.getElementById('qrisImagePayment');
    if (qrisImg) {
      qrisImg.addEventListener('click', function() { this.classList.toggle('qr-zoomed'); });
      qrisImg.addEventListener('dblclick', function() { this.classList.toggle('qr-zoomed'); });
    }

    window.addEventListener('scroll', () => { document.getElementById('header')?.classList.toggle('shadowed', window.scrollY > 4); });
  }

  // ===================== INIT =====================
  function init() {
    loadCart(); loadCustomerData(); updateStoreStatus();
    document.getElementById('shareStrip').style.display = 'none';
    try { const s = localStorage.getItem('rujak_cart_minimized'); if (s !== null) state.isCartMinimized = s === 'true'; } catch (_) {}
    document.getElementById('customerName').value = state.customerName;
    document.getElementById('customerPhone').value = state.customerPhone;
    document.getElementById('customerAddress').value = state.customerAddress;
    document.getElementById('giftToggle').checked = state.isGift;
    document.getElementById('giftSender').value = state.giftSender;
    document.getElementById('giftMessage').value = state.giftMessage;
    document.getElementById('giftFields').style.display = state.isGift ? 'block' : 'none';

    state.shippingProvider = 'pembeli';
    state.isPriority = false;
    document.getElementById('priorityToggle').disabled = true;
    document.getElementById('priorityToggleMini').disabled = true;
    document.querySelector('input[name="shippingProvider"][value="pembeli"]').checked = true;
    document.querySelector('input[name="vehicle"][value="motor"]').checked = true;

    updateUI(); detectLocation(); bindEvents();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          showToast('🔄 Versi baru tersedia! Segarkan halaman.');
        }
      });
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    else { const int = setInterval(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) { lucide.createIcons(); clearInterval(int); } }, 100); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();