#!/usr/bin/env node
/**
 * Generate Scrollytelling Frames
 *
 * Creates 120 high-quality abstract frames for the About section:
 * - Phase 1 (0-39): S letterform fragmenting
 * - Phase 2 (40-79): Mesh network formation
 * - Phase 3 (80-119): Simplification to clarity
 *
 * Usage: node scripts/generate-frames.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  outputDir: path.join(__dirname, '../assets/frames/about'),
  totalFrames: 120,
  width: 960,
  height: 540,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Utility functions
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

// Seeded random for reproducibility
let seed = 12345;
function seededRandom() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function resetSeed(s = 12345) {
  seed = s;
}

/**
 * Generate S letterform points
 */
function generateSPoints(size, numPoints = 50) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // S-curve parametric equation
    const x = Math.sin(t * Math.PI * 2) * size * 0.35;
    const y = (t - 0.5) * size * 1.2;
    points.push({ x, y, t });
  }
  return points;
}

/**
 * Generate mesh network nodes
 */
function generateMeshNodes(size, count, spread = 1) {
  resetSeed(54321);
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + seededRandom() * 0.5;
    const radius = size * 0.3 * (0.4 + seededRandom() * 0.6) * spread;
    nodes.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      baseAngle: angle,
      baseRadius: radius,
    });
  }
  return nodes;
}

/**
 * Draw S letterform with fragmentation
 */
