/**
 * Frame Sequence Canvas Controller
 *
 * Renders WebP frames to canvas based on scroll position.
 * Implements Apple-style scroll-scrubbing for the About section.
 *
 * @see /thoughts/shared/specs/2026-01-21-about-section-scrollytelling.md
 */

/**
 * Frame Sequence Controller Class
 */
export class FrameSequence {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`[FrameSequence] Canvas #${canvasId} not found`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.frames = [];
    this.currentFrameIndex = -1;
    this.isLoaded = false;
    this.loadProgress = 0;

    // Configuration
    this.config = {
      basePath: options.basePath || '/assets/frames/about/',
      totalFrames: options.totalFrames || 120,
      framePrefix: options.framePrefix || 'frame_',
      frameExtension: options.frameExtension || '.png', // PNG for better compatibility
      framePadding: options.framePadding || 4,
      manifestPath: options.manifestPath || null,
      onProgress: options.onProgress || null,
      onComplete: options.onComplete || null,
    };

    // Bind methods
    this.handleResize = this.handleResize.bind(this);

    // Setup
    this.setupCanvas();
    this.addEventListeners();
  }

  /**
   * Setup canvas dimensions
   */
  setupCanvas() {
    this.handleResize();
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.canvas) return;

    // Set canvas to viewport dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);

    // Re-render current frame at new size
    if (this.currentFrameIndex >= 0 && this.frames[this.currentFrameIndex]) {
      this.renderFrame(this.currentFrameIndex);
    }
  }

  /**
   * Generate frame path from index
   */
  getFramePath(index) {
    const paddedIndex = String(index).padStart(this.config.framePadding, '0');
    return `${this.config.basePath}${this.config.framePrefix}${paddedIndex}${this.config.frameExtension}`;
  }

  /**
   * Preload all frames
   * @returns {Promise} Resolves when all frames are loaded
   */
  async preload() {
    console.log(`[FrameSequence] Preloading ${this.config.totalFrames} frames...`);

    const loadPromises = [];

    for (let i = 0; i < this.config.totalFrames; i++) {
      const img = new Image();
      const promise = new Promise((resolve, reject) => {
        img.onload = () => {
          this.loadProgress = (i + 1) / this.config.totalFrames;
          if (this.config.onProgress) {
            this.config.onProgress(this.loadProgress);
          }
          resolve(img);
        };
        img.onerror = () => {
          console.warn(`[FrameSequence] Failed to load frame ${i}`);
          // Resolve with null to continue loading other frames
          resolve(null);
        };
      });

      img.src = this.getFramePath(i);
      this.frames.push(img);
      loadPromises.push(promise);
    }

    await Promise.all(loadPromises);

    this.isLoaded = true;
    console.log(`[FrameSequence] Preload complete. ${this.frames.filter(f => f).length}/${this.config.totalFrames} frames loaded`);

    if (this.config.onComplete) {
      this.config.onComplete();
    }

    // Render first frame
    this.renderFrame(0);

    return this;
  }

  /**
   * Load frames from manifest
   * @param {string} manifestPath Path to manifest.json
   */
  async loadFromManifest(manifestPath) {
    try {
      const response = await fetch(manifestPath || this.config.manifestPath);
      const manifest = await response.json();

      this.config.totalFrames = manifest.totalFrames || manifest.frames?.length || 120;
      this.config.basePath = manifest.basePath || this.config.basePath;

      console.log(`[FrameSequence] Loaded manifest: ${this.config.totalFrames} frames`);

      return this.preload();
    } catch (error) {
      console.error('[FrameSequence] Failed to load manifest:', error);
      // Fall back to default preload
      return this.preload();
    }
  }

  /**
   * Render a specific frame to canvas
   * @param {number} index Frame index (0-based)
   */
  renderFrame(index) {
    if (!this.canvas || !this.ctx) return;

    // Clamp index to valid range
    const frameIndex = Math.max(0, Math.min(this.config.totalFrames - 1, Math.floor(index)));

    // Skip if same frame
    if (frameIndex === this.currentFrameIndex) return;

    this.currentFrameIndex = frameIndex;

    // Clear canvas
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    const frame = this.frames[frameIndex];
    if (frame && frame.complete && frame.naturalWidth > 0) {
      // Draw loaded frame
      const imgAspect = frame.width / frame.height;
      const canvasAspect = rect.width / rect.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawWidth = rect.width;
        drawHeight = rect.width / imgAspect;
        drawX = 0;
        drawY = (rect.height - drawHeight) / 2;
      } else {
        drawHeight = rect.height;
        drawWidth = rect.height * imgAspect;
        drawX = (rect.width - drawWidth) / 2;
        drawY = 0;
      }

      this.ctx.drawImage(frame, drawX, drawY, drawWidth, drawHeight);
    } else {
      // Draw procedural placeholder frame
      this.renderPlaceholder(frameIndex, rect);
    }
  }

  /**
   * Render a procedural placeholder frame
   * Creates abstract visualization based on frame progress
   */
  renderPlaceholder(frameIndex, rect) {
    const progress = frameIndex / (this.config.totalFrames - 1);
    const ctx = this.ctx;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const size = Math.min(rect.width, rect.height) * 0.4;

    // Phase-based rendering
    if (progress < 0.33) {
      this.drawSLetterform(ctx, centerX, centerY, size, progress / 0.33);
    } else if (progress < 0.66) {
      this.drawMeshFormation(ctx, centerX, centerY, size, (progress - 0.33) / 0.33);
    } else {
      this.drawMeshSimplification(ctx, centerX, centerY, size, (progress - 0.66) / 0.34);
    }
  }

  /**
   * Draw S letterform with fragmentation
   */
  drawSLetterform(ctx, x, y, size, progress) {
    ctx.save();
    ctx.translate(x, y);

    const segments = 24;
    const fragmentation = progress * 0.8;

    ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 - fragmentation * 0.05})`;
    ctx.lineWidth = Math.max(1, 6 - fragmentation * 4);
    ctx.lineCap = 'round';

    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const px = Math.sin(t * Math.PI * 2) * size * 0.3;
      const py = (t - 0.5) * size;

      const scatter = fragmentation * size * 0.3;
      const fx = px + Math.sin(i * 1.5 + progress * 10) * scatter;
      const fy = py + Math.cos(i * 1.3 + progress * 10) * scatter;

      if (i === 0) ctx.moveTo(fx, fy);
      else ctx.lineTo(fx, fy);
    }
    ctx.stroke();

    if (fragmentation > 0.3) {
      ctx.fillStyle = `rgba(0, 0, 0, 0.1)`;
      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2 + progress * 5;
        const radius = size * 0.3 * (0.5 + fragmentation * 0.5);
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius * 1.5, 2 + fragmentation * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Draw mesh formation
   */
  drawMeshFormation(ctx, x, y, size, progress) {
    ctx.save();
    ctx.translate(x, y);

    const nodeCount = Math.floor(8 + progress * 20);
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 + progress * 0.5;
      const radius = size * (0.3 + progress * 0.2) * (0.6 + Math.sin(i * 0.7) * 0.4);
      nodes.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }

    ctx.strokeStyle = `rgba(0, 0, 0, ${0.05 + progress * 0.05})`;
    ctx.lineWidth = 1;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
        if (dist < size * 0.5) {
          ctx.globalAlpha = (1 - dist / (size * 0.5)) * progress;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + progress * 0.05})`;
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2 + progress * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Draw mesh simplification
   */
  drawMeshSimplification(ctx, x, y, size, progress) {
    ctx.save();
    ctx.translate(x, y);

    const nodeCount = Math.floor(28 - progress * 20);
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = size * (0.5 - progress * 0.3);
      nodes.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }

    ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
    ctx.lineWidth = 1 + progress;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
        if (dist < size * (0.5 - progress * 0.3)) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = `rgba(0, 0, 0, 0.15)`;
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 3 + progress * 3, 0, Math.PI * 2);
      ctx.fill();
    });

    if (progress > 0.7) {
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 * (progress - 0.7) / 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Set frame based on scroll progress (0-1)
   * @param {number} progress Scroll progress from 0 to 1
   */
  setProgress(progress) {
    if (!this.isLoaded) return;

    // Clamp progress
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Map progress to frame index
    const frameIndex = Math.floor(clampedProgress * (this.config.totalFrames - 1));

    this.renderFrame(frameIndex);
  }

  /**
   * Get current frame index
   */
  getCurrentFrame() {
    return this.currentFrameIndex;
  }

  /**
   * Get load progress (0-1)
   */
  getLoadProgress() {
    return this.loadProgress;
  }

  /**
   * Check if frames are loaded
   */
  getIsLoaded() {
    return this.isLoaded;
  }

  /**
   * Destroy and clean up
   */
  destroy() {
    this.removeEventListeners();
    this.frames = [];
    this.currentFrameIndex = -1;
    this.isLoaded = false;

    if (this.ctx) {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
    }

    console.log('[FrameSequence] Destroyed');
  }
}

