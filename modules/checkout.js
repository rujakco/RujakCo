// modules/checkout.js
import { SYSTEM } from '../data/config.js';
import { fmt, showToast, getSupabase } from '../utils/helpers.js';
import { getDistance, calculateShipping } from './shipping.js';

let checkoutLocked = false;

export function validatePhone(phone) {
  return /^[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));
}

export function validateAddress(address) {
  return address.trim().length >= 20;
}

export function processPayment(cart, state, updateUI) {
  return function(e) {
    const name = document.getElementById('customerName')?.value.trim();
    const phone = document.getElementById('customerPhone')?.value.trim();
    const address = document.getElementById('customerAddress')?.value.trim();
    const districtInput = document.getElementById('districtInput')?.value.trim();

    if (!name) { showToast('Mohon isi nama penerima.'); return; }
    if (!validatePhone(phone)) { showToast('Nomor HP tidak valid (min 10 digit).'); return; }
    if (!validateAddress(address)) { showToast('Alamat terlalu pendek (min 20 karakter).'); return; }
    if (!state.selectedDistrict && !state.userDistance) { showToast('Mohon pilih kecamatan.'); return; }

    state.customerPhone = phone;
    state.customerAddress = address;

    const sum = getCartSummary(cart);
    const dist = state.selectedDistrict ? getDistance(state.selectedDistrict) || 10 : (state.userDistance || 2);
    const ship = calculateShipping(dist, sum.mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority);
    const total = sum.subtotal + (ship.cost || 0);

    document.getElementById('paymentTotalDisplay').textContent = fmt(total);
    const pModal = document.getElementById('paymentModal');
    pModal.classList.add('active');
    pModal.setAttribute('aria-hidden', 'false');
  };
}

export function confirmOrder(cart, state, updateUI) {
  return function(e) {
    if (checkoutLocked) return;
    checkoutLocked = true;
    const sum = getCartSummary(cart);
    const dist = state.selectedDistrict ? getDistance(state.selectedDistrict) || 10 : (state.userDistance || 2);
    const ship = calculateShipping(dist, sum.mainProductQty || 1, state.shippingProvider, state.vehicleType, state.isPriority);
    const orderId = 'RJ' + Date.now().toString(36).toUpperCase().slice(-6);
    const timeDel = document.getElementById('deliveryTime')?.value || 'Esok Hari';
    const notes = document.getElementById('orderNotes')?.value || '-';

    let msg = `*RESERVASI RUJAK.CO*\n\nID: #${orderId}\nKlien: ${state.customerName}\nAlamat: ${state.customerAddress}\nJam: ${timeDel}\nCatatan: ${notes}\n\n*Kurasi:*\n`;
    sum.items.forEach(i => msg += `- ${i.name} ${i.spice?'(Lv '+i.spice+')':''} x${i.qty}\n`);
    msg += `\nSajian: ${fmt(sum.subtotal)}\nLogistik: ${fmt(ship.cost)}\n*TOTAL: ${fmt(sum.subtotal + (ship.cost||0))}*\n\n(Mohon lampirkan struk validasi QRIS)`;

    const client = getSupabase();
    if (client) {
      client.from('orders').insert([{
        order_id: orderId,
        customer_name: state.customerName,
        customer_phone: state.customerPhone,
        customer_address: state.customerAddress,
        items: sum.items,
        total: sum.subtotal + (ship.cost || 0),
        status: 'pending'
      }]).then(({ error }) => { if (error) console.error(error); });
    }

    setTimeout(() => {
      checkoutLocked = false;
      window.open('https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
      // Kosongkan cart
      Object.keys(cart).forEach(key => delete cart[key]);
      updateUI();
      document.getElementById('paymentModal').classList.remove('active');
      document.getElementById('miniCartModal').classList.remove('active');
      document.body.style.overflow = '';
    }, 500);
  };
}

// Helper
function getCartSummary(cart) {
  // Sama seperti di render, sebaiknya di-export dari render.js
  // Untuk menghindari duplikasi, kita import dari render atau kita tulis ulang.
  // Karena kita ingin mandiri, kita tulis ulang sederhana.
  const items = []; let subtotal = 0, mainProductQty = 0;
  // Import PRODUCTS secara lokal (dari data/products.js)
  // Tapi untuk menghindari circular, kita bisa gunakan window.PRODUCTS
  const PRODUCTS = window.PRODUCTS || [];
  Object.keys(cart).forEach(id => {
    const entry = cart[id];
    const pid = id.split('_spice')[0];
    const product = PRODUCTS.find(p => p.id === pid);
    if (product && entry && entry.qty > 0) {
      subtotal += product.price * entry.qty;
      mainProductQty += entry.qty;
      items.push({ cartId: id, id: pid, name: product.name, price: product.price, qty: entry.qty, spice: entry.spice });
    }
  });
  return { items, subtotal, mainProductQty };
}