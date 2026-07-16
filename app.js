// app.js — Luxury Edition (final dengan OSM/OSRM & semua perbaikan)
import { PRODUCTS } from './data/products.js';
import { SYSTEM, SPICE_LABELS } from './data/config.js';
import { fmt, showToast, debounce, escapeHTML } from './utils/helpers.js';
import { loadState, saveCart, saveUser, clearUser, saveCustomer, loadCustomer } from './modules/storage.js';
import {
  calculateShipping,
  getDrivingDistance,
  searchAddressOSM,
  KITCHEN_COORDS
} from './modules/shipping.js';
import {
  renderMenu,
  renderProductSwiper,
  renderCart,
  renderMiniCart,
  getProductGlobalIndex
} from './modules/render.js';
import { initCarousel } from './modules/carousel.js';
import { initAIChat } from './modules/chat.js';
import { initAccessibility } from './modules/accessibility.js';
import { initTestimonials } from './modules/testimonials.js';
import {
  validatePhone,
  validateAddress,
  processPayment,
  confirmOrder,
  getCartSummary
} from './modules/checkout.js';

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
const state = {
  cart: {},
  drafts: {},
  customerName: '',
  selectedDistrict: '',   // sekarang berisi alamat lengkap dari OSM
  customerPhone: '',
  customerAddress: '',
  shippingProvider: 'rujakco',
  vehicleType: 'motor',
  isPriority: false,
  userDistance: null,     // diisi oleh hasil OSRM (dalam KM)
  lastViewedProductIndex: -1
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
};

// ---------------------------------------------------------------------------
// Personalisation helper
// ---------------------------------------------------------------------------
function applyPersonalization() {
  const name = state.customerName || 'Ngoedi';
  const district = state.selectedDistrict || 'Pilih alamat tujuan';

  DOM.headerName.textContent = name;
  DOM.headerLoc.textContent = district;
  if (DOM.customerNameInput) DOM.customerNameInput.value = name;
  if (DOM.districtInput) DOM.districtInput.value = district;
  if (DOM.aiWelcome) DOM.aiWelcome.textContent = `Halo, ${name}! Ada yang bisa kami bantu untuk pesanan Anda?`;
}

// ---------------------------------------------------------------------------
// Scroll reveal animation (FADE-UP)
// ---------------------------------------------------------------------------
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ---------------------------------------------------------------------------
// Cart utilities
// ---------------------------------------------------------------------------
function getCartSummaryLocal() {
  return getCartSummary(state.cart);
}

function updateShippingUI() {
  const dist = state.userDistance;   // langsung dari hasil OSRM
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
    if (DOM.finalTotal) {
      DOM.finalTotal.textContent = fmt(subtotal);
    }
  }
}

function updateCartUI() {
  saveCart(state.cart);
  renderCart(state.cart, ['cartBadgeNav']);
  if (DOM.miniCartModal?.classList.contains('active')) {
    prefillCustomerData();
    renderMiniCart(state.cart);
    updateShippingUI();
  }
  if (window.lucide) lucide.createIcons();
}

// ---------------------------------------------------------------------------
// Prefill data pelanggan dari localStorage (hanya fallback, tidak timpa)
// ---------------------------------------------------------------------------
function prefillCustomerData() {
  const saved = loadCustomer();
  if (saved) {
    if (saved.phone && DOM.customerPhoneInput) DOM.customerPhoneInput.value = saved.phone;
    if (saved.address && DOM.customerAddressInput) DOM.customerAddressInput.value = saved.address;
    if (saved.district && !state.selectedDistrict) {
      state.selectedDistrict = saved.district;
      if (DOM.districtInput) DOM.districtInput.value = saved.district;
    }
  }
  if (state.customerPhone && DOM.customerPhoneInput) DOM.customerPhoneInput.value = state.customerPhone;
  if (state.customerAddress && DOM.customerAddressInput) DOM.customerAddressInput.value = state.customerAddress;
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
  modalEl.removeAttribute('inert');
  document.body.style.overflow = 'hidden';
  const firstInput = modalEl.querySelector('button, input, textarea, select');
  if (firstInput) firstInput.focus();
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.setAttribute('inert', '');
  document.body.style.overflow = '';
  if (previousFocusedElement) {
    previousFocusedElement.focus();
    previousFocusedElement = null;
  }
}

