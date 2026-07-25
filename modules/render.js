export function renderMiniCart(cart, listId = 'miniCartList', subtotalId = 'cartSubtotalDisplay') {
  const sum = getCartSummary(cart);
  const list = document.getElementById(listId);
  if (!list) return sum;
  list.innerHTML = sum.items.length === 0
    ? `<div class="cart-empty">
         <i data-lucide="shopping-bag" style="width:48px;height:48px;color:var(--gray-400);margin-bottom:16px;"></i>
         <p style="font-weight:600;">Reservasi masih kosong</p>
         <button class="btn-dark" id="emptyCartBrowse" style="margin-top:20px;">Lihat Koleksi</button>
       </div>`
    : sum.items.map(i => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <h4>${escapeHTML(i.name)}${i.spice ? ' (Lv ' + i.spice + ')' : ''}</h4>
          <p>${fmt(i.price)}</p>
        </div>
        <div class="qty-minimal">
          <button data-action="decrease" data-id="${i.cartId}" aria-label="Kurangi jumlah">−</button>
          <span>${i.qty}</span>
          <button data-action="increase" data-id="${i.cartId}" aria-label="Tambah jumlah">+</button>
        </div>
      </div>`).join('');
  const subtotalEl = document.getElementById(subtotalId);
  if (subtotalEl) subtotalEl.textContent = fmt(sum.subtotal);
  return sum;
}