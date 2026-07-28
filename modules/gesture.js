let DOM = {};
let closeProductPageFn = null;

export function initGesturesConfig(domConfig, closeFn) { DOM = domConfig; closeProductPageFn = closeFn; }

export function initDetailGestures() {
  const track = DOM.productSwiperTrack;
  if (!track) return;
  let startX = 0, startY = 0, activeSlide = null, isPulling = false, gestureDetermined = false;
  track.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
    const touch = e.touches[0]; startX = touch.clientX; startY = touch.clientY;
    if (startX < 30 || startX > window.innerWidth - 30) { isPulling = false; activeSlide = null; return; }
    activeSlide = e.target.closest('.product-slide');
    isPulling = activeSlide && activeSlide.scrollTop <= 0;
    gestureDetermined = false;
  }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    if (!isPulling || !activeSlide) return;
    const dy = e.touches[0].clientY - startY; const dx = e.touches[0].clientX - startX;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (!gestureDetermined && (absDx > 8 || absDy > 8)) { if (absDx > absDy) { isPulling = false; return; } gestureDetermined = true; }
    if (gestureDetermined && dy > 0) { if (e.cancelable) e.preventDefault(); const resistance = dy * (1 - (dy / (window.innerHeight * 1.5))); activeSlide.style.transform = `translateY(${Math.max(0, resistance)}px)`; }
  }, { passive: false });
  track.addEventListener('touchend', (e) => {
    if (!isPulling || !activeSlide || !gestureDetermined) { isPulling = false; activeSlide = null; return; }
    const dy = e.changedTouches[0].clientY - startY;
    activeSlide.style.transition = 'all 0.3s ease';
    if (dy > 120 && closeProductPageFn) closeProductPageFn(false);
    else activeSlide.style.transform = 'translateY(0)';
    setTimeout(() => { if (activeSlide) { activeSlide.style.transition = ''; activeSlide.style.transform = ''; } isPulling = false; activeSlide = null; }, 300);
  }, { passive: true });
}