/**
 * Create placeholder frames for development/testing
 * Generates canvas-based frames with frame number overlay
 */
export function generatePlaceholderFrames(count = 120, basePath = '/assets/frames/about/') {
  console.log(`[FrameSequence] Generating ${count} placeholder frames...`);

  // This would be used in development when actual frames aren't available
  // For production, use the scrollytelling agent to generate real frames

  return {
    totalFrames: count,
    basePath: basePath,
    frames: Array.from({ length: count }, (_, i) => ({
      index: i,
      path: `${basePath}frame_${String(i).padStart(4, '0')}.webp`,
    })),
  };
}

/**
 * Initialize frame sequence with default config
 */
export async function initFrameSequence(canvasId = 'about-canvas', options = {}) {
  const frameSequence = new FrameSequence(canvasId, {
    basePath: '/assets/frames/about/',
    totalFrames: 120,
    onProgress: (progress) => {
      // Update loading indicator if present
      const loadingBar = document.querySelector('.loading-bar');
      if (loadingBar) {
        loadingBar.style.transform = `scaleX(${progress})`;
        loadingBar.classList.add('visible');
      }
    },
    onComplete: () => {
      // Hide loading indicator
      const loadingBar = document.querySelector('.loading-bar');
      if (loadingBar) {
        loadingBar.classList.remove('visible');
      }
    },
    ...options,
  });

  // Check if manifest exists, otherwise use direct preload
  try {
    const manifestResponse = await fetch('/assets/frames/about/manifest.json');
    if (manifestResponse.ok) {
      await frameSequence.loadFromManifest();
    } else {
      await frameSequence.preload();
    }
  } catch {
    // No manifest, preload directly
    await frameSequence.preload();
  }

  return frameSequence;
}

export default FrameSequence;
