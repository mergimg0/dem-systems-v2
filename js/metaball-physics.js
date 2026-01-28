/**
 * MetaballPhysics - Organic blob physics engine with marching squares
 *
 * Creates fluid, organic blob behavior for the hero video reveal:
 * - Spring physics for cursor following
 * - Velocity-based stretching and splitting
 * - Blob merging when close together
 * - Marching squares boundary extraction for smooth masks
 *
 * @see hero-video-reveal.js (integration point)
 */

// === MARCHING SQUARES LOOKUP TABLE ===
// Each cell has 4 corners (TL, TR, BR, BL) = 16 possible configurations
// Values indicate which edges to connect (0=top, 1=right, 2=bottom, 3=left)
const MARCHING_SQUARES_EDGES = [
  [],              // 0: 0000 - all outside
  [[3, 0]],        // 1: 0001 - bottom-left inside
  [[2, 3]],        // 2: 0010 - bottom-right inside
  [[2, 0]],        // 3: 0011 - bottom inside
  [[1, 2]],        // 4: 0100 - top-right inside
  [[3, 0], [1, 2]], // 5: 0101 - diagonal BL-TR (saddle)
  [[1, 3]],        // 6: 0110 - right inside
  [[1, 0]],        // 7: 0111 - all but top-left
  [[0, 1]],        // 8: 1000 - top-left inside
  [[3, 1]],        // 9: 1001 - left inside
  [[0, 1], [2, 3]], // 10: 1010 - diagonal TL-BR (saddle)
  [[2, 1]],        // 11: 1011 - all but top-right
  [[0, 2]],        // 12: 1100 - top inside
  [[3, 2]],        // 13: 1101 - all but bottom-right
  [[0, 3]],        // 14: 1110 - all but bottom-left
  []               // 15: 1111 - all inside
];

/**
 * Blob data structure
 * @typedef {Object} Blob
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} vx - X velocity
 * @property {number} vy - Y velocity
 * @property {number} radius - Base radius
 * @property {number} stretchX - Horizontal stretch factor
 * @property {number} stretchY - Vertical stretch factor
 * @property {boolean} isPrimary - Whether this is the main blob
 * @property {number} life - Life remaining (0-1, for secondary blobs)
 */

/**
 * Physics engine for organic metaball behavior
 */
export class MetaballPhysics {
  /**
   * Create a MetaballPhysics instance
   * @param {Object} options - Configuration options
   * @param {number} [options.threshold=1.0] - Metaball surface threshold
   * @param {number} [options.gridResolution=10] - Marching squares grid cell size
   * @param {number} [options.maxBlobs=4] - Maximum number of blobs
   * @param {number} [options.baseRadius=120] - Default blob radius
   * @param {number} [options.springK=0.08] - Spring constant for cursor following
   * @param {number} [options.damping=0.85] - Velocity damping factor
   * @param {number} [options.splitThreshold=15] - Velocity threshold for splitting
   * @param {number} [options.mergeDistance=0.8] - Distance (as radius multiple) for merging
   * @param {number} [options.breathAmplitude=0.03] - Idle breathing amplitude
   * @param {number} [options.breathSpeed=0.002] - Idle breathing speed
   */
  constructor(options = {}) {
    this.threshold = options.threshold ?? 1.0;
    this.gridResolution = options.gridResolution ?? 10;
    this.maxBlobs = options.maxBlobs ?? 4;
    this.baseRadius = options.baseRadius ?? 120;
    this.springK = options.springK ?? 0.08;
    this.damping = options.damping ?? 0.85;
    this.splitThreshold = options.splitThreshold ?? 15;
    this.mergeDistance = options.mergeDistance ?? 0.8;
    this.breathAmplitude = options.breathAmplitude ?? 0.03;
    this.breathSpeed = options.breathSpeed ?? 0.002;

    /** @type {Blob[]} */
    this.blobs = [];
    this.width = 0;
    this.height = 0;
    this.breathPhase = 0;
    this.lastSplitTime = 0;
    this.splitCooldown = 300; // ms between splits
  }

