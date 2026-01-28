/**
 * AlignmentTool - Reusable 3D-to-DOM alignment debug panel
 *
 * Usage:
 *   import { AlignmentTool } from './AlignmentTool.js';
 *   const tool = new AlignmentTool(mesh, domElement, { frustumSize: 1.5 });
 *   // In your render loop:
 *   tool.update();
 *   // When done calibrating, get the values:
 *   const config = tool.getConfig();
 */

export class AlignmentTool {
  constructor(mesh, domElement, options = {}) {
    this.mesh = mesh;
    this.domElement = domElement;
    this.frustumSize = options.frustumSize || 1.5;
    this.onUpdate = options.onUpdate || null;

    // Calibration values
    this.config = {
      rotation: { x: 1.57, y: 0, z: 0 },
      flipX: false,
      flipY: false,
      offsetX: 0,
      offsetY: 0,
      scaleAdj: 1.0
    };

    // Mesh bounding box (set after mesh loads)
    this.meshBounds = {
      width: 4.557,
      minX: -2.755,
      maxX: 1.802
    };

    this.panel = null;
    this.isVisible = true;

    this.createPanel();
    this.bindKeyboard();
  }

  /**
   * Set mesh bounding box values (call after mesh loads)
   */
  setMeshBounds(width, minX, maxX) {
    this.meshBounds = { width, minX, maxX };
  }

  /**
   * Load config from saved values
   */
  loadConfig(config) {
    this.config = { ...this.config, ...config };
    this.updateSliders();
    this.sync();
  }

  /**
   * Get current calibration config (for saving)
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Export config as code snippet
   */
  exportCode() {
    const c = this.config;
    return `// Alignment config for ${this.domElement?.id || 'element'}
const alignmentConfig = {
  rotation: { x: ${c.rotation.x.toFixed(3)}, y: ${c.rotation.y.toFixed(3)}, z: ${c.rotation.z.toFixed(3)} },
  flipX: ${c.flipX},
  flipY: ${c.flipY},
  offsetX: ${c.offsetX.toFixed(4)},
  offsetY: ${c.offsetY.toFixed(4)},
  scaleAdj: ${c.scaleAdj.toFixed(4)}
};`;
  }

  createPanel() {
    // Create panel container
    this.panel = document.createElement('div');
    this.panel.id = 'alignment-tool';
    this.panel.innerHTML = `
      <style>
        #alignment-tool {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          background: rgba(0, 0, 0, 0.9);
          padding: 15px;
          border-radius: 8px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 12px;
          color: #fff;
          min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          border: 1px solid #333;
          user-select: none;
        }
        #alignment-tool.collapsed {
          min-width: auto;
          padding: 10px;
        }
        #alignment-tool.collapsed .at-content { display: none; }
        #alignment-tool h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        #alignment-tool h4 {
          margin: 12px 0 8px 0;
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        #alignment-tool hr {
          border: none;
          border-top: 1px solid #333;
          margin: 12px 0;
        }
        #alignment-tool .at-row {
          display: flex;
          align-items: center;
          margin: 6px 0;
          gap: 8px;
        }
        #alignment-tool .at-label {
          width: 50px;
          color: #aaa;
        }
        #alignment-tool input[type="range"] {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          background: #333;
          border-radius: 2px;
          cursor: pointer;
        }
        #alignment-tool input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #0af;
          border-radius: 50%;
          cursor: pointer;
        }
        #alignment-tool .at-value {
          width: 60px;
          text-align: right;
          color: #0f0;
          font-variant-numeric: tabular-nums;
          background: #111;
          border: 1px solid #333;
          border-radius: 3px;
          padding: 2px 4px;
          font-family: inherit;
          font-size: 11px;
          cursor: text;
        }
        #alignment-tool .at-value:focus {
          outline: none;
          border-color: #0af;
          background: #1a1a1a;
        }
        #alignment-tool input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        #alignment-tool .at-info {
          color: #666;
          font-size: 11px;
          margin: 4px 0;
        }
        #alignment-tool .at-info .val { color: #0f0; }
        #alignment-tool .at-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        #alignment-tool button {
          flex: 1;
          padding: 8px;
          background: #222;
          border: 1px solid #444;
          color: #fff;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        #alignment-tool button:hover {
          background: #333;
          border-color: #555;
        }
        #alignment-tool button.primary {
          background: #0066ff;
          border-color: #0066ff;
        }
        #alignment-tool button.primary:hover {
          background: #0055dd;
        }
        #alignment-tool .at-toast {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: #0f0;
          color: #000;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        #alignment-tool .at-toast.show { opacity: 1; }
      </style>

      <h3 onclick="this.parentElement.classList.toggle('collapsed')">
        <span>Alignment Tool</span>
        <span style="font-size:10px;color:#666">[H] toggle</span>
      </h3>

      <div class="at-content">
        <div class="at-info">
          DOM: <span class="val" id="at-dom">-</span>
        </div>
        <div class="at-info">
          3D pos: <span class="val" id="at-pos">-</span>
        </div>
        <div class="at-info">
          Scale: <span class="val" id="at-scale">-</span>
        </div>

        <h4>Rotation</h4>
        <div class="at-row">
          <span class="at-label">X</span>
          <input type="range" id="at-rot-x" min="-3.14" max="3.14" step="0.01" value="1.57">
          <input type="text" class="at-value" id="at-rot-x-val" value="1.57">
        </div>
        <div class="at-row">
          <span class="at-label">Y</span>
          <input type="range" id="at-rot-y" min="-3.14" max="3.14" step="0.01" value="0">
          <input type="text" class="at-value" id="at-rot-y-val" value="0.00">
        </div>
        <div class="at-row">
          <span class="at-label">Z</span>
          <input type="range" id="at-rot-z" min="-3.14" max="3.14" step="0.01" value="0">
          <input type="text" class="at-value" id="at-rot-z-val" value="0.00">
        </div>
        <div class="at-row">
          <span class="at-label">Flip X</span>
          <input type="checkbox" id="at-flip-x">
          <span style="flex:1"></span>
          <span class="at-label">Flip Y</span>
          <input type="checkbox" id="at-flip-y">
        </div>

        <h4>Position Offset</h4>
        <div class="at-row">
          <span class="at-label">X</span>
          <input type="range" id="at-off-x" min="-0.5" max="0.5" step="0.001" value="0">
          <input type="text" class="at-value" id="at-off-x-val" value="0.000">
        </div>
        <div class="at-row">
          <span class="at-label">Y</span>
          <input type="range" id="at-off-y" min="-0.5" max="0.5" step="0.001" value="0">
          <input type="text" class="at-value" id="at-off-y-val" value="0.000">
        </div>
        <div class="at-row">
          <span class="at-label">Scale</span>
          <input type="range" id="at-scale-adj" min="0.8" max="1.2" step="0.001" value="1">
          <input type="text" class="at-value" id="at-scale-adj-val" value="1.000">
        </div>

        <div class="at-buttons">
          <button id="at-reset">Reset</button>
          <button id="at-copy" class="primary">Copy Config</button>
        </div>
      </div>

      <div class="at-toast" id="at-toast">Copied!</div>
    `;

    document.body.appendChild(this.panel);
    this.bindControls();
  }

