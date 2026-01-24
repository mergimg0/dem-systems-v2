/**
 * DEM Systems - WebGL Thread Animation
 * A 3D thread that untangles as the user scrolls
 * "Complexity to simplicity" visualized
 */

import * as THREE from 'three';

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isLowPerfDevice = isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

// =============================================================================
// CONFIGURATION (responsive to device capability)
// =============================================================================

const CONFIG = {
  // Rendering - reduced on mobile for performance
  tubeRadius: 0.008,
  tubeSegments: isLowPerfDevice ? 64 : 128,
  radialSegments: isLowPerfDevice ? 6 : 8,

  // Node count for rope path
  nodeCount: isLowPerfDevice ? 40 : 60,

  // Easing curves
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4)
};

// =============================================================================
// TENSION-SNAP EASING (shoelace pop effect)
// =============================================================================

function tensionSnapEase(t) {
  const tensionPhase = 0.7; // 70% tension buildup
  if (t < tensionPhase) {
    // Slow tension (ease-out-quad) - only 30% progress
    const p = t / tensionPhase;
    return p * (2 - p) * 0.3;
  } else {
    // Quick snap (ease-out-back with overshoot)
    const p = (t - tensionPhase) / (1 - tensionPhase);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 0.3 + (1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)) * 0.7;
  }
}

// =============================================================================
// ROPE LAYOUT CONFIGURATION
// =============================================================================

const ROPE_LAYOUT = {
  // Starting point (top anchor - above DEM Systems)
  start: new THREE.Vector3(0.0, -0.35, 0),

  // End point (bottom-left corner target)
  end: new THREE.Vector3(-0.7, 0.6, 0),

  // Tangle zone bounds (where knots will appear)
  tangleZone: {
    minX: -0.3,
    maxX: 0.3,
    minY: -0.55,
    maxY: -0.15,
    minZ: -0.1,
    maxZ: 0.1
  },

  // S-threading configuration (will be updated after font measurement)
  sThreading: {
    enabled: true,
    // Default values - will be overwritten by measureSPosition()
    sCenter: new THREE.Vector3(0.28, -0.02, 0),
    sWidth: 0.08,
    sHeight: 0.12,
    // Z-depth for threading illusion
    behindZ: -0.015,   // Rope goes behind upper curve
    frontZ: 0.015      // Rope goes in front of lower curve
  }
};

// =============================================================================
// S CHARACTER MEASUREMENT (for accurate threading position)
// =============================================================================

/**
 * Convert DOM coordinates to Three.js normalized coordinates
 * Assumes orthographic camera with frustumSize 1.5
 */
function domToThreeCoords(domX, domY) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Convert to normalized device coordinates (-1 to 1)
  // Then scale by frustum size / 2 to get Three.js world coordinates
  const frustumSize = 1.5;
  const aspect = width / height;

  const x = ((domX / width) * 2 - 1) * (frustumSize * aspect / 2);
  const y = (1 - (domY / height) * 2) * (frustumSize / 2);

  return { x, y };
}

/**
 * Measure the position of the "S" in "Systems" after font loads
 * Updates ROPE_LAYOUT.sThreading with accurate coordinates
 */
async function measureSPosition() {
  try {
    // Wait for fonts to load
    await document.fonts.ready;

    // Find the hero title element
    const heroTitle = document.getElementById('hero-title');
    if (!heroTitle) {
      console.warn('Hero title not found, using default S position');
      return;
    }

    // Get the text content and find the S position
    const text = heroTitle.textContent || '';
    const sIndex = text.indexOf('S');
    if (sIndex === -1) {
      console.warn('S character not found in hero title');
      return;
    }

    // Create a range to measure just the "S" character
    const range = document.createRange();
    const textNode = heroTitle.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      // If hero title has child elements, find the text node
      const walker = document.createTreeWalker(heroTitle, NodeFilter.SHOW_TEXT);
      let node;
      let charCount = 0;
      while ((node = walker.nextNode())) {
        const nodeText = node.textContent || '';
        if (charCount + nodeText.length > sIndex) {
          // Found the text node containing the S
          const localIndex = sIndex - charCount;
          range.setStart(node, localIndex);
          range.setEnd(node, localIndex + 1);
          break;
        }
        charCount += nodeText.length;
      }
    } else {
      range.setStart(textNode, sIndex);
      range.setEnd(textNode, sIndex + 1);
    }

    // Get the bounding rect of just the S character
    const rect = range.getBoundingClientRect();

    // Convert to Three.js coordinates
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const coords = domToThreeCoords(centerX, centerY);

    // Update the S-threading configuration
    ROPE_LAYOUT.sThreading.sCenter.set(coords.x, coords.y, 0);
    ROPE_LAYOUT.sThreading.sWidth = (rect.width / window.innerWidth) * 1.5 * (window.innerWidth / window.innerHeight);
    ROPE_LAYOUT.sThreading.sHeight = (rect.height / window.innerHeight) * 1.5;

    console.log('S position measured:', {
      dom: { x: centerX, y: centerY, width: rect.width, height: rect.height },
      three: { x: coords.x, y: coords.y },
      size: { width: ROPE_LAYOUT.sThreading.sWidth, height: ROPE_LAYOUT.sThreading.sHeight }
    });

  } catch (error) {
    console.warn('Failed to measure S position, using defaults:', error);
  }
}

