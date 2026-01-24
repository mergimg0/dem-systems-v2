/**
 * About Section Scrollytelling Orchestrator
 *
 * Native scroll-based implementation for maximum responsiveness.
 * No GSAP ScrollTrigger - direct scroll position mapping.
 *
 * @see /thoughts/shared/specs/2026-01-21-about-section-scrollytelling.md
 */

// Check reduced motion preference early
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Configuration
const CONFIG = {
  // Scroll distances (in pixels)
  scrollDistances: {
    p1Pin: 500,
    p1ToP2Flow: 200,
    p2Pin: 500,
    p2ToP3Flow: 200,
    p3Pin: 500,
  },
  // Timing (relative to total scroll 0-1)
  timing: {
    p1: { start: 0, end: 0.26 },
    flow1: { start: 0.26, end: 0.37 },
    p2: { start: 0.37, end: 0.63 },
    flow2: { start: 0.63, end: 0.74 },
    p3: { start: 0.74, end: 1 },
  },
  // Frame sequence
  frames: {
    total: 120,
    basePath: '/assets/frames/about/',
    manifest: '/assets/frames/about/manifest.json',
  },
  // Quality levels based on device capability
  quality: {
    low: { frameCount: 60, textEffects: false, parallax: false },
    medium: { frameCount: 90, textEffects: true, parallax: false },
    high: { frameCount: 120, textEffects: true, parallax: true },
  },
};

// State
let frameSequence = null;
let textAnimations = null;
let isInitialized = false;
let qualityLevel = 'high';
let aboutSection = null;
let sectionTop = 0;
let sectionHeight = 0;
let totalScrollDistance = 0;
let ticking = false;
let lastProgress = -1;

/**
 * Detect device capability for adaptive quality
 */
function detectCapability() {
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const connection = navigator.connection?.effectiveType || '4g';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile || memory < 4 || cores < 4 || connection === 'slow-2g' || connection === '2g') {
    return 'low';
  } else if (memory < 8 || cores < 8 || connection === '3g') {
    return 'medium';
  }
  return 'high';
}

/**
 * Calculate total scroll distance
 */
function getTotalScrollDistance() {
  const { scrollDistances } = CONFIG;
  return (
    scrollDistances.p1Pin +
    scrollDistances.p1ToP2Flow +
    scrollDistances.p2Pin +
    scrollDistances.p2ToP3Flow +
    scrollDistances.p3Pin
  );
}

/**
 * Update section measurements
 */
function updateMeasurements() {
  if (!aboutSection) return;

  const rect = aboutSection.getBoundingClientRect();
  sectionTop = window.scrollY + rect.top;
  sectionHeight = rect.height;
  totalScrollDistance = getTotalScrollDistance();
}

/**
 * Calculate scroll progress (0-1) based on scroll position
 */
function calculateProgress() {
  const scrollY = window.scrollY;
  const startScroll = sectionTop;
  const endScroll = sectionTop + totalScrollDistance;

  if (scrollY <= startScroll) return 0;
  if (scrollY >= endScroll) return 1;

  return (scrollY - startScroll) / totalScrollDistance;
}

/**
 * Update active paragraph based on scroll progress
 */
function updateActiveParagraph(progress) {
  const { timing } = CONFIG;
  const p1 = document.querySelector('.p1-content');
  const p2 = document.querySelector('.p2-content');
  const p3 = document.querySelector('.p3-content');

  // Determine which paragraph should be visible
  let activeP = 1;
  if (progress >= timing.flow2.start) {
    activeP = 3;
  } else if (progress >= timing.flow1.start) {
    activeP = 2;
  }

  // Update visibility - instant switching
  if (p1) {
    p1.style.opacity = activeP === 1 ? '1' : '0';
    p1.style.visibility = activeP === 1 ? 'visible' : 'hidden';
    p1.classList.toggle('is-active', activeP === 1);
  }
  if (p2) {
    p2.style.opacity = activeP === 2 ? '1' : '0';
    p2.style.visibility = activeP === 2 ? 'visible' : 'hidden';
    p2.classList.toggle('is-active', activeP === 2);
  }
  if (p3) {
    p3.style.opacity = activeP === 3 ? '1' : '0';
    p3.style.visibility = activeP === 3 ? 'visible' : 'hidden';
    p3.classList.toggle('is-active', activeP === 3);
  }
}

/**
 * Handle pinned state based on scroll position
 */
function updatePinnedState(progress) {
  if (!aboutSection) return;

  const scrollY = window.scrollY;
  const isPinned = scrollY >= sectionTop && scrollY < sectionTop + totalScrollDistance;

  aboutSection.classList.toggle('is-pinned', isPinned);

  // Position the content when pinned
  const content = aboutSection.querySelector('.about-content');
  const canvas = aboutSection.querySelector('.about-canvas');

  if (isPinned && content) {
    // Keep content fixed in viewport while scrolling through pin zone
    const offset = scrollY - sectionTop;
    content.style.transform = `translateY(${offset}px)`;
    if (canvas) canvas.style.transform = `translateY(${offset}px)`;
  } else if (content) {
    // Reset when not pinned
    if (progress >= 1) {
      content.style.transform = `translateY(${totalScrollDistance}px)`;
      if (canvas) canvas.style.transform = `translateY(${totalScrollDistance}px)`;
    } else {
      content.style.transform = 'translateY(0)';
      if (canvas) canvas.style.transform = 'translateY(0)';
    }
  }
}

/**
 * Main scroll handler - called on every frame
 */
