/**
 * Typewriter Delete Animation
 *
 * When the About section scrolls into view:
 * - A blinking cursor appears at the end of "No complicated jargon. No endless calls."
 * - Text is deleted character by character (backspace effect)
 * - Once deleted, "Just the path..." shifts left to fill the gap
 */

const CONFIG = {
  DELAY_BEFORE_DELETE: 2000,   // ms to wait after in view before starting delete
  DELETE_SPEED: 40,            // ms per character deletion
  CURSOR_BLINK_SPEED: 530,     // ms per blink cycle
  INTERSECTION_THRESHOLD: 0.5
};

let hasTriggered = false;

function initPhraseShift() {
  // Skip for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const disappearPhrase = document.querySelector('.phrase-disappear');
  const shiftPhrase = document.querySelector('.phrase-shift');

  if (!disappearPhrase || !shiftPhrase) {
    return;
  }

  // Store original text
  const originalText = disappearPhrase.textContent;

  // Create observer to detect when phrase comes into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasTriggered) {
        hasTriggered = true;

        // Wait, then trigger the typewriter delete animation
        setTimeout(() => {
          typewriterDelete(disappearPhrase, shiftPhrase, originalText);
        }, CONFIG.DELAY_BEFORE_DELETE);

        observer.disconnect();
      }
    });
  }, {
    threshold: CONFIG.INTERSECTION_THRESHOLD
  });

  observer.observe(disappearPhrase);
}

function typewriterDelete(disappearEl, shiftEl, text) {
  // Add cursor to the element
  disappearEl.classList.add('typewriter-deleting');

  let currentLength = text.length;

  // Create the deletion interval
  const deleteInterval = setInterval(() => {
    currentLength--;

    if (currentLength >= 0) {
      // Update text with remaining characters
      disappearEl.textContent = text.substring(0, currentLength);
    }

    if (currentLength <= 0) {
      // Deletion complete
      clearInterval(deleteInterval);

      // Hide the element completely and shift text
      disappearEl.classList.add('deleted');
      disappearEl.classList.remove('typewriter-deleting');
      shiftEl.classList.add('shift-active');

      // Dispatch event for animation chaining
      window.dispatchEvent(new CustomEvent('phraseDeleted'));
    }
  }, CONFIG.DELETE_SPEED);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhraseShift);
} else {
  initPhraseShift();
}
