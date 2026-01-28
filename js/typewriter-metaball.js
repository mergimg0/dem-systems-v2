import { animate, createTimeline } from 'animejs';
import { LetterMaskGenerator } from './letter-mask-generator.js';
import { MetaballPhysics } from './metaball-physics.js';

/**
 * Main orchestrator for typewriter-metaball fusion animation
 * Manages state machine: idle -> entry -> melt -> interactive -> exit
 */
export class TypewriterMetaball {
  /**
   * @param {HTMLElement} container - Container element for the animation
   * @param {Object} options
   * @param {string} options.text - Text to display (default: 'DEM Systems')
   * @param {string[]} options.videoSources - Video source URLs
   * @param {number} options.entryDuration - Total typewriter duration (default: 1100)
   * @param {number} options.meltDuration - Melt transition duration (default: 800)
   * @param {number} options.letterStagger - Delay between letters (default: 100)
   * @param {boolean} options.debug - Show debug visualization
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      text: options.text || 'DEM Systems',
      videoSources: options.videoSources || [],
      entryDuration: options.entryDuration || 1100,
      meltDuration: options.meltDuration || 800,
      letterStagger: options.letterStagger || 100,
      debug: options.debug || false,
      ...options
    };

    this._phase = 'idle';
    this._listeners = new Map();
    this._animationFrame = null;
    this._lastTime = 0;

    // Mouse tracking state
    this._mouseX = 0;
    this._mouseY = 0;
    this._mouseVX = 0;
    this._mouseVY = 0;
    this._lastMouseX = 0;
    this._lastMouseY = 0;
    this._isMouseOver = false;

    // Sub-components (initialized in _setup)
    this.letterMasks = null;
    this.metaball = null;
    this.canvas = null;
    this.ctx = null;
    this.video = null;

    // Timelines
    this._entryTimeline = null;
    this._meltTimeline = null;
    this._exitTimeline = null;

    // Morph state (for Phase 3)
    this._meltProgress = 0;
  }

  /**
   * Get current animation phase
   */
  get phase() {
    return this._phase;
  }

  /**
   * Initialize and start the animation
   */
  async start() {
    await this._setup();
    this._bindEvents();
    this._startRenderLoop();
    this.transitionTo('entry');
  }

