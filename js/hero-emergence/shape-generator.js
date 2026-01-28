/**
 * Shape Generator for Hero Text Emergence Animation
 * Generates abstract shapes that will morph into "DEM Systems" letterforms
 * Updated for high-density pixel-sampled positions (50-80 shapes per letter)
 */

// Shape types for variety
const SHAPE_TYPES = ['circle', 'square', 'line', 'blob'];

// Shape type weights (circles and squares more common for density)
const SHAPE_WEIGHTS = {
  'circle': 0.45,
  'square': 0.35,
  'line': 0.1,
  'blob': 0.1,
};

// Motion personality per letter (from spec)
const MOTION_FEELS = {
  'D': 'organic',
  'E': 'mechanical',
  'M': 'fluid',
  'S': 'glitchy',
  'y': 'organic',
  's': 'fluid',
  't': 'mechanical',
  'e': 'organic',
  'm': 'fluid',
};

// Easing per motion feel (AnimeJS v4 syntax)
export const EASING_MAP = {
  'organic': 'outElastic(1, 0.5)',
  'mechanical': 'outExpo',
  'fluid': 'inOutQuad',
  'glitchy': 'steps(8)',
};

// Letter-specific easings
export const LETTER_EASINGS = {
  'D': 'outElastic(1, 0.5)',
  'E': 'outExpo',
  'M': 'inOutQuad',
  'S': 'steps(8)',
  'y': 'outBack(1.7)',
  's': 'inOutSine',
  't': 'outQuart',
  'e': 'outElastic(1, 0.6)',
  'm': 'inOutQuad',
};

// Seeded random for deterministic results
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate random value in range using seed
 */
function randomInRange(min, max, seed) {
  return min + seededRandom(seed) * (max - min);
}

/**
 * Get motion feel for a character
 */
export function getMotionFeel(char) {
  return MOTION_FEELS[char] || 'fluid';
}

/**
 * Get easing for a character
 */
export function getLetterEasing(char) {
  return LETTER_EASINGS[char] || EASING_MAP[getMotionFeel(char)];
}

/**
 * Generate a monochrome grayscale color with optional alpha
 */
function generateColor(seed, withAlpha = true) {
  const lightness = randomInRange(10, 45, seed);
  const alpha = withAlpha ? randomInRange(0.7, 0.95, seed + 100) : 1;
  return `hsla(0, 0%, ${Math.round(lightness)}%, ${alpha.toFixed(2)})`;
}

/**
 * Generate shape size based on type - sized for completely solid letterforms
 */
function generateSize(type, seed, densityFactor = 1) {
  // Base sizes optimized for solid, filled letterforms
  const base = {
    'circle': { min: 5, max: 14 },
    'square': { min: 4, max: 12 },
    'line': { min: 5, max: 12 },
    'blob': { min: 6, max: 16 },
  };
  const range = base[type] || { min: 5, max: 12 };

  // No scaling - keep shapes at full size for solid coverage
  return randomInRange(range.min, range.max, seed);
}

/**
 * Select shape type with weighted distribution
 */
function selectShapeType(seed) {
  const rand = seededRandom(seed);
  let cumulative = 0;

  for (const [type, weight] of Object.entries(SHAPE_WEIGHTS)) {
    cumulative += weight;
    if (rand < cumulative) return type;
  }

  return 'circle'; // Fallback
}

/**
 * Generate initial position with dramatic scatter from target
 * Creates the "chaos" that resolves into letters
 */
