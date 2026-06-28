// ============================================================
// ================ CART MANAGEMENT ============================
// ============================================================

function loadCart() {
  try {
    var s = localStorage.getItem('rujak_cart');
    if (s) {
      var p = JSON.parse(s);
      if (typeof p === 'object' && p !== null) {
        if (typeof state !== 'undefined') state.cart = p;
      }
    }
  } catch (_) {
    if (typeof state !== 'undefined') state.cart = {};
  }
}

function saveCart() {
  try {
    if (typeof state !== 'undefined') {
      localStorage.setItem('rujak_cart', JSON.stringify(state.cart));
    }
  } catch (_) {}
}

function getItemById(id) {
  if (typeof PRODUCTS === 'undefined' || typeof ADDONS === 'undefined') return null;
  
  var item = PRODUCTS.find(function(p) { return p.id === id; });
  if (item) return item;
  
  var spiceMatch = id.match(/^(.+)_spice(\d+)$/);
  if (spiceMatch) {
    item = PRODUCTS.find(function(p) { return p.id === spiceMatch[1]; });
    if (item) return item;
  }
  
  return ADDONS.find(function(a) { return a.id === id; }) || null;
}

function getCartSummary() {
  if (typeof state === 'undefined') {
    return { items: [], totalQty: 0, subtotal: 0, discount: 0, shippingCost: 0, shippingSubsidy: 0, rawShippingCost: 0, lalamoveCost: 0, baseLalamoveCost: 0, surgeMultiplier: 1, isSurge: false, shippingLabel: '', shippingDistance: 0, shippingZone: 'A', total: 0, isOutOfRange: false, shippingProvider: 'rujakco', vehicleType: 'motor' };
  }
  
  var items = [];
  var subtotal = 0;
  var totalQty = 0;
  var keysToDelete = [];
  
  Object.keys(state.cart).forEach(function(id) {
    var entry = state.cart[id];
    var item = getItemById(id);
    if (item && entry && entry.qty > 0) {
      var lineTotal = item.price * entry.qty;
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
  
  keysToDelete.forEach(function(id) { delete state.cart[id]; });
  
  var discount = calculateDiscount(subtotal);
  var distance = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
  var shipping = calculateShipping(distance, state.isPriority);
  var rawShippingCost = shipping.cost || 0;
  var shippingSubsidy = calculateSubsidy(subtotal, shipping.zone, rawShippingCost);
  var shippingCost = state.shippingProvider === 'pembeli' ? 0 : (rawShippingCost === null ? 0 : Math.max(0, rawShippingCost - shippingSubsidy));
  var total = subtotal - discount + shippingCost;
  
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
    shippingProvider: state.shippingProvider,
    vehicleType: state.vehicleType
  };
}

var cachedSummary = null;
var cachedSummaryKey = '';

function getCartSummaryCached() {
  if (typeof state === 'undefined') return getCartSummary();
  
  var subsidClaimed = localStorage.getItem('rujak_subsidi_claimed') || 'false';
  var subsidExpiry = localStorage.getItem('rujak_subsidi_expiry') || '0';
  
  var key = JSON.stringify(state.cart) + '|' +
            state.shippingProvider + '|' +
            state.userDistance + '|' +
            state.isPriority + '|' +
            state.hasShared + '|' +
            state.vehicleType + '|' +
            subsidClaimed + '|' + subsidExpiry;
  
  if (cachedSummary && cachedSummaryKey === key) return cachedSummary;
  cachedSummary = getCartSummary();
  cachedSummaryKey = key;
  return cachedSummary;
}

function invalidateCache() {
  cachedSummary = null;
  cachedSummaryKey = '';
}

function calculateDiscount(subtotal) {
  if (typeof state === 'undefined') return 0;
  var discount = 0;
  if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) discount += 5000;
  if (state.hasShared) discount += 5000;
  return discount;
}

function recordOrderHistory(orderItems) {
  if (typeof PRODUCTS === 'undefined') return;
  try {
    var history = [];
    var raw = localStorage.getItem('rujak_order_history');
    if (raw) history = JSON.parse(raw);
    
    orderItems.forEach(function(item) {
      var baseId = item.cartId ? item.cartId.split('_spice')[0] : null;
      if (baseId) {
        var product = PRODUCTS.find(function(p) { return p.id === baseId; });
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

function saveCustomerData() {
  if (typeof state === 'undefined') return;
  try {
    localStorage.setItem('rujak_customer', JSON.stringify({
      name: state.customerName,
      phone: state.customerPhone,
      address: state.customerAddress,
      isGift: state.isGift,
      giftSender: state.giftSender,
      giftMessage: state.giftMessage,
      hasShared: state.hasShared,
      shippingProvider: state.shippingProvider,
      vehicleType: state.vehicleType
    }));
    localStorage.setItem('rujak_has_shared', state.hasShared ? 'true' : 'false');
  } catch(_) {}
}

function loadCustomerData() {
  if (typeof state === 'undefined') return;
  try {
    var raw = localStorage.getItem('rujak_customer');
    if (raw) {
      var data = JSON.parse(raw);
      state.customerName = data.name || '';
      state.customerPhone = data.phone || '';
      state.customerAddress = data.address || '';
      state.isGift = data.isGift || false;
      state.giftSender = data.giftSender || '';
      state.giftMessage = data.giftMessage || '';
      state.hasShared = data.hasShared || false;
      if (data.shippingProvider) state.shippingProvider = data.shippingProvider;
      if (data.vehicleType) state.vehicleType = data.vehicleType;
    }
    var shared = localStorage.getItem('rujak_has_shared');
    if (shared === 'true') state.hasShared = true;
  } catch(_) {}
}