// =============================================================================
// KNOT CONFIGURATION (5-7 deterministic knots, seed: 42)
// =============================================================================

const KNOTS = [
  {
    id: 'k1',
    position: { x: -0.15, y: -0.45, z: 0.03 },
    complexity: 2,  // Simple overhand
    scrollTrigger: { start: 0.08, end: 0.22 }
  },
  {
    id: 'k2',
    position: { x: 0.12, y: -0.38, z: -0.02 },
    complexity: 3,  // Figure-8
    scrollTrigger: { start: 0.15, end: 0.32 }
  },
  {
    id: 'k3',
    position: { x: -0.08, y: -0.28, z: 0.04 },
    complexity: 2,
    scrollTrigger: { start: 0.25, end: 0.42 }
  },
  {
    id: 'k4',
    position: { x: 0.2, y: -0.22, z: -0.03 },
    complexity: 4,  // Complex
    scrollTrigger: { start: 0.35, end: 0.55 }
  },
  {
    id: 'k5',
    position: { x: -0.05, y: -0.15, z: 0.02 },
    complexity: 2,
    scrollTrigger: { start: 0.45, end: 0.62 }
  },
  {
    id: 'k6',
    position: { x: 0.08, y: -0.05, z: -0.01 },
    complexity: 3,
    scrollTrigger: { start: 0.55, end: 0.72 }
  }
];

// =============================================================================
// KNOT GENERATION UTILITIES
// =============================================================================

/**
 * Seeded random number generator for deterministic knots
 */
function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Generate a single knot's loop points
 */
function generateKnotLoops(knot, random) {
  const points = [];
  const { position, complexity } = knot;
  const loops = Math.ceil(complexity * 0.8) + 1;
  const tightness = 0.025 + (complexity * 0.012);

  for (let i = 0; i < loops * 6; i++) {
    const angle = (i / (loops * 6)) * Math.PI * 2 * loops;
    const radius = tightness * (0.8 + random() * 0.4);
    const wobble = (random() - 0.5) * 0.008;

    points.push(new THREE.Vector3(
      position.x + Math.cos(angle) * radius + wobble,
      position.y + Math.sin(angle) * radius * 0.7 + wobble,
      position.z + Math.sin(angle * 1.5) * radius * 0.5
    ));
  }

  return points;
}

/**
 * Generate the complete tangled rope path with knots
 */
function generateTangledPath(nodeCount) {
  const random = seededRandom(42);
  const points = [];

  // Start point (anchor)
  points.push(ROPE_LAYOUT.start.clone());

  // Generate path through each knot
  KNOTS.forEach((knot, knotIndex) => {
    // Lead-in curve to knot
    const prevPoint = points[points.length - 1];
    const knotCenter = new THREE.Vector3(knot.position.x, knot.position.y, knot.position.z);

    // Add some connecting points with slight chaos
    const midPoint = new THREE.Vector3().lerpVectors(prevPoint, knotCenter, 0.5);
    midPoint.x += (random() - 0.5) * 0.08;
    midPoint.y += (random() - 0.5) * 0.06;
    midPoint.z += (random() - 0.5) * 0.04;
    points.push(midPoint);

    // Add knot loops
    const knotLoops = generateKnotLoops(knot, random);
    points.push(...knotLoops);
  });

  // Lead-out to end position area
  const lastKnotPos = new THREE.Vector3(
    KNOTS[KNOTS.length - 1].position.x,
    KNOTS[KNOTS.length - 1].position.y,
    KNOTS[KNOTS.length - 1].position.z
  );

  // Add some transitional points toward exit
  const exitMid1 = new THREE.Vector3().lerpVectors(lastKnotPos, ROPE_LAYOUT.end, 0.3);
  exitMid1.x += (random() - 0.5) * 0.05;
  points.push(exitMid1);

  const exitMid2 = new THREE.Vector3().lerpVectors(lastKnotPos, ROPE_LAYOUT.end, 0.6);
  points.push(exitMid2);

  // End point
  points.push(ROPE_LAYOUT.end.clone());

  // Resample to exact node count
  return resamplePath(points, nodeCount);
}

