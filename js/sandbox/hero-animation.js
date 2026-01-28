/**
 * DEM Systems Hero Animation
 *
 * A 4-phase animation:
 * 1. ENTRY: Typewriter text reveal - letters appear one by one, video visible through
 * 2. MELT: Letters soften and merge into single blob
 * 3. INTERACTIVE: Blob follows cursor with physics
 * 4. EXIT: Blob crystallizes back to letters, fade out
 *
 * Built from scratch - no dependencies on existing codebase
 */

class HeroAnimation {
  constructor(options = {}) {
    this.canvas = document.getElementById('animation-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.video = document.getElementById('video-source');
    this.container = document.getElementById('animation-container');

    this.text = options.text || 'DEM Systems';
    this.fontFamily = options.fontFamily || 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
    this.fontWeight = options.fontWeight || '700';

    // State
    this.phase = 'idle'; // idle, entry, melt, interactive, exit
    this.letters = [];
    this.revealedCount = 0;
    this.meltProgress = 0;
    this.exitProgress = 0;

    // Blob state for interactive phase
    this.blob = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 80,
      baseRadius: 80
    };

    // Mouse tracking
    this.mouse = { x: 0, y: 0, vx: 0, vy: 0 };
    this.lastMouse = { x: 0, y: 0 };
    this.isMouseOver = false;

    // Timing
    this.startTime = 0;
    this.lastFrameTime = 0;
    this.frameCount = 0;

    // Debug
    this.debugPhase = document.getElementById('debug-phase');
    this.debugFps = document.getElementById('debug-fps');
    this.debugMouse = document.getElementById('debug-mouse');

    this._init();
  }

  _init() {
    this._resize();
    this._bindEvents();
    this._prepareLetters();
    this._startVideo();
    this._startAnimation();
  }

  _resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.ctx.scale(dpr, dpr);

    // Recalculate letter positions
    this._prepareLetters();

