/**
 * DEM Systems - Navigation
 * Handles scroll-based nav transitions and typewriter logo animation
 */

// Constants
const FULL_TEXT = 'DEM Systems';
const COMPACT_TEXT = 'DEM';
const CHAR_DURATION = 50; // ms per character

// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// State
let navElement = null;
let logoTextElement = null;
let heroTitleElement = null;
let navHeight = 72; // matches --nav-height CSS variable
let isAnimating = false;
let animationInterval = null;

// Logo state: 'full' (DEM Systems), 'compact' (DEM)
let currentLogoState = 'full';

/**
 * Determine logo state based on hero title position
 * Three states:
 *   1. Hero below nav (at top) → 'full' (DEM Systems)
 *   2. Hero overlapping/near nav → 'compact' (DEM) - get out of the way
 *   3. Hero scrolled past nav → 'full' (DEM Systems)
 */
function getDesiredLogoState() {
  if (!heroTitleElement) return 'full';

  const rect = heroTitleElement.getBoundingClientRect();
  const heroTop = rect.top;
  const heroBottom = rect.bottom;

  // Hero title is approaching or overlapping nav area
  // Contract when hero top is within 30px of nav bottom (tighter threshold)
  // Expand back when hero bottom is 50px above nav (earlier recovery on scroll up)
  const approachingNav = heroTop < navHeight + 30;
  const stillNearNav = heroBottom > navHeight - 50;

  if (approachingNav && stillNearNav) {
    // Hero is in the "passing through" zone - contract logo
    return 'compact';
  }

  // Either hero is still well below nav, or hero has fully passed - show full logo
  return 'full';
}

/**
 * Initialize navigation functionality
 */
function initNav() {
  navElement = document.querySelector('.nav');
  logoTextElement = document.querySelector('.nav__logo-text');
  heroTitleElement = document.querySelector('.hero-title');

  if (!navElement || !logoTextElement) return;

  // Set up scroll detection with requestAnimationFrame throttling
  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // Initial check in case page is already scrolled
  handleScroll();

  // Set up smooth scroll for nav links with offset
  initNavSmoothScroll();
}

/**
 * Handle scroll position changes
 * Checks hero position and updates logo state accordingly
 */
function handleScroll() {
  const desiredState = getDesiredLogoState();

  if (desiredState !== currentLogoState) {
    currentLogoState = desiredState;
    updateNavState();
  }
}

/**
 * Update navigation visual state based on currentLogoState
 */
function updateNavState() {
  if (!navElement) return;

  if (currentLogoState === 'compact') {
    navElement.classList.add('nav--scrolled');
    animateLogoToCompact();
  } else {
    navElement.classList.remove('nav--scrolled');
    animateLogoToFull();
  }
}

/**
 * Animate logo text from "DEM Systems" to "DEM" (typewriter delete)
 */
function animateLogoToCompact() {
  if (!logoTextElement) return;

  // Cancel any ongoing animation
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  // Reduced motion: instant change
  if (prefersReducedMotion) {
    logoTextElement.textContent = COMPACT_TEXT;
    return;
  }

  // Already at target
  if (logoTextElement.textContent === COMPACT_TEXT) return;

  isAnimating = true;
  let currentText = logoTextElement.textContent;

  // Delete characters from the end until we reach "DEM"
  animationInterval = setInterval(() => {
    if (currentText.length <= COMPACT_TEXT.length) {
      clearInterval(animationInterval);
      animationInterval = null;
      isAnimating = false;
      logoTextElement.textContent = COMPACT_TEXT;
      return;
    }

    currentText = currentText.slice(0, -1);
    logoTextElement.textContent = currentText;
  }, CHAR_DURATION);
}

/**
 * Animate logo text from "DEM" to "DEM Systems" (typewriter add)
 */
function animateLogoToFull() {
  if (!logoTextElement) return;

  // Cancel any ongoing animation
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  // Reduced motion: instant change
  if (prefersReducedMotion) {
    logoTextElement.textContent = FULL_TEXT;
    return;
  }

  // Already at target
  if (logoTextElement.textContent === FULL_TEXT) return;

  isAnimating = true;
  let charIndex = logoTextElement.textContent.length;

  // Add characters until we reach "DEM Systems"
  animationInterval = setInterval(() => {
    if (charIndex >= FULL_TEXT.length) {
      clearInterval(animationInterval);
      animationInterval = null;
      isAnimating = false;
      logoTextElement.textContent = FULL_TEXT;
      return;
    }

    charIndex++;
    logoTextElement.textContent = FULL_TEXT.slice(0, charIndex);
  }, CHAR_DURATION);
}

/**
 * Initialize smooth scroll for nav links with nav height offset
 */
function initNavSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav__link, .mobile-nav__link');
  const logoLinks = document.querySelectorAll('.nav__logo, .mobile-nav__logo');

  // Handle section links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        scrollToElement(target);
      }
    });
  });

  // Handle logo links (scroll to top)
  logoLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        scrollToTop();
      }
    });
  });
}

/**
 * Scroll to element with nav height offset
 */
function scrollToElement(element) {
  const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
  const isMobile = window.innerWidth <= 768;

  // On mobile, no offset needed (bottom nav)
  const offset = isMobile ? 0 : navHeight;

  const elementPosition = element.getBoundingClientRect().top + window.scrollY;
  const offsetPosition = elementPosition - offset;

  if (prefersReducedMotion) {
    window.scrollTo(0, offsetPosition);
  } else {
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

/**
 * Scroll to top of page
 */
function scrollToTop() {
  if (prefersReducedMotion) {
    window.scrollTo(0, 0);
  } else {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNav);
} else {
  initNav();
}

export {
  initNav,
  animateLogoToFull,
  animateLogoToCompact
};
