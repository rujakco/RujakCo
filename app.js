// app.js — FINAL dengan integrasi Edge Function send-telegram
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
// Tidak lagi mengimpor showOrderConfirmation dari modul checkout-receipt, kita buat sendiri di sini

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
  haversineUsed: false,
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
// NAV & OVERLAY LOGIC
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
  if (previousFocusedElement) {
    previousFocusedElement.focus();
    previousFocusedElement = null;
  }
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
  openModal(modal);
  document.getElementById('confirmNo').onclick = () => closeModal(modal);
  document.getElementById('confirmYes').onclick = () => {
    closeModal(modal);
    if (onConfirm) onConfirm();
  };
  modal.addEventListener('transitionend', (e) => {
    if (!modal.classList.contains('active') && e.target === modal) {
      modal.remove();
      if (triggerEl && typeof triggerEl.focus === 'function') triggerEl.focus();
    }
  });
}

function openProductPage(globalIndex) {
  if (!DOM.productPage) return;
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
  if (DOM._productObserver) DOM._productObserver.disconnect();
  DOM._productObserver = new IntersectionObserver((entries) => {
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
  document.querySelectorAll('.product-slide').forEach(slide => DOM._productObserver.observe(slide));
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
    try {
      const results = await queuedSearch(query);
      if (results.length === 0) {
        dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--danger);">Lokasi tidak ditemukan.</div>';
        return;
      }
      dropdown.innerHTML = results.map(place => {
        const displayName = place.display_name.split(',').slice(0, 3).join(',');
        return `<div role="option" tabindex="0" data-lat="${place.lat}" data-lon="${place.lon}" data-name="${displayName}">
                  <strong>${place.address.road || place.address.suburb || place.name}</strong><br>
                  <span style="font-size:0.75rem;color:var(--gray-500);">${displayName}</span>
                </div>`;
      }).join('');
      input.setAttribute('aria-expanded', 'true');
    } catch (err) {
      dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--danger);">Koneksi terputus.</div>';
    }
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
    input.value = 'Menghitung rute...';
    dropdown.style.display = 'none';
    const lat = parseFloat(option.dataset.lat);
    const lon = parseFloat(option.dataset.lon);
    const placeName = option.dataset.name;
    try {
      const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, lat, lon);
      state.userDistance = result.distance;
      state.haversineUsed = result.isHaversine;
      state.selectedDistrictFull = placeName;
      state.selectedDistrict = extractShortLocation(placeName);
      input.value = placeName;
      applyPersonalization();
      updateShippingUI();
      if (DOM.miniCartModal?.classList.contains('active')) renderMiniCart(state.cart);
      saveCustomer(state.customerPhone, state.customerAddress, placeName, state.userDistance);
    } catch (err) {
      showToast('Gagal menghitung jarak, coba lagi.');
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
    }
  });
}

