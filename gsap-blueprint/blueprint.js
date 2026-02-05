/**
 * The Blueprint Machine - GSAP Version
 * Ported from Remotion
 */

// Configuration
const CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  gridSpacing: 60,
  centerX: 0.315, // Layer center X (percentage)
  centerY: 0.35,  // Layer center Y (percentage)
  demLogoX: 0.48,
  demLogoY: 0.5,
  calloutX: 0.607,
};

// Colors
const colors = {
  bgWhite: '#fafbfc',
  navyDark: '#1a2744',
  navyMid: '#3d4f6f',
  navyLight: '#5a6a8a',
  navyFaint: '#2a3a5a',
};

// Layer configs
const layerConfigs = [
  { label: 'Data Model', sublabel: 'PostgreSQL • Redis • S3', number: '01', startTime: 2 },
  { label: 'Business Logic', sublabel: 'APIs • Workflows • Rules', number: '02', startTime: 3.5 },
  { label: 'Interface', sublabel: 'React • Mobile • Dashboard', number: '03', startTime: 5 },
  { label: 'Integrations', sublabel: 'Stripe • Auth • Analytics', number: '04', startTime: 6.5 },
];

// Sentence configs
const sentences = [
  { text: '30 minutes to understand.', typeEnd: 0.83, holdEnd: 1, deleteEnd: 1.5 },
  { text: '24 hours to build.', typeEnd: 0.67, holdEnd: 0.83, deleteEnd: 1.2 },
  { text: '7 days to production.', typeEnd: 0.73, holdEnd: 999, deleteEnd: 999 }, // stays
];

// Register CustomEase for spring-like animations
gsap.registerPlugin(CustomEase);
CustomEase.create('spring', 'M0,0 C0.2,0.8 0.3,1.2 0.5,1 0.7,0.95 0.8,1 1,1');
CustomEase.create('snapIn', 'M0,0 C0.5,0 0.5,1 1,1');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  generateGrid();
  generateTickMarks();
  generateCornerBrackets();
  positionElements();
  createMasterTimeline();
}

// Generate grid lines
function generateGrid() {
  const hLines = document.getElementById('h-lines');
  const vLines = document.getElementById('v-lines');
  const horizontalCount = Math.ceil(CONFIG.height / CONFIG.gridSpacing);
  const verticalCount = Math.ceil(CONFIG.width / CONFIG.gridSpacing);

  // Horizontal lines
  for (let i = 0; i < horizontalCount; i++) {
    const y = i * CONFIG.gridSpacing;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', CONFIG.width / 2);
    line.setAttribute('y1', y);
    line.setAttribute('x2', CONFIG.width / 2);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'url(#navyGradientH)');
    line.setAttribute('stroke-width', '0.5');
    line.setAttribute('class', 'grid-line h-line');
    line.setAttribute('data-index', i);
    hLines.appendChild(line);
  }

  // Vertical lines
  for (let i = 0; i < verticalCount; i++) {
    const x = i * CONFIG.gridSpacing;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', CONFIG.height / 2);
    line.setAttribute('x2', x);
    line.setAttribute('y2', CONFIG.height / 2);
    line.setAttribute('stroke', 'url(#navyGradientV)');
    line.setAttribute('stroke-width', '0.5');
    line.setAttribute('class', 'grid-line v-line');
    line.setAttribute('data-index', i + horizontalCount);
    vLines.appendChild(line);
  }
}

// Generate tick marks for outer ring
function generateTickMarks() {
  const tickMarks = document.getElementById('tick-marks');
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const x1 = Math.cos(angle) * 85;
    const y1 = Math.sin(angle) * 85;
    const x2 = Math.cos(angle) * 95;
    const y2 = Math.sin(angle) * 95;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', colors.navyMid);
    line.setAttribute('stroke-width', '1');
    line.setAttribute('opacity', '0.6');
    tickMarks.appendChild(line);
  }
}

