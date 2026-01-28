// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * MetaballPhysics Unit Tests
 *
 * Tests for the metaball physics engine including:
 * - Field calculations (implicit surface function)
 * - Marching squares boundary extraction
 * - Spring physics for cursor following
 * - Blob splitting and merging
 * - Idle breathing animation
 */

test.describe('MetaballPhysics Class', () => {

  test.describe('Initialization', () => {

    test('exports MetaballPhysics class correctly', async ({ page }) => {
      await page.goto('/');

      const hasClass = await page.evaluate(async () => {
        try {
          const module = await import('/js/metaball-physics.js');
          return typeof module.MetaballPhysics === 'function';
        } catch (e) {
          console.error('Import error:', e);
          return false;
        }
      });

      expect(hasClass).toBe(true);
    });

    test('constructor sets default options', async ({ page }) => {
      await page.goto('/');

      const defaults = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        return {
          threshold: physics.threshold,
          gridResolution: physics.gridResolution,
          maxBlobs: physics.maxBlobs,
          baseRadius: physics.baseRadius
        };
      });

      expect(defaults.threshold).toBe(1.0);
      expect(defaults.gridResolution).toBe(10);
      expect(defaults.maxBlobs).toBe(4);
      expect(defaults.baseRadius).toBe(120);
    });

    test('constructor accepts custom options', async ({ page }) => {
      await page.goto('/');

      const custom = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({
          threshold: 0.8,
          gridResolution: 15,
          maxBlobs: 6,
          baseRadius: 100
        });
        return {
          threshold: physics.threshold,
          gridResolution: physics.gridResolution,
          maxBlobs: physics.maxBlobs,
          baseRadius: physics.baseRadius
        };
      });

      expect(custom.threshold).toBe(0.8);
      expect(custom.gridResolution).toBe(15);
      expect(custom.maxBlobs).toBe(6);
      expect(custom.baseRadius).toBe(100);
    });

    test('init() sets canvas dimensions', async ({ page }) => {
      await page.goto('/');

      const dimensions = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);
        return {
          width: physics.width,
          height: physics.height
        };
      });

      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
    });

  });

  test.describe('Blob Management', () => {

    test('addBlob() creates blob with correct properties', async ({ page }) => {
      await page.goto('/');

      const blobData = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);

        const index = physics.addBlob(400, 300, 100, true);
        const blobs = physics.getBlobs();

        return {
          index,
          blobCount: blobs.length,
          blob: blobs[index]
        };
      });

      expect(blobData.index).toBe(0);
      expect(blobData.blobCount).toBe(1);
      expect(blobData.blob.x).toBe(400);
      expect(blobData.blob.y).toBe(300);
      expect(blobData.blob.radius).toBe(100);
      expect(blobData.blob.isPrimary).toBe(true);
    });

    test('addBlob() respects maxBlobs limit', async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({ maxBlobs: 3 });
        physics.init(800, 600);

        physics.addBlob(100, 100, 50, true);
        physics.addBlob(200, 200, 50, false);
        physics.addBlob(300, 300, 50, false);
        const fourthIndex = physics.addBlob(400, 400, 50, false);

        return {
          blobCount: physics.getBlobs().length,
          fourthIndex
        };
      });

      expect(result.blobCount).toBe(3);
      expect(result.fourthIndex).toBe(-1);
    });

    test('reset() returns to single centered blob', async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({ baseRadius: 120 });
        physics.init(800, 600);

        physics.addBlob(100, 100, 50, true);
        physics.addBlob(200, 200, 50, false);
        physics.addBlob(300, 300, 50, false);

        physics.reset();
        const blobs = physics.getBlobs();

        return {
          blobCount: blobs.length,
          centerX: blobs[0]?.x,
          centerY: blobs[0]?.y,
          radius: blobs[0]?.radius,
          isPrimary: blobs[0]?.isPrimary
        };
      });

      expect(result.blobCount).toBe(1);
      expect(result.centerX).toBe(400); // center of 800
      expect(result.centerY).toBe(300); // center of 600
      expect(result.radius).toBe(120);
      expect(result.isPrimary).toBe(true);
    });

    test('getBlobs() returns all blob data', async ({ page }) => {
      await page.goto('/');

      const blobs = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);

        physics.addBlob(100, 150, 80, true);
        physics.addBlob(400, 300, 60, false);

        return physics.getBlobs();
      });

      expect(blobs.length).toBe(2);
      expect(blobs[0]).toHaveProperty('x');
      expect(blobs[0]).toHaveProperty('y');
      expect(blobs[0]).toHaveProperty('radius');
      expect(blobs[0]).toHaveProperty('vx');
      expect(blobs[0]).toHaveProperty('vy');
    });

  });

  test.describe('Field Calculations', () => {

    test('calculateField() returns high value at blob center', async ({ page }) => {
      await page.goto('/');

      const fieldValue = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);
        physics.addBlob(400, 300, 100, true);

        // Field at exact center should be very high (radius^2 / 1)
        return physics.calculateField(400, 300);
      });

      // At center: 100^2 / 1 = 10000
      expect(fieldValue).toBeGreaterThan(1000);
    });

    test('calculateField() decreases with distance', async ({ page }) => {
      await page.goto('/');

      const fieldValues = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);
        physics.addBlob(400, 300, 100, true);

        return {
          atCenter: physics.calculateField(400, 300),
          at50px: physics.calculateField(450, 300),
          at100px: physics.calculateField(500, 300),
          at200px: physics.calculateField(600, 300)
        };
      });

      expect(fieldValues.atCenter).toBeGreaterThan(fieldValues.at50px);
      expect(fieldValues.at50px).toBeGreaterThan(fieldValues.at100px);
      expect(fieldValues.at100px).toBeGreaterThan(fieldValues.at200px);
    });

    test('calculateField() sums contributions from multiple blobs', async ({ page }) => {
      await page.goto('/');

      const fieldValues = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);

        // Add single blob
        physics.addBlob(300, 300, 80, true);
        const singleBlobField = physics.calculateField(350, 300);

        // Add second blob nearby
        physics.addBlob(400, 300, 80, false);
        const twoBlobField = physics.calculateField(350, 300);

        return { singleBlobField, twoBlobField };
      });

      // Point between two blobs should have higher field
      expect(fieldValues.twoBlobField).toBeGreaterThan(fieldValues.singleBlobField);
    });

    test('isInsideSurface() returns true above threshold', async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({ threshold: 1.0 });
        physics.init(800, 600);
        physics.addBlob(400, 300, 100, true);

        return {
          atCenter: physics.isInsideSurface(400, 300),
          nearBlob: physics.isInsideSurface(450, 300),
          farAway: physics.isInsideSurface(700, 300)
        };
      });

      expect(result.atCenter).toBe(true);
      expect(result.nearBlob).toBe(true);
      expect(result.farAway).toBe(false);
    });

  });

  test.describe('Marching Squares', () => {

    test('getMaskPath() returns a Path2D object', async ({ page }) => {
      await page.goto('/');

      const isPath2D = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);
        physics.addBlob(400, 300, 100, true);

        const path = physics.getMaskPath();
        return path instanceof Path2D;
      });

      expect(isPath2D).toBe(true);
    });

    test('getMaskPath() generates boundary for single blob', async ({ page }) => {
      await page.goto('/');

      // We can't directly inspect Path2D contents, but we can verify
      // the method completes without error and produces usable output
      const result = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({ gridResolution: 20 });
        physics.init(400, 400);
        physics.addBlob(200, 200, 80, true);

        const path = physics.getMaskPath();

        // Create a test canvas and try to use the path
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // Fill the path - if it's valid this should work
        ctx.fillStyle = 'black';
        ctx.fill(path);

        // Check if any pixels were filled
        const imageData = ctx.getImageData(200, 200, 1, 1);
        const centerPixel = imageData.data[3]; // Alpha channel

        return {
          pathCreated: !!path,
          centerPixelFilled: centerPixel > 0
        };
      });

      expect(result.pathCreated).toBe(true);
      expect(result.centerPixelFilled).toBe(true);
    });

    test('getMaskPath() creates smooth merged boundary for overlapping blobs', async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({ gridResolution: 10 });
        physics.init(400, 400);

        // Two overlapping blobs
        physics.addBlob(150, 200, 80, true);
        physics.addBlob(250, 200, 80, false);

        const path = physics.getMaskPath();

        // Create a test canvas
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'black';
        ctx.fill(path);

        // Check pixels at both blob centers and in between
        const getAlpha = (x, y) => {
          const data = ctx.getImageData(x, y, 1, 1).data;
          return data[3];
        };

        return {
          blob1Center: getAlpha(150, 200) > 0,
          blob2Center: getAlpha(250, 200) > 0,
          midpoint: getAlpha(200, 200) > 0
        };
      });

      // All three points should be filled (merged boundary)
      expect(result.blob1Center).toBe(true);
      expect(result.blob2Center).toBe(true);
      expect(result.midpoint).toBe(true);
    });

  });

  test.describe('Spring Physics', () => {

    test('update() moves primary blob toward mouse with spring physics', async ({ page }) => {
      await page.goto('/');

      const positions = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);
        physics.addBlob(400, 300, 100, true);

        const initial = { ...physics.getBlobs()[0] };

        // Simulate several frames with mouse at 600, 300
        for (let i = 0; i < 30; i++) {
          physics.update(16, 600, 300, 0, 0);
        }

        const after = physics.getBlobs()[0];

        return {
          initialX: initial.x,
          afterX: after.x,
          movedTowardMouse: after.x > initial.x
        };
      });

      expect(positions.movedTowardMouse).toBe(true);
      expect(positions.afterX).toBeGreaterThan(positions.initialX);
      expect(positions.afterX).toBeLessThan(600); // Still lagging behind (spring)
    });

    test('update() applies velocity-based stretching', async ({ page }) => {
      await page.goto('/');

      const stretch = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);
        physics.addBlob(400, 300, 100, true);

        // Update with high mouse velocity
        physics.update(16, 500, 300, 50, 0);

        const blob = physics.getBlobs()[0];
        return {
          stretchX: blob.stretchX,
          stretchY: blob.stretchY,
          hasStretch: blob.stretchX > 1 || blob.stretchY < 1
        };
      });

      expect(stretch.hasStretch).toBe(true);
    });

    test('idle state produces breathing animation', async ({ page }) => {
      await page.goto('/');

      const breathScales = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics();
        physics.init(800, 600);
        physics.addBlob(400, 300, 100, true);

        // Collect breath scales over time (mouse stationary)
        const scales = [];
        for (let i = 0; i < 100; i++) {
          physics.update(16, 400, 300, 0, 0);
          scales.push(physics.getBlobs()[0].breathScale);
        }

        // Check for variation (breathing oscillation)
        const min = Math.min(...scales);
        const max = Math.max(...scales);

        return {
          min,
          max,
          hasVariation: max - min > 0.01
        };
      });

      expect(breathScales.hasVariation).toBe(true);
      expect(breathScales.min).toBeGreaterThan(0.95);
      expect(breathScales.max).toBeLessThan(1.05);
    });

  });

  test.describe('Blob Splitting and Merging', () => {

    test('fast movement causes blob splitting', async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({ maxBlobs: 4 });
        physics.init(800, 600);
        physics.addBlob(400, 300, 100, true);

        const initialCount = physics.getBlobs().length;

        // Simulate fast movement (high velocity)
        for (let i = 0; i < 50; i++) {
          physics.update(16, 400 + i * 5, 300, 30, 0);
        }

        const afterCount = physics.getBlobs().length;

        return {
          initialCount,
          afterCount,
          hasSplit: afterCount > initialCount
        };
      });

      expect(result.initialCount).toBe(1);
      expect(result.hasSplit).toBe(true);
    });

    test('secondary blobs merge when close to primary', async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({ maxBlobs: 4 });
        physics.init(800, 600);

        // Manually add primary and secondary blobs close together
        physics.addBlob(400, 300, 100, true);
        physics.addBlob(420, 300, 35, false);  // Close to primary

        const beforeCount = physics.getBlobs().length;

        // Update - secondary should merge into primary
        for (let i = 0; i < 20; i++) {
          physics.update(16, 400, 300, 0, 0);
        }

        const afterCount = physics.getBlobs().length;

        return {
          beforeCount,
          afterCount,
          merged: afterCount < beforeCount
        };
      });

      expect(result.beforeCount).toBe(2);
      expect(result.merged).toBe(true);
    });

    test('split blobs are positioned behind movement direction', async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({ maxBlobs: 4 });
        physics.init(800, 600);
        physics.addBlob(400, 300, 100, true);

        // Move right with high velocity to trigger split
        for (let i = 0; i < 50; i++) {
          physics.update(16, 400 + i * 10, 300, 40, 0);
        }

        const blobs = physics.getBlobs();
        if (blobs.length < 2) {
          return { hasSplit: false };
        }

        const primary = blobs[0];
        const secondary = blobs[1];

        return {
          hasSplit: true,
          primaryX: primary.x,
          secondaryX: secondary.x,
          secondaryBehindPrimary: secondary.x < primary.x
        };
      });

      expect(result.hasSplit).toBe(true);
      expect(result.secondaryBehindPrimary).toBe(true);
    });

  });

  test.describe('Performance', () => {

    test('maintains performance with 4 blobs', async ({ page }) => {
      await page.goto('/');

      const timing = await page.evaluate(async () => {
        const { MetaballPhysics } = await import('/js/metaball-physics.js');
        const physics = new MetaballPhysics({ maxBlobs: 4, gridResolution: 10 });
        physics.init(800, 600);

        physics.addBlob(200, 200, 80, true);
        physics.addBlob(600, 200, 60, false);
        physics.addBlob(200, 400, 60, false);
        physics.addBlob(600, 400, 60, false);

        // Measure update + getMaskPath time
        const iterations = 100;
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
          physics.update(16, 400 + Math.sin(i) * 100, 300, 5, 0);
          physics.getMaskPath();
        }

        const end = performance.now();
        const avgMs = (end - start) / iterations;

        return {
          averageFrameTime: avgMs,
          under16ms: avgMs < 16  // Target 60fps
        };
      });

      console.log(`Average frame time: ${timing.averageFrameTime.toFixed(2)}ms`);
      expect(timing.under16ms).toBe(true);
    });

  });

});
