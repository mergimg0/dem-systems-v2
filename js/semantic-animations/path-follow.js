/**
 * Path Follow Animation
 *
 * Simplified version:
 * - SVG path draws below the word
 * - Word does NOT move (prevents layout shift)
 *
 * Semantic: "path" - journey, direction, movement
 *
 * @see /Volumes/Samsung_T5/2026/animejs_master_llm/sandbox/examples/semantic/06-path/
 */

import { prefersReducedMotion, applyEasing, createSVGElement } from './utils.js';

/**
 * Create path-follow animation for an element
 * @param {string|HTMLElement} selector - Element selector or element
 * @param {object} options - Configuration options
 * @returns {object} Animation controller with seek(), revert() methods
 */
export function createPathFollowAnimation(selector, options = {}) {
  const element = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (!element) {
    console.warn('[PathFollow] Element not found:', selector);
    return null;
  }

  const {
    strokeColor = 'currentColor',
    strokeWidth = 2,
    pathHeight = 15
  } = options;

  // Handle reduced motion
  if (prefersReducedMotion()) {
    return {
      seek: () => {},
      revert: () => {}
    };
  }

  // Get element dimensions
  const rect = element.getBoundingClientRect();
  const width = rect.width + 20; // A bit wider than the word
  const height = pathHeight * 2 + 10;

  // Store original styles
  const originalPosition = element.style.position;

  // Setup element for animation
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }

  // Create container for SVG (positioned below text)
  const container = document.createElement('div');
  container.className = 'path-animation-container';
  container.style.cssText = `
    position: absolute;
    left: -10px;
    top: 100%;
    width: ${width}px;
    height: ${height}px;
    pointer-events: none;
  `;

  // Create SVG
  const svg = createSVGElement('svg', {
    width: width,
    height: height,
    viewBox: `0 0 ${width} ${height}`,
    style: 'overflow: visible;'
  });

  // Create bezier path - gentle curve
  const startX = 0;
  const startY = height / 2;
  const cp1x = width * 0.3;
  const cp1y = startY - pathHeight;
  const cp2x = width * 0.7;
  const cp2y = startY + pathHeight;
  const endX = width;
  const endY = startY;

  const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

  const path = createSVGElement('path', {
    d: pathD,
    fill: 'none',
    stroke: strokeColor,
    'stroke-width': strokeWidth,
    'stroke-linecap': 'round',
    'vector-effect': 'non-scaling-stroke'
  });

  svg.appendChild(path);
  container.appendChild(svg);
  element.appendChild(container);

  // Get actual path length
  const pathLength = path.getTotalLength();
  path.setAttribute('stroke-dasharray', pathLength);
  path.setAttribute('stroke-dashoffset', pathLength); // Start hidden

  /**
   * Seek to a specific progress (0-1)
   * @param {number} progress - Global progress 0-1
   */
  function seek(progress) {
    // Draw path: 0 = hidden, 1 = fully drawn
    const easedProgress = applyEasing(progress, 'inOutQuad');
    const dashOffset = pathLength * (1 - easedProgress);
    path.setAttribute('stroke-dashoffset', dashOffset);
  }

  /**
   * Revert to original state
   */
  function revert() {
    // Remove container
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Reset element styles
    element.style.position = originalPosition;
  }

  // Set initial state (hidden path)
  seek(0);

  return {
    seek,
    revert,
    element,
    svg,
    path
  };
}

export default createPathFollowAnimation;
