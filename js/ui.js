// ============================================================
// ================ UI RENDER FUNCTIONS =======================
// ============================================================

var addToCartLocked = false;

function lockAddToCart() {
  addToCartLocked = true;
  setTimeout(function() { addToCartLocked = false; }, 300);
}

function updateStoreStatus() {
  var el = document.getElementById('storeStatusText');
  var dot = document.querySelector('.status-dot');
  var container = document.getElementById('storeStatus');
  var banner = document.getElementById('storeStatusBanner');
  var bannerText = document.getElementById('storeStatusBannerText');
  
  if (!el) return;
  
  var now = new Date();
  var day = now.getDay();
  var hour = now.getHours();
  var minute = now.getMinutes();
  var timeInMinutes = hour * 60 + minute;
  
  var isOpen = false;
  var openTime = '10:00';
  var closeTime = '20:00';
  var dayName = 'Senin-Jumat';
  
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

function updateFloatingButton() {
  var btn = document.getElementById('floatingCartBtn');
  var badge = document.getElementById('floatingBadge');
  var summary = getCartSummaryCached();
  
  if (state.isCartMinimized && summary.totalQty > 0) {
    if (btn) btn.classList.add('visible');
    if (badge) badge.textContent = summary.totalQty;
  } else {
    if (btn) btn.classList.remove('visible');
  }
}

function renderMenu() {
  if (typeof state === 'undefined' || typeof PRODUCTS === 'undefined') return;
  
  var container = document.getElementById('menuList');
  var empty = document.getElementById('emptyState');
  var skeleton = document.getElementById('skeletonContainer');
  
  if (skeleton) skeleton.style.display = 'none';
  if (!container) return;
  container.style.display = 'block';
  
  if (state.activeFilter === 'addon') {
    container.innerHTML = '';
    if (empty) empty.style.display = 'none';
    return;
  }
  
  var filtered;
  if (state.searchQuery && state.searchQuery.length >= 2) {
    filtered = aiSearch(state.searchQuery);
  } else {
    filtered = PRODUCTS.filter(function(p) { return !p.isHidden; });
  }
  
  if (state.activeFilter !== 'all') {
    filtered = filtered.filter(function(p) { return p.cat === state.activeFilter; });
  }
  
  if (!filtered.length) {
    if (empty) empty.style.display = 'block';
    container.innerHTML = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  
  var html = '';
  filtered.forEach(function(p) {
    var qty = 0;
    var firstCartKey = p.id;
    var cartKeyRegex = new RegExp('^' + p.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(_spice\\d+)?$');
    Object.keys(state.cart).forEach(function(k) {
      if (cartKeyRegex.test(k)) {
        qty += state.cart[k].qty;
        if (qty === state.cart[k].qty) firstCartKey = k;
      }
    });
    
    var displayName = p.name;
    if (state.searchQuery && state.searchQuery.length >= 2) {
      var q = state.searchQuery.toLowerCase();
      var nameLower = p.name.toLowerCase();
      if (nameLower.indexOf(q) !== -1) {
        var idx = nameLower.indexOf(q);
        displayName = p.name.substring(0, idx) +
          '<span class="ai-search-highlight">' + p.name.substring(idx, idx + q.length) + '</span>' +
          p.name.substring(idx + q.length);
      }
    }
    
    var control = qty === 0 ?
      '<button type="button" class="add-btn" data-action="open-modal" data-id="' + p.id + '"><i data-lucide="plus" class="w-4 h-4"></i></button>' :
      '<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="' + firstCartKey + '">−</button><span class="qty-num">' + qty + '</span><button type="button" class="qty-btn" data-action="increase" data-id="' + firstCartKey + '">+</button></div>';
    
    var badgeRight = p.badge ? '<span class="item-badge-right ' + p.badgeColor + '">' + escapeHTML(p.badge) + '</span>' : '';
    var flavorTag = p.flavorTag ? '<span class="item-flavor-tag">' + escapeHTML(p.flavorTag) + '</span>' : '';
    var defaultSpice = p.defaultSpice || 3;
    var spiceIcons = Array(5).fill(null).map(function(_, i) {
      return i < defaultSpice ? '🌶️' : '<span style="opacity:0.25">🌶️</span>';
    }).join('');
    var buahChips = (p.buah || []).slice(0, 4).map(function(b) {
      return '<span class="item-buah-chip">' + escapeHTML(b) + '</span>';
    }).join('');
    var moreChips = (p.buah || []).length > 4 ? '<span class="item-buah-chip">+' + (p.buah.length - 4) + '</span>' : '';
    
    html += '' +
      '<div class="menu-item" data-id="' + p.id + '" tabindex="0" role="button" aria-label="Detail ' + escapeHTML(p.name) + '">' +
        '<div class="item-img-wrap">' +
          '<img src="' + p.thumbnail + '" alt="' + escapeHTML(p.name) + '" loading="lazy" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'; this.nextElementSibling.textContent=\'' + escapeHTML(p.name.substring(0, 20)) + '\'">' +
          '<div class="fallback" style="display:none;">' + escapeHTML(p.name.substring(0, 20)) + '</div>' +
        '</div>' +
        '<div class="item-body">' +
          '<div class="item-name-row"><span class="item-name">' + displayName + '</span>' + badgeRight + '</div>' +
          '<div class="item-flavor-row"><span class="item-flavor">' + escapeHTML(p.flavor) + '</span>' + flavorTag + '</div>' +
          '<div class="item-spice" style="display:flex;align-items:center;gap:4px;font-size:11px;">' +
            '<span style="font-size:10px;color:var(--gray-500);">Pedas:</span>' + spiceIcons +
            '<span style="font-size:10px;color:var(--gray-400);">(bisa diatur)</span>' +
          '</div>' +
          '<p class="item-desc">' + escapeHTML(p.desc) + '</p>' +
          '<div class="item-buah-chips">' + buahChips + moreChips + '</div>' +
          '<div class="item-footer">' +
            '<div><span class="item-price">' + fmt(p.price) + '</span><span class="item-portion"> · ' + p.portion + '</span></div>' +
            control +
          '</div>' +
        '</div>' +
      '</div>';
  });
  container.innerHTML = html;
}

function renderAddons() {
  if (typeof state === 'undefined' || typeof ADDONS === 'undefined') return;
  
  var container = document.getElementById('addonList');
  if (!container) return;
  
  var q = state.searchQuery.toLowerCase();
  var filtered = ADDONS.filter(function(a) {
    return a.name.toLowerCase().indexOf(q) !== -1 || a.desc.toLowerCase().indexOf(q) !== -1;
  });
  
  var html = '';
  filtered.forEach(function(a) {
    var entry = state.cart[a.id];
    var qty = entry ? entry.qty : 0;
    var control = qty === 0 ?
      '<button type="button" class="addon-add" data-action="add-addon" data-id="' + a.id + '"><i data-lucide="plus" class="w-4 h-4"></i></button>' :
      '<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="' + a.id + '">−</button><span class="qty-num">' + qty + '</span><button type="button" class="qty-btn" data-action="increase" data-id="' + a.id + '">+</button></div>';
    html += '' +
      '<div class="addon-card">' +
        '<div class="addon-icon ' + a.iconColor + '"><i data-lucide="' + a.icon + '" class="w-6 h-6"></i></div>' +
        '<div class="addon-name">' + escapeHTML(a.name) + '</div>' +
        '<div class="addon-desc">' + escapeHTML(a.desc) + '</div>' +
        '<div class="addon-footer">' +
          '<span class="addon-price">' + fmt(a.price) + '</span>' +
          control +
        '</div>' +
      '</div>';
  });
  container.innerHTML = html;
  
  var header = document.getElementById('addonHeader');
  var divider = document.getElementById('addonDivider');
  var show = filtered.length > 0;
  if (header) header.style.display = show ? 'flex' : 'none';
  if (divider) divider.style.display = show ? 'block' : 'none';
}

function updateProgressBar(subtotal) {
  var container = document.getElementById('progressContainer');
  if (!container) return;
  if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) {
    container.style.display = 'none';
    return;
  }
  var remaining = SYSTEM.DISCOUNT_THRESHOLD - subtotal;
  container.style.display = 'block';
  document.getElementById('progressLabel').textContent = 'Tambah ' + fmt(remaining) + ' lagi untuk potongan Rp5.000';
  document.getElementById('progressPercent').textContent = Math.min(100, Math.round((subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100)) + '%';
  document.getElementById('progressFill').style.width = Math.min(100, Math.round((subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100)) + '%';
}

function updateMissionCheckboxes(subtotal) {
  var ms = document.getElementById('missionSpend');
  var cs = document.getElementById('checkShare');
  if (ms) ms.checked = subtotal >= SYSTEM.DISCOUNT_THRESHOLD;
  if (cs) cs.checked = state.hasShared;
}

function renderCart() {
  if (typeof state === 'undefined') return;
  
  var summary = getCartSummaryCached();
  updateProgressBar(summary.subtotal);
  updateMissionCheckboxes(summary.subtotal);
  
  var bar = document.getElementById('bottom-bar');
  var dl = document.getElementById('discountLabel');
  var te = document.getElementById('cartTotalDisplay');
  var footer = document.querySelector('.footer-brand');
  
  if (summary.totalQty > 0 && !state.isCartMinimized) {
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
  
  var floatBtn = document.getElementById('floatingCartBtn');
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

function renderMiniCart() {
  if (typeof state === 'undefined') return;
  
  var summary = getCartSummaryCached();
  var list = document.getElementById('miniCartList');
  var html = '';
  
  if (summary.items.length === 0) {
    html = '<p style="color:var(--gray-500);text-align:center;padding:20px 0;">Keranjang kosong</p>';
  } else {
    summary.items.forEach(function(item) {
      var spiceText = item.spice ? ' (Level ' + item.spice + ')' : '';
      html += '' +
        '<div class="mini-cart-item">' +
          '<div class="mini-cart-info">' +
            '<div class="mini-cart-name">' + escapeHTML(item.name) + spiceText + '</div>' +
            '<div class="mini-cart-detail">' + fmt(item.price) + '</div>' +
          '</div>' +
          '<div class="mini-cart-qty">' +
            '<button data-action="decrease" data-id="' + item.cartId + '">−</button>' +
            '<span>' + item.qty + '</span>' +
            '<button data-action="increase" data-id="' + item.cartId + '">+</button>' +
            '<button class="mini-cart-remove" data-action="remove" data-id="' + item.cartId + '">🗑️</button>' +
          '</div>' +
        '</div>';
    });
  }
  list.innerHTML = html;
  
  var subtotalEl = document.getElementById('cartSubtotalDisplay');
  if (subtotalEl) subtotalEl.textContent = fmt(summary.subtotal);
  
  var step1Progress = document.getElementById('step1Progress');
  if (step1Progress && summary.items.length > 0) {
    var progressHTML = '';
    var remaining = SYSTEM.DISCOUNT_THRESHOLD - summary.subtotal;
    var progressPercent = Math.min(100, Math.round((summary.subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100));
    if (remaining > 0) {
      progressHTML += '' +
        '<div style="background:white;border:1px solid var(--gray-200);border-radius:12px;padding:12px;margin-bottom:8px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;">' +
            '<span>🎯 Tambah ' + fmt(remaining) + ' lagi dapat potongan Rp5.000</span>' +
            '<span style="color:var(--green);">' + progressPercent + '%</span>' +
          '</div>' +
          '<div style="width:100%;height:6px;background:var(--gray-200);border-radius:10px;overflow:hidden;">' +
            '<div style="width:' + progressPercent + '%;height:100%;background:' + (progressPercent >= 80 ? 'var(--green)' : 'var(--red)') + ';border-radius:10px;transition:width 0.4s;"></div>' +
          '</div>' +
        '</div>';
    } else {
      progressHTML += '' +
        '<div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;margin-bottom:8px;">' +
          '✅ Diskon Rp5.000 aktif!' +
        '</div>';
    }
    if (!summary.isOutOfRange) {
      if (state.shippingProvider === 'pembeli') {
        progressHTML += '' +
          '<div style="background:white;border:1px solid var(--gold);border-radius:12px;padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#92400e;">' +
            '💡 Pilih <strong>Kurir Rujak.Co</strong> untuk dapat subsidi pengiriman!' +
          '</div>';
      } else {
        if (summary.isSurge) {
          progressHTML += '' +
            '<div style="background:#FFF3CD;border:1px solid #F4C430;border-radius:10px;padding:8px 10px;margin-bottom:8px;text-align:center;font-size:11px;font-weight:600;color:#92400e;">' +
              '⚡ Jam sibuk: tarif kurir sedang tinggi. Subsidi tetap berlaku maks. Rp30.000.' +
            '</div>';
        }
        if (summary.subtotal >= SYSTEM.SUBSIDY_TIER3) {
          var afterSubsidy = Math.max(0, summary.rawShippingCost - SYSTEM.MAX_SUBSIDY);
          if (afterSubsidy > 0) {
            progressHTML += '' +
              '<div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">' +
                '🚚 Gratis Ongkir (Maks. Subsidi Rp30.000) — Sisa ' + fmt(afterSubsidy) +
              '</div>';
          } else {
            progressHTML += '' +
              '<div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">' +
                '🚚 Gratis Pengiriman!' +
              '</div>';
          }
        } else if (summary.subtotal >= SYSTEM.SUBSIDY_TIER2) {
          progressHTML += '' +
            '<div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">' +
              '✅ Subsidi Pengiriman Rp10.000 aktif!' +
            '</div>';
        } else if (summary.subtotal >= SYSTEM.SUBSIDY_TIER1) {
          progressHTML += '' +
            '<div style="background:white;border:1px solid var(--gold);border-radius:12px;padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#92400e;">' +
              '🚀 Tambah ' + fmt(SYSTEM.SUBSIDY_TIER2 - summary.subtotal) + ' lagi → Subsidi Rp10.000' +
            '</div>';
        } else {
          progressHTML += '' +
            '<div style="background:white;border:1px solid var(--gray-200);border-radius:12px;padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:var(--gray-500);">' +
              '📦 Tambah ' + fmt(SYSTEM.SUBSIDY_TIER1 - summary.subtotal) + ' lagi → Subsidi Rp5.000' +
            '</div>';
        }
      }
    }
    step1Progress.innerHTML = progressHTML;
  }
  
  var step1Upsell = document.getElementById('step1Upsell');
  if (step1Upsell && summary.items.length > 0) {
    step1Upsell.innerHTML = renderAIUpsell(summary);
  }
  
  // Update step 2 fields
  var s2c = document.getElementById('step2ShippingCost');
  var s2d = document.getElementById('step2Distance');
  var s2z = document.getElementById('step2Zone');
  var s2s = document.getElementById('step2Subsidy');
  var s2b = document.getElementById('step2BaseCost');
  
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
  var fSub = document.getElementById('finalSubtotal');
  if (fSub) fSub.textContent = fmt(summary.subtotal);
  
  var fDisc = document.getElementById('finalDiscount');
  if (fDisc) fDisc.textContent = summary.discount > 0 ? '-Rp' + summary.discount.toLocaleString('id-ID') : 'Rp0';
  
  var fShip = document.getElementById('finalShipping');
  if (fShip) fShip.textContent = summary.isOutOfRange ? 'Konfirmasi Admin' : fmt(summary.shippingCost);
  
  var fs = document.getElementById('finalSubsidy');
  if (fs && summary.shippingSubsidy > 0) {
    fs.style.display = 'flex';
    fs.innerHTML = '<span>Subsidi Pengiriman</span><span style="color:var(--green);">-' + fmt(summary.shippingSubsidy) + '</span>';
  } else if (fs) {
    fs.style.display = 'none';
  }
  
  var fTotal = document.getElementById('finalTotal');
  if (fTotal) fTotal.textContent = summary.isOutOfRange ? 'Konfirmasi' : fmt(summary.total);
  
  // Form fields
  var orderNotesEl = document.getElementById('orderNotes');
  if (orderNotesEl) orderNotesEl.value = state.orderNotes;
  
  var customerNameEl = document.getElementById('customerName');
  if (customerNameEl) customerNameEl.value = state.customerName;
  
  var customerPhoneEl = document.getElementById('customerPhone');
  if (customerPhoneEl) customerPhoneEl.value = state.customerPhone;
  
  var customerAddressEl = document.getElementById('customerAddress');
  if (customerAddressEl) customerAddressEl.value = state.customerAddress;
  
  var giftToggleEl = document.getElementById('giftToggle');
  if (giftToggleEl) giftToggleEl.checked = state.isGift;
  
  var giftSenderEl = document.getElementById('giftSender');
  if (giftSenderEl) giftSenderEl.value = state.giftSender;
  
  var giftMessageEl = document.getElementById('giftMessage');
  if (giftMessageEl) giftMessageEl.value = state.giftMessage;
  
  var giftFieldsEl = document.getElementById('giftFields');
  if (giftFieldsEl) giftFieldsEl.style.display = state.isGift ? 'block' : 'none';
  
  // Shipping options
  document.querySelectorAll('.ship-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.provider === state.shippingProvider);
  });
  
  var ro = document.getElementById('rujakcoOptions');
  if (ro) ro.style.display = state.shippingProvider === 'rujakco' ? 'block' : 'none';
  
  document.querySelectorAll('.veh-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.vehicle === state.vehicleType);
  });
  
  var bp = document.getElementById('btnOpenPayment');
  if (!bp) return;
  
  var isKurirSendiri = state.shippingProvider === 'pembeli';
  var isLocationPending = state.userDistance === null && !isKurirSendiri;
  var isEmpty = summary.items.length === 0;
  var isOutOfRange = summary.isOutOfRange && !isKurirSendiri;
  
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

function updateUI() {
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