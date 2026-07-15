// modules/carousel.js
import { PRODUCTS } from '../data/products.js';

const LOOP_MULTIPLIER = 3;
let typeTimeout = null;
let currentInsightId = null;
let typeCancelled = false;        // flag pembatalan untuk efek ketik

let autoScrollInterval = null;
let scrollTimeout = null;
const SCROLL_DELAY = 3500;
const RESUME_DELAY = 5000;

export function initCarousel(trackId = 'menuList', insightId = 'productInsightText') {
  const track = document.getElementById(trackId);
  if (!track) return;

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
        // Batalkan animasi sebelumnya
        typeCancelled = true;
        clearTimeout(typeTimeout);
        
        currentInsightId = newId;
        const prod = PRODUCTS.find(p => p.id === newId);
        const insightEl = document.getElementById(insightId);
        
        if (insightEl && prod) {
          insightEl.classList.add('fade-out');
          
          setTimeout(() => {
            // Mulai animasi baru hanya jika belum dibatalkan
            if (!typeCancelled) {
              insightEl.innerHTML = '';
              let txt = prod.insight || prod.desc;
              let i = 0;
              
              function type() {
                if (typeCancelled) return;   // hentikan jika ada pembatalan
                if (i < txt.length) {
                  insightEl.innerHTML += txt.charAt(i);
                  i++;
                  typeTimeout = setTimeout(type, 30);
                } else {
                  insightEl.classList.remove('fade-out');
                }
              }
              
              insightEl.classList.remove('fade-out');
              typeCancelled = false;         // reset flag
              type();
            }
          }, 300);
        }
      }
    }
    
    return closestIndex;
  };

  // --- Infinite loop logic ---
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

  // --- Inisialisasi ---
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