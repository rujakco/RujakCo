// modules/carousel.js – Luxury Edition (typing bebas glitch, aman scroll cepat)
import { PRODUCTS } from '../data/products.js';

const LOOP_MULTIPLIER = 3;
let currentInsightId = null;

/* === Typing state (global di modul, aman meski initCarousel dipanggil sekali) === */
let typeTimer = null;            // timer setTimeout untuk karakter berikutnya
let fadeTimer = null;           // timer setTimeout untuk fade-out → mulai baru
let cancelled = false;          // flag pembatalan aktif

/* === Auto‑play state === */
let autoScrollInterval = null;
let scrollTimeout = null;
const SCROLL_DELAY = 3500;
const RESUME_DELAY = 5000;

/* ------------------------------------------------------------------ */
export function initCarousel(trackId = 'menuList', insightId = 'productInsightText') {
  const track = document.getElementById(trackId);
  if (!track) return;

  const insightEl = document.getElementById(insightId);
  if (!insightEl) return;

  /* ================================================================
     TYPING ENGINE – tanpa queue, pakai variabel string penuh
     ================================================================ */
  let fullText = '';             // kalimat yang sedang diketik
  let charIndex = 0;            // posisi karakter berikutnya

  /** Hentikan SEMUA proses yang sedang berjalan (typing + fade timer) */
  function abortAll() {
    cancelled = true;                       // sinyal agar fungsi type() tidak lanjut
    clearTimeout(typeTimer);
    clearTimeout(fadeTimer);
    typeTimer = null;
    fadeTimer = null;
  }

  /** Mulai mengetik kalimat `text` dari awal */
  function startTyping(text) {
    abortAll();                             // pastikan tidak ada yang tertinggal
    cancelled = false;
    fullText = text;
    charIndex = 0;
    insightEl.textContent = '';             // hapus teks lama sekaligus
    insightEl.classList.remove('fade-out'); // kalau sebelumnya sedang fade
    typeNext();
  }

  function typeNext() {
    if (cancelled) return;                 // dibatalkan oleh slide lain
    if (charIndex < fullText.length) {
      insightEl.textContent += fullText.charAt(charIndex);
      charIndex++;
      typeTimer = setTimeout(typeNext, 30);
    }
    // kalau sudah habis, biarkan selesai tanpa melakukan apa‑apa
  }

  /* ================================================================
     UPDATE CENTER – cek slide aktif & ganti insight
     ================================================================ */
  const updateCenter = () => {
    const items = track.querySelectorAll('.boutique-item');
    if (!items.length) return -1;

    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestItem = null;
    let minDistance = Infinity;
    let closestIndex = -1;

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

    // --- Ganti insight jika produk berubah ---
    if (closestItem) {
      const newId = closestItem.dataset.id;
      if (currentInsightId !== newId) {
        currentInsightId = newId;
        const prod = PRODUCTS.find(p => p.id === newId);
        if (prod) {
          const nextText = prod.insight || prod.desc;

          // 1) Batalkan apa pun yang sedang berlangsung
          abortAll();

          // 2) Fade-out sebentar lalu mulai mengetik teks baru
          insightEl.classList.add('fade-out');
          fadeTimer = setTimeout(() => {
            // hanya lanjutkan jika fade timer ini tidak ikut dibatalkan
            if (!cancelled) {
              startTyping(nextText);
            }
          }, 200);
        }
      }
    }

    return closestIndex;
  };

  /* ================================================================
     INFINITE LOOP (teleportasi)
     ================================================================ */
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

  /* ================================================================
     AUTO‑PLAY
     ================================================================ */
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

  /* ================================================================
     INISIALISASI
     ================================================================ */
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