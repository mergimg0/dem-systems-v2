// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('LetterMaskGenerator', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page where we can test canvas operations
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('class exports correctly and can be instantiated', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Dynamically import the module
      const module = await import('/js/letter-mask-generator.js');

      // Check export exists
      if (!module.LetterMaskGenerator) {
        return { error: 'LetterMaskGenerator not exported' };
      }

      // Test instantiation
      const generator = new module.LetterMaskGenerator('DEM Systems');

      return {
        exists: true,
        letterCount: generator.letterCount,
        revealedCount: generator.revealedCount
      };
    });

    expect(result.error).toBeUndefined();
    expect(result.exists).toBe(true);
    expect(result.letterCount).toBe(11); // "DEM Systems" = 11 characters
    expect(result.revealedCount).toBe(0);
  });

  test('init() calculates letter positions centered in container', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const module = await import('/js/letter-mask-generator.js');
      const generator = new module.LetterMaskGenerator('DEM Systems');

      // Create test canvas
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      // Initialize
      generator.init(ctx, 800, 200);

      // Check letter positions
      const letters = [];
      for (let i = 0; i < generator.letterCount; i++) {
        const bounds = generator.getLetterBounds(i);
        const center = generator.getLetterCenter(i);
        letters.push({
          index: i,
          bounds,
          center
        });
      }

      // Verify centering: first and last letter should be equidistant from edges
      const firstLetter = letters[0];
      const lastLetter = letters[letters.length - 1];
      const leftMargin = firstLetter.bounds.x;
      const rightMargin = 800 - (lastLetter.bounds.x + lastLetter.bounds.width);

      return {
        letterCount: letters.length,
        letters: letters.slice(0, 3), // First 3 letters for inspection
        leftMargin,
        rightMargin,
        marginsRoughlyEqual: Math.abs(leftMargin - rightMargin) < 10, // Allow small variance
        centerY: generator.getLetterCenter(0).y
      };
    });

    expect(result.letterCount).toBe(11);
    expect(result.marginsRoughlyEqual).toBe(true);
    expect(result.centerY).toBe(100); // Should be centered at height/2

    // Verify first few letters have valid bounds
    for (const letter of result.letters) {
      expect(letter.bounds.x).toBeGreaterThanOrEqual(0);
      expect(letter.bounds.width).toBeGreaterThan(0);
      expect(letter.bounds.height).toBeGreaterThan(0);
    }
  });

  test('drawLetter() renders individual letters correctly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const module = await import('/js/letter-mask-generator.js');
      const generator = new module.LetterMaskGenerator('AB');

      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      generator.init(ctx, 200, 100);

      // Clear and draw letter 0
      ctx.clearRect(0, 0, 200, 100);
      ctx.fillStyle = '#000';
      generator.drawLetter(ctx, 0);

      // Check if pixels were drawn (letter A should have content)
      const imageData = ctx.getImageData(0, 0, 200, 100);
      let hasContent = false;
      for (let i = 0; i < imageData.data.length; i += 4) {
        // Check alpha channel
        if (imageData.data[i + 3] > 0) {
          hasContent = true;
          break;
        }
      }

      return { hasContent };
    });

    expect(result.hasContent).toBe(true);
  });

  test('drawRevealedLetters() respects revealedCount', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const module = await import('/js/letter-mask-generator.js');
      const generator = new module.LetterMaskGenerator('ABC');

      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      generator.init(ctx, 300, 100);

      // With revealedCount = 0, nothing should be drawn
      ctx.clearRect(0, 0, 300, 100);
      generator.revealedCount = 0;
      generator.drawRevealedLetters(ctx);

      const emptyData = ctx.getImageData(0, 0, 300, 100);
      let emptyHasContent = false;
      for (let i = 0; i < emptyData.data.length; i += 4) {
        if (emptyData.data[i + 3] > 0) {
          emptyHasContent = true;
          break;
        }
      }

      // With revealedCount = 2, first two letters should be drawn
      ctx.clearRect(0, 0, 300, 100);
      generator.revealedCount = 2;
      generator.drawRevealedLetters(ctx);

      const partialData = ctx.getImageData(0, 0, 300, 100);
      let partialHasContent = false;
      for (let i = 0; i < partialData.data.length; i += 4) {
        if (partialData.data[i + 3] > 0) {
          partialHasContent = true;
          break;
        }
      }

      return {
        emptyHasContent,
        partialHasContent
      };
    });

    expect(result.emptyHasContent).toBe(false);
    expect(result.partialHasContent).toBe(true);
  });

  test('handles space character correctly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const module = await import('/js/letter-mask-generator.js');
      const generator = new module.LetterMaskGenerator('A B');

      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      generator.init(ctx, 300, 100);

      // Space is at index 1
      const spaceBounds = generator.getLetterBounds(1);
      const spaceCenter = generator.getLetterCenter(1);

      // Draw just the space character
      ctx.clearRect(0, 0, 300, 100);
      generator.drawLetter(ctx, 1);

      // Space should not draw visible content
      const spaceData = ctx.getImageData(0, 0, 300, 100);
      let spaceHasContent = false;
      for (let i = 0; i < spaceData.data.length; i += 4) {
        if (spaceData.data[i + 3] > 0) {
          spaceHasContent = true;
          break;
        }
      }

      return {
        spaceBounds,
        spaceCenter,
        spaceHasContent,
        spaceHasWidth: spaceBounds.width > 0
      };
    });

    // Space should have valid bounds (for timing/positioning) but not draw anything
    expect(result.spaceHasWidth).toBe(true);
    expect(result.spaceCenter.x).toBeGreaterThan(0);
    expect(result.spaceHasContent).toBe(false);
  });

  test('getLetterCenter() and getLetterBounds() return accurate values', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const module = await import('/js/letter-mask-generator.js');
      const generator = new module.LetterMaskGenerator('DEM');

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');

      generator.init(ctx, 400, 150);

      const metrics = [];
      for (let i = 0; i < 3; i++) {
        const bounds = generator.getLetterBounds(i);
        const center = generator.getLetterCenter(i);

        // Center should be within bounds
        const centerInBounds =
          center.x >= bounds.x &&
          center.x <= bounds.x + bounds.width &&
          center.y >= bounds.y &&
          center.y <= bounds.y + bounds.height;

        metrics.push({
          index: i,
          bounds,
          center,
          centerInBounds
        });
      }

      // Letters should be ordered left to right
      const orderedCorrectly =
        metrics[0].center.x < metrics[1].center.x &&
        metrics[1].center.x < metrics[2].center.x;

      return {
        metrics,
        orderedCorrectly
      };
    });

    expect(result.orderedCorrectly).toBe(true);
    for (const m of result.metrics) {
      expect(m.centerInBounds).toBe(true);
    }
  });

  test('font sizing is responsive', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const module = await import('/js/letter-mask-generator.js');

      // Test with small container
      const smallGenerator = new module.LetterMaskGenerator('A');
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = 400;
      smallCanvas.height = 100;
      const smallCtx = smallCanvas.getContext('2d');
      smallGenerator.init(smallCtx, 400, 100);
      const smallBounds = smallGenerator.getLetterBounds(0);

      // Test with large container
      const largeGenerator = new module.LetterMaskGenerator('A');
      const largeCanvas = document.createElement('canvas');
      largeCanvas.width = 1600;
      largeCanvas.height = 400;
      const largeCtx = largeCanvas.getContext('2d');
      largeGenerator.init(largeCtx, 1600, 400);
      const largeBounds = largeGenerator.getLetterBounds(0);

      return {
        smallHeight: smallBounds.height,
        largeHeight: largeBounds.height,
        largeIsBigger: largeBounds.height > smallBounds.height
      };
    });

    // Font should scale with container size
    expect(result.largeIsBigger).toBe(true);
  });

  test('handles custom font configuration', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const module = await import('/js/letter-mask-generator.js');

      // Test with custom font config
      const generator = new module.LetterMaskGenerator('Test', {
        fontFamily: 'Arial, sans-serif',
        fontWeight: 400
      });

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      generator.init(ctx, 400, 100);

      return {
        initialized: true,
        letterCount: generator.letterCount
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.letterCount).toBe(4);
  });

  test('handles out-of-bounds index gracefully', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const module = await import('/js/letter-mask-generator.js');
      const generator = new module.LetterMaskGenerator('AB');

      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      generator.init(ctx, 200, 100);

      // Test out of bounds
      let errorOnDraw = false;
      let errorOnBounds = false;
      let errorOnCenter = false;

      try {
        generator.drawLetter(ctx, -1);
        generator.drawLetter(ctx, 100);
      } catch (e) {
        errorOnDraw = true;
      }

      try {
        const bounds = generator.getLetterBounds(100);
        // Should return null or empty object
        if (bounds === null || bounds === undefined) {
          errorOnBounds = false;
        }
      } catch (e) {
        errorOnBounds = true;
      }

      try {
        const center = generator.getLetterCenter(-1);
        if (center === null || center === undefined) {
          errorOnCenter = false;
        }
      } catch (e) {
        errorOnCenter = true;
      }

      return {
        errorOnDraw,
        errorOnBounds,
        errorOnCenter
      };
    });

    // Should handle gracefully without throwing errors
    expect(result.errorOnDraw).toBe(false);
    expect(result.errorOnBounds).toBe(false);
    expect(result.errorOnCenter).toBe(false);
  });
});
