// modules/onboarding.js – FINAL (reset phone/address + state)
import { loadState, saveUser, clearUser } from './storage.js';
import { showToast, escapeHTML } from '../utils/helpers.js';
import { applyPersonalization, initScrollReveal } from './personalization.js';
import { resolveOnboardingDistance, extractShortLocation } from './shipping-controller.js';
import { updateCartUI } from './cart-controller.js';

let DOM = {}; let state = {}; let APP_CONFIG = {};

export function initOnboardingConfig(domConfig, appState, config) { DOM = domConfig; state = appState; APP_CONFIG = config; }

export function initOnboarding() {
  const saved = loadState();
  if (saved?.name) {
    state.customerName = saved.name;
    if (saved.district) { state.selectedDistrictFull = saved.district; state.selectedDistrict = extractShortLocation(saved.district) || saved.district; }
    DOM.onbNewUser.style.display = 'none'; DOM.onbReturningUser.style.display = 'block';
    DOM.onbWelcomeName.textContent = saved.name === 'Tamu' ? 'Pelanggan' : saved.name;
    const prefixEl = document.getElementById('onbDeliveryPrefix');
    if (state.selectedDistrict) { if (prefixEl) prefixEl.textContent = 'Diantar ke '; DOM.onbWelcomeDistrict.textContent = state.selectedDistrict; }
    else { if (prefixEl) prefixEl.textContent = 'Yuk, pilih alamat tujuan Anda'; DOM.onbWelcomeDistrict.textContent = ''; }
    if (state.selectedDistrict) resolveOnboardingDistance(state.selectedDistrict);
  } else {
    DOM.onbNewUser.style.display = 'block'; DOM.onbStep1.classList.add('active');
    document.getElementById('onbTitle').textContent = 'Selamat datang di RUJAK.Co';
    document.querySelector('.onb-subtitle').textContent = 'Pengalaman rasa Nusantara.';
    document.querySelector('.onb-label').textContent = 'Bagaimana kami boleh memanggil Anda?';
    DOM.onbName.placeholder = 'Nama panggilan Anda'; document.getElementById('onbNextBtn').textContent = 'Masuk'; document.getElementById('onbGuestBtn').textContent = 'Lihat Koleksi';
  }

  const enableBottomNav = () => { DOM.bottomNav?.removeAttribute('inert'); };

  document.getElementById('onbNextBtn').addEventListener('click', function handler() {
    if (this.disabled) return; this.disabled = true;
    if (document.activeElement) document.activeElement.blur();
    const name = DOM.onbName.value.trim(); if (!name) { showToast('Mohon isi nama.'); this.disabled = false; return; }
    state.customerName = name;
    const greeting = document.createElement('div'); greeting.className = 'lobby-welcome';
    greeting.innerHTML = `<h2 class="lobby-welcome-text">Senang menyambut Anda, ${escapeHTML(name)}.</h2><p class="lobby-welcome-sub">Silakan menikmati pengalaman RUJAK.Co.</p>`;
    document.body.appendChild(greeting);
    requestAnimationFrame(() => { greeting.classList.add('show'); });
    setTimeout(() => { greeting.classList.remove('show'); setTimeout(() => { greeting.remove(); DOM.onboardingOverlay.classList.add('hidden'); enableBottomNav(); setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, APP_CONFIG.TIMING.ONBOARDING_GREETING); applyPersonalization(); initScrollReveal(); saveUser(state.customerName, ''); }, APP_CONFIG.TIMING.ONBOARDING_GREETING); }, APP_CONFIG.TIMING.ONBOARDING_DELAY);
  });

  document.getElementById('onbGuestBtn')?.addEventListener('click', () => { state.customerName = 'Tamu'; state.selectedDistrict = ''; DOM.onboardingOverlay.classList.add('hidden'); enableBottomNav(); setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600); applyPersonalization(); initScrollReveal(); });
  document.getElementById('onbEnterBtn')?.addEventListener('click', () => { if (document.activeElement) document.activeElement.blur(); DOM.onboardingOverlay.classList.add('hidden'); enableBottomNav(); setTimeout(() => { DOM.onboardingOverlay.style.display = 'none'; }, 600); applyPersonalization(); initScrollReveal(); });

  document.getElementById('onbResetBtn')?.addEventListener('click', () => {
    if (document.activeElement) document.activeElement.blur();
    clearUser();
    state.cart = {};
    state.customerName = '';
    state.customerPhone = '';
    state.customerAddress = '';
    state.selectedDistrict = '';
    state.selectedDistrictFull = '';
    state.userDistance = null;
    updateCartUI();
    applyPersonalization();   // perbarui form input
    DOM.onbReturningUser.style.display = 'none';
    DOM.onbNewUser.style.display = 'block';
    document.getElementById('onbNextBtn').disabled = false;
    DOM.onbName.value = '';
    DOM.onbName.focus();
  });
}