/* ==========================================================================
   1. DESIGN TOKENS (ROOT)
   ========================================================================== */
:root {
  --green: #082E21;
  --green-light: #EBF2EF;
  --gold: #C5A059;
  --gold-text: #9B7D3F;
  --gold-soft: rgba(197, 160, 89, 0.35);
  --gold-bright: #E8D5A8;
  --ivory: #FDFBF7;
  --bg-surface: #FDFBF7;
  --bg-subtle: #F6F4F0;
  --gray-100: #F4F2EE;
  --gray-200: #E6E4DF;
  --gray-300: #D1CFCA;
  --gray-400: #A8A6A0;
  --gray-500: #888681;
  --gray-900: #1A1816;
  --z-header: 100;
  --z-nav: 400;
  --z-product: 500;
  --z-fab: 510;
  --z-modal: 1000;
  --z-onboard: 9999;
  --blur-soft: blur(12px);
  --blur-medium: blur(20px);
  --blur-strong: blur(32px);
  --shadow-soft: 0 2px 8px rgba(0,0,0,0.03);
  --shadow-card: 0 4px 16px rgba(8,46,33,0.04);
  --shadow-floating: 0 8px 24px rgba(0,0,0,0.06);
  --shadow-luxury: 0 16px 36px rgba(8,46,33,0.08);
  --shadow-glow: 0 8px 20px -8px rgba(197,160,89,0.25);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 32px;
  --transition-spring: cubic-bezier(0.25, 1, 0.5, 1);
  --font-base: 16px;
}

/* ==========================================================================
   2. RESET & LAYOUT
   ========================================================================== */
*, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: rgba(0,0,0,0.08); }
html, body {
  margin: 0; padding: 0; background: var(--green);
  font-family: 'DM Sans', sans-serif; font-size: var(--font-base);
  color: var(--gray-900); -webkit-font-smoothing: antialiased;
}
#app {
  width: 100%; max-width: 480px; margin: 0 auto;
  min-height: 100dvh; background: var(--green); position: relative; overflow-x: hidden;
}

/* ==========================================================================
   3. TYPOGRAPHY
   ========================================================================== */
h1, h2, h3, h4, .brand-name { font-family: 'Fraunces', serif; font-weight: 300; margin: 0; }
h1 { font-size: clamp(1.75rem, 6vw, 2.25rem); letter-spacing: -0.04em; }
h2 { font-size: clamp(1.5rem, 5vw, 1.75rem); letter-spacing: -0.03em; }
h3 { font-size: clamp(1.25rem, 4vw, 1.5rem); letter-spacing: -0.02em; }
h4 { font-size: clamp(1.125rem, 3.5vw, 1.25rem); letter-spacing: -0.01em; }
p, li, .body-text { font-size: clamp(0.9375rem, 3vw, 1rem); line-height: 1.7; }
.small-text { font-size: 0.875rem; line-height: 1.6; }
.tiny-text { font-size: 0.75rem; line-height: 1.5; }
.cerita-teks { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-style: italic; color: var(--gray-500); line-height: 1.6; }

/* ==========================================================================
   4. ONBOARDING
   ========================================================================== */
.onboarding-overlay {
  position: fixed; inset: 0;
  background: radial-gradient(circle at 50% 40%, #0C422F 0%, #04120D 100%);
  z-index: var(--z-onboard); display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: var(--radius-2xl) 24px; text-align: center;
  transition: opacity 0.8s var(--transition-spring), visibility 0.8s;
}
.onboarding-overlay.hidden { opacity: 0; visibility: hidden; }
.onb-content { width: 100%; max-width: 320px; display: flex; flex-direction: column; align-items: center; color: var(--ivory); }
.onb-logo {
  width: 72px; height: 72px; border-radius: 50%; margin-bottom: var(--radius-2xl);
  border: 1px solid var(--gold-soft); padding: 4px; background: rgba(0,0,0,0.2); box-shadow: var(--shadow-luxury);
}
.onb-title { color: var(--ivory); margin-bottom: 8px; line-height: 1.1; }
.onb-subtitle, .onb-welcome-text { font-family: 'DM Sans', sans-serif; color: rgba(253,251,247,0.85); margin-bottom: 48px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 500; }
.onb-step { display: none; width: 100%; }
.onb-step.active { display: block; }
.onb-label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--gold); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.15em; }
.onb-input {
  width: 100%; text-align: center; border: none; border-bottom: 1px solid rgba(197,160,89,0.25); background: transparent;
  padding: 16px 0; font-size: 1.5rem; font-family: 'Fraunces', serif; font-weight: 300;
  color: var(--ivory); margin-bottom: 48px;
  transition: border-color 0.4s ease; outline: none; border-radius: 0;
}
.onb-input:focus { border-bottom-color: var(--gold); box-shadow: var(--shadow-glow); }
#onbWelcomeName, #onbWelcomeDistrict {
  animation: luxuryFadeIn 0.8s var(--transition-spring) both;
}
#onbWelcomeDistrict { animation-delay: 0.15s; }
@keyframes luxuryFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ==========================================================================
   5. HEADER
   ========================================================================== */
