/**
 * Blueprint Machine - Progress Pulse Animations
 */

/**
 * Add progress pulse animations to master timeline
 */
function addPulseAnimations(masterTl) {
  PULSE_CONFIGS.forEach((config, index) => {
    const pulse = document.getElementById(`pulse-${index}`);
    if (!pulse) return;

    const startProgress = frameToProgress(config.trigger);
    const durationProgress = frameToProgress(config.duration);
    const endPos = getPulseEndPosition(index);

    const trail = pulse.querySelector('.pulse-trail');
    const glow = pulse.querySelector('.pulse-glow');
    const core = pulse.querySelector('.pulse-core');
    const impact = pulse.querySelector('.pulse-impact');

    // Show pulse
    masterTl.to(pulse, {
      opacity: 1,
      duration: 0.001
    }, startProgress);

    // Pulse core travels
    masterTl.to(core, {
      attr: { cx: endPos.x, cy: endPos.y },
      duration: durationProgress,
      ease: 'power3.out'
    }, startProgress);

    // Glow travels with core
    masterTl.to(glow, {
      attr: { cx: endPos.x, cy: endPos.y },
      duration: durationProgress,
      ease: 'power3.out'
    }, startProgress);

    // Glow expands then contracts
    masterTl.fromTo(glow, {
      attr: { r: 0 }
    }, {
      attr: { r: 18 },
      duration: durationProgress * 0.33,
      ease: 'power2.out'
    }, startProgress);

    masterTl.to(glow, {
      attr: { r: 12 },
      duration: durationProgress * 0.67,
      ease: 'power2.out'
    }, startProgress + durationProgress * 0.33);

    // Trail line draws (60% of duration)
    masterTl.to(trail, {
      attr: { x2: endPos.x, y2: endPos.y },
      duration: durationProgress * 0.6,
      ease: 'power2.out'
    }, startProgress);

    // Trail fades in second half
    masterTl.to(trail, {
      opacity: 0,
      duration: durationProgress * 0.5
    }, startProgress + durationProgress * 0.5);

    // Impact burst at end - animate radii directly to avoid position drift
    const impactStart = startProgress + durationProgress - frameToProgress(5);
    const outerCircle = impact.querySelector('circle:first-child');
    const innerCircle = impact.querySelector('circle:last-child');

    // Fade in
    masterTl.to(impact, {
      opacity: 0.8,
      duration: frameToProgress(15),
      ease: 'power2.out'
    }, impactStart);

    // Grow circles (1x → 1.5x)
    masterTl.to(outerCircle, {
      attr: { r: 45 },
      duration: frameToProgress(15),
      ease: 'power2.out'
    }, impactStart);
    masterTl.to(innerCircle, {
      attr: { r: 22.5 },
      duration: frameToProgress(15),
      ease: 'power2.out'
    }, impactStart);

    // Fade out and grow more (1.5x → 2x)
    masterTl.to(impact, {
      opacity: 0,
      duration: frameToProgress(10),
      ease: 'power2.out'
    }, impactStart + frameToProgress(8));
    masterTl.to(outerCircle, {
      attr: { r: 60 },
      duration: frameToProgress(10),
      ease: 'power2.out'
    }, impactStart + frameToProgress(8));
    masterTl.to(innerCircle, {
      attr: { r: 30 },
      duration: frameToProgress(10),
      ease: 'power2.out'
    }, impactStart + frameToProgress(8));

    // Hide pulse after animation completes
    masterTl.to(pulse, {
      opacity: 0,
      duration: 0.001
    }, startProgress + durationProgress + frameToProgress(20));
  });
}
