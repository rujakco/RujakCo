// ============================================================
// ================ APP ENTRY POINT ============================
// ============================================================

import { 
  escapeHTML, fmt, debounce, normalizePhone, openWhatsApp, 
  shareToWhatsApp, showToast, showConfirmModal 
} from './utils.js';

import { 
  SYSTEM, DISTRICT_MAP, 
  calculateSubsidy, calculateLalamoveCost, calculateShipping, 
  getLocationFallback, updateShippingUI, 
  setStateRef as setShippingStateRef 
} from './shipping.js';

import { 
  loadCart, saveCart, getItemById, getCartSummary, 
  getCartSummaryCached, invalidateCache, calculateDiscount, 
  recordOrderHistory, saveCustomerData, loadCustomerData,
  setStateRef as setCartStateRef,
  setProductsRef as setCartProductsRef
} from './cart.js';

import { 
  getAIRecommendation, renderAIRecommendation, aiSearch, 
  renderAIUpsell, initAIChat, 
  setStateRef as setAIStateRef,
  setProductsRef as setAIProductsRef
} from './ai-engine.js';

import { 
  showOrderConfirmation, saveOrderToDatabase, handleCheckout,
  setStateRef as setCheckoutStateRef,
  setSupabaseFn, setUpdateUIFn
} from './checkout.js';

import { 
  lockAddToCart, updateStoreStatus, updateFloatingButton, 
  renderMenu, renderAddons, updateProgressBar, updateMissionCheckboxes, 
  renderCart, renderMiniCart, updateUI,
  setStateRef as setUIStateRef,
  setProductsRef as setUIProductsRef
} from './ui.js';

// ============================================================
// ================ PRODUCTS & ADDONS ==========================
// ============================================================

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

// ============================================================
// ================ SUPABASE ===================================
// ============================================================

const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";

let supabase = null;

function getSupabase() {
  return new Promise((resolve) => {
    if (supabase) return resolve(supabase);
    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return resolve(supabase);
    }
    let attempts = 0;
    const maxAttempts = 50;
    const interval = setInterval(() => {
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

// ============================================================
// ================ STATE ======================================
// ============================================================

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
  useManualDistrict: false,
  selectedDistrict: '',
  hasShared: false,
  shippingProvider: 'rujakco',
  vehicleType: 'motor',
  currentStep: 1,
  currentSurge: null
};

// ============================================================
// ================ SET REFERENCES =============================
// ============================================================

// Set references ke semua module
setShippingStateRef(state);
setCartStateRef(state);
setCartProductsRef(PRODUCTS, ADDONS);
setAIStateRef(state);
setAIProductsRef(PRODUCTS);
setCheckoutStateRef(state);
setSupabaseFn(getSupabase);
setUpdateUIFn(updateUI);
setUIStateRef(state);
setUIProductsRef(PRODUCTS, ADDONS);

// ============================================================
// ================ FUNCTIONS ==================================
// ============================================================

function goToStep(step) {
  if (step === 3) step = 2;
  state.currentStep = step;
  document.querySelectorAll('.cart-step').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });
  const se = document.getElementById('cartStep' + step);
  if (se) {
    se.style.display = 'block';
    se.classList.add('active');
  }
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 === step) el.classList.add('active');
    else if (i + 1 < step) el.classList.add('done');
  });
  renderMiniCart();
}
window.goToStep = goToStep;

// ============================================================
// ================ PRODUCT MODAL ==============================
// ============================================================

const productModal = document.getElementById('productModal');
const SPICE_NAMES = ['Mild', 'Sedang', 'Pedas', 'Extra Pedas', 'Very Hot'];

