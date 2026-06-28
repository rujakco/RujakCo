// ============================================================
// ================ UTILITY FUNCTIONS ==========================
// ============================================================

function escapeHTML(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function fmt(num) {
  return 'Rp' + num.toLocaleString('id-ID');
}

function debounce(fn, delay) {
  var timer;
  return function() {
    var args = arguments;
    var context = this;
    clearTimeout(timer);
    timer = setTimeout(function() {
      fn.apply(context, args);
    }, delay);
  };
}

function normalizePhone(phone) {
  phone = phone.replace(/\D/g, '');
  if (phone.startsWith('62') && phone.length >= 10) return phone;
  if (phone.startsWith('0')) return '62' + phone.slice(1);
  if (phone.startsWith('8') && phone.length >= 8) return '62' + phone;
  return '62' + phone;
}

function openWhatsApp(phone, message) {
  var waUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
  var a = document.createElement('a');
  a.href = waUrl;
  a.target = '_blank';
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    if (document.body.contains(a)) document.body.removeChild(a);
  }, 100);
}

function shareToWhatsApp() {
  var shareText = 'Hai! Cobain Rujak.Co yuk — rujak premium dengan buah segar pilihan dan sambal khas Indonesia.';
  var shareUrl = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'Rujak.Co', text: shareText, url: shareUrl }).catch(function() {
      copyShareLink(shareText, shareUrl);
    });
  } else {
    copyShareLink(shareText, shareUrl);
  }
}

function copyShareLink(text, url) {
  var fullText = text + '\n' + url;
  navigator.clipboard.writeText(fullText).then(function() {
    showToast('📋 Link berhasil disalin! Bagikan ke teman ya.');
  }).catch(function() {
    showToast('📋 Gagal menyalin. Bagikan manual: ' + url);
  });
}

function showConfirmModal(title, message, onConfirm) {
  var modal = document.getElementById('customConfirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customConfirmModal';
    modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:100002;background:rgba(0,0,0,0.6);align-items:center;justify-content:center;';
    modal.innerHTML = '<div style="background:white;border-radius:16px;padding:24px 20px;max-width:340px;width:90%;text-align:center;"><h4 class="confirm-title" style="font-size:16px;font-weight:700;margin:0 0 8px;"></h4><p class="confirm-message" style="font-size:13px;color:#666;margin:0 0 20px;"></p><div style="display:flex;gap:10px;"><button class="confirm-btn-no" style="flex:1;padding:12px;border-radius:10px;border:1px solid #ddd;background:white;font-size:13px;font-weight:600;cursor:pointer;">Batal</button><button class="confirm-btn-yes" style="flex:1;padding:12px;border-radius:10px;border:none;background:#D62828;color:white;font-size:13px;font-weight:600;cursor:pointer;">Ya, Kosongkan</button></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.style.display = 'none';
    });
    modal.querySelector('.confirm-btn-no').addEventListener('click', function() {
      modal.style.display = 'none';
    });
  }
  modal.querySelector('.confirm-title').textContent = title;
  modal.querySelector('.confirm-message').textContent = message;
  modal.querySelector('.confirm-btn-yes').onclick = function() {
    modal.style.display = 'none';
    if (onConfirm) onConfirm();
  };
  modal.style.display = 'flex';
}

function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function() {
    el.classList.remove('show');
  }, 3000);
}