import { PRODUCTS } from '../data/products.js';
import { SPICE_LABELS } from '../data/config.js';
import { fmt, escapeHTML } from '../utils/helpers.js';
import { getCartSummary } from './checkout.js';

const LOOP_MULTIPLIER = 3;
let loopedProducts = [];
for (let i = 0; i < LOOP_MULTIPLIER; i++) {
  loopedProducts = loopedProducts.concat(PRODUCTS);
}

export function renderMenu(containerId = 'menuList') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = loopedProducts.map((p, index) => `
    <div class="boutique-item" data-id="${p.id}" data-idx="${index}">
      <img class="btq-img" src="${p.thumbnail}" loading="lazy" alt="${escapeHTML(p.name)}" />
      <div class="btq-text-container">
        <h3 class="btq-name">${escapeHTML(p.name)}</h3>
        ${p.badge ? `<span class="btq-badge">${escapeHTML(p.badge)}</span>` : ''}
        <div class="btq-price-wrap"><span class="btq-price">${fmt(p.price)}</span></div>
      </div>
    </div>`).join('');
  container.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const fb = document.createElement('div');
      fb.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e8efeb;color:#6B7280;font-size:12px;font-weight:600;text-align:center;padding:8px;';
      fb.textContent = img.alt.substring(0, 30);
      img.parentElement.appendChild(fb);
    });
  });
}

export function renderProductSwiper(drafts, trackId = 'productSwiperTrack') {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.innerHTML = loopedProducts.map((p, index) => {
    const draft = drafts?.[p.id] || { spice: p.defaultSpice || 3, qty: 1 };
    return `
    <div class="product-slide" data-id="${p.id}" data-idx="${index}">
      <div class="detail-image-wrap">
        <img class="lazy-detail" data-src="${p.image}" alt="${escapeHTML(p.name)}" loading="lazy" />
      </div>
      <div class="detail-content">
        <h2>${escapeHTML(p.name)}</h2>
        ${p.badge ? `<span class="btq-badge" style="display:inline-block;margin-bottom:4px;">${escapeHTML(p.badge)}</span>` : ''}
        <div class="detail-price-row"><span class="detail-price">${fmt(p.price)}</span><span class="price-line"></span></div>
        <p class="detail-desc">${escapeHTML(p.desc)}</p>
        <div class="action-area">
          <div id="step1_${index}_${p.id}" class="action-step-1">
            <button class="step-1-btn btn-gold" data-idx="${index}" data-pid="${p.id}">Sesuaikan &amp; Pesan</button>
          </div>
          <div id="step2_${index}_${p.id}" class="step-2-content">
            <div class="spice-selector">
              <label><span>Tingkat Pedas</span><span class="spice-current" id="spiceLabel_${index}_${p.id}">${SPICE_LABELS[draft.spice]}</span></label>
              <div class="spice-options" id="spice_${index}_${p.id}">
                ${[1,2,3,4,5].map(i => `<button class="spice-option ${i === draft.spice ? 'active' : ''}" data-spice="${i}" data-pid="${p.id}">${i}</button>`).join('')}
              </div>
            </div>
            <div class="detail-actions" style="margin-bottom:0;">
              <div class="qty-minimal">
                <button class="qty-minus" data-pid="${p.id}">−</button>
                <span class="qty-num" data-valpid="${p.id}">${draft.qty}</span>
                <button class="qty-plus" data-pid="${p.id}">+</button>
              </div>
              <button class="add-to-cart-btn" data-pid="${p.id}" data-idx="${index}">Tambahkan ke Reservasi</button>
            </div>
          </div>
        </div>
        <label class="section-label">Komposisi ${p.buah.length} Buah</label>
        <p class="fruit-list-inline">${p.buah.map(b => escapeHTML(b)).join(' <span class="fruit-bullet">•</span> ')}</p>
        <label class="section-label">Spesifikasi Sajian</label>
        <p class="fruit-list-inline" style="margin-bottom:40px;">${escapeHTML(p.container)} <span class="fruit-bullet">•</span> ${escapeHTML(p.size)} <span class="fruit-bullet">•</span> ${escapeHTML(p.sambal)}</p>
        ${p.story ? `<label class="section-label">Cerita di Baliknya</label><p style="font-family:'Fraunces',serif;font-style:italic;text-align:center;color:var(--gray-500);padding:0 16px;margin-bottom:40px;line-height:1.8;">${escapeHTML(p.story)}</p>` : ''}
        <div class="detail-manifesto">
          <h4><i data-lucide="shield-check" class="icon-sm inline" style="margin-bottom:-2px;"></i> Komitmen Kesegaran</h4>
          <p>Kerenyahan adalah prioritas kami. Buah dipotong tepat 15 menit sebelum diantar, dan sambal selalu dikemas terpisah agar teksturnya terjaga.</p>
        </div>
      </div>
    </div>`;
  }).join('');
  track.querySelectorAll('.lazy-detail').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const fb = document.createElement('div');
      fb.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e8efeb;color:#6B7280;font-size:12px;font-weight:600;text-align:center;padding:8px;';
      fb.textContent = img.alt.substring(0, 30);
      img.parentElement.appendChild(fb);
    });
  });
  if (window.lucide) window.lucide.createIcons();
}

export function renderCart(cart, badgeIds = ['cartBadgeNav']) {
  const totalQty = Object.values(cart).reduce((sum, entry) => sum + (entry.qty || 0), 0);
  badgeIds.forEach(id => {
    const badge = document.getElementById(id);
    if (badge) { badge.textContent = totalQty; badge.style.display = totalQty > 0 ? 'flex' : 'none'; }
  });
}

export function renderMiniCart(cart, listId = 'miniCartList', subtotalId = 'cartSubtotalDisplay') {
  const sum = getCartSummary(cart);
  const list = document.getElementById(listId);
  if (!list) return sum;
  list.innerHTML = sum.items.length === 0
    ? '<p class="cart-empty">Reservasi Anda masih kosong.<br>Silakan pilih mahakarya sajian kami.</p>'
    : sum.items.map(i => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <h4>${escapeHTML(i.name)}${i.spice ? ' (Lv ' + i.spice + ')' : ''}</h4>
          <p>${fmt(i.price)}</p>
        </div>
        <div class="qty-minimal">
          <button data-action="decrease" data-id="${i.cartId}">−</button>
          <span>${i.qty}</span>
          <button data-action="increase" data-id="${i.cartId}">+</button>
        </div>
      </div>`).join('');
  const subtotalEl = document.getElementById(subtotalId);
  if (subtotalEl) subtotalEl.textContent = fmt(sum.subtotal);
  return sum;
}

export function getProductGlobalIndex(productId) {
  const baseIndex = PRODUCTS.findIndex(p => p.id === productId);
  if (baseIndex === -1) return -1;
  return Math.floor(LOOP_MULTIPLIER / 2) * PRODUCTS.length + baseIndex;
}