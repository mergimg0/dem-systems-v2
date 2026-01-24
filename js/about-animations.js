/**
 * About Section Scroll-Scrubbed Animations
 *
 * Integrates all semantic animations with the scroll controller.
 * Each word animates according to its meaning as you scroll.
 *
 * @see thoughts/shared/specs/2026-01-24-about-section-scroll-animations.md
 */

import {
  initScrollController,
  destroyScrollController,
  registerAnimation,
  getAnimationRange,
  isReducedMotion
} from './scroll-controller.js';

import { createAssemblyAnimation } from './semantic-animations/assembly.js';
import { createVibrateSettleAnimation } from './semantic-animations/vibrate-settle.js';
import { createEliminateAnimation } from './semantic-animations/eliminate.js';
import { createPathFollowAnimation } from './semantic-animations/path-follow.js';
import { createBlurToClearAnimation } from './semantic-animations/blur-to-clear.js';
import { createComplexityWaveAnimation } from './semantic-animations/complexity-wave.js';
import { createContextBlurAnimation } from './semantic-animations/context-blur.js';
import { createWeightPresenceAnimation } from './semantic-animations/weight-presence.js';

/**
 * Animation configuration mapping semantic words to their animations
 */
const ANIMATION_CONFIG = {
  // Paragraph 1 (0-25% scroll)
  p1: [
    {
      selector: '[data-effect="flip3D"]',  // "bespoke"
      factory: createAssemblyAnimation,
      options: { scatterDistance: 200, seed: 42 }
    },
    {
      selector: '[data-effect="kineticScatter"]',  // "friction"
      factory: createVibrateSettleAnimation,
      options: { intensityMax: 4, seed: 123 }
    }
  ],

  // Paragraph 2 (25-70% scroll)
  p2: [
    {
      selector: '[data-effect="strikethrough"]',  // "No complicated jargon..."
      factory: createEliminateAnimation,
      options: { strokeWidth: 2 }
    },
    {
      selector: '[data-effect="svgDraw"]',  // "path"
      factory: createPathFollowAnimation,
      options: { pathHeight: 20 }
    },
    {
      selector: '[data-effect="glowPulse"]',  // "clarity"
      factory: createBlurToClearAnimation,
      options: { maxBlur: 6 }
    }
  ],

  // Paragraph 3 (70-100% scroll)
  p3: [
    {
      selector: '[data-effect="waveMotion"]',  // "complex code"
      factory: createComplexityWaveAnimation,
      options: { width: 150, height: 40 }
    },
    {
      selector: '[data-effect="converge"]:first-of-type',  // "focus"
      factory: createContextBlurAnimation,
      options: { focusScale: 1.15 }
    },
    {
      selector: '[data-effect="converge"]:last-of-type',  // "matters"
      factory: createWeightPresenceAnimation,
      options: { maxScale: 1.3 }
    }
  ]
};

// Track initialized animations for cleanup
let initializedAnimations = [];

/**
 * Initialize all about section animations
 */
export function initAboutAnimations() {
  // Initialize scroll controller first
  initScrollController();

  // Skip animation setup if reduced motion
  if (isReducedMotion()) {
    console.log('[AboutAnimations] Reduced motion - showing final state');
    return;
  }

  // Initialize animations for each paragraph
  Object.entries(ANIMATION_CONFIG).forEach(([paragraphKey, animations]) => {
    const paragraphNum = parseInt(paragraphKey.replace('p', ''));
    const totalInParagraph = animations.length;

    animations.forEach((config, indexInParagraph) => {
      const element = document.querySelector(config.selector);

      if (!element) {
        console.warn(`[AboutAnimations] Element not found: ${config.selector}`);
        return;
      }

      // Create the animation
      const animation = config.factory(element, config.options);

      if (!animation) {
        console.warn(`[AboutAnimations] Failed to create animation for: ${config.selector}`);
        return;
      }

      // Calculate the scroll range for this animation
      const range = getAnimationRange(paragraphNum, indexInParagraph, totalInParagraph);

      // Register with scroll controller
      const id = `${paragraphKey}-${indexInParagraph}`;
      registerAnimation(id, animation, range);

      // Track for cleanup
      initializedAnimations.push({ id, animation });

      console.log(`[AboutAnimations] Registered: ${config.selector} (${range.start.toFixed(2)}-${range.end.toFixed(2)})`);
    });
  });

  console.log(`[AboutAnimations] Initialized ${initializedAnimations.length} animations`);
}

/**
 * Destroy all about section animations
 */
export function destroyAboutAnimations() {
  // Revert all animations
  initializedAnimations.forEach(({ animation }) => {
    if (animation && typeof animation.revert === 'function') {
      animation.revert();
    }
  });

  initializedAnimations = [];

  // Destroy scroll controller
  destroyScrollController();

  console.log('[AboutAnimations] Destroyed');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAboutAnimations);
} else {
  initAboutAnimations();
}

// Cleanup on page unload
window.addEventListener('beforeunload', destroyAboutAnimations);

export default {
  initAboutAnimations,
  destroyAboutAnimations
};
