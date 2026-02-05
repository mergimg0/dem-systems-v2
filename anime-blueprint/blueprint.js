/**
 * The Blueprint Machine - Anime.js Version
 * Ported from Remotion
 */

// Configuration
const CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  gridSpacing: 60,
  centerX: 0.315,
  centerY: 0.35,
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
  { label: 'Data Model', sublabel: 'PostgreSQL • Redis • S3', number: '01', startTime: 2000 },
  { label: 'Business Logic', sublabel: 'APIs • Workflows • Rules', number: '02', startTime: 3500 },
  { label: 'Interface', sublabel: 'React • Mobile • Dashboard', number: '03', startTime: 5000 },
  { label: 'Integrations', sublabel: 'Stripe • Auth • Analytics', number: '04', startTime: 6500 },
];

// Sentence configs
const sentences = [
  { text: '30 minutes to understand.', typeDuration: 830, holdDuration: 170, deleteDuration: 500 },
  { text: '24 hours to build.', typeDuration: 670, holdDuration: 160, deleteDuration: 370 },
  { text: '7 days to production.', typeDuration: 730, holdDuration: 99999, deleteDuration: 0 },
];

// Master timeline
let masterTimeline;

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

  for (let i = 0; i < horizontalCount; i++) {
    const y = i * CONFIG.gridSpacing;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', CONFIG.width / 2);
    line.setAttribute('y1', y);
    line.setAttribute('x2', CONFIG.width / 2);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'url(#navyGradientH)');
    line.setAttribute('stroke-width', '0.5');
    line.classList.add('grid-line', 'h-line');
    line.dataset.index = i;
    hLines.appendChild(line);
  }

  for (let i = 0; i < verticalCount; i++) {
    const x = i * CONFIG.gridSpacing;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', CONFIG.height / 2);
    line.setAttribute('x2', x);
    line.setAttribute('y2', CONFIG.height / 2);
    line.setAttribute('stroke', 'url(#navyGradientV)');
    line.setAttribute('stroke-width', '0.5');
    line.classList.add('grid-line', 'v-line');
    line.dataset.index = i + horizontalCount;
    vLines.appendChild(line);
  }
}

// Generate tick marks
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

// Position elements
function positionElements() {
  const markers = document.querySelectorAll('.timeline-marker');
  const markerYPositions = [0.35, 0.5, 0.65];
  markers.forEach((marker, i) => {
    marker.style.top = `${markerYPositions[i] * 100}%`;
    marker.style.transform = `translateY(-50%) translateX(-20px)`;
  });

  const callouts = document.querySelectorAll('.callout');
  const layerSpacing = 70;
  const centerY = CONFIG.height * CONFIG.centerY;
  callouts.forEach((callout, i) => {
    const layerY = centerY + (i - 1.5) * layerSpacing;
    callout.style.top = `${layerY + 125}px`;
  });
}

// Create master timeline using anime.js timeline
function createMasterTimeline() {
  masterTimeline = anime.timeline({
    easing: 'easeOutQuad',
    loop: true,
  });

  // Phase 1: Grid draws in (0-1000ms)
  addGridAnimations(masterTimeline);

  // Phase 2: Title fades in (1000-1700ms)
  masterTimeline.add({
    targets: '#title',
    opacity: [0, 1],
    duration: 670,
    easing: 'easeOutQuad',
  }, 1000);

  // Phase 3: Corner markers (700-1300ms)
  addCornerMarkerAnimations(masterTimeline);

  // Phase 4: Crosshairs (1300-2000ms)
  masterTimeline.add({
    targets: '#crosshairs',
    opacity: [0, 1],
    duration: 670,
    easing: 'easeOutQuad',
  }, 1300);

  // Phase 5: Timeline markers (1500-4000ms)
  addMarkerAnimations(masterTimeline);

  // Phase 6: Layers emerge (2000-6500ms)
  addLayerAnimations(masterTimeline);

  // Phase 7: Callouts (2670-8130ms)
  addCalloutAnimations(masterTimeline);

  // Phase 8: Collapse (9000-10670ms)
  addCollapseAnimation(masterTimeline);

  // Phase 9: Callouts fade (10000-10500ms)
  masterTimeline.add({
    targets: '.callout',
    opacity: 0,
    duration: 500,
    easing: 'easeOutQuad',
  }, 10000);

  // Phase 10: Crosshairs + corners fade (10700-11500ms)
  masterTimeline.add({
    targets: ['#crosshairs', '.corner-marker'],
    opacity: 0,
    duration: 830,
    easing: 'easeOutQuad',
  }, 10700);

  // Phase 11: Layers fade (10700-11500ms)
  masterTimeline.add({
    targets: '.isometric-layer',
    opacity: 0,
    duration: 830,
    easing: 'easeOutQuad',
  }, 10700);

  // Phase 12: Core Logo (11500-15500ms)
  addCoreLogoAnimation(masterTimeline);

  // Phase 13: Snap away (15200-15500ms)
  addSnapAnimation(masterTimeline);

  // Phase 14: Sentences (15800-20000ms)
  addSentenceAnimations(masterTimeline);
}

