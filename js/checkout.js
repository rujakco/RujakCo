// ============================================================
// ================ CHECKOUT & PAYMENT ========================
// ============================================================

var checkoutLocked = false;
var checkoutTimer = null;

function showOrderConfirmation() {
  if (typeof state === 'undefined') return;
  
  state.cart = {};
  if (typeof invalidateCache === 'function') invalidateCache();
  if (typeof saveCart === 'function') saveCart();
  if (typeof updateUI === 'function') updateUI();
  
  var orderNumber = 'RJ' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase();
  
  var modal = document.createElement('div');
  modal.id = 'orderConfirmationModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease;';
  modal.innerHTML = '' +
    '<div style="background:white;border-radius:20px;padding:32px 24px;max-width:360px;width:90%;text-align:center;animation:scaleIn 0.3s ease;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
      '<div style="font-size:56px;margin-bottom:8px;">✅</div>' +
      '<h3 style="font-size:20px;font-weight:800;color:#0F4D37;margin:0 0 4px;">Pesanan Terkirim!</h3>' +
      '<p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 12px;">' +
        'Kami akan konfirmasi pesanan kamu dalam <strong>15-30 menit</strong> via WhatsApp.' +
      '</p>' +
      '<div style="background:#E8F5E9;border-radius:12px;padding:10px;font-size:12px;color:#0F4D37;margin-bottom:12px;border:1px solid #C8E6C9;">' +
        '📋 <strong>Order #' + orderNumber + '</strong>' +
      '</div>' +
      '<div style="font-size:11px;color:#999;margin-bottom:16px;">' +
        '💬 Cek WhatsApp kamu untuk konfirmasi dari tim Rujak.Co' +
      '</div>' +
      '<button onclick="document.getElementById(\'orderConfirmationModal\').remove()" style="background:#0F4D37;color:white;border:none;padding:12px 32px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background=\'#1a7a55\'" onmouseout="this.style.background=\'#0F4D37\'">' +
        'Kembali ke Menu' +
      '</button>' +
    '</div>';
  document.body.appendChild(modal);
  
  if (!document.getElementById('confirmationStyles')) {
    var style = document.createElement('style');
    style.id = 'confirmationStyles';
    style.textContent = '@keyframes fadeIn { from { opacity:0; } to { opacity:1; } } @keyframes scaleIn { from { transform:scale(0.9); opacity:0; } to { transform:scale(1); opacity:1; } }';
    document.head.appendChild(style);
  }
  
  setTimeout(function() {
    var el = document.getElementById('orderConfirmationModal');
    if (el) el.remove();
  }, 8000);
}

function saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount) {
  if (typeof getSupabase === 'undefined') {
    return Promise.resolve(false);
  }
  
  return getSupabase().then(function(client) {
    if (!client) {
      console.warn('⚠️ Supabase belum siap');
      return false;
    }
    try {
      var payload = {
        customer_name: (state.customerName || 'Guest').substring(0, 50),
        customer_phone: state.customerPhone || '',
        customer_address: (state.customerAddress || '').substring(0, 500),
        items: orderItems.map(function(item) {
          var rest = Object.assign({}, item);
          delete rest.cartId;
          return rest;
        }),
        subtotal: subtotal,
        shipping_cost: shippingCost,
        discount: discount,
        total: total,
        status: 'pending',
        is_gift: state.isGift || false,
        gift_sender: (state.giftSender || '').substring(0, 50),
        gift_message: (state.giftMessage || '').substring(0, 300),
        mission_shared: state.hasShared || false,
        shipping_provider: state.shippingProvider || 'rujakco',
        vehicle: state.vehicleType || 'motor',
        priority: state.isPriority || false
      };
      return client.from('orders').insert([payload]).then(function(result) {
        if (result.error) throw result.error;
        return true;
      });
    } catch(err) {
      console.error('Supabase error:', err);
      return false;
    }
  });
}