  /**
   * Initialize the physics engine with canvas dimensions
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  init(width, height) {
    this.width = width;
    this.height = height;

    // Start with a single primary blob at center
    this.blobs = [];
    this.addBlob(width / 2, height / 2, this.baseRadius, true);
  }

  /**
   * Add a blob to the simulation
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} radius - Blob radius
   * @param {boolean} [isPrimary=false] - Whether this is the primary blob
   * @returns {Blob} The created blob
   */
  addBlob(x, y, radius, isPrimary = false) {
    const blob = {
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      stretchX: 1,
      stretchY: 1,
      isPrimary,
      life: 1.0
    };
    this.blobs.push(blob);
    return blob;
  }

  /**
   * Calculate the metaball field value at a point
   * Uses the classic r^2/d^2 formula for smooth blending
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Field strength at the point
   */
  calculateField(x, y) {
    let sum = 0;

    for (const blob of this.blobs) {
      // Apply stretch factors for elongated shapes
      const dx = (x - blob.x) / blob.stretchX;
      const dy = (y - blob.y) / blob.stretchY;
      const distSq = dx * dx + dy * dy;

      // Avoid division by zero
      if (distSq < 0.0001) {
        sum += 1000; // Effectively inside
      } else {
        // Classic metaball formula: r^2 / d^2
        const rSq = blob.radius * blob.radius;
        sum += rSq / distSq;
      }
    }

    return sum;
  }

  /**
   * Check if a point is inside the metaball surface
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if inside the surface
   */
  isInsideSurface(x, y) {
    return this.calculateField(x, y) >= this.threshold;
  }

