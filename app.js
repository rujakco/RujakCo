// app.js — Luxury Edition (final dengan struk, logo, download, share, Telegram)
import { PRODUCTS } from './data/products.js';
import { DISTRICT_MAP } from './data/districts.js';
import { SYSTEM, SPICE_LABELS } from './data/config.js';
import { fmt, showToast, debounce } from './utils/helpers.js';
import { loadState, saveCart, saveUser, clearUser } from './modules/storage.js';
import { getDistance, calculateShipping } from './modules/shipping.js';
import { renderMenu, renderProductSwiper, renderCart, renderMiniCart, getProductGlobalIndex } from './modules/render.js';
import { initCarousel } from './modules/carousel.js';
import { initAIChat } from './modules/chat.js';
import { initAccessibility } from './modules/accessibility.js';
import { initTestimonials } from './modules/testimonials.js';
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
  userDistance: null,
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
  DOM.aboutModal = document.getElementById('aboutModal');
  DOM.orderConfirmModal = document.getElementById('orderConfirmModal');
  DOM.orderConfirmContent = document.getElementById('orderConfirmContent');
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
  const dist = state.selectedDistrict ? getDistance(state.selectedDistrict) : null;
  const section = DOM.shippingSection;
  if (!section) return;
  
  if (dist) {
    section.style.display = 'block';
    const { subtotal, mainProductQty } = getCartSummaryLocal();
    const ship = calculateShipping(dist, mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority);
    document.getElementById('shippingDistance').textContent = `${dist} km`;
    DOM.finalShipping.textContent = ship.cost ? fmt(ship.cost) : '...';
    DOM.finalTotal.textContent = ship.cost ? fmt(subtotal + ship.cost) : fmt(subtotal);
  } else {
    section.style.display = 'none';
  }
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
// KONFIRMASI HAPUS ITEM (modal lokal, accessible)
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
// Product page & swiper (observer leak diperbaiki)
// ---------------------------------------------------------------------------
function openProductPage(globalIndex) {
  DOM.productPage.style.display = 'flex';
  DOM.productPage.setAttribute('aria-hidden', 'false');
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
// Onboarding (dropdown ARIA combobox)
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

  // --- Dropdown kecamatan: ARIA combobox pattern ---
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
// STRUK & SHARE FUNCTIONS
// ---------------------------------------------------------------------------
async function downloadReceiptPNG() {
  const element = DOM.orderConfirmContent;
  if (!element) return;

  try {
    const footer = document.querySelector('#orderConfirmModal .drawer-footer');
    if (footer) footer.style.display = 'none';

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });

    if (footer) footer.style.display = '';

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
    });
  } catch (err) {
    console.error('Gagal generate struk:', err);
    showToast('⚠️ Gagal mengunduh struk');
    const footer = document.querySelector('#orderConfirmModal .drawer-footer');
    if (footer) footer.style.display = '';
  }
}

function sendReceiptToWhatsApp() {
  const summary = getCartSummary(state.cart);
  const name = DOM.customerNameInput?.value || state.customerName || '—';
  const phone = document.getElementById('customerPhone')?.value || state.customerPhone || '—';
  const address = document.getElementById('customerAddress')?.value || state.customerAddress || '—';
  const deliveryTime = document.getElementById('deliveryTimeLabel')?.textContent || '—';

  let msg = `🧾 *STRUK PESANAN RUJAK.CO*\n\n`;
  msg += `👤 *Pelanggan:* ${name}\n`;
  msg += `📞 *HP:* ${phone}\n`;
  msg += `📍 *Alamat:* ${address}\n`;
  msg += `🕒 *Pengantaran:* ${deliveryTime}\n\n`;
  msg += `📦 *Pesanan:*\n`;
  summary.items.forEach(item => {
    msg += `- ${item.name}${item.spice ? ' (Lv' + item.spice + ')' : ''} x${item.qty} = ${fmt(item.price * item.qty)}\n`;
  });
  msg += `\n💰 *Total:* ${DOM.finalTotal?.textContent || '—'}\n`;
  msg += `\n📎 *Struk gambar dapat diunduh di menu konfirmasi.*`;

  const waUrl = `https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

async function sendReceiptToTelegram() {
  if (!SYSTEM.TELEGRAM_BOT_TOKEN || !SYSTEM.TELEGRAM_CHAT_ID) {
    // Telegram tidak dikonfigurasi, lewati
    return;
  }

  const element = DOM.orderConfirmContent;
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('chat_id', SYSTEM.TELEGRAM_CHAT_ID);
      formData.append('photo', blob, 'struk_rujakco.png');
      formData.append('caption', '🧾 Struk pesanan baru dari ' + (state.customerName || 'Pelanggan'));

      const res = await fetch(`https://api.telegram.org/bot${SYSTEM.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        console.error('Gagal kirim ke Telegram');
      }
    });
  } catch (err) {
    console.error('Gagal kirim ke Telegram:', err);
  }
}

