/**
 * Vibrate-Settle Animation (Friction)
 *
 * Letters grind and vibrate against each other, then smooth out.
 * Demonstrates the concept of friction through decreasing oscillation.
 *
 * Semantic: "friction" - resistance, grinding, settling
 *
 * @see /Volumes/Samsung_T5/2026/animejs_master_llm/sandbox/examples/semantic/05-friction/
 */

import { splitTextIntoChars, prefersReducedMotion, seededRandom, lerp, applyEasing } from './utils.js';

/**
 * Create vibrate-settle animation for an element
 * @param {string|HTMLElement} selector - Element selector or element
 * @param {object} options - Configuration options
 * @returns {object} Animation controller with seek(), revert() methods
 */
export function createVibrateSettleAnimation(selector, options = {}) {
  const element = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (!element) {
    console.warn('[VibrateSettle] Element not found:', selector);
    return null;
  }

  const {
    intensityMax = 3,     // Maximum jitter amplitude in pixels
    rotationMax = 2,      // Maximum rotation jitter in degrees
    seed = 42,            // Seed for reproducible jitter
    phases = 4            // Number of decay phases
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

  // Generate phase offsets for each character (from center outward)
  const center = Math.floor(chars.length / 2);
  const charOffsets = chars.map((_, i) => {
    const distFromCenter = Math.abs(i - center);
    return distFromCenter * 0.02; // Stagger from center
  });

  // Precompute random jitter patterns for each character
  const jitterPatterns = chars.map(() => ({
    xPhase: random() * Math.PI * 2,
    yPhase: random() * Math.PI * 2,
    rotPhase: random() * Math.PI * 2
  }));

  /**
   * Calculate jitter values at a given intensity
   */
  function getJitter(charIndex, intensity, time) {
    const pattern = jitterPatterns[charIndex];
    const freq = 20; // High frequency for visible jitter

    return {
      x: Math.sin(time * freq + pattern.xPhase) * intensity * intensityMax,
      y: Math.sin(time * freq * 1.3 + pattern.yPhase) * intensity * intensityMax * 0.5,
      rotation: Math.sin(time * freq * 0.8 + pattern.rotPhase) * intensity * rotationMax
    };
  }

  /**
   * Seek to a specific progress (0-1)
   * 0 = intense vibration, 1 = settled
   * @param {number} progress - Global progress 0-1
   */
  function seek(progress) {
    // Intensity decreases as progress increases
    // Use exponential decay for natural settling feel
    const baseIntensity = Math.pow(1 - progress, 2);

    // Use progress as "time" for jitter sampling
    const time = progress * 10;

    chars.forEach((char, i) => {
      const offset = charOffsets[i];

      // Calculate local progress (with stagger offset)
      let localProgress = progress - offset;
      localProgress = Math.max(0, Math.min(1, localProgress * 1.5));

      // Local intensity
      const intensity = Math.pow(1 - localProgress, 2);

      if (intensity < 0.01) {
        // Settled - no jitter
        char.style.transform = '';
        return;
      }

      // Get jitter values
      const jitter = getJitter(i, intensity, time + i * 0.1);

      // Apply transform
      char.style.transform = `translate(${jitter.x}px, ${jitter.y}px) rotate(${jitter.rotation}deg)`;
    });
  }

  /**
   * Revert to original state
   */
  function revert() {
    chars.forEach(char => {
      char.style.transform = '';
    });
    split.revert();
  }

  // Set initial state (intense vibration)
  seek(0);

  return {
    seek,
    revert,
    element,
    chars
  };
}

export default createVibrateSettleAnimation;
