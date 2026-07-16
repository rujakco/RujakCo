// app.js — Luxury Edition (Final + QRIS Fix + Anti Spam)
import { PRODUCTS } from './data/products.js';
import { SYSTEM, SPICE_LABELS } from './data/config.js';
import { DISTRICT_MAP } from './data/districts.js';
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
  selectedDistrict: '',
  customerPhone: '',
  customerAddress: '',
  shippingProvider: 'rujakco',
  vehicleType: 'motor',
  isPriority: false,
  userDistance: null,
  lastViewedProductIndex: -1,
  currentOrderCode: null
};

PRODUCTS.forEach(p => {
  state.drafts[p.id] = { spice: p.defaultSpice ?? 3, qty: 1 };
});

// ---------------------------------------------------------------------------
// Overlay Stack (untuk Back Android & Escape)
// ---------------------------------------------------------------------------
const overlayStack = [];

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
// Scroll reveal animation (STAGGERED)
// ---------------------------------------------------------------------------
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    const intersectingEntries = entries.filter(entry => entry.isIntersecting);

    intersectingEntries.forEach((entry, index) => {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, index * 100);
      observer.unobserve(entry.target);
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
// Prefill data pelanggan dari localStorage
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
// Modal & focus management (dengan Overlay Stack & History API)
// ---------------------------------------------------------------------------
let previousFocusedElement = null;

function openModal(modalEl) {
  if (!modalEl) return;
  previousFocusedElement = document.activeElement;
  modalEl.classList.add('active');
  modalEl.setAttribute('aria-hidden', 'false');
  modalEl.removeAttribute('inert');
  document.body.style.overflow = 'hidden';

  overlayStack.push(modalEl);
  history.pushState({ isOverlay: true, id: modalEl.id }, '');

  const firstInput = modalEl.querySelector('button, input, textarea, select');
  if (firstInput) firstInput.focus();
}

function closeModal(modalEl, fromPopState = false) {
  if (!modalEl) return;
  modalEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.setAttribute('inert', '');

  const index = overlayStack.indexOf(modalEl);
  if (index > -1) overlayStack.splice(index, 1);

  if (overlayStack.length === 0 && DOM.productPage.style.display !== 'flex') {
    document.body.style.overflow = '';
  }

  if (previousFocusedElement) {
    previousFocusedElement.focus();
    previousFocusedElement = null;
  }

  if (!fromPopState) {
    history.back();
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
// Product page & swiper (dengan Overlay Stack dan renderProductSwiper)
// ---------------------------------------------------------------------------
function openProductPage(globalIndex) {
  if (!DOM.productPage) return;

  renderProductSwiper();

  DOM.productPage.style.display = 'flex';
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

  if (DOM._productObserver) DOM._productObserver.disconnect();
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

function closeProductPage(fromPopState = false) {
  if (!DOM.productPage) return;
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

  if (!fromPopState) {
    history.back();
  }
}

// ---------------------------------------------------------------------------
// Gesture: swipe produk & tutup detail (RUBBER-BANDING)
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
      const resistance = dy * (1 - (dy / (window.innerHeight * 1.5)));
      activeSlide.style.transform = `translateY(${Math.max(0, resistance)}px)`;
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

  const dropdown = DOM.onbDistrictDropdown;
  let activeOptionIndex = -1;
  let currentMatches = [];

  function renderDropdown(matches) {
    currentMatches = matches;
    activeOptionIndex = -1;
    dropdown.innerHTML = matches.map((k, i) =>
      `<div role="option" id="onbDistrictOpt-${i}" data-val="${k}" aria-selected="false">${k.replace(/\b\w/g, l => l.toUpperCase())}</div>`
    ).join('');
    dropdown.style.display = matches.length ? 'block' : 'none';
    DOM.onbDistrict.setAttribute('aria-expanded', matches.length ? 'true' : 'false');
    DOM.onbDistrict.removeAttribute('aria-activedescendant');
  }

  function setActiveOption(index) {
    const opts = dropdown.querySelectorAll('div[role="option"]');
    opts.forEach(o => o.setAttribute('aria-selected', 'false'));
    if (index >= 0 && index < opts.length) {
      opts[index].setAttribute('aria-selected', 'true');
      opts[index].scrollIntoView({ block: 'nearest' });
      DOM.onbDistrict.setAttribute('aria-activedescendant', opts[index].id);
      activeOptionIndex = index;
    }
  }

  function selectDistrict(val, label) {
    state.selectedDistrict = val;
    dropdown.style.display = 'none';
    DOM.onbDistrict.setAttribute('aria-expanded', 'false');
    DOM.onbDistrict.removeAttribute('aria-activedescendant');
    DOM.onbDistrict.value = label;
  }

  const filterDistricts = debounce((val) => {
    const v = val.toLowerCase();
    const matches = Object.keys(DISTRICT_MAP).filter(k => k.includes(v));
    renderDropdown(matches);
  }, 150);

  DOM.onbDistrict.addEventListener('input', (e) => filterDistricts(e.target.value));
  DOM.onbDistrict.addEventListener('focus', () => {
    if (!DOM.onbDistrict.value) filterDistricts('');
  });

  DOM.onbDistrict.addEventListener('keydown', (e) => {
    const opts = dropdown.querySelectorAll('div[role="option"]');
    if (!opts.length || dropdown.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveOption(Math.min(activeOptionIndex + 1, opts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveOption(Math.max(activeOptionIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeOptionIndex >= 0) {
        const val = currentMatches[activeOptionIndex];
        selectDistrict(val, opts[activeOptionIndex].textContent);
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      DOM.onbDistrict.setAttribute('aria-expanded', 'false');
    }
  });

  dropdown.addEventListener('click', (e) => {
    const div = e.target.closest('div[role="option"]');
    if (!div) return;
    selectDistrict(div.dataset.val, div.textContent);
  });

  document.addEventListener('click', (e) => {
    if (!DOM.onbDistrict?.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
      DOM.onbDistrict.setAttribute('aria-expanded', 'false');
    }
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
    DOM.onbStep2.classList.remove('active');
    DOM.onbStep1.classList.add('active');
  });
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

  input.addEventListener('input', (e) => {
    state.selectedDistrict = '';
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

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
    }
  });
}

// ---------------------------------------------------------------------------
// STRUK & SHARE FUNCTIONS
// ---------------------------------------------------------------------------
async function downloadReceiptPNG() {
  const element = document.getElementById('orderConfirmContent');
  if (!element) return;

  if (typeof html2canvas === 'undefined') {
    showToast('⚠️ Gagal menghasilkan struk. Coba lagi nanti.');
    return;
  }

  try {
    const footer = document.querySelector('#orderConfirmModal .drawer-footer');
    if (footer) footer.style.display = 'none';

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });

    if (footer) footer.style.display = '';

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Struk_RujakCo_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ Struk berhasil diunduh!');
        resolve();
      });
    });
  } catch (err) {
    console.error('Gagal generate struk:', err);
    showToast('⚠️ Gagal mengunduh struk');
    const footer = document.querySelector('#orderConfirmModal .drawer-footer');
    if (footer) footer.style.display = '';
  }
}

