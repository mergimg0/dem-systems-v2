/**
 * Hero Text Emergence Animation - Main Entry Point
 *
 * Orchestrates the "DEM Systems" text emergence animation where
 * abstract shapes morph into letterforms on page load.
 *
 * Features:
 * - 3-5 second cinematic transformation on page load
 * - Sequential L→R letter formation with per-letter motion personalities
 * - Hover dissolve/reform effects post-formation
 * - Reduced motion support
 * - Scroll interrupt (skip to end)
 */

import { initEmergenceTimeline, isAnimationComplete, getShapes, CONFIG } from './emergence-timeline.js';
import { initHoverController } from './hover-controller.js';
import { extractLetterPaths } from './letter-paths.js';

// Module state
let emergenceController = null;
let hoverCleanup = null;

/**
 * Initialize the hero emergence animation
 * @returns {Promise<Object>} Controller object with replay, destroy methods
 */
export async function initHeroEmergence() {
  // Get the emergence container
  const container = document.getElementById('hero-emergence');

  if (!container) {
    console.warn('Hero emergence container not found (#hero-emergence)');
    return null;
  }

  try {
    // Initialize the emergence timeline
    emergenceController = await initEmergenceTimeline(container);

    if (!emergenceController) {
      console.warn('Emergence timeline initialization failed');
      return null;
    }

    // Initialize hover controller (listens for emergence-complete event)
    const pathsData = emergenceController.pathsData;
    hoverCleanup = initHoverController(container, pathsData, CONFIG.text);

    // Return public API
    return {
      /**
       * Check if the emergence animation has completed
       */
      isComplete: () => isAnimationComplete(),

      /**
       * Skip to the end of the animation
       */
      skipToEnd: () => emergenceController?.skipToEnd(),

      /**
       * Replay the emergence animation
       */
      replay: () => emergenceController?.replay(),

      /**
       * Destroy and clean up all resources
       */
      destroy: () => {
        if (hoverCleanup) hoverCleanup();
        if (emergenceController) emergenceController.destroy();
        emergenceController = null;
        hoverCleanup = null;
      },

      /**
       * Get the underlying timeline (for advanced control)
       */
      getTimeline: () => emergenceController?.timeline,

      /**
       * Get generated shapes data
       */
      getShapes: () => getShapes(),
    };
  } catch (error) {
    console.error('Hero emergence initialization error:', error);

    // Fallback: show static text
    const fallback = document.querySelector('.hero-title--fallback');
    if (fallback) {
      fallback.style.opacity = '1';
      fallback.style.position = 'relative';
    }

    return null;
  }
}

/**
 * Destroy the hero emergence animation (for cleanup/SPA navigation)
 */
export function destroyHeroEmergence() {
  if (hoverCleanup) hoverCleanup();
  if (emergenceController) emergenceController.destroy();
  emergenceController = null;
  hoverCleanup = null;
}

// Export for debugging in console
if (typeof window !== 'undefined') {
  window.heroEmergence = {
    init: initHeroEmergence,
    destroy: destroyHeroEmergence,
    isComplete: isAnimationComplete,
    replay: () => emergenceController?.replay(),
  };
}

export default initHeroEmergence;
