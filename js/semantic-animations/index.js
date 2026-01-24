/**
 * Semantic Animations Index
 *
 * Exports all semantic animation factories for the About section.
 */

// Animation factories
export { createAssemblyAnimation } from './assembly.js';
export { createVibrateSettleAnimation } from './vibrate-settle.js';
export { createEliminateAnimation } from './eliminate.js';
export { createPathFollowAnimation } from './path-follow.js';
export { createBlurToClearAnimation } from './blur-to-clear.js';
export { createComplexityWaveAnimation } from './complexity-wave.js';
export { createContextBlurAnimation } from './context-blur.js';
export { createWeightPresenceAnimation } from './weight-presence.js';

// Utilities
export * from './utils.js';

// Default export with all animations
export default {
  createAssemblyAnimation: () => import('./assembly.js').then(m => m.createAssemblyAnimation),
  createVibrateSettleAnimation: () => import('./vibrate-settle.js').then(m => m.createVibrateSettleAnimation),
  createEliminateAnimation: () => import('./eliminate.js').then(m => m.createEliminateAnimation),
  createPathFollowAnimation: () => import('./path-follow.js').then(m => m.createPathFollowAnimation),
  createBlurToClearAnimation: () => import('./blur-to-clear.js').then(m => m.createBlurToClearAnimation),
  createComplexityWaveAnimation: () => import('./complexity-wave.js').then(m => m.createComplexityWaveAnimation),
  createContextBlurAnimation: () => import('./context-blur.js').then(m => m.createContextBlurAnimation),
  createWeightPresenceAnimation: () => import('./weight-presence.js').then(m => m.createWeightPresenceAnimation)
};
