// ============================================================
// ================ SHIPPING CALCULATIONS ======================
// ============================================================

import { fmt } from './utils.js';

export const SYSTEM = {
  DISCOUNT_THRESHOLD: 100000,
  WA_NUMBER: '6289677161680',
  TOAST_DURATION: 3000,
  MAX_DISTANCE: 50,
  DEFAULT_DISTANCE: 2,
  SUBSIDY_TIER1: 75000,
  SUBSIDY_TIER2: 125000,
  SUBSIDY_TIER3: 200000,
  SUBSIDY_AMOUNT1: 5000,
  SUBSIDY_AMOUNT2: 10000,
  PRIORITY_SURCHARGE: 8000,
  MAX_SUBSIDY: 30000,
  STORE_LAT: -6.2347,
  STORE_LNG: 106.9895,
  LOCATION_TIMEOUT: 12000,
  SUBSIDY_DURATION_MINUTES: 30
};

export const DISTRICT_MAP = {
  'bekasi barat':3, 'bekasi timur':5, 'bekasi selatan':7, 'bekasi utara':8,
  'rawalumbu':6, 'jatiasih':9, 'pondokgede':12, 'cikarang':18,
  'jakarta pusat':18, 'jakarta selatan':20, 'jakarta timur':15,
  'jakarta barat':22, 'jakarta utara':25, 'depok':28,
  'bogor':35, 'tangerang':30, 'tangerang selatan':27
};

// State reference (akan di-set dari app.js)
export let stateRef = null;

export function setStateRef(state) {
  stateRef = state;
}

export function calculateSubsidy(subtotal, shippingZone, rawShippingCost) {
  if (shippingZone === 'E' || !rawShippingCost) return 0;
  const claimed = localStorage.getItem('rujak_subsidi_claimed');
  const expiry = localStorage.getItem('rujak_subsidi_expiry');
  if (!claimed || (expiry && Date.now() > parseInt(expiry))) return 0;
  
  let subsidy = 0;
  if (subtotal >= SYSTEM.SUBSIDY_TIER3 && ['A','B','C','D'].includes(shippingZone)) {
    subsidy = rawShippingCost;
  } else if (subtotal >= SYSTEM.SUBSIDY_TIER2) {
    subsidy = SYSTEM.SUBSIDY_AMOUNT2;
  } else if (subtotal >= SYSTEM.SUBSIDY_TIER1) {
    subsidy = SYSTEM.SUBSIDY_AMOUNT1;
  }
  if (subsidy > SYSTEM.MAX_SUBSIDY) subsidy = SYSTEM.MAX_SUBSIDY;
  return subsidy;
}

export function calculateLalamoveCost(distance, vehicleType) {
  const dist = Math.ceil(distance);
  if (vehicleType === 'motor') {
    if (dist <= 3) return 8000;
    if (dist <= 25) return 8000 + ((dist - 3) * 2000);
    return 8000 + (22 * 2000) + ((dist - 25) * 2400);
  }
  if (vehicleType === 'mobil') {
    if (dist <= 3) return 24000;
    if (dist <= 15) return 24000 + ((dist - 3) * 4500);
    return 24000 + (12 * 4500) + ((dist - 15) * 5000);
  }
  return 0;
}

export function getZoneLabel(distance) {
  if (distance <= 5) return 'Zona A (0-5 km)';
  if (distance <= 10) return 'Zona B (5-10 km)';
  if (distance <= 15) return 'Zona C (10-15 km)';
  if (distance <= 20) return 'Zona D (15-20 km)';
  return 'Zona E (>20 km)';
}

export function isPeakHour() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  if (day === 0 || day === 6) return (hour >= 11 && hour <= 13);
  return (hour >= 11 && hour <= 13) || (hour >= 16 && hour <= 19);
}

export function getSurgeMultiplier() {
  if (!isPeakHour()) {
    if (stateRef) stateRef.currentSurge = null;
    return 1.0;
  }
  if (stateRef && stateRef.currentSurge) return stateRef.currentSurge;
  if (stateRef) stateRef.currentSurge = 1.3;
  return 1.3;
}

