/**
 * Complexity Wave Animation
 *
 * Simplified version:
 * - SVG wave appears below "complex code"
 * - Wave morphs from noisy to clean sine
 * - Does NOT affect text layout
 *
 * Semantic: "complex code" - noise becoming order
 *
 * @see /Volumes/Samsung_T5/2026/animejs_master_llm/sandbox/examples/geometry/02-complexity-to-simplicity-svg/
 */

import { prefersReducedMotion, seededRandom, createSVGElement } from './utils.js';

/**
 * Create complexity wave animation for an element
 * @param {string|HTMLElement} selector - Element selector or element
 * @param {object} options - Configuration options
 * @returns {object} Animation controller with seek(), revert() methods
 */
export function createComplexityWaveAnimation(selector, options = {}) {
  const element = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (!element) {
    console.warn('[ComplexityWave] Element not found:', selector);
    return null;
  }

  const {
    width = 120,            // SVG width (smaller)
    height = 30,            // SVG height (smaller)
    baseAmplitude = 8,      // Amplitude of clean sine
    baseCycles = 1.5,       // Number of sine cycles
    harmonicCount = 6,      // Number of noise harmonics
    harmonicAmplitudeMax = 10, // Max harmonic amplitude
    strokeColor = 'currentColor',
    strokeWidth = 1.5,
    seed = 42               // Seed for reproducible harmonics
  } = options;

  // Handle reduced motion
  if (prefersReducedMotion()) {
    return {
      seek: () => {},
      revert: () => {}
    };
  }

  const centerY = height / 2;
  const samples = Math.floor(width / 3); // Sample points
  const random = seededRandom(seed);

  // Generate harmonics
  const harmonics = [];
  for (let n = 0; n < harmonicCount; n++) {
    const freqMult = 2 + n * 1.5 + random() * 0.5;
    const amp = harmonicAmplitudeMax * (0.4 + 0.6 * (1 - n / harmonicCount)) * (0.7 + random() * 0.3);
    const phase = random() * Math.PI * 2;
    const decayPower = 1.5 + n * 0.3;
    harmonics.push({ freqMult, amp, phase, decayPower });
  }

  // Get element width for positioning
  const rect = element.getBoundingClientRect();

  // Create container - positioned below the text
  const container = document.createElement('div');
  container.className = 'complexity-wave-container';
  container.style.cssText = `
    position: absolute;
    left: 0;
    top: 100%;
    margin-top: 4px;
    width: ${width}px;
    height: ${height}px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
  `;

  // Create SVG
  const svg = createSVGElement('svg', {
    width: width,
    height: height,
    viewBox: `0 0 ${width} ${height}`,
    style: 'overflow: visible;'
  });

  const path = createSVGElement('path', {
    fill: 'none',
    stroke: strokeColor,
    'stroke-width': strokeWidth,
    'stroke-linecap': 'round',
    'vector-effect': 'non-scaling-stroke'
  });

  svg.appendChild(path);
  container.appendChild(svg);

  // Store original styles
  const originalPosition = element.style.position;

  // Setup element
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }
  element.appendChild(container);

  /**
   * Compute Y value at given X with current filter level
   * filter=0: full noise, filter=1: pure sine
   */
  function computeY(x, filter) {
    const baseFreq = (baseCycles * 2 * Math.PI) / width;

    // Base sine (always present)
    let y = centerY + baseAmplitude * Math.sin(baseFreq * x);

    // Add harmonics (decay based on filter)
    for (const h of harmonics) {
      const dampFactor = Math.pow(1 - filter, h.decayPower);
      const harmonicY = h.amp * dampFactor * Math.sin(h.freqMult * baseFreq * x + h.phase);
      y += harmonicY;
    }

    return y;
  }

  /**
   * Build SVG path string for current filter state
   */
  function buildPath(filterLevel) {
    let d = '';

    for (let i = 0; i <= samples; i++) {
      const x = (i / samples) * width;
      const y = computeY(x, filterLevel);

      if (i === 0) {
        d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }

    return d;
  }

  /**
   * Seek to a specific progress (0-1)
   * 0 = noisy wave, 1 = clean sine
   * @param {number} progress - Global progress 0-1
   */
  function seek(progress) {
    // Fade in the wave at the start
    const opacity = progress < 0.1 ? progress * 10 : 1;
    container.style.opacity = opacity;

    // Build and set the path
    const d = buildPath(progress);
    path.setAttribute('d', d);
  }

  /**
   * Revert to original state
   */
  function revert() {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    element.style.position = originalPosition || '';
  }

  // Set initial state
  seek(0);

  return {
    seek,
    revert,
    element,
    svg,
    path
  };
}

export default createComplexityWaveAnimation;
