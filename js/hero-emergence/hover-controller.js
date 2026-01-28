/**
 * Hover Controller for Hero Text Emergence Animation
 * Manages dissolve/reform effects when hovering over letters post-formation
 */

import { animate, utils } from 'animejs';
import { getLetterBounds } from './letter-paths.js';

// Configuration
const CONFIG = {
  dissolveDistance: 20,
  dissolveDuration: 200,
  reformDuration: 300,
  dissolveOpacity: 0.7,
  touchReformDelay: 500,
};

// State
let enabled = false;
let letterGroups = [];
let activeAnimations = new Map();

/**
 * Create letter groups for hover targeting
 */
function createLetterGroups(container, pathsData, text) {
  const canvas = container.querySelector('.emergence-canvas');
  if (!canvas) return [];

  const bounds = getLetterBounds(pathsData, text);
  const groups = [];

  bounds.forEach(letterBound => {
    // Create a group element positioned over the letter
    const group = document.createElement('div');
    group.className = 'letter-group';
    group.dataset.letter = letterBound.char;
    group.dataset.letterIndex = letterBound.letterIndex;

    // Position the group
    const width = letterBound.maxX - letterBound.minX;
    const height = letterBound.maxY - letterBound.minY;

    group.style.cssText = `
      left: ${letterBound.minX}px;
      top: ${letterBound.minY}px;
      width: ${width}px;
      height: ${height}px;
    `;

    // Move shapes belonging to this letter into the group
    const shapes = canvas.querySelectorAll(
      `.emergence-shape[data-letter-index="${letterBound.letterIndex}"]`
    );

    shapes.forEach(shape => {
      // Adjust shape position to be relative to group
      const currentLeft = parseFloat(shape.style.left);
      const currentTop = parseFloat(shape.style.top);
      shape.style.left = `${currentLeft - letterBound.minX}px`;
      shape.style.top = `${currentTop - letterBound.minY}px`;
      group.appendChild(shape);
    });

    canvas.appendChild(group);
    groups.push({
      element: group,
      char: letterBound.char,
      letterIndex: letterBound.letterIndex,
      bounds: letterBound,
    });
  });

  return groups;
}

/**
 * Dissolve effect - scatter shapes away from their positions
 */
function dissolve(group) {
  const shapes = group.element.querySelectorAll('.emergence-shape');
  if (shapes.length === 0) return;

  // Cancel any active animation on this group
  if (activeAnimations.has(group.letterIndex)) {
    const anim = activeAnimations.get(group.letterIndex);
    if (anim && anim.pause) anim.pause();
  }

  const anim = animate(shapes, {
    translateX: () => utils.random(-CONFIG.dissolveDistance, CONFIG.dissolveDistance),
    translateY: () => utils.random(-CONFIG.dissolveDistance, CONFIG.dissolveDistance),
    rotate: () => utils.random(-15, 15),
    opacity: CONFIG.dissolveOpacity,
    duration: CONFIG.dissolveDuration,
    ease: 'outQuad',
  });

  activeAnimations.set(group.letterIndex, anim);
  return anim;
}

/**
 * Reform effect - return shapes to their target positions
 */
function reform(group) {
  const shapes = group.element.querySelectorAll('.emergence-shape');
  if (shapes.length === 0) return;

  // Cancel any active animation on this group
  if (activeAnimations.has(group.letterIndex)) {
    const anim = activeAnimations.get(group.letterIndex);
    if (anim && anim.pause) anim.pause();
  }

  const anim = animate(shapes, {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    opacity: 1,
    duration: CONFIG.reformDuration,
    ease: 'outElastic(1, 0.5)',
  });

  activeAnimations.set(group.letterIndex, anim);
  return anim;
}

/**
 * Attach hover listeners to letter groups
 */
function attachListeners(groups) {
  groups.forEach(group => {
    const el = group.element;

    // Mouse events
    el.addEventListener('mouseenter', () => {
      if (!enabled) return;
      dissolve(group);
    });

    el.addEventListener('mouseleave', () => {
      if (!enabled) return;
      reform(group);
    });

    // Touch events - tap to dissolve, auto-reform after delay
    let touchTimeout = null;

    el.addEventListener('touchstart', (e) => {
      if (!enabled) return;
      e.preventDefault();

      // Clear any pending reform
      if (touchTimeout) {
        clearTimeout(touchTimeout);
      }

      dissolve(group);

      // Auto-reform after delay
      touchTimeout = setTimeout(() => {
        reform(group);
        touchTimeout = null;
      }, CONFIG.touchReformDelay);
    }, { passive: false });

    // Cancel touch if user moves finger away
    el.addEventListener('touchend', () => {
      // Let the timeout handle reform
    });

    el.addEventListener('touchcancel', () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        reform(group);
      }
    });
  });
}

/**
 * Enable hover effects (called when emergence animation completes)
 */
export function enableHoverEffects() {
  enabled = true;
}

/**
 * Disable hover effects
 */
export function disableHoverEffects() {
  enabled = false;

  // Reform all groups immediately
  letterGroups.forEach(group => reform(group));
}

/**
 * Initialize hover controller
 * Should be called after emergence animation completes
 */
export function initHoverController(container, pathsData, text = 'DEM Systems') {
  // Listen for emergence-complete event
  const completeHandler = () => {
    // Small delay to ensure DOM is settled
    setTimeout(() => {
      // Note: We don't create letter groups by default since shapes
      // are positioned absolutely in the canvas, not grouped.
      // The hover effect works on individual letter targets.
      setupDirectHover(container);
      enableHoverEffects();
    }, 100);
  };

  window.addEventListener('emergence-complete', completeHandler, { once: true });

  // Return cleanup function
  return () => {
    window.removeEventListener('emergence-complete', completeHandler);
    disableHoverEffects();
    letterGroups = [];
    activeAnimations.clear();
  };
}

/**
 * Direct hover on shapes (simpler approach without regrouping)
 */
function setupDirectHover(container) {
  const canvas = container.querySelector('.emergence-canvas');
  if (!canvas) return;

  // Get unique letters
  const shapes = canvas.querySelectorAll('.emergence-shape');
  const letterMap = new Map();

  shapes.forEach(shape => {
    const letter = shape.dataset.target;
    const letterIndex = shape.dataset.letterIndex;
    const key = `${letter}-${letterIndex}`;

    if (!letterMap.has(key)) {
      letterMap.set(key, []);
    }
    letterMap.get(key).push(shape);
  });

  // Create invisible hover targets for each letter
  letterMap.forEach((letterShapes, key) => {
    if (letterShapes.length === 0) return;

    // Calculate bounding box from shape positions
    const positions = letterShapes.map(shape => {
      const rect = shape.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      return {
        left: rect.left - canvasRect.left,
        top: rect.top - canvasRect.top,
        right: rect.right - canvasRect.left,
        bottom: rect.bottom - canvasRect.top,
      };
    });

    const minX = Math.min(...positions.map(p => p.left)) - 5;
    const minY = Math.min(...positions.map(p => p.top)) - 5;
    const maxX = Math.max(...positions.map(p => p.right)) + 5;
    const maxY = Math.max(...positions.map(p => p.bottom)) + 5;

    // Create hover target
    const hoverTarget = document.createElement('div');
    hoverTarget.className = 'letter-group';
    hoverTarget.dataset.letter = key;
    hoverTarget.style.cssText = `
      position: absolute;
      left: ${minX}px;
      top: ${minY}px;
      width: ${maxX - minX}px;
      height: ${maxY - minY}px;
      pointer-events: auto;
      cursor: pointer;
    `;

    // Attach hover events
    let touchTimeout = null;

    hoverTarget.addEventListener('mouseenter', () => {
      if (!enabled) return;
      dissolveShapes(letterShapes);
    });

    hoverTarget.addEventListener('mouseleave', () => {
      if (!enabled) return;
      reformShapes(letterShapes);
    });

    hoverTarget.addEventListener('touchstart', (e) => {
      if (!enabled) return;
      e.preventDefault();

      if (touchTimeout) clearTimeout(touchTimeout);
      dissolveShapes(letterShapes);

      touchTimeout = setTimeout(() => {
        reformShapes(letterShapes);
        touchTimeout = null;
      }, CONFIG.touchReformDelay);
    }, { passive: false });

    canvas.appendChild(hoverTarget);

    letterGroups.push({
      element: hoverTarget,
      shapes: letterShapes,
      key,
    });
  });
}

/**
 * Dissolve specific shapes
 */
function dissolveShapes(shapes) {
  animate(shapes, {
    translateX: () => `+=${utils.random(-CONFIG.dissolveDistance, CONFIG.dissolveDistance)}`,
    translateY: () => `+=${utils.random(-CONFIG.dissolveDistance, CONFIG.dissolveDistance)}`,
    rotate: () => `+=${utils.random(-15, 15)}`,
    opacity: CONFIG.dissolveOpacity,
    duration: CONFIG.dissolveDuration,
    ease: 'outQuad',
  });
}

/**
 * Reform specific shapes to their stored target positions
 */
function reformShapes(shapes) {
  shapes.forEach(shape => {
    const targetX = parseFloat(shape.dataset.targetX);
    const targetY = parseFloat(shape.dataset.targetY);
    const currentLeft = parseFloat(shape.style.left);
    const currentTop = parseFloat(shape.style.top);

    animate(shape, {
      translateX: targetX - currentLeft,
      translateY: targetY - currentTop,
      rotate: 0,
      opacity: 1,
      duration: CONFIG.reformDuration,
      ease: 'outElastic(1, 0.5)',
    });
  });
}

export default {
  initHoverController,
  enableHoverEffects,
  disableHoverEffects,
  CONFIG,
};
