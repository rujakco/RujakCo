import { SYSTEM } from '../data/config.js';
import { PRODUCTS } from '../data/products.js';
import { fmt, showToast, getSupabase } from '../utils/helpers.js';
import { getDistance, calculateShipping } from './shipping.js';

let checkoutLocked = false;

// --- Shared helper ---
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
    items.push({
      cartId: key,
      id: pid,
      name: product.name,
      price: product.price,
      qty,
      spice: entry.spice
    });
  });

  return { items, subtotal, mainProductQty };
}

// --- Validators ---
export function validatePhone(phone) {
  return /^[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));
}

export function validateAddress(address) {
  return address.trim().length >= 20;
}

// --- Payment ---
export function processPayment(cart, state, updateUI) {
  return function (e) {
    const name = document.getElementById('customerName')?.value.trim();
    const phone = document.getElementById('customerPhone')?.value.trim();
    const address = document.getElementById('customerAddress')?.value.trim();

    if (!name) { showToast('Mohon isi nama penerima.'); return; }
    if (!validatePhone(phone)) { showToast('Nomor HP tidak valid (min 10 digit).'); return; }
    if (!validateAddress(address)) { showToast('Alamat terlalu pendek (min 20 karakter).'); return; }
    if (!state.selectedDistrict && !state.userDistance) { showToast('Mohon pilih kecamatan.'); return; }

    state.customerPhone = phone;
    state.customerAddress = address;

    const sum = getCartSummary(cart);
    const dist = state.selectedDistrict
      ? getDistance(state.selectedDistrict) || SYSTEM.DEFAULT_DISTANCE
      : state.userDistance || SYSTEM.DEFAULT_DISTANCE;

    const ship = calculateShipping(
      dist,
      sum.mainProductQty || 1,
      state.shippingProvider,
      state.vehicleType,
      state.isPriority
    );

    const total = sum.subtotal + (ship.cost || 0);
    document.getElementById('paymentTotalDisplay').textContent = fmt(total);

    const pModal = document.getElementById('paymentModal');
    if (pModal) {
      pModal.classList.add('active');
      pModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };
}

// --- Confirm Order ---
export function confirmOrder(cart, state, updateUI) {
  return function (e) {
    if (checkoutLocked) return;
    checkoutLocked = true;

    const sum = getCartSummary(cart);
    const dist = state.selectedDistrict
      ? getDistance(state.selectedDistrict) || SYSTEM.DEFAULT_DISTANCE
      : state.userDistance || SYSTEM.DEFAULT_DISTANCE;

    const ship = calculateShipping(
      dist,
      sum.mainProductQty || 1,
      state.shippingProvider,
      state.vehicleType,
      state.isPriority
    );

    const orderId = 'RJ' + Date.now().toString(36).toUpperCase().slice(-6);
    const timeDel = document.getElementById('deliveryTime')?.value || 'Esok Hari';
    const notes = document.getElementById('orderNotes')?.value || '-';
    const total = sum.subtotal + (ship.cost || 0);

    let msg = `*RESERVASI RUJAK.CO*\n\n`;
    msg += `ID: #${orderId}\n`;
    msg += `Klien: ${state.customerName}\n`;
    msg += `Alamat: ${state.customerAddress}\n`;
    msg += `Jam: ${timeDel}\n`;
    msg += `Catatan: ${notes}\n\n`;
    msg += `*Kurasi:*\n`;
    sum.items.forEach(i => {
      msg += `- ${i.name}${i.spice ? ' (Lv ' + i.spice + ')' : ''} x${i.qty}\n`;
    });
    msg += `\nSajian: ${fmt(sum.subtotal)}\n`;
    msg += `Logistik: ${fmt(ship.cost)}\n`;
    msg += `*TOTAL: ${fmt(total)}*\n\n`;
    msg += `(Mohon lampirkan struk validasi QRIS)`;

    // Buka WA tanpa delay
    window.open('https://wa.me/' + SYSTEM.WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');

    // Optional Supabase logging
    const client = getSupabase();
    if (client) {
      client.from('orders').insert([{
        order_id: orderId,
        customer_name: state.customerName,
        customer_phone: state.customerPhone,
        customer_address: state.customerAddress,
        items: sum.items,
        total,
        status: 'pending'
      }]).then(({ error }) => {
        if (error) console.error('Supabase insert error:', error);
      });
    }

    // Reset cart setelah jeda
    setTimeout(() => {
      checkoutLocked = false;
      Object.keys(cart).forEach(key => delete cart[key]);
      updateUI();
      document.getElementById('paymentModal')?.classList.remove('active');
      document.getElementById('miniCartModal')?.classList.remove('active');
      document.body.style.overflow = '';
    }, 500);
  };
}