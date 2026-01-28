/**
 * Kinetic Typography
 * Holke79-inspired baseline animation with syllabic rhythm variation
 * Words bounce with staggered timing based on syllable count
 */

/**
 * Simplified syllable counter
 * Counts vowel groups as syllables (approximation)
 * @param {string} word - Word to count syllables for
 * @returns {number} Estimated syllable count
 */
function countSyllables(word) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 1;

  // Count vowel groups
  const vowelGroups = cleaned.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  // Adjust for silent e
  if (cleaned.endsWith('e') && count > 1) {
    count--;
  }

  // Adjust for -le ending (e.g., "simple" = 2)
  if (cleaned.endsWith('le') && cleaned.length > 2 && !/[aeiouy]/.test(cleaned[cleaned.length - 3])) {
    count++;
  }

  return Math.max(1, count);
}

/**
 * Initialize kinetic typography on hero tagline
 * Splits text into words and applies staggered baseline animation
 * @param {Object} options - Configuration options
 * @param {string} options.selector - CSS selector for target element
 * @param {number} options.activationDelay - Delay before animation starts (ms)
 */
export function initKineticTypography(options = {}) {
  const {
    selector = '.hero-tagline--kinetic',
    activationDelay = 800
  } = options;

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('[kinetic-typography] Disabled: prefers-reduced-motion');
    return;
  }

  const container = document.querySelector(selector);
  if (!container) {
    console.log(`[kinetic-typography] No element found for selector: ${selector}`);
    return;
  }

  // Get text content (handle both direct text and nested elements)
  const textContent = container.textContent.trim();
  if (!textContent) {
    console.log('[kinetic-typography] No text content found');
    return;
  }

  const words = textContent.split(/\s+/);

  // Build HTML with word spans
  container.innerHTML = words.map((word, index) => {
    const syllables = countSyllables(word);
    return `<span
      class="kinetic-word"
      data-syllables="${syllables}"
      style="--word-index: ${index}; --syllable-count: ${syllables}"
    >${word}</span>`;
  }).join(' ');

  // Activate animation after delay
  setTimeout(() => {
    container.classList.add('kinetic-active');
    console.log('[kinetic-typography] Animation activated');
  }, activationDelay);

  console.log(`[kinetic-typography] Initialized with ${words.length} words`);
}

/**
 * Destroy kinetic typography and restore original text
 * @param {string} selector - CSS selector for target element
 */
export function destroyKineticTypography(selector = '.hero-tagline--kinetic') {
  const container = document.querySelector(selector);
  if (!container) return;

  // Get text from word spans
  const words = Array.from(container.querySelectorAll('.kinetic-word'))
    .map(span => span.textContent);

  if (words.length) {
    container.textContent = words.join(' ');
  }

  container.classList.remove('kinetic-active');
  console.log('[kinetic-typography] Destroyed');
}
