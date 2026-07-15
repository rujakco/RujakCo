// modules/carousel.js – Final Stable (typing halus, aman scroll cepat)
import { PRODUCTS } from '../data/products.js';

const LOOP_MULTIPLIER = 3;
let currentInsightId = null;

// Typing state
let typeTimer = null;
let fadeTimer = null;
let fullText = '';
let charIndex = 0;

// Auto‑play state
let autoScrollInterval = null;
let scrollTimeout = null;
const SCROLL_DELAY = 3500;
const RESUME_DELAY = 5000;

export function initCarousel(trackId = 'menuList', insightId = 'productInsightText') {
  const track = document.getElementById(trackId);
  if (!track) return;

  const insightEl = document.getElementById(insightId);
  if (!insightEl) return;

  // Batalkan semua timer yang sedang berjalan
  function abortAll() {
    clearTimeout(typeTimer);
    clearTimeout(fadeTimer);
    typeTimer = null;
    fadeTimer = null;
  }

  // Mulai mengetik teks baru (langsung, tanpa fade-in)
  function startTyping(text) {
    abortAll();
    insightEl.classList.remove('fade-out'); // hapus kelas fade jika masih ada
    fullText = text;
    charIndex = 0;
    insightEl.textContent = '';
    typeNext();
  }

  function typeNext() {
    if (charIndex < fullText.length) {
      insightEl.textContent += fullText.charAt(charIndex);
      charIndex++;
      typeTimer = setTimeout(typeNext, 30);
    }
  }

  // Update slide center & insight
  const updateCenter = () => {
    const items = track.querySelectorAll('.boutique-item');
    if (!items.length) return -1;

    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestItem = null, minDistance = Infinity, closestIndex = -1;

    items.forEach((item, index) => {
      const itemCenter = item.getBoundingClientRect().left + item.clientWidth / 2;
      const distance = Math.abs(trackCenter - itemCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestItem = item;
        closestIndex = index;
      }
    });

    items.forEach(item => item.classList.toggle('active-center', item === closestItem));

    if (closestItem) {
      const newId = closestItem.dataset.id;
      if (currentInsightId !== newId) {
        currentInsightId = newId;
        const prod = PRODUCTS.find(p => p.id === newId);
        if (prod) {
          const nextText = prod.insight || prod.desc;

          // Batalkan semua proses sebelumnya
          abortAll();

          // Mulai fade-out sebentar, lalu langsung ketik
          insightEl.classList.add('fade-out');
          fadeTimer = setTimeout(() => {
            startTyping(nextText);
          }, 150); // fade-out 150ms sudah cukup
        }
      }
    }

    return closestIndex;
  };

  // Infinite loop (teleportasi)
  let scrollStableTimer;
  track.addEventListener('scroll', () => {
    const currentIndex = updateCenter();
    clearTimeout(scrollStableTimer);

    scrollStableTimer = setTimeout(() => {
      if (currentIndex === -1) return;
      const baseCount = PRODUCTS.length;

      if (currentIndex < baseCount || currentIndex >= baseCount * (LOOP_MULTIPLIER - 1)) {
        const modulo = currentIndex % baseCount;
        const middleTarget = Math.floor(LOOP_MULTIPLIER / 2) * baseCount + modulo;
        const targetItem = track.children[middleTarget];
        if (targetItem) {
          track.style.scrollBehavior = 'auto';
          track.scrollTo({
            left: targetItem.offsetLeft - track.clientWidth / 2 + targetItem.clientWidth / 2,
            behavior: 'instant'
          });
          requestAnimationFrame(() => { track.style.scrollBehavior = 'smooth'; });
        }
      }
    }, 250);
  }, { passive: true });

  // Auto‑play
  function startAutoScroll() {
    stopAutoScroll();
    autoScrollInterval = setInterval(() => {
      const firstItem = track.querySelector('.boutique-item');
      if (!firstItem) return;
      const itemWidth = firstItem.offsetWidth + 16;
      const maxScroll = track.scrollWidth - track.clientWidth;
      let nextScroll = track.scrollLeft + itemWidth;
      if (nextScroll >= maxScroll - 10) nextScroll = 0;
      track.scrollTo({ left: nextScroll, behavior: 'smooth' });
    }, SCROLL_DELAY);
  }

  function stopAutoScroll() {
    clearInterval(autoScrollInterval);
  }

  track.addEventListener('touchstart', stopAutoScroll, { passive: true });
  track.addEventListener('mousedown', stopAutoScroll);
  track.addEventListener('scroll', () => {
    stopAutoScroll();
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(startAutoScroll, RESUME_DELAY);
  }, { passive: true });

  // Inisialisasi
  setTimeout(() => {
    track.style.scrollBehavior = 'auto';
    const midPoint = Math.floor(LOOP_MULTIPLIER / 2) * PRODUCTS.length;
    const targetItem = track.children[midPoint];
    if (targetItem) {
      track.scrollLeft = targetItem.offsetLeft - track.clientWidth / 2 + targetItem.clientWidth / 2;
    }
    requestAnimationFrame(() => {
      track.style.scrollBehavior = 'smooth';
      updateCenter();
    });
    startAutoScroll();
  }, 100);
}