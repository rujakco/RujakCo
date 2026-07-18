// modules/testimonials.js — Final (animasi prev akurat)
export function initTestimonials() {
  const cards = document.querySelectorAll('.testi-card');
  const dots = document.querySelectorAll('.testi-dot');
  const container = document.getElementById('testiFlipContainer');
  const pauseBtn = document.getElementById('testiPauseBtn');
  const liveRegion = document.getElementById('testiLiveRegion');
  if (!container || !cards.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PAUSE_DURATION = 6000;
  let currentIndex = 0;
  const totalCards = cards.length;
  let interval = null;
  let userPaused = prefersReducedMotion;
  let tempPaused = false;
  let prevIndex = totalCards - 1; // ✅ lacak slide sebelumnya

  const getAuthor = (card) => card.querySelector('span')?.textContent || '';

  function showCard(index, announce) {
    // ✅ Tentukan prev sebagai slide yang sedang aktif sebelumnya
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
    if (announce && liveRegion) {
      liveRegion.textContent = `Testimoni dari ${getAuthor(cards[index])}`;
    }
  }

  function nextCard() {
    if (userPaused || tempPaused) return;
    const nextIndex = (currentIndex + 1) % totalCards;
    showCard(nextIndex, true);
  }

  function startFlip() {
    if (interval) clearInterval(interval);
    if (!userPaused) interval = setInterval(nextCard, PAUSE_DURATION);
  }

  function setPauseUI(paused) {
    pauseBtn.setAttribute('aria-pressed', paused);
    pauseBtn.setAttribute('aria-label', paused ? 'Lanjutkan testimoni otomatis' : 'Jeda testimoni otomatis');
    pauseBtn.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}" style="width:14px;height:14px;"></i>`;
    window.lucide?.createIcons();
  }

  pauseBtn?.addEventListener('click', () => {
    userPaused = !userPaused;
    setPauseUI(userPaused);
    userPaused ? clearInterval(interval) : startFlip();
  });

  let resumeTimer = null;
  const stopTemp = () => { tempPaused = true; clearTimeout(resumeTimer); };
  const resumeTemp = () => { tempPaused = false; startFlip(); };
  container.addEventListener('touchstart', stopTemp);
  container.addEventListener('touchend', () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(resumeTemp, 2000);
  });
  container.addEventListener('mouseenter', stopTemp);
  container.addEventListener('mouseleave', () => {
    if (tempPaused) {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(resumeTemp, 1000);
    }
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetIndex = parseInt(dot.dataset.dot);
      showCard(targetIndex, true);
      stopTemp();
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(resumeTemp, 3000);
    });
  });

  showCard(0, false);
  setPauseUI(userPaused);
  startFlip();
}