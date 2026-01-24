/**
 * Context Blur Animation (Focus)
 *
 * Context words blur while the focus word sharpens.
 * Creates visual emphasis through selective blur.
 *
 * Semantic: "focus" - attention, clarity, emphasis
 *
 * @see /Volumes/Samsung_T5/2026/animejs_master_llm/sandbox/examples/semantic/10-focus/
 */

import { prefersReducedMotion, lerp, applyEasing } from './utils.js';

/**
 * Create context-blur animation for an element
 * @param {string|HTMLElement} selector - Element selector or element (the focus word)
 * @param {object} options - Configuration options
 * @returns {object} Animation controller with seek(), revert() methods
 */
export function createContextBlurAnimation(selector, options = {}) {
  const element = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (!element) {
    console.warn('[ContextBlur] Element not found:', selector);
    return null;
  }

  const {
    contextSelector = null,     // Selector for context words (if null, uses siblings)
    maxBlur = 4,                // Maximum blur for context words
    minContextOpacity = 0.3,    // Minimum opacity for context
    focusScale = 1.1,           // Scale for focus word
    easing = 'inOutQuad'
  } = options;

  // Handle reduced motion
  if (prefersReducedMotion()) {
    return {
      seek: () => {},
      revert: () => {}
    };
  }

  // Find context words
  let contextWords = [];
  if (contextSelector) {
    contextWords = Array.from(document.querySelectorAll(contextSelector));
  } else {
    // Use sibling text nodes or adjacent spans
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      contextWords = siblings.filter(el => el !== element && el.classList.contains('semantic-word'));
    }
  }

  // Store original styles
  const originalTransform = element.style.transform;
  const originalFilter = element.style.filter;
  const contextOriginals = contextWords.map(el => ({
    filter: el.style.filter,
    opacity: el.style.opacity
  }));

  /**
   * Seek to a specific progress (0-1)
   * 0 = all clear, 1 = context blurred, focus sharp
   * @param {number} progress - Global progress 0-1
   */
  function seek(progress) {
    const easedProgress = applyEasing(progress, easing);

    // Focus word: scale up
    const scale = lerp(1, focusScale, easedProgress);
    element.style.transform = `scale(${scale})`;
    element.style.filter = 'blur(0px)'; // Always sharp

    // Context words: blur and fade
    const blur = lerp(0, maxBlur, easedProgress);
    const opacity = lerp(1, minContextOpacity, easedProgress);

    contextWords.forEach(word => {
      word.style.filter = `blur(${blur}px)`;
      word.style.opacity = opacity;
    });
  }

  /**
   * Revert to original state
   */
  function revert() {
    element.style.transform = originalTransform;
    element.style.filter = originalFilter;

    contextWords.forEach((word, i) => {
      word.style.filter = contextOriginals[i].filter;
      word.style.opacity = contextOriginals[i].opacity;
    });
  }

  // Set initial state (all clear)
  seek(0);

  return {
    seek,
    revert,
    element,
    contextWords
  };
}

export default createContextBlurAnimation;
