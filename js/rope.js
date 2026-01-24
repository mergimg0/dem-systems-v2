/**
 * DEM Systems - Advanced Rope Animation
 * A 3D rope with knots that untangles as the user scrolls
 * "Complexity to simplicity" - chaos to order
 */

import * as THREE from 'three';
import { S_PATH_POINTS, S_BOUNDS, S_LAYERS } from './s-path-data.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Rope appearance
  baseRadius: 0.006,
  radiusVariation: 0.3,      // 30% variation based on tension
  tubeSegments: 256,         // Higher for smoother rope
  radialSegments: 8,

  // Knot settings
  upperTangleKnots: 18,      // Knots in upper tangle zone
  diagonalKnots: 10,         // Knots in diagonal path
  knotComplexityRange: [1, 5],

  // Animation
  tensionPhaseRatio: 0.65,   // 65% tension buildup, 35% pop
  smoothingFactor: 0.06,     // Lerp speed for scroll following

  // Bounds (normalized coordinates)
  upperTangle: {
    top: -0.55,
    bottom: 0.12,
    left: -0.35,
    right: 0.35,
    centerY: -0.2
  },
  diagonalPath: {
    startY: -0.18,
    endY: 0.55,
    startX: 0.0,
    endX: -0.65
  },
  finalPoint: { x: -0.7, y: 0.6, z: 0 }
};

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

function easeOutQuad(t) {
  return t * (2 - t);
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

// Tension-pop curve for knot unraveling
function knotEase(t, complexity) {
  const tensionDuration = CONFIG.tensionPhaseRatio + (complexity * 0.02);
  const clampedTension = Math.min(tensionDuration, 0.85);

  if (t < clampedTension) {
    // Slow tension buildup - knot resists
    return easeOutQuad(t / clampedTension) * 0.35;
  } else {
    // Quick pop release
    const popT = (t - clampedTension) / (1 - clampedTension);
    return 0.35 + easeOutBack(popT) * 0.65;
  }
}

// =============================================================================
// KNOT GENERATION
// =============================================================================

/**
 * Generate a procedural knot shape
 */
function generateKnotShape(complexity, seed) {
  const points = [];
  const loops = Math.ceil(complexity * 0.8) + 1;
  const tightness = 0.015 + (complexity * 0.008);

  // Seeded random for reproducibility
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < loops * 4; i++) {
    const angle = (i / (loops * 4)) * Math.PI * 2 * loops;
    const radius = tightness * (1 + random() * 0.5);
    const wobble = random() * 0.005;

    points.push({
      x: Math.cos(angle) * radius + wobble,
      y: Math.sin(angle) * radius * 0.6 + wobble,
      z: Math.sin(angle * 2) * radius * 0.4
    });
  }

  return points;
}

/**
 * Generate all knots for the rope
 */