    // Center blob
    this.blob.x = this.width / 2;
    this.blob.y = this.height / 2;
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._resize());

    this.container.addEventListener('mouseenter', () => {
      this.isMouseOver = true;
    });

    this.container.addEventListener('mouseleave', () => {
      this.isMouseOver = false;
    });

    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
  }

  _prepareLetters() {
    this.letters = [];

    // Calculate font size based on container
    const fontSize = Math.min(this.height * 0.6, this.width * 0.12);
    this.ctx.font = `${this.fontWeight} ${fontSize}px ${this.fontFamily}`;

    // Measure total text width
    const totalWidth = this.ctx.measureText(this.text).width;
    let currentX = (this.width - totalWidth) / 2;
    const y = this.height / 2 + fontSize * 0.35; // Baseline adjustment

    // Create letter objects
    for (let i = 0; i < this.text.length; i++) {
      const char = this.text[i];
      const charWidth = this.ctx.measureText(char).width;

      this.letters.push({
        char,
        x: currentX,
        y: y,
        width: charWidth,
        height: fontSize,
        centerX: currentX + charWidth / 2,
        centerY: this.height / 2,
        opacity: 0,
        scale: 1,
        // For melt phase
        morphX: currentX + charWidth / 2,
        morphY: this.height / 2,
        morphRadius: Math.max(charWidth, fontSize) / 2,
        morphProgress: 0
      });

      currentX += charWidth;
    }

    this.fontSize = fontSize;
  }

  _startVideo() {
    this.video.play().catch(e => {
      console.log('Video autoplay blocked, will start on interaction');
    });
  }

  _startAnimation() {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;

    // Start entry phase after brief delay
    setTimeout(() => {
      this._transitionTo('entry');
    }, 500);

    this._animate();
  }

  _transitionTo(phase) {
    console.log(`Transition: ${this.phase} -> ${phase}`);
    this.phase = phase;
    this.phaseStartTime = performance.now();

    if (this.debugPhase) {
      this.debugPhase.textContent = phase;
    }

    switch (phase) {
      case 'entry':
        this.revealedCount = 0;
        break;
      case 'melt':
        this.meltProgress = 0;
        break;
      case 'interactive':
        // Initialize blob at center
        this.blob.x = this.width / 2;
        this.blob.y = this.height / 2;
        this.blob.vx = 0;
        this.blob.vy = 0;
        break;
      case 'exit':
        this.exitProgress = 0;
        break;
    }
  }

  _animate() {
    const now = performance.now();
    const dt = Math.min(now - this.lastFrameTime, 32); // Cap at ~30fps minimum
    this.lastFrameTime = now;
    this.frameCount++;

    // Update mouse velocity
    this.mouse.vx = (this.mouse.x - this.lastMouse.x) / (dt || 1) * 16;
    this.mouse.vy = (this.mouse.y - this.lastMouse.y) / (dt || 1) * 16;
    this.lastMouse.x = this.mouse.x;
    this.lastMouse.y = this.mouse.y;

    // Update debug
    if (this.frameCount % 30 === 0 && this.debugFps) {
      this.debugFps.textContent = Math.round(1000 / dt);
    }
    if (this.debugMouse) {
      this.debugMouse.textContent = `${Math.round(this.mouse.x)}, ${Math.round(this.mouse.y)}`;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update and render based on phase
    switch (this.phase) {
      case 'entry':
        this._updateEntry(dt);
        this._renderEntry();
        break;
      case 'melt':
        this._updateMelt(dt);
        this._renderMelt();
        break;
      case 'interactive':
        this._updateInteractive(dt);
        this._renderInteractive();
        break;
      case 'exit':
        this._updateExit(dt);
        this._renderExit();
        break;
    }

    requestAnimationFrame(() => this._animate());
  }

  // ==================== ENTRY PHASE ====================

  _updateEntry(dt) {
    const elapsed = performance.now() - this.phaseStartTime;
    const letterDelay = 100; // ms between letters

    // Calculate how many letters should be revealed
    const targetCount = Math.min(
      Math.floor(elapsed / letterDelay),
      this.letters.length
    );

    // Reveal new letters
    while (this.revealedCount < targetCount) {
      const letter = this.letters[this.revealedCount];
      letter.opacity = 1;
      letter.scale = 1.2; // Overshoot
      this.revealedCount++;
    }

    // Animate scale settling
    for (let i = 0; i < this.revealedCount; i++) {
      const letter = this.letters[i];
      if (letter.scale > 1) {
        letter.scale = Math.max(1, letter.scale - dt * 0.005);
      }
    }

    // Transition to melt when all revealed
    if (this.revealedCount >= this.letters.length) {
      const holdTime = 500; // Hold before melt
      if (elapsed > this.letters.length * letterDelay + holdTime) {
        this._transitionTo('melt');
      }
    }
  }

  _renderEntry() {
    // Draw video through letter masks
    this.ctx.save();

    // Create clipping path from revealed letters
    this.ctx.beginPath();
    this.ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;

    for (let i = 0; i < this.revealedCount; i++) {
      const letter = this.letters[i];
      if (letter.opacity > 0) {
        // Draw letter path for clipping
        const scaledSize = this.fontSize * letter.scale;
        this.ctx.save();
        this.ctx.translate(letter.centerX, letter.centerY);
        this.ctx.scale(letter.scale, letter.scale);
        this.ctx.translate(-letter.centerX, -letter.centerY);

        this.ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(letter.char, letter.x, letter.y);

        this.ctx.restore();
      }
    }

    // Use composite operation to show video only through text
    this.ctx.globalCompositeOperation = 'source-in';

    // Draw video
    if (this.video.readyState >= 2) {
      this._drawVideoFill();
    }

    this.ctx.restore();
  }

  // ==================== MELT PHASE ====================

  _updateMelt(dt) {
    const duration = 1500; // Total melt duration
    const elapsed = performance.now() - this.phaseStartTime;
    this.meltProgress = Math.min(elapsed / duration, 1);

    // Ease function
    const eased = this._easeInOutCubic(this.meltProgress);

    // Update each letter's morph state
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (const letter of this.letters) {
      // Morph toward center
      letter.morphX = letter.centerX + (centerX - letter.centerX) * eased;
      letter.morphY = letter.centerY + (centerY - letter.centerY) * eased;

      // Shrink radius as they approach center
      const baseMorphRadius = Math.max(letter.width, this.fontSize) / 2;
      letter.morphRadius = baseMorphRadius * (1 - eased * 0.7);

      // Track morph progress for rendering
      letter.morphProgress = eased;
    }

    // Update blob radius for smooth transition
    this.blob.radius = 80 * eased;

    // Transition to interactive
    if (this.meltProgress >= 1) {
      this._transitionTo('interactive');
    }
  }

  _renderMelt() {
    this.ctx.save();

    // Draw morphing shapes
    this.ctx.beginPath();

    if (this.meltProgress < 0.7) {
      // Early melt: draw softened letters transitioning to circles
      for (const letter of this.letters) {
        const progress = letter.morphProgress;

        if (progress < 0.5) {
          // Still somewhat letter-shaped (draw as rounded rect approximation)
          const cornerRadius = progress * letter.morphRadius;
          this._roundedRect(
            letter.morphX - letter.width / 2 * (1 - progress * 0.5),
            letter.morphY - this.fontSize / 2 * (1 - progress * 0.5),
            letter.width * (1 - progress * 0.5),
            this.fontSize * (1 - progress * 0.5),
            cornerRadius
          );
        } else {
          // Becoming circular
          this.ctx.moveTo(letter.morphX + letter.morphRadius, letter.morphY);
          this.ctx.arc(letter.morphX, letter.morphY, letter.morphRadius, 0, Math.PI * 2);
        }
      }
    } else {
      // Late melt: draw as metaball-merged blob
      this._drawMetaballBlob(this.letters.map(l => ({
        x: l.morphX,
        y: l.morphY,
        r: l.morphRadius
      })));
    }

    this.ctx.closePath();
    this.ctx.fillStyle = 'white';
    this.ctx.fill();

    // Composite video through shape
    this.ctx.globalCompositeOperation = 'source-in';
    if (this.video.readyState >= 2) {
      this._drawVideoFill();
    }

    this.ctx.restore();
  }

  // ==================== INTERACTIVE PHASE ====================

  _updateInteractive(dt) {
    // Spring physics toward mouse (or center if mouse not over)
    const targetX = this.isMouseOver ? this.mouse.x : this.width / 2;
    const targetY = this.isMouseOver ? this.mouse.y : this.height / 2;

    const dx = targetX - this.blob.x;
    const dy = targetY - this.blob.y;

    // Spring force
    const stiffness = 0.08;
    const damping = 0.85;

    this.blob.vx += dx * stiffness;
    this.blob.vy += dy * stiffness;
    this.blob.vx *= damping;
    this.blob.vy *= damping;

    this.blob.x += this.blob.vx;
    this.blob.y += this.blob.vy;

    // Stretch based on velocity
    const speed = Math.sqrt(this.blob.vx ** 2 + this.blob.vy ** 2);
    const stretchFactor = Math.min(speed / 5, 0.5);
    this.blob.stretchX = 1 + stretchFactor * 0.3;
    this.blob.stretchY = 1 / (1 + stretchFactor * 0.2);
    this.blob.angle = Math.atan2(this.blob.vy, this.blob.vx);

    // Breathing effect when idle
    if (speed < 0.5) {
      const breathe = Math.sin(performance.now() * 0.003) * 0.05;
      this.blob.radius = this.blob.baseRadius * (1 + breathe);
    } else {
      this.blob.radius = this.blob.baseRadius;
    }
  }

  _renderInteractive() {
    this.ctx.save();

    // Draw blob with stretch
    this.ctx.beginPath();
    this.ctx.translate(this.blob.x, this.blob.y);
    this.ctx.rotate(this.blob.angle || 0);
    this.ctx.scale(this.blob.stretchX || 1, this.blob.stretchY || 1);
    this.ctx.arc(0, 0, this.blob.radius, 0, Math.PI * 2);
    this.ctx.closePath();

    this.ctx.fillStyle = 'white';
    this.ctx.fill();

    // Reset transform for video
    this.ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);

    // Composite video through blob
    this.ctx.globalCompositeOperation = 'source-in';
    if (this.video.readyState >= 2) {
      this._drawVideoFill();
    }

    this.ctx.restore();
  }

  // ==================== EXIT PHASE ====================

  _updateExit(dt) {
    const duration = 2000;
    const elapsed = performance.now() - this.phaseStartTime;
    this.exitProgress = Math.min(elapsed / duration, 1);

    const eased = this._easeInOutCubic(this.exitProgress);

    // Reverse of melt - blob splits back to letters
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (const letter of this.letters) {
      letter.morphX = centerX + (letter.centerX - centerX) * eased;
      letter.morphY = centerY + (letter.centerY - centerY) * eased;
      letter.morphProgress = 1 - eased;

      // Fade out letters as they reform
      if (this.exitProgress > 0.7) {
        const fadeProgress = (this.exitProgress - 0.7) / 0.3;
        letter.opacity = 1 - fadeProgress;
      } else {
        letter.opacity = 1;
      }
    }

    // Loop back to entry
    if (this.exitProgress >= 1) {
      this._transitionTo('entry');
    }
  }

  _renderExit() {
    // Similar to melt but in reverse
    this._renderMelt();
  }

  // ==================== HELPER METHODS ====================

  _drawVideoFill() {
    // Cover the canvas with video, maintaining aspect ratio
    const videoRatio = this.video.videoWidth / this.video.videoHeight;
    const canvasRatio = this.width / this.height;

    let drawWidth, drawHeight, drawX, drawY;

    if (canvasRatio > videoRatio) {
      drawWidth = this.width;
      drawHeight = this.width / videoRatio;
      drawX = 0;
      drawY = (this.height - drawHeight) / 2;
    } else {
      drawHeight = this.height;
      drawWidth = this.height * videoRatio;
      drawX = (this.width - drawWidth) / 2;
      drawY = 0;
    }

    this.ctx.drawImage(this.video, drawX, drawY, drawWidth, drawHeight);
  }

  _drawMetaballBlob(blobs) {
    // Simplified metaball rendering using multiple arcs
    // For a proper metaball, we'd use marching squares, but this is a visual approximation

    if (blobs.length === 0) return;

    // Calculate centroid
    let cx = 0, cy = 0;
    for (const b of blobs) {
      cx += b.x;
      cy += b.y;
    }
    cx /= blobs.length;
    cy /= blobs.length;

    // Draw merged blob as single circle at centroid
    const avgRadius = blobs.reduce((sum, b) => sum + b.r, 0) / blobs.length;
    const mergedRadius = avgRadius * 1.5 * (1 + (1 - this.meltProgress) * 0.5);

    this.ctx.arc(cx, cy, mergedRadius, 0, Math.PI * 2);
  }

  _roundedRect(x, y, width, height, radius) {
    radius = Math.min(radius, width / 2, height / 2);
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Public method to trigger exit manually
  triggerExit() {
    if (this.phase === 'interactive') {
      this._transitionTo('exit');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.heroAnimation = new HeroAnimation({
    text: 'DEM Systems'
  });
});
