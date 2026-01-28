/**
 * Contact Section Animations
 * 1. Scroll-wipe reveal: geometric clip-path wipe as content scrolls into view
 * 2. Title hover: elastic char bounce + straight bold underline draws to text width
 * 3. CTA hover: border erase-redraw
 */

import { animate, stagger, utils } from 'animejs';

export function initContactAnimations() {
  const section = document.querySelector('.section--contact');
  if (!section) return;

  // Scroll-wipe works for everyone (reduced-motion gets instant reveal)
  initScrollReveal(section);

  // Hover animations only for pointer devices with motion enabled
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  const title = section.querySelector('#contact-title');
  const btn = section.querySelector('.cta');

  // ─── Title: char bounce + underline on hover ───
  if (title) {
    setupTitleHover(title);
  }

  // ─── CTA: border redraw + scramble on hover ───
  if (btn) {
    setupCtaHover(btn);
  }
}

function setupTitleHover(title) {
  const text = title.textContent;
  title.textContent = '';
  title.style.position = 'relative';
  title.style.width = 'fit-content';

  const titleChars = [];
  for (const char of text) {
    const span = document.createElement('span');
    span.className = 'contact-char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    title.appendChild(span);
    titleChars.push(span);
  }

  // Wavy SVG underline — sized to text, not container
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', '0 0 300 12');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.cssText = 'position:absolute;bottom:-6px;left:0;width:100%;height:8px;overflow:visible;pointer-events:none;';

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '0');
  line.setAttribute('y1', '6');
  line.setAttribute('x2', '300');
  line.setAttribute('y2', '6');
  line.setAttribute('stroke', 'currentColor');
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('stroke-linecap', 'square');
  svg.appendChild(line);
  title.appendChild(svg);

  const lineLength = line.getTotalLength();
  line.style.strokeDasharray = lineLength;
  line.style.strokeDashoffset = lineLength; // Hidden

  let isAnimating = false;

  title.addEventListener('mouseenter', () => {
    if (isAnimating) return;
    isAnimating = true;

    // Chars: small elastic bounce
    animate(titleChars, {
      translateY: [0, -4, 0],
      duration: 600,
      delay: stagger(20, { from: 'center' }),
      ease: 'outElastic(1, 0.6)'
    });

    // Underline: draw in
    animate(line, {
      strokeDashoffset: [lineLength, 0],
      duration: 800,
      ease: 'inOutQuad',
      onComplete: () => { isAnimating = false; }
    });
  });

  title.addEventListener('mouseleave', () => {
    // Underline: retract
    animate(line, {
      strokeDashoffset: [0, lineLength],
      duration: 500,
      ease: 'inOutQuad'
    });

    // Chars: settle back (in case still mid-bounce)
    animate(titleChars, {
      translateY: 0,
      duration: 300,
      ease: 'outQuad'
    });

    isAnimating = false;
  });
}

function setupCtaHover(btn) {
  btn.style.position = 'relative';

  requestAnimationFrame(() => {
    const w = Math.round(btn.offsetWidth);
    const h = Math.round(btn.offsetHeight);
    const perimeter = 2 * (w + h);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';

    const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borderRect.setAttribute('x', '0.5');
    borderRect.setAttribute('y', '0.5');
    borderRect.setAttribute('width', String(w - 1));
    borderRect.setAttribute('height', String(h - 1));
    borderRect.setAttribute('fill', 'none');
    borderRect.setAttribute('stroke', 'black');
    borderRect.setAttribute('stroke-width', '1');
    borderRect.style.strokeDasharray = perimeter;
    borderRect.style.strokeDashoffset = '0'; // Fully drawn by default

    svg.appendChild(borderRect);
    btn.appendChild(svg);
    btn.style.border = 'none';

    let isHovering = false;

    btn.addEventListener('mouseenter', () => {
      if (isHovering) return;
      isHovering = true;

      // Border: erase and redraw
      animate(borderRect, {
        strokeDashoffset: [0, perimeter, 0],
        duration: 800,
        ease: 'inOutQuad',
        onComplete: () => { isHovering = false; }
      });
    });
  });
}

// ─── Scroll-Wipe Reveal ─────────────────────────────────────────────────
// Geometric wipe: clip-path inset animates from 100% to 0% (bottom-to-top reveal)
// Repeatable: resets when section scrolls out, replays when it scrolls back in

function initScrollReveal(section) {
  const wipeElements = section.querySelectorAll('.contact-wipe');
  if (!wipeElements.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    wipeElements.forEach(el => {
      el.classList.remove('contact-wipe');
      el.classList.add('wipe-revealed');
    });
    return;
  }

  // State: 'hidden' | 'animating' | 'visible'
  let state = 'hidden';

  window.registerScrollAnimation({
    element: section,
    update: (progress) => {
      // Section entering viewport — trigger wipe
      if (progress > 0.05 && state === 'hidden') {
        state = 'animating';
        wipeElements.forEach((el, i) => {
          el.style.clipPath = '';  // restore CSS class clip-path
          el.style.willChange = 'clip-path';
          animate(el, {
            '--contact-wipe': ['100%', '0%'],
            duration: 800,
            ease: 'inOutQuint',
            delay: i * 150,
            onComplete: () => {
              el.style.clipPath = 'none';
              el.style.willChange = 'auto';
              if (i === wipeElements.length - 1) state = 'visible';
            }
          });
        });
      }

      // Section scrolled away — reset so it can replay
      if (progress <= 0 && state === 'visible') {
        state = 'hidden';
        wipeElements.forEach(el => {
          el.style.setProperty('--contact-wipe', '100%');
          el.style.clipPath = '';  // restore CSS class clip-path
          el.style.willChange = 'clip-path';
        });
      }
    }
  });
}
