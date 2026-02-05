/**
 * Blueprint Machine - Main Entry Point
 * Initializes all components and starts the animation
 */

/**
 * Initialize the Blueprint Machine
 */
function initBlueprintMachine() {
  // Check for reduced motion preference
  if (prefersReducedMotion()) {
    console.log('Blueprint Machine: Reduced motion preference detected, showing static state');
    showReducedMotionState();
    return;
  }

  console.log('Blueprint Machine: Initializing...');

  // Generate dynamic elements
  generateGridLines();

  // Create the master timeline
  createMasterTimeline();

  // Initialize ScrollTrigger
  initScrollTrigger();

  // Handle resize
  window.addEventListener('resize', debounce(handleResize, 250));

  console.log('Blueprint Machine: Ready');
}

/**
 * Show static state for reduced motion preference
 */
function showReducedMotionState() {
  const canvas = document.querySelector('.blueprint-canvas');
  if (canvas) {
    canvas.classList.add('reduced-motion');
  }

  // Show final sentence
  const sentenceText = document.getElementById('sentence-text');
  if (sentenceText) {
    sentenceText.textContent = '7 days to production.';
  }

  // Show sentences container
  const sentences = document.getElementById('sentences');
  if (sentences) {
    sentences.style.opacity = '1';
  }
}

/**
 * Handle window resize
 */
function handleResize() {
  refreshScrollTrigger();
}

/**
 * Debounce utility
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Lazy load initialization
 * Only initialize when section is near viewport
 */
function initWithLazyLoad() {
  const section = document.querySelector('.blueprint-section');

  if (!section) {
    console.error('Blueprint section not found');
    return;
  }

  // If IntersectionObserver is not supported, init immediately
  if (!('IntersectionObserver' in window)) {
    initBlueprintMachine();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        initBlueprintMachine();
        observer.disconnect();
      }
    });
  }, {
    rootMargin: '200px' // Start loading when 200px away
  });

  observer.observe(section);
}

// ============================================================================
// DEBUG UTILITIES (available in console)
// ============================================================================

window.blueprintDebug = {
  /**
   * Seek to a specific scroll percentage
   */
  seek: (progress) => {
    seekToProgress(progress);
    console.log(`Seeked to ${(progress * 100).toFixed(1)}%`);
  },

  /**
   * Seek to a specific frame
   */
  seekFrame: (frame) => {
    const progress = frame / CONFIG.totalFrames;
    seekToProgress(progress);
    console.log(`Seeked to frame ${frame} (${(progress * 100).toFixed(1)}%)`);
  },

  /**
   * Seek to a label
   */
  seekLabel: (label) => {
    seekToLabel(label);
    console.log(`Seeked to label: ${label}`);
  },

  /**
   * Get current progress
   */
  getProgress: () => {
    const progress = getScrollProgress();
    const frame = Math.round(progress * CONFIG.totalFrames);
    console.log(`Progress: ${(progress * 100).toFixed(1)}%, Frame: ${frame}`);
    return progress;
  },

  /**
   * List all labels
   */
  labels: () => {
    console.log('Available labels:');
    console.log('- start (0%)');
    console.log('- gridComplete (6.3%)');
    console.log('- allLayersVisible (23.2%)');
    console.log('- beforeCollapse (28.4%)');
    console.log('- collapseComplete (36.3%)');
    console.log('- logoComplete (46.8%)');
    console.log('- beforeSentences (47.9%)');
    console.log('- afterSentences (71.6%)');
    console.log('- ready (74.2%)');
    console.log('- end (100%)');
  },

  /**
   * Destroy and reinitialize
   */
  restart: () => {
    destroyScrollTrigger();
    initBlueprintMachine();
    console.log('Blueprint Machine restarted');
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWithLazyLoad);
} else {
  initWithLazyLoad();
}
