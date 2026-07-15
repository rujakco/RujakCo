// modules/carousel.js
import { PRODUCTS } from '../data/products.js';

const LOOP_MULTIPLIER = 3;
let currentInsightId = null;
let typeQueue = [];               // antrian karakter yang akan diketik
let typeTimer = null;
let isTyping = false;

let autoScrollInterval = null;
let scrollTimeout = null;
const SCROLL_DELAY = 3500;
const RESUME_DELAY = 5000;

export function initCarousel(trackId = 'menuList', insightId = 'productInsightText') {
  const track = document.getElementById(trackId);
  if (!track) return;

  // --- Fungsi updateCenter ---
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
    
    // Animasi efek ketik (typing effect) — DIPERBAIKI TOTAL
    if (closestItem) {
      const newId = closestItem.dataset.id;
      if (currentInsightId !== newId) {
        currentInsightId = newId;
        const prod = PRODUCTS.find(p => p.id === newId);
        const insightEl = document.getElementById(insightId);
        
        if (insightEl && prod) {
          // Batalkan animasi yang sedang berjalan
          stopTyping();
          
          // Siapkan teks baru
          const txt = prod.insight || prod.desc;
          typeQueue = txt.split('');   // ubah string jadi array karakter
          
          insightEl.classList.add('fade-out');
          
          // Tunggu fade-out selesai, lalu mulai animasi
          setTimeout(() => {
            insightEl.innerHTML = '';
            insightEl.classList.remove('fade-out');
            startTyping(insightEl);
          }, 300);
        }
      }
    }
    
    return closestIndex;
  };

  // --- Fungsi ketik yang aman dari race condition ---
  function startTyping(el) {
    isTyping = true;
    typeNextChar(el);
  }

  function typeNextChar(el) {
    if (!isTyping || typeQueue.length === 0) {
      isTyping = false;
      return;
    }
    
    const char = typeQueue.shift();
    el.innerHTML += char;
    typeTimer = setTimeout(() => typeNextChar(el), 30);
  }

  function stopTyping() {
    isTyping = false;
    clearTimeout(typeTimer);
    typeQueue = [];
  }

  // --- Infinite loop logic (teleportasi) ---
  let isScrolling;
  
  track.addEventListener('scroll', () => {
    const currentIndex = updateCenter();
    window.clearTimeout(isScrolling);
    
    isScrolling = setTimeout(() => {
      if (currentIndex === -1) return;
      
      const baseCount = PRODUCTS.length;
      
      if (currentIndex < baseCount || currentIndex >= baseCount * (LOOP_MULTIPLIER - 1)) {
        const modulo = currentIndex % baseCount;
        const middleTarget = Math.floor(LOOP_MULTIPLIER / 2) * baseCount + modulo;
        const targetItem = track.children[middleTarget];
        
        if (targetItem) {
          track.style.scrollBehavior = 'auto';
          track.scrollTo({ 
            left: targetItem.offsetLeft - (track.clientWidth / 2) + (targetItem.clientWidth / 2), 
            behavior: 'instant' 
          });
          
          requestAnimationFrame(() => {
            track.style.scrollBehavior = 'smooth';
          });
        }
      }
    }, 250); 
  }, { passive: true });

  // --- Auto‑play functions ---
  function startAutoScroll() {
    stopAutoScroll();
    autoScrollInterval = setInterval(() => {
      const firstItem = track.querySelector('.boutique-item');
      if (!firstItem) return;

      const itemWidth = firstItem.offsetWidth + 16;
      const maxScroll = track.scrollWidth - track.clientWidth;
      let nextScroll = track.scrollLeft + itemWidth;

      if (nextScroll >= maxScroll - 10) {
        nextScroll = 0;
      }

      track.scrollTo({
        left: nextScroll,
        behavior: 'smooth'
      });
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

  // --- Inisialisasi posisi awal & auto‑play ---
  setTimeout(() => {
    track.style.scrollBehavior = 'auto';
    const midPoint = Math.floor(LOOP_MULTIPLIER / 2) * PRODUCTS.length;
    const targetItem = track.children[midPoint];
    
    if (targetItem) { 
      track.scrollLeft = targetItem.offsetLeft - (track.clientWidth / 2) + (targetItem.clientWidth / 2); 
    }
    
    requestAnimationFrame(() => {
       track.style.scrollBehavior = 'smooth';
       updateCenter();
    });

    startAutoScroll();
  }, 100);
}