/**
 * Blueprint Machine - Timeline Marker Animations
 */

/**
 * Add timeline marker animations to master timeline
 */
function addMarkerAnimations(masterTl) {
  MARKER_CONFIGS.forEach((config, index) => {
    const marker = document.getElementById(`marker-${index}`);
    if (!marker) return;

    const startProgress = frameToProgress(config.frame);

    // Marker appears with spring (slide in from left)
    masterTl.to(marker, {
      opacity: 1,
      x: 0,
      duration: frameToProgress(25),
      ease: 'spring15-80'
    }, startProgress);
  });
}

/**
 * Add timeline markers snap-away animations (during collapse)
 */
function addMarkerSnapAnimations(masterTl) {
  const snapOrigin = getSnapOrigin();
  const snapStart = frameToProgress(290);
  const snapDuration = frameToProgress(25);

  // Set transform origin for markers container
  const markersContainer = document.getElementById('timeline-markers');
  if (markersContainer) {
    gsap.set(markersContainer, { transformOrigin: snapOrigin });
  }

  // Markers snap away
  masterTl.to('#timeline-markers', {
    scale: 0,
    opacity: 0,
    duration: snapDuration,
    ease: 'expIn'
  }, snapStart);
}
