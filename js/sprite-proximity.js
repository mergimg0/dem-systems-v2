/**
 * Sprite Proximity Animation System
 *
 * Creates a "Pokemon grass rustle" effect where sprites:
 * - Wobble subtly when cursor is in outer proximity zone (150px)
 * - Wobble more intensely in inner zone (75px)
 * - "Pop" with full animation on hover
 * - Fade out gracefully on exit
 *
 * Mobile: Sprites auto-animate sequentially on scroll into view
 */

// Configuration
const CONFIG = {
  OUTER_RADIUS: 150,    // Outer proximity zone in pixels
  INNER_RADIUS: 75,     // Inner proximity zone in pixels
  EXIT_DURATION: 500,   // ms before resetting to idle after hover exit
  SCROLL_STAGGER: 250,  // ms between sequential mobile animations
  SCROLL_THRESHOLD: 0.5, // IntersectionObserver threshold
  PHRASE3_DELAY: 2000,  // ms before phrase #3 disappears after hover
};

// State
let mouseX = 0;
let mouseY = 0;
let triggers = [];
let isDesktop = false;
let rafId = null;
let phrase3Triggered = false;

/**
 * Initialize the sprite proximity system
 */
export function initSpriteProximity() {
  // Skip entirely for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  triggers = Array.from(document.querySelectorAll('.sprite-trigger'));

  if (triggers.length === 0) {
    return;
  }

  // Detect device capability
  isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (isDesktop) {
    initDesktopProximity();
  } else {
    initMobileScrollTriggers();
  }

  // Initialize phrase #3 special behavior
  initPhraseThreeShift();
}

/**
 * Desktop: Mouse proximity tracking and hover states
 */
function initDesktopProximity() {
  // Track mouse position
  document.addEventListener('mousemove', handleMouseMove, { passive: true });

  // Start proximity calculation loop
  startProximityLoop();

  // Add hover event listeners to each trigger
  triggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', () => handleHoverEnter(trigger));
    trigger.addEventListener('mouseleave', () => handleHoverLeave(trigger));
  });
}

/**
 * Handle mouse movement
 */
function handleMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

/**
 * Start the proximity calculation loop using requestAnimationFrame
 */
function startProximityLoop() {
  function updateProximity() {
    triggers.forEach(trigger => {
      // Skip if currently hovering (hover state takes precedence)
      const state = trigger.dataset.state;
      if (state === 'hovering' || state === 'exiting') {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from mouse to trigger center
      const distance = Math.hypot(mouseX - centerX, mouseY - centerY);

      // Determine proximity zone
      if (distance <= CONFIG.INNER_RADIUS) {
        trigger.dataset.proximity = 'inner';
      } else if (distance <= CONFIG.OUTER_RADIUS) {
        trigger.dataset.proximity = 'outer';
      } else {
        trigger.dataset.proximity = 'none';
      }
    });

    rafId = requestAnimationFrame(updateProximity);
  }

  rafId = requestAnimationFrame(updateProximity);
}

/**
 * Handle hover enter - trigger full animation
 */
function handleHoverEnter(trigger) {
  // Clear any pending exit timeout
  if (trigger._exitTimeout) {
    clearTimeout(trigger._exitTimeout);
    trigger._exitTimeout = null;
  }

  trigger.dataset.state = 'hovering';
  trigger.dataset.proximity = 'none'; // Proximity doesn't apply during hover
}

/**
 * Handle hover leave - graceful fade out
 */
function handleHoverLeave(trigger) {
  trigger.dataset.state = 'exiting';

  // Reset to idle after exit animation completes
  trigger._exitTimeout = setTimeout(() => {
    trigger.dataset.state = 'idle';
    trigger._exitTimeout = null;
  }, CONFIG.EXIT_DURATION);
}

/**
 * Mobile: Scroll-triggered sequential animations
 */
function initMobileScrollTriggers() {
  let triggeredCount = 0;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const trigger = entry.target;
        const index = triggers.indexOf(trigger);

        // Stagger animation based on order
        setTimeout(() => {
          trigger.dataset.state = 'scroll-triggered';

          // Auto-reset after animation plays
          setTimeout(() => {
            trigger.dataset.state = 'idle';
          }, 2000); // Let animation play for 2 seconds

        }, index * CONFIG.SCROLL_STAGGER);

        // Stop observing once triggered
        observer.unobserve(trigger);
        triggeredCount++;
      }
    });
  }, {
    threshold: CONFIG.SCROLL_THRESHOLD,
    rootMargin: '0px 0px -10% 0px' // Trigger slightly before fully in view
  });

  // Observe all triggers
  triggers.forEach(trigger => observer.observe(trigger));
}

/**
 * Phrase #3 special behavior: disappears after hover, text shifts left
 */
function initPhraseThreeShift() {
  const phrase3 = document.querySelector('.sprite-trigger--disappear');
  const shiftText = document.querySelector('.p2-shift-text');

  if (!phrase3 || !shiftText) {
    return;
  }

  // Desktop: trigger on hover
  if (isDesktop) {
    phrase3.addEventListener('mouseenter', () => {
      if (phrase3Triggered) return;

      // Set a timeout to trigger the disappear effect
      phrase3._disappearTimeout = setTimeout(() => {
        triggerPhrase3Disappear(phrase3, shiftText);
      }, CONFIG.PHRASE3_DELAY);
    });

    phrase3.addEventListener('mouseleave', () => {
      // Cancel if user leaves before timeout
      if (phrase3._disappearTimeout && !phrase3Triggered) {
        clearTimeout(phrase3._disappearTimeout);
        phrase3._disappearTimeout = null;
      }
    });
  } else {
    // Mobile: trigger after scroll animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !phrase3Triggered) {
          setTimeout(() => {
            triggerPhrase3Disappear(phrase3, shiftText);
          }, CONFIG.PHRASE3_DELAY + CONFIG.SCROLL_STAGGER * 2);

          observer.unobserve(phrase3);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(phrase3);
  }
}

/**
 * Execute the phrase #3 disappear and text shift animation
 */
function triggerPhrase3Disappear(phrase3, shiftText) {
  if (phrase3Triggered) return;
  phrase3Triggered = true;

  // Add fade-out class to phrase #3
  phrase3.classList.add('fade-out');

  // Shift the following text left
  shiftText.classList.add('shift-left');
}

/**
 * Cleanup function for SPA navigation
 */
export function destroySpriteProximity() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  document.removeEventListener('mousemove', handleMouseMove);

  triggers.forEach(trigger => {
    if (trigger._exitTimeout) {
      clearTimeout(trigger._exitTimeout);
    }
    if (trigger._disappearTimeout) {
      clearTimeout(trigger._disappearTimeout);
    }
  });

  triggers = [];
  phrase3Triggered = false;
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSpriteProximity);
} else {
  initSpriteProximity();
}
