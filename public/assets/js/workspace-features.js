/**
 * Workspace feature modules — toggled from setup / operator profile.
 * Hides nav links and dashboard tiles when a module is turned off.
 * Requires: user-role-setup.js (getOperatorProfile) — if missing, all features stay on.
 */
(function (global) {
  'use strict';

  var DEFAULT_FEATURES = {
    menus: true,
    recipes: true,
    ingredients: true,
    kitchen: true,
    inventory: true,
    vendors: true,
    calendar: true,
    projects: true,
    equipment: true,
    production: true,
    import_export: true,
    photo_studio: true,
    scaling: true,
    compliance: true,
    backup: true,
    data_tools: true
  };

  global.ITERUM_DEFAULT_FEATURES = DEFAULT_FEATURES;

  global.iterumGetFeaturePreferences = function () {
    var out = Object.assign({}, DEFAULT_FEATURES);
    try {
      if (typeof global.getOperatorProfile !== 'function') {
        return out;
      }
      var p = global.getOperatorProfile();
      if (p && p.features && typeof p.features === 'object') {
        Object.keys(DEFAULT_FEATURES).forEach(function (k) {
          if (Object.prototype.hasOwnProperty.call(p.features, k)) {
            out[k] = !!p.features[k];
          }
        });
      }
    } catch (e) {
      /* ignore */
    }
    return out;
  };

  global.iterumIsFeatureEnabled = function (key) {
    var prefs = global.iterumGetFeaturePreferences();
    if (!Object.prototype.hasOwnProperty.call(prefs, key)) {
      return true;
    }
    return !!prefs[key];
  };

  function hideEl(el) {
    if (!el) {
      return;
    }
    el.setAttribute('hidden', '');
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
  }

  function showEl(el) {
    if (!el) {
      return;
    }
    el.removeAttribute('hidden');
    el.style.display = '';
    el.removeAttribute('aria-hidden');
  }

  function linkIsVisible(a) {
    if (!a || a.tagName !== 'A') {
      return false;
    }
    if (a.hasAttribute('hidden')) {
      return false;
    }
    return getComputedStyle(a).display !== 'none';
  }

  /**
   * Unified sidebar + dashboard sidebar links with [data-iterum-feature].
   */
  global.applyWorkspaceFeatureNav = function () {
    var prefs = global.iterumGetFeaturePreferences();
    document.querySelectorAll('[data-iterum-feature]').forEach(function (el) {
      var key = el.getAttribute('data-iterum-feature');
      if (!key || !Object.prototype.hasOwnProperty.call(prefs, key)) {
        return;
      }
      if (prefs[key]) {
        showEl(el);
      } else {
        hideEl(el);
      }
    });

    var sidebar = document.querySelector('.unified-nav-sidebar');
    if (!sidebar) {
      return;
    }
    var moreDropdown = sidebar.querySelector('.nav-dropdown');
    if (!moreDropdown) {
      return;
    }
    var content = moreDropdown.querySelector('.nav-dropdown-content');
    if (!content) {
      return;
    }

    content.querySelectorAll('.nav-dropdown-category').forEach(function (cat) {
      var n = cat.nextElementSibling;
      var has = false;
      while (n && !n.classList.contains('nav-dropdown-category')) {
        if (n.tagName === 'A' && linkIsVisible(n)) {
          has = true;
          break;
        }
        n = n.nextElementSibling;
      }
      if (has) {
        showEl(cat);
      } else {
        hideEl(cat);
      }
    });

    content.querySelectorAll('hr').forEach(function (hr) {
      var prevA = null;
      var w = hr.previousElementSibling;
      while (w) {
        if (w.tagName === 'A') {
          prevA = w;
          break;
        }
        if (w.classList.contains('nav-dropdown-category')) {
          break;
        }
        w = w.previousElementSibling;
      }
      var nextA = null;
      w = hr.nextElementSibling;
      while (w) {
        if (w.tagName === 'A') {
          nextA = w;
          break;
        }
        if (w.classList.contains('nav-dropdown-category')) {
          break;
        }
        w = w.nextElementSibling;
      }
      if (linkIsVisible(prevA) && linkIsVisible(nextA)) {
        showEl(hr);
      } else {
        hideEl(hr);
      }
    });

    var anyLinkVisible = false;
    content.querySelectorAll('a[href]').forEach(function (a) {
      if (linkIsVisible(a)) {
        anyLinkVisible = true;
      }
    });
    if (anyLinkVisible) {
      showEl(moreDropdown);
    } else {
      hideEl(moreDropdown);
    }
  };

  /**
   * Dashboard cards: data-dash-features="recipes,menus" — all listed keys must be on.
   */
  global.applyDashboardFeatureVisibility = function () {
    var prefs = global.iterumGetFeaturePreferences();
    document.querySelectorAll('[data-dash-features]').forEach(function (el) {
      var attr = el.getAttribute('data-dash-features') || '';
      var keys = attr
        .split(/[\s,]+/)
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      if (keys.length === 0) {
        return;
      }
      var ok = keys.every(function (k) {
        return prefs[k] !== false;
      });
      if (ok) {
        showEl(el);
      } else {
        hideEl(el);
      }
    });
  };

  global.applyAllWorkspaceFeatureVisibility = function () {
    global.applyWorkspaceFeatureNav();
    global.applyDashboardFeatureVisibility();
  };

  function runWhenReady() {
    setTimeout(function () {
      global.applyAllWorkspaceFeatureVisibility();
    }, 0);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runWhenReady);
  } else {
    runWhenReady();
  }
})(typeof window !== 'undefined' ? window : this);
