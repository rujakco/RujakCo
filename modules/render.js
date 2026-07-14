// modules/render.js
import { PRODUCTS } from '../data/products.js';
import { SPICE_LABELS } from '../data/config.js';
import { fmt } from '../utils/helpers.js';
import { getDistance } from './shipping.js';

const LOOP_MULTIPLIER = 3; 
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
        ${p.badge ? `<span class="btq-badge">${p.badge}</span>` : ''}
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
            <button class="step-1-btn btn-gold" data-idx="${index}" data-pid="${p.id}">Sesuaikan &amp; Pesan</button>
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
            <div class="detail-actions">
              <div class="qty-minimal">
                <button class="qty-minus" data-pid="${p.id}">−</button>
                <span class="qty-num" data-valpid="${p.id}">1</span>
                <button class="qty-plus" data-pid="${p.id}">+</button>
              </div>
              <button class="add-to-cart-btn" data-pid="${p.id}" data-idx="${index}">Tambahkan ke Reservasi</button>
            </div>
          </div>
        </div>
        
        <label class="section-label">Komposisi ${p.buah.length} Buah</label>
        <p class="fruit-list-inline">
          ${p.buah.join(' <span>•</span> ')}
        </p>

        <label class="section-label">Spesifikasi Sajian</label>
        <p class="fruit-list-inline" style="margin-bottom:40px;">
          ${p.container} <span>•</span> ${p.size} <span>•</span> ${p.sambal}
        </p>

        ${p.story ? `
          <label class="section-label">Cerita di Baliknya</label>
          <p class="cerita-teks" style="text-align:center; padding:0 16px; margin-bottom:40px;">${p.story}</p>
        ` : ''}

        <div class="detail-manifesto">
          <h4><i data-lucide="shield-check" class="w-4 h-4 inline" style="margin-bottom:-2px;"></i> Komitmen Kesegaran</h4>
          <p>Kerenyahan adalah prioritas kami. Buah dipotong tepat 15 menit sebelum diantar.</p>
        </div>
      </div>
    </div>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

// ... sisanya (renderCart, renderMiniCart, getCartSummary) tetap sama ...