  /**
   * Extract the metaball boundary using marching squares
   * @returns {Path2D} Path representing the metaball boundary
   */
  getMaskPath() {
    const path = new Path2D();
    const res = this.gridResolution;
    const cols = Math.ceil(this.width / res) + 1;
    const rows = Math.ceil(this.height / res) + 1;

    // Pre-compute field values at grid points
    const field = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * res;
        const y = j * res;
        field[j * cols + i] = this.calculateField(x, y);
      }
    }

    // Process each cell using marching squares
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        // Get field values at four corners (TL, TR, BR, BL)
        const tl = field[j * cols + i];
        const tr = field[j * cols + i + 1];
        const br = field[(j + 1) * cols + i + 1];
        const bl = field[(j + 1) * cols + i];

        // Compute cell index (4-bit binary: TL TR BR BL)
        const index =
          (tl >= this.threshold ? 8 : 0) |
          (tr >= this.threshold ? 4 : 0) |
          (br >= this.threshold ? 2 : 0) |
          (bl >= this.threshold ? 1 : 0);

        // Skip empty cells
        if (index === 0 || index === 15) continue;

        // Get edge connections for this configuration
        const edges = MARCHING_SQUARES_EDGES[index];
        const x = i * res;
        const y = j * res;

        // Draw each edge segment
        for (const [e1, e2] of edges) {
          const p1 = this.interpolateEdge(x, y, res, e1, tl, tr, br, bl);
          const p2 = this.interpolateEdge(x, y, res, e2, tl, tr, br, bl);

          path.moveTo(p1.x, p1.y);
          path.lineTo(p2.x, p2.y);
        }
      }
    }

    return path;
  }

  /**
   * Interpolate point position along a cell edge
   * @param {number} x - Cell X position
   * @param {number} y - Cell Y position
   * @param {number} res - Grid resolution
   * @param {number} edge - Edge index (0=top, 1=right, 2=bottom, 3=left)
   * @param {number} tl - Top-left field value
   * @param {number} tr - Top-right field value
   * @param {number} br - Bottom-right field value
   * @param {number} bl - Bottom-left field value
   * @returns {{x: number, y: number}} Interpolated point
   */
  interpolateEdge(x, y, res, edge, tl, tr, br, bl) {
    const t = this.threshold;

    switch (edge) {
      case 0: { // Top edge (TL to TR)
        const lerp = (t - tl) / (tr - tl);
        return { x: x + lerp * res, y };
      }
      case 1: { // Right edge (TR to BR)
        const lerp = (t - tr) / (br - tr);
        return { x: x + res, y: y + lerp * res };
      }
      case 2: { // Bottom edge (BR to BL)
        const lerp = (t - bl) / (br - bl);
        return { x: x + lerp * res, y: y + res };
      }
      case 3: { // Left edge (TL to BL)
        const lerp = (t - tl) / (bl - tl);
        return { x, y: y + lerp * res };
      }
      default:
        return { x, y };
    }
  }

  /**
   * Get a filled Path2D for the metaball surface
   * Uses contour tracing for a closed path suitable for filling
   * @returns {Path2D} Closed path for filling
   */
  getFilledMaskPath() {
    const path = new Path2D();
    const res = this.gridResolution;
    const padding = this.baseRadius * 2;

    // Find bounding box of all blobs
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const blob of this.blobs) {
      const r = blob.radius * Math.max(blob.stretchX, blob.stretchY);
      minX = Math.min(minX, blob.x - r);
      minY = Math.min(minY, blob.y - r);
      maxX = Math.max(maxX, blob.x + r);
      maxY = Math.max(maxY, blob.y + r);
    }

    // Add padding and clamp to canvas
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(this.width, maxX + padding);
    maxY = Math.min(this.height, maxY + padding);

    // Sample points along the boundary at high resolution
    const points = [];
    const sampleRes = res / 2;

    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
      // Cast ray from center of mass outward
      const cx = this.blobs.reduce((s, b) => s + b.x, 0) / this.blobs.length;
      const cy = this.blobs.reduce((s, b) => s + b.y, 0) / this.blobs.length;

      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      // Binary search for surface intersection
      let lo = 0;
      let hi = Math.max(this.width, this.height);

      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const x = cx + dx * mid;
        const y = cy + dy * mid;

        if (this.calculateField(x, y) >= this.threshold) {
          lo = mid;
        } else {
          hi = mid;
        }
      }

      const dist = (lo + hi) / 2;
      points.push({
        x: cx + dx * dist,
        y: cy + dy * dist
      });
    }

    // Build smooth path from points
    if (points.length > 0) {
      path.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[(i + 1) % points.length];

        // Use quadratic curve for smoothness
        const cpx = curr.x;
        const cpy = curr.y;
        const epx = (curr.x + next.x) / 2;
        const epy = (curr.y + next.y) / 2;

        path.quadraticCurveTo(cpx, cpy, epx, epy);
      }

      path.closePath();
    }

    return path;
  }

  /**
   * Update physics simulation
   * @param {number} dt - Delta time in milliseconds
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} mouseVX - Mouse X velocity
   * @param {number} mouseVY - Mouse Y velocity
   */
  update(dt, mouseX, mouseY, mouseVX, mouseVY) {
    const now = performance.now();

    // Update breathing phase
    this.breathPhase += this.breathSpeed * dt;

    // Find primary blob
    const primary = this.blobs.find(b => b.isPrimary);
    if (!primary) return;

    // === PRIMARY BLOB: Spring physics toward cursor ===
    const targetX = mouseX;
    const targetY = mouseY;

    // Spring force
    primary.vx += (targetX - primary.x) * this.springK;
    primary.vy += (targetY - primary.y) * this.springK;

    // Damping
    primary.vx *= this.damping;
    primary.vy *= this.damping;

    // Update position
    primary.x += primary.vx;
    primary.y += primary.vy;

    // === VELOCITY-BASED STRETCHING ===
    const speed = Math.sqrt(primary.vx * primary.vx + primary.vy * primary.vy);
    const stretchAmount = Math.min(speed / 20, 0.5); // Max 50% stretch

    if (speed > 1) {
      // Stretch along velocity direction
      const angle = Math.atan2(primary.vy, primary.vx);
      const cos = Math.abs(Math.cos(angle));
      const sin = Math.abs(Math.sin(angle));

      // Stretch in movement direction, compress perpendicular
      primary.stretchX = 1 + stretchAmount * cos - stretchAmount * sin * 0.3;
      primary.stretchY = 1 + stretchAmount * sin - stretchAmount * cos * 0.3;
    } else {
      // Return to circular with breathing
      const breath = 1 + Math.sin(this.breathPhase) * this.breathAmplitude;
      primary.stretchX += (breath - primary.stretchX) * 0.1;
      primary.stretchY += (breath - primary.stretchY) * 0.1;
    }

    // === BLOB SPLITTING on fast movement ===
    if (speed > this.splitThreshold &&
        this.blobs.length < this.maxBlobs &&
        now - this.lastSplitTime > this.splitCooldown) {
      this.splitSecondaryBlob(primary, primary.vx, primary.vy);
      this.lastSplitTime = now;
    }

    // === UPDATE SECONDARY BLOBS ===
    this.updateSecondaryBlobs(dt);

    // === MERGE NEARBY BLOBS ===
    this.mergeNearbyBlobs();
  }

  /**
   * Split off a secondary blob behind the primary's movement
   * @param {Blob} parent - The parent blob to split from
   * @param {number} vx - Parent's X velocity
   * @param {number} vy - Parent's Y velocity
   */
  splitSecondaryBlob(parent, vx, vy) {
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 0.1) return;

    // Spawn behind movement direction
    const dirX = -vx / speed;
    const dirY = -vy / speed;
    const spawnDist = parent.radius * 0.8;

    const newBlob = this.addBlob(
      parent.x + dirX * spawnDist,
      parent.y + dirY * spawnDist,
      parent.radius * 0.4,
      false
    );

    // Give it some initial velocity away from parent
    newBlob.vx = dirX * speed * 0.3;
    newBlob.vy = dirY * speed * 0.3;
    newBlob.life = 1.0;
  }

  /**
   * Update secondary (non-primary) blobs
   * They drift toward the primary blob over time
   * @param {number} dt - Delta time in milliseconds
   */
  updateSecondaryBlobs(dt) {
    const primary = this.blobs.find(b => b.isPrimary);
    if (!primary) return;

    const secondaries = this.blobs.filter(b => !b.isPrimary);

    for (const blob of secondaries) {
      // Decay life over time
      blob.life -= 0.001 * dt;

      // Attract toward primary
      const dx = primary.x - blob.x;
      const dy = primary.y - blob.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.1) {
        const attraction = 0.02;
        blob.vx += (dx / dist) * attraction;
        blob.vy += (dy / dist) * attraction;
      }

      // Apply velocity with damping
      blob.vx *= 0.95;
      blob.vy *= 0.95;
      blob.x += blob.vx;
      blob.y += blob.vy;

      // Breathing effect (offset from primary)
      const breathOffset = blob.life * Math.PI;
      const breath = 1 + Math.sin(this.breathPhase + breathOffset) * this.breathAmplitude * 0.5;
      blob.stretchX = breath;
      blob.stretchY = breath;

      // Shrink as life decreases
      blob.radius = this.baseRadius * 0.4 * Math.max(0.2, blob.life);
    }

    // Remove dead blobs
    this.blobs = this.blobs.filter(b => b.isPrimary || b.life > 0);
  }

  /**
   * Merge secondary blobs that get too close to the primary
   */
  mergeNearbyBlobs() {
    const primary = this.blobs.find(b => b.isPrimary);
    if (!primary) return;

    const mergeThreshold = primary.radius * this.mergeDistance;

    this.blobs = this.blobs.filter(blob => {
      if (blob.isPrimary) return true;

      const dx = primary.x - blob.x;
      const dy = primary.y - blob.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Merge if close enough
      if (dist < mergeThreshold) {
        // Transfer some momentum to primary
        primary.vx += blob.vx * 0.2;
        primary.vy += blob.vy * 0.2;
        return false; // Remove this blob
      }

      return true;
    });
  }

  /**
   * Get all blobs for debugging/visualization
   * @returns {Blob[]} Array of all blobs
   */
  getBlobs() {
    return this.blobs;
  }

  /**
   * Get the primary blob
   * @returns {Blob|undefined} The primary blob or undefined
   */
  getPrimaryBlob() {
    return this.blobs.find(b => b.isPrimary);
  }

  /**
   * Reset to initial state with a single centered blob
   */
  reset() {
    this.blobs = [];
    this.breathPhase = 0;
    this.lastSplitTime = 0;
    this.addBlob(this.width / 2, this.height / 2, this.baseRadius, true);
  }

  /**
   * Set the position of the primary blob directly
   * Useful for initialization or teleporting
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPrimaryPosition(x, y) {
    const primary = this.blobs.find(b => b.isPrimary);
    if (primary) {
      primary.x = x;
      primary.y = y;
      primary.vx = 0;
      primary.vy = 0;
    }
  }

  /**
   * Resize the physics simulation bounds
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    const scaleX = width / this.width;
    const scaleY = height / this.height;

    this.width = width;
    this.height = height;

    // Scale blob positions proportionally
    for (const blob of this.blobs) {
      blob.x *= scaleX;
      blob.y *= scaleY;
    }
  }
}
