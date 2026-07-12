// app.js
import { PRODUCTS } from './data/products.js';
import { DISTRICT_MAP } from './data/districts.js';
import { SYSTEM, SPICE_LABELS } from './data/config.js';
import { fmt, showToast, debounce, getSupabase } from './utils/helpers.js';
import { loadState, saveCart, saveUser, clearUser } from './modules/storage.js';
import { getDistance, calculateShipping } from './modules/shipping.js';
import { renderMenu, renderProductSwiper, renderCart, renderMiniCart } from './modules/render.js';
import { initCarousel } from './modules/carousel.js';
import { initAIChat } from './modules/chat.js';
import { initAccessibility } from './modules/accessibility.js';
import { validatePhone, validateAddress, processPayment, confirmOrder } from './modules/checkout.js';

// ========== GLOBAL STATE ==========
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

// Inisialisasi drafts
PRODUCTS.forEach(p => {
  state.drafts[p.id] = { spice: p.defaultSpice || 3, qty: 1 };
});

// Expose ke window untuk keperluan debugging / helper
window.PRODUCTS = PRODUCTS;
window.state = state;
window.SPICE_LABELS = SPICE_LABELS;
window.DISTRICT_MAP = DISTRICT_MAP;
window.fmt = fmt;

// ========== FUNGSI UI ==========
function applyPersonalization() {
  const name = state.customerName || 'Ngoedi';
  const district = state.selectedDistrict || 'Bekasi';
  const formattedDist = district.replace(/\b\w/g, l => l.toUpperCase());

  // Hero
  const heroName = document.getElementById('heroNameDisplay');
  if (heroName) heroName.textContent = name;
  const heroGreeting = document.getElementById('heroGreeting');
  if (heroGreeting) {
    const hour = new Date().getHours();
    let greet = 'Selamat Malam';
    if (hour < 11) greet = 'Selamat Pagi';
    else if (hour < 15) greet = 'Selamat Siang';
    else if (hour < 19) greet = 'Selamat Sore';
    heroGreeting.innerHTML = `${greet},<br /><em>${name}</em>`;
  }

  // Header
  const hName = document.getElementById('headerNameDisplay');
  if (hName) hName.textContent = name;
  const hLoc = document.getElementById('headerLocDisplay');
  if (hLoc) hLoc.textContent = formattedDist;

  // Checkout form
  const cName = document.getElementById('customerName');
  if (cName) cName.value = name;
  const dInput = document.getElementById('districtInput');
  if (dInput && state.selectedDistrict) dInput.value = formattedDist;

  // Chat welcome
  const aiWelcome = document.getElementById('aiWelcomeMsg');
  if (aiWelcome) aiWelcome.textContent = `Halo, ${name}! Ada yang bisa kami bantu untuk pesanan Anda?`;

  updateShippingUI();
}

function updateShippingUI() {
  const dist = state.selectedDistrict ? getDistance(state.selectedDistrict) : (state.userDistance || null);
  if (dist !== null) {
    const section = document.getElementById('shippingSection');
    if (section) section.style.display = 'block';
  }
  const sum = getCartSummaryInternal();
  const ship = calculateShipping(dist || SYSTEM.DEFAULT_DISTANCE, sum.mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority);
  const distEl = document.getElementById('shippingDistance');
  if (distEl) distEl.textContent = dist ? `${dist} km` : '';
  const finalShip = document.getElementById('finalShipping');
  if (finalShip) finalShip.textContent = ship.cost ? fmt(ship.cost) : '...';
  const finalTotal = document.getElementById('finalTotal');
  if (finalTotal) finalTotal.textContent = ship.cost ? fmt(sum.subtotal + ship.cost) : fmt(sum.subtotal);
}

function getCartSummaryInternal() {
  const items = []; let subtotal = 0, mainProductQty = 0;
  Object.keys(state.cart).forEach(id => {
    const entry = state.cart[id];
    const pid = id.split('_spice')[0];
    const product = PRODUCTS.find(p => p.id === pid);
    if (product && entry && entry.qty > 0) {
      subtotal += product.price * entry.qty;
      mainProductQty += entry.qty;
      items.push({ cartId: id, id: pid, name: product.name, price: product.price, qty: entry.qty, spice: entry.spice });
    } else { delete state.cart[id]; }
  });
  return { items, subtotal, mainProductQty };
}

function updateUI() {
  saveCart(state.cart);
  renderCart(state.cart, ['cartBadgeNav']);
  if (document.getElementById('miniCartModal')?.classList.contains('active')) {
    renderMiniCart(state.cart);
    updateShippingUI();
  }
}

