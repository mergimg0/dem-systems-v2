// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Word-Level Semantic Animations', () => {
  test('word animations trigger on scroll', async ({ page }) => {
    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Check initial state - words should exist
    const initialState = await page.evaluate(() => {
      const friction = document.querySelector('.word-friction');
      const eliminate = document.querySelector('.word-eliminate');
      const clarity = document.querySelector('.word-clarity');

      return {
        friction: {
          exists: !!friction,
          hasActive: friction?.classList.contains('active'),
          text: friction?.textContent
        },
        eliminate: {
          exists: !!eliminate,
          hasActive: eliminate?.classList.contains('active'),
          text: eliminate?.textContent
        },
        clarity: {
          exists: !!clarity,
          hasActive: clarity?.classList.contains('active'),
          computedFilter: clarity ? getComputedStyle(clarity).filter : null,
          text: clarity?.textContent
        }
      };
    });

    console.log('\n=== Initial State (before scroll) ===');
    console.log(JSON.stringify(initialState, null, 2));

    // Verify words exist
    expect(initialState.friction.exists).toBe(true);
    expect(initialState.eliminate.exists).toBe(true);
    expect(initialState.clarity.exists).toBe(true);

    // Verify initial state - no active classes yet
    expect(initialState.friction.hasActive).toBe(false);
    expect(initialState.eliminate.hasActive).toBe(false);
    expect(initialState.clarity.hasActive).toBe(false);

    // Clarity should be blurred initially
    expect(initialState.clarity.computedFilter).toContain('blur');

    // Take screenshot before scroll
    await page.screenshot({ path: 'test-results/words-before-scroll.png' });

    // Scroll to About section to trigger P1 words (eliminate, friction)
    await page.evaluate(() => {
      const about = document.querySelector('#about');
      if (about) about.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(800);

    // Check P1 words triggered
    const afterP1Scroll = await page.evaluate(() => {
      const friction = document.querySelector('.word-friction');
      const eliminate = document.querySelector('.word-eliminate');

      return {
        friction: {
          hasActive: friction?.classList.contains('active')
        },
        eliminate: {
          hasActive: eliminate?.classList.contains('active')
        }
      };
    });

    console.log('\n=== After scrolling to About (P1) ===');
    console.log(JSON.stringify(afterP1Scroll, null, 2));

    // P1 words should now be active
    expect(afterP1Scroll.eliminate.hasActive).toBe(true);
    expect(afterP1Scroll.friction.hasActive).toBe(true);

    await page.screenshot({ path: 'test-results/words-p1-triggered.png' });

    // Scroll further to trigger clarity (P2)
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(800);

    // Check clarity word triggered
    const afterP2Scroll = await page.evaluate(() => {
      const clarity = document.querySelector('.word-clarity');

      return {
        clarity: {
          hasActive: clarity?.classList.contains('active'),
          hasRevealed: clarity?.classList.contains('revealed'),
          computedFilter: clarity ? getComputedStyle(clarity).filter : null
        }
      };
    });

    console.log('\n=== After scrolling to P2 ===');
    console.log(JSON.stringify(afterP2Scroll, null, 2));

    // Clarity should now be active (no blur)
    expect(afterP2Scroll.clarity.hasActive).toBe(true);
    expect(afterP2Scroll.clarity.computedFilter).toBe('none');

    await page.screenshot({ path: 'test-results/words-p2-triggered.png' });

    // Print all console logs
    console.log('\n=== Console Logs ===');
    consoleLogs.forEach(log => {
      if (log.text.includes('[Word]') || log.text.includes('semantic')) {
        console.log(`[${log.type}] ${log.text}`);
      }
    });
  });
});
