export function initAccessibility() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const stack = window.__overlayStack__ || [];
    const topModal = stack.length > 0 ? stack[stack.length - 1] : null;
    if (!topModal) return;
    const focusable = topModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}