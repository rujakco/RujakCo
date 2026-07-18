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
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:100000;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:24px;max-width:360px;width:90%;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">📲</div>
      <h3>Buka WhatsApp</h3>
      <p style="font-size:13px;color:#666;">Browser memblokir pembukaan otomatis. Klik tombol di bawah untuk mengirim pesanan.</p>
      <button id="openWaManual" style="background:#25D366;color:white;border:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;width:100%;">Buka WhatsApp</button>
      <button id="closeWaFallback" style="background:none;border:1px solid #ddd;color:#666;padding:10px;border-radius:8px;margin-top:8px;width:100%;">Tutup</button>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('openWaManual').addEventListener('click', () => { window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank'); modal.remove(); });
  document.getElementById('closeWaFallback').addEventListener('click', () => modal.remove());
}