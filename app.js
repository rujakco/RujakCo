// app.js — FINAL GABUNGAN: Semua perbaikan UX + Telegram aman via Edge Function
import { PRODUCTS } from './data/products.js';
import { SYSTEM, SPICE_LABELS } from './data/config.js';
import { fmt, showToast, debounce, escapeHTML, getSupabase, queuedSearch } from './utils/helpers.js';
import { loadState, saveCart, saveUser, clearUser, saveCustomer, loadCustomer, isStorageAvailable } from './modules/storage.js';
import { calculateShipping, getDrivingDistance, searchAddressOSM } from './modules/shipping.js';
import { renderMenu, renderProductSwiper, renderCart, renderMiniCart, getProductGlobalIndex } from './modules/render.js';
import { initCarousel } from './modules/carousel.js';
import { initAIChat } from './modules/chat.js';
import { initAccessibility } from './modules/accessibility.js';
import { initTestimonials } from './modules/testimonials.js';
import { validatePhone, validateAddress, getCartSummary } from './modules/checkout.js';
import { showOrderConfirmation as launchProReceipt } from './modules/checkout-receipt.js';

// ---------------------------------------------------------------------------
// STATE & STACK
// ---------------------------------------------------------------------------
const state = {
  cart: {},
  drafts: {},
  customerName: '',
  selectedDistrict: '',
  selectedDistrictFull: '',
  customerPhone: '',
  customerAddress: '',
  shippingProvider: 'rujakco',
  vehicleType: 'motor',
  isPriority: false,
  userDistance: null,
  lastViewedProductIndex: -1,
  currentOrderCode: null,
  receiptUrl: null,
};

PRODUCTS.forEach(p => {
  state.drafts[p.id] = { spice: p.defaultSpice ?? 3, qty: 1 };
});

const overlayStack = [];
window.__overlayStack__ = overlayStack;
let isProgrammaticBack = false;

// ---------------------------------------------------------------------------
// DOM CACHE
// ---------------------------------------------------------------------------
const DOM = {};
const cacheDOM = () => {
  DOM.onboardingOverlay = document.getElementById('onboardingOverlay');
  DOM.onbNewUser = document.getElementById('onbNewUser');
  DOM.onbReturningUser = document.getElementById('onbReturningUser');
  DOM.onbWelcomeName = document.getElementById('onbWelcomeName');
  DOM.onbWelcomeDistrict = document.getElementById('onbWelcomeDistrict');
  DOM.onbStep1 = document.getElementById('onbStep1');
  DOM.onbStep2 = document.getElementById('onbStep2');
  DOM.onbName = document.getElementById('onbName');
  DOM.onbDistrict = document.getElementById('onbDistrict');
  DOM.onbDistrictDropdown = document.getElementById('onbDistrictDropdown');
  DOM.header = document.getElementById('mainHeader');
  DOM.headerName = document.getElementById('headerNameDisplay');
  DOM.headerLoc = document.getElementById('headerLocDisplay');
  DOM.customerNameInput = document.getElementById('customerName');
  DOM.customerPhoneInput = document.getElementById('customerPhone');
  DOM.customerAddressInput = document.getElementById('customerAddress');
  DOM.districtInput = document.getElementById('districtInput');
  DOM.drawerDistrictDropdown = document.getElementById('drawerDistrictDropdown');
  DOM.aiWelcome = document.getElementById('aiWelcomeMsg');
  DOM.productPage = document.getElementById('productPage');
  DOM.productSwiperTrack = document.getElementById('productSwiperTrack');
  DOM.cartBadge = document.getElementById('cartBadgeNav');
  DOM.miniCartModal = document.getElementById('miniCartModal');
  DOM.miniCartList = document.getElementById('miniCartList');
  DOM.cartSubtotal = document.getElementById('cartSubtotalDisplay');
  DOM.finalShipping = document.getElementById('finalShipping');
  DOM.finalTotal = document.getElementById('finalTotal');
  DOM.paymentModal = document.getElementById('paymentModal');
  DOM.paymentTotal = document.getElementById('paymentTotalDisplay');
  DOM.aiChatBox = document.getElementById('aiChatBox');
  DOM.aboutModal = document.getElementById('aboutModal');
  DOM.shippingSection = document.getElementById('shippingSection');
  DOM.rujakcoOptions = document.getElementById('rujakcoOptions');
  DOM.paxelOptions = document.getElementById('paxelOptions');
  DOM.priorityToggle = document.getElementById('priorityToggleMini');
  DOM.mainContent = document.getElementById('mainContent');
  DOM.bottomNav = document.getElementById('bottomNav');
  DOM.liveCartRegion = document.getElementById('cartLiveRegion');
};

