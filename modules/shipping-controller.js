import { calculateShipping, getDrivingDistance, reverseGeocode } from './shipping.js';
import { fmt, showToast, debounce, escapeHTML, queuedSearch } from '../utils/helpers.js';
import { SYSTEM } from '../data/config.js';
import { saveCustomer } from './storage.js';
import { applyPersonalization } from './personalization.js';
import { getCartSummary } from './checkout.js';
import { renderMiniCart } from './render.js';

let DOM = {};
let state = {};
let APP_CONFIG = {};
const PERMISSION_DENIED = globalThis.GeolocationPositionError?.PERMISSION_DENIED ?? 1;

export function initShippingController(domConfig, appState, config) { DOM = domConfig; state = appState; APP_CONFIG = config; }

export function extractShortLocation(fullAddress) {
  if (!fullAddress) return '';
  const parts = fullAddress.split(',').map(p => p.trim());
  for (const p of parts) { const lower = p.toLowerCase(); if (lower.includes('kecamatan') || lower.includes('kota') || lower.includes('kabupaten')) { const match = p.match(/(?:kecamatan|kota|kabupaten)\s+([^,]+)/i); if (match) return match[1].trim(); return p.replace(/^(kecamatan|kota|kabupaten)\s*/i, '').trim(); } }
  if (parts.length >= 2) return parts[1] || parts[0];
  return parts[0] || '';
}

export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { showToast('Geolokasi tak didukung.'); return reject(new Error('Geolocation not supported')); }
    navigator.geolocation.getCurrentPosition((pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }), (err) => { if (err.code === PERMISSION_DENIED) showToast('Izin lokasi ditolak.'); reject(err); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  });
}

export async function resolveOnboardingDistance(districtLabel) {
  if (state.userDistance != null) return;
  const query = state.selectedDistrictFull || districtLabel;
  if (!query) return;
  try { const results = await queuedSearch(query); if (results.length > 0) { const place = results[0]; const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, parseFloat(place.lat), parseFloat(place.lon)); state.userDistance = result.distance; state.haversineUsed = result.isHaversine; updateShippingUI(); } } catch (err) { console.warn('Gagal resolve jarak onboarding:', err); }
}

export function updateShippingUI() {
  const dist = state.userDistance; const section = DOM.shippingSection;
  if (!section) return;
  const { subtotal, mainProductQty } = getCartSummary(state.cart);
  if (dist != null) {
    section.style.display = 'block';
    const ship = calculateShipping(dist, mainProductQty || 1, state.shippingProvider, state.tier); const shipCost = ship.cost; const hasValidCost = shipCost !== null && shipCost !== undefined;
    document.getElementById('shippingDistance').textContent = `${dist} km`;
    DOM.finalShipping.textContent = hasValidCost ? fmt(shipCost) : '...'; DOM.finalTotal.textContent = hasValidCost ? fmt(subtotal + shipCost) : fmt(subtotal);
    if (state.shippingProvider === 'lalamove') { const estReguler = document.getElementById('estReguler'); const estPrioritas = document.getElementById('estPrioritas'); if (estReguler && estPrioritas) { const reg = calculateShipping(dist, mainProductQty || 1, 'lalamove', 'reguler'); const pri = calculateShipping(dist, mainProductQty || 1, 'lalamove', 'prioritas'); estReguler.textContent = reg.cost != null ? fmt(reg.cost) : '—'; estPrioritas.textContent = pri.cost != null ? fmt(pri.cost) : '—'; } }
  } else { section.style.display = 'none'; if (DOM.finalTotal) DOM.finalTotal.textContent = fmt(subtotal); }
}

