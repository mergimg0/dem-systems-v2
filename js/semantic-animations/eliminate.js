/**
 * Eliminate Animation (Strikethrough)
 *
 * Simplified version:
 * 1. At progress 0: text looks normal
 * 2. As progress increases: strikethrough line draws through text
 * 3. At progress 1: line is fully drawn, text slightly faded
 *
 * Semantic: "eliminate" - cross out, remove
 *
 * @see /Volumes/Samsung_T5/2026/animejs_master_llm/sandbox/examples/semantic/02-eliminate/
 */

import { prefersReducedMotion, lerp, applyEasing, createSVGElement } from './utils.js';

/**
 * Create eliminate animation for an element
 * @param {string|HTMLElement} selector - Element selector or element
 * @param {object} options - Configuration options
 * @returns {object} Animation controller with seek(), revert() methods
 */
export function createEliminateAnimation(selector, options = {}) {
  const element = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (!element) {
    console.warn('[Eliminate] Element not found:', selector);
    return null;
  }

  const {
    strokeColor = 'currentColor',
    strokeWidth = 2
  } = options;

  // Handle reduced motion
  if (prefersReducedMotion()) {
    return {
      seek: () => {},
      revert: () => {}
    };
  }

  // Store original styles
  const originalPosition = element.style.position;
  const originalOpacity = element.style.opacity;

  // Setup element for animation
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }

  // Create SVG for strikethrough line
  const svg = createSVGElement('svg', {
    width: '100%',
    height: '100%',
    viewBox: '0 0 100 100',
    preserveAspectRatio: 'none',
    style: 'position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;'
  });

  const line = createSVGElement('line', {
    x1: '0',
    y1: '50',
    x2: '100',
    y2: '50',
    stroke: strokeColor,
    'stroke-width': strokeWidth,
    'stroke-linecap': 'round',
    'vector-effect': 'non-scaling-stroke'
  });

  svg.appendChild(line);
  element.appendChild(svg);

  // Get the line length for dash animation
  const lineLength = 100; // viewBox width
  line.setAttribute('stroke-dasharray', lineLength);
  line.setAttribute('stroke-dashoffset', lineLength); // Start hidden

  /**
   * Seek to a specific progress (0-1)
   * @param {number} progress - Global progress 0-1
   */
  function seek(progress) {
    // Draw strikethrough: 0 = hidden, 1 = fully drawn
    const easedProgress = applyEasing(progress, 'inOutQuad');
    const dashOffset = lineLength * (1 - easedProgress);
    line.setAttribute('stroke-dashoffset', dashOffset);

    // Slight fade of text as strikethrough completes
    const textOpacity = lerp(1, 0.6, easedProgress);
    element.style.opacity = textOpacity;
  }

  /**
   * Revert to original state
   */
  function revert() {
    // Remove SVG
    if (svg.parentNode) {
      svg.parentNode.removeChild(svg);
    }

    // Reset element styles
    element.style.position = originalPosition;
    element.style.opacity = originalOpacity;
  }

  // Set initial state (hidden strikethrough)
  seek(0);

  return {
    seek,
    revert,
    element,
    svg,
    line
  };
}

export default createEliminateAnimation;
