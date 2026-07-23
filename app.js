// app.js — FINAL + SEMUA PATCH AUDIT KEAMANAN & AKSESIBILITAS
import { PRODUCTS } from './data/products.js';
import { SYSTEM, SPICE_LABELS } from './data/config.js';
import { fmt, showToast, debounce, escapeHTML, getSupabase, queuedSearch } from './utils/helpers.js';
import { loadState, saveCart, saveUser, clearUser, saveCustomer, loadCustomer, isStorageAvailable } from './modules/storage.js';
import { calculateShipping, getDrivingDistance } from './modules/shipping.js';
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

PRODUCTS.forEach(p => { state.drafts[p.id] = { spice: p.defaultSpice ?? 3, qty: 1 }; });

const overlayStack = [];
window.__overlayStack__ = overlayStack;
let isProgrammaticBack = false;
let isNavClick = false;

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

  if (DOM.bottomNav) {
    const ob = DOM.onboardingOverlay;
    if (!ob || ob.classList.contains('hidden') || ob.style.display === 'none') {
      DOM.bottomNav.style.display = 'flex';
    }
  }
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
function setActiveNav(activeId) { document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.id === activeId)); }

function syncBottomNav() {
  setTimeout(() => {
    if (DOM.aiChatBox?.classList.contains('active')) setActiveNav('aiChatToggle');
    else if (DOM.miniCartModal?.classList.contains('active') || document.getElementById('orderConfirmModal')?.classList.contains('active') || DOM.paymentModal?.classList.contains('active')) setActiveNav('navCartBtn');
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
  const firstInput = modalEl.querySelector('button, input, textarea, select');
  if (firstInput) firstInput.focus();
  syncBottomNav();
}

function closeModal(modalEl, fromPopState = false) {
  if (!modalEl) return;
  if (previousFocusedElement && document.body.contains(previousFocusedElement)) previousFocusedElement.focus();
  else document.getElementById('navHomeBtn')?.focus();
  previousFocusedElement = null;
  modalEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.setAttribute('inert', '');
  const index = overlayStack.indexOf(modalEl);
  if (index > -1) overlayStack.splice(index, 1);
  releaseInert();
  if (!fromPopState) { isProgrammaticBack = true; history.back(); }   // ✅ patch history
  syncBottomNav();
}

function showConfirmModal(title, message, onConfirm) {
  const old = document.getElementById('confirmModal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'confirmModal';
  modal.className = 'modal-overlay centered confirm-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `<div class="drawer-content confirm-modal-content"><h4>${title}</h4><p>${message}</p><div class="confirm-buttons"><button id="confirmNo" class="btn-outline">Batal</button><button id="confirmYes" class="btn-danger">Hapus</button></div></div>`;
  document.body.appendChild(modal);
  openModal(modal);
  document.getElementById('confirmNo').onclick = () => closeModal(modal);
  document.getElementById('confirmYes').onclick = () => { closeModal(modal); if (onConfirm) onConfirm(); };
}

// ---------------------------------------------------------------------------
// PRODUCT PAGE (auto‑hide nav)
// ---------------------------------------------------------------------------
function openProductPage(globalIndex) {
  if (!DOM.productPage) return;
  if (DOM._productObserver) { DOM._productObserver.disconnect(); DOM._productObserver = null; }
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

  if (DOM.bottomNav) {
    DOM.bottomNav.classList.remove('nav-hidden');
    DOM.bottomNav.classList.add('nav-visible');
  }

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
        if (img && img.dataset.src && (!img.src || img.src === window.location.href)) {
          img.src = img.dataset.src;
          img.onload = () => img.classList.add('loaded');
          img.onerror = () => img.classList.add('loaded');
        }
      }
    });
  }, { rootMargin: '0px 0px 200px 0px' });

  document.querySelectorAll('.product-slide').forEach(slide => {
    observer.observe(slide);
    let lastScrollTop = 0;
    slide.addEventListener('scroll', () => {
      const st = slide.scrollTop;
      const nav = DOM.bottomNav;
      if (!nav) return;
      if (st <= 10) { nav.classList.remove('nav-hidden'); nav.classList.add('nav-visible'); lastScrollTop = 0; return; }
      if (st > lastScrollTop && st > 40) { nav.classList.add('nav-hidden'); nav.classList.remove('nav-visible'); }
      else if (st < lastScrollTop) { nav.classList.remove('nav-hidden'); nav.classList.add('nav-visible'); }
      lastScrollTop = st;
    }, { passive: true });
  });

  DOM._productObserver = observer;
  syncBottomNav();
}

