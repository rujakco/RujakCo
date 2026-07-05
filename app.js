(function() {
  'use strict';

  // ============================================================
  // CRITICAL FIXES v1.0.4 — CHECKOUT WA FIX + SUBSIDI SECURITY
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

  var RujakStorage = {
    get: function(key) {
      try {
        var data = localStorage.getItem('rujakco_subsidi_' + key + '_fallback');
        return data ? JSON.parse(data) : null;
      } catch(e) { return null; }
    },
    set: function(key, value) {
      try {
        localStorage.setItem('rujakco_subsidi_' + key + '_fallback', JSON.stringify({ value: value, timestamp: Date.now() }));
        return true;
      } catch(e) { return false; }
    },
    remove: function(key) {
      try { localStorage.removeItem('rujakco_subsidi_' + key + '_fallback'); return true; } catch(e) { return false; }
    }
  };

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
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original Rujak.Co.', price:28000, cat:'classic', tags:['Pilihan Klasik','5 Buah'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Segar & Autentik', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp', isHidden:false },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk pengalaman rasa yang lebih menyatu.', price:26000, cat:'classic', tags:['Renyah','Serut'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Merah'], flavor:'Renyah Segar', flavorTag:'Renyah', defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp', isHidden:false },
    { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah pilihan dengan sambal mete premium.', price:40000, cat:'signature', tags:['Mete Premium','Bestseller'], badge:'Koleksi Favorit', badgeColor:'red', container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Mete Premium (1 Cup)', buah:['Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Premium', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp', isHidden:false },
    { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah untuk dua hingga tiga orang.', price:48000, cat:'signature', tags:['Porsi Besar','Sharing'], badge:'Untuk Dibagi Bersama', badgeColor:'red', container:'Thinwall Jumbo 1000ml (PP Food Grade)', size:'Porsi Sharing', sambal:'Sambal Mete Premium (2 Cup)', buah:['Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Extra Pedas', flavorTag:null, defaultSpice:4, portion:'2-3 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp', isHidden:false },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi premium dengan Shine Muscat.', price:85000, cat:'reserve', tags:['Eksklusif','Shine Muscat'], badge:'Reserve Collection', badgeColor:'gold', container:'Thinwall Jumbo 1000ml + Paper Bag', size:'Porsi Premium', sambal:'Sambal Mete Premium (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Eksklusif & Premium', flavorTag:null, defaultSpice:3, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:false },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Sajian kebersamaan dalam tampah bambu.', price:200000, cat:'reserve', tags:['Tampah','Pre-Order'], badge:'Untuk 8-10 Orang', badgeColor:'gold', container:'Tampah Bambu Ø40cm + Kardus + Wrap', size:'Porsi Besar', sambal:'Varian Original & Mete (4 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi Merah'], flavor:'Kemegahan Berbagai Rasa', flavorTag:null, defaultSpice:3, portion:'8-10 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp', isHidden:false },
    { id:'p_vip', name:'Mahkota VIP', desc:'Menu rahasia eksklusif dengan komposisi premium.', price:125000, cat:'reserve', tags:['Eksklusif','VIP Only'], badge:'Menu Rahasia', badgeColor:'gold', container:'Box Premium + Paper Bag', size:'Porsi Eksklusif', sambal:'Sambal Mete Premium Spesial (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Harum Manis','Nanas Madu','Bengkoang','Strawberry'], flavor:'Premium & Misterius', flavorTag:'Limited', defaultSpice:2, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:true }
  ];

  const ADDONS = [
    { id:'a_sambal1', name:'Sambal Original', price:8000, icon:'flame', iconColor:'text-red-500', desc:'Warisan rasa klasik.' },
    { id:'a_sambal2', name:'Sambal Mete Premium', price:12000, icon:'flame', iconColor:'text-red-600', desc:'Lebih gurih dan kaya rasa.' },
    { id:'a_extra_jambu', name:'Extra Jambu Kristal', price:10000, icon:'apple', iconColor:'text-green-500', desc:'Tambahan jambu kristal segar' },
    { id:'a_extra_muscat', name:'Extra Shine Muscat', price:15000, icon:'grape', iconColor:'text-purple-500', desc:'Tambahan anggur Shine Muscat impor' }
  ];

  const SYSTEM = {
    DISCOUNT_THRESHOLD: 100000, WA_NUMBER: '6289677161680', TOAST_DURATION: 3000,
    MAX_DISTANCE: 50, DEFAULT_DISTANCE: 2,
    SUBSIDY_TIER1: 75000, SUBSIDY_TIER2: 125000, SUBSIDY_TIER3: 200000,
    SUBSIDY_AMOUNT1: 5000, SUBSIDY_AMOUNT2: 10000,
    PRIORITY_SURCHARGE: 8000, MAX_SUBSIDY: 30000,
    STORE_LAT: -6.2347, STORE_LNG: 106.9895,
    LOCATION_TIMEOUT: 12000, SUBSIDY_DURATION_MINUTES: 30,
    SUBSIDY_COOLDOWN_HOURS: 2
  };

  const DISTRICT_MAP = {
    'bekasi barat':3, 'bekasi timur':5, 'bekasi selatan':7, 'bekasi utara':8,
    'rawalumbu':6, 'jatiasih':9, 'pondokgede':12, 'cikarang':18,
    'jakarta pusat':18, 'jakarta selatan':20, 'jakarta timur':15,
    'jakarta barat':22, 'jakarta utara':25, 'depok':28,
    'bogor':35, 'tangerang':30, 'tangerang selatan':27
  };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null,
    isPriority: false, orderNotes: '', isCartMinimized: false,
    customerName: '', customerPhone: '', customerAddress: '',
    isGift: false, giftSender: '', giftMessage: '',
    useManualDistrict: false, selectedDistrict: '', hasShared: false,
    shippingProvider: 'rujakco', vehicleType: 'motor', currentStep: 1, currentSurge: null
  };

  let addToCartLocked = false, checkoutLocked = false, locationFallbackShown = false;
  let cachedSummary = null, cachedSummaryKey = '';
  let storeStatusInterval = null, checkoutTimer = null, toastTimer = null;
  let pendingWhatsAppMessage = null;

  // ============================================================
  // DEVICE FINGERPRINT & SUBSIDI SECURITY
  // ============================================================
  let deviceFingerprint = null;
  const FINGERPRINT_STORAGE_PREFIX = 'rujakco_fp_';

  function getFingerprintStorageKey(key) {
    return FINGERPRINT_STORAGE_PREFIX + key + '_' + (deviceFingerprint || 'fallback');
  }

  function setFingerprintData(key, value) {
    try {
      var k = getFingerprintStorageKey(key);
      localStorage.setItem(k, JSON.stringify({ value: value, timestamp: Date.now() }));
    } catch(e) {}
  }

  function getFingerprintData(key) {
    try {
      var k = getFingerprintStorageKey(key);
      var raw = localStorage.getItem(k);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  }

  async function getOrCreateFingerprint() {
    if (deviceFingerprint) return deviceFingerprint;
    try {
      if (window.FingerprintJS && FingerprintJS.load) {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        deviceFingerprint = result.visitorId;
      } else {
        deviceFingerprint = btoa((screen.width||'') + '|' + (screen.height||'') + '|' + (navigator.userAgent||'') + '|' + (Intl.DateTimeFormat().resolvedOptions().timeZone||'')).substring(0,32);
      }
    } catch(e) {
      deviceFingerprint = btoa((screen.width||'') + '|' + (screen.height||'') + '|' + (navigator.userAgent||'')).substring(0,32);
    }
    return deviceFingerprint;
  }

  async function canClaimSubsidy() {
    await getOrCreateFingerprint();
    var cooldown = getFingerprintData('cooldown');
    if (!cooldown) return true;
    return Date.now() >= cooldown.value;
  }

  async function claimSubsidy() {
    if (!(await canClaimSubsidy())) {
      showToast('⏳ Kamu sudah klaim subsidi sebelumnya. Coba lagi nanti.');
      return false;
    }
    var expiry = Date.now() + (SYSTEM.SUBSIDY_DURATION_MINUTES * 60 * 1000);
    try {
      localStorage.setItem('rujak_subsidi_claimed', 'true');
      localStorage.setItem('rujak_subsidi_expiry', expiry.toString());
      setFingerprintData('cooldown', Date.now() + (SYSTEM.SUBSIDY_COOLDOWN_HOURS * 60 * 60 * 1000));
      setFingerprintData('subsidi_claimed', true);
      setFingerprintData('subsidi_expiry', expiry);
      invalidateCache();
      updateUI();
      var st = document.getElementById('subsidyStatusText');
      if (st) {
        st.textContent = '✅ Subsidi ongkir sudah diklaim!';
        st.style.color = '#0a3d2a';
      }
      var ci = document.getElementById('subsidyCheck');
      if (ci) ci.style.display = 'inline-block';
      showToast('✅ Subsidi ongkir berhasil diklaim!');
      return true;
    } catch(e) {
      showToast('⚠️ Gagal menyimpan subsidi');
      return false;
    }
  }

  function isSubsidyActive() {
    var claimed = localStorage.getItem('rujak_subsidi_claimed');
    var expiry = localStorage.getItem('rujak_subsidi_expiry');
    if (claimed && expiry && Date.now() < parseInt(expiry)) return true;
    var fpClaim = getFingerprintData('subsidi_claimed');
    var fpExpiry = getFingerprintData('subsidi_expiry');
    if (fpClaim && fpClaim.value && fpExpiry && Date.now() < fpExpiry.value) {
      localStorage.setItem('rujak_subsidi_claimed', 'true');
      localStorage.setItem('rujak_subsidi_expiry', fpExpiry.value.toString());
      return true;
    }
    localStorage.removeItem('rujak_subsidi_claimed');
    localStorage.removeItem('rujak_subsidi_expiry');
    return false;
  }

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  function escapeHTML(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function debounce(fn, delay) { let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); }; }

  function openWhatsApp(phone, message) {
    const waUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
    var win = window.open(waUrl, '_blank', 'noopener');
    if (!win) {
      showToast('⚠️ Browser memblokir WhatsApp. Klik tombol lagi.');
      pendingWhatsAppMessage = { phone, message };
      showWhatsAppFallbackModal();
    } else {
      pendingWhatsAppMessage = null;
    }
  }

  function showWhatsAppFallbackModal() {
    var oldModal = document.getElementById('whatsappFallbackModal');
    if (oldModal) oldModal.remove();
    var modal = document.createElement('div');
    modal.id = 'whatsappFallbackModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:100000;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = '<div style="background:white;border-radius:20px;padding:24px;max-width:360px;width:90%;text-align:center;">' +
      '<div style="font-size:40px;margin-bottom:8px;">📲</div>' +
      '<h3>Buka WhatsApp</h3>' +
      '<p style="font-size:13px;color:var(--gray-500);">Browser memblokir pembukaan otomatis. Klik tombol di bawah untuk mengirim pesan.</p>' +
      '<button id="openWaManualBtn" style="background:#25D366;color:white;border:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;width:100%;">Buka WhatsApp</button>' +
      '<button id="closeWaFallback" style="background:none;border:1px solid #ddd;color:#666;padding:10px;border-radius:8px;margin-top:8px;width:100%;">Tutup</button>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('openWaManualBtn').addEventListener('click', function() {
      if (pendingWhatsAppMessage) {
        var waUrl = 'https://wa.me/' + pendingWhatsAppMessage.phone + '?text=' + encodeURIComponent(pendingWhatsAppMessage.message);
        window.open(waUrl, '_blank');
        pendingWhatsAppMessage = null;
      }
      modal.remove();
    });
    document.getElementById('closeWaFallback').addEventListener('click', function() { modal.remove(); pendingWhatsAppMessage = null; });
    modal.addEventListener('click', function(e) { if (e.target === modal) { modal.remove(); pendingWhatsAppMessage = null; } });
  }

  function shareToWhatsApp() {
    const shareText = 'Hai! Cobain Rujak.Co yuk — rujak premium dengan buah segar pilihan dan sambal khas Indonesia.';
    const shareUrl = window.location.href;
    if (navigator.share) { navigator.share({ title: 'Rujak.Co', text: shareText, url: shareUrl }).catch(() => { copyShareLink(shareText, shareUrl); }); }
    else { copyShareLink(shareText, shareUrl); }
  }

  function copyShareLink(text, url) {
    navigator.clipboard.writeText(text + '\n' + url).then(() => { showToast('📋 Link berhasil disalin!'); }).catch(() => { showToast('📋 Gagal menyalin: ' + url); });
  }

  function showConfirmModal(title, message, onConfirm) {
    let modal = document.getElementById('customConfirmModal');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'customConfirmModal';
      modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:100002;background:rgba(0,0,0,0.6);align-items:center;justify-content:center;';
      modal.innerHTML = '<div style="background:white;border-radius:16px;padding:24px 20px;max-width:340px;width:90%;text-align:center;"><h4 class="confirm-title" style="font-size:16px;font-weight:700;margin:0 0 8px;"></h4><p class="confirm-message" style="font-size:13px;color:#666;margin:0 0 20px;"></p><div style="display:flex;gap:10px;"><button class="confirm-btn-no" style="flex:1;padding:12px;border-radius:10px;border:1px solid #ddd;background:white;font-size:13px;font-weight:600;cursor:pointer;">Batal</button><button class="confirm-btn-yes" style="flex:1;padding:12px;border-radius:10px;border:none;background:#D62828;color:white;font-size:13px;font-weight:600;cursor:pointer;">Ya, Kosongkan</button></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });
      modal.querySelector('.confirm-btn-no').addEventListener('click', function() { modal.style.display = 'none'; });
    }
    modal.querySelector('.confirm-title').textContent = title;
    modal.querySelector('.confirm-message').textContent = message;
    modal.querySelector('.confirm-btn-yes').onclick = function() { modal.style.display = 'none'; if (onConfirm) onConfirm(); };
    modal.style.display = 'flex';
  }

  function showToast(msg) {
    const el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove('show'); }, SYSTEM.TOAST_DURATION);
  }

  function lockAddToCart() { addToCartLocked = true; setTimeout(() => { addToCartLocked = false; }, 300); }

  // ============================================================
  // SHIPPING FUNCTIONS
  // ============================================================
  function calculateSubsidy(subtotal, shippingZone, rawShippingCost) {
    if (shippingZone === 'E' || rawShippingCost === null || rawShippingCost === undefined) return 0;
    if (!isSubsidyActive()) return 0;
    let subsidy = 0;
    if (subtotal >= SYSTEM.SUBSIDY_TIER3 && ['A','B','C','D'].includes(shippingZone)) { subsidy = rawShippingCost; }
    else if (subtotal >= SYSTEM.SUBSIDY_TIER2) { subsidy = SYSTEM.SUBSIDY_AMOUNT2; }
    else if (subtotal >= SYSTEM.SUBSIDY_TIER1) { subsidy = SYSTEM.SUBSIDY_AMOUNT1; }
    if (subsidy > SYSTEM.MAX_SUBSIDY) subsidy = SYSTEM.MAX_SUBSIDY;
    return subsidy;
  }

  function calculateLalamoveCost(distance, vehicleType) {
    const dist = Math.ceil(distance);
    if (vehicleType === 'motor') { if (dist <= 3) return 8000; if (dist <= 25) return 8000 + ((dist - 3) * 2000); return 8000 + (22 * 2000) + ((dist - 25) * 2400); }
    if (vehicleType === 'mobil') { if (dist <= 3) return 24000; if (dist <= 15) return 24000 + ((dist - 3) * 4500); return 24000 + (12 * 4500) + ((dist - 15) * 5000); }
    return 0;
  }

  function getZoneLabel(distance) { if (distance <= 5) return 'Zona A (0-5 km)'; if (distance <= 10) return 'Zona B (5-10 km)'; if (distance <= 15) return 'Zona C (10-15 km)'; if (distance <= 20) return 'Zona D (15-20 km)'; return 'Zona E (>20 km)'; }
  function isPeakHour() { const now = new Date(); const hour = now.getHours(); const day = now.getDay(); if (day === 0 || day === 6) return (hour >= 11 && hour <= 13); return (hour >= 11 && hour <= 13) || (hour >= 16 && hour <= 19); }
  function getSurgeMultiplier() { if (!isPeakHour()) { state.currentSurge = null; return 1.0; } if (state.currentSurge) return state.currentSurge; state.currentSurge = 1.3; return state.currentSurge; }

  function calculateShipping(distance, priority) {
    if (state.shippingProvider === 'pembeli') { return { cost: 0, label: 'Kurir Saya', distance: distance, zone: null, surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 }; }
    const rawDistance = (distance === null || distance === undefined || isNaN(distance)) ? SYSTEM.DEFAULT_DISTANCE : distance;
    if (rawDistance > SYSTEM.MAX_DISTANCE) { return { cost: null, label: 'Admin Konfirmasi', distance: rawDistance, zone: 'E', surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 }; }
    const surgeMultiplier = getSurgeMultiplier(); const isSurge = surgeMultiplier > 1.0;
    const lalamoveCost = calculateLalamoveCost(rawDistance, state.vehicleType); const surgedCost = Math.round(lalamoveCost * surgeMultiplier);
    const priorityCost = priority ? SYSTEM.PRIORITY_SURCHARGE : 0; const totalCost = surgedCost + priorityCost;
    const zoneLabel = getZoneLabel(rawDistance); const surgeLabel = isSurge ? ' ⚡Jam Sibuk' : '';
    let zone = 'E'; if (rawDistance <= 20) { if (rawDistance <= 5) zone = 'A'; else if (rawDistance <= 10) zone = 'B'; else if (rawDistance <= 15) zone = 'C'; else zone = 'D'; }
    return { cost: totalCost, lalamoveCost: surgedCost, baseLalamoveCost: lalamoveCost, surgeMultiplier: surgeMultiplier, isSurge: isSurge, label: zoneLabel + ' • ' + (state.vehicleType === 'motor' ? 'Motor' : 'Mobil') + (priority ? ' • Prioritas' : '') + surgeLabel, distance: rawDistance, zone: zone };
  }

  function getLocationFallback() {
    return new Promise((resolve) => {
      const cached = localStorage.getItem('rujak_location');
      if (cached) { try { const data = JSON.parse(cached); if (Date.now() - data.timestamp < 86400000 && data.distance < 900) return resolve(data); } catch(e) {} }
      const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 5000);
      fetch('https://ipapi.co/json/', { signal: controller.signal }).then(r => r.json()).then(data => {
        clearTimeout(timeoutId); const city = data.city || data.region || 'Lokasi'; let distance = 999; const c = city.toLowerCase();
        if (c.includes('bekasi')) distance = 2; else if (c.includes('jakarta')) distance = 15; else if (c.includes('depok')) distance = 20; else if (c.includes('tangerang')) distance = 25; else if (c.includes('bogor')) distance = 30;
        const result = { city: city, distance: distance, timestamp: Date.now() };
        try { localStorage.setItem('rujak_location', JSON.stringify(result)); } catch(e) {}
        resolve(result);
      }).catch(() => { clearTimeout(timeoutId); resolve({ city: 'Lokasi Tidak Diketahui', distance: 999 }); });
    });
  }

  function updateShippingUI(distance, isPriority) {
    const shipping = calculateShipping(distance, isPriority);
    const distEl = document.getElementById('shippingDistance'); if (distEl) distEl.textContent = '~' + Math.ceil(distance) + ' km';
    const costEl = document.getElementById('shippingCost'); const outEl = document.getElementById('outOfRange');
    if (shipping.zone === 'E') { if (costEl) { costEl.textContent = 'Konfirmasi'; costEl.style.color = 'var(--red)'; } if (outEl) outEl.style.display = 'block'; }
    else if (state.shippingProvider === 'pembeli') { if (costEl) { costEl.textContent = 'Gratis'; costEl.style.color = 'var(--green)'; } if (outEl) outEl.style.display = 'none'; }
    else { if (costEl) { costEl.textContent = shipping.cost ? fmt(shipping.cost) : 'Gratis'; costEl.style.color = 'var(--red)'; } if (outEl) outEl.style.display = 'none'; }
    if (document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart();
    invalidateCache();
  }

  // ============================================================
  // CART FUNCTIONS
  // ============================================================
  function loadCart() { try { const s = localStorage.getItem('rujak_cart'); if (s) { const p = JSON.parse(s); if (typeof p === 'object' && p !== null) state.cart = p; } } catch (_) { state.cart = {}; } }
  function saveCart() {
    try { var tk = '__rujak_test__'; localStorage.setItem(tk, '1'); localStorage.removeItem(tk); } catch(e) { try { localStorage.removeItem('rujak_order_history'); localStorage.removeItem('rujak_location'); } catch(e2) {} }
    try { localStorage.setItem('rujak_cart', JSON.stringify(state.cart)); } catch(e) { ErrorLogger.log('saveCart', e); }
  }
  function getItemById(id) { let item = PRODUCTS.find(p => p.id === id); if (item) return item; const sm = id.match(/^(.+)_spice(\d+)$/); if (sm) { item = PRODUCTS.find(p => p.id === sm[1]); if (item) return item; } return ADDONS.find(a => a.id === id) || null; }

  function getCartSummary() {
    const items = []; let subtotal = 0, totalQty = 0; const keysToDelete = [];
    Object.keys(state.cart).forEach(id => { const entry = state.cart[id]; const item = getItemById(id); if (item && entry && entry.qty > 0) { const lt = item.price * entry.qty; subtotal += lt; totalQty += entry.qty; items.push({ cartId: id, id: id, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice || null, lineTotal: lt }); } else { keysToDelete.push(id); } });
    keysToDelete.forEach(id => delete state.cart[id]);
    const discount = calculateDiscount(subtotal); const distance = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
    const shipping = calculateShipping(distance, state.isPriority); const rawShippingCost = shipping.cost;
    const shippingSubsidy = calculateSubsidy(subtotal, shipping.zone, rawShippingCost);
    const shippingCost = state.shippingProvider === 'pembeli' ? 0 : (rawShippingCost === null || rawShippingCost === undefined ? 0 : Math.max(0, rawShippingCost - shippingSubsidy));
    const total = subtotal - discount + shippingCost;
    return { items, totalQty, subtotal, discount, shippingCost, shippingSubsidy, rawShippingCost, lalamoveCost: shipping.lalamoveCost, baseLalamoveCost: shipping.baseLalamoveCost, surgeMultiplier: shipping.surgeMultiplier, isSurge: shipping.isSurge, shippingLabel: shipping.label, shippingDistance: shipping.distance, shippingZone: shipping.zone, total, isOutOfRange: shipping.zone === 'E', shippingProvider: state.shippingProvider, vehicleType: state.vehicleType };
  }

  function getCartSummaryCached() { const sc = localStorage.getItem('rujak_subsidi_claimed') || 'false'; const se = localStorage.getItem('rujak_subsidi_expiry') || '0'; const key = JSON.stringify(state.cart) + '|' + state.shippingProvider + '|' + state.userDistance + '|' + state.isPriority + '|' + state.hasShared + '|' + state.vehicleType + '|' + sc + '|' + se; if (cachedSummary && cachedSummaryKey === key) return cachedSummary; cachedSummary = getCartSummary(); cachedSummaryKey = key; return cachedSummary; }
  function invalidateCache() { cachedSummary = null; cachedSummaryKey = ''; }
  function calculateDiscount(subtotal) { let d = 0; if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) d += 5000; if (state.hasShared) d += 5000; return d; }

  function recordOrderHistory(orderItems) { try { let history = []; const raw = localStorage.getItem('rujak_order_history'); if (raw) history = JSON.parse(raw); orderItems.forEach(item => { const baseId = item.cartId ? item.cartId.split('_spice')[0] : null; if (baseId) { const product = PRODUCTS.find(p => p.id === baseId); if (product) history.push(baseId); } }); if (history.length > 50) history = history.slice(-50); localStorage.setItem('rujak_order_history', JSON.stringify(history)); } catch (_) {} }

  function saveCustomerData() { try { localStorage.setItem('rujak_customer', JSON.stringify({ name: state.customerName, phone: state.customerPhone, address: state.customerAddress, isGift: state.isGift, giftSender: state.giftSender, giftMessage: state.giftMessage, hasShared: state.hasShared, shippingProvider: state.shippingProvider, vehicleType: state.vehicleType })); localStorage.setItem('rujak_has_shared', state.hasShared ? 'true' : 'false'); } catch(_) {} }

  function loadCustomerData() { try { const raw = localStorage.getItem('rujak_customer'); if (raw) { const data = JSON.parse(raw); state.customerName = data.name || ''; state.customerPhone = data.phone || ''; state.customerAddress = data.address || ''; state.isGift = data.isGift || false; state.giftSender = data.giftSender || ''; state.giftMessage = data.giftMessage || ''; state.hasShared = data.hasShared || false; if (data.shippingProvider) state.shippingProvider = data.shippingProvider; if (data.vehicleType) state.vehicleType = data.vehicleType; } const shared = localStorage.getItem('rujak_has_shared'); if (shared === 'true') state.hasShared = true; } catch(_) {} }

  function clearCart() { if (Object.keys(state.cart).length === 0) { showToast('🧹 Keranjang sudah kosong'); return; } showConfirmModal('Kosongkan Keranjang?', 'Semua item akan dihapus.', function() { state.cart = {}; invalidateCache(); updateUI(); if (document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart(); showToast('🧹 Keranjang dikosongkan'); }); }

  // ============================================================
  // AI ENGINE
  // ============================================================
  function getAIRecommendation() { const hour = new Date().getHours(); const day = new Date().getDay(); const isWeekend = (day === 0 || day === 6); let timeBased = 'p_m1'; if (hour >= 6 && hour < 10) timeBased = 'p_m2'; else if (hour >= 10 && hour < 14) timeBased = 'p_m3'; else if (hour >= 14 && hour < 17) timeBased = 'p_m1'; else if (hour >= 17 && hour < 22) timeBased = 'p_m4'; let history = []; try { const raw = localStorage.getItem('rujak_order_history'); if (raw) history = JSON.parse(raw); } catch (_) {} let favorite = null; if (history.length > 0) { const freq = {}; history.forEach(id => { freq[id] = (freq[id] || 0) + 1; }); const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]); favorite = sorted[0] ? sorted[0][0] : null; } let rec = favorite || timeBased; if (isWeekend && hour >= 17) { const found = ['p_m4', 'p_m6'].find(id => PRODUCTS.find(prod => prod.id === id && !prod.isHidden)); if (found) rec = found; } const inCart = Object.keys(state.cart); let product = PRODUCTS.find(p => !p.isHidden && !inCart.some(key => key.startsWith(p.id)) && p.id === rec); if (!product) { product = PRODUCTS.filter(p => !p.isHidden && !inCart.some(key => key.startsWith(p.id))).sort((a, b) => a.price - b.price)[0] || null; } return product; }

  function renderAIRecommendation() { const container = document.getElementById('aiRecommendationContainer'); if (!container) return; const rec = getAIRecommendation(); if (!rec || Object.keys(state.cart).some(key => key.startsWith(rec.id))) { container.style.display = 'none'; return; } container.style.display = 'block'; container.innerHTML = '<div style="background:linear-gradient(135deg,#F8F5EE,#FFFDF5);border:1px solid #E8E0D0;border-radius:12px;padding:10px 14px;margin:0 20px 16px;display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">🤖</span><div style="flex:1;"><div style="font-size:9px;font-weight:600;color:#8B7355;">Rekomendasi AI</div><div style="font-weight:700;font-size:14px;color:#0F4D37;">' + escapeHTML(rec.name) + '</div><div style="font-size:11px;color:#666;">' + escapeHTML(rec.desc) + '</div></div><button onclick="window.addToCartAI(\'' + rec.id + '\')" style="background:#0F4D37;color:white;border:none;padding:4px 14px;border-radius:20px;font-weight:600;font-size:12px;cursor:pointer;">+ Tambah</button></div>'; }

  window.addToCartAI = function(productId) { if (addToCartLocked) return; lockAddToCart(); const product = PRODUCTS.find(p => p.id === productId); if (!product) return; const spice = product.defaultSpice || 3; const cartKey = productId + '_spice' + spice; const entry = state.cart[cartKey] || { qty: 0, spice: spice }; entry.qty += 1; entry.spice = spice; state.cart[cartKey] = entry; invalidateCache(); updateUI(); showToast('✅ ' + product.name + ' ditambahkan!'); const container = document.getElementById('aiRecommendationContainer'); if (container) container.style.display = 'none'; };

  const SEARCH_SYNONYMS = { 'asem': ['mangga muda','kedondong','asam','asam jawa'], 'manis': ['nanas','bengkoang','muscat','anggur','madu'], 'pedas': ['sambal','mete','cabe','sambel','spicy'], 'seger': ['jambu','kristal','air','dingin','fresh'], 'buah': ['mangga','nanas','jambu','bengkoang','kedondong','muscat','ubi','strawberry'], 'premium': ['gaco','mahkota','vip','reserve','eksklusif'], 'hemat': ['serut','segar','klasik','murah'], 'rame': ['rama','tampah','sharing','8-10','keluarga'], 'kriuk': ['renyah','serut','kristal','jambu'], 'gurih': ['mete','kacang','sambal','premium'] };

  function aiSearch(query) { if (!query || query.length < 2) return PRODUCTS.filter(p => !p.isHidden); const q = query.toLowerCase().trim(); const words = q.split(/\s+/); const synSets = []; words.forEach(word => { let found = false; for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) { if (key.includes(word) || word.includes(key) || synonyms.some(s => s.includes(word) || word.includes(s))) { synSets.push([key, ...synonyms]); found = true; break; } } if (!found) synSets.push([word]); }); const uniqueTerms = [...new Set(synSets.flat())]; const scored = PRODUCTS.filter(p => !p.isHidden).map(p => { let score = 0; const searchable = [p.name, p.desc, p.flavor, ...(p.tags || []), ...(p.buah || [])].join(' ').toLowerCase(); uniqueTerms.forEach(term => { if (searchable.includes(term)) score += 1; if (p.name.toLowerCase().includes(term)) score += 3; if ((p.tags || []).some(t => t.toLowerCase().includes(term))) score += 2; if ((p.buah || []).some(b => b.toLowerCase().includes(term))) score += 1.5; if (p.flavor.toLowerCase().includes(term)) score += 2; }); if (q.includes('classic') && p.cat === 'classic') score += 2; if (q.includes('signature') && p.cat === 'signature') score += 2; if (q.includes('reserve') && p.cat === 'reserve') score += 2; return { product: p, score }; }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.product); if (scored.length === 0) return PRODUCTS.filter(p => !p.isHidden && [p.name, p.desc, p.flavor, ...(p.tags || []), ...(p.buah || [])].join(' ').toLowerCase().includes(q)); return scored; }

  function renderAIUpsell(summary) {
    if (summary.items.length === 0) return '';
    const cartProductIds = summary.items.map(i => i.id);
    const available = PRODUCTS.filter(p => !p.isHidden && !cartProductIds.some(id => id.startsWith(p.id))).sort((a, b) => a.price - b.price);
    if (available.length === 0) return '';
    let bestScore = -1, bestProduct = null;
    available.forEach(p => {
      let score = 0;
      const priceRatio = p.price / summary.subtotal;
      if (priceRatio >= 0.3 && priceRatio <= 0.8) score += 3;
      else if (priceRatio > 0.8 && priceRatio <= 1.2) score += 2;
      const classicCount = summary.items.filter(i => { const prod = PRODUCTS.find(pp => pp.id === i.id); return prod && prod.cat === 'classic'; }).length;
      if (classicCount > 0 && p.cat === 'signature') score += 2;
      const hour = new Date().getHours();
      if (hour >= 11 && hour <= 14 && p.sambal && p.sambal.includes('Mete')) score += 1;
      const day = new Date().getDay();
      if ((day === 0 || day === 6) && p.portion && p.portion.includes('Orang')) score += 1;
      const sameCat = summary.items.some(i => { const prod = PRODUCTS.find(pp => pp.id === i.id); return prod && prod.cat === p.cat; });
      if (sameCat) score -= 1;
      if (score > bestScore) { bestScore = score; bestProduct = p; }
    });
    if (!bestProduct || bestScore < 0) return '';
    const addCost = bestProduct.price;
    const addCostText = fmt(addCost);
    return '<div style="background:linear-gradient(135deg,#FFF8E1,#FFECB3);border:1px solid #F4C430;border-radius:12px;padding:12px 14px;margin-top:10px;text-align:center;">' +
      '<div style="font-size:10px;font-weight:600;color:#92400e;">🧠 AI Suggestion</div>' +
      '<div style="font-size:14px;font-weight:700;color:#3d2b00;margin:2px 0;">Tambah ' + addCostText + ' → <strong>' + escapeHTML(bestProduct.name) + '</strong></div>' +
      '<div style="font-size:11px;color:#795548;margin-bottom:6px;">' + escapeHTML(bestProduct.desc) + '</div>' +
      '<button onclick="window.addToCartAI(\'' + bestProduct.id + '\')" style="background:#0F4D37;color:white;border:none;padding:6px 20px;border-radius:20px;font-weight:600;font-size:12px;cursor:pointer;">+ Tambah</button>' +
      '</div>';
  }

  function initAIChat() {
    const toggle = document.getElementById('aiChatToggle'), box = document.getElementById('aiChatBox'), close = document.getElementById('aiChatClose'), send = document.getElementById('aiChatSend'), input = document.getElementById('aiChatInput'), messages = document.getElementById('aiChatMessages');
    if (!toggle || !box) return; let isOpen = false;
    toggle.addEventListener('click', function() { isOpen = !isOpen; box.style.display = isOpen ? 'block' : 'none'; if (isOpen) { input.focus(); messages.scrollTop = messages.scrollHeight; } });
    close.addEventListener('click', function() { isOpen = false; box.style.display = 'none'; });
    function sendMessage() { const msg = input.value.trim(); if (!msg) return; const userDiv = document.createElement('div'); userDiv.style.cssText = 'text-align:right;margin-bottom:8px;'; const userSpan = document.createElement('span'); userSpan.style.cssText = 'background:#0F4D37;color:white;padding:8px 14px;border-radius:16px;display:inline-block;max-width:85%;'; userSpan.textContent = msg; userDiv.appendChild(userSpan); messages.appendChild(userDiv); input.value = ''; messages.scrollTop = messages.scrollHeight; setTimeout(function() { const reply = generateAIResponse(msg); const replyDiv = document.createElement('div'); replyDiv.style.marginBottom = '8px'; const replySpan = document.createElement('span'); replySpan.style.cssText = 'background:#E8F5E9;padding:8px 14px;border-radius:16px;display:inline-block;max-width:85%;'; replySpan.textContent = '🤖 ' + reply; replyDiv.appendChild(replySpan); messages.appendChild(replyDiv); messages.scrollTop = messages.scrollHeight; }, 400 + Math.random() * 300); }
    function generateAIResponse(msg) { const lower = msg.toLowerCase(); if (lower.includes('menu') || lower.includes('produk')) { const products = PRODUCTS.filter(p => !p.isHidden); return 'Ada ' + products.length + ' menu seru buat kamu: ' + products.map(p => p.name + ' (' + fmt(p.price) + ')').join(' • ') + '. Mau saya rekomendasiin salah satu?'; } if (lower.includes('rekomend') || lower.includes('saran')) { const rec = getAIRecommendation(); return rec ? rec.name + ' cocok banget buat kamu sekarang! Harganya ' + fmt(rec.price) + '.' : 'Coba Rujak Gaco, favorit banyak orang!'; } if (lower.includes('ongkir') || lower.includes('subsidi')) { const summary = getCartSummaryCached(); if (summary.isOutOfRange) return 'Duh, lokasi kamu di luar jangkauan pengiriman kami nih.'; return 'Ongkir kamu ' + fmt(summary.shippingCost) + ', udah termasuk subsidi kalau lagi berlaku ya!'; } if (lower.includes('pedas') || lower.includes('sambal')) return 'Ada Sambal Original (Rp8k) yang klasik, dan Sambal Mete Premium (Rp12k) yang lebih gurih. Pilih sesuai selera!'; if (lower.includes('harga')) return 'Range harga kami mulai dari Rp26.000 sampai Rp200.000, tinggal pilih sesuai porsi dan selera kamu!'; return 'Coba tanya soal menu, rekomendasi, ongkir, sambal, atau harga ya!'; }
    send.addEventListener('click', sendMessage); input.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });
  }

  // ============================================================
  // CHECKOUT FUNCTIONS (PERBAIKAN UTAMA)
  // ============================================================
  function showOrderConfirmation(waMessage) {
    // Tutup payment modal jika masih terbuka
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
      paymentModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    // Reset keranjang
    state.cart = {}; invalidateCache(); saveCart(); updateUI();
    // Hapus modal konfirmasi lama jika ada
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
      if (waMessage) {
        openWhatsApp(SYSTEM.WA_NUMBER, waMessage);
      }
      modal.remove();
    });

    document.getElementById('backToMenuFromConfirm').addEventListener('click', function() {
      modal.remove();
      const pm = document.getElementById('paymentModal');
      if (pm) { pm.classList.remove('active'); document.body.style.overflow = ''; }
    });

    // Fallback timeout
    setTimeout(() => { if (modal) modal.remove(); }, 15000);
  }

  function saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount, orderNumber) {
    return getSupabase().then(client => {
      if (!client) {
        checkoutLocked = false;
        if (checkoutTimer) { clearTimeout(checkoutTimer); checkoutTimer = null; }
        const payBtn = document.querySelector('[data-action="confirm-wa"]');
        if (payBtn) { payBtn.textContent = '💳 Kirim Bukti Transfer'; payBtn.disabled = false; }
        showToast('⚠️ Gagal terhubung. Coba lagi ya');
        return false;
      }
      try {
        const payload = {
          customer_name: (state.customerName || 'Guest').substring(0, 50),
          customer_phone: state.customerPhone || '',
          customer_address: (state.customerAddress || '').substring(0, 500),
          items: orderItems.map(item => { const rest = { ...item }; delete rest.cartId; return rest; }),
          subtotal, shipping_cost: shippingCost, discount, total,
          status: 'pending', is_gift: state.isGift || false,
          gift_sender: (state.giftSender || '').substring(0, 50),
          gift_message: (state.giftMessage || '').substring(0, 300),
          mission_shared: state.hasShared || false,
          shipping_provider: state.shippingProvider || 'rujakco',
          vehicle: state.vehicleType || 'motor',
          priority: state.isPriority || false
        };
        let retries = 0;
        const maxRetries = 2;
        function attemptInsert() {
          return client.from('orders').insert([payload]).then(result => {
            if (result.error) {
              if (retries < maxRetries) {
                retries++;
                return new Promise(r => setTimeout(r, 1000)).then(() => attemptInsert());
              }
              throw result.error;
            }
            return true;
          });
        }
        return attemptInsert().catch(err => { ErrorLogger.log('saveOrder', err); return false; });
      } catch(err) { ErrorLogger.log('saveOrder', err); return false; }
    });
  }

  function handleCheckout() {
    if (checkoutLocked) { showToast('⏳ Pesanan sedang diproses...'); return; }
    const lastOrderTime = localStorage.getItem('last_order');
    if (lastOrderTime && Date.now() - parseInt(lastOrderTime) < 30000) {
      showToast('⏳ Tunggu ' + Math.ceil((30000 - (Date.now() - parseInt(lastOrderTime))) / 1000) + ' detik');
      return;
    }
    const summary = getCartSummaryCached();
    if (summary.isOutOfRange && state.shippingProvider !== 'pembeli') {
      showToast('⚠️ Area ini belum kami jangkau');
      return;
    }
    const name = state.customerName.trim();
    const phone = state.customerPhone.trim();
    const address = state.customerAddress.trim();
    if (!name || name.length < 2) { showToast('❌ Nama harus diisi'); const el = document.getElementById('customerName'); if (el) el.focus(); return; }
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleanedPhone || !isValidPhone(cleanedPhone)) {
      showToast('❌ Format HP tidak valid. Contoh: 08123456789');
      const el = document.getElementById('customerPhone'); if (el) el.focus();
      return;
    }
    const normalizedPhone = normalizePhone(cleanedPhone);
    if (!address || address.length < 5) {
      showToast('❌ Alamat terlalu pendek. Tulis lebih lengkap ya');
      const el = document.getElementById('customerAddress'); if (el) el.focus();
      return;
    }
    if (summary.items.length === 0) { showToast('🛒 Keranjang masih kosong nih'); return; }

    state.customerPhone = normalizedPhone;
    state.customerName = name;
    state.customerAddress = address;
    localStorage.setItem('last_order', Date.now());
    checkoutLocked = true;

    const payBtn = document.querySelector('[data-action="confirm-wa"]');
    if (payBtn) { payBtn.textContent = '⏳ Menyimpan...'; payBtn.disabled = true; }
    if (checkoutTimer) clearTimeout(checkoutTimer);
    checkoutTimer = setTimeout(() => {
      checkoutLocked = false;
      if (payBtn) { payBtn.textContent = '💳 Kirim Bukti Transfer'; payBtn.disabled = false; }
      checkoutTimer = null;
    }, 5000);

    const orderNumber = 'RJ' + Date.now().toString(36).slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase();
    saveOrderToDatabase(summary.items, summary.total, summary.subtotal, summary.shippingCost, summary.discount, orderNumber).then(saved => {
      if (checkoutTimer) { clearTimeout(checkoutTimer); checkoutTimer = null; }
      checkoutLocked = false;
      if (payBtn) { payBtn.textContent = '💳 Kirim Bukti Transfer'; payBtn.disabled = false; }
      if (!saved) { showToast('⚠️ Gagal menyimpan. Coba lagi ya'); return; }
      showToast('✅ Pesanan tersimpan!');
      // Tutup payment modal
      const paymentModal = document.getElementById('paymentModal');
      if (paymentModal) { paymentModal.classList.remove('active'); document.body.style.overflow = ''; }
      recordOrderHistory(summary.items);
      // Siapkan pesan WA
      let waMsg = 'Halo Rujak.Co! Saya ingin memesan:\n\n';
      summary.items.forEach(item => {
        waMsg += '• ' + item.name + (item.spice ? ' (Level ' + item.spice + ')' : '') + ' (x' + item.qty + ') — ' + fmt(item.lineTotal) + '\n';
      });
      if (state.orderNotes) waMsg += '\n*Catatan:*\n' + state.orderNotes + '\n';
      if (state.isGift) {
        waMsg += '\n🎁 *KADO*\n';
        if (state.giftSender) waMsg += 'Dari: ' + state.giftSender + '\n';
        if (state.giftMessage) waMsg += 'Ucapan: ' + state.giftMessage + '\n';
      }
      waMsg += '\n*Data:*\nNama: ' + name + '\nNo. HP: ' + normalizedPhone + '\nAlamat: ' + address + '\n';
      waMsg += '\n*Total: ' + fmt(summary.total) + '*\n\n*Saya sudah transfer via QRIS, ini buktinya:*\n*(sertakan foto)*';
      if (waMsg.length > 3500) waMsg = waMsg.substring(0, 3500);
      // Tampilkan modal konfirmasi dengan tombol WA manual
      showOrderConfirmation(waMsg);
    }).catch(error => {
      ErrorLogger.log('handleCheckout', error);
      checkoutLocked = false;
      if (checkoutTimer) { clearTimeout(checkoutTimer); checkoutTimer = null; }
      if (payBtn) { payBtn.textContent = '💳 Kirim Bukti Transfer'; payBtn.disabled = false; }
      showToast('⚠️ Gagal menyimpan. Coba lagi ya');
    });
  }

  // ============================================================
  // UI FUNCTIONS (tidak berubah, sama seperti versi lengkap)
  // ============================================================
  // Saya tidak menampilkan ulang seluruh fungsi UI agar ringkas, 
  // tetapi di file sebenarnya seluruh fungsi renderMenu, renderAddons, renderCart, dll. harus ada.
  // ... (sisa fungsi UI, shipping, cart, AI, event binding, init)

  // Untuk memastikan kelengkapan, saya sarankan menggunakan file lengkap yang sebelumnya 
  // sudah diberikan, dan cukup menimpa bagian checkout & openWhatsApp dengan yang baru.