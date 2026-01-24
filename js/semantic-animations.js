/**
 * Semantic Animation System - Word Level
 *
 * Bold, expressive animations on individual words:
 * - "friction" -> shake/glitch that settles (resistance being broken)
 * - "eliminate" -> strike-through slash (removal action)
 * - "clarity" -> blur-to-sharp with glow (understanding emerging)
 *
 * Anime.js powered animations:
 * - "build bespoke software solutions" -> hover-triggered sequential assembly
 *   Semiotic: Precision engineering + collaboration, mechanical snap
 * - "and where operational clarity lives" -> word-by-word line break
 *   Semiotic: Alignment/ordering, list/manifest of truth
 *
 * Triggered at specific scroll thresholds for maximum impact.
 */

import { animate, createLayout, stagger, utils } from 'animejs';

/**
 * Check if element is in viewport
 */
function isInViewport(element, threshold = 0.5) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  // Element center point
  const elementCenter = rect.top + rect.height / 2;

  // Check if center is within threshold of viewport
  const triggerPoint = viewportHeight * threshold;

  return elementCenter < triggerPoint && rect.bottom > 0;
}

/**
 * "build bespoke software solutions" - Sequential Assembly Animation
 * Semiotic: Precision engineering + collaboration
 * Metaphor: Components snapping into place
 * Timing: Snappy/decisive with hard stops
 * Trigger: Hover interaction (user initiates the "build")
 */
function initBespokeAssembly() {
  const container = document.querySelector('.bespoke-assembly');
  if (!container) return;

  const text = container.textContent;
  const words = text.split(' ');

  // Clear and rebuild with word spans
  container.innerHTML = '';
  container.classList.add('bespoke-container');

  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'bespoke-word';
    span.textContent = word;
    span.style.setProperty('--word-index', i);
    container.appendChild(span);

    // Add space after word (except last)
    if (i < words.length - 1) {
      container.appendChild(document.createTextNode(' '));
    }
  });

  const wordEls = container.querySelectorAll('.bespoke-word');
  let isAnimated = false;
  let layout = null;

  // Initialize layout for FLIP animations
  layout = createLayout(container, {
    ease: 'outExpo',
    duration: 400
  });

  // Hover triggers assembly animation
  container.addEventListener('mouseenter', () => {
    if (isAnimated) return;
    isAnimated = true;

    layout.update(() => {
      container.classList.add('assembled');
    }, {
      delay: stagger(60, { from: 'first' }),
      duration: 350,
      ease: 'outExpo'
    });
  });

  // Mouse leave resets
  container.addEventListener('mouseleave', () => {
    if (!isAnimated) return;

    layout.update(() => {
      container.classList.remove('assembled');
    }, {
      delay: stagger(40, { from: 'last' }),
      duration: 300,
      ease: 'outExpo'
    });

    isAnimated = false;
  });

  console.log('[Semantic] Bespoke assembly animation initialized');
}

/**
 * "and where operational clarity lives" - Word-by-Word Line Break
 * Semiotic: Alignment/ordering (chaos to structure)
 * Animation: Slow, smooth transition to 100% width justified row
 * Trigger: After phrase deletion completes
 */
function initClarityManifest() {
  const container = document.querySelector('.clarity-manifest');
  if (!container) return;

  const text = container.textContent;
  const words = text.split(' ');

  // Clear and rebuild with word spans
  container.innerHTML = '';
  container.classList.add('clarity-container');

  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'clarity-word';
    span.textContent = word;
    span.style.setProperty('--word-index', i);
    container.appendChild(span);
  });

  // Initialize FLIP layout for smooth transitions
  const layout = createLayout(container, {
    duration: 1800,
    ease: 'out(3)'
  });

  // Listen for phrase deletion to trigger animation
  window.addEventListener('phraseDeleted', () => {
    // Small delay after deletion completes
    setTimeout(() => {
      triggerClarityAnimation(container, layout);
    }, 300);
  }, { once: true });

  console.log('[Semantic] Clarity manifest animation initialized (waiting for phraseDeleted)');
}

function triggerClarityAnimation(container, layout) {
  const wordEls = container.querySelectorAll('.clarity-word');
  const wordCount = wordEls.length;

  // Use FLIP to smoothly animate the layout change
  layout.update(() => {
    container.classList.add('manifest-active');
  }, {
    delay: stagger(200, { ease: 'out(2)' }),
    duration: 1800,
    ease: 'out(3)'
  });

  console.log('[Semantic] Clarity manifest triggered');

  // Dispatch event when clarity animation completes
  const totalDuration = 1800 + (wordCount * 200) + 500;
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('clarityComplete'));
  }, totalDuration);
}

