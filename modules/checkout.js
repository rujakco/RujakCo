// modules/checkout.js – FINAL V1.1
import { SYSTEM } from '../data/config.js';
import { PRODUCTS } from '../data/products.js';
import { fmt, showToast, getSupabase } from '../utils/helpers.js';

export function getCartSummary(cart) {
  const items = [];
  let subtotal = 0;
  let mainProductQty = 0;
  Object.keys(cart).forEach(key => {
    const entry = cart[key];
    if (!entry || entry.qty <= 0) return;
    const pid = key.split('_spice')[0];
    const product = PRODUCTS.find(p => p.id === pid);
    if (!product) return;
    const qty = entry.qty;
    subtotal += product.price * qty;
    mainProductQty += qty;
    items.push({ cartId: key, id: pid, name: product.name, price: product.price, qty, spice: entry.spice });
  });
  return { items, subtotal, mainProductQty };
}

export function validatePhone(phone) {
  const cleaned = String(phone || '').replace(/[\s\-\(\)\.]/g, '');
  return /^(08[1-9][0-9]{7,10}|\+628[1-9][0-9]{7,10}|628[1-9][0-9]{7,10})$/.test(cleaned);
}

export function validateAddress(address) {
  const trimmed = String(address || '').trim();
  if (trimmed.length < 10) return false;
  const hasMultipleWords = trimmed.split(/\s+/).length >= 3;
  const hasDigit = /\d/.test(trimmed);
  return hasMultipleWords && (hasDigit || trimmed.length >= 20);
}

export function showWhatsAppFallback(phone, message) {
  const old = document.getElementById('waFallbackModal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'waFallbackModal';
  modal.className = 'modal-overlay active';   // langsung aktif
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="drawer-content" style="height:auto; max-height:80vh; margin:auto; transform:none;">
      <div class="drawer-header">
        <h3>Buka WhatsApp</h3>
        <button type="button" id="closeWaFallback" class="glass-btn-dark" aria-label="Tutup"><i data-lucide="x" class="icon-sm"></i></button>
      </div>
      <div class="drawer-body" style="text-align:center; padding-bottom:40px;">
        <p style="font-size:14px;color:var(--gray-600);margin-bottom:20px;">Browser memblokir pembukaan otomatis. Klik tombol di bawah untuk mengirim pesanan.</p>
        <button id="openWaManual" class="btn-gold" style="width:100%;">Buka WhatsApp</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const closeFallback = () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 400);
  };

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeFallback();
  });
  document.getElementById('openWaManual').addEventListener('click', () => {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    closeFallback();
  });
  document.getElementById('closeWaFallback').addEventListener('click', closeFallback);

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeFallback();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  if (window.lucide) window.lucide.createIcons();
}