  bindControls() {
    // Rotation controls - slider and text input
    ['x', 'y', 'z'].forEach(axis => {
      const slider = document.getElementById(`at-rot-${axis}`);
      const input = document.getElementById(`at-rot-${axis}-val`);

      // Slider changes
      slider.addEventListener('input', () => {
        this.config.rotation[axis] = parseFloat(slider.value);
        input.value = parseFloat(slider.value).toFixed(2);
        this.sync();
      });

      // Text input changes
      input.addEventListener('change', () => {
        const val = parseFloat(input.value) || 0;
        this.config.rotation[axis] = val;
        slider.value = val;
        input.value = val.toFixed(2);
        this.sync();
      });

      // Select all on focus for easy editing
      input.addEventListener('focus', () => input.select());
    });

    // Flip controls
    document.getElementById('at-flip-x').addEventListener('change', (e) => {
      this.config.flipX = e.target.checked;
      this.sync();
    });
    document.getElementById('at-flip-y').addEventListener('change', (e) => {
      this.config.flipY = e.target.checked;
      this.sync();
    });

    // Offset controls - slider and text input
    ['x', 'y'].forEach(axis => {
      const id = axis === 'x' ? 'at-off-x' : 'at-off-y';
      const slider = document.getElementById(id);
      const input = document.getElementById(`${id}-val`);

      slider.addEventListener('input', () => {
        this.config[`offset${axis.toUpperCase()}`] = parseFloat(slider.value);
        input.value = parseFloat(slider.value).toFixed(3);
        this.sync();
      });

      input.addEventListener('change', () => {
        const val = parseFloat(input.value) || 0;
        this.config[`offset${axis.toUpperCase()}`] = val;
        slider.value = val;
        input.value = val.toFixed(3);
        this.sync();
      });

      input.addEventListener('focus', () => input.select());
    });

    // Scale adjustment - slider and text input
    const scaleSlider = document.getElementById('at-scale-adj');
    const scaleInput = document.getElementById('at-scale-adj-val');

    scaleSlider.addEventListener('input', () => {
      this.config.scaleAdj = parseFloat(scaleSlider.value);
      scaleInput.value = parseFloat(scaleSlider.value).toFixed(3);
      this.sync();
    });

    scaleInput.addEventListener('change', () => {
      const val = parseFloat(scaleInput.value) || 1;
      this.config.scaleAdj = val;
      scaleSlider.value = Math.max(0.8, Math.min(1.2, val)); // Clamp for slider
      scaleInput.value = val.toFixed(3);
      this.sync();
    });

    scaleInput.addEventListener('focus', () => scaleInput.select());

    // Reset button
    document.getElementById('at-reset').addEventListener('click', () => {
      this.config = {
        rotation: { x: 1.57, y: 0, z: 0 },
        flipX: false,
        flipY: false,
        offsetX: 0,
        offsetY: 0,
        scaleAdj: 1.0
      };
      this.updateSliders();
      this.sync();
    });

    // Copy button
    document.getElementById('at-copy').addEventListener('click', () => {
      const code = this.exportCode();
      navigator.clipboard.writeText(code).then(() => {
        const toast = document.getElementById('at-toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      });
    });
  }

  updateSliders() {
    const c = this.config;

    document.getElementById('at-rot-x').value = c.rotation.x;
    document.getElementById('at-rot-x-val').value = c.rotation.x.toFixed(2);
    document.getElementById('at-rot-y').value = c.rotation.y;
    document.getElementById('at-rot-y-val').value = c.rotation.y.toFixed(2);
    document.getElementById('at-rot-z').value = c.rotation.z;
    document.getElementById('at-rot-z-val').value = c.rotation.z.toFixed(2);

    document.getElementById('at-flip-x').checked = c.flipX;
    document.getElementById('at-flip-y').checked = c.flipY;

    document.getElementById('at-off-x').value = c.offsetX;
    document.getElementById('at-off-x-val').value = c.offsetX.toFixed(3);
    document.getElementById('at-off-y').value = c.offsetY;
    document.getElementById('at-off-y-val').value = c.offsetY.toFixed(3);

    document.getElementById('at-scale-adj').value = c.scaleAdj;
    document.getElementById('at-scale-adj-val').value = c.scaleAdj.toFixed(3);
  }

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'h' || e.key === 'H') {
        this.toggle();
      }
    });
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.panel.style.display = this.isVisible ? 'block' : 'none';
  }

  show() {
    this.isVisible = true;
    this.panel.style.display = 'block';
  }

  hide() {
    this.isVisible = false;
    this.panel.style.display = 'none';
  }

  /**
   * DOM to Three.js coordinate conversion
   */
  domToThreeCoords(domX, domY) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    const x = ((domX / width) * 2 - 1) * (this.frustumSize * aspect / 2);
    const y = (1 - (domY / height) * 2) * (this.frustumSize / 2);

    return { x, y };
  }

  /**
   * Calculate scale to match DOM width
   */
  calculateScale(domWidth) {
    const aspect = window.innerWidth / window.innerHeight;
    const worldWidth = this.frustumSize * aspect;
    const targetWidth = (domWidth / window.innerWidth) * worldWidth;
    return targetWidth / this.meshBounds.width;
  }

  /**
   * Measure text width using canvas
   */
  measureTextWidth() {
    if (!this.domElement) return 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const style = getComputedStyle(this.domElement);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = style.fontWeight;
    const fontFamily = style.fontFamily;

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    return ctx.measureText(this.domElement.textContent).width;
  }

  /**
   * Sync mesh with DOM element using current config
   */
  sync() {
    if (!this.mesh || !this.domElement) return;

    const rect = this.domElement.getBoundingClientRect();
    const textWidth = this.measureTextWidth();

    // Apply rotation
    this.mesh.rotation.x = this.config.rotation.x;
    this.mesh.rotation.y = this.config.rotation.y;
    this.mesh.rotation.z = this.config.rotation.z;

    // Calculate base scale
    const baseScale = this.calculateScale(textWidth);
    const adjustedScale = baseScale * this.config.scaleAdj;

    // Flip factors
    const flipX = this.config.flipX ? -1 : 1;
    const flipY = this.config.flipY ? -1 : 1;

    // Get DOM left edge position
    const leftPos = this.domToThreeCoords(rect.left, rect.top + rect.height / 2);

    // Calculate X position based on flip state
    const isFlipped = flipX < 0;
    const finalX = isFlipped
      ? leftPos.x + this.meshBounds.maxX * adjustedScale + this.config.offsetX
      : leftPos.x - this.meshBounds.minX * adjustedScale + this.config.offsetX;

    // Apply transforms
    this.mesh.position.set(finalX, leftPos.y + this.config.offsetY, 0);
    this.mesh.scale.set(adjustedScale * flipX, adjustedScale * flipY, adjustedScale);

    // Update info display
    document.getElementById('at-dom').textContent =
      `${Math.round(rect.left)}, ${Math.round(rect.top)} (${Math.round(textWidth)}x${Math.round(rect.height)})`;
    document.getElementById('at-pos').textContent =
      `${finalX.toFixed(3)}, ${(leftPos.y + this.config.offsetY).toFixed(3)}`;
    document.getElementById('at-scale').textContent =
      adjustedScale.toFixed(4);

    // Callback
    if (this.onUpdate) {
      this.onUpdate(this.config);
    }
  }

  /**
   * Call in animation loop to keep synced on resize/scroll
   */
  update() {
    this.sync();
  }

  /**
   * Remove panel from DOM
   */
  destroy() {
    if (this.panel) {
      this.panel.remove();
    }
  }
}

export default AlignmentTool;
