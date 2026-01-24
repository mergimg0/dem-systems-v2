/**
 * Utility functions for semantic animations
 *
 * Provides text splitting, reduced motion detection, and helper functions.
 */

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Split text into character spans
 * @param {HTMLElement} element - Element to split
 * @returns {object} { chars: HTMLElement[], originalHTML: string, revert: Function }
 */
export function splitTextIntoChars(element) {
  const originalHTML = element.innerHTML;
  const text = element.textContent;
  const chars = [];

  // Clear element
  element.innerHTML = '';

  // Create character spans
  for (const char of text) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.display = 'inline-block';
    element.appendChild(span);
    chars.push(span);
  }

  return {
    chars,
    originalHTML,
    revert: () => {
      element.innerHTML = originalHTML;
    }
  };
}

/**
 * Split text into word spans
 * @param {HTMLElement} element - Element to split
 * @returns {object} { words: HTMLElement[], originalHTML: string, revert: Function }
 */
export function splitTextIntoWords(element) {
  const originalHTML = element.innerHTML;
  const text = element.textContent;
  const wordStrings = text.split(/\s+/);
  const words = [];

  // Clear element
  element.innerHTML = '';

  // Create word spans with spaces between
  wordStrings.forEach((wordText, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = wordText;
    span.style.display = 'inline-block';
    element.appendChild(span);
    words.push(span);

    // Add space after word (except last)
    if (i < wordStrings.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
  });

  return {
    words,
    originalHTML,
    revert: () => {
      element.innerHTML = originalHTML;
    }
  };
}

/**
 * Create an SVG element with proper namespace
 * @param {string} tag - SVG element tag name
 * @param {object} attrs - Attributes to set
 * @returns {SVGElement}
 */
export function createSVGElement(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

/**
 * Seeded random number generator for reproducible animations
 * @param {number} seed - Seed value
 * @returns {function} Random function returning 0-1
 */
export function seededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Linear interpolation
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Progress 0-1
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp a value to a range
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Easing functions
 */
export const easings = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => t * (2 - t),
  inOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  outCubic: t => (--t) * t * t + 1,
  outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  outBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

/**
 * Apply easing to a progress value
 * @param {number} progress - 0-1 progress
 * @param {string|function} easing - Easing name or function
 * @returns {number} Eased progress
 */
export function applyEasing(progress, easing = 'linear') {
  if (typeof easing === 'function') {
    return easing(progress);
  }
  return easings[easing] ? easings[easing](progress) : progress;
}

export default {
  prefersReducedMotion,
  splitTextIntoChars,
  splitTextIntoWords,
  createSVGElement,
  seededRandom,
  lerp,
  clamp,
  easings,
  applyEasing
};
