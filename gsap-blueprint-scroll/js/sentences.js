/**
 * Blueprint Machine - Sentences and Arrow Animations
 */

/**
 * Add sentence animations to master timeline
 */
function addSentenceAnimations(masterTl) {
  const container = document.getElementById('sentences');
  const textEl = document.getElementById('sentence-text');
  const cursor = document.getElementById('sentence-cursor');

  // Local frame 110 = global frame 455
  const logoStart = frameToProgress(345);
  const sentencesStart = logoStart + frameToProgress(110);

  // Container fades in
  masterTl.to(container, {
    opacity: 1,
    duration: frameToProgress(5)
  }, sentencesStart);

  // Process each sentence
  let currentProgress = sentencesStart;

  SENTENCE_CONFIGS.forEach((config, index) => {
    const typeStart = logoStart + frameToProgress(config.typeStart);
    const typeEnd = logoStart + frameToProgress(config.typeEnd);
    const holdEnd = logoStart + frameToProgress(config.holdEnd);
    const deleteEnd = logoStart + frameToProgress(config.deleteEnd);

    // Typewriter (very fast - 4 frames!)
    const typewriterCalls = createTypewriterCalls(
      textEl,
      config.text,
      typeStart,
      typeEnd
    );

    typewriterCalls.forEach(({ progress, callback }) => {
      masterTl.call(callback, null, progress);
    });

    // Delete (if not last sentence that stays)
    if (index < SENTENCE_CONFIGS.length - 1) {
      const deleteCalls = createDeleteCalls(
        textEl,
        config.text,
        holdEnd,
        deleteEnd
      );

      deleteCalls.forEach(({ progress, callback }) => {
        masterTl.call(callback, null, progress);
      });
    }

    currentProgress = deleteEnd;
  });

  // Slow cursor blink during sentences (frame/15 = 1 second cycle)
  const blinkStart = sentencesStart;
  const blinkEnd = logoStart + frameToProgress(261); // Before "Ready?"

  for (let p = blinkStart; p < blinkEnd; p += frameToProgress(15)) {
    masterTl.to(cursor, { opacity: 1, duration: frameToProgress(7.5) }, p);
    masterTl.to(cursor, { opacity: 0, duration: frameToProgress(7.5) }, p + frameToProgress(7.5));
  }

  // Cursor blinks alone period (frames 261-306 local)
  const cursorBlinkStart = logoStart + frameToProgress(261);
  const readyStart = logoStart + frameToProgress(306);

  for (let p = cursorBlinkStart; p < readyStart; p += frameToProgress(15)) {
    masterTl.to(cursor, { opacity: 1, duration: frameToProgress(7.5) }, p);
    masterTl.to(cursor, { opacity: 0, duration: frameToProgress(7.5) }, p + frameToProgress(7.5));
  }

  // "Ready?" types slowly (frames 306-336 local, 30 frames for 6 chars)
  const readyTypeCalls = createTypewriterCalls(
    textEl,
    'Ready?',
    readyStart,
    logoStart + frameToProgress(336)
  );

  readyTypeCalls.forEach(({ progress, callback }) => {
    masterTl.call(callback, null, progress);
  });

  // Cursor fades out just before "?" appears (frames 333-335 local)
  masterTl.to(cursor, {
    opacity: 0,
    duration: frameToProgress(2)
  }, logoStart + frameToProgress(333));

  // Arrow animation
  addArrowAnimation(masterTl, logoStart);
}

/**
 * Add arrow animation to master timeline
 */
function addArrowAnimation(masterTl, logoStart) {
  const arrow = document.getElementById('ready-arrow');
  const stem = document.getElementById('arrow-stem');
  const head = document.getElementById('arrow-head');

  if (!arrow) return;

  // Arrow appears at frame 360 local
  const arrowStart = logoStart + frameToProgress(360);

  // Initialize arrow with GSAP-managed centering
  masterTl.set(arrow, { xPercent: -50, x: 0, y: 0 }, arrowStart);

  // Arrow fades in quickly (5 frames)
  masterTl.to(arrow, {
    opacity: 1,
    duration: frameToProgress(5),
    ease: 'power2.out'
  }, arrowStart);

  // Immediate explosive descent (starts at frame 365, runs 20 frames)
  const descentStart = arrowStart + frameToProgress(5);
  const descentDuration = frameToProgress(20);
  const descentDistance = CONFIG.height * 1.2 - 60; // Below viewport

  // Arrow head rockets down with quartic easing
  masterTl.to(head, {
    y: descentDistance,
    duration: descentDuration,
    ease: 'quartic'
  }, descentStart);

  // Stem stretches to follow arrowhead
  masterTl.to(stem, {
    attr: { y2: descentDistance + 28 },
    duration: descentDuration,
    ease: 'quartic'
  }, descentStart);
}
