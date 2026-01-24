/**
 * Scroll Controller for About Section Animations
 *
 * Provides 1:1 scroll-scrubbed animation control with section pinning.
 * RAF-throttled for 60fps performance.
 *
 * @see thoughts/shared/specs/2026-01-24-about-section-scroll-animations.md
 * @see thoughts/shared/plans/2026-01-24-scroll-pinning-plan.md
 */

// Check reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Check if mobile (pinning can cause jank on mobile)
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Configuration
const CONFIG = {
  sectionSelector: '#about',
  // Pinning configuration
  pinning: {
    enabled: !isMobile,     // Disable on mobile for performance
    pinStart: 0.25,         // Pin when section top reaches 25% from top of viewport (more centered)
    scrollDistance: 2.0     // viewportHeights of scroll while pinned (more scroll time)
  },
  // Paragraph progress ranges (when each paragraph's animations play)
  paragraphRanges: {
    p1: { start: 0.00, end: 0.25 },  // 0-25%
    p2: { start: 0.25, end: 0.70 },  // 25-70%
    p3: { start: 0.70, end: 1.00 }   // 70-100%
  }
};

// State
let section = null;
let spacerElement = null;
let backdropElement = null;  // Full-screen backdrop when pinned
let isPinned = false;
let rafId = null;
let lastProgress = -1;
let sectionOriginalTop = 0;  // Store section's original position
let sectionOriginalParent = null;  // Store original parent for restoring
let sectionNextSibling = null;  // Store next sibling for reinsertion
const registeredAnimations = new Map();

/**
 * Create spacer element for scroll distance while pinned
 */
function createSpacer() {
  if (spacerElement) return;

  spacerElement = document.createElement('div');
  spacerElement.className = 'about-scroll-spacer';
  spacerElement.setAttribute('aria-hidden', 'true');
  spacerElement.style.cssText = `
    height: ${CONFIG.pinning.scrollDistance * 100}vh;
    pointer-events: none;
  `;
  section.insertAdjacentElement('afterend', spacerElement);
}

/**
 * Remove spacer element
 */
function removeSpacer() {
  if (spacerElement) {
    spacerElement.remove();
    spacerElement = null;
  }
}

/**
 * Create backdrop element (covers entire viewport when pinned)
 */
