(function() {
  'use strict';

  // ---- Data ----
  const PRODUCTS = [
    { id: 'p1', name: 'Rujak Segar', price: 35000, img: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp' },
    { id: 'p2', name: 'Rujak Serut', price: 26000, img: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp' },
    { id: 'p3', name: 'Gaco Premium', price: 40000, img: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp' },
    { id: 'p4', name: 'Rama Sharing', price: 48000, img: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp' },
    { id: 'p5', name: 'Mahkota', price: 85000, img: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp' },
  ];

  const ADDONS = [
    { id: 'a1', name: 'Sambal Ekstra', price: 8000 },
    { id: 'a2', name: 'Mete Ekstra', price: 12000 },
  ];

  const WA_NUMBER = '6289677161680';

  // ---- State ----
  let cart = {};
  let currentProduct = null;

  // ---- Helpers ----
  const fmt = (n) => 'Rp' + n.toLocaleString('id-ID');

  const toast = (msg) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2000);
  };

  // ---- Render ----
  const renderProducts = () => {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map(p => `
      <div class="card" data-id="${p.id}">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
        <div class="info">
          <h3>${p.name}</h3>
          <div class="price">${fmt(p.price)}</div>
        </div>
      </div>
    `).join('');
  };

  const renderAddons = () => {
    const container = document.getElementById('addonScroll');
    if (!container) return;
    container.innerHTML = ADDONS.map(a => `
      <div class="addon-item" data-id="${a.id}">
        <div class="name">${a.name}</div>
        <div class="price">${fmt(a.price)}</div>
        <button data-action="add-addon" data-id="${a.id}">+</button>
      </div>
    `).join('');
  };

  const updateCartUI = () => {
    const bar = document.getElementById('bottomBar');
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');

    const items = Object.values(cart);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);

    if (countEl) countEl.textContent = count + ' item';
    if (totalEl) totalEl.textContent = fmt(total);

    bar.classList.toggle('visible', count > 0);
  };

  // ---- Cart Actions ----
  const addToCart = (id, qty) => {
    const item = PRODUCTS.find(p => p.id === id) || ADDONS.find(a => a.id === id);
    if (!item) return;
    cart[id] = cart[id] || { ...item, qty: 0 };
    cart[id].qty += qty;
    updateCartUI();
    toast('Ditambahkan');
  };

  // ---- Detail ----
  const openDetail = (id) => {
    const p = PRODUCTS.find(prod => prod.id === id);
    if (!p) return;
    currentProduct = p;
    const modal = document.getElementById('detailModal');
    document.getElementById('detailImg').src = p.img;
    document.getElementById('detailName').textContent = p.name;
    document.getElementById('detailPrice').textContent = fmt(p.price);
    modal.classList.add('visible');
  };

  const closeDetail = () => {
    document.getElementById('detailModal').classList.remove('visible');
  };

  // ---- Checkout ----
  const openCheckout = () => {
    const items = Object.values(cart);
    if (items.length === 0) { toast('Keranjang kosong'); return; }
    const container = document.getElementById('checkoutItems');
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    container.innerHTML = items.map(i => `
      <div class="item">
        <span>${i.name} × ${i.qty}</span>
        <span>${fmt(i.price * i.qty)}</span>
      </div>
    `).join('');
    document.getElementById('checkoutTotal').textContent = 'Total: ' + fmt(total);
    document.getElementById('checkoutModal').classList.add('visible');
  };

  const closeCheckout = () => {
    document.getElementById('checkoutModal').classList.remove('visible');
  };

  const confirmOrder = () => {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    if (!name || !phone || !address) { toast('Isi semua data'); return; }

    const items = Object.values(cart);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const msg = `*Rujak.Co*\nNama: ${name}\nTelepon: ${phone}\nAlamat: ${address}\n\n${items.map(i => `${i.name} × ${i.qty}`).join('\n')}\nTotal: ${fmt(total)}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    cart = {};
    updateCartUI();
    closeCheckout();
    toast('Pesanan dikirim ✓');
  };

  // ---- Events ----
  const setupEvents = () => {
    document.addEventListener('click', (e) => {
      // Product card
      const card = e.target.closest('.card');
      if (card && !e.target.closest('button')) {
        openDetail(card.dataset.id);
        return;
      }

      // Addon
      const addonBtn = e.target.closest('[data-action="add-addon"]');
      if (addonBtn) {
        addToCart(addonBtn.dataset.id, 1);
        return;
      }

      // Detail close
      if (e.target.closest('#detailClose') || (e.target.closest('.detail-overlay') && !e.target.closest('.detail-sheet'))) {
        closeDetail();
        return;
      }

      // Detail add
      if (e.target.closest('#detailAddBtn') && currentProduct) {
        addToCart(currentProduct.id, 1);
        closeDetail();
        return;
      }

      // Checkout
      if (e.target.closest('#checkoutBtn')) { openCheckout(); return; }
      if (e.target.closest('.checkout-overlay') && !e.target.closest('.checkout-sheet')) { closeCheckout(); return; }
      if (e.target.closest('#confirmOrder')) { confirmOrder(); return; }

      // Hero scroll
      if (e.target.closest('[data-scroll="products"]')) {
        document.getElementById('productGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeDetail(); closeCheckout(); }
    });
  };

  // ---- Init ----
  const init = () => {
    renderProducts();
    renderAddons();
    updateCartUI();
    setupEvents();

    // Store status
    const hour = new Date().getHours();
    const statusEl = document.getElementById('storeStatus');
    if (statusEl) statusEl.textContent = (hour >= 10 && hour < 20) ? 'Buka' : 'Tutup';

    setTimeout(() => toast('Selamat datang'), 400);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();