import { saveCart } from './storage.js';
import { renderCart, renderMiniCart } from './render.js';
import { updateShippingUI } from './shipping-controller.js';
import { SPICE_LABELS } from '../data/config.js';

let DOM = {};
let state = {};

export function initCartController(domConfig, appState) { DOM = domConfig; state = appState; }

export function updateCartUI() {
  saveCart(state.cart); renderCart(state.cart, ['cartBadgeNav']);
  if (DOM.miniCartModal?.classList.contains('active')) { renderMiniCart(state.cart); updateShippingUI(); }
  const totalItems = Object.values(state.cart).reduce((sum, item) => sum + item.qty, 0);
  if (DOM.liveCartRegion) DOM.liveCartRegion.textContent = totalItems > 0 ? `${totalItems} item di keranjang` : 'Keranjang kosong';
  if (window.lucide) lucide.createIcons();
}

export function updateDraftUI(pid) {
  const draft = state.drafts[pid]; if (!draft) return;
  document.querySelectorAll(`.qty-num[data-valpid="${pid}"]`).forEach(el => el.textContent = draft.qty);
  document.querySelectorAll(`.spice-option[data-pid="${pid}"]`).forEach(b => { b.classList.toggle('active', parseInt(b.dataset.spice) === draft.spice); });
  document.querySelectorAll(`[id^="spiceLabel_"][id$="_${pid}"]`).forEach(el => { el.textContent = SPICE_LABELS[draft.spice]; });
}