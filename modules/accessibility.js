// modules/accessibility.js — Final (selektor stabil)
export function initAccessibility() {
  document.addEventListener('keydown', (e) => {
    // ✅ Gunakan kelas .active, bukan inline style
    const activeModal = document.querySelector('.modal-overlay.active, .product-swiper-overlay.active');
    if (!activeModal) return;

    if (e.key === 'Tab') {
      const focusable = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}