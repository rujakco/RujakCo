// app.js — Luxury Edition: tenang, efisien, aksesibel
import { PRODUCTS } from './data/products.js';
import { DISTRICT_MAP } from './data/districts.js';
import { SYSTEM, SPICE_LABELS } from './data/config.js';
import { fmt, showToast, debounce } from './utils/helpers.js';
import { loadState, saveCart, saveUser, clearUser } from './modules/storage.js';
import { getDistance, calculateShipping } from './modules/shipping.js';
import { renderMenu, renderProductSwiper, renderCart, renderMiniCart } from './modules/render.js';
import { initCarousel } from './modules/carousel.js';
import { initAIChat } from './modules/chat.js';
import { initAccessibility } from './modules/accessibility.js';
import { validatePhone, validateAddress, processPayment, confirmOrder } from './modules/checkout.js';

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
const state = {
  cart: {},
  drafts: {},
  customerName: '',
  selectedDistrict: '',
  customerPhone: '',
  customerAddress: '',
  shippingProvider: 'rujakco',
  vehicleType: 'motor',
  isPriority: false,
  userDistance: null
};

// initialise drafts
PRODUCTS.forEach(p => {
  state.drafts[p.id] = { spice: p.defaultSpice ?? 3, qty: 1 };
});

// ---------------------------------------------------------------------------
// DOM references (cached)
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
  DOM.districtInput = document.getElementById('districtInput');
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
  DOM.shippingSection = document.getElementById('shippingSection');
  DOM.rujakcoOptions = document.getElementById('rujakcoOptions');
  DOM.paxelOptions = document.getElementById('paxelOptions');
  DOM.priorityToggle = document.getElementById('priorityToggleMini');
};

// ---------------------------------------------------------------------------
// Personalisation helper
// ---------------------------------------------------------------------------
function applyPersonalization() {
  const name = state.customerName || 'Ngoedi';
  const district = (state.selectedDistrict || 'bekasi').replace(/\b\w/g, l => l.toUpperCase());

  DOM.headerName.textContent = name;
  DOM.headerLoc.textContent = district;
  if (DOM.customerNameInput) DOM.customerNameInput.value = name;
  if (DOM.districtInput) DOM.districtInput.value = district;
  if (DOM.aiWelcome) DOM.aiWelcome.textContent = `Halo, ${name}! Ada yang bisa kami bantu untuk pesanan Anda?`;
}

// ---------------------------------------------------------------------------
// Cart utilities
// ---------------------------------------------------------------------------
function getCartSummary() {
  const items = [];
  let subtotal = 0;
  let mainProductQty = 0;
  Object.keys(state.cart).forEach(key => {
    const entry = state.cart[key];
    const [pid] = key.split('_spice');
    const product = PRODUCTS.find(p => p.id === pid);
    if (!product || !entry || entry.qty <= 0) {
      delete state.cart[key];
      return;
    }
    items.push({ cartId: key, id: pid, name: product.name, price: product.price, qty: entry.qty, spice: entry.spice });
    subtotal += product.price * entry.qty;
    mainProductQty += entry.qty;
  });
  return { items, subtotal, mainProductQty };
}

function updateShippingUI() {
  if (!DOM.shippingSection) return;
  const dist = state.selectedDistrict ? getDistance(state.selectedDistrict) : state.userDistance;
  if (dist) DOM.shippingSection.style.display = 'block';
  const { subtotal, mainProductQty } = getCartSummary();
  const ship = calculateShipping(dist ?? SYSTEM.DEFAULT_DISTANCE, mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority);
  document.getElementById('shippingDistance').textContent = dist ? `${dist} km` : '';
  DOM.finalShipping.textContent = ship.cost ? fmt(ship.cost) : '...';
  DOM.finalTotal.textContent = ship.cost ? fmt(subtotal + ship.cost) : fmt(subtotal);
}

function updateCartUI() {
  saveCart(state.cart);
  renderCart(state.cart, ['cartBadgeNav']);
  if (DOM.miniCartModal?.classList.contains('active')) {
    renderMiniCart(state.cart);
    updateShippingUI();
  }
}

// ---------------------------------------------------------------------------
// Modal & focus management
// ---------------------------------------------------------------------------
let previousFocusedElement = null;

function openModal(modalEl) {
  if (!modalEl) return;
  previousFocusedElement = document.activeElement;
  modalEl.classList.add('active');
  modalEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const firstInput = modalEl.querySelector('button, input, textarea, select');
  if (firstInput) firstInput.focus();
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (previousFocusedElement) {
    previousFocusedElement.focus();
    previousFocusedElement = null;
  }
}

// ---------------------------------------------------------------------------
// Product page & swiper
// ---------------------------------------------------------------------------
function openProductPage(globalIndex) {
  DOM.productPage.style.display = 'flex';
  DOM.productPage.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const targetSlide = document.querySelector(`.product-slide[data-idx="${globalIndex}"]`);
  if (targetSlide) {
    DOM.productSwiperTrack.style.scrollBehavior = 'auto';
    DOM.productSwiperTrack.scrollLeft = targetSlide.offsetLeft;
    DOM.productSwiperTrack.style.scrollBehavior = 'smooth';
  }
  // lazy load detail images
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
}

