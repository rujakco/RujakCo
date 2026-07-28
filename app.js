// app.js – FINAL V3.0 + Offline Handler, Retry & Logger
import { PRODUCTS } from './data/products.js';
import { SYSTEM } from './data/config.js';
import { fmt, showToast, getSupabase, escapeHTML } from './utils/helpers.js';
import { loadState, loadCustomer, isStorageAvailable } from './modules/storage.js';
import { renderMenu, renderProductSwiper, getProductGlobalIndex } from './modules/render.js';
import { initCarousel } from './modules/carousel.js';
import { initAIChat } from './modules/chat.js';
import { initAccessibility } from './modules/accessibility.js';
import { initTestimonials } from './modules/testimonials.js';
import { getCartSummary, showWhatsAppFallback } from './modules/checkout.js';
import { showOrderConfirmation as launchProReceipt } from './modules/checkout-receipt.js';

// --- Modul Eksternal ---
import { initNavigation, syncBottomNav } from './modules/navigation.js';
import { initModalManager, openModal, closeModal, releaseInert, overlayStack, isProgrammaticBack, setProgrammaticBack } from './modules/modal-manager.js';
import { initGesturesConfig, initDetailGestures } from './modules/gesture.js';
import { initPersonalizationConfig, applyPersonalization, initHeroParallax } from './modules/personalization.js';
import { initShippingController, extractShortLocation, updateShippingUI, initDrawerDistrictDropdown } from './modules/shipping-controller.js';
import { initCartController, updateCartUI } from './modules/cart-controller.js';
import { initOnboardingConfig, initOnboarding } from './modules/onboarding.js';
import { initEventBinderConfig, bindEvents } from './modules/event-binder.js';

// --- Utilitas Baru ---
import { logError } from './utils/logger.js';
import { supabaseQueryWithRetry } from './utils/fetchWithRetry.js';
import { initOfflineHandler } from './utils/offlineHandler.js';

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

const APP_CONFIG = {
  TIMING: {
    MODAL_TRANSITION: 400,
    STEP_TRANSITION: 300,
    VIP_PEEK: 800,
    ONBOARDING_DELAY: 1200,
    ONBOARDING_GREETING: 400,
    SUCCESS_FLASH: 1000,
    DEBOUNCE_SEARCH: 500,
  },
  HAPTIC: {
    LIGHT: 10,
    HEAVY: 12
  }
};

PRODUCTS.forEach(p => {
  state.drafts[p.id] = { spice: p.defaultSpice ?? 3, qty: 1 };
});

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
// FUNGSI PEMBANTU
// ---------------------------------------------------------------------------
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
// DOWNLOAD STRUK & TELEGRAM (DENGAN RETRY & LOGGING)
// ---------------------------------------------------------------------------
async function downloadReceiptPNG() {
  const element = document.getElementById('orderConfirmContent');
  if (!element) return null;
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'receipt-loading';
  loadingOverlay.innerHTML = '<div class="receipt-loading-text">Menyiapkan struk...</div>';
  document.body.appendChild(loadingOverlay);
  try {
    if (typeof html2canvas === 'undefined') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }
    const footer = document.querySelector('#orderConfirmModal .drawer-footer');
    if (footer) footer.style.display = 'none';
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: false, logging: false });
    if (footer) footer.style.display = '';
    const sb = getSupabase(); if (!sb) return null;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;
    const safeCode = state.currentOrderCode || `RJ-${new Date().getTime()}`;
    const fileName = `${safeCode.replace(/[^a-zA-Z0-9]/g, '-')}.png`;

    // Upload dengan retry
    const uploadResult = await supabaseQueryWithRetry(
      () => sb.storage.from('receipts').upload(fileName, blob, { contentType: 'image/png', upsert: true }),
      'supabase-upload',
      { fileName }
    );
    if (uploadResult.error) {
      logError('receipt', new Error(uploadResult.error.message), { fileName });
      showToast('Gagal simpan struk.');
      return null;
    }

    const { data: { publicUrl } } = sb.storage.from('receipts').getPublicUrl(fileName);
    state.receiptUrl = publicUrl;
    return publicUrl;
  } catch (err) {
    logError('receipt', err, { orderCode: state.currentOrderCode });
    showToast('Gagal buat struk.');
    return null;
  } finally {
    loadingOverlay.remove();
  }
}

