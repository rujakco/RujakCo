// modules/navigation.js

let DOM = {};

/**
 * Menyuntikkan cache DOM dari app.js ke modul ini
 */
export function initNavigation(domConfig) {
  DOM = domConfig;
}

export function setActiveNav(activeId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.id === activeId);
  });
}

export function syncBottomNav() {
  setTimeout(() => {
    if (DOM.aiChatBox?.classList.contains('active')) {
      setActiveNav('aiChatToggle');
    } else if (
      DOM.miniCartModal?.classList.contains('active') ||
      document.getElementById('orderConfirmModal')?.classList.contains('active') ||
      DOM.paymentModal?.classList.contains('active')
    ) {
      setActiveNav('navCartBtn');
    } else if (DOM.productPage?.classList.contains('active')) {
      setActiveNav('navProductBtn');
    } else {
      setActiveNav('navHomeBtn');
    }
  }, 50);
}