// Generate corner brackets
function generateCornerBrackets() {
  const brackets = document.getElementById('corner-brackets');
  [45, 135, 225, 315].forEach((deg) => {
    const rad = (deg * Math.PI) / 180;
    const bx = Math.cos(rad) * 70;
    const by = Math.sin(rad) * 70;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${bx}, ${by}) rotate(${deg + 45})`);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M-8,-8 L-8,0 L0,0');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', colors.navyMid);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('opacity', '0.8');
    g.appendChild(path);
    brackets.appendChild(g);
  });
}

// Position timeline markers and callouts
function positionElements() {
  // Timeline markers
  const markers = document.querySelectorAll('.timeline-marker');
  const markerYPositions = [0.35, 0.5, 0.65];
  markers.forEach((marker, i) => {
    marker.style.top = `${markerYPositions[i] * 100}%`;
    marker.style.transform = `translateY(-50%) translateX(-20px)`;
  });

  // Callouts - positioned relative to layers
  const callouts = document.querySelectorAll('.callout');
  const layerSpacing = 70;
  const centerY = CONFIG.height * CONFIG.centerY;

  callouts.forEach((callout, i) => {
    const layerY = centerY + (i - 1.5) * layerSpacing;
    callout.style.top = `${layerY + 125}px`;
  });
}

// Create master timeline
function createMasterTimeline() {
  const master = gsap.timeline({ repeat: -1, repeatDelay: 1 });

  // Phase 1: Grid draws in (0-1s)
  master.add(createGridTimeline(), 0);

  // Phase 2: Title fades in (1-1.7s)
  master.add(createTitleTimeline(), 1);

  // Phase 3: Timeline markers appear (1.5-2.5s)
  master.add(createMarkersTimeline(), 1.5);

  // Phase 4: Crosshairs fade in (1.3-2s)
  master.add(createCrosshairsTimeline(), 1.3);

  // Phase 5: Corner markers appear (0.7-1.3s)
  master.add(createCornerMarkersTimeline(), 0.7);

  // Phase 6: Layers emerge (2-6.5s)
  master.add(createLayersTimeline(), 0);

  // Phase 7: Callouts appear (2.7-7.8s)
  master.add(createCalloutsTimeline(), 0);

  // Phase 8: Collapse animation (9-10.7s)
  master.add(createCollapseTimeline(), 9);

  // Phase 9: Callouts fade out (10-10.5s)
  master.add(createCalloutsFadeTimeline(), 10);

  // Phase 10: Crosshairs + corner markers fade (10.7-11.5s)
  master.add(createCrosshairsFadeTimeline(), 10.7);

  // Phase 11: Layers fade (10.7-11.5s)
  master.add(createLayersFadeTimeline(), 10.7);

  // Phase 12: Core Logo appears (11.5-15.5s)
  master.add(createCoreLogoTimeline(), 11.5);

  // Phase 13: Everything snaps away (15.2-15.5s)
  master.add(createSnapTimeline(), 15.2);

  // Phase 14: Sentences (15.8-20s)
  master.add(createSentencesTimeline(), 15.8);
}

// Grid timeline
function createGridTimeline() {
  const tl = gsap.timeline();

  // Fade in grid container
  tl.to('#grid', { opacity: 1, duration: 1 }, 0);

  // Animate horizontal lines
  const hLines = document.querySelectorAll('.h-line');
  hLines.forEach((line, i) => {
    const y = parseFloat(line.getAttribute('y1'));
    tl.to(line, {
      attr: { x1: 0, x2: CONFIG.width },
      duration: 1,
      ease: 'power2.out',
    }, i * 0.067);
  });

  // Animate vertical lines
  const vLines = document.querySelectorAll('.v-line');
  vLines.forEach((line, i) => {
    const x = parseFloat(line.getAttribute('x1'));
    tl.to(line, {
      attr: { y1: 0, y2: CONFIG.height },
      duration: 1,
      ease: 'power2.out',
    }, (i + hLines.length) * 0.067);
  });

  return tl;
}

// Title timeline
function createTitleTimeline() {
  const tl = gsap.timeline();
  tl.to('#title', { opacity: 1, duration: 0.67, ease: 'power2.out' });
  return tl;
}

// Timeline markers
function createMarkersTimeline() {
  const tl = gsap.timeline();
  const markers = document.querySelectorAll('.timeline-marker');

  markers.forEach((marker, i) => {
    tl.to(marker, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: 'spring',
    }, i * 1.5);
  });

  return tl;
}

// Crosshairs timeline
function createCrosshairsTimeline() {
  const tl = gsap.timeline();
  tl.to('#crosshairs', { opacity: 1, duration: 0.67, ease: 'power2.out' });
  return tl;
}

// Corner markers timeline
function createCornerMarkersTimeline() {
  const tl = gsap.timeline();
  const markers = document.querySelectorAll('.corner-marker');

  markers.forEach((marker, i) => {
    tl.to(marker, {
      opacity: 1,
      duration: 0.67,
      ease: 'power2.out',
    }, i * 0.17);
  });

  return tl;
}

// Layers timeline
function createLayersTimeline() {
  const tl = gsap.timeline();

  layerConfigs.forEach((config, i) => {
    const layer = document.getElementById(`layer-${i}`);
    tl.to(layer, {
      opacity: 1,
      duration: 0.5,
      ease: 'spring',
    }, config.startTime);
  });

  return tl;
}

// Callouts timeline
function createCalloutsTimeline() {
  const tl = gsap.timeline();
  const labels = ['Data Model', 'Business Logic', 'Interface', 'Integrations'];

  layerConfigs.forEach((config, i) => {
    const callout = document.getElementById(`callout-${i}`);
    const dot = callout.querySelector('.callout-dot');
    const connector = callout.querySelector('.callout-connector');
    const number = callout.querySelector('.callout-number');
    const label = callout.querySelector('.callout-label');
    const sublabel = callout.querySelector('.callout-sublabel');

    const startTime = config.startTime + 0.67;

    // Show callout
    tl.to(callout, { opacity: 1, duration: 0.1 }, startTime);

    // Dot appears
    tl.to(dot, { opacity: 1, duration: 0.3, ease: 'power2.out' }, startTime);

    // Line draws
    tl.to(connector, {
      attr: { x2: 126 },
      duration: 0.5,
      ease: 'power2.out',
    }, startTime);

    // Number badge fades in
    tl.to(number, { opacity: 1, duration: 0.5, ease: 'power2.out' }, startTime + 0.17);

    // Typewriter effect for label
    tl.add(() => {
      typewriterEffect(label, labels[i], 0.67);
    }, startTime + 0.5);

    // Sublabel fades in
    tl.to(sublabel, { opacity: 1, duration: 0.5, ease: 'power2.out' }, startTime + 0.83);
  });

  return tl;
}

// Collapse timeline
function createCollapseTimeline() {
  const tl = gsap.timeline();
  const centerY = CONFIG.height * CONFIG.centerY;

  layerConfigs.forEach((_, i) => {
    const layer = document.getElementById(`layer-${i}`);
    tl.to(layer, {
      top: `${centerY - 70}px`,
      duration: 1.67,
      ease: 'power2.inOut',
    }, 0);
  });

  return tl;
}

// Callouts fade timeline
function createCalloutsFadeTimeline() {
  const tl = gsap.timeline();
  const callouts = document.querySelectorAll('.callout');

  tl.to(callouts, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
  });

  return tl;
}

// Crosshairs fade timeline
function createCrosshairsFadeTimeline() {
  const tl = gsap.timeline();

  tl.to('#crosshairs', { opacity: 0, duration: 0.83, ease: 'power2.out' }, 0);
  tl.to('.corner-marker', { opacity: 0, duration: 0.83, ease: 'power2.out' }, 0);

  return tl;
}

// Layers fade timeline
function createLayersFadeTimeline() {
  const tl = gsap.timeline();

  tl.to('.isometric-layer', {
    opacity: 0,
    duration: 0.83,
    ease: 'power2.out',
  });

  return tl;
}

// Core Logo timeline
function createCoreLogoTimeline() {
  const tl = gsap.timeline();
  const logo = document.getElementById('core-logo');
  const circles = document.getElementById('logo-circles');
  const systemsText = document.getElementById('systems-text');
  const systemsCursor = document.getElementById('systems-cursor');
  const tagline = document.getElementById('tagline');

  // Phase 1: Logo appears with shutter flash (0-1s)
  tl.to(logo, { opacity: 1, scale: 1, duration: 0.5, ease: 'spring' }, 0);

  // Flicker effect
  tl.to(logo, { opacity: 0.3, duration: 0.1 }, 0.17);
  tl.to(logo, { opacity: 1, duration: 0.13 }, 0.27);
  tl.to(logo, { opacity: 0.2, duration: 0.07 }, 0.4);
  tl.to(logo, { opacity: 1, duration: 0.13 }, 0.47);
  tl.to(logo, { opacity: 0.4, duration: 0.07 }, 0.6);
  tl.to(logo, { opacity: 1, duration: 0.33 }, 0.67);

  // Phase 2: Circles fade out (1-1.67s)
  tl.to(circles, { opacity: 0, duration: 0.67, ease: 'power3.out' }, 1);

  // Phase 3: "Systems" typewriter (1.67-2.67s)
  tl.add(() => {
    typewriterEffect(systemsText, 'Systems', 1);
  }, 1.67);

  // Hide cursor after typing
  tl.to(systemsCursor, { opacity: 0, duration: 0.1 }, 2.83);

  // Phase 4: Tagline flash in (2.83-3.33s)
  tl.to(tagline, { opacity: 1, duration: 0.07 }, 2.83);
  tl.to(tagline, { opacity: 0.3, duration: 0.07 }, 2.9);
  tl.to(tagline, { opacity: 1, duration: 0.07 }, 2.97);
  tl.to(tagline, { opacity: 0.5, duration: 0.07 }, 3.03);
  tl.to(tagline, { opacity: 1, duration: 0.23 }, 3.1);

  // Phase 5: Pinch and snap (3.67-4s)
  tl.to(logo, {
    scale: 0,
    duration: 0.33,
    ease: 'power4.in',
  }, 3.67);

  return tl;
}

// Snap timeline (everything disappears)
function createSnapTimeline() {
  const tl = gsap.timeline();
  const snapOrigin = `${CONFIG.width * CONFIG.demLogoX}px ${CONFIG.height * CONFIG.demLogoY}px`;

  // Set transform origins
  gsap.set(['#grid', '#title', '#timeline-markers'], {
    transformOrigin: snapOrigin,
  });

  // Snap everything to center
  tl.to('#grid', {
    scale: 0,
    opacity: 0,
    duration: 0.33,
    ease: 'power4.in',
  }, 0);

  tl.to('#title', {
    scale: 0,
    opacity: 0,
    duration: 0.33,
    ease: 'power4.in',
  }, 0);

  tl.to('#timeline-markers', {
    scale: 0,
    opacity: 0,
    duration: 0.33,
    ease: 'power4.in',
  }, 0);

  return tl;
}

// Sentences timeline
function createSentencesTimeline() {
  const tl = gsap.timeline();
  const container = document.getElementById('sentences');
  const textEl = document.getElementById('sentence-text');
  const cursorEl = document.getElementById('sentence-cursor');

  // Show container
  tl.to(container, { opacity: 1, duration: 0.17 }, 0);

  let currentTime = 0;

  sentences.forEach((sentence, i) => {
    const typeDuration = sentence.typeEnd;
    const holdDuration = sentence.holdEnd - sentence.typeEnd;
    const deleteDuration = sentence.deleteEnd - sentence.holdEnd;

    // Type sentence
    tl.add(() => {
      typewriterEffect(textEl, sentence.text, typeDuration);
    }, currentTime);

    currentTime += typeDuration;

    // Hold
    if (holdDuration < 100) {
      currentTime += holdDuration;
    }

    // Delete (if not the last sentence)
    if (i < sentences.length - 1) {
      tl.add(() => {
        deleteEffect(textEl, deleteDuration);
      }, currentTime);
      currentTime += deleteDuration + 0.17; // Small gap between sentences
    }
  });

  // Hide cursor after last sentence
  tl.to(cursorEl, { opacity: 0, duration: 0.1 }, currentTime + 1);

  return tl;
}

// Typewriter effect helper
function typewriterEffect(element, text, duration) {
  const chars = text.length;
  const interval = (duration * 1000) / chars;
  let i = 0;

  element.textContent = '';

  const timer = setInterval(() => {
    if (i < chars) {
      element.textContent = text.slice(0, i + 1);
      i++;
    } else {
      clearInterval(timer);
    }
  }, interval);
}

// Delete effect helper
function deleteEffect(element, duration) {
  const text = element.textContent;
  const chars = text.length;
  const interval = (duration * 1000) / chars;
  let i = chars;

  const timer = setInterval(() => {
    if (i > 0) {
      element.textContent = text.slice(0, i - 1);
      i--;
    } else {
      clearInterval(timer);
    }
  }, interval);
}