// ========== ONBOARDING ==========
function initOnboarding() {
  const overlay = document.getElementById('onboardingOverlay');
  const saved = loadState();

  if (saved.name && saved.district) {
    state.customerName = saved.name;
    state.selectedDistrict = saved.district;
    document.getElementById('onbNewUser').style.display = 'none';
    document.getElementById('onbReturningUser').style.display = 'block';
    document.getElementById('onbWelcomeName').textContent = saved.name;
    document.getElementById('onbWelcomeDistrict').textContent = saved.district.replace(/\b\w/g, l => l.toUpperCase());
  } else {
    document.getElementById('onbNewUser').style.display = 'block';
    document.getElementById('onbStep1').classList.add('active');
  }

  // Tombol Next
  document.getElementById('onbNextBtn')?.addEventListener('click', () => {
    const name = document.getElementById('onbName').value.trim();
    if (!name) { showToast('Mohon isi nama Anda.'); return; }
    state.customerName = name;
    document.getElementById('onbStep1').classList.remove('active');
    setTimeout(() => {
      document.getElementById('onbStep2').classList.add('active');
      document.getElementById('onbDistrict').focus();
    }, 100);
  });

  // Dropdown kecamatan
  const districtInput = document.getElementById('onbDistrict');
  const dropdown = document.getElementById('onbDistrictDropdown');
  const debouncedFilter = debounce((val) => {
    const v = val.toLowerCase();
    const matches = Object.keys(DISTRICT_MAP).filter(k => k.includes(v));
    if (dropdown) {
      dropdown.style.display = 'block';
      dropdown.innerHTML = matches.map(k => `<div data-val="${k}">${k.replace(/\b\w/g, l => l.toUpperCase())}</div>`).join('');
    }
  }, 150);

  districtInput?.addEventListener('input', e => debouncedFilter(e.target.value));
  dropdown?.addEventListener('click', e => {
    const val = e.target.closest('div[data-val]')?.dataset.val;
    if (!val) return;
    state.selectedDistrict = val;
    dropdown.style.display = 'none';
    districtInput.value = val.replace(/\b\w/g, l => l.toUpperCase());
  });

  // Start
  document.getElementById('onbStartBtn')?.addEventListener('click', () => {
    if (!state.selectedDistrict) { showToast('Mohon pilih kecamatan tujuan.'); return; }
    saveUser(state.customerName, state.selectedDistrict);
    overlay.classList.add('hidden');
    setTimeout(() => { overlay.style.display = 'none'; }, 600);
    applyPersonalization();
    initScrollReveal();
  });

  // Return & Reset
  document.getElementById('onbEnterBtn')?.addEventListener('click', () => {
    overlay.classList.add('hidden');
    setTimeout(() => { overlay.style.display = 'none'; }, 600);
    applyPersonalization();
    initScrollReveal();
  });

  document.getElementById('onbResetBtn')?.addEventListener('click', () => {
    clearUser();
    document.getElementById('onbReturningUser').style.display = 'none';
    document.getElementById('onbNewUser').style.display = 'block';
    document.getElementById('onbStep1').classList.add('active');
  });
}

// ========== SCROLL REVEAL ==========
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ========== PRODUCT SWIPER LAZY ==========
function initLazyImages() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target.querySelector('.lazy-detail');
        if (img && !img.src) {
          img.src = img.dataset.src;
          img.onload = () => img.classList.add('loaded');
        }
      }
    });
  }, { rootMargin: '0px 0px 200px 0px' });
  document.querySelectorAll('.product-slide').forEach(slide => observer.observe(slide));
}

