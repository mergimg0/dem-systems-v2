/**
 * Generate Placeholder Frames for Development
 *
 * Creates simple canvas-based WebP frames for testing the scrollytelling
 * system before real frames are generated with the scrollytelling agent.
 *
 * Usage: node scripts/generate-placeholder-frames.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const CONFIG = {
  outputDir: path.join(__dirname, '../assets/frames/about'),
  totalFrames: 120,
  width: 960,
  height: 540,
  format: 'png', // Node canvas doesn't support WebP natively
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Interpolate between two values
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Easing function (ease out cubic)
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Draw S letterform
 */
function drawS(ctx, x, y, size, progress, fragmentation) {
  ctx.save();
  ctx.translate(x, y);

  const segments = 20;
  const points = [];

  // Generate S curve points
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const px = Math.sin(t * Math.PI * 2) * size * 0.3;
    const py = (t - 0.5) * size;

    // Apply fragmentation
    const scatter = fragmentation * 50;
    const fx = px + (Math.random() - 0.5) * scatter;
    const fy = py + (Math.random() - 0.5) * scatter;

    points.push({ x: fx, y: fy, opacity: 1 - fragmentation * 0.5 });
  }

  // Draw points/lines
  ctx.strokeStyle = `rgba(0, 0, 0, ${1 - fragmentation * 0.3})`;
  ctx.lineWidth = lerp(8, 2, fragmentation);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (fragmentation < 0.5) {
    // Draw as connected path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  } else {
    // Draw as scattered points
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, lerp(4, 2, fragmentation), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${p.opacity})`;
      ctx.fill();
    });
  }

  ctx.restore();
}

/**
 * Draw network mesh
 */
function drawMesh(ctx, x, y, size, density, simplification) {
  ctx.save();
  ctx.translate(x, y);

  const nodeCount = Math.floor(lerp(30, 8, simplification));
  const nodes = [];

  // Generate node positions
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const radius = size * 0.4 * (0.5 + Math.random() * 0.5);
    nodes.push({
      x: Math.cos(angle) * radius * (1 - simplification * 0.3),
      y: Math.sin(angle) * radius * (1 - simplification * 0.3),
    });
  }

  // Draw connections
  ctx.strokeStyle = `rgba(0, 0, 0, ${lerp(0.2, 0.4, simplification)})`;
  ctx.lineWidth = 1;

  const connectionThreshold = lerp(size * 0.5, size * 0.8, simplification);

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < connectionThreshold) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  ctx.fillStyle = '#000';
  nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, lerp(3, 5, simplification), 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

/**
 * Generate a single frame
 */
function generateFrame(frameIndex, totalFrames) {
  const canvas = createCanvas(CONFIG.width, CONFIG.height);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  const progress = frameIndex / (totalFrames - 1);
  const centerX = CONFIG.width / 2;
  const centerY = CONFIG.height / 2;
  const size = Math.min(CONFIG.width, CONFIG.height) * 0.6;

  // Phase 1: S letterform (0-33%)
  // Phase 2: Transition to mesh (33-66%)
  // Phase 3: Mesh simplification (66-100%)

  if (progress < 0.33) {
    // Phase 1: S with increasing fragmentation
    const phaseProgress = progress / 0.33;
    const fragmentation = easeOutCubic(phaseProgress) * 0.8;
    drawS(ctx, centerX, centerY, size, phaseProgress, fragmentation);
  } else if (progress < 0.66) {
    // Phase 2: Mesh formation
    const phaseProgress = (progress - 0.33) / 0.33;
    const density = easeOutCubic(phaseProgress);

    // Fade out S remnants
    if (phaseProgress < 0.3) {
      const sOpacity = 1 - phaseProgress / 0.3;
      ctx.globalAlpha = sOpacity * 0.3;
      drawS(ctx, centerX, centerY, size, 1, 0.8);
      ctx.globalAlpha = 1;
    }

    // Draw mesh
    drawMesh(ctx, centerX, centerY, size, density, 0);
  } else {
    // Phase 3: Mesh simplification
    const phaseProgress = (progress - 0.66) / 0.34;
    const simplification = easeOutCubic(phaseProgress);
    drawMesh(ctx, centerX, centerY, size, 1, simplification);
  }

  // Add frame number (debug)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.font = '12px monospace';
  ctx.fillText(`Frame ${frameIndex}/${totalFrames - 1}`, 10, 20);

  return canvas;
}

/**
 * Main generation function
 */
async function generateAllFrames() {
  console.log(`Generating ${CONFIG.totalFrames} placeholder frames...`);

  for (let i = 0; i < CONFIG.totalFrames; i++) {
    const canvas = generateFrame(i, CONFIG.totalFrames);
    const filename = `frame_${String(i).padStart(4, '0')}.${CONFIG.format}`;
    const filepath = path.join(CONFIG.outputDir, filename);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);

    if ((i + 1) % 20 === 0) {
      console.log(`  Generated ${i + 1}/${CONFIG.totalFrames} frames`);
    }
  }

  console.log(`Done! Frames saved to ${CONFIG.outputDir}`);
  console.log('\nNote: These are placeholder frames. For production, use:');
  console.log('  cd /Users/jungmergs/scrollytelling && python -m src.agent');
}

// Run
generateAllFrames().catch(console.error);
