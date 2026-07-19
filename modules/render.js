// modules/render.js
import { PRODUCTS } from '../data/products.js';
import { SPICE_LABELS } from '../data/config.js';
import { fmt, escapeHTML } from '../utils/helpers.js';

export function getProductGlobalIndex(productId) {
  return PRODUCTS.findIndex(p => p.id === productId);
}

export function renderMenu() {
  const track = document.getElementById('menuList');
  const dotsContainer = document.getElementById('carouselDots');
  if (!track) return;

  track.innerHTML = PRODUCTS.map((p, i) => `
    <div class="boutique-item" data-idx="${i}" tabindex="0" role="button" aria-label="Lihat detail ${escapeHTML(p.name)}">
      <img class="btq-img" src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy" />
      <div class="btq-text-container">
        <span class="btq-badge">${escapeHTML(p.category)}</span>
        <h3 class="btq-name">${escapeHTML(p.name)}</h3>
        <div class="btq-price-wrap">
          <span class="btq-price">${escapeHTML(p.priceLabel)}</span>
        </div>
      </div>
    </div>
  `).join('');

  if (dotsContainer) {
    dotsContainer.innerHTML = PRODUCTS.map((_, i) => `
      <button class="carousel-dot" data-index="${i}" aria-label="Produk ${i + 1}"></button>
    `).join('');
  }
}

export function renderProductSwiper(drafts) {
  const track = document.getElementById('productSwiperTrack');
  if (!track) return;

  track.innerHTML = PRODUCTS.map((p, idx) => {
    const d = drafts[p.id] || { spice: p.defaultSpice ?? 3, qty: 1 };
    const spiceLabel = SPICE_LABELS[d.spice];

    // === PERBAIKAN BULLET WRAP: spasi sebelum bullet diganti &nbsp; ===
    const buahList = (p.buah || []).map(b => escapeHTML(b)).join('&nbsp;<span class="fruit-bullet">•</span> ');
    const specs = `${escapeHTML(p.container)}&nbsp;<span class="fruit-bullet">•</span> ${escapeHTML(p.size)}&nbsp;<span class="fruit-bullet">•</span> ${escapeHTML(p.sambal)}`;

    return `
      <div class="product-slide" data-idx="${idx}">
        <div class="detail-image-wrap">
          <img class="lazy-detail" data-src="${escapeHTML(p.detailImage || p.image)}" alt="${escapeHTML(p.name)}" />
        </div>
        <div class="detail-content">
          <span class="section-label">${escapeHTML(p.category)}</span>
          <h2>${escapeHTML(p.name)}</h2>
          <div class="detail-price-row">
            <span class="detail-price">${escapeHTML(p.priceLabel)}</span>
            <span class="price-line"></span>
          </div>
          <p class="detail-desc">${escapeHTML(p.desc)}</p>

          <div class="action-area">
            <div id="step1_${idx}_${p.id}" class="step-1-content">
              <div class="detail-actions">
                <div class="qty-minimal">
                  <button class="qty-minus" data-pid="${p.id}" aria-label="Kurangi jumlah">−</button>
                  <span class="qty-num" data-valpid="${p.id}">${d.qty}</span>
                  <button class="qty-plus" data-pid="${p.id}" aria-label="Tambah jumlah">+</button>
                </div>
                <button class="add-to-cart-btn step-1-btn" data-pid="${p.id}" data-idx="${idx}">
                  Pesan — ${escapeHTML(p.priceLabel)}
                </button>
              </div>
            </div>

            <div id="step2_${idx}_${p.id}" class="step-2-content" style="display:none;">
              <div class="spice-selector">
                <label>Tingkat Pedas <span class="spice-current" id="spiceLabel_${idx}_${p.id}">${spiceLabel}</span></label>
                <div class="spice-options">
                  ${[1,2,3,4,5].map(level => `
                    <button class="spice-option ${level === d.spice ? 'active' : ''}" data-pid="${p.id}" data-spice="${level}" aria-label="Level ${level}" aria-pressed="${level === d.spice ? 'true' : 'false'}">${level}</button>
                  `).join('')}
                </div>
              </div>
              <button class="add-to-cart-btn" data-pid="${p.id}" data-idx="${idx}">
                Tambahkan ke Pesanan
              </button>
            </div>
          </div>

          <div class="detail-specs">
            <div><strong>Buah</strong> ${buahList}</div>
            <div><strong>Saus</strong> ${escapeHTML(p.saus || '—')}</div>
          </div>

          <p class="fruit-list-inline" style="margin-bottom:40px;">${specs}</p>

          <p class="cerita-teks" style="margin-top:0; padding: 0 16px; text-align:center;">
            ${escapeHTML(p.cerita || '')}
          </p>

          <div class="detail-manifesto">
            <h4>Fresh-Prep</h4>
            <p>Buah dipotong 15 menit sebelum pengantaran.</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function renderCart(cart, badgeIds = []) {
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  badgeIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (totalItems === 0) {
      el.style.display = 'none';
    } else {
      el.style.display = 'flex';
      el.textContent = totalItems;
    }
  });
}

export function renderMiniCart(cart) {
  const list = document.getElementById('miniCartList');
  if (!list) return;

  const cartItems = Object.entries(cart);
  if (cartItems.length === 0) {
    list.innerHTML = `<div class="cart-empty">Keranjang masih kosong. Pilih sajian favorit Anda.</div>`;
    return;
  }

  list.innerHTML = cartItems.map(([key, item]) => {
    const productId = key.split('_spice')[0];
    const product = PRODUCTS.find(p => p.id === productId);
    const name = product ? product.name : key;
    const price = product ? product.price : 0;
    const spiceLabel = SPICE_LABELS[item.spice] || '';
    return `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <p>${escapeHTML(name)} ${spiceLabel ? 'Lv ' + item.spice : ''}</p>
          <span style="font-size:0.75rem;color:var(--gray-500);">${fmt(price)} / porsi</span>
        </div>
        <div class="qty-minimal" style="height:40px;">
          <button data-action="decrease" data-id="${key}" aria-label="Kurangi">−</button>
          <span>${item.qty}</span>
          <button data-action="increase" data-id="${key}" aria-label="Tambah">+</button>
        </div>
        <span style="font-weight:600;min-width:60px;text-align:right;">${fmt(price * item.qty)}</span>
      </div>
    `;
  }).join('');

  const subtotal = Object.values(cart).reduce((sum, item) => {
    const product = PRODUCTS.find(p => p.id === item.id?.split('_spice')[0]);
    return sum + ((product?.price || 0) * item.qty);
  }, 0);

  const subtotalEl = document.getElementById('cartSubtotalDisplay');
  if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
}