  /**
   * Setup canvas, video, and sub-components
   */
  async _setup() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);

    this._width = rect.width;
    this._height = rect.height;

    // Create video element
    if (this.options.videoSources.length > 0) {
      this.video = document.createElement('video');
      this.video.src = this.options.videoSources[0];
      this.video.muted = true;
      this.video.loop = true;
      this.video.playsInline = true;
      this.video.style.display = 'none';
      this.container.appendChild(this.video);
      await this.video.play().catch(() => {});
    }

    // Initialize letter mask generator
    this.letterMasks = new LetterMaskGenerator(this.options.text, {
      fontFamily: 'Satoshi, sans-serif',
      fontWeight: 900
    });
    this.letterMasks.init(this.ctx, this._width, this._height);

    // Initialize metaball physics
    this.metaball = new MetaballPhysics({
      threshold: 1.0,
      gridResolution: 12,
      maxBlobs: 4,
      baseRadius: Math.min(this._width, this._height) * 0.15
    });
    this.metaball.init(this._width, this._height);
  }

  /**
   * Bind mouse/touch events
   */
  _bindEvents() {
    this._onMouseMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    };

    this._onMouseEnter = () => {
      this._isMouseOver = true;
    };

    this._onMouseLeave = () => {
      this._isMouseOver = false;
    };

    this.container.addEventListener('mousemove', this._onMouseMove);
    this.container.addEventListener('mouseenter', this._onMouseEnter);
    this.container.addEventListener('mouseleave', this._onMouseLeave);
  }

  /**
   * Start the render loop
   */
  _startRenderLoop() {
    const loop = (time) => {
      const dt = this._lastTime ? time - this._lastTime : 16;
      this._lastTime = time;

      // Calculate mouse velocity
      this._mouseVX = this._mouseX - this._lastMouseX;
      this._mouseVY = this._mouseY - this._lastMouseY;
      this._lastMouseX = this._mouseX;
      this._lastMouseY = this._mouseY;

      this._update(dt);
      this._render();

      this._animationFrame = requestAnimationFrame(loop);
    };

    this._animationFrame = requestAnimationFrame(loop);
  }

  /**
   * Update logic per frame
   */
  _update(dt) {
    if (this._phase === 'interactive') {
      this.metaball.update(dt, this._mouseX, this._mouseY, this._mouseVX, this._mouseVY);
    }
  }

  /**
   * Render current frame
   */
  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this._width, this._height);

    // Draw video (if available)
    if (this.video && this.video.readyState >= 2) {
      ctx.drawImage(this.video, 0, 0, this._width, this._height);
    } else {
      // Fallback gradient
      const gradient = ctx.createLinearGradient(0, 0, this._width, this._height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this._width, this._height);
    }

    // Apply mask based on phase
    ctx.globalCompositeOperation = 'destination-in';

    switch (this._phase) {
      case 'entry':
        this._renderEntryMask(ctx);
        break;
      case 'melt':
        this._renderMeltMask(ctx);
        break;
      case 'interactive':
        this._renderInteractiveMask(ctx);
        break;
      case 'exit':
        this._renderExitMask(ctx);
        break;
    }

    ctx.globalCompositeOperation = 'source-over';

    // Debug visualization
    if (this.options.debug) {
      this._renderDebug(ctx);
    }
  }

  /**
   * Render letter masks during entry phase
   */
  _renderEntryMask(ctx) {
    ctx.fillStyle = '#fff';
    this.letterMasks.drawRevealedLetters(ctx);
  }

  /**
   * Render morphing mask during melt phase (stub for Phase 3)
   */
  _renderMeltMask(ctx) {
    // Phase 3 will implement this
    // For now, just draw letters or blob based on progress
    if (this._meltProgress < 0.5) {
      this.letterMasks.drawRevealedLetters(ctx);
    } else {
      ctx.fill(this.metaball.getMaskPath());
    }
  }

  /**
   * Render metaball mask during interactive phase
   */
  _renderInteractiveMask(ctx) {
    ctx.fillStyle = '#fff';
    ctx.fill(this.metaball.getMaskPath());
  }

  /**
   * Render exit mask (reverse morph - stub for Phase 3)
   */
  _renderExitMask(ctx) {
    // Phase 3 will implement this
    this.letterMasks.drawRevealedLetters(ctx);
  }

  /**
   * Debug visualization
   */
  _renderDebug(ctx) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.font = '14px monospace';
    ctx.fillText(`Phase: ${this._phase}`, 10, 20);
    ctx.fillText(`Revealed: ${this.letterMasks.revealedCount}/${this.letterMasks.letterCount}`, 10, 40);
    ctx.fillText(`Mouse: ${Math.round(this._mouseX)}, ${Math.round(this._mouseY)}`, 10, 60);
    ctx.fillText(`Blobs: ${this.metaball.getBlobs().length}`, 10, 80);
  }

  /**
   * Transition to a new phase
   */
  transitionTo(phase) {
    const prevPhase = this._phase;
    this._phase = phase;

    switch (phase) {
      case 'entry':
        this._startEntry();
        break;
      case 'melt':
        this._startMelt();
        break;
      case 'interactive':
        this._startInteractive();
        break;
      case 'exit':
        this._startExit();
        break;
    }

    this._emit('phaseChange', { from: prevPhase, to: phase });
  }

  /**
   * Start typewriter entry animation
   */
  _startEntry() {
    const letterCount = this.letterMasks.letterCount;
    this.letterMasks.revealedCount = 0;

    // Create staggered reveal timeline
    this._entryTimeline = createTimeline({
      defaults: { ease: 'linear' }
    });

    // Animate revealedCount from 0 to letterCount
    this._entryTimeline.add({
      targets: this.letterMasks,
      revealedCount: letterCount,
      duration: this.options.letterStagger * letterCount,
      round: 1,  // Round to integers
      ease: 'steps(' + letterCount + ')'
    });

    // Transition to melt when complete
    this._entryTimeline.then(() => {
      setTimeout(() => this.transitionTo('melt'), 200);
    });
  }

  /**
   * Start melt transition (stub - Phase 3 will implement)
   */
  _startMelt() {
    this._meltProgress = 0;

    // Initialize metaball at center
    this.metaball.reset();
    this.metaball.addBlob(
      this._width / 2,
      this._height / 2,
      this.metaball.baseRadius,
      true
    );

    // Animate melt progress
    this._meltTimeline = animate({
      targets: this,
      _meltProgress: 1,
      duration: this.options.meltDuration,
      ease: 'inOutQuad',
      complete: () => this.transitionTo('interactive')
    });
  }

  /**
   * Start interactive phase
   */
  _startInteractive() {
    // Metaball is ready, just need to track mouse
    console.log('[TypewriterMetaball] Interactive phase started');
  }

  /**
   * Start exit animation (stub - Phase 3 will implement)
   */
  _startExit() {
    // Animate back to letters
    this._exitTimeline = animate({
      targets: this,
      _meltProgress: 0,
      duration: this.options.meltDuration,
      ease: 'outQuad',
      complete: () => this.transitionTo('idle')
    });
  }

  /**
   * Restart animation from beginning
   */
  restart() {
    this._cancelAllTimelines();
    this.letterMasks.revealedCount = 0;
    this._meltProgress = 0;
    this.transitionTo('entry');
  }

  /**
   * Event emitter
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
  }

  _emit(event, data) {
    const callbacks = this._listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  /**
   * Cancel all running timelines
   */
  _cancelAllTimelines() {
    if (this._entryTimeline) this._entryTimeline.pause();
    if (this._meltTimeline) this._meltTimeline.pause();
    if (this._exitTimeline) this._exitTimeline.pause();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this._cancelAllTimelines();

    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
    }

    this.container.removeEventListener('mousemove', this._onMouseMove);
    this.container.removeEventListener('mouseenter', this._onMouseEnter);
    this.container.removeEventListener('mouseleave', this._onMouseLeave);

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    if (this.video && this.video.parentNode) {
      this.video.parentNode.removeChild(this.video);
    }
  }
}

/**
 * Check for reduced motion preference
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
