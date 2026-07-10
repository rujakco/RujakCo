// ============================================================
// RUJAK.CO — MAIN JAVASCRIPT
// ============================================================

// ===== DATA PRODUK =====
const products = [
  {
    id: 1,
    name: 'Rujak Mangga Muda',
    price: 'Rp 35.000',
    image: 'https://images.unsplash.com/photo-1584395630827-4c6b6fa6b8e8?w=400&h=400&fit=crop&crop=center',
    desc: 'Perpaduan mangga muda segar dengan bumbu rujak khas yang pedas, manis, dan gurih.',
    fruits: ['Mangga Muda', 'Bengkuang', 'Pepaya', 'Jambu Air'],
    spices: ['Gula Merah', 'Cabe', 'Terasi', 'Asam Jawa']
  },
  {
    id: 2,
    name: 'Rujak Buah Naga',
    price: 'Rp 42.000',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d2e?w=400&h=400&fit=crop&crop=center',
    desc: 'Buah naga merah manis dengan saus rujak yang creamy dan sedikit pedas.',
    fruits: ['Buah Naga', 'Pepaya', 'Timun', 'Nanas'],
    spices: ['Gula Aren', 'Cabe Rawit', 'Terasi', 'Jeruk Nipis']
  },
  {
    id: 3,
    name: 'Rujak Klasik Komplit',
    price: 'Rp 48.000',
    image: 'https://images.unsplash.com/photo-1566269754078-11ae7abce889?w=400&h=400&fit=crop&crop=center',
    desc: 'Klasik yang tak pernah salah. Semua buah segar dengan bumbu rujak legendaris.',
    fruits: ['Mangga', 'Bengkuang', 'Pepaya', 'Jambu', 'Nanas', 'Timun'],
    spices: ['Gula Merah', 'Cabe Keriting', 'Terasi', 'Garam', 'Asam']
  },
  {
    id: 4,
    name: 'Rujak Tropis',
    price: 'Rp 45.000',
    image: 'https://images.unsplash.com/photo-1546032994-2dfaae6649c6?w=400&h=400&fit=crop&crop=center',
    desc: 'Sensasi buah-buahan tropis dengan sentuhan bumbu yang menggugah selera.',
    fruits: ['Mangga', 'Nanas', 'Pepaya', 'Sirsak'],
    spices: ['Gula Merah', 'Cabe', 'Terasi', 'Asam Kandis']
  }
];

// ============================================================
// ONBOARDING
// ============================================================
const onboarding = document.getElementById('onboarding');
const onbName = document.getElementById('onbName');
const onbLoc = document.getElementById('onbLoc');
const onbNameBtn = document.getElementById('onbNameBtn');
const onbLocBtn = document.getElementById('onbLocBtn');
const onbSkipLoc = document.getElementById('onbSkipLoc');
const headerName = document.getElementById('headerName');
const headerLoc = document.getElementById('headerLoc');
const heroNameDisplay = document.getElementById('heroNameDisplay');

let userData = { name: 'Tamu', location: '' };

function showStep(step) {
  document.querySelectorAll('.onb-step').forEach(el => el.classList.remove('active'));
  document.querySelector(`.onb-step[data-step="${step}"]`).classList.add('active');
}

function finishOnboarding() {
  onboarding.classList.add('hidden');
  // Simpan ke localStorage agar tidak muncul lagi
  localStorage.setItem('rujak_onboarded', 'true');
  localStorage.setItem('rujak_user', JSON.stringify(userData));
  // Update header
  headerName.textContent = userData.name;
  heroNameDisplay.textContent = userData.name;
  if (userData.location) {
    headerLoc.textContent = userData.location;
  } else {
    headerLoc.textContent = '📍';
  }
  // Mulai auto-slide setelah onboarding selesai
  setTimeout(() => {
    if (typeof startCarouselAutoSlide === 'function') {
      startCarouselAutoSlide();
    }
  }, 300);
}

onbNameBtn.addEventListener('click', () => {
  const name = onbName.value.trim() || 'Tamu';
  userData.name = name;
  showStep(2);
  setTimeout(() => onbLoc.focus(), 300);
});

onbName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') onbNameBtn.click();
});

