import { getSupabase } from '../utils/helpers.js';
import { logError, logInfo, logWarn } from '../utils/logger.js';

const TABLE_NAME = 'orders';
const STATUS_LABELS = {
  pending_payment: 'Menunggu Pembayaran',
  paid: 'Dibayar — Dipersiapkan',
  prepping: 'Fresh-Prep Sedang Berjalan',
  delivering: 'Dalam Pengantaran',
  completed: 'Selesai',
  cancelled: 'Dibatalkan'
};
const STATUS_FLOW = ['pending_payment', 'paid', 'prepping', 'delivering', 'completed', 'cancelled'];
const SELECT_FIELDS = 'order_code, status, customer_name, total, items, created_at, delivery_time, shipping_provider, shipping_cost, payment_method, payment_status';

function isValidOrderCode(code) { return typeof code === 'string' && code.trim().length >= 4 && code.trim().length <= 20; }
function isValidPin(pin) { return typeof pin === 'string' && /^\d{6}$/.test(pin); }
function sanitizeString(str) { return typeof str === 'string' ? str.trim() : ''; }
function getStatusLabel(status) { return STATUS_LABELS[status] || status || 'Status tidak diketahui'; }

function formatOrderData(data) {
  return {
    code: data.order_code,
    status: data.status,
    statusLabel: getStatusLabel(data.status),
    customerName: data.customer_name || 'Pelanggan',
    total: Number(data.total) || 0,
    itemCount: Array.isArray(data.items) ? data.items.length : 0,
    createdAt: data.created_at,
    deliveryTime: data.delivery_time || null,
    provider: data.shipping_provider || 'Tidak diketahui',
    shippingFee: data.shipping_cost || 0,   // ✅ perbaikan: shipping_cost, bukan shipping_fee
    paymentMethod: data.payment_method || null,
    paymentStatus: data.payment_status || null,
    items: Array.isArray(data.items) ? data.items.slice(0, 5) : []
  };
}

export async function trackOrder(orderCode, pin) {
  const cleanCode = sanitizeString(orderCode);
  const cleanPin = sanitizeString(pin);
  if (!isValidOrderCode(cleanCode)) return { success: false, message: 'Kode order tidak valid. Harap periksa kembali.' };
  if (!isValidPin(cleanPin)) return { success: false, message: 'PIN harus terdiri dari 6 digit angka.' };
  try {
    const sb = getSupabase();
    if (!sb) throw new Error('Database client tidak tersedia');
    const { data, error } = await sb
      .from(TABLE_NAME)
      .select(SELECT_FIELDS)
      .eq('order_code', cleanCode)
      .eq('access_pin', cleanPin)
      .maybeSingle();
    if (error) {
      logError('order-tracker', error, { orderCode: cleanCode });
      return { success: false, message: 'Terjadi kesalahan sistem. Silakan coba lagi nanti.' };
    }
    if (!data) {
      logWarn('order-tracker', 'Order not found or PIN mismatch', { orderCode: cleanCode });
      return { success: false, message: 'Kode order atau PIN tidak valid. Harap periksa kembali.' };
    }
    logInfo('order-tracker', `Order tracked successfully: ${cleanCode}`);
    return { success: true, order: formatOrderData(data) };
  } catch (error) {
    logError('order-tracker', error, { orderCode: cleanCode });
    return { success: false, message: 'Terjadi kesalahan. Silakan coba lagi atau hubungi customer service.' };
  }
}

export function generatePIN() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(1);
    let pin = '';
    while (pin.length < 6) {
      window.crypto.getRandomValues(arr);
      const digit = arr[0] % 10;
      pin += digit;
    }
    return pin;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidStatus(status) { return STATUS_LABELS.hasOwnProperty(status); }
export function getNextStatus(currentStatus) {
  const idx = STATUS_FLOW.indexOf(currentStatus);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}
export function getStatusLabels() { return { ...STATUS_LABELS }; }

export async function getOrderByCode(orderCode) {
  const cleanCode = sanitizeString(orderCode);
  if (!isValidOrderCode(cleanCode)) return null;
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from(TABLE_NAME)
      .select(SELECT_FIELDS)
      .eq('order_code', cleanCode)
      .maybeSingle();
    if (error || !data) return null;
    return formatOrderData(data);
  } catch {
    return null;
  }
}

export default { trackOrder, generatePIN, isValidStatus, getNextStatus, getStatusLabels, getOrderByCode };