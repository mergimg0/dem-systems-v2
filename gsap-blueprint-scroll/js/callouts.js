/**
 * Blueprint Machine - Callout Animations
 */

/**
 * Add callout animations to master timeline
 */
function addCalloutAnimations(masterTl) {
  const labels = ['Data Model', 'Business Logic', 'Interface', 'Integrations'];

  LAYER_CONFIGS.forEach((config, index) => {
    const callout = document.getElementById(`callout-${index}`);
    if (!callout) return;

    // Callout starts 20 frames after layer
    const startFrame = config.startFrame + 20;
    const startProgress = frameToProgress(startFrame);

    const dot = callout.querySelector('.callout-dot');
    const line = callout.querySelector('.callout-line');
    const number = callout.querySelector('.callout-number');
    const label = callout.querySelector('.callout-label');
    const cursor = callout.querySelector('.callout-cursor');
    const sublabel = callout.querySelector('.callout-sublabel');

    // Show callout container
    masterTl.to(callout, {
      opacity: 1,
      duration: 0.001
    }, startProgress);

    // Dot appears (15 frames)
    masterTl.to(dot, {
      opacity: 1,
      duration: frameToProgress(15),
      ease: 'power2.out'
    }, startProgress);

    // Line draws (15 frames)
    masterTl.to(line, {
      attr: { x2: 126 },
      duration: frameToProgress(15),
      ease: 'power2.out'
    }, startProgress);

    // Number badge (starts +5 frames)
    masterTl.to(number, {
      opacity: 1,
      duration: frameToProgress(15),
      ease: 'power2.out'
    }, startProgress + frameToProgress(5));

    // Label typewriter (starts +15 frames, 20 frames duration)
    const typewriterCalls = createTypewriterCalls(
      label,
      labels[index],
      startProgress + frameToProgress(15),
      startProgress + frameToProgress(35)
    );

    typewriterCalls.forEach(({ progress, callback }) => {
      masterTl.call(callback, null, progress);
    });

    // Cursor blink during typing
    masterTl.to(cursor, {
      opacity: 1,
      duration: 0.001
    }, startProgress + frameToProgress(15));

    // Create blinking effect with keyframes during type period
    const typeStart = startProgress + frameToProgress(15);
    const typeEnd = startProgress + frameToProgress(35);
    const blinkInterval = frameToProgress(4); // Fast blink

    for (let p = typeStart; p < typeEnd; p += blinkInterval * 2) {
      masterTl.to(cursor, { opacity: 1, duration: 0.001 }, p);
      masterTl.to(cursor, { opacity: 0, duration: 0.001 }, p + blinkInterval);
    }

    // Hide cursor after typing
    masterTl.to(cursor, {
      opacity: 0,
      duration: frameToProgress(5)
    }, startProgress + frameToProgress(40));

    // Sublabel fade (starts +40 frames)
    masterTl.to(sublabel, {
      opacity: 1,
      duration: frameToProgress(15),
      ease: 'power2.out'
    }, startProgress + frameToProgress(40));
  });
}

/**
 * Add callout fade-out animations (during collapse)
 */
function addCalloutFadeAnimations(masterTl) {
  const snapStart = frameToProgress(290);
  const snapDuration = frameToProgress(25);

  masterTl.to('.callout', {
    opacity: 0,
    duration: snapDuration,
    ease: 'none'
  }, snapStart);
}
