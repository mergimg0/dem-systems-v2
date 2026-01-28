/**
 * About Section — Scroll-Wipe Reveal (top-to-bottom)
 * Uses IntersectionObserver on .body-text (not the section, which gets position:fixed).
 * Repeatable: resets when content leaves viewport, replays on re-entry.
 * Existing scroll-tied word animations are untouched.
 */

import { animate } from 'animejs';

export function initAboutWipe() {
  const section = document.querySelector('.section--about');
  if (!section) return;

  const bodyText = section.querySelector('.body-text');
  if (!bodyText) return;

  const wipeElements = section.querySelectorAll('.about-wipe');
  if (!wipeElements.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    wipeElements.forEach(el => {
      el.classList.remove('about-wipe');
    });
    return;
  }

  // State: 'hidden' | 'animating' | 'visible'
  let state = 'hidden';

  // Guard: don't fire until user has scrolled at least 50px
  // (prevents false trigger on page load / browser scroll restoration)
  let userHasScrolled = false;
  function checkScrolled() {
    if (window.scrollY > 50) {
      userHasScrolled = true;
      window.removeEventListener('scroll', checkScrolled);
    }
  }
  if (window.scrollY > 50) {
    userHasScrolled = true;
  } else {
    window.addEventListener('scroll', checkScrolled, { passive: true });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && state === 'hidden' && userHasScrolled) {
        state = 'animating';
        wipeElements.forEach((el, i) => {
          el.style.clipPath = '';  // restore CSS class clip-path
          el.style.willChange = 'clip-path';
          animate(el, {
            '--about-wipe': ['100%', '0%'],
            duration: 900,
            ease: 'inOutQuint',
            delay: i * 200,
            onComplete: () => {
              el.style.clipPath = 'none';  // remove clip so sprites can overflow
              el.style.willChange = 'auto';
              if (i === wipeElements.length - 1) state = 'visible';
            }
          });
        });
      }

      // Reset when content leaves viewport
      if (!entry.isIntersecting && state === 'visible') {
        state = 'hidden';
        wipeElements.forEach(el => {
          el.style.setProperty('--about-wipe', '100%');
          el.style.clipPath = '';  // restore CSS class clip-path
          el.style.willChange = 'clip-path';
        });
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px'
  });

  observer.observe(bodyText);
}
