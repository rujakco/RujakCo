// app.js — Luxury Edition (swipe horizontal + swipe‑to‑close + history back aman)
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
import { validatePhone, validateAddress, processPayment, confirmOrder, getCartSummary } from './modules/checkout.js';

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
  DOM.cartBadgeDetail = document.getElementById('cartBadgeDetail');
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
function getCartSummaryLocal() {
  return getCartSummary(state.cart);
}

function updateShippingUI() {
  if (!DOM.shippingSection) return;
  const dist = state.selectedDistrict ? getDistance(state.selectedDistrict) : state.userDistance;
  if (dist) DOM.shippingSection.style.display = 'block';
  const { subtotal, mainProductQty } = getCartSummaryLocal();
  const ship = calculateShipping(dist ?? SYSTEM.DEFAULT_DISTANCE, mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority);
  document.getElementById('shippingDistance').textContent = dist ? `${dist} km` : '';
  DOM.finalShipping.textContent = ship.cost ? fmt(ship.cost) : '...';
  DOM.finalTotal.textContent = ship.cost ? fmt(subtotal + ship.cost) : fmt(subtotal);
}

function updateCartUI() {
  saveCart(state.cart);
  renderCart(state.cart, ['cartBadgeNav', 'cartBadgeDetail']);
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
// Product page & swiper (dengan History API)
// ---------------------------------------------------------------------------
function openProductPage(globalIndex) {
  DOM.productPage.style.display = 'flex';
  DOM.productPage.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Dorong state baru agar gesture back Android bisa kembali ke halaman utama
  history.pushState({ detailOpen: true, productIndex: globalIndex }, '');

  const targetSlide = document.querySelector(`.product-slide[data-idx="${globalIndex}"]`);
  if (targetSlide) {
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
}

function closeProductPage(useHistoryBack = true) {
  DOM.productPage.style.display = 'none';
  DOM.productPage.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  if (DOM._productObserver) {
    DOM._productObserver.disconnect();
    DOM._productObserver = null;
  }

  // Jika diminta, lakukan history.back() untuk sinkronisasi state
  if (useHistoryBack && history.state?.detailOpen) {
    history.back();
  }
}

// ---------------------------------------------------------------------------
// Gesture: swipe produk & tutup detail (AMAN, HORMATI GESTURE BACK)
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

    // Abaikan sentuhan dari 30px kiri/kanan untuk gesture back Android
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
      if (absDx > absDy) {
        isPulling = false;
        return;
      }
      gestureDetermined = true;
    }

    if (gestureDetermined && dy > 0) {
      if (e.cancelable) e.preventDefault();
      activeSlide.style.transform = `translateY(${dy * 0.4}px)`;
    }
  }, { passive: false });

  track.addEventListener('touchend', (e) => {
    if (!isPulling || !activeSlide || !gestureDetermined) {
      isPulling = false;
      activeSlide = null;
      return;
    }
    const dy = e.changedTouches[0].clientY - startY;
    activeSlide.style.transition = 'all 0.3s ease';
    if (dy > 120) {
      closeProductPage(true);   // memanggil history.back()
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

  document.getElementById('onbStartBtn').addEventListener('click', () => {
    if (!state.selectedDistrict) return showToast('Mohon pilih kecamatan tujuan.');
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
  // About modal
  const aboutTrigger = document.getElementById('aboutTrigger');
  const aboutClose = document.getElementById('aboutClose');
  if (aboutTrigger && DOM.aboutModal) {
    aboutTrigger.addEventListener('click', () => openModal(DOM.aboutModal));
  }
  if (aboutClose && DOM.aboutModal) {
    aboutClose.addEventListener('click', () => closeModal(DOM.aboutModal));
  }

  document.addEventListener('click', (e) => {
    // Carousel boutique item
    const boutique = e.target.closest('.boutique-item');
    if (boutique) {
      openProductPage(parseInt(boutique.dataset.idx));
      return;
    }

    // Step 1 -> 2 (detail page)
    if (e.target.classList.contains('step-1-btn')) {
      if (window.navigator.vibrate) window.navigator.vibrate(10);
      const btn = e.target;
      const idx = btn.dataset.idx;
      const pid = btn.dataset.pid;
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
        }, 300);
      }
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

    // Add to cart (TIDAK MENUTUP DETAIL)
    if (e.target.classList.contains('add-to-cart-btn')) {
      if (window.navigator.vibrate) window.navigator.vibrate(10);
      const pid = e.target.dataset.pid;
      const draft = state.drafts[pid];
      const cartKey = pid + '_spice' + draft.spice;
      if (!state.cart[cartKey]) state.cart[cartKey] = { qty: 0, spice: draft.spice };
      state.cart[cartKey].qty += draft.qty;
      state.drafts[pid].qty = 1;
      document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = 1);
      updateCartUI();
      showToast('Sajian ditambahkan ke reservasi.');
      const idx = e.target.dataset.idx;
      setTimeout(() => {
        const step1 = document.getElementById(`step1_${idx}_${pid}`);
        const step2 = document.getElementById(`step2_${idx}_${pid}`);
        if (step1 && step2) { step1.style.display = 'block'; step2.style.display = 'none'; step1.style.opacity = '1'; }
      }, 500);
      return;
    }

    // Confirm via WA (sebelum cart item actions)
    if (e.target.closest('[data-action="confirm-wa"]')) {
      confirmOrder(state.cart, state, updateCartUI)(e);
      return;
    }

    // Cart item actions
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn && !actionBtn.classList.contains('add-to-cart-btn') && !actionBtn.classList.contains('step-1-btn')) {
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
      closeProductPage(true);
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
    // Mini cart close
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

  // FAB Keranjang di halaman detail
  const fab = document.getElementById('cartFabDetail');
  if (fab) {
    fab.addEventListener('click', () => {
      openModal(DOM.miniCartModal);
      renderMiniCart(state.cart);
      updateShippingUI();
    });
  }
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
  initDetailGestures();       // gesture swipe horizontal & tarik-turun yang aman
  initAccessibility();
  const updateWelcome = initAIChat();
  if (updateWelcome) updateWelcome(state.customerName || 'Ngoedi');

  bindEvents();
  initOnboarding();
  updateCartUI();

  // Listener untuk gesture back Android / tombol back browser
  window.addEventListener('popstate', (event) => {
    if (DOM.productPage.style.display === 'flex') {
      // Tutup detail tanpa memanggil history.back() lagi (karena sudah dipicu oleh popstate)
      closeProductPage(false);
    }
  });

  window.addEventListener('scroll', () => {
    DOM.header?.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.productPage.style.display === 'flex') closeProductPage(true);
      else if (DOM.miniCartModal.classList.contains('active')) closeModal(DOM.miniCartModal);
      else if (DOM.paymentModal.classList.contains('active')) closeModal(DOM.paymentModal);
      else if (DOM.aiChatBox.classList.contains('active')) closeModal(DOM.aiChatBox);
      else if (DOM.aboutModal?.classList.contains('active')) closeModal(DOM.aboutModal);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}