// modules/carousel.js
import { PRODUCTS } from '../data/products.js';

const LOOP_MULTIPLIER = 3;
let typeTimeout = null;
let currentInsightId = null;

export function initCarousel(trackId = 'menuList', insightId = 'productInsightText') {
  const track = document.getElementById(trackId);
  if (!track) return;

  const updateCenter = () => {
    const items = track.querySelectorAll('.boutique-item');
    if (!items.length) return;
    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestItem = null, minDistance = Infinity;
    items.forEach(item => {
      const itemCenter = item.getBoundingClientRect().left + item.clientWidth / 2;
      const distance = Math.abs(trackCenter - itemCenter);
      if (distance < minDistance) { minDistance = distance; closestItem = item; }
    });
    items.forEach(item => item.classList.toggle('active-center', item === closestItem));
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
  };

  let isScrolling;
  track.addEventListener('scroll', () => {
    requestAnimationFrame(updateCenter);
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
      const itemWidth = track.children[0]?.offsetWidth ? track.children[0].offsetWidth - 56 : 0;
      if (itemWidth === 0) return;
      const currentIndex = Math.round(track.scrollLeft / itemWidth);
      const baseCount = PRODUCTS.length;
      if (currentIndex <= baseCount || currentIndex >= baseCount * (LOOP_MULTIPLIER - 2)) {
        const modulo = currentIndex % baseCount;
        const middleTarget = Math.floor(LOOP_MULTIPLIER / 2) * baseCount + modulo;
        const targetItem = track.children[middleTarget];
        if (targetItem) {
          track.scrollTo({ left: targetItem.offsetLeft - (track.clientWidth / 2) + (targetItem.clientWidth / 2), behavior: 'instant' });
        }
      }
    }, 150);
  }, { passive: true });

  setTimeout(() => {
    track.style.scrollBehavior = 'auto';
    const midPoint = Math.floor(LOOP_MULTIPLIER / 2) * PRODUCTS.length;
    const targetItem = track.children[midPoint];
    if (targetItem) { track.scrollLeft = targetItem.offsetLeft - (track.clientWidth / 2) + (targetItem.clientWidth / 2); }
    track.style.scrollBehavior = 'smooth';
    updateCenter();
  }, 100);
}