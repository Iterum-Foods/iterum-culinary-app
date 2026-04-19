/**
 * Content Security Policy — keep aligned with firebase.json hosting "Content-Security-Policy".
 * Production: enforced via Firebase Hosting headers. Local dev: meta tag when hostname is local.
 */

class CSPConfig {
  constructor() {
    this.policies = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        'https://cdnjs.cloudflare.com',
        'https://www.gstatic.com',
        'https://www.googleapis.com',
        'https://apis.google.com',
        'https://cdn.jsdelivr.net',
        'https://cdn.tailwindcss.com',
        'https://www.googletagmanager.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://fonts.googleapis.com',
        'data:'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://firebasestorage.googleapis.com',
        'https://storage.googleapis.com',
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com'
      ],
      'connect-src': [
        "'self'",
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'https://iterum-culinary-app2.firebaseapp.com',
        'https://iterum-culinary-app2.web.app',
        'https://iterumfoods.xyz',
        'https://www.iterumfoods.xyz',
        'https://firebase.googleapis.com',
        'https://firebasestorage.googleapis.com',
        'https://*.firebasestorage.app',
        'https://firestore.googleapis.com',
        'https://firebaseinstallations.googleapis.com',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://www.googleapis.com',
        'https://apis.google.com',
        'https://api.allorigins.win',
        'https://corsproxy.io',
        'https://api.codetabs.com',
        'https://www.google-analytics.com',
        'https://analytics.google.com',
        'https://region1.google-analytics.com',
        'https://www.googletagmanager.com',
        'https://www.gstatic.com'
      ],
      'media-src': ["'self'", 'data:', 'blob:'],
      'worker-src': ["'self'", 'blob:', 'https://cdnjs.cloudflare.com'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'frame-src': [
        'https://accounts.google.com',
        'https://www.google.com',
        'https://apis.google.com',
        'https://iterum-culinary-app2.firebaseapp.com'
      ],
      'upgrade-insecure-requests': []
    };
  }

  isLocalDevHost() {
    const h = typeof location !== 'undefined' ? location.hostname : '';
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  }

  generateCSP() {
    const directives = Object.entries(this.policies).map(
      ([directive, sources]) =>
        `${directive} ${sources.length ? sources.join(' ') : ''}`.trim()
    );
    return directives.join('; ');
  }

  applyCSPMeta() {
    const cspContent = this.generateCSP();
    const existingMeta = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]'
    );
    if (existingMeta) {
      existingMeta.remove();
    }
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', cspContent);
    document.head.appendChild(meta);
    console.log('🔒 CSP meta tag applied (local dev)');
  }

  isScriptSourceAllowed(src) {
    const allowedSources = this.policies['script-src'];
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      return (
        allowedSources.includes('data:') || allowedSources.includes('blob:')
      );
    }
    if (src.startsWith('https://') || src.startsWith('http://')) {
      return allowedSources.some(allowed => {
        if (allowed === "'self'") {
          return src.startsWith(window.location.origin);
        }
        if (allowed.includes('*.')) {
          try {
            const host = new URL(src).hostname;
            const pattern = allowed
              .replace(/^https:\/\//, '')
              .replace(/\*\./, '');
            return host === pattern || host.endsWith('.' + pattern);
          } catch {
            return false;
          }
        }
        return src.startsWith(allowed);
      });
    }
    return allowedSources.includes("'unsafe-inline'");
  }

  isStyleSourceAllowed(src) {
    const allowedSources = this.policies['style-src'];
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      return (
        allowedSources.includes('data:') || allowedSources.includes('blob:')
      );
    }
    if (src.startsWith('https://') || src.startsWith('http://')) {
      return allowedSources.some(allowed => {
        if (allowed === "'self'") {
          return src.startsWith(window.location.origin);
        }
        return src.startsWith(allowed);
      });
    }
    return allowedSources.includes("'unsafe-inline'");
  }

  setupCSPViolationReporting() {
    if ('SecurityPolicyViolationEvent' in window) {
      document.addEventListener('securitypolicyviolation', event => {
        console.warn('🔒 CSP Violation:', {
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
          columnNumber: event.columnNumber
        });
        if (window.errorHandler) {
          window.errorHandler.logSecurityViolation(event);
        }
      });
    }
  }

  init() {
    if (this.isLocalDevHost()) {
      this.applyCSPMeta();
    } else {
      console.log(
        '🔒 CSP: using Hosting header policy in production (see firebase.json)'
      );
    }
    this.setupCSPViolationReporting();
    this.overrideCreateElementForCSP();
    console.log('🔒 CSP Configuration initialized');
  }

  overrideCreateElementForCSP() {
    if (document.createElement.__iterumCspPatched) {
      return;
    }
    const original = document.createElement.bind(document);
    const csp = this;
    document.createElement = function (tagName, options) {
      const element =
        options !== undefined ? original(tagName, options) : original(tagName);
      const tn = String(tagName).toLowerCase();
      if (tn === 'script') {
        const originalSetAttribute = element.setAttribute.bind(element);
        element.setAttribute = function (name, value) {
          if (name === 'src' && !csp.isScriptSourceAllowed(value)) {
            console.warn('🔒 CSP: Blocked script source:', value);
            return;
          }
          return originalSetAttribute(name, value);
        };
      }
      if (tn === 'link') {
        const originalSetAttribute = element.setAttribute.bind(element);
        element.setAttribute = function (name, value) {
          if (
            name === 'href' &&
            element.rel === 'stylesheet' &&
            !csp.isStyleSourceAllowed(value)
          ) {
            console.warn('🔒 CSP: Blocked style source:', value);
            return;
          }
          return originalSetAttribute(name, value);
        };
      }
      return element;
    };
    document.createElement.__iterumCspPatched = true;
  }
}

window.cspConfig = new CSPConfig();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cspConfig.init();
  });
} else {
  window.cspConfig.init();
}
