// ============================================================
// ================ AI ENGINE ============================
// ============================================================

function getAIRecommendation() {
  if (typeof state === 'undefined' || typeof PRODUCTS === 'undefined') return null;
  
  var hour = new Date().getHours();
  var day = new Date().getDay();
  var isWeekend = (day === 0 || day === 6);
  
  var timeBased = null;
  if (hour >= 6 && hour < 10) timeBased = 'p_m2';
  else if (hour >= 10 && hour < 14) timeBased = 'p_m3';
  else if (hour >= 14 && hour < 17) timeBased = 'p_m1';
  else if (hour >= 17 && hour < 22) timeBased = 'p_m4';
  else timeBased = 'p_m1';
  
  var history = [];
  try {
    var raw = localStorage.getItem('rujak_order_history');
    if (raw) history = JSON.parse(raw);
  } catch (_) { history = []; }
  
  var favorite = null;
  if (history.length > 0) {
    var freq = {};
    history.forEach(function(id) {
      freq[id] = (freq[id] || 0) + 1;
    });
    var sorted = Object.entries(freq).sort(function(a, b) { return b[1] - a[1]; });
    favorite = sorted[0] ? sorted[0][0] : null;
  }
  
  var rec = favorite || timeBased;
  
  if (isWeekend && hour >= 17) {
    var weekendRecs = ['p_m4', 'p_m6'];
    var found = weekendRecs.find(function(id) {
      var p = PRODUCTS.find(function(prod) { return prod.id === id && !prod.isHidden; });
      return p !== undefined;
    });
    if (found) rec = found;
  }
  
  var inCart = Object.keys(state.cart);
  var product = PRODUCTS.find(function(p) {
    if (p.isHidden) return false;
    if (inCart.some(function(key) { return key.indexOf(p.id) === 0; })) return false;
    return p.id === rec;
  });
  
  return product || null;
}

function renderAIRecommendation() {
  var container = document.getElementById('aiRecommendationContainer');
  if (!container) return;
  
  var rec = getAIRecommendation();
  if (!rec) {
    container.style.display = 'none';
    return;
  }
  
  var inCart = Object.keys(state.cart).some(function(key) {
    return key.indexOf(rec.id) === 0;
  });
  if (inCart) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  container.innerHTML = '' +
    '<div style="background:linear-gradient(135deg,#F8F5EE,#FFFDF5);border:1px solid #E8E0D0;border-radius:12px;padding:10px 14px;margin:0 20px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">' +
      '<span style="font-size:20px;flex-shrink:0;">🤖</span>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:9px;font-weight:600;color:#8B7355;text-transform:uppercase;letter-spacing:0.5px;">Rekomendasi AI</div>' +
        '<div style="font-weight:700;font-size:14px;color:#0F4D37;">' + escapeHTML(rec.name) + '</div>' +
        '<div style="font-size:11px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHTML(rec.desc) + '</div>' +
      '</div>' +
      '<button onclick="window.addToCartAI(\'' + rec.id + '\')" style="background:#0F4D37;color:white;border:none;padding:4px 14px;border-radius:20px;font-weight:600;font-size:12px;cursor:pointer;flex-shrink:0;transition:transform 0.2s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
        '+ Tambah' +
      '</button>' +
    '</div>';
}

window.addToCartAI = function(productId) {
  if (typeof state === 'undefined' || typeof PRODUCTS === 'undefined') return;
  if (typeof addToCartLocked !== 'undefined' && addToCartLocked) return;
  
  if (typeof lockAddToCart === 'function') {
    lockAddToCart();
  } else if (typeof addToCartLocked !== 'undefined') {
    addToCartLocked = true;
    setTimeout(function() { addToCartLocked = false; }, 300);
  }
  
  var product = PRODUCTS.find(function(p) { return p.id === productId; });
  if (!product) return;
  
  var spice = product.defaultSpice || 3;
  var cartKey = productId + '_spice' + spice;
  var entry = state.cart[cartKey] || { qty: 0, spice: spice };
  entry.qty += 1;
  entry.spice = spice;
  state.cart[cartKey] = entry;
  
  if (typeof invalidateCache === 'function') invalidateCache();
  if (typeof updateUI === 'function') updateUI();
  if (typeof showToast === 'function') showToast('✅ ' + product.name + ' ditambahkan dari rekomendasi AI!');
  
  var container = document.getElementById('aiRecommendationContainer');
  if (container) container.style.display = 'none';
};

