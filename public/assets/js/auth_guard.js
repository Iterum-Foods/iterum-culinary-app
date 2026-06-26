/**
 * Authentication Guard (v2.0)
 * Protects pages and ensures user is logged in
 * Uses centralized AuthManager for bulletproof authentication
 * NON-BLOCKING - Allows page to load while checking auth
 */

(async function () {
  'use strict';

  console.log('🔐 Auth Guard v2.0 checking credentials...');

  // List of pages that don't require authentication
  const publicPages = [
    'launch.html',
    'index_simple.html',
    'index_minimal.html',
    'emergency_fix_index.html',
    'test_firestore_connection.html',
    'test-user-integration.html'
  ];

  // Get current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Check if this is a public page
  const isPublicPage = publicPages.some(page => currentPage.includes(page));

  if (isPublicPage) {
    console.log('✅ Public page - no auth required:', currentPage);
    return;
  }

  console.log('🔒 Protected page - authentication required:', currentPage);

  // CRITICAL: Remove loading screen immediately to let page load
  setTimeout(() => {
    const loadingIndicator = document.getElementById('simple-loading');
    if (loadingIndicator) {
      loadingIndicator.remove();
      console.log('✅ Loading screen removed by auth guard');
    }
  }, 500);

  // Wait for AuthManager to be ready (non-blocking)
  let authManager = window.authManager;
  if (!authManager) {
    console.log('⏳ Waiting for AuthManager...');
    let attempts = 0;
    while (!window.authManager && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    authManager = window.authManager;
  }

  if (!authManager) {
    console.error('❌ AuthManager not available after 3 seconds');
    console.log('⚠️ Allowing page to load anyway - will show sign-in modal');

    // Wait a moment for page to fully load
    setTimeout(() => {
      showSignInModal();
    }, 1000);
    return; // Don't block page load
  }

  console.log('✅ AuthManager available');

  // Check authentication (non-blocking)
  const { authenticated, user } = await authManager.checkAuth();

  if (!authenticated) {
    console.warn('🚫 NOT AUTHENTICATED - Will show sign-in modal');
    console.log('  Attempted to access:', currentPage);

    // Wait a moment for page to fully load before showing modal
    setTimeout(() => {
      showSignInModal();
    }, 500);

    return; // Don't block page load
  }

  // User is authenticated
  console.log('✅ Authentication verified');
  console.log('👤 User:', user.name || user.email);

  // Check if trial has expired
  if (user.type === 'trial' && user.trialEndDate) {
    const trialEnd = new Date(user.trialEndDate);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      console.warn('⚠️ Trial has expired');
      showTrialExpiredWarning();
    } else if (daysRemaining <= 3) {
      console.warn(`⚠️ Trial expiring in ${daysRemaining} days`);
      setTimeout(() => {
        showTrialWarning(daysRemaining);
      }, 1000);
    }
  }

  console.log('✅ Auth Guard complete - access granted');

  function ensureAuthGuardStyles() {
    if (document.getElementById('auth-guard-modal-styles')) return;
    const script = document.querySelector('script[src*="auth_guard"]');
    const base = script
      ? script.src.replace(/\/assets\/js\/auth_guard\.js(?:\?.*)?$/, '')
      : '';
    const link = document.createElement('link');
    link.id = 'auth-guard-modal-styles';
    link.rel = 'stylesheet';
    link.href = `${base}/assets/css/auth-guard-modal.css`;
    document.head.appendChild(link);
  }

  // Function to show sign-in modal
  function showSignInModal() {
    ensureAuthGuardStyles();

    const modal = document.createElement('div');
    modal.id = 'auth-guard-modal';

    modal.innerHTML = `
            <div id="auth-guard-content" role="dialog" aria-labelledby="ag-modal-title" aria-modal="true">
                <header class="ag-modal-header">
                    <p class="ag-modal-eyebrow">Iterum Culinary OS</p>
                    <span class="ag-modal-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="5" y="11" width="14" height="10" rx="2"></rect>
                            <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
                        </svg>
                    </span>
                    <h2 id="ag-modal-title">Sign in required</h2>
                    <p>Sign in to continue to your workspace.</p>
                </header>

                <div class="ag-modal-body">
                    <form id="modal-signin-form">
                        <div class="ag-field">
                            <label for="modal-email">Email address</label>
                            <input type="email" id="modal-email" class="ag-input"
                                   placeholder="you@restaurant.com" required autocomplete="email">
                        </div>

                        <div class="ag-field">
                            <label for="modal-password">Password</label>
                            <input type="password" id="modal-password" class="ag-input"
                                   placeholder="Enter your password" required autocomplete="current-password">
                        </div>

                        <button type="submit" class="ag-btn ag-btn-primary" id="modal-signin-btn">
                            <span id="modal-signin-text">Sign in &amp; continue</span>
                            <span id="modal-signin-spinner" style="display: none;">Signing in…</span>
                        </button>

                        <div id="modal-error" class="ag-error" role="alert"></div>
                        <div id="modal-success" class="ag-success" role="status"></div>
                    </form>

                    <div class="ag-divider" aria-hidden="true">or</div>

                    <button type="button" onclick="window.location.href='index.html?tab=signup'" class="ag-btn ag-btn-secondary">
                        Create new account
                    </button>

                    <div class="ag-footer">
                        <p class="ag-footer-note">Don&apos;t have an account?</p>
                        <a href="index.html?tab=signup" class="ag-link">Sign up for free</a>
                        <a href="index.html" class="ag-link ag-link-muted">Go to full login page</a>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Focus email input
    setTimeout(() => {
      document.getElementById('modal-email')?.focus();
    }, 300);

    // Handle sign-in form submission
    document
      .getElementById('modal-signin-form')
      .addEventListener('submit', async e => {
        e.preventDefault();

        const email = document.getElementById('modal-email').value.trim();
        const password = document.getElementById('modal-password').value;
        const errorDiv = document.getElementById('modal-error');
        const successDiv = document.getElementById('modal-success');
        const btnText = document.getElementById('modal-signin-text');
        const spinner = document.getElementById('modal-signin-spinner');
        const btn = document.getElementById('modal-signin-btn');

        // Clear messages
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        // Show loading
        btn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'block';

        try {
          await window.authManager.signInWithEmail(email, password);

          // Show success
          successDiv.textContent = 'Sign-in successful. Reloading your workspace…';
          successDiv.style.display = 'block';

          // Reload page after short delay
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          console.error('Modal sign-in error:', error);
          errorDiv.textContent =
            error.message || 'Sign-in failed. Please check your credentials.';
          errorDiv.style.display = 'block';
          btn.disabled = false;
          btnText.style.display = 'block';
          spinner.style.display = 'none';
        }
      });

    // Prevent clicking outside to close (user must sign in)
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        const content = document.getElementById('auth-guard-content');
        content.style.animation = 'none';
        setTimeout(() => {
          content.style.animation = 'ag-slide-up 0.35s ease';
        }, 10);
      }
    });
  }

  // Function to show trial warning
  function showTrialWarning(daysRemaining) {
    const warning = document.createElement('div');
    warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
    warning.innerHTML = `
            <div style="color: #92400e; font-weight: 600; margin-bottom: 8px;">
                ⚠️ Trial Ending Soon
            </div>
            <div style="color: #92400e; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining in your trial
            </div>
            <button onclick="this.parentElement.remove()" 
                    style="padding: 6px 12px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                Got it
            </button>
        `;
    document.body.appendChild(warning);

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (warning.parentElement) {
        warning.remove();
      }
    }, 10000);
  }

  // Function to show trial expired warning
  function showTrialExpiredWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            border: 2px solid #ef4444;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
    warning.innerHTML = `
            <div style="color: #991b1b; font-weight: 600; margin-bottom: 8px;">
                ⚠️ Trial Has Expired
            </div>
            <div style="color: #991b1b; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                Your 14-day trial has ended. Subscribe to continue using Iterum.
            </div>
            <button onclick="this.parentElement.remove()" 
                    style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                Dismiss
            </button>
        `;
    document.body.appendChild(warning);
  }
})();