function showOrderConfirmation() {
  const summary = getCartSummaryLocal();
  const dist = state.selectedDistrict ? getDistance(state.selectedDistrict) : null;
  const ship = dist ? calculateShipping(dist, summary.mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority) : { cost: 0 };
  const total = summary.subtotal + (ship.cost || 0);

  const name = DOM.customerNameInput?.value || state.customerName || '—';
  const phone = document.getElementById('customerPhone')?.value || state.customerPhone || '—';
  const address = document.getElementById('customerAddress')?.value || state.customerAddress || '—';
  const deliveryTime = document.getElementById('deliveryTimeLabel')?.textContent || '—';

  let itemsHtml = '';
  summary.items.forEach(item => {
    const spiceText = item.spice ? ` (Lv ${item.spice})` : '';
    itemsHtml += `<div class="confirm-row"><span>${item.name}${spiceText} x${item.qty}</span><span>${fmt(item.price * item.qty)}</span></div>`;
  });

  DOM.orderConfirmContent.innerHTML = `
    <div style="text-align:center; margin-bottom:16px;">
      <img src="https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/logo.webp"
           alt="RUJAK.Co" style="width:56px; height:56px; border-radius:50%; margin-bottom:8px;" />
      <h3 style="font-family:'Fraunces',serif; color:var(--green); margin:0; font-size:1.25rem;">RUJAK.Co</h3>
      <p style="font-size:0.7rem; color:var(--gray-600); margin:4px 0 0;">Indonesia dalam Satu Wadah</p>
    </div>
    <div class="confirm-section">
      <h4>Data Penerima</h4>
      <div class="confirm-row"><span>Nama</span><span>${name}</span></div>
      <div class="confirm-row"><span>Telepon</span><span>${phone}</span></div>
      <div class="confirm-row"><span>Alamat</span><span>${address}</span></div>
      <div class="confirm-row"><span>Waktu Pengantaran</span><span>${deliveryTime}</span></div>
    </div>
    <div class="confirm-section">
      <h4>Pesanan</h4>
      ${itemsHtml}
    </div>
    <div class="confirm-section">
      <h4>Rincian Biaya</h4>
      <div class="confirm-row"><span>Subtotal</span><span>${fmt(summary.subtotal)}</span></div>
      <div class="confirm-row"><span>Ongkir</span><span>${fmt(ship.cost || 0)}</span></div>
      <div class="confirm-row total"><span>Total</span><span>${fmt(total)}</span></div>
    </div>
  `;

  openModal(DOM.orderConfirmModal);

  // Tombol aksi
  document.getElementById('orderConfirmDownload').onclick = () => downloadReceiptPNG();
  document.getElementById('orderConfirmShare').onclick = () => sendReceiptToWhatsApp();
  document.getElementById('orderConfirmPay').onclick = () => {
    closeModal(DOM.orderConfirmModal);
    processPayment(state.cart, state, updateCartUI)();
  };
  document.getElementById('orderConfirmBack')?.addEventListener('click', () => {
    closeModal(DOM.orderConfirmModal);
  });

  // Kirim otomatis ke Telegram jika dikonfigurasi
  sendReceiptToTelegram();
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

  // Share produk di halaman detail
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

  // Toggle VIP side tab
  document.getElementById('waVipHandle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('waVipSideTab')?.classList.toggle('open');
  });

  // Nav: Home — tutup detail & kembali ke atas
  document.getElementById('navHomeBtn')?.addEventListener('click', () => {
    if (DOM.productPage.style.display === 'flex') {
      closeProductPage(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Nav: Lihat Produk — buka detail produk terakhir, atau produk pertama
  document.getElementById('navProductBtn')?.addEventListener('click', () => {
    if (state.lastViewedProductIndex >= 0) {
      openProductPage(state.lastViewedProductIndex);
    } else {
      openProductPage(0);
    }
  });

  // Custom delivery time dropdown (KEYBOARD-ACCESSIBLE)
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

  deliveryTrigger?.setAttribute('tabindex', '0');
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

  // === LISTENER LANGSUNG UNTUK SEMUA TOMBOL X (SATU KLIK) ===
  document.getElementById('miniCartClose')?.addEventListener('click', () => {
    closeModal(DOM.miniCartModal);
  });

  document.getElementById('paymentClose')?.addEventListener('click', () => {
    closeModal(DOM.paymentModal);
  });

  document.getElementById('aiChatClose')?.addEventListener('click', () => {
    closeModal(DOM.aiChatBox);
  });

  document.getElementById('orderConfirmClose')?.addEventListener('click', () => {
    closeModal(DOM.orderConfirmModal);
  });

  // === EVENT DELEGATION UTAMA (TANPA HANDLER UNTUK TOMBOL X) ===
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

    // Open payment → sekarang menampilkan struk konfirmasi dulu
    if (e.target.id === 'btnOpenPayment') {
      showOrderConfirmation();
      return;
    }

    // AI Chat
    if (e.target.closest('#aiChatToggle')) {
      e.preventDefault();
      openModal(DOM.aiChatBox);
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

    // FAQ toggle (accordion)
    const faqToggle = e.target.closest('[data-toggle="faq"]');
    if (faqToggle) {
      const item = faqToggle.closest('.faq-item');
      const isOpen = item.classList.toggle('open');
      faqToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
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
  if (state.selectedDistrict) {
    state.userDistance = getDistance(state.selectedDistrict);
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
  initTestimonials();
  updateCartUI();

  // Hero parallax wiring
  const heroImg = document.querySelector('.hero-img');
  window.addEventListener('scroll', () => {
    DOM.header?.classList.toggle('scrolled', window.scrollY > 50);
    if (heroImg) {
      const offset = Math.min(window.scrollY * 0.15, 40);
      heroImg.style.transform = `translateY(${40 - offset}px) scale(${1.02 - offset * 0.0005})`;
    }
  }, { passive: true });

  // DEEP‑LINK PRODUK (?product=...)
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product');
  if (productId) {
    const idx = getProductGlobalIndex(productId);
    if (idx !== -1) setTimeout(() => openProductPage(idx), 400);
  }

  // Listener untuk gesture back Android / tombol back browser
  window.addEventListener('popstate', (event) => {
    if (DOM.productPage.style.display === 'flex') {
      closeProductPage(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.productPage.style.display === 'flex') closeProductPage(true);
      else if (DOM.miniCartModal.classList.contains('active')) closeModal(DOM.miniCartModal);
      else if (DOM.paymentModal.classList.contains('active')) closeModal(DOM.paymentModal);
      else if (DOM.aiChatBox.classList.contains('active')) closeModal(DOM.aiChatBox);
      else if (DOM.aboutModal?.classList.contains('active')) closeModal(DOM.aboutModal);
      else if (DOM.orderConfirmModal?.classList.contains('active')) closeModal(DOM.orderConfirmModal);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}