/**
 * Weight Presence Animation (Matters)
 *
 * Word gains visual weight and presence.
 * Grows to emphasize importance.
 *
 * Semantic: "matters" - importance, weight, significance
 *
 * @see /Volumes/Samsung_T5/2026/animejs_master_llm/sandbox/examples/semantic/11-matters/
 */

import { prefersReducedMotion, lerp, applyEasing } from './utils.js';

/**
 * Create weight-presence animation for an element
 * @param {string|HTMLElement} selector - Element selector or element
 * @param {object} options - Configuration options
 * @returns {object} Animation controller with seek(), revert() methods
 */
export function createWeightPresenceAnimation(selector, options = {}) {
  const element = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (!element) {
    console.warn('[WeightPresence] Element not found:', selector);
    return null;
  }

  const {
    maxScale = 1.4,           // Maximum scale
    adjacentSelector = null,  // Selector for adjacent word to fade (e.g., "really")
    adjacentMaxBlur = 4,      // Blur for adjacent word
    easing = 'outQuad'
  } = options;

  // Handle reduced motion
  if (prefersReducedMotion()) {
    return {
      seek: () => {},
      revert: () => {}
    };
  }

  // Find adjacent word if specified
  let adjacentWord = null;
  if (adjacentSelector) {
    adjacentWord = document.querySelector(adjacentSelector);
  }

  // Store original styles
  const originalTransform = element.style.transform;
  const originalOpacity = element.style.opacity;
  let adjacentOriginal = null;
  if (adjacentWord) {
    adjacentOriginal = {
      opacity: adjacentWord.style.opacity,
      filter: adjacentWord.style.filter
    };
  }

  /**
   * Seek to a specific progress (0-1)
   * 0 = normal size, 1 = full presence
   * @param {number} progress - Global progress 0-1
   */
  function seek(progress) {
    const easedProgress = applyEasing(progress, easing);

    // Main word: scale up
    const scale = lerp(1, maxScale, easedProgress);
    element.style.transform = `scale(${scale})`;
    element.style.opacity = '1';

    // Adjacent word: fade and blur out
    if (adjacentWord) {
      const adjacentOpacity = lerp(1, 0, easedProgress);
      const adjacentBlur = lerp(0, adjacentMaxBlur, easedProgress);
      adjacentWord.style.opacity = adjacentOpacity;
      adjacentWord.style.filter = `blur(${adjacentBlur}px)`;
    }
  }

  /**
   * Revert to original state
   */
  function revert() {
    element.style.transform = originalTransform;
    element.style.opacity = originalOpacity;

    if (adjacentWord && adjacentOriginal) {
      adjacentWord.style.opacity = adjacentOriginal.opacity;
      adjacentWord.style.filter = adjacentOriginal.filter;
    }
  }

  // Set initial state
  seek(0);

  return {
    seek,
    revert,
    element,
    adjacentWord
  };
}

export default createWeightPresenceAnimation;
