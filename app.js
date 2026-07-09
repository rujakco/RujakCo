(function() {
  'use strict';

  // ============================================================
  // RUJAK.CO v3.0 — FULL RESTORED JAVASCRIPT
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

  // --- API & KREDENSIAL ---
  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";

  const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjAyYTNkOWQyZjk4ZDQ1YWQ5ZTk2Mzc1OWFkODA3Yzg5IiwiaCI6Im11cm11cjY0In0=';
  const ORS_BASE_URL = 'https://api.openrouteservice.org';
  const ORS_CACHE_KEY = 'rujak_road_distance_cache';
  const ORS_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
  const ORS_TIMEOUT_MS = 6000;

  function loadRoadDistanceCache() { try { return JSON.parse(localStorage.getItem(ORS_CACHE_KEY) || '{}'); } catch (_) { return {}; } }
  function saveRoadDistanceCache(cache) { try { localStorage.setItem(ORS_CACHE_KEY, JSON.stringify(cache)); } catch (_) {} }

  function fetchWithTimeout(url, options, timeoutMs) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('ORS: request timeout')), timeoutMs))
    ]);
  }

  async function getRoadDistanceKm(destLat, destLng, cacheKey) {
    if (!ORS_API_KEY) return null;
    const cache = loadRoadDistanceCache();
    if (cacheKey && cache[cacheKey] && (Date.now() - cache[cacheKey].ts) < ORS_CACHE_MAX_AGE_MS) return cache[cacheKey].km;
    try {
      const res = await fetchWithTimeout(ORS_BASE_URL + '/v2/directions/driving-car', {
        method: 'POST',
        headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: [[SYSTEM.STORE_LNG, SYSTEM.STORE_LAT], [destLng, destLat]] })
      }, ORS_TIMEOUT_MS);
      if (!res.ok) throw new Error('ORS directions HTTP ' + res.status);
      const data = await res.json();
      const meters = data?.routes?.[0]?.summary?.distance;
      if (typeof meters !== 'number') throw new Error('ORS directions format error');
      const km = meters / 1000;
      if (cacheKey) { cache[cacheKey] = { km: km, ts: Date.now() }; saveRoadDistanceCache(cache); }
      return km;
    } catch (err) { ErrorLogger.log('ORS getRoadDistanceKm', err); return null; }
  }

  async function geocodeDistrict(districtName) {
    if (!ORS_API_KEY) return null;
    try {
      const url = ORS_BASE_URL + '/geocode/search?api_key=' + encodeURIComponent(ORS_API_KEY) + '&text=' + encodeURIComponent(districtName + ', Indonesia') + '&boundary.country=ID&size=1';
      const res = await fetchWithTimeout(url, {}, ORS_TIMEOUT_MS);
      if (!res.ok) throw new Error('ORS geocode HTTP ' + res.status);
      const data = await res.json();
      const coords = data?.features?.[0]?.geometry?.coordinates;
      if (!coords) return null;
      return { lat: coords[1], lng: coords[0] };
    } catch (err) { ErrorLogger.log('ORS geocodeDistrict', err); return null; }
  }

  let supabase = null;
  function getSupabase() {
    return new Promise((resolve) => {
      if (supabase) return resolve(supabase);
      if (window.supabase?.createClient) { supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); return resolve(supabase); }
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.supabase?.createClient) { clearInterval(interval); supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); resolve(supabase); }
        else if (attempts >= 50) {
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

  // --- DATA ---
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

  const SYSTEM = { DISCOUNT_THRESHOLD: 100000, WA_NUMBER: '6289677161680', TOAST_DURATION: 3000, MAX_DISTANCE: 9999, DEFAULT_DISTANCE: 2, PRIORITY_SURCHARGE: 8000, STORE_LAT: -6.2165414, STORE_LNG: 107.0177395, LOCATION_TIMEOUT: 12000 };
  const DISTRICT_MAP = {
    'bekasi barat':5, 'bekasi timur':7, 'bekasi selatan':9, 'bekasi utara':11, 'rawalumbu':8, 'jatiasih':12, 'pondokgede':14, 'cikarang':23, 'tambun':16, 'cibitung':20, 'karawang':44, 'cikampek':60, 'serang':63, 'cilegon':80,
    'gambir':18, 'menteng':19, 'senen':18, 'cempaka putih':19, 'kemayoran':20, 'sawah besar':20, 'taman sari':21, 'tanah abang':20, 'setiabudi':19, 'tebet':20, 'pancoran':21, 'pasar minggu':22, 'kebayoran lama':24, 'kebayoran baru':22, 'mampang prapatan':21, 'jagakarsa':23, 'cilandak':24, 'pesanggrahan':25,
    'pulo gadung':16, 'jatinegara':18, 'duren sawit':15, 'kramat jati':19, 'pasar rebo':20, 'ciracas':22, 'cipayung':23, 'makasar':16, 'cakung':12,
    'tambora':24, 'grogol petamburan':23, 'palmerah':22, 'kembangan':25, 'cengkareng':28, 'kalideres':30, 'kemanggisan':23, 'kedoya':25, 'meruya':25,
    'penjaringan':30, 'pademangan':28, 'tanjung priok':29, 'koja':30, 'cilincing':31, 'kelapa gading':27,
    'depok':35, 'beji':36, 'pancoran mas':36, 'cipayung depok':38, 'sukmajaya':38, 'cilodong':39, 'limo':40, 'cinere':41, 'cimanggis':34, 'tapos':36, 'sawangan':42, 'bojongsari':44,
    'tangerang':38, 'tangerang selatan':34, 'batuceper':39, 'benda':40, 'cibodas':39, 'ciledug':35, 'cipondoh':38, 'jatiuwung':41, 'karawaci':39, 'periuk':40, 'pinang':38, 'serpong':40, 'serpong utara':41, 'pamulang':38, 'pondok aren':36, 'ciputat':35, 'ciputat timur':36,
    'bogor':50, 'bogor barat':50, 'bogor selatan':49, 'bogor timur':50, 'bogor utara':48, 'tanah sareal':49, 'ciawi':54, 'cibinong':47, 'citeureup':50, 'gunung putri':44, 'cileungsi':41, 'jonggol':56, 'parung':52, 'dramaga':60
  };

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null, isPriority: false, orderNotes: '', isCartMinimized: false,
    customerName: '', customerPhone: '', customerAddress: '', isGift: false, giftSender: '', giftMessage: '',
    useManualDistrict: false, selectedDistrict: '', hasShared: false, shippingProvider: 'rujakco', vehicleType: 'motor', currentStep: 1,
    shippingCalculated: false, currentProductPage: { id: null, spice: 3, qty: 1 }
  };

  let addToCartLocked = false, checkoutLocked = false, locationFallbackShown = false;
  let cachedSummary = null, cachedSummaryKey = '';
  let storeStatusInterval = null, toastTimer = null;
  let pendingWhatsAppMessage = null;

  // ============================================================
  // UTILITIES, MODALS, & TOGGLES
  // ============================================================
  function escapeHTML(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function debounce(fn, delay) { let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); }; }
  
  function openMiniCart() { const modal = document.getElementById('miniCartModal'); if(modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; renderMiniCart(); } }
  function closeMiniCart() { const modal = document.getElementById('miniCartModal'); if(modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } }
  function openPromoModal() { const modal = document.getElementById('promoModal'); if(modal) modal.classList.add('active'); }
  function closePromoModal() { const modal = document.getElementById('promoModal'); if(modal) modal.classList.remove('active'); }
  function minimizeCart() { state.isCartMinimized = true; try { localStorage.setItem('rujak_cart_minimized', 'true'); } catch(e){} updateUI(); }
  function expandCart() { state.isCartMinimized = false; try { localStorage.setItem('rujak_cart_minimized', 'false'); } catch(e){} updateUI(); }
  
  function updateClearButton() { 
    const btn = document.getElementById('clearSearchBtn'), input = document.getElementById('searchInput'); 
    if(btn && input) btn.classList.toggle('visible', input.value.length > 0); 
  }

  function handlePriorityToggle(isChecked) {
    state.isPriority = isChecked;
    const pt = document.getElementById('priorityToggle'), pm = document.getElementById('priorityToggleMini');
    if (pt && pt !== document.activeElement) pt.checked = isChecked;
    if (pm && pm !== document.activeElement) pm.checked = isChecked;
    invalidateCache(); updateShippingDisplay(); renderMiniCart();
  }

  function openCustomSelect(title, options, onSelect) {
    const backdrop = document.createElement('div'); backdrop.className = 'select-backdrop'; document.body.appendChild(backdrop);
    const modal = document.createElement('div'); modal.className = 'select-modal';
    modal.innerHTML = `<h3>${title}</h3>` + options.map(opt => `<div class="select-option" data-value="${opt.value}">${opt.label}</div>`).join('');
    document.body.appendChild(modal);
    const closeModal = () => { modal.classList.remove('active'); backdrop.classList.remove('active'); setTimeout(() => { modal.remove(); backdrop.remove(); }, 300); };
    modal.querySelectorAll('.select-option').forEach(opt => { opt.addEventListener('click', function() { onSelect(this.dataset.value, this.textContent); closeModal(); }); });
    backdrop.addEventListener('click', closeModal);
    requestAnimationFrame(() => { backdrop.classList.add('active'); modal.classList.add('active'); });
  }

  function openWhatsApp(phone, message) {
    const waUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
    var win = window.open(waUrl, '_blank', 'noopener');
    if (!win) { showToast('⚠️ Browser memblokir WhatsApp.'); pendingWhatsAppMessage = { phone, message }; showWhatsAppFallbackModal(); } 
    else { pendingWhatsAppMessage = null; }
  }

  function showWhatsAppFallbackModal() {
    var oldModal = document.getElementById('whatsappFallbackModal'); if (oldModal) oldModal.remove();
    var modal = document.createElement('div'); modal.id = 'whatsappFallbackModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:100000;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = '<div style="background:white;border-radius:20px;padding:24px;max-width:360px;width:90%;text-align:center;"><div style="font-size:40px;margin-bottom:8px;">📲</div><h3>Buka WhatsApp</h3><p style="font-size:13px;color:var(--gray-500);">Klik tombol di bawah untuk mengirim pesan.</p><button id="openWaManualBtn" style="background:#25D366;color:white;border:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;width:100%;">Buka WhatsApp</button><button id="closeWaFallback" style="background:none;border:1px solid #ddd;color:#666;padding:10px;border-radius:8px;margin-top:8px;width:100%;">Tutup</button></div>';
    document.body.appendChild(modal);
    document.getElementById('openWaManualBtn').addEventListener('click', function() {
      if (pendingWhatsAppMessage) { window.open('https://wa.me/' + pendingWhatsAppMessage.phone + '?text=' + encodeURIComponent(pendingWhatsAppMessage.message), '_blank'); pendingWhatsAppMessage = null; }
      modal.remove();
    });
    document.getElementById('closeWaFallback').addEventListener('click', function() { modal.remove(); pendingWhatsAppMessage = null; });
  }

  function shareToWhatsApp() {
    const shareText = 'Hai! Cobain Rujak.Co yuk — rujak premium dengan buah segar pilihan dan sambal khas Indonesia.';
    const shareUrl = window.location.href;
    if (navigator.share) { navigator.share({ title: 'Rujak.Co', text: shareText, url: shareUrl }).catch(() => copyShareLink(shareText, shareUrl)); }
    else { copyShareLink(shareText, shareUrl); }
  }

  function copyShareLink(text, url) { navigator.clipboard.writeText(text + '\n' + url).then(() => showToast('📋 Link berhasil disalin!')).catch(() => showToast('📋 Gagal menyalin')); }

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

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  
  function estimateRoadDistance(straightKm) {
    if (straightKm <= 10) return Math.round(straightKm * 1.35);
    if (straightKm <= 20) return Math.round(straightKm * 1.30);
    if (straightKm <= 35) return Math.round(straightKm * 1.25);
    if (straightKm <= 50) return Math.round(straightKm * 1.20);
    return Math.round(straightKm * 1.15);
  }

  // ============================================================
  // COST & LOGISTICS CALCULATIONS
  // ============================================================
  function calculatePaxelCost(distance, vehicleType, mainQty) {
    const qty = mainQty || 1;
    const numLargeBoxes = Math.floor(qty / 2);
    const numMediumBoxes = qty % 2;
    const totalPackages = numLargeBoxes + numMediumBoxes;
    return (numLargeBoxes * 25000) + (numMediumBoxes * 20000) + (totalPackages * 3000);
  }

  function calculateLalamoveCost(distance, vehicleType) {
    const dist = Math.ceil(distance);
    if (vehicleType === 'motor') {
      if (dist <= 3) return 8000;
      if (dist <= 10) return 8000 + (dist - 3) * 1800;
      if (dist <= 20) return 20600 + (dist - 10) * 1600;
      if (dist <= 30) return 36600 + (dist - 20) * 1400;
      if (dist <= 50) return 50600 + (dist - 30) * 1150;
      return 73600 + (dist - 50) * 1000;
    }
    if (dist <= 3) return 24000;
    if (dist <= 10) return 24000 + (dist - 3) * 4500;
    if (dist <= 20) return 55500 + (dist - 10) * 4000;
    if (dist <= 30) return 95500 + (dist - 20) * 3500;
    if (dist <= 50) return 130500 + (dist - 30) * 3000;
    return 190500 + (dist - 50) * 2500;
  }

  function isPeakHour() {
    const hour = new Date().getHours(), day = new Date().getDay();
    if (day === 0 || day === 6) return (hour >= 11 && hour <= 13);
    return (hour >= 11 && hour <= 13) || (hour >= 16 && hour <= 19);
  }
  
  function getSurgeMultiplier() { return isPeakHour() ? 1.3 : 1.0; }
  function getZoneLabel(dist) { return dist <= 5 ? 'Zona A (0-5 km)' : dist <= 10 ? 'Zona B (5-10 km)' : dist <= 15 ? 'Zona C (10-15 km)' : dist <= 20 ? 'Zona D (15-20 km)' : 'Zona Jauh (>20 km)'; }

  function calculateShipping(distance, priority, mainQty) {
    if (state.shippingProvider === 'pembeli') return { cost: 0, label: 'Kurir Pembeli', distance: distance, zone: null, surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
    const rawDistance = (distance === null || distance === undefined || isNaN(distance)) ? SYSTEM.DEFAULT_DISTANCE : distance;
    if (rawDistance > SYSTEM.MAX_DISTANCE) return { cost: null, label: 'Admin Konfirmasi', distance: rawDistance, zone: 'E', surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
    
    const surgeMultiplier = getSurgeMultiplier(), isSurge = surgeMultiplier > 1.0;
    let lalamoveCost = 0, baseLalamoveCost = 0, totalCost = 0, zoneLabel = '', surgeLabel = isSurge ? ' ⚡Jam Sibuk' : '', zone = 'F';

    if (state.shippingProvider === 'paxel') {
      const paxelCost = calculatePaxelCost(rawDistance, state.vehicleType, mainQty);
      totalCost = lalamoveCost = baseLalamoveCost = paxelCost;
      zoneLabel = 'Paxel Same Day ' + getZoneLabel(rawDistance); surgeLabel = '';
      if (rawDistance <= 20) zone = rawDistance <= 5 ? 'A' : rawDistance <= 10 ? 'B' : rawDistance <= 15 ? 'C' : 'D';
    } else {
      baseLalamoveCost = calculateLalamoveCost(rawDistance, state.vehicleType);
      lalamoveCost = Math.round(baseLalamoveCost * surgeMultiplier);
      totalCost = lalamoveCost + (priority ? SYSTEM.PRIORITY_SURCHARGE : 0);
      zoneLabel = getZoneLabel(rawDistance);
      if (rawDistance <= 20) zone = rawDistance <= 5 ? 'A' : rawDistance <= 10 ? 'B' : rawDistance <= 15 ? 'C' : 'D';
    }
    const label = zoneLabel + ' • ' + (state.vehicleType === 'motor' ? 'Motor' : 'Mobil') + (priority && state.shippingProvider !== 'paxel' ? ' • Prioritas' : '') + surgeLabel;
    return { cost: totalCost, lalamoveCost, baseLalamoveCost, surgeMultiplier, isSurge, label, distance: rawDistance, zone };
  }

  function updateShippingUI(distance, isPriority) {
    const summary = getCartSummaryCached();
    const currentQty = summary.mainProductQty > 0 ? summary.mainProductQty : 1;
    const shipping = calculateShipping(distance, isPriority, currentQty);
    const distEl = document.getElementById('shippingDistance'); if (distEl) distEl.textContent = '~' + Math.ceil(distance) + ' km';
    const costEl = document.getElementById('shippingCost'); const outEl = document.getElementById('outOfRange');
    
    if (shipping.zone === 'E') { if (costEl) { costEl.textContent = 'Konfirmasi'; costEl.style.color = 'var(--red)'; } if (outEl) outEl.style.display = 'block'; }
    else if (state.shippingProvider === 'pembeli') { if (costEl) { costEl.textContent = 'Gratis'; costEl.style.color = 'var(--green)'; } if (outEl) outEl.style.display = 'none'; }
    else { if (costEl) { costEl.textContent = shipping.cost ? fmt(shipping.cost) : 'Gratis'; costEl.style.color = 'var(--red)'; } if (outEl) outEl.style.display = 'none'; }
    
    if (document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart();
    invalidateCache();
  }

  function refreshShippingDisplays() {
    const dist = (state.selectedDistrict && DISTRICT_MAP[state.selectedDistrict]) ? DISTRICT_MAP[state.selectedDistrict] : state.userDistance;
    if (dist !== null && dist !== undefined) updateShippingUI(dist, state.isPriority);
    if (document.getElementById('miniCartModal')?.classList.contains('active')) updateShippingDisplay();
  }

  // ============================================================
  // CART OPERATIONS & DATA
  // ============================================================
  function loadCart() { try { const s = localStorage.getItem('rujak_cart'); if (s) { const p = JSON.parse(s); if (typeof p === 'object' && p !== null) state.cart = p; } } catch (_) { state.cart = {}; } }
  function saveCart() { try { localStorage.setItem('rujak_cart', JSON.stringify(state.cart)); } catch(e) { ErrorLogger.log('saveCart', e); } }

  function getItemById(id) {
    let item = PRODUCTS.find(p => p.id === id); if (item) return item;
    const sm = id.match(/^(.+)_spice(\d+)$/); if (sm) { item = PRODUCTS.find(p => p.id === sm[1]); if (item) return item; }
    return ADDONS.find(a => a.id === id) || null;
  }

  function getCartSummary() {
    const items = []; let subtotal = 0, totalQty = 0, mainProductQty = 0;
    const keysToDelete = [];
    Object.keys(state.cart).forEach(id => {
      const entry = state.cart[id], item = getItemById(id);
      if (item && entry && entry.qty > 0) {
        const lt = item.price * entry.qty;
        subtotal += lt; totalQty += entry.qty;
        const baseId = id.split('_spice')[0];
        if (PRODUCTS.some(p => p.id === baseId)) mainProductQty += entry.qty;
        items.push({ cartId: id, id: id, name: item.name, price: item.price, qty: entry.qty, spice: entry.spice || null, lineTotal: lt });
      } else { keysToDelete.push(id); }
    });
    keysToDelete.forEach(id => delete state.cart[id]);
    const discount = calculateDiscount(subtotal);
    return { items, totalQty, mainProductQty, subtotal, discount };
  }

  function getCartSummaryCached() {
    const key = JSON.stringify(state.cart) + '|' + state.hasShared;
    if (cachedSummary && cachedSummaryKey === key) return cachedSummary;
    cachedSummary = getCartSummary(); cachedSummaryKey = key; return cachedSummary;
  }
  function invalidateCache() { cachedSummary = null; cachedSummaryKey = ''; }
  
  function calculateDiscount(subtotal) { let d = 0; if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) d += 5000; if (state.hasShared) d += 5000; return d; }

  function recordOrderHistory(orderItems) {
    try {
      let history = []; const raw = localStorage.getItem('rujak_order_history'); if (raw) history = JSON.parse(raw);
      orderItems.forEach(item => { const baseId = item.cartId ? item.cartId.split('_spice')[0] : null; if (baseId && PRODUCTS.find(p => p.id === baseId)) history.push(baseId); });
      if (history.length > 50) history = history.slice(-50); localStorage.setItem('rujak_order_history', JSON.stringify(history));
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
        state.customerName = data.name || ''; state.customerPhone = data.phone || ''; state.customerAddress = data.address || '';
        state.isGift = data.isGift || false; state.giftSender = data.giftSender || ''; state.giftMessage = data.giftMessage || '';
        state.hasShared = data.hasShared || false;
        if (data.shippingProvider) state.shippingProvider = data.shippingProvider;
        if (data.vehicleType) state.vehicleType = data.vehicleType;
        if (data.selectedDistrict) state.selectedDistrict = data.selectedDistrict;
        if (data.useManualDistrict !== undefined) state.useManualDistrict = data.useManualDistrict;
      }
      if (localStorage.getItem('rujak_has_shared') === 'true') state.hasShared = true;
    } catch(_) {}
  }

  function clearCart() {
    if (Object.keys(state.cart).length === 0) { showToast('🧹 Keranjang sudah kosong'); return; }
    showConfirmModal('Kosongkan Keranjang?', 'Semua item akan dihapus.', function() {
      state.cart = {}; invalidateCache(); updateUI();
      if (document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart();
      showToast('🧹 Keranjang dikosongkan');
    });
  }

  function calculateShippingCost() {
    const summary = getCartSummaryCached();
    if (!state.selectedDistrict && state.userDistance === null) return null;
    let distance = state.selectedDistrict && DISTRICT_MAP[state.selectedDistrict] ? DISTRICT_MAP[state.selectedDistrict] :
                   state.selectedDistrict ? estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, -6.2, 106.8)) :
                   state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
    
    const shipping = calculateShipping(distance, state.isPriority, summary.mainProductQty || 1);
    const rawShippingCost = shipping.cost;
    const shippingCost = state.shippingProvider === 'pembeli' ? 0 : (rawShippingCost === null || rawShippingCost === undefined ? 0 : rawShippingCost);
    const total = summary.subtotal - summary.discount + shippingCost;
    return { shippingCost, rawShippingCost, shippingLabel: shipping.label, shippingDistance: shipping.distance, shippingZone: shipping.zone, isOutOfRange: shipping.zone === 'E', total, lalamoveCost: shipping.lalamoveCost, baseLalamoveCost: shipping.baseLalamoveCost, isSurge: shipping.isSurge, surgeMultiplier: shipping.surgeMultiplier };
  }

  // ============================================================
  // AI ENGINE & RECOMMENDATIONS
  // ============================================================
  function getAIRecommendation() {
    const hour = new Date().getHours(), day = new Date().getDay(), isWeekend = (day === 0 || day === 6);
    let timeBased = hour >= 6 && hour < 10 ? 'p_m2' : hour >= 10 && hour < 14 ? 'p_m3' : hour >= 14 && hour < 17 ? 'p_m1' : 'p_m4';
    let favorite = null, history = [];
    try { const raw = localStorage.getItem('rujak_order_history'); if (raw) history = JSON.parse(raw); } catch (_) {}
    if (history.length > 0) { const freq = {}; history.forEach(id => freq[id] = (freq[id] || 0) + 1); favorite = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0]; }
    
    let rec = favorite || timeBased;
    if (isWeekend && hour >= 17) { const found = ['p_m4', 'p_m6'].find(id => PRODUCTS.find(prod => prod.id === id && !prod.isHidden)); if (found) rec = found; }
    const inCart = Object.keys(state.cart);
    let product = PRODUCTS.find(p => !p.isHidden && !inCart.some(key => key.startsWith(p.id)) && p.id === rec);
    if (!product) product = PRODUCTS.filter(p => !p.isHidden && !inCart.some(key => key.startsWith(p.id))).sort((a, b) => a.price - b.price)[0] || null;
    return product;
  }

  function renderAIRecommendation() {
    const container = document.getElementById('aiRecommendationContainer'); if (!container) return;
    const rec = getAIRecommendation();
    if (!rec || Object.keys(state.cart).some(key => key.startsWith(rec.id))) { container.style.display = 'none'; return; }
    
    const distance = state.selectedDistrict && DISTRICT_MAP[state.selectedDistrict] ? DISTRICT_MAP[state.selectedDistrict] : state.userDistance;
    let extraHTML = '';
    if (distance !== null) {
        const shipping = calculateShipping(distance, false, 1);
        if ((shipping.cost || 0) > 30000 && rec.price < 50000) extraHTML = '<div style="font-size:9px;color:#D62828;font-weight:700;margin-top:2px;">🔥 Kombinasi ini lebih hemat ongkir!</div>';
    }
    
    container.style.display = 'block';
    container.innerHTML = '<div style="background:linear-gradient(135deg,#F8F5EE,#FFFDF5);border:1px solid #E8E0D0;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">🤖</span><div style="flex:1;"><div style="font-size:9px;font-weight:600;color:#8B7355;">Rekomendasi AI</div><div style="font-weight:700;font-size:14px;color:#0F4D37;">' + escapeHTML(rec.name) + '</div><div style="font-size:11px;color:#666;">' + escapeHTML(rec.desc) + '</div>' + extraHTML + '</div><button onclick="window.addToCartAI(\'' + rec.id + '\')" class="btn-add-unified">+ Tambah</button></div>';
  }

  window.addToCartAI = function(productId) {
    if (addToCartLocked) return; lockAddToCart();
    const product = PRODUCTS.find(p => p.id === productId); if (!product) return;
    const spice = product.defaultSpice || 3, cartKey = productId + '_spice' + spice;
    const entry = state.cart[cartKey] || { qty: 0, spice: spice };
    entry.qty += 1; entry.spice = spice; state.cart[cartKey] = entry;
    invalidateCache(); updateUI(); showToast('✅ ' + product.name + ' ditambahkan!');
    const container = document.getElementById('aiRecommendationContainer'); if (container) container.style.display = 'none';
  };

  const SEARCH_SYNONYMS = {
    'asem': ['mangga muda','mangga mengkel','kedondong','asam'], 'manis': ['nanas','bengkoang','muscat','anggur','madu'],
    'pedas': ['sambal','mete','cabe','sambel','spicy'], 'seger': ['jambu','kristal','air','dingin','fresh'],
    'buah': ['mangga','nanas','jambu','bengkoang','kedondong','muscat','ubi','strawberry'],
    'premium': ['gaco','mahkota','vip','reserve','eksklusif'], 'hemat': ['serut','segar','klasik','murah'],
    'rame': ['rama','tampah','sharing'], 'kriuk': ['renyah','serut','kristal'], 'gurih': ['mete','kacang','premium']
  };

  function aiSearch(query) {
    if (!query || query.length < 2) return PRODUCTS.filter(p => !p.isHidden);
    const q = query.toLowerCase().trim(), words = q.split(/\s+/), synSets = [];
    words.forEach(word => {
      let found = false;
      for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
        if (key.includes(word) || word.includes(key) || synonyms.some(s => s.includes(word) || word.includes(s))) { synSets.push([key, ...synonyms]); found = true; break; }
      }
      if (!found) synSets.push([word]);
    });
    const uniqueTerms = [...new Set(synSets.flat())];
    const scored = PRODUCTS.filter(p => !p.isHidden).map(p => {
      let score = 0; const searchable = [p.name, p.desc, p.flavor, ...(p.tags || []), ...(p.buah || [])].join(' ').toLowerCase();
      uniqueTerms.forEach(term => {
        if (searchable.includes(term)) score += 1;
        if (p.name.toLowerCase().includes(term)) score += 3;
        if ((p.tags || []).some(t => t.toLowerCase().includes(term))) score += 2;
        if ((p.buah || []).some(b => b.toLowerCase().includes(term))) score += 1.5;
        if (p.flavor.toLowerCase().includes(term)) score += 2;
      });
      return { product: p, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.product);
    return scored.length === 0 ? PRODUCTS.filter(p => !p.isHidden && [p.name, p.desc, p.flavor, ...(p.tags || []), ...(p.buah || [])].join(' ').toLowerCase().includes(q)) : scored;
  }

  function renderAIUpsell(summary) {
    if (summary.items.length === 0 || !summary.subtotal) return '';
    const available = PRODUCTS.filter(p => !p.isHidden && !summary.items.some(i => i.id.startsWith(p.id))).sort((a, b) => a.price - b.price);
    if (available.length === 0) return '';

    let shippingCost = calculateShippingCost()?.shippingCost || 0;
    if (shippingCost / summary.subtotal > 0.5 && summary.subtotal < 75000 && available[0]) {
      const cheapest = available[0], qtyNeeded = Math.ceil((75000 - summary.subtotal) / cheapest.price);
      return '<div style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:12px;margin-top:10px;text-align:center;"><div style="font-size:13px;font-weight:700;color:#92400E;">💡 Ongkir lebih mahal dari produk!</div><div style="font-size:12px;color:#78350F;margin:4px 0;">Tambah <strong>' + qtyNeeded + 'x ' + cheapest.name + '</strong> (' + fmt(cheapest.price * qtyNeeded) + ') → dapat potongan Rp5.000 & ongkir lebih masuk akal!</div><button onclick="window.addToCartAI(\'' + cheapest.id + '\')" class="btn-add-unified" style="margin-top:6px;">+ Tambah</button></div>';
    }

    let bestScore = -1, bestProduct = null;
    available.forEach(p => {
      let score = 0; const priceRatio = p.price / summary.subtotal;
      if (priceRatio >= 0.3 && priceRatio <= 0.8) score += 3; else if (priceRatio > 0.8 && priceRatio <= 1.2) score += 2;
      if (summary.items.some(i => PRODUCTS.find(pp => pp.id === i.id)?.cat === 'classic') && p.cat === 'signature') score += 2;
      if (new Date().getHours() >= 11 && new Date().getHours() <= 14 && p.sambal?.includes('Mete')) score += 1;
      if (score > bestScore) { bestScore = score; bestProduct = p; }
    });
    if (!bestProduct || bestScore < 0) return '';
    return '<div style="background:linear-gradient(135deg,#FFF8E1,#FFECB3);border:1px solid #F4C430;border-radius:12px;padding:12px 14px;margin-top:10px;text-align:center;"><div style="font-size:10px;font-weight:600;color:#92400e;">🧠 AI Suggestion</div><div style="font-size:14px;font-weight:700;color:#3d2b00;margin:2px 0;">Tambah ' + fmt(bestProduct.price) + ' → <strong>' + escapeHTML(bestProduct.name) + '</strong></div><div style="font-size:11px;color:#795548;margin-bottom:6px;">' + escapeHTML(bestProduct.desc) + '</div><button onclick="window.addToCartAI(\'' + bestProduct.id + '\')" class="btn-add-unified">+ Tambah</button></div>';
  }

  function initAIChat() {
    const toggle = document.getElementById('aiChatToggle'), box = document.getElementById('aiChatBox'), close = document.getElementById('aiChatClose'), send = document.getElementById('aiChatSend'), input = document.getElementById('aiChatInput'), messages = document.getElementById('aiChatMessages');
    if (!toggle || !box) return;
    let isOpen = false;
    toggle.addEventListener('click', function() { isOpen = !isOpen; box.style.display = isOpen ? 'block' : 'none'; if (isOpen) { input.focus(); messages.scrollTop = messages.scrollHeight; } });
    close.addEventListener('click', function() { isOpen = false; box.style.display = 'none'; });
    function sendMessage() {
      const msg = input.value.trim(); if (!msg) return;
      const userDiv = document.createElement('div'); userDiv.style.cssText = 'text-align:right;margin-bottom:8px;';
      const userSpan = document.createElement('span'); userSpan.style.cssText = 'background:#0F4D37;color:white;padding:8px 14px;border-radius:16px;display:inline-block;max-width:85%;';
      userSpan.textContent = msg; userDiv.appendChild(userSpan); messages.appendChild(userDiv);
      input.value = ''; messages.scrollTop = messages.scrollHeight;
      setTimeout(function() {
        const lower = msg.toLowerCase(), replyDiv = document.createElement('div'); replyDiv.style.marginBottom = '8px';
        let reply = 'Coba tanya soal menu, rekomendasi, ongkir, sambal, atau harga ya!';
        if (lower.includes('menu') || lower.includes('produk')) reply = 'Ada ' + PRODUCTS.filter(p=>!p.isHidden).length + ' menu seru buat kamu.';
        else if (lower.includes('rekomend') || lower.includes('saran')) { const r = getAIRecommendation(); reply = r ? r.name + ' cocok banget! ' + fmt(r.price) : 'Coba Rujak Gaco!'; }
        else if (lower.includes('ongkir')) reply = 'Ongkir tergantung jarak ya kak, mulai Rp8.000 via Lalamove.';
        
        const replySpan = document.createElement('span'); replySpan.style.cssText = 'background:#E8F5E9;padding:8px 14px;border-radius:16px;color:#0F4D37;display:inline-block;max-width:85%;';
        replySpan.textContent = '🤖 ' + reply; replyDiv.appendChild(replySpan); messages.appendChild(replyDiv); messages.scrollTop = messages.scrollHeight;
      }, 500);
    }
    send.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });
  }

  // ============================================================
  // CHECKOUT & VALIDATION
  // ============================================================
  async function sendTelegramNotification(orderId, fullAddress) {
    try {
      const client = await getSupabase(); if (!client) return false;
      const summary = getCartSummaryCached(), shippingData = calculateShippingCost();
      const payload = {
        orderId, customerName: state.customerName || 'Guest', customerPhone: state.customerPhone, customerAddress: fullAddress,
        deliveryTime: document.getElementById('deliveryTime')?.value || '-', shippingProvider: state.shippingProvider === 'rujakco' ? 'Lalamove' : state.shippingProvider === 'paxel' ? 'Paxel Same Day' : 'Kurir Pembeli',
        vehicleType: state.vehicleType === 'motor' ? 'Motor' : 'Mobil', isPriority: state.isPriority ? 'Ya (+Rp8.000)' : 'Tidak',
        items: summary.items.map(i => `• ${i.name} ${i.spice ? '(Lv ' + i.spice + ')' : ''} x${i.qty} — ${fmt(i.lineTotal)}`).join('\n'),
        orderNotes: state.orderNotes || '-', isGift: state.isGift ? 'Ya' : 'Tidak', giftSender: state.giftSender || '-', giftMessage: state.giftMessage || '-',
        subtotal: fmt(summary.subtotal), discount: fmt(summary.discount), shippingCost: shippingData ? fmt(shippingData.shippingCost) : 'Rp0', total: shippingData ? fmt(shippingData.total) : fmt(summary.subtotal)
      };
      await client.functions.invoke('telegram-notify', { body: payload }); return true;
    } catch (err) { return false; }
  }

  function showFieldError(inputEl, message) {
    const existingErr = inputEl.parentElement.querySelector('.field-error'); if (existingErr) existingErr.remove();
    inputEl.classList.add('input-error');
    const errDiv = document.createElement('div'); errDiv.className = 'field-error'; errDiv.style.cssText = 'color:var(--red); font-size:11px; margin-top:4px;'; errDiv.textContent = message;
    inputEl.parentElement.appendChild(errDiv);
  }
  function clearFieldError(inputEl) { inputEl.classList.remove('input-error'); const err = inputEl.parentElement.querySelector('.field-error'); if (err) err.remove(); }

  function validateOrderForm() {
    let valid = true;
    const nameEl = document.getElementById('customerName'), phoneEl = document.getElementById('customerPhone'), addressEl = document.getElementById('customerAddress'), districtEl = document.getElementById('districtInput'), timeEl = document.getElementById('deliveryTime'), timeTrigger = document.getElementById('deliveryTimeTrigger');
    const name = nameEl.value.trim(), phone = phoneEl.value.replace(/[\s\-\(\)]/g, ''), baseAddress = addressEl.value.replace(/(?:,\s*)?Kec\..*$/gi, '').trim(), deliveryTime = timeEl.value;

    if (!name || name.length < 2) { showFieldError(nameEl, 'Nama minimal 2 karakter'); valid = false; } else clearFieldError(nameEl);
    if (!phone || !isValidPhone(phone)) { showFieldError(phoneEl, 'Format HP tidak valid (08xx)'); valid = false; } else clearFieldError(phoneEl);
    if (!baseAddress || baseAddress.length < 5) { showFieldError(addressEl, 'Alamat terlalu pendek'); valid = false; } else clearFieldError(addressEl);
    if (!state.selectedDistrict && state.shippingProvider !== 'pembeli') { showFieldError(districtEl, 'Pilih kecamatan'); valid = false; } else clearFieldError(districtEl);
    
    if (!deliveryTime || (deliveryTime === 'Same Day (Besok)' && state.shippingProvider !== 'paxel')) {
      if (state.shippingProvider !== 'paxel') { showFieldError(timeTrigger || timeEl, 'Pilih jam pengiriman'); valid = false; }
      else clearFieldError(timeTrigger || timeEl);
    } else clearFieldError(timeTrigger || timeEl);

    if (!valid) { showToast('❌ Mohon periksa kembali isian bertanda merah'); return null; }
    return { name, phone: normalizePhone(phone), baseAddress, district: state.selectedDistrict, deliveryTime };
  }

  function handleCheckout() {
    if (checkoutLocked) return;
    const validData = validateOrderForm();
    if (!validData) { document.getElementById('paymentModal')?.classList.remove('active'); document.body.style.overflow = ''; return; }

    const summary = getCartSummaryCached(), shippingData = calculateShippingCost();
    if (!shippingData) { showToast('⚠️ Hitung ongkir gagal. Pilih kecamatan.'); return; }
    if (shippingData.isOutOfRange && state.shippingProvider !== 'pembeli') { showToast('⚠️ Area di luar jangkauan. Hubungi admin.'); return; }

    const notes = document.getElementById('orderNotes').value.trim();
    const fullAddress = validData.baseAddress + (validData.district ? ', Kec. ' + validData.district.replace(/\b\w/g, l => l.toUpperCase()) : '');

    state.customerName = validData.name; state.customerPhone = validData.phone; state.customerAddress = validData.baseAddress; state.orderNotes = notes; saveCustomerData();
    checkoutLocked = true;
    const payBtn = document.querySelector('[data-action="confirm-wa"]');
    if (payBtn) { payBtn.textContent = '⏳ Menyiapkan Pesanan...'; payBtn.disabled = true; }

    const orderNumber = 'RJ' + Date.now().toString(36).slice(-6).toUpperCase();
    let waMsg = `🍜 *PESANAN RUJAK.CO*\n\n📋 *Order:* ${orderNumber}\n👤 *Nama:* ${validData.name}\n📱 *HP:* ${validData.phone}\n📍 *Alamat:* ${fullAddress}\n📅 *Kirim:* ${validData.deliveryTime}\n🚚 *Kurir:* ${state.shippingProvider === 'rujakco' ? 'Lalamove' : state.shippingProvider === 'paxel' ? 'Paxel Same Day' : 'Kurir Pembeli'}\n🛵 *Kendaraan:* ${state.vehicleType}\n${state.isPriority && state.shippingProvider !== 'paxel' ? '⚡ *Prioritas: Aktif*\n' : ''}\n📦 *Pesanan:*\n`;
    summary.items.forEach(i => waMsg += `• ${i.name} ${i.spice ? '(Lv '+i.spice+')' : ''} x${i.qty} — ${fmt(i.lineTotal)}\n`);
    if (notes) waMsg += `\n📝 *Catatan:*\n${notes}\n`;
    if (state.isGift) waMsg += `\n🎁 *KADO*\nDari: ${state.giftSender || '-'}\nUcapan: ${state.giftMessage || '-'}\n`;
    waMsg += `\n💰 *Biaya:*\nSubtotal: ${fmt(summary.subtotal)}\n${summary.discount > 0 ? 'Diskon: -'+fmt(summary.discount)+'\n' : ''}Ongkir: ${fmt(shippingData.shippingCost)}\n------------------------\n🟢 *TOTAL: ${fmt(shippingData.total)}*\n\n📸 *Kirim Bukti Transfer di bawah ini*`;

    getSupabase().then(client => {
      if (client) {
        client.from('orders').insert([{ order_id: orderNumber, customer_name: validData.name, customer_phone: validData.phone, customer_address: fullAddress, items: summary.items, total: shippingData.total, status: 'pending' }]).then(({error}) => { if (error) ErrorLogger.log('Supabase', error); });
        sendTelegramNotification(orderNumber, fullAddress);
      }
    });

    setTimeout(() => {
      checkoutLocked = false;
      if (payBtn) { payBtn.textContent = '💳 Kirim Bukti Transfer'; payBtn.disabled = false; }
      
      const paymentModal = document.getElementById('paymentModal'); if (paymentModal) paymentModal.classList.remove('active');
      const miniCartModal = document.getElementById('miniCartModal'); if (miniCartModal) miniCartModal.classList.remove('active');
      document.body.style.overflow = '';
      
      recordOrderHistory(summary.items);
      showOrderConfirmation(waMsg);
    }, 500);
  }

  function showOrderConfirmation(waMessage) {
    state.cart = {}; invalidateCache(); saveCart(); updateUI();
    var modal = document.createElement('div'); modal.id = 'orderConfirmationModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = '<div style="background:white;border-radius:20px;padding:32px 24px;max-width:360px;width:90%;text-align:center;"><div style="font-size:56px;">✅</div><h3>Pesanan Berhasil!</h3><p>Kirim bukti transfer via WhatsApp agar segera diproses.</p><button id="sendWaBtn" style="background:#25D366;color:white;border:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;width:100%;margin-bottom:8px;">💬 Buka WhatsApp</button><button id="backToMenuFromConfirm" style="background:none;border:1px solid #ddd;color:#666;padding:10px;border-radius:8px;width:100%;">Tutup</button></div>';
    document.body.appendChild(modal);
    document.getElementById('sendWaBtn').addEventListener('click', function() { if (waMessage) openWhatsApp(SYSTEM.WA_NUMBER, waMessage); modal.remove(); });
    document.getElementById('backToMenuFromConfirm').addEventListener('click', function() { modal.remove(); });
  }

  // ============================================================
  // RENDERING UI
  // ============================================================
  function updateStoreStatus() {
    const el = document.getElementById('storeStatusText'); if (!el) return;
    const now = new Date(), day = now.getDay(), timeInMinutes = now.getHours() * 60 + now.getMinutes();
    let isOpen = (day >= 1 && day <= 5) ? (timeInMinutes >= 600 && timeInMinutes < 1200) : (timeInMinutes >= 540 && timeInMinutes < 1080);
    el.textContent = isOpen ? 'Buka' : 'Tutup';
    document.getElementById('storeStatus')?.classList.toggle('closed', !isOpen);
    const banner = document.getElementById('storeStatusBanner'); if (banner) banner.style.display = isOpen ? 'none' : 'block';
  }

  function renderMenu() {
    const container = document.getElementById('menuList'), empty = document.getElementById('emptyState');
    document.getElementById('skeletonContainer').style.display = 'none';
    if (!container) return; container.style.display = 'block';
    
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
      const control = qty === 0 ? `<button type="button" class="add-btn btn-add-unified" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${firstCartKey}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${firstCartKey}">+</button></div>`;
      html += `<div class="menu-item" data-id="${p.id}"><div class="item-img-wrap"><img src="${p.thumbnail}" alt="${escapeHTML(p.name)}" loading="lazy"></div><div class="item-body"><div class="item-name-row"><span class="item-name">${escapeHTML(p.name)}</span>${p.badge ? `<span class="item-badge-right ${p.badgeColor}">${escapeHTML(p.badge)}</span>` : ''}</div><div class="item-flavor-row"><span class="item-flavor">${escapeHTML(p.flavor)}</span>${p.flavorTag ? `<span class="item-flavor-tag">${escapeHTML(p.flavorTag)}</span>` : ''}</div><div class="item-spice">${Array(5).fill(null).map((_, i) => i < (p.defaultSpice||3) ? '🌶️' : '<span style="opacity:0.25">🌶️</span>').join('')}</div><p class="item-desc">${escapeHTML(p.desc)}</p><div class="item-buah-chips">${(p.buah||[]).slice(0,4).map(b => `<span class="item-buah-chip">${escapeHTML(b)}</span>`).join('')}</div><div class="item-footer"><div><span class="item-price">${fmt(p.price)}</span></div>${control}</div></div></div>`;
    });
    container.innerHTML = html;
  }

  function renderAddons() {
    const container = document.getElementById('addonList'); if (!container) return;
    const filtered = ADDONS.filter(a => a.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || a.desc.toLowerCase().includes(state.searchQuery.toLowerCase()));
    container.innerHTML = filtered.map(a => {
      const qty = state.cart[a.id]?.qty || 0;
      const control = qty === 0 ? `<button type="button" class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` : `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      return `<div class="addon-card"><div class="addon-icon ${a.iconColor}"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div><div class="addon-name">${escapeHTML(a.name)}</div><div class="addon-desc">${escapeHTML(a.desc)}</div><div class="addon-footer"><span class="addon-price">${fmt(a.price)}</span>${control}</div></div>`;
    }).join('');
    document.getElementById('addonHeader').style.display = filtered.length > 0 ? 'flex' : 'none';
    document.getElementById('addonDivider').style.display = filtered.length > 0 ? 'block' : 'none';
  }

  function renderCart() {
    const summary = getCartSummaryCached();
    document.getElementById('missionSpend').checked = summary.subtotal >= SYSTEM.DISCOUNT_THRESHOLD;
    document.getElementById('checkShare').checked = state.hasShared;
    const bar = document.getElementById('bottom-bar'), fb = document.getElementById('floatingCartBtn');
    
    if (summary.totalQty > 0 && !state.isCartMinimized) {
      if (bar) bar.classList.add('visible');
      document.getElementById('cartPreview').textContent = summary.totalQty + ' item';
      document.getElementById('cartTotalDisplay').textContent = fmt(summary.subtotal - summary.discount);
      document.getElementById('discountLabel').style.display = summary.discount > 0 ? 'inline-block' : 'none';
      if (fb) fb.style.display = 'none';
    } else {
      if (bar) bar.classList.remove('visible');
      if (fb) { fb.style.display = summary.totalQty > 0 ? 'flex' : 'none'; document.getElementById('floatingBadge').textContent = summary.totalQty; }
    }
    saveCart();
  }

  function updateShippingDisplay() {
    const shippingData = calculateShippingCost();
    if (!shippingData) { document.getElementById('shippingSection').style.display = 'none'; return; }
    document.getElementById('shippingSection').style.display = 'block';
    const breakdownContent = document.getElementById('breakdownContent');
    
    if (shippingData.isOutOfRange) {
      breakdownContent.innerHTML = '<div>⚠️ Area ini di luar jangkauan kami. Pilih "Kurir Pembeli" atau hubungi admin.</div>';
    } else {
      let html = `<div>Jarak: <strong>${Math.ceil(shippingData.shippingDistance)} km</strong> <span style="font-size:10px;color:var(--gray-400);">${shippingData.shippingLabel}</span></div>`;
      if (state.shippingProvider === 'rujakco') {
        html += `<div>🚚 Tarif Dasar: <strong>${fmt(shippingData.baseLalamoveCost)}</strong></div>`;
        if (shippingData.isSurge) html += `<div style="color:#D62828;">⚡ Jam Sibuk (x${shippingData.surgeMultiplier}): +${fmt(shippingData.lalamoveCost - shippingData.baseLalamoveCost)}</div>`;
        if (state.isPriority) html += `<div>🚀 Prioritas: +Rp8.000</div>`;
      } else if (state.shippingProvider === 'paxel') {
        html += `<div>📦 Layanan: <strong>Same Day (Besok)</strong></div><div>📦 Tarif Paxel: <strong>${fmt(shippingData.baseLalamoveCost)}</strong></div>`;
      } else if (state.shippingProvider === 'pembeli') html += `<div>Total Ongkir: <strong>Gratis (Kurir Pembeli)</strong></div>`;
      html += `<div style="border-top:1px solid var(--gray-200);margin-top:6px;padding-top:6px;font-weight:700;">Total Ongkir: <strong style="color:var(--red);">${fmt(shippingData.shippingCost)}</strong></div>`;
      breakdownContent.innerHTML = html;
    }
    document.getElementById('finalSubtotal').textContent = fmt(getCartSummaryCached().subtotal);
    document.getElementById('finalDiscount').textContent = getCartSummaryCached().discount > 0 ? '-Rp' + getCartSummaryCached().discount.toLocaleString('id-ID') : 'Rp0';
    document.getElementById('finalShipping').textContent = shippingData.isOutOfRange ? 'Konfirmasi Admin' : fmt(shippingData.shippingCost);
    document.getElementById('finalTotal').textContent = shippingData.isOutOfRange ? 'Konfirmasi' : fmt(shippingData.total);
  }

  function renderMiniCart() {
    const summary = getCartSummaryCached();
    document.getElementById('miniCartList').innerHTML = summary.items.length === 0 ? '<p style="color:var(--gray-500);text-align:center;padding:20px 0;">Keranjang kosong</p>' : 
      summary.items.map(item => `<div class="mini-cart-item"><div class="mini-cart-info"><div class="mini-cart-name">${escapeHTML(item.name)}${item.spice ? ' (Lv '+item.spice+')' : ''}</div><div class="mini-cart-detail">${fmt(item.price)}</div></div><div class="mini-cart-qty"><button data-action="decrease" data-id="${item.cartId}">−</button><span>${item.qty}</span><button data-action="increase" data-id="${item.cartId}">+</button><button class="mini-cart-remove" data-action="remove" data-id="${item.cartId}">🗑️</button></div></div>`).join('');
    
    document.getElementById('cartSubtotalDisplay').textContent = fmt(summary.subtotal);
    document.getElementById('step1Upsell').innerHTML = renderAIUpsell(summary);
    
    if (state.selectedDistrict) {
      const displayStr = state.selectedDistrict.replace(/\b\w/g, l => l.toUpperCase());
      const distInput = document.getElementById('districtInput'); if (distInput) distInput.value = displayStr;
    }

    if (state.selectedDistrict || state.userDistance !== null) updateShippingDisplay();

    document.querySelectorAll('.ship-btn').forEach(b => b.classList.toggle('active', b.dataset.provider === state.shippingProvider));
    document.querySelectorAll('.veh-btn').forEach(b => b.classList.toggle('active', b.dataset.vehicle === state.vehicleType));

    const paxelOpt = document.getElementById('paxelOptions'), rujakOpt = document.getElementById('rujakcoOptions'), delTrigger = document.getElementById('deliveryTimeTrigger');
    if (state.shippingProvider === 'paxel') {
      if (paxelOpt) paxelOpt.style.display = 'block'; if (rujakOpt) rujakOpt.style.display = 'none'; if (delTrigger) delTrigger.style.display = 'none';
    } else {
      if (paxelOpt) paxelOpt.style.display = 'none'; if (rujakOpt) rujakOpt.style.display = 'block'; if (delTrigger) delTrigger.style.display = 'flex';
    }
  }

  // ============================================================
  // PRODUCT PAGE (HISTORY API) & PREMIUM INTERACTIONS
  // ============================================================
  function openProductPage(id) {
    const product = PRODUCTS.find(p => p.id === id); if (!product) return;
    document.getElementById('productPageImg').innerHTML = `<img src="${product.image}" alt="${product.name}" />`;
    document.getElementById('productPageName').textContent = product.name; document.getElementById('productPageDesc').textContent = product.desc;
    document.getElementById('productPageContainer').textContent = product.container || '-'; document.getElementById('productPageSize').textContent = product.size || '-';
    document.getElementById('productPageSambal').textContent = product.sambal || '-'; document.getElementById('productPageBuah').textContent = (product.buah || []).join(', ');
    document.getElementById('productPageTags').innerHTML = (product.tags || []).map(t => `<span>${t}</span>`).join('');
    document.getElementById('productPagePrice').textContent = fmt(product.price);
    
    const badgeEl = document.getElementById('productPageBadge');
    if (product.badge) { badgeEl.style.display = 'inline-block'; badgeEl.textContent = product.badge; badgeEl.className = 'product-page-badge ' + (product.badgeColor || ''); } else badgeEl.style.display = 'none';
    
    document.getElementById('spiceOptionsPage').innerHTML = Array.from({length:5}, (_,i) => i+1).map(i => `<button class="spice-option ${i === (product.defaultSpice||3) ? 'active' : ''}" data-spice="${i}">${i}</button>`).join('');
    document.getElementById('qtyNumPage').textContent = '1';
    state.currentProductPage = { id: product.id, spice: product.defaultSpice||3, qty: 1 };
    
    document.getElementById('productPage').style.display = 'block'; document.getElementById('mainContent').style.display = 'none'; document.body.style.overflow = 'hidden';
    window.history.pushState({ productPageOpen: true }, '', '?product=' + id);
  }

  function closeProductPage() {
    document.getElementById('productPage').style.display = 'none'; document.getElementById('mainContent').style.display = 'block'; document.body.style.overflow = '';
    if (window.history.state && window.history.state.productPageOpen) window.history.back();
    else window.history.replaceState(null, '', window.location.pathname);
  }

  window.addEventListener('popstate', function(e) {
    const productPage = document.getElementById('productPage');
    if (productPage && productPage.style.display === 'block') {
      productPage.style.display = 'none'; document.getElementById('mainContent').style.display = 'block'; document.body.style.overflow = '';
    }
  });

  function haptic(type) { if (navigator.vibrate) navigator.vibrate(type === 'light' ? 5 : 10); }

  function animateAddToCart(btn, imgSrc) {
    if (!imgSrc) return;
    const rect = btn.getBoundingClientRect();
    const clone = document.createElement('img');
    clone.src = imgSrc;
    clone.style.cssText = `position:fixed;width:60px;height:60px;left:${rect.left}px;top:${rect.top}px;border-radius:50%;z-index:9999;pointer-events:none;transition:all 0.8s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 10px 40px rgba(0,0,0,.3);object-fit:cover;`;
    document.body.appendChild(clone);
    const target = document.getElementById('floatingCartBtn');
    if (target) {
      const tRect = target.getBoundingClientRect();
      requestAnimationFrame(() => {
        clone.style.left = tRect.left + 'px'; clone.style.top = tRect.top + 'px';
        clone.style.width = '20px'; clone.style.height = '20px';
        clone.style.opacity = '0'; clone.style.transform = 'scale(0.3) rotate(360deg)';
      });
      setTimeout(() => clone.remove(), 900);
      const badge = document.getElementById('floatingBadge');
      if(badge) { badge.style.animation = 'badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1)'; setTimeout(()=>badge.style.animation='',400); }
    }
  }

  function initPremiumInteractions() {
    // Scroll Reveal Observer
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal-on-scroll, .stagger-children').forEach(el => revealObserver.observe(el));

    // Live Orders Ticker
    const liveOrders = ['Dina dari Bekasi memesan Rujak Gaco', 'Rina dari Jaktim memesan Rujak Rama', 'Aldo dari Depok memesan Rujak Segar'];
    let liveIdx = 0;
    setInterval(() => {
      const el = document.getElementById('liveOrderText');
      if(el) { el.style.opacity = '0'; setTimeout(() => { liveIdx = (liveIdx + 1) % liveOrders.length; el.textContent = liveOrders[liveIdx]; el.style.opacity = '1'; }, 300); }
    }, 5000);

    // Testimonial Cards Interval
    const testiCards = document.querySelectorAll('.testi-card'), testiDots = document.querySelectorAll('.testi-dot');
    let currentTesti = 0;
    if(testiCards.length > 0) {
      setInterval(() => {
        testiCards.forEach(c => c.classList.remove('active')); testiDots.forEach(d => d.classList.remove('active'));
        currentTesti = (currentTesti + 1) % testiCards.length;
        testiCards[currentTesti].classList.add('active'); if(testiDots[currentTesti]) testiDots[currentTesti].classList.add('active');
      }, 5000);
    }
  }

  // ============================================================
  // BIND EVENTS
  // ============================================================
  function bindEvents() {
    const searchInput = document.getElementById('searchInput');

    // Product Page Events
    document.getElementById('backFromProduct').addEventListener('click', closeProductPage);
    document.getElementById('shareProductPage').addEventListener('click', () => {
      const p = PRODUCTS.find(prod => prod.id === state.currentProductPage.id);
      if (p) {
        if (navigator.share) navigator.share({ title: p.name, text: p.desc, url: window.location.href.split('?')[0] + '?product=' + p.id });
        else copyShareLink(p.desc, window.location.href.split('?')[0] + '?product=' + p.id);
      }
    });

    document.getElementById('addToCartPage').addEventListener('click', function() {
      const { id, spice, qty } = state.currentProductPage;
      const cartKey = id + '_spice' + spice;
      const entry = state.cart[cartKey] || { qty: 0, spice: spice };
      entry.qty += qty; entry.spice = spice; state.cart[cartKey] = entry;
      invalidateCache(); updateUI(); showToast('✅ Ditambahkan ke keranjang!');
      const p = PRODUCTS.find(prod => prod.id === id);
      animateAddToCart(this, p ? p.thumbnail : '');
      setTimeout(() => closeProductPage(), 400);
    });

    document.getElementById('spiceOptionsPage').addEventListener('click', function(e) {
      if (e.target.classList.contains('spice-option')) {
        document.querySelectorAll('#spiceOptionsPage .spice-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active'); state.currentProductPage.spice = parseInt(e.target.dataset.spice);
      }
    });

    document.getElementById('qtyMinusPage').addEventListener('click', () => { if (state.currentProductPage.qty > 1) { state.currentProductPage.qty--; document.getElementById('qtyNumPage').textContent = state.currentProductPage.qty; } });
    document.getElementById('qtyPlusPage').addEventListener('click', () => { state.currentProductPage.qty++; document.getElementById('qtyNumPage').textContent = state.currentProductPage.qty; });

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault(); document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active')); this.classList.add('active');
        const tab = this.dataset.tab;
        if (tab === 'home') window.scrollTo({top: 0, behavior: 'smooth'}); else if (tab === 'explore') document.getElementById('menuList').scrollIntoView({behavior:'smooth'});
        else if (tab === 'chat') document.getElementById('aiChatToggle').click();
      });
    });

    document.getElementById('priorityToggle')?.addEventListener('change', function() { handlePriorityToggle(this.checked); });
    document.getElementById('priorityToggleMini')?.addEventListener('change', function() { handlePriorityToggle(this.checked); });
    document.getElementById('shareBtnModal')?.addEventListener('click', function() { state.hasShared = true; saveCustomerData(); invalidateCache(); updateUI(); showToast('✅ Diskon aktif!'); shareToWhatsApp(); });
    document.getElementById('promoTrigger')?.addEventListener('click', openPromoModal);
    document.getElementById('promoClose')?.addEventListener('click', closePromoModal);
    document.getElementById('closeBottomBar')?.addEventListener('click', function(e) { e.stopPropagation(); minimizeCart(); });
    document.getElementById('floatingCartBtn')?.addEventListener('click', expandCart);
    document.getElementById('giftToggle')?.addEventListener('change', function() { state.isGift = this.checked; document.getElementById('giftFields').style.display = this.checked ? 'block' : 'none'; saveCustomerData(); });

    document.getElementById('searchIconBtn')?.addEventListener('click', function() { const wrap = document.getElementById('searchInputWrap'); wrap.classList.toggle('open'); if (wrap.classList.contains('open')) searchInput.focus(); });
    searchInput?.addEventListener('input', updateClearButton);
    searchInput?.addEventListener('input', debounce(function() { state.searchQuery = this.value; invalidateCache(); updateUI(); }, 300));

    document.getElementById('btnAutoDetect')?.addEventListener('click', function() { state.useManualDistrict = false; state.selectedDistrict = ''; this.classList.add('active'); document.getElementById('btnManualDistrict').classList.remove('active'); detectLocation(); });
    document.getElementById('btnManualDistrict')?.addEventListener('click', function() { state.useManualDistrict = true; this.classList.add('active'); document.getElementById('btnAutoDetect').classList.remove('active'); document.getElementById('districtTrigger').click(); });
    document.getElementById('districtTrigger')?.addEventListener('click', function() { openCustomSelect('Pilih Kecamatan Tujuan', Object.keys(DISTRICT_MAP).map(k => ({ value: k, label: k.replace(/\b\w/g, l => l.toUpperCase()) + ' (~' + DISTRICT_MAP[k] + ' km)' })), function(val, lbl) { state.selectedDistrict = val; state.useManualDistrict = true; detectLocation(); renderMiniCart(); }); });

    document.querySelectorAll('.ship-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active')); this.classList.add('active'); state.shippingProvider = this.dataset.provider;
        if (state.shippingProvider === 'paxel') document.getElementById('deliveryTimeTrigger')?.classList.remove('input-error');
        invalidateCache(); renderMiniCart();
      });
    });

    document.querySelectorAll('.veh-btn').forEach(btn => {
      btn.addEventListener('click', function() { document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active')); this.classList.add('active'); state.vehicleType = this.dataset.vehicle; invalidateCache(); renderMiniCart(); });
    });

    document.getElementById('deliveryTimeTrigger')?.addEventListener('click', function() {
      openCustomSelect('Jam Pengiriman Besok', [{value:'Pagi (09:00 - 11:00)',label:'Pagi (09:00 - 11:00 WIB)'},{value:'Siang (11:00 - 13:00)',label:'Siang (11:00 - 13:00 WIB)'},{value:'Sore (14:00 - 17:00)',label:'Sore (14:00 - 17:00 WIB)'}], function(val, lbl) { document.getElementById('deliveryTime').value = val; document.getElementById('deliveryTimeLabel').textContent = lbl; document.getElementById('deliveryTimeTrigger').classList.remove('input-error'); });
    });

    // QRIS interactions
    const qi = document.getElementById('qrisImagePayment');
    if (qi) {
      let zoomLevel = 0;
      qi.addEventListener('click', function(e) {
        this.classList.remove('qr-zoomed-1', 'qr-zoomed-2', 'qr-zoomed-3');
        zoomLevel = (zoomLevel + 1) % 4;
        if (zoomLevel === 1) this.classList.add('qr-zoomed-1'); else if (zoomLevel === 2) this.classList.add('qr-zoomed-2'); else if (zoomLevel === 3) this.classList.add('qr-zoomed-3');
        e.stopPropagation();
      });
    }

    const copyAmountBtn = document.getElementById('copyAmountBtn');
    if (copyAmountBtn) {
      copyAmountBtn.addEventListener('click', function() {
        const nominal = (document.getElementById('paymentTotalDisplay')?.textContent || '').replace(/[^0-9]/g, '');
        if (nominal) { navigator.clipboard.writeText(nominal).then(() => showToast('✅ Nominal tersalin: Rp' + Number(nominal).toLocaleString('id-ID'))).catch(() => showToast('⚠️ Gagal menyalin')); }
        else showToast('⚠️ Total belum tersedia');
      });
    }

    // Global Event Delegation
    document.addEventListener('click', function(e) {
      if (e.target.closest('.add-btn, .wa-btn, .hero-cta')) haptic('medium');
      if (e.target.closest('.qty-btn')) haptic('light');

      if (e.target.closest('[data-action="open-cart"]') || e.target.closest('.cart-summary')) { openMiniCart(); return; }
      if (e.target.closest('#miniCartClose') || e.target === document.getElementById('miniCartModal')) { closeMiniCart(); return; }
      if (e.target.closest('#paymentClose')) { document.getElementById('paymentModal').classList.remove('active'); return; }
      if (e.target.closest('#promoClose') || e.target === document.getElementById('promoModal')) { closePromoModal(); return; }
      if (e.target.closest('#backFromProduct')) { closeProductPage(); return; }

      const ab = e.target.closest('[data-action]');
      if (ab) {
        const action = ab.dataset.action, id = ab.dataset.id;
        if (action === 'open-modal' && id) { openProductPage(id); return; }
        if (action === 'add-addon' && id) { if (addToCartLocked) return; lockAddToCart(); state.cart[id] = state.cart[id] || {qty:0}; state.cart[id].qty++; invalidateCache(); updateUI(); showToast('✅ Ditambahkan!'); return; }
        if (action === 'increase' && id && state.cart[id]) { if (addToCartLocked) return; lockAddToCart(); state.cart[id].qty++; invalidateCache(); updateUI(); return; }
        if (action === 'decrease' && id && state.cart[id]) { if (addToCartLocked) return; lockAddToCart(); state.cart[id].qty--; if (state.cart[id].qty <= 0) delete state.cart[id]; invalidateCache(); updateUI(); return; }
        if (action === 'remove' && id && state.cart[id]) { delete state.cart[id]; invalidateCache(); updateUI(); showToast('🗑️ Item dihapus'); return; }
        if (action === 'confirm-wa') { handleCheckout(); return; }
        if (action === 'toast') { showToast(ab.dataset.msg); return; }
      }

      if (e.target.closest('#btnOpenPayment')) {
        const validData = validateOrderForm(); if (!validData) return;
        const ft = document.getElementById('finalTotal').textContent;
        document.getElementById('paymentTotalDisplay').textContent = ft; document.getElementById('paymentTotalDisplay2').textContent = ft;
        document.getElementById('paymentModal').classList.add('active');
      }
      if (e.target.closest('#clearCartBtn')) { clearCart(); return; }
      
      if (e.target.closest('#downloadQrisBtnPayment')) {
        const qrImage = document.getElementById('qrisImagePayment');
        if (qrImage) {
          fetch(qrImage.src).then(r => r.blob()).then(blob => {
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'QRIS-RujakCo.jpg'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
          }).catch(() => { window.location.href = qrImage.src; });
        }
        return;
      }

      const mi = e.target.closest('.menu-item');
      if (mi && !e.target.closest('.add-btn') && !e.target.closest('.qty-btn')) { openProductPage(mi.dataset.id); return; }

      const cb = e.target.closest('.cat-pill');
      if (cb && cb.dataset.cat) { document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active')); cb.classList.add('active'); state.activeFilter = cb.dataset.cat; invalidateCache(); updateUI(); return; }

      if (e.target.closest('#clearSearchBtn')) { searchInput.value = ''; state.searchQuery = ''; invalidateCache(); updateUI(); updateClearButton(); return; }
    });
  }

  // ============================================================
  // AUTOCOMPLETE & LOCATION
  // ============================================================
  function createDistrictAutocomplete() {
    const input = document.getElementById('districtInput'), dropdown = document.getElementById('customDistrictDropdown');
    if (!input || !dropdown) return;
    input.addEventListener('input', function() {
      const val = this.value.toLowerCase().trim();
      if (!val || val.length < 1) { dropdown.style.display = 'none'; return; }
      const matches = Object.keys(DISTRICT_MAP).filter(n => n.includes(val));
      if (matches.length === 0) { dropdown.innerHTML = '<div style="padding:10px;color:var(--gray-400);font-size:13px;">Tidak ditemukan</div>'; dropdown.style.display = 'block'; return; }
      dropdown.innerHTML = matches.slice(0,10).map(n => `<div data-value="${n}" role="option" style="padding:10px 12px; cursor:pointer; border-bottom:1px solid var(--gray-100); font-size:14px;">${n.replace(/\b\w/g, l=>l.toUpperCase())}</div>`).join('');
      dropdown.style.display = 'block';
    });
    dropdown.addEventListener('click', function(e) {
      const target = e.target.closest('[data-value]'); if (!target) return;
      const val = target.dataset.value; input.value = val.replace(/\b\w/g, l=>l.toUpperCase());
      state.selectedDistrict = val; state.useManualDistrict = true; dropdown.style.display = 'none';
      updateShippingUI(DISTRICT_MAP[val], state.isPriority); renderMiniCart();
    });
    document.addEventListener('click', e => { if (!input.parentElement.contains(e.target)) dropdown.style.display = 'none'; });
  }

  function detectLocation() {
    var costEl = document.getElementById('shippingCost'), locDisp = document.getElementById('locationDisplay');
    if (costEl) costEl.textContent = '⏳'; if (locDisp) locDisp.textContent = 'Mendeteksi... ▾';
    if (state.useManualDistrict && state.selectedDistrict) {
      var dist = DISTRICT_MAP[state.selectedDistrict] || estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, -6.2, 106.8));
      state.userDistance = dist; if (locDisp) locDisp.textContent = state.selectedDistrict.replace(/\b\w/g, l=>l.toUpperCase()) + ' ▾';
      updateShippingUI(dist, state.isPriority); renderMiniCart(); return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        var dist = estimateRoadDistance(haversineDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, pos.coords.latitude, pos.coords.longitude));
        state.userDistance = dist; if (locDisp) locDisp.textContent = 'Lokasi GPS ▾'; updateShippingUI(dist, state.isPriority);
      }, function() {
        if (locDisp) locDisp.textContent = 'Pilih lokasi ▾'; if (costEl) { costEl.textContent = 'Pilih kecamatan'; costEl.style.color = 'var(--gray-500)'; } showToast('📍 GPS tidak aktif, pilih manual.');
      }, { enableHighAccuracy: true, timeout: SYSTEM.LOCATION_TIMEOUT });
    }
  }

  function updateUI() { invalidateCache(); renderMenu(); renderAddons(); renderCart(); renderAIRecommendation(); refreshShippingDisplays(); if (document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart(); }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    loadCart(); loadCustomerData(); updateStoreStatus();
    try { state.isCartMinimized = localStorage.getItem('rujak_cart_minimized') === 'true'; } catch(_) {}
    createDistrictAutocomplete(); detectLocation(); updateUI(); bindEvents(); initAIChat(); initPremiumInteractions();

    const urlParams = new URLSearchParams(window.location.search), productId = urlParams.get('product');
    if (productId && PRODUCTS.some(p => p.id === productId)) setTimeout(() => openProductPage(productId), 300);

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    setInterval(updateStoreStatus, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
