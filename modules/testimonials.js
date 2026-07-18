export function initTestimonials() {
  const container = document.getElementById('testiFlipContainer');
  if (!container) return;
  const cards = container.querySelectorAll('.testi-card');
  const dots = container.querySelectorAll('.testi-dot');
  const pauseBtn = document.getElementById('testiPauseBtn');
  const liveRegion = document.getElementById('testiLiveRegion');
  if (!cards.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PAUSE_DURATION = 6000;
  let currentIndex = 0, prevIndex = cards.length - 1;
  let interval = null, userPaused = prefersReducedMotion, tempPaused = false;
  let resumeTimer = null;

  const getAuthor = (card) => card.querySelector('span')?.textContent || 'Pelanggan';

  function showCard(index, announce) {
    if (index === currentIndex) return;
    cards.forEach((card, i) => {
      if (i === index) {
        card.classList.add('is-active');
        card.classList.remove('is-prev');
      } else if (i === prevIndex && i !== index) {
        card.classList.remove('is-active');
        card.classList.add('is-prev');
      } else {
        card.classList.remove('is-active', 'is-prev');
      }
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', i === index ? 'true' : 'false'));
    prevIndex = currentIndex;
    currentIndex = index;
    if (announce && liveRegion) liveRegion.textContent = `Testimoni dari ${getAuthor(cards[index])}`;
  }

  function nextCard() { if (userPaused || tempPaused) return; showCard((currentIndex + 1) % cards.length, true); }
  function startFlip() { if (interval) clearInterval(interval); if (!userPaused) interval = setInterval(nextCard, PAUSE_DURATION); }
  function setPauseUI(paused) {
    pauseBtn.setAttribute('aria-pressed', paused);
    pauseBtn.setAttribute('aria-label', paused ? 'Lanjutkan testimoni otomatis' : 'Jeda testimoni otomatis');
    pauseBtn.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}" style="width:14px;height:14px;"></i>`;
    window.lucide?.createIcons();
  }

  pauseBtn?.addEventListener('click', () => { userPaused = !userPaused; setPauseUI(userPaused); userPaused ? clearInterval(interval) : startFlip(); });

  const stopTemp = () => { tempPaused = true; clearTimeout(resumeTimer); };
  const resumeTemp = () => { tempPaused = false; if (!userPaused) startFlip(); };
  container.addEventListener('touchstart', stopTemp);
  container.addEventListener('touchend', () => { clearTimeout(resumeTimer); resumeTimer = setTimeout(resumeTemp, 2000); });
  container.addEventListener('mouseenter', stopTemp);
  container.addEventListener('mouseleave', () => { if (tempPaused) { clearTimeout(resumeTimer); resumeTimer = setTimeout(resumeTemp, 1000); } });

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      showCard(parseInt(dot.dataset.dot), true);
      stopTemp();
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(resumeTemp, 3000);
    });
  });

  // Inisialisasi
  showCard(0, true);
  setPauseUI(userPaused);
  startFlip();
}