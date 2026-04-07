/**
 * Authentication UI
 * Handles UI interactions for sign-in, sign-up, and trial
 * Uses AuthManager for all authentication logic
 */

(function () {
  'use strict';

  console.log('🎨 Auth UI initializing...');

  // Wait for AuthManager to be ready
  function waitForAuthManager() {
    return new Promise(resolve => {
      if (window.authManager) {
        resolve(window.authManager);
        return;
      }

      const checkInterval = setInterval(() => {
        if (window.authManager) {
          clearInterval(checkInterval);
          resolve(window.authManager);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 5000);
    });
  }

  /** Firebase module must finish before sign-in (otherwise waitForFirebaseAuth times out on Vercel). */
  function waitForFirebaseAuthReady(maxMs = 25000) {
    return new Promise(resolve => {
      if (window.firebaseAuthReady && window.firebaseAuth && window.firebaseAuth.auth) {
        resolve(true);
        return;
      }

      let finished = false;
      const done = ok => {
        if (finished) return;
        finished = true;
        clearTimeout(failTimer);
        clearInterval(poll);
        window.removeEventListener('firebaseAuthReady', onReady);
        resolve(ok);
      };

      const onReady = () => {
        if (window.firebaseAuth && window.firebaseAuth.auth) {
          done(true);
        }
      };

      window.addEventListener('firebaseAuthReady', onReady, { once: true });

      const poll = setInterval(() => {
        if (window.firebaseAuthReady && window.firebaseAuth && window.firebaseAuth.auth) {
          done(true);
        }
      }, 80);

      const failTimer = setTimeout(() => {
        done(!!(window.firebaseAuth && window.firebaseAuth.auth));
      }, maxMs);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    console.log('🎨 Auth UI initializing DOM handlers...');

    const authManager = await waitForAuthManager();
    if (!authManager) {
      console.error('❌ AuthManager not available');
      showBootstrapError(
        'Account services did not load. Refresh the page or try another network.'
      );
      return;
    }

    const firebaseOk = await waitForFirebaseAuthReady();
    if (!firebaseOk) {
      console.error('❌ Firebase Auth not ready after wait');
      showBootstrapError(
        'Firebase Auth did not finish loading. Check your connection, try disabling strict blockers, and refresh. In Google Cloud Console, ensure the Browser API key allows your Vercel domain as an HTTP referrer.'
      );
    }

    console.log('✅ AuthManager available, setting up UI');

    // Set up global functions for inline event handlers
    window.switchTab = switchTab;
    window.handleSignIn = handleSignIn;
    window.handleSignUp = handleSignUp;
    window.handleGoogleSignIn = handleGoogleSignIn;
    window.handleTrialAccess = handleTrialAccess;
    window.scrollToSignUp = scrollToSignUp;
    window.closeTrialModal = closeTrialModal;
    window.handleTrialSignUp = handleTrialSignUp;

    // Mark as initialized so inline handlers know to defer
    window.authUIInitialized = true;

    console.log('✅ Auth UI initialized');
  }

  // Tab switching
  function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(btn => {
      btn.classList.remove('active');
      btn.classList.add('text-iterum-slate');
      btn.setAttribute('aria-selected', 'false');
    });
    const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (tabBtn) {
      tabBtn.classList.add('active');
      tabBtn.classList.remove('text-iterum-slate');
      tabBtn.setAttribute('aria-selected', 'true');
    }

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.remove('active');
    });
    const form = document.getElementById(`${tab}-form`);
    if (form) {
      form.classList.add('active');
    }

    // Clear messages
    clearMessages();
  }

  function showBootstrapError(message) {
    const el =
      document.getElementById('auth-bootstrap-error') ||
      document.getElementById('error-message-global');
    if (!el) {
      console.error(message);
      return;
    }
    el.textContent = message;
    el.classList.add('show');
    el.style.display = el.id === 'auth-bootstrap-error' ? 'block' : '';
  }

  // Clear all error and success messages
  function clearMessages() {
    document.querySelectorAll('.error-message').forEach(el => {
      el.classList.remove('show');
      el.textContent = '';
    });
    document.querySelectorAll('.form-input').forEach(el => {
      el.classList.remove('error');
    });
    const successMsg = document.getElementById('success-message');
    if (successMsg) {
      successMsg.classList.remove('show');
    }
    const errorMsg = document.getElementById('error-message-global');
    if (errorMsg) {
      errorMsg.classList.remove('show');
    }
    const bootErr = document.getElementById('auth-bootstrap-error');
    if (bootErr) {
      bootErr.classList.remove('show');
      bootErr.textContent = '';
    }
  }

  // Show error message
  function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('show');

      // Highlight input
      const inputId = elementId.replace('-error', '');
      const input = document.getElementById(inputId);
      if (input) {
        input.classList.add('error');
      }
    }
  }

  // Show success message
  function showSuccess(message) {
    const successEl = document.getElementById('success-message');
    if (successEl) {
      successEl.textContent = '✅ ' + message;
      successEl.classList.add('show');
    }
  }

  // Handle Sign In
  async function handleSignIn(event) {
    event.preventDefault();
    clearMessages();

    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

    // Validation
    if (!email) {
      showError('signin-email-error', 'Email is required');
      return;
    }

    if (!password) {
      showError('signin-password-error', 'Password is required');
      return;
    }

    // Show loading
    const btn = document.getElementById('signin-btn');
    const btnText = document.getElementById('signin-btn-text');
    const spinner = document.getElementById('signin-spinner');
    btn.disabled = true;
    btnText.style.display = 'none';
    if (spinner) {
      spinner.classList.remove('hidden');
      spinner.style.display = 'flex';
    }

    try {
      console.log('🔐 Starting sign-in process...');

      // Use AuthManager to sign in
      const user = await window.authManager.signInWithEmail(email, password);

      console.log('✅ Sign-in successful:', user.email);

      showSuccess('Sign in successful! Redirecting...');

      // Redirect after delay
      setTimeout(() => {
        console.log('🚀 Redirecting to main app...');
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (error) {
      console.error('❌ Sign-in error:', error);

      // Show user-friendly error
      let errorMessage = 'Sign in failed. Please try again.';
      if (error.message.includes('wrong-password')) {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.message.includes('user-not-found')) {
        errorMessage = 'No account found with this email.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError('signin-password-error', errorMessage);
      btn.disabled = false;
      btnText.style.display = '';
      if (spinner) {
        spinner.classList.add('hidden');
        spinner.style.display = 'none';
      }
    }
  }

  // Handle Sign Up
  async function handleSignUp(event) {
    event.preventDefault();
    clearMessages();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById(
      'signup-confirm-password'
    ).value;

    // Validation
    if (!name) {
      showError('signup-name-error', 'Name is required');
      return;
    }

    if (!email) {
      showError('signup-email-error', 'Email is required');
      return;
    }

    if (password.length < 6) {
      showError(
        'signup-password-error',
        'Password must be at least 6 characters'
      );
      return;
    }

    if (password !== confirmPassword) {
      showError('signup-confirm-error', 'Passwords do not match');
      return;
    }

    // Show loading
    const btn = document.getElementById('signup-btn');
    const btnText = document.getElementById('signup-btn-text');
    const spinner = document.getElementById('signup-spinner');
    btn.disabled = true;
    btnText.style.display = 'none';
    if (spinner) {
      spinner.classList.remove('hidden');
      spinner.style.display = 'flex';
    }

    try {
      console.log('📝 Starting sign-up process...');

      // Use AuthManager to sign up
      const user = await window.authManager.signUpWithEmail(
        name,
        email,
        password
      );

      console.log('✅ Sign-up successful:', user.email);

      showSuccess(
        'Account created! Please check your email for verification link. Redirecting...'
      );

      // Redirect after delay
      setTimeout(() => {
        console.log('🚀 Redirecting to main app...');
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (error) {
      console.error('❌ Sign-up error:', error);

      // Show user-friendly error
      let errorMessage = 'Sign up failed. Please try again.';
      if (error.message.includes('email-already-in-use')) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email address.';
      } else if (error.message.includes('weak-password')) {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError('signup-confirm-error', errorMessage);
      btn.disabled = false;
      btnText.style.display = '';
      if (spinner) {
        spinner.classList.add('hidden');
        spinner.style.display = 'none';
      }
    }
  }

  // Handle Google Sign In
  async function handleGoogleSignIn() {
    clearMessages();

    try {
      console.log('🔵 Starting Google sign-in...');

      showSuccess('Opening Google Sign-In...');

      const user = await window.authManager.signInWithGoogle();

      if (user == null) {
        showSuccess('Redirecting to Google…');
        return;
      }

      console.log('✅ Google sign-in successful:', user.email);

      showSuccess(
        'Google Sign-In successful! Welcome ' + user.name + '! Redirecting...'
      );

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (error) {
      console.error('❌ Google sign-in error:', error);

      // Show user-friendly error
      const errorEl = document.getElementById('error-message-global');
      if (errorEl) {
        let errorMessage = 'Google Sign-In failed. Please try again.';
        if (error.message.includes('popup-closed')) {
          errorMessage = 'Sign-in popup was closed. Please try again.';
        } else if (error.message.includes('cancelled')) {
          errorMessage = 'Sign-in was cancelled.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        errorEl.textContent = '❌ ' + errorMessage;
        errorEl.classList.add('show');
      }
    }
  }

  // Handle Trial Access
  function handleTrialAccess() {
    showTrialModal();
  }

  // Show trial modal
  function showTrialModal() {
    // Remove any existing modal
    const existingModal = document.getElementById('trial-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'trial-modal';
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

    modal.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🎁</div>
                    <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 8px; color: #1f2937;">Start Your Free Trial</h2>
                    <p style="color: #6b7280; font-size: 16px;">Get full access for 14 days. No credit card required.</p>
                </div>
                
                <form id="trial-form" onsubmit="handleTrialSignUp(event)">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">Full Name *</label>
                        <input type="text" id="trial-name" required 
                               placeholder="Gordon Ramsay"
                               style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                        <div id="trial-name-error" style="color: #ef4444; font-size: 14px; margin-top: 6px; display: none;"></div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">Email Address *</label>
                        <input type="email" id="trial-email" required 
                               placeholder="chef@restaurant.com"
                               style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                        <div id="trial-email-error" style="color: #ef4444; font-size: 14px; margin-top: 6px; display: none;"></div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">Restaurant/Company (Optional)</label>
                        <input type="text" id="trial-company" 
                               placeholder="The French Laundry"
                               style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">Role (Optional)</label>
                        <select id="trial-role" 
                                style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                            <option value="">Select your role...</option>
                            <option value="executive-chef">Executive Chef</option>
                            <option value="sous-chef">Sous Chef</option>
                            <option value="pastry-chef">Pastry Chef</option>
                            <option value="rd-chef">R&D Chef</option>
                            <option value="catering-chef">Catering Chef</option>
                            <option value="restaurant-owner">Restaurant Owner</option>
                            <option value="culinary-student">Culinary Student</option>
                            <option value="home-cook">Home Cook</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">How did you hear about us? (Optional)</label>
                        <select id="trial-source" 
                                style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                            <option value="">Select source...</option>
                            <option value="google">Google Search</option>
                            <option value="social-media">Social Media</option>
                            <option value="colleague">Colleague Referral</option>
                            <option value="blog">Blog/Article</option>
                            <option value="advertisement">Advertisement</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                        <label style="display: flex; align-items: start; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="trial-terms" required 
                                   style="width: 18px; height: 18px; margin-top: 2px;">
                            <span style="font-size: 14px; color: #6b7280;">
                                I agree to the <a href="#" style="color: #3b82f6; text-decoration: none;">Terms of Service</a> 
                                and <a href="#" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a>
                            </span>
                        </label>
                        <div id="trial-terms-error" style="color: #ef4444; font-size: 14px; margin-top: 6px; display: none;"></div>
                    </div>
                    
                    <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 14px; color: #0369a1;">
                        ✨ Your 14-day free trial includes:<br>
                        • Unlimited recipe development<br>
                        • Unlimited menu creation<br>
                        • Full analytics & insights<br>
                        • All premium features<br>
                        • No credit card required
                    </div>
                    
                    <button type="submit" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; margin-bottom: 12px;">
                        <span id="trial-submit-text">🚀 Start My Free Trial</span>
                        <div id="trial-spinner" class="loading-spinner" style="display: none; margin: 0 auto;"></div>
                    </button>
                    
                    <button type="button" onclick="closeTrialModal()" 
                            style="width: 100%; padding: 12px; background: white; color: #6b7280; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;">
                        Cancel
                    </button>
                </form>
                
                <div id="trial-error-message" style="color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 8px; margin-top: 16px; display: none; font-size: 14px;"></div>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;

    document.body.appendChild(modal);

    // Close on outside click
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeTrialModal();
      }
    });
  }

  // Close trial modal
  function closeTrialModal() {
    const modal = document.getElementById('trial-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => modal.remove(), 300);
    }
  }

  // Handle trial sign-up
  async function handleTrialSignUp(event) {
    event.preventDefault();

    const name = document.getElementById('trial-name').value.trim();
    const email = document.getElementById('trial-email').value.trim();
    const company = document.getElementById('trial-company').value.trim();
    const role = document.getElementById('trial-role').value;
    const source = document.getElementById('trial-source').value;
    const termsAccepted = document.getElementById('trial-terms').checked;

    // Validation
    if (!name) {
      showTrialError('trial-name-error', 'Name is required');
      return;
    }

    if (!email) {
      showTrialError('trial-email-error', 'Email is required');
      return;
    }

    if (!termsAccepted) {
      showTrialError(
        'trial-terms-error',
        'You must accept the terms to continue'
      );
      return;
    }

    // Show loading
    const submitBtn = document.querySelector(
      '#trial-form button[type="submit"]'
    );
    const submitText = document.getElementById('trial-submit-text');
    const spinner = document.getElementById('trial-spinner');
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    spinner.style.display = 'block';

    try {
      console.log('🎁 Starting trial sign-up...');

      // Use AuthManager to create trial account
      const user = await window.authManager.createTrialAccount({
        name,
        email,
        company,
        role,
        source
      });

      console.log('✅ Trial account created:', user.email);

      // Show success
      const trialErrorMsg = document.getElementById('trial-error-message');
      trialErrorMsg.style.display = 'block';
      trialErrorMsg.style.background = '#d1fae5';
      trialErrorMsg.style.color = '#065f46';
      trialErrorMsg.textContent =
        '✅ Trial activated! Welcome ' +
        name +
        '! You have 14 days of full access. Redirecting...';

      // Redirect after delay
      setTimeout(() => {
        console.log('🚀 Redirecting to main app...');
        window.location.href = 'dashboard.html';
      }, 2000);
    } catch (error) {
      console.error('❌ Trial sign-up error:', error);
      showTrialError(
        'trial-error-message',
        'Failed to start trial: ' + error.message
      );
      submitBtn.disabled = false;
      submitText.style.display = 'block';
      spinner.style.display = 'none';
    }
  }

  // Show trial error
  function showTrialError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  // Scroll to sign up
  function scrollToSignUp() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      switchTab('signup');
    }, 500);
  }

  // Show forgot password modal
  function showForgotPasswordModal(event) {
    if (event) {
      event.preventDefault();
    }

    const modal = document.createElement('div');
    modal.id = 'forgot-password-modal';
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

    modal.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🔑</div>
                    <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 8px; color: #1f2937;">Reset Password</h2>
                    <p style="color: #6b7280; font-size: 16px;">Enter your email and we'll send you a reset link</p>
                </div>
                
                <form id="forgot-password-form" onsubmit="handleForgotPasswordSubmit(event)">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">Email Address</label>
                        <input type="email" id="forgot-email" required 
                               placeholder="your@email.com"
                               style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                        <div id="forgot-email-error" style="color: #ef4444; font-size: 14px; margin-top: 6px; display: none;"></div>
                    </div>
                    
                    <button type="submit" id="forgot-submit-btn" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; margin-bottom: 12px;">
                        <span id="forgot-submit-text">📧 Send Reset Link</span>
                        <div id="forgot-spinner" class="loading-spinner" style="display: none; margin: 0 auto;"></div>
                    </button>
                    
                    <button type="button" onclick="closeForgotPasswordModal()" 
                            style="width: 100%; padding: 12px; background: white; color: #6b7280; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;">
                        Cancel
                    </button>
                </form>
                
                <div id="forgot-message" style="margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px; display: none;"></div>
            </div>
        `;

    document.body.appendChild(modal);

    // Focus email input
    setTimeout(() => {
      document.getElementById('forgot-email')?.focus();
    }, 300);

    // Close on outside click
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeForgotPasswordModal();
      }
    });
  }

  // Close forgot password modal
  function closeForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
      modal.remove();
    }
  }

  // Handle forgot password submission
  async function handleForgotPasswordSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('forgot-email').value.trim();
    const submitBtn = document.getElementById('forgot-submit-btn');
    const submitText = document.getElementById('forgot-submit-text');
    const spinner = document.getElementById('forgot-spinner');
    const messageDiv = document.getElementById('forgot-message');

    if (!email) {
      messageDiv.style.display = 'block';
      messageDiv.style.background = '#fee2e2';
      messageDiv.style.color = '#991b1b';
      messageDiv.textContent = 'Please enter your email address';
      return;
    }

    // Show loading
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    spinner.style.display = 'block';
    messageDiv.style.display = 'none';

    try {
      await window.authManager.sendPasswordResetEmail(email);

      // Show success
      messageDiv.style.display = 'block';
      messageDiv.style.background = '#d1fae5';
      messageDiv.style.color = '#065f46';
      messageDiv.textContent =
        '✅ Password reset email sent! Check your inbox (and spam folder).';

      // Close modal after delay
      setTimeout(() => {
        closeForgotPasswordModal();
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to send reset email. Please try again.';
      if (error.message.includes('user-not-found')) {
        errorMessage = 'No account found with this email address.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email address.';
      }

      messageDiv.style.display = 'block';
      messageDiv.style.background = '#fee2e2';
      messageDiv.style.color = '#991b1b';
      messageDiv.textContent = '❌ ' + errorMessage;

      submitBtn.disabled = false;
      submitText.style.display = 'block';
      spinner.style.display = 'none';
    }
  }

  // Export functions globally
  window.showForgotPasswordModal = showForgotPasswordModal;
  window.closeForgotPasswordModal = closeForgotPasswordModal;
  window.handleForgotPasswordSubmit = handleForgotPasswordSubmit;

  console.log('✅ Auth UI script loaded');
})();