.luxury-header {
  position: fixed; top: 0; left: 0; right: 0; margin: 0 auto;
  width: calc(100% - 40px); max-width: 440px;
  display: flex; align-items: center; justify-content: space-between;
  padding: calc(16px + env(safe-area-inset-top)) 20px 16px;
  z-index: var(--z-header); background: rgba(253,251,247,0.12);
  backdrop-filter: var(--blur-soft) saturate(140%);
  -webkit-backdrop-filter: var(--blur-soft) saturate(140%);
  border-bottom: 1px solid rgba(255,255,255,0.1); border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  transition: transform 0.5s var(--transition-spring), background-color 0.4s ease;
}

/* ==========================================================================
   6. HERO & CAROUSEL
   ========================================================================== */
.hero-gold-frame { position: relative; border-radius: var(--radius-xl); box-shadow: var(--shadow-floating); }
.hero-img-wrap { width: 100%; aspect-ratio: 4 / 3; border-radius: var(--radius-xl); overflow: hidden; }
.btq-img {
  width: 100%; aspect-ratio: 1 / 1; object-fit: cover;
  border-radius: calc(var(--radius-xl) - 32px);
  background: var(--bg-subtle);
}

/* ==========================================================================
   7. INSIGHT
   ========================================================================== */
.typing-text {
  font-family: 'Playfair Display', serif;
  font-size: 0.875rem;
  color: var(--gold-bright);
  font-weight: 500;
  font-style: italic;
  letter-spacing: 0.02em;
  line-height: 1.5;
  text-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

/* ==========================================================================
   8. DETAIL PRODUCT & BUTTONS (Luxury Fix)
   ========================================================================== */
.floating-close { position: fixed !important; top: 16px !important; left: 16px !important; z-index: 9999 !important; }
.detail-content button:not(.qty-btn):not(.spice-option):not(.glass-btn) {
  width: 100% !important; display: block !important;
  margin: 24px 0 32px 0 !important; padding: 18px 24px !important;
  background: linear-gradient(135deg, var(--gold) 0%, #B89650 100%) !important;
  color: #FFFFFF !important; border: none !important; border-radius: var(--radius-sm) !important;
  font-family: 'DM Sans', sans-serif !important; font-weight: 600 !important;
  text-transform: uppercase !important; letter-spacing: 0.15em !important;
  cursor: pointer !important; box-shadow: var(--shadow-card) !important;
  transition: transform 0.3s ease !important;
}
.qty-minimal {
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid var(--gold-soft); border-radius: 100px; padding: 4px; background: transparent;
  height: 56px;
}
.qty-minimal button {
  width: 44px; height: 44px; background: transparent; border: none;
  font-size: 1.5rem; color: var(--green); cursor: pointer;
}
.qty-minimal span { width: 36px; text-align: center; font-size: 1.125rem; font-family: 'Fraunces', serif; }
.add-to-cart-btn {
  flex: 1; height: 56px; background: linear-gradient(135deg, var(--gold) 0%, #B89650 100%);
  color: #FFFFFF; border: none; border-radius: 100px;
  font-family: 'DM Sans', sans-serif; font-weight: 600; text-transform: uppercase;
  box-shadow: var(--shadow-card); cursor: pointer;
  transition: transform 0.3s var(--transition-spring);
}
.add-to-cart-btn:active { transform: scale(0.96); }

/* ==========================================================================
   9. AKSESORI TEKS
   ========================================================================== */
.fruit-list-inline span, .detail-specs span { color: var(--gold); margin: 0 4px; font-weight: bold; }
.section-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--gray-500); margin-bottom: 16px; font-weight: 600; display: block; text-align: center; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 28px; }

/* ==========================================================================
   10. FOOTER & NAV
   ========================================================================== */
.luxury-footer { padding: 48px 16px calc(48px + env(safe-area-inset-bottom)); background: var(--green); border-top: 1px solid rgba(197,160,89,0.12); }
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0; margin: 0 auto;
  width: calc(100% - 40px); max-width: 440px; z-index: var(--z-nav);
  background: var(--bg-surface); display: flex; justify-content: space-around; align-items: center;
  padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(197,160,89,0.15); border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.02);
}

/* ==========================================================================
   11. UTILITIES
   ========================================================================== */
.icon-sm { width: 18px; height: 18px; }
.icon-md { width: 20px; height: 20px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}