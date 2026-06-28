// ============================================================
// ================ CART MANAGEMENT ============================
// ============================================================

import { fmt, escapeHTML } from './utils.js';
import { SYSTEM, calculateShipping, calculateSubsidy } from './shipping.js';

// State reference
export let stateRef = null;

export function setStateRef(state) {
  stateRef = state;
}

// Products reference
export let productsRef = [];
export let addonsRef = [];

export function setProductsRef(products, addons) {
  productsRef = products;
  addonsRef = addons;
}

export function loadCart() {
  try {
    const s = localStorage.getItem('rujak_cart');
    if (s) {
      const p = JSON.parse(s);
      if (typeof p === 'object' && p !== null && stateRef) {
        stateRef.cart = p;
      }
    }
  } catch (_) {
    if (stateRef) stateRef.cart = {};
  }
}

export function saveCart() {
  try {
    if (stateRef) {
      localStorage.setItem('rujak_cart', JSON.stringify(stateRef.cart));
    }
  } catch (_) {}
}

export function getItemById(id) {
  if (!productsRef || !addonsRef) return null;
  
  let item = productsRef.find(p => p.id === id);
  if (item) return item;
  
  const spiceMatch = id.match(/^(.+)_spice(\d+)$/);
  if (spiceMatch) {
    item = productsRef.find(p => p.id === spiceMatch[1]);
    if (item) return item;
  }
  
  return addonsRef.find(a => a.id === id) || null;
}

export function getCartSummary() {
  if (!stateRef || !productsRef) {
    return { items: [], totalQty: 0, subtotal: 0, discount: 0, shippingCost: 0, shippingSubsidy: 0, rawShippingCost: 0, lalamoveCost: 0, baseLalamoveCost: 0, surgeMultiplier: 1, isSurge: false, shippingLabel: '', shippingDistance: 0, shippingZone: 'A', total: 0, isOutOfRange: false, shippingProvider: 'rujakco', vehicleType: 'motor' };
  }
  
  const items = [];
  let subtotal = 0;
  let totalQty = 0;
  const keysToDelete = [];
  
  Object.keys(stateRef.cart).forEach(id => {
    const entry = stateRef.cart[id];
    const item = getItemById(id);
    if (item && entry && entry.qty > 0) {
      const lineTotal = item.price * entry.qty;
      subtotal += lineTotal;
      totalQty += entry.qty;
      items.push({
        cartId: id,
        id: id,
        name: item.name,
        price: item.price,
        qty: entry.qty,
        spice: entry.spice || null,
        lineTotal: lineTotal
      });
    } else {
      keysToDelete.push(id);
    }
  });
  
  keysToDelete.forEach(id => delete stateRef.cart[id]);
  
  const discount = calculateDiscount(subtotal);
  const distance = stateRef.userDistance !== null ? stateRef.userDistance : SYSTEM.DEFAULT_DISTANCE;
  const shipping = calculateShipping(distance, stateRef.isPriority);
  const rawShippingCost = shipping.cost || 0;
  const shippingSubsidy = calculateSubsidy(subtotal, shipping.zone, rawShippingCost);
  const shippingCost = stateRef.shippingProvider === 'pembeli' ? 0 : (rawShippingCost === null ? 0 : Math.max(0, rawShippingCost - shippingSubsidy));
  const total = subtotal - discount + shippingCost;
  
  return {
    items: items,
    totalQty: totalQty,
    subtotal: subtotal,
    discount: discount,
    shippingCost: shippingCost,
    shippingSubsidy: shippingSubsidy,
    rawShippingCost: rawShippingCost,
    lalamoveCost: shipping.lalamoveCost,
    baseLalamoveCost: shipping.baseLalamoveCost,
    surgeMultiplier: shipping.surgeMultiplier,
    isSurge: shipping.isSurge,
    shippingLabel: shipping.label,
    shippingDistance: shipping.distance,
    shippingZone: shipping.zone,
    total: total,
    isOutOfRange: shipping.zone === 'E',
    shippingProvider: stateRef.shippingProvider,
    vehicleType: stateRef.vehicleType
  };
}

let cachedSummary = null;
let cachedSummaryKey = '';

export function getCartSummaryCached() {
  if (!stateRef) return getCartSummary();
  
  const subsidClaimed = localStorage.getItem('rujak_subsidi_claimed') || 'false';
  const subsidExpiry = localStorage.getItem('rujak_subsidi_expiry') || '0';
  
  const key = JSON.stringify(stateRef.cart) + '|' +
              stateRef.shippingProvider + '|' +
              stateRef.userDistance + '|' +
              stateRef.isPriority + '|' +
              stateRef.hasShared + '|' +
              stateRef.vehicleType + '|' +
              subsidClaimed + '|' + subsidExpiry;
  
  if (cachedSummary && cachedSummaryKey === key) return cachedSummary;
  cachedSummary = getCartSummary();
  cachedSummaryKey = key;
  return cachedSummary;
}

export function invalidateCache() {
  cachedSummary = null;
  cachedSummaryKey = '';
}

export function calculateDiscount(subtotal) {
  if (!stateRef) return 0;
  let discount = 0;
  if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) discount += 5000;
  if (stateRef.hasShared) discount += 5000;
  return discount;
}

export function recordOrderHistory(orderItems) {
  if (!productsRef) return;
  try {
    let history = [];
    const raw = localStorage.getItem('rujak_order_history');
    if (raw) history = JSON.parse(raw);
    
    orderItems.forEach(item => {
      const baseId = item.cartId ? item.cartId.split('_spice')[0] : null;
      if (baseId) {
        const product = productsRef.find(p => p.id === baseId);
        if (product) {
          history.push(baseId);
        }
      }
    });
    
    if (history.length > 50) {
      history = history.slice(-50);
    }
    
    localStorage.setItem('rujak_order_history', JSON.stringify(history));
  } catch (_) { /* ignore */ }
}

export function saveCustomerData() {
  if (!stateRef) return;
  try {
    localStorage.setItem('rujak_customer', JSON.stringify({
      name: stateRef.customerName,
      phone: stateRef.customerPhone,
      address: stateRef.customerAddress,
      isGift: stateRef.isGift,
      giftSender: stateRef.giftSender,
      giftMessage: stateRef.giftMessage,
      hasShared: stateRef.hasShared,
      shippingProvider: stateRef.shippingProvider,
      vehicleType: stateRef.vehicleType
    }));
    localStorage.setItem('rujak_has_shared', stateRef.hasShared ? 'true' : 'false');
  } catch(_) {}
}

export function loadCustomerData() {
  if (!stateRef) return;
  try {
    const raw = localStorage.getItem('rujak_customer');
    if (raw) {
      const data = JSON.parse(raw);
      stateRef.customerName = data.name || '';
      stateRef.customerPhone = data.phone || '';
      stateRef.customerAddress = data.address || '';
      stateRef.isGift = data.isGift || false;
      stateRef.giftSender = data.giftSender || '';
      stateRef.giftMessage = data.giftMessage || '';
      stateRef.hasShared = data.hasShared || false;
      if (data.shippingProvider) stateRef.shippingProvider = data.shippingProvider;
      if (data.vehicleType) stateRef.vehicleType = data.vehicleType;
    }
    const shared = localStorage.getItem('rujak_has_shared');
    if (shared === 'true') stateRef.hasShared = true;
  } catch(_) {}
}

export function clearCart() {
  if (!stateRef) return;
  stateRef.cart = {};
  invalidateCache();
  saveCart();
}