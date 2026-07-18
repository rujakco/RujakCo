import { SYSTEM, FAQ_DATA } from '../data/config.js';
import { escapeHTML } from '../utils/helpers.js';

export function initAIChat(welcomeId = 'aiWelcomeMsg', messagesId = 'aiChatMessages', inputId = 'aiChatInput', sendId = 'aiChatSend') {
  const input = document.getElementById(inputId);
  const send = document.getElementById(sendId);
  const messages = document.getElementById(messagesId);
  if (!messages) return;

  const faq = FAQ_DATA || [];
  const waNumber = SYSTEM?.WA_NUMBER || '6289677161680';

  const processMsg = async (txt) => {
    const lower = txt.toLowerCase();
    let matched = null;
    for (let q of faq) {
      if (q.keywords.some(k => lower.includes(k))) { matched = q.answer; break; }
    }
    messages.insertAdjacentHTML('beforeend', `<div class="msg-user"><span>${escapeHTML(txt)}</span></div>`);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    if (matched) {
      setTimeout(() => {
        messages.insertAdjacentHTML('beforeend', `<div class="msg-bot" style="margin-bottom:12px;"><span>${escapeHTML(matched)}</span></div>`);
        messages.scrollTop = messages.scrollHeight;
      }, 600);
    } else {
      setTimeout(() => {
        const waMsg = `Halo RUJAK.Co, saya punya pertanyaan: "${txt}"`;
        messages.insertAdjacentHTML('beforeend', `
          <div class="msg-bot" style="margin-bottom:12px;">
            <span>Pertanyaan ini perlu dijawab tim kami langsung. <a href="https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener" style="color:var(--gold-text);font-weight:700;">Klik di sini untuk chat WhatsApp →</a></span>
          </div>`);
        messages.scrollTop = messages.scrollHeight;
      }, 600);
    }
    input.focus();
  };

  const handleSend = () => {
    if (!input) return;
    const txt = input.value.trim();
    if (!txt) return;
    processMsg(txt);
  };
  if (send) send.addEventListener('click', handleSend);
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });

  return function updateWelcome(name) {
    const wel = document.getElementById(welcomeId);
    if (wel) wel.textContent = `Halo, ${name}! Ada yang bisa kami bantu untuk pesanan Anda?`;
  };
}