function closeProductPage(fromPopState = false) {
  if (!DOM.productPage) return;
  document.getElementById('navHomeBtn')?.focus();
  DOM.productPage.classList.remove('active');
  if (DOM.bottomNav) { DOM.bottomNav.classList.remove('nav-hidden', 'nav-visible'); }
  setTimeout(() => {
    DOM.productPage.style.display = 'none';
    DOM.productPage.setAttribute('aria-hidden', 'true');
    DOM.productPage.setAttribute('inert', '');
    const index = overlayStack.indexOf(DOM.productPage);
    if (index > -1) overlayStack.splice(index, 1);
    if (overlayStack.length === 0) document.body.style.overflow = '';
    document.getElementById('waVipSideTab')?.classList.remove('open');
    if (DOM._productObserver) { DOM._productObserver.disconnect(); DOM._productObserver = null; }
    releaseInert();
    if (!fromPopState) { isProgrammaticBack = true; history.back(); }   // ✅ patch history
    syncBottomNav();
  }, 400);
}

// ---------------------------------------------------------------------------
// GESTURES
// ---------------------------------------------------------------------------
function initDetailGestures() {
  const track = DOM.productSwiperTrack;
  if (!track) return;
  let startX = 0, startY = 0, activeSlide = null, isPulling = false, gestureDetermined = false;
  track.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    if (startX < 30 || startX > window.innerWidth - 30) return;
    activeSlide = e.target.closest('.product-slide');
    isPulling = activeSlide && activeSlide.scrollTop <= 0;
    gestureDetermined = false;
  }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    if (!isPulling || !activeSlide) return;
    const dy = e.touches[0].clientY - startY, dx = e.touches[0].clientX - startX;
    if (!gestureDetermined && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      if (Math.abs(dx) > Math.abs(dy)) { isPulling = false; return; }
      gestureDetermined = true;
    }
    if (gestureDetermined && dy > 0) {
      if (e.cancelable) e.preventDefault();
      activeSlide.style.transform = `translateY(${Math.max(0, dy * (1 - dy / (window.innerHeight * 1.5)))}px)`;
    }
  }, { passive: false });
  track.addEventListener('touchend', (e) => {
    if (!isPulling || !activeSlide || !gestureDetermined) return;
    activeSlide.style.transition = 'all 0.3s ease';
    if (e.changedTouches[0].clientY - startY > 120) closeProductPage(false);
    else activeSlide.style.transform = 'translateY(0)';
    setTimeout(() => { if (activeSlide) { activeSlide.style.transition = ''; activeSlide.style.transform = ''; } isPulling = false; activeSlide = null; }, 300);
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// CART & SHIPPING
// ---------------------------------------------------------------------------
function getCartSummaryLocal() { return getCartSummary(state.cart); }

function updateShippingUI() {
  const dist = state.userDistance;
  const section = DOM.shippingSection;
  if (!section) return;
  const { subtotal, mainProductQty } = getCartSummaryLocal();
  if (dist != null) {
    section.style.display = 'block';
    const ship = calculateShipping(dist, mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority);
    const cost = ship.cost;
    document.getElementById('shippingDistance').textContent = `${dist} km`;
    DOM.finalShipping.textContent = cost != null ? fmt(cost) : '...';
    DOM.finalTotal.textContent = cost != null ? fmt(subtotal + cost) : fmt(subtotal);
  } else {
    section.style.display = 'none';
    if (DOM.finalTotal) DOM.finalTotal.textContent = fmt(subtotal);
  }
}

function updateCartUI() {
  saveCart(state.cart);
  renderCart(state.cart, ['cartBadgeNav']);
  if (DOM.miniCartModal?.classList.contains('active')) { renderMiniCart(state.cart); updateShippingUI(); }
  const total = Object.values(state.cart).reduce((s, i) => s + i.qty, 0);
  if (DOM.liveCartRegion) DOM.liveCartRegion.textContent = total > 0 ? `${total} item di keranjang` : 'Keranjang kosong';
  if (window.lucide) lucide.createIcons();
}

// ---------------------------------------------------------------------------
// DRAWER DISTRICT DROPDOWN (OSM) — ✅ sudah aman XSS, aria-expanded, keyboard
// ---------------------------------------------------------------------------
function initDrawerDistrictDropdown() {
  const input = DOM.districtInput;
  const dropdown = DOM.drawerDistrictDropdown;
  if (!input || !dropdown) return;
  input.placeholder = 'Ketik alamat tujuan (jalan, kelurahan, kota)';

  let activeOptionIndex = -1;

  const setActiveOption = (index) => {
    const opts = dropdown.querySelectorAll('[role="option"]');
    opts.forEach(o => o.setAttribute('aria-selected', 'false'));
    if (index >= 0 && index < opts.length) {
      opts[index].setAttribute('aria-selected', 'true');
      opts[index].scrollIntoView({ block: 'nearest' });
      activeOptionIndex = index;
    }
  };

  const selectDrawerDistrict = async (lat, lon, name) => {
    dropdown.style.display = 'none';
    input.setAttribute('aria-expanded', 'false');
    input.value = 'Menghitung…';
    try {
      const r = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, lat, lon);
      state.userDistance = r.distance;
    } catch { showToast('Gagal menghitung jarak.'); return; }
    state.selectedDistrictFull = name;
    state.selectedDistrict = extractShortLocation(name);
    input.value = name;
    applyPersonalization();
    updateShippingUI();
    if (DOM.miniCartModal?.classList.contains('active')) renderMiniCart(state.cart);
    saveCustomer(state.customerPhone, state.customerAddress, name, state.userDistance);
  };

  const handleSearch = debounce(async (query) => {
    if (query.length < 3) {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      return;
    }
    dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:var(--gray-500)">Mencari lokasi…</div>';
    dropdown.style.display = 'block';
    input.setAttribute('aria-expanded', 'true');

    let results = [];
    try { results = await queuedSearch(query); } catch {
      dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--danger)">Gagal memuat.</div>';
      return;
    }
    if (!results.length) {
      dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--danger)">Tidak ditemukan.</div>';
      return;
    }
    activeOptionIndex = -1;
    dropdown.innerHTML = results.map((p, i) => {
      const shortName = escapeHTML(p.display_name.split(',').slice(0,3).join(','));
      const roadName = escapeHTML(p.address.road || p.address.suburb || p.name || '');
      return `<div role="option" id="drawerDistrictOpt-${i}" tabindex="0" data-lat="${p.lat}" data-lon="${p.lon}" data-name="${shortName}"><strong>${roadName}</strong><br><span style="font-size:0.75rem;color:var(--gray-500)">${shortName}</span></div>`;
    }).join('');
  }, 500);

  input.addEventListener('input', (e) => {
    state.selectedDistrict = ''; state.selectedDistrictFull = ''; state.userDistance = null;
    updateShippingUI();
    handleSearch(e.target.value.trim());
  });

  input.addEventListener('keydown', (e) => {
    const opts = dropdown.querySelectorAll('[role="option"]');
    if (!opts.length || dropdown.style.display === 'none') return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveOption(Math.min(activeOptionIndex + 1, opts.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveOption(Math.max(activeOptionIndex - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeOptionIndex >= 0 && activeOptionIndex < opts.length) {
        const opt = opts[activeOptionIndex];
        selectDrawerDistrict(parseFloat(opt.dataset.lat), parseFloat(opt.dataset.lon), opt.dataset.name);
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      input.focus();
    }
  });

  dropdown.addEventListener('click', (e) => {
    const opt = e.target.closest('[role="option"]');
    if (opt) selectDrawerDistrict(parseFloat(opt.dataset.lat), parseFloat(opt.dataset.lon), opt.dataset.name);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
    }
  });
}

// ---------------------------------------------------------------------------
// ONBOARDING — ✅ sudah aman XSS, aria-expanded, inert saat keluar
// ---------------------------------------------------------------------------
async function resolveOnboardingDistance(name) { if (!name) return; try { const r = await queuedSearch(name); if (r.length) { const d = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, +r[0].lat, +r[0].lon); state.userDistance = d.distance; state.selectedDistrict = extractShortLocation(r[0].display_name)||name; state.selectedDistrictFull = r[0].display_name; saveCustomer(state.customerPhone, state.customerAddress, r[0].display_name, d.distance); } } catch {} }