/**
 * "handle the complex code" / "focus on the work that matters" - Stagger Ease
 * First phrase: Goes DOWN with steps easing (mechanical, deliberate)
 * Second phrase: Goes UP (contrast, aspiration)
 * Trigger: After clarity animation completes
 */
function initComplexStagger() {
  const containers = document.querySelectorAll('.complex-stagger');
  if (!containers.length) return;

  containers.forEach((container, containerIndex) => {
    const text = container.textContent;
    const chars = text.split('');

    // Clear and rebuild with character spans
    container.innerHTML = '';
    container.classList.add('complex-container');

    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'complex-char';
      // Preserve spaces
      span.innerHTML = char === ' ' ? '&nbsp;' : char;
      span.style.setProperty('--char-index', i);
      container.appendChild(span);
    });
  });

  // Wait for clarity animation to complete
  window.addEventListener('clarityComplete', () => {
    triggerComplexAnimation();
  }, { once: true });

  console.log('[Semantic] Complex stagger initialized (waiting for clarityComplete)');
}

function triggerComplexAnimation() {
  const containers = document.querySelectorAll('.complex-stagger');

  containers.forEach((container, containerIndex) => {
    const charEls = container.querySelectorAll('.complex-char');

    // First container: "handle the complex code" - goes DOWN with steps easing
    // Second container: "focus on the work that matters" - goes UP
    const isFirstPhrase = containerIndex === 0;

    if (isFirstPhrase) {
      // Steps easing - mechanical, deliberate descent
      animate(charEls, {
        y: stagger(['0rem', '2.5rem', '2rem'], { ease: 'inOut(3)' }),
        opacity: [0.4, 1],
        delay: stagger(25, { ease: 'steps(5)' }),
        duration: 800,
        ease: 'steps(8)'
      });
    } else {
      // Second phrase - dramatic rise
      animate(charEls, {
        y: stagger(['0rem', '-2.5rem', '-2rem'], { ease: 'inOut(3)' }),
        opacity: [0.4, 1],
        delay: stagger(25, { ease: 'inOut(3)', start: 400 }),
        duration: 800,
        ease: 'out(4)'
      });
    }

    console.log(`[Semantic] Complex stagger ${containerIndex} triggered`);
  });
}

/**
 * Initialize word-level animations
 */
export function initSemanticAnimations() {
  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    disableAnimationsGracefully();
    return;
  }

  console.log('Initializing word-level semantic animations...');

  // Initialize anime.js powered animations
  initBespokeAssembly();
  initClarityManifest();
  initComplexStagger();

  // Get all animated words
  const wordFriction = document.querySelector('.word-friction');
  const wordEliminate = document.querySelector('.word-eliminate');
  const wordClarity = document.querySelector('.word-clarity');

  // Track which animations have been triggered
  const triggered = {
    friction: false,
    eliminate: false,
    clarity: false
  };

  // Scroll handler
  let ticking = false;

  const checkAnimations = () => {
    // ELIMINATE - triggers first (at 60% viewport)
    if (!triggered.eliminate && wordEliminate && isInViewport(wordEliminate, 0.6)) {
      triggered.eliminate = true;
      wordEliminate.classList.add('active');
      console.log('[Word] Eliminate triggered');

      // Trigger friction shortly after eliminate
      setTimeout(() => {
        if (wordFriction && !triggered.friction) {
          triggered.friction = true;
          wordFriction.classList.add('active');
          console.log('[Word] Friction triggered');
        }
      }, 200);
    }

    // CLARITY - triggers when P2 is in view (at 60% viewport)
    if (!triggered.clarity && wordClarity && isInViewport(wordClarity, 0.6)) {
      triggered.clarity = true;
      wordClarity.classList.add('active');
      console.log('[Word] Clarity triggered');

      // Add revealed class after glow animation
      setTimeout(() => {
        wordClarity.classList.add('revealed');
      }, 1500);
    }

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(checkAnimations);
      ticking = true;
    }
  }, { passive: true });

  // Initial check
  checkAnimations();

  console.log('Word-level semantic animations initialized');
}

/**
 * Graceful degradation
 */
function disableAnimationsGracefully() {
  // Remove blur from clarity word
  const wordClarity = document.querySelector('.word-clarity');
  if (wordClarity) {
    wordClarity.style.filter = 'none';
    wordClarity.style.opacity = '1';
  }

  // Show all words normally
  document.querySelectorAll('.word-animate').forEach(word => {
    word.style.filter = 'none';
    word.style.opacity = '1';
    word.style.transform = 'none';
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSemanticAnimations);
} else {
  initSemanticAnimations();
}

export default { initSemanticAnimations };