function addGridAnimations(tl) {
  // Fade in grid
  tl.add({
    targets: '#grid',
    opacity: [0, 1],
    duration: 1000,
    easing: 'easeOutQuad',
  }, 0);

  // Horizontal lines
  const hLines = document.querySelectorAll('.h-line');
  hLines.forEach((line, i) => {
    tl.add({
      targets: line,
      x1: [CONFIG.width / 2, 0],
      x2: [CONFIG.width / 2, CONFIG.width],
      duration: 1000,
      easing: 'easeOutQuad',
    }, i * 67);
  });

  // Vertical lines
  const vLines = document.querySelectorAll('.v-line');
  vLines.forEach((line, i) => {
    tl.add({
      targets: line,
      y1: [CONFIG.height / 2, 0],
      y2: [CONFIG.height / 2, CONFIG.height],
      duration: 1000,
      easing: 'easeOutQuad',
    }, (i + hLines.length) * 67);
  });
}

function addCornerMarkerAnimations(tl) {
  const markers = document.querySelectorAll('.corner-marker');
  markers.forEach((marker, i) => {
    tl.add({
      targets: marker,
      opacity: [0, 1],
      duration: 670,
      easing: 'easeOutQuad',
    }, 700 + i * 170);
  });
}

function addMarkerAnimations(tl) {
  const markers = document.querySelectorAll('.timeline-marker');
  markers.forEach((marker, i) => {
    tl.add({
      targets: marker,
      opacity: [0, 1],
      translateX: [-20, 0],
      duration: 500,
      easing: 'easeOutElastic(1, .8)',
    }, 1500 + i * 1500);
  });
}

function addLayerAnimations(tl) {
  layerConfigs.forEach((config, i) => {
    tl.add({
      targets: `#layer-${i}`,
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutElastic(1, .8)',
    }, config.startTime);
  });
}

function addCalloutAnimations(tl) {
  const labels = ['Data Model', 'Business Logic', 'Interface', 'Integrations'];

  layerConfigs.forEach((config, i) => {
    const startTime = config.startTime + 670;
    const callout = document.getElementById(`callout-${i}`);
    const dot = callout.querySelector('.callout-dot');
    const connector = callout.querySelector('.callout-connector');
    const number = callout.querySelector('.callout-number');
    const label = callout.querySelector('.callout-label');
    const sublabel = callout.querySelector('.callout-sublabel');

    // Show callout
    tl.add({
      targets: callout,
      opacity: [0, 1],
      duration: 100,
    }, startTime);

    // Dot appears
    tl.add({
      targets: dot,
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutQuad',
    }, startTime);

    // Line draws
    tl.add({
      targets: connector,
      x2: [6, 126],
      duration: 500,
      easing: 'easeOutQuad',
    }, startTime);

    // Number badge
    tl.add({
      targets: number,
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutQuad',
    }, startTime + 170);

    // Typewriter for label
    tl.add({
      targets: label,
      update: function(anim) {
        const progress = Math.round(anim.progress / 100 * labels[i].length);
        label.textContent = labels[i].slice(0, progress);
      },
      duration: 670,
      easing: 'linear',
    }, startTime + 500);

    // Sublabel
    tl.add({
      targets: sublabel,
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutQuad',
    }, startTime + 830);
  });
}

function addCollapseAnimation(tl) {
  const centerY = CONFIG.height * CONFIG.centerY;

  layerConfigs.forEach((_, i) => {
    tl.add({
      targets: `#layer-${i}`,
      top: `${centerY - 70}px`,
      duration: 1670,
      easing: 'easeInOutQuad',
    }, 9000);
  });
}

