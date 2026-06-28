// ============================================================
// ================ UI RENDER FUNCTIONS =======================
// ============================================================

import { fmt, escapeHTML } from './utils.js';
import { SYSTEM } from './shipping.js';
import { getCartSummaryCached, invalidateCache, saveCart } from './cart.js';
import { aiSearch, renderAIUpsell, renderAIRecommendation } from './ai-engine.js';

// State reference
export let stateRef = null;
export let productsRef = [];
export let addonsRef = [];

export function setStateRef(state) {
  stateRef = state;
}

export function setProductsRef(products, addons) {
  productsRef = products;
  addonsRef = addons;
}

let addToCartLocked = false;

export function lockAddToCart() {
  addToCartLocked = true;
  setTimeout(() => { addToCartLocked = false; }, 300);
}
window._lockAddToCart = lockAddToCart;

export function updateStoreStatus() {
  const el = document.getElementById('storeStatusText');
  const dot = document.querySelector('.status-dot');
  const container = document.getElementById('storeStatus');
  const banner = document.getElementById('storeStatusBanner');
  const bannerText = document.getElementById('storeStatusBannerText');
  
  if (!el) return;
  
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  let isOpen = false;
  let openTime = '10:00';
  let closeTime = '20:00';
  let dayName = 'Senin-Jumat';
  
  if (day >= 1 && day <= 5) {
    isOpen = timeInMinutes >= 600 && timeInMinutes < 1200;
    openTime = '10:00';
    closeTime = '20:00';
    dayName = 'Senin-Jumat';
  } else {
    isOpen = timeInMinutes >= 540 && timeInMinutes < 1080;
    openTime = '09:00';
    closeTime = '18:00';
    dayName = 'Sabtu-Minggu';
  }
  
  el.textContent = isOpen ? 'Buka' : 'Tutup';
  if (dot) dot.style.background = isOpen ? '#4CAF50' : '#D62828';
  if (container) container.classList.toggle('closed', !isOpen);
  
  if (banner && bannerText) {
    if (isOpen) {
      banner.style.display = 'none';
    } else {
      banner.style.display = 'block';
      bannerText.textContent = '🕐 Toko tutup. Buka ' + dayName + ' pukul ' + openTime + ' WIB.';
    }
  }
}

export function updateFloatingButton() {
  const btn = document.getElementById('floatingCartBtn');
  const badge = document.getElementById('floatingBadge');
  const summary = getCartSummaryCached();
  
  if (stateRef.isCartMinimized && summary.totalQty > 0) {
    if (btn) btn.classList.add('visible');
    if (badge) badge.textContent = summary.totalQty;
  } else {
    if (btn) btn.classList.remove('visible');
  }
}