function onScroll() {
  if (!isInitialized) return;

  const progress = calculateProgress();

  // Skip if progress hasn't changed meaningfully
  if (Math.abs(progress - lastProgress) < 0.001) return;
  lastProgress = progress;

  // Update frame sequence - direct, no smoothing
  if (frameSequence) {
    frameSequence.setProgress(progress);
  }

  // Update paragraph visibility
  updateActiveParagraph(progress);

  // Update pinned state
  updatePinnedState(progress);
}

/**
 * RAF-throttled scroll handler
 */
function handleScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      onScroll();
      ticking = false;
    });
    ticking = true;
  }
}

/**
 * Handle window resize
 */
function handleResize() {
  updateMeasurements();
  onScroll(); // Re-apply current state
}

/**
 * Initialize scrollytelling system
 */
async function initScrollytelling() {
  if (isInitialized) {
    console.warn('[Scrollytelling] Already initialized');
    return;
  }

  console.log('[Scrollytelling] Initializing with native scroll...');

  // Detect quality level
  qualityLevel = detectCapability();
  console.log('[Scrollytelling] Quality level:', qualityLevel);

  // Find about section
  aboutSection = document.querySelector('.section--about');
  if (!aboutSection) {
    console.error('[Scrollytelling] About section not found');
    return;
  }

  // Initial measurements
  updateMeasurements();

  // Set section height to accommodate pinning
  aboutSection.style.minHeight = `${totalScrollDistance + sectionHeight}px`;

  // Show P1 immediately at start
  const p1 = document.querySelector('.p1-content');
  const p2 = document.querySelector('.p2-content');
  const p3 = document.querySelector('.p3-content');

  if (p1) { p1.style.opacity = '1'; p1.style.visibility = 'visible'; }
  if (p2) { p2.style.opacity = '0'; p2.style.visibility = 'hidden'; }
  if (p3) { p3.style.opacity = '0'; p3.style.visibility = 'hidden'; }

  // Add scroll listener - passive for performance
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });

  // Initialize frame sequence (Phase 2)
  try {
    const { initFrameSequence } = await import('./frame-sequence.js');
    frameSequence = await initFrameSequence('about-canvas', {
      totalFrames: CONFIG.quality[qualityLevel].frameCount,
    });
    console.log('[Scrollytelling] Frame sequence ready');
  } catch (error) {
    console.warn('[Scrollytelling] Frame sequence not available:', error.message);
  }

  // Initialize text animations (Phase 4)
  if (CONFIG.quality[qualityLevel].textEffects) {
    try {
      const { initTextAnimations } = await import('./text-animations.js');
      textAnimations = await initTextAnimations(null); // No timeline needed
      console.log('[Scrollytelling] Text animations ready');
    } catch (error) {
      console.warn('[Scrollytelling] Text animations not available:', error.message);
    }
  }

  isInitialized = true;

  // Apply initial state
  onScroll();

  console.log('[Scrollytelling] Initialization complete (native scroll)');
}

/**
 * Destroy scrollytelling and clean up
 */
function destroyScrollytelling() {
  if (!isInitialized) return;

  // Remove event listeners
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleResize);

  // Clean up frame sequence
  if (frameSequence) {
    frameSequence.destroy();
    frameSequence = null;
  }

  // Clean up text animations
  if (textAnimations) {
    textAnimations.revert();
    textAnimations = null;
  }

  // Reset section
  if (aboutSection) {
    aboutSection.classList.remove('is-pinned');
    aboutSection.style.minHeight = '';
    const content = aboutSection.querySelector('.about-content');
    const canvas = aboutSection.querySelector('.about-canvas');
    if (content) content.style.transform = '';
    if (canvas) canvas.style.transform = '';
  }

  aboutSection = null;
  isInitialized = false;
  lastProgress = -1;

  console.log('[Scrollytelling] Destroyed');
}

/**
 * Expose config for other modules
 */
function getConfig() {
  return CONFIG;
}

// Initialize on DOM ready (only if motion is allowed)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!prefersReducedMotion) {
      initScrollytelling();
    } else {
      console.log('[Scrollytelling] Reduced motion preferred, showing static state');
      // Show all paragraphs in final state
      document.querySelectorAll('.p1-content, .p2-content, .p3-content').forEach(p => {
        if (p) {
          p.style.opacity = '1';
          p.style.visibility = 'visible';
        }
      });
    }
  });
} else {
  if (!prefersReducedMotion) {
    initScrollytelling();
  }
}

/**
 * Setup motion toggle button
 */
function setupMotionToggle() {
  const toggle = document.querySelector('.motion-toggle');
  if (!toggle) return;

  let motionEnabled = !prefersReducedMotion;

  // Update initial state based on system preference
  if (prefersReducedMotion) {
    toggle.setAttribute('aria-pressed', 'false');
    toggle.querySelector('.motion-toggle__status').textContent = 'Off';
  }

  toggle.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    toggle.setAttribute('aria-pressed', motionEnabled ? 'true' : 'false');
    toggle.querySelector('.motion-toggle__status').textContent = motionEnabled ? 'On' : 'Off';

    if (motionEnabled) {
      document.documentElement.classList.remove('reduced-motion');
      if (!isInitialized) {
        initScrollytelling();
      }
    } else {
      document.documentElement.classList.add('reduced-motion');
      destroyScrollytelling();
      // Show all paragraphs in static state
      document.querySelectorAll('.p1-content, .p2-content, .p3-content').forEach(p => {
        if (p) {
          p.style.opacity = '1';
          p.style.visibility = 'visible';
        }
      });
    }
  });
}

// Setup motion toggle on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMotionToggle);
} else {
  setupMotionToggle();
}

// Export for other modules
export {
  initScrollytelling,
  destroyScrollytelling,
  getConfig,
  CONFIG,
};
