import { SYSTEM } from '../data/config.js';
import { fmt, showToast, escapeHTML, getSupabase } from '../utils/helpers.js';
import { saveCustomer } from './storage.js';
import { calculateShipping } from './shipping.js';

export async function showOrderConfirmation(state, DOM, overlayStack, openModal, closeModal, getCartSummaryLocal, downloadReceiptPNG, sendReceiptToTelegram) {
  const dist = state.userDistance;
  const summary = getCartSummaryLocal();
  const ship = dist != null ? calculateShipping(dist, summary.mainProductQty || 1, state.shippingProvider, 'motor', state.tier === 'prioritas') : { cost: null };
  if (ship.cost === null) {
    showToast('Maaf, jarak terlalu jauh. Silakan hubungi Concierge.');
    return false;
  }

  const currentPhone = DOM.customerPhoneInput?.value || state.customerPhone;
  const currentAddress = DOM.customerAddressInput?.value || state.customerAddress;
  saveCustomer(currentPhone, currentAddress, state.selectedDistrict, state.userDistance);

  const calculatedTotal = summary.subtotal + (ship.cost || 0);
  const name = escapeHTML(DOM.customerNameInput?.value || state.customerName || '—');
  const phone = escapeHTML(currentPhone);
  const address = escapeHTML(currentAddress);
  const deliveryTime = escapeHTML(document.getElementById('deliveryTimeLabel')?.textContent || '—');
  
  let kurirDetail = state.shippingProvider === 'paxel' ? 'Paxel Ekspres (Next-Day)' : 'Kurir Lalamove';
  if (state.shippingProvider === 'lalamove') {
    kurirDetail += ` (${state.tier === 'prioritas' ? 'Prioritas' : 'Reguler'})`;
  }

  const baseShippingCost = ship.cost || 0; // untuk tampilan

  let itemsHtml = '';
  summary.items.forEach(item => {
    const spiceText = item.spice ? ` [Lv ${item.spice}]` : '';
    itemsHtml += `
      <div style="margin-bottom: 8px;">
        <div class="confirm-row" style="padding-bottom: 2px;">
          <span style="font-weight: 600; color: var(--gray-900);">${escapeHTML(item.name)}${spiceText}</span>
          <span style="font-weight: 600; color: var(--gray-900);">${fmt(item.price * item.qty)}</span>
        </div>
        <div style="font-size: 0.7rem; color: var(--gray-500); text-align: left; padding-left: 2px;">
          ${item.qty} pcs x ${fmt(item.price)}
        </div>
      </div>`;
  });

  const contentEl = document.getElementById('orderConfirmContent');
  if (!contentEl) return false;
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }) + ' WIB';
  state.currentOrderCode = `RJK-${now.toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(1000+Math.random()*9000)}`;

  contentEl.innerHTML = `
    <div class="receipt-wrap" style="padding: 4px;">
      <div class="receipt-stamp" style="z-index: 10;">NOTA RESERVASI</div>
      <div class="receipt-header">
        <img class="receipt-logo" src="https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/logo.webp" alt="RUJAK.Co" crossorigin="anonymous" />
        <div class="receipt-brand">RUJAK.Co</div>
        <div class="receipt-tagline">Indonesia dalam Satu Wadah</div>
        <div style="font-size: 0.65rem; color: var(--gray-400); letter-spacing: 0.05em; margin-top: 4px;">WA: +62 896-7716-1680 · rujakco.biz.id</div>
      </div>
      <div class="receipt-meta">
        <span class="code" style="font-size: 0.75rem;">${state.currentOrderCode}</span>
        <span>${dateStr} · ${timeStr}</span>
      </div>
      <div class="receipt-section">
        <div class="receipt-section-title">Data Pengantaran</div>
        <div class="confirm-row"><span>Nama Penerima</span><span>${name}</span></div>
        <div class="confirm-row"><span>No. Telepon</span><span>${phone}</span></div>
        <div class="confirm-row"><span>Alamat Tujuan</span><span style="max-width: 65%; word-break: break-word;">${address}</span></div>
        <div class="confirm-row"><span>Waktu Antar</span><span>${deliveryTime}</span></div>
        <div class="confirm-row"><span>Metode Kurir</span><span style="color: var(--green); font-weight: 600;">${kurirDetail}</span></div>
        ${state.haversineUsed ? '<div class="confirm-row" style="color:var(--gold); font-size: 0.65rem;">* Jarak dihitung Haversine, ongkir estimasi.</div>' : ''}
      </div>
      <div class="receipt-section">
        <div class="receipt-section-title">Rincian Sajian Fresh-Prep</div>
        ${itemsHtml}
      </div>
      <div class="receipt-section">
        <div class="receipt-section-title">Rincian Pembayaran</div>
        <div class="confirm-row"><span>Subtotal Produk</span><span>${fmt(summary.subtotal)}</span></div>
        <div class="confirm-row"><span>Ongkos Kirim Jarak</span><span>${fmt(baseShippingCost)}</span></div>
        ${state.tier === 'prioritas' ? `<div class="confirm-row" style="color: var(--gold-text);"><span>Layanan Prioritas (Ekspres)</span><span>+${fmt(8000)}</span></div>` : ''}
        <div class="confirm-row" style="border-top: 1px dashed var(--gray-200); margin-top: 4px; padding-top: 4px;"><span>Metode Bayar</span><span>QRIS Otomatis</span></div>
        <div class="confirm-row total"><span>Total Tagihan</span><span>${fmt(calculatedTotal)}</span></div>
      </div>
      <div class="receipt-footer">
        <p style="font-family: 'Fraunces', serif; font-style: italic; color: var(--gray-600); font-size: 0.85rem; margin-bottom: 16px;">
          "Asam, pedas, manis, segar — terima kasih telah memilih RUJAK.Co."
        </p>
        <div style="background: var(--bg-subtle); border: 1px solid var(--gray-200); border-radius: 8px; padding: 12px; margin: 8px 0 20px; text-align: left; font-size: 0.72rem; color: var(--gray-600); line-height: 1.5; font-family: 'DM Sans', sans-serif;">
          <strong style="color: var(--green); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.68rem; font-weight: 700;">💡 PANDUAN TRANSAKSI INSTAN VIA PONSEL:</strong>
          1. <strong>Simpan Nota:</strong> Gambar struk ini otomatis tersimpan — cek folder "Download" atau aplikasi Galeri/Foto di HP Anda.<br>
          2. <strong>Buka Aplikasi:</strong> Buka m-Banking (BCA, Mandiri, dll) atau E-Wallet pilihan Anda (GoPay, OVO, Dana).<br>
          3. <strong>Pindai via Galeri:</strong> Pilih menu QRIS/Scan, tekan <strong>Ikon Galeri/Unggah Gambar</strong>, lalu pilih foto struk ini untuk membayar.<br>
          4. <strong>Konfirmasi WhatsApp:</strong> Kirim bukti transfer beserta foto struk ini ke WhatsApp kami untuk validasi instan.
        </div>
        <div class="receipt-qris-wrap" style="margin-top: 16px; margin-bottom: 16px;">
          <img src="https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/qris-rujakco.webp" alt="Scan QRIS" class="receipt-qris-cropped" crossorigin="anonymous" />
        </div>
        <div style="font-size: 0.6rem; color: var(--gray-400); margin-top: 20px; line-height: 1.4; border-top: 1px solid var(--gray-100); padding-top: 10px; font-family: 'DM Sans', sans-serif; text-align: center;">
          <strong>Kebijakan Kesegaran:</strong> Komplain kualitas buah wajib menyertakan video unboxing (maksimal 2 jam setelah diterima). Seluruh buah dipotong segar melalui sistem 15-Minute Fresh-Prep.
        </div>
      </div>
    </div>`;

  if (window.lucide) lucide.createIcons();

  const modal = document.getElementById('orderConfirmModal');
  if (modal) {
    openModal(modal);
    document.getElementById('orderConfirmBack').onclick = () => closeModal(modal);
    document.getElementById('orderConfirmLanjut').onclick = async () => {
      const btnLanjut = document.getElementById('orderConfirmLanjut');
      if (btnLanjut.dataset.processing === 'true') return;
      btnLanjut.dataset.processing = 'true';
      btnLanjut.innerHTML = '<i data-lucide="loader-2" class="icon-sm" style="animation:spin 1s linear infinite;"></i> Memproses...';
      btnLanjut.style.pointerEvents = 'none';
      if (window.lucide) lucide.createIcons();

      const imageUrl = await downloadReceiptPNG();
      if (imageUrl) {
        await sendReceiptToTelegram();
      } else {
        showToast('⚠️ Gagal memproses struk, namun pesanan tetap tercatat.');
      }

      // Auto download struk ke HP pembeli
      try {
        const receiptElement = document.getElementById('orderConfirmContent');
        if (receiptElement && typeof html2canvas !== 'undefined') {
          const canvas = await html2canvas(receiptElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false
          });
          canvas.toBlob(blob => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Struk-RUJAKCo-${state.currentOrderCode}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }, 'image/png');
        }
      } catch (e) {
        console.warn('Gagal mengunduh struk otomatis:', e);
      }

      btnLanjut.textContent = 'Lanjutkan';
      btnLanjut.style.pointerEvents = 'auto';
      btnLanjut.dataset.processing = 'false';

      closeModal(document.getElementById('orderConfirmModal'));
      setTimeout(() => {
        if (DOM.paymentTotal) DOM.paymentTotal.textContent = fmt(calculatedTotal);
        openModal(DOM.paymentModal);
      }, 50);
    };
    return true;
  }
  return false;
}