// ---------------------------------------------------------------------------
// KONFIRMASI HAPUS ITEM
// ---------------------------------------------------------------------------
function showConfirmModal(title, message, onConfirm) {
  const old = document.getElementById('confirmModal');
  if (old) old.remove();

  const triggerEl = document.activeElement;

  const modal = document.createElement('div');
  modal.id = 'confirmModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'confirmModalTitle');
  modal.setAttribute('aria-describedby', 'confirmModalMsg');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:var(--z-onboard);background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:24px 20px;max-width:320px;width:90%;text-align:center;">
      <h4 id="confirmModalTitle" style="margin:0 0 8px;font-size:16px;">${title}</h4>
      <p id="confirmModalMsg" style="font-size:13px;color:#666;margin:0 0 20px;">${message}</p>
      <div style="display:flex;gap:10px;">
        <button id="confirmNo" style="flex:1;padding:12px;border-radius:8px;border:1px solid #ddd;background:white;font-size:13px;font-weight:600;">Batal</button>
        <button id="confirmYes" style="flex:1;padding:12px;border-radius:8px;border:none;background:var(--danger);color:white;font-size:13px;font-weight:600;">Hapus</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const btnNo = document.getElementById('confirmNo');
  const btnYes = document.getElementById('confirmYes');
  const focusables = [btnNo, btnYes];

  function cleanup() {
    document.removeEventListener('keydown', onKeydown);
    modal.remove();
    if (triggerEl && typeof triggerEl.focus === 'function') triggerEl.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      cleanup();
      return;
    }
    if (e.key === 'Tab') {
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  document.addEventListener('keydown', onKeydown);

  btnNo.onclick = cleanup;
  btnYes.onclick = () => {
    cleanup();
    if (onConfirm) onConfirm();
  };

  btnNo.focus();
}

// ---------------------------------------------------------------------------
// Product page & swiper
// ---------------------------------------------------------------------------
function openProductPage(globalIndex) {
  DOM.productPage.style.display = 'flex';
  DOM.productPage.setAttribute('aria-hidden', 'false');
  DOM.productPage.removeAttribute('inert');
  document.body.style.overflow = 'hidden';
  state.lastViewedProductIndex = globalIndex;

  history.pushState({ detailOpen: true, productIndex: globalIndex }, '');

  const targetSlide = document.querySelector(`.product-slide[data-idx="${globalIndex}"]`);
  if (targetSlide) {
    DOM.productSwiperTrack.style.scrollBehavior = 'auto';
    DOM.productSwiperTrack.scrollLeft = targetSlide.offsetLeft;
    DOM.productSwiperTrack.style.scrollBehavior = 'smooth';
  }

  if (DOM._productObserver) {
    DOM._productObserver.disconnect();
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
  DOM.productPage.setAttribute('inert', '');
  document.body.style.overflow = '';
  document.getElementById('waVipSideTab')?.classList.remove('open');

  if (DOM._productObserver) {
    DOM._productObserver.disconnect();
    DOM._productObserver = null;
  }

  if (useHistoryBack && history.state?.detailOpen) {
    history.back();
  }
}

// ---------------------------------------------------------------------------
// Gesture: swipe produk & tutup detail
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
      closeProductPage(true);
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
// Onboarding (dengan Tamu)
// ---------------------------------------------------------------------------
function initOnboarding() {
  const saved = loadState();
  if (saved?.name && saved.district) {
    state.customerName = saved.name;
    state.selectedDistrict = saved.district;
    DOM.onbNewUser.style.display = 'none';
    DOM.onbReturningUser.style.display = 'block';
    DOM.onbWelcomeName.textContent = saved.name;
    DOM.onbWelcomeDistrict.textContent = saved.district;
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

  // TOMBOL MASUK SEBAGAI TAMU
  document.getElementById('onbGuestBtn')?.addEventListener('click', () => {
    state.customerName = 'Tamu';
    state.selectedDistrict = '';
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600);
    DOM.headerName.textContent = 'Tamu';
    DOM.headerLoc.textContent = 'Pilih Lokasi';
    if (DOM.aiWelcome) DOM.aiWelcome.textContent = `Halo, Tamu! Ada yang bisa kami bantu hari ini?`;
    initScrollReveal();
  });

  // ... sisa kode dropdown onboarding tidak berubah ...
}

// ---------------------------------------------------------------------------
// Dropdown alamat di drawer (OSM + OSRM)
// ---------------------------------------------------------------------------
function initDrawerDistrictDropdown() {
  const input = DOM.districtInput;
  const dropdown = DOM.drawerDistrictDropdown;
  if (!input || !dropdown) return;

  input.placeholder = 'Ketik alamat tujuan (jalan, kelurahan, kota)';

  const handleSearch = debounce(async (query) => {
    if (query.length < 4) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:var(--gray-500);">Mencari lokasi...</div>';
    dropdown.style.display = 'block';

    const results = await searchAddressOSM(query);

    if (results.length === 0) {
      dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--danger);">Lokasi tidak ditemukan. Coba ketik nama jalan atau kelurahan.</div>';
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
  }, 1000);

  // Reset state setiap kali mengetik ulang
  input.addEventListener('input', (e) => {
    state.selectedDistrict = '';
    state.userDistance = null;
    updateShippingUI();
    handleSearch(e.target.value.trim());
  });

  // Pilih alamat
  dropdown.addEventListener('click', async (e) => {
    const option = e.target.closest('div[role="option"]');
    if (!option) return;

    input.value = 'Menghitung rute pengantaran...';
    dropdown.style.display = 'none';
    input.setAttribute('aria-expanded', 'false');

    const lat = parseFloat(option.dataset.lat);
    const lon = parseFloat(option.dataset.lon);
    const placeName = option.dataset.name;

    const distanceKm = await getDrivingDistance(
      KITCHEN_COORDS.lat,
      KITCHEN_COORDS.lon,
      lat,
      lon
    );

    state.selectedDistrict = placeName;
    state.userDistance = distanceKm;
    input.value = placeName;

    updateShippingUI();
    if (DOM.miniCartModal?.classList.contains('active')) renderMiniCart(state.cart);
    saveCustomer(state.customerPhone, state.customerAddress, placeName);
  });

  // Tutup dropdown saat klik di luar
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
    }
  });
}

