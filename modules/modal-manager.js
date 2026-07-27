// modules/modal-manager.js
import { syncBottomNav } from './navigation.js';

let DOM = {};
export const overlayStack = [];
const focusStack = [];
export let isProgrammaticBack = false;

export function setProgrammaticBack(value) {
  isProgrammaticBack = value;
}

export function initModalManager(domConfig) {
  DOM = domConfig;
  window.__overlayStack__ = overlayStack;
}

export function releaseInert() {
  const anyModalOpen = document.querySelector('.modal-overlay.active');
  const productPageOpen = DOM.productPage?.classList.contains('active');
  if (!anyModalOpen && !productPageOpen) {
    document.body.style.overflow = '';
    DOM.mainContent?.removeAttribute('inert');
    DOM.bottomNav?.removeAttribute('inert');
  }
}

export function openModal(modalEl) {
  if (!modalEl) return;

  if (document.activeElement) focusStack.push(document.activeElement);

  modalEl.classList.add('active');
  modalEl.setAttribute('aria-hidden', 'false');
  modalEl.removeAttribute('inert');
  document.body.style.overflow = 'hidden';

  overlayStack.push(modalEl);
  history.pushState({ isOverlay: true, id: modalEl.id }, '');

  DOM.mainContent?.setAttribute('inert', '');
  DOM.bottomNav?.setAttribute('inert', '');

  if (['miniCartModal', 'orderConfirmModal', 'paymentModal'].includes(modalEl.id)) {
    DOM.bottomNav?.classList.add('nav-hidden');
  }

  const firstInput = modalEl.querySelector('button, input, textarea, select');
  if (firstInput) firstInput.focus();

  syncBottomNav();
}

export function closeModal(modalEl, fromPopState = false) {
  if (!modalEl) return;

  const previousFocus = focusStack.pop();
  if (previousFocus && document.body.contains(previousFocus)) {
    previousFocus.focus();
  } else {
    document.getElementById('navHomeBtn')?.focus();
  }

  modalEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.setAttribute('inert', '');

  const index = overlayStack.indexOf(modalEl);
  if (index > -1) overlayStack.splice(index, 1);

  if (['miniCartModal', 'orderConfirmModal', 'paymentModal'].includes(modalEl.id)) {
    const isAnyTransactionOpen = ['miniCartModal', 'orderConfirmModal', 'paymentModal']
      .some(id => document.getElementById(id)?.classList.contains('active'));
    if (!isAnyTransactionOpen) {
      DOM.bottomNav?.classList.remove('nav-hidden');
    }
  }

  if (overlayStack.length === 0 && !DOM.productPage?.classList.contains('active')) {
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

export function showConfirmModal(title, message, onConfirm) {
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

// ✅ Fungsi baru: membersihkan semua overlay (digunakan oleh navigasi bawah)
export function resetOverlays() {
  // Tutup halaman detail produk jika terbuka
  if (DOM.productPage?.classList.contains('active')) {
    DOM.productPage.classList.remove('active');
    DOM.productPage.style.display = 'none';
    DOM.productPage.setAttribute('aria-hidden', 'true');
    DOM.productPage.setAttribute('inert', '');
    DOM.bottomNav?.classList.remove('nav-visible');
    if (DOM._productObserver) {
      DOM._productObserver.disconnect();
      DOM._productObserver = null;
    }
  }

  // Tutup SEMUA modal yang sedang aktif
  document.querySelectorAll('.modal-overlay.active').forEach(modal => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
  });

  // Kosongkan overlay stack
  overlayStack.length = 0;

  // Kembalikan scroll dan bebaskan inert pada konten utama
  document.body.style.overflow = '';
  DOM.mainContent?.removeAttribute('inert');
  DOM.bottomNav?.classList.remove('nav-hidden');
}