// app.js – FINAL V2.0 (Refactored: overlay options, focus stack, helpers, event delegation)
import { PRODUCTS } from './data/products.js';
import { SYSTEM, SPICE_LABELS } from './data/config.js';
import { fmt, showToast, debounce, escapeHTML, getSupabase, queuedSearch, animatePress, createCartKey } from './utils/helpers.js';
import { loadState, saveCart, saveUser, clearUser, saveCustomer, loadCustomer, isStorageAvailable } from './modules/storage.js';
import { calculateShipping, getDrivingDistance, reverseGeocode } from './modules/shipping.js';
import { renderMenu, renderProductSwiper, renderCart, renderMiniCart, getProductGlobalIndex } from './modules/render.js';
import { initCarousel } from './modules/carousel.js';
import { initAIChat } from './modules/chat.js';
import { initAccessibility } from './modules/accessibility.js';
import { initTestimonials } from './modules/testimonials.js';
import { validatePhone, validateAddress, getCartSummary, showWhatsAppFallback } from './modules/checkout.js';
import { showOrderConfirmation as launchProReceipt } from './modules/checkout-receipt.js';

// ---------- Konstanta ----------
const UI_DELAY = {
  MODAL: 400,
  TOAST: 1000,
  WELCOME: 1200,
  PRODUCT_TRANSITION: 300,
  CART_ADD_FLASH: 400,
  CART_ADD_RESET: 900,
};

const MODAL_IDS = {
  MINI_CART: 'miniCartModal',
  ORDER_CONFIRM: 'orderConfirmModal',
  PAYMENT: 'paymentModal',
  ABOUT: 'aboutModal',
  AI_CHAT: 'aiChatBox',
};

// ---------- State ----------
const state = {
  cart: {},
  drafts: {},
  customerName: '',
  selectedDistrict: '',
  selectedDistrictFull: '',
  customerPhone: '',
  customerAddress: '',
  shippingProvider: 'lalamove',
  tier: 'reguler',
  userDistance: null,
  haversineUsed: false,
  lastViewedProductIndex: -1,
  currentOrderCode: null,
  receiptUrl: null,
};

PRODUCTS.forEach(p => {
  state.drafts[p.id] = { spice: p.defaultSpice ?? 3, qty: 1 };
});

// ---------- Overlay & Focus Stack ----------
const overlayStack = [];
window.__overlayStack__ = overlayStack;
let isProgrammaticBack = false;

// Focus stack untuk modal bertumpuk
const focusStack = [];

// ---------- DOM Cache ----------
const DOM = {};
const cacheDOM = () => {
  DOM.onboardingOverlay = document.getElementById('onboardingOverlay');
  DOM.onbNewUser = document.getElementById('onbNewUser');
  DOM.onbReturningUser = document.getElementById('onbReturningUser');
  DOM.onbWelcomeName = document.getElementById('onbWelcomeName');
  DOM.onbWelcomeDistrict = document.getElementById('onbWelcomeDistrict');
  DOM.onbStep1 = document.getElementById('onbStep1');
  DOM.onbName = document.getElementById('onbName');
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
  DOM.miniCartModal = document.getElementById(MODAL_IDS.MINI_CART);
  DOM.miniCartList = document.getElementById('miniCartList');
  DOM.cartSubtotal = document.getElementById('cartSubtotalDisplay');
  DOM.finalShipping = document.getElementById('finalShipping');
  DOM.finalTotal = document.getElementById('finalTotal');
  DOM.paymentModal = document.getElementById(MODAL_IDS.PAYMENT);
  DOM.paymentTotal = document.getElementById('paymentTotalDisplay');
  DOM.aiChatBox = document.getElementById(MODAL_IDS.AI_CHAT);
  DOM.aboutModal = document.getElementById(MODAL_IDS.ABOUT);
  DOM.shippingSection = document.getElementById('shippingSection');
  DOM.lalamoveOptions = document.getElementById('lalamoveOptions');
  DOM.paxelOptions = document.getElementById('paxelOptions');
  DOM.mainContent = document.getElementById('mainContent');
  DOM.bottomNav = document.getElementById('bottomNav');
  DOM.liveCartRegion = document.getElementById('cartLiveRegion');

  // Cache selector yang sering dipakai
  DOM.logBtns = document.querySelectorAll('.log-btn');
  DOM.vehBtns = document.querySelectorAll('.veh-btn');
};