function initOnboarding() {
  const saved = loadState();
  if (saved?.name && saved.district) {
    state.customerName = saved.name; state.selectedDistrictFull = saved.district; state.selectedDistrict = extractShortLocation(saved.district)||saved.district;
    DOM.onbNewUser.style.display = 'none'; DOM.onbReturningUser.style.display = 'block';
    DOM.onbWelcomeName.textContent = saved.name==='Tamu'?'Pelanggan':saved.name;
    DOM.onbWelcomeDistrict.textContent = state.selectedDistrict;
    resolveOnboardingDistance(state.selectedDistrict);
  } else { DOM.onbNewUser.style.display = 'block'; DOM.onbStep1.classList.add('active'); }

  document.getElementById('onbNextBtn').addEventListener('click', () => {
    const name = DOM.onbName.value.trim(); if (!name) return showToast('Mohon isi nama Anda.');
    state.customerName = name; DOM.onbStep1.classList.remove('active'); DOM.onbStep2.classList.add('active');
  });

  // ✅ Patch: inert + nav
  document.getElementById('onbGuestBtn')?.addEventListener('click', () => {
    state.customerName = 'Tamu'; state.selectedDistrict = '';
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => {
      DOM.onboardingOverlay.style.display = 'none';
      if (DOM.bottomNav) DOM.bottomNav.style.display = 'flex';
      DOM.mainContent?.removeAttribute('inert');
    }, 600);
    applyPersonalization(); initScrollReveal();
  });

  const input = DOM.onbDistrict, dropdown = DOM.onbDistrictDropdown;
  if (!input || !dropdown) return;
  input.placeholder = 'Ketik alamat tujuan (jalan, kelurahan, kota)';
  input.setAttribute('aria-expanded', 'false');
  let activeOptionIndex = -1;

  const setActive = (i) => {
    const opts = dropdown.querySelectorAll('[role="option"]');
    opts.forEach(o=>o.setAttribute('aria-selected','false'));
    if(i>=0&&i<opts.length){ opts[i].setAttribute('aria-selected','true'); opts[i].scrollIntoView({block:'nearest'}); activeOptionIndex=i; }
  };

  const selectOnbDistrict = async (lat, lon, name) => {
    dropdown.style.display = 'none';
    input.setAttribute('aria-expanded', 'false');
    input.value = 'Menghitung…';
    try {
      const r = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, lat, lon);
      state.userDistance = r.distance;
      state.selectedDistrictFull = name;
      state.selectedDistrict = extractShortLocation(name);
      input.value = name;
      applyPersonalization();
      saveCustomer(state.customerPhone, state.customerAddress, name, r.distance);
      showToast('✅ Lokasi berhasil dipilih!');
    } catch { showToast('⚠️ Gagal menghitung jarak.'); }
  };

  const renderOnbDropdown = (results) => {
    activeOptionIndex = -1;
    if (!results.length) {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      return;
    }
    dropdown.innerHTML = results.map((p,i) => {
      const shortName = escapeHTML(p.display_name.split(',').slice(0,3).join(','));
      const roadName = escapeHTML(p.address.road || p.address.suburb || p.name || '');
      return `<div role="option" id="onbDistrictOpt-${i}" tabindex="0" data-lat="${p.lat}" data-lon="${p.lon}" data-name="${shortName}"><strong>${roadName}</strong><br><span style="font-size:0.75rem;color:var(--gray-500)">${shortName}</span></div>`;
    }).join('');
    dropdown.style.display = 'block';
    input.setAttribute('aria-expanded', 'true');
  };

  input.addEventListener('input', debounce(async (q) => {
    if(q.length<3){dropdown.style.display='none'; input.setAttribute('aria-expanded','false'); return}
    dropdown.innerHTML='<div style="padding:14px;text-align:center;color:var(--gray-500)">Mencari…</div>'; dropdown.style.display='block'; input.setAttribute('aria-expanded','true');
    let r=[]; try{r=await queuedSearch(q)}catch{return} renderOnbDropdown(r);
  },700));

  input.addEventListener('keydown', (e) => {
    const opts = dropdown.querySelectorAll('[role="option"]');
    if (!opts.length || dropdown.style.display === 'none') return;
    if(e.key==='ArrowDown'){e.preventDefault();setActive(Math.min(activeOptionIndex+1,opts.length-1))}
    else if(e.key==='ArrowUp'){e.preventDefault();setActive(Math.max(activeOptionIndex-1,0))}
    else if(e.key==='Enter'&&activeOptionIndex>=0){e.preventDefault();const o=opts[activeOptionIndex];selectOnbDistrict(+o.dataset.lat,+o.dataset.lon,o.dataset.name)}
    else if(e.key==='Escape'){dropdown.style.display='none'; input.setAttribute('aria-expanded','false'); input.focus();}
  });

  dropdown.addEventListener('click', (e) => { const o = e.target.closest('[role="option"]'); if(o) selectOnbDistrict(+o.dataset.lat,+o.dataset.lon,o.dataset.name); });

  document.addEventListener('click', (e) => { if (!input.contains(e.target) && !dropdown.contains(e.target)) { dropdown.style.display = 'none'; input.setAttribute('aria-expanded', 'false'); } });

  document.getElementById('onbStartBtn').addEventListener('click', () => {
    if(!state.selectedDistrict) return showToast('Mohon pilih alamat tujuan.');
    saveUser(state.customerName, state.selectedDistrict);
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; if(DOM.bottomNav) DOM.bottomNav.style.display = 'flex'; DOM.mainContent?.removeAttribute('inert'); }, 600);
    applyPersonalization(); initScrollReveal();
  });

  document.getElementById('onbEnterBtn').addEventListener('click', () => {
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; if(DOM.bottomNav) DOM.bottomNav.style.display = 'flex'; DOM.mainContent?.removeAttribute('inert'); }, 600);
    applyPersonalization(); initScrollReveal();
  });

  document.getElementById('onbResetBtn').addEventListener('click', () => {
    clearUser(); state.cart={}; updateCartUI();
    DOM.onbReturningUser.style.display='none'; DOM.onbNewUser.style.display='block';
    DOM.onbStep2.classList.remove('active'); DOM.onbStep1.classList.add('active');
    if(DOM.bottomNav) DOM.bottomNav.style.display='none';
    DOM.mainContent?.setAttribute('inert', '');   // ✅ kunci lagi saat kembali ke onboarding
  });
}

// ---------------------------------------------------------------------------
// WHATSAPP, TELEGRAM & DOWNLOAD STRUK (tidak berubah)
// ---------------------------------------------------------------------------
async function downloadReceiptPNG() { /* ... tidak berubah ... */ }
async function sendReceiptToTelegram() { /* ... tidak berubah ... */ }
async function sendReceiptToWhatsApp() { /* ... tidak berubah ... */ }
async function showOrderConfirmation() { const receiptOk = await launchProReceipt(state, DOM, overlayStack, openModal, closeModal, getCartSummaryLocal, downloadReceiptPNG, sendReceiptToTelegram, DOM.finalTotal); return receiptOk; }

// ---------------------------------------------------------------------------
// EVENT BINDINGS (tidak ada perubahan selain yang sudah ada)
// ---------------------------------------------------------------------------
function bindEvents() { /* ... sama seperti versi sebelumnya, tidak diubah oleh audit ... */ }

// ---------------------------------------------------------------------------
// INIT (tidak berubah)
// ---------------------------------------------------------------------------
function init() { /* ... sama seperti versi sebelumnya ... */ }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();