var SEARCH_SYNONYMS = {
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

function aiSearch(query) {
  if (typeof PRODUCTS === 'undefined') return [];
  if (!query || query.length < 2) {
    return PRODUCTS.filter(function(p) { return !p.isHidden; });
  }
  
  var q = query.toLowerCase().trim();
  var words = q.split(/\s+/);
  var synSets = [];
  
  words.forEach(function(word) {
    var found = false;
    var entries = Object.entries(SEARCH_SYNONYMS);
    for (var i = 0; i < entries.length; i++) {
      var key = entries[i][0];
      var synonyms = entries[i][1];
      var matchKey = key.indexOf(word) !== -1 || word.indexOf(key) !== -1;
      var matchSyn = synonyms.some(function(s) {
        return s.indexOf(word) !== -1 || word.indexOf(s) !== -1;
      });
      if (matchKey || matchSyn) {
        synSets.push([key].concat(synonyms));
        found = true;
        break;
      }
    }
    if (!found) synSets.push([word]);
  });
  
  var allTerms = [];
  synSets.forEach(function(set) {
    set.forEach(function(term) {
      allTerms.push(term);
    });
  });
  var uniqueTerms = [];
  var seen = {};
  allTerms.forEach(function(term) {
    if (!seen[term]) {
      seen[term] = true;
      uniqueTerms.push(term);
    }
  });
  
  var scored = PRODUCTS
    .filter(function(p) { return !p.isHidden; })
    .map(function(p) {
      var score = 0;
      var searchable = [p.name, p.desc, p.flavor].concat(p.tags || []).concat(p.buah || []).join(' ').toLowerCase();
      
      uniqueTerms.forEach(function(term) {
        if (searchable.indexOf(term) !== -1) score += 1;
        if (p.name.toLowerCase().indexOf(term) !== -1) score += 3;
        if ((p.tags || []).some(function(t) { return t.toLowerCase().indexOf(term) !== -1; })) score += 2;
        if ((p.buah || []).some(function(b) { return b.toLowerCase().indexOf(term) !== -1; })) score += 1.5;
        if (p.flavor.toLowerCase().indexOf(term) !== -1) score += 2;
      });
      
      if (q.indexOf('classic') !== -1 && p.cat === 'classic') score += 2;
      if (q.indexOf('signature') !== -1 && p.cat === 'signature') score += 2;
      if (q.indexOf('reserve') !== -1 && p.cat === 'reserve') score += 2;
      
      return { product: p, score: score };
    })
    .filter(function(item) { return item.score > 0; })
    .sort(function(a, b) { return b.score - a.score; })
    .map(function(item) { return item.product; });
  
  if (scored.length === 0) {
    return PRODUCTS.filter(function(p) {
      if (p.isHidden) return false;
      var searchable = [p.name, p.desc, p.flavor].concat(p.tags || []).concat(p.buah || []).join(' ').toLowerCase();
      return searchable.indexOf(q) !== -1;
    });
  }
  
  return scored;
}

function renderAIUpsell(summary) {
  if (typeof PRODUCTS === 'undefined') return '';
  if (summary.items.length === 0) return '';
  
  var cartProductIds = summary.items.map(function(i) { return i.id; });
  var available = PRODUCTS
    .filter(function(p) {
      return !p.isHidden && !cartProductIds.some(function(id) { return id.indexOf(p.id) === 0; });
    })
    .sort(function(a, b) { return a.price - b.price; });
  
  if (available.length === 0) return '';
  
  var bestScore = -1;
  var bestProduct = null;
  
  available.forEach(function(p) {
    var score = 0;
    var priceRatio = p.price / summary.subtotal;
    if (priceRatio >= 0.3 && priceRatio <= 0.8) score += 3;
    else if (priceRatio > 0.8 && priceRatio <= 1.2) score += 2;
    
    var classicCount = summary.items.filter(function(i) {
      var prod = PRODUCTS.find(function(p) { return p.id === i.id; });
      return prod && prod.cat === 'classic';
    }).length;
    if (classicCount > 0 && p.cat === 'signature') score += 2;
    
    var hour = new Date().getHours();
    if (hour >= 11 && hour <= 14 && p.sambal && p.sambal.indexOf('Mete') !== -1) score += 1;
    
    var day = new Date().getDay();
    if ((day === 0 || day === 6) && p.portion && p.portion.indexOf('Orang') !== -1) score += 1;
    
    var sameCat = summary.items.some(function(i) {
      var prod = PRODUCTS.find(function(p) { return p.id === i.id; });
      return prod && prod.cat === p.cat;
    });
    if (sameCat) score -= 1;
    
    if (score > bestScore) {
      bestScore = score;
      bestProduct = p;
    }
  });
  
  if (!bestProduct || bestScore < 0) return '';
  
  var diff = bestProduct.price - summary.subtotal;
  var diffText = diff > 0 ? fmt(diff) : 'Gratis';
  var isFree = diff <= 0;
  
  return '' +
    '<div style="background:linear-gradient(135deg,#FFF8E1,#FFECB3);border:1px solid #F4C430;border-radius:12px;padding:12px 14px;margin-top:10px;text-align:center;box-shadow:0 2px 8px rgba(244,196,48,0.2);">' +
      '<div style="font-size:10px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">🧠 AI Suggestion</div>' +
      '<div style="font-size:14px;font-weight:700;color:#3d2b00;margin:2px 0;">' +
        (isFree ? '🎉 Tambah GRATIS!' : 'Tambah ' + diffText) + ' → <strong>' + escapeHTML(bestProduct.name) + '</strong>' +
      '</div>' +
      '<div style="font-size:11px;color:#795548;margin-bottom:6px;">' + escapeHTML(bestProduct.desc) + '</div>' +
      '<button onclick="window.addToCartAI(\'' + bestProduct.id + '\')" style="background:#0F4D37;color:white;border:none;padding:6px 20px;border-radius:20px;font-weight:600;font-size:12px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
        '+ Tambahkan' +
      '</button>' +
    '</div>';
}

function initAIChat() {
  var toggle = document.getElementById('aiChatToggle');
  var box = document.getElementById('aiChatBox');
  var close = document.getElementById('aiChatClose');
  var send = document.getElementById('aiChatSend');
  var input = document.getElementById('aiChatInput');
  var messages = document.getElementById('aiChatMessages');
  
  if (!toggle || !box) return;
  
  var isOpen = false;
  
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
    var msg = input.value.trim();
    if (!msg) return;
    
    var safeMsg = escapeHTML(msg);
    messages.innerHTML += '<div style="text-align:right;margin-bottom:8px;"><span style="background:#0F4D37;color:white;padding:8px 14px;border-radius:16px;display:inline-block;max-width:85%;">' + safeMsg + '</span></div>';
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    setTimeout(function() {
      var reply = generateAIResponse(msg);
      var safeReply = escapeHTML(reply);
      messages.innerHTML += '<div style="margin-bottom:8px;"><span style="background:#E8F5E9;padding:8px 14px;border-radius:16px;display:inline-block;max-width:85%;">🤖 ' + safeReply + '</span></div>';
      messages.scrollTop = messages.scrollHeight;
    }, 400 + Math.random() * 300);
  }
  
  function generateAIResponse(msg) {
    var lower = msg.toLowerCase();
    
    if (lower.indexOf('menu') !== -1 || lower.indexOf('produk') !== -1 || lower.indexOf('rujak') !== -1) {
      var products = PRODUCTS.filter(function(p) { return !p.isHidden; });
      var names = products.map(function(p) { return p.name + ' (' + fmt(p.price) + ')'; }).join(' • ');
      return 'Kami punya ' + products.length + ' menu: ' + names + '. Mau rekomendasi? 😋';
    }
    
    if (lower.indexOf('rekomend') !== -1 || lower.indexOf('saran') !== -1 || lower.indexOf('pilih') !== -1) {
      var rec = getAIRecommendation();
      if (rec) {
        return 'Menurut saya, ' + rec.name + ' cocok untuk kamu! Harga ' + fmt(rec.price) + ', isinya ' + (rec.buah || []).slice(0,3).join(', ') + '. Mau saya tambahkan ke keranjang? 🍍';
      }
      return 'Saya sarankan Rujak Gaco — paling laris! Ada jambu kristal dan sambal mete premium. Mau coba?';
    }
    
    if (lower.indexOf('ongkir') !== -1 || lower.indexOf('subsidi') !== -1 || lower.indexOf('biaya') !== -1) {
      var summary = getCartSummaryCached();
      if (summary.isOutOfRange) {
        return 'Maaf, area Anda di luar jangkauan. Tapi hubungi admin di WA untuk solusi khusus! 📞';
      }
      if (state.userDistance === null) {
        return 'Kami sedang deteksi lokasi Anda. Tunggu sebentar ya... 📍';
      }
      var dist = Math.ceil(state.userDistance);
      var cost = summary.shippingCost;
      var subsidy = summary.shippingSubsidy;
      var reply = 'Jarak Anda ~' + dist + ' km. ';
      if (subsidy > 0) {
        reply += 'Subsidi ongkir Rp' + subsidy.toLocaleString() + ' sudah berlaku! ';
      }
      reply += 'Total ongkir ' + fmt(cost) + '.';
      if (summary.subtotal >= SYSTEM.SUBSIDY_TIER3) reply += ' 🎉 Gratis ongkir maks. Rp30.000!';
      return reply;
    }
    
    if (lower.indexOf('sambal') !== -1 || lower.indexOf('pedas') !== -1 || lower.indexOf('level') !== -1) {
      return 'Sambal kami dipisah dalam cup sealed! Ada Original (Rp8k) dan Mete Premium (Rp12k). Level pedas 1-5. Mau pesan? 🌶️';
    }
    
    if (lower.indexOf('harga') !== -1 || lower.indexOf('mahal') !== -1 || lower.indexOf('murah') !== -1) {
      return 'Harga mulai Rp26.000 (Rujak Serut) sampai Rp200.000 (Tampah Nusantara). Ada Mahkota VIP Rp125.000 — menu rahasia! 🤫';
    }
    
    if (lower.indexOf('sampai') !== -1 || lower.indexOf('cepat') !== -1 || lower.indexOf('lama') !== -1) {
      var priority = state.isPriority ? ' ⚡ prioritas 15-25 menit' : '';
      return 'Estimasi tiba 30-45 menit.' + priority + ' Kalau benyek? Kami ganti baru! ✅';
    }
    
    if (lower.indexOf('vip') !== -1 || lower.indexOf('rahasia') !== -1 || lower.indexOf('eksklusif') !== -1) {
      return '🤫 Ada Mahkota VIP — menu rahasia dengan Shine Muscat, Mangga Harum Manis, dan Strawberry! Harga Rp125.000. Mau tahu lebih lanjut?';
    }
    
    return 'Maaf, saya masih belajar. Coba tanya: menu, rekomendasi, ongkir, sambal, harga, atau pengiriman. Atau hubungi WA kami di 089677161680! 😊';
  }
  
  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
  });
}