function generateInitialPosition(targetPos, letterIndex, shapeIndex, containerBounds) {
  const seed = letterIndex * 100 + shapeIndex;

  // Much larger scatter radius for dramatic "chaos to order" effect
  const baseRadius = 150;
  const verticalBias = 1.5; // More vertical scatter

  // Direction based on letter position (left letters scatter left, etc.)
  const leftBias = (targetPos.x < containerBounds.width / 2) ? -0.3 : 0.3;

  const offsetX = randomInRange(-baseRadius, baseRadius, seed) + (leftBias * baseRadius * seededRandom(seed + 5));
  const offsetY = randomInRange(-baseRadius * verticalBias, baseRadius * verticalBias, seed + 1);

  // Some shapes start further away for more dramatic entrance
  const distanceMultiplier = randomInRange(0.5, 1.5, seed + 10);

  // More rotation for initial chaos
  const rotation = randomInRange(-360, 360, seed + 2);

  // Varied initial scale - some tiny, some larger
  const scale = randomInRange(0.2, 1.5, seed + 3);

  return {
    x: Math.max(0, Math.min(containerBounds.width, targetPos.x + offsetX * distanceMultiplier)),
    y: Math.max(-50, Math.min(containerBounds.height + 50, targetPos.y + offsetY * distanceMultiplier)),
    rotation,
    scale,
  };
}

/**
 * Generate shapes for a single letter
 * @param {string} char - The letter character
 * @param {number} letterIndex - Index in the full text
 * @param {Array} targetPositions - Array of {x, y} positions from pixel sampling
 * @param {Object} containerBounds - Container dimensions
 * @returns {Array} Array of shape configuration objects
 */
export function generateShapesForLetter(char, letterIndex, targetPositions, containerBounds) {
  if (char === ' ') return [];
  if (!targetPositions || targetPositions.length === 0) return [];

  const shapesCount = targetPositions.length;
  const motionFeel = getMotionFeel(char);
  const shapes = [];

  // Calculate density factor for size scaling
  const densityFactor = shapesCount / 80; // Normalized to expected max

  for (let i = 0; i < shapesCount; i++) {
    const seed = letterIndex * 1000 + i;
    const type = selectShapeType(seed);
    const targetPos = targetPositions[i];
    const initialPos = generateInitialPosition(targetPos, letterIndex, i, containerBounds);

    shapes.push({
      id: `shape-${char}-${letterIndex}-${i}`,
      type,
      targetLetter: char,
      letterIndex,
      shapeIndex: i,
      initialPosition: initialPos,
      targetPosition: {
        x: targetPos.x,
        y: targetPos.y,
        rotation: 0,
        scale: 1,
      },
      motionFeel,
      color: generateColor(seed + 10),
      size: generateSize(type, seed + 20, densityFactor),
    });
  }

  return shapes;
}

/**
 * Generate all shapes for the full text
 * @param {string} text - The text to generate shapes for (e.g., "DEM Systems")
 * @param {Object} letterPathsData - Object with pixel-sampled positions per letter
 * @param {Object} containerBounds - Container dimensions
 * @returns {Array} Array of all shape configuration objects
 */
export function generateAllShapes(text, letterPathsData, containerBounds) {
  const allShapes = [];
  let letterIndex = 0;

  for (const char of text) {
    if (char === ' ') {
      letterIndex++;
      continue;
    }

    const targetPositions = letterPathsData[letterIndex] || [];
    const letterShapes = generateShapesForLetter(char, letterIndex, targetPositions, containerBounds);
    allShapes.push(...letterShapes);
    letterIndex++;
  }

  console.log('[shape-generator] Generated shapes:', {
    totalShapes: allShapes.length,
    byLetter: Object.entries(
      allShapes.reduce((acc, s) => {
        acc[s.targetLetter] = (acc[s.targetLetter] || 0) + 1;
        return acc;
      }, {})
    ).map(([k, v]) => `${k}: ${v}`).join(', '),
  });

  return allShapes;
}

/**
 * Group shapes by letter for hover effects
 */
export function groupShapesByLetter(shapes) {
  const groups = {};

  for (const shape of shapes) {
    const key = `${shape.targetLetter}-${shape.letterIndex}`;
    if (!groups[key]) {
      groups[key] = {
        char: shape.targetLetter,
        letterIndex: shape.letterIndex,
        shapes: [],
      };
    }
    groups[key].shapes.push(shape);
  }

  return Object.values(groups);
}

export default {
  generateShapesForLetter,
  generateAllShapes,
  groupShapesByLetter,
  getMotionFeel,
  getLetterEasing,
  EASING_MAP,
  LETTER_EASINGS,
  SHAPE_TYPES,
};
