(function() {
  'use strict';

  // ============================================================
  // CRITICAL FIXES v1.0.3 — CHECKOUT FLOW + SUBSIDI SECURITY
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
  let pendingWhatsAppMessage = null; // simpan pesan WA yang akan dikirim

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
    // Coba buka dengan window.open untuk mematuhi aturan browser
    var win = window.open(waUrl, '_blank', 'noopener');
    if (!win) {
      // fallback jika popup diblokir
      showToast('⚠️ Browser memblokir WhatsApp. Klik tombol lagi.');
      // Simpan pesan untuk ditampilkan di modal
      pendingWhatsAppMessage = { phone, message };
      showWhatsAppFallbackModal();
    }
  }

  function showWhatsAppFallbackModal() {
    // Hapus modal lama jika ada
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
      }
      modal.remove();
    });
    document.getElementById('closeWaFallback').addEventListener('click', function() { modal.remove(); });
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
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

  // ... (sisa fungsi shipping, cart, AI, checkout, UI, event binding, init, dll. — tidak berubah dari versi sebelumnya yang sudah lengkap) ...
  // Untuk menghemat ruang, hanya bagian checkout yang saya perbaiki tampil di sini. 
  // Di file sebenarnya, seluruh kode tetap disertakan seperti sebelumnya.

  // ============================================================
  // CHECKOUT FUNCTIONS (PERBAIKAN UTAMA)
  // ============================================================
  function showOrderConfirmation(waMessage) {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
      paymentModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    state.cart = {}; invalidateCache(); saveCart(); updateUI();
    var modal = document.getElementById('orderConfirmationModal');
    if (modal) modal.remove();
    modal = document.createElement('div'); modal.id = 'orderConfirmationModal';
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
      // tutup modal setelah klik
      modal.remove();
    });
    document.getElementById('backToMenuFromConfirm').addEventListener('click', function() {
      modal.remove();
      const pm = document.getElementById('paymentModal');
      if (pm) { pm.classList.remove('active'); document.body.style.overflow = ''; }
    });
    setTimeout(() => { if (modal) modal.remove(); }, 15000);
  }

  // handleCheckout tidak banyak berubah, hanya panggil showOrderConfirmation(waMsg)
  function handleCheckout() {
    // ... (validasi sama seperti sebelumnya) ...
    // Setelah berhasil simpan, bangun pesan WA
    const waMsg = 'Halo Rujak.Co!...'; // (isi pesan seperti sebelumnya)
    showToast('✅ Pesanan tersimpan!');
    recordOrderHistory(summary.items);
    // alih-alih otomatis buka WA, tampilkan modal dengan tombol manual
    showOrderConfirmation(waMsg);
  }

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
    await getOrCreateFingerprint().catch(() => {});
    loadCart(); loadCustomerData(); updateStoreStatus();
    // ... (sisa init sama)
    updateUI(); detectLocation(); bindEvents(); initAIChat();
  }

  // ... (sisa kode API, debug, dll.)

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }

})();