// ---------- Overlay Helpers ----------
function pushOverlay(element) {
  overlayStack.push(element);
}

function popOverlay() {
  return overlayStack.pop();
}

function getTopOverlay() {
  return overlayStack.length > 0 ? overlayStack[overlayStack.length - 1] : null;
}

function removeOverlay(element) {
  const index = overlayStack.indexOf(element);
  if (index > -1) overlayStack.splice(index, 1);
}

// ---------- Utilities (sama seperti sebelumnya, hanya ditambahkan opsi) ----------
function extractShortLocation(fullAddress) { /* ... tidak berubah ... */ }
function loadScript(src) { /* ... */ }
function getWaktu() { /* ... */ }
const PERMISSION_DENIED = globalThis.GeolocationPositionError?.PERMISSION_DENIED ?? 1;
function requestLocation() { /* ... */ }

// ---------- Personalisasi ----------
function applyPersonalization() { /* ... sama ... */ }
function initScrollReveal() { /* ... */ }

// ---------- Navigation & Overlay ----------
function setActiveNav(activeId) { /* ... */ }
function syncBottomNav() { /* ... */ }

function releaseInert() {
  const anyModalOpen = document.querySelector('.modal-overlay.active');
  const productPageOpen = DOM.productPage?.classList.contains('active');
  if (!anyModalOpen && !productPageOpen) {
    document.body.style.overflow = '';
    DOM.mainContent?.removeAttribute('inert');
    DOM.bottomNav?.removeAttribute('inert');
  }
}

// openModal sekarang menerima opsi
function openModal(modalEl, options = {}) {
  if (!modalEl) return;
  const { hideBottomNav = false } = options;

  focusStack.push(document.activeElement);
  modalEl.classList.add('active');
  modalEl.setAttribute('aria-hidden', 'false');
  modalEl.removeAttribute('inert');
  document.body.style.overflow = 'hidden';
  pushOverlay(modalEl);
  history.pushState({ isOverlay: true, id: modalEl.id }, '');
  DOM.mainContent?.setAttribute('inert', '');
  if (hideBottomNav) {
    DOM.bottomNav?.classList.add('nav-hidden');
  } else {
    DOM.bottomNav?.setAttribute('inert', '');
  }
  const firstInput = modalEl.querySelector('button, input, textarea, select');
  if (firstInput) firstInput.focus();
  syncBottomNav();
}

function closeModal(modalEl, fromPopState = false) {
  if (!modalEl) return;
  const previousFocus = focusStack.pop();
  if (previousFocus && document.body.contains(previousFocus)) {
    previousFocus.focus();
  } else {
    document.getElementById('navHomeBtn')?.focus();
  }

  modalEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.setAttribute('inert', '');
  removeOverlay(modalEl);

  if (overlayStack.length === 0 && !DOM.productPage.classList.contains('active')) {
    document.body.style.overflow = '';
    DOM.mainContent?.removeAttribute('inert');
    DOM.bottomNav?.classList.remove('nav-hidden');
    DOM.bottomNav?.removeAttribute('inert');
  }

  releaseInert();
  if (!fromPopState) {
    isProgrammaticBack = true;
    history.back();
  }
  syncBottomNav();
}

function showConfirmModal(title, message, onConfirm) { /* ... sama ... */ }

// ---------- Product Page ----------
function openProductPage(globalIndex) { /* ... tidak berubah, namun menggunakan pushOverlay */ }
function closeProductPage(fromPopState = false) { /* ... gunakan removeOverlay */ }

// ---------- Gestures ----------
function initDetailGestures() { /* ... */ }