/**
 * Resample a path to a specific number of evenly-spaced points
 */
function resamplePath(points, targetCount) {
  if (points.length < 2) return points;

  // Calculate total path length
  let totalLength = 0;
  const segmentLengths = [];
  for (let i = 0; i < points.length - 1; i++) {
    const len = points[i].distanceTo(points[i + 1]);
    segmentLengths.push(len);
    totalLength += len;
  }

  // Generate evenly spaced points
  const resampled = [];
  const segmentLength = totalLength / (targetCount - 1);

  let currentDist = 0;
  let segmentIndex = 0;
  let distInSegment = 0;

  for (let i = 0; i < targetCount; i++) {
    const targetDist = i * segmentLength;

    // Find which segment this point falls in
    while (segmentIndex < segmentLengths.length - 1 &&
           currentDist + segmentLengths[segmentIndex] < targetDist) {
      currentDist += segmentLengths[segmentIndex];
      segmentIndex++;
    }

    // Interpolate within segment
    const segLen = segmentLengths[segmentIndex] || 0.001;
    const t = Math.min(1, (targetDist - currentDist) / segLen);

    const p1 = points[segmentIndex];
    const p2 = points[Math.min(segmentIndex + 1, points.length - 1)];

    resampled.push(new THREE.Vector3().lerpVectors(p1, p2, t));
  }

  return resampled;
}

/**
 * Thread Animation Class (Direct scroll-driven, no physics simulation)
 * Rope is static until scroll, then responds immediately
 */
class ThreadAnimation {
  constructor() {
    this.canvas = document.getElementById('thread-canvas');
    if (!this.canvas) {
      console.warn('Thread canvas not found');
      return;
    }

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.material = null;

    // Rope state (pre-computed positions)
    this.tangledPositions = null;
    this.straightPositions = null;
    this.knots = null;

    // Scroll state - DIRECT, no smoothing
    this.scrollProgress = 0;
    this.lastScrollProgress = -1;  // Force initial render
    this.isInitialized = false;

    // Skip animation for reduced motion - show straight rope
    if (prefersReducedMotion) {
      this.scrollProgress = 1;
    }

    this.init();
  }

  /**
   * Initialize Three.js scene
   */
  init() {
    // Create scene
    this.scene = new THREE.Scene();

    // Create orthographic camera (fixed, no perspective distortion)
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 1.5;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      100
    );
    this.camera.position.z = 5;

