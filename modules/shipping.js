// modules/shipping.js — Final (sinkron koordinat, hapus dead code)
import { SYSTEM } from '../data/config.js';

// ✅ FIX: Gunakan koordinat dari config.js, hapus KITCHEN_COORDS
export { SYSTEM }; // ekspor ulang jika perlu

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

// ✅ Hapus getDistance() – tidak digunakan lagi

// Rumus Haversine sebagai fallback
function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export async function getDrivingDistance(lat1, lon1, lat2, lon2) {
  const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('OSRM gagal');
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return parseFloat((data.routes[0].distance / 1000).toFixed(1));
    }
    throw new Error('Rute tidak ditemukan');
  } catch (error) {
    console.warn('OSRM gagal, fallback ke Haversine:', error);
    return calculateHaversine(lat1, lon1, lat2, lon2);
  }
}

export async function searchAddressOSM(query) {
  const viewbox = '106.6,-6.4,107.1,-6.1';
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=id&viewbox=${viewbox}&limit=5`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RujakCo-DeliveryApp/1.0' }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Gagal mengambil data lokasi:', error);
    return [];
  }
}