function createBackdrop() {
  if (backdropElement) return;

  backdropElement = document.createElement('div');
  backdropElement.className = 'about-pin-backdrop';
  backdropElement.setAttribute('aria-hidden', 'true');
  backdropElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--color-background, #fff);
    z-index: 1002;
    pointer-events: none;
  `;
  // Insert as first child of body to ensure it's in the base stacking context
  document.body.insertBefore(backdropElement, document.body.firstChild);
}

/**
 * Remove backdrop element
 */
function removeBackdrop() {
  if (backdropElement) {
    backdropElement.remove();
    backdropElement = null;
  }
}

// Track if we're currently in "after" state
let isInAfterState = false;

/**
 * Update pin state
 * @param {boolean} shouldPin - Whether section should be pinned
 * @param {boolean} isAfterPinZone - True if we've scrolled past the pin zone
 */
function updatePinState(shouldPin, isAfterPinZone = false) {
  // Track state changes
  const wasInAfterState = isInAfterState;
  isInAfterState = isAfterPinZone;

  // Skip if no change
  if (isPinned === shouldPin && wasInAfterState === isAfterPinZone) return;
  isPinned = shouldPin;

  const viewportHeight = window.innerHeight;
  const scrollDistancePx = CONFIG.pinning.scrollDistance * viewportHeight;

  if (shouldPin) {
    // Pinned state - move to body for proper stacking, fixed position with backdrop

    // IMPORTANT: Capture current visual position BEFORE any DOM changes
    // This prevents the "snap" effect by smoothly transitioning from current position
    const currentRect = section.getBoundingClientRect();
    const currentVisualTop = currentRect.top;
    const targetTop = CONFIG.pinning.pinStart * viewportHeight;

    createBackdrop();

    // Move section to body to escape #main-content stacking context
    if (section.parentElement !== document.body) {
      document.body.appendChild(section);
    }

    section.classList.add('is-pinned');
    section.classList.remove('is-after-pin');
    section.style.position = 'fixed';
    // Start at current visual position (no jump)
    section.style.top = `${currentVisualTop}px`;
    section.style.left = '0';
    section.style.right = '0';
    section.style.width = '100%';
    section.style.zIndex = '1003';
    section.style.background = 'var(--color-background, #fff)';

    // Smoothly animate to target position if not already there
    if (Math.abs(currentVisualTop - targetTop) > 1) {
      section.style.transition = 'top 0.3s ease-out';
      requestAnimationFrame(() => {
        section.style.top = `${targetTop}px`;
        // Clear transition after animation completes
        setTimeout(() => {
          section.style.transition = '';
        }, 300);
      });
    }
  } else if (isAfterPinZone) {
    // After pin zone - return to normal document flow
    // This lets Contact reveal naturally as a sibling in #main-content
    removeBackdrop();

    // Return About to its original parent (#main-content)
    if (sectionOriginalParent && section.parentElement === document.body) {
      if (sectionNextSibling) {
        sectionOriginalParent.insertBefore(section, sectionNextSibling);
      } else {
        sectionOriginalParent.appendChild(section);
      }
    }

    section.classList.remove('is-pinned');
    section.classList.add('is-after-pin');

    // Clear all inline styles - let normal document flow handle positioning
    section.style.transition = '';
    section.style.position = '';
    section.style.top = '';
    section.style.left = '';
    section.style.right = '';
    section.style.width = '';
    section.style.zIndex = '';
    section.style.background = '';
  } else {
    // Before pin zone - restore to original parent and normal flow
    if (sectionOriginalParent && section.parentElement === document.body) {
      if (sectionNextSibling) {
        sectionOriginalParent.insertBefore(section, sectionNextSibling);
      } else {
        sectionOriginalParent.appendChild(section);
      }
    }

    removeBackdrop();
    section.classList.remove('is-pinned');
    section.classList.remove('is-after-pin');

    // Clear any transition from pin animation
    section.style.transition = '';
    section.style.position = '';
    section.style.top = '';
    section.style.left = '';
    section.style.right = '';
    section.style.width = '';
    section.style.zIndex = '';
    section.style.background = '';
  }
}

/**
 * Calculate scroll progress (0-1) with pinning logic
 * @returns {number} Progress value between 0 and 1
 */
function calculateProgress() {
  if (!section) return 0;

  const viewportHeight = window.innerHeight;

  // If pinning is disabled, use simple scroll-based progress
  if (!CONFIG.pinning.enabled) {
    const rect = section.getBoundingClientRect();
    const sectionHeight = rect.height;
    const totalDistance = sectionHeight + viewportHeight;
    const traveled = viewportHeight - rect.top;
    return Math.max(0, Math.min(1, traveled / totalDistance));
  }

  // Pinning enabled - calculate based on spacer position
  const scrollY = window.scrollY;
  const pinTriggerY = sectionOriginalTop - (viewportHeight * CONFIG.pinning.pinStart);
  const scrollDistancePx = CONFIG.pinning.scrollDistance * viewportHeight;
  const pinEndY = pinTriggerY + scrollDistancePx;

  // Not yet at pin point
  if (scrollY < pinTriggerY) {
    updatePinState(false);
    return 0;
  }

  // Past pin zone (animation complete) - stick to bottom of spacer
  if (scrollY > pinEndY) {
    updatePinState(false, true);
    return 1;
  }

  // In pin zone - calculate progress
  updatePinState(true);
  const progressOffset = scrollY - pinTriggerY;
  return Math.max(0, Math.min(1, progressOffset / scrollDistancePx));
}

/**
 * Map a value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value, clamped to output range
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
  // Clamp input to range
  const clampedValue = Math.max(inMin, Math.min(inMax, value));
  // Map to output range
  const normalized = (clampedValue - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
}

/**
 * Update all registered animations based on current scroll progress
 */
function updateAnimations() {
  const globalProgress = calculateProgress();

  // Skip if progress hasn't changed meaningfully
  if (Math.abs(globalProgress - lastProgress) < 0.0001) return;
  lastProgress = globalProgress;

  // Update each registered animation
  registeredAnimations.forEach((animData, id) => {
    const { animation, range } = animData;

    // Calculate local progress for this animation's range
    let localProgress;
    if (globalProgress < range.start) {
      localProgress = 0;
    } else if (globalProgress > range.end) {
      localProgress = 1;
    } else {
      localProgress = mapRange(globalProgress, range.start, range.end, 0, 1);
    }

    // Call seek on the animation
    if (animation && typeof animation.seek === 'function') {
      animation.seek(localProgress);
    }
  });
}

/**
 * RAF-throttled scroll handler
 */
function onScroll() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(updateAnimations);
}

/**
 * Register an animation with the scroll controller
 * @param {string} id - Unique identifier for this animation
 * @param {object} animation - Animation object with seek(progress) method
 * @param {object} range - { start: 0-1, end: 0-1 } progress range
 */
export function registerAnimation(id, animation, range) {
  registeredAnimations.set(id, { animation, range });
}

/**
 * Unregister an animation
 * @param {string} id - Animation identifier
 */
export function unregisterAnimation(id) {
  const animData = registeredAnimations.get(id);
  if (animData && animData.animation && typeof animData.animation.revert === 'function') {
    animData.animation.revert();
  }
  registeredAnimations.delete(id);
}

/**
 * Get the paragraph range for a given paragraph number
 * @param {number} paragraphNum - 1, 2, or 3
 * @returns {object} { start, end } progress range
 */
export function getParagraphRange(paragraphNum) {
  return CONFIG.paragraphRanges[`p${paragraphNum}`] || { start: 0, end: 1 };
}

/**
 * Calculate animation range within a paragraph
 * @param {number} paragraphNum - 1, 2, or 3
 * @param {number} indexInParagraph - 0-based index of this animation within the paragraph
 * @param {number} totalInParagraph - Total animations in this paragraph
 * @returns {object} { start, end } global progress range
 */
export function getAnimationRange(paragraphNum, indexInParagraph, totalInParagraph) {
  const pRange = getParagraphRange(paragraphNum);
  const pDuration = pRange.end - pRange.start;
  const animDuration = pDuration / totalInParagraph;

  return {
    start: pRange.start + (indexInParagraph * animDuration),
    end: pRange.start + ((indexInParagraph + 1) * animDuration)
  };
}

/**
 * Initialize the scroll controller
 */
export function initScrollController() {
  section = document.querySelector(CONFIG.sectionSelector);

  if (!section) {
    console.warn('[ScrollController] Section not found:', CONFIG.sectionSelector);
    return;
  }

  // Store section's original position and parent (before any pinning)
  const rect = section.getBoundingClientRect();
  sectionOriginalTop = rect.top + window.scrollY;
  sectionOriginalParent = section.parentElement;
  sectionNextSibling = section.nextElementSibling;

  if (prefersReducedMotion) {
    console.log('[ScrollController] Reduced motion preferred, animations will show final state');
    // Don't attach scroll handler - animations will show final state
    return;
  }

  // Create spacer for pinning
  if (CONFIG.pinning.enabled) {
    createSpacer();
    console.log('[ScrollController] Pinning enabled, spacer created');
  }

  // Attach scroll handler with passive for performance
  window.addEventListener('scroll', onScroll, { passive: true });

  // Initial calculation
  updateAnimations();

  console.log('[ScrollController] Initialized', {
    pinning: CONFIG.pinning.enabled,
    sectionOriginalTop,
    scrollDistance: CONFIG.pinning.scrollDistance + 'vh'
  });
}

/**
 * Destroy the scroll controller and clean up
 */
export function destroyScrollController() {
  window.removeEventListener('scroll', onScroll);

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Unpin if currently pinned
  if (isPinned) {
    updatePinState(false);
  }

  // Remove spacer
  removeSpacer();

  // Revert all animations
  registeredAnimations.forEach((animData) => {
    if (animData.animation && typeof animData.animation.revert === 'function') {
      animData.animation.revert();
    }
  });
  registeredAnimations.clear();

  lastProgress = -1;
  section = null;
  sectionOriginalTop = 0;

  console.log('[ScrollController] Destroyed');
}

/**
 * Get current progress (for debugging)
 * @returns {number} Current scroll progress 0-1
 */
export function getCurrentProgress() {
  return calculateProgress();
}

/**
 * Check if reduced motion is preferred
 * @returns {boolean}
 */
export function isReducedMotion() {
  return prefersReducedMotion;
}

/**
 * Check if currently pinned
 * @returns {boolean}
 */
export function isPinnedState() {
  return isPinned;
}

export default {
  registerAnimation,
  unregisterAnimation,
  getParagraphRange,
  getAnimationRange,
  initScrollController,
  destroyScrollController,
  getCurrentProgress,
  isReducedMotion,
  isPinnedState
};