    // Create renderer with transparency
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Lighting for soft specular on black cord
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 3, 1);
    this.scene.add(directionalLight);

    // Create material (MeshPhysicalMaterial for premium look - cotton rope)
    this.material = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      roughness: 0.65,
      metalness: 0.0,
      clearcoat: 0.2,
      clearcoatRoughness: 0.4
    });

    // Pre-compute rope positions
    this.initRopePositions();

    // Create initial geometry
    this.updateGeometry();

    // Set up event listeners
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });

    this.isInitialized = true;

    // Initial render
    this.render();

    // Measure S position after fonts load (for accurate threading)
    this.measureSAndUpdate();

    // Start animation loop (only renders when scroll changes)
    this.animate();
  }

  /**
   * Measure S character position and update geometry if needed
   */
  async measureSAndUpdate() {
    await measureSPosition();
    // Force re-render with updated S position
    this.lastScrollProgress = -1;
  }

  /**
   * Pre-compute tangled and straight rope positions
   */
  initRopePositions() {
    const nodeCount = CONFIG.nodeCount;

    // Generate tangled positions with knots
    this.tangledPositions = generateTangledPath(nodeCount);

    // Generate straight line positions
    this.straightPositions = [];
    for (let i = 0; i < nodeCount; i++) {
      const t = i / (nodeCount - 1);
      const pos = new THREE.Vector3().lerpVectors(
        ROPE_LAYOUT.start,
        ROPE_LAYOUT.end,
        t
      );
      this.straightPositions.push(pos);
    }

    // Store knot data with scroll triggers
    this.knots = KNOTS.map(k => ({ ...k }));
  }

  /**
   * Get rope positions interpolated between tangled and straight based on scroll
   * Uses tension-snap easing for knot areas and S-threading z-depth
   */
  getRopePoints() {
    if (!this.tangledPositions || !this.straightPositions) {
      return [];
    }

    const points = [];
    const nodeCount = this.tangledPositions.length;
    const scroll = this.scrollProgress;
    const sConfig = ROPE_LAYOUT.sThreading;

    for (let i = 0; i < nodeCount; i++) {
      const tangled = this.tangledPositions[i];
      const straight = this.straightPositions[i];

      // Find which knot (if any) affects this node
      let nodeProgress = scroll;  // Default: linear with scroll

      // Check if this node is near any knot
      for (const knot of this.knots) {
        const knotCenter = new THREE.Vector3(knot.position.x, knot.position.y, knot.position.z);
        const distToKnot = tangled.distanceTo(knotCenter);
        const knotRadius = 0.12 + (knot.complexity * 0.03);

        if (distToKnot < knotRadius) {
          // This node is in a knot's influence zone
          const { start, end } = knot.scrollTrigger;

          if (scroll < start) {
            // Before knot's scroll range - stay tangled
            nodeProgress = 0;
          } else if (scroll >= end) {
            // After knot's scroll range - fully straight
            nodeProgress = 1;
          } else {
            // Within knot's scroll range - apply tension-snap easing
            const knotScrollProgress = (scroll - start) / (end - start);
            nodeProgress = tensionSnapEase(knotScrollProgress);
          }

          // Weight by distance to knot center (closer = more influenced)
          const influence = 1 - (distToKnot / knotRadius);
          nodeProgress = scroll * (1 - influence) + nodeProgress * influence;
          break;  // Only apply one knot's influence
        }
      }

      // Interpolate position
      const pos = new THREE.Vector3().lerpVectors(tangled, straight, nodeProgress);

      // Apply S-threading z-depth based on position relative to S character
      if (sConfig.enabled && nodeProgress > 0.5) {
        const sCenter = sConfig.sCenter;
        const distToS = Math.sqrt(
          Math.pow(pos.x - sCenter.x, 2) +
          Math.pow(pos.y - sCenter.y, 2)
        );

        // Only apply threading effect when rope is near the S
        if (distToS < sConfig.sWidth * 2) {
          // Upper part of S (y > sCenter.y) - rope goes behind
          // Lower part of S (y < sCenter.y) - rope goes in front
          const relativeY = pos.y - sCenter.y;
          const threadingInfluence = 1 - (distToS / (sConfig.sWidth * 2));

          if (relativeY > sConfig.sHeight * 0.2) {
            // Upper curve - go behind
            pos.z = sConfig.behindZ * threadingInfluence * nodeProgress;
          } else if (relativeY < -sConfig.sHeight * 0.2) {
            // Lower curve - go in front
            pos.z = sConfig.frontZ * threadingInfluence * nodeProgress;
          } else {
            // Middle transition - smooth blend
            const t = (relativeY + sConfig.sHeight * 0.2) / (sConfig.sHeight * 0.4);
            const zBlend = sConfig.frontZ + (sConfig.behindZ - sConfig.frontZ) * t;
            pos.z = zBlend * threadingInfluence * nodeProgress;
          }
        }
      }

      points.push(pos);
    }

    return points;
  }

  /**
   * Update geometry from current scroll position
   */
  updateGeometry() {
    const points = this.getRopePoints();

    if (points.length < 2) return;

    // Create smooth curve through points
    const curve = new THREE.CatmullRomCurve3(points);
    curve.tension = 0.3;

    // Create tube geometry along curve
    const geometry = new THREE.TubeGeometry(
      curve,
      CONFIG.tubeSegments,
      CONFIG.tubeRadius,
      CONFIG.radialSegments,
      false
    );

    // If mesh exists, update geometry; otherwise create new mesh
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
    } else {
      this.mesh = new THREE.Mesh(geometry, this.material);
      this.scene.add(this.mesh);
    }
  }

  /**
   * Handle scroll events - IMMEDIATE response, no smoothing
   */
  onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = Math.min(1, Math.max(0, scrollTop / docHeight));
  }

  /**
   * Handle window resize
   */
  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 1.5;

    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Re-measure S position after resize
    this.measureSAndUpdate();

    this.render();
  }

  /**
   * Animation loop - only updates when scroll position changes
   * NO physics, NO smoothing, NO breathing - just direct scroll response
   */
  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Only update if scroll position changed
    if (this.scrollProgress !== this.lastScrollProgress) {
      this.lastScrollProgress = this.scrollProgress;
      this.updateGeometry();
      this.render();
    }
  }

  /**
   * Render the scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
      this.scene.remove(this.mesh);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
  }
}

// Initialize when DOM is ready
let threadAnimation = null;

function initThread() {
  threadAnimation = new ThreadAnimation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThread);
} else {
  initThread();
}

export { threadAnimation };
