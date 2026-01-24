/**
 * DEM Systems - Form Interactions
 * Focus states, validation, submit progression, success transformation
 */

// Import reduced motion preference from main.js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Initialize contact form interactions
 */
export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = form.querySelectorAll('.form-field');
  const submitBtn = form.querySelector('.submit-button');

  // Validation state tracking
  const validation = {
    debounceMs: 300,
    touched: new Set()
  };

  let debounceTimer = null;

  /**
   * Validate a single field
   * @param {HTMLInputElement|HTMLTextAreaElement} field
   * @returns {boolean}
   */
  function validateField(field) {
    const wrapper = field.closest('.field-wrapper');
    if (!wrapper) return true;

    const value = field.value.trim();
    const type = field.type;
    const required = field.required;

    let isValid = true;
    let errorMessage = '';

    // Required validation
    if (required && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    // Email validation
    else if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email';
      }
    }

    // Update UI state
    wrapper.classList.toggle('field-valid', isValid && value);
    wrapper.classList.toggle('field-error', !isValid);

    // Update error message
    const errorEl = wrapper.querySelector('.field-error-message');
    if (errorEl) {
      errorEl.textContent = errorMessage;
    }

    return isValid;
  }

  /**
   * Validate entire form
   * @returns {boolean}
   */
  function validateForm() {
    let isValid = true;

    fields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    // Update submit button state
    if (submitBtn) {
      submitBtn.disabled = !isValid;
    }

    return isValid;
  }

  // Attach field event listeners
  fields.forEach(field => {
    // Validate on blur (first touch)
    field.addEventListener('blur', () => {
      validation.touched.add(field.name || field.id);
      validateField(field);
    });

    // Validate on input (after first touch, debounced)
    field.addEventListener('input', () => {
      const fieldId = field.name || field.id;
      if (validation.touched.has(fieldId)) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          validateField(field);
          validateForm();
        }, validation.debounceMs);
      }
    });
  });

  // Form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    if (!validateForm()) {
      // Focus first invalid field
      const firstError = form.querySelector('.field-error .form-field');
      if (firstError) firstError.focus();
      return;
    }

    // Show submitting state
    submitBtn.classList.add('submitting');
    submitBtn.disabled = true;

    try {
      // Collect form data
      const formData = new FormData(form);

      // Simulate API call (replace with actual endpoint)
      // Example: await fetch('/api/contact', { method: 'POST', body: formData });
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Success - transform form to thank you message
      showSuccessState(form);

    } catch (error) {
      // Reset button state on error
      submitBtn.classList.remove('submitting');
      submitBtn.disabled = false;

      // Could show error message here
      console.error('Form submission error:', error);
    }
  });

  // Initial validation state (disable submit if empty required fields)
  validateForm();
}

/**
 * Transform form into success state
 * @param {HTMLFormElement} form
 */
function showSuccessState(form) {
  const container = form.closest('.form-container');
  const fieldsWrapper = form.querySelector('.form-fields');
  const successMsg = form.querySelector('.success-message');

  if (!container || !fieldsWrapper || !successMsg) {
    // Fallback: just hide form
    form.style.display = 'none';
    return;
  }

  // For reduced motion - instant transformation
  if (prefersReducedMotion) {
    fieldsWrapper.classList.add('hidden');
    successMsg.classList.add('visible');
    return;
  }

  // Capture current height for smooth transition
  const currentHeight = container.offsetHeight;
  container.style.height = `${currentHeight}px`;

  // Step 1: Fade out form fields
  fieldsWrapper.classList.add('hidden');

  // Step 2: After fade, collapse and show success
  setTimeout(() => {
    // Measure success message height
    successMsg.style.position = 'relative';
    const successHeight = successMsg.offsetHeight || 100;
    successMsg.style.position = '';

    // Animate to success height
    container.style.height = `${successHeight}px`;

    // Show success message
    successMsg.classList.add('visible');
  }, 200); // Match --duration-reveal
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initContactForm());
} else {
  initContactForm();
}