export function calculateShipping(distance, priority) {
  if (!stateRef) {
    return { cost: 0, label: 'Error', distance: distance, zone: null, surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
  }
  
  if (stateRef.shippingProvider === 'pembeli') {
    return { cost: 0, label: 'Kurir Saya', distance: distance, zone: null, surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
  }
  
  const rawDistance = (distance === null || distance === undefined || isNaN(distance)) ? SYSTEM.DEFAULT_DISTANCE : distance;
  
  if (rawDistance > SYSTEM.MAX_DISTANCE) {
    return { cost: null, label: 'Admin Konfirmasi', distance: rawDistance, zone: 'E', surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
  }
  
  const surgeMultiplier = getSurgeMultiplier();
  const isSurge = surgeMultiplier > 1.0;
  const lalamoveCost = calculateLalamoveCost(rawDistance, stateRef.vehicleType);
  const surgedCost = Math.round(lalamoveCost * surgeMultiplier);
  const priorityCost = priority ? SYSTEM.PRIORITY_SURCHARGE : 0;
  const totalCost = surgedCost + priorityCost;
  const zoneLabel = getZoneLabel(rawDistance);
  const surgeLabel = isSurge ? ' ⚡Jam Sibuk' : '';
  
  let zone = 'E';
  if (rawDistance <= 20) {
    if (rawDistance <= 5) zone = 'A';
    else if (rawDistance <= 10) zone = 'B';
    else if (rawDistance <= 15) zone = 'C';
    else zone = 'D';
  }
  
  return {
    cost: totalCost,
    lalamoveCost: surgedCost,
    baseLalamoveCost: lalamoveCost,
    surgeMultiplier: surgeMultiplier,
    isSurge: isSurge,
    label: zoneLabel + ' • ' + (stateRef.vehicleType === 'motor' ? 'Motor' : 'Mobil') + (priority ? ' • Prioritas' : '') + surgeLabel,
    distance: rawDistance,
    zone: zone
  };
}

export function getLocationFallback() {
  return new Promise((resolve) => {
    const cached = localStorage.getItem('rujak_location');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 86400000 && data.distance < 900) {
          return resolve(data);
        }
      } catch(e) {}
    }
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const city = data.city || data.region || 'Lokasi';
        let distance = 999;
        const c = city.toLowerCase();
        if (c.includes('bekasi')) distance = 2;
        else if (c.includes('jakarta')) distance = 15;
        else if (c.includes('depok')) distance = 20;
        else if (c.includes('tangerang')) distance = 25;
        else if (c.includes('bogor')) distance = 30;
        const result = { city: city, distance: distance, timestamp: Date.now() };
        try {
          localStorage.setItem('rujak_location', JSON.stringify(result));
        } catch(e) {}
        resolve(result);
      })
      .catch(() => {
        resolve({ city: 'Lokasi Tidak Diketahui', distance: 999 });
      });
  });
}

export function updateShippingUI(distance, isPriority, state, renderMiniCart, invalidateCache) {
  const shipping = calculateShipping(distance, isPriority);
  const distEl = document.getElementById('shippingDistance');
  const costEl = document.getElementById('shippingCost');
  const outEl = document.getElementById('outOfRange');
  
  if (distEl) distEl.textContent = '~' + Math.ceil(distance) + ' km';
  
  if (shipping.zone === 'E') {
    if (costEl) {
      costEl.textContent = 'Konfirmasi';
      costEl.style.color = 'var(--red)';
    }
    if (outEl) outEl.style.display = 'block';
  } else if (state.shippingProvider === 'pembeli') {
    if (costEl) {
      costEl.textContent = 'Gratis';
      costEl.style.color = 'var(--green)';
    }
    if (outEl) outEl.style.display = 'none';
  } else {
    if (costEl) {
      costEl.textContent = shipping.cost ? fmt(shipping.cost) : 'Gratis';
      costEl.style.color = 'var(--red)';
    }
    if (outEl) outEl.style.display = 'none';
  }
  
  if (document.getElementById('miniCartModal') && document.getElementById('miniCartModal').classList.contains('active')) {
    if (typeof renderMiniCart === 'function') renderMiniCart();
  }
  if (typeof invalidateCache === 'function') invalidateCache();
}