export function initDrawerDistrictDropdown() {
  const input = DOM.districtInput; const dropdown = DOM.drawerDistrictDropdown;
  if (!input || !dropdown) return;
  input.placeholder = 'Ketik alamat tujuan (jalan, kelurahan, kota)';
  const validIndicator = document.getElementById('districtValidIndicator');
  const wrapper = input.parentElement;
  const gpsBtn = document.createElement('button'); gpsBtn.type = 'button'; gpsBtn.className = 'gps-btn'; gpsBtn.innerHTML = '<i data-lucide="map-pin" class="icon-sm"></i> <span class="gps-label">Lokasi</span>'; gpsBtn.setAttribute('aria-label', 'Gunakan lokasi saya'); wrapper.appendChild(gpsBtn);
  const spinner = document.createElement('span'); spinner.className = 'input-spinner is-hidden'; spinner.innerHTML = '<i data-lucide="loader-2" class="icon-sm spin"></i>'; wrapper.appendChild(spinner);
  if (window.lucide) lucide.createIcons();
  let gpsLoading = false, searchLoading = false;
  function updateSpinner() { if (gpsLoading || searchLoading) { spinner.classList.remove('is-hidden'); gpsBtn.classList.add('is-hidden'); } else { spinner.classList.add('is-hidden'); gpsBtn.classList.remove('is-hidden'); } }
  function setGpsLoading(v) { gpsLoading = v; updateSpinner(); }
  function setSearchLoading(v) { searchLoading = v; updateSpinner(); }
  let searchAbortController = null, searchFailCount = 0;
  const handleSearch = debounce(async (query) => {
    if (query.length < 3) { dropdown.style.display = 'none'; return; }
    if (searchAbortController) searchAbortController.abort();
    searchAbortController = new AbortController(); const controller = searchAbortController, signal = controller.signal;
    setSearchLoading(true); dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:var(--gray-500);">Mencari lokasi...</div>'; dropdown.style.display = 'block';
    let results = [];
    try { results = await queuedSearch(query, signal); } catch (err) { if (err.name !== 'AbortError') dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--danger);">Koneksi terputus.</div>'; return; }
    finally { setSearchLoading(false); if (searchAbortController === controller) searchAbortController = null; }
    if (signal.aborted) return;
    if (results.length === 0) { searchFailCount++; dropdown.innerHTML = searchFailCount >= 2 ? `<div style="padding:16px;text-align:center;color:var(--danger);">Lokasi tak ditemukan.</div><div role="option" tabindex="0" data-manual="true" style="text-align:center;color:var(--gold-text);font-weight:600;cursor:pointer;">Isi manual & konfirmasi via WhatsApp</div>` : '<div style="padding:16px;text-align:center;color:var(--danger);">Lokasi tak ditemukan.</div>'; return; }
    searchFailCount = 0;
    dropdown.innerHTML = results.map(place => { const displayNameRaw = place.display_name.split(',').slice(0, 3).join(','); const displayName = escapeHTML(displayNameRaw); const mainLabel = escapeHTML(place.address.road || place.address.suburb || place.name); return `<div role="option" tabindex="0" data-lat="${place.lat}" data-lon="${place.lon}" data-name="${displayName}"><strong>${mainLabel}</strong><br><span style="font-size:0.75rem;color:var(--gray-500);">${displayName}</span></div>`; }).join('');
    input.setAttribute('aria-expanded', 'true');
  }, APP_CONFIG.TIMING.DEBOUNCE_SEARCH);
  input.addEventListener('input', (e) => { state.selectedDistrict = ''; state.selectedDistrictFull = ''; state.userDistance = null; input.style.borderBottomColor = ''; validIndicator.classList.add('is-hidden'); validIndicator.classList.remove('is-visible'); updateShippingUI(); handleSearch(e.target.value.trim()); });
  dropdown.addEventListener('click', async (e) => {
    const manualOption = e.target.closest('[data-manual="true"]'); if (manualOption) { dropdown.style.display = 'none'; showToast('Isi alamat manual, tim kami konfirmasi ongkir.'); return; }
    const option = e.target.closest('div[role="option"]'); if (!option) return;
    input.value = 'Menghitung rute pengantaran...'; dropdown.style.display = 'none'; input.setAttribute('aria-expanded', 'false');
    const lat = parseFloat(option.dataset.lat), lon = parseFloat(option.dataset.lon), placeName = option.dataset.name;
    try { const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, lat, lon); state.userDistance = result.distance; state.haversineUsed = result.isHaversine; } catch (err) { showToast('Gagal menghitung jarak.'); return; }
    state.selectedDistrictFull = placeName; state.selectedDistrict = extractShortLocation(placeName); input.value = placeName; input.style.borderBottomColor = 'var(--green)';
    validIndicator.innerHTML = `<i data-lucide="check" class="icon-sm"></i> Area layanan tersedia`; validIndicator.classList.remove('is-hidden'); validIndicator.classList.add('is-visible');
    applyPersonalization(); updateShippingUI(); if (DOM.miniCartModal?.classList.contains('active')) renderMiniCart(state.cart);
    saveCustomer(state.customerPhone, state.customerAddress, placeName, state.userDistance);
  });
  gpsBtn.addEventListener('click', async () => {
    if (gpsBtn.disabled) return; gpsBtn.disabled = true; gpsBtn.setAttribute('aria-busy', 'true'); setGpsLoading(true);
    try {
      const { lat, lon } = await requestLocation(); input.value = 'Menyiapkan area layanan...';
      const place = await reverseGeocode(lat, lon); if (!place?.display_name) throw new Error('No result');
      const result = await getDrivingDistance(SYSTEM.STORE_LAT, SYSTEM.STORE_LNG, lat, lon); state.userDistance = result.distance; state.haversineUsed = result.isHaversine;
      const displayName = place.display_name; state.selectedDistrictFull = displayName; state.selectedDistrict = extractShortLocation(displayName); input.value = displayName; input.style.borderBottomColor = 'var(--green)';
      validIndicator.innerHTML = `<i data-lucide="check" class="icon-sm"></i> Area layanan tersedia`; validIndicator.classList.remove('is-hidden'); validIndicator.classList.add('is-visible');
      applyPersonalization(); updateShippingUI(); if (DOM.miniCartModal?.classList.contains('active')) renderMiniCart(state.cart);
      saveCustomer(state.customerPhone, state.customerAddress, displayName, state.userDistance);
    } catch (err) { if (err.message !== 'Geolocation not supported' && err.code !== PERMISSION_DENIED) showToast('Gagal dapat lokasi.'); input.value = ''; }
    finally { setGpsLoading(false); gpsBtn.disabled = false; gpsBtn.setAttribute('aria-busy', 'false'); }
  });
}