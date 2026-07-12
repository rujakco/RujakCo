// modules/shipping.js
import { SYSTEM } from '../data/config.js';
import { DISTRICT_MAP } from '../data/districts.js';

export function calculateShipping(distance, mainQty, provider = 'rujakco', vehicle = 'motor', priority = false) {
  const dist = distance || SYSTEM.DEFAULT_DISTANCE;
  if (dist > 50) return { cost: null, label: 'Konfirmasi via Concierge' };
  if (provider === 'paxel') {
    const large = Math.floor(mainQty / 2);
    const med = mainQty % 2;
    return { cost: (large * 25000) + (med * 20000) + ((large + med) * 3000), label: 'Paxel Ekspres' };
  } else {
    let cost = dist <= 3 ? 8000 : dist <= 10 ? 8000 + (dist - 3) * 1800 : dist <= 20 ? 20600 + (dist - 10) * 1600 : dist <= 30 ? 36600 + (dist - 20) * 1400 : 50600 + (dist - 30) * 1150;
    if (vehicle === 'mobil') cost = dist <= 3 ? 24000 : dist <= 10 ? 24000 + (dist - 3) * 4500 : dist <= 20 ? 55500 + (dist - 10) * 4000 : 95500 + (dist - 20) * 3500;
    if (priority) cost += 8000;
    return { cost, label: vehicle === 'motor' ? 'Motor' : 'Mobil' };
  }
}

export function getDistance(district) {
  return DISTRICT_MAP[district?.toLowerCase()] || null;
}