function generateKnots() {
  const knots = [];
  let seed = 12345;

  // Upper tangle zone knots (15-20)
  for (let i = 0; i < CONFIG.upperTangleKnots; i++) {
    seed += i * 7;
    const complexity = 1 + Math.floor((seed % 100) / 100 * 4);

    // Position within upper tangle bounds
    const t = i / (CONFIG.upperTangleKnots - 1);
    const row = Math.floor(i / 5);
    const col = i % 5;

    const baseX = CONFIG.upperTangle.left + (col / 4) * (CONFIG.upperTangle.right - CONFIG.upperTangle.left);
    const baseY = CONFIG.upperTangle.top + (row / 3) * (CONFIG.upperTangle.bottom - CONFIG.upperTangle.top);

    // Add some randomness
    seed = (seed * 9301 + 49297) % 233280;
    const offsetX = ((seed / 233280) - 0.5) * 0.08;
    seed = (seed * 9301 + 49297) % 233280;
    const offsetY = ((seed / 233280) - 0.5) * 0.06;

    knots.push({
      id: `upper-${i}`,
      type: complexity <= 2 ? 'simple' : complexity <= 3 ? 'single' : complexity <= 4 ? 'double' : 'complex',
      complexity,
      position: {
        x: baseX + offsetX,
        y: baseY + offsetY,
        z: ((seed % 100) / 100 - 0.5) * 0.04
      },
      scrollRange: {
        start: 0.05 + (i / CONFIG.upperTangleKnots) * 0.35,
        end: 0.15 + (i / CONFIG.upperTangleKnots) * 0.40
      },
      localPoints: generateKnotShape(complexity, seed + i * 100),
      state: 'tangled'
    });
  }

  // Diagonal path knots (8-12)
  for (let i = 0; i < CONFIG.diagonalKnots; i++) {
    seed += i * 13;
    const complexity = 1 + Math.floor((seed % 100) / 100 * 3); // Slightly simpler

    const t = i / (CONFIG.diagonalKnots - 1);
    const baseX = CONFIG.diagonalPath.startX + t * (CONFIG.diagonalPath.endX - CONFIG.diagonalPath.startX);
    const baseY = CONFIG.diagonalPath.startY + t * (CONFIG.diagonalPath.endY - CONFIG.diagonalPath.startY);

    seed = (seed * 9301 + 49297) % 233280;
    const offsetX = ((seed / 233280) - 0.5) * 0.06;
    seed = (seed * 9301 + 49297) % 233280;
    const offsetY = ((seed / 233280) - 0.5) * 0.04;

    knots.push({
      id: `diagonal-${i}`,
      type: complexity <= 2 ? 'simple' : complexity <= 3 ? 'single' : 'double',
      complexity,
      position: {
        x: baseX + offsetX,
        y: baseY + offsetY,
        z: ((seed % 100) / 100 - 0.5) * 0.02
      },
      scrollRange: {
        start: 0.45 + (i / CONFIG.diagonalKnots) * 0.35,
        end: 0.55 + (i / CONFIG.diagonalKnots) * 0.40
      },
      localPoints: generateKnotShape(complexity, seed + i * 200),
      state: 'tangled'
    });
  }

  return knots;
}

// =============================================================================
// ROPE PATH GENERATION
// =============================================================================

/**
 * Generate the complete rope path with knots integrated
 */
function generateRopePath(knots, scrollProgress) {
  const points = [];

  // Sort knots by their position along the intended path
  const upperKnots = knots.filter(k => k.id.startsWith('upper-'));
  const diagonalKnots = knots.filter(k => k.id.startsWith('diagonal-'));

  // === SECTION 1: Upper Tangle ===
  // Start point (top of viewport)
  points.push(new THREE.Vector3(-0.1, CONFIG.upperTangle.top - 0.1, 0));

  // Weave through upper knots
  upperKnots.forEach((knot, index) => {
    const knotProgress = getKnotProgress(knot, scrollProgress);
    const knotPoints = getKnotPathPoints(knot, knotProgress);
    points.push(...knotPoints);
  });

  // === SECTION 2: Transition to S ===
  // Lead into the S letter
  points.push(new THREE.Vector3(0.1, 0.1, 0));

  // === SECTION 3: Thread through S ===
  S_PATH_POINTS.forEach(p => {
    points.push(new THREE.Vector3(p.x, p.y, p.z));
  });

  // === SECTION 4: Exit from S to diagonal ===
  points.push(new THREE.Vector3(-0.05, -0.2, 0));

  // === SECTION 5: Diagonal path with knots ===
  diagonalKnots.forEach((knot, index) => {
    const knotProgress = getKnotProgress(knot, scrollProgress);
    const knotPoints = getKnotPathPoints(knot, knotProgress);
    points.push(...knotPoints);
  });

  // === SECTION 6: Final straight to bottom-left ===
  points.push(new THREE.Vector3(CONFIG.finalPoint.x, CONFIG.finalPoint.y, CONFIG.finalPoint.z));

  return points;
}

/**
 * Calculate how much a knot has unraveled based on scroll
 */
