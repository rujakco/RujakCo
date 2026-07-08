(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO v2.0 — ALUR RAPI, WA & TELEGRAM LENGKAP
  // ============================================================

  function safeGet(id) {
    var el = document.getElementById(id);
    if (!el) console.warn('[RujakCo] #' + id + ' tidak ditemukan');
    return el;
  }

  function normalizePhone(phone) {
    var cleaned = String(phone || '').replace(/[\s\-\(\)\.]/g, '');
    if (/^08[1-9][0-9]{7,10}$/.test(cleaned)) return '62' + cleaned.slice(1);
    if (/^\+628[1-9][0-9]{7,10}$/.test(cleaned)) return cleaned.slice(1);
    if (/^628[1-9][0-9]{7,10}$/.test(cleaned)) return cleaned;
    return cleaned;
  }

  function isValidPhone(phone) {
    var cleaned = String(phone || '').replace(/[\s\-\(\)\.]/g, '');
    return /^(08[1-9][0-9]{7,10}|\+628[1-9][0-9]{7,10}|628[1-9][0-9]{7,10})$/.test(cleaned);
  }

  var ErrorLogger = {
    log: function(context, error) {
      console.error('[RujakCo] ' + context + ':', error);
      try {
        var logs = JSON.parse(localStorage.getItem('rujak_error_logs') || '[]');
        logs.push({ time: new Date().toISOString(), context: context, error: error ? (error.message || String(error)) : 'Unknown' });
        if (logs.length > 50) logs = logs.slice(-50);
        localStorage.setItem('rujak_error_logs', JSON.stringify(logs));
      } catch(e) {}
    }
  };

  // ============================================================
  // CONFIG
  // ============================================================
  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";

  let supabase = null;

  function getSupabase() {
    return new Promise((resolve) => {
      if (supabase) return resolve(supabase);
      if (window.supabase?.createClient) { supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); return resolve(supabase); }
      let attempts = 0;
      const maxAttempts = 50;
      const interval = setInterval(() => {
        attempts++;
        if (window.supabase?.createClient) { clearInterval(interval); supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); resolve(supabase); }
        else if (attempts >= maxAttempts) {
          clearInterval(interval);
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
          script.onload = () => { if (window.supabase?.createClient) { supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); resolve(supabase); } else { resolve(null); } };
          script.onerror = () => resolve(null);
          document.head.appendChild(script);
        }
      }, 100);
    });
  }

  const PRODUCTS = [
    // ... PRODUK (sama seperti sebelumnya, tidak perlu diulang di sini untuk menghemat)
    // Silakan copy dari versi sebelumnya
  ];

  const ADDONS = [
    // ... ADDONS (sama)
  ];

  const SYSTEM = {
    DISCOUNT_THRESHOLD: 100000,
    WA_NUMBER: '6289677161680',
    TOAST_DURATION: 3000,
    MAX_DISTANCE: 9999,
    DEFAULT_DISTANCE: 2,
    PRIORITY_SURCHARGE: 8000,
    STORE_LAT: -6.2347,
    STORE_LNG: 106.9895,
    LOCATION_TIMEOUT: 12000
  };

  const DISTRICT_MAP = {
    // ... (sama)
  };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null,
    isPriority: false, orderNotes: '', isCartMinimized: false,
    customerName: '', customerPhone: '', customerAddress: '',
    isGift: false, giftSender: '', giftMessage: '',
    useManualDistrict: false, selectedDistrict: '', hasShared: false,
    shippingProvider: 'rujakco', vehicleType: 'motor', currentStep: 1,
    currentOrderNumber: null,
    // baru: flag untuk menunjukkan apakah shipping sudah dihitung
    shippingCalculated: false
  };

  let addToCartLocked = false, checkoutLocked = false;
  let cachedSummary = null, cachedSummaryKey = '';
  let storeStatusInterval = null, checkoutTimer = null, toastTimer = null;
  let pendingWhatsAppMessage = null;

  // ============================================================
  // UTILITY (sama)
  // ============================================================
  function escapeHTML(str) { /* ... */ }
  function fmt(num) { /* ... */ }
  function debounce(fn, delay) { /* ... */ }

  // ============================================================
  // PAXEL COST (akurat)
  // ============================================================
  function calculatePaxelCost(distance, vehicleType, weight) {
    var base = 0;
    if (distance <= 10) base = 15000;
    else if (distance <= 20) base = 18000;
    else if (distance <= 30) base = 20000;
    else if (distance <= 50) base = 30000;
    else base = 50000;
    var extraWeight = Math.max(0, weight - 1) * 5000;
    return base + extraWeight;
  }

  // ============================================================
  // SHIPPING FUNCTIONS (tanpa subsidi)
  // ============================================================
  function calculateLalamoveCost(distance, vehicleType) {
    const dist = Math.ceil(distance);
    if (vehicleType === 'motor') { if (dist <= 3) return 8000; if (dist <= 25) return 8000 + ((dist - 3) * 2000); return 8000 + (22 * 2000) + ((dist - 25) * 2400); }
    if (vehicleType === 'mobil') { if (dist <= 3) return 24000; if (dist <= 15) return 24000 + ((dist - 3) * 4500); return 24000 + (12 * 4500) + ((dist - 15) * 5000); }
    return 0;
  }

  function getZoneLabel(distance) {
    if (distance <= 5) return 'Zona A (0-5 km)';
    if (distance <= 10) return 'Zona B (5-10 km)';
    if (distance <= 15) return 'Zona C (10-15 km)';
    if (distance <= 20) return 'Zona D (15-20 km)';
    return 'Zona Jauh (>20 km)';
  }

  function isPeakHour() { /* ... */ }
  function getSurgeMultiplier() { /* ... */ }

  function calculateShipping(distance, priority, totalQty) {
    if (state.shippingProvider === 'pembeli') {
      return { cost: 0, label: 'Kurir Saya', distance: distance, zone: null, surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
    }
    const rawDistance = (distance === null || distance === undefined || isNaN(distance)) ? SYSTEM.DEFAULT_DISTANCE : distance;
    if (rawDistance > SYSTEM.MAX_DISTANCE) {
      return { cost: null, label: 'Admin Konfirmasi', distance: rawDistance, zone: 'E', surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
    }
    const surgeMultiplier = getSurgeMultiplier();
    const isSurge = surgeMultiplier > 1.0;

    let lalamoveCost = 0, baseLalamoveCost = 0, totalCost = 0;
    let zoneLabel = '', surgeLabel = isSurge ? ' ⚡Jam Sibuk' : '';
    let zone = 'F';

    if (state.shippingProvider === 'paxel') {
      const weight = totalQty || 1;
      const paxelCost = calculatePaxelCost(rawDistance, state.vehicleType, weight);
      totalCost = paxelCost;
      lalamoveCost = paxelCost;
      baseLalamoveCost = paxelCost;
      zoneLabel = 'Paxel ' + getZoneLabel(rawDistance);
      surgeLabel = '';
      if (rawDistance <= 20) {
        if (rawDistance <= 5) zone = 'A';
        else if (rawDistance <= 10) zone = 'B';
        else if (rawDistance <= 15) zone = 'C';
        else zone = 'D';
      } else { zone = 'F'; }
    } else {
      const lalamoveBase = calculateLalamoveCost(rawDistance, state.vehicleType);
      baseLalamoveCost = lalamoveBase;
      const surgedCost = Math.round(lalamoveBase * surgeMultiplier);
      lalamoveCost = surgedCost;
      const priorityCost = priority ? SYSTEM.PRIORITY_SURCHARGE : 0;
      totalCost = surgedCost + priorityCost;
      zoneLabel = getZoneLabel(rawDistance);
      if (rawDistance <= 20) {
        if (rawDistance <= 5) zone = 'A';
        else if (rawDistance <= 10) zone = 'B';
        else if (rawDistance <= 15) zone = 'C';
        else zone = 'D';
      } else { zone = 'F'; }
    }

    const label = zoneLabel + ' • ' + (state.vehicleType === 'motor' ? 'Motor' : 'Mobil') + (priority && state.shippingProvider !== 'paxel' ? ' • Prioritas' : '') + surgeLabel;

    return {
      cost: totalCost,
      lalamoveCost: lalamoveCost,
      baseLalamoveCost: baseLalamoveCost,
      surgeMultiplier: surgeMultiplier,
      isSurge: isSurge,
      label: label,
      distance: rawDistance,
      zone: zone
    };
  }

  // ============================================================
  // CART FUNCTIONS (dengan cache)
  // ============================================================
  function loadCart() { /* ... */ }
  function saveCart() { /* ... */ }
  function getItemById(id) { /* ... */ }

  // getCartSummary — tanpa ongkir (ongkir dihitung terpisah)
  function getCartSummary() {
    const items = []; let subtotal = 0, totalQty = 0;
    const keysToDelete = [];
    Object.keys(state.cart).forEach(id => {
      const entry = state.cart[id];
      const item = getItemById(id);
      if (item && entry && entry.qty > 0) {
        const lt = item.price * entry.qty;
        subtotal += lt;
        totalQty += entry.qty;
        items.push({ cartId: id, id: id, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice || null, lineTotal: lt });
      } else { keysToDelete.push(id); }
    });
    keysToDelete.forEach(id => delete state.cart[id]);
    const discount = calculateDiscount(subtotal);
    // Ongkir TIDAK dihitung di sini (akan dihitung terpisah setelah kecamatan dipilih)
    return { items, totalQty, subtotal, discount };
  }

  function getCartSummaryCached() {
    const key = JSON.stringify(state.cart) + '|' + state.hasShared;
    if (cachedSummary && cachedSummaryKey === key) return cachedSummary;
    cachedSummary = getCartSummary();
    cachedSummaryKey = key;
    return cachedSummary;
  }

  function invalidateCache() { cachedSummary = null; cachedSummaryKey = ''; }

  function calculateDiscount(subtotal) {
    let d = 0;
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) d += 5000;
    if (state.hasShared) d += 5000;
    return d;
  }

  // ============================================================
  // SHIPPING CALCULATION (dipanggil setelah kecamatan dipilih)
  // ============================================================
  function calculateShippingCost() {
    const summary = getCartSummaryCached();
    if (!state.selectedDistrict && state.userDistance === null) {
      return null; // belum ada kecamatan
    }
    let distance;
    if (state.selectedDistrict && DISTRICT_MAP[state.selectedDistrict]) {
      distance = DISTRICT_MAP[state.selectedDistrict];
    } else if (state.userDistance !== null) {
      distance = state.userDistance;
    } else {
      distance = SYSTEM.DEFAULT_DISTANCE;
    }
    const shipping = calculateShipping(distance, state.isPriority, summary.totalQty);
    const rawShippingCost = shipping.cost;
    const shippingCost = state.shippingProvider === 'pembeli' ? 0 : (rawShippingCost === null || rawShippingCost === undefined ? 0 : rawShippingCost);
    const total = summary.subtotal - summary.discount + shippingCost;
    return {
      shippingCost: shippingCost,
      rawShippingCost: rawShippingCost,
      shippingLabel: shipping.label,
      shippingDistance: shipping.distance,
      shippingZone: shipping.zone,
      isOutOfRange: shipping.zone === 'E',
      total: total,
      lalamoveCost: shipping.lalamoveCost,
      baseLalamoveCost: shipping.baseLalamoveCost,
      isSurge: shipping.isSurge,
      surgeMultiplier: shipping.surgeMultiplier
    };
  }

  // ============================================================
  // AUTOCOMPLETE KECAMATAN
  // ============================================================
  function updateDistrictAutocomplete() {
    const datalist = document.getElementById('districtOptions');
    if (!datalist) return;
    datalist.innerHTML = '';
    const districtNames = Object.keys(DISTRICT_MAP);
    districtNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name.charAt(0).toUpperCase() + name.slice(1);
      datalist.appendChild(opt);
    });
  }

  // ============================================================
  // UI RENDER (tanpa ongkir di bottom bar)
  // ============================================================
  function renderCart() {
    const summary = getCartSummaryCached();
    // Progress bar (diskon)
    updateProgressBar(summary.subtotal);
    updateMissionCheckboxes(summary.subtotal);

    const bar = document.getElementById('bottom-bar');
    const dl = document.getElementById('discountLabel');
    const te = document.getElementById('cartTotalDisplay');
    const footer = document.querySelector('.footer-brand');

    if (summary.totalQty > 0 && !state.isCartMinimized) {
      if (bar) bar.classList.add('visible');
      if (footer) footer.style.paddingBottom = '180px';
      const preview = document.getElementById('cartPreview');
      if (preview) preview.textContent = summary.totalQty + ' item' + (summary.totalQty > 1 ? 's' : '');
      if (summary.discount > 0) {
        if (dl) { dl.style.display = 'inline-block'; dl.textContent = '-Rp' + summary.discount.toLocaleString('id-ID'); }
        if (te) te.innerHTML = '<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;margin-right:4px;">' + fmt(summary.subtotal) + '</span>' + fmt(summary.subtotal - summary.discount);
      } else {
        if (dl) dl.style.display = 'none';
        if (te) te.textContent = fmt(summary.subtotal);
      }
    } else {
      if (bar) bar.classList.remove('visible');
      if (footer) footer.style.paddingBottom = '0';
    }
    saveCart();
    updateFloatingButton();
  }

  function renderMiniCart() {
    const summary = getCartSummaryCached();
    const list = document.getElementById('miniCartList');
    let html = '';
    if (summary.items.length === 0) {
      html = '<p style="color:var(--gray-500);text-align:center;padding:20px 0;">Keranjang kosong</p>';
    } else {
      summary.items.forEach(item => {
        const spiceText = item.spice ? ' (Level ' + item.spice + ')' : '';
        html += '<div class="mini-cart-item"><div class="mini-cart-info"><div class="mini-cart-name">' + escapeHTML(item.name) + spiceText + '</div><div class="mini-cart-detail">' + fmt(item.price) + '</div></div><div class="mini-cart-qty"><button data-action="decrease" data-id="' + item.cartId + '">−</button><span>' + item.qty + '</span><button data-action="increase" data-id="' + item.cartId + '">+</button><button class="mini-cart-remove" data-action="remove" data-id="' + item.cartId + '">🗑️</button></div></div>';
      });
    }
    list.innerHTML = html;
    document.getElementById('cartSubtotalDisplay').textContent = fmt(summary.subtotal);

    // Progress diskon
    const step1Progress = document.getElementById('step1Progress');
    if (step1Progress && summary.items.length > 0) {
      let progressHTML = '';
      const remaining = SYSTEM.DISCOUNT_THRESHOLD - summary.subtotal;
      const progressPercent = Math.min(100, Math.round((summary.subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
      if (remaining > 0) {
        progressHTML += '<div style="background:white;border:1px solid var(--gray-200);border-radius:12px;padding:12px;margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;"><span>🎯 Tambah ' + fmt(remaining) + ' lagi dapat potongan Rp5.000</span><span style="color:var(--green);">' + progressPercent + '%</span></div><div style="width:100%;height:6px;background:var(--gray-200);border-radius:10px;overflow:hidden;"><div style="width:' + progressPercent + '%;height:100%;background:' + (progressPercent >= 80 ? 'var(--green)' : 'var(--red)') + ';border-radius:10px;"></div></div></div>';
      } else {
        progressHTML += '<div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;margin-bottom:8px;">✅ Diskon Rp5.000 aktif!</div>';
      }
      step1Progress.innerHTML = progressHTML;
    }
    // AI Upsell
    const step1Upsell = document.getElementById('step1Upsell');
    if (step1Upsell && summary.items.length > 0) {
      step1Upsell.innerHTML = renderAIUpsell(summary);
    }

    // Isi data customer yang sudah tersimpan
    document.getElementById('customerName').value = state.customerName;
    document.getElementById('customerPhone').value = state.customerPhone;
    document.getElementById('customerAddress').value = state.customerAddress;
    if (state.selectedDistrict) {
      const display = state.selectedDistrict.charAt(0).toUpperCase() + state.selectedDistrict.slice(1);
      document.getElementById('districtInput').value = display;
    }
    document.getElementById('giftToggle').checked = state.isGift;
    document.getElementById('giftSender').value = state.giftSender;
    document.getElementById('giftMessage').value = state.giftMessage;
    document.getElementById('giftFields').style.display = state.isGift ? 'block' : 'none';

    // Hitung ulang ongkir jika kecamatan sudah dipilih
    if (state.selectedDistrict || state.userDistance !== null) {
      updateShippingDisplay();
    }

    // Update tombol bayar
    updatePaymentButton();

    // Lucide icons
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  function updateShippingDisplay() {
    const shippingData = calculateShippingCost();
    if (!shippingData) {
      document.getElementById('shippingSection').style.display = 'none';
      return;
    }
    document.getElementById('shippingSection').style.display = 'block';

    // Breakdown
    const breakdownContent = document.getElementById('breakdownContent');
    let html = '';
    if (shippingData.isOutOfRange) {
      html = '<div>⚠️ Area ini di luar jangkauan kami. Silakan pilih "Kurir Saya" atau hubungi admin.</div>';
    } else {
      html = '<div>Jarak: <strong>' + Math.ceil(shippingData.shippingDistance) + ' km</strong> <span style="font-size:10px;color:var(--gray-400);">' + (shippingData.shippingLabel || '') + '</span></div>';
      if (state.shippingProvider === 'rujakco') {
        html += '<div>🚚 Tarif Dasar: <strong>' + fmt(shippingData.baseLalamoveCost || 0) + '</strong></div>';
        if (shippingData.isSurge) {
          const surgeAmount = (shippingData.lalamoveCost || 0) - (shippingData.baseLalamoveCost || 0);
          if (surgeAmount > 0) html += '<div style="color:#D62828;">⚡ Surge (x' + shippingData.surgeMultiplier + '): +' + fmt(surgeAmount) + '</div>';
        }
        if (state.isPriority) {
          html += '<div>🚀 Prioritas: +Rp8.000</div>';
        }
        html += '<div style="border-top:1px solid var(--gray-200);margin-top:6px;padding-top:6px;font-weight:700;">Total Ongkir: <strong style="color:var(--red);">' + fmt(shippingData.shippingCost) + '</strong></div>';
      } else if (state.shippingProvider === 'paxel') {
        const weight = getCartSummaryCached().totalQty || 1;
        html += '<div>📦 Berat: <strong>' + weight + ' kg</strong></div>';
        html += '<div>📦 Tarif Paxel: <strong>' + fmt(shippingData.baseLalamoveCost || 0) + '</strong></div>';
        html += '<div style="border-top:1px solid var(--gray-200);margin-top:6px;padding-top:6px;font-weight:700;">Total Ongkir: <strong style="color:var(--red);">' + fmt(shippingData.shippingCost) + '</strong></div>';
      } else if (state.shippingProvider === 'pembeli') {
        html += '<div>Total Ongkir: <strong>Gratis (Kurir Sendiri)</strong></div>';
      }
    }
    breakdownContent.innerHTML = html;

    // Update final summary
    const summary = getCartSummaryCached();
    document.getElementById('finalSubtotal').textContent = fmt(summary.subtotal);
    document.getElementById('finalDiscount').textContent = summary.discount > 0 ? '-Rp' + summary.discount.toLocaleString('id-ID') : 'Rp0';
    document.getElementById('finalShipping').textContent = shippingData.isOutOfRange ? 'Konfirmasi Admin' : fmt(shippingData.shippingCost);
    document.getElementById('finalTotal').textContent = shippingData.isOutOfRange ? 'Konfirmasi' : fmt(shippingData.total);

    // Update tombol bayar
    updatePaymentButton();
  }

  function updatePaymentButton() {
    const bp = document.getElementById('btnOpenPayment');
    const summary = getCartSummaryCached();
    const shippingData = calculateShippingCost();
    if (!bp) return;

    if (summary.items.length === 0) {
      bp.disabled = true; bp.textContent = 'Keranjang kosong'; return;
    }
    if (shippingData && shippingData.isOutOfRange && state.shippingProvider !== 'pembeli') {
      bp.disabled = true; bp.textContent = 'Admin Konfirmasi'; return;
    }
    if (!state.selectedDistrict && state.userDistance === null && state.shippingProvider !== 'pembeli') {
      bp.disabled = true; bp.textContent = '⏳ Pilih kecamatan...'; return;
    }
    bp.disabled = false;
    bp.textContent = '💳 Bayar Via QRIS';
  }

  // ============================================================
  // HANDLE KECAMATAN AUTOCOMPLETE
  // ============================================================
  function onDistrictSelected() {
    const input = document.getElementById('districtInput');
    const val = input.value.toLowerCase().trim();
    if (val && DISTRICT_MAP[val]) {
      state.selectedDistrict = val;
      state.useManualDistrict = true;
      // Hitung ulang ongkir
      updateShippingDisplay();
      showToast('✅ Kecamatan ' + val.charAt(0).toUpperCase() + val.slice(1) + ' dipilih.');
    } else if (val) {
      // Coba cari yang mirip (untuk autocomplete yang mungkin tidak exact)
      const keys = Object.keys(DISTRICT_MAP);
      const match = keys.find(k => k.includes(val) || val.includes(k));
      if (match) {
        state.selectedDistrict = match;
        state.useManualDistrict = true;
        input.value = match.charAt(0).toUpperCase() + match.slice(1);
        updateShippingDisplay();
        showToast('✅ Kecamatan ' + input.value + ' dipilih.');
      } else {
        showToast('⚠️ Kecamatan tidak ditemukan, pilih dari daftar yang muncul.');
        input.value = '';
      }
    }
  }

  // ============================================================
  // CHECKOUT & WA / TELEGRAM LENGKAP
  // ============================================================
  function handleCheckout() {
    if (checkoutLocked) { showToast('⏳ Pesanan sedang diproses...'); return; }
    const lastOrderTime = localStorage.getItem('last_order');
    if (lastOrderTime && Date.now() - parseInt(lastOrderTime) < 30000) {
      showToast('⏳ Tunggu ' + Math.ceil((30000 - (Date.now() - parseInt(lastOrderTime))) / 1000) + ' detik'); return;
    }

    // Ambil data dari form
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const district = state.selectedDistrict || '';
    const deliveryTime = document.getElementById('deliveryTime').value;
    const notes = document.getElementById('orderNotes').value.trim();

    // Validasi
    if (!name || name.length < 2) { showToast('❌ Nama harus diisi'); document.getElementById('customerName').focus(); return; }
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleanedPhone || !isValidPhone(cleanedPhone)) { showToast('❌ Format HP tidak valid. Contoh: 08123456789'); document.getElementById('customerPhone').focus(); return; }
    const normalizedPhone = normalizePhone(cleanedPhone);
    if (!address || address.length < 5) { showToast('❌ Alamat terlalu pendek. Tulis lebih lengkap ya'); document.getElementById('customerAddress').focus(); return; }
    if (!district && state.shippingProvider !== 'pembeli') { showToast('❌ Pilih kecamatan terlebih dahulu'); document.getElementById('districtInput').focus(); return; }
    if (!deliveryTime) { showToast('❌ Pilih jam pengiriman'); document.getElementById('deliveryTimeTrigger').click(); return; }

    // Ambil summary & ongkir
    const summary = getCartSummaryCached();
    const shippingData = calculateShippingCost();
    if (!shippingData) { showToast('⚠️ Hitung ongkir gagal. Pilih kecamatan.'); return; }
    if (shippingData.isOutOfRange && state.shippingProvider !== 'pembeli') { showToast('⚠️ Area ini di luar jangkauan. Pilih "Kurir Saya" atau hubungi admin.'); return; }

    // Simpan data customer
    state.customerName = name;
    state.customerPhone = normalizedPhone;
    state.customerAddress = address + (district ? ', Kec. ' + district : '');
    state.orderNotes = notes;
    saveCustomerData();

    // Lock checkout
    checkoutLocked = true;
    const payBtn = document.querySelector('[data-action="confirm-wa"]');
    if (payBtn) { payBtn.textContent = '⏳ Menyimpan...'; payBtn.disabled = true; }
    if (checkoutTimer) clearTimeout(checkoutTimer);
    checkoutTimer = setTimeout(() => {
      checkoutLocked = false;
      if (payBtn) { payBtn.textContent = '💳 Kirim Bukti Transfer'; payBtn.disabled = false; }
      checkoutTimer = null;
    }, 5000);

    const orderNumber = 'RJ' + Date.now().toString(36).slice(-6) + Math.random().toString(36).substring(2,5).toUpperCase();
    state.currentOrderNumber = orderNumber;

    // Simpan ke database
    saveOrderToDatabase(summary.items, shippingData.total, summary.subtotal, shippingData.shippingCost, summary.discount, orderNumber)
      .then(saved => {
        if (checkoutTimer) { clearTimeout(checkoutTimer); checkoutTimer = null; }
        checkoutLocked = false;
        if (payBtn) { payBtn.textContent = '💳 Kirim Bukti Transfer'; payBtn.disabled = false; }
        if (!saved) { showToast('⚠️ Gagal menyimpan. Coba lagi ya'); return; }

        showToast('✅ Pesanan tersimpan!');
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal) { paymentModal.classList.remove('active'); document.body.style.overflow = ''; }
        recordOrderHistory(summary.items);

        // ========= GENERATE WA MESSAGE LENGKAP =========
        let waMsg = '🍜 *PESANAN RUJAK.CO*\n\n';
        waMsg += '📋 *Order:* ' + orderNumber + '\n';
        waMsg += '👤 *Nama:* ' + name + '\n';
        waMsg += '📱 *HP:* ' + normalizedPhone + '\n';
        waMsg += '📍 *Alamat:* ' + state.customerAddress + '\n';
        waMsg += '📅 *Jam Kirim:* ' + deliveryTime + '\n';
        waMsg += '🚚 *Kurir:* ' + (state.shippingProvider === 'rujakco' ? 'Rujak.Co (Lalamove)' : state.shippingProvider === 'paxel' ? 'Paxel' : 'Kurir Saya') + '\n';
        waMsg += '🛵 *Kendaraan:* ' + (state.vehicleType === 'motor' ? 'Motor' : 'Mobil') + '\n';
        if (state.isPriority) waMsg += '⚡ *Prioritas:* Aktif (+Rp8.000)\n';
        waMsg += '\n📦 *Pesanan:*\n';
        summary.items.forEach(item => {
          waMsg += '• ' + item.name;
          if (item.spice) waMsg += ' (Level ' + item.spice + ' 🌶️)';
          waMsg += ' x' + item.qty + ' — ' + fmt(item.lineTotal) + '\n';
        });
        if (notes) waMsg += '\n📝 *Catatan:*\n' + notes + '\n';
        if (state.isGift) {
          waMsg += '\n🎁 *KADO*\n';
          if (state.giftSender) waMsg += 'Dari: ' + state.giftSender + '\n';
          if (state.giftMessage) waMsg += 'Ucapan: ' + state.giftMessage + '\n';
        }
        waMsg += '\n💰 *Rincian Biaya:*\n';
        waMsg += 'Subtotal: ' + fmt(summary.subtotal) + '\n';
        if (summary.discount > 0) waMsg += 'Diskon: -' + fmt(summary.discount) + '\n';
        waMsg += 'Ongkir: ' + fmt(shippingData.shippingCost) + '\n';
        waMsg += '------------------------\n';
        waMsg += '🟢 *TOTAL: ' + fmt(shippingData.total) + '*\n\n';
        waMsg += '📸 *Bukti Transfer:*\n*(sertakan foto)*\n';
        waMsg += '✅ *Terima kasih telah memesan!*';
        if (waMsg.length > 4000) waMsg = waMsg.substring(0, 4000);
        showOrderConfirmation(waMsg);
      })
      .catch(error => {
        ErrorLogger.log('handleCheckout', error);
        checkoutLocked = false;
        if (checkoutTimer) { clearTimeout(checkoutTimer); checkoutTimer = null; }
        if (payBtn) { payBtn.textContent = '💳 Kirim Bukti Transfer'; payBtn.disabled = false; }
        showToast('⚠️ Gagal menyimpan. Coba lagi ya');
      });
  }

  function showOrderConfirmation(waMessage) {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
      paymentModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    state.cart = {}; invalidateCache(); saveCart(); updateUI();
    var oldModal = document.getElementById('orderConfirmationModal');
    if (oldModal) oldModal.remove();
    var modal = document.createElement('div');
    modal.id = 'orderConfirmationModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = '<div style="background:white;border-radius:20px;padding:32px 24px;max-width:360px;width:90%;text-align:center;">' +
      '<div style="font-size:56px;">✅</div>' +
      '<h3>Pesanan Berhasil!</h3>' +
      '<p>Klik tombol di bawah untuk mengirim bukti transfer via WhatsApp.</p>' +
      '<button id="sendWaBtn" style="background:#25D366;color:white;border:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;width:100%;">💬 Kirim Bukti ke WhatsApp</button>' +
      '<button id="backToMenuFromConfirm" style="background:none;border:1px solid #ddd;color:#666;padding:10px;border-radius:8px;margin-top:8px;width:100%;">Kembali ke Menu</button>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('sendWaBtn').addEventListener('click', function() {
      if (waMessage) openWhatsApp(SYSTEM.WA_NUMBER, waMessage);
      modal.remove();
    });
    document.getElementById('backToMenuFromConfirm').addEventListener('click', function() {
      modal.remove();
      const pm = document.getElementById('paymentModal');
      if (pm) { pm.classList.remove('active'); document.body.style.overflow = ''; }
    });
    setTimeout(() => { if (modal) modal.remove(); }, 15000);
  }

  // ============================================================
  // TELEGRAM NOTIFICATION LENGKAP
  // ============================================================
  async function sendTelegramNotification(orderId, imageUrl) {
    try {
      const client = await getSupabase();
      if (!client) return false;
      const summary = getCartSummaryCached();
      const shippingData = calculateShippingCost();
      const itemsList = summary.items.map(item =>
        '• ' + item.name + (item.spice ? ' (Level ' + item.spice + ' 🌶️)' : '') + ' x' + item.qty + ' — ' + fmt(item.lineTotal)
      ).join('\n');
      const payload = {
        orderId: orderId,
        imageUrl: imageUrl,
        customerName: state.customerName || 'Guest',
        customerPhone: state.customerPhone || '',
        customerAddress: state.customerAddress || '',
        deliveryTime: document.getElementById('deliveryTime')?.value || '-',
        shippingProvider: state.shippingProvider === 'rujakco' ? 'Rujak.Co (Lalamove)' : state.shippingProvider === 'paxel' ? 'Paxel' : 'Kurir Saya',
        vehicleType: state.vehicleType === 'motor' ? 'Motor' : 'Mobil',
        isPriority: state.isPriority ? 'Ya (+Rp8.000)' : 'Tidak',
        items: itemsList,
        orderNotes: state.orderNotes || '-',
        isGift: state.isGift ? 'Ya' : 'Tidak',
        giftSender: state.giftSender || '-',
        giftMessage: state.giftMessage || '-',
        subtotal: fmt(summary.subtotal),
        discount: summary.discount > 0 ? fmt(summary.discount) : 'Rp0',
        shippingCost: shippingData ? fmt(shippingData.shippingCost) : 'Rp0',
        total: shippingData ? fmt(shippingData.total) : fmt(summary.subtotal)
      };
      const { data, error } = await client.functions.invoke('telegram-notify', { body: payload });
      if (error) { console.error('[RujakCo] Telegram error:', error); return false; }
      return true;
    } catch (err) { console.error('[RujakCo] Telegram error:', err); return false; }
  }

  // ============================================================
  // saveOrderToDatabase, recordOrderHistory, dll (sama)
  // ============================================================

  // ============================================================
  // BIND EVENTS (termasuk kecamatan autocomplete, dll)
  // ============================================================
  function bindEvents() {
    // ... (kode event binding dari versi sebelumnya, dengan tambahan:)

    // District autocomplete
    const districtInput = document.getElementById('districtInput');
    if (districtInput) {
      districtInput.addEventListener('change', onDistrictSelected);
      districtInput.addEventListener('input', function() {
        // Hapus selectedDistrict jika user mengubah input
        state.selectedDistrict = '';
        state.userDistance = null;
        // Sembunyikan shipping section sementara
        document.getElementById('shippingSection').style.display = 'none';
      });
    }

    // Ketika kurir berubah, hitung ulang ongkir
    document.querySelectorAll('.ship-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.shippingProvider = this.dataset.provider;
        document.getElementById('rujakcoOptions').style.display = state.shippingProvider === 'rujakco' ? 'block' : 'none';
        if (state.selectedDistrict || state.userDistance !== null) {
          updateShippingDisplay();
        }
        invalidateCache();
        renderMiniCart();
      });
    });

    // Kendaraan & prioritas juga panggil updateShippingDisplay
    document.querySelectorAll('.veh-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.vehicleType = this.dataset.vehicle;
        if (state.selectedDistrict || state.userDistance !== null) {
          updateShippingDisplay();
        }
        invalidateCache();
        renderMiniCart();
      });
    });

    document.getElementById('priorityToggleMini').addEventListener('change', function() {
      state.isPriority = this.checked;
      if (state.selectedDistrict || state.userDistance !== null) {
        updateShippingDisplay();
      }
      invalidateCache();
      renderMiniCart();
    });

    // Tombol bayar
    document.addEventListener('click', function(e) {
      if (e.target.closest('#btnOpenPayment')) {
        // Validasi kecamatan dulu
        if (!state.selectedDistrict && state.shippingProvider !== 'pembeli') {
          showToast('📍 Pilih kecamatan terlebih dahulu.');
          document.getElementById('districtInput').focus();
          return;
        }
        handleCheckout();
      }
    });

    // ... sisanya event binding dari versi sebelumnya
  }

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
    loadCart(); loadCustomerData(); updateStoreStatus();
    try { const s = localStorage.getItem('rujak_cart_minimized'); if (s !== null) state.isCartMinimized = s === 'true'; } catch(_) {}
    updateDistrictAutocomplete();
    updateUI();
    // Jangan panggil detectLocation() di sini, karena ongkir dihitung dari input kecamatan
    bindEvents();
    initAIChat();
    if (typeof lucide !== 'undefined' && lucide.createIcons) { lucide.createIcons(); }
    else { const int = setInterval(function() { if (typeof lucide !== 'undefined' && lucide.createIcons) { lucide.createIcons(); clearInterval(int); } }, 100); }
  }

  // ============================================================
  // EXPOSE API
  // ============================================================
  window.RujakCoAPI = {
    invalidateCache, updateUI, renderCart, renderMiniCart, getCartSummaryCached, showToast, clearCart,
    getState: function() { return state; }
  };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();