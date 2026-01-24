/**
 * Semantic Text Animations
 *
 * Uses Anime.js v4 for character-level effects on semantic words.
 * Each effect is designed to reinforce the meaning of the word.
 *
 * @see /Users/jungmergs/Downloads/animejs_master_llm/kb/ for v4 patterns
 * @see /thoughts/shared/specs/2026-01-21-about-section-scrollytelling.md
 */

// Dynamic import for Anime.js v4
let anime = null;
let animeText = null;

// Check reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Animation instances for cleanup
const activeAnimations = new Map();

/**
 * Load Anime.js v4 modules dynamically
 */
async function loadAnime() {
  if (anime) return { anime, animeText };

  try {
    // Import Anime.js v4 core
    const animeModule = await import('animejs');
    anime = animeModule;

    console.log('[TextAnimations] Anime.js v4 loaded');
    return { anime, animeText };
  } catch (error) {
    console.error('[TextAnimations] Failed to load Anime.js:', error);
    return null;
  }
}

/**
 * Split text into character spans manually (fallback if splitText not available)
 * @param {HTMLElement} element Element to split
 * @returns {Object} { chars: HTMLElement[], words: HTMLElement[], revert: Function }
 */
function manualSplitText(element) {
  const originalHTML = element.innerHTML;
  const text = element.textContent;
  const chars = [];

  // Clear element
  element.innerHTML = '';

  // Create character spans
  for (const char of text) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space for spaces
    span.style.display = 'inline-block';
    element.appendChild(span);
    chars.push(span);
  }

  return {
    chars,
    words: [element],
    revert: () => {
      element.innerHTML = originalHTML;
    },
  };
}

/**
 * Wave Motion Effect
 * Characters rise and fall in a sine wave pattern
 * Semantic: "complex code" - suggests flowing, organic movement
 */
export async function waveMotion(selector, options = {}) {
  if (prefersReducedMotion) {
    const el = document.querySelector(selector);
    if (el) el.style.opacity = '1';
    return { play: () => {}, pause: () => {}, revert: () => {} };
  }

  const modules = await loadAnime();
  if (!modules) return null;

  const { animate, stagger } = modules.anime;
  const element = document.querySelector(selector);
  if (!element) return null;

  const split = manualSplitText(element);
  const amplitude = options.amplitude || 12;
  const frequency = options.frequency || 0.4;

  // Store initial positions
  split.chars.forEach((char, i) => {
    char.dataset.waveOffset = Math.sin(i * frequency) * amplitude;
  });

  const animation = animate(split.chars, {
    translateY: (el, i) => [0, Math.sin(i * frequency) * amplitude],
    opacity: [0.6, 1],
    duration: options.duration || 800,
    delay: stagger(options.staggerDelay || 25, { from: 'first' }),
    ease: 'outSine',
    loop: options.loop || false,
    autoplay: false,
  });

  activeAnimations.set(selector, { animation, split });

  return {
    play: () => animation.play(),
    pause: () => animation.pause(),
    seek: (progress) => animation.seek(animation.duration * progress),
    revert: () => {
      animation.pause();
      split.revert();
      activeAnimations.delete(selector);
    },
  };
}

/**
 * 3D Flip Reveal
 * Characters rotate in from above with perspective
 * Semantic: "bespoke" - precision, craftsmanship, deliberate assembly
 */
