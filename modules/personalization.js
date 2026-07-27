// modules/personalization.js
let DOM = {};
let state = {};

export function initPersonalizationConfig(domConfig, appState) {
  DOM = domConfig;
  state = appState;
}

export function getWaktu() {
  const jam = new Date().getHours();
  if (jam >= 5 && jam < 12) return 'pagi';
  if (jam >= 12 && jam < 17) return 'siang';
  return 'sore';
}

export function applyPersonalization() {
  const name = state.customerName || 'Tamu';
  const districtLabel = state.selectedDistrict || 'Pilih alamat tujuan';
  const waktu = getWaktu();
  if (DOM.headerName) DOM.headerName.textContent = `Selamat ${waktu}, ${name} • ${districtLabel}`;
  if (DOM.headerLoc) DOM.headerLoc.style.display = 'none';
  if (DOM.customerNameInput) DOM.customerNameInput.value = name !== 'Tamu' ? name : '';
  if (DOM.customerPhoneInput) DOM.customerPhoneInput.value = state.customerPhone;
  if (DOM.customerAddressInput) DOM.customerAddressInput.value = state.customerAddress;
  if (DOM.districtInput) DOM.districtInput.value = state.selectedDistrictFull || '';
  if (DOM.aiWelcome) DOM.aiWelcome.textContent = `Selamat ${waktu}, ${name}. Ada yang bisa kami bantu?`;
}

export function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

export function initHeroParallax() {
  const heroImg = document.querySelector('.hero-img');
  const heroOverlay = document.querySelector('.hero-overlay-new');
  if (!heroImg) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (DOM.header) DOM.header.classList.toggle('scrolled', window.scrollY > 50);
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        heroImg.style.transform = `translate3d(0, ${scrollY * 0.35}px, 0) scale(${1.02 + (scrollY * 0.0002)})`;
        if (heroOverlay) {
          heroOverlay.style.transform = `translate3d(0, ${-scrollY * 0.1}px, 0)`;
          heroOverlay.style.opacity = Math.max(0, 1 - (scrollY / 250));
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}