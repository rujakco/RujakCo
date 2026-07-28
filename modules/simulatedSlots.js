const STORAGE_KEY = 'rujak_simulated_slots';
const DEFAULT_QUOTA = { pagi: 10, siang: 12, sore: 8 };

function getSlotData() {
  const today = new Date().toDateString();
  try { const raw = localStorage.getItem(STORAGE_KEY); const data = raw ? JSON.parse(raw) : null; if (data && data.date === today) return data; } catch (_) {}
  const slots = {}; for (const [key, max] of Object.entries(DEFAULT_QUOTA)) { slots[key] = max - Math.floor(Math.random() * 3); }
  const newData = { date: today, slots, lastHour: new Date().getHours() }; localStorage.setItem(STORAGE_KEY, JSON.stringify(newData)); return newData;
}

function applyHourlyDecay(data) {
  const currentHour = new Date().getHours(); const lastHour = data.lastHour || 8; const hoursPassed = Math.max(0, currentHour - lastHour);
  if (hoursPassed > 0) { for (let i = 0; i < hoursPassed; i++) { const windows = Object.keys(data.slots).filter(w => data.slots[w] > 0); if (windows.length === 0) break; windows.sort((a, b) => data.slots[b] - data.slots[a]); data.slots[windows[0]]--; } data.lastHour = currentHour; localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  return data;
}

export function consumeSlot(window = 'siang') { const data = getSlotData(); applyHourlyDecay(data); if (data.slots[window] > 0) { data.slots[window]--; localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; } return false; }
export function getRemainingSlots() { const data = getSlotData(); applyHourlyDecay(data); return Object.values(data.slots).reduce((a, b) => a + b, 0); }
export function getSlotUrgencyText() { const total = getRemainingSlots(); if (total <= 3) return `Hanya ${total} slot tersedia hari ini`; if (total <= 6) return `Slot Fresh-Prep hampir penuh — ${total} tersisa`; return ''; }