export async function flip3D(selector, options = {}) {
  if (prefersReducedMotion) {
    const el = document.querySelector(selector);
    if (el) el.style.opacity = '1';
    return { play: () => {}, pause: () => {}, revert: () => {} };
  }

  const modules = await loadAnime();
  if (!modules) return null;

  const { animate, stagger } = modules.anime;
  const element = document.querySelector(selector);
  if (!element) return null;

  // Set perspective on parent
  element.style.perspective = '1000px';
  element.style.perspectiveOrigin = 'center';

  const split = manualSplitText(element);

  // Set transform origin for 3D effect
  split.chars.forEach(char => {
    char.style.transformStyle = 'preserve-3d';
    char.style.backfaceVisibility = 'hidden';
  });

  const animation = animate(split.chars, {
    rotateX: [90, 0],
    translateY: ['50%', '0%'],
    translateZ: [50, 0],
    opacity: [0, 1],
    duration: options.duration || 600,
    delay: stagger(options.staggerDelay || 35, { from: 'center' }),
    ease: 'outExpo',
    autoplay: false,
  });

  activeAnimations.set(selector, { animation, split });

  return {
    play: () => animation.play(),
    pause: () => animation.pause(),
    seek: (progress) => animation.seek(animation.duration * progress),
    revert: () => {
      animation.pause();
      element.style.perspective = '';
      split.revert();
      activeAnimations.delete(selector);
    },
  };
}

/**
 * Kinetic Scatter
 * Characters explode outward then converge back
 * Semantic: "friction" - energy, tension, then resolution
 */
export async function kineticScatter(selector, options = {}) {
  if (prefersReducedMotion) {
    const el = document.querySelector(selector);
    if (el) el.style.opacity = '1';
    return { play: () => {}, pause: () => {}, revert: () => {} };
  }

  const modules = await loadAnime();
  if (!modules) return null;

  const { animate, stagger, createTimeline } = modules.anime;
  const element = document.querySelector(selector);
  if (!element) return null;

  // Allow overflow for scattered chars
  element.style.overflow = 'visible';

  const split = manualSplitText(element);
  const scatterDistance = options.scatterDistance || 60;
  const rotationRange = options.rotationRange || 30;

  // Generate random scatter positions for each character
  split.chars.forEach(char => {
    char.dataset.scatterX = (Math.random() - 0.5) * scatterDistance * 2;
    char.dataset.scatterY = (Math.random() - 0.5) * scatterDistance;
    char.dataset.scatterRotate = (Math.random() - 0.5) * rotationRange * 2;
  });

  // Create timeline for scatter -> converge
  const timeline = createTimeline({
    autoplay: false,
    defaults: {
      ease: 'outExpo',
    },
  });

  // Phase 1: Scatter out
  timeline.add(split.chars, {
    translateX: (el) => parseFloat(el.dataset.scatterX),
    translateY: (el) => parseFloat(el.dataset.scatterY),
    rotate: (el) => parseFloat(el.dataset.scatterRotate),
    opacity: [1, 0.5],
    scale: [1, 0.9],
    duration: options.scatterDuration || 400,
    delay: stagger(15, { from: 'center' }),
  }, 0);

  // Phase 2: Converge back
  timeline.add(split.chars, {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    opacity: 1,
    scale: 1,
    duration: options.convergeDuration || 600,
    delay: stagger(20, { from: 'edges' }),
    ease: 'outElastic(1, 0.5)',
  }, options.scatterDuration || 400);

  activeAnimations.set(selector, { animation: timeline, split });

  return {
    play: () => timeline.play(),
    pause: () => timeline.pause(),
    seek: (progress) => timeline.seek(timeline.duration * progress),
    revert: () => {
      timeline.pause();
      element.style.overflow = '';
      split.revert();
      activeAnimations.delete(selector);
    },
  };
}

/**
 * Glow Pulse
 * Text glows and pulses for emphasis
 * Semantic: "clarity" - illumination, understanding, focus
 */
export async function glowPulse(selector, options = {}) {
  if (prefersReducedMotion) {
    const el = document.querySelector(selector);
    if (el) el.style.opacity = '1';
    return { play: () => {}, pause: () => {}, revert: () => {} };
  }

  const modules = await loadAnime();
  if (!modules) return null;

  const { animate } = modules.anime;
  const element = document.querySelector(selector);
  if (!element) return null;

  const glowColor = options.glowColor || 'rgba(0, 0, 0, 0.4)';
  const glowSize = options.glowSize || 30;

  const animation = animate(element, {
    textShadow: [
      `0 0 0 transparent`,
      `0 0 ${glowSize}px ${glowColor}`,
      `0 0 ${glowSize * 2}px ${glowColor}`,
      `0 0 ${glowSize}px ${glowColor}`,
      `0 0 0 transparent`,
    ],
    scale: [1, 1.02, 1],
    duration: options.duration || 1500,
    ease: 'inOutSine',
    autoplay: false,
  });

  activeAnimations.set(selector, { animation });

  return {
    play: () => animation.play(),
    pause: () => animation.pause(),
    seek: (progress) => animation.seek(animation.duration * progress),
    revert: () => {
      animation.pause();
      element.style.textShadow = '';
      element.style.transform = '';
      activeAnimations.delete(selector);
    },
  };
}

