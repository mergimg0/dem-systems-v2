/**
 * Blueprint Machine - Grid Animations
 */

/**
 * Add grid animations to master timeline
 */
function addGridAnimations(masterTl) {
  const grid = document.getElementById('grid');
  const hLines = document.querySelectorAll('.h-line');
  const vLines = document.querySelectorAll('.v-line');

  // Grid container fade in (frames 0-30)
  masterTl.to(grid, {
    opacity: 1,
    duration: frameToProgress(30),
    ease: 'none'
  }, 0);

  // Horizontal lines draw from center (staggered)
  hLines.forEach((line, i) => {
    const staggerDelay = frameToProgress(i * 2);
    masterTl.to(line, {
      attr: {
        x1: 0,
        x2: CONFIG.width
      },
      duration: frameToProgress(30),
      ease: 'power2.out'
    }, staggerDelay);
  });

  // Vertical lines draw from center (staggered, after horizontal)
  vLines.forEach((line, i) => {
    const staggerDelay = frameToProgress(i * 2);
    masterTl.to(line, {
      attr: {
        y1: 0,
        y2: CONFIG.height
      },
      duration: frameToProgress(30),
      ease: 'power2.out'
    }, staggerDelay);
  });
}

/**
 * Add crosshairs animations to master timeline
 */
function addCrosshairsAnimations(masterTl) {
  const crosshairs = document.getElementById('crosshairs');

  // Crosshairs fade in (frames 40-60)
  masterTl.to(crosshairs, {
    opacity: 1,
    duration: frameToProgress(20),
    ease: 'power2.out'
  }, frameToProgress(40));
}

/**
 * Add corner markers animations to master timeline
 */
function addCornerMarkerAnimations(masterTl) {
  const corners = document.querySelectorAll('.corner-marker');

  // Corner markers fade in with stagger (frames 20-45)
  corners.forEach((corner, i) => {
    const staggerDelay = frameToProgress(20 + i * 5);
    masterTl.to(corner, {
      opacity: 1,
      duration: frameToProgress(15),
      ease: 'power2.out'
    }, staggerDelay);
  });
}

/**
 * Add title animations to master timeline
 */
function addTitleAnimations(masterTl) {
  const title = document.getElementById('title');

  // Title fade in (frames 30-50)
  masterTl.to(title, {
    opacity: 1,
    duration: frameToProgress(20),
    ease: 'power2.out'
  }, frameToProgress(30));
}

/**
 * Add grid snap-away animations (during collapse)
 */
function addGridSnapAnimations(masterTl) {
  const snapOrigin = getSnapOrigin();
  const snapStart = frameToProgress(290);
  const snapDuration = frameToProgress(25); // 290-315

  // Set transform origins
  ['#grid', '#title', '#timeline-markers', '#crosshairs'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) {
      gsap.set(el, { transformOrigin: snapOrigin });
    }
  });

  // Grid snaps away
  masterTl.to('#grid', {
    scale: 0,
    opacity: 0,
    duration: snapDuration,
    ease: 'expIn'
  }, snapStart);

  // Title snaps away
  masterTl.to('#title', {
    scale: 0,
    opacity: 0,
    duration: snapDuration,
    ease: 'expIn'
  }, snapStart);

  // Crosshairs snap away
  masterTl.to('#crosshairs', {
    scale: 0,
    opacity: 0,
    duration: snapDuration,
    ease: 'expIn'
  }, snapStart);

  // Corner markers snap away
  masterTl.to('.corner-marker', {
    scale: 0,
    opacity: 0,
    duration: snapDuration,
    ease: 'expIn'
  }, snapStart);
}
