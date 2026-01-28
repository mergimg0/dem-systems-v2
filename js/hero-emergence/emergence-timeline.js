/**
 * Emergence Timeline for Hero Text Animation
 * Orchestrates the morphing of shapes into "DEM Systems" letterforms
 * Uses AnimeJS v4 patterns - Updated for high-density pixel sampling
 */

import { animate, createTimeline, stagger, utils } from 'animejs';
import { generateAllShapes, groupShapesByLetter, getLetterEasing, LETTER_EASINGS } from './shape-generator.js';
import { extractLetterPaths, getLetterBounds } from './letter-paths.js';

// Configuration
const CONFIG = {
  text: 'DEM Systems',
  totalDuration: 5000, // 5 seconds total
  ambientDuration: 400, // Shorter ambient phase
  scrollInterruptThreshold: 50, // pixels
};

// Letter timing configuration - adjusted for more shapes
// Longer durations to allow all shapes to settle
const LETTER_TIMING = [
  { char: 'D', startOffset: 0, duration: 900 },
  { char: 'E', startOffset: 300, duration: 700 },
  { char: 'M', startOffset: 600, duration: 800 },
  // Space at index 3
  { char: 'S', startOffset: 1000, duration: 750 },
  { char: 'y', startOffset: 1350, duration: 600 },
  { char: 's', startOffset: 1650, duration: 550 },
  { char: 't', startOffset: 1900, duration: 500 },
  { char: 'e', startOffset: 2150, duration: 550 },
  { char: 'm', startOffset: 2400, duration: 600 },
  { char: 's', startOffset: 2650, duration: 550 },
];

// State
let timeline = null;
let animationComplete = false;
let shapes = [];
let container = null;
let canvas = null;
let reducedMotionQuery = null;

/**
 * Check if reduced motion is preferred
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Handle reduced motion preference changes
 */
function setupReducedMotionListener() {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handler = (e) => {
    if (e.matches && timeline && !animationComplete) {
      timeline.seek(timeline.duration);
      timeline.pause();
      animationComplete = true;
      container?.classList.add('emergence-complete');
      showFallbackText();
    }
  };

  reducedMotionQuery.addEventListener('change', handler);
  return () => reducedMotionQuery.removeEventListener('change', handler);
}

/**
 * Show the fallback static text
 */
function showFallbackText() {
  const fallback = document.querySelector('.hero-title--fallback');
  if (fallback) {
    fallback.style.position = 'relative';
    fallback.style.opacity = '1';
    fallback.style.pointerEvents = 'auto';
  }
  if (canvas) {
    canvas.style.display = 'none';
  }
}

/**
 * Create DOM element for a shape
 */
function createShapeElement(shape) {
  const el = document.createElement('div');
  el.className = `emergence-shape emergence-shape--${shape.type}`;
  el.dataset.target = shape.targetLetter;
  el.dataset.letterIndex = shape.letterIndex;
  el.dataset.shapeId = shape.id;

  // Store target positions as data attributes
  el.dataset.targetX = shape.targetPosition.x;
  el.dataset.targetY = shape.targetPosition.y;
  el.dataset.targetRotation = shape.targetPosition.rotation;
  el.dataset.targetScale = shape.targetPosition.scale;

  // Set initial position and style
  const size = shape.size;
  el.style.cssText = `
    left: ${shape.initialPosition.x}px;
    top: ${shape.initialPosition.y}px;
    width: ${size}px;
    height: ${shape.type === 'line' ? '2px' : `${size}px`};
    background: ${shape.color};
    transform: rotate(${shape.initialPosition.rotation}deg) scale(${shape.initialPosition.scale});
    opacity: 0;
  `;

  return el;
}

/**
 * Render all shapes to the canvas
 */
function renderShapes(allShapes, canvasEl) {
  canvasEl.innerHTML = '';

  allShapes.forEach(shape => {
    const el = createShapeElement(shape);
    canvasEl.appendChild(el);
  });

  return canvasEl.querySelectorAll('.emergence-shape');
}

