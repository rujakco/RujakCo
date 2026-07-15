// modules/testimonials.js
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

  const getAuthor = (card) => card.querySelector('span')?.textContent || '';

  function showCard(index, announce) {
    cards.forEach((card, i) => {
      if (i === index) {
        card.classList.add('is-active');
        card.classList.remove('is-prev');
      } else if (i < index || (index === 0 && i === totalCards - 1)) {
        card.classList.remove('is-active');
        card.classList.add('is-prev');
      } else {
        card.classList.remove('is-active', 'is-prev');
      }
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', i === index ? 'true' : 'false'));
    currentIndex = index;
    if (announce && liveRegion) {
      liveRegion.textContent = `Testimoni dari ${getAuthor(cards[index])}`;
    }
  }

  function nextCard() {
    if (userPaused || tempPaused) return;
    showCard((currentIndex + 1) % totalCards, true);
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

  const stopTemp = () => { tempPaused = true; };
  const resumeTemp = () => { tempPaused = false; startFlip(); };
  container.addEventListener('touchstart', stopTemp);
  container.addEventListener('touchend', () => setTimeout(resumeTemp, 2000));
  container.addEventListener('mouseenter', stopTemp);
  container.addEventListener('mouseleave', () => tempPaused && resumeTemp());

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      showCard(parseInt(dot.dataset.dot), true);
      stopTemp();
      setTimeout(resumeTemp, 3000);
    });
  });

  showCard(0, false);
  setPauseUI(userPaused);
  startFlip();
}