function handleCheckout() {
  if (typeof state === 'undefined') return;
  if (checkoutLocked) {
    showToast('⏳ Pesanan sedang diproses...');
    return;
  }
  
  var lastOrderTime = localStorage.getItem('last_order');
  if (lastOrderTime && Date.now() - parseInt(lastOrderTime) < 30000) {
    showToast('⏳ Tunggu ' + Math.ceil((30000 - (Date.now() - parseInt(lastOrderTime))) / 1000) + ' detik');
    return;
  }
  
  var summary = getCartSummaryCached();
  if (summary.isOutOfRange && state.shippingProvider !== 'pembeli') {
    showToast('Maaf, area Anda di luar jangkauan.');
    return;
  }
  
  var name = state.customerName.trim();
  var phone = state.customerPhone.trim();
  var address = state.customerAddress.trim();
  
  if (!name || name.length < 2) {
    showToast('❌ Nama tidak valid');
    var nameEl = document.getElementById('customerName');
    if (nameEl) nameEl.focus();
    return;
  }
  
  var phoneRegex = /^(08\d{8,11}|\+628\d{8,10}|628\d{8,10})$/;
  var cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleanedPhone) {
    showToast('❌ Nomor HP wajib diisi');
    var phoneEl = document.getElementById('customerPhone');
    if (phoneEl) phoneEl.focus();
    return;
  }
  if (!phoneRegex.test(cleanedPhone)) {
    showToast('❌ Format: 08xx, +628xx, atau 628xx');
    var phoneEl2 = document.getElementById('customerPhone');
    if (phoneEl2) phoneEl2.focus();
    return;
  }
  
  var normalizedPhone = normalizePhone(cleanedPhone);
  if (!address || address.length < 5) {
    showToast('❌ Alamat tidak valid');
    var addressEl = document.getElementById('customerAddress');
    if (addressEl) addressEl.focus();
    return;
  }
  
  state.customerAddress = address;
  if (summary.items.length === 0) {
    showToast('Keranjang kosong');
    return;
  }
  state.customerPhone = normalizedPhone;
  state.customerName = name;
  
  localStorage.setItem('last_order', Date.now());
  localStorage.setItem('last_order_pending', 'true');
  
  checkoutLocked = true;
  var payBtn = document.querySelector('[data-action="confirm-wa"]');
  if (payBtn) {
    payBtn.textContent = '⏳ Menyimpan...';
    payBtn.disabled = true;
  }
  
  if (checkoutTimer) clearTimeout(checkoutTimer);
  checkoutTimer = setTimeout(function() {
    checkoutLocked = false;
    if (payBtn) {
      payBtn.textContent = '💳 Kirim Bukti Transfer';
      payBtn.disabled = false;
    }
    checkoutTimer = null;
  }, 5000);
  
  saveOrderToDatabase(summary.items, summary.total, summary.subtotal, summary.shippingCost, summary.discount)
    .then(function(saved) {
      showToast(saved ? '✅ Pesanan tersimpan!' : '⚠️ Lanjut WhatsApp');
      if (typeof recordOrderHistory === 'function') {
        recordOrderHistory(summary.items);
      }
      
      setTimeout(function() {
        var msg = 'Halo Rujak.Co! Saya ingin memesan:\n\n';
        summary.items.forEach(function(item) {
          msg += '• ' + item.name + (item.spice ? ' (Level ' + item.spice + ')' : '') + ' (x' + item.qty + ') — ' + fmt(item.lineTotal) + '\n';
        });
        if (state.orderNotes) msg += '\n*Catatan:*\n' + state.orderNotes + '\n';
        if (state.isGift) {
          msg += '\n🎁 *KADO*\n';
          if (state.giftSender) msg += 'Dari: ' + state.giftSender + '\n';
          if (state.giftMessage) msg += 'Ucapan: ' + state.giftMessage + '\n';
        }
        msg += '\n*Pengiriman:* ' + (state.shippingProvider === 'pembeli' ? 'Kurir Saya' : 'Kurir Rujak.Co - ' + state.vehicleType + (state.isPriority ? ' (Prioritas)' : ''));
        msg += '\n*Data:*\nNama: ' + name + '\nNo. HP: ' + normalizedPhone + '\nAlamat: ' + address + '\n';
        if (state.shippingProvider === 'rujakco') {
          msg += '\nBiaya Pengantaran: ' + fmt(summary.rawShippingCost) + ' (' + summary.shippingLabel + ')';
          if (summary.lalamoveCost > 0) msg += '\n  └ Tarif Kurir: ' + fmt(summary.lalamoveCost);
          if (summary.shippingSubsidy > 0) msg += '\n  └ Subsidi: -' + fmt(summary.shippingSubsidy);
          msg += '\n  └ Total Bayar: ' + fmt(summary.shippingCost);
        }
        msg += '\nSubtotal: ' + fmt(summary.subtotal);
        if (summary.discount > 0) msg += '\nDiskon: -' + fmt(summary.discount);
        msg += '\n*Total Akhir: ' + fmt(summary.total) + '*\n\n*Saya sudah transfer via QRIS, ini buktinya:*\n*(sertakan foto)*';
        
        openWhatsApp(SYSTEM.WA_NUMBER, msg);
        setTimeout(showOrderConfirmation, 1500);
      }, 3500);
    })
    .catch(function() {
      showToast('⚠️ Gagal menyimpan, coba lagi');
      checkoutLocked = false;
      if (checkoutTimer) {
        clearTimeout(checkoutTimer);
        checkoutTimer = null;
      }
      if (payBtn) {
        payBtn.textContent = '💳 Kirim Bukti Transfer';
        payBtn.disabled = false;
      }
    });
}