function openProductModal(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  
  const oldRitual = document.querySelector('.ritual-box');
  if (oldRitual) oldRitual.remove();
  const oldHarga = document.querySelector('.harga-box');
  if (oldHarga) oldHarga.remove();
  
  const imgEl = document.createElement('img');
  imgEl.src = product.image;
  imgEl.alt = product.name;
  imgEl.addEventListener('error', function() {
    this.style.display = 'none';
    this.parentElement.textContent = product.name.substring(0, 20);
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
  ritualDiv.innerHTML = `
    <div style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.05em;">🎯 Ritual Nikmat</div>
    <div style="font-size:11px;color:var(--gray-700);margin-top:4px;line-height:1.6;">
      <span style="color:var(--green);font-weight:700;">①</span> Tuang sambal ke wadah<br>
      <span style="color:var(--green);font-weight:700;">②</span> Aduk rata & nikmati tiap gigitan<br>
      <span style="color:var(--green);font-weight:700;">③</span> Tambah level pedas sesuai selera
    </div>`;
  document.getElementById('modalTags').after(ritualDiv);
  
  const breakdown = product.price <= 30000 ?
    (product.buah || []).length + ' jenis buah segar • sambal homemade • wadah food grade' :
    product.price <= 85000 ?
    (product.buah || []).length + ' jenis buah premium • sambal spesial • wadah jumbo' :
    (product.buah || []).length + '+ jenis buah • tampah bambu • sambal variant';
  
  const hargaDiv = document.createElement('div');
  hargaDiv.className = 'harga-box';
  hargaDiv.style.cssText = 'font-size:10px;color:var(--gray-500);margin:4px 0 6px;line-height:1.4;text-align:center;';
  hargaDiv.innerHTML = '💰 <strong>' + fmt(product.price) + '</strong> sudah termasuk:<br>' + breakdown;
  const detailGrid = document.getElementById('modalDetailGrid');
  if (detailGrid) detailGrid.after(hargaDiv);
  
  const btnPriceEl = document.getElementById('btnPrice');
  if (btnPriceEl) btnPriceEl.textContent = fmt(product.price);
  
  const modalAddEl = document.getElementById('modalAdd');
  if (modalAddEl) modalAddEl.dataset.id = product.id;
  
  const sel = document.getElementById('spiceSelect');
  sel.onchange = null;
  const dv = product.defaultSpice || 3;
  sel.value = dv;
  updateSpiceHighlight(dv);
  sel.onchange = function() {
    updateSpiceHighlight(parseInt(this.value, 10));
  };
  
  productModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function updateSpiceHighlight(l) {
  const el = document.getElementById('modalSpiceLabel');
  if (el) el.textContent = l + ' - ' + (SPICE_NAMES[l - 1] || 'Pedas');
}

function closeProductModal() {
  productModal.classList.remove('active');
  document.body.style.overflow = '';
}

// ============================================================
// ================ MINI CART MODAL ============================
// ============================================================

const miniCartModal = document.getElementById('miniCartModal');

function openMiniCart() {
  goToStep(1);
  if (miniCartModal) {
    miniCartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
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
  if (customerAddressEl) state.customerAddress = customerAddressEl.value.trim();
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

// ============================================================
// ================ PROMO MODAL ================================
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

// ============================================================
// ================ SEARCH =====================================
// ============================================================

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

function updateClearButton() {
  if (clearSearchBtn) {
    clearSearchBtn.classList.toggle('visible', searchInput.value.length > 0);
  }
}

// ============================================================
// ================ MINIMIZE / EXPAND CART =====================
// ============================================================

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

// ============================================================
// ================ PRIORITY TOGGLE ============================
// ============================================================

function handlePriorityToggle(checked) {
  state.isPriority = checked;
  const pt = document.getElementById('priorityToggle');
  if (pt) pt.checked = checked;
  const pm = document.getElementById('priorityToggleMini');
  if (pm) pm.checked = checked;
  if (state.userDistance !== null) updateShippingUI(state.userDistance, checked, state, renderMiniCart, invalidateCache);
  invalidateCache();
}

// ============================================================
// ================ DETECT LOCATION ============================
// ============================================================

let locationFallbackShown = false;

function showManualLocationFallback() {
  if (locationFallbackShown) return;
  locationFallbackShown = true;
  const costEl = document.getElementById('shippingCost');
  if (costEl) costEl.textContent = 'Pilih zona';
  const dw = document.getElementById('manualSelectWrapper');
  if (dw) dw.style.display = 'block';
  const bm = document.getElementById('btnManualDistrict');
  if (bm) bm.classList.add('active');
  const ba = document.getElementById('btnAutoDetect');
  if (ba) ba.classList.remove('active');
  showToast('⚠️ Pilih zona pengiriman secara manual');
}

function detectLocation() {
  locationFallbackShown = false;
  const costEl = document.getElementById('shippingCost');
  if (costEl) costEl.textContent = '⏳';
  
  if (state.useManualDistrict && state.selectedDistrict) {
    const dist = DISTRICT_MAP[state.selectedDistrict] || SYSTEM.DEFAULT_DISTANCE;
    state.userDistance = dist;
    document.getElementById('locationDisplay').textContent = state.selectedDistrict.replace(/\b\w/g, l => l.toUpperCase()) + ' ▾';
    updateShippingUI(dist, state.isPriority, state, renderMiniCart, invalidateCache);
    return;
  }
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const R = 6371;
        const dLat = (lat - SYSTEM.STORE_LAT) * Math.PI / 180;
        const dLon = (lng - SYSTEM.STORE_LNG) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(SYSTEM.STORE_LAT * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLon/2)**2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&zoom=10&accept-language=id', {
          headers: { 'User-Agent': 'RujakCo/1.0' }
        })
        .then(r => r.json())
        .then(data => {
          state.userDistance = distance;
          document.getElementById('locationDisplay').textContent = (data.address?.city || data.address?.town || 'Lokasi Anda') + ' ▾';
          updateShippingUI(distance, state.isPriority, state, renderMiniCart, invalidateCache);
          locationFallbackShown = false;
          const dw = document.getElementById('manualSelectWrapper');
          if (dw) dw.style.display = 'none';
          const bm = document.getElementById('btnManualDistrict');
          if (bm) bm.classList.remove('active');
        })
        .catch(function() {
          state.userDistance = distance;
          document.getElementById('locationDisplay').textContent = 'Lokasi Anda ▾';
          updateShippingUI(distance, state.isPriority, state, renderMiniCart, invalidateCache);
        });
      },
      function() {
        getLocationFallback().then(function(data) {
          state.userDistance = data.distance;
          document.getElementById('locationDisplay').textContent = data.city + ' ▾';
          updateShippingUI(data.distance, state.isPriority, state, renderMiniCart, invalidateCache);
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
      updateShippingUI(data.distance, state.isPriority, state, renderMiniCart, invalidateCache);
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

// ============================================================
// ================ BIND EVENTS ================================
// ============================================================

function bindEvents() {
  // Product modal add
  const ma = document.getElementById('modalAdd');
  if (ma && !ma._bound) {
    ma._bound = true;
    ma.addEventListener('click', function() {
      if (window._isAddToCartLocked) return;
      window._isAddToCartLocked = true;
      setTimeout(() => { window._isAddToCartLocked = false; }, 300);
      const baseId = this.dataset.id;
      if (baseId) {
        const spice = Math.min(5, Math.max(1, parseInt(document.getElementById('spiceSelect').value, 10) || 3));
        const cartKey = baseId + '_spice' + spice;
        const entry = state.cart[cartKey] || { qty: 0, spice: spice };
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
  const pt = document.getElementById('priorityToggle');
  if (pt) {
    pt.addEventListener('change', function() {
      handlePriorityToggle(this.checked);
    });
  }
  const pm = document.getElementById('priorityToggleMini');
  if (pm) {
    pm.addEventListener('change', function() {
      handlePriorityToggle(this.checked);
    });
  }
  
  // Share button
  const shareBtn = document.getElementById('shareBtnModal');
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
  const promoTrigger = document.getElementById('promoTrigger');
  if (promoTrigger) {
    promoTrigger.addEventListener('click', openPromoModal);
  }
  
  const promoClose = document.getElementById('promoClose');
  if (promoClose) {
    promoClose.addEventListener('click', closePromoModal);
  }
  
  if (promoModal) {
    promoModal.addEventListener('click', function(e) {
      if (e.target === promoModal) closePromoModal();
    });
  }
  
  // Close bottom bar
  const closeBar = document.getElementById('closeBottomBar');
  if (closeBar) {
    closeBar.addEventListener('click', function(e) {
      e.stopPropagation();
      minimizeCart();
    });
  }
  
  // Floating cart button
  const fb = document.getElementById('floatingCartBtn');
  if (fb) {
    fb.addEventListener('click', expandCart);
  }
  
  // Gift toggle
  const giftToggle = document.getElementById('giftToggle');
  if (giftToggle) {
    giftToggle.addEventListener('change', function() {
      state.isGift = this.checked;
      const gf = document.getElementById('giftFields');
      if (gf) gf.style.display = this.checked ? 'block' : 'none';
      saveCustomerData();
    });
  }
  
  // Customer form inputs
  const customerNameEl = document.getElementById('customerName');
  if (customerNameEl) {
    customerNameEl.addEventListener('input', function(e) {
      state.customerName = e.target.value;
    });
  }
  const customerPhoneEl = document.getElementById('customerPhone');
  if (customerPhoneEl) {
    customerPhoneEl.addEventListener('input', function(e) {
      state.customerPhone = e.target.value;
    });
  }
  const customerAddressEl = document.getElementById('customerAddress');
  if (customerAddressEl) {
    customerAddressEl.addEventListener('input', function(e) {
      state.customerAddress = e.target.value;
    });
  }
  
  // Search
  const sib = document.getElementById('searchIconBtn');
  const siw = document.getElementById('searchInputWrap');
  if (sib) {
    sib.addEventListener('click', function() {
      siw.classList.toggle('open');
      if (siw.classList.contains('open')) {
        searchInput.focus();
      }
    });
    document.addEventListener('click', function(e) {
      const wrap = document.getElementById('searchToggleWrap');
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
      const ro = document.getElementById('rujakcoOptions');
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
  const s1n = document.getElementById('step1Next');
  if (s1n) {
    s1n.addEventListener('click', function() {
      goToStep(2);
    });
  }
  
  const s2n = document.getElementById('step2Next');
  if (s2n) {
    s2n.addEventListener('click', function() {
      const nameEl = document.getElementById('customerName');
      const phoneEl = document.getElementById('customerPhone');
      const addressEl = document.getElementById('customerAddress');
      const name = nameEl?.value.trim() || '';
      const phone = phoneEl?.value.trim() || '';
      const address = addressEl?.value.trim() || '';
      
      if (!name || name.length < 2) {
        showToast('❌ Nama harus diisi minimal 2 karakter');
        if (nameEl) nameEl.focus();
        return;
      }
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
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
  const ba = document.getElementById('btnAutoDetect');
  if (ba) {
    ba.addEventListener('click', function() {
      state.useManualDistrict = false;
      state.selectedDistrict = '';
      this.classList.add('active');
      const bm = document.getElementById('btnManualDistrict');
      if (bm) bm.classList.remove('active');
      const dw = document.getElementById('manualSelectWrapper');
      if (dw) dw.style.display = 'none';
      detectLocation();
    });
  }
  
  const bm = document.getElementById('btnManualDistrict');
  if (bm) {
    bm.addEventListener('click', function() {
      state.useManualDistrict = true;
      this.classList.add('active');
      const ba2 = document.getElementById('btnAutoDetect');
      if (ba2) ba2.classList.remove('active');
      const dw = document.getElementById('manualSelectWrapper');
      if (dw) dw.style.display = 'block';
    });
  }
  
  const ds = document.getElementById('districtSelect');
  if (ds) {
    ds.addEventListener('change', function() {
      state.selectedDistrict = this.value;
      if (state.selectedDistrict) detectLocation();
    });
  }
  
  const mz = document.getElementById('manualZone');
  if (mz) {
    mz.addEventListener('change', function() {
      if (this.value) {
        state.userDistance = parseInt(this.value, 10);
        updateShippingUI(state.userDistance, state.isPriority, state, renderMiniCart, invalidateCache);
        showToast('✅ Zona diatur: ~' + this.value + ' km');
      }
    });
  }
  
  const locationPill = document.getElementById('locationPill');
  if (locationPill) {
    locationPill.addEventListener('click', function() {
      const msg = this.getAttribute('data-msg');
      if (msg) showToast(msg);
    });
  }
  
  // Global click handler
  document.addEventListener('click', function(e) {
    // Step indicator
    const stepEl = e.target.closest('[data-action="goto-step"]');
    if (stepEl) {
      const step = parseInt(stepEl.getAttribute('data-step'), 10);
      if (step && typeof goToStep === 'function') goToStep(step);
      return;
    }
    
    // Action buttons
    const ab = e.target.closest('[data-action]');
    if (ab) {
      const action = ab.dataset.action;
      const id = ab.dataset.id;
      
      if (action === 'open-modal' && id) {
        openProductModal(id);
        return;
      }
      if (action === 'open-cart') {
        openMiniCart();
        return;
      }
      if (action === 'add-addon' && id) {
        if (window._isAddToCartLocked) return;
        window._isAddToCartLocked = true;
        setTimeout(() => { window._isAddToCartLocked = false; }, 300);
        state.cart[id] = state.cart[id] || { qty: 0 };
        state.cart[id].qty++;
        invalidateCache();
        updateUI();
        showToast('Berhasil ditambahkan ✓');
        return;
      }
      if (action === 'increase' && id && state.cart[id]) {
        if (window._isAddToCartLocked) return;
        window._isAddToCartLocked = true;
        setTimeout(() => { window._isAddToCartLocked = false; }, 300);
        state.cart[id].qty++;
        invalidateCache();
        updateUI();
        if (miniCartModal && miniCartModal.classList.contains('active')) renderMiniCart();
        return;
      }
      if (action === 'decrease' && id && state.cart[id]) {
        if (window._isAddToCartLocked) return;
        window._isAddToCartLocked = true;
        setTimeout(() => { window._isAddToCartLocked = false; }, 300);
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
      const nameEl = document.getElementById('customerName');
      const phoneEl = document.getElementById('customerPhone');
      const addressEl = document.getElementById('customerAddress');
      const name = nameEl?.value.trim() || '';
      const phone = phoneEl?.value.trim() || '';
      const address = addressEl?.value.trim() || '';
      
      if (!name || name.length < 2) {
        showToast('❌ Nama harus diisi');
        if (nameEl) nameEl.focus();
        return;
      }
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
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
      
      const summary = getCartSummaryCached();
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
      
      const pt = document.getElementById('paymentTotalDisplay');
      if (pt) pt.textContent = document.getElementById('finalTotal')?.textContent || 'Rp0';
      closeMiniCart();
      const pmt = document.getElementById('paymentModal');
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
    const mi = e.target.closest('.menu-item');
    if (mi && !e.target.closest('.add-btn') && !e.target.closest('.qty-btn')) {
      openProductModal(mi.dataset.id);
      return;
    }
    
    // Category filter
    const cb = e.target.closest('.cat-pill');
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
    const ft = e.target.closest('[data-toggle="faq"]');
    if (ft) {
      const parent = ft.closest('.faq-item');
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
      // Reset checkout lock
      if (window._checkoutLocked) window._checkoutLocked = false;
      const pmt = document.getElementById('paymentModal');
      if (pmt) {
        pmt.classList.remove('active');
        document.body.style.overflow = '';
      }
      return;
    }
    
    // Download QRIS
    if (e.target.closest('#downloadQrisBtnPayment')) {
      const qi = document.getElementById('qrisImagePayment');
      if (qi) {
        const url = qi.src;
        fetch(url).then(r => r.blob()).then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'QRIS-RujakCo.jpg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
        }).catch(() => {
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
      const pmt = document.getElementById('paymentModal');
      if (pmt && pmt.classList.contains('active')) {
        if (window._checkoutLocked) window._checkoutLocked = false;
        pmt.classList.remove('active');
        document.body.style.overflow = '';
      }
      if (promoModal && promoModal.classList.contains('active')) closePromoModal();
    }
  });
  
  // QRIS zoom
  const qi = document.getElementById('qrisImagePayment');
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
    const header = document.getElementById('header');
    if (header) {
      header.classList.toggle('shadowed', window.scrollY > 4);
    }
  });
}

// ============================================================
// ================ INIT =======================================
// ============================================================

function init() {
  loadCart();
  loadCustomerData();
  updateStoreStatus();
  
  const districtSelect = document.getElementById('districtSelect');
  if (districtSelect) {
    districtSelect.innerHTML = '<option value="">Pilih kecamatan...</option>';
    Object.keys(DISTRICT_MAP).forEach(function(key) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = key.replace(/\b\w/g, l => l.toUpperCase()) + ' (~' + DISTRICT_MAP[key] + ' km)';
      districtSelect.appendChild(option);
    });
  }
  
  try {
    const s = localStorage.getItem('rujak_cart_minimized');
    if (s !== null) state.isCartMinimized = s === 'true';
  } catch(_) {}
  
  const pending = localStorage.getItem('last_order_pending');
  if (pending === 'true') {
    localStorage.removeItem('last_order');
    localStorage.removeItem('last_order_pending');
  }
  
  let storeStatusInterval = null;
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
    const int = setInterval(function() {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
        clearInterval(int);
      }
    }, 100);
  }
}

// ============================================================
// ================ START ======================================
// ============================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}