function drawSLetterform(ctx, centerX, centerY, size, fragmentation) {
  const points = generateSPoints(size);

  ctx.save();
  ctx.translate(centerX, centerY);

  // Main stroke - fades as fragmentation increases
  if (fragmentation < 0.7) {
    const strokeOpacity = Math.max(0, 1 - fragmentation * 1.5);
    ctx.strokeStyle = `rgba(0, 0, 0, ${strokeOpacity * 0.8})`;
    ctx.lineWidth = lerp(6, 2, fragmentation);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    points.forEach((p, i) => {
      // Add scatter based on fragmentation
      const scatter = fragmentation * size * 0.15;
      const offsetX = Math.sin(i * 0.7 + fragmentation * 8) * scatter;
      const offsetY = Math.cos(i * 0.9 + fragmentation * 6) * scatter;

      if (i === 0) {
        ctx.moveTo(p.x + offsetX, p.y + offsetY);
      } else {
        ctx.lineTo(p.x + offsetX, p.y + offsetY);
      }
    });
    ctx.stroke();
  }

  // Particle cloud - grows with fragmentation
  if (fragmentation > 0.2) {
    const particleOpacity = Math.min(1, (fragmentation - 0.2) * 2);
    const particleCount = Math.floor(30 * fragmentation);

    resetSeed(11111);
    for (let i = 0; i < particleCount; i++) {
      const basePoint = points[Math.floor(seededRandom() * points.length)];
      const scatter = size * 0.4 * fragmentation;
      const px = basePoint.x + (seededRandom() - 0.5) * scatter;
      const py = basePoint.y + (seededRandom() - 0.5) * scatter;
      const particleSize = 1.5 + seededRandom() * 2.5 * fragmentation;

      ctx.beginPath();
      ctx.arc(px, py, particleSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${particleOpacity * 0.4})`;
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Draw mesh network
 */
function drawMeshNetwork(ctx, centerX, centerY, size, density, simplification = 0) {
  const baseCount = 40;
  const nodeCount = Math.floor(baseCount * (1 - simplification * 0.6));
  const nodes = generateMeshNodes(size, nodeCount, 1 - simplification * 0.3);

  ctx.save();
  ctx.translate(centerX, centerY);

  // Connection threshold - decreases with simplification
  const connectionDist = size * lerp(0.45, 0.25, simplification);

  // Draw connections
  ctx.lineWidth = lerp(0.8, 1.5, simplification);

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < connectionDist) {
        const opacity = (1 - dist / connectionDist) * lerp(0.15, 0.25, simplification);
        ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  nodes.forEach((node, i) => {
    const nodeSize = lerp(2, 4, simplification) + (i % 3) * 0.5;
    const opacity = lerp(0.3, 0.5, simplification);

    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.fill();
  });

  // Central form at high simplification
  if (simplification > 0.6) {
    const formOpacity = (simplification - 0.6) / 0.4;
    ctx.strokeStyle = `rgba(0, 0, 0, ${formOpacity * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size * lerp(0.15, 0.1, simplification - 0.6), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw transition state (S to mesh)
 */
function drawTransition(ctx, centerX, centerY, size, transitionProgress) {
  // Blend between S fragments and mesh formation
  const sOpacity = Math.max(0, 1 - transitionProgress * 2);
  const meshOpacity = Math.min(1, transitionProgress * 1.5);

  ctx.save();

  // Fading S fragments
  if (sOpacity > 0) {
    ctx.globalAlpha = sOpacity;
    drawSLetterform(ctx, centerX, centerY, size, 0.9);
  }

  // Emerging mesh
  if (meshOpacity > 0) {
    ctx.globalAlpha = meshOpacity;
    drawMeshNetwork(ctx, centerX, centerY, size, transitionProgress, 0);
  }

  ctx.restore();
}

/**
 * Generate a single frame
 */
function generateFrame(frameIndex) {
  const canvas = createCanvas(CONFIG.width, CONFIG.height);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  const progress = frameIndex / (CONFIG.totalFrames - 1);
  const centerX = CONFIG.width / 2;
  const centerY = CONFIG.height / 2;
  const size = Math.min(CONFIG.width, CONFIG.height) * 0.7;

  // Phase 1: S letterform (0-39) - fragmentation 0 to 1
  // Phase 2: Transition (40-79) - S fades, mesh forms
  // Phase 3: Simplification (80-119) - mesh simplifies

  if (frameIndex < 40) {
    // Phase 1: S fragmentation
    const phaseProgress = frameIndex / 39;
    const fragmentation = easeOutCubic(phaseProgress);
    drawSLetterform(ctx, centerX, centerY, size, fragmentation);
  } else if (frameIndex < 80) {
    // Phase 2: Transition to mesh
    const phaseProgress = (frameIndex - 40) / 39;
    const easedProgress = easeInOutQuad(phaseProgress);
    drawTransition(ctx, centerX, centerY, size, easedProgress);
  } else {
    // Phase 3: Mesh simplification
    const phaseProgress = (frameIndex - 80) / 39;
    const simplification = easeOutExpo(phaseProgress);
    drawMeshNetwork(ctx, centerX, centerY, size, 1, simplification);
  }

  return canvas;
}

/**
 * Convert canvas to PNG buffer
 */
function canvasToPng(canvas) {
  return canvas.toBuffer('image/png');
}

/**
 * Main generation function
 */
async function main() {
  console.log(`Generating ${CONFIG.totalFrames} frames at ${CONFIG.width}x${CONFIG.height}...`);
  console.log(`Output: ${CONFIG.outputDir}`);
  console.log('');

  const startTime = Date.now();

  for (let i = 0; i < CONFIG.totalFrames; i++) {
    const canvas = generateFrame(i);
    const buffer = canvasToPng(canvas);
    const filename = `frame_${String(i).padStart(4, '0')}.png`;
    const filepath = path.join(CONFIG.outputDir, filename);

    fs.writeFileSync(filepath, buffer);

    // Progress indicator
    if ((i + 1) % 20 === 0 || i === CONFIG.totalFrames - 1) {
      const percent = Math.round((i + 1) / CONFIG.totalFrames * 100);
      console.log(`  [${percent}%] Generated frame ${i + 1}/${CONFIG.totalFrames}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log(`Done in ${elapsed}s`);

  // Calculate total size
  const files = fs.readdirSync(CONFIG.outputDir).filter(f => f.endsWith('.png'));
  let totalSize = 0;
  files.forEach(f => {
    totalSize += fs.statSync(path.join(CONFIG.outputDir, f)).size;
  });
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB (${files.length} files)`);

  // Update manifest
  const manifest = {
    version: '1.0',
    generated: new Date().toISOString(),
    totalFrames: CONFIG.totalFrames,
    fps: 30,
    duration: CONFIG.totalFrames / 30,
    dimensions: { width: CONFIG.width, height: CONFIG.height },
    format: 'png',
    basePath: '/assets/frames/about/',
    framePrefix: 'frame_',
    framePadding: 4,
    sections: [
      { name: 'p1', label: 'S Fragmentation', startFrame: 0, endFrame: 39 },
      { name: 'p2', label: 'Mesh Formation', startFrame: 40, endFrame: 79 },
      { name: 'p3', label: 'Clarity', startFrame: 80, endFrame: 119 },
    ],
    status: 'generated',
  };

  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('Updated manifest.json');
}

main().catch(console.error);
