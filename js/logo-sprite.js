/**
 * Logo Sprite Animation
 * Proximity-triggered: frames cycle as cursor approaches logo
 * Stops on direct hover (cursor behavior takes over)
 */

const PROXIMITY_RADIUS = 150; // px from logo center
const FRAME_COUNT = 19;
const FRAME_INTERVAL = 80; // ms per frame (~12.5 fps)
const SPRITE_PATH = 'assets/sprites/dem-logo/';

export function initLogoSprite() {
  // Skip for reduced motion or touch
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  const logo = document.querySelector('.nav__logo');
  const sprite = logo?.querySelector('.logo-sprite');
  if (!logo || !sprite) return;

  // Preload all frames
  const frames = [];
  for (let i = 1; i <= FRAME_COUNT; i++) {
    const img = new Image();
    img.src = `${SPRITE_PATH}dem-${String(i).padStart(2, '0')}.png`;
    frames.push(img);
  }

  let currentFrame = 0;
  let intervalId = null;
  let isProximity = false;

  function startCycling() {
    if (intervalId) return;
    intervalId = setInterval(() => {
      currentFrame = (currentFrame + 1) % FRAME_COUNT;
      sprite.src = frames[currentFrame].src;
    }, FRAME_INTERVAL);
  }

  function stopCycling() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Proximity detection via mousemove
  document.addEventListener('mousemove', (e) => {
    const rect = logo.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);

    const inProximity = dist < PROXIMITY_RADIUS;

    if (inProximity && !isProximity) {
      isProximity = true;
      logo.classList.add('logo-proximity');
      startCycling();
    } else if (!inProximity && isProximity) {
      isProximity = false;
      logo.classList.remove('logo-proximity');
      stopCycling();
    }
  }, { passive: true });
}
