// modules/event-binder.js
import { PRODUCTS } from '../data/products.js';
import { SYSTEM } from '../data/config.js';   // ✅ DIPERBAIKI: SYSTEM wajib diimpor untuk WA & VIP
import { fmt, showToast, animatePress, queuedSearch, escapeHTML } from '../utils/helpers.js';
import { saveUser, saveCustomer } from './storage.js';
import { getDrivingDistance } from './shipping.js';
import { getCartSummary, validatePhone, validateAddress } from './checkout.js';
import { setActiveNav, syncBottomNav } from './navigation.js';
import { openModal, closeModal, showConfirmModal, releaseInert } from './modal-manager.js';
import { getWaktu } from './personalization.js';
import { extractShortLocation, updateShippingUI } from './shipping-controller.js';
import { updateCartUI, updateDraftUI } from './cart-controller.js';

let DOM = {};
let state = {};
let APP_CONFIG = {};
let openProductPageFn = null;
let closeProductPageFn = null;
let showOrderConfirmationFn = null;
let sendReceiptToWhatsAppFn = null;

export function initEventBinderConfig(domConfig, appState, config, callbacks) {
  DOM = domConfig;
  state = appState;
  APP_CONFIG = config;
  openProductPageFn = callbacks.openProductPage;
  closeProductPageFn = callbacks.closeProductPage;
  showOrderConfirmationFn = callbacks.showOrderConfirmation;
  sendReceiptToWhatsAppFn = callbacks.sendReceiptToWhatsApp;
}