// ---------------------------------------------------------------------------
// UTILITY: Ekstrak nama pendek
// ---------------------------------------------------------------------------
function extractShortLocation(fullAddress) {
  if (!fullAddress) return '';
  const parts = fullAddress.split(',').map(p => p.trim());
  for (const p of parts) {
    const lower = p.toLowerCase();
    if (lower.includes('kecamatan') || lower.includes('kota') || lower.includes('kabupaten')) {
      const match = p.match(/(?:kecamatan|kota|kabupaten)\s+([^,]+)/i);
      if (match) return match[1].trim();
      return p.replace(/^(kecamatan|kota|kabupaten)\s*/i, '').trim();
    }
  }
  if (parts.length >= 2) return parts[1] || parts[0];
  return parts[0] || '';
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Gagal memuat script: ${src}`));
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// PERSONALISASI
// ---------------------------------------------------------------------------
function applyPersonalization() {
  const name = state.customerName || 'Tamu';
  const district = state.selectedDistrict || 'Pilih alamat tujuan';
  DOM.headerName.textContent = name;
  DOM.headerLoc.textContent = district;
  if (DOM.customerNameInput) DOM.customerNameInput.value = name !== 'Tamu' ? name : '';
  if (DOM.customerPhoneInput) DOM.customerPhoneInput.value = state.customerPhone;
  if (DOM.customerAddressInput) DOM.customerAddressInput.value = state.customerAddress;
  if (DOM.districtInput) DOM.districtInput.value = state.selectedDistrictFull || district;
  if (DOM.aiWelcome) DOM.aiWelcome.textContent = `Halo, ${name}! Ada yang bisa kami bantu untuk pesanan Anda?`;
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => { entry.target.classList.add('visible'); }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ---------------------------------------------------------------------------
// NAV SYNC & OVERLAY LOGIC
// ---------------------------------------------------------------------------
function setActiveNav(activeId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.id === activeId);
  });
}

function syncBottomNav() {
  setTimeout(() => {
    if (DOM.aiChatBox?.classList.contains('active')) {
      setActiveNav('aiChatToggle');
    } else if (DOM.miniCartModal?.classList.contains('active') ||
               document.getElementById('orderConfirmModal')?.classList.contains('active') ||
               DOM.paymentModal?.classList.contains('active')) {
      setActiveNav('navCartBtn');
    } else if (DOM.productPage?.classList.contains('active')) {
      setActiveNav('navProductBtn');
    } else {
      setActiveNav('navHomeBtn');
    }
  }, 50);
}

let previousFocusedElement = null;

function releaseInert() {
  const anyModalOpen = document.querySelector('.modal-overlay.active');
  const productPageOpen = DOM.productPage?.classList.contains('active');
  if (!anyModalOpen && !productPageOpen) {
    document.body.style.overflow = '';
    DOM.mainContent?.removeAttribute('inert');
    DOM.bottomNav?.removeAttribute('inert');
  }
}

function openModal(modalEl) {
  if (!modalEl) return;
  previousFocusedElement = document.activeElement;
  modalEl.classList.add('active');
  modalEl.setAttribute('aria-hidden', 'false');
  modalEl.removeAttribute('inert');
  document.body.style.overflow = 'hidden';
  overlayStack.push(modalEl);
  history.pushState({ isOverlay: true, id: modalEl.id }, '');
  DOM.mainContent?.setAttribute('inert', '');
  DOM.bottomNav?.setAttribute('inert', '');
  const firstInput = modalEl.querySelector('button, input, textarea, select');
  if (firstInput) firstInput.focus();
  syncBottomNav();
}

function closeModal(modalEl, fromPopState = false) {
  if (!modalEl) return;
  modalEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.setAttribute('inert', '');
  const index = overlayStack.indexOf(modalEl);
  if (index > -1) overlayStack.splice(index, 1);
  if (overlayStack.length === 0 && !DOM.productPage.classList.contains('active')) {
    document.body.style.overflow = '';
    DOM.mainContent?.removeAttribute('inert');
    DOM.bottomNav?.removeAttribute('inert');
  }
  releaseInert();
  if (previousFocusedElement && document.body.contains(previousFocusedElement)) {
    previousFocusedElement.focus();
  } else {
    document.getElementById('navHomeBtn')?.focus();
  }
  previousFocusedElement = null;
  if (!fromPopState) {
    isProgrammaticBack = true;
    history.back();
  }
  syncBottomNav();
}

function showConfirmModal(title, message, onConfirm) {
  const old = document.getElementById('confirmModal');
  if (old) old.remove();
  const triggerEl = document.activeElement;
  const modal = document.createElement('div');
  modal.id = 'confirmModal';
  modal.className = 'modal-overlay confirm-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="drawer-content confirm-modal-content">
      <h4>${title}</h4>
      <p>${message}</p>
      <div class="confirm-buttons">
        <button id="confirmNo" class="btn-outline">Batal</button>
        <button id="confirmYes" class="btn-danger">Hapus</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const btnNo = document.getElementById('confirmNo');
  const btnYes = document.getElementById('confirmYes');
  openModal(modal);
  btnNo.onclick = () => closeModal(modal);
  btnYes.onclick = () => {
    closeModal(modal);
    if (onConfirm) onConfirm();
  };
  modal.addEventListener('transitionend', (e) => {
    if (!modal.classList.contains('active') && e.target === modal) {
      modal.remove();
      if (triggerEl && document.body.contains(triggerEl)) triggerEl.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// PRODUCT PAGE
// ---------------------------------------------------------------------------
function openProductPage(globalIndex) {
  if (!DOM.productPage) return;
  // Disconnect observer lama sebelum buat baru
  if (DOM._productObserver) {
    DOM._productObserver.disconnect();
    DOM._productObserver = null;
  }
  renderProductSwiper(state.drafts);
  DOM.productPage.style.display = 'flex';
  void DOM.productPage.offsetWidth;
  DOM.productPage.classList.add('active');
  DOM.productPage.setAttribute('aria-hidden', 'false');
  DOM.productPage.removeAttribute('inert');
  document.body.style.overflow = 'hidden';
  state.lastViewedProductIndex = globalIndex;
  overlayStack.push(DOM.productPage);
  history.pushState({ isOverlay: true, id: 'productPage' }, '');
  const targetSlide = document.querySelector(`.product-slide[data-idx="${globalIndex}"]`);
  if (targetSlide && DOM.productSwiperTrack) {
    DOM.productSwiperTrack.style.scrollBehavior = 'auto';
    DOM.productSwiperTrack.scrollLeft = targetSlide.offsetLeft;
    DOM.productSwiperTrack.style.scrollBehavior = 'smooth';
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target.querySelector('.lazy-detail');
        if (img && img.dataset.src && !img.src) {
          img.src = img.dataset.src;
          img.onload = () => img.classList.add('loaded');
        }
      }
    });
  }, { rootMargin: '0px 0px 200px 0px' });
  document.querySelectorAll('.product-slide').forEach(slide => observer.observe(slide));
  DOM._productObserver = observer;
  syncBottomNav();
}

function closeProductPage(fromPopState = false) {
  if (!DOM.productPage) return;
  DOM.productPage.classList.remove('active');
  setTimeout(() => {
    DOM.productPage.style.display = 'none';
    DOM.productPage.setAttribute('aria-hidden', 'true');
    DOM.productPage.setAttribute('inert', '');
    const index = overlayStack.indexOf(DOM.productPage);
    if (index > -1) overlayStack.splice(index, 1);
    if (overlayStack.length === 0) document.body.style.overflow = '';
    document.getElementById('waVipSideTab')?.classList.remove('open');
    if (DOM._productObserver) {
      DOM._productObserver.disconnect();
      DOM._productObserver = null;
    }
    releaseInert();
    if (!fromPopState) {
      isProgrammaticBack = true;
      history.back();
    }
    syncBottomNav();
  }, 400);
}

// ---------------------------------------------------------------------------
// GESTURES
// ---------------------------------------------------------------------------
function initDetailGestures() {
  const track = DOM.productSwiperTrack;
  if (!track) return;
  let startX = 0, startY = 0;
  let activeSlide = null;
  let isPulling = false;
  let gestureDetermined = false;
  track.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    if (startX < 30 || startX > window.innerWidth - 30) {
      isPulling = false;
      activeSlide = null;
      return;
    }
    activeSlide = e.target.closest('.product-slide');
    isPulling = activeSlide && activeSlide.scrollTop <= 0;
    gestureDetermined = false;
  }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    if (!isPulling || !activeSlide) return;
    const dy = e.touches[0].clientY - startY;
    const dx = e.touches[0].clientX - startX;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (!gestureDetermined && (absDx > 8 || absDy > 8)) {
      if (absDx > absDy) { isPulling = false; return; }
      gestureDetermined = true;
    }
    if (gestureDetermined && dy > 0) {
      if (e.cancelable) e.preventDefault();
      const resistance = dy * (1 - (dy / (window.innerHeight * 1.5)));
      activeSlide.style.transform = `translateY(${Math.max(0, resistance)}px)`;
    }
  }, { passive: false });
  track.addEventListener('touchend', (e) => {
    if (!isPulling || !activeSlide || !gestureDetermined) { isPulling = false; activeSlide = null; return; }
    const dy = e.changedTouches[0].clientY - startY;
    activeSlide.style.transition = 'all 0.3s ease';
    if (dy > 120) {
      closeProductPage(false);
    } else {
      activeSlide.style.transform = 'translateY(0)';
    }
    setTimeout(() => {
      if (activeSlide) {
        activeSlide.style.transition = '';
        activeSlide.style.transform = '';
      }
      isPulling = false;
      activeSlide = null;
    }, 300);
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// CART & SHIPPING
// ---------------------------------------------------------------------------
function getCartSummaryLocal() {
  return getCartSummary(state.cart);
}

function updateShippingUI() {
  const dist = state.userDistance;
  const section = DOM.shippingSection;
  if (!section) return;
  const { subtotal, mainProductQty } = getCartSummaryLocal();
  if (dist != null) {
    section.style.display = 'block';
    const ship = calculateShipping(dist, mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority);
    const shipCost = ship.cost;
    const hasValidCost = shipCost !== null && shipCost !== undefined;
    document.getElementById('shippingDistance').textContent = `${dist} km`;
    DOM.finalShipping.textContent = hasValidCost ? fmt(shipCost) : '...';
    DOM.finalTotal.textContent = hasValidCost ? fmt(subtotal + shipCost) : fmt(subtotal);
  } else {
    section.style.display = 'none';
    if (DOM.finalTotal) DOM.finalTotal.textContent = fmt(subtotal);
  }
}

function updateCartUI() {
  saveCart(state.cart);
  renderCart(state.cart, ['cartBadgeNav']);
  if (DOM.miniCartModal?.classList.contains('active')) {
    renderMiniCart(state.cart);
    updateShippingUI();
  }
  // Live region update
  const totalItems = Object.values(state.cart).reduce((sum, item) => sum + item.qty, 0);
  if (DOM.liveCartRegion) {
    DOM.liveCartRegion.textContent = totalItems > 0
      ? `${totalItems} item di keranjang`
      : 'Keranjang kosong';
  }
  if (window.lucide) lucide.createIcons();
}

// ---------------------------------------------------------------------------
// DRAWER DISTRICT DROPDOWN (OSM)
// ---------------------------------------------------------------------------
function initDrawerDistrictDropdown() {
  const input = DOM.districtInput;
  const dropdown = DOM.drawerDistrictDropdown;
  if (!input || !dropdown) return;
  input.placeholder = 'Ketik alamat tujuan (jalan, kelurahan, kota)';
  
  const handleSearch = debounce(async (query) => {
    if (query.length < 3) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:var(--gray-500);">Mencari lokasi...</div>';
    dropdown.style.display = 'block';
    
    let results = [];
    try {
      results = await queuedSearch(query);
    } catch (err) {
      dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--danger);">Koneksi terputus. Gagal memuat lokasi.</div>';
      return;
    }

    if (results.length === 0) {
      dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--danger);">Lokasi tidak ditemukan. Coba lagi.</div>';
      return;
    }
    
    dropdown.innerHTML = results.map((place) => {
      const displayName = place.display_name.split(',').slice(0, 3).join(',');
      return `
        <div role="option" tabindex="0" data-lat="${place.lat}" data-lon="${place.lon}" data-name="${displayName}">
          <strong>${place.address.road || place.address.suburb || place.name}</strong><br>
          <span style="font-size:0.75rem;color:var(--gray-500);">${displayName}</span>
        </div>`;
    }).join('');
    input.setAttribute('aria-expanded', 'true');
  }, 500);

  input.addEventListener('input', (e) => {
    state.selectedDistrict = '';
    state.selectedDistrictFull = '';
    state.userDistance = null;
    updateShippingUI();
    handleSearch(e.target.value.trim());
  });

  dropdown.addEventListener('click', async (e) => {
    const option = e.target.closest('div[role="option"]');
    if (!option) return;
    input.value = 'Menghitung rute pengantaran...';
    dropdown.style.display = 'none';
    input.setAttribute('aria-expanded', 'false');
    const lat = parseFloat(option.dataset.lat);
    const lon = parseFloat(option.dataset.lon);
    const placeName = option.dataset.name;

    try {
      const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, lat, lon);
      state.userDistance = result.distance;
    } catch (err) {
      showToast('Gagal menghitung jarak, coba lagi.');
      return;
    }

    state.selectedDistrictFull = placeName;
    state.selectedDistrict = extractShortLocation(placeName);
    input.value = placeName;
    applyPersonalization();
    updateShippingUI();
    if (DOM.miniCartModal?.classList.contains('active')) renderMiniCart(state.cart);
    saveCustomer(state.customerPhone, state.customerAddress, placeName, state.userDistance);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
    }
  });
}

// ---------------------------------------------------------------------------
// ONBOARDING
// ---------------------------------------------------------------------------
async function resolveOnboardingDistance(districtName) {
  if (!districtName) return;
  try {
    const results = await queuedSearch(districtName);
    if (results.length > 0) {
      const place = results[0];
      const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, parseFloat(place.lat), parseFloat(place.lon));
      state.userDistance = result.distance;
      state.selectedDistrict = extractShortLocation(place.display_name) || districtName;
      state.selectedDistrictFull = place.display_name;
      saveCustomer(state.customerPhone, state.customerAddress, place.display_name, state.userDistance);
    }
  } catch (e) {
    console.warn('Gagal menghitung jarak dari onboarding');
  }
}

function initOnboarding() {
  const saved = loadState();
  if (saved?.name && saved.district) {
    state.customerName = saved.name;
    state.selectedDistrictFull = saved.district;
    state.selectedDistrict = extractShortLocation(saved.district) || saved.district;
    DOM.onbNewUser.style.display = 'none';
    DOM.onbReturningUser.style.display = 'block';
    DOM.onbWelcomeName.textContent = saved.name === 'Tamu' ? 'Pelanggan' : saved.name;
    DOM.onbWelcomeDistrict.textContent = state.selectedDistrict;
    resolveOnboardingDistance(state.selectedDistrict);
  } else {
    DOM.onbNewUser.style.display = 'block';
    DOM.onbStep1.classList.add('active');
  }

  document.getElementById('onbNextBtn').addEventListener('click', () => {
    const name = DOM.onbName.value.trim();
    if (!name) return showToast('Mohon isi nama Anda.');
    state.customerName = name;
    DOM.onbStep1.classList.remove('active');
    setTimeout(() => { DOM.onbStep2.classList.add('active'); DOM.onbDistrict.focus(); }, 100);
  });

  document.getElementById('onbGuestBtn')?.addEventListener('click', () => {
    state.customerName = 'Tamu';
    state.selectedDistrict = '';
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600);
    applyPersonalization();
    initScrollReveal();
  });

  const input = DOM.onbDistrict;
  const dropdown = DOM.onbDistrictDropdown;
  if (!input || !dropdown) return;

  input.placeholder = 'Ketik alamat tujuan (jalan, kelurahan, kota)';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'onbDistrictDropdown');
  input.setAttribute('aria-haspopup', 'listbox');

  let activeOptionIndex = -1;

  const renderOnbDropdown = (results) => {
    activeOptionIndex = -1;
    if (!results.length) {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      return;
    }
    dropdown.innerHTML = results.map((place, i) => {
      const displayName = place.display_name.split(',').slice(0, 3).join(',');
      return `
        <div role="option" id="onbDistrictOpt-${i}" tabindex="0"
             data-lat="${place.lat}" data-lon="${place.lon}"
             data-name="${displayName}"
             aria-selected="false">
          <strong>${place.address.road || place.address.suburb || place.name}</strong>
          <br><span style="font-size:0.75rem;color:var(--gray-500);">${displayName}</span>
        </div>`;
    }).join('');
    dropdown.style.display = 'block';
    input.setAttribute('aria-expanded', 'true');
  };

  const setActiveOnbOption = (index) => {
    const opts = dropdown.querySelectorAll('div[role="option"]');
    opts.forEach(o => o.setAttribute('aria-selected', 'false'));
    if (index >= 0 && index < opts.length) {
      opts[index].setAttribute('aria-selected', 'true');
      opts[index].scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', opts[index].id);
      activeOptionIndex = index;
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const selectOnbDistrict = async (lat, lon, displayName) => {
    dropdown.style.display = 'none';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    input.value = 'Menghitung jarak...';

    try {
      const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, lat, lon);
      state.userDistance = result.distance;
      state.selectedDistrictFull = displayName;
      state.selectedDistrict = extractShortLocation(displayName);
      input.value = displayName;
      applyPersonalization();
      saveCustomer(state.customerPhone, state.customerAddress, displayName, state.userDistance);
      showToast('✅ Lokasi berhasil dipilih!');
    } catch (err) {
      showToast('⚠️ Gagal menghitung jarak. Coba lagi.');
      input.value = displayName;
      state.selectedDistrictFull = displayName;
      state.selectedDistrict = extractShortLocation(displayName);
    }
  };

  const handleOnbSearch = debounce(async (query) => {
    if (query.length < 3) { dropdown.style.display = 'none'; input.setAttribute('aria-expanded', 'false'); return; }
    dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:var(--gray-500);">Mencari lokasi...</div>';
    dropdown.style.display = 'block';
    
    let fontResults = [];
    try {
      fontResults = await queuedSearch(query);
    } catch (err) {
      dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--danger);">Koneksi terputus. Gagal memuat lokasi.</div>';
      return;
    }
    renderOnbDropdown(fontResults);
  }, 700);

  input.addEventListener('input', (e) => {
    handleOnbSearch(e.target.value.trim());
  });

  input.addEventListener('focus', () => {
    if (input.value.length >= 3) handleOnbSearch(input.value.trim());
  });

  input.addEventListener('keydown', (e) => {
    const opts = dropdown.querySelectorAll('div[role="option"]');
    if (!opts.length || dropdown.style.display === 'none') {
      if (e.key === 'Enter' && input.value.trim().length >= 3) {
        e.preventDefault();
        handleOnbSearch(input.value.trim());
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveOnbOption(Math.min(activeOptionIndex + 1, opts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveOnbOption(Math.max(activeOptionIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeOptionIndex >= 0 && activeOptionIndex < opts.length) {
        const opt = opts[activeOptionIndex];
        selectOnbDistrict(parseFloat(opt.dataset.lat), parseFloat(opt.dataset.lon), opt.dataset.name);
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      input.focus();
    }
  });

  dropdown.addEventListener('click', (e) => {
    const opt = e.target.closest('div[role="option"]');
    if (!opt) return;
    selectOnbDistrict(parseFloat(opt.dataset.lat), parseFloat(opt.dataset.lon), opt.dataset.name);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('onbStartBtn').addEventListener('click', () => {
    if (!state.selectedDistrict) return showToast('Mohon pilih alamat tujuan.');
    saveUser(state.customerName, state.selectedDistrict);
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600);
    applyPersonalization();
    initScrollReveal();
  });

  document.getElementById('onbEnterBtn').addEventListener('click', () => {
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600);
    applyPersonalization();
    initScrollReveal();
  });

  document.getElementById('onbResetBtn').addEventListener('click', () => {
    clearUser();
    state.cart = {};
    updateCartUI();
    DOM.onbReturningUser.style.display = 'none';
    DOM.onbNewUser.style.display = 'block';
    DOM.onbStep2.classList.remove('active');
    DOM.onbStep1.classList.add('active');
  });
}

// ---------------------------------------------------------------------------
// WHATSAPP, TELEGRAM & DOWNLOAD STRUK
// ---------------------------------------------------------------------------
async function downloadReceiptPNG() {
  const element = document.getElementById('orderConfirmContent');
  if (!element) return null;
  if (typeof html2canvas === 'undefined') {
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    } catch {
      showToast('⚠️ Gagal memuat pustaka struk. Struk tidak dapat dibuat.');
      return null;
    }
  }
  try {
    const footer = document.querySelector('#orderConfirmModal .drawer-footer');
    if (footer) footer.style.display = 'none';
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
    });
    if (footer) footer.style.display = '';

    const sb = getSupabase();
    if (!sb) return null;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;

    const safeCode = state.currentOrderCode || `RJ-${new Date().getTime()}`;
    const cleanCode = safeCode.replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `${cleanCode}.png`;

    const { error } = await sb.storage
      .from('receipts')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      showToast('⚠️ Gagal menyimpan struk. Coba lagi.');
      return null;
    }

    const { data: publicUrl } = sb.storage.from('receipts').getPublicUrl(fileName);
    state.receiptUrl = publicUrl.publicUrl;
    return publicUrl.publicUrl;
  } catch (err) {
    showToast('⚠️ Gagal membuat struk. Silakan coba lagi.');
    return null;
  }
}

async function sendReceiptToTelegram() {
  if (!state.receiptUrl || !state.currentOrderCode) {
    console.warn('Telegram: tidak ada URL struk atau kode pesanan');
    return;
  }
  const supabase = getSupabase();
  if (!supabase) {
    console.error('Supabase client tidak tersedia');
    return;
  }
  const caption = `🧾 *Order Baru:* ${state.currentOrderCode}\n👤 ${state.customerName}\n📞 ${state.customerPhone}\n💰 Total: ${DOM.finalTotal?.textContent}`;
  try {
    await supabase.functions.invoke('send-telegram', {
      body: { order_code: state.currentOrderCode, receipt_url: state.receiptUrl, caption }
    });
    console.log('✅ Telegram terkirim via Edge Function');
  } catch (err) {
    console.error('Gagal mengirim ke Telegram:', err);
  }
}

async function sendReceiptToWhatsApp() {
  const summary = getCartSummaryLocal();
  if (summary.items.length === 0) {
    showToast('❌ Keranjang kosong, tidak bisa konfirmasi.');
    return;
  }

  const name = DOM.customerNameInput?.value || state.customerName || 'Tamu';
  const phone = DOM.customerPhoneInput?.value || state.customerPhone || '—';
  const address = DOM.customerAddressInput?.value || state.customerAddress || '—';
  const deliveryTime = document.getElementById('deliveryTime')?.value || '—';
  const notes = document.getElementById('orderNotes')?.value.trim() || 'Tidak ada catatan';
  let logisticInfo = state.shippingProvider === 'paxel' ? 'Paxel Ekspres' : 'Kurir RUJAK.Co';
  if (state.shippingProvider === 'rujakco') {
    logisticInfo += ` (${state.vehicleType === 'mobil' ? 'Mobil' : 'Motor'})`;
    if (state.isPriority) logisticInfo += ' [PRIORITAS]';
  }
  const shipCost = DOM.finalShipping?.textContent || '—';
  let totalCost = DOM.finalTotal?.textContent || '—';

  const distance = state.userDistance ? `${state.userDistance} km` : '—';
  let msg = `🧾 *STRUK PESANAN RUJAK.CO*\n🆔 *Order ID:* ${state.currentOrderCode || '—'}\n\n`;
  msg += `👤 *Penerima:* ${name}\n📞 *HP:* ${phone}\n📍 *Alamat:* ${address}\n`;
  msg += `\n🗺️ *Jarak:* ${distance}\n🕒 *Pengantaran:* ${deliveryTime}\n📝 *Catatan:* ${notes}\n🚚 *Kurir:* ${logisticInfo}\n\n📦 *Pesanan:*\n`;
  summary.items.forEach(item => {
    const spiceText = item.spice ? ` (Lv ${item.spice})` : '';
    msg += `• ${item.name}${spiceText} x${item.qty} = ${fmt(item.price * item.qty)}\n`;
  });
  msg += `\n💵 *Subtotal:* ${fmt(summary.subtotal)}\n🛵 *Ongkir:* ${shipCost}\n💰 *TOTAL TRANSFER:* *${totalCost}*\n\n`;
  msg += `📎 _Mohon lampirkan *gambar bukti transfer (QRIS)* Anda di sini agar reservasi dapat segera kami proses._`;

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('orders').insert({
        order_code: state.currentOrderCode,
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        district: state.selectedDistrict,
        distance_km: state.userDistance,
        items: summary.items,
        subtotal: summary.subtotal,
        shipping_cost: parseInt(shipCost.replace(/\D/g, '')) || null,
        total: parseInt(totalCost.replace(/\D/g, '')) || null,
        shipping_provider: logisticInfo,
        delivery_time: deliveryTime,
        notes,
        status: 'pending_payment'
      });
    } catch (err) {
      console.error("Gagal menyimpan ke database:", err);
    }
  }

  // Buka WhatsApp di tab baru, lalu bersihkan keranjang segera
  const waUrl = `https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  const newWindow = window.open(waUrl, '_blank', 'noopener');
  if (newWindow) {
    state.cart = {};
    updateCartUI();
    showToast('Pesanan terkirim. Lanjutkan pembayaran di WhatsApp.');
  } else {
    showToast('⚠️ Pop‑up diblokir. Silakan kirim manual ke WhatsApp kami.');
  }
}

