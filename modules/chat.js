// modules/chat.js
import { FAQ_DATA } from '../data/config.js';
import { escapeHTML } from '../utils/helpers.js';

export function initAIChat(welcomeId = 'aiWelcomeMsg', messagesId = 'aiChatMessages', inputId = 'aiChatInput', sendId = 'aiChatSend') {
  const box = document.getElementById('aiChatBox');
  const input = document.getElementById(inputId);
  const send = document.getElementById(sendId);
  const messages = document.getElementById(messagesId);

  if (!messages) return;

  const processMsg = (txt) => {
    const lower = txt.toLowerCase();
    let found = 'Pesan Anda sudah kami terima. Tim kami akan segera membalas secara personal.';
    for (let q of FAQ_DATA) {
      if (q.keywords.some(k => lower.includes(k))) {
        found = q.answer;
        break;
      }
    }
    messages.innerHTML += `<div class="msg-user"><span>${escapeHTML(txt)}</span></div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    setTimeout(() => {
      messages.innerHTML += `<div class="msg-bot" style="margin-bottom:12px;"><span>${found}</span></div>`;
      messages.scrollTop = messages.scrollHeight;
    }, 600);
  };

  const handleSend = () => {
    const txt = input.value.trim();
    if (!txt) return;
    processMsg(txt);
  };

  if (send) send.addEventListener('click', handleSend);
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });

  // Update welcome dengan nama
  return function updateWelcome(name) {
    const wel = document.getElementById(welcomeId);
    if (wel) wel.textContent = `Halo, ${name}! Ada yang bisa kami bantu untuk pesanan Anda?`;
  };
}