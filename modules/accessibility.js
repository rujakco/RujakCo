// modules/accessibility.js
export function initAccessibility() {
  document.addEventListener('keydown', (e) => {
    // ESC Handler
    if (e.key === 'Escape') {
      const modals = ['productPage', 'miniCartModal', 'paymentModal', 'aiChatBox'];
      for (let id of modals) {
        const el = document.getElementById(id);
        if (!el) continue;
        const isVisible = el.style.display !== 'none' && (el.classList.contains('active') || el.getAttribute('aria-hidden') === 'false');
        if (isVisible) {
          const closeBtn = el.querySelector('[id$="Close"]') || el.querySelector('.floating-close');
          if (closeBtn) {
            closeBtn.click();
            e.preventDefault();
            break;
          }
        }
      }
    }

    // Focus Trap
    const activeModal = document.querySelector('.modal-overlay.active, .product-swiper-overlay[style*="display: flex"]');
    if (activeModal && e.key === 'Tab') {
      const focusable = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  });
}