(function() {
  'use strict';

  // === SUPABASE CONFIG ===
  const SUPABASE_URL = "https://xkyduxhjlmvhzdavbbwk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhreWR1eGhqbG12aHpkYXZiYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTEzNzQsImV4cCI6MjA5Nzc4NzM3NH0.ua2hvVLuDuQ36c91ZjO215GtdJp-Cs9zzdK36_52L-Y";

  let supabase = null;
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('Supabase client tidak tersedia.');
  }

  // ===== CONFIG & DATA =====
  const SYSTEM = {
    DISCOUNT_THRESHOLD: 100000,
    DISCOUNT_AMOUNT: 10000,
    WA_NUMBER: '6289677161680',
    TOAST_DURATION: 3000,
    MAX_DISTANCE: 50
  };

  const PRODUCTS = [
    {
      id: 'p_m1', name: 'Rujak Segar', desc: 'Kombinasi buah pilihan dengan sambal original. Ringan dan segar.',
      price: 28000, cat: 'classic', tags: ['Pilihan Klasik', '5 Buah'],
      container: 'Thinwall 750ml', size: 'Porsi Reguler', sambal: 'Sambal Original (1 Cup)',
      buah: ['Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Segar & Autentik',
      defaultSpice: 3, portion: '1 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp'
    },
    {
      id: 'p_m2', name: 'Rujak Serut', desc: 'Buah diserut halus untuk pengalaman rasa yang menyatu.',
      price: 26000, cat: 'classic', tags: ['Renyah', 'Serut'],
      container: 'Thinwall 750ml', size: 'Porsi Reguler', sambal: 'Sambal Original (1 Cup)',
      buah: ['Mangga Muda', 'Bengkoang', 'Nanas', 'Ubi Merah'], flavor: 'Renyah Segar', flavorTag: 'Renyah',
      defaultSpice: 3, portion: '1 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp'
    },
    {
      id: 'p_m3', name: 'Rujak Gaco', desc: 'Enam buah pilihan dengan sambal mete premium.',
      price: 40000, cat: 'signature', tags: ['Mete Premium', 'Bestseller'], badge: 'Koleksi Favorit', badgeColor: 'red',
      container: 'Thinwall 750ml', size: 'Porsi Reguler', sambal: 'Sambal Mete Premium (1 Cup)',
      buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Gurih Mete',
      defaultSpice: 3, portion: '1 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp'
    },
    {
      id: 'p_m4', name: 'Rujak Rama', desc: 'Porsi melimpah untuk dua hingga tiga orang.',
      price: 48000, cat: 'signature', tags: ['Porsi Besar', 'Sharing'], badge: 'Untuk Dibagi', badgeColor: 'red',
      container: 'Thinwall Jumbo 1000ml', size: 'Porsi Sharing', sambal: 'Sambal Mete Premium (2 Cup)',
      buah: ['Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Gurih Extra',
      defaultSpice: 4, portion: '2-3 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp'
    },
    {
      id: 'p_m5', name: 'Rujak Mahkota', desc: 'Koleksi premium dengan Shine Muscat untuk momen istimewa.',
      price: 85000, cat: 'reserve', tags: ['Eksklusif', 'Shine Muscat'], badge: 'Reserve', badgeColor: 'gold',
      container: 'Thinwall Jumbo 1000ml', size: 'Porsi Premium', sambal: 'Sambal Mete Premium (2 Cup)',
      buah: ['Shine Muscat', 'Jambu Kristal', 'Mangga Muda', 'Nanas', 'Bengkoang', 'Jambu Air', 'Kedondong'], flavor: 'Eksklusif',
      defaultSpice: 3, portion: '1-2 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp'
    },
    {
      id: 'p_secret1', name: 'Mahkota VIP', desc: 'Menu rahasia: Ekstra porsi Muscat dengan potongan harga.',
      price: 75000, cat: 'secret', tags: ['Secret Menu'], badge: 'VIP Only', badgeColor: 'gold',
      container: 'Thinwall Jumbo 1000ml', size: 'Porsi Jumbo', sambal: 'Sambal Mete Premium (3 Cup)',
      buah: ['Shine Muscat Extra', 'Jambu Kristal', 'Mangga Muda'], flavor: 'Ultra Premium',
      defaultSpice: 3, portion: '2 Orang',
      thumbnail: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp',
      image: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp'
    }
  ];

  const ADDONS = [
    { id: 'a_sambal1', name: 'Sambal Original', price: 8000, icon: 'flame', iconColor: 'text-red-500', desc: 'Warisan rasa klasik.' },
    { id: 'a_sambal2', name: 'Sambal Mete Premium', price: 12000, icon: 'flame', iconColor: 'text-red-600', desc: 'Lebih gurih.' },
    { id: 'a_extra_jambu', name: 'Extra Jambu Kristal', price: 10000, icon: 'apple', iconColor: 'text-green-500', desc: 'Tambahan jambu.' },
    { id: 'a_extra_muscat', name: 'Extra Shine Muscat', price: 15000, icon: 'grape', iconColor: 'text-purple-500', desc: 'Tambahan anggur impor.' }
  ];

  const state = {
    cart: {}, activeFilter: 'all', searchQuery: '', userDistance: null, areaName: 'Pilih Area',
    isGift: false
  };

  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function getItemById(id) {
    let item = PRODUCTS.find(p => p.id === id) || ADDONS.find(a => a.id === id);
    if(item) return item;
    return PRODUCTS.find(p => id.startsWith(p.id + '_'));
  }
  
  // TOAST
  let toastTimer;
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), SYSTEM.TOAST_DURATION);
  }

  function checkStoreStatus() {
    const now = new Date();
    const day = now.getDay(); 
    const hour = now.getHours();
    let isOpen = false; let text = '🔴 Tutup (Terima Pre-Order)';
    if(day >= 1 && day <= 5) {
      if(hour >= 10 && hour < 20) { isOpen = true; text = '🟢 Toko Buka'; }
    } else {
      if(hour >= 9 && hour < 18) { isOpen = true; text = '🟢 Toko Buka'; }
    }
    const badge = document.getElementById('storeStatusBadge');
    if(badge) {
      badge.textContent = text;
      badge.className = 'store-status-badge ' + (isOpen ? 'open' : 'closed');
    }
  }

  function renderMenu() {
    const container = document.getElementById('menuList');
    const empty = document.getElementById('emptyState');
    document.getElementById('skeletonContainer').style.display = 'none';
    
    if (state.activeFilter === 'addon') { container.style.display='none'; return; }
    container.style.display = 'block';

    const q = state.searchQuery.toLowerCase().trim();
    const isSecretTrigger = (q === 'vip');

    const filtered = PRODUCTS.filter(p => {
      if(p.cat === 'secret') return isSecretTrigger;
      const matchCat = (state.activeFilter === 'all' || p.cat === state.activeFilter);
      return matchCat && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    });

    if (!filtered.length) { empty.style.display = 'block'; container.innerHTML = ''; return; }
    empty.style.display = 'none';

    let html = '';
    filtered.forEach(p => {
      let qty = 0; let firstCartKey = p.id;
      Object.keys(state.cart).forEach(k => {
        if (k === p.id || k.startsWith(p.id + '_')) { qty += state.cart[k].qty; if (qty === state.cart[k].qty) firstCartKey = k; }
      });
      const control = qty === 0
        ? `<button type="button" class="add-btn" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus"></i></button>`
        : `<div class="qty-control"><button data-action="decrease" data-id="${firstCartKey}" class="qty-btn">−</button><span class="qty-num">${qty}</span><button data-action="increase" data-id="${firstCartKey}" class="qty-btn">+</button></div>`;
      
      const badge = p.badge ? `<span class="item-badge-right" style="background:var(--${p.badgeColor==='gold'?'gray-900':'red'}); color:var(--${p.badgeColor==='gold'?'gold':'white'})">${p.badge}</span>` : '';
      
      html += `<div class="menu-item" data-id="${p.id}">
        <div class="item-img-wrap"><img src="${p.thumbnail}" alt="${p.name}"></div>
        <div class="item-body">
          <div class="item-name-row"><span class="item-name">${p.name}</span>${badge}</div>
          <p class="item-flavor">${p.flavor}</p>
          <div class="item-spice">🌶️ Level 1–5</div>
          <p class="item-desc">${p.desc}</p>
          <div class="item-footer">
            <div><span class="item-price">${fmt(p.price)}</span></div>
            ${control}
          </div>
        </div>
      </div>`;
    });
    container.innerHTML = html;
  }

  function renderAddons() {
    const container = document.getElementById('addonList');
    const q = state.searchQuery.toLowerCase();
    const filtered = ADDONS.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    let html = '';
    filtered.forEach(a => {
      const qty = state.cart[a.id] ? state.cart[a.id].qty : 0;
      const control = qty === 0
        ? `<button class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus"></i></button>`
        : `<div class="qty-control"><button class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`;
      html += `<div class="addon-card">
        <div class="addon-name" style="color:var(--gray-900)"><i data-lucide="${a.icon}" class="${a.iconColor} inline w-4 h-4"></i> ${a.name}</div>
        <div class="addon-desc">${a.desc}</div>
        <div class="addon-footer"><span class="addon-price">${fmt(a.price)}</span>${control}</div>
      </div>`;
    });
    container.innerHTML = html;
    document.getElementById('addonHeader').style.display = filtered.length ? 'flex' : 'none';
    document.getElementById('addonDivider').style.display = filtered.length ? 'block' : 'none';
  }

  function renderCart() {
    let totalQty = 0, subtotal = 0;
    Object.keys(state.cart).forEach(id => {
      const item = getItemById(id);
      if (item) { totalQty += state.cart[id].qty; subtotal += item.price * state.cart[id].qty; } 
      else delete state.cart[id];
    });
    
    const bar = document.getElementById('bottom-bar');
    if (totalQty > 0 && !state.isCartMinimized) {
      bar.classList.add('visible');
      document.getElementById('cartPreview').textContent = totalQty + ' item';
      const el = document.getElementById('cartTotalDisplay');
      if (subtotal >= SYSTEM.DISCOUNT_THRESHOLD) {
        document.getElementById('discountLabel').style.display = 'inline-block';
        el.innerHTML = `<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;">${fmt(subtotal)}</span> ${fmt(subtotal - SYSTEM.DISCOUNT_AMOUNT)}`;
      } else {
        document.getElementById('discountLabel').style.display = 'none';
        el.textContent = fmt(subtotal);
      }
    } else bar.classList.remove('visible');
    
    document.getElementById('floatingCartBtn').classList.toggle('visible', state.isCartMinimized && totalQty > 0);
    document.getElementById('floatingBadge').textContent = totalQty;
    localStorage.setItem('rujak_cart', JSON.stringify(state.cart));
  }

  function renderMiniCart() {
    const list = document.getElementById('miniCartList');
    let subtotal = 0, html = '';
    const keys = Object.keys(state.cart);

    if (keys.length === 0) {
      html = '<p style="text-align:center;color:#9CA3AF;">Keranjang kosong</p>';
      document.getElementById('miniCartShipping').style.display = 'none';
    } else {
      document.getElementById('miniCartShipping').style.display = 'flex';
      keys.forEach(id => {
        const item = getItemById(id);
        if(!item) return;
        const entry = state.cart[id];
        subtotal += item.price * entry.qty;
        const spiceText = entry.spice ? ` <span style="color:var(--red);font-size:11px;">(Lv.${entry.spice})</span>` : '';
        html += `<div class="mini-cart-item">
          <div class="mini-cart-info"><div class="mini-cart-name">${item.name}${spiceText}</div><div class="mini-cart-detail">${fmt(item.price)}</div></div>
          <div class="mini-cart-qty"><button data-action="decrease" data-id="${id}">−</button><span>${entry.qty}</span><button data-action="increase" data-id="${id}">+</button></div>
        </div>`;
      });
    }
    list.innerHTML = html;

    const progText = document.getElementById('promoProgressText');
    const progStatus = document.getElementById('promoProgressStatus');
    const progBar = document.getElementById('promoProgressBar');
    if(subtotal === 0) {
      progText.textContent = `Kejar Diskon Rp10.000`; progStatus.textContent = ''; progBar.style.width = '0%';
    } else if(subtotal < SYSTEM.DISCOUNT_THRESHOLD) {
      const kurang = SYSTEM.DISCOUNT_THRESHOLD - subtotal;
      const pct = (subtotal / SYSTEM.DISCOUNT_THRESHOLD) * 100;
      progText.textContent = `Tambah Add-on / Item`;
      progStatus.textContent = `Kurang ${fmt(kurang)}`;
      progBar.style.width = `${pct}%`;
      progBar.style.background = 'var(--gold)';
    } else {
      progText.textContent = `🎉 Selamat!`;
      progStatus.textContent = `Promo Rp10.000 Aktif`;
      progStatus.style.color = 'var(--green)';
      progBar.style.width = `100%`;
      progBar.style.background = 'var(--green)';
    }

    let shippingCost = 0;
    if(state.userDistance !== null && state.userDistance <= SYSTEM.MAX_DISTANCE) {
      shippingCost = state.userDistance <= 3 ? 12000 : 12000 + ((state.userDistance - 3) * 2500);
    }
    const discount = subtotal >= SYSTEM.DISCOUNT_THRESHOLD ? SYSTEM.DISCOUNT_AMOUNT : 0;
    document.getElementById('miniCartShippingAmount').textContent = state.userDistance === null ? 'Pilih Area ↑' : fmt(shippingCost);
    document.getElementById('locationDisplay').textContent = state.areaName;
    document.getElementById('miniCartFinalTotal').textContent = fmt(subtotal - discount + shippingCost);

    const btnPay = document.getElementById('btnOpenPayment');
    if (keys.length === 0) { btnPay.disabled=true; btnPay.textContent='Keranjang kosong'; btnPay.style.opacity='0.5'; }
    else if (state.userDistance === null) { btnPay.disabled=true; btnPay.textContent='Pilih Area Pengiriman'; btnPay.style.opacity='0.5'; }
    else if (state.userDistance > SYSTEM.MAX_DISTANCE) { btnPay.disabled=true; btnPay.textContent='Di luar jangkauan Lalamove'; btnPay.style.opacity='0.5'; }
    else { btnPay.disabled=false; btnPay.textContent='Bayar Via QRIS'; btnPay.style.opacity='1'; }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderAll() { renderMenu(); renderAddons(); renderCart(); if(document.getElementById('miniCartModal').classList.contains('active')) renderMiniCart(); if(typeof lucide !== 'undefined') lucide.createIcons(); }

  function debounce(fn, delay) {
    let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
  }

  // ===== SAVE TO SUPABASE =====
  async function saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount) {
    if (!supabase) return false;
    try {
      let notes = document.getElementById('orderNotes').value || '';
      if(state.isGift) {
        notes = `🎁 [KADO] Dari: ${document.getElementById('giftSender').value || 'Hamba Allah'} | Ucapan: ${document.getElementById('giftGreeting').value || '-'} | Catatan: ${notes}`;
      }
      const payload = {
        customer_name: document.getElementById('customerName').value || 'Guest',
        customer_phone: document.getElementById('customerPhone').value || '',
        customer_address: document.getElementById('customerAddress').value || '',
        items: orderItems,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        discount: discount,
        total: total,
        status: 'pending'
      };
      
      // Karena kita tidak mendefinisikan notes di schema awal, kita bisa menyisipkannya ke address atau membiarkannya jika tabel Anda punya kolom 'notes'
      // Untuk amannya, kita gabung notes ke dalam customer_address jika Anda belum menambah kolom 'notes'
      payload.customer_address += notes ? `\n(Catatan: ${notes})` : '';

      const { error } = await supabase.from('orders').insert([payload]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase error:', err);
      return false;
    }
  }

  // ===== CHECKOUT & WA GENERATOR =====
  function handleCheckout() {
    const keys = Object.keys(state.cart);
    let subtotal = 0;
    let msg = 'Halo Rujak.Co! Saya mau pesan:\n\n';
    const orderItems = [];
    
    keys.forEach(id => {
      const item = getItemById(id);
      if(item) {
        const qty = state.cart[id].qty;
        subtotal += item.price * qty;
        const sText = state.cart[id].spice ? `(Lv.${state.cart[id].spice})` : '';
        msg += `• ${item.name} ${sText} x${qty} - ${fmt(item.price * qty)}\n`;
        orderItems.push({ product_id: id, name: item.name, price: item.price, qty: qty, spice: state.cart[id].spice || null });
      }
    });

    let shippingCost = state.userDistance <= 3 ? 12000 : 12000 + ((state.userDistance - 3) * 2500);
    const discount = subtotal >= SYSTEM.DISCOUNT_THRESHOLD ? SYSTEM.DISCOUNT_AMOUNT : 0;
    const total = subtotal - discount + shippingCost;

    if(document.getElementById('orderNotes').value) msg += `\n*Catatan:* ${document.getElementById('orderNotes').value}\n`;

    if(state.isGift) {
      msg += `\n🎁 *PESANAN KADO / HANTARAN* 🎁\n`;
      msg += `Dari: ${document.getElementById('giftSender').value || 'Hamba Allah'}\n`;
      msg += `Ucapan: "${document.getElementById('giftGreeting').value || '-'}"\n`;
      msg += `❗️ *TOLONG NOTA/HARGA DISEMBUNYIKAN* ❗️\n`;
    }

    msg += `\n*Penerima:* ${document.getElementById('customerName').value}\n`;
    msg += `*WA:* ${document.getElementById('customerPhone').value}\n`;
    msg += `*Alamat:* ${document.getElementById('customerAddress').value}\n`;
    msg += `*Area:* ${state.areaName} (${state.userDistance}km)\n`;
    
    msg += `\nSubtotal: ${fmt(subtotal)}`;
    if(discount>0) msg += `\nPromo: -${fmt(discount)}`;
    msg += `\nOngkir (Est Lalamove): ${fmt(shippingCost)}`;
    msg += `\n*Total Transfer: ${fmt(total)}*\n\n_Ini bukti transfer QRIS saya:_`;

    // Amankan Tombol UI sebelum redirect WA
    const btnPay = document.getElementById('btnOpenPayment');
    const origText = btnPay ? btnPay.textContent : 'Bayar';
    if(btnPay) { btnPay.disabled = true; btnPay.textContent = '⏳ Memproses...'; }

    // Eksekusi Simpan DB -> WA
    saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount).finally(() => {
      if(btnPay) { btnPay.disabled = false; btnPay.textContent = origText; }
      
      // Trik agar Pop-up Blocker browser tidak memblokir WA karena menunggu proses async Supabase
      setTimeout(() => {
        window.open(`https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
      }, 100);
    });
  }

  // ===== INITIALIZATION & EVENTS =====
  function init() {
    checkStoreStatus();
    loadCart();
    
    try {
      const raw = localStorage.getItem('rujak_cust_v2');
      if(raw) {
        const d = JSON.parse(raw);
        document.getElementById('customerName').value = d.name || '';
        document.getElementById('customerPhone').value = d.phone || '';
        document.getElementById('customerAddress').value = d.address || '';
      }
      state.isCartMinimized = localStorage.getItem('rujak_cart_minimized') === 'true';
    } catch(e){}

    document.getElementById('customerArea').addEventListener('change', function() {
      if(!this.value) return;
      const parts = this.value.split('|');
      state.userDistance = parseFloat(parts[0]);
      state.areaName = parts[1];
      showToast('Area diatur ke ' + state.areaName);
      if(document.getElementById('miniCartModal').classList.contains('active')) renderMiniCart();
    });

    document.getElementById('isGiftToggle').addEventListener('change', function() {
      state.isGift = this.checked;
      document.getElementById('giftFields').style.display = this.checked ? 'block' : 'none';
    });

    renderAll();
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
    else setInterval(()=> { if(typeof lucide !== 'undefined') lucide.createIcons(); }, 200);
  }

  document.addEventListener('click', function(e) {
    const act = e.target.closest('[data-action]');
    if(act) {
      const action = act.dataset.action, id = act.dataset.id;
      if(action === 'open-modal') {
        const p = PRODUCTS.find(x => x.id === id);
        if(!p) return;
        document.getElementById('modalImg').innerHTML = `<img src="${p.image}">`;
        document.getElementById('modalTitle').textContent = p.name;
        document.getElementById('modalDesc').textContent = p.desc;
        document.getElementById('modalContainer').textContent = p.container;
        document.getElementById('modalSize').textContent = p.size;
        document.getElementById('modalSambal').textContent = p.sambal;
        document.getElementById('btnPrice').textContent = fmt(p.price);
        document.getElementById('modalAdd').dataset.id = p.id;
        document.getElementById('productModal').classList.add('active');
        return;
      }
      if(action === 'add-addon' && id) {
        if(!state.cart[id]) state.cart[id] = {qty:1}; else state.cart[id].qty++;
        renderAll(); showToast('Ditambahkan'); return;
      }
      if(action === 'increase' && id && state.cart[id]) { state.cart[id].qty++; renderAll(); return; }
      if(action === 'decrease' && id && state.cart[id]) { state.cart[id].qty--; if(state.cart[id].qty<=0) delete state.cart[id]; renderAll(); return; }
      if(action === 'open-cart') { document.getElementById('miniCartModal').classList.add('active'); renderMiniCart(); return; }
      if(action === 'confirm-wa') { handleCheckout(); return; }
      if(action === 'toast') { showToast(act.dataset.msg); return; }
    }

    if(e.target.closest('#modalAdd')) {
      const id = e.target.closest('#modalAdd').dataset.id;
      const spice = parseInt(document.getElementById('spiceSelect').value)||3;
      const key = id + '_' + spice;
      if(!state.cart[key]) state.cart[key] = {qty:1, spice:spice}; else state.cart[key].qty++;
      renderAll(); showToast('Ditambahkan');
      document.getElementById('productModal').classList.remove('active');
    }

    if(e.target.closest('#btnOpenPayment')) {
      if(state.userDistance === null) return showToast('Pilih Area Pengiriman di Dropdown');
      if(!document.getElementById('customerName').value) return showToast('Nama harus diisi');
      
      localStorage.setItem('rujak_cust_v2', JSON.stringify({
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value
      }));

      document.getElementById('paymentTotalDisplay').textContent = document.getElementById('miniCartFinalTotal').textContent;
      document.getElementById('miniCartModal').classList.remove('active');
      document.getElementById('paymentModal').classList.add('active');
    }

    if(e.target.closest('#btnShareMenu')) {
      const text = "Eh, mau nitip pesen Rujak.Co gak? Mumpung gue lagi mau pesen nih. Rujaknya mantap pake sambal mete. Cek menunya: " + window.location.href;
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    }

    if(e.target.closest('.modal-close')) { e.target.closest('.modal-overlay').classList.remove('active'); }
    
    const cat = e.target.closest('.cat-pill');
    if(cat) {
      document.querySelectorAll('.cat-pill').forEach(c=>c.classList.remove('active'));
      cat.classList.add('active'); state.activeFilter = cat.dataset.cat; renderAll();
    }
  });

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', debounce(function() {
    state.searchQuery = this.value; renderAll();
  }, 300));
  document.getElementById('clearSearchBtn').addEventListener('click', () => {
    searchInput.value = ''; state.searchQuery = ''; renderAll();
  });

  document.getElementById('closeBottomBar').addEventListener('click', (e) => {
    e.stopPropagation(); state.isCartMinimized=true; localStorage.setItem('rujak_cart_minimized','true'); renderAll();
  });
  document.getElementById('floatingCartBtn').addEventListener('click', () => {
    state.isCartMinimized=false; localStorage.setItem('rujak_cart_minimized','false'); renderAll();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
