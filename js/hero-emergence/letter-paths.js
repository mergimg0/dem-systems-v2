/**
 * Letter Path Extractor for Hero Text Emergence Animation
 * Uses Canvas Pixel Sampling to extract actual letterform positions
 * Shapes will form readable letters, not just clusters
 */

// Default configuration
const DEFAULT_CONFIG = {
  text: 'DEM Systems',
  fontFamily: 'Satoshi, sans-serif',
  fontWeight: '700',
  letterSpacing: -0.05, // Tighter tracking for display text (matches premium typography)
  samplingDensity: 2, // Sample every Nth pixel (lower = more points)
  minPointsPerLetter: 50,
  maxPointsPerLetter: 80,
};

/**
 * Create an offscreen canvas sized for text rendering
 */
function createTextCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Calculate font size based on container width
 * Matches hero title sizing
 */
export function calculateFontSize(containerWidth) {
  // Matches clamp(2.5rem, 6vw, 5rem) approximately
  const vwBased = containerWidth * 0.06;
  const minSize = 40;
  const maxSize = 80;
  return Math.max(minSize, Math.min(maxSize, vwBased));
}

/**
 * Render text to canvas and return context
 */
function renderTextToCanvas(text, fontSize, fontFamily, fontWeight) {
  // Create canvas with enough space
  const padding = 20;
  const estimatedWidth = text.length * fontSize * 0.7;
  const canvas = createTextCanvas(estimatedWidth + padding * 2, fontSize * 2);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Set font
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw text
  ctx.fillText(text, padding, canvas.height / 2);

  return { canvas, ctx, padding };
}

/**
 * Sample pixel data to find text pixel positions
 * Returns array of {x, y} coordinates where text exists
 */
function sampleTextPixels(ctx, width, height, samplingDensity = 2, alphaThreshold = 100) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const positions = [];

  // Sample every Nth pixel for performance
  for (let y = 0; y < height; y += samplingDensity) {
    for (let x = 0; x < width; x += samplingDensity) {
      const idx = (y * width + x) * 4;
      const alpha = pixels[idx + 3];

      // If pixel is part of text (non-transparent)
      if (alpha > alphaThreshold) {
        positions.push({ x, y, alpha });
      }
    }
  }

  return positions;
}

/**
 * Get letter boundaries by rendering each letter individually
 */
function getLetterBoundaries(text, fontSize, fontFamily, fontWeight) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  const boundaries = [];
  let currentX = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === ' ') {
      const spaceWidth = ctx.measureText(' ').width;
      // Apply tighter tracking for display typography
      const adjustedSpaceWidth = spaceWidth * (1 + DEFAULT_CONFIG.letterSpacing);
      boundaries.push({
        char,
        index: i,
        isSpace: true,
        startX: currentX,
        endX: currentX + adjustedSpaceWidth,
        width: adjustedSpaceWidth,
      });
      currentX += adjustedSpaceWidth;
    } else {
      const metrics = ctx.measureText(char);
      const width = metrics.width;
      // Apply tighter tracking for display typography
      const adjustedWidth = width * (1 + DEFAULT_CONFIG.letterSpacing);

      boundaries.push({
        char,
        index: i,
        isSpace: false,
        startX: currentX,
        endX: currentX + adjustedWidth,
        width: adjustedWidth,
      });
      currentX += adjustedWidth;
    }
  }

  return { boundaries, totalWidth: currentX };
}

/**
 * Assign sampled pixel positions to their respective letters
 */
function assignPositionsToLetters(positions, boundaries, padding) {
  const letterPositions = {};

  // Initialize empty arrays for each letter
  boundaries.forEach((b, idx) => {
    if (!b.isSpace) {
      letterPositions[idx] = [];
    }
  });

  // Assign each position to a letter based on X coordinate
  positions.forEach(pos => {
    const adjustedX = pos.x - padding; // Remove padding offset

    for (const boundary of boundaries) {
      if (!boundary.isSpace &&
          adjustedX >= boundary.startX &&
          adjustedX < boundary.endX) {
        letterPositions[boundary.index].push({
          x: pos.x,
          y: pos.y,
          localX: adjustedX - boundary.startX, // Position within letter
          alpha: pos.alpha,
        });
        break;
      }
    }
  });

  return letterPositions;
}

/**
 * Subsample positions to target count with even distribution
 * Ensures letters are well-defined without too many or too few points
 */
function subsamplePositions(positions, targetCount, seed = 0) {
  if (positions.length <= targetCount) {
    return positions;
  }

  // Sort by Y then X for consistent sampling
  const sorted = [...positions].sort((a, b) => {
    if (Math.abs(a.y - b.y) < 2) return a.x - b.x;
    return a.y - b.y;
  });

  // Use deterministic sampling with stride
  const stride = Math.max(1, Math.floor(sorted.length / targetCount));
  const sampled = [];

  // Pseudo-random offset based on seed
  const offset = Math.floor((Math.sin(seed) * 0.5 + 0.5) * stride);

  for (let i = offset; i < sorted.length && sampled.length < targetCount; i += stride) {
    sampled.push(sorted[i]);
  }

  // Fill remaining slots if needed
  if (sampled.length < targetCount) {
    for (let i = 0; i < sorted.length && sampled.length < targetCount; i++) {
      if (!sampled.includes(sorted[i])) {
        sampled.push(sorted[i]);
      }
    }
  }

  return sampled;
}