/**
 * Strikethrough
 * Animated line crosses through text
 * Semantic: "No complicated jargon" - elimination, removal
 */
export async function strikethrough(selector, options = {}) {
  if (prefersReducedMotion) {
    const el = document.querySelector(selector);
    if (el) el.classList.add('is-struck');
    return { play: () => {}, pause: () => {}, revert: () => {} };
  }

  const modules = await loadAnime();
  if (!modules) return null;

  const { animate } = modules.anime;
  const element = document.querySelector(selector);
  if (!element) return null;

  // Create strikethrough line element
  let line = element.querySelector('.strike-line');
  if (!line) {
    line = document.createElement('span');
    line.className = 'strike-line';
    line.style.cssText = `
      position: absolute;
      left: 0;
      top: 50%;
      width: 0;
      height: 2px;
      background: currentColor;
      transform: translateY(-50%);
      pointer-events: none;
    `;
    element.style.position = 'relative';
    element.appendChild(line);
  }

  const animation = animate(line, {
    width: ['0%', '100%'],
    duration: options.duration || 800,
    ease: 'outQuart',
    autoplay: false,
    onComplete: () => {
      element.classList.add('is-struck');
    },
  });

  activeAnimations.set(selector, { animation });

  return {
    play: () => animation.play(),
    pause: () => animation.pause(),
    seek: (progress) => animation.seek(animation.duration * progress),
    revert: () => {
      animation.pause();
      element.classList.remove('is-struck');
      if (line) line.remove();
      activeAnimations.delete(selector);
    },
  };
}

/**
 * SVG Path Draw
 * Animated underline draws beneath text
 * Semantic: "path" - journey, direction, clarity
 */
export async function svgDraw(selector, options = {}) {
  if (prefersReducedMotion) {
    const el = document.querySelector(selector);
    if (el) el.classList.add('is-drawn');
    return { play: () => {}, pause: () => {}, revert: () => {} };
  }

  const modules = await loadAnime();
  if (!modules) return null;

  const { animate } = modules.anime;
  const element = document.querySelector(selector);
  if (!element) return null;

  // Create SVG underline
  let svg = element.querySelector('.path-underline-svg');
  if (!svg) {
    const width = element.offsetWidth;
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'path-underline-svg');
    svg.setAttribute('viewBox', `0 0 ${width} 10`);
    svg.style.cssText = `
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 10px;
      overflow: visible;
      pointer-events: none;
    `;

    // Create wavy path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M0,5 Q${width * 0.25},0 ${width * 0.5},5 T${width},5`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('class', 'path-underline');

    // Get path length for animation
    svg.appendChild(path);
    element.style.position = 'relative';
    element.appendChild(svg);

    // Set initial dash state
    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;
  }

  const path = svg.querySelector('.path-underline');
  const pathLength = path.getTotalLength();

  const animation = animate(path, {
    strokeDashoffset: [pathLength, 0],
    duration: options.duration || 1000,
    ease: 'outQuart',
    autoplay: false,
    onComplete: () => {
      element.classList.add('is-drawn');
    },
  });

  activeAnimations.set(selector, { animation });

  return {
    play: () => animation.play(),
    pause: () => animation.pause(),
    seek: (progress) => animation.seek(animation.duration * progress),
    revert: () => {
      animation.pause();
      element.classList.remove('is-drawn');
      if (svg) svg.remove();
      activeAnimations.delete(selector);
    },
  };
}