/**
 * Calculate stagger delay based on shape count
 * More shapes = shorter per-shape delay to maintain timing
 */
function calculateStaggerDelay(shapeCount, targetDuration) {
  // Aim for total stagger spread to be ~60% of duration
  const staggerSpread = targetDuration * 0.6;
  return Math.max(2, Math.min(15, staggerSpread / shapeCount));
}

/**
 * Build the animation timeline for high-density shapes
 */
function buildTimeline(shapeElements) {
  const totalShapes = shapeElements.length;

  const tl = createTimeline({
    defaults: { ease: 'outQuad' },
    onComplete: () => {
      animationComplete = true;
      container?.classList.add('emergence-complete');
      window.dispatchEvent(new CustomEvent('emergence-complete'));
    }
  });

  // Phase 1: Fade in shapes with ambient scatter (0-400ms)
  // Very fast stagger since we have 500+ shapes
  const fadeInStagger = Math.max(1, 200 / totalShapes);

  tl.add(shapeElements, {
    opacity: [0, 0.9],
    translateX: () => utils.random(-8, 8),
    translateY: () => utils.random(-8, 8),
    duration: CONFIG.ambientDuration,
    delay: stagger(fadeInStagger, { from: 'random' }),
    ease: 'outQuad'
  });

  // Phase 2-3: Sequential letter formation
  LETTER_TIMING.forEach((letterConfig, timingIndex) => {
    const letterIndex = getLetterIndex(letterConfig.char, timingIndex);

    const letterShapes = Array.from(shapeElements).filter(
      el => el.dataset.target === letterConfig.char &&
            parseInt(el.dataset.letterIndex) === letterIndex
    );

    if (letterShapes.length === 0) return;

    const easing = getLetterEasing(letterConfig.char);
    const startTime = CONFIG.ambientDuration + letterConfig.startOffset;
    const staggerDelay = calculateStaggerDelay(letterShapes.length, letterConfig.duration);

    // Handle glitchy letters (S and final s)
    if (letterConfig.char === 'S' || (letterConfig.char === 's' && timingIndex > 7)) {
      // Glitchy: steps phase
      tl.add(letterShapes, {
        translateX: (el) => parseFloat(el.dataset.targetX) - parseFloat(el.style.left),
        translateY: (el) => parseFloat(el.dataset.targetY) - parseFloat(el.style.top),
        rotate: (el) => parseFloat(el.dataset.targetRotation),
        scale: (el) => parseFloat(el.dataset.targetScale),
        duration: letterConfig.duration * 0.5,
        delay: stagger(staggerDelay, { from: 'center' }),
        ease: 'steps(6)'
      }, startTime);

      // Smooth settle
      tl.add(letterShapes, {
        translateX: (el) => parseFloat(el.dataset.targetX) - parseFloat(el.style.left),
        translateY: (el) => parseFloat(el.dataset.targetY) - parseFloat(el.style.top),
        scale: 1,
        rotate: 0,
        duration: letterConfig.duration * 0.5,
        ease: 'outQuad'
      }, startTime + letterConfig.duration * 0.5);
    } else {
      // Normal easing - all shapes converge to their pixel positions
      tl.add(letterShapes, {
        translateX: (el) => parseFloat(el.dataset.targetX) - parseFloat(el.style.left),
        translateY: (el) => parseFloat(el.dataset.targetY) - parseFloat(el.style.top),
        rotate: (el) => parseFloat(el.dataset.targetRotation),
        scale: (el) => parseFloat(el.dataset.targetScale),
        duration: letterConfig.duration,
        delay: stagger(staggerDelay, { from: 'center' }),
        ease: easing
      }, startTime);
    }
  });

  // Phase 4: Final tightening and settle (3.2s - 4s)
  const settleStart = CONFIG.ambientDuration + 3100;
  tl.add(shapeElements, {
    scale: 1,
    rotate: 0,
    opacity: 1,
    duration: 400,
    ease: 'outQuad'
  }, settleStart);

  // Phase 5: Subtle breathing motion when complete (optional micro-motion)
  // This makes the settled text feel alive
  tl.add(shapeElements, {
    scale: [1, 1.02],
    duration: 600,
    ease: 'inOutSine',
    direction: 'alternate',
  }, settleStart + 500);

  return tl;
}

