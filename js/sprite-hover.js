/**
 * Sprite Hover Animation
 *
 * Plays a sprite sequence on hover:
 * - Forward: Frames 1-16 on mouseenter
 * - Reverse: Current frame back to 1 on mouseleave
 * - Sprite disappears after reverse animation completes
 *
 * Total animation duration: 0.5s (500ms)
 * Per-frame duration: ~31ms for 16 frames
 */

// Sprite set configurations
const SPRITE_SETS = {
  bricks: {
    totalFrames: 15,
    path: 'assets/sprites/bricks/',
    prefix: 'brick-',
    ext: '.png',
    duration: 500,  // ms
  },
  clarity: {
    totalFrames: 6,
    path: 'assets/sprites/clarity/',
    prefix: 'clarity-',
    ext: '.png',
    duration: 200,  // ms - faster
  },
  gears: {
    totalFrames: 5,
    path: 'assets/sprites/gears/',
    prefix: 'gears-',
    ext: '.png',
    duration: 300,
  },
  desks: {
    totalFrames: 5,
    path: 'assets/sprites/desks/',
    prefix: 'desks-',
    ext: '.png',
    duration: 300,
  },
  wires: {
    totalFrames: 8,
    path: 'assets/sprites/wires/',
    prefix: 'wires-',
    ext: '.png',
    duration: 400,
  },
  skulls: {
    totalFrames: 3,
    path: 'assets/sprites/skulls/',
    prefix: 'skulls-',
    ext: '.png',
    duration: 200,
  },
  map: {
    totalFrames: 5,
    path: 'assets/sprites/map/',
    prefix: 'map-',
    ext: '.png',
    duration: 300,
  },
};

// Global config
const CONFIG = {
  ANIMATION_DURATION: 500,  // ms total
};

// State per trigger (using WeakMap for automatic cleanup)
const triggerStates = new WeakMap();

/**
 * Initialize sprite hover system
 */
export function initSpriteHover() {
  // Skip for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('[SpriteHover] Reduced motion - skipping initialization');
    return;
  }

  // Skip on touch devices (no hover)
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    console.log('[SpriteHover] Touch device - skipping initialization');
    return;
  }

  const triggers = document.querySelectorAll('.sprite-hover-trigger');

  if (triggers.length === 0) {
    console.log('[SpriteHover] No triggers found');
    return;
  }

  // Preload all sprite images
  preloadSprites();

  // Initialize each trigger
  triggers.forEach(initTrigger);

  console.log(`[SpriteHover] Initialized ${triggers.length} trigger(s)`);
}

/**
 * Preload sprite images for smooth animation
 */
function preloadSprites() {
  Object.entries(SPRITE_SETS).forEach(([name, set]) => {
    for (let i = 1; i <= set.totalFrames; i++) {
      const img = new Image();
      img.src = getSpritePath(name, i);
    }
  });
}

/**
 * Get path for a specific frame
 * @param {string} spriteName - Name of the sprite set
 * @param {number} frameNumber - Frame number
 * @returns {string} Path to sprite image
 */
function getSpritePath(spriteName, frameNumber) {
  const set = SPRITE_SETS[spriteName];
  if (!set) return '';
  const paddedNum = String(frameNumber).padStart(2, '0');
  return `${set.path}${set.prefix}${paddedNum}${set.ext}`;
}

/**
 * Initialize a single trigger element
 * @param {HTMLElement} trigger - The trigger element
 */
function initTrigger(trigger) {
  // Get sprite set name from data attribute
  const spriteName = trigger.dataset.sprite || 'bricks';
  const spriteSet = SPRITE_SETS[spriteName];

  if (!spriteSet) {
    console.warn(`[SpriteHover] Unknown sprite set: ${spriteName}`);
    return;
  }

  // Create sprite container and image
  const spriteContainer = document.createElement('span');
  spriteContainer.className = 'sprite-hover-trigger__sprite';
  spriteContainer.setAttribute('aria-hidden', 'true');

  const spriteImage = document.createElement('img');
  spriteImage.className = 'sprite-hover-trigger__image';
  spriteImage.src = getSpritePath(spriteName, 1);
  spriteImage.alt = '';
  spriteImage.draggable = false;

  spriteContainer.appendChild(spriteImage);
  trigger.appendChild(spriteContainer);

  // Initialize state
  const state = {
    currentFrame: 1,
    isAnimating: false,
    isHovering: false,  // Track if mouse is over element
    animationId: null,
    direction: 'forward', // 'forward' or 'reverse'
    image: spriteImage,
    spriteName: spriteName,
    totalFrames: spriteSet.totalFrames,
    duration: spriteSet.duration || 500,
  };
  triggerStates.set(trigger, state);

  // Add event listeners
  trigger.addEventListener('mouseenter', () => handleMouseEnter(trigger));
  trigger.addEventListener('mouseleave', () => handleMouseLeave(trigger));
}

