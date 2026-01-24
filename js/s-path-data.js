/**
 * S Letter Path Data
 * Extracted control points for the WebGL rope to thread through
 * Coordinates normalized to -1 to 1 range for Three.js
 */

// The S letter path that the rope will follow through
// These points define the center-line path through the S curves
export const S_PATH_POINTS = [
  // Entry point - top of S (coming from tangled mass above)
  { x: 0.15, y: 0.08, z: 0 },

  // Upper curve of S (rope goes BEHIND these points)
  { x: 0.12, y: 0.05, z: -0.02 },   // Behind upper curve
  { x: 0.05, y: 0.02, z: -0.03 },
  { x: -0.02, y: 0.0, z: -0.02 },

  // Middle crossing point (rope comes to FRONT)
  { x: 0.0, y: -0.02, z: 0.02 },    // Transition to front
  { x: 0.05, y: -0.04, z: 0.03 },   // In front of middle

  // Lower curve of S (rope goes IN FRONT of these points)
  { x: 0.10, y: -0.06, z: 0.02 },
  { x: 0.15, y: -0.10, z: 0.01 },
  { x: 0.12, y: -0.14, z: 0.0 },

  // Exit point - bottom of S (heading to bottom-left)
  { x: 0.05, y: -0.16, z: 0 }
];

// Bounding box of the S letter in normalized coordinates
// Used for positioning the SVG overlay
export const S_BOUNDS = {
  x: -0.05,      // Left edge
  y: -0.18,      // Bottom edge
  width: 0.25,   // Total width
  height: 0.28,  // Total height
  centerX: 0.075,
  centerY: -0.04
};

// Z-depth values for layering
export const S_LAYERS = {
  back: -0.03,   // Rope passes behind at this z
  front: 0.03,   // Rope passes in front at this z
  transition: 0  // Middle crossing point
};

// SVG viewBox dimensions (for coordinate conversion)
export const SVG_VIEWBOX = {
  width: 100,
  height: 140,
  // Convert SVG coords to normalized Three.js coords
  toNormalized: (svgX, svgY) => ({
    x: (svgX / 100) * S_BOUNDS.width + S_BOUNDS.x,
    y: -((svgY / 140) * S_BOUNDS.height) - S_BOUNDS.y
  })
};

export default {
  S_PATH_POINTS,
  S_BOUNDS,
  S_LAYERS,
  SVG_VIEWBOX
};