/**
 * Get the actual letter index accounting for spaces
 */
function getLetterIndex(char, timingIndex) {
  const text = CONFIG.text;
  let nonSpaceCount = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') continue;

    if (nonSpaceCount === timingIndex) {
      return i;
    }
    nonSpaceCount++;
  }

  return 0;
}

/**
 * Setup scroll interrupt handler
 */
function setupScrollInterrupt() {
  const handler = () => {
    if (!animationComplete && timeline && window.scrollY > CONFIG.scrollInterruptThreshold) {
      timeline.seek(timeline.duration);
      animationComplete = true;
      container?.classList.add('emergence-complete');
      window.dispatchEvent(new CustomEvent('emergence-complete'));
      window.removeEventListener('scroll', handler);
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}

/**
 * Initialize the emergence timeline
 */
export async function initEmergenceTimeline(containerEl) {
  container = containerEl;
  canvas = container.querySelector('.emergence-canvas');

  if (!canvas) {
    console.warn('Emergence canvas not found');
    return null;
  }

  // Check reduced motion preference FIRST
  if (prefersReducedMotion()) {
    showFallbackText();
    animationComplete = true;
    container?.classList.add('emergence-complete');
    const cleanupMotion = setupReducedMotionListener();
    return {
      timeline: null,
      shapes: [],
      pathsData: null,
      isComplete: () => true,
      skipToEnd: () => {},
      replay: () => {},
      destroy: cleanupMotion,
    };
  }

  // Setup reduced motion listener
  const cleanupMotion = setupReducedMotionListener();

  // Wait for fonts
  await document.fonts.ready;

  // Extract letter paths using pixel sampling
  const pathsData = await extractLetterPaths(container, {
    text: CONFIG.text,
    minPointsPerLetter: 50,
    maxPointsPerLetter: 80,
    samplingDensity: 2,
  });

  // Generate shapes from pixel-sampled positions
  shapes = generateAllShapes(
    CONFIG.text,
    pathsData.letterPathsData,
    pathsData.containerBounds
  );

  console.log('[emergence-timeline] Initialized with', shapes.length, 'shapes');

  // Render shapes to DOM
  const shapeElements = renderShapes(shapes, canvas);

  // Build and start timeline
  timeline = buildTimeline(shapeElements);

  // Setup scroll interrupt
  const cleanupScroll = setupScrollInterrupt();

  return {
    timeline,
    shapes,
    pathsData,
    isComplete: () => animationComplete,
    skipToEnd: () => {
      if (timeline) {
        timeline.seek(timeline.duration);
        animationComplete = true;
        container?.classList.add('emergence-complete');
      }
    },
    replay: () => {
      if (timeline) {
        animationComplete = false;
        container?.classList.remove('emergence-complete');
        timeline.seek(0);
        timeline.play();
      }
    },
    destroy: () => {
      cleanupScroll();
      cleanupMotion();
      if (timeline) timeline.pause();
      if (canvas) canvas.innerHTML = '';
      timeline = null;
      shapes = [];
      animationComplete = false;
    }
  };
}

/**
 * Check if animation is complete
 */
export function isAnimationComplete() {
  return animationComplete;
}

/**
 * Get current shapes
 */
export function getShapes() {
  return shapes;
}

export { CONFIG };

export default {
  initEmergenceTimeline,
  isAnimationComplete,
  getShapes,
  CONFIG
};
