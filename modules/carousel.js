// modules/carousel.js
import { PRODUCTS } from '../data/products.js';

const LOOP_MULTIPLIER = 3;
let typeTimeout = null;
let currentInsightId = null;

export function initCarousel(trackId = 'menuList', insightId = 'productInsightText') {
  const track = document.getElementById(trackId);
  if (!track) return;

  // Fungsi ini sekarang tidak hanya mengubah CSS (active-center), 
  // tetapi juga mengembalikan 'index' kartu yang sedang aktif
  const updateCenter = () => {
    const items = track.querySelectorAll('.boutique-item');
    if (!items.length) return -1;
    
    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestItem = null, minDistance = Infinity, closestIndex = -1;
    
    // Cari kartu yang paling dekat dengan titik tengah layar
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
    
    // Animasi efek ketik (typing effect)
    if (closestItem) {
      const newId = closestItem.dataset.id;
      if (currentInsightId !== newId) {
        currentInsightId = newId;
        const prod = PRODUCTS.find(p => p.id === newId);
        const insightEl = document.getElementById(insightId);
        if (insightEl && prod) {
          clearTimeout(typeTimeout);
          insightEl.classList.add('fade-out');
          setTimeout(() => {
            insightEl.innerHTML = '';
            let txt = prod.insight || prod.desc;
            let i = 0;
            function type() {
              if (i < txt.length) {
                insightEl.innerHTML += txt.charAt(i);
                i++;
                typeTimeout = setTimeout(type, 30);
              } else {
                insightEl.classList.remove('fade-out');
              }
            }
            insightEl.classList.remove('fade-out');
            type();
          }, 300);
        }
      }
    }
    
    return closestIndex; // Kirim index ke listener scroll
  };

  let isScrolling;
  
  track.addEventListener('scroll', () => {
    const currentIndex = updateCenter(); // Jalankan style saat digeser
    
    window.clearTimeout(isScrolling);
    
    // Tunggu 250ms sampai CSS Snap benar-benar berhenti (mencegah bentrok)
    isScrolling = setTimeout(() => {
      if (currentIndex === -1) return;
      
      const baseCount = PRODUCTS.length;
      
      // Jika pengguna sudah menggeser terlalu jauh ke ujung kiri atau kanan
      if (currentIndex < baseCount || currentIndex >= baseCount * (LOOP_MULTIPLIER - 1)) {
        // Hitung index kembarannya di blok tengah
        const modulo = currentIndex % baseCount;
        const middleTarget = Math.floor(LOOP_MULTIPLIER / 2) * baseCount + modulo;
        const targetItem = track.children[middleTarget];
        
        if (targetItem) {
          // Matikan smooth scroll sejenak agar teleportasi tidak terlihat
          track.style.scrollBehavior = 'auto';
          track.scrollTo({ 
            left: targetItem.offsetLeft - (track.clientWidth / 2) + (targetItem.clientWidth / 2), 
            behavior: 'instant' 
          });
          
          // Nyalakan lagi setelah frame ter-render
          requestAnimationFrame(() => {
            track.style.scrollBehavior = 'smooth';
          });
        }
      }
    }, 250); 
  }, { passive: true });

  // Posisi awal saat web pertama kali dimuat (lompat ke tengah)
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
  }, 100);
}
