/**
 * DEM Systems - Custom Cursor
 * Small morphing dot that indicates interactive elements
 * Simplified version - circuit reveal moved to hero-video-reveal.js
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isTouchPrimaryDevice = () => {
  return window.matchMedia('(pointer: coarse)').matches;
};

export function initCustomCursor() {
  if (isTouchPrimaryDevice() || prefersReducedMotion) {
    console.log('Custom cursor disabled:', { touch: isTouchPrimaryDevice(), reducedMotion: prefersReducedMotion });
    return;
  }

  console.log('Initializing custom cursor');

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursor);

  document.body.classList.add('cursor-active');

  // Direct cursor update - no smoothing for instant response
  // Combines position + centering offset in single transform
  function onMouseMove(e) {
    cursor.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
  }

  function isInteractive(el) {
    if (!el) return false;
    const selectors = ['a', 'button', '[role="button"]', '.interactive', '.cta', '.submit-button', '.service-card'];
    return el.closest(selectors.join(', '));
  }

  function isTextInput(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea';
  }

  function onMouseOver(e) {
    cursor.classList.remove('interactive', 'text');

    if (isTextInput(e.target)) {
      cursor.classList.add('text');
    } else if (isInteractive(e.target)) {
      cursor.classList.add('interactive');
    }
  }

  function onMouseDown() {
    cursor.classList.add('pressing');
  }

  function onMouseUp() {
    cursor.classList.remove('pressing');
  }

  function onMouseLeave() {
    cursor.classList.add('cursor-hidden');
  }

  function onMouseEnter() {
    cursor.classList.remove('cursor-hidden');
  }

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseover', onMouseOver, { passive: true });
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('mouseenter', onMouseEnter);
}

export function disableCustomCursor() {
  document.querySelector('.custom-cursor')?.remove();
  document.body.classList.remove('cursor-active');
}