/**
 * Scale pixel positions to container coordinates
 */
function scaleToContainer(letterPositions, canvasHeight, containerBounds, fontSize, startX, centerY) {
  const scaledPositions = {};
  const scale = containerBounds.height / canvasHeight;

  for (const [letterIdx, positions] of Object.entries(letterPositions)) {
    scaledPositions[letterIdx] = positions.map(pos => ({
      x: pos.x * scale + startX,
      y: (pos.y - canvasHeight / 2) * scale + centerY,
    }));
  }

  return scaledPositions;
}

/**
 * Main extraction function - samples actual letter pixels
 * @param {HTMLElement} container - Container element for sizing reference
 * @param {Object} options - Configuration options
 * @returns {Object} Data structure with pixel-sampled positions per letter
 */
export async function extractLetterPaths(container, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  // Wait for fonts to load
  await document.fonts.ready;

  // Get container dimensions
  const containerRect = container.getBoundingClientRect();
  const containerWidth = containerRect.width || 800;
  const containerHeight = containerRect.height || 120;

  // Calculate responsive font size (use larger size for better sampling)
  const displayFontSize = calculateFontSize(containerWidth);
  const samplingFontSize = Math.max(displayFontSize, 60); // Min 60px for good sampling

  // Get letter boundaries
  const { boundaries, totalWidth } = getLetterBoundaries(
    config.text,
    samplingFontSize,
    config.fontFamily,
    config.fontWeight
  );

  // Render full text to canvas
  const { canvas, ctx, padding } = renderTextToCanvas(
    config.text,
    samplingFontSize,
    config.fontFamily,
    config.fontWeight
  );

  // Sample pixel positions
  const allPositions = sampleTextPixels(
    ctx,
    canvas.width,
    canvas.height,
    config.samplingDensity
  );

  // Assign positions to letters
  const rawLetterPositions = assignPositionsToLetters(allPositions, boundaries, padding);

  // Subsample each letter to target count
  const subsampledPositions = {};
  for (const [letterIdx, positions] of Object.entries(rawLetterPositions)) {
    const targetCount = Math.min(
      config.maxPointsPerLetter,
      Math.max(config.minPointsPerLetter, positions.length)
    );
    subsampledPositions[letterIdx] = subsamplePositions(
      positions,
      targetCount,
      parseInt(letterIdx) * 1000
    );
  }

  // Calculate centering offset
  const scale = containerHeight / canvas.height;
  const scaledTotalWidth = totalWidth * scale;
  const startX = (containerWidth - scaledTotalWidth) / 2;
  const centerY = containerHeight / 2;

  // Scale positions to container coordinates
  const letterPathsData = scaleToContainer(
    subsampledPositions,
    canvas.height,
    { width: containerWidth, height: containerHeight },
    displayFontSize,
    startX,
    centerY
  );

  // Debug logging
  console.log('[letter-paths] Pixel sampling complete:', {
    totalSampled: allPositions.length,
    lettersProcessed: Object.keys(letterPathsData).length,
    pointsPerLetter: Object.entries(letterPathsData).map(([k, v]) => `${config.text[k] || k}: ${v.length}`),
  });

  return {
    letterPathsData,
    containerBounds: {
      width: containerWidth,
      height: containerHeight,
    },
    fontSize: displayFontSize,
    totalLetters: boundaries.length,
    textWidth: scaledTotalWidth,
    startX,
    centerY,
    // Include boundaries for hover targeting
    letterBoundaries: boundaries.map((b, idx) => ({
      ...b,
      scaledStartX: b.startX * scale + startX,
      scaledEndX: b.endX * scale + startX,
      scaledWidth: b.width * scale,
    })),
  };
}

/**
 * Get letter bounds for hover targeting
 */
export function getLetterBounds(pathsData, text) {
  const bounds = [];

  for (let letterIndex = 0; letterIndex < text.length; letterIndex++) {
    const char = text[letterIndex];

    if (char === ' ') continue;

    const points = pathsData.letterPathsData[letterIndex];
    if (points && points.length > 0) {
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);

      bounds.push({
        char,
        letterIndex,
        minX: Math.min(...xs) - 5,
        maxX: Math.max(...xs) + 5,
        minY: Math.min(...ys) - 5,
        maxY: Math.max(...ys) + 5,
        centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
        centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
      });
    }
  }

  return bounds;
}

/**
 * Recalculate positions on resize
 */
export async function recalculateOnResize(container, options = {}) {
  return extractLetterPaths(container, options);
}

export default {
  extractLetterPaths,
  getLetterBounds,
  recalculateOnResize,
  calculateFontSize,
  DEFAULT_CONFIG,
};
