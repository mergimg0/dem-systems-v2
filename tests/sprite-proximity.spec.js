// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Sprite Proximity Animation System', () => {

  test('sprite triggers exist for all 6 phrases', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const spriteData = await page.evaluate(() => {
      const triggers = document.querySelectorAll('.sprite-trigger');
      const sprites = [];

      triggers.forEach(trigger => {
        sprites.push({
          spriteType: trigger.dataset.sprite,
          state: trigger.dataset.state,
          hasSprite: !!trigger.querySelector('.sprite-trigger__sprite'),
          hasAnimation: !!trigger.querySelector('.sprite-animation'),
          text: trigger.querySelector('.sprite-trigger__text')?.textContent?.trim().substring(0, 40)
        });
      });

      return sprites;
    });

    console.log('\n=== Sprite Triggers Found ===');
    console.log(JSON.stringify(spriteData, null, 2));

    // Should have exactly 6 sprite triggers
    expect(spriteData.length).toBe(6);

    // Verify all sprite types exist
    const spriteTypes = spriteData.map(s => s.spriteType);
    expect(spriteTypes).toContain('bespoke');
    expect(spriteTypes).toContain('friction');
    expect(spriteTypes).toContain('jargon');
    expect(spriteTypes).toContain('path');
    expect(spriteTypes).toContain('clarity');
    expect(spriteTypes).toContain('handle');

    // All should have sprite elements
    spriteData.forEach(sprite => {
      expect(sprite.hasSprite).toBe(true);
      expect(sprite.hasAnimation).toBe(true);
      expect(sprite.state).toBe('idle');
    });
  });

  test('sprites are hidden by default', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const spriteVisibility = await page.evaluate(() => {
      const sprites = document.querySelectorAll('.sprite-trigger__sprite');
      return Array.from(sprites).map(sprite => {
        const style = getComputedStyle(sprite);
        return {
          opacity: style.opacity,
          display: style.display
        };
      });
    });

    console.log('\n=== Sprite Visibility ===');
    console.log(JSON.stringify(spriteVisibility, null, 2));

    // All sprites should be hidden (opacity 0) by default
    spriteVisibility.forEach(sprite => {
      expect(parseFloat(sprite.opacity)).toBe(0);
    });
  });

  test('proximity detection works on desktop', async ({ page }) => {
    // Skip on mobile viewport
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width < 768) {
      test.skip();
      return;
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to about section and wait for it to be visible
    const trigger = page.locator('[data-sprite="bespoke"]');
    await trigger.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Get trigger bounding box using Playwright's method
    const box = await trigger.boundingBox();
    expect(box).not.toBeNull();
    console.log('\n=== Trigger Bounds ===', box);

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Simulate mouse movement by dispatching events directly
    // This ensures the proximity system receives the mousemove events
    await page.evaluate(({x, y}) => {
      const event = new MouseEvent('mousemove', {
        clientX: x,
        clientY: y,
        bubbles: true
      });
      document.dispatchEvent(event);
    }, { x: 0, y: 0 });
    await page.waitForTimeout(100);

    // Check state - should be 'none' proximity initially
    let state = await page.evaluate(() => {
      const trigger = document.querySelector('[data-sprite="bespoke"]');
      return trigger?.dataset.proximity;
    });
    console.log('Far away - proximity state:', state);
    expect(state).toBe('none');

    // Move mouse to outer proximity zone (100px away from center)
    await page.evaluate(({x, y}) => {
      const event = new MouseEvent('mousemove', {
        clientX: x,
        clientY: y,
        bubbles: true
      });
      document.dispatchEvent(event);
    }, { x: centerX + 100, y: centerY });
    // Wait for RAF to update proximity state
    await page.waitForTimeout(100);

    state = await page.evaluate(() => {
      const trigger = document.querySelector('[data-sprite="bespoke"]');
      return trigger?.dataset.proximity;
    });
    console.log('At 100px - proximity state:', state);
    // At 100px should be outer (between 75 and 150)
    expect(['outer', 'inner']).toContain(state);

    // Move mouse closer (50px away - should be inner)
    await page.evaluate(({x, y}) => {
      const event = new MouseEvent('mousemove', {
        clientX: x,
        clientY: y,
        bubbles: true
      });
      document.dispatchEvent(event);
    }, { x: centerX + 50, y: centerY });
    await page.waitForTimeout(100);

    state = await page.evaluate(() => {
      const trigger = document.querySelector('[data-sprite="bespoke"]');
      return trigger?.dataset.proximity;
    });
    console.log('At 50px - proximity state:', state);
    expect(state).toBe('inner');

    await page.screenshot({ path: 'test-results/sprite-proximity-inner.png' });
  });

  test('hover triggers full animation state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to about section
    await page.evaluate(() => {
      const about = document.querySelector('#about');
      if (about) about.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(500);

    // Find and hover over a sprite trigger
    const trigger = page.locator('[data-sprite="bespoke"]');
    await trigger.hover();
    // Wait for CSS transition to complete (300ms transition + buffer)
    await page.waitForTimeout(500);

    // Check hover state
    const hoverState = await page.evaluate(() => {
      const trigger = document.querySelector('[data-sprite="bespoke"]');
      const sprite = trigger?.querySelector('.sprite-trigger__sprite');
      return {
        state: trigger?.dataset.state,
        spriteOpacity: sprite ? getComputedStyle(sprite).opacity : null
      };
    });

    console.log('\n=== Hover State ===');
    console.log(JSON.stringify(hoverState, null, 2));

    expect(hoverState.state).toBe('hovering');
    // Opacity should be close to 1 (allow for floating point)
    expect(parseFloat(hoverState.spriteOpacity)).toBeGreaterThan(0.95);

    await page.screenshot({ path: 'test-results/sprite-hover-active.png' });
  });

  test('exit state triggers graceful fade', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to about section
    await page.evaluate(() => {
      const about = document.querySelector('#about');
      if (about) about.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(500);

    // Hover then move away
    const trigger = page.locator('[data-sprite="bespoke"]');
    await trigger.hover();
    await page.waitForTimeout(100);

    // Move mouse away
    await page.mouse.move(0, 0);
    await page.waitForTimeout(50);

    // Check exiting state
    const exitingState = await page.evaluate(() => {
      const trigger = document.querySelector('[data-sprite="bespoke"]');
      return trigger?.dataset.state;
    });

    console.log('Exit state:', exitingState);
    expect(exitingState).toBe('exiting');

    // Wait for full exit transition
    await page.waitForTimeout(600);

    const idleState = await page.evaluate(() => {
      const trigger = document.querySelector('[data-sprite="bespoke"]');
      return trigger?.dataset.state;
    });

    console.log('After exit:', idleState);
    expect(idleState).toBe('idle');
  });

  test('phrase #3 special elements exist', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const phrase3Setup = await page.evaluate(() => {
      const disappearEl = document.querySelector('.sprite-trigger--disappear');
      const shiftText = document.querySelector('.p2-shift-text');

      return {
        disappearExists: !!disappearEl,
        disappearSprite: disappearEl?.dataset.sprite,
        shiftTextExists: !!shiftText,
        shiftTextContent: shiftText?.textContent?.substring(0, 50)
      };
    });

    console.log('\n=== Phrase #3 Setup ===');
    console.log(JSON.stringify(phrase3Setup, null, 2));

    expect(phrase3Setup.disappearExists).toBe(true);
    expect(phrase3Setup.disappearSprite).toBe('jargon');
    expect(phrase3Setup.shiftTextExists).toBe(true);
  });

  test('reduced motion hides all sprites', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const spriteDisplay = await page.evaluate(() => {
      const sprites = document.querySelectorAll('.sprite-trigger__sprite');
      return Array.from(sprites).map(sprite => {
        const style = getComputedStyle(sprite);
        return {
          display: style.display
        };
      });
    });

    console.log('\n=== Reduced Motion Sprite Display ===');
    console.log(JSON.stringify(spriteDisplay, null, 2));

    // All sprites should be hidden with display: none
    spriteDisplay.forEach(sprite => {
      expect(sprite.display).toBe('none');
    });
  });

});