// ---------------------------------------------------------------------------
// ONBOARDING (OSM search)
// ---------------------------------------------------------------------------
async function resolveOnboardingDistance(districtName) {
  if (!districtName) return;
  try {
    const results = await queuedSearch(districtName);
    if (results.length > 0) {
      const place = results[0];
      const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, parseFloat(place.lat), parseFloat(place.lon));
      state.userDistance = result.distance;
      state.haversineUsed = result.isHaversine;
      state.selectedDistrict = extractShortLocation(place.display_name) || districtName;
      state.selectedDistrictFull = place.display_name;
      saveCustomer(state.customerPhone, state.customerAddress, place.display_name, state.userDistance);
    }
  } catch (e) { console.warn('Gagal hitung jarak onboarding'); }
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

  document.getElementById('onbNextBtn')?.addEventListener('click', () => {
    const name = DOM.onbName.value.trim();
    if (!name) return showToast('Mohon isi nama.');
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
  let activeOptionIndex = -1;

  const renderOnbDropdown = (results) => {
    activeOptionIndex = -1;
    if (!results.length) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = results.map((place, i) => {
      const displayName = place.display_name.split(',').slice(0, 3).join(',');
      return `<div role="option" id="onbDistrictOpt-${i}" tabindex="0" data-lat="${place.lat}" data-lon="${place.lon}" data-name="${displayName}" aria-selected="false">
                <strong>${place.address.road || place.address.suburb || place.name}</strong><br>
                <span style="font-size:0.75rem;color:var(--gray-500);">${displayName}</span>
              </div>`;
    }).join('');
    dropdown.style.display = 'block';
  };

  const setActiveOnbOption = (index) => {
    const opts = dropdown.querySelectorAll('div[role="option"]');
    opts.forEach(o => o.setAttribute('aria-selected', 'false'));
    if (index >= 0 && index < opts.length) {
      opts[index].setAttribute('aria-selected', 'true');
      opts[index].scrollIntoView({ block: 'nearest' });
      activeOptionIndex = index;
    }
  };

  const selectOnbDistrict = async (lat, lon, displayName) => {
    dropdown.style.display = 'none';
    input.value = 'Menghitung jarak...';
    try {
      const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, lat, lon);
      state.userDistance = result.distance;
      state.haversineUsed = result.isHaversine;
      state.selectedDistrictFull = displayName;
      state.selectedDistrict = extractShortLocation(displayName);
      input.value = displayName;
      applyPersonalization();
      saveCustomer(state.customerPhone, state.customerAddress, displayName, state.userDistance);
      showToast('✅ Lokasi berhasil dipilih!');
    } catch (err) {
      showToast('⚠️ Gagal menghitung jarak.');
      state.selectedDistrictFull = displayName;
      state.selectedDistrict = extractShortLocation(displayName);
      input.value = displayName;
    }
  };

  const handleOnbSearch = debounce(async (query) => {
    if (query.length < 3) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:var(--gray-500);">Mencari...</div>';
    dropdown.style.display = 'block';
    try {
      const results = await queuedSearch(query);
      renderOnbDropdown(results);
    } catch (err) {
      dropdown.innerHTML = '<div style="padding:16px;color:var(--danger);">Koneksi terputus.</div>';
    }
  }, 700);

  input.addEventListener('input', (e) => handleOnbSearch(e.target.value.trim()));
  input.addEventListener('keydown', (e) => {
    const opts = dropdown.querySelectorAll('div[role="option"]');
    if (!opts.length || dropdown.style.display === 'none') {
      if (e.key === 'Enter') handleOnbSearch(input.value.trim());
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveOnbOption(Math.min(activeOptionIndex + 1, opts.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveOnbOption(Math.max(activeOptionIndex - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeOptionIndex >= 0) {
        const opt = opts[activeOptionIndex];
        selectOnbDistrict(parseFloat(opt.dataset.lat), parseFloat(opt.dataset.lon), opt.dataset.name);
      }
    } else if (e.key === 'Escape') { dropdown.style.display = 'none'; input.focus(); }
  });

  dropdown.addEventListener('click', (e) => {
    const opt = e.target.closest('div[role="option"]');
    if (opt) selectOnbDistrict(parseFloat(opt.dataset.lat), parseFloat(opt.dataset.lon), opt.dataset.name);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none';
  });

  document.getElementById('onbStartBtn')?.addEventListener('click', () => {
    if (!state.selectedDistrict) return showToast('Mohon pilih alamat tujuan.');
    saveUser(state.customerName, state.selectedDistrict);
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600);
    applyPersonalization();
    initScrollReveal();
  });

  document.getElementById('onbEnterBtn')?.addEventListener('click', () => {
    DOM.onboardingOverlay.classList.add('hidden');
    setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600);
    applyPersonalization();
    initScrollReveal();
  });

  document.getElementById('onbResetBtn')?.addEventListener('click', () => {
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
// PEMBUATAN ORDER CODE & UPLOAD STRUK
// ---------------------------------------------------------------------------
function generateOrderCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RJ-${y}${m}${d}-${rand}`;
}

async function uploadReceiptToStorage(element) {
  if (!element) return null;
  if (typeof html2canvas === 'undefined') {
    try { await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'); }
    catch { showToast('⚠️ Gagal memuat pustaka struk.'); return null; }
  }
  try {
    const footer = document.querySelector('#orderConfirmModal .drawer-footer');
    if (footer) footer.style.display = 'none';
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: false, logging: false });
    if (footer) footer.style.display = '';

    const sb = getSupabase();
    if (!sb) return null;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;

    const fileName = `${state.currentOrderCode || 'temp'}.png`;
    const { error } = await sb.storage.from('receipts').upload(fileName, blob, { contentType: 'image/png', upsert: true });
    if (error) return null;

    const { data: publicUrl } = sb.storage.from('receipts').getPublicUrl(fileName);
    return publicUrl.publicUrl;
  } catch (err) { return null; }
}

// ---------------------------------------------------------------------------
// KIRIM KE TELEGRAM VIA EDGE FUNCTION
// ---------------------------------------------------------------------------
async function sendReceiptToTelegram() {
  if (!state.receiptUrl || !state.currentOrderCode) {
    console.warn('❌ Data tidak lengkap untuk Telegram');
    return;
  }
  const supabase = getSupabase();
  if (!supabase) return;

  const caption = `🧾 *Order Baru:* ${state.currentOrderCode}\n👤 ${state.customerName}\n📞 ${state.customerPhone}\n💰 Total: ${DOM.finalTotal?.textContent || '—'}`;

  try {
    const { data, error } = await supabase.functions.invoke('send-telegram', {
      body: {
        order_code: state.currentOrderCode,
        receipt_url: state.receiptUrl,
        caption
      }
    });
    if (error) console.error('❌ Edge function error:', error);
    else console.log('✅ Telegram terkirim via Edge Function');
  } catch (err) {
    console.error('❌ Gagal memanggil Edge Function:', err);
  }
}

// ---------------------------------------------------------------------------
// KONFIRMASI PESANAN (STRUK) & ALUR SELESAI
// ---------------------------------------------------------------------------
async function showOrderConfirmation() {
  const summary = getCartSummaryLocal();
  if (summary.items.length === 0) {
    showToast('Keranjang kosong.');
    return;
  }

  state.currentOrderCode = generateOrderCode();
  const orderCode = state.currentOrderCode;

  // Siapkan data tampilan
  const name = DOM.customerNameInput?.value || state.customerName;
  const phone = DOM.customerPhoneInput?.value || '';
  const address = DOM.customerAddressInput?.value || '';
  const delivery = document.getElementById('deliveryTime')?.value || '';
  const notes = document.getElementById('orderNotes')?.value || '-';
  let logistic = state.shippingProvider === 'paxel' ? 'Paxel Ekspres' : 'Kurir RUJAK.Co';
  if (state.shippingProvider === 'rujakco') logistic += ` (${state.vehicleType === 'mobil' ? 'Mobil' : 'Motor'})${state.isPriority ? ' [PRIORITAS]' : ''}`;
  const shipCostText = DOM.finalShipping?.textContent || '0';
  const totalText = DOM.finalTotal?.textContent || '0';

  let itemsHtml = summary.items.map(i => `<div class="confirm-row"><span>${i.name}${i.spice ? ' Lv.'+i.spice : ''} x${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('');
  const confirmHTML = `
    <div class="receipt-wrap" id="receiptContent">
      <div class="receipt-stamp">LUNAS</div>
      <div class="receipt-header">
        <img class="receipt-logo" src="https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/logo.webp" alt="logo">
        <div class="receipt-brand">RUJAK.Co</div>
        <div class="receipt-tagline">Indonesia dalam Satu Wadah</div>
      </div>
      <div class="receipt-meta"><span>${new Date().toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</span><span class="code">${orderCode}</span></div>
      <div class="receipt-section">
        <div class="receipt-section-title">Penerima</div>
        <div class="confirm-row"><span>Nama</span><span>${escapeHTML(name)}</span></div>
        <div class="confirm-row"><span>HP</span><span>${escapeHTML(phone)}</span></div>
        <div class="confirm-row"><span>Alamat</span><span>${escapeHTML(address)}</span></div>
        <div class="confirm-row"><span>Jarak</span><span>${state.userDistance ? state.userDistance+' km' : '-'}</span></div>
      </div>
      <div class="receipt-section">
        <div class="receipt-section-title">Pesanan</div>
        ${itemsHtml}
        <div class="confirm-row"><span>Subtotal</span><span>${fmt(summary.subtotal)}</span></div>
        <div class="confirm-row"><span>Ongkir</span><span>${shipCostText}</span></div>
        <div class="confirm-row total"><span>Total</span><span>${totalText}</span></div>
      </div>
      <div class="receipt-section">
        <div class="receipt-section-title">Pengantaran</div>
        <div class="confirm-row"><span>Jadwal</span><span>${escapeHTML(delivery)}</span></div>
        <div class="confirm-row"><span>Kurir</span><span>${logistic}</span></div>
        <div class="confirm-row"><span>Catatan</span><span>${escapeHTML(notes)}</span></div>
      </div>
      <div class="receipt-footer"><p>Terima kasih</p><div class="receipt-code-text">${orderCode}</div></div>
    </div>`;

  // Tampilkan modal
  const modal = document.createElement('div');
  modal.id = 'orderConfirmModal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="drawer-content" style="height:auto; max-height:85vh;">
      <div class="drawer-header">
        <h3>Konfirmasi Pesanan</h3>
        <button type="button" id="orderConfirmClose" class="glass-btn-dark" aria-label="Tutup"><i data-lucide="x" class="icon-sm"></i></button>
      </div>
      <div class="drawer-body" style="padding:16px;">${confirmHTML}</div>
      <div class="drawer-footer" style="display:flex; gap:8px; padding:16px; border-top:1px solid var(--gray-200);">
        <button type="button" id="orderConfirmBack" class="btn-dark" style="flex:1;">Kembali</button>
        <button type="button" id="orderConfirmLanjut" class="btn-gold" style="flex:1;">Lanjutkan</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  openModal(modal);
  if (window.lucide) lucide.createIcons();

  // Handler tombol kembali
  document.getElementById('orderConfirmBack').onclick = () => {
    closeModal(modal);
    modal.addEventListener('transitionend', (e) => { if (e.target === modal) modal.remove(); });
  };

  // Handler tombol Lanjutkan -> upload struk, kirim Telegram, lalu WhatsApp
  document.getElementById('orderConfirmLanjut').onclick = async () => {
    const btn = document.getElementById('orderConfirmLanjut');
    btn.disabled = true;
    btn.textContent = 'Menyiapkan...';

    // Upload struk ke storage
    const receiptEl = document.getElementById('receiptContent');
    const url = await uploadReceiptToStorage(receiptEl);
    if (url) {
      state.receiptUrl = url;
      await sendReceiptToTelegram(); // kirim via Edge Function
    } else {
      showToast('⚠️ Gagal mengunggah struk, tetapi pesanan tetap dapat dilanjutkan.');
    }

    // Simpan ke Supabase (optional)
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('orders').insert({
          order_code: state.currentOrderCode,
          customer_name: state.customerName,
          customer_phone: state.customerPhone,
          customer_address: state.customerAddress,
          district: state.selectedDistrict,
          distance_km: state.userDistance,
          items: summary.items,
          subtotal: summary.subtotal,
          shipping_cost: parseInt(shipCostText.replace(/\D/g, '')) || null,
          total: parseInt(totalText.replace(/\D/g, '')) || null,
          shipping_provider: logistic,
          delivery_time: delivery,
          notes: notes,
          receipt_url: url || null,
          status: 'pending_payment'
        });
      } catch (err) { console.warn('Simpan order gagal:', err); }
    }

    // Tutup modal & buka WhatsApp
    closeModal(modal);
    modal.addEventListener('transitionend', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Bangun pesan WhatsApp
    let waMsg = `🧾 *STRUK PESANAN RUJAK.CO*\n🆔 *Order ID:* ${state.currentOrderCode}\n\n`;
    waMsg += `👤 *Penerima:* ${name}\n📞 *HP:* ${phone}\n📍 *Alamat:* ${address}\n`;
    waMsg += `\n🗺️ *Jarak:* ${state.userDistance ? state.userDistance+' km' : '-'}\n🕒 *Pengantaran:* ${delivery}\n📝 *Catatan:* ${notes}\n🚚 *Kurir:* ${logistic}\n\n📦 *Pesanan:*\n`;
    summary.items.forEach(item => {
      waMsg += `• ${item.name}${item.spice ? ' Lv.'+item.spice : ''} x${item.qty} = ${fmt(item.price * item.qty)}\n`;
    });
    waMsg += `\n💵 *Subtotal:* ${fmt(summary.subtotal)}\n🛵 *Ongkir:* ${shipCostText}\n💰 *TOTAL TRANSFER:* *${totalText}*\n\n`;
    waMsg += `📎 _Mohon lampirkan bukti transfer (QRIS) Anda di sini agar reservasi dapat segera kami proses._`;

    // Reset keranjang
    state.cart = {};
    updateCartUI();

    // Buka WhatsApp
    window.location.href = `https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;
  };

  // Tutup dengan X
  document.getElementById('orderConfirmClose').onclick = () => {
    closeModal(modal);
    modal.addEventListener('transitionend', (e) => { if (e.target === modal) modal.remove(); });
  };
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
    const idx = Math.round(track.scrollLeft / slideWidth);
    const product = PRODUCTS[idx % PRODUCTS.length];
    if (!product) return;
    const shareUrl = window.location.origin + window.location.pathname + '?product=' + product.id;
    const shareText = `🍜 ${product.name} — ${product.desc}\nPesan sekarang di Rujak.Co!`;
    if (navigator.share) navigator.share({ title: product.name, text: shareText, url: shareUrl }).catch(() => {});
    else navigator.clipboard.writeText(shareUrl + '\n' + shareText).then(() => showToast('📋 Link produk disalin!'));
  });

  document.getElementById('btnVipConcierge')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(`https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent("Halo RUJAK.Co, saya tertarik dengan layanan VIP Concierge.")}`, '_blank');
  });

  document.getElementById('waVipHandle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('waVipSideTab')?.classList.toggle('open');
  });

  document.getElementById('navHomeBtn')?.addEventListener('click', () => {
    if (DOM.productPage?.classList.contains('active')) closeProductPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveNav('navHomeBtn');
  });

  document.getElementById('navProductBtn')?.addEventListener('click', () => {
    if (!DOM.productPage?.classList.contains('active')) openProductPage(state.lastViewedProductIndex >= 0 ? state.lastViewedProductIndex : 0);
  });

  document.getElementById('navCartBtn')?.addEventListener('click', () => {
    if (DOM.productPage?.classList.contains('active')) {
      closeProductPage();
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

  // Delivery time dropdown
  const deliveryTrigger = document.getElementById('deliveryTimeTrigger');
  const deliveryDropdown = document.getElementById('deliveryTimeDropdown');
  const deliveryHidden = document.getElementById('deliveryTime');
  const deliveryLabel = document.getElementById('deliveryTimeLabel');
  let deliveryActiveIndex = 0;
  if (deliveryTrigger && deliveryDropdown && deliveryHidden) {
    const preselected = deliveryDropdown.querySelector('[aria-selected="true"]');
    if (preselected) { deliveryLabel.textContent = preselected.textContent; deliveryHidden.value = preselected.dataset.value; }

    const setDeliveryOption = (option) => {
      deliveryDropdown.querySelectorAll('[role="option"]').forEach(o => o.setAttribute('aria-selected', 'false'));
      option.setAttribute('aria-selected', 'true');
      deliveryLabel.textContent = option.textContent;
      deliveryHidden.value = option.dataset.value;
      deliveryDropdown.style.display = 'none';
      deliveryTrigger.setAttribute('aria-expanded', 'false');
    };

    deliveryTrigger.addEventListener('click', () => {
      const isOpen = deliveryDropdown.style.display === 'block';
      deliveryDropdown.style.display = isOpen ? 'none' : 'block';
      deliveryTrigger.setAttribute('aria-expanded', !isOpen);
      if (!isOpen) {
        const opts = deliveryDropdown.querySelectorAll('[role="option"]');
        deliveryActiveIndex = [...opts].findIndex(o => o.getAttribute('aria-selected') === 'true');
        if (deliveryActiveIndex === -1) deliveryActiveIndex = 0;
        opts[deliveryActiveIndex]?.focus();
      }
    });

    deliveryDropdown.addEventListener('click', (e) => {
      const option = e.target.closest('[role="option"]');
      if (option) setDeliveryOption(option);
    });

    deliveryDropdown.addEventListener('keydown', (e) => {
      const opts = [...deliveryDropdown.querySelectorAll('[role="option"]')];
      if (e.key === 'ArrowDown') { e.preventDefault(); deliveryActiveIndex = Math.min(deliveryActiveIndex + 1, opts.length - 1); opts[deliveryActiveIndex].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); deliveryActiveIndex = Math.max(deliveryActiveIndex - 1, 0); opts[deliveryActiveIndex].focus(); }
      else if (e.key === 'Enter') { e.preventDefault(); setDeliveryOption(opts[deliveryActiveIndex]); }
      else if (e.key === 'Escape') { deliveryDropdown.style.display = 'none'; deliveryTrigger.focus(); }
    });

    document.addEventListener('click', (e) => {
      if (!deliveryTrigger.contains(e.target) && !deliveryDropdown.contains(e.target)) {
        deliveryDropdown.style.display = 'none';
        deliveryTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.getElementById('miniCartClose')?.addEventListener('click', () => closeModal(DOM.miniCartModal));
  document.getElementById('paymentClose')?.addEventListener('click', () => closeModal(DOM.paymentModal));
  document.getElementById('aiChatClose')?.addEventListener('click', () => closeModal(DOM.aiChatBox));
  // orderConfirmClose ditangani di showOrderConfirmation

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

  // Global click handler
  document.addEventListener('click', async (e) => {
    // Boutique item
    const boutique = e.target.closest('.boutique-item');
    if (boutique) { const idx = parseInt(boutique.dataset.idx); if (!isNaN(idx)) openProductPage(idx); return; }

    // Step 1 button di product detail
    const step1Btn = e.target.closest('.step-1-btn');
    if (step1Btn) {
      if (window.navigator.vibrate) window.navigator.vibrate(10);
      const idx = step1Btn.dataset.idx;
      const pid = step1Btn.dataset.pid;
      document.getElementById(`step1_${idx}_${pid}`).style.display = 'none';
      document.getElementById(`step2_${idx}_${pid}`).style.display = 'block';
      return;
    }

    // Spice selector
    const spiceOption = e.target.closest('.spice-option');
    if (spiceOption) {
      const pid = spiceOption.dataset.pid;
      const val = parseInt(spiceOption.dataset.spice);
      state.drafts[pid].spice = val;
      document.querySelectorAll(`.spice-option[data-pid="${pid}"]`).forEach(b => b.classList.toggle('active', parseInt(b.dataset.spice) === val));
      document.querySelectorAll(`[id^="spiceLabel_"][id$="_${pid}"]`).forEach(el => el.textContent = SPICE_LABELS[val]);
      return;
    }

    // Qty buttons
    const qtyPlus = e.target.closest('.qty-plus');
    const qtyMinus = e.target.closest('.qty-minus');
    if (qtyPlus || qtyMinus) {
      const pid = (qtyPlus || qtyMinus).dataset.pid;
      if (qtyPlus) state.drafts[pid].qty++;
      else if (state.drafts[pid].qty > 1) state.drafts[pid].qty--;
      document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = state.drafts[pid].qty);
      return;
    }

    // Add to cart
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
        document.getElementById(`step1_${idx}_${pid}`).style.display = 'block';
        document.getElementById(`step2_${idx}_${pid}`).style.display = 'none';
      }, 500);
      return;
    }

    // Cart item increase/decrease
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn && !actionBtn.classList.contains('add-to-cart-btn') && !actionBtn.classList.contains('step-1-btn')) {
      const id = actionBtn.dataset.id;
      const type = actionBtn.dataset.action;
      if (type === 'increase') {
        state.cart[id].qty++;
      } else if (type === 'decrease') {
        if (state.cart[id].qty === 1) {
          showConfirmModal('Hapus Sajian?', 'Sajian ini akan dihapus dari reservasi Anda.', () => {
            delete state.cart[id];
            updateCartUI();
            if (DOM.miniCartModal.classList.contains('active')) renderMiniCart(state.cart);
            showToast('Sajian dihapus.');
          });
          return;
        }
        state.cart[id].qty--;
      }
      updateCartUI();
      if (DOM.miniCartModal.classList.contains('active')) renderMiniCart(state.cart);
      return;
    }

    // Logistic buttons
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

    // Open payment -> validasi & show confirmation
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
      if (!validatePhone(phone)) { showToast('Nomor HP tidak valid.'); e.target.dataset.processing = 'false'; return; }
      if (!validateAddress(address)) { showToast('Mohon lengkapi alamat pengantaran.'); e.target.dataset.processing = 'false'; return; }
      if (!state.selectedDistrict && !state.selectedDistrictFull) {
        showToast('Mohon pilih alamat tujuan terlebih dahulu.');
        e.target.dataset.processing = 'false';
        return;
      }

      // Auto recover jarak jika null
      if (state.userDistance == null) {
        const addressToSearch = state.selectedDistrictFull || DOM.districtInput?.value?.trim() || `${state.selectedDistrict}, ${state.customerAddress}`;
        if (addressToSearch) {
          try {
            const results = await queuedSearch(addressToSearch);
            if (results.length > 0) {
              const place = results[0];
              const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, parseFloat(place.lat), parseFloat(place.lon));
              state.userDistance = result.distance;
              state.haversineUsed = result.isHaversine;
              state.selectedDistrictFull = place.display_name;
              state.selectedDistrict = extractShortLocation(place.display_name);
              if (DOM.districtInput) DOM.districtInput.value = place.display_name;
              saveCustomer(phone, address, place.display_name, result.distance);
              updateShippingUI();
            }
          } catch (err) { console.warn('Auto recover gagal:', err); }
        }
        if (state.userDistance == null) {
          showToast('Gagal menghitung jarak. Silakan pilih alamat dari pencarian di atas.');
          e.target.dataset.processing = 'false';
          return;
        }
      }

      // Tampilkan modal konfirmasi (struk)
      await showOrderConfirmation();
      e.target.dataset.processing = 'false';
      return;
    }

    // AI Chat toggle
    if (e.target.closest('#aiChatToggle')) { e.preventDefault(); openModal(DOM.aiChatBox); return; }

    // Back from product
    if (e.target.closest('#backFromProduct')) { closeProductPage(); return; }

    // FAQ toggle
    const faqToggle = e.target.closest('[data-toggle="faq"]');
    if (faqToggle) {
      const item = faqToggle.closest('.faq-item');
      const isOpen = item.classList.toggle('open');
      faqToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      return;
    }
  });

  // Modal overlay close on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  });
}

// ---------------------------------------------------------------------------
// PARALLAX HERO
// ---------------------------------------------------------------------------
function initHeroParallax() {
  const heroImg = document.querySelector('.hero-img');
  if (!heroImg) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (DOM.header) DOM.header.classList.toggle('scrolled', window.scrollY > 50);
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        heroImg.style.transform = `translate3d(0, ${scrollY * 0.35}px, 0) scale(${1.02 + scrollY * 0.0002})`;
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
    if (!isStorageAvailable()) showToast('⚠️ Penyimpanan browser tidak tersedia.');

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
      if (cust.distance != null && !isNaN(cust.distance)) state.userDistance = cust.distance;
      else {
        const raw = localStorage.getItem('rj_user_distance');
        if (raw) { const p = parseFloat(raw); if (!isNaN(p)) state.userDistance = p; }
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
        if (topOverlay.id === 'productPage') closeProductPage(true);
        else closeModal(topOverlay, true);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlayStack.length > 0) {
        const topOverlay = overlayStack[overlayStack.length - 1];
        if (topOverlay.id === 'productPage') closeProductPage(false);
        else closeModal(topOverlay, false);
      }
    });

    syncBottomNav();
    console.log('✅ RUJAK.Co siap.');
  } catch (err) {
    console.error('❌ Gagal inisialisasi:', err);
    showToast('⚠️ Terjadi kesalahan. Muat ulang halaman.');
  }
}

// Fungsi initDetailGestures (dari sebelumnya)
function initDetailGestures() {
  const track = DOM.productSwiperTrack;
  if (!track) return;
  let startX = 0, startY = 0, activeSlide = null, isPulling = false, gestureDetermined = false;
  track.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    activeSlide = e.target.closest('.product-slide');
    isPulling = activeSlide && activeSlide.scrollTop <= 0;
    gestureDetermined = false;
  }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    if (!isPulling || !activeSlide) return;
    const dy = e.touches[0].clientY - startY;
    const dx = e.touches[0].clientX - startX;
    if (!gestureDetermined && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      if (Math.abs(dx) > Math.abs(dy)) { isPulling = false; return; }
      gestureDetermined = true;
    }
    if (gestureDetermined && dy > 0) {
      if (e.cancelable) e.preventDefault();
      activeSlide.style.transform = `translateY(${Math.max(0, dy * 0.8)}px)`;
    }
  }, { passive: false });
  track.addEventListener('touchend', (e) => {
    if (!isPulling || !activeSlide || !gestureDetermined) return;
    const dy = e.changedTouches[0].clientY - startY;
    activeSlide.style.transition = 'all 0.3s ease';
    if (dy > 120) closeProductPage(false);
    else activeSlide.style.transform = 'translateY(0)';
    setTimeout(() => { if (activeSlide) { activeSlide.style.transition = ''; activeSlide.style.transform = ''; } isPulling = false; activeSlide = null; }, 300);
  }, { passive: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();