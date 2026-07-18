import { PRODUCTS } from '../data/products.js';

const LOOP_MULTIPLIER = 3;
let currentInsightId = null;
let typeTimer = null, fadeTimer = null, fullText = '', charIndex = 0;
let autoScrollInterval = null, scrollTimeout = null;
const SCROLL_DELAY = 3500, RESUME_DELAY = 5000;

export function initCarousel(trackId = 'menuList', insightId = 'productInsightText') {
  const track = document.getElementById(trackId);
  if (!track) return;
  const insightEl = document.getElementById(insightId);
  if (!insightEl) return;

  function abortAll() { clearTimeout(typeTimer); clearTimeout(fadeTimer); typeTimer = null; fadeTimer = null; }
  function startTyping(text) {
    abortAll();
    insightEl.classList.remove('fade-out');
    fullText = text; charIndex = 0; insightEl.textContent = '';
    typeNext();
  }
  function typeNext() {
    if (charIndex < fullText.length) {
      insightEl.textContent += fullText.charAt(charIndex);
      charIndex++;
      typeTimer = setTimeout(typeNext, 30);
    }
  }

  const updateCenter = () => {
    const items = track.querySelectorAll('.boutique-item');
    if (!items.length) return -1;
    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestItem = null, minDistance = Infinity, closestIndex = -1;
    items.forEach((item, index) => {
      const itemCenter = item.getBoundingClientRect().left + item.clientWidth / 2;
      const distance = Math.abs(trackCenter - itemCenter);
      if (distance < minDistance) { minDistance = distance; closestItem = item; closestIndex = index; }
    });
    items.forEach(item => item.classList.toggle('active-center', item === closestItem));
    if (closestItem) {
      const newId = closestItem.dataset.id;
      if (currentInsightId !== newId) {
        currentInsightId = newId;
        const prod = PRODUCTS.find(p => p.id === newId);
        if (prod) {
          const nextText = prod.insight || prod.desc;
          abortAll();
          insightEl.classList.add('fade-out');
          fadeTimer = setTimeout(() => startTyping(nextText), 150);
        }
      }
    }
    return closestIndex;
  };

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
          track.scrollTo({ left: targetItem.offsetLeft - track.clientWidth / 2 + targetItem.clientWidth / 2, behavior: 'instant' });
          requestAnimationFrame(() => { track.style.scrollBehavior = 'smooth'; });
        }
      }
    }, 250);
  }, { passive: true });

  function startAutoScroll() {
    stopAutoScroll();
    autoScrollInterval = setInterval(() => {
      const active = track.querySelector('.boutique-item.active-center');
      if (!active) return;
      let next = active.nextElementSibling;
      if (!next) next = track.firstElementChild;
      if (!next) return;
      const targetLeft = next.offsetLeft - track.clientWidth / 2 + next.clientWidth / 2;
      track.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }, SCROLL_DELAY);
  }
  function stopAutoScroll() { clearInterval(autoScrollInterval); }

  track.addEventListener('touchstart', stopAutoScroll, { passive: true });
  track.addEventListener('mousedown', stopAutoScroll);
  track.addEventListener('scroll', () => {
    stopAutoScroll();
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(startAutoScroll, RESUME_DELAY);
  }, { passive: true });

  setTimeout(() => {
    track.style.scrollBehavior = 'auto';
    const midPoint = Math.floor(LOOP_MULTIPLIER / 2) * PRODUCTS.length;
    const targetItem = track.children[midPoint];
    if (targetItem) track.scrollLeft = targetItem.offsetLeft - track.clientWidth / 2 + targetItem.clientWidth / 2;
    requestAnimationFrame(() => { track.style.scrollBehavior = 'smooth'; updateCenter(); });
    startAutoScroll();
  }, 100);
}