function getKnotProgress(knot, scrollProgress) {
  const { start, end } = knot.scrollRange;

  if (scrollProgress <= start) {
    return 0; // Still fully tangled
  } else if (scrollProgress >= end) {
    return 1; // Fully unraveled
  } else {
    const rawProgress = (scrollProgress - start) / (end - start);
    return knotEase(rawProgress, knot.complexity);
  }
}

/**
 * Get the path points for a knot at a given unravel progress
 */
function getKnotPathPoints(knot, progress) {
  const points = [];
  const { position, localPoints, complexity } = knot;

  if (progress >= 0.98) {
    // Fully unraveled - just the center point
    points.push(new THREE.Vector3(position.x, position.y, position.z));
  } else if (progress <= 0.02) {
    // Fully tangled - all local knot points
    localPoints.forEach(lp => {
      points.push(new THREE.Vector3(
        position.x + lp.x,
        position.y + lp.y,
        position.z + lp.z
      ));
    });
  } else {
    // Partially unraveled - interpolate
    const numPoints = Math.max(1, Math.ceil(localPoints.length * (1 - progress)));

    for (let i = 0; i < numPoints; i++) {
      const lp = localPoints[i];
      const localProgress = progress * (1 + i / localPoints.length * 0.5);
      const scale = 1 - Math.min(1, localProgress);

      points.push(new THREE.Vector3(
        position.x + lp.x * scale,
        position.y + lp.y * scale,
        position.z + lp.z * scale
      ));
    }
  }

  return points;
}

/**
 * Calculate rope radius at a point based on tension
 */
function calculateRadius(baseRadius, tensionFactor) {
  const minRadius = baseRadius * (1 - CONFIG.radiusVariation);
  const maxRadius = baseRadius * (1 + CONFIG.radiusVariation * 0.6);
  return maxRadius - (maxRadius - minRadius) * tensionFactor;
}

// =============================================================================
// ROPE ANIMATION CLASS
// =============================================================================

class RopeAnimation {
  constructor() {
    this.canvas = document.getElementById('thread-canvas');
    if (!this.canvas) {
      console.warn('Rope canvas not found');
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.material = null;
    this.knots = [];
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.isInitialized = false;

    // Check for reduced motion
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.prefersReducedMotion) {
      this.targetProgress = 1;
      this.currentProgress = 1;
    }

    this.init();
  }

  init() {
    // Generate knots
    this.knots = generateKnots();

    // Create scene
    this.scene = new THREE.Scene();

    // Orthographic camera
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 1.8;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      100
    );
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 3, 2);
    this.scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-1, -1, -1);
    this.scene.add(backLight);

    // Material
    this.material = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      roughness: 0.4,
      metalness: 0.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2
    });

    // Initial geometry
    this.updateGeometry();

    // Event listeners
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });

    this.isInitialized = true;
    this.animate();
  }

  updateGeometry() {
    // Generate path points
    const pathPoints = generateRopePath(this.knots, this.currentProgress);

    if (pathPoints.length < 2) return;

    // Create smooth curve
    const curve = new THREE.CatmullRomCurve3(pathPoints);
    curve.tension = 0.3;

    // Create tube geometry
    const geometry = new THREE.TubeGeometry(
      curve,
      CONFIG.tubeSegments,
      CONFIG.baseRadius,
      CONFIG.radialSegments,
      false
    );

    // Update or create mesh
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
    } else {
      this.mesh = new THREE.Mesh(geometry, this.material);
      this.scene.add(this.mesh);
    }
  }

  onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.targetProgress = Math.min(1, Math.max(0, scrollTop / docHeight));
  }

  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 1.8;

    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.render();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.targetProgress - this.currentProgress;

    if (Math.abs(delta) > 0.0005) {
      this.currentProgress += delta * CONFIG.smoothingFactor;
      this.updateGeometry();
      this.render();
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

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

// =============================================================================
// INITIALIZATION
// =============================================================================

let ropeAnimation = null;

function initRope() {
  ropeAnimation = new RopeAnimation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRope);
} else {
  initRope();
}

export { ropeAnimation, CONFIG };
