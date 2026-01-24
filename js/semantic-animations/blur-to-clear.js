/**
 * Blur-to-Clear Animation (Clarity)
 *
 * Word transitions from blurred to crystal clear.
 * progress 0 = blurred, progress 1 = clear
 *
 * Semantic: "clarity" - clear vision, understanding, sharpness
 *
 * @see /Volumes/Samsung_T5/2026/animejs_master_llm/sandbox/examples/semantic/03-clarity/
 */

import { prefersReducedMotion, lerp, applyEasing } from './utils.js';

/**
 * Create blur-to-clear animation for an element
 * @param {string|HTMLElement} selector - Element selector or element
 * @param {object} options - Configuration options
 * @returns {object} Animation controller with seek(), revert() methods
 */
export function createBlurToClearAnimation(selector, options = {}) {
  const element = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (!element) {
    console.warn('[BlurToClear] Element not found:', selector);
    return null;
  }

  const {
    maxBlur = 6,          // Maximum blur in pixels (reduced for readability)
    minOpacity = 0.6,     // Minimum opacity when blurred (higher for visibility)
    easing = 'outCubic'   // Easing for clarity progression
  } = options;

  // Handle reduced motion
  if (prefersReducedMotion()) {
    return {
      seek: () => {},
      revert: () => {}
    };
  }

  // Store original styles
  const originalFilter = element.style.filter;
  const originalOpacity = element.style.opacity;

  /**
   * Seek to a specific progress (0-1)
   * 0 = fully blurred, 1 = crystal clear
   * @param {number} progress - Global progress 0-1
   */
  function seek(progress) {
    // Apply easing for artistic progression
    const easedProgress = applyEasing(progress, easing);

    // Calculate blur (decreases as progress increases)
    const blur = maxBlur * (1 - easedProgress);

    // Calculate opacity (increases as progress increases)
    const opacity = minOpacity + (1 - minOpacity) * easedProgress;

    // Apply styles (filter and opacity are GPU-accelerated)
    element.style.filter = `blur(${blur.toFixed(2)}px)`;
    element.style.opacity = opacity.toFixed(3);
  }

  /**
   * Revert to original state
   */
  function revert() {
    element.style.filter = originalFilter || '';
    element.style.opacity = originalOpacity || '';
  }

  // Set initial state (blurred)
  seek(0);

  return {
    seek,
    revert,
    element
  };
}

export default createBlurToClearAnimation;