/**
 * Converge Effect
 * Multiple elements converge to a focal point
 * Semantic: "focus" / "matters" - concentration, importance
 */
export async function converge(selector, options = {}) {
  if (prefersReducedMotion) {
    const el = document.querySelector(selector);
    if (el) el.style.opacity = '1';
    return { play: () => {}, pause: () => {}, revert: () => {} };
  }

  const modules = await loadAnime();
  if (!modules) return null;

  const { animate, stagger } = modules.anime;
  const element = document.querySelector(selector);
  if (!element) return null;

  const split = manualSplitText(element);
  const convergeDistance = options.convergeDistance || 30;

  // Set initial scattered positions
  split.chars.forEach((char, i, arr) => {
    const centerIndex = arr.length / 2;
    const distanceFromCenter = i - centerIndex;
    char.style.transform = `translateX(${distanceFromCenter * 3}px) scale(0.9)`;
    char.style.opacity = '0.5';
  });

  const animation = animate(split.chars, {
    translateX: 0,
    scale: [0.9, 1.05, 1],
    opacity: [0.5, 1],
    duration: options.duration || 700,
    delay: stagger(25, { from: 'edges' }),
    ease: 'outElastic(1, 0.6)',
    autoplay: false,
  });

  activeAnimations.set(selector, { animation, split });

  return {
    play: () => animation.play(),
    pause: () => animation.pause(),
    seek: (progress) => animation.seek(animation.duration * progress),
    revert: () => {
      animation.pause();
      split.revert();
      activeAnimations.delete(selector);
    },
  };
}

/**
 * Initialize all text animations for semantic words
 * @param {Object} timeline GSAP master timeline to sync with
 */
export async function initTextAnimations(timeline = null) {
  if (prefersReducedMotion) {
    console.log('[TextAnimations] Reduced motion preferred, skipping');
    return;
  }

  console.log('[TextAnimations] Initializing...');

  // Map effects to selectors
  const effectMap = {
    flip3D: '[data-effect="flip3D"]',
    kineticScatter: '[data-effect="kineticScatter"]',
    waveMotion: '[data-effect="waveMotion"]',
    glowPulse: '[data-effect="glowPulse"]',
    strikethrough: '[data-effect="strikethrough"]',
    svgDraw: '[data-effect="svgDraw"]',
    converge: '[data-effect="converge"]',
  };

  const effects = {
    flip3D,
    kineticScatter,
    waveMotion,
    glowPulse,
    strikethrough,
    svgDraw,
    converge,
  };

  const initializedEffects = [];

  for (const [effectName, selector] of Object.entries(effectMap)) {
    const elements = document.querySelectorAll(selector);

    for (const element of elements) {
      const uniqueSelector = `[data-effect="${effectName}"][data-paragraph="${element.closest('[data-paragraph]')?.dataset.paragraph || ''}"]`;
      const effect = await effects[effectName](selector);

      if (effect) {
        initializedEffects.push({
          name: effectName,
          selector,
          effect,
          element,
        });
      }
    }
  }

  console.log(`[TextAnimations] Initialized ${initializedEffects.length} effects`);

  return {
    effects: initializedEffects,
    playAll: () => initializedEffects.forEach(e => e.effect.play()),
    pauseAll: () => initializedEffects.forEach(e => e.effect.pause()),
    revertAll: () => initializedEffects.forEach(e => e.effect.revert()),
  };
}

/**
 * Clean up all animations
 */
export function destroyTextAnimations() {
  activeAnimations.forEach(({ animation, split }) => {
    if (animation?.pause) animation.pause();
    if (split?.revert) split.revert();
  });
  activeAnimations.clear();
  console.log('[TextAnimations] Destroyed');
}

export default {
  waveMotion,
  flip3D,
  kineticScatter,
  glowPulse,
  strikethrough,
  svgDraw,
  converge,
  initTextAnimations,
  destroyTextAnimations,
};
