// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Phrase Disappear & Shift Animation', () => {

  test('phrase elements exist in DOM', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const elements = await page.evaluate(() => {
      const disappear = document.querySelector('.phrase-disappear');
      const shift = document.querySelector('.phrase-shift');

      return {
        disappearExists: !!disappear,
        disappearText: disappear?.textContent?.trim(),
        shiftExists: !!shift,
        shiftText: shift?.textContent?.trim().substring(0, 50)
      };
    });

    console.log('\n=== Phrase Elements ===');
    console.log(JSON.stringify(elements, null, 2));

    expect(elements.disappearExists).toBe(true);
    expect(elements.disappearText).toBe('No complicated jargon. No endless calls.');
    expect(elements.shiftExists).toBe(true);
    expect(elements.shiftText).toContain('Just the path');
  });

  test('typewriter delete animation triggers after scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Initial state - no classes applied
    const initialState = await page.evaluate(() => {
      const disappear = document.querySelector('.phrase-disappear');
      const shift = document.querySelector('.phrase-shift');
      return {
        hasDeleting: disappear?.classList.contains('typewriter-deleting'),
        hasDeleted: disappear?.classList.contains('deleted'),
        hasShiftActive: shift?.classList.contains('shift-active'),
        textLength: disappear?.textContent?.length
      };
    });

    console.log('\n=== Initial State ===');
    console.log(JSON.stringify(initialState, null, 2));

    expect(initialState.hasDeleting).toBe(false);
    expect(initialState.hasDeleted).toBe(false);
    expect(initialState.hasShiftActive).toBe(false);
    expect(initialState.textLength).toBeGreaterThan(30); // Full text present

    // Scroll to about section to trigger animation
    await page.evaluate(() => {
      const about = document.querySelector('#about');
      if (about) about.scrollIntoView({ behavior: 'instant', block: 'center' });
    });

    // Wait for initial delay + some deletion time
    await page.waitForTimeout(2500);

    // Check deletion is in progress
    const midState = await page.evaluate(() => {
      const disappear = document.querySelector('.phrase-disappear');
      return {
        hasDeleting: disappear?.classList.contains('typewriter-deleting'),
        textLength: disappear?.textContent?.length
      };
    });

    console.log('\n=== Mid-Delete State ===');
    console.log(JSON.stringify(midState, null, 2));

    // Should be deleting (text shorter than original)
    expect(midState.textLength).toBeLessThan(initialState.textLength);

    // Wait for deletion to complete (40ms * 40 chars = ~1.6s more)
    await page.waitForTimeout(2000);

    // Check animation completed
    const afterState = await page.evaluate(() => {
      const disappear = document.querySelector('.phrase-disappear');
      const shift = document.querySelector('.phrase-shift');
      return {
        hasDeleted: disappear?.classList.contains('deleted'),
        hasShiftActive: shift?.classList.contains('shift-active'),
        disappearDisplay: disappear ? getComputedStyle(disappear).display : null
      };
    });

    console.log('\n=== After Animation ===');
    console.log(JSON.stringify(afterState, null, 2));

    expect(afterState.hasDeleted).toBe(true);
    expect(afterState.hasShiftActive).toBe(true);
    expect(afterState.disappearDisplay).toBe('none');

    await page.screenshot({ path: 'test-results/phrase-typewriter-after.png' });
  });

  test('reduced motion skips animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to trigger
    await page.evaluate(() => {
      const about = document.querySelector('#about');
      if (about) about.scrollIntoView({ behavior: 'instant', block: 'center' });
    });

    // Wait for potential animation
    await page.waitForTimeout(3000);

    // Animation should NOT have triggered for reduced motion
    const state = await page.evaluate(() => {
      const disappear = document.querySelector('.phrase-disappear');
      const shift = document.querySelector('.phrase-shift');
      return {
        hasFadeOut: disappear?.classList.contains('fade-out'),
        hasShiftActive: shift?.classList.contains('shift-active')
      };
    });

    console.log('\n=== Reduced Motion State ===');
    console.log(JSON.stringify(state, null, 2));

    // Should NOT have animation classes
    expect(state.hasFadeOut).toBe(false);
    expect(state.hasShiftActive).toBe(false);
  });

});