function sendReceiptToWhatsApp() {
  const summary = getCartSummaryLocal();
  const name = DOM.customerNameInput?.value || state.customerName || 'Ngoedi';
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
  const totalCost = DOM.finalTotal?.textContent || '—';
  const distance = state.userDistance ? `${state.userDistance} km` : '—';

  let msg = `🧾 *STRUK PESANAN RUJAK.CO*\n`;
  msg += `🆔 *Order ID:* ${state.currentOrderCode || '—'}\n\n`;

  msg += `👤 *Penerima:* ${name}\n`;
  msg += `📞 *HP:* ${phone}\n`;
  msg += `📍 *Alamat:* ${address}\n`;
  msg += `🗺️ *Jarak:* ${distance}\n`;
  msg += `🕒 *Pengantaran:* ${deliveryTime}\n`;
  msg += `📝 *Catatan:* ${notes}\n`;
  msg += `🚚 *Kurir:* ${logisticInfo}\n\n`;

  msg += `📦 *Pesanan:*\n`;
  summary.items.forEach(item => {
    const spiceText = item.spice ? ` (Lv ${item.spice})` : '';
    msg += `• ${item.name}${spiceText} x${item.qty} = ${fmt(item.price * item.qty)}\n`;
  });

  msg += `\n💵 *Subtotal:* ${fmt(summary.subtotal)}\n`;
  msg += `🛵 *Ongkir:* ${shipCost}\n`;
  msg += `💰 *TOTAL TRANSFER:* *${totalCost}*\n\n`;

  msg += `📎 _Struk gambar telah terunduh. Mohon lampirkan struk & bukti transfer (QRIS) di sini._`;

  const waUrl = `https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

async function sendReceiptToTelegram() {
  const element = document.getElementById('orderConfirmContent');
  if (!element) return;
  if (typeof html2canvas === 'undefined') return;

  try {
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('photo', blob, 'struk_rujakco.png');
      formData.append('caption', '🧾 Struk pesanan baru dari ' + (state.customerName || 'Pelanggan'));
      try {
        await fetch('/api/send-receipt', { method: 'POST', body: formData });
      } catch { /* endpoint belum ada */ }
    });
  } catch { /* abaikan */ }
}

// ---------------------------------------------------------------------------
// ORDER CONFIRMATION — menyimpan Order ID ke state & Anti-Spam
// ---------------------------------------------------------------------------
function showOrderConfirmation() {
  const currentPhone = DOM.customerPhoneInput?.value || state.customerPhone;
  const currentAddress = DOM.customerAddressInput?.value || state.customerAddress;
  saveCustomer(currentPhone, currentAddress, state.selectedDistrict);

  const summary = getCartSummaryLocal();
  const dist = state.userDistance;
  const ship = dist != null
    ? calculateShipping(dist, summary.mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority)
    : { cost: 0 };
  const total = summary.subtotal + (ship.cost || 0);

  const name = escapeHTML(DOM.customerNameInput?.value || state.customerName || '—');
  const phone = escapeHTML(currentPhone);
  const address = escapeHTML(currentAddress);
  const deliveryTime = escapeHTML(document.getElementById('deliveryTimeLabel')?.textContent || '—');

  let itemsHtml = '';
  summary.items.forEach(item => {
    const spiceText = item.spice ? ` (Lv ${item.spice})` : '';
    itemsHtml += `<div class="confirm-row"><span>${escapeHTML(item.name)}${spiceText} x${item.qty}</span><span>${fmt(item.price * item.qty)}</span></div>`;
  });

  const contentEl = document.getElementById('orderConfirmContent');
  if (!contentEl) {
    console.error('Elemen #orderConfirmContent tidak ditemukan');
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }) + ' WIB';

  state.currentOrderCode = `RJK-${now.toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(1000+Math.random()*9000)}`;

  contentEl.innerHTML = `
    <div class="receipt-wrap">
      <div class="receipt-stamp">Menunggu Pembayaran</div>
      <div class="receipt-header">
        <img class="receipt-logo" src="https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/logo.webp" alt="RUJAK.Co" />
        <div class="receipt-brand">RUJAK.Co</div>
        <div class="receipt-tagline">Indonesia dalam Satu Wadah</div>
      </div>
      <div class="receipt-meta">
        <span class="code">${state.currentOrderCode}</span>
        <span>${dateStr} · ${timeStr}</span>
      </div>
      <div class="receipt-section">
        <div class="receipt-section-title">Data Penerima</div>
        <div class="confirm-row"><span>Nama</span><span>${name}</span></div>
        <div class="confirm-row"><span>Telepon</span><span>${phone}</span></div>
        <div class="confirm-row"><span>Alamat</span><span>${address}</span></div>
        <div class="confirm-row"><span>Pengantaran</span><span>${deliveryTime}</span></div>
      </div>
      <div class="receipt-section">
        <div class="receipt-section-title">Pesanan</div>
        ${itemsHtml}
      </div>
      <div class="receipt-section">
        <div class="receipt-section-title">Rincian Biaya</div>
        <div class="confirm-row"><span>Subtotal</span><span>${fmt(summary.subtotal)}</span></div>
        <div class="confirm-row"><span>Ongkir</span><span>${fmt(ship.cost || 0)}</span></div>
        <div class="confirm-row total"><span>Total</span><span>${fmt(total)}</span></div>
      </div>
      <div class="receipt-footer">
        <p>"Asam, pedas, manis, segar — terima kasih telah memilih RUJAK.Co."</p>
        <div class="receipt-barcode"></div>
        <div class="receipt-code-text">${state.currentOrderCode}</div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  const modal = document.getElementById('orderConfirmModal');
  if (modal) {
    openModal(modal);

    const backBtn = document.getElementById('orderConfirmBack');
    if (backBtn) backBtn.onclick = () => closeModal(modal);

    // Tombol Lanjutkan dengan perlindungan Anti-Spam dan Injeksi Nilai QRIS
    document.getElementById('orderConfirmLanjut').onclick = async () => {
      const btnLanjut = document.getElementById('orderConfirmLanjut');
      
      // 1. UPDATE NOMINAL QRIS
      if (DOM.paymentTotal) {
        DOM.paymentTotal.textContent = fmt(total); 
      }

      // 2. PENGAMANAN Anti-Spam (Cegah unduh berkali-kali)
      const originalText = btnLanjut.textContent;
      btnLanjut.innerHTML = '<i data-lucide="loader-2" class="icon-sm" style="animation: spin 1s linear infinite;"></i> Memproses...';
      btnLanjut.style.pointerEvents = 'none';
      if (window.lucide) lucide.createIcons();

      // 3. Eksekusi unduh struk
      await downloadReceiptPNG();

      // 4. Kembalikan kondisi tombol
      btnLanjut.textContent = originalText;
      btnLanjut.style.pointerEvents = 'auto';

      // 5. Transisi Modal QRIS
      closeModal(document.getElementById('orderConfirmModal'));
      setTimeout(() => {
        openModal(DOM.paymentModal);
      }, 50);
    };

    sendReceiptToTelegram();
  } else {
    console.error('Modal #orderConfirmModal tidak ditemukan');
  }
}

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
  // About modal
  const aboutTrigger = document.getElementById('aboutTrigger');
  const aboutClose = document.getElementById('aboutClose');
  if (aboutTrigger && DOM.aboutModal) {
    aboutTrigger.addEventListener('click', () => openModal(DOM.aboutModal));
  }
  if (aboutClose && DOM.aboutModal) {
    aboutClose.addEventListener('click', () => closeModal(DOM.aboutModal));
  }

  // Share produk
  const shareBtn = document.getElementById('shareProductBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
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

      if (navigator.share) {
        navigator.share({ title: product.name, text: shareText, url: shareUrl }).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareUrl + '\n' + shareText).then(() => {
          showToast('📋 Link produk disalin!');
        }).catch(() => {
          showToast('📋 Gagal menyalin link');
        });
      }
    });
  }

  // VIP side tab
  document.getElementById('waVipHandle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('waVipSideTab')?.classList.toggle('open');
  });

  // Nav: Home
  document.getElementById('navHomeBtn')?.addEventListener('click', () => {
    if (DOM.productPage && DOM.productPage.style.display === 'flex') closeProductPage(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveNav('navHomeBtn');
  });

  // Nav: Lihat Produk
  document.getElementById('navProductBtn')?.addEventListener('click', () => {
    if (DOM.productPage && DOM.productPage.style.display === 'flex') return;
    openProductPage(state.lastViewedProductIndex >= 0 ? state.lastViewedProductIndex : 0);
    setActiveNav('navProductBtn');
  });

  // Delivery time dropdown
  const deliveryTrigger = document.getElementById('deliveryTimeTrigger');
  const deliveryDropdown = document.getElementById('deliveryTimeDropdown');
  const deliveryHidden = document.getElementById('deliveryTime');
  const deliveryLabel = document.getElementById('deliveryTimeLabel');
  let deliveryActiveIndex = 0;

  const preselected = deliveryDropdown?.querySelector('[aria-selected="true"]');
  if (preselected) {
    deliveryLabel.textContent = preselected.textContent;
    deliveryHidden.value = preselected.dataset.value;
  }

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

  deliveryTrigger?.addEventListener('click', () => {
    deliveryDropdown.style.display === 'block' ? closeDeliveryDropdown() : openDeliveryDropdown();
  });
  deliveryTrigger?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDeliveryDropdown();
    }
  });

  deliveryDropdown?.addEventListener('click', (e) => {
    const option = e.target.closest('[role="option"]');
    if (option) setDeliveryOption(option);
  });

  deliveryDropdown?.addEventListener('keydown', (e) => {
    const opts = [...deliveryDropdown.querySelectorAll('[role="option"]')];
    if (!opts.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      deliveryActiveIndex = Math.min(deliveryActiveIndex + 1, opts.length - 1);
      opts[deliveryActiveIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      deliveryActiveIndex = Math.max(deliveryActiveIndex - 1, 0);
      opts[deliveryActiveIndex].focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setDeliveryOption(opts[deliveryActiveIndex]);
    } else if (e.key === 'Escape') {
      closeDeliveryDropdown();
      deliveryTrigger.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!deliveryTrigger?.contains(e.target) && !deliveryDropdown?.contains(e.target)) {
      closeDeliveryDropdown();
    }
  });

  // Tombol X
  document.getElementById('miniCartClose')?.addEventListener('click', () => closeModal(DOM.miniCartModal));
  document.getElementById('paymentClose')?.addEventListener('click', () => closeModal(DOM.paymentModal));
  document.getElementById('aiChatClose')?.addEventListener('click', () => closeModal(DOM.aiChatBox));
  document.getElementById('orderConfirmClose')?.addEventListener('click', () => closeModal(document.getElementById('orderConfirmModal')));

  // Simpan data pelanggan
  DOM.customerNameInput?.addEventListener('input', () => {
    state.customerName = DOM.customerNameInput.value;
    saveUser(state.customerName, state.selectedDistrict);
    DOM.headerName.textContent = state.customerName || 'Ngoedi';
    if (DOM.aiWelcome) DOM.aiWelcome.textContent = `Halo, ${state.customerName || 'Ngoedi'}! Ada yang bisa kami bantu untuk pesanan Anda?`;
  });

  DOM.customerPhoneInput?.addEventListener('input', () => {
    state.customerPhone = DOM.customerPhoneInput.value;
    saveCustomer(state.customerPhone, state.customerAddress, state.selectedDistrict);
  });
  DOM.customerAddressInput?.addEventListener('input', () => {
    state.customerAddress = DOM.customerAddressInput.value;
    saveCustomer(state.customerPhone, state.customerAddress, state.selectedDistrict);
  });

  // Event delegation
  document.addEventListener('click', (e) => {
    const boutique = e.target.closest('.boutique-item');
    if (boutique) {
      const idx = parseInt(boutique.dataset.idx);
      if (!isNaN(idx)) openProductPage(idx);
      return;
    }

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
        setTimeout(() => {
          step1.style.display = 'none';
          step2.style.display = 'block';
          const firstOption = step2.querySelector('.spice-option');
          if (firstOption) firstOption.focus();
        }, 300);
      }
      return;
    }

    const spiceOption = e.target.closest('.spice-option');
    if (spiceOption) {
      const pid = spiceOption.dataset.pid;
      const val = parseInt(spiceOption.dataset.spice);
      state.drafts[pid].spice = val;
      document.querySelectorAll(`.spice-option[data-pid="${pid}"]`).forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.spice) === val);
      });
      document.querySelectorAll(`[id^="spiceLabel_"][id$="_${pid}"]`).forEach(el => {
        el.textContent = SPICE_LABELS[val];
      });
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
      if (!state.cart[cartKey]) state.cart[cartKey] = { qty: 0, spice: draft.spice };
      state.cart[cartKey].qty += draft.qty;
      state.drafts[pid].qty = 1;
      document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = 1);
      updateCartUI();
      showToast('Sajian ditambahkan ke reservasi.');

      const cartNav = document.querySelector('.nav-cart-wrapper');
      if (cartNav) {
        cartNav.classList.remove('bump');
        void cartNav.offsetWidth;
        cartNav.classList.add('bump');
      }

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
      confirmOrder(state.cart, state, updateCartUI)(e);
      saveCustomer(state.customerPhone, state.customerAddress, state.selectedDistrict);
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn && !actionBtn.classList.contains('add-to-cart-btn') && !actionBtn.classList.contains('step-1-btn')) {
      const id = actionBtn.dataset.id;
      const type = actionBtn.dataset.action;
      if (type === 'increase') {
        state.cart[id].qty++;
      } else if (type === 'decrease') {
        if (state.cart[id].qty === 1) {
          showConfirmModal(
            'Hapus Sajian?',
            'Sajian ini akan dihapus dari reservasi Anda.',
            () => {
              delete state.cart[id];
              updateCartUI();
              if (DOM.miniCartModal.classList.contains('active')) renderMiniCart(state.cart);
              showToast('Sajian dihapus dari reservasi.');
            }
          );
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

    if (e.target.id === 'priorityToggleMini') {
      state.isPriority = e.target.checked;
      updateShippingUI();
      return;
    }

    if (e.target.id === 'btnOpenPayment') {
      if (!Object.keys(state.cart).length) return showToast('Keranjang masih kosong.');
      const phone = DOM.customerPhoneInput?.value.trim() || '';
      const address = DOM.customerAddressInput?.value.trim() || '';
      if (!validatePhone(phone)) return showToast('Nomor HP tidak valid.');
      if (!validateAddress(address)) return showToast('Mohon lengkapi alamat pengantaran.');
      if (!state.selectedDistrict) return showToast('Mohon pilih alamat tujuan terlebih dahulu.');
      if (state.userDistance == null) return showToast('Mohon pilih alamat dari hasil pencarian.');
      showOrderConfirmation();
      return;
    }

    if (e.target.closest('#aiChatToggle')) {
      e.preventDefault();
      openModal(DOM.aiChatBox);
      setActiveNav('aiChatToggle');
      return;
    }

    if (e.target.closest('#backFromProduct')) {
      closeProductPage(true);
      return;
    }

    if (e.target.closest('#navCartBtn')) {
      e.preventDefault();
      openModal(DOM.miniCartModal);
      renderMiniCart(state.cart);
      updateShippingUI();
      setActiveNav('navCartBtn');
      return;
    }

    const faqToggle = e.target.closest('[data-toggle="faq"]');
    if (faqToggle) {
      const item = faqToggle.closest('.faq-item');
      const isOpen = item.classList.toggle('open');
      faqToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      return;
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });
}

// ---------------------------------------------------------------------------
// CINEMATIC PARALLAX
// ---------------------------------------------------------------------------
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
        const yPos = scrollY * 0.35;
        const scale = 1.02 + (scrollY * 0.0002);
        heroImg.style.transform = `translate3d(0, ${yPos}px, 0) scale(${scale})`;

        if (heroOverlay) {
          const opacity = Math.max(0, 1 - (scrollY / 250));
          heroOverlay.style.transform = `translate3d(0, ${-scrollY * 0.1}px, 0)`;
          heroOverlay.style.opacity = opacity;
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// App initialisation
// ---------------------------------------------------------------------------
function init() {
  cacheDOM();

  try {
    const saved = loadState();
    state.cart = saved?.cart || {};
    if (saved?.name) state.customerName = saved.name;
    if (saved?.district) state.selectedDistrict = saved.district;
    const cust = loadCustomer();
    if (cust) {
      state.customerPhone = cust.phone || '';
      state.customerAddress = cust.address || '';
    }

    renderMenu();
    renderProductSwiper();
    initCarousel();
    initDetailGestures();
    initAccessibility();
    const updateWelcome = initAIChat();
    if (updateWelcome) updateWelcome(state.customerName || 'Ngoedi');

    bindEvents();
    initOnboarding();
    initDrawerDistrictDropdown();
    initTestimonials();
    updateCartUI();

    if (window.lucide) lucide.createIcons();
    initHeroParallax();

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    if (productId) {
      const idx = getProductGlobalIndex(productId);
      if (idx !== -1) setTimeout(() => openProductPage(idx), 400);
    }

    // Gestur Back Android / tombol Back browser
    window.addEventListener('popstate', (e) => {
      if (overlayStack.length > 0) {
        const topOverlay = overlayStack[overlayStack.length - 1];
        if (topOverlay.id === 'productPage') {
          closeProductPage(true);
        } else {
          closeModal(topOverlay, true);
        }
      }
    });

    // Tombol Escape (menggunakan stack)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (overlayStack.length > 0) {
          const topOverlay = overlayStack[overlayStack.length - 1];
          if (topOverlay.id === 'productPage') {
            closeProductPage(false);
          } else {
            closeModal(topOverlay, false);
          }
        }
      }
    });

    console.log('✅ RUJAK.Co siap.');
  } catch (err) {
    console.error('❌ Gagal inisialisasi:', err);
    showToast('⚠️ Terjadi kesalahan. Muat ulang halaman.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
