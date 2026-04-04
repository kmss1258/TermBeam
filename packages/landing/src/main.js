// ═══════════════════════════════════════════════════════════════
// TermBeam Landing — Premium Interactions
// Gradient mesh · Word reveal · 3D tilt · Scroll showcase · Parallax
// ═══════════════════════════════════════════════════════════════

// ─── Word-by-Word Hero Reveal ──────────────────────────────────
function initWordReveal() {
  const heading = document.getElementById('hero-heading');
  if (!heading) return;

  const text = heading.textContent.trim();
  const words = text.split(/\s+/);
  heading.innerHTML = '';

  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    const inner = document.createElement('span');
    inner.className = 'word-inner';
    inner.textContent = word;
    inner.style.animationDelay = `${0.15 + i * 0.08}s`;
    span.appendChild(inner);
    heading.appendChild(span);

    // Add space between words
    if (i < words.length - 1) {
      heading.appendChild(document.createTextNode(' '));
    }
  });
}

// ─── 3D Device Tilt ────────────────────────────────────────────
function initDeviceTilt() {
  const heroDevices = document.getElementById('hero-devices');
  if (!heroDevices || window.innerWidth < 768) return;

  const browser = document.getElementById('device-browser');
  const phone = document.getElementById('device-phone');

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = null;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animate() {
    currentX = lerp(currentX, targetX, 0.08);
    currentY = lerp(currentY, targetY, 0.08);

    // Stop RAF when values converge (save CPU when mouse idle)
    if (Math.abs(currentX - targetX) < 0.001 && Math.abs(currentY - targetY) < 0.001) {
      currentX = targetX;
      currentY = targetY;
      rafId = null;
      return;
    }

    if (browser) {
      browser.style.transform = `perspective(1200px) rotateY(${currentX * 8}deg) rotateX(${-currentY * 8}deg) translateY(${Math.sin(Date.now() / 1000) * 4}px)`;
    }
    if (phone) {
      phone.style.transform = `perspective(1200px) rotateY(${currentX * 12}deg) rotateX(${-currentY * 12}deg) translateY(${Math.sin((Date.now() + 1000) / 1000) * 4}px)`;
    }

    rafId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (!rafId) {
      rafId = requestAnimationFrame(animate);
    }
  }

  heroDevices.addEventListener('mousemove', (e) => {
    const rect = heroDevices.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    startAnimation();
  });

  heroDevices.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    startAnimation();
  });

  startAnimation();

  // Cleanup on resize to mobile
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768 && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
      if (browser) browser.style.transform = '';
      if (phone) phone.style.transform = '';
    } else if (window.innerWidth >= 768 && !rafId) {
      startAnimation();
    }
  });
}

// ─── Scroll-Linked Hero Parallax ───────────────────────────────
function initHeroParallax() {
  const heroDevices = document.getElementById('hero-devices');
  const heroHeading = document.getElementById('hero-heading');
  const hero = document.getElementById('hero');
  if (!heroDevices || !hero) return;

  let ticking = false;

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const heroHeight = hero.offsetHeight;
          const progress = Math.min(scrollY / heroHeight, 1);

          // Scale down and move up as user scrolls
          const scale = 1 - progress * 0.15;
          const translateY = -progress * 60;
          heroDevices.style.transform = `scale(${scale}) translateY(${translateY}px)`;
          heroDevices.style.opacity = 1 - progress * 0.6;

          // Fade heading
          if (heroHeading) {
            heroHeading.style.opacity = 1 - progress * 1.5;
          }

          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );
}

// ─── Scroll-Driven Feature Showcase ────────────────────────────
function initShowcase() {
  const track = document.querySelector('.showcase-track');
  if (!track) return;

  const stories = document.querySelectorAll('.story');
  const devices = document.querySelectorAll('.showcase-device');
  const progressFill = document.getElementById('progress-fill');
  const storyCount = stories.length;
  let currentIndex = -1;

  function update() {
    const rect = track.getBoundingClientRect();
    const trackTop = -rect.top;
    const trackHeight = rect.height - window.innerHeight;

    if (trackTop < 0 || trackTop > trackHeight) return;

    const progress = trackTop / trackHeight;
    const rawIndex = progress * storyCount;
    const index = Math.min(Math.floor(rawIndex), storyCount - 1);

    // Update progress bar
    if (progressFill) {
      const fillPercent = ((index + 1) / storyCount) * 100;
      progressFill.style.height = fillPercent + '%';
    }

    if (index !== currentIndex) {
      currentIndex = index;

      stories.forEach((s) => s.classList.remove('active'));
      devices.forEach((d) => d.classList.remove('active'));

      if (stories[index]) stories[index].classList.add('active');
      if (devices[index]) devices[index].classList.add('active');
    }
  }

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );

  update();
}

// ─── Scroll Reveal ─────────────────────────────────────────────
function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  elements.forEach((el) => observer.observe(el));
}

// ─── Nav Scroll Effect ─────────────────────────────────────────
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );
}

// ─── Copy Install Command ──────────────────────────────────────
function initCopyButton() {
  function bindCopy(installBtnId, copyBtnId) {
    const installBtn = document.getElementById(installBtnId);
    const copyBtn = document.getElementById(copyBtnId);
    if (!installBtn || !copyBtn) return;

    installBtn.addEventListener('click', () => {
      navigator.clipboard
        .writeText('npx termbeam')
        .then(() => {
          installBtn.classList.add('copied');
          copyBtn.classList.add('copied');
          setTimeout(() => {
            installBtn.classList.remove('copied');
            copyBtn.classList.remove('copied');
          }, 2000);
        })
        .catch(() => {
          // Fallback: select text for manual copy
          const range = document.createRange();
          range.selectNodeContents(installBtn);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });
    });
  }

  bindCopy('install-btn', 'copy-btn');
  bindCopy('cta-install-btn', 'cta-copy-btn');
}

// ─── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initWordReveal();
  initScrollReveal();
  initNavScroll();
  initShowcase();
  if (!reducedMotion) {
    initDeviceTilt();
    initHeroParallax();
  }
  initCopyButton();

  // Cursor spotlight on hero
  const hero = document.querySelector('.hero');
  if (hero && !reducedMotion) {
    hero.addEventListener('mousemove', (e) => {
      hero.style.setProperty('--mouse-x', e.clientX + 'px');
      hero.style.setProperty('--mouse-y', e.clientY + 'px');
    });
  }
});