// ---------------------------------------------------------------------------
// SHOW ORDER CONFIRMATION
// ---------------------------------------------------------------------------
async function showOrderConfirmation() {
  const receiptOk = await launchProReceipt(state, DOM, overlayStack, openModal, closeModal, getCartSummaryLocal, downloadReceiptPNG, sendReceiptToTelegram, DOM.finalTotal);
  return receiptOk;
}

// ---------------------------------------------------------------------------
// EVENT BINDINGS
// ---------------------------------------------------------------------------
function bindEvents() {
  document.getElementById('aboutTrigger')?.addEventListener('click', () => openModal(DOM.aboutModal));
  document.getElementById('aboutClose')?.addEventListener('click', () => closeModal(DOM.aboutModal));

  document.getElementById('shareProductBtn')?.addEventListener('click', () => {
    const track = DOM.productSwiperTrack;
    if (!track) return;
    const slideWidth = track.querySelector('.product-slide')?.offsetWidth || track.clientWidth;
    const currentIndex = Math.round(track.scrollLeft / slideWidth);
    const productId = PRODUCTS[currentIndex % PRODUCTS.length]?.id;
    if (!productId) return;
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const shareUrl = window.location.origin + window.location.pathname + '?product=' + productId;
    const shareText = `🍜 ${product.name} — ${product.desc}\nPesan sekarang di Rujak.Co!`;
    if (navigator.share) navigator.share({ title: product.name, text: shareText, url: shareUrl }).catch(() => {});
    else navigator.clipboard.writeText(shareUrl + '\n' + shareText).then(() => showToast('📋 Link produk disalin!')).catch(() => showToast('📋 Gagal menyalin link'));
  });

  document.getElementById('btnVipConcierge')?.addEventListener('click', (e) => {
    e.preventDefault();
    const text = encodeURIComponent("Halo RUJAK.Co, saya tertarik dengan layanan VIP Concierge.");
    window.open(`https://wa.me/${SYSTEM.WA_NUMBER}?text=${text}`, '_blank', 'noopener');
  });

  document.getElementById('waVipHandle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('waVipSideTab')?.classList.toggle('open');
  });

  document.getElementById('navHomeBtn')?.addEventListener('click', () => {
    if (DOM.productPage?.classList.contains('active')) {
      closeProductPage(false);
      setTimeout(releaseInert, 500);
      setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 200);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setActiveNav('navHomeBtn');
  });

  document.getElementById('navProductBtn')?.addEventListener('click', () => {
    if (DOM.productPage?.classList.contains('active')) return;
    openProductPage(state.lastViewedProductIndex >= 0 ? state.lastViewedProductIndex : 0);
  });

  document.getElementById('navCartBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (DOM.productPage?.classList.contains('active')) {
      closeProductPage(false);
      setTimeout(() => {
        openModal(DOM.miniCartModal);
        renderMiniCart(state.cart);
        updateShippingUI();
      }, 400);
    } else {
      openModal(DOM.miniCartModal);
      renderMiniCart(state.cart);
      updateShippingUI();
    }
  });

  const deliveryTrigger = document.getElementById('deliveryTimeTrigger');
  const deliveryDropdown = document.getElementById('deliveryTimeDropdown');
  const deliveryHidden = document.getElementById('deliveryTime');
  const deliveryLabel = document.getElementById('deliveryTimeLabel');
  let deliveryActiveIndex = 0;
  const preselected = deliveryDropdown?.querySelector('[aria-selected="true"]');
  if (preselected) { deliveryLabel.textContent = preselected.textContent; deliveryHidden.value = preselected.dataset.value; }

  function setDeliveryOption(option) {
    deliveryDropdown.querySelectorAll('[role="option"]').forEach(o => o.setAttribute('aria-selected', 'false'));
    option.setAttribute('aria-selected', 'true');
    deliveryLabel.textContent = option.textContent;
    deliveryHidden.value = option.dataset.value;
    closeDeliveryDropdown();
  }
  function closeDeliveryDropdown() {
    deliveryDropdown.style.display = 'none';
    deliveryTrigger.setAttribute('aria-expanded', 'false');
  }
  function openDeliveryDropdown() {
    deliveryDropdown.style.display = 'block';
    deliveryTrigger.setAttribute('aria-expanded', 'true');
    const opts = deliveryDropdown.querySelectorAll('[role="option"]');
    deliveryActiveIndex = [...opts].findIndex(o => o.getAttribute('aria-selected') === 'true');
    if (deliveryActiveIndex === -1) deliveryActiveIndex = 0;
    opts[deliveryActiveIndex]?.focus();
  }
  deliveryTrigger?.addEventListener('click', () => deliveryDropdown.style.display === 'block' ? closeDeliveryDropdown() : openDeliveryDropdown());
  deliveryTrigger?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDeliveryDropdown(); } });
  deliveryDropdown?.addEventListener('click', (e) => { const option = e.target.closest('[role="option"]'); if (option) setDeliveryOption(option); });
  deliveryDropdown?.addEventListener('keydown', (e) => {
    const opts = [...deliveryDropdown.querySelectorAll('[role="option"]')];
    if (!opts.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      deliveryActiveIndex = Math.min(deliveryActiveIndex + 1, opts.length - 1);
      opts.forEach((o, i) => o.setAttribute('aria-selected', i === deliveryActiveIndex ? 'true' : 'false'));
      opts[deliveryActiveIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      deliveryActiveIndex = Math.max(deliveryActiveIndex - 1, 0);
      opts.forEach((o, i) => o.setAttribute('aria-selected', i === deliveryActiveIndex ? 'true' : 'false'));
      opts[deliveryActiveIndex].focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setDeliveryOption(opts[deliveryActiveIndex]);
    } else if (e.key === 'Escape') {
      closeDeliveryDropdown();
      deliveryTrigger.focus();
    }
  });
  document.addEventListener('click', (e) => { if (!deliveryTrigger?.contains(e.target) && !deliveryDropdown?.contains(e.target)) closeDeliveryDropdown(); });

  document.getElementById('miniCartClose')?.addEventListener('click', () => closeModal(DOM.miniCartModal));
  document.getElementById('paymentClose')?.addEventListener('click', () => closeModal(DOM.paymentModal));
  document.getElementById('aiChatClose')?.addEventListener('click', () => closeModal(DOM.aiChatBox));
  document.getElementById('orderConfirmClose')?.addEventListener('click', () => closeModal(document.getElementById('orderConfirmModal')));

  DOM.customerNameInput?.addEventListener('input', () => {
    state.customerName = DOM.customerNameInput.value;
    saveUser(state.customerName, state.selectedDistrict);
    DOM.headerName.textContent = state.customerName || 'Tamu';
    if (DOM.aiWelcome) DOM.aiWelcome.textContent = `Halo, ${state.customerName || 'Tamu'}! Ada yang bisa kami bantu?`;
  });

  DOM.customerPhoneInput?.addEventListener('input', () => {
    DOM.customerPhoneInput.value = DOM.customerPhoneInput.value.replace(/\D/g, '');
    state.customerPhone = DOM.customerPhoneInput.value;
    saveCustomer(state.customerPhone, state.customerAddress, state.selectedDistrict, state.userDistance);
  });

  DOM.customerAddressInput?.addEventListener('input', () => {
    state.customerAddress = DOM.customerAddressInput.value;
    saveCustomer(state.customerPhone, state.customerAddress, state.selectedDistrict, state.userDistance);
  });

  // Handler utama untuk klik global
  document.addEventListener('click', async (e) => {
    const boutique = e.target.closest('.boutique-item');
    if (boutique) { const idx = parseInt(boutique.dataset.idx); if (!isNaN(idx)) openProductPage(idx); return; }

    const step1Btn = e.target.closest('.step-1-btn');
    if (step1Btn) {
      if (window.navigator.vibrate) window.navigator.vibrate(10);
      const idx = step1Btn.dataset.idx;
      const pid = step1Btn.dataset.pid;
      const step1 = document.getElementById(`step1_${idx}_${pid}`);
      const step2 = document.getElementById(`step2_${idx}_${pid}`);
      if (step1 && step2) {
        step1.style.transition = 'opacity 0.3s ease';
        step1.style.opacity = '0';
        setTimeout(() => { step1.style.display = 'none'; step2.style.display = 'block'; const firstOption = step2.querySelector('.spice-option'); if (firstOption) firstOption.focus(); }, 300);
      }
      return;
    }

    const spiceOption = e.target.closest('.spice-option');
    if (spiceOption) {
      const pid = spiceOption.dataset.pid;
      const val = parseInt(spiceOption.dataset.spice);
      state.drafts[pid].spice = val;
      document.querySelectorAll(`.spice-option[data-pid="${pid}"]`).forEach(b => b.classList.toggle('active', parseInt(b.dataset.spice) === val));
      document.querySelectorAll(`[id^="spiceLabel_"][id$="_${pid}"]`).forEach(el => el.textContent = SPICE_LABELS[val]);
      return;
    }

    const qtyPlus = e.target.closest('.qty-plus');
    const qtyMinus = e.target.closest('.qty-minus');
    if (qtyPlus || qtyMinus) {
      const pid = (qtyPlus || qtyMinus).dataset.pid;
      if (qtyPlus) state.drafts[pid].qty++;
      else if (state.drafts[pid].qty > 1) state.drafts[pid].qty--;
      document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = state.drafts[pid].qty);
      return;
    }

    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      if (window.navigator.vibrate) window.navigator.vibrate(10);
      const pid = addBtn.dataset.pid;
      const idx = addBtn.dataset.idx;
      const draft = state.drafts[pid];
      const cartKey = pid + '_spice' + draft.spice;
      if (!state.cart[cartKey]) state.cart[cartKey] = { id: pid, qty: 0, spice: draft.spice };
      state.cart[cartKey].qty += draft.qty;
      state.drafts[pid].qty = 1;
      document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = 1);
      updateCartUI();
      showToast('Sajian ditambahkan ke reservasi.');
      const cartNav = document.querySelector('.nav-cart-wrapper');
      if (cartNav) { cartNav.classList.remove('bump'); void cartNav.offsetWidth; cartNav.classList.add('bump'); }
      addBtn.classList.add('success-flash');
      setTimeout(() => addBtn.classList.remove('success-flash'), 400);
      setTimeout(() => {
        const step1 = document.getElementById(`step1_${idx}_${pid}`);
        const step2 = document.getElementById(`step2_${idx}_${pid}`);
        if (step1 && step2) { step1.style.display = 'block'; step2.style.display = 'none'; step1.style.opacity = '1'; }
      }, 500);
      return;
    }

    if (e.target.closest('[data-action="confirm-wa"]')) {
      sendReceiptToWhatsApp();
      closeModal(DOM.paymentModal);
      showToast('Terima kasih! Menyambungkan ke WhatsApp...');
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn && !actionBtn.classList.contains('add-to-cart-btn') && !actionBtn.classList.contains('step-1-btn')) {
      const id = actionBtn.dataset.id;
      const type = actionBtn.dataset.action;
      if (type === 'increase') { state.cart[id].qty++; }
      else if (type === 'decrease') {
        if (state.cart[id].qty === 1) {
          showConfirmModal('Hapus Sajian?', 'Sajian ini akan dihapus dari reservasi Anda.', () => {
            delete state.cart[id]; updateCartUI();
            if (DOM.miniCartModal.classList.contains('active')) renderMiniCart(state.cart);
            showToast('Sajian dihapus dari reservasi.');
          });
          return;
        }
        state.cart[id].qty--;
      }
      updateCartUI();
      if (DOM.miniCartModal.classList.contains('active')) renderMiniCart(state.cart);
      return;
    }

    const logBtn = e.target.closest('.log-btn');
    if (logBtn) {
      document.querySelectorAll('.log-btn').forEach(b => b.classList.remove('active'));
      logBtn.classList.add('active');
      state.shippingProvider = logBtn.dataset.provider;
      DOM.rujakcoOptions.style.display = state.shippingProvider === 'paxel' ? 'none' : 'block';
      DOM.paxelOptions.style.display = state.shippingProvider === 'paxel' ? 'block' : 'none';
      updateShippingUI();
      return;
    }

    const vehBtn = e.target.closest('.veh-btn');
    if (vehBtn) {
      document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
      vehBtn.classList.add('active');
      state.vehicleType = vehBtn.dataset.vehicle;
      updateShippingUI();
      return;
    }

    if (e.target.id === 'priorityToggleMini') { state.isPriority = e.target.checked; updateShippingUI(); return; }

    if (e.target.id === 'btnOpenPayment') {
      if (e.target.dataset.processing === 'true') return;
      e.target.dataset.processing = 'true';

      if (!Object.keys(state.cart).length) {
        showToast('Keranjang masih kosong.');
        e.target.dataset.processing = 'false';
        return;
      }
      const phone = DOM.customerPhoneInput?.value.trim() || '';
      const address = DOM.customerAddressInput?.value.trim() || '';
      if (!validatePhone(phone)) {
        showToast('Nomor HP tidak valid.');
        e.target.dataset.processing = 'false';
        return;
      }
      if (!validateAddress(address)) {
        showToast('Mohon lengkapi alamat pengantaran.');
        e.target.dataset.processing = 'false';
        return;
      }
      if (!state.selectedDistrict && !state.selectedDistrictFull) {
        showToast('Mohon pilih alamat tujuan terlebih dahulu.');
        e.target.dataset.processing = 'false';
        return;
      }

      if (state.userDistance == null) {
        let recovered = false;
        const addressToSearch = state.selectedDistrictFull
          || (state.selectedDistrict && state.customerAddress ? `${state.selectedDistrict}, ${state.customerAddress}` : '')
          || DOM.districtInput?.value?.trim()
          || state.customerAddress;
        if (addressToSearch) {
          try {
            const results = await queuedSearch(addressToSearch);
            if (results.length > 0) {
              const place = results[0];
              const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, parseFloat(place.lat), parseFloat(place.lon));
              state.userDistance = result.distance;
              state.selectedDistrictFull = place.display_name;
              state.selectedDistrict = extractShortLocation(place.display_name);
              DOM.districtInput && (DOM.districtInput.value = place.display_name);
              saveCustomer(phone, address, place.display_name, result.distance);
              updateShippingUI();
              recovered = true;
            }
          } catch (err) {
            console.warn('Auto-recover gagal:', err);
          }
        }
        if (!recovered) {
          showToast('Gagal menghitung jarak. Silakan pilih alamat dari pencarian di atas.');
          e.target.dataset.processing = 'false';
          return;
        }
      }

      const receiptOk = await showOrderConfirmation();
      if (!receiptOk) {
        e.target.dataset.processing = 'false';
        return;
      }
      e.target.dataset.processing = 'false';
      return;
    }

    if (e.target.closest('#aiChatToggle')) { e.preventDefault(); openModal(DOM.aiChatBox); return; }
    if (e.target.closest('#backFromProduct')) { closeProductPage(false); return; }

    const faqToggle = e.target.closest('[data-toggle="faq"]');
    if (faqToggle) { const item = faqToggle.closest('.faq-item'); const isOpen = item.classList.toggle('open'); faqToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false'); return; }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  });
}

