/**
 * DEM Systems - Mouse Reveal
 * Mouse tracking with lerp smoothing for fluid motion
 * Vanilla JS port of useMouseReveal.ts from automation-hero
 */

/**
 * Linear interpolation helper
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} factor - Lerp factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(current, target, factor) {
  return current + (target - current) * factor;
}

/**
 * MouseReveal - Tracks cursor with lerp smoothing
 */
export class MouseReveal {
  /**
   * @param {HTMLElement} containerEl - Element to track mouse events on
   * @param {Object} options - Configuration options
   * @param {number} options.lerpFactor - Smoothing factor (0.1-0.2 typical)
   * @param {boolean} options.enabled - Enable/disable tracking
   * @param {boolean} options.supportTouch - Enable touch event support
   */
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.lerpFactor = options.lerpFactor ?? 0.12;
    this.enabled = options.enabled ?? true;
    this.supportTouch = options.supportTouch ?? true;

    // Ref objects (plain objects, not React refs)
    // These avoid state re-renders in React, and work the same in vanilla JS
    this.mouseRef = { x: 0, y: 0, isActive: false };
    this.targetRef = { x: 0, y: 0, isActive: false };

    // Bound event handlers for cleanup
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseEnter = this._handleMouseEnter.bind(this);
    this._onMouseLeave = this._handleMouseLeave.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);

    if (this.enabled) {
      this._attachListeners();
    }
  }

  /**
   * Attach event listeners to container
   * @private
   */
  _attachListeners() {
    this.container.addEventListener('mousemove', this._onMouseMove);
    this.container.addEventListener('mouseenter', this._onMouseEnter);
    this.container.addEventListener('mouseleave', this._onMouseLeave);

    if (this.supportTouch) {
      this.container.addEventListener('touchmove', this._onTouchMove, { passive: true });
      this.container.addEventListener('touchend', this._onTouchEnd);
    }
  }

  /**
   * Remove event listeners
   * @private
   */
  _detachListeners() {
    this.container.removeEventListener('mousemove', this._onMouseMove);
    this.container.removeEventListener('mouseenter', this._onMouseEnter);
    this.container.removeEventListener('mouseleave', this._onMouseLeave);

    if (this.supportTouch) {
      this.container.removeEventListener('touchmove', this._onTouchMove);
      this.container.removeEventListener('touchend', this._onTouchEnd);
    }
  }

  /**
   * Handle mouse move - updates target position
   * @private
   * @param {MouseEvent} e
   */
  _handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.targetRef.x = e.clientX - rect.left;
    this.targetRef.y = e.clientY - rect.top;
    this.targetRef.isActive = true;
  }

  /**
   * Handle mouse enter
   * @private
   */
  _handleMouseEnter() {
    this.targetRef.isActive = true;
  }

  /**
   * Handle mouse leave
   * @private
   */
  _handleMouseLeave() {
    this.targetRef.isActive = false;
  }

  /**
   * Handle touch move - updates target position
   * @private
   * @param {TouchEvent} e
   */
  _handleTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = this.container.getBoundingClientRect();
      this.targetRef.x = touch.clientX - rect.left;
      this.targetRef.y = touch.clientY - rect.top;
      this.targetRef.isActive = true;
    }
  }

  /**
   * Handle touch end
   * @private
   */
  _handleTouchEnd() {
    this.targetRef.isActive = false;
  }

  /**
   * Update smoothed mouse position - call this in RAF loop
   * Applies lerp interpolation from target to mouse ref
   */
  updateMouse() {
    if (!this.enabled) return;

    this.mouseRef.x = lerp(this.mouseRef.x, this.targetRef.x, this.lerpFactor);
    this.mouseRef.y = lerp(this.mouseRef.y, this.targetRef.y, this.lerpFactor);
    this.mouseRef.isActive = this.targetRef.isActive;
  }

  /**
   * Get current smoothed mouse position
   * @returns {{ x: number, y: number, isActive: boolean }}
   */
  getPosition() {
    return { ...this.mouseRef };
  }

  /**
   * Get raw target position (no smoothing)
   * @returns {{ x: number, y: number, isActive: boolean }}
   */
  getTargetPosition() {
    return { ...this.targetRef };
  }

  /**
   * Set enabled state
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    if (this.enabled === enabled) return;

    this.enabled = enabled;
    if (enabled) {
      this._attachListeners();
    } else {
      this._detachListeners();
      this.mouseRef.isActive = false;
      this.targetRef.isActive = false;
    }
  }

  /**
   * Clean up - remove all listeners
   */
  destroy() {
    this._detachListeners();
    this.mouseRef = { x: 0, y: 0, isActive: false };
    this.targetRef = { x: 0, y: 0, isActive: false };
  }
}
