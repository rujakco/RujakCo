// ============================================================
// ================ SHIPPING CALCULATIONS ======================
// ============================================================

function calculateSubsidy(subtotal, shippingZone, rawShippingCost) {
  if (shippingZone === 'E' || !rawShippingCost) return 0;
  var claimed = localStorage.getItem('rujak_subsidi_claimed');
  var expiry = localStorage.getItem('rujak_subsidi_expiry');
  if (!claimed || (expiry && Date.now() > parseInt(expiry))) return 0;
  
  var subsidy = 0;
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

function calculateLalamoveCost(distance, vehicleType) {
  var dist = Math.ceil(distance);
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

function getZoneLabel(distance) {
  if (distance <= 5) return 'Zona A (0-5 km)';
  if (distance <= 10) return 'Zona B (5-10 km)';
  if (distance <= 15) return 'Zona C (10-15 km)';
  if (distance <= 20) return 'Zona D (15-20 km)';
  return 'Zona E (>20 km)';
}

function isPeakHour() {
  var now = new Date();
  var hour = now.getHours();
  var day = now.getDay();
  if (day === 0 || day === 6) return (hour >= 11 && hour <= 13);
  return (hour >= 11 && hour <= 13) || (hour >= 16 && hour <= 19);
}

function getSurgeMultiplier() {
  if (!isPeakHour()) {
    state.currentSurge = null;
    return 1.0;
  }
  if (state.currentSurge) return state.currentSurge;
  state.currentSurge = 1.3;
  return state.currentSurge;
}

function calculateShipping(distance, priority) {
  if (state.shippingProvider === 'pembeli') {
    return { cost: 0, label: 'Kurir Saya', distance: distance, zone: null, surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
  }
  
  var rawDistance = (distance === null || distance === undefined || isNaN(distance)) ? SYSTEM.DEFAULT_DISTANCE : distance;
  
  if (rawDistance > SYSTEM.MAX_DISTANCE) {
    return { cost: null, label: 'Admin Konfirmasi', distance: rawDistance, zone: 'E', surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
  }
  
  var surgeMultiplier = getSurgeMultiplier();
  var isSurge = surgeMultiplier > 1.0;
  var lalamoveCost = calculateLalamoveCost(rawDistance, state.vehicleType);
  var surgedCost = Math.round(lalamoveCost * surgeMultiplier);
  var priorityCost = priority ? SYSTEM.PRIORITY_SURCHARGE : 0;
  var totalCost = surgedCost + priorityCost;
  var zoneLabel = getZoneLabel(rawDistance);
  var surgeLabel = isSurge ? ' ⚡Jam Sibuk' : '';
  
  return {
    cost: totalCost,
    lalamoveCost: surgedCost,
    baseLalamoveCost: lalamoveCost,
    surgeMultiplier: surgeMultiplier,
    isSurge: isSurge,
    label: zoneLabel + ' • ' + (state.vehicleType === 'motor' ? 'Motor' : 'Mobil') + (priority ? ' • Prioritas' : '') + surgeLabel,
    distance: rawDistance,
    zone: rawDistance <= 20 ? (rawDistance <= 5 ? 'A' : rawDistance <= 10 ? 'B' : rawDistance <= 15 ? 'C' : 'D') : 'E'
  };
}

function getLocationFallback() {
  return new Promise(function(resolve) {
    var cached = localStorage.getItem('rujak_location');
    if (cached) {
      try {
        var data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 86400000 && data.distance < 900) {
          return resolve(data);
        }
      } catch(e) {}
    }
    fetch('https://ipapi.co/json/')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var city = data.city || data.region || 'Lokasi';
        var distance = 999;
        var c = city.toLowerCase();
        if (c.includes('bekasi')) distance = 2;
        else if (c.includes('jakarta')) distance = 15;
        else if (c.includes('depok')) distance = 20;
        else if (c.includes('tangerang')) distance = 25;
        else if (c.includes('bogor')) distance = 30;
        var result = { city: city, distance: distance, timestamp: Date.now() };
        try {
          localStorage.setItem('rujak_location', JSON.stringify(result));
        } catch(e) {}
        resolve(result);
      })
      .catch(function() {
        resolve({ city: 'Lokasi Tidak Diketahui', distance: 999 });
      });
  });
}

function updateShippingUI(distance, isPriority) {
  var shipping = calculateShipping(distance, isPriority);
  var distEl = document.getElementById('shippingDistance');
  var costEl = document.getElementById('shippingCost');
  var outEl = document.getElementById('outOfRange');
  
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
  
  if (document.getElementById('miniCartModal')?.classList.contains('active')) renderMiniCart();
  invalidateCache();
}