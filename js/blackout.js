/**
 * DEM Systems - Blackout Animation Controller
 *
 * Scroll-triggered overlay that paints from top of viewport,
 * with mix-blend-mode color inversion.
 *
 * Trigger: When About section scrolls out of view
 * Duration: ~1 viewport height of scroll
 * Fully reversible on scroll-up
 *
 * Note: Logo animation is handled by nav.js (expands when scrolled past hero)
 */

// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Animation state
let isInitialized = false;
let currentProgress = 0;
let targetProgress = 0;
let rafId = null;
let lastFrameTime = performance.now();  // For frame-rate independent animation

// DOM elements (cached on init)
let nav = null;
let overlay = null;
let contactSection = null;

// Dimensions (calculated on init and resize)
let navHeight = 72;
let viewportHeight = window.innerHeight;

/**
 * Easing function - easeOutQuart for dramatic deceleration
 * @param {number} t - Progress 0-1
 * @returns {number} Eased progress 0-1
 */
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

// Cache the trigger scroll position (calculated once when trigger first fires)
let triggerScrollPosition = null;

/**
 * Calculate animation progress based on scroll position
 * Trigger: When Contact section enters viewport from below
 * Duration: From trigger point until the bottom of the page is reached
 *
 * @returns {number} Progress 0-1
 */
function calculateProgress() {
  if (!contactSection) return 0;

  const rect = contactSection.getBoundingClientRect();
  const contactTop = rect.top;
  const currentScroll = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - viewportHeight;

  // Trigger when contact section top enters slightly below middle of viewport (55%)
  // Lower value = triggers later/further down the page
  const triggerPoint = viewportHeight * 0.55;

  // Check if we've reached the trigger point
  const shouldTrigger = contactTop <= triggerPoint;

  // Not triggered yet
  if (!shouldTrigger) {
    triggerScrollPosition = null;  // Reset if we scroll back above trigger
    return 0;
  }

  // First time triggering - capture the scroll position
  if (triggerScrollPosition === null) {
    triggerScrollPosition = currentScroll;
    console.log('[Blackout] Triggered at scroll:', triggerScrollPosition, 'maxScroll:', maxScroll);
  }

  // Animation runs from trigger scroll to 99% of max scroll
  // This ensures animation completes just before hitting absolute bottom
  const targetScroll = triggerScrollPosition + (maxScroll - triggerScrollPosition) * 0.99;
  const scrollDistance = targetScroll - triggerScrollPosition;

  if (scrollDistance <= 0) return 1;

  // Progress: 0 at trigger, 1 at 99% to bottom
  const rawProgress = (currentScroll - triggerScrollPosition) / scrollDistance;

  // Debug
  if (rawProgress > 0 && rawProgress <= 1.01) {
    console.log('[Blackout] progress:', rawProgress.toFixed(3), 'scroll:', currentScroll, 'remaining:', maxScroll - currentScroll);
  }

  // Clamp to 0-1
  return Math.max(0, Math.min(1, rawProgress));
}

/**
 * Apply visual state based on animation progress
 * @param {number} progress - Animation progress 0-1
 */
function applyProgress(progress) {
  if (!nav || !overlay) return;

  // When progress is 0, reset to initial state
  if (progress === 0) {
    overlay.style.height = '0';
    nav.classList.remove('nav--expanding', 'nav--blackout-complete');
    return;
  }

  // Overlay paints from TOP of viewport down
  // Height: 0 -> 100vh as progress: 0 -> 1
  // Add overscroll buffer for macOS/iOS elastic scrolling
  const baseHeight = viewportHeight * progress;
  const overscrollBuffer = progress * viewportHeight * 0.5;
  const overlayHeight = baseHeight + overscrollBuffer;

  // Apply overlay height (starts from top, paints downward)
  overlay.style.height = `${overlayHeight}px`;

  // Toggle CSS classes for styling hooks
  const isExpanding = progress > 0 && progress < 1;
  const isComplete = progress >= 1;

  nav.classList.toggle('nav--expanding', isExpanding);
  nav.classList.toggle('nav--blackout-complete', isComplete);
}

/**
 * Animation loop - runs on every frame
 * Uses frame-rate independent lerp for consistent behavior at 60hz, 120hz, 144hz
 */
function tick() {
  // Calculate delta time for frame-rate independence
  const now = performance.now();
  const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1); // Cap at 100ms
  lastFrameTime = now;

  // Calculate target progress from scroll position
  targetProgress = calculateProgress();

  // Frame-rate independent lerp: 1 - e^(-factor * dt)
  // Factor of 4 gives similar feel to the old 0.06 lerp at 60fps
  const lerpFactor = 1 - Math.exp(-4 * deltaTime);
  currentProgress += (targetProgress - currentProgress) * lerpFactor;

  // Snap to target if very close (prevents eternal micro-movements)
  if (Math.abs(targetProgress - currentProgress) < 0.001) {
    currentProgress = targetProgress;
  }

  // Apply visual state
  applyProgress(currentProgress);

  // Continue loop
  rafId = requestAnimationFrame(tick);
}

/**
 * Handle viewport resize
 */
function handleResize() {
  viewportHeight = window.innerHeight;

  // Recalculate nav height from CSS variable
  const styles = getComputedStyle(document.documentElement);
  navHeight = parseInt(styles.getPropertyValue('--nav-height')) || 72;
}

/**
 * Reduced motion fallback - instant state toggle based on scroll
 * Logo animation handled by nav.js
 */
function initReducedMotionFallback() {
  if (!contactSection || !nav) return;

  function checkPosition() {
    const rect = contactSection.getBoundingClientRect();
    // Trigger when contact section top enters slightly below middle of viewport (55%)
    const triggered = rect.top < viewportHeight * 0.55;

    // Toggle instant state (no animation)
    nav.classList.toggle('nav--blackout-complete', triggered);
    document.body.classList.toggle('blackout-active', triggered);

    // Set overlay height instantly
    if (overlay) {
      overlay.style.height = triggered ? '150vh' : '0';
    }
  }

  window.addEventListener('scroll', checkPosition, { passive: true });
  window.addEventListener('resize', checkPosition, { passive: true });

  // Initial check
  checkPosition();
}

/**
 * Initialize the blackout animation
 * @returns {Function|undefined} Cleanup function for SPA navigation
 */
export function initBlackoutAnimation() {
  if (isInitialized) return;

  console.log('[Blackout] Initializing...');

  // Cache DOM elements
  nav = document.querySelector('.nav');
  overlay = document.querySelector('.blackout-overlay');
  contactSection = document.querySelector('.section--contact');

  console.log('[Blackout] Elements found:', { nav: !!nav, overlay: !!overlay, contactSection: !!contactSection });

  // Validate required elements
  if (!nav || !overlay || !contactSection) {
    console.warn('[Blackout] Required elements not found, animation disabled');
    return;
  }

  isInitialized = true;
  console.log('[Blackout] Initialized successfully');

  // Get initial dimensions
  handleResize();

  // Listen for resize
  window.addEventListener('resize', handleResize, { passive: true });

  // Branch based on motion preference
  if (prefersReducedMotion) {
    initReducedMotionFallback();
    return;
  }

  // Start animation loop
  rafId = requestAnimationFrame(tick);

  // Return cleanup function
  return function cleanup() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.removeEventListener('resize', handleResize);
    isInitialized = false;
  };
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlackoutAnimation);
} else {
  initBlackoutAnimation();
}
