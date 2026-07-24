// Helper untuk deteksi elemen yang benar-benar terlihat.
// offsetParent === null tidak cukup karena elemen dengan position:fixed
// (mis. tombol back/share di halaman produk) juga selalu null walau
// sedang tampil penuh. getClientRects() > 0 adalah cara yang akurat.
function isVisible(el) {
  if (el.hidden || el.disabled) return false;
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return el.getClientRects().length > 0;
}

export function initAccessibility() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const stack = window.__overlayStack__ || [];
    const topModal = stack.length > 0 ? stack[stack.length - 1] : null;
    if (!topModal) return;
    const allFocusable = topModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const focusable = Array.from(allFocusable).filter(isVisible);
    if (focusable.length === 0) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}