function initHeroParallax() {
  const heroImg = document.querySelector('.hero-img');
  const heroOverlay = document.querySelector('.hero-overlay-new');
  if (!heroImg) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (DOM.header) DOM.header.classList.toggle('scrolled', window.scrollY > 50);
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        heroImg.style.transform = `translate3d(0, ${scrollY * 0.35}px, 0) scale(${1.02 + (scrollY * 0.0002)})`;
        if (heroOverlay) {
          heroOverlay.style.transform = `translate3d(0, ${-scrollY * 0.1}px, 0)`;
          heroOverlay.style.opacity = Math.max(0, 1 - (scrollY / 250));
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
function init() {
  cacheDOM();
  try {
    if (!isStorageAvailable()) {
      showToast('⚠️ Penyimpanan browser tidak tersedia. Data tidak akan disimpan.');
    }

    const saved = loadState();
    state.cart = saved?.cart || {};
    if (saved?.name) state.customerName = saved.name;
    if (saved?.district) {
      state.selectedDistrictFull = saved.district;
      state.selectedDistrict = extractShortLocation(saved.district) || saved.district;
    }
    const cust = loadCustomer();
    if (cust) {
      state.customerPhone = cust.phone || '';
      state.customerAddress = cust.address || '';
      if (!state.selectedDistrict && cust.district) {
        state.selectedDistrictFull = cust.district;
        state.selectedDistrict = extractShortLocation(cust.district) || cust.district;
      }
      if (cust.distance !== null && cust.distance !== undefined && !isNaN(cust.distance)) {
        state.userDistance = cust.distance;
      } else {
        const raw = localStorage.getItem('rj_user_distance');
        if (raw !== null) {
          const parsed = parseFloat(raw);
          if (!isNaN(parsed)) state.userDistance = parsed;
        }
      }
    }

    renderMenu();
    renderProductSwiper(state.drafts);
    initCarousel();
    initDetailGestures();
    initAccessibility();
    const updateWelcome = initAIChat();
    if (updateWelcome) updateWelcome(state.customerName || 'Tamu');

    bindEvents();
    initOnboarding();
    initDrawerDistrictDropdown();
    initTestimonials();
    updateCartUI();
    applyPersonalization();

    if (window.lucide) lucide.createIcons();
    initHeroParallax();

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    if (productId) {
      const idx = getProductGlobalIndex(productId);
      if (idx !== -1) setTimeout(() => openProductPage(idx), 400);
    }

    window.addEventListener('popstate', (e) => {
      if (isProgrammaticBack) { isProgrammaticBack = false; return; }
      if (overlayStack.length > 0) {
        const topOverlay = overlayStack[overlayStack.length - 1];
        // Cek kecocokan id dari state
        if (e.state && e.state.id && e.state.id !== topOverlay.id) return;
        if (topOverlay.id === 'productPage') closeProductPage(true);
        else closeModal(topOverlay, true);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (overlayStack.length > 0) {
          const topOverlay = overlayStack[overlayStack.length - 1];
          if (topOverlay.id === 'productPage') closeProductPage(false);
          else closeModal(topOverlay, false);
        }
      }
    });

    syncBottomNav();
    console.log('✅ RUJAK.Co siap.');
  } catch (err) {
    console.error('❌ Gagal inisialisasi:', err);
    showToast('⚠️ Terjadi kesalahan. Muat ulang halaman.');
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();