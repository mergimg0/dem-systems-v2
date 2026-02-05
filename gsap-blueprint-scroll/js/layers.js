/**
 * Blueprint Machine - Layer Animations
 */

/**
 * Add layer emergence animations to master timeline
 */
function addLayerAnimations(masterTl) {
  // Sort configs by startFrame to know the order of appearance
  const sortedConfigs = [...LAYER_CONFIGS].sort((a, b) => a.startFrame - b.startFrame);

  // Map layer IDs to crosshair segment classes
  // Segments match layer diamond Y coverage
  const layerCrosshairMap = {
    'layer-2': 'crosshair-v-layer2',  // Interface (345-525)
    'layer-3': 'crosshair-v-layer3',  // Integrations (525-595)
    'layer-1': 'crosshair-v-layer1',  // Business Logic (595-665)
    'layer-0': 'crosshair-v-layer0'   // Data Model (665-735)
  };

  // Fade horizontal center segment when the first layer covering y=540 appears
  // Layer coverage (center ±90px): layer-0: 555-735, layer-1: 485-665, layer-2: 345-525, layer-3: 415-595
  // Only layer-1 (Business Logic) and layer-3 (Integrations) cover y=540
  // layer-1 fires at frame 105, layer-3 fires at frame 150 → layer-1 is first
  const layersCoveringHorizontal = sortedConfigs.filter(config => {
    const layerY = {
      'layer-0': 645,  // coverage: 555-735
      'layer-1': 575,  // coverage: 485-665 — covers 540
      'layer-2': 435,  // coverage: 345-525
      'layer-3': 505   // coverage: 415-595 — covers 540
    };
    const center = layerY[config.id];
    return center - 90 <= 540 && center + 90 >= 540;
  });

  if (layersCoveringHorizontal.length > 0) {
    const firstCoveringLayer = layersCoveringHorizontal[0]; // Already sorted by startFrame
    const hCenterFadeStart = frameToProgress(firstCoveringLayer.startFrame);
    const hCenter = document.querySelector('.crosshair-h-center');
    if (hCenter) {
      masterTl.to(hCenter, {
        strokeOpacity: 0.05,
        duration: frameToProgress(20),
        ease: 'power2.out'
      }, hCenterFadeStart);
    }
  }

  LAYER_CONFIGS.forEach((config, index) => {
    const layer = document.getElementById(config.id);
    if (!layer) return;

    const startProgress = frameToProgress(config.startFrame);

    // Layer opacity fade in (15 frames)
    masterTl.to(layer, {
      opacity: 1,
      duration: frameToProgress(15),
      ease: 'none'
    }, startProgress);

    // Layer scale and position with spring
    masterTl.from(layer, {
      scale: 0.8,
      y: '+=30',
      duration: frameToProgress(50), // Spring settles over ~50 frames
      ease: 'spring15-80'
    }, startProgress);

    // Fade previous layers' internals AND strokes to 5% when this layer appears above them
    sortedConfigs.forEach((prevConfig) => {
      if (prevConfig.startFrame < config.startFrame) {
        const prevLayer = document.getElementById(prevConfig.id);
        if (!prevLayer) return;

        // Fade internals
        const prevInternals = prevLayer.querySelector('.layer-internals');
        if (prevInternals) {
          masterTl.to(prevInternals, {
            opacity: 0.05,
            duration: frameToProgress(20),
            ease: 'power2.out'
          }, startProgress);
        }

        // Fade the layer base stroke (diamond perimeter)
        const prevBase = prevLayer.querySelector('.layer-base');
        if (prevBase) {
          masterTl.to(prevBase, {
            strokeOpacity: 0.05,
            duration: frameToProgress(20),
            ease: 'power2.out'
          }, startProgress);
        }

        // Fade corner circles
        const prevCorners = prevLayer.querySelectorAll('.layer-corner');
        prevCorners.forEach(corner => {
          masterTl.to(corner, {
            opacity: 0.05,
            duration: frameToProgress(20),
            ease: 'power2.out'
          }, startProgress);
        });
      }
    });

    // Fade the corresponding vertical crosshair segment when this layer appears
    const crosshairSegmentClass = layerCrosshairMap[config.id];
    if (crosshairSegmentClass) {
      const segment = document.querySelector(`.${crosshairSegmentClass}`);
      if (segment) {
        masterTl.to(segment, {
          strokeOpacity: 0.05,
          duration: frameToProgress(20),
          ease: 'power2.out'
        }, startProgress);
      }
    }
  });
}

/**
 * Add layer collapse animations to master timeline
 */
function addLayerCollapseAnimations(masterTl) {
  const collapseStart = frameToProgress(270);
  const collapseEnd = frameToProgress(320);
  const collapseDuration = collapseEnd - collapseStart;

  const centerY = CONFIG.height * CONFIG.centerY;

  // Move all layers to center (use actual CSS position)
  LAYER_CONFIGS.forEach((config, index) => {
    const layer = document.getElementById(config.id);
    if (!layer) return;

    // Get actual top position from inline style
    const currentTop = parseInt(layer.style.top) || 0;
    const targetY = centerY - currentTop;

    masterTl.to(layer, {
      y: targetY,
      duration: collapseDuration,
      ease: 'power2.inOut'
    }, collapseStart);

    // Fade layer internals at 50% collapse
    const internals = layer.querySelector('.layer-internals');
    if (internals) {
      masterTl.to(internals, {
        opacity: 0,
        duration: collapseDuration * 0.5,
        ease: 'none'
      }, collapseStart);
    }
  });

  // Layers fade out completely (frames 320-345)
  const fadeStart = frameToProgress(320);
  const fadeDuration = frameToProgress(25);

  masterTl.to('.isometric-layer', {
    opacity: 0,
    duration: fadeDuration,
    ease: 'none'
  }, fadeStart);
}
