(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO v2.1 — FULL APP + SWIPE GESTURES + PWA READY
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

  // ============================================================
  // OPENROUTESERVICE (ORS) — jarak jalan raya akurat (opsional)
  // ============================================================
  // Daftar API key gratis di https://openrouteservice.org/dev/#/signup
  // (gratis, tanpa kartu kredit, ~2.000-2.500 request/hari, 40.000/bulan —
  // jauh lebih dari cukup untuk volume checkout Rujak.Co).
  //
  // Kalau ORS_API_KEY dikosongkan, sistem TIDAK memanggil API apa pun dan
  // otomatis jalan seperti biasa pakai estimasi DISTRICT_MAP/haversine —
  // tidak ada fitur yang rusak. Ini murni progressive enhancement: begitu
  // API key diisi, ongkir akan disempurnakan otomatis di background
  // (angka awal tetap dari estimasi supaya UI tidak nge-blank/nunggu).
  const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjAyYTNkOWQyZjk4ZDQ1YWQ5ZTk2Mzc1OWFkODA3Yzg5IiwiaCI6Im11cm11cjY0In0=';
  const ORS_BASE_URL = 'https://api.openrouteservice.org';
  const ORS_CACHE_KEY = 'rujak_road_distance_cache';
  const ORS_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 hari
  const ORS_TIMEOUT_MS = 6000;

  function loadRoadDistanceCache() {
    try { return JSON.parse(localStorage.getItem(ORS_CACHE_KEY) || '{}'); } catch (_) { return {}; }
  }
  function saveRoadDistanceCache(cache) {
    try { localStorage.setItem(ORS_CACHE_KEY, JSON.stringify(cache)); } catch (_) {}
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('ORS: request timeout')), timeoutMs))
    ]);
  }

  // Ambil jarak jalan raya (km) dari toko ke koordinat tujuan via ORS Directions API.
  // Return null kalau ORS_API_KEY kosong, API gagal, timeout, atau format respons tak dikenal —
  // pemanggil WAJIB fallback ke estimasi DISTRICT_MAP/haversine yang sudah ada saat null.
  async function getRoadDistanceKm(destLat, destLng, cacheKey) {
    if (!ORS_API_KEY) return null;
    const cache = loadRoadDistanceCache();
    if (cacheKey && cache[cacheKey] && (Date.now() - cache[cacheKey].ts) < ORS_CACHE_MAX_AGE_MS) {
      return cache[cacheKey].km;
    }
    try {
      const res = await fetchWithTimeout(ORS_BASE_URL + '/v2/directions/driving-car', {
        method: 'POST',
        headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: [[SYSTEM.STORE_LNG, SYSTEM.STORE_LAT], [destLng, destLat]] })
      }, ORS_TIMEOUT_MS);
      if (!res.ok) throw new Error('ORS directions HTTP ' + res.status);
      const data = await res.json();
      const meters = data && data.routes && data.routes[0] && data.routes[0].summary && data.routes[0].summary.distance;
      if (typeof meters !== 'number') throw new Error('ORS directions: format respons tak dikenal');
      const km = meters / 1000;
      if (cacheKey) { cache[cacheKey] = { km: km, ts: Date.now() }; saveRoadDistanceCache(cache); }
      return km;
    } catch (err) {
      ErrorLogger.log('ORS getRoadDistanceKm', err);
      return null;
    }
  }

  // Geocode nama kecamatan jadi koordinat via ORS Geocoding (Pelias) API.
  // Return null kalau gagal — pemanggil tetap pakai estimasi DISTRICT_MAP.
  async function geocodeDistrict(districtName) {
    if (!ORS_API_KEY) return null;
    try {
      const url = ORS_BASE_URL + '/geocode/search?api_key=' + encodeURIComponent(ORS_API_KEY) +
        '&text=' + encodeURIComponent(districtName + ', Indonesia') + '&boundary.country=ID&size=1';
      const res = await fetchWithTimeout(url, {}, ORS_TIMEOUT_MS);
      if (!res.ok) throw new Error('ORS geocode HTTP ' + res.status);
      const data = await res.json();
      const coords = data && data.features && data.features[0] && data.features[0].geometry && data.features[0].geometry.coordinates;
      if (!coords) return null;
      return { lat: coords[1], lng: coords[0] };
    } catch (err) {
      ErrorLogger.log('ORS geocodeDistrict', err);
      return null;
    }
  }

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
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original Rujak.Co.', price:35000, cat:'classic', tags:['Pilihan Klasik','5 Buah'], badge:null, badgeColor:null, container:'Thinwall 1000ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Segar & Autentik', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp', isHidden:false },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk pengalaman rasa yang lebih menyatu.', price:26000, cat:'classic', tags:['Renyah','Serut'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Merah'], flavor:'Renyah Segar', flavorTag:'Renyah', defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp', isHidden:false },
    { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah pilihan dengan sambal mete premium.', price:40000, cat:'signature', tags:['Mete Premium','Bestseller'], badge:'Koleksi Favorit', badgeColor:'red', container:'Thinwall 1000ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Mete Premium (1 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Premium', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp', isHidden:false },
    { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah untuk dua hingga tiga orang.', price:48000, cat:'signature', tags:['Porsi Besar','Sharing'], badge:'Untuk Dibagi Bersama', badgeColor:'red', container:'Thinwall Jumbo 1000ml (PP Food Grade)', size:'Porsi Sharing', sambal:'Sambal Mete Premium (2 Cup)', buah:['Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Extra Pedas', flavorTag:null, defaultSpice:4, portion:'2-3 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp', isHidden:false },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi premium dengan Shine Muscat.', price:85000, cat:'reserve', tags:['Eksklusif','Shine Muscat'], badge:'Reserve Collection', badgeColor:'gold', container:'Thinwall Jumbo 1000ml + Paper Bag', size:'Porsi Premium', sambal:'Sambal Mete Premium (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Eksklusif & Premium', flavorTag:null, defaultSpice:3, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:false },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Sajian kebersamaan dalam tampah bambu.', price:200000, cat:'reserve', tags:['Tampah','Pre-Order'], badge:'Untuk 8-10 Orang', badgeColor:'gold', container:'Tampah Bambu Ø40cm + Kardus + Wrap', size:'Porsi Besar', sambal:'Varian Original & Mete (4 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Mengkel','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi Merah'], flavor:'Kemegahan Berbagai Rasa', flavorTag:null, defaultSpice:3, portion:'8-10 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp', isHidden:false },
    { id:'p_vip', name:'Mahkota VIP', desc:'Menu rahasia eksklusif dengan komposisi premium.', price:125000, cat:'reserve', tags:['Eksklusif','VIP Only'], badge:'Menu Rahasia', badgeColor:'gold', container:'Box Premium + Paper Bag', size:'Porsi Eksklusif', sambal:'Sambal Mete Premium Spesial (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Harum Manis','Nanas Madu','Bengkoang','Strawberry'], flavor:'Premium & Misterius', flavorTag:'Limited', defaultSpice:2, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:true }
  ];

  const ADDONS = [
    { id:'a_sambal1', name:'Sambal Original', price:8000, icon:'flame', iconColor:'text-red-500', desc:'Warisan rasa klasik.' },
    { id:'a_sambal2', name:'Sambal Mete Premium', price:12000, icon:'flame', iconColor:'text-red-600', desc:'Lebih gurih dan kaya rasa.' },
    { id:'a_extra_jambu', name:'Extra Jambu Kristal', price:10000, icon:'apple', iconColor:'text-green-500', desc:'Tambahan jambu kristal segar' },
    { id:'a_extra_muscat', name:'Extra Shine Muscat', price:15000, icon:'grape', iconColor:'text-purple-500', desc:'Tambahan anggur Shine Muscat impor' }
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

  // Nilai jarak di bawah adalah ESTIMASI JARAK JALAN RAYA (bukan garis lurus).
  // Metodologi: baseline jarak garis lurus (haversine dari lokasi toko) dikalikan
  // faktor sirkuitas bertingkat berdasarkan jarak, dikalibrasi dari 2 titik acuan
  // riil (Bekasi-Pamulang ~30km lurus / ~37-40km jalan raya per Google Maps &
  // rome2rio; Bekasi-Bogor ~45km lurus / ~52km jalan raya per navi.id):
  //   ≤10 km  ×1.35   (jalan kota, banyak lampu merah, belum masuk tol)
  //   11-20km ×1.30
  //   21-35km ×1.25
  //   36-50km ×1.20
  //   >50 km  ×1.15   (didominasi tol, rute makin mendekati garis lurus)
  // Ini APROKSIMASI, bukan data resmi Lalamove/Paxel. Kalibrasi ulang berkala
  // dengan membandingkan ke tagihan kurir asli, terutama untuk kecamatan yang
  // sering dipesan atau yang aksesnya banyak berbelok/tanpa tol langsung.
  const DISTRICT_MAP = {
    'bekasi barat':4, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11,
    'rawalumbu':8, 'jatiasih':12, 'pondokgede':16, 'cikarang':23,
    'tambun':16, 'cibitung':20, 'karawang':44, 'cikampek':60,
    'serang':63, 'cilegon':80,
    'gambir':23, 'menteng':25, 'senen':23, 'cempaka putih':25,
    'kemayoran':26, 'sawah besar':26, 'taman sari':26, 'tanah abang':26,
    'setiabudi':25, 'tebet':26, 'pancoran':26, 'pasar minggu':28,
    'kebayoran lama':30, 'kebayoran baru':28, 'mampang prapatan':26,
    'jagakarsa':29, 'cilandak':30, 'pesanggrahan':31,
    'pulo gadung':26, 'jatinegara':25, 'duren sawit':23,
    'kramat jati':25, 'pasar rebo':26, 'ciracas':28,
    'cipayung':29, 'makasar':26, 'cakung':23,
    'tambora':28, 'grogol petamburan':29, 'palmerah':28,
    'kembangan':31, 'cengkareng':32, 'kalideres':34,
    'kemanggisan':28, 'kedoya':30, 'meruya':30,
    'penjaringan':35, 'pademangan':32, 'tanjung priok':34,
    'koja':35, 'cilincing':36, 'kelapa gading':30,
    'depok':35, 'beji':36, 'pancoran mas':36, 'cipayung depok':38,
    'sukmajaya':38, 'cilodong':39, 'limo':40, 'cinere':41,
    'cimanggis':34, 'tapos':36, 'sawangan':42, 'bojongsari':44,
    'tangerang':38, 'tangerang selatan':34, 'batuceper':39,
    'benda':40, 'cibodas':39, 'ciledug':35, 'cipondoh':38,
    'jatiuwung':41, 'karawaci':39, 'periuk':40, 'pinang':38,
    'serpong':40, 'serpong utara':41, 'pamulang':38,
    'pondok aren':36, 'ciputat':35, 'ciputat timur':36,
    'bogor':44, 'bogor barat':44, 'bogor selatan':43,
    'bogor timur':44, 'bogor utara':42, 'tanah sareal':43,
    'ciawi':48, 'cibinong':41, 'citeureup':44,
    'gunung putri':38, 'cileungsi':35, 'jonggol':50,
    'parung':46, 'dramaga':54
  };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null,
    isPriority: false, orderNotes: '', isCartMinimized: false,
    customerName: '', customerPhone: '', customerAddress: '',
    isGift: false, giftSender: '', giftMessage: '',
    useManualDistrict: false, selectedDistrict: '', hasShared: false,
    shippingProvider: 'rujakco', vehicleType: 'motor', currentStep: 1,
    shippingCalculated: false
  };

  let addToCartLocked = false, checkoutLocked = false, locationFallbackShown = false;
  let cachedSummary = null, cachedSummaryKey = '';
  let storeStatusInterval = null, toastTimer = null;
  let pendingWhatsAppMessage = null;

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  function escapeHTML(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function debounce(fn, delay) { let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); }; }

  function openCustomSelect(title, options, onSelect) {
    const backdrop = document.createElement('div');
    backdrop.className = 'select-backdrop';
    document.body.appendChild(backdrop);
    const modal = document.createElement('div');
    modal.className = 'select-modal';
    modal.innerHTML = `<h3>${title}</h3>` + options.map(opt => `<div class="select-option" data-value="${opt.value}">${opt.label}</div>`).join('');
    document.body.appendChild(modal);
    const closeModal = () => {
      modal.classList.remove('active');
      backdrop.classList.remove('active');
      setTimeout(() => { modal.remove(); backdrop.remove(); }, 300);
    };
    modal.querySelectorAll('.select-option').forEach(opt => {
      opt.addEventListener('click', function() {
        onSelect(this.dataset.value, this.textContent);
        closeModal();
      });
    });
    backdrop.addEventListener('click', closeModal);
    requestAnimationFrame(() => { backdrop.classList.add('active'); modal.classList.add('active'); });
  }

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
  // COST CALCULATIONS (PAXEL FLAT RATE + PACKING FEE)
  // ============================================================
  function calculatePaxelCost(distance, vehicleType, totalQty) {
    const qty = totalQty || 1;
    const numLargeBoxes = Math.floor(qty / 2);
    const numMediumBoxes = qty % 2;
    const totalPackages = numLargeBoxes + numMediumBoxes;
    const costLarge = numLargeBoxes * 25000;
    const costMedium = numMediumBoxes * 20000;
    const packagingFee = totalPackages * 3000;
    return costLarge + costMedium + packagingFee;
  }

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

  function isPeakHour() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    if (day === 0 || day === 6) return (hour >= 11 && hour <= 13);
    return (hour >= 11 && hour <= 13) || (hour >= 16 && hour <= 19);
  }

  function getSurgeMultiplier() {
    if (!isPeakHour()) { state.currentSurge = null; return 1.0; }
    if (state.currentSurge) return state.currentSurge;
    state.currentSurge = 1.3;
    return state.currentSurge;
  }

  function calculateShipping(distance, priority, totalQty) {
    if (state.shippingProvider === 'pembeli') {
      return { cost: 0, label: 'Kurir Pembeli', distance: distance, zone: null, surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
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
      const qty = totalQty || 1;
      const paxelCost = calculatePaxelCost(rawDistance, state.vehicleType, qty);
      totalCost = paxelCost;
      lalamoveCost = paxelCost;
      baseLalamoveCost = paxelCost;
      zoneLabel = 'Paxel Same Day ' + getZoneLabel(rawDistance);
      surgeLabel = '';
      if (rawDistance <= 20) {
        if (rawDistance <= 5) zone = 'A';
        else if (rawDistance <= 10) zone = 'B';
        else if (rawDistance <= 15) zone = 'C';
        else zone = 'D';
      }
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
      }
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

  function updateShippingUI(distance, isPriority) {
    const summary = getCartSummaryCached();
    const currentQty = summary.totalQty > 0 ? summary.totalQty : 1;
    const shipping = calculateShipping(distance, isPriority, currentQty);
    const distEl = document.getElementById('shippingDistance'); if (distEl) distEl.textContent = '~' + Math.ceil(distance) + ' km';
    const costEl = document.getElementById('shippingCost'); const outEl = document.getElementById('outOfRange');
    if (shipping.zone === 'E') { if (costEl) { costEl.textContent = 'Konfirmasi'; costEl.style.color = 'var(--red)'; } if (outEl) outEl.style.display = 'block'; }
    else if (state.shippingProvider === 'pembeli') { if (costEl) { costEl.textContent = 'Gratis'; costEl.style.color = 'var(--green)'; } if (outEl) outEl.style.display = 'none'; }
    else { if (costEl) { costEl.textContent = shipping.cost ? fmt(shipping.cost) : 'Gratis'; costEl.style.color = 'var(--red)'; } if (outEl) outEl.style.display = 'none'; }
    if (document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart();
    invalidateCache();
  }

  // Menjaga tampilan ongkir (bottom bar ringkas + breakdown mini cart) selalu sinkron.
  // Dipanggil setiap kali ada perubahan yang memengaruhi ongkir: qty item, provider,
  // kendaraan, atau toggle prioritas — bukan cuma saat lokasi/kecamatan berubah.
  function refreshShippingDisplays() {
    const dist = (state.selectedDistrict && DISTRICT_MAP[state.selectedDistrict])
      ? DISTRICT_MAP[state.selectedDistrict]
      : state.userDistance;
    if (dist !== null && dist !== undefined) {
      updateShippingUI(dist, state.isPriority);
    }
    if (document.getElementById('miniCartModal')?.classList.contains('active')) {
      updateShippingDisplay();
    }
  }

  // ============================================================
  // CART FUNCTIONS
  // ============================================================
  function loadCart() {
    try { const s = localStorage.getItem('rujak_cart'); if (s) { const p = JSON.parse(s); if (typeof p === 'object' && p !== null) state.cart = p; } } catch (_) { state.cart = {}; }
  }

  function saveCart() {
    try { localStorage.setItem('rujak_cart', JSON.stringify(state.cart)); } catch(e) { ErrorLogger.log('saveCart', e); }
  }

  function getItemById(id) {
    let item = PRODUCTS.find(p => p.id === id);
    if (item) return item;
    const sm = id.match(/^(.+)_spice(\d+)$/);
    if (sm) { item = PRODUCTS.find(p => p.id === sm[1]); if (item) return item; }
    return ADDONS.find(a => a.id === id) || null;
  }

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

  function recordOrderHistory(orderItems) {
    try {
      let history = [];
      const raw = localStorage.getItem('rujak_order_history');
      if (raw) history = JSON.parse(raw);
      orderItems.forEach(item => {
        const baseId = item.cartId ? item.cartId.split('_spice')[0] : null;
        if (baseId) {
          const product = PRODUCTS.find(p => p.id === baseId);
          if (product) history.push(baseId);
        }
      });
      if (history.length > 50) history = history.slice(-50);
      localStorage.setItem('rujak_order_history', JSON.stringify(history));
    } catch (_) {}
  }

  function saveCustomerData() {
    try {
      localStorage.setItem('rujak_customer', JSON.stringify({
        name: state.customerName, phone: state.customerPhone, address: state.customerAddress,
        isGift: state.isGift, giftSender: state.giftSender, giftMessage: state.giftMessage,
        hasShared: state.hasShared, shippingProvider: state.shippingProvider, vehicleType: state.vehicleType,
        selectedDistrict: state.selectedDistrict, useManualDistrict: state.useManualDistrict
      }));
      localStorage.setItem('rujak_has_shared', state.hasShared ? 'true' : 'false');
    } catch(_) {}
  }

  function loadCustomerData() {
    try {
      const raw = localStorage.getItem('rujak_customer');
      if (raw) {
        const data = JSON.parse(raw);
        state.customerName = data.name || '';
        state.customerPhone = data.phone || '';
        state.customerAddress = data.address || '';
        state.isGift = data.isGift || false;
        state.giftSender = data.giftSender || '';
        state.giftMessage = data.giftMessage || '';
        state.hasShared = data.hasShared || false;
        if (data.shippingProvider) state.shippingProvider = data.shippingProvider;
        if (data.vehicleType) state.vehicleType = data.vehicleType;
        if (data.selectedDistrict) state.selectedDistrict = data.selectedDistrict;
        if (data.useManualDistrict !== undefined) state.useManualDistrict = data.useManualDistrict;
      }
      const shared = localStorage.getItem('rujak_has_shared');
      if (shared === 'true') state.hasShared = true;
    } catch(_) {}
  }

  function clearCart() {
    if (Object.keys(state.cart).length === 0) { showToast('🧹 Keranjang sudah kosong'); return; }
    showConfirmModal('Kosongkan Keranjang?', 'Semua item akan dihapus.', function() {
      state.cart = {};
      invalidateCache();
      updateUI();
      if (document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart();
      showToast('🧹 Keranjang dikosongkan');
    });
  }

  function calculateShippingCost() {
    const summary = getCartSummaryCached();
    if (!state.selectedDistrict && state.userDistance === null) return null;
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
  // AI ENGINE
  // ============================================================
  function getAIRecommendation() {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = (day === 0 || day === 6);
    let timeBased = 'p_m1';
    if (hour >= 6 && hour < 10) timeBased = 'p_m2';
    else if (hour >= 10 && hour < 14) timeBased = 'p_m3';
    else if (hour >= 14 && hour < 17) timeBased = 'p_m1';
    else if (hour >= 17 && hour < 22) timeBased = 'p_m4';
    let history = [];
    try { const raw = localStorage.getItem('rujak_order_history'); if (raw) history = JSON.parse(raw); } catch (_) {}
    let favorite = null;
    if (history.length > 0) {
      const freq = {};
      history.forEach(id => { freq[id] = (freq[id] || 0) + 1; });
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      favorite = sorted[0] ? sorted[0][0] : null;
    }
    let rec = favorite || timeBased;
    if (isWeekend && hour >= 17) {
      const found = ['p_m4', 'p_m6'].find(id => PRODUCTS.find(prod => prod.id === id && !prod.isHidden));
      if (found) rec = found;
    }
    const inCart = Object.keys(state.cart);
    let product = PRODUCTS.find(p => !p.isHidden && !inCart.some(key => key.startsWith(p.id)) && p.id === rec);
    if (!product) {
      product = PRODUCTS.filter(p => !p.isHidden && !inCart.some(key => key.startsWith(p.id))).sort((a, b) => a.price - b.price)[0] || null;
    }
    return product;
  }

  function renderAIRecommendation() {
    const container = document.getElementById('aiRecommendationContainer');
    if (!container) return;
    const rec = getAIRecommendation();
    if (!rec || Object.keys(state.cart).some(key => key.startsWith(rec.id))) {
      container.style.display = 'none';
      return;
    }
    const distance = state.selectedDistrict && DISTRICT_MAP[state.selectedDistrict]
      ? DISTRICT_MAP[state.selectedDistrict]
      : (state.userDistance || SYSTEM.DEFAULT_DISTANCE);
    const shipping = calculateShipping(distance, false, 1);
    const shippingCost = shipping.cost || 0;
    let extraHTML = '';
    if (shippingCost > 30000 && rec.price < 50000) {
      extraHTML = '<div style="font-size:9px;color:#D62828;font-weight:700;margin-top:2px;">🔥 Kombinasi ini lebih hemat ongkir!</div>';
    }
    container.style.display = 'block';
    container.innerHTML = '<div style="background:linear-gradient(135deg,#F8F5EE,#FFFDF5);border:1px solid #E8E0D0;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px;">' +
      '<span style="font-size:20px;">🤖</span>' +
      '<div style="flex:1;">' +
      '<div style="font-size:9px;font-weight:600;color:#8B7355;">Rekomendasi AI</div>' +
      '<div style="font-weight:700;font-size:14px;color:#0F4D37;">' + escapeHTML(rec.name) + '</div>' +
      '<div style="font-size:11px;color:#666;">' + escapeHTML(rec.desc) + '</div>' +
      extraHTML +
      '</div>' +
      '<button onclick="window.addToCartAI(\'' + rec.id + '\')" class="btn-add-unified">+ Tambah</button>' +
      '</div>';
  }

  window.addToCartAI = function(productId) {
    if (addToCartLocked) return;
    lockAddToCart();
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const spice = product.defaultSpice || 3;
    const cartKey = productId + '_spice' + spice;
    const entry = state.cart[cartKey] || { qty: 0, spice: spice };
    entry.qty += 1;
    entry.spice = spice;
    state.cart[cartKey] = entry;
    invalidateCache();
    updateUI();
    showToast('✅ ' + product.name + ' ditambahkan!');
    const container = document.getElementById('aiRecommendationContainer');
    if (container) container.style.display = 'none';
  };

  const SEARCH_SYNONYMS = {
    'asem': ['mangga muda','mangga mengkel','kedondong','asam','asam jawa'],
    'manis': ['nanas','bengkoang','muscat','anggur','madu'],
    'pedas': ['sambal','mete','cabe','sambel','spicy'],
    'seger': ['jambu','kristal','air','dingin','fresh'],
    'buah': ['mangga','nanas','jambu','bengkoang','kedondong','muscat','ubi','strawberry'],
    'premium': ['gaco','mahkota','vip','reserve','eksklusif'],
    'hemat': ['serut','segar','klasik','murah'],
    'rame': ['rama','tampah','sharing','8-10','keluarga'],
    'kriuk': ['renyah','serut','kristal','jambu'],
    'gurih': ['mete','kacang','sambal','premium']
  };

  function aiSearch(query) {
    if (!query || query.length < 2) return PRODUCTS.filter(p => !p.isHidden);
    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/);
    const synSets = [];
    words.forEach(word => {
      let found = false;
      for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
        if (key.includes(word) || word.includes(key) || synonyms.some(s => s.includes(word) || word.includes(s))) {
          synSets.push([key, ...synonyms]);
          found = true;
          break;
        }
      }
      if (!found) synSets.push([word]);
    });
    const uniqueTerms = [...new Set(synSets.flat())];
    const scored = PRODUCTS.filter(p => !p.isHidden).map(p => {
      let score = 0;
      const searchable = [p.name, p.desc, p.flavor, ...(p.tags || []), ...(p.buah || [])].join(' ').toLowerCase();
      uniqueTerms.forEach(term => {
        if (searchable.includes(term)) score += 1;
        if (p.name.toLowerCase().includes(term)) score += 3;
        if ((p.tags || []).some(t => t.toLowerCase().includes(term))) score += 2;
        if ((p.buah || []).some(b => b.toLowerCase().includes(term))) score += 1.5;
        if (p.flavor.toLowerCase().includes(term)) score += 2;
      });
      if (q.includes('classic') && p.cat === 'classic') score += 2;
      if (q.includes('signature') && p.cat === 'signature') score += 2;
      if (q.includes('reserve') && p.cat === 'reserve') score += 2;
      return { product: p, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.product);
    if (scored.length === 0) {
      return PRODUCTS.filter(p => !p.isHidden && [p.name, p.desc, p.flavor, ...(p.tags || []), ...(p.buah || [])].join(' ').toLowerCase().includes(q));
    }
    return scored;
  }

  function renderAIUpsell(summary) {
    if (summary.items.length === 0) return '';
    if (!summary.subtotal || summary.subtotal === 0) return '';
    const cartProductIds = summary.items.map(i => i.id);
    const available = PRODUCTS.filter(p => !p.isHidden && !cartProductIds.some(id => id.startsWith(p.id))).sort((a, b) => a.price - b.price);
    if (available.length === 0) return '';

    let shippingCost = 0;
    const shippingData = calculateShippingCost();
    if (shippingData) shippingCost = shippingData.shippingCost;

    const shippingRatio = shippingCost / summary.subtotal;
    if (shippingRatio > 0.5 && summary.subtotal < 75000) {
      const cheapest = available[0];
      if (cheapest) {
        const needed = 75000 - summary.subtotal;
        const qtyNeeded = Math.ceil(needed / cheapest.price);
        const totalAdd = cheapest.price * qtyNeeded;
        return '<div style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:12px;margin-top:10px;text-align:center;">' +
          '<div style="font-size:13px;font-weight:700;color:#92400E;">💡 Ongkir lebih mahal dari produk!</div>' +
          '<div style="font-size:12px;color:#78350F;margin:4px 0;">Tambah <strong>' + qtyNeeded + 'x ' + cheapest.name + '</strong> (' + fmt(totalAdd) + ') → dapat potongan Rp5.000 & ongkir lebih masuk akal!</div>' +
          '<button onclick="window.addToCartAI(\'' + cheapest.id + '\')" class="btn-add-unified" style="margin-top:6px;">+ Tambah Sekarang</button>' +
          '</div>';
      }
    }

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
    const addCostText = fmt(bestProduct.price);
    return '<div style="background:linear-gradient(135deg,#FFF8E1,#FFECB3);border:1px solid #F4C430;border-radius:12px;padding:12px 14px;margin-top:10px;text-align:center;">' +
      '<div style="font-size:10px;font-weight:600;color:#92400e;">🧠 AI Suggestion</div>' +
      '<div style="font-size:14px;font-weight:700;color:#3d2b00;margin:2px 0;">Tambah ' + addCostText + ' → <strong>' + escapeHTML(bestProduct.name) + '</strong></div>' +
      '<div style="font-size:11px;color:#795548;margin-bottom:6px;">' + escapeHTML(bestProduct.desc) + '</div>' +
      '<button onclick="window.addToCartAI(\'' + bestProduct.id + '\')" class="btn-add-unified">+ Tambah</button>' +
      '</div>';
  }

  function initAIChat() {
    const toggle = document.getElementById('aiChatToggle'), box = document.getElementById('aiChatBox'), close = document.getElementById('aiChatClose'), send = document.getElementById('aiChatSend'), input = document.getElementById('aiChatInput'), messages = document.getElementById('aiChatMessages');
    if (!toggle || !box) return;
    let isOpen = false;
    toggle.addEventListener('click', function() {
      isOpen = !isOpen;
      box.style.display = isOpen ? 'block' : 'none';
      if (isOpen) { input.focus(); messages.scrollTop = messages.scrollHeight; }
    });
    close.addEventListener('click', function() { isOpen = false; box.style.display = 'none'; });
    function sendMessage() {
      const msg = input.value.trim();
      if (!msg) return;
      const userDiv = document.createElement('div');
      userDiv.style.cssText = 'text-align:right;margin-bottom:8px;';
      const userSpan = document.createElement('span');
      userSpan.style.cssText = 'background:#0F4D37;color:white;padding:8px 14px;border-radius:16px;display:inline-block;max-width:85%;';
      userSpan.textContent = msg;
      userDiv.appendChild(userSpan);
      messages.appendChild(userDiv);
      input.value = '';
      messages.scrollTop = messages.scrollHeight;
      setTimeout(function() {
        const reply = generateAIResponse(msg);
        const replyDiv = document.createElement('div');
        replyDiv.style.marginBottom = '8px';
        const replySpan = document.createElement('span');
        replySpan.style.cssText = 'background:#E8F5E9;padding:8px 14px;border-radius:16px;display:inline-block;max-width:85%;';
        replySpan.textContent = '🤖 ' + reply;
        replyDiv.appendChild(replySpan);
        messages.appendChild(replyDiv);
        messages.scrollTop = messages.scrollHeight;
      }, 400 + Math.random() * 300);
    }
    function generateAIResponse(msg) {
      const lower = msg.toLowerCase();
      if (lower.includes('menu') || lower.includes('produk')) {
        const products = PRODUCTS.filter(p => !p.isHidden);
        return 'Ada ' + products.length + ' menu seru buat kamu: ' + products.map(p => p.name + ' (' + fmt(p.price) + ')').join(' • ') + '. Mau saya rekomendasiin salah satu?';
      }
      if (lower.includes('rekomend') || lower.includes('saran')) {
        const rec = getAIRecommendation();
        return rec ? rec.name + ' cocok banget buat kamu sekarang! Harganya ' + fmt(rec.price) + '.' : 'Coba Rujak Gaco, favorit banyak orang!';
      }
      if (lower.includes('ongkir') || lower.includes('subsidi')) {
        const summary = getCartSummaryCached();
        if (summary.isOutOfRange) return 'Duh, lokasi kamu di luar jangkauan pengiriman kami nih.';
        return 'Ongkir kamu ' + fmt(summary.shippingCost) + '.';
      }
      if (lower.includes('pedas') || lower.includes('sambal')) return 'Ada Sambal Original (Rp8k) yang klasik, dan Sambal Mete Premium (Rp12k) yang lebih gurih. Pilih sesuai selera!';
      if (lower.includes('harga')) return 'Range harga kami mulai dari Rp26.000 sampai Rp200.000, tinggal pilih sesuai porsi dan selera kamu!';
      return 'Coba tanya soal menu, rekomendasi, ongkir, sambal, atau harga ya!';
    }
    send.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });
  }

  // ============================================================
  // TELEGRAM & CHECKOUT SECURE LOGIC
  // ============================================================
  async function sendTelegramNotification(orderId, fullAddress) {
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
        customerName: state.customerName || 'Guest',
        customerPhone: state.customerPhone || '',
        customerAddress: fullAddress || state.customerAddress || '',
        deliveryTime: document.getElementById('deliveryTime')?.value || '-',
        shippingProvider: state.shippingProvider === 'rujakco' ? 'Rujak.Co (Lalamove)' : state.shippingProvider === 'paxel' ? 'Paxel Same Day' : 'Kurir Pembeli',
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
  // VALIDASI FORM DENGAN PESAN ERROR DI BAWAH INPUT
  // ============================================================
  function showFieldError(inputEl, message) {
    const existingErr = inputEl.parentElement.querySelector('.field-error');
    if (existingErr) existingErr.remove();
    inputEl.classList.add('input-error');
    const errDiv = document.createElement('div');
    errDiv.className = 'field-error';
    errDiv.style.cssText = 'color:var(--red); font-size:11px; margin-top:4px;';
    errDiv.textContent = message;
    inputEl.parentElement.appendChild(errDiv);
  }
  function clearFieldError(inputEl) {
    inputEl.classList.remove('input-error');
    const err = inputEl.parentElement.querySelector('.field-error');
    if (err) err.remove();
  }

  function validateOrderForm() {
    const nameEl = document.getElementById('customerName');
    const phoneEl = document.getElementById('customerPhone');
    const addressEl = document.getElementById('customerAddress');
    const districtEl = document.getElementById('districtInput');
    const timeEl = document.getElementById('deliveryTime');
    const timeTrigger = document.getElementById('deliveryTimeTrigger');

    let valid = true;

    const name = nameEl.value.trim();
    if (!name || name.length < 2) { showFieldError(nameEl, 'Nama minimal 2 karakter'); valid = false; }
    else clearFieldError(nameEl);

    const phone = phoneEl.value.trim();
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleaned || !isValidPhone(cleaned)) { showFieldError(phoneEl, 'Format HP tidak valid (08xx)'); valid = false; }
    else clearFieldError(phoneEl);

    const rawAddress = addressEl.value.trim();
    const baseAddress = rawAddress.replace(/(?:,\s*)?Kec\..*$/gi, '').trim();
    if (!baseAddress || baseAddress.length < 5) { showFieldError(addressEl, 'Alamat terlalu pendek'); valid = false; }
    else clearFieldError(addressEl);

    if (!state.selectedDistrict && state.shippingProvider !== 'pembeli') { showFieldError(districtEl, 'Pilih kecamatan'); valid = false; }
    else clearFieldError(districtEl);

    const deliveryTime = timeEl.value;
    if (!deliveryTime || (deliveryTime === 'Same Day (Besok)' && state.shippingProvider !== 'paxel')) {
      if (state.shippingProvider !== 'paxel') { showFieldError(timeTrigger || timeEl, 'Pilih jam pengiriman'); valid = false; }
      else clearFieldError(timeTrigger || timeEl);
    } else clearFieldError(timeTrigger || timeEl);

    if (!valid) {
      showToast('❌ Mohon periksa kembali isian bertanda merah');
      return null;
    }
    return { name, phone: normalizePhone(cleaned), baseAddress, district: state.selectedDistrict, deliveryTime };
  }

  function handleCheckout() {
    if (checkoutLocked) return;
    const validData = validateOrderForm();
    if (!validData) {
      const pmt = document.getElementById('paymentModal');
      if (pmt) { pmt.classList.remove('active'); document.body.style.overflow = ''; }
      return;
    }

    const summary = getCartSummaryCached();
    const shippingData = calculateShippingCost();
    if (!shippingData) { showToast('⚠️ Hitung ongkir gagal. Pilih kecamatan.'); return; }
    if (shippingData.isOutOfRange && state.shippingProvider !== 'pembeli') {
      showToast('⚠️ Area ini di luar jangkauan. Pilih "Kurir Pembeli" atau hubungi admin.'); return;
    }

    const notes = document.getElementById('orderNotes').value.trim();
    const displayDistrict = validData.district ? validData.district.replace(/\b\w/g, l => l.toUpperCase()) : '';
    const fullAddress = validData.baseAddress + (displayDistrict ? ', Kec. ' + displayDistrict : '');

    state.customerName = validData.name;
    state.customerPhone = validData.phone;
    state.customerAddress = validData.baseAddress;
    state.orderNotes = notes;
    saveCustomerData();

    checkoutLocked = true;
    const payBtn = document.querySelector('[data-action="confirm-wa"]');
    if (payBtn) { payBtn.textContent = '⏳ Menyiapkan Pesanan...'; payBtn.disabled = true; }

    const orderNumber = 'RJ' + Date.now().toString(36).slice(-6) + Math.random().toString(36).substring(2,5).toUpperCase();

    let waMsg = '🍜 *PESANAN RUJAK.CO*\n\n';
    waMsg += '📋 *Order:* ' + orderNumber + '\n';
    waMsg += '👤 *Nama:* ' + validData.name + '\n';
    waMsg += '📱 *HP:* ' + validData.phone + '\n';
    waMsg += '📍 *Alamat:* ' + fullAddress + '\n';
    waMsg += '📅 *Jam Kirim:* ' + validData.deliveryTime + '\n';
    waMsg += '🚚 *Kurir:* ' + (state.shippingProvider === 'rujakco' ? 'Rujak.Co (Lalamove)' : state.shippingProvider === 'paxel' ? 'Paxel Same Day' : 'Kurir Pembeli') + '\n';
    waMsg += '🛵 *Kendaraan:* ' + (state.vehicleType === 'motor' ? 'Motor' : 'Mobil') + '\n';
    if (state.isPriority && state.shippingProvider !== 'paxel') waMsg += '⚡ *Prioritas:* Aktif (+Rp8.000)\n';
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

    getSupabase().then(client => {
      if (client) {
        const payload = {
          order_id: orderNumber,
          customer_name: validData.name.substring(0, 50),
          customer_phone: validData.phone,
          customer_address: fullAddress.substring(0, 500),
          items: summary.items.map(item => { const rest = { ...item }; delete rest.cartId; return rest; }),
          subtotal: summary.subtotal, shipping_cost: shippingData.shippingCost, discount: summary.discount, total: shippingData.total,
          status: 'pending', is_gift: state.isGift || false, gift_sender: (state.giftSender || '').substring(0, 50),
          gift_message: (state.giftMessage || '').substring(0, 300), mission_shared: state.hasShared || false,
          shipping_provider: state.shippingProvider || 'rujakco', vehicle: state.vehicleType || 'motor', priority: state.isPriority || false
        };
        client.from('orders').insert([payload]).then(({error}) => { if (error) ErrorLogger.log('Supabase Insert', error); });
        sendTelegramNotification(orderNumber, fullAddress);
      }
    }).catch(e => ErrorLogger.log('Supabase Connection', e));

    // TODO: Ganti dengan Edge Function untuk verifikasi server
    // fetch('/api/checkout', { method:'POST', body: JSON.stringify({ items: summary.items, customer: validData, district: state.selectedDistrict }) })

    setTimeout(() => {
      checkoutLocked = false;
      if (payBtn) { payBtn.textContent = '💳 Kirim Bukti Transfer'; payBtn.disabled = false; }
      const paymentModal = document.getElementById('paymentModal');
      if (paymentModal) { paymentModal.classList.remove('active'); document.body.style.overflow = ''; }
      recordOrderHistory(summary.items);
      showOrderConfirmation(waMsg.substring(0, 4000));
    }, 500);
  }

  function showOrderConfirmation(waMessage) {
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
    document.getElementById('backToMenuFromConfirm').addEventListener('click', function() { modal.remove(); });
  }

  // ============================================================
  // UI & RENDER FUNCTIONS (termasuk renderMenu, renderAddons, dll)
  // ============================================================
  function updateStoreStatus() {
    const el = document.getElementById('storeStatusText');
    if (!el) return;
    const now = new Date(), day = now.getDay(), timeInMinutes = now.getHours() * 60 + now.getMinutes();
    let isOpen = false, openTime = '10:00', dayName = 'Senin-Jumat';
    if (day >= 1 && day <= 5) { isOpen = timeInMinutes >= 600 && timeInMinutes < 1200; }
    else { isOpen = timeInMinutes >= 540 && timeInMinutes < 1080; openTime = '09:00'; dayName = 'Sabtu-Minggu'; }
    el.textContent = isOpen ? 'Buka' : 'Tutup';
    const dot = document.querySelector('.status-dot');
    if (dot) dot.style.background = isOpen ? '#4CAF50' : '#D62828';
    const container = document.getElementById('storeStatus');
    if (container) container.classList.toggle('closed', !isOpen);
    const banner = document.getElementById('storeStatusBanner'), bannerText = document.getElementById('storeStatusBannerText');
    if (banner && bannerText) {
      if (isOpen) { banner.style.display = 'none'; }
      else { banner.style.display = 'block'; bannerText.textContent = '🕐 Toko tutup. Buka ' + dayName + ' pukul ' + openTime + ' WIB.'; }
    }
  }

  function updateFloatingButton() {
    const btn = document.getElementById('floatingCartBtn'), badge = document.getElementById('floatingBadge'), bar = document.getElementById('bottom-bar'), summary = getCartSummaryCached();
    if (!btn) return;
    const barVisible = bar?.classList.contains('visible');
    if (state.isCartMinimized && summary.totalQty > 0 && !barVisible) { btn.style.display = 'flex'; if (badge) badge.textContent = summary.totalQty; }
    else if (summary.totalQty === 0) { btn.style.display = 'none'; }
    else { btn.style.display = barVisible ? 'none' : 'flex'; if (badge && !barVisible) badge.textContent = summary.totalQty; }
  }

  function renderMenu() {
    const container = document.getElementById('menuList'), empty = document.getElementById('emptyState'), skeleton = document.getElementById('skeletonContainer');
    if (skeleton) skeleton.style.display = 'none';
    if (!container) return;
    container.style.display = 'block';
    if (state.activeFilter === 'addon') { container.innerHTML = ''; if (empty) empty.style.display = 'none'; return; }
    let filtered = state.searchQuery && state.searchQuery.length >= 2 ? aiSearch(state.searchQuery) : PRODUCTS.filter(p => !p.isHidden);
    if (state.activeFilter !== 'all') filtered = filtered.filter(p => p.cat === state.activeFilter);
    if (!filtered.length) { if (empty) empty.style.display = 'block'; container.innerHTML = ''; return; }
    if (empty) empty.style.display = 'none';
    let html = '';
    filtered.forEach(p => {
      let qty = 0, firstCartKey = p.id;
      const cartKeyRegex = new RegExp('^' + p.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(_spice\\d+)?$');
      Object.keys(state.cart).forEach(k => { if (cartKeyRegex.test(k)) { qty += state.cart[k].qty; if (qty === state.cart[k].qty) firstCartKey = k; } });
      let displayName = p.name;
      if (state.searchQuery && state.searchQuery.length >= 2) {
        const q = state.searchQuery.toLowerCase(), nl = p.name.toLowerCase();
        if (nl.includes(q)) { const idx = nl.indexOf(q); displayName = p.name.substring(0, idx) + '<span class="ai-search-highlight">' + p.name.substring(idx, idx + q.length) + '</span>' + p.name.substring(idx + q.length); }
      }
      const control = qty === 0 ? '<button type="button" class="add-btn btn-add-unified" data-action="open-modal" data-id="' + p.id + '"><i data-lucide="plus" class="w-4 h-4"></i></button>' :
        '<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="' + firstCartKey + '">−</button><span class="qty-num">' + qty + '</span><button type="button" class="qty-btn" data-action="increase" data-id="' + firstCartKey + '">+</button></div>';
      const badgeRight = p.badge ? '<span class="item-badge-right ' + p.badgeColor + '">' + escapeHTML(p.badge) + '</span>' : '';
      const flavorTag = p.flavorTag ? '<span class="item-flavor-tag">' + escapeHTML(p.flavorTag) + '</span>' : '';
      const defaultSpice = p.defaultSpice || 3;
      const spiceIcons = Array(5).fill(null).map((_, i) => i < defaultSpice ? '🌶️' : '<span style="opacity:0.25">🌶️</span>').join('');
      const buahChips = (p.buah || []).slice(0, 4).map(b => '<span class="item-buah-chip">' + escapeHTML(b) + '</span>').join('');
      const moreChips = (p.buah || []).length > 4 ? '<span class="item-buah-chip">+' + (p.buah.length - 4) + '</span>' : '';
      html += '<div class="menu-item" data-id="' + p.id + '"><div class="item-img-wrap"><img src="' + p.thumbnail + '" alt="' + escapeHTML(p.name) + '" loading="lazy" onerror="this.style.display=\'none\';var fb=document.createElement(\'div\');fb.style.cssText=\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e8efeb;color:#6B7280;font-size:12px;font-weight:600;text-align:center;padding:4px;\';fb.textContent=\'' + escapeHTML(p.name.substring(0,20)) + '\';this.parentElement.appendChild(fb);"></div><div class="item-body"><div class="item-name-row"><span class="item-name">' + displayName + '</span>' + badgeRight + '</div><div class="item-flavor-row"><span class="item-flavor">' + escapeHTML(p.flavor) + '</span>' + flavorTag + '</div><div class="item-spice" style="display:flex;align-items:center;gap:4px;font-size:11px;">' + spiceIcons + '</div><p class="item-desc">' + escapeHTML(p.desc) + '</p><div class="item-buah-chips">' + buahChips + moreChips + '</div><div class="item-footer"><div><span class="item-price">' + fmt(p.price) + '</span><span class="item-portion"> · ' + p.portion + '</span></div>' + control + '</div></div></div>';
    });
    container.innerHTML = html;
  }

  function renderAddons() {
    const container = document.getElementById('addonList');
    if (!container) return;
    const q = state.searchQuery.toLowerCase();
    const filtered = ADDONS.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    let html = '';
    filtered.forEach(a => {
      const entry = state.cart[a.id];
      const qty = entry ? entry.qty : 0;
      const control = qty === 0 ? '<button type="button" class="addon-add" data-action="add-addon" data-id="' + a.id + '"><i data-lucide="plus" class="w-4 h-4"></i></button>' :
        '<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="' + a.id + '">−</button><span class="qty-num">' + qty + '</span><button type="button" class="qty-btn" data-action="increase" data-id="' + a.id + '">+</button></div>';
      html += '<div class="addon-card"><div class="addon-icon ' + a.iconColor + '"><i data-lucide="' + a.icon + '" class="w-6 h-6"></i></div><div class="addon-name">' + escapeHTML(a.name) + '</div><div class="addon-desc">' + escapeHTML(a.desc) + '</div><div class="addon-footer"><span class="addon-price">' + fmt(a.price) + '</span>' + control + '</div></div>';
    });
    container.innerHTML = html;
    const header = document.getElementById('addonHeader'), divider = document.getElementById('addonDivider'), show = filtered.length > 0;
    if (header) header.style.display = show ? 'flex' : 'none';
    if (divider) divider.style.display = show ? 'block' : 'none';
  }

  function updateProgressBar(subtotal) {
    const container = document.getElementById('progressContainer');
    if (!container) return;
    if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) { container.style.display = 'none'; return; }
    const remaining = SYSTEM.DISCOUNT_THRESHOLD - subtotal;
    container.style.display = 'block';
    container.style.borderColor = 'rgba(15,77,55,.08)';
    container.style.background = 'white';
    const label = document.getElementById('progressLabel');
    if (label) label.textContent = 'Tambah ' + fmt(remaining) + ' lagi untuk potongan Rp5.000';
    const percentNum = Math.min(100, Math.round((subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
    const percent = document.getElementById('progressPercent');
    if (percent) percent.textContent = percentNum + '%';
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = percentNum + '%';
  }

  function updateMissionCheckboxes(subtotal) {
    const ms = document.getElementById('missionSpend');
    if (ms) ms.checked = subtotal >= SYSTEM.DISCOUNT_THRESHOLD;
    const cs = document.getElementById('checkShare');
    if (cs) cs.checked = state.hasShared;
  }

  function renderCart() {
    const summary = getCartSummaryCached();
    updateProgressBar(summary.subtotal);
    updateMissionCheckboxes(summary.subtotal);
    const bar = document.getElementById('bottom-bar'), dl = document.getElementById('discountLabel'), te = document.getElementById('cartTotalDisplay'), footer = document.querySelector('.footer-brand');
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

  function updateShippingDisplay() {
    const shippingData = calculateShippingCost();
    if (!shippingData) {
      document.getElementById('shippingSection').style.display = 'none';
      return;
    }
    document.getElementById('shippingSection').style.display = 'block';
    const breakdownContent = document.getElementById('breakdownContent');
    let html = '';
    if (shippingData.isOutOfRange) {
      html = '<div>⚠️ Area ini di luar jangkauan kami. Silakan pilih "Kurir Pembeli" atau hubungi admin.</div>';
    } else {
      html = '<div>Jarak: <strong>' + Math.ceil(shippingData.shippingDistance) + ' km</strong> <span style="font-size:10px;color:var(--gray-400);">' + (shippingData.shippingLabel || '') + '</span></div>';
      if (state.shippingProvider === 'rujakco') {
        html += '<div>🚚 Tarif Dasar: <strong>' + fmt(shippingData.baseLalamoveCost || 0) + '</strong></div>';
        if (shippingData.isSurge) {
          const surgeAmount = (shippingData.lalamoveCost || 0) - (shippingData.baseLalamoveCost || 0);
          if (surgeAmount > 0) html += '<div style="color:#D62828;">⚡ Surge (x' + shippingData.surgeMultiplier + '): +' + fmt(surgeAmount) + '</div>';
        }
        if (state.isPriority) html += '<div>🚀 Prioritas: +Rp8.000</div>';
        html += '<div style="border-top:1px solid var(--gray-200);margin-top:6px;padding-top:6px;font-weight:700;">Total Ongkir: <strong style="color:var(--red);">' + fmt(shippingData.shippingCost) + '</strong></div>';
      } else if (state.shippingProvider === 'paxel') {
        const weight = getCartSummaryCached().totalQty || 1;
        html += '<div>📦 Layanan: <strong>Same Day (Besok)</strong></div>';
        html += '<div>📦 Box/Dimensi: <strong>Medium/Large</strong></div>';
        html += '<div>📦 Tarif Paxel: <strong>' + fmt(shippingData.baseLalamoveCost || 0) + '</strong></div>';
        html += '<div style="border-top:1px solid var(--gray-200);margin-top:6px;padding-top:6px;font-weight:700;">Total Ongkir: <strong style="color:var(--red);">' + fmt(shippingData.shippingCost) + '</strong></div>';
      } else if (state.shippingProvider === 'pembeli') {
        html += '<div>Total Ongkir: <strong>Gratis (Kurir Pembeli)</strong></div>';
      }
    }
    breakdownContent.innerHTML = html;
    const summary = getCartSummaryCached();
    document.getElementById('finalSubtotal').textContent = fmt(summary.subtotal);
    document.getElementById('finalDiscount').textContent = summary.discount > 0 ? '-Rp' + summary.discount.toLocaleString('id-ID') : 'Rp0';
    document.getElementById('finalShipping').textContent = shippingData.isOutOfRange ? 'Konfirmasi Admin' : fmt(shippingData.shippingCost);
    document.getElementById('finalTotal').textContent = shippingData.isOutOfRange ? 'Konfirmasi' : fmt(shippingData.total);
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

    const step1Upsell = document.getElementById('step1Upsell');
    if (step1Upsell && summary.items.length > 0) {
      step1Upsell.innerHTML = renderAIUpsell(summary);
    }

    document.getElementById('customerName').value = state.customerName;
    document.getElementById('customerPhone').value = state.customerPhone;
    document.getElementById('customerAddress').value = state.customerAddress;

    if (state.selectedDistrict) {
      const displayStr = state.selectedDistrict.replace(/\b\w/g, l => l.toUpperCase());
      const distInput = document.getElementById('districtInput');
      if (distInput) distInput.value = displayStr;
      const distLabel = document.getElementById('districtLabel');
      if (distLabel) distLabel.textContent = displayStr + ' (~' + DISTRICT_MAP[state.selectedDistrict] + ' km)';
    }

    document.getElementById('giftToggle').checked = state.isGift;
    document.getElementById('giftSender').value = state.giftSender;
    document.getElementById('giftMessage').value = state.giftMessage;
    document.getElementById('giftFields').style.display = state.isGift ? 'block' : 'none';

    if (state.selectedDistrict || state.userDistance !== null) {
      updateShippingDisplay();
    }

    document.querySelectorAll('.ship-btn').forEach(b => b.classList.toggle('active', b.dataset.provider === state.shippingProvider));
    document.querySelectorAll('.veh-btn').forEach(b => b.classList.toggle('active', b.dataset.vehicle === state.vehicleType));

    const paxelOptions = document.getElementById('paxelOptions');
    const rujakcoOptions = document.getElementById('rujakcoOptions');
    const deliveryTrigger = document.getElementById('deliveryTimeTrigger');
    const deliveryLabel = document.querySelector('label[for="deliveryTime"]');

    if (state.shippingProvider === 'paxel') {
      if (paxelOptions) paxelOptions.style.display = 'block';
      if (rujakcoOptions) rujakcoOptions.style.display = 'none';
      if (deliveryTrigger) deliveryTrigger.style.display = 'none';
      if (deliveryLabel) deliveryLabel.style.display = 'none';
    } else {
      if (paxelOptions) paxelOptions.style.display = 'none';
      if (rujakcoOptions) rujakcoOptions.style.display = 'block';
      if (deliveryTrigger) deliveryTrigger.style.display = 'flex';
      if (deliveryLabel) deliveryLabel.style.display = 'block';
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  // ============================================================
  // PRODUCT MODAL
  // ============================================================
  const productModal = document.getElementById('productModal');
  const SPICE_NAMES = ['Mild Sweet', 'Light Spice', 'Signature', 'Bold', 'Extreme'];

  function getSpiceLabelHTML(level) {
    const peppers = ['🌶️','🌶️🌶️','🌶️🌶️🌶️','🌶️🌶️🌶️🌶️','🌶️🌶️🌶️🌶️🌶️'];
    const name = SPICE_NAMES[level-1] || 'Signature';
    const pepperStr = peppers[level-1] || '🌶️🌶️🌶️';
    return level + ' - ' + name + ' <span style="margin-left: 8px;">' + pepperStr + '</span>';
  }

  function openProductModal(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    // Bersihkan elemen tambahan sebelumnya
    const oldRitual = document.querySelector('.ritual-box');
    if (oldRitual) oldRitual.remove();
    const oldHarga = document.querySelector('.harga-box');
    if (oldHarga) oldHarga.remove();

    const imgEl = document.createElement('img');
    imgEl.src = product.image;
    imgEl.alt = product.name;
    imgEl.addEventListener('error', function() {
      this.style.display = 'none';
      var parent = this.parentElement;
      if (!parent) return;
      parent.innerHTML = '';
      var fallback = document.createElement('div');
      fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e8efeb;color:#6B7280;font-size:12px;font-weight:600;text-align:center;padding:8px;';
      fallback.textContent = (product.name || 'Produk').substring(0,30);
      parent.appendChild(fallback);
    });
    const modalImg = document.getElementById('modalImg');
    modalImg.innerHTML = '';
    modalImg.appendChild(imgEl);

    const be = document.getElementById('modalBadge');
    if (product.badge) {
      be.style.display = 'inline-block';
      be.textContent = product.badge;
      be.className = 'modal-badge-eyebrow ' + (product.badgeColor || '');
    } else {
      be.style.display = 'none';
    }
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalDesc').textContent = product.desc;
    document.getElementById('modalContainer').textContent = product.container || '-';
    document.getElementById('modalSize').textContent = product.size || '-';
    document.getElementById('modalSambal').textContent = product.sambal || '-';
    document.getElementById('modalBuahText').textContent = (product.buah || []).join(', ');
    document.getElementById('modalTags').innerHTML = (product.tags || []).map(t => '<span class="modal-tag">' + escapeHTML(t) + '</span>').join('');

    const ritualDiv = document.createElement('div');
    ritualDiv.className = 'ritual-box';
    ritualDiv.style.cssText = 'background:var(--ivory);border:1px solid var(--green-pale);border-radius:10px;padding:10px 12px;margin:8px 0;';
    ritualDiv.innerHTML = '<div style="font-size:10px;font-weight:700;color:var(--green);">🎯 Ritual Nikmat</div><div style="font-size:11px;color:var(--gray-700);margin-top:4px;">① Tuang sambal ke wadah<br>② Aduk rata dengan buah, lalu nikmati!</div>';
    document.getElementById('modalTags').after(ritualDiv);

    const breakdown = product.price <= 30000 ? (product.buah || []).length + ' jenis buah • sambal homemade • wadah food grade' :
      product.price <= 85000 ? (product.buah || []).length + ' jenis buah premium • sambal spesial • wadah jumbo' :
      (product.buah || []).length + '+ jenis buah • tampah bambu • sambal variant';
    const hargaDiv = document.createElement('div');
    hargaDiv.className = 'harga-box';
    hargaDiv.style.cssText = 'font-size:10px;color:var(--gray-500);margin:4px 0 6px;text-align:center;';
    hargaDiv.innerHTML = '💰 <strong>' + fmt(product.price) + '</strong> sudah termasuk:<br>' + breakdown;
    const detailGrid = document.getElementById('modalDetailGrid');
    if (detailGrid) detailGrid.after(hargaDiv);

    document.getElementById('btnPrice').textContent = fmt(product.price);
    const modalAddEl = document.getElementById('modalAdd');
    if (modalAddEl) modalAddEl.dataset.id = product.id;

    const shareBtn = document.getElementById('modalShareBtn');
    if (shareBtn) {
      shareBtn.replaceWith(shareBtn.cloneNode(true));
      const newShareBtn = document.getElementById('modalShareBtn');
      newShareBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const productId = product.id;
        const shareUrl = window.location.origin + window.location.pathname + '?product=' + productId;
        const shareText = '🍜 ' + product.name + ' — ' + product.desc + '\nPesan sekarang di Rujak.Co!';
        if (navigator.share) {
          navigator.share({ title: product.name, text: shareText, url: shareUrl }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareUrl + '\n' + shareText).then(() => {
            showToast('📋 Link produk disalin!');
          }).catch(() => {
            const dummy = document.createElement('textarea');
            dummy.value = shareUrl + '\n' + shareText;
            document.body.appendChild(dummy);
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            showToast('📋 Link produk disalin!');
          });
        }
      });
    }

    const spiceHidden = document.getElementById('spiceHidden');
    const spiceLabel = document.getElementById('spiceLabel');
    const dv = product.defaultSpice || 3;
    spiceHidden.value = dv;
    spiceLabel.innerHTML = getSpiceLabelHTML(dv);
    const spiceTrigger = document.getElementById('spiceTrigger');
    if (spiceTrigger) spiceTrigger.classList.add('selected');

    // Reset animasi modal body
    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
      modalBody.style.transition = 'none';
      modalBody.style.transform = '';
      modalBody.style.opacity = '1';
    }

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Update indicator posisi produk
    updateProductIndicator(id);
  }

  function updateProductIndicator(id) {
    const visibleProducts = PRODUCTS.filter(p => !p.isHidden);
    const idx = visibleProducts.findIndex(p => p.id === id);
    if (idx === -1) return;
    let indicatorEl = document.getElementById('productSwipeIndicator');
    if (!indicatorEl) {
      const footer = document.querySelector('#productModal .modal-footer');
      if (footer) {
        indicatorEl = document.createElement('div');
        indicatorEl.id = 'productSwipeIndicator';
        indicatorEl.style.cssText = 'text-align:center; font-size:12px; color:var(--gray-500); margin-bottom:6px;';
        footer.prepend(indicatorEl);
      }
    }
    if (indicatorEl) indicatorEl.textContent = `${idx+1} / ${visibleProducts.length}`;
  }

  function closeProductModal() {
    productModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ============================================================
  // MINI CART MODAL
  // ============================================================
  const miniCartModal = document.getElementById('miniCartModal');
  function openMiniCart() {
    if (miniCartModal) {
      miniCartModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      renderMiniCart();
    }
  }
  function closeMiniCart() {
    const orderNotesEl = document.getElementById('orderNotes');
    if (orderNotesEl) state.orderNotes = orderNotesEl.value;
    const customerNameEl = document.getElementById('customerName');
    if (customerNameEl) state.customerName = customerNameEl.value.trim();
    const customerPhoneEl = document.getElementById('customerPhone');
    if (customerPhoneEl) state.customerPhone = customerPhoneEl.value.trim();
    const customerAddressEl = document.getElementById('customerAddress');
    if (customerAddressEl) {
      const raw = customerAddressEl.value.trim();
      state.customerAddress = raw.replace(/(?:,\s*)?Kec\..*$/gi, '').trim();
    }
    const giftToggleEl = document.getElementById('giftToggle');
    if (giftToggleEl) state.isGift = giftToggleEl.checked;
    const giftSenderEl = document.getElementById('giftSender');
    if (giftSenderEl) state.giftSender = giftSenderEl.value.trim();
    const giftMessageEl = document.getElementById('giftMessage');
    if (giftMessageEl) state.giftMessage = giftMessageEl.value.trim();
    if (miniCartModal) {
      miniCartModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    saveCustomerData();
  }

  // ============================================================
  // PROMO MODAL & CART TOGGLE
  // ============================================================
  const promoModal = document.getElementById('promoModal');
  function openPromoModal() {
    updateMissionCheckboxes(getCartSummaryCached().subtotal);
    if (promoModal) {
      promoModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  function closePromoModal() {
    if (promoModal) {
      promoModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  function updateClearButton() {
    if (clearSearchBtn) clearSearchBtn.classList.toggle('visible', searchInput.value.length > 0);
  }
  function minimizeCart() {
    state.isCartMinimized = true;
    localStorage.setItem('rujak_cart_minimized', 'true');
    const bar = document.getElementById('bottom-bar');
    if (bar) bar.classList.remove('visible');
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
    const pt = document.getElementById('priorityToggle');
    if (pt) pt.checked = checked;
    const pm = document.getElementById('priorityToggleMini');
    if (pm) pm.checked = checked;
    refreshShippingDisplays();
    invalidateCache();
  }

  // ============================================================
  // AUTOCOMPLETE KECAMATAN
  // ============================================================
  function createDistrictAutocomplete() {
    const input = document.getElementById('districtInput');
    if (!input) return;
    const wrapper = input.parentElement;
    const dropdown = document.getElementById('customDistrictDropdown');
    if (!dropdown) return;

    input.addEventListener('input', function() {
      const val = this.value.toLowerCase().trim();
      if (!val || val.length < 1) { dropdown.style.display = 'none'; return; }
      const matches = Object.keys(DISTRICT_MAP).filter(name => name.includes(val));
      if (matches.length === 0) {
        dropdown.innerHTML = '<div style="padding:10px;color:var(--gray-400);font-size:13px;">Kecamatan tidak ditemukan</div>';
        dropdown.style.display = 'block';
        return;
      }
      dropdown.innerHTML = matches.slice(0, 15).map(name =>
        `<div data-value="${name}" style="padding:10px 12px; cursor:pointer; border-bottom:1px solid var(--gray-100); font-size:14px; transition:background 0.1s;" onmouseover="this.style.background='#EAF2EE'" onmouseout="this.style.background='white'">${name.replace(/\b\w/g, l => l.toUpperCase())}</div>`
      ).join('');
      dropdown.style.display = 'block';
    });

    dropdown.addEventListener('click', function(e) {
      const target = e.target.closest('[data-value]');
      if (!target) return;
      const val = target.dataset.value;
      const displayStr = val.replace(/\b\w/g, l => l.toUpperCase());
      input.value = displayStr;
      state.selectedDistrict = val;
      state.useManualDistrict = true;
      dropdown.style.display = 'none';
      const locDisplay = document.getElementById('locationDisplay');
      if (locDisplay) locDisplay.textContent = displayStr + ' ▾';
      const distLabel = document.getElementById('districtLabel');
      if (distLabel) distLabel.textContent = displayStr + ' (~' + DISTRICT_MAP[val] + ' km)';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      updateShippingUI(DISTRICT_MAP[val], state.isPriority);
      renderMiniCart();
    });

    document.addEventListener('click', function(e) {
      if (!wrapper.contains(e.target)) dropdown.style.display = 'none';
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const val = this.value.toLowerCase().trim();
        if (val && DISTRICT_MAP[val]) {
          state.selectedDistrict = val;
          state.useManualDistrict = true;
          dropdown.style.display = 'none';
          detectLocation();
          renderMiniCart();
          showToast('✅ Kecamatan ' + val.replace(/\b\w/g, l => l.toUpperCase()) + ' dipilih.');
        } else {
          const keys = Object.keys(DISTRICT_MAP);
          const match = keys.find(k => k.includes(val) || val.includes(k));
          if (match) {
            state.selectedDistrict = match;
            state.useManualDistrict = true;
            this.value = match.replace(/\b\w/g, l => l.toUpperCase());
            dropdown.style.display = 'none';
            detectLocation();
            renderMiniCart();
            showToast('✅ Kecamatan ' + this.value + ' dipilih.');
          } else {
            showToast('⚠️ Kecamatan tidak ditemukan, pilih dari daftar yang muncul.');
          }
        }
      }
    });

    input.addEventListener('change', function() {
      const val = this.value.toLowerCase().trim();
      if (val && DISTRICT_MAP[val]) {
        state.selectedDistrict = val;
        state.useManualDistrict = true;
        detectLocation();
        renderMiniCart();
        showToast('✅ Kecamatan ' + val.replace(/\b\w/g, l => l.toUpperCase()) + ' dipilih.');
      }
    });
  }

  function detectLocation() {
    var costEl = document.getElementById('shippingCost');
    var locationDisplay = document.getElementById('locationDisplay');
    if (costEl) costEl.textContent = '⏳';
    if (locationDisplay) locationDisplay.textContent = 'Mendeteksi... ▾';

    if (state.useManualDistrict && state.selectedDistrict) {
      var dist = DISTRICT_MAP[state.selectedDistrict] || SYSTEM.DEFAULT_DISTANCE;
      state.userDistance = dist;
      if (locationDisplay) locationDisplay.textContent = state.selectedDistrict.replace(/\b\w/g, function(l) { return l.toUpperCase(); }) + ' ▾';
      updateShippingUI(dist, state.isPriority);
      renderMiniCart();

      // Penyempurnaan progresif: kalau ORS_API_KEY diisi, geocode kecamatan lalu
      // ambil jarak jalan raya asli dan perbarui tampilan begitu hasilnya datang.
      // Kalau ORS tidak dikonfigurasi/gagal, estimasi DISTRICT_MAP di atas tetap dipakai.
      (function() {
        var districtAtCallTime = state.selectedDistrict;
        geocodeDistrict(districtAtCallTime).then(function(coords) {
          if (!coords) return null;
          return getRoadDistanceKm(coords.lat, coords.lng, 'district:' + districtAtCallTime).then(function(roadKm) {
            if (roadKm !== null && state.useManualDistrict && state.selectedDistrict === districtAtCallTime) {
              state.userDistance = roadKm;
              invalidateCache();
              refreshShippingDisplays();
            }
          });
        });
      })();
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude, lng = pos.coords.longitude, R = 6371;
        var dLat = (lat - SYSTEM.STORE_LAT) * Math.PI / 180;
        var dLon = (lng - SYSTEM.STORE_LNG) * Math.PI / 180;
        var a = Math.sin(dLat/2)**2 + Math.cos(SYSTEM.STORE_LAT * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLon/2)**2;
        var distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        state.userDistance = distance;
        if (locationDisplay) locationDisplay.textContent = 'Lokasi GPS ▾';
        updateShippingUI(distance, state.isPriority);
        locationFallbackShown = false;
        var bm = document.getElementById('btnManualDistrict');
        if (bm) bm.classList.remove('active');

        // Penyempurnaan progresif: ganti estimasi haversine dengan jarak jalan
        // raya asli dari ORS begitu tersedia (kalau ORS_API_KEY dikonfigurasi).
        var cacheKey = 'gps:' + lat.toFixed(3) + ',' + lng.toFixed(3);
        getRoadDistanceKm(lat, lng, cacheKey).then(function(roadKm) {
          if (roadKm !== null && !state.useManualDistrict) {
            state.userDistance = roadKm;
            invalidateCache();
            refreshShippingDisplays();
          }
        });
      }, function() {
        if (locationDisplay) locationDisplay.textContent = 'GPS tidak aktif ▾';
        if (costEl) { costEl.textContent = 'Pilih kecamatan'; costEl.style.color = 'var(--gray-500)'; }
        showToast('📍 GPS tidak aktif. Silakan pilih kecamatan tujuan.');
      }, { enableHighAccuracy: true, timeout: SYSTEM.LOCATION_TIMEOUT });
    } else {
      if (locationDisplay) locationDisplay.textContent = 'Pilih lokasi ▾';
      if (costEl) { costEl.textContent = 'Pilih kecamatan'; costEl.style.color = 'var(--gray-500)'; }
      showToast('📍 Browser tidak mendukung GPS. Silakan pilih kecamatan tujuan.');
    }
  }

  function updateUI() {
    invalidateCache();
    renderMenu();
    renderAddons();
    renderCart();
    renderAIRecommendation();
    refreshShippingDisplays();
    if (document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart();
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }

  // ============================================================
  // SWIPE GESTURES
  // ============================================================
  function initProductSwipe() {
    const modalContent = document.querySelector('#productModal .modal-content');
    if (!modalContent) return;
    let startX = 0, startY = 0, swiping = false;

    modalContent.addEventListener('touchstart', e => {
      if (swiping) return;
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
    }, { passive: true });

    modalContent.addEventListener('touchend', e => {
      if (swiping) return;
      const endX = e.changedTouches[0].screenX;
      const endY = e.changedTouches[0].screenY;
      const dx = endX - startX;
      const dy = endY - startY;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
        const currentId = document.getElementById('modalAdd').dataset.id;
        if (!currentId) return;
        const visible = PRODUCTS.filter(p => !p.isHidden);
        const idx = visible.findIndex(p => p.id === currentId);
        if (idx === -1) return;

        let newIdx = dx < 0 ? (idx + 1) % visible.length : (idx - 1 + visible.length) % visible.length;
        swiping = true;

        const body = document.getElementById('modalBody');
        if (!body) { openProductModal(visible[newIdx].id); swiping = false; return; }

        // Animasi slide out
        body.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        body.style.transform = `translateX(${dx < 0 ? -30 : 30}%)`;
        body.style.opacity = '0';

        setTimeout(() => {
          openProductModal(visible[newIdx].id);
          const newBody = document.getElementById('modalBody');
          if (newBody) {
            newBody.style.transition = 'none';
            newBody.style.transform = `translateX(${dx < 0 ? 30 : -30}%)`;
            newBody.style.opacity = '0';
            requestAnimationFrame(() => {
              newBody.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
              newBody.style.transform = 'translateX(0)';
              newBody.style.opacity = '1';
            });
          }
          swiping = false;
        }, 200);
      }
    }, { passive: true });
  }

  function initCartSwipe() {
    const cartModalContent = document.querySelector('#miniCartModal .modal-content');
    if (!cartModalContent) return;
    let startX = 0, startY = 0;

    cartModalContent.addEventListener('touchstart', e => {
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
    }, { passive: true });

    cartModalContent.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].screenX - startX;
      const dy = e.changedTouches[0].screenY - startY;
      // Geser kanan dengan toleransi
      if (dx > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        cartModalContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        cartModalContent.style.transform = 'translateX(100%)';
        cartModalContent.style.opacity = '0.5';
        setTimeout(() => {
          closeMiniCart();
          cartModalContent.style.transition = '';
          cartModalContent.style.transform = '';
          cartModalContent.style.opacity = '';
        }, 300);
      }
    }, { passive: true });
  }

  // ============================================================
  // BIND EVENTS
  // ============================================================
  function bindEvents() {
    const ma = document.getElementById('modalAdd');
    if (ma && !ma._bound) {
      ma._bound = true;
      ma.addEventListener('click', function() {
        if (addToCartLocked) return;
        lockAddToCart();
        const baseId = this.dataset.id;
        if (baseId) {
          const spice = parseInt(document.getElementById('spiceHidden').value, 10) || 3;
          const cartKey = baseId + '_spice' + spice;
          const entry = state.cart[cartKey] || { qty: 0, spice: spice };
          entry.qty += 1;
          entry.spice = spice;
          state.cart[cartKey] = entry;
          invalidateCache();
          updateUI();
          showToast('✅ ' + ((PRODUCTS.find(p => p.id === baseId) || {}).name || 'Item') + ' ditambahkan!');
          closeProductModal();
        }
      });
    }

    const pt = document.getElementById('priorityToggle');
    if (pt) pt.addEventListener('change', function() { handlePriorityToggle(this.checked); });
    const pm = document.getElementById('priorityToggleMini');
    if (pm) pm.addEventListener('change', function() { handlePriorityToggle(this.checked); });

    const shareBtn = document.getElementById('shareBtnModal');
    if (shareBtn) {
      shareBtn.addEventListener('click', function() {
        state.hasShared = true;
        saveCustomerData();
        invalidateCache();
        updateUI();
        showToast('✅ Diskon Rp5.000 berhasil diaktifkan!');
        shareToWhatsApp();
      });
    }

    const promoTrigger = document.getElementById('promoTrigger');
    if (promoTrigger) promoTrigger.addEventListener('click', openPromoModal);
    const promoClose = document.getElementById('promoClose');
    if (promoClose) promoClose.addEventListener('click', closePromoModal);
    if (promoModal) promoModal.addEventListener('click', function(e) { if (e.target === promoModal) closePromoModal(); });

    const closeBar = document.getElementById('closeBottomBar');
    if (closeBar) closeBar.addEventListener('click', function(e) { e.stopPropagation(); minimizeCart(); });

    const fb = document.getElementById('floatingCartBtn');
    if (fb) fb.addEventListener('click', expandCart);

    const giftToggle = document.getElementById('giftToggle');
    if (giftToggle) {
      giftToggle.addEventListener('change', function() {
        state.isGift = this.checked;
        const gf = document.getElementById('giftFields');
       