// ============================================================
// ================ AI ENGINE ==================================
// ============================================================

import { fmt, escapeHTML, showToast } from './utils.js';
import { invalidateCache, getCartSummaryCached } from './cart.js';

// State reference
export let stateRef = null;
export let productsRef = [];

export function setStateRef(state) {
  stateRef = state;
}

export function setProductsRef(products) {
  productsRef = products;
}

// Lock reference
let addToCartLocked = false;
export function setAddToCartLock(lockFn) {
  addToCartLocked = false;
  // Store lock function
  window._lockAddToCart = lockFn;
}

function lockAddToCart() {
  if (window._lockAddToCart) {
    window._lockAddToCart();
  } else {
    addToCartLocked = true;
    setTimeout(() => { addToCartLocked = false; }, 300);
  }
}

export function getAIRecommendation() {
  if (!stateRef || !productsRef) return null;
  
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = (day === 0 || day === 6);
  
  let timeBased = null;
  if (hour >= 6 && hour < 10) timeBased = 'p_m2';
  else if (hour >= 10 && hour < 14) timeBased = 'p_m3';
  else if (hour >= 14 && hour < 17) timeBased = 'p_m1';
  else if (hour >= 17 && hour < 22) timeBased = 'p_m4';
  else timeBased = 'p_m1';
  
  let history = [];
  try {
    const raw = localStorage.getItem('rujak_order_history');
    if (raw) history = JSON.parse(raw);
  } catch (_) { history = []; }
  
  let favorite = null;
  if (history.length > 0) {
    const freq = {};
    history.forEach(id => {
      freq[id] = (freq[id] || 0) + 1;
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    favorite = sorted[0] ? sorted[0][0] : null;
  }
  
  let rec = favorite || timeBased;
  
  if (isWeekend && hour >= 17) {
    const weekendRecs = ['p_m4', 'p_m6'];
    const found = weekendRecs.find(id => {
      const p = productsRef.find(prod => prod.id === id && !prod.isHidden);
      return p !== undefined;
    });
    if (found) rec = found;
  }
  
  const inCart = Object.keys(stateRef.cart);
  const product = productsRef.find(p => {
    if (p.isHidden) return false;
    if (inCart.some(key => key.startsWith(p.id))) return false;
    return p.id === rec;
  });
  
  return product || null;
}

export function renderAIRecommendation() {
  const container = document.getElementById('aiRecommendationContainer');
  if (!container) return;
  
  const rec = getAIRecommendation();
  if (!rec) {
    container.style.display = 'none';
    return;
  }
  
  const inCart = Object.keys(stateRef.cart).some(key => key.startsWith(rec.id));
  if (inCart) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#F8F5EE,#FFFDF5);border:1px solid #E8E0D0;border-radius:12px;padding:10px 14px;margin:0 20px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <span style="font-size:20px;flex-shrink:0;">🤖</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:9px;font-weight:600;color:#8B7355;text-transform:uppercase;letter-spacing:0.5px;">Rekomendasi AI</div>
        <div style="font-weight:700;font-size:14px;color:#0F4D37;">${escapeHTML(rec.name)}</div>
        <div style="font-size:11px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(rec.desc)}</div>
      </div>
      <button onclick="window.addToCartAI('${rec.id}')" style="background:#0F4D37;color:white;border:none;padding:4px 14px;border-radius:20px;font-weight:600;font-size:12px;cursor:pointer;flex-shrink:0;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        + Tambah
      </button>
    </div>
  `;
}

window.addToCartAI = function(productId) {
  if (!stateRef || !productsRef) return;
  
  if (window._lockAddToCart) {
    // Check if locked
    if (window._isAddToCartLocked) return;
    window._isAddToCartLocked = true;
    setTimeout(() => { window._isAddToCartLocked = false; }, 300);
  }
  
  const product = productsRef.find(p => p.id === productId);
  if (!product) return;
  
  const spice = product.defaultSpice || 3;
  const cartKey = productId + '_spice' + spice;
  const entry = stateRef.cart[cartKey] || { qty: 0, spice: spice };
  entry.qty += 1;
  entry.spice = spice;
  stateRef.cart[cartKey] = entry;
  
  invalidateCache();
  if (typeof window.updateUI === 'function') window.updateUI();
  showToast('✅ ' + product.name + ' ditambahkan dari rekomendasi AI!');
  
  const container = document.getElementById('aiRecommendationContainer');
  if (container) container.style.display = 'none';
};

const SEARCH_SYNONYMS = {
  'asem': ['mangga muda', 'kedondong', 'asam', 'asam jawa'],
  'manis': ['nanas', 'bengkoang', 'muscat', 'anggur', 'madu'],
  'pedas': ['sambal', 'mete', 'cabe', 'sambel', 'spicy'],
  'seger': ['jambu', 'kristal', 'air', 'dingin', 'fresh'],
  'buah': ['mangga', 'nanas', 'jambu', 'bengkoang', 'kedondong', 'muscat', 'ubi', 'strawberry'],
  'premium': ['gaco', 'mahkota', 'vip', 'reserve', 'eksklusif'],
  'hemat': ['serut', 'segar', 'klasik', 'murah'],
  'rame': ['rama', 'tampah', 'sharing', '8-10', 'keluarga'],
  'kriuk': ['renyah', 'serut', 'kristal', 'jambu'],
  'gurih': ['mete', 'kacang', 'sambal', 'premium']
};

export function aiSearch(query) {
  if (!productsRef) return [];
  if (!query || query.length < 2) {
    return productsRef.filter(p => !p.isHidden);
  }
  
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);
  const synSets = [];
  
  words.forEach(word => {
    let found = false;
    for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
      const matchKey = key.includes(word) || word.includes(key);
      const matchSyn = synonyms.some(s => s.includes(word) || word.includes(s));
      if (matchKey || matchSyn) {
        synSets.push([key, ...synonyms]);
        found = true;
        break;
      }
    }
    if (!found) synSets.push([word]);
  });
  
  const allTerms = synSets.flat();
  const uniqueTerms = [...new Set(allTerms)];
  
  const scored = productsRef
    .filter(p => !p.isHidden)
    .map(p => {
      let score = 0;
      const searchable = [
        p.name,
        p.desc,
        p.flavor,
        ...(p.tags || []),
        ...(p.buah || [])
      ].join(' ').toLowerCase();
      
      uniqueTerms.forEach(term => {
        if (searchable.includes(term)) score += 1;
        if (p.name.toLowerCase().includes(term)) score += 3;
        if ((p.tags || []).some(t => t.toLowerCase().includes(term))) score += 2;
        if ((p.buah || []).some(b => b.toLowerCase().includes(term))) score += 1.5;
        if (p.flavor.toLowerCase().includes(term)) score += 2;
      });
      
      if (q.includes('classic') && p.cat === 'classic') score += 2;
      if (q.includes('signature') && p.cat === 'signature') score += 2;
      if (q.includes('reserve') && p.cat === 'reserve') score += 2;
      
      return { product: p, score: score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
  
  if (scored.length === 0) {
    return productsRef.filter(p => {
      if (p.isHidden) return false;
      const searchable = [p.name, p.desc, p.flavor, ...(p.tags || []), ...(p.buah || [])].join(' ').toLowerCase();
      return searchable.includes(q);
    });
  }
  
  return scored;
}

export function renderAIUpsell(summary) {
  if (!productsRef) return '';
  if (summary.items.length === 0) return '';
  
  const cartProductIds = summary.items.map(i => i.id);
  const available = productsRef
    .filter(p => !p.isHidden && !cartProductIds.some(id => id.startsWith(p.id)))
    .sort((a, b) => a.price - b.price);
  
  if (available.length === 0) return '';
  
  let bestScore = -1;
  let bestProduct = null;
  
  available.forEach(p => {
    let score = 0;
    const priceRatio = p.price / summary.subtotal;
    if (priceRatio >= 0.3 && priceRatio <= 0.8) score += 3;
    else if (priceRatio > 0.8 && priceRatio <= 1.2) score += 2;
    
    const classicCount = summary.items.filter(i => {
      const prod = productsRef.find(p => p.id === i.id);
      return prod && prod.cat === 'classic';
    }).length;
    if (classicCount > 0 && p.cat === 'signature') score += 2;
    
    const hour = new Date().getHours();
    if (hour >= 11 && hour <= 14 && p.sambal && p.sambal.includes('Mete')) score += 1;
    
    const day = new Date().getDay();
    if ((day === 0 || day === 6) && p.portion && p.portion.includes('Orang')) score += 1;
    
    const sameCat = summary.items.some(i => {
      const prod = productsRef.find(p => p.id === i.id);
      return prod && prod.cat === p.cat;
    });
    if (sameCat) score -= 1;
    
    if (score > bestScore) {
      bestScore = score;
      bestProduct = p;
    }
  });
  
  if (!bestProduct || bestScore < 0) return '';
  
  const diff = bestProduct.price - summary.subtotal;
  const diffText = diff > 0 ? fmt(diff) : 'Gratis';
  const isFree = diff <= 0;
  
  return `
    <div style="background:linear-gradient(135deg,#FFF8E1,#FFECB3);border:1px solid #F4C430;border-radius:12px;padding:12px 14px;margin-top:10px;text-align:center;box-shadow:0 2px 8px rgba(244,196,48,0.2);">
      <div style="font-size:10px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">🧠 AI Suggestion</div>
      <div style="font-size:14px;font-weight:700;color:#3d2b00;margin:2px 0;">
        ${isFree ? '🎉 Tambah GRATIS!' : 'Tambah ' + diffText} → <strong>${escapeHTML(bestProduct.name)}</strong>
      </div>
      <div style="font-size:11px;color:#795548;margin-bottom:6px;">${escapeHTML(bestProduct.desc)}</div>
      <button onclick="window.addToCartAI('${bestProduct.id}')" style="background:#0F4D37;color:white;border:none;padding:6px 20px;border-radius:20px;font-weight:600;font-size:12px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        + Tambahkan
      </button>
    </div>
  `;
}

export function initAIChat() {
  const toggle = document.getElementById('aiChatToggle');
  const box = document.getElementById('aiChatBox');
  const close = document.getElementById('aiChatClose');
  const send = document.getElementById('aiChatSend');
  const input = document.getElementById('aiChatInput');
  const messages = document.getElementById('aiChatMessages');
  
  if (!toggle || !box) return;
  
  let isOpen = false;
  
  toggle.addEventListener('click', function() {
    isOpen = !isOpen;
    box.style.display = isOpen ? 'block' : 'none';
    if (isOpen) {
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  });
  
  close.addEventListener('click', function() {
    isOpen = false;
    box.style.display = 'none';
  });
  
  function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    
    const safeMsg = escapeHTML(msg);
    messages.innerHTML += `<div style="text-align:right;margin-bottom:8px;"><span style="background:#0F4D37;color:white;padding:8px 14px;border-radius:16px;display:inline-block;max-width:85%;">${safeMsg}</span></div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    setTimeout(function() {
      const reply = generateAIResponse(msg);
      const safeReply = escapeHTML(reply);
      messages.innerHTML += `<div style="margin-bottom:8px;"><span style="background:#E8F5E9;padding:8px 14px;border-radius:16px;display:inline-block;max-width:85%;">🤖 ${safeReply}</span></div>`;
      messages.scrollTop = messages.scrollHeight;
    }, 400 + Math.random() * 300);
  }
  
  function generateAIResponse(msg) {
    const lower = msg.toLowerCase();
    
    if (lower.includes('menu') || lower.includes('produk') || lower.includes('rujak')) {
      const products = productsRef.filter(p => !p.isHidden);
      const names = products.map(p => p.name + ' (' + fmt(p.price) + ')').join(' • ');
      return 'Kami punya ' + products.length + ' menu: ' + names + '. Mau rekomendasi? 😋';
    }
    
    if (lower.includes('rekomend') || lower.includes('saran') || lower.includes('pilih')) {
      const rec = getAIRecommendation();
      if (rec) {
        return 'Menurut saya, ' + rec.name + ' cocok untuk kamu! Harga ' + fmt(rec.price) + ', isinya ' + (rec.buah || []).slice(0,3).join(', ') + '. Mau saya tambahkan ke keranjang? 🍍';
      }
      return 'Saya sarankan Rujak Gaco — paling laris! Ada jambu kristal dan sambal mete premium. Mau coba?';
    }
    
    if (lower.includes('ongkir') || lower.includes('subsidi') || lower.includes('biaya')) {
      const summary = getCartSummaryCached();
      if (summary.isOutOfRange) {
        return 'Maaf, area Anda di luar jangkauan. Tapi hubungi admin di WA untuk solusi khusus! 📞';
      }
      if (stateRef.userDistance === null) {
        return 'Kami sedang deteksi lokasi Anda. Tunggu sebentar ya... 📍';
      }
      const dist = Math.ceil(stateRef.userDistance);
      const cost = summary.shippingCost;
      const subsidy = summary.shippingSubsidy;
      let reply = 'Jarak Anda ~' + dist + ' km. ';
      if (subsidy > 0) {
        reply += 'Subsidi ongkir Rp' + subsidy.toLocaleString() + ' sudah berlaku! ';
      }
      reply += 'Total ongkir ' + fmt(cost) + '.';
      if (summary.subtotal >= SYSTEM.SUBSIDY_TIER3) reply += ' 🎉 Gratis ongkir maks. Rp30.000!';
      return reply;
    }
    
    if (lower.includes('sambal') || lower.includes('pedas') || lower.includes('level')) {
      return 'Sambal kami dipisah dalam cup sealed! Ada Original (Rp8k) dan Mete Premium (Rp12k). Level pedas 1-5. Mau pesan? 🌶️';
    }
    
    if (lower.includes('harga') || lower.includes('mahal') || lower.includes('murah')) {
      return 'Harga mulai Rp26.000 (Rujak Serut) sampai Rp200.000 (Tampah Nusantara). Ada Mahkota VIP Rp125.000 — menu rahasia! 🤫';
    }
    
    if (lower.includes('sampai') || lower.includes('cepat') || lower.includes('lama')) {
      const priority = stateRef.isPriority ? ' ⚡ prioritas 15-25 menit' : '';
      return 'Estimasi tiba 30-45 menit.' + priority + ' Kalau benyek? Kami ganti baru! ✅';
    }
    
    if (lower.includes('vip') || lower.includes('rahasia') || lower.includes('eksklusif')) {
      return '🤫 Ada Mahkota VIP — menu rahasia dengan Shine Muscat, Mangga Harum Manis, dan Strawberry! Harga Rp125.000. Mau tahu lebih lanjut?';
    }
    
    return 'Maaf, saya masih belajar. Coba tanya: menu, rekomendasi, ongkir, sambal, harga, atau pengiriman. Atau hubungi WA kami di 089677161680! 😊';
  }
  
  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
  });
}