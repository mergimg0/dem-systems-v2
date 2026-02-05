/**
 * Blueprint Machine - Utility Functions
 */

// ============================================================================
// TYPEWRITER EFFECTS
// ============================================================================

/**
 * Scroll-aware typewriter - adds characters at scroll positions
 * Works with GSAP timeline instead of setInterval
 */
function scrollTypewriter(masterTl, element, text, startProgress, endProgress) {
  const chars = text.length;
  const progressPerChar = (endProgress - startProgress) / chars;

  for (let i = 0; i <= chars; i++) {
    const progress = startProgress + progressPerChar * i;
    masterTl.call(() => {
      element.textContent = text.slice(0, i);
    }, null, progress);
  }
}

/**
 * Scroll-aware delete effect - removes characters at scroll positions
 */
function scrollDelete(masterTl, element, startProgress, endProgress) {
  // Get the text that will be in the element at startProgress
  // We need to schedule the deletion based on whatever text exists
  masterTl.call(() => {
    const text = element.textContent;
    const chars = text.length;
    if (chars === 0) return;

    const progressPerChar = (endProgress - startProgress) / chars;

    for (let i = chars; i >= 0; i--) {
      const deleteProgress = startProgress + progressPerChar * (chars - i);
      // Use gsap.delayedCall relative to scroll position
      // Actually we need to add these to timeline at creation time
    }
  }, null, startProgress);
}

/**
 * Create a timeline segment for typewriter effect
 * Returns array of calls to add to master timeline
 */
function createTypewriterCalls(element, text, startProgress, endProgress) {
  const calls = [];
  const chars = text.length;
  const progressPerChar = (endProgress - startProgress) / chars;

  for (let i = 0; i <= chars; i++) {
    const progress = startProgress + progressPerChar * i;
    calls.push({
      progress,
      callback: () => {
        element.textContent = text.slice(0, i);
      }
    });
  }

  return calls;
}

/**
 * Create a timeline segment for delete effect
 */
function createDeleteCalls(element, text, startProgress, endProgress) {
  const calls = [];
  const chars = text.length;
  const progressPerChar = (endProgress - startProgress) / chars;

  for (let i = chars; i >= 0; i--) {
    const progress = startProgress + progressPerChar * (chars - i);
    calls.push({
      progress,
      callback: () => {
        element.textContent = text.slice(0, i);
      }
    });
  }

  return calls;
}

// ============================================================================
// CURSOR BLINK
// ============================================================================

/**
 * Create cursor blink animation
 * Returns a GSAP timeline that can be played/paused
 */
function createCursorBlink(cursor, rate = 0.5) {
  const tl = gsap.timeline({ repeat: -1, paused: true });
  tl.to(cursor, { opacity: 1, duration: 0.01 })
    .to(cursor, { opacity: 1, duration: rate })
    .to(cursor, { opacity: 0, duration: 0.01 })
    .to(cursor, { opacity: 0, duration: rate });
  return tl;
}

// ============================================================================
// GRID GENERATION
// ============================================================================

/**
 * Generate grid lines dynamically
 */
function generateGridLines() {
  const hLinesGroup = document.getElementById('h-lines');
  const vLinesGroup = document.getElementById('v-lines');

  if (!hLinesGroup || !vLinesGroup) return;

  const horizontalCount = Math.ceil(CONFIG.height / CONFIG.gridSpacing);
  const verticalCount = Math.ceil(CONFIG.width / CONFIG.gridSpacing);

  // Horizontal lines (draw from center outward)
  for (let i = 0; i < horizontalCount; i++) {
    const y = i * CONFIG.gridSpacing;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', CONFIG.width / 2);
    line.setAttribute('y1', y);
    line.setAttribute('x2', CONFIG.width / 2);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'url(#navyGradientH)');
    line.setAttribute('class', 'grid-line h-line');
    line.setAttribute('data-index', i);
    hLinesGroup.appendChild(line);
  }

  // Vertical lines (draw from center outward)
  for (let i = 0; i < verticalCount; i++) {
    const x = i * CONFIG.gridSpacing;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', CONFIG.height / 2);
    line.setAttribute('x2', x);
    line.setAttribute('y2', CONFIG.height / 2);
    line.setAttribute('stroke', 'url(#navyGradientV)');
    line.setAttribute('class', 'grid-line v-line');
    line.setAttribute('data-index', i);
    vLinesGroup.appendChild(line);
  }
}

// ============================================================================
// POSITION HELPERS
// ============================================================================

/**
 * Calculate pulse end positions based on target layer
 */
function getPulseEndPosition(pulseIndex) {
  // End positions for each pulse - aligned to timeline marker Y positions
  const endPositions = [
    { x: 500, y: 378 },   // 30 MIN pulse (35% of 1080)
    { x: 500, y: 540 },   // 24 HOURS pulse 1 (50% of 1080)
    { x: 500, y: 540 },   // 24 HOURS pulse 2
    { x: 500, y: 702 },   // 7 DAYS pulse (65% of 1080)
    { x: 500, y: 702 }    // Collapse trigger pulse
  ];

  return endPositions[pulseIndex] || endPositions[0];
}

/**
 * Get transform origin for snap effect
 */
function getSnapOrigin() {
  return `${CONFIG.width * 0.48}px ${CONFIG.height * 0.5}px`;
}

// ============================================================================
// REDUCED MOTION CHECK
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================================================
// EXPORT
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    scrollTypewriter,
    createTypewriterCalls,
    createDeleteCalls,
    createCursorBlink,
    generateGridLines,
    getPulseEndPosition,
    getSnapOrigin,
    prefersReducedMotion
  };
}
