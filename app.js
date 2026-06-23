(function() {
  'use strict';

  // === SUPABASE CONFIG ===
  const SUPABASE_URL = "https://xkyduxhjlmvhzdavbbwk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhreWR1eGhqbG12aHpkYXZiYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTEzNzQsImV4cCI6MjA5Nzc4NzM3NH0.ua2hvVLuDuQ36c91ZjO215GtdJp-Cs9zzdK36_52L-Y";

  let supabase = null;
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('Supabase client tidak tersedia. Pastikan library @supabase/supabase-js sudah dimuat.');
  }

  // ===== DATA PRODUK, ADDONS, SYSTEM =====
  const PRODUCTS = [ /* ... (sama seperti sebelumnya) ... */ ];
  const ADDONS = [ /* ... (sama) ... */ ];
  const SYSTEM = { /* ... (sama) ... */ };

  // ===== STATE =====
  const state = {
    cart: {},
    activeFilter: 'all',
    searchQuery: '',
    userDistance: null,
    isPriority: false,
    orderNotes: '',
    isCartMinimized: false,
    customerName: '',
    customerPhone: '',
    customerAddress: ''
  };

  // ===== FUNGSI UTILITY =====
  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function loadCart() { /* ... (sama) ... */ }
  function saveCart() { /* ... (sama) ... */ }
  function getItemById(id) { /* ... (sama) ... */ }
  function debounce(fn, delay) { /* ... (sama) ... */ }

  // ===== FUNGSI ONGKIR & LOKASI =====
  function calculateShipping(d, priority) { /* ... (sama) ... */ }
  function getLocationFallback() { /* ... (sama) ... */ }
  function updateShippingUI(distance, isPriority) { /* ... (sama) ... */ }
  function detectLocation() { /* ... (sama) ... */ }

  // ===== RENDER FUNCTIONS =====
  function renderMenu() { /* ... (sama) ... */ }
  function renderAddons() { /* ... (sama) ... */ }
  function renderCart() { /* ... (sama) ... */ }
  function renderMiniCart() { /* ... (sama) ... */ }
  function renderAll() { /* ... (sama) ... */ }

  // ===== MODAL PRODUK =====
  // (fungsi openProductModal, closeProductModal, updateSpiceHighlight sama)

  // ===== MINI CART =====
  // (openMiniCart, closeMiniCart, clearCart, downloadQRIS sama)

  // ===== FUNGSI SIMPAN KE SUPABASE (DIPERBAIKI) =====
  async function saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount) {
    if (!supabase) {
      console.warn('Supabase client tidak tersedia. Order tidak disimpan.');
      return false;
    }

    try {
      // Siapkan data yang akan dikirim
      const payload = {
        customer_name: state.customerName || 'Guest',
        customer_phone: state.customerPhone || '',
        customer_address: state.customerAddress || '',
        items: orderItems, // array objek { product_id, name, price, qty, spice }
        subtotal: subtotal,
        shipping_cost: shippingCost,
        discount: discount,
        total: total,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([payload]);

      if (error) throw error;

      showToast('✅ Order berhasil disimpan!');
      return true;
    } catch (err) {
      console.error('Supabase insert error:', err);
      // Tampilkan toast error tapi tetap lanjutkan ke WhatsApp
      showToast('❌ Gagal menyimpan order, tetapi pesanan tetap diteruskan.');
      return false;
    }
  }

  // ===== HANDLE CHECKOUT (DIPERBAIKI) =====
  function handleCheckout() {
    // Validasi jarak
    if (state.userDistance !== null && state.userDistance > SYSTEM.MAX_DISTANCE) {
      showToast('Maaf, pengiriman hanya tersedia untuk wilayah Jabodetabek (maks. 50 km)');
      return;
    }

    // Ambil data dari form (sudah tersimpan di state)
    const name = state.customerName.trim();
    const phone = state.customerPhone.trim();
    const address = state.customerAddress.trim();

    // Validasi sederhana
    if (!name || name.length < 2) {
      showToast('❌ Nama penerima harus diisi (min. 2 karakter)');
      document.getElementById('customerName').focus();
      return;
    }
    if (!phone || phone.length < 8) {
      showToast('❌ Nomor HP harus diisi (min. 8 digit)');
      document.getElementById('customerPhone').focus();
      return;
    }
    if (!address || address.length < 5) {
      showToast('❌ Alamat pengiriman harus diisi (min. 5 karakter)');
      document.getElementById('customerAddress').focus();
      return;
    }

    // Ambil item keranjang
    const keys = Object.keys(state.cart);
    if (keys.length === 0) {
      showToast('Keranjang kosong');
      return;
    }

    // Hitung subtotal dan siapkan data order untuk database
    let subtotal = 0;
    const orderItems = [];
    keys.forEach(id => {
      const entry = state.cart[id];
      const item = getItemById(id);
      if (item && entry) {
        const price = item.price;
        const qty = entry.qty;
        subtotal += price * qty;
        orderItems.push({
          product_id: id,
          name: item.name,
          price: price,
          qty: qty,
          spice: entry.spice || null
        });
      }
    });

    // Hitung ongkir, diskon, total
    const dist = state.userDistance !== null ? state.userDistance : SYSTEM.DEFAULT_DISTANCE;
    const ship = calculateShipping(dist, state.isPriority);
    const shippingCost = ship.cost === Infinity ? 0 : ship.cost;
    const discount = subtotal >= SYSTEM.DISCOUNT_THRESHOLD ? SYSTEM.DISCOUNT_AMOUNT : 0;
    const total = subtotal - discount + shippingCost;

    // === SAVE KE DATABASE (Async, tidak blocking) ===
    // Tampilkan loading state pada tombol bayar (jika modal pembayaran terbuka)
    const payBtn = document.querySelector('#btnOpenPayment');
    const originalText = payBtn ? payBtn.textContent : '';
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = '⏳ Menyimpan...';
    }

    // Panggil fungsi save (tidak perlu await, biarkan berjalan async)
    saveOrderToDatabase(orderItems, total, subtotal, shippingCost, discount)
      .finally(() => {
        // Kembalikan tombol ke keadaan semula
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.textContent = originalText || 'Bayar Via QRIS';
        }
      });

    // === BUAT PESAN WHATSAPP ===
    let msg = 'Halo Rujak.Co! Saya ingin memesan:\n\n';
    keys.forEach(id => {
      const entry = state.cart[id];
      const item = getItemById(id);
      if (item && entry) {
        const spiceText = entry.spice ? ` (Level ${entry.spice})` : '';
        msg += `• ${item.name}${spiceText} (x${entry.qty}) — ${fmt(item.price * entry.qty)}\n`;
      }
    });

    if (state.orderNotes) msg += `\n*Catatan Pesanan:*\n${state.orderNotes}\n`;
    msg += `\n*Data Pengiriman:*\nNama : ${name}\nNo. HP : ${phone}\nAlamat : ${address}\n`;
    msg += `\nOngkir: ${fmt(shippingCost)} (${ship.label})`;
    msg += `\nSubtotal: ${fmt(subtotal)}`;
    if (discount > 0) msg += `\nPotongan Khusus: -${fmt(discount)}`;
    msg += `\n*Total Akhir: ${fmt(total)}*\n\n`;
    msg += `*Saya sudah transfer via QRIS, ini bukti transfernya:*\n*(sertakan foto)*`;

    // Buka WhatsApp
    window.open(`https://wa.me/${SYSTEM.WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');

    // Kosongkan keranjang setelah checkout (opsional)
    // state.cart = {};
    // renderAll();
    // closeMiniCart();
  }

  // ===== EVENT LISTENER =====
  // Semua event listener yang sudah ada, ditambah:
  // - Menyimpan data pelanggan ke localStorage saat input berubah
  // - Menampilkan loading pada tombol

  // === MENYIMPAN DATA PELANGGAN KE LOCALSTORAGE ===
  function saveCustomerData() {
    try {
      localStorage.setItem('rujak_customer', JSON.stringify({
        name: state.customerName,
        phone: state.customerPhone,
        address: state.customerAddress
      }));
    } catch (_) {}
  }

  function loadCustomerData() {
    try {
      const raw = localStorage.getItem('rujak_customer');
      if (raw) {
        const data = JSON.parse(raw);
        state.customerName = data.name || '';
        state.customerPhone = data.phone || '';
        state.customerAddress = data.address || '';
        document.getElementById('customerName').value = state.customerName;
        document.getElementById('customerPhone').value = state.customerPhone;
        document.getElementById('customerAddress').value = state.customerAddress;
      }
    } catch (_) {}
  }

  // === INISIALISASI ===
  function init() {
    loadCart();
    // Load customer data
    loadCustomerData();

    // Restore minimized state
    try {
      const savedMinimize = localStorage.getItem('rujak_cart_minimized');
      if (savedMinimize !== null) state.isCartMinimized = savedMinimize === 'true';
    } catch (_) {}

    renderAll();
    detectLocation();
    updateClearButton();
    updateFloatingButton();

    // Event listener untuk input pelanggan (simpan otomatis)
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const addressInput = document.getElementById('customerAddress');
    const notesInput = document.getElementById('orderNotes');

    nameInput.addEventListener('input', function() {
      state.customerName = this.value.trim();
      saveCustomerData();
    });
    phoneInput.addEventListener('input', function() {
      state.customerPhone = this.value.trim();
      saveCustomerData();
    });
    addressInput.addEventListener('input', function() {
      state.customerAddress = this.value.trim();
      saveCustomerData();
    });
    notesInput.addEventListener('input', function() {
      state.orderNotes = this.value;
    });

    // Header scroll shadow
    window.addEventListener('scroll', () => {
      const header = document.getElementById('header');
      if (header) header.classList.toggle('shadowed', window.scrollY > 4);
    });

    // Lucide icons
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    else {
      const int = setInterval(() => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
          clearInterval(int);
        }
      }, 100);
    }
  }

  // ===== JALANKAN =====
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();