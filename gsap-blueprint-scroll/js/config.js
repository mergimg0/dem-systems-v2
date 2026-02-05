/**
 * Blueprint Machine - GSAP ScrollTrigger Configuration
 * Converted from Remotion implementation
 */

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, CustomEase);

// ============================================================================
// CUSTOM EASING CURVES
// ============================================================================

// Spring: damping 15, stiffness 80 (~15% overshoot)
// Used for layer emergence
CustomEase.create("spring15-80", "M0,0 C0.12,0.8 0.25,1.1 0.5,1 0.75,0.95 0.85,1 1,1");

// Spring: damping 12, stiffness 100 (~18% overshoot, snappier)
// Used for CoreLogo appearance
CustomEase.create("spring12-100", "M0,0 C0.1,0.85 0.2,1.15 0.45,1 0.7,0.92 0.85,1 1,1");

// Exponential in - aggressive acceleration (for pinch snap)
CustomEase.create("expIn", "M0,0 C0.7,0 0.9,0.3 1,1");

// Quartic easing for arrow descent (t^4)
CustomEase.create("quartic", "M0,0 C0.42,0 0.58,0.01 0.72,0.06 0.86,0.18 0.94,0.52 1,1");

// ============================================================================
// CANVAS CONFIGURATION
// ============================================================================

const CONFIG = {
  // Canvas dimensions (Remotion native)
  width: 1920,
  height: 1080,
  fps: 30,
  totalFrames: 950,

  // Grid
  gridSpacing: 60,

  // Positions (percentages of dimensions)
  centerX: 0.355,      // Layer center X (681.6px)
  centerY: 0.5,        // Layer center Y (540px - crosshairs center)
  demLogoX: 0.50,      // Logo X (960px - true center)
  demLogoY: 0.5,       // Logo Y (540px - true center)
  calloutX: 0.647,     // Callout X (1242.24px)

  // Spacing
  layerSpacing: 70,    // Exploded view spacing between layers

  // Timeline marker Y positions
  markerY: [0.35, 0.5, 0.65],

  // Crosshairs
  crosshairX1: 0.34,   // 652.8px
  crosshairX2: 0.64,   // 1228.8px
  crosshairVerticalX: 0.49, // 940.8px

  // ScrollTrigger - base values (may be adjusted for mobile in getScrollConfig())
  scrollDistance: '200%', // 2 viewport heights of scroll
  scrubSmoothing: 1,      // 1 second smoothing

  // Get responsive scroll config based on viewport
  getScrollConfig: function() {
    const width = window.innerWidth;
    if (width <= 480) {
      return { scrollDistance: '120%', scrubSmoothing: 0.3 };
    } else if (width <= 768) {
      return { scrollDistance: '150%', scrubSmoothing: 0.5 };
    } else if (width <= 1024) {
      return { scrollDistance: '180%', scrubSmoothing: 0.8 };
    }
    return { scrollDistance: this.scrollDistance, scrubSmoothing: this.scrubSmoothing };
  }

  // Snap points (scroll percentages where animation pauses)
  snapPoints: [
    0,        // Start
    0.063,    // Grid complete
    0.253,    // All layers visible
    0.284,    // Before collapse
    0.363,    // Collapse complete
    0.468,    // Logo complete
    0.495,    // Before sentences
    0.75,     // After sentences
    1         // End
  ]
};

// ============================================================================
// LAYER CONFIGURATIONS
// ============================================================================

const LAYER_CONFIGS = [
  {
    id: 'layer-0',
    startFrame: 60,
    label: 'Data Model',
    sublabel: 'PostgreSQL \u2022 Redis \u2022 S3',
    number: '01'
  },
  {
    id: 'layer-1',
    startFrame: 105,
    label: 'Business Logic',
    sublabel: 'APIs \u2022 Workflows \u2022 Rules',
    number: '02'
  },
  {
    id: 'layer-2',
    startFrame: 195,
    label: 'Interface',
    sublabel: 'React \u2022 Mobile \u2022 Dashboard',
    number: '04'
  },
  {
    id: 'layer-3',
    startFrame: 150,
    label: 'Integrations',
    sublabel: 'Stripe \u2022 Auth \u2022 Analytics',
    number: '03'
  }
];

// ============================================================================
// TIMELINE MARKER CONFIGURATIONS
// ============================================================================

const MARKER_CONFIGS = [
  { frame: 45, label: '30 min', sublabel: 'Discovery', y: CONFIG.markerY[0] },
  { frame: 100, label: '24 hours', sublabel: 'V1 Build', y: CONFIG.markerY[1] },
  { frame: 180, label: '7 days', sublabel: 'Production', y: CONFIG.markerY[2] }
];

// ============================================================================
// PROGRESS PULSE CONFIGURATIONS
// ============================================================================

const PULSE_CONFIGS = [
  { trigger: 45, duration: 15, targetLayer: 0 },
  { trigger: 100, duration: 12, targetLayer: 1 },
  { trigger: 140, duration: 12, targetLayer: 2 },
  { trigger: 180, duration: 15, targetLayer: 3 },
  { trigger: 250, duration: 20, targetLayer: 3 } // Collapse trigger
];

// ============================================================================
// SENTENCE CONFIGURATIONS
// ============================================================================

const SENTENCE_CONFIGS = [
  {
    text: '30 minutes to understand.',
    typeStart: 110,
    typeEnd: 114,
    holdEnd: 153,
    deleteEnd: 157
  },
  {
    text: '24 hours to build.',
    typeStart: 162,
    typeEnd: 166,
    holdEnd: 205,
    deleteEnd: 209
  },
  {
    text: '7 days to production.',
    typeStart: 214,
    typeEnd: 218,
    holdEnd: 257,
    deleteEnd: 261
  }
];

// ============================================================================
// TAGLINE FLASH PATTERN
// ============================================================================

const TAGLINE_FLASH_PATTERN = [
  { start: 65, end: 67, opacity: 1 },
  { start: 67, end: 69, opacity: 0.3 },
  { start: 69, end: 71, opacity: 1 },
  { start: 71, end: 73, opacity: 0.5 },
  { start: 73, end: 80, opacity: 1 }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert frame number to scroll progress (0-1)
 */
function frameToProgress(frame) {
  return frame / CONFIG.totalFrames;
}

/**
 * Convert scroll progress to duration (for GSAP timeline)
 */
function framesToDuration(frames) {
  return frames / CONFIG.totalFrames;
}

/**
 * Get layer Y position during collapse
 */
function getLayerY(index, collapseProgress = 0) {
  const centerY = CONFIG.height * CONFIG.centerY;
  const explodedY = centerY + (index - 1.5) * CONFIG.layerSpacing;
  return explodedY + (centerY - explodedY) * collapseProgress;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    LAYER_CONFIGS,
    MARKER_CONFIGS,
    PULSE_CONFIGS,
    SENTENCE_CONFIGS,
    TAGLINE_FLASH_PATTERN,
    frameToProgress,
    framesToDuration,
    getLayerY
  };
}
