/**
 * Blueprint Machine - Core Logo Animations
 */

/**
 * Add core logo animations to master timeline
 */
function addLogoAnimations(masterTl) {
  const logo = document.getElementById('core-logo');
  const demText = logo.querySelector('.dem-text');
  const systemsText = document.getElementById('systems-text');
  const systemsCursor = document.getElementById('systems-cursor');
  const tagline = document.getElementById('tagline');

  const logoStart = frameToProgress(345);

  // DEM fade in with spring scale (frames 0-15 local)
  masterTl.to(logo, {
    opacity: 1,
    duration: frameToProgress(15),
    ease: 'power3.out'
  }, logoStart);

  masterTl.from(logo, {
    scale: 0,
    duration: frameToProgress(30),
    ease: 'spring12-100'
  }, logoStart);


  // "Systems" typewriter (frames 30-45 local)
  const systemsTypeStart = logoStart + frameToProgress(30);
  const systemsTypeEnd = logoStart + frameToProgress(45);

  const typewriterCalls = createTypewriterCalls(
    systemsText,
    'Systems',
    systemsTypeStart,
    systemsTypeEnd
  );

  typewriterCalls.forEach(({ progress, callback }) => {
    masterTl.call(callback, null, progress);
  });

  // Cursor visible during typing
  masterTl.to(systemsCursor, {
    opacity: 1,
    duration: 0.001
  }, systemsTypeStart);

  // Fast cursor blink during typing (frame/4 rhythm)
  const blinkInterval = frameToProgress(4);
  for (let p = systemsTypeStart; p < systemsTypeEnd; p += blinkInterval * 2) {
    masterTl.to(systemsCursor, { opacity: 1, duration: 0.001 }, p);
    masterTl.to(systemsCursor, { opacity: 0, duration: 0.001 }, p + blinkInterval);
  }

  // Cursor fade out (frames 50-55 local)
  masterTl.to(systemsCursor, {
    opacity: 0,
    duration: frameToProgress(5)
  }, logoStart + frameToProgress(50));

  // DEM shifts slightly as Systems types (frames 20-35 local)
  masterTl.to(demText, {
    x: -6,
    duration: frameToProgress(15),
    ease: 'power3.out'
  }, logoStart + frameToProgress(20));

  // Tagline flash (frames 65-80 local)
  addTaglineFlash(masterTl, tagline, logoStart);

  // Pinch-snap (frames 90-100 local)
  addLogoPinch(masterTl, logo, logoStart);
}

/**
 * Add tagline flash animation
 */
function addTaglineFlash(masterTl, tagline, logoStart) {
  // Tagline becomes visible at frame 65 local
  const flashStart = logoStart + frameToProgress(65);

  TAGLINE_FLASH_PATTERN.forEach(({ start, end, opacity }) => {
    const patternStart = logoStart + frameToProgress(start);
    const duration = frameToProgress(end - start);

    masterTl.to(tagline, {
      opacity: opacity,
      duration: duration,
      ease: 'none'
    }, patternStart);
  });

  // Tagline fades out before pinch (frames 90-95 local)
  masterTl.to(tagline, {
    opacity: 0,
    duration: frameToProgress(5)
  }, logoStart + frameToProgress(90));
}

/**
 * Add logo pinch-snap animation
 */
function addLogoPinch(masterTl, logo, logoStart) {
  // Pinch: frames 90-100 local (scale 1 -> 0 with expIn)
  const pinchStart = logoStart + frameToProgress(90);
  const pinchDuration = frameToProgress(10);

  masterTl.to(logo, {
    scale: 0,
    duration: pinchDuration,
    ease: 'expIn'
  }, pinchStart);

  // Hide logo after pinch
  masterTl.to(logo, {
    opacity: 0,
    duration: 0.001
  }, pinchStart + pinchDuration);
}