// ---------------------------------------------------------------------------
// STRUK & SHARE FUNCTIONS (tidak berubah)
// ---------------------------------------------------------------------------
// ... (downloadReceiptPNG, sendReceiptToWhatsApp, sendReceiptToTelegram, showOrderConfirmation) ...

// ---------------------------------------------------------------------------
// Helper untuk set active nav
// ---------------------------------------------------------------------------
function setActiveNav(activeId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.id === activeId);
  });
}

// ---------------------------------------------------------------------------
// Main delegation & event binding
// ---------------------------------------------------------------------------
function bindEvents() {
  // ... (semua listener seperti sebelumnya, tidak ada perubahan) ...
}

// ---------------------------------------------------------------------------
// App initialisation
// ---------------------------------------------------------------------------
function init() {
  cacheDOM();
  const saved = loadState();
  state.cart = saved?.cart || {};
  if (saved?.name) state.customerName = saved.name;
  if (saved?.district) state.selectedDistrict = saved.district;
  const cust = loadCustomer();
  if (cust) {
    state.customerPhone = cust.phone || '';
    state.customerAddress = cust.address || '';
  }
  // state.userDistance akan diisi nanti oleh OSRM, tidak perlu diinisialisasi dari storage

  renderMenu();
  renderProductSwiper();
  initCarousel();
  initDetailGestures();
  initAccessibility();
  const updateWelcome = initAIChat();
  if (updateWelcome) updateWelcome(state.customerName || 'Ngoedi');

  bindEvents();
  initOnboarding();
  initDrawerDistrictDropdown();   // ← inisialisasi autocomplete OSM
  initTestimonials();
  updateCartUI();

  if (window.lucide) lucide.createIcons();

  const heroImg = document.querySelector('.hero-img');
  window.addEventListener('scroll', () => {
    DOM.header?.classList.toggle('scrolled', window.scrollY > 50);
    if (heroImg) {
      const offset = Math.min(window.scrollY * 0.15, 40);
      heroImg.style.transform = `translateY(${40 - offset}px) scale(${1.02 - offset * 0.0005})`;
    }
  }, { passive: true });

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product');
  if (productId) {
    const idx = getProductGlobalIndex(productId);
    if (idx !== -1) setTimeout(() => openProductPage(idx), 400);
  }

  window.addEventListener('popstate', (event) => {
    if (DOM.productPage.style.display === 'flex') closeProductPage(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.productPage.style.display === 'flex') closeProductPage(true);
      else if (document.getElementById('orderConfirmModal')?.classList.contains('active')) closeModal(document.getElementById('orderConfirmModal'));
      else if (DOM.paymentModal.classList.contains('active')) closeModal(DOM.paymentModal);
      else if (DOM.aiChatBox.classList.contains('active')) closeModal(DOM.aiChatBox);
      else if (DOM.aboutModal?.classList.contains('active')) closeModal(DOM.aboutModal);
      else if (DOM.miniCartModal.classList.contains('active')) closeModal(DOM.miniCartModal);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}