// modules/render.js
import { PRODUCTS } from '../data/products.js';
import { SPICE_LABELS } from '../data/config.js';
import { fmt } from '../utils/helpers.js';
import { getDistance } from './shipping.js';

const LOOP_MULTIPLIER = 3; // Lebih hemat: 3 × 6 = 18 card (cukup untuk infinite)
let loopedProducts = [];
for (let i = 0; i < LOOP_MULTIPLIER; i++) loopedProducts = loopedProducts.concat(PRODUCTS);

export function renderMenu(containerId = 'menuList') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = loopedProducts.map((p, index) => `
    <div class="boutique-item" data-id="${p.id}" data-idx="${index}">
      <img class="btq-img" src="${p.thumbnail}" loading="lazy" alt="${p.name}" />
      <div class="btq-text-container">
        <h3 class="btq-name">${p.name}</h3>
        ${p.badge ? `<span style="font-size:9px; text-transform:uppercase; letter-spacing:0.15em; color:var(--gold); font-weight:600; margin-bottom:8px;">${p.badge}</span>` : ''}
        <div class="btq-price-wrap">
          <span class="btq-price">${fmt(p.price)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

export function renderProductSwiper(trackId = 'productSwiperTrack') {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.innerHTML = loopedProducts.map((p, index) => `
    <div class="product-slide" data-id="${p.id}" data-idx="${index}">
      <div class="detail-image-wrap">
        <img class="lazy-detail" data-src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="detail-content">
        <h2>${p.name}</h2>
        ${p.badge ? `<span style="font-size:10px; text-transform:uppercase; letter-spacing:0.15em; color:var(--gold); font-weight:600; display:inline-block; margin-bottom:4px;">${p.badge}</span>` : ''}
        <div class="detail-price-row">
          <span class="detail-price">${fmt(p.price)}</span>
          <span class="price-line"></span>
        </div>
        <p class="detail-desc">${p.desc}</p>
        <div class="action-area">
          <div id="step1_${index}_${p.id}" class="action-step-1">
            <button class="step-1-btn btn-lanjutkan" data-idx="${index}" data-pid="${p.id}">Sesuaikan &amp; Pesan</button>
          </div>
          <div id="step2_${index}_${p.id}" class="step-2-content">
            <div class="spice-selector">
              <label>
                <span>Tingkat Pedas</span>
                <span class="spice-current" id="spiceLabel_${index}_${p.id}">${SPICE_LABELS[p.defaultSpice || 3]}</span>
              </label>
              <div class="spice-options" id="spice_${index}_${p.id}">
                ${[1,2,3,4,5].map(i => `<button class="spice-option ${i === (p.defaultSpice || 3) ? 'active' : ''}" data-spice="${i}" data-pid="${p.id}">${i}</button>`).join('')}
              </div>
            </div>
            <div class="detail-actions" style="margin-bottom:0;">
              <div class="qty-minimal">
                <button class="qty-minus" data-pid="${p.id}">−</button>
                <span class="qty-num" data-valpid="${p.id}">1</span>
                <button class="qty-plus" data-pid="${p.id}">+</button>
              </div>
              <button class="btn-dark add-to-cart-btn" data-pid="${p.id}" data-idx="${index}">Tambahkan ke Reservasi</button>
            </div>
          </div>
        </div>
        <label class="section-label">Komposisi ${p.buah.length} Buah</label>
        <p class="fruit-list-inline">
          ${p.buah.join(' <span class="fruit-bullet">•</span> ')}
        </p>
        <label class="section-label">Spesifikasi Sajian</label>
        <p class="fruit-list-inline" style="margin-bottom:40px;">
          ${p.container} <span class="fruit-bullet">•</span> ${p.size} <span class="fruit-bullet">•</span> ${p.sambal}
        </p>
        ${p.story ? `
          <label class="section-label">Cerita di Baliknya</label>
          <p style="font-family:'Fraunces',serif; font-style:italic; text-align:center; color:var(--gray-500); padding:0 16px; margin-bottom:40px; line-height:1.8;">${p.story}</p>
        ` : ''}
        <div class="detail-manifesto">
          <h4><i data-lucide="shield-check" class="w-4 h-4 inline" style="margin-bottom:-2px;"></i> Komitmen Kesegaran</h4>
          <p>Kerenyahan adalah prioritas kami. Buah dipotong tepat 15 menit sebelum diantar, dan sambal selalu dikemas terpisah agar teksturnya terjaga.</p>
        </div>
      </div>
    </div>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

export function renderCart(cart, badgeIds = ['cartBadgeNav']) {
  const totalQty = Object.values(cart).reduce((sum, entry) => sum + (entry.qty || 0), 0);
  badgeIds.forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.textContent = totalQty; b.style.display = totalQty > 0 ? 'flex' : 'none'; }
  });
}

export function renderMiniCart(cart, listId = 'miniCartList', subtotalId = 'cartSubtotalDisplay') {
  const sum = getCartSummary(cart);
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = sum.items.length === 0 ? '<p class="cart-empty">Reservasi Anda masih kosong.<br>Silakan pilih mahakarya sajian kami.</p>' : sum.items.map(i => `
    <div class="cart-item-row">
      <div class="cart-item-info">
        <h4>${i.name}${i.spice ? ' (Lv '+i.spice+')' : ''}</h4>
        <p>${fmt(i.price)}</p>
      </div>
      <div class="qty-minimal">
        <button data-action="decrease" data-id="${i.cartId}">−</button>
        <span>${i.qty}</span>
        <button data-action="increase" data-id="${i.cartId}">+</button>
      </div>
    </div>
  `).join('');
  const sub = document.getElementById(subtotalId);
  if (sub) sub.textContent = fmt(sum.subtotal);
  return sum;
}

// Helper internal untuk getCartSummary (sebaiknya di file terpisah, tapi untuk kemudahan)
function getCartSummary(cart) {
  const items = []; let subtotal = 0;
  Object.keys(cart).forEach(id => {
    const entry = cart[id];
    const pid = id.split('_spice')[0];
    const product = PRODUCTS.find(p => p.id === pid);
    if (product && entry && entry.qty > 0) {
      subtotal += product.price * entry.qty;
      items.push({ cartId: id, id: pid, name: product.name, price: product.price, qty: entry.qty, spice: entry.spice });
    }
  });
  return { items, subtotal };
}