onbLocBtn.addEventListener('click', () => {
  userData.location = onbLoc.value.trim() || '';
  finishOnboarding();
});

onbSkipLoc.addEventListener('click', () => {
  userData.location = '';
  finishOnboarding();
});

onbLoc.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') onbLocBtn.click();
});

// Cek apakah sudah onboarding sebelumnya
const onboarded = localStorage.getItem('rujak_onboarded');
if (onboarded === 'true') {
  try {
    const saved = JSON.parse(localStorage.getItem('rujak_user'));
    if (saved) {
      userData = saved;
      headerName.textContent = userData.name || 'Tamu';
      heroNameDisplay.textContent = userData.name || 'Tamu';
      headerLoc.textContent = userData.location || '📍';
    }
  } catch (e) {}
  onboarding.classList.add('hidden');
} else {
  // Tampilkan onboarding
  showStep(1);
  setTimeout(() => onbName.focus(), 500);
}

// ============================================================
// RENDER CAROUSEL
// ============================================================
const track = document.getElementById('carouselTrack');

function renderProducts() {
  track.innerHTML = '';
  products.forEach((product, index) => {
    const item = document.createElement('div');
    item.className = `boutique-item ${index === 0 ? 'active-center' : ''}`;
    item.dataset.id = product.id;
    item.innerHTML = `
      <img class="btq-img" src="${product.image}" alt="${product.name}" loading="lazy" />
      <div class="btq-text-container">
        <h3 class="btq-name">${product.name}</h3>
        <div class="btq-price-wrap">
          <span class="btq-price">${product.price}</span>
        </div>
      </div>
    `;
    item.addEventListener('click', () => openProductDetail(product.id));
    track.appendChild(item);
  });
}
renderProducts();

// ============================================================
// AUTO-SLIDE CAROUSEL (NO INDICATORS)
// ============================================================
let currentIndex = 0;
let autoSlideInterval = null;
const DELAY = 4000;

function goToIndex(index) {
  const items = track.querySelectorAll('.boutique-item');
  const targetItem = items[index];
  if (!targetItem) return;
  targetItem.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  });
  items.forEach((el, i) => {
    el.classList.toggle('active-center', i === index);
  });
  currentIndex = index;
}

function nextSlide() {
  const items = track.querySelectorAll('.boutique-item');
  const nextIndex = (currentIndex + 1) % items.length;
  goToIndex(nextIndex);
}

function startCarouselAutoSlide() {
  if (autoSlideInterval) clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(nextSlide, DELAY);
}

function stopCarouselAutoSlide() {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
    autoSlideInterval = null;
  }
}

function resetCarouselAutoSlide() {
  stopCarouselAutoSlide();
  startCarouselAutoSlide();
}

// Event: scroll manual
track.addEventListener('scroll', function() {
  const items = track.querySelectorAll('.boutique-item');
  const rect = track.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  let closest = null;
  let closestDist = Infinity;
  items.forEach((item) => {
    const r = item.getBoundingClientRect();
    const c = r.left + r.width / 2;
    const d = Math.abs(centerX - c);
    if (d < closestDist) {
      closestDist = d;
      closest = item;
    }
  });
  if (closest) {
    const idx = Array.from(items).indexOf(closest);
    if (idx !== currentIndex) {
      currentIndex = idx;
      items.forEach((el, i) => {
        el.classList.toggle('active-center', i === currentIndex);
      });
      resetCarouselAutoSlide();
    }
  }
}, { passive: true });

// Event: hover pause
track.addEventListener('mouseenter', stopCarouselAutoSlide);
track.addEventListener('mouseleave', startCarouselAutoSlide);

// Event: touch pause
track.addEventListener('touchstart', stopCarouselAutoSlide, { passive: true });
track.addEventListener('touchend', function() {
  setTimeout(startCarouselAutoSlide, 3000);
}, { passive: true });

// Jalankan auto-slide jika onboarding sudah selesai
if (onboarding.classList.contains('hidden')) {
  setTimeout(startCarouselAutoSlide, 500);
}