// ---------- Cart & Shipping ----------
function getCartSummaryLocal() { return getCartSummary(state.cart); }

async function resolveOnboardingDistance(districtLabel) { /* ... */ }

function updateShippingUI() {
  // ... tetap sama ...
}

function updateCartUI() { /* ... */ }

// ---------- Drawer District Dropdown ----------
function initDrawerDistrictDropdown() { /* ... */ }

// ---------- Onboarding ----------
function initOnboarding() { /* ... */ }

// ---------- WhatsApp & Telegram ----------
// ... downloadReceiptPNG, sendReceiptToTelegram, sendReceiptToWhatsApp, showOrderConfirmation ...

// ---------- EVENT BINDINGS (dipecah) ----------
function bindEvents() {
  // About
  document.getElementById('aboutTrigger')?.addEventListener('click', () => openModal(DOM.aboutModal));
  document.getElementById('aboutClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('aboutClose'));
    closeModal(DOM.aboutModal);
  });

  // Share product
  document.getElementById('shareProductBtn')?.addEventListener('click', () => { /* ... */ });

  // VIP
  document.getElementById('btnVipConcierge')?.addEventListener('click', (e) => { /* ... */ });
  document.getElementById('waVipHandle')?.addEventListener('click', (e) => { /* ... */ });

  // Bottom Navigation
  bindNavigationEvents();

  // Delivery time dropdown
  bindDeliveryTimeDropdown();

  // Modal close buttons
  bindModalCloseButtons();

  // Input listeners
  bindInputListeners();

  // Global click (delegasi dipecah ke fungsi-fungsi handler)
  document.addEventListener('click', globalClickHandler);

  // Tutup modal dengan klik backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  });
}

function bindNavigationEvents() {
  document.getElementById('navHomeBtn')?.addEventListener('click', () => {
    if (DOM.productPage?.classList.contains('active')) {
      closeProductPage(false);
      setTimeout(releaseInert, 500);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 200);
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
        openModal(DOM.miniCartModal, { hideBottomNav: true });
        renderMiniCart(state.cart);
        updateShippingUI();
      }, UI_DELAY.MODAL);
    } else {
      openModal(DOM.miniCartModal, { hideBottomNav: true });
      renderMiniCart(state.cart);
      updateShippingUI();
    }
  });
}

function bindDeliveryTimeDropdown() { /* ... sama seperti sebelumnya ... */ }

function bindModalCloseButtons() {
  document.getElementById('miniCartClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('miniCartClose'));
    closeModal(DOM.miniCartModal);
  });
  document.getElementById('paymentClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('paymentClose'));
    closeModal(DOM.paymentModal);
  });
  document.getElementById('aiChatClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('aiChatClose'));
    closeModal(DOM.aiChatBox);
  });
  document.getElementById('orderConfirmClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('orderConfirmClose'));
    closeModal(document.getElementById(MODAL_IDS.ORDER_CONFIRM));
  });
}

function bindInputListeners() {
  DOM.customerNameInput?.addEventListener('input', () => { /* ... */ });
  DOM.customerPhoneInput?.addEventListener('input', () => { /* ... */ });
  DOM.customerAddressInput?.addEventListener('input', () => { /* ... */ });
}

// Global click handler yang memanggil sub-handler
function globalClickHandler(e) {
  // Tutup drawer dropdown jika klik di luar
  const drawerInput = DOM.districtInput;
  const drawerDropdown = DOM.drawerDistrictDropdown;
  if (drawerInput && drawerDropdown && !drawerInput.contains(e.target) && !drawerDropdown.contains(e.target)) {
    drawerDropdown.style.display = 'none';
    drawerInput.setAttribute('aria-expanded', 'false');
  }

  if (handleProductClick(e)) return;
  if (handleStep1Click(e)) return;
  if (handleSpiceSelection(e)) return;
  if (handleQuantityChange(e)) return;
  if (handleAddToCart(e)) return;
  if (handleCartActions(e)) return;
  if (handleCheckoutAction(e)) return;
  if (handleModalTriggers(e)) return;
  if (handleMiscClicks(e)) return;
}

