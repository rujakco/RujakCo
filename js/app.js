// ============================================================
// ================ APP ENTRY POINT ============================
// ============================================================

// --- SUPABASE ---
var SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";

var supabase = null;

function getSupabase() {
  return new Promise(function(resolve) {
    if (supabase) return resolve(supabase);
    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return resolve(supabase);
    }
    var attempts = 0;
    var maxAttempts = 50;
    var interval = setInterval(function() {
      attempts++;
      if (window.supabase && window.supabase.createClient) {
        clearInterval(interval);
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        resolve(supabase);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

// --- PRODUCTS ---
var PRODUCTS = [
  { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original Rujak.Co.', price:28000, cat:'classic', tags:['Pilihan Klasik','5 Buah'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Segar & Autentik', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp', isHidden:false },
  { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk pengalaman rasa yang lebih menyatu.', price:26000, cat:'classic', tags:['Renyah','Serut'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Merah'], flavor:'Renyah Segar', flavorTag:'Renyah', defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp', isHidden:false },
  { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah pilihan dengan sambal mete premium.', price:40000, cat:'signature', tags:['Mete Premium','Bestseller'], badge:'Koleksi Favorit', badgeColor:'red', container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Mete Premium (1 Cup)', buah:['Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Premium', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp', isHidden:false },
  { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah untuk dua hingga tiga orang.', price:48000, cat:'signature', tags:['Porsi Besar','Sharing'], badge:'Untuk Dibagi Bersama', badgeColor:'red', container:'Thinwall Jumbo 1000ml (PP Food Grade)', size:'Porsi Sharing', sambal:'Sambal Mete Premium (2 Cup)', buah:['Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Extra Pedas', flavorTag:null, defaultSpice:4, portion:'2-3 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp', isHidden:false },
  { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi premium dengan Shine Muscat.', price:85000, cat:'reserve', tags:['Eksklusif','Shine Muscat'], badge:'Reserve Collection', badgeColor:'gold', container:'Thinwall Jumbo 1000ml + Paper Bag', size:'Porsi Premium', sambal:'Sambal Mete Premium (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Eksklusif & Premium', flavorTag:null, defaultSpice:3, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:false },
  { id:'p_m6', name:'Tampah Nusantara', desc:'Sajian kebersamaan dalam tampah bambu.', price:200000, cat:'reserve', tags:['Tampah','Pre-Order'], badge:'Untuk 8-10 Orang', badgeColor:'gold', container:'Tampah Bambu Ø40cm + Kardus + Wrap', size:'Porsi Besar', sambal:'Varian Original & Mete (4 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi Merah'], flavor:'Kemegahan Berbagai Rasa', flavorTag:null, defaultSpice:3, portion:'8-10 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp', isHidden:false },
  { id:'p_vip', name:'Mahkota VIP', desc:'Menu rahasia eksklusif dengan komposisi premium.', price:125000, cat:'reserve', tags:['Eksklusif','VIP Only'], badge:'Menu Rahasia', badgeColor:'gold', container:'Box Premium + Paper Bag', size:'Porsi Eksklusif', sambal:'Sambal Mete Premium Spesial (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Harum Manis','Nanas Madu','Bengkoang','Strawberry'], flavor:'Premium & Misterius', flavorTag:'Limited', defaultSpice:2, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:true }
];

var ADDONS = [
  { id:'a_sambal1', name:'Sambal Original', price:8000, icon:'flame', iconColor:'text-red-500', desc:'Warisan rasa klasik.' },
  { id:'a_sambal2', name:'Sambal Mete Premium', price:12000, icon:'flame', iconColor:'text-red-600', desc:'Lebih gurih dan kaya rasa.' },
  { id:'a_extra_jambu', name:'Extra Jambu Kristal', price:10000, icon:'apple', iconColor:'text-green-500', desc:'Tambahan jambu kristal segar' },
  { id:'a_extra_muscat', name:'Extra Shine Muscat', price:15000, icon:'grape', iconColor:'text-purple-500', desc:'Tambahan anggur Shine Muscat impor' }
];

// --- SYSTEM CONFIG ---
var SYSTEM = {
  DISCOUNT_THRESHOLD: 100000,
  WA_NUMBER: '6289677161680',
  TOAST_DURATION: 3000,
  MAX_DISTANCE: 50,
  DEFAULT_DISTANCE: 2,
  SUBSIDY_TIER1: 75000,
  SUBSIDY_TIER2: 125000,
  SUBSIDY_TIER3: 200000,
  SUBSIDY_AMOUNT1: 5000,
  SUBSIDY_AMOUNT2: 10000,
  PRIORITY_SURCHARGE: 8000,
  MAX_SUBSIDY: 30000,
  STORE_LAT: -6.2347,
  STORE_LNG: 106.9895,
  LOCATION_TIMEOUT: 12000,
  SUBSIDY_DURATION_MINUTES: 30
};

var DISTRICT_MAP = {
  'bekasi barat':3, 'bekasi timur':5, 'bekasi selatan':7, 'bekasi utara':8,
  'rawalumbu':6, 'jatiasih':9, 'pondokgede':12, 'cikarang':18,
  'jakarta pusat':18, 'jakarta selatan':20, 'jakarta timur':15,
  'jakarta barat':22, 'jakarta utara':25, 'depok':28,
  'bogor':35, 'tangerang':30, 'tangerang selatan':27
};

// --- STATE ---
var state = {
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
  useManualDistrict: false,
  selectedDistrict: '',
  hasShared: false,
  shippingProvider: 'rujakco',
  vehicleType: 'motor',
  currentStep: 1,
  currentSurge: null
};

var storeStatusInterval = null;

// --- GO TO STEP ---
function goToStep(step) {
  if (step === 3) step = 2;
  state.currentStep = step;
  document.querySelectorAll('.cart-step').forEach(function(el) {
    el.style.display = 'none';
    el.classList.remove('active');
  });
  var se = document.getElementById('cartStep' + step);
  if (se) {
    se.style.display = 'block';
    se.classList.add('active');
  }
  document.querySelectorAll('.step').forEach(function(el, i) {
    el.classList.remove('active', 'done');
    if (i + 1 === step) el.classList.add('active');
    else if (i + 1 < step) el.classList.add('done');
  });
  renderMiniCart();
}
window.goToStep = goToStep;

// --- PRODUCT MODAL ---
var productModal = document.getElementById('productModal');
var SPICE_NAMES = ['Mild', 'Sedang', 'Pedas', 'Extra Pedas', 'Very Hot'];

function openProductModal(id) {
  var product = PRODUCTS.find(function(p) { return p.id === id; });
  if (!product) return;
  
  var oldRitual = document.querySelector('.ritual-box');
  if (oldRitual) oldRitual.remove();
  var oldHarga = document.querySelector('.harga-box');
  if (oldHarga) oldHarga.remove();
  
  var imgEl = document.createElement('img');
  imgEl.src = product.image;
  imgEl.alt = product.name;
  imgEl.addEventListener('error', function() {
    this.style.display = 'none';
    this.parentElement.textContent = product.name.substring(0, 20);
  });
  
  var modalImg = document.getElementById('modalImg');
  modalImg.innerHTML = '';
  modalImg.appendChild(imgEl);
  
  var be = document.getElementById('modalBadge');
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
  document.getElementById('modalTags').innerHTML = (product.tags || []).map(function(t) {
    return '<span class="modal-tag">' + escapeHTML(t) + '</span>';
  }).join('');
  
  var ritualDiv = document.createElement('div');
  ritualDiv.className = 'ritual-box';
  ritualDiv.style.cssText = 'background:var(--ivory);border:1px solid var(--green-pale);border-radius:10px;padding:10px 12px;margin:8px 0;';
  ritualDiv.innerHTML = '' +
    '<div style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.05em;">🎯 Ritual Nikmat</div>' +
    '<div style="font-size:11px;color:var(--gray-700);margin-top:4px;line-height:1.6;">' +
      '<span style="color:var(--green);font-weight:700;">①</span> Tuang sambal ke wadah<br>' +
      '<span style="color:var(--green);font-weight:700;">②</span> Aduk rata & nikmati tiap gigitan<br>' +
      '<span style="color:var(--green);font-weight:700;">③</span> Tambah level pedas sesuai selera' +
    '</div>';
  document.getElementById('modalTags').after(ritualDiv);
  
  var breakdown = product.price <= 30000 ?
    (product.buah || []).length + ' jenis buah segar • sambal homemade • wadah food grade' :
    product.price <= 85000 ?
    (product.buah || []).length + ' jenis buah premium • sambal spesial • wadah jumbo' :
    (product.buah || []).length + '+ jenis buah • tampah bambu • sambal variant';
  
  var hargaDiv = document.createElement('div');
  hargaDiv.className = 'harga-box';
  hargaDiv.style.cssText = 'font-size:10px;color:var(--gray-500);margin:4px 0 6px;line-height:1.4;text-align:center;';
  hargaDiv.innerHTML = '💰 <strong>' + fmt(product.price) + '</strong> sudah termasuk:<br>' + breakdown;
  var detailGrid = document.getElementById('modalDetailGrid');
  if (detailGrid) detailGrid.after(hargaDiv);
  
  var btnPriceEl = document.getElementById('btnPrice');
  if (btnPriceEl) btnPriceEl.textContent = fmt(product.price);
  
  var modalAddEl = document.getElementById('modalAdd');
  if (modalAddEl) modalAddEl.dataset.id = product.id;
  
  var sel = document.getElementById('spiceSelect');
  sel.onchange = null;
  var dv = product.defaultSpice || 3;
  sel.value = dv;
  updateSpiceHighlight(dv);
  sel.onchange = function() {
    updateSpiceHighlight(parseInt(this.value, 10));
  };
  
  productModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function updateSpiceHighlight(l) {
  var el = document.getElementById('modalSpiceLabel');
  if (el) el.textContent = l + ' - ' + (SPICE_NAMES[l - 1] || 'Pedas');
}

function closeProductModal() {
  productModal.classList.remove('active');
  document.body.style.overflow = '';
}

// --- MINI CART MODAL ---
var miniCartModal = document.getElementById('miniCartModal');

function openMiniCart() {
  goToStep(1);
  if (miniCartModal) {
    miniCartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeMiniCart() {
  var orderNotesEl = document.getElementById('orderNotes');
  if (orderNotesEl) state.orderNotes = orderNotesEl.value;
  var customerNameEl = document.getElementById('customerName');
  if (customerNameEl) state.customerName = customerNameEl.value.trim();
  var customerPhoneEl = document.getElementById('customerPhone');
  if (customerPhoneEl) state.customerPhone = customerPhoneEl.value.trim();
  var customerAddressEl = document.getElementById('customerAddress');
  if (customerAddressEl) state.customerAddress = customerAddressEl.value.trim();
  var giftToggleEl = document.getElementById('giftToggle');
  if (giftToggleEl) state.isGift = giftToggleEl.checked;
  var giftSenderEl = document.getElementById('giftSender');
  if (giftSenderEl) state.giftSender = giftSenderEl.value.trim();
  var giftMessageEl = document.getElementById('giftMessage');
  if (giftMessageEl) state.giftMessage = giftMessageEl.value.trim();
  if (miniCartModal) {
    miniCartModal.classList.remove('active');
    document.body.style.overflow = '';
  }
  saveCustomerData();
}

function clearCart() {
  if (Object.keys(state.cart).length === 0) {
    showToast('Keranjang sudah kosong');
    return;
  }
  showConfirmModal('Kosongkan Keranjang?', 'Semua item akan dihapus.', function() {
    state.cart = {};
    invalidateCache();
    updateUI();
    if (miniCartModal && miniCartModal.classList.contains('active')) renderMiniCart();
    showToast('Keranjang dikosongkan');
  });
}

// --- PROMO MODAL ---
var promoModal = document.getElementById('promoModal');

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

// --- SEARCH ---
var searchInput = document.getElementById('searchInput');
var clearSearchBtn = document.getElementById('clearSearchBtn');

function updateClearButton() {
  if (clearSearchBtn) {
    clearSearchBtn.classList.toggle('visible', searchInput.value.length > 0);
  }
}

// --- MINIMIZE / EXPAND CART ---
function minimizeCart() {
  state.isCartMinimized = true;
  localStorage.setItem('rujak_cart_minimized', 'true');
  var bar = document.getElementById('bottom-bar');
  if (bar) bar.classList.remove('visible');
  updateFloatingButton();
  var footer = document.querySelector('.footer-brand');
  if (footer) footer.style.paddingBottom = '0';
}

function expandCart() {
  state.isCartMinimized = false;
  localStorage.setItem('rujak_cart_minimized', 'false');
  updateFloatingButton();
  renderCart();
}

// --- PRIORITY TOGGLE ---
function handlePriorityToggle(checked) {
  state.isPriority = checked;
  var pt = document.getElementById('priorityToggle');
  if (pt) pt.checked = checked;
  var pm = document.getElementById('priorityToggleMini');
  if (pm) pm.checked = checked;
  if (state.userDistance !== null) updateShippingUI(state.userDistance, checked);
  invalidateCache();
}

// --- DETECT LOCATION ---
var locationFallbackShown = false;

function showManualLocationFallback() {
  if (locationFallbackShown) return;
  locationFallbackShown = true;
  var costEl = document.getElementById('shippingCost');
  if (costEl) costEl.textContent = 'Pilih zona';
  var dw = document.getElementById('manualSelectWrapper');
  if (dw) dw.style.display = 'block';
  var bm = document.getElementById('btnManualDistrict');
  if (bm) bm.classList.add('active');
  var ba = document.getElementById('btnAutoDetect');
  if (ba) ba.classList.remove('active');
  showToast('⚠️ Pilih zona pengiriman secara manual');
}

function detectLocation() {
  locationFallbackShown = false;
  var costEl = document.getElementById('shippingCost');
  if (costEl) costEl.textContent = '⏳';
  
  if (state.useManualDistrict && state.selectedDistrict) {
    var dist = DISTRICT_MAP[state.selectedDistrict] || SYSTEM.DEFAULT_DISTANCE;
    state.userDistance = dist;
    document.getElementById('locationDisplay').textContent = state.selectedDistrict.replace(/\b\w/g, function(l) {
      return l.toUpperCase();
    }) + ' ▾';
    updateShippingUI(dist, state.isPriority);
    return;
  }
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var R = 6371;
        var dLat = (lat - SYSTEM.STORE_LAT) * Math.PI / 180;
        var dLon = (lng - SYSTEM.STORE_LNG) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(SYSTEM.STORE_LAT * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&zoom=10&accept-language=id', {
          headers: { 'User-Agent': 'RujakCo/1.0' }
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          state.userDistance = distance;
          document.getElementById('locationDisplay').textContent = (data.address?.city || data.address?.town || 'Lokasi Anda') + ' ▾';
          updateShippingUI(distance, state.isPriority);
          locationFallbackShown = false;
          var dw = document.getElementById('manualSelectWrapper');
          if (dw) dw.style.display = 'none';
          var bm = document.getElementById('btnManualDistrict');
          if (bm) bm.classList.remove('active');
        })
        .catch(function() {
          state.userDistance = distance;
          document.getElementById('locationDisplay').textContent = 'Lokasi Anda ▾';
          updateShippingUI(distance, state.isPriority);
        });
      },
      function() {
        getLocationFallback().then(function(data) {
          state.userDistance = data.distance;
          document.getElementById('locationDisplay').textContent = data.city + ' ▾';
          updateShippingUI(data.distance, state.isPriority);
          if (data.distance >= 999) {
            showManualLocationFallback();
          }
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    getLocationFallback().then(function(data) {
      state.userDistance = data.distance;
      document.getElementById('locationDisplay').textContent = data.city + ' ▾';
      updateShippingUI(data.distance, state.isPriority);
      if (data.distance >= 999) {
        showManualLocationFallback();
      }
    });
  }
  
  setTimeout(function() {
    if (state.userDistance === null || state.userDistance >= 999) {
      showManualLocationFallback();
    }
  }, SYSTEM.LOCATION_TIMEOUT);
}

// --- BIND EVENTS ---
function bindEvents() {
  // Product modal add
  var ma = document.getElementById('modalAdd');
  if (ma && !ma._bound) {
    ma._bound = true;
    ma.addEventListener('click', function() {
      if (addToCartLocked) return;
      lockAddToCart();
      var baseId = this.dataset.id;
      if (baseId) {
        var spice = Math.min(5, Math.max(1, parseInt(document.getElementById('spiceSelect').value, 10) || 3));
        var cartKey = baseId + '_spice' + spice;
        var entry = state.cart[cartKey] || { qty: 0, spice: spice };
        entry.qty += 1;
        entry.spice = spice;
        state.cart[cartKey] = entry;
        invalidateCache();
        updateUI();
        showToast('Berhasil ditambahkan ✓');
        closeProductModal();
      }
    });
  }
  
  // Priority toggle
  var pt = document.getElementById('priorityToggle');
  if (pt) {
    pt.addEventListener('change', function() {
      handlePriorityToggle(this.checked);
    });
  }
  var pm = document.getElementById('priorityToggleMini');
  if (pm) {
    pm.addEventListener('change', function() {
      handlePriorityToggle(this.checked);
    });
  }
  
  // Share button
  var shareBtn = document.getElementById('shareBtnModal');
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      state.hasShared = true;
      saveCustomerData();
      invalidateCache();
      updateUI();
      showToast('Diskon Rp5.000 berhasil diaktifkan!');
      shareToWhatsApp();
    });
  }
  
  // Promo trigger
  var promoTrigger = document.getElementById('promoTrigger');
  if (promoTrigger) {
    promoTrigger.addEventListener('click', openPromoModal);
  }
  
  var promoClose = document.getElementById('promoClose');
  if (promoClose) {
    promoClose.addEventListener('click', closePromoModal);
  }
  
  if (promoModal) {
    promoModal.addEventListener('click', function(e) {
      if (e.target === promoModal) closePromoModal();
    });
  }
  
  // Close bottom bar
  var closeBar = document.getElementById('closeBottomBar');
  if (closeBar) {
    closeBar.addEventListener('click', function(e) {
      e.stopPropagation();
      minimizeCart();
    });
  }
  
  // Floating cart button
  var fb = document.getElementById('floatingCartBtn');
  if (fb) {
    fb.addEventListener('click', expandCart);
  }
  
  // Gift toggle
  var giftToggle = document.getElementById('giftToggle');
  if (giftToggle) {
    giftToggle.addEventListener('change', function() {
      state.isGift = this.checked;
      var gf = document.getElementById('giftFields');
      if (gf) gf.style.display = this.checked ? 'block' : 'none';
      saveCustomerData();
    });
  }
  
  // Customer form inputs
  var customerNameEl = document.getElementById('customerName');
  if (customerNameEl) {
    customerNameEl.addEventListener('input', function(e) {
      state.customerName = e.target.value;
    });
  }
  var customerPhoneEl = document.getElementById('customerPhone');
  if (customerPhoneEl) {
    customerPhoneEl.addEventListener('input', function(e) {
      state.customerPhone = e.target.value;
    });
  }
  var customerAddressEl = document.getElementById('customerAddress');
  if (customerAddressEl) {
    customerAddressEl.addEventListener('input', function(e) {
      state.customerAddress = e.target.value;
    });
  }
  
  // Search
  var sib = document.getElementById('searchIconBtn');
  var siw = document.getElementById('searchInputWrap');
  if (sib) {
    sib.addEventListener('click', function() {
      siw.classList.toggle('open');
      if (siw.classList.contains('open')) {
        searchInput.focus();
      }
    });
    document.addEventListener('click', function(e) {
      var wrap = document.getElementById('searchToggleWrap');
      if (wrap && !wrap.contains(e.target)) {
        siw.classList.remove('open');
      }
    });
  }
  
  searchInput.addEventListener('input', function() {
    updateClearButton();
  });
  
  searchInput.addEventListener('input', debounce(function() {
    state.searchQuery = this.value;
    invalidateCache();
    updateUI();
  }, 300));
  
  searchInput.addEventListener('keyup', updateClearButton);
  
  // Shipping options
  document.querySelectorAll('.ship-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ship-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      this.classList.add('active');
      state.shippingProvider = this.dataset.provider;
      var ro = document.getElementById('rujakcoOptions');
      if (ro) ro.style.display = state.shippingProvider === 'rujakco' ? 'block' : 'none';
      invalidateCache();
      updateUI();
    });
  });
  
  document.querySelectorAll('.veh-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.veh-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      this.classList.add('active');
      state.vehicleType = this.dataset.vehicle;
      invalidateCache();
      updateUI();
    });
  });
  
  // Step buttons
  var s1n = document.getElementById('step1Next');
  if (s1n) {
    s1n.addEventListener('click', function() {
      goToStep(2);
    });
  }
  
  var s2n = document.getElementById('step2Next');
  if (s2n) {
    s2n.addEventListener('click', function() {
      var nameEl = document.getElementById('customerName');
      var phoneEl = document.getElementById('customerPhone');
      var addressEl = document.getElementById('customerAddress');
      var name = nameEl?.value.trim() || '';
      var phone = phoneEl?.value.trim() || '';
      var address = addressEl?.value.trim() || '';
      
      if (!name || name.length < 2) {
        showToast('❌ Nama harus diisi minimal 2 karakter');
        if (nameEl) nameEl.focus();
        return;
      }
      var cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (!cleanedPhone || !/^(08\d{8,11}|\+628\d{8,10}|628\d{8,10})$/.test(cleanedPhone)) {
        showToast('❌ Format nomor HP tidak valid (08xx / 628xx)');
        if (phoneEl) phoneEl.focus();
        return;
      }
      if (!address || address.length < 5) {
        showToast('❌ Alamat terlalu pendek (min. 5 karakter)');
        if (addressEl) addressEl.focus();
        return;
      }
      
      state.customerName = name;
      state.customerPhone = phone;
      state.customerAddress = address;
      goToStep(3);
    });
  }
  
  // Manual location
  var ba = document.getElementById('btnAutoDetect');
  if (ba) {
    ba.addEventListener('click', function() {
      state.useManualDistrict = false;
      state.selectedDistrict = '';
      this.classList.add('active');
      var bm = document.getElementById('btnManualDistrict');
      if (bm) bm.classList.remove('active');
      var dw = document.getElementById('manualSelectWrapper');
      if (dw) dw.style.display = 'none';
      detectLocation();
    });
  }
  
  var bm = document.getElementById('btnManualDistrict');
  if (bm) {
    bm.addEventListener('click', function() {
      state.useManualDistrict = true;
      this.classList.add('active');
      var ba2 = document.getElementById('btnAutoDetect');
      if (ba2) ba2.classList.remove('active');
      var dw = document.getElementById('manualSelectWrapper');
      if (dw) dw.style.display = 'block';
    });
  }
  
  var ds = document.getElementById('districtSelect');
  if (ds) {
    ds.addEventListener('change', function() {
      state.selectedDistrict = this.value;
      if (state.selectedDistrict) detectLocation();
    });
  }
  
  var mz = document.getElementById('manualZone');
  if (mz) {
    mz.addEventListener('change', function() {
      if (this.value) {
        state.userDistance = parseInt(this.value, 10);
        updateShippingUI(state.userDistance, state.isPriority);
        showToast('✅ Zona diatur: ~' + this.value + ' km');
      }
    });
  }
  
  var locationPill = document.getElementById('locationPill');
  if (locationPill) {
    locationPill.addEventListener('click', function() {
      var msg = this.getAttribute('data-msg');
      if (msg) showToast(msg);
    });
  }
  
  // Global click handler
  document.addEventListener('click', function(e) {
    // Step indicator
    var stepEl = e.target.closest('[data-action="goto-step"]');
    if (stepEl) {
      var step = parseInt(stepEl.getAttribute('data-step'), 10);
      if (step && typeof goToStep === 'function') goToStep(step);
      return;
    }
    
    // Action buttons
    var ab = e.target.closest('[data-action]');
    if (ab) {
      var action = ab.dataset.action;
      var id = ab.dataset.id;
      
      if (action === 'open-modal' && id) {
        openProductModal(id);
        return;
      }
      if (action === 'open-cart') {
        openMiniCart();
        return;
      }
      if (action === 'add-addon' && id) {
        if (addToCartLocked) return;
        lockAddToCart();
        state.cart[id] = state.cart[id] || { qty: 0 };
        state.cart[id].qty++;
        invalidateCache();
        updateUI();
        showToast('Berhasil ditambahkan ✓');
        return;
      }
      if (action === 'increase' && id && state.cart[id]) {
        if (addToCartLocked) return;
        lockAddToCart();
        state.cart[id].qty++;
        invalidateCache();
        updateUI();
        if (miniCartModal && miniCartModal.classList.contains('active')) renderMiniCart();
        return;
      }
      if (action === 'decrease' && id && state.cart[id]) {
        if (addToCartLocked) return;
        lockAddToCart();
        state.cart[id].qty--;
        if (state.cart[id].qty <= 0) delete state.cart[id];
        invalidateCache();
        updateUI();
        if (miniCartModal && miniCartModal.classList.contains('active')) renderMiniCart();
        return;
      }
      if (action === 'remove' && id && state.cart[id]) {
        delete state.cart[id];
        invalidateCache();
        updateUI();
        if (miniCartModal && miniCartModal.classList.contains('active')) renderMiniCart();
        showToast('Item dihapus');
        return;
      }
      if (action === 'confirm-wa') {
        handleCheckout();
        return;
      }
      if (action === 'toast') {
        showToast(ab.dataset.msg);
        return;
      }
      if (action === 'share') {
        shareToWhatsApp();
        return;
      }
      if (action === 'open-promo') {
        openPromoModal();
        return;
      }
    }
    
    // Payment button
    if (e.target.closest('#btnOpenPayment')) {
      var nameEl = document.getElementById('customerName');
      var phoneEl = document.getElementById('customerPhone');
      var addressEl = document.getElementById('customerAddress');
      var name = nameEl?.value.trim() || '';
      var phone = phoneEl?.value.trim() || '';
      var address = addressEl?.value.trim() || '';
      
      if (!name || name.length < 2) {
        showToast('❌ Nama harus diisi');
        if (nameEl) nameEl.focus();
        return;
      }
      var cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (!cleanedPhone || !/^(08\d{8,11}|\+628\d{8,10}|628\d{8,10})$/.test(cleanedPhone)) {
        showToast('❌ Nomor HP tidak valid');
        if (phoneEl) phoneEl.focus();
        return;
      }
      if (!address || address.length < 5) {
        showToast('❌ Alamat terlalu pendek');
        if (addressEl) addressEl.focus();
        return;
      }
      
      var summary = getCartSummaryCached();
      if (summary.items.length === 0) {
        showToast('Keranjang kosong');
        return;
      }
      if (summary.isOutOfRange && state.shippingProvider !== 'pembeli') {
        showToast('Maaf, di luar jangkauan');
        return;
      }
      if (state.userDistance === null && state.shippingProvider !== 'pembeli') {
        showToast('Mohon tunggu, menghitung jarak...');
        return;
      }
      if (state.userDistance > SYSTEM.MAX_DISTANCE && state.shippingProvider !== 'pembeli') {
        showToast('Maaf, di luar jangkauan');
        return;
      }
      
      var pt = document.getElementById('paymentTotalDisplay');
      if (pt) pt.textContent = document.getElementById('finalTotal')?.textContent || 'Rp0';
      closeMiniCart();
      var pmt = document.getElementById('paymentModal');
      if (pmt) {
        pmt.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      return;
    }
    
    // Clear cart
    if (e.target.closest('#clearCartBtn')) {
      clearCart();
      return;
    }
    
    // Cart summary click
    if (e.target.closest('.cart-summary')) {
      openMiniCart();
      return;
    }
    
    // Menu item click (open modal)
    var mi = e.target.closest('.menu-item');
    if (mi && !e.target.closest('.add-btn') && !e.target.closest('.qty-btn')) {
      openProductModal(mi.dataset.id);
      return;
    }
    
    // Category filter
    var cb = e.target.closest('.cat-pill');
    if (cb && cb.dataset.cat) {
      document.querySelectorAll('.cat-pill').forEach(function(b) {
        b.classList.remove('active');
      });
      cb.classList.add('active');
      state.activeFilter = cb.dataset.cat;
      invalidateCache();
      updateUI();
      return;
    }
    
    // FAQ toggle
    var ft = e.target.closest('[data-toggle="faq"]');
    if (ft) {
      var parent = ft.closest('.faq-item');
      if (parent) parent.classList.toggle('open');
      return;
    }
    
    // Modal closes
    if (e.target.closest('#modalClose') || e.target === productModal) {
      closeProductModal();
      return;
    }
    if (e.target.closest('#miniCartClose') || e.target === miniCartModal) {
      closeMiniCart();
      return;
    }
    if (e.target.closest('#paymentClose') || e.target === document.getElementById('paymentModal')) {
      checkoutLocked = false;
      var pmt = document.getElementById('paymentModal');
      if (pmt) {
        pmt.classList.remove('active');
        document.body.style.overflow = '';
      }
      return;
    }
    
    // Download QRIS
    if (e.target.closest('#downloadQrisBtnPayment')) {
      var qi = document.getElementById('qrisImagePayment');
      if (qi) {
        var url = qi.src;
        fetch(url).then(function(r) { return r.blob(); }).then(function(blob) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'QRIS-RujakCo.jpg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
        }).catch(function() {
          window.location.href = url;
        });
      }
      return;
    }
    
    // Clear search
    if (e.target.closest('#clearSearchBtn')) {
      searchInput.value = '';
      state.searchQuery = '';
      invalidateCache();
      updateUI();
      updateClearButton();
      return;
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (productModal && productModal.classList.contains('active')) closeProductModal();
      if (miniCartModal && miniCartModal.classList.contains('active')) closeMiniCart();
      var pmt = document.getElementById('paymentModal');
      if (pmt && pmt.classList.contains('active')) {
        checkoutLocked = false;
        pmt.classList.remove('active');
        document.body.style.overflow = '';
      }
      if (promoModal && promoModal.classList.contains('active')) closePromoModal();
    }
  });
  
  // QRIS zoom
  var qi = document.getElementById('qrisImagePayment');
  if (qi) {
    qi.addEventListener('click', function() {
      this.classList.toggle('qr-zoomed');
    });
    qi.addEventListener('dblclick', function() {
      this.classList.toggle('qr-zoomed');
    });
  }
  
  // Header shadow
  window.addEventListener('scroll', function() {
    var header = document.getElementById('header');
    if (header) {
      header.classList.toggle('shadowed', window.scrollY > 4);
    }
  });
}

// --- INIT ---
function init() {
  loadCart();
  loadCustomerData();
  updateStoreStatus();
  
  var districtSelect = document.getElementById('districtSelect');
  if (districtSelect) {
    districtSelect.innerHTML = '<option value="">Pilih kecamatan...</option>';
    Object.keys(DISTRICT_MAP).forEach(function(key) {
      var option = document.createElement('option');
      option.value = key;
      option.textContent = key.replace(/\b\w/g, function(l) {
        return l.toUpperCase();
      }) + ' (~' + DISTRICT_MAP[key] + ' km)';
      districtSelect.appendChild(option);
    });
  }
  
  try {
    var s = localStorage.getItem('rujak_cart_minimized');
    if (s !== null) state.isCartMinimized = s === 'true';
  } catch(_) {}
  
  var pending = localStorage.getItem('last_order_pending');
  if (pending === 'true') {
    localStorage.removeItem('last_order');
    localStorage.removeItem('last_order_pending');
  }
  
  window.addEventListener('beforeunload', function() {
    localStorage.removeItem('last_order_pending');
    if (storeStatusInterval) clearInterval(storeStatusInterval);
  });
  
  storeStatusInterval = setInterval(updateStoreStatus, 60000);
  updateUI();
  detectLocation();
  bindEvents();
  initAIChat();
  
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  } else {
    var int = setInterval(function() {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
        clearInterval(int);
      }
    }, 100);
  }
}

// --- START ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}