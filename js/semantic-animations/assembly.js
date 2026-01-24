/**
 * Assembly Animation (Bespoke)
 *
 * Letters scatter randomly, then assemble piece by piece like crafted furniture.
 * Each letter flies in from a random position and locks into place.
 *
 * Semantic: "bespoke" - precision, craftsmanship, deliberate assembly
 *
 * @see /Volumes/Samsung_T5/2026/animejs_master_llm/sandbox/examples/semantic/04-bespoke/
 */

import { splitTextIntoChars, prefersReducedMotion, seededRandom, lerp, applyEasing } from './utils.js';

/**
 * Create assembly animation for an element
 * @param {string|HTMLElement} selector - Element selector or element
 * @param {object} options - Configuration options
 * @returns {object} Animation controller with seek(), revert() methods
 */
export function createAssemblyAnimation(selector, options = {}) {
  const element = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (!element) {
    console.warn('[Assembly] Element not found:', selector);
    return null;
  }

  const {
    scatterDistance = 300,   // Max scatter distance in pixels
    rotationRange = 60,      // Max rotation in degrees
    scaleRange = [0.3, 0.7], // Scale range when scattered
    seed = 42,               // Seed for reproducible scatter
    easing = 'outBack'       // Easing for assembly
  } = options;

  // Handle reduced motion
  if (prefersReducedMotion()) {
    return {
      seek: () => {},
      revert: () => {}
    };
  }

  // Split text into characters
  const split = splitTextIntoChars(element);
  const chars = split.chars;
  const random = seededRandom(seed);

  // Generate scatter data for each character
  const scatterData = chars.map(() => ({
    x: (random() - 0.5) * scatterDistance * 2,
    y: (random() - 0.5) * scatterDistance,
    rotation: (random() - 0.5) * rotationRange * 2,
    scale: scaleRange[0] + random() * (scaleRange[1] - scaleRange[0])
  }));

  // Store stagger offsets (each char has a delay based on index)
  const staggerDelay = 0.08; // 8% of total animation per char
  const charOffsets = chars.map((_, i) => i * staggerDelay);
  const totalStagger = charOffsets[charOffsets.length - 1] || 0;
  const effectiveDuration = 1 + totalStagger; // Normalized duration

  /**
   * Seek to a specific progress (0-1)
   * @param {number} progress - Global progress 0-1
   */
  function seek(progress) {
    chars.forEach((char, i) => {
      const scatter = scatterData[i];
      const offset = charOffsets[i];

      // Calculate local progress for this character
      // Account for stagger - this char starts at offset and ends at offset + 1
      let localProgress = (progress * effectiveDuration - offset);
      localProgress = Math.max(0, Math.min(1, localProgress));

      // Apply easing
      const easedProgress = applyEasing(localProgress, easing);

      // Interpolate from scattered to assembled
      const x = lerp(scatter.x, 0, easedProgress);
      const y = lerp(scatter.y, 0, easedProgress);
      const rotation = lerp(scatter.rotation, 0, easedProgress);
      const scale = lerp(scatter.scale, 1, easedProgress);
      const opacity = lerp(0, 1, Math.min(1, localProgress * 2)); // Fade in faster

      // Apply transform
      char.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
      char.style.opacity = opacity;
    });
  }

  /**
   * Revert to original state
   */
  function revert() {
    // Reset all character styles
    chars.forEach(char => {
      char.style.transform = '';
      char.style.opacity = '';
    });
    // Restore original HTML
    split.revert();
  }

  // Set initial state (fully scattered)
  seek(0);

  return {
    seek,
    revert,
    element,
    chars
  };
}

export default createAssemblyAnimation;