function handleProductClick(e) {
  const boutique = e.target.closest('.boutique-item');
  if (boutique) {
    const idx = parseInt(boutique.dataset.idx);
    if (!isNaN(idx)) openProductPage(idx);
    return true;
  }
  return false;
}

function handleStep1Click(e) {
  const step1Btn = e.target.closest('.step-1-btn');
  if (step1Btn) {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    const idx = step1Btn.dataset.idx, pid = step1Btn.dataset.pid;
    const step1 = document.getElementById(`step1_${idx}_${pid}`);
    const step2 = document.getElementById(`step2_${idx}_${pid}`);
    if (step1 && step2) {
      step1.style.transition = 'opacity 0.3s ease';
      step1.style.opacity = '0';
      setTimeout(() => {
        step1.style.display = 'none';
        step2.style.display = 'block';
        const firstOption = step2.querySelector('.spice-option');
        if (firstOption) firstOption.focus();
      }, UI_DELAY.PRODUCT_TRANSITION);
    }
    return true;
  }
  return false;
}

function handleSpiceSelection(e) {
  const spiceOption = e.target.closest('.spice-option');
  if (spiceOption) {
    const pid = spiceOption.dataset.pid, val = parseInt(spiceOption.dataset.spice);
    state.drafts[pid].spice = val;
    document.querySelectorAll(`.spice-option[data-pid="${pid}"]`).forEach(b => b.classList.toggle('active', parseInt(b.dataset.spice) === val));
    document.querySelectorAll(`[id^="spiceLabel_"][id$="_${pid}"]`).forEach(el => el.textContent = SPICE_LABELS[val]);
    return true;
  }
  return false;
}

function handleQuantityChange(e) {
  const qtyPlus = e.target.closest('.qty-plus'), qtyMinus = e.target.closest('.qty-minus');
  if (qtyPlus || qtyMinus) {
    const pid = (qtyPlus || qtyMinus).dataset.pid;
    if (qtyPlus) state.drafts[pid].qty++;
    else if (state.drafts[pid].qty > 1) state.drafts[pid].qty--;
    document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = state.drafts[pid].qty);
    return true;
  }
  return false;
}

function handleAddToCart(e) {
  const addBtn = e.target.closest('.add-to-cart-btn');
  if (addBtn) {
    if (addBtn.dataset.processing === 'true') return true;
    addBtn.dataset.processing = 'true';
    if (window.navigator?.vibrate) window.navigator.vibrate(12);

    const pid = addBtn.dataset.pid, idx = addBtn.dataset.idx, draft = state.drafts[pid];
    const cartKey = createCartKey(pid, draft.spice);

    if (!state.cart[cartKey]) {
      state.cart[cartKey] = { id: pid, qty: 0, spice: draft.spice };
    }
    state.cart[cartKey].qty += draft.qty;
    state.drafts[pid].qty = 1;
    document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = 1);
    updateCartUI();
    showToast('Sajian berhasil ditambahkan.');

    const cartNav = document.querySelector('.nav-cart-wrapper');
    if (cartNav) {
      cartNav.classList.remove('bump');
      void cartNav.offsetWidth;
      cartNav.classList.add('bump');
    }

    addBtn.classList.add('success-flash');
    addBtn.dataset.originalLabel = addBtn.dataset.originalLabel || addBtn.textContent;
    addBtn.textContent = '✓ Berhasil Ditambahkan';

    setTimeout(() => addBtn.classList.remove('success-flash'), UI_DELAY.CART_ADD_FLASH);
    setTimeout(() => {
      addBtn.textContent = addBtn.dataset.originalLabel;
      const step1 = document.getElementById(`step1_${idx}_${pid}`);
      const step2 = document.getElementById(`step2_${idx}_${pid}`);
      if (step1 && step2) {
        step1.style.opacity = '0';
        step1.style.display = 'block';
        step2.style.display = 'none';
        requestAnimationFrame(() => { step1.style.opacity = '1'; });
      }
      addBtn.dataset.processing = 'false';
    }, UI_DELAY.CART_ADD_RESET);
    return true;
  }
  return false;
}