export function renderMenu() {
  if (!stateRef || !productsRef) return;
  
  const container = document.getElementById('menuList');
  const empty = document.getElementById('emptyState');
  const skeleton = document.getElementById('skeletonContainer');
  
  if (skeleton) skeleton.style.display = 'none';
  if (!container) return;
  container.style.display = 'block';
  
  if (stateRef.activeFilter === 'addon') {
    container.innerHTML = '';
    if (empty) empty.style.display = 'none';
    return;
  }
  
  let filtered;
  if (stateRef.searchQuery && stateRef.searchQuery.length >= 2) {
    filtered = aiSearch(stateRef.searchQuery);
  } else {
    filtered = productsRef.filter(p => !p.isHidden);
  }
  
  if (stateRef.activeFilter !== 'all') {
    filtered = filtered.filter(p => p.cat === stateRef.activeFilter);
  }
  
  if (!filtered.length) {
    if (empty) empty.style.display = 'block';
    container.innerHTML = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  
  let html = '';
  filtered.forEach(p => {
    let qty = 0;
    let firstCartKey = p.id;
    const cartKeyRegex = new RegExp('^' + p.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(_spice\\d+)?$');
    Object.keys(stateRef.cart).forEach(k => {
      if (cartKeyRegex.test(k)) {
        qty += stateRef.cart[k].qty;
        if (qty === stateRef.cart[k].qty) firstCartKey = k;
      }
    });
    
    let displayName = p.name;
    if (stateRef.searchQuery && stateRef.searchQuery.length >= 2) {
      const q = stateRef.searchQuery.toLowerCase();
      const nameLower = p.name.toLowerCase();
      if (nameLower.includes(q)) {
        const idx = nameLower.indexOf(q);
        displayName = p.name.substring(0, idx) +
          '<span class="ai-search-highlight">' + p.name.substring(idx, idx + q.length) + '</span>' +
          p.name.substring(idx + q.length);
      }
    }
    
    const control = qty === 0 ?
      `<button type="button" class="add-btn" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` :
      `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${firstCartKey}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${firstCartKey}">+</button></div>`;
    
    const badgeRight = p.badge ? `<span class="item-badge-right ${p.badgeColor}">${escapeHTML(p.badge)}</span>` : '';
    const flavorTag = p.flavorTag ? `<span class="item-flavor-tag">${escapeHTML(p.flavorTag)}</span>` : '';
    const defaultSpice = p.defaultSpice || 3;
    const spiceIcons = Array(5).fill(null).map((_, i) => i < defaultSpice ? '🌶️' : '<span style="opacity:0.25">🌶️</span>').join('');
    const buahChips = (p.buah || []).slice(0, 4).map(b => `<span class="item-buah-chip">${escapeHTML(b)}</span>`).join('');
    const moreChips = (p.buah || []).length > 4 ? `<span class="item-buah-chip">+${p.buah.length - 4}</span>` : '';
    
    html += `
      <div class="menu-item" data-id="${p.id}" tabindex="0" role="button" aria-label="Detail ${escapeHTML(p.name)}">
        <div class="item-img-wrap">
          <img src="${p.thumbnail}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.nextElementSibling.textContent='${escapeHTML(p.name.substring(0, 20))}'">
          <div class="fallback" style="display:none;">${escapeHTML(p.name.substring(0, 20))}</div>
        </div>
        <div class="item-body">
          <div class="item-name-row"><span class="item-name">${displayName}</span>${badgeRight}</div>
          <div class="item-flavor-row"><span class="item-flavor">${escapeHTML(p.flavor)}</span>${flavorTag}</div>
          <div class="item-spice" style="display:flex;align-items:center;gap:4px;font-size:11px;">
            <span style="font-size:10px;color:var(--gray-500);">Pedas:</span>${spiceIcons}
            <span style="font-size:10px;color:var(--gray-400);">(bisa diatur)</span>
          </div>
          <p class="item-desc">${escapeHTML(p.desc)}</p>
          <div class="item-buah-chips">${buahChips}${moreChips}</div>
          <div class="item-footer">
            <div><span class="item-price">${fmt(p.price)}</span><span class="item-portion"> · ${p.portion}</span></div>
            ${control}
          </div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

export function renderAddons() {
  if (!stateRef || !addonsRef) return;
  
  const container = document.getElementById('addonList');
  if (!container) return;
  
  const q = stateRef.searchQuery.toLowerCase();
  const filtered = addonsRef.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
  
  let html = '';
  filtered.forEach(a => {
    const entry = stateRef.cart[a.id];
    const qty = entry ? entry.qty : 0;
    const control = qty === 0 ?
      `<button type="button" class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>` :
      `<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
    html += `
      <div class="addon-card">
        <div class="addon-icon ${a.iconColor}"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div>
        <div class="addon-name">${escapeHTML(a.name)}</div>
        <div class="addon-desc">${escapeHTML(a.desc)}</div>
        <div class="addon-footer">
          <span class="addon-price">${fmt(a.price)}</span>
          ${control}
        </div>
      </div>`;
  });
  container.innerHTML = html;
  
  const header = document.getElementById('addonHeader');
  const divider = document.getElementById('addonDivider');
  const show = filtered.length > 0;
  if (header) header.style.display = show ? 'flex' : 'none';
  if (divider) divider.style.display = show ? 'block' : 'none';
}

export function updateProgressBar(subtotal) {
  const container = document.getElementById('progressContainer');
  if (!container) return;
  if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) {
    container.style.display = 'none';
    return;
  }
  const remaining = SYSTEM.DISCOUNT_THRESHOLD - subtotal;
  container.style.display = 'block';
  document.getElementById('progressLabel').textContent = 'Tambah ' + fmt(remaining) + ' lagi untuk potongan Rp5.000';
  document.getElementById('progressPercent').textContent = Math.min(100, Math.round((subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100)) + '%';
  document.getElementById('progressFill').style.width = Math.min(100, Math.round((subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100)) + '%';
}

export function updateMissionCheckboxes(subtotal) {
  const ms = document.getElementById('missionSpend');
  const cs = document.getElementById('checkShare');
  if (ms) ms.checked = subtotal >= SYSTEM.DISCOUNT_THRESHOLD;
  if (cs) cs.checked = stateRef.hasShared;
}

export function renderCart() {
  if (!stateRef) return;
  
  const summary = getCartSummaryCached();
  updateProgressBar(summary.subtotal);
  updateMissionCheckboxes(summary.subtotal);
  
  const bar = document.getElementById('bottom-bar');
  const dl = document.getElementById('discountLabel');
  const te = document.getElementById('cartTotalDisplay');
  const footer = document.querySelector('.footer-brand');
  
  if (summary.totalQty > 0 && !stateRef.isCartMinimized) {
    if (bar) bar.classList.add('visible');
    if (footer) footer.style.paddingBottom = '180px';
    document.getElementById('cartPreview').textContent = summary.totalQty + ' item' + (summary.totalQty > 1 ? 's' : '');
    if (summary.discount > 0) {
      dl.style.display = 'inline-block';
      dl.textContent = '-Rp' + summary.discount.toLocaleString('id-ID');
      te.innerHTML = '<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;margin-right:4px;">' + fmt(summary.subtotal) + '</span>' + fmt(summary.total);
    } else {
      dl.style.display = 'none';
      te.textContent = fmt(summary.total);
    }
  } else {
    if (bar) bar.classList.remove('visible');
    if (footer) footer.style.paddingBottom = '0';
  }
  
  const floatBtn = document.getElementById('floatingCartBtn');
  if (floatBtn && bar) {
    if (bar.classList.contains('visible') && summary.totalQty > 0) {
      floatBtn.style.display = 'none';
    } else if (summary.totalQty > 0) {
      floatBtn.style.display = 'flex';
    } else {
      floatBtn.style.display = 'none';
    }
  }
  
  saveCart();
  updateFloatingButton();
}

export function renderMiniCart() {
  if (!stateRef) return;
  
  const summary = getCartSummaryCached();
  const list = document.getElementById('miniCartList');
  let html = '';
  
  if (summary.items.length === 0) {
    html = '<p style="color:var(--gray-500);text-align:center;padding:20px 0;">Keranjang kosong</p>';
  } else {
    summary.items.forEach(item => {
      const spiceText = item.spice ? ' (Level ' + item.spice + ')' : '';
      html += `
        <div class="mini-cart-item">
          <div class="mini-cart-info">
            <div class="mini-cart-name">${escapeHTML(item.name)}${spiceText}</div>
            <div class="mini-cart-detail">${fmt(item.price)}</div>
          </div>
          <div class="mini-cart-qty">
            <button data-action="decrease" data-id="${item.cartId}">−</button>
            <span>${item.qty}</span>
            <button data-action="increase" data-id="${item.cartId}">+</button>
            <button class="mini-cart-remove" data-action="remove" data-id="${item.cartId}">🗑️</button>
          </div>
        </div>`;
    });
  }
  list.innerHTML = html;
  
  const subtotalEl = document.getElementById('cartSubtotalDisplay');
  if (subtotalEl) subtotalEl.textContent = fmt(summary.subtotal);
  
  const step1Progress = document.getElementById('step1Progress');
  if (step1Progress && summary.items.length > 0) {
    let progressHTML = '';
    const remaining = SYSTEM.DISCOUNT_THRESHOLD - summary.subtotal;
    const progressPercent = Math.min(100, Math.round((summary.subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
    if (remaining > 0) {
      progressHTML += `
        <div style="background:white;border:1px solid var(--gray-200);border-radius:12px;padding:12px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;">
            <span>🎯 Tambah ${fmt(remaining)} lagi dapat potongan Rp5.000</span>
            <span style="color:var(--green);">${progressPercent}%</span>
          </div>
          <div style="width:100%;height:6px;background:var(--gray-200);border-radius:10px;overflow:hidden;">
            <div style="width:${progressPercent}%;height:100%;background:${progressPercent >= 80 ? 'var(--green)' : 'var(--red)'};border-radius:10px;transition:width 0.4s;"></div>
          </div>
        </div>`;
    } else {
      progressHTML += `
        <div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;margin-bottom:8px;">
          ✅ Diskon Rp5.000 aktif!
        </div>`;
    }
    if (!summary.isOutOfRange) {
      if (stateRef.shippingProvider === 'pembeli') {
        progressHTML += `
          <div style="background:white;border:1px solid var(--gold);border-radius:12px;padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#92400e;">
            💡 Pilih <strong>Kurir Rujak.Co</strong> untuk dapat subsidi pengiriman!
          </div>`;
      } else {
        if (summary.isSurge) {
          progressHTML += `
            <div style="background:#FFF3CD;border:1px solid #F4C430;border-radius:10px;padding:8px 10px;margin-bottom:8px;text-align:center;font-size:11px;font-weight:600;color:#92400e;">
              ⚡ Jam sibuk: tarif kurir sedang tinggi. Subsidi tetap berlaku maks. Rp30.000.
            </div>`;
        }
        if (summary.subtotal >= SYSTEM.SUBSIDY_TIER3) {
          const afterSubsidy = Math.max(0, summary.rawShippingCost - SYSTEM.MAX_SUBSIDY);
          if (afterSubsidy > 0) {
            progressHTML += `
              <div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">
                🚚 Gratis Ongkir (Maks. Subsidi Rp30.000) — Sisa ${fmt(afterSubsidy)}
              </div>`;
          } else {
            progressHTML += `
              <div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">
                🚚 Gratis Pengiriman!
              </div>`;
          }
        } else if (summary.subtotal >= SYSTEM.SUBSIDY_TIER2) {
          progressHTML += `
            <div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">
              ✅ Subsidi Pengiriman Rp10.000 aktif!
            </div>`;
        } else if (summary.subtotal >= SYSTEM.SUBSIDY_TIER1) {
          progressHTML += `
            <div style="background:white;border:1px solid var(--gold);border-radius:12px;padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#92400e;">
              🚀 Tambah ${fmt(SYSTEM.SUBSIDY_TIER2 - summary.subtotal)} lagi → Subsidi Rp10.000
            </div>`;
        } else {
          progressHTML += `
            <div style="background:white;border:1px solid var(--gray-200);border-radius:12px;padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:var(--gray-500);">
              📦 Tambah ${fmt(SYSTEM.SUBSIDY_TIER1 - summary.subtotal)} lagi → Subsidi Rp5.000
            </div>`;
        }
      }
    }
    step1Progress.innerHTML = progressHTML;
  }
  
  const step1Upsell = document.getElementById('step1Upsell');
  if (step1Upsell && summary.items.length > 0) {
    step1Upsell.innerHTML = renderAIUpsell(summary);
  }
  
  // Update step 2 fields
  const s2c = document.getElementById('step2ShippingCost');
  const s2d = document.getElementById('step2Distance');
  const s2z = document.getElementById('step2Zone');
  const s2s = document.getElementById('step2Subsidy');
  const s2b = document.getElementById('step2BaseCost');
  
  if (s2c && summary.shippingProvider === 'rujakco') {
    if (summary.isOutOfRange) {
      s2c.textContent = 'Konfirmasi Admin';
      if (s2z) s2z.textContent = summary.shippingLabel;
      if (s2s) s2s.style.display = 'none';
      if (s2b) s2b.style.display = 'none';
    } else {
      s2c.textContent = fmt(summary.shippingCost);
      if (s2z) s2z.textContent = summary.shippingLabel;
      if (s2b && summary.lalamoveCost > 0) {
        s2b.style.display = 'block';
        s2b.innerHTML = '🚚 Tarif Kurir: <strong>' + fmt(summary.lalamoveCost) + '</strong>' + (summary.isSurge ? ' <span style="font-size:10px;color:#D62828;">(⚡Jam Sibuk ' + summary.surgeMultiplier + 'x)</span>' : '');
      }
      if (s2s && summary.shippingSubsidy > 0) {
        s2s.style.display = 'block';
        s2s.innerHTML = '💰 Subsidi Rujak.Co: <strong style="color:var(--green);">-' + fmt(summary.shippingSubsidy) + '</strong>' + (summary.rawShippingCost - summary.shippingSubsidy > SYSTEM.MAX_SUBSIDY ? '(Maks. Rp30.000)' : '');
      } else if (s2s) {
        s2s.style.display = 'none';
      }
    }
  } else if (s2c && summary.shippingProvider === 'pembeli') {
    s2c.textContent = 'Gratis';
    if (s2z) s2z.textContent = 'Kurir Saya';
    if (s2s) s2s.style.display = 'none';
    if (s2b) s2b.style.display = 'none';
  }
  if (s2d) s2d.textContent = '~' + Math.ceil(summary.shippingDistance) + ' km';
  
  // Final summary
  const fSub = document.getElementById('finalSubtotal');
  if (fSub) fSub.textContent = fmt(summary.subtotal);
  
  const fDisc = document.getElementById('finalDiscount');
  if (fDisc) fDisc.textContent = summary.discount > 0 ? '-Rp' + summary.discount.toLocaleString('id-ID') : 'Rp0';
  
  const fShip = document.getElementById('finalShipping');
  if (fShip) fShip.textContent = summary.isOutOfRange ? 'Konfirmasi Admin' : fmt(summary.shippingCost);
  
  const fs = document.getElementById('finalSubsidy');
  if (fs && summary.shippingSubsidy > 0) {
    fs.style.display = 'flex';
    fs.innerHTML = '<span>Subsidi Pengiriman</span><span style="color:var(--green);">-' + fmt(summary.shippingSubsidy) + '</span>';
  } else if (fs) {
    fs.style.display = 'none';
  }
  
  const fTotal = document.getElementById('finalTotal');
  if (fTotal) fTotal.textContent = summary.isOutOfRange ? 'Konfirmasi' : fmt(summary.total);
  
  // Form fields
  const orderNotesEl = document.getElementById('orderNotes');
  if (orderNotesEl) orderNotesEl.value = stateRef.orderNotes;
  
  const customerNameEl = document.getElementById('customerName');
  if (customerNameEl) customerNameEl.value = stateRef.customerName;
  
  const customerPhoneEl = document.getElementById('customerPhone');
  if (customerPhoneEl) customerPhoneEl.value = stateRef.customerPhone;
  
  const customerAddressEl = document.getElementById('customerAddress');
  if (customerAddressEl) customerAddressEl.value = stateRef.customerAddress;
  
  const giftToggleEl = document.getElementById('giftToggle');
  if (giftToggleEl) giftToggleEl.checked = stateRef.isGift;
  
  const giftSenderEl = document.getElementById('giftSender');
  if (giftSenderEl) giftSenderEl.value = stateRef.giftSender;
  
  const giftMessageEl = document.getElementById('giftMessage');
  if (giftMessageEl) giftMessageEl.value = stateRef.giftMessage;
  
  const giftFieldsEl = document.getElementById('giftFields');
  if (giftFieldsEl) giftFieldsEl.style.display = stateRef.isGift ? 'block' : 'none';
  
  // Shipping options
  document.querySelectorAll('.ship-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.provider === stateRef.shippingProvider);
  });
  
  const ro = document.getElementById('rujakcoOptions');
  if (ro) ro.style.display = stateRef.shippingProvider === 'rujakco' ? 'block' : 'none';
  
  document.querySelectorAll('.veh-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.vehicle === stateRef.vehicleType);
  });
  
  const bp = document.getElementById('btnOpenPayment');
  if (!bp) return;
  
  const isKurirSendiri = stateRef.shippingProvider === 'pembeli';
  const isLocationPending = stateRef.userDistance === null && !isKurirSendiri;
  const isEmpty = summary.items.length === 0;
  const isOutOfRange = summary.isOutOfRange && !isKurirSendiri;
  
  if (isEmpty) {
    bp.disabled = true;
    bp.textContent = 'Keranjang kosong';
  } else if (isOutOfRange) {
    bp.disabled = true;
    bp.textContent = 'Admin Konfirmasi';
  } else if (isLocationPending) {
    bp.disabled = true;
    bp.textContent = '⏳ Mencari lokasi...';
  } else {
    bp.disabled = false;
    bp.textContent = '💳 Bayar Via QRIS';
  }
  
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

export function updateUI() {
  invalidateCache();
  renderMenu();
  renderAddons();
  renderCart();
  renderAIRecommendation();
  if (document.getElementById('miniCartModal') && document.getElementById('miniCartModal').classList.contains('active')) {
    renderMiniCart();
  }
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

window.updateUI = updateUI;