async function sendReceiptToTelegram() {
  if (!state.receiptUrl || !state.currentOrderCode) return;
  const supabase = getSupabase(); if (!supabase) return;
  const caption = `🧾 *Order Baru:* ${state.currentOrderCode}\n👤 ${state.customerName}\n📞 ${state.customerPhone}\n💰 Total: ${DOM.finalTotal?.textContent}`;
  try {
    await supabase.functions.invoke('send-telegram', { body: { order_code: state.currentOrderCode, receipt_url: state.receiptUrl, caption } });
    console.log('✅ Telegram terkirim');
  } catch (err) {
    logError('telegram', err, { orderCode: state.currentOrderCode });
  }
}

// ---------------------------------------------------------------------------
// CHECKOUT & WHATSAPP (DENGAN RETRY & LOGGING)
// ---------------------------------------------------------------------------
async function sendReceiptToWhatsApp() {
  const summary = getCartSummary(state.cart);
  if (summary.items.length === 0) { showToast('Reservasi kosong.'); return; }
  const name = DOM.customerNameInput?.value || state.customerName || 'Tamu';
  const phone = DOM.customerPhoneInput?.value || state.customerPhone || '—';
  const address = DOM.customerAddressInput?.value || state.customerAddress || '—';
  const deliveryTime = document.getElementById('deliveryTime')?.value || '—';
  const notes = document.getElementById('orderNotes')?.value.trim() || 'Tidak ada catatan';
  let logisticInfo = state.shippingProvider === 'paxel' ? 'Paxel Ekspres' : 'Kurir Lalamove';
  if (state.shippingProvider === 'lalamove') {
    logisticInfo += ` (${state.tier === 'prioritas' ? 'Prioritas' : 'Reguler'})`;
  }
  const shipCost = DOM.finalShipping?.textContent || '—';
  const totalCost = DOM.finalTotal?.textContent || '—';
  const distance = state.userDistance ? `${state.userDistance} km` : '—';
  let msg = `🧾 *STRUK PESANAN RUJAK.CO*\n🆔 *Order ID:* ${state.currentOrderCode || '—'}\n\n`;
  msg += `👤 *Penerima:* ${name}\n📞 *HP:* ${phone}\n📍 *Alamat:* ${address}\n`;
  msg += `\n🗺️ *Jarak:* ${distance}\n🕒 *Pengantaran:* ${deliveryTime}\n📝 *Catatan:* ${notes}\n🚚 *Kurir:* ${logisticInfo}\n\n📦 *Pesanan:*\n`;
  summary.items.forEach(item => {
    const spiceText = item.spice ? ` (Lv ${item.spice})` : '';
    msg += `• ${item.name}${spiceText} x${item.qty} = ${fmt(item.price * item.qty)}\n`;
  });
  msg += `\n💵 *Subtotal:* ${fmt(summary.subtotal)}\n🛵 *Ongkir:* ${shipCost}\n💰 *TOTAL TRANSFER:* *${totalCost}*\n\n`;
  msg += `📎 _Mohon lampirkan bukti transfer dan struk reservasi Anda._`;

  const sb = getSupabase(); let orderSaved = false;
  if (sb) {
    try {
      const insertResult = await supabaseQueryWithRetry(
        () => sb.from('orders').insert({
          order_code: state.currentOrderCode,
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          district: state.selectedDistrict,
          distance_km: state.userDistance,
          items: summary.items,
          subtotal: summary.subtotal,
          shipping_cost: Number.isNaN(parseInt(shipCost.replace(/\D/g, ''))) ? null : parseInt(shipCost.replace(/\D/g, '')),
          total: Number.isNaN(parseInt(totalCost.replace(/\D/g, ''))) ? null : parseInt(totalCost.replace(/\D/g, '')),
          shipping_provider: logisticInfo,
          delivery_time: deliveryTime,
          notes,
          status: 'pending_payment'
        }),
        'supabase-insert',
        { orderCode: state.currentOrderCode }
      );
      if (insertResult.error) {
        logError('supabase', new Error(insertResult.error.message), { orderCode: state.currentOrderCode });
      } else {
        orderSaved = true;
      }
    } catch (err) {
      logError('supabase', err, { orderCode: state.currentOrderCode });
    }
  }

  const waUrl = `https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  const newWindow = window.open(waUrl, '_blank', 'noopener');
  if (newWindow) {
    if (orderSaved) {
      state.cart = {};
      updateCartUI();
      showToast('Pesanan terkirim.');
    } else {
      showToast('⚠️ Pesan WhatsApp terkirim, tapi catatan gagal tersimpan.');
    }
  } else {
    showWhatsAppFallback(SYSTEM.WA_NUMBER, msg);
    if (!orderSaved) showToast('Catatan belum tersimpan.');
  }
}

async function showOrderConfirmation() {
  return await launchProReceipt(state, DOM, overlayStack, openModal, closeModal, () => getCartSummary(state.cart), downloadReceiptPNG, sendReceiptToTelegram);
}

// ---------------------------------------------------------------------------
// PRODUCT PAGE LOGIC (TIDAK BERUBAH)
// ---------------------------------------------------------------------------
function openProductPage(globalIndex) {
  if (!DOM.productPage) return;
  if (!state._vipPeeked) {
    setTimeout(() => {
      document.getElementById('waVipSideTab')?.classList.add('peek');
    }, APP_CONFIG.TIMING.VIP_PEEK);
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
  DOM.bottomNav?.classList.add('nav-visible');
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
  DOM.bottomNav?.classList.remove('nav-visible');
  document.getElementById('navHomeBtn')?.focus();
  DOM.productPage.classList.remove('active');
  setTimeout(() => {
    DOM.productPage.style.display = 'none';
    DOM.productPage.setAttribute('aria-hidden', 'true');
    DOM.productPage.setAttribute('inert', '');
    const index = overlayStack.indexOf(DOM.productPage);
    if (index > -1) overlayStack.splice(index, 1);
    if (overlayStack.length === 0) {
      document.body.style.overflow = '';
    }
    document.getElementById('waVipSideTab')?.classList.remove('open');
    if (DOM._productObserver) {
      DOM._productObserver.disconnect();
      DOM._productObserver = null;
    }
    releaseInert();
    if (!fromPopState) {
      setProgrammaticBack(true);
      history.back();
    }
    syncBottomNav();
  }, APP_CONFIG.TIMING.MODAL_TRANSITION);
}

// ---------------------------------------------------------------------------
// MAIN BOOTSTRAP INIT
// ---------------------------------------------------------------------------
function init() {
  cacheDOM();

  // --- Inisialisasi Dependency Injection Modul ---
  initNavigation(DOM);
  initModalManager(DOM);
  initGesturesConfig(DOM, closeProductPage);
  initPersonalizationConfig(DOM, state);
  initShippingController(DOM, state, APP_CONFIG);
  initCartController(DOM, state);
  initOnboardingConfig(DOM, state, APP_CONFIG);
  initEventBinderConfig(DOM, state, APP_CONFIG, {
    openProductPage,
    closeProductPage,
    showOrderConfirmation,
    sendReceiptToWhatsApp
  });

  // --- Inisialisasi Offline Handler ---
  initOfflineHandler({
    syncCallback: async (action) => {
      console.log('Memproses aksi offline:', action);
      // Di sini nanti bisa diisi logika sinkronisasi cart, dll.
      return true;
    }
  });

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
      if (idx !== -1) setTimeout(() => openProductPage(idx), APP_CONFIG.TIMING.MODAL_TRANSITION);
    }

    window.addEventListener('popstate', (e) => {
      if (isProgrammaticBack) { setProgrammaticBack(false); return; }
      if (overlayStack.length > 0) {
        const topOverlay = overlayStack[overlayStack.length - 1];
        if (e.state && e.state.id && e.state.id !== topOverlay.id) return;
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
    console.log('✅ RUJAK.Co siap (Modular Architecture v3.0).');
  } catch (err) {
    console.error('❌ Gagal inisialisasi:', err);
    showToast('Terjadi kesalahan sistem.');
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();