function handleCartActions(e) {
  if (e.target.id === 'emptyCartBrowse') {
    closeModal(DOM.miniCartModal);
    openProductPage(0);
    return true;
  }

  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn && !actionBtn.classList.contains('add-to-cart-btn') && !actionBtn.classList.contains('step-1-btn')) {
    const id = actionBtn.dataset.id, type = actionBtn.dataset.action;
    if (type === 'increase') state.cart[id].qty++;
    else if (type === 'decrease') {
      if (state.cart[id].qty === 1) {
        showConfirmModal('Keluarkan Sajian?', 'Keluarkan sajian ini dari reservasi Anda?', () => {
          delete state.cart[id];
          updateCartUI();
          if (DOM.miniCartModal.classList.contains('active')) renderMiniCart(state.cart);
          showToast('Sajian dikeluarkan.');
        });
        return true;
      }
      state.cart[id].qty--;
    }
    updateCartUI();
    if (DOM.miniCartModal.classList.contains('active')) renderMiniCart(state.cart);
    return true;
  }

  // Pemilihan kurir (log-btn, veh-btn) - gunakan cache
  const logBtn = e.target.closest('.log-btn');
  if (logBtn) {
    DOM.logBtns.forEach(b => b.classList.remove('active'));
    logBtn.classList.add('active');
    state.shippingProvider = logBtn.dataset.provider;
    DOM.lalamoveOptions.style.display = state.shippingProvider === 'paxel' ? 'none' : 'block';
    DOM.paxelOptions.style.display = state.shippingProvider === 'paxel' ? 'block' : 'none';
    updateShippingUI();
    return true;
  }

  const vehBtn = e.target.closest('.veh-btn');
  if (vehBtn) {
    DOM.vehBtns.forEach(b => b.classList.remove('active'));
    vehBtn.classList.add('active');
    state.tier = vehBtn.dataset.tier;
    updateShippingUI();
    return true;
  }

  return false;
}

function handleCheckoutAction(e) {
  if (e.target.id === 'btnOpenPayment') {
    // ... logika checkout yang sudah ada ...
    return true;
  }
  if (e.target.closest('[data-action="confirm-wa"]')) {
    // ... konfirmasi WhatsApp ...
    return true;
  }
  return false;
}

function handleModalTriggers(e) {
  if (e.target.closest('#aiChatToggle')) {
    e.preventDefault();
    openModal(DOM.aiChatBox);
    return true;
  }
  if (e.target.closest('#backFromProduct')) {
    animatePress(e.target.closest('#backFromProduct'));
    closeProductPage(false);
    return true;
  }
  return false;
}

function handleMiscClicks(e) {
  const faqToggle = e.target.closest('[data-toggle="faq"]');
  if (faqToggle) {
    const item = faqToggle.closest('.faq-item');
    const isOpen = item.classList.toggle('open');
    faqToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    return true;
  }
  return false;
}

// ---------- Parallax ----------
function initHeroParallax() { /* ... */ }

// ---------- Init ----------
function init() {
  cacheDOM();
  try {
    if (!isStorageAvailable()) showToast('Penyimpanan tak tersedia.');
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
        const topOverlay = getTopOverlay();
        if (e.state && e.state.id && e.state.id !== topOverlay.id) return;
        if (topOverlay.id === 'productPage') closeProductPage(true);
        else closeModal(topOverlay, true);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlayStack.length > 0) {
        const topOverlay = getTopOverlay();
        if (topOverlay.id === 'productPage') closeProductPage(false);
        else closeModal(topOverlay, false);
      }
    });
    syncBottomNav();
    console.log('✅ RUJAK.Co siap.');
  } catch (err) {
    console.error('❌ Gagal inisialisasi:', err);
    showToast('Terjadi kesalahan.');
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();