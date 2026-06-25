// ===================== INIT =====================
function init() {
  loadCart(); loadCustomerData(); updateStoreStatus();
  
  // Hapus atau comment baris ini
  // document.getElementById('shareStrip').style.display = 'none';
  
  try { const s = localStorage.getItem('rujak_cart_minimized'); if (s !== null) state.isCartMinimized = s === 'true'; } catch (_) {}
  
  // Load data customer ke form
  const customerName = document.getElementById('customerName');
  const customerPhone = document.getElementById('customerPhone');
  const customerAddress = document.getElementById('customerAddress');
  const giftToggle = document.getElementById('giftToggle');
  const giftSender = document.getElementById('giftSender');
  const giftMessage = document.getElementById('giftMessage');
  const giftFields = document.getElementById('giftFields');
  
  if (customerName) customerName.value = state.customerName;
  if (customerPhone) customerPhone.value = state.customerPhone;
  if (customerAddress) customerAddress.value = state.customerAddress;
  if (giftToggle) giftToggle.checked = state.isGift;
  if (giftSender) giftSender.value = state.giftSender;
  if (giftMessage) giftMessage.value = state.giftMessage;
  if (giftFields) giftFields.style.display = state.isGift ? 'block' : 'none';

  state.shippingProvider = 'pembeli';
  state.isPriority = false;
  
  const priorityToggle = document.getElementById('priorityToggle');
  const priorityToggleMini = document.getElementById('priorityToggleMini');
  if (priorityToggle) priorityToggle.disabled = true;
  if (priorityToggleMini) priorityToggleMini.disabled = true;

  // Set default shipping & vehicle via tombol
  document.querySelectorAll('.ship-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === 'pembeli');
  });
  document.querySelectorAll('.veh-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.vehicle === 'motor');
  });

  updateUI(); detectLocation(); bindEvents();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        showToast('🔄 Versi baru tersedia! Segarkan halaman.');
      }
    });
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  else { const int = setInterval(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) { lucide.createIcons(); clearInterval(int); } }, 100); }
}