/**
 * Blueprint Machine - ScrollTrigger Controller
 * Master timeline orchestration with scroll-based scrubbing
 */

let masterTimeline = null;
let scrollTriggerInstance = null;

/**
 * Create the master timeline with ScrollTrigger
 */
function createMasterTimeline() {
  // Create the master timeline
  masterTimeline = gsap.timeline({
    paused: true
  });

  // Add all animation phases in order
  // These functions add their animations to masterTimeline

  // Phase 1: Grid emergence (frames 0-60)
  addGridAnimations(masterTimeline);
  addCrosshairsAnimations(masterTimeline);
  addCornerMarkerAnimations(masterTimeline);
  addTitleAnimations(masterTimeline);

  // Phase 2: Timeline markers (frames 45-180)
  addMarkerAnimations(masterTimeline);

  // Phase 3: Progress pulses
  addPulseAnimations(masterTimeline);

  // Phase 4: Layer emergence (frames 60-220)
  addLayerAnimations(masterTimeline);

  // Phase 5: Callouts (frames 80-255)
  addCalloutAnimations(masterTimeline);

  // Phase 6: Collapse (frames 270-345)
  addLayerCollapseAnimations(masterTimeline);
  addGridSnapAnimations(masterTimeline);
  addMarkerSnapAnimations(masterTimeline);
  addCalloutFadeAnimations(masterTimeline);

  // Phase 7: Core logo (frames 345-445)
  addLogoAnimations(masterTimeline);

  // Phase 8: Sentences and arrow (frames 455-950)
  addSentenceAnimations(masterTimeline);

  // Add labels for snap points
  addSnapLabels(masterTimeline);

  return masterTimeline;
}

/**
 * Add labels at key animation points for snap functionality
 */
function addSnapLabels(tl) {
  tl.addLabel('start', 0);
  tl.addLabel('gridComplete', frameToProgress(60));
  tl.addLabel('allLayersVisible', frameToProgress(220));
  tl.addLabel('beforeCollapse', frameToProgress(270));
  tl.addLabel('collapseComplete', frameToProgress(345));
  tl.addLabel('logoComplete', frameToProgress(445));
  tl.addLabel('beforeSentences', frameToProgress(455));
  tl.addLabel('afterSentences', frameToProgress(680));
  tl.addLabel('ready', frameToProgress(705));
  tl.addLabel('end', 1);
}

/**
 * Initialize ScrollTrigger with the master timeline
 */
function initScrollTrigger() {
  const container = document.querySelector('.blueprint-scroll-container');

  if (!container) {
    console.error('Blueprint scroll container not found');
    return;
  }

  scrollTriggerInstance = ScrollTrigger.create({
    trigger: container,
    start: 'top top',
    end: '+=' + CONFIG.scrollDistance,
    scrub: CONFIG.scrubSmoothing,
    pin: true,
    anticipatePin: 1,
    animation: masterTimeline,
    snap: {
      snapTo: 'labels',
      duration: { min: 0.2, max: 0.5 },
      delay: 0,
      ease: 'power1.inOut'
    },
    onUpdate: (self) => {
      // Optional: track scroll progress
      // console.log('Progress:', self.progress.toFixed(3));
    },
    onEnter: () => {
      // Animation entered viewport
    },
    onLeave: () => {
      // Animation left viewport
    },
    onEnterBack: () => {
      // Scrolled back into animation
    },
    onLeaveBack: () => {
      // Scrolled back before animation
    }
  });

  return scrollTriggerInstance;
}

/**
 * Destroy and clean up ScrollTrigger
 */
function destroyScrollTrigger() {
  if (scrollTriggerInstance) {
    scrollTriggerInstance.kill();
    scrollTriggerInstance = null;
  }

  if (masterTimeline) {
    masterTimeline.kill();
    masterTimeline = null;
  }
}

/**
 * Refresh ScrollTrigger (call after resize)
 */
function refreshScrollTrigger() {
  ScrollTrigger.refresh();
}

/**
 * Get current scroll progress (0-1)
 */
function getScrollProgress() {
  return scrollTriggerInstance ? scrollTriggerInstance.progress : 0;
}

/**
 * Seek to a specific progress (0-1)
 * Useful for debugging
 */
function seekToProgress(progress) {
  if (masterTimeline) {
    masterTimeline.progress(progress);
  }
}

/**
 * Seek to a specific label
 * Useful for debugging
 */
function seekToLabel(label) {
  if (masterTimeline) {
    masterTimeline.seek(label);
  }
}