function addCoreLogoAnimation(tl) {
  const logo = document.getElementById('core-logo');
  const systemsText = document.getElementById('systems-text');
  const systemsCursor = document.getElementById('systems-cursor');
  const tagline = document.getElementById('tagline');
  const circles = document.getElementById('logo-circles');

  // Logo appears with spring
  tl.add({
    targets: logo,
    opacity: [0, 1],
    scale: [0.8, 1],
    duration: 500,
    easing: 'easeOutElastic(1, .8)',
  }, 11500);

  // Shutter flicker
  tl.add({ targets: logo, opacity: 0.3, duration: 100 }, 11670);
  tl.add({ targets: logo, opacity: 1, duration: 130 }, 11770);
  tl.add({ targets: logo, opacity: 0.2, duration: 70 }, 11900);
  tl.add({ targets: logo, opacity: 1, duration: 130 }, 11970);
  tl.add({ targets: logo, opacity: 0.4, duration: 70 }, 12100);
  tl.add({ targets: logo, opacity: 1, duration: 330 }, 12170);

  // Circles fade out
  tl.add({
    targets: circles,
    opacity: 0,
    duration: 670,
    easing: 'easeOutCubic',
  }, 12500);

  // "Systems" typewriter
  tl.add({
    targets: systemsText,
    update: function(anim) {
      const text = 'Systems';
      const progress = Math.round(anim.progress / 100 * text.length);
      systemsText.textContent = text.slice(0, progress);
    },
    duration: 1000,
    easing: 'linear',
  }, 13170);

  // Hide cursor
  tl.add({
    targets: systemsCursor,
    opacity: 0,
    duration: 100,
  }, 14330);

  // Tagline flash
  tl.add({ targets: tagline, opacity: 1, duration: 70 }, 14330);
  tl.add({ targets: tagline, opacity: 0.3, duration: 70 }, 14400);
  tl.add({ targets: tagline, opacity: 1, duration: 70 }, 14470);
  tl.add({ targets: tagline, opacity: 0.5, duration: 70 }, 14540);
  tl.add({ targets: tagline, opacity: 1, duration: 230 }, 14610);

  // Pinch and snap
  tl.add({
    targets: logo,
    scale: 0,
    duration: 330,
    easing: 'easeInExpo',
  }, 15170);
}

function addSnapAnimation(tl) {
  const snapOriginX = CONFIG.width * CONFIG.demLogoX;
  const snapOriginY = CONFIG.height * CONFIG.demLogoY;

  // Set transform origins via JS
  ['#grid', '#title', '#timeline-markers'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.style.transformOrigin = `${snapOriginX}px ${snapOriginY}px`;
  });

  tl.add({
    targets: '#grid',
    scale: 0,
    opacity: 0,
    duration: 330,
    easing: 'easeInExpo',
  }, 15200);

  tl.add({
    targets: '#title',
    scale: 0,
    opacity: 0,
    duration: 330,
    easing: 'easeInExpo',
  }, 15200);

  tl.add({
    targets: '#timeline-markers',
    scale: 0,
    opacity: 0,
    duration: 330,
    easing: 'easeInExpo',
  }, 15200);
}

function addSentenceAnimations(tl) {
  const container = document.getElementById('sentences');
  const textEl = document.getElementById('sentence-text');
  const cursorEl = document.getElementById('sentence-cursor');

  // Show container
  tl.add({
    targets: container,
    opacity: [0, 1],
    duration: 170,
  }, 15800);

  let currentTime = 15800;

  sentences.forEach((sentence, i) => {
    // Type
    tl.add({
      targets: textEl,
      update: function(anim) {
        const progress = Math.round(anim.progress / 100 * sentence.text.length);
        textEl.textContent = sentence.text.slice(0, progress);
      },
      duration: sentence.typeDuration,
      easing: 'linear',
    }, currentTime);

    currentTime += sentence.typeDuration + sentence.holdDuration;

    // Delete (if not last)
    if (i < sentences.length - 1) {
      tl.add({
        targets: textEl,
        update: function(anim) {
          const text = sentence.text;
          const remaining = Math.round((1 - anim.progress / 100) * text.length);
          textEl.textContent = text.slice(0, remaining);
        },
        duration: sentence.deleteDuration,
        easing: 'linear',
      }, currentTime);

      currentTime += sentence.deleteDuration + 170;
    }
  });

  // Hide cursor at end
  tl.add({
    targets: cursorEl,
    opacity: 0,
    duration: 100,
  }, currentTime + 1000);
}