function closeProductPage() {
  DOM.productPage.style.display = 'none';
  DOM.productPage.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ---------------------------------------------------------------------------
// Gesture: swipe down to close product page
// ---------------------------------------------------------------------------
function initSwipeToClose() {
  let startY = 0, isPulling = false, activeSlide = null;
  const onTouchStart = (e) => {
    if (e.touches.length > 1) return;
    startY = e.touches[0].clientY;
    activeSlide = e.target.closest('.product-slide');
    isPulling = activeSlide && activeSlide.scrollTop <= 0;
  };
  const onTouchMove = (e) => {
    if (!isPulling || !activeSlide) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      activeSlide.style.transform = `translateY(${dy * 0.4}px)`;
      if (e.cancelable) e.preventDefault();
    }
  };
  const onTouchEnd = (e) => {
    if (!isPulling || !activeSlide) return;
    const dy = e.changedTouches[0].clientY - startY;
    activeSlide.style.transition = 'all 0.3s ease';
    if (dy > 120) {
      closeProductPage();
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
  };
  DOM.productPage.addEventListener('touchstart', onTouchStart, { passive: true });
  DOM.productPage.addEventListener('touchmove', onTouchMove, { passive: false });
  DOM.productPage.addEventListener('touchend', onTouchEnd, { passive: true });
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------
function initOnboarding() {
  const saved = loadState();
  if (saved?.name && saved.district) {
    state.customerName = saved.name;
    state.selectedDistrict = saved.district;
    DOM.onbNewUser.style.display = 'none';
    DOM.onbReturningUser.style.display = 'block';
    DOM.onbWelcomeName.textContent = saved.name;
    DOM.onbWelcomeDistrict.textContent = saved.district.replace(/\b\w/g, l => l.toUpperCase());
  } else {
    DOM.onbNewUser.style.display = 'block';
    DOM.onbStep1.classList.add('active');
  }

  // Step 1 -> Step 2
  document.getElementById('onbNextBtn').addEventListener('click', () => {
    const name = DOM.onbName.value.trim();
    if (!name) return showToast('Mohon isi nama Anda.');
    state.customerName = name;
    DOM.onbStep1.classList.remove('active');
    setTimeout(() => {
      DOM.onbStep2.classList.add('active');
      DOM.onbDistrict.focus();
    }, 100);
  });

  // District filtering
  const dropdown = DOM.onbDistrictDropdown;
  const filterDistricts = debounce((val) => {
    const v = val.toLowerCase();
    const matches = Object.keys(DISTRICT_MAP).filter(k => k.includes(v));
    dropdown.style.display = 'block';
    dropdown.innerHTML = matches.map(k => `<div data-val="${k}">${k.replace(/\b\w/g, l => l.toUpperCase())}</div>`).join('');
  }, 150);
  DOM.onbDistrict.addEventListener('input', (e) => filterDistricts(e.target.value));

  dropdown.addEventListener('click', (e) => {
    const div = e.target.closest('div[data-val]');
    if (!div) return;
    state.selectedDistrict = div.dataset.val;
    dropdown.style.display = 'none';
    DOM.onbDistrict.value = div.textContent;
  });

  // Start
  document.getElementById('onbStartBtn').addEventListener('click', () => {
    if (!state.selectedDistrict) return showToast('Mohon pilih kecamatan tujuan.');
    saveUser(state.customerName, state.selectedDistrict);
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600);
    applyPersonalization();
    initScrollReveal();
  });

  // Returning user enter
  document.getElementById('onbEnterBtn').addEventListener('click', () => {
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600);
    applyPersonalization();
    initScrollReveal();
  });

  // Reset
  document.getElementById('onbResetBtn').addEventListener('click', () => {
    clearUser();
    DOM.onbReturningUser.style.display = 'none';
    DOM.onbNewUser.style.display = 'block';
    DOM.onbStep1.classList.add('active');
  });
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ---------------------------------------------------------------------------
// Main delegation & event binding
// ---------------------------------------------------------------------------
function bindEvents() {
  document.addEventListener('click', (e) => {
    // Carousel boutique item
    const boutique = e.target.closest('.boutique-item');
    if (boutique) {
      openProductPage(parseInt(boutique.dataset.idx));
      return;
    }

    // Step 1 -> 2 (detail page)
    if (e.target.classList.contains('btn-lanjutkan')) {
      const idx = e.target.dataset.idx;
      const pid = e.target.dataset.pid;
      document.getElementById(`step1_${idx}_${pid}`).style.display = 'none';
      document.getElementById(`step2_${idx}_${pid}`).style.display = 'block';
      return;
    }

    // Spice selector
    if (e.target.classList.contains('spice-option')) {
      const pid = e.target.dataset.pid;
      const val = parseInt(e.target.dataset.spice);
      state.drafts[pid].spice = val;
      document.querySelectorAll(`.spice-option[data-pid="${pid}"]`).forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.spice) === val);
      });
      document.querySelectorAll(`[id^="spiceLabel_"][id$="_${pid}"]`).forEach(el => {
        el.textContent = SPICE_LABELS[val];
      });
      return;
    }

    // Qty controls (detail page)
    if (e.target.classList.contains('qty-plus') || e.target.classList.contains('qty-minus')) {
      const pid = e.target.dataset.pid;
      if (e.target.classList.contains('qty-plus')) state.drafts[pid].qty++;
      else if (state.drafts[pid].qty > 1) state.drafts[pid].qty--;
      document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = state.drafts[pid].qty);
      return;
    }

    // Add to cart
    if (e.target.classList.contains('add-to-cart-btn')) {
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      const pid = e.target.dataset.pid;
      const draft = state.drafts[pid];
      const cartKey = pid + '_spice' + draft.spice;
      if (!state.cart[cartKey]) state.cart[cartKey] = { qty: 0, spice: draft.spice };
      state.cart[cartKey].qty += draft.qty;
      state.drafts[pid].qty = 1;
      document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = 1);
      updateCartUI();
      showToast('Sajian ditambahkan ke reservasi.');
      closeProductPage();
      // reset steps
      const idx = e.target.dataset.idx;
      setTimeout(() => {
        const step1 = document.getElementById(`step1_${idx}_${pid}`);
        const step2 = document.getElementById(`step2_${idx}_${pid}`);
        if (step1 && step2) { step1.style.display = 'block'; step2.style.display = 'none'; }
      }, 500);
      return;
    }

    // Cart item actions
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn && !actionBtn.classList.contains('add-to-cart-btn') && !actionBtn.classList.contains('btn-lanjutkan')) {
      const id = actionBtn.dataset.id;
      const type = actionBtn.dataset.action;
      if (type === 'increase') state.cart[id].qty++;
      else if (type === 'decrease') {
        state.cart[id].qty--;
        if (state.cart[id].qty <= 0) delete state.cart[id];
      }
      updateCartUI();
      if (DOM.miniCartModal.classList.contains('active')) renderMiniCart(state.cart);
      return;
    }

    // Shipping provider
    if (e.target.classList.contains('log-btn')) {
      document.querySelectorAll('.log-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.shippingProvider = e.target.dataset.provider;
      DOM.rujakcoOptions.style.display = state.shippingProvider === 'paxel' ? 'none' : 'block';
      DOM.paxelOptions.style.display = state.shippingProvider === 'paxel' ? 'block' : 'none';
      updateShippingUI();
      return;
    }

    // Vehicle type
    if (e.target.classList.contains('veh-btn')) {
      document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.vehicleType = e.target.dataset.vehicle;
      updateShippingUI();
      return;
    }

    // Priority toggle
    if (e.target.id === 'priorityToggleMini') {
      state.isPriority = e.target.checked;
      updateShippingUI();
      return;
    }

    // Open payment
    if (e.target.id === 'btnOpenPayment') {
      processPayment(state.cart, state, updateCartUI)(e);
      return;
    }

    // Close payment
    if (e.target.id === 'paymentClose') {
      closeModal(DOM.paymentModal);
      return;
    }

    // Confirm via WA
    if (e.target.closest('[data-action="confirm-wa"]')) {
      confirmOrder(state.cart, state, updateCartUI)(e);
      return;
    }

    // AI Chat
    if (e.target.closest('#aiChatToggle')) {
      e.preventDefault();
      openModal(DOM.aiChatBox);
      return;
    }
    if (e.target.id === 'aiChatClose') {
      closeModal(DOM.aiChatBox);
      return;
    }

    // Back from product
    if (e.target.closest('#backFromProduct')) {
      closeProductPage();
      return;
    }

    // Nav cart btn
    if (e.target.closest('#navCartBtn')) {
      e.preventDefault();
      openModal(DOM.miniCartModal);
      renderMiniCart(state.cart);
      updateShippingUI();
      return;
    }
    // Mini cart close (inside modal)
    if (e.target.closest('#miniCartClose')) {
      closeModal(DOM.miniCartModal);
      return;
    }
  });

  // Prevent modal overlay click from closing if clicking inside drawer
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });
}

// ---------------------------------------------------------------------------
// App initialisation
// ---------------------------------------------------------------------------
function init() {
  cacheDOM();
  const saved = loadState();
  state.cart = saved.cart || {};
  if (saved.name) state.customerName = saved.name;
  if (saved.district) state.selectedDistrict = saved.district;

  renderMenu();
  renderProductSwiper();
  initCarousel();
  initSwipeToClose();
  initAccessibility();
  const updateWelcome = initAIChat();
  if (updateWelcome) updateWelcome(state.customerName || 'Ngoedi');

  bindEvents();
  initOnboarding();
  updateCartUI();

  window.addEventListener('scroll', () => {
    DOM.header?.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // Keyboard accessibility: close modal with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.productPage.style.display === 'flex') closeProductPage();
      else if (DOM.miniCartModal.classList.contains('active')) closeModal(DOM.miniCartModal);
      else if (DOM.paymentModal.classList.contains('active')) closeModal(DOM.paymentModal);
      else if (DOM.aiChatBox.classList.contains('active')) closeModal(DOM.aiChatBox);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}