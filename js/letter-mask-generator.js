/**
 * LetterMaskGenerator - Generates canvas-renderable masks for text letterforms
 *
 * Used for:
 * 1. Typewriter reveal animation (reveal video one letter at a time)
 * 2. Letter-to-blob morph (track letter positions for metaball targets)
 *
 * @module letter-mask-generator
 */

/**
 * Font configuration options
 * @typedef {Object} FontConfig
 * @property {string} [fontFamily='Satoshi, sans-serif'] - Font family to use
 * @property {number} [fontWeight=900] - Font weight (100-900)
 */

/**
 * Letter bounding box
 * @typedef {Object} LetterBounds
 * @property {number} x - Left edge x coordinate
 * @property {number} y - Top edge y coordinate
 * @property {number} width - Width of letter
 * @property {number} height - Height of letter
 */

/**
 * Letter center point
 * @typedef {Object} LetterCenter
 * @property {number} x - Center x coordinate
 * @property {number} y - Center y coordinate
 */

/**
 * Internal letter data structure
 * @typedef {Object} LetterData
 * @property {string} char - The character
 * @property {number} x - Center x position
 * @property {number} y - Center y position
 * @property {number} width - Character width
 * @property {number} height - Character height
 * @property {boolean} isSpace - Whether character is whitespace
 */

/**
 * Generates canvas-renderable masks for text letterforms.
 * Calculates letter positions and provides methods for drawing individual
 * or multiple letters as filled shapes for masking operations.
 */
export class LetterMaskGenerator {
  /**
   * Create a LetterMaskGenerator instance
   * @param {string} text - Text to render (e.g., "DEM Systems")
   * @param {FontConfig} [fontConfig={}] - Font configuration options
   */
  constructor(text, fontConfig = {}) {
    /** @type {string} */
    this.text = text;

    /** @type {string} */
    this.fontFamily = fontConfig.fontFamily || 'Satoshi, sans-serif';

    /** @type {number} */
    this.fontWeight = fontConfig.fontWeight || 900;

    /** @type {LetterData[]} */
    this.letters = [];

    /** @type {number} */
    this.fontSize = 64;

    /** @type {number} */
    this.centerY = 0;

    /** @type {number} */
    this._revealedCount = 0;

    /** @type {boolean} */
    this._initialized = false;
  }

  /**
   * Number of letters in the text (including spaces)
   * @type {number}
   */
  get letterCount() {
    return this.text.length;
  }

  /**
   * How many letters are currently revealed (0 to letterCount)
   * @type {number}
   */
  get revealedCount() {
    return this._revealedCount;
  }

  /**
   * Set the number of revealed letters
   * @param {number} value - Number of letters to reveal
   */
  set revealedCount(value) {
    this._revealedCount = Math.max(0, Math.min(value, this.letterCount));
  }

  /**
   * Calculate responsive font size based on container width.
   * Mimics CSS: clamp(64px, 10vw, 128px)
   * @param {number} width - Container width
   * @returns {number} Calculated font size
   * @private
   */
  _calculateFontSize(width) {
    // 10vw equivalent, clamped between 64px and 128px
    const vwBased = width * 0.1;
    return Math.min(Math.max(vwBased, 64), 128);
  }

  /**
   * Initialize the generator with container dimensions.
   * MUST be called after the container is sized and before drawing.
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
   * @param {number} width - Container width in CSS pixels
   * @param {number} height - Container height in CSS pixels
   */
  init(ctx, width, height) {
    // Calculate responsive font size
    this.fontSize = this._calculateFontSize(width);

    // Set up font for measurement
    ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Clear previous letter data
    this.letters = [];

    // Measure each letter and accumulate positions
    let currentX = 0;

    for (const char of this.text) {
      const metrics = ctx.measureText(char);
      const letterWidth = metrics.width;

      // Height approximation (Canvas TextMetrics doesn't provide reliable height)
      // Use font size * 0.8 as a reasonable approximation for capital letters
      const letterHeight = this.fontSize * 0.8;

      this.letters.push({
        char,
        x: currentX + letterWidth / 2, // Store center position
        y: height / 2, // Will be set to centerY
        width: letterWidth,
        height: letterHeight,
        isSpace: char === ' ' || char === '\t' || char === '\n'
      });

      currentX += letterWidth;
    }

    // Calculate total text width and center offset
    const totalWidth = currentX;
    const offsetX = (width - totalWidth) / 2;

    // Apply offset to center all letters
    for (const letter of this.letters) {
      letter.x += offsetX;
    }

    // Store center Y for drawing
    this.centerY = height / 2;

    // Mark as initialized
    this._initialized = true;
  }

  /**
   * Draw a single letter as a filled shape (for masking).
   * Uses ctx.fillText with the letter at its calculated position.
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
   * @param {number} index - Letter index (0-based)
   */
  drawLetter(ctx, index) {
    // Validate index bounds
    if (index < 0 || index >= this.letters.length) {
      return;
    }

    const letter = this.letters[index];

    // Skip drawing spaces (but they still exist for positioning/timing)
    if (letter.isSpace) {
      return;
    }

    // Set up font and style
    ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; // White for mask

    // Draw the letter at its position
    ctx.fillText(letter.char, letter.x, this.centerY);
  }

  /**
   * Draw all revealed letters (0 to revealedCount - 1).
   * Useful for progressive typewriter reveal effect.
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
   */
  drawRevealedLetters(ctx) {
    // Set up font once for efficiency
    ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; // White for mask

    // Draw each revealed letter
    for (let i = 0; i < this._revealedCount; i++) {
      const letter = this.letters[i];

      // Skip spaces
      if (letter.isSpace) {
        continue;
      }

      ctx.fillText(letter.char, letter.x, this.centerY);
    }
  }

  /**
   * Get the center point of a letter.
   * Useful for morph target calculations.
   *
   * @param {number} index - Letter index (0-based)
   * @returns {LetterCenter|null} Center point or null if index is invalid
   */
  getLetterCenter(index) {
    if (index < 0 || index >= this.letters.length) {
      return null;
    }

    const letter = this.letters[index];
    return {
      x: letter.x,
      y: this.centerY
    };
  }

  /**
   * Get the bounding box of a letter.
   * Useful for collision detection and morph calculations.
   *
   * @param {number} index - Letter index (0-based)
   * @returns {LetterBounds|null} Bounding box or null if index is invalid
   */
  getLetterBounds(index) {
    if (index < 0 || index >= this.letters.length) {
      return null;
    }

    const letter = this.letters[index];
    return {
      x: letter.x - letter.width / 2,
      y: this.centerY - letter.height / 2,
      width: letter.width,
      height: letter.height
    };
  }

  /**
   * Get all letter data for external use.
   * Useful for debugging or advanced animations.
   *
   * @returns {LetterData[]} Copy of letter data array
   */
  getAllLetterData() {
    return this.letters.map(l => ({ ...l }));
  }

  /**
   * Check if the generator has been initialized.
   *
   * @returns {boolean} True if init() has been called
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Reset the generator state.
   * Call this before reinitializing with new dimensions.
   */
  reset() {
    this.letters = [];
    this._revealedCount = 0;
    this._initialized = false;
  }
}