export function bindEvents() {
  document.getElementById('aboutTrigger')?.addEventListener('click', () => openModal(DOM.aboutModal));
  document.getElementById('aboutClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('aboutClose'));
    closeModal(DOM.aboutModal);
  });

  document.getElementById('shareProductBtn')?.addEventListener('click', () => {
    const track = DOM.productSwiperTrack; if (!track) return;
    const slideWidth = track.querySelector('.product-slide')?.offsetWidth || track.clientWidth;
    const currentIndex = Math.round(track.scrollLeft / slideWidth);
    const productId = PRODUCTS[currentIndex % PRODUCTS.length]?.id;
    if (!productId) return;
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const shareUrl = window.location.origin + window.location.pathname + '?product=' + productId;
    const shareText = `${product.name} — ${product.desc}\nPesan sekarang di Rujak.Co!`;
    if (navigator.share) navigator.share({ title: product.name, text: shareText, url: shareUrl }).catch(() => {});
    else navigator.clipboard.writeText(shareUrl + '\n' + shareText).then(() => showToast('Link disalin.')).catch(() => showToast('Gagal salin.'));
  });

  document.getElementById('btnVipConcierge')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(`https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent("Halo RUJAK.Co, saya tertarik dengan layanan VIP Concierge.")}`, '_blank', 'noopener');
  });

  document.getElementById('waVipHandle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('waVipSideTab')?.classList.toggle('open');
  });

  document.getElementById('navHomeBtn')?.addEventListener('click', () => {
    if (DOM.productPage?.classList.contains('active')) {
      closeProductPageFn(false);
      setTimeout(releaseInert, 500);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 200);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setActiveNav('navHomeBtn');
  });

  document.getElementById('navProductBtn')?.addEventListener('click', () => {
    if (DOM.productPage?.classList.contains('active')) return;
    if (openProductPageFn) openProductPageFn(state.lastViewedProductIndex >= 0 ? state.lastViewedProductIndex : 0);
  });

  document.getElementById('navCartBtn')?.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (DOM.productPage?.classList.contains('active')) {
      closeProductPageFn(false);
      setTimeout(() => { openModal(DOM.miniCartModal); updateCartUI(); }, APP_CONFIG.TIMING.MODAL_TRANSITION);
    } else {
      openModal(DOM.miniCartModal);
      updateCartUI();
    }
  });

  // delivery time dropdown
  const deliveryTrigger = document.getElementById('deliveryTimeTrigger');
  const deliveryDropdown = document.getElementById('deliveryTimeDropdown');
  const deliveryHidden = document.getElementById('deliveryTime');
  const deliveryLabel = document.getElementById('deliveryTimeLabel');
  let deliveryActiveIndex = 0;
  const preselected = deliveryDropdown?.querySelector('[aria-selected="true"]');
  if (preselected) { deliveryLabel.textContent = preselected.textContent; deliveryHidden.value = preselected.dataset.value; }
  function setDeliveryOption(option) {
    deliveryDropdown.querySelectorAll('[role="option"]').forEach(o => o.setAttribute('aria-selected', 'false'));
    option.setAttribute('aria-selected', 'true');
    deliveryLabel.textContent = option.textContent;
    deliveryHidden.value = option.dataset.value;
    closeDeliveryDropdown();
  }
  function closeDeliveryDropdown() { deliveryDropdown.style.display = 'none'; deliveryTrigger.setAttribute('aria-expanded', 'false'); }
  function openDeliveryDropdown() {
    deliveryDropdown.style.display = 'block';
    deliveryTrigger.setAttribute('aria-expanded', 'true');
    const opts = deliveryDropdown.querySelectorAll('[role="option"]');
    deliveryActiveIndex = [...opts].findIndex(o => o.getAttribute('aria-selected') === 'true');
    if (deliveryActiveIndex === -1) deliveryActiveIndex = 0;
    opts[deliveryActiveIndex]?.focus();
  }
  deliveryTrigger?.addEventListener('click', () => deliveryDropdown.style.display === 'block' ? closeDeliveryDropdown() : openDeliveryDropdown());
  deliveryTrigger?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDeliveryDropdown(); } });
  deliveryDropdown?.addEventListener('click', (e) => { const option = e.target.closest('[role="option"]'); if (option) setDeliveryOption(option); });
  deliveryDropdown?.addEventListener('keydown', (e) => {
    const opts = [...deliveryDropdown.querySelectorAll('[role="option"]')]; if (!opts.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); deliveryActiveIndex = Math.min(deliveryActiveIndex+1, opts.length-1); opts.forEach((o,i) => o.setAttribute('aria-selected', i===deliveryActiveIndex?'true':'false')); opts[deliveryActiveIndex].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); deliveryActiveIndex = Math.max(deliveryActiveIndex-1, 0); opts.forEach((o,i) => o.setAttribute('aria-selected', i===deliveryActiveIndex?'true':'false')); opts[deliveryActiveIndex].focus(); }
    else if (e.key === 'Enter') { e.preventDefault(); setDeliveryOption(opts[deliveryActiveIndex]); }
    else if (e.key === 'Escape') { closeDeliveryDropdown(); deliveryTrigger.focus(); }
  });
  document.addEventListener('click', (e) => { if (!deliveryTrigger?.contains(e.target) && !deliveryDropdown?.contains(e.target)) closeDeliveryDropdown(); });

  document.getElementById('miniCartClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('miniCartClose'));
    closeModal(DOM.miniCartModal);
  });
  document.getElementById('paymentClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('paymentClose'));
    closeModal(DOM.paymentModal);
  });
  document.getElementById('aiChatClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('aiChatClose'));
    closeModal(DOM.aiChatBox);
  });
  document.getElementById('orderConfirmClose')?.addEventListener('click', () => {
    animatePress(document.getElementById('orderConfirmClose'));
    closeModal(document.getElementById('orderConfirmModal'));
  });

  DOM.customerNameInput?.addEventListener('input', () => {
    state.customerName = DOM.customerNameInput.value;
    saveUser(state.customerName, state.selectedDistrict);
    const waktu = getWaktu();
    DOM.headerName.textContent = `Selamat ${waktu}, ${state.customerName || 'Tamu'} • ${state.selectedDistrict || 'Pilih alamat tujuan'}`;
    if (DOM.aiWelcome) DOM.aiWelcome.textContent = `Selamat ${waktu}, ${state.customerName || 'Tamu'}. Ada yang bisa kami bantu?`;
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
    const drawerInput = DOM.districtInput;
    const drawerDropdown = DOM.drawerDistrictDropdown;
    if (drawerInput && drawerDropdown && !drawerInput.contains(e.target) && !drawerDropdown.contains(e.target)) {
      drawerDropdown.style.display = 'none';
      drawerInput.setAttribute('aria-expanded', 'false');
    }

    const boutique = e.target.closest('.boutique-item');
    if (boutique) { const idx = parseInt(boutique.dataset.idx); if (!isNaN(idx) && openProductPageFn) openProductPageFn(idx); return; }

    const step1Btn = e.target.closest('.step-1-btn');
    if (step1Btn) {
      if (window.navigator.vibrate) window.navigator.vibrate(APP_CONFIG.HAPTIC.LIGHT);
      const idx = step1Btn.dataset.idx, pid = step1Btn.dataset.pid;
      const step1 = document.getElementById(`step1_${idx}_${pid}`), step2 = document.getElementById(`step2_${idx}_${pid}`);
      if (step1 && step2) {
        step1.style.transition = 'opacity 0.3s ease'; step1.style.opacity = '0';
        setTimeout(() => { step1.style.display = 'none'; step2.style.display = 'block'; const firstOption = step2.querySelector('.spice-option'); if (firstOption) firstOption.focus(); }, APP_CONFIG.TIMING.STEP_TRANSITION);
      }
      return;
    }

    const spiceOption = e.target.closest('.spice-option');
    if (spiceOption) {
      const pid = spiceOption.dataset.pid;
      if (state.drafts[pid]) {
        state.drafts[pid].spice = parseInt(spiceOption.dataset.spice);
        updateDraftUI(pid);
      }
      return;
    }

    const qtyPlus = e.target.closest('.qty-plus');
    const qtyMinus = e.target.closest('.qty-minus');
    if (qtyPlus || qtyMinus) {
      const pid = (qtyPlus || qtyMinus).dataset.pid;
      if (!state.drafts[pid]) return;

      if (qtyPlus) state.drafts[pid].qty++;
      else if (state.drafts[pid].qty > 1) state.drafts[pid].qty--;

      updateDraftUI(pid);
      return;
    }

    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      if (addBtn.dataset.processing === 'true') return;
      addBtn.dataset.processing = 'true';
      if (window.navigator?.vibrate) window.navigator.vibrate(APP_CONFIG.HAPTIC.HEAVY);

      const pid = addBtn.dataset.pid, idx = addBtn.dataset.idx, draft = state.drafts[pid];
      const cartKey = `${pid}_spice${draft.spice}`;

      if (!state.cart[cartKey]) state.cart[cartKey] = { id: pid, qty: 0, spice: draft.spice };
      state.cart[cartKey].qty += draft.qty;

      state.drafts[pid].qty = 1;
      updateDraftUI(pid);
      updateCartUI();

      showToast('Sajian berhasil ditambahkan.');
      const cartNav = document.querySelector('.nav-cart-wrapper');
      if (cartNav) {
        cartNav.classList.remove('bump');
        void cartNav.offsetWidth;
        cartNav.classList.add('bump');
      }

      addBtn.classList.add('success-flash');
      addBtn.dataset.originalLabel = addBtn.dataset.originalLabel || addBtn.textContent;
      addBtn.textContent = '✓ Berhasil Ditambahkan';

      setTimeout(() => addBtn.classList.remove('success-flash'), APP_CONFIG.TIMING.MODAL_TRANSITION);
      setTimeout(() => {
        addBtn.textContent = addBtn.dataset.originalLabel;
        const step1 = document.getElementById(`step1_${idx}_${pid}`), step2 = document.getElementById(`step2_${idx}_${pid}`);
        if (step1 && step2) {
          step1.style.opacity = '0';
          step1.style.display = 'block';
          step2.style.display = 'none';
          requestAnimationFrame(() => { step1.style.opacity = '1'; });
        }
        addBtn.dataset.processing = 'false';
      }, APP_CONFIG.TIMING.SUCCESS_FLASH);
      return;
    }

    if (e.target.id === 'emptyCartBrowse') {
      closeModal(DOM.miniCartModal);
      if (openProductPageFn) openProductPageFn(0);
      return;
    }

    if (e.target.closest('[data-action="confirm-wa"]')) {
      const btn = e.target.closest('[data-action="confirm-wa"]');
      if (btn.dataset.processing === 'true') return;
      btn.dataset.processing = 'true';
      btn.textContent = 'Mengirim...';
      try {
        if (sendReceiptToWhatsAppFn) await sendReceiptToWhatsAppFn();
      } finally {
        closeModal(DOM.paymentModal);
        btn.textContent = 'Validasi Reservasi';
        btn.dataset.processing = 'false';
      }
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn && !actionBtn.classList.contains('add-to-cart-btn') && !actionBtn.classList.contains('step-1-btn')) {
      const id = actionBtn.dataset.id, type = actionBtn.dataset.action;
      if (!state.cart[id]) return;

      if (type === 'increase') {
        state.cart[id].qty++;
      } else if (type === 'decrease') {
        if (state.cart[id].qty === 1) {
          showConfirmModal('Keluarkan Sajian?', 'Keluarkan sajian ini dari reservasi Anda?', () => {
            delete state.cart[id];
            updateCartUI();
            showToast('Sajian dikeluarkan.');
          });
          return;
        }
        state.cart[id].qty--;
      }
      updateCartUI();
      return;
    }

    const logBtn = e.target.closest('.log-btn');
    if (logBtn) {
      document.querySelectorAll('.log-btn').forEach(b => b.classList.remove('active'));
      logBtn.classList.add('active');
      state.shippingProvider = logBtn.dataset.provider;
      DOM.lalamoveOptions.style.display = state.shippingProvider === 'paxel' ? 'none' : 'block';
      DOM.paxelOptions.style.display = state.shippingProvider === 'paxel' ? 'block' : 'none';
      updateShippingUI();
      return;
    }

    const vehBtn = e.target.closest('.veh-btn');
    if (vehBtn) {
      document.querySelectorAll('.veh-btn').forEach(b => b.classList.remove('active'));
      vehBtn.classList.add('active');
      state.tier = vehBtn.dataset.tier;
      updateShippingUI();
      return;
    }

    if (e.target.id === 'btnOpenPayment') {
      if (e.target.dataset.processing === 'true') return;
      e.target.dataset.processing = 'true';
      if (!Object.keys(state.cart).length) { showToast('Reservasi kosong.'); e.target.dataset.processing = 'false'; return; }
      const phone = DOM.customerPhoneInput?.value.trim() || '';
      const address = DOM.customerAddressInput?.value.trim() || '';
      if (!validatePhone(phone)) { showToast('Nomor HP tidak valid.'); e.target.dataset.processing = 'false'; return; }
      if (!validateAddress(address)) { showToast('Lengkapi alamat.'); e.target.dataset.processing = 'false'; return; }
      if (!state.selectedDistrict && !state.selectedDistrictFull) { showToast('Pilih alamat tujuan.'); e.target.dataset.processing = 'false'; return; }
      if (state.userDistance == null) {
        let recovered = false;
        const addressToSearch = state.selectedDistrictFull
          || (state.selectedDistrict && state.customerAddress ? `${state.selectedDistrict}, ${state.customerAddress}` : '')
          || DOM.districtInput?.value?.trim()
          || state.customerAddress;
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
              DOM.districtInput && (DOM.districtInput.value = place.display_name);
              saveCustomer(phone, address, place.display_name, result.distance);
              updateShippingUI();
              recovered = true;
            }
          } catch (err) { console.warn('Auto-recover gagal:', err); }
        }
        if (!recovered) {
          showToast('Silakan pilih alamat pengantaran dari hasil pencarian di atas.');
          e.target.dataset.processing = 'false';
          return;
        }
      }
      if (showOrderConfirmationFn) {
        const receiptOk = await showOrderConfirmationFn();
        if (!receiptOk) { e.target.dataset.processing = 'false'; return; }
      }
      e.target.dataset.processing = 'false';
      return;
    }

    if (e.target.closest('#aiChatToggle')) { e.preventDefault(); openModal(DOM.aiChatBox); return; }
    if (e.target.closest('#backFromProduct')) {
      animatePress(e.target.closest('#backFromProduct'));
      if (closeProductPageFn) closeProductPageFn(false);
      return;
    }

    const faqToggle = e.target.closest('[data-toggle="faq"]');
    if (faqToggle) { const item = faqToggle.closest('.faq-item'); const isOpen = item.classList.toggle('open'); faqToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false'); return; }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  });
}