// ============================================================
// TYPING INSIGHT
// ============================================================
const typingText = document.getElementById('typingText');
const insights = [
  'Setiap suapan adalah perjalanan rasa.',
  'Mangga muda, bengkuang renyah, dan cinta.',
  'Dari dapur kami ke hati Anda.',
  'Rujak: harmoni manis, asam, pedas.',
  'Kemewahan ada di setiap gigitan.'
];
let insightIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeInsight() {
  const current = insights[insightIndex];
  if (!isDeleting) {
    typingText.textContent = current.substring(0, charIndex + 1);
    charIndex++;
    if (charIndex === current.length) {
      isDeleting = true;
      setTimeout(typeInsight, 3000);
      return;
    }
    setTimeout(typeInsight, 60 + Math.random() * 40);
  } else {
    typingText.textContent = current.substring(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      isDeleting = false;
      insightIndex = (insightIndex + 1) % insights.length;
      setTimeout(typeInsight, 500);
      return;
    }
    setTimeout(typeInsight, 30 + Math.random() * 20);
  }
}
setTimeout(typeInsight, 1000);

// ============================================================
// PRODUCT DETAIL OVERLAY
// ============================================================
function openProductDetail(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // Buat overlay
  const overlay = document.createElement('div');
  overlay.className = 'product-swiper-overlay';
  overlay.id = 'productOverlay';

  // Close button
  const closeBtn = document.createElement('div');
  closeBtn.className = 'floating-close';
  closeBtn.innerHTML = `<button class="glass-btn" id="closeDetail">✕</button>`;
  overlay.appendChild(closeBtn);

  // Track untuk swiper
  const swiperTrack = document.createElement('div');
  swiperTrack.className = 'product-swiper-track';

  // Buat slide untuk setiap produk
  products.forEach((p, idx) => {
    const slide = document.createElement('div');
    slide.className = 'product-slide';
    // Tampilkan hanya slide yang sesuai, tapi kita tetap render semua
    slide.innerHTML = `
      <div class="detail-image-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="detail-content">
        <div class="hairline" style="width:28px;height:1px;background:var(--gold);margin-bottom:20px;"></div>
        <h2>${p.name}</h2>
        <div class="detail-price">${p.price}</div>
        <p class="detail-desc">${p.desc}</p>
        <div class="action-area">
          <button class="step-1-btn" data-id="${p.id}">Pesan Sekarang</button>
        </div>
        <span class="section-label">Buah-buahan</span>
        <ul class="fruit-list">
          ${p.fruits.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <div class="detail-specs">
          ${p.spices.map(s => `<div><span>${s}</span><span>✧</span></div>`).join('')}
        </div>
        <div class="detail-manifesto">
          <h4>Manifesto Rasa</h4>
          <p>“${p.name} adalah perayaan dari keberagaman rasa yang hadir dalam harmoni sempurna.”</p>
        </div>
      </div>
    `;
    swiperTrack.appendChild(slide);
  });

  overlay.appendChild(swiperTrack);
  document.body.appendChild(overlay);

  // Scroll ke slide yang sesuai
  setTimeout(() => {
    const slides = swiperTrack.querySelectorAll('.product-slide');
    const targetSlide = slides[product.id - 1];
    if (targetSlide) {
      targetSlide.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }, 100);

  // Event close
  document.getElementById('closeDetail').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  // Event klik di luar close (tapi tetap pakai tombol)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  // Event tombol pesan
  overlay.querySelectorAll('.step-1-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = parseInt(btn.dataset.id);
      const prod = products.find(p => p.id === pid);
      showToast(`🛒 ${prod.name} ditambahkan ke keranjang!`);
      // Update badge
      const badge = document.getElementById('cartBadge');
      let count = parseInt(badge.textContent) || 0;
      count++;
      badge.textContent = count;
      badge.style.display = 'flex';
    });
  });
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ============================================================
// HEADER SCROLL EFFECT
// ============================================================
const header = document.getElementById('mainHeader');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ============================================================
// NAVIGATION ITEMS
// ============================================================
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    const nav = item.dataset.nav;
    if (nav === 'cart') {
      showToast('🛒 Keranjang: 0 item');
    } else if (nav === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast(`📱 Halaman ${nav} (demo)`);
    }
  });
});

// ============================================================
// BADGE INIT
// ============================================================
const badge = document.getElementById('cartBadge');
badge.style.display = 'none';
badge.textContent = '0';

console.log('🍉 Rujak.co — siap menemani perjalanan rasa Anda!');