/**
 * Handle mouse enter - start forward animation
 * @param {HTMLElement} trigger - The trigger element
 */
function handleMouseEnter(trigger) {
  const state = triggerStates.get(trigger);
  if (!state) return;

  // Cancel any existing animation
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
  }

  state.isHovering = true;
  state.direction = 'forward';
  state.isAnimating = true;
  trigger.classList.add('is-animating');
  trigger.classList.remove('animation-complete');

  animateFrames(trigger, state);
}

/**
 * Handle mouse leave - start reverse animation
 * @param {HTMLElement} trigger - The trigger element
 */
function handleMouseLeave(trigger) {
  const state = triggerStates.get(trigger);
  if (!state) return;

  // Cancel any existing animation
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
  }

  state.isHovering = false;
  state.direction = 'reverse';
  state.isAnimating = true;

  animateFrames(trigger, state);
}

/**
 * Animate frames in the current direction
 * @param {HTMLElement} trigger - The trigger element
 * @param {object} state - Animation state
 */
function animateFrames(trigger, state) {
  const startTime = performance.now();
  const startFrame = state.currentFrame;
  const totalFrames = state.totalFrames;

  // Determine target frame
  const targetFrame = state.direction === 'forward' ? totalFrames : 1;
  const framesToAnimate = Math.abs(targetFrame - startFrame);

  if (framesToAnimate === 0) {
    finishAnimation(trigger, state);
    return;
  }

  // Calculate duration based on remaining frames (proportional timing)
  const duration = (framesToAnimate / totalFrames) * state.duration;

  function tick(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Calculate current frame based on progress
    let frame;
    if (state.direction === 'forward') {
      frame = Math.floor(startFrame + (progress * framesToAnimate));
      frame = Math.min(frame, totalFrames);
    } else {
      frame = Math.ceil(startFrame - (progress * framesToAnimate));
      frame = Math.max(frame, 1);
    }

    // Update frame if changed
    if (frame !== state.currentFrame) {
      state.currentFrame = frame;
      state.image.src = getSpritePath(state.spriteName, frame);
    }

    // Continue or finish
    if (progress < 1) {
      state.animationId = requestAnimationFrame(tick);
    } else {
      finishAnimation(trigger, state);
    }
  }

  state.animationId = requestAnimationFrame(tick);
}

/**
 * Finish animation and update state
 * @param {HTMLElement} trigger - The trigger element
 * @param {object} state - Animation state
 */
function finishAnimation(trigger, state) {
  state.animationId = null;

  // If still hovering, ping-pong: reverse direction and continue
  if (state.isHovering) {
    state.direction = state.direction === 'forward' ? 'reverse' : 'forward';
    animateFrames(trigger, state);
    return;
  }

  // Not hovering - finish the exit animation
  if (state.direction === 'reverse' && state.currentFrame === 1) {
    // Reverse complete - hide sprite
    state.isAnimating = false;
    trigger.classList.remove('is-animating');
    trigger.classList.remove('animation-complete');
  } else if (state.direction === 'forward') {
    // Was going forward when mouse left, now reverse to exit
    state.direction = 'reverse';
    animateFrames(trigger, state);
  } else {
    state.isAnimating = false;
  }
}

/**
 * Cleanup function - removes all sprite elements and state
 */
export function destroySpriteHover() {
  const triggers = document.querySelectorAll('.sprite-hover-trigger');

  triggers.forEach(trigger => {
    const state = triggerStates.get(trigger);
    if (state?.animationId) {
      cancelAnimationFrame(state.animationId);
    }

    // Remove sprite elements
    const sprite = trigger.querySelector('.sprite-hover-trigger__sprite');
    if (sprite) {
      sprite.remove();
    }

    // Remove classes
    trigger.classList.remove('is-animating', 'animation-complete');

    // Clear state
    triggerStates.delete(trigger);
  });

  console.log('[SpriteHover] Destroyed');
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSpriteHover);
} else {
  initSpriteHover();
}
