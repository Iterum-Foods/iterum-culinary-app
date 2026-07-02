/**
 * Iterum mobile quick-nav.
 *
 * A sticky horizontal pill bar that appears on phone-sized viewports (≤ 720 px)
 * on every manager / office page. Mirrors the look of the Shift app's hub-nav
 * so phone users have one consistent navigation pattern across the whole app
 * AND can always jump back to /mobile-compliance.html via the "Shift" pill.
 *
 * The bar is auto-injected; pages just need to load this script. It does
 * nothing on widescreen layouts (the desktop unified-nav sidebar stays the
 * primary nav there).
 *
 * Pages that include this:
 *   dashboard, calendar, menu-builder, recipe-library, recipe-developer,
 *   ingredients, vendor-management, spec-library, inventory,
 *   production-planning, project-hub.
 */
(function (global) {
  'use strict';

  if (!global || !global.document) return;
  if (global.__iterumMobileQuickNavMounted) return;
  global.__iterumMobileQuickNavMounted = true;

  var ITEMS = [
    { key: 'shift', label: 'Shift', href: 'mobile-compliance.html', icon: '★' },
    { key: 'dashboard', label: 'Home', href: 'dashboard.html', icon: '⌂' },
    { key: 'calendar', label: 'Calendar', href: 'calendar.html', icon: '📅' },
    { key: 'menu', label: 'Menus', href: 'menu-builder.html', icon: '📋' },
    {
      key: 'recipes',
      label: 'Recipes',
      href: 'recipe-library.html',
      icon: '📖'
    },
    {
      key: 'ingredients',
      label: 'Ingredients',
      href: 'ingredients.html',
      icon: '🥕'
    },
    {
      key: 'vendors',
      label: 'Vendors',
      href: 'vendor-management.html',
      icon: '🚚'
    },
    { key: 'spec', label: 'Specs', href: 'spec-library.html', icon: '📑' },
    {
      key: 'inventory',
      label: 'Inventory',
      href: 'inventory.html',
      icon: '📦'
    },
    {
      key: 'production',
      label: 'Production',
      href: 'production-planning.html',
      icon: '📈'
    },
    { key: 'projects', label: 'Projects', href: 'project-hub.html', icon: '🗂' }
  ];

  function currentKey() {
    var path = (global.location.pathname || '').toLowerCase();
    var file = path.split('/').pop() || '';
    if (!file) return 'dashboard';
    if (file.indexOf('mobile-compliance') !== -1) return 'shift';
    if (file.indexOf('dashboard') !== -1) return 'dashboard';
    if (file.indexOf('calendar') !== -1) return 'calendar';
    if (file.indexOf('menu-builder') !== -1 || file.indexOf('menus') !== -1)
      return 'menu';
    if (file.indexOf('recipe-library') !== -1 || file.indexOf('recipes') !== -1)
      return 'recipes';
    if (file.indexOf('recipe-developer') !== -1) return 'recipes';
    if (file.indexOf('recipe-canvas') !== -1) return 'recipes';
    if (file.indexOf('ingredient') !== -1) return 'ingredients';
    if (file.indexOf('vendor') !== -1) return 'vendors';
    if (file.indexOf('spec-library') !== -1) return 'spec';
    if (file.indexOf('inventory') !== -1) return 'inventory';
    if (file.indexOf('production') !== -1) return 'production';
    if (file.indexOf('project-hub') !== -1) return 'projects';
    return '';
  }

  function injectStyles() {
    if (document.getElementById('iterum-mqn-styles')) return;
    var s = document.createElement('style');
    s.id = 'iterum-mqn-styles';
    s.textContent =
      '.iterum-mqn{position:fixed;left:0;right:0;top:0;z-index:1200;' +
      'display:none;align-items:center;gap:6px;padding:0.4rem 0.85rem;' +
      'overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;' +
      'scrollbar-width:none;-ms-overflow-style:none;' +
      'background:#ffffff;border-bottom:1px solid rgba(20,48,32,0.10);' +
      'box-shadow:0 4px 10px -8px rgba(20,48,32,0.18);' +
      'font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}' +
      '.iterum-mqn::-webkit-scrollbar{display:none;}' +
      '.iterum-mqn a{flex:0 0 auto;min-height:32px;display:inline-flex;align-items:center;' +
      'gap:0.32rem;padding:5px 11px;border-radius:999px;font-size:0.72rem;font-weight:600;' +
      'color:#3d5a66;background:rgba(255,255,255,0.9);border:1px solid rgba(20,48,32,0.12);' +
      'text-decoration:none;white-space:nowrap;transition:background .15s ease,color .15s ease,border-color .15s ease,box-shadow .15s ease;}' +
      '.iterum-mqn a:hover{background:#f0f4f2;border-color:rgba(20,48,32,0.22);}' +
      '.iterum-mqn a[aria-current="page"]{background:linear-gradient(145deg,#3b8a5a,#2f7a4a);color:#fff;border-color:#2f7a4a;box-shadow:0 2px 10px rgba(47,122,74,0.28);}' +
      '.iterum-mqn .mqn-icon{font-size:0.85rem;line-height:1;}' +
      '.iterum-mqn .mqn-back{font-weight:700;}' +
      'body[data-iterum-mqn="on"]:not(.iterum-has-sidebar){padding-top:48px;}' +
      'body.iterum-has-sidebar .iterum-mqn{top:var(--iterum-mobile-nav-height,3.25rem);z-index:1040;}' +
      'body.iterum-has-sidebar[data-iterum-mqn="on"]{padding-top:calc(var(--iterum-mobile-nav-height,3.25rem) + 48px);}' +
      '@media (max-width:720px){.iterum-mqn{display:flex;}}';
    document.head.appendChild(s);
  }

  function render() {
    var nav = document.createElement('nav');
    nav.className = 'iterum-mqn';
    nav.setAttribute('aria-label', 'Mobile sections');
    var active = currentKey();
    var html = '';
    for (var i = 0; i < ITEMS.length; i++) {
      var it = ITEMS[i];
      var current = it.key === active ? ' aria-current="page"' : '';
      var cls = it.key === 'shift' ? ' class="mqn-back"' : '';
      html +=
        '<a href="' +
        it.href +
        '"' +
        current +
        cls +
        '>' +
        '<span class="mqn-icon" aria-hidden="true">' +
        it.icon +
        '</span>' +
        '<span>' +
        it.label +
        '</span>' +
        '</a>';
    }
    nav.innerHTML = html;
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.setAttribute('data-iterum-mqn', 'on');
    // Scroll active pill into view (handy on a 360px phone).
    var activeEl = nav.querySelector('a[aria-current="page"]');
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      try {
        activeEl.scrollIntoView({ inline: 'center', block: 'nearest' });
      } catch (e) {
        /* ignore */
      }
    }
  }

  function mount() {
    injectStyles();
    if (document.querySelector('.iterum-mqn')) return;
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})(typeof window !== 'undefined' ? window : globalThis);