// ========== EVENT BINDING ==========
function bindEvents() {
  // Back from product
  document.getElementById('backFromProduct')?.addEventListener('click', closeProductPage);

  // Open cart
  document.getElementById('navCartBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const modal = document.getElementById('miniCartModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderMiniCart(state.cart);
    updateShippingUI();
  });

  document.getElementById('miniCartClose')?.addEventListener('click', () => {
    const modal = document.getElementById('miniCartModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });

  // Document click delegation
  document.addEventListener('click', (e) => {
    // Buka produk dari carousel
    const mi = e.target.closest('.boutique-item');
    if (mi) { openProductPage(parseInt(mi.dataset.idx)); }

    // Lanjutkan (step 1 -> 2)
    if (e.target.classList.contains('btn-lanjutkan')) {
      const idx = e.target.dataset.idx;
      const pid = e.target.dataset.pid;
      document.getElementById(`step1_${idx}_${pid}`).style.display = 'none';
      document.getElementById(`step2_${idx}_${pid}`).style.display = 'block';
    }

    // Spice
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
    }

    // Qty di detail
    if (e.target.classList.contains('qty-plus') && e.target.closest('.detail-actions')) {
      const pid = e.target.dataset.pid;
      state.drafts[pid].qty++;
      document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = state.drafts[pid].qty);
    }
    if (e.target.classList.contains('qty-minus') && e.target.closest('.detail-actions')) {
      const pid = e.target.dataset.pid;
      if (state.drafts[pid].qty > 1) {
        state.drafts[pid].qty--;
        document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = state.drafts[pid].qty);
      }
    }

    // Add to cart
    if (e.target.classList.contains('add-to-cart-btn')) {
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      const pid = e.target.dataset.pid;
      const draft = state.drafts[pid];
      const idx = e.target.dataset.idx;
      const cartKey = pid + '_spice' + draft.spice;
      if (!state.cart[cartKey]) state.cart[cartKey] = { qty: 0, spice: draft.spice };
      state.cart[cartKey].qty += draft.qty;
      state.drafts[pid].qty = 1;
      document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = 1);
      updateUI();
      showToast('Sajian ditambahkan ke reservasi.');
      closeProductPage();
      setTimeout(() => {
        const step1 = document.getElementById(`step1_${idx}_${pid}`);
        const step2 = document.getElementById(`step2_${idx}_${pid}`);
        if (step1 && step2) { step1.style.display = 'block'; step2.style.display = 'none'; }
      }, 500);
    }

    // Cart item actions
    const act = e.target.closest('[data-action]');
    if (act && !e.target.classList.contains('add-to-cart-btn') && !e.target.classList.contains('btn-lanjutkan')) {
      const id = act.dataset.id;
      const type = act.dataset.action;
      if (type === 'increase') { state.cart[id].qty++; updateUI(); renderMiniCart(state.cart); }
      else if (type === 'decrease') {
        state.cart[id].qty--;
        if (state.cart[id].qty <= 0) delete state.cart[id];
        updateUI();
        renderMiniCart(state.cart);
      }
    }

    // Shipping options
    if (e.target.classList.contains('log-btn')) {
      document.querySelectorAll('.log-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.shippingProvider = e.target.dataset.provider;
      document.getElementById('rujakcoOptions').style.display = state.shippingProvider === 'paxel' ? 'none' : 'block';
      document.getElementById('paxelOptions').style.display = state.shippingProvider === 'paxel' ? 'block' : 'none';
      updateShippingUI();
    }
    if (e.target.classList.contains('veh-btn')) {
      document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.vehicleType = e.target.dataset.vehicle;
      updateShippingUI();
    }
    if (e.target.id === 'priorityToggleMini') {
      state.isPriority = e.target.checked;
      updateShippingUI();
    }

    // Open payment
    if (e.target.id === 'btnOpenPayment') {
      processPayment(state.cart, state, updateUI)(e);
    }

    // Close payment
    if (e.target.id === 'paymentClose') {
      document.getElementById('paymentModal').classList.remove('active');
      document.getElementById('paymentModal').setAttribute('aria-hidden', 'true');
    }

    // Confirm WA
    if (e.target.closest('[data-action="confirm-wa"]')) {
      confirmOrder(state.cart, state, updateUI)(e);
    }

    // AI Chat toggle
    if (e.target.closest('#aiChatToggle')) {
      e.preventDefault();
      const cModal = document.getElementById('aiChatBox');
      cModal.classList.add('active');
      cModal.setAttribute('aria-hidden', 'false');
    }
    if (e.target.id === 'aiChatClose') {
      const cModal = document.getElementById('aiChatBox');
      cModal.classList.remove('active');
      cModal.setAttribute('aria-hidden', 'true');
    }
  });
}

// ========== PRODUCT PAGE ==========
function openProductPage(globalIndex) {
  const page = document.getElementById('productPage');
  page.style.display = 'flex';
  page.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const targetSlide = document.querySelector(`.product-slide[data-idx="${globalIndex}"]`);
  if (targetSlide) {
    const track = document.getElementById('productSwiperTrack');
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = targetSlide.offsetLeft;
    track.style.scrollBehavior = 'smooth';
    initLazyImages();
  }
}

function closeProductPage() {
  const page = document.getElementById('productPage');
  page.style.display = 'none';
  page.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ========== SWIPE TO CLOSE ==========
function initSwipeToClose() {
  const overlay = document.getElementById('productPage');
  let startY = 0, isPulling = false, activeSlide = null;

  overlay.addEventListener('touchstart', e => {
    if (e.touches.length > 1) return;
    startY = e.touches[0].clientY;
    activeSlide = e.target.closest('.product-slide');
    if (activeSlide && activeSlide.scrollTop <= 0) isPulling = 'down';
    else isPulling = false;
  }, { passive: true });

  overlay.addEventListener('touchmove', e => {
    if (!isPulling || !activeSlide) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      activeSlide.style.transform = `translateY(${dy * 0.4}px)`;
      if (e.cancelable) e.preventDefault();
    }
  }, { passive: false });

  overlay.addEventListener('touchend', e => {
    if (!isPulling || !activeSlide) return;
    const dy = e.changedTouches[0].clientY - startY;
    activeSlide.style.transition = 'all 0.3s ease';
    if (dy > 120) closeProductPage();
    else activeSlide.style.transform = 'translateY(0)';
    setTimeout(() => {
      if (activeSlide) { activeSlide.style.transition = ''; activeSlide.style.transform = ''; }
      isPulling = false; activeSlide = null;
    }, 300);
  }, { passive: true });
}

// ========== INIT ==========
function init() {
  const saved = loadState();
  state.cart = saved.cart || {};
  if (saved.name) state.customerName = saved.name;
  if (saved.district) state.selectedDistrict = saved.district;

  // Render awal
  renderMenu();
  renderProductSwiper();
  initCarousel();
  initSwipeToClose();
  initAccessibility();
  const updateWelcome = initAIChat();
  if (updateWelcome) updateWelcome(state.customerName || 'Ngoedi');

  bindEvents();
  initOnboarding();
  updateUI();

  // Scroll header
  window.addEventListener('scroll', () => {
    const header = document.getElementById('mainHeader');
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// Run
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();