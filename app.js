// app.js – FINAL V1.0 (Private Lobby + Paxel + Lalamove + GPS Button Label + All Fixes)
import { PRODUCTS } from './data/products.js';
import { SYSTEM, SPICE_LABELS } from './data/config.js';
import { fmt, showToast, debounce, escapeHTML, getSupabase, queuedSearch } from './utils/helpers.js';
import { loadState, saveCart, saveUser, clearUser, saveCustomer, loadCustomer, isStorageAvailable } from './modules/storage.js';
import { calculateShipping, getDrivingDistance, reverseGeocode } from './modules/shipping.js';
import { renderMenu, renderProductSwiper, renderCart, renderMiniCart, getProductGlobalIndex } from './modules/render.js';
import { initCarousel } from './modules/carousel.js';
import { initAIChat } from './modules/chat.js';
import { initAccessibility } from './modules/accessibility.js';
import { initTestimonials } from './modules/testimonials.js';
import { validatePhone, validateAddress, getCartSummary, showWhatsAppFallback } from './modules/checkout.js';
import { showOrderConfirmation as launchProReceipt } from './modules/checkout-receipt.js';

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

const overlayStack = [];
window.__overlayStack__ = overlayStack;
let isProgrammaticBack = false;

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
  DOM.lalamoveOptions = document.getElementById('lalamoveOptions');
  DOM.paxelOptions = document.getElementById('paxelOptions');
  DOM.mainContent = document.getElementById('mainContent');
  DOM.bottomNav = document.getElementById('bottomNav');
  DOM.liveCartRegion = document.getElementById('cartLiveRegion');
};

// ---------------------------------------------------------------------------
// UTILITY
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

function getWaktu() {
  const jam = new Date().getHours();
  if (jam >= 5 && jam < 12) return 'pagi';
  if (jam >= 12 && jam < 17) return 'siang';
  return 'sore';
}

const PERMISSION_DENIED = globalThis.GeolocationPositionError?.PERMISSION_DENIED ?? 1;

function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      showToast('Geolokasi tak didukung.');
      return reject(new Error('Geolocation not supported'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        if (err.code === PERMISSION_DENIED) {
          showToast('Izin lokasi ditolak.');
        }
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// ---------------------------------------------------------------------------
// PERSONALISASI
// ---------------------------------------------------------------------------
function applyPersonalization() {
  const name = state.customerName || 'Tamu';
  const districtLabel = state.selectedDistrict || 'Pilih alamat tujuan';
  const waktu = getWaktu();

  // Gabungkan teks sapaan + lokasi
  DOM.headerName.textContent = `Selamat ${waktu}, ${name} • ${districtLabel}`;
  if (DOM.headerLoc) DOM.headerLoc.style.display = 'none'; // sembunyikan elemen lama

  if (DOM.customerNameInput) DOM.customerNameInput.value = name !== 'Tamu' ? name : '';
  if (DOM.customerPhoneInput) DOM.customerPhoneInput.value = state.customerPhone;
  if (DOM.customerAddressInput) DOM.customerAddressInput.value = state.customerAddress;
  if (DOM.districtInput) DOM.districtInput.value = state.selectedDistrictFull || '';
  if (DOM.aiWelcome) DOM.aiWelcome.textContent = `Selamat ${waktu}, ${name}. Ada yang bisa kami bantu?`;
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
// NAV & OVERLAY
// ---------------------------------------------------------------------------
function setActiveNav(activeId) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.id === activeId));
}

function syncBottomNav() {
  setTimeout(() => {
    if (DOM.aiChatBox?.classList.contains('active')) setActiveNav('aiChatToggle');
    else if (DOM.miniCartModal?.classList.contains('active') ||
             document.getElementById('orderConfirmModal')?.classList.contains('active') ||
             DOM.paymentModal?.classList.contains('active')) setActiveNav('navCartBtn');
    else if (DOM.productPage?.classList.contains('active')) setActiveNav('navProductBtn');
    else setActiveNav('navHomeBtn');
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
  if (previousFocusedElement && document.body.contains(previousFocusedElement)) {
    previousFocusedElement.focus();
  } else {
    document.getElementById('navHomeBtn')?.focus();
  }
  previousFocusedElement = null;
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
        <button id="confirmYes" class="btn-danger">Keluarkan</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
  document.getElementById('confirmNo').onclick = () => closeModal(modal);
  document.getElementById('confirmYes').onclick = () => {
    closeModal(modal);
    if (onConfirm) onConfirm();
  };
  modal.addEventListener('transitionend', (e) => {
    if (!modal.classList.contains('active') && e.target === modal) {
      modal.remove();
      if (triggerEl && document.body.contains(triggerEl)) triggerEl.focus();
    }
  });
  openModal(modal);
}

// ---------------------------------------------------------------------------
// PRODUCT PAGE (dots & scroll listener dihapus, bottom nav muncul)
// ---------------------------------------------------------------------------
function openProductPage(globalIndex) {
  if (!DOM.productPage) return;
  if (!state._vipPeeked) {
    setTimeout(() => {
      document.getElementById('waVipSideTab')?.classList.add('peek');
    }, 800);
    state._vipPeeked = true;
  }
  if (DOM._productObserver) {
    DOM._productObserver.disconnect();
    DOM._productObserver = null;
  }
  renderProductSwiper(state.drafts);
  DOM.productPage.style.display = 'flex';
  void DOM.productPage.offsetWidth;
  DOM.productPage.classList.add('active');
  DOM.bottomNav?.classList.add('nav-visible'); // ✅ tampilkan bottom nav di detail produk
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
        if (img && img.dataset.src) {
          if (!img.src || img.src === window.location.href) {
            img.src = img.dataset.src;
            img.onload = () => img.classList.add('loaded');
            img.onerror = () => img.classList.add('loaded');
          }
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
  DOM.bottomNav?.classList.remove('nav