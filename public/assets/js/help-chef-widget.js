/**
 * Help FAB + guided tour (sign up, setup, using the app).
 * Depends on user-role-setup.js for needsOperatorSetup when available.
 *
 * Optional: window.ITERUM_HELP_EMAIL, window.ITERUM_HELP_FAQ_URL, window.ITERUM_HELP_CHEF_ALWAYS
 */
(function () {
  'use strict';

  var CHEF_FILES = [
    'chef-01-thinking.png',
    'chef-02-stumped.png',
    'chef-03-pointing.png',
    'chef-04-jumping.png',
    'chef-05-friendly.png',
    'chef-06-busy.png'
  ];

  var STORAGE_KEY = 'iterum_help_chef_index';

  function assetBase() {
    var scripts = document.getElementsByTagName('script');
    var i;
    for (i = 0; i < scripts.length; i++) {
      var s = scripts[i].src;
      if (s && s.indexOf('help-chef-widget.js') !== -1) {
        return s.replace(/help-chef-widget\.js.*$/, '');
      }
    }
    return '';
  }

  function chefImageUrls() {
    var jsBase = assetBase();
    var prefix =
      jsBase ||
      (typeof window.ITERUM_HELP_CHEF_ASSET_PREFIX === 'string'
        ? window.ITERUM_HELP_CHEF_ASSET_PREFIX
        : 'assets/js/');
    var imgRoot = prefix.replace(/js\/$/, 'images/help-chef/');
    return CHEF_FILES.map(function (f) {
      return imgRoot + f;
    });
  }

  function isNativeCapacitor() {
    try {
      return (
        window.Capacitor &&
        typeof window.Capacitor.isNativePlatform === 'function' &&
        window.Capacitor.isNativePlatform()
      );
    } catch (e) {
      return false;
    }
  }

  function isOnboardingPath() {
    var p = (window.location.pathname || '').toLowerCase();
    if (p === '/' || p === '' || p.endsWith('/index.html')) return true;
    if (p.indexOf('signin.html') !== -1) return true;
    if (p.indexOf('setup.html') !== -1) return true;
    return false;
  }

  function shouldShowWidget() {
    if (
      document.body &&
      document.body.getAttribute('data-no-help-chef') === 'true'
    ) {
      return false;
    }
    if (
      typeof window.ITERUM_HELP_CHEF_ALWAYS === 'boolean' &&
      window.ITERUM_HELP_CHEF_ALWAYS
    ) {
      return true;
    }
    if (isOnboardingPath()) return true;
    if (isNativeCapacitor()) return true;
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
      return true;
    }
    if (
      window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      return true;
    }
    return false;
  }

  function getTourState() {
    try {
      var signedIn =
        localStorage.getItem('session_active') === 'true' &&
        !!localStorage.getItem('current_user');
      if (!signedIn) return 'anon';
      if (
        typeof window.needsOperatorSetup === 'function' &&
        window.needsOperatorSetup()
      ) {
        return 'needs_setup';
      }
      return 'ready';
    } catch (e) {
      return 'anon';
    }
  }

  function tourStepDefinitions() {
    return [
      {
        id: 'intro',
        when: ['anon'],
        title: 'Welcome to Iterum',
        body: 'I will walk you through creating an account, setting up your workspace, and using the app. Tap “Next” to begin—or use the links anytime.',
        chef: 4,
        links: []
      },
      {
        id: 'signup',
        when: ['anon'],
        title: 'Step 1: Create your account',
        body: 'Open the home page and choose Sign up. You can use email and password or Google. This login keeps your recipes and lists in one place.',
        chef: 3,
        links: [
          { href: 'index.html', label: 'Go to home & sign up', primary: true },
          {
            href: 'signin.html',
            label: 'I already have an account',
            primary: false
          }
        ]
      },
      {
        id: 'after-account',
        when: ['anon'],
        title: 'Step 2: Right after you sign in',
        body: 'We will ask one quick question: how you work (one kitchen vs several) and your role. That shapes your dashboard—nothing technical, just context.',
        chef: 0,
        links: [{ href: 'signin.html', label: 'Sign in', primary: true }]
      },
      {
        id: 'setup-welcome',
        when: ['needs_setup'],
        title: 'Set up your workspace',
        body: 'You are signed in. Next, pick your organization type (single place or group) and the role that fits you best. It takes under a minute.',
        chef: 3,
        links: [{ href: 'setup.html', label: 'Open setup', primary: true }]
      },
      {
        id: 'setup-tips',
        when: ['needs_setup'],
        title: 'What those choices do',
        body: 'Single restaurant: one kitchen, one focus. Restaurant group: more than one venue or shared oversight. Your role adjusts which cards and shortcuts we show first—you can still reach everything from the sidebar.',
        chef: 5,
        links: []
      },
      {
        id: 'dash-intro',
        when: ['ready'],
        title: 'Your dashboard',
        body: 'This is home base: tasks, notes, and shortcuts to recipes, menus, and tools. The sidebar on the left opens every area of the app.',
        chef: 4,
        links: [
          { href: 'dashboard.html', label: 'Open dashboard', primary: true }
        ]
      },
      {
        id: 'nav',
        when: ['ready'],
        title: 'Getting around',
        body: 'Use the menu icon on your phone to open the sidebar. Your name and sign-out live at the bottom. “More tools” holds imports, specs, and admin shortcuts so the main list stays simple.',
        chef: 1,
        links: []
      },
      {
        id: 'recipes-menus',
        when: ['ready'],
        title: 'Recipes and menus',
        body: 'Save and browse dishes in the recipe library. Build or adjust menus in the menu builder when you are planning service or a tasting.',
        chef: 5,
        links: [
          {
            href: 'recipe-library.html',
            label: 'Recipe library',
            primary: true
          },
          { href: 'menu-builder.html', label: 'Menu builder', primary: false }
        ]
      },
      {
        id: 'more-tools',
        when: ['ready'],
        title: 'Calendar, kitchen, and more',
        body: 'Open the calendar for dates and logs, kitchen management for day-of operations, and project hub when you work across ideas or venues.',
        chef: 2,
        links: [
          { href: 'calendar.html', label: 'Calendar', primary: true },
          { href: 'project-hub.html', label: 'Project hub', primary: false }
        ]
      },
      {
        id: 'wrap',
        when: ['ready'],
        title: 'You are all set',
        body: 'Tap this help button anytime for a refresher. “Show another chef” just swaps the mascot. Need humans? Use contact support.',
        chef: 4,
        links: []
      }
    ];
  }

  function filterTourSteps(state) {
    var defs = tourStepDefinitions();
    return defs.filter(function (s) {
      return s.when.indexOf(state) !== -1;
    });
  }

  function nextChefIndex(len) {
    var v = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (isNaN(v) || v < 0) v = 0;
    v = (v + 1) % len;
    localStorage.setItem(STORAGE_KEY, String(v));
    return v;
  }

  function injectStyles() {
    if (document.getElementById('iterum-help-chef-styles')) return;
    var el = document.createElement('style');
    el.id = 'iterum-help-chef-styles';
    el.textContent =
      '.iterum-help-chef-fab{' +
      'position:fixed;bottom:calc(16px + env(safe-area-inset-bottom,0));' +
      'right:calc(16px + env(safe-area-inset-right,0));' +
      'width:56px;height:56px;border-radius:50%;padding:0;border:none;' +
      'box-shadow:0 8px 24px rgba(15,23,42,.18);cursor:pointer;z-index:9998;' +
      'overflow:hidden;background:#fff;border:2px solid #6b8e6f;' +
      'display:flex;align-items:center;justify-content:center;' +
      '-webkit-tap-highlight-color:transparent;' +
      '}' +
      '.iterum-help-chef-fab img{width:100%;height:100%;object-fit:cover;object-position:center top;}' +
      '.iterum-help-chef-fab:focus-visible{outline:3px solid #5b9bad;outline-offset:2px;}' +
      '.iterum-help-chef-backdrop{' +
      'position:fixed;inset:0;background:rgba(15,23,42,.4);z-index:9999;' +
      'opacity:0;pointer-events:none;transition:opacity .2s ease;' +
      '}' +
      '.iterum-help-chef-backdrop.is-open{opacity:1;pointer-events:auto;}' +
      '.iterum-help-chef-sheet{' +
      'position:fixed;left:0;right:0;bottom:0;max-height:88vh;' +
      'background:#fafbfc;border-radius:18px 18px 0 0;' +
      'box-shadow:0 -12px 40px rgba(15,23,42,.15);z-index:10000;' +
      'transform:translateY(100%);transition:transform .28s ease;' +
      'padding:20px 20px calc(24px + env(safe-area-inset-bottom,0));' +
      'font-family:Inter,system-ui,sans-serif;color:#1a2e35;' +
      'overflow-y:auto;' +
      '}' +
      '.iterum-help-chef-sheet.is-open{transform:translateY(0);}' +
      '.iterum-help-chef-sheet h2{margin:0 0 8px;font-size:1.2rem;font-weight:600;}' +
      '.iterum-help-chef-portrait{width:112px;height:112px;border-radius:50%;margin:0 auto 12px;' +
      'border:3px solid #6b8e6f;overflow:hidden;background:#fff;flex-shrink:0;}' +
      '.iterum-help-chef-portrait img{width:100%;height:100%;object-fit:cover;object-position:center top;}' +
      '.iterum-help-chef-tour-progress{font-size:.8rem;color:#5a6d75;margin:0 0 8px;text-align:center;}' +
      '.iterum-help-chef-tour-body{font-size:.9375rem;color:#5a6d75;line-height:1.55;margin:0 0 14px;white-space:pre-line;}' +
      '.iterum-help-chef-actions{display:flex;flex-direction:column;gap:10px;}' +
      '.iterum-help-chef-actions a,.iterum-help-chef-actions button,.iterum-help-chef-tour-buttons button{' +
      'display:block;width:100%;text-align:center;padding:13px 16px;border-radius:12px;' +
      'font-size:.95rem;font-weight:600;text-decoration:none;border:none;cursor:pointer;' +
      '}' +
      '.iterum-help-chef-actions a.primary,.iterum-help-chef-tour-buttons .iterum-tour-next{' +
      'background:linear-gradient(135deg,#6b8e6f,#5b9bad);color:#fff;}' +
      '.iterum-help-chef-actions a.secondary,.iterum-help-chef-actions button.secondary,' +
      '.iterum-help-chef-tour-buttons .iterum-tour-back{' +
      'background:#fff;color:#1a2e35;border:1px solid rgba(15,23,42,.12);}' +
      '.iterum-help-chef-tour-buttons{display:flex;gap:10px;margin-top:12px;}' +
      '.iterum-help-chef-tour-buttons button{flex:1;}' +
      '.iterum-help-chef-tour-links{display:flex;flex-direction:column;gap:8px;margin-bottom:4px;}' +
      '.iterum-help-chef-tour-links a{display:block;text-align:center;padding:12px 14px;border-radius:12px;font-weight:600;text-decoration:none;font-size:.95rem;}' +
      '.iterum-help-chef-tour-links a.primary{background:linear-gradient(135deg,#6b8e6f,#5b9bad);color:#fff;}' +
      '.iterum-help-chef-tour-links a.secondary{background:#fff;color:#1a2e35;border:1px solid rgba(15,23,42,.12);}' +
      '.iterum-help-chef-drag{width:40px;height:5px;background:rgba(15,23,42,.15);' +
      'border-radius:3px;margin:0 auto 12px;}' +
      '.iterum-help-chef-close{position:absolute;top:10px;right:10px;width:40px;height:40px;' +
      'border:none;background:transparent;border-radius:10px;cursor:pointer;font-size:1.35rem;color:#5a6d75;line-height:1;}' +
      '.iterum-help-tour-exit{display:block;width:100%;margin-top:12px;padding:10px;background:none;border:none;' +
      'color:#5a6d75;font-size:.875rem;font-weight:500;cursor:pointer;text-decoration:underline;}' +
      '.iterum-help-home-panel[hidden],.iterum-help-tour-panel[hidden]{display:none !important;}';
    document.head.appendChild(el);
  }

  function buildMarkup(urls) {
    var wrap = document.createElement('div');
    wrap.setAttribute('data-iterum-help-chef', '');
    wrap.innerHTML =
      '<button type="button" class="iterum-help-chef-fab" aria-label="Help and guided tour" aria-haspopup="dialog" aria-expanded="false" id="iterum-help-chef-fab-btn">' +
      '<img alt="" src="' +
      urls[0] +
      '" id="iterum-help-chef-fab-img" width="56" height="56" decoding="async">' +
      '</button>' +
      '<div class="iterum-help-chef-backdrop" id="iterum-help-chef-backdrop" aria-hidden="true"></div>' +
      '<div class="iterum-help-chef-sheet" id="iterum-help-chef-sheet" role="dialog" aria-modal="true" aria-labelledby="iterum-help-sheet-title" hidden>' +
      '<button type="button" class="iterum-help-chef-close" id="iterum-help-chef-close" aria-label="Close">&times;</button>' +
      '<div class="iterum-help-chef-drag" aria-hidden="true"></div>' +
      '<div class="iterum-help-chef-portrait"><img alt="" id="iterum-help-chef-sheet-img" src="' +
      urls[0] +
      '" width="112" height="112" decoding="async"></div>' +
      '<div class="iterum-help-tour-panel" id="iterum-help-tour-panel" hidden>' +
      '<p class="iterum-help-chef-tour-progress" id="iterum-help-chef-progress"></p>' +
      '<h2 id="iterum-help-tour-title"></h2>' +
      '<p class="iterum-help-chef-tour-body" id="iterum-help-chef-tour-body"></p>' +
      '<div class="iterum-help-chef-tour-links" id="iterum-help-chef-tour-links"></div>' +
      '<div class="iterum-help-chef-tour-buttons">' +
      '<button type="button" class="iterum-tour-back secondary" id="iterum-help-chef-tour-back">Back</button>' +
      '<button type="button" class="iterum-tour-next" id="iterum-help-chef-tour-next">Next</button>' +
      '</div>' +
      '<button type="button" class="iterum-help-tour-exit" id="iterum-help-chef-tour-exit">Exit tour</button>' +
      '</div>' +
      '<div class="iterum-help-home-panel" id="iterum-help-home-panel">' +
      '<h2 id="iterum-help-sheet-title">Your chef guide</h2>' +
      '<p class="iterum-help-chef-tour-body" style="margin-top:0">Get a quick walkthrough for signing up, setup, and daily use—or jump to a page.</p>' +
      '<div class="iterum-help-chef-actions">' +
      '<button type="button" class="primary" id="iterum-help-chef-start-tour" style="background:linear-gradient(135deg,#6b8e6f,#5b9bad);color:#fff">Start guided tour</button>' +
      '<a class="primary" id="iterum-help-chef-home-dash" href="dashboard.html">Go to dashboard</a>' +
      '<button type="button" class="secondary" id="iterum-help-chef-cycle">Show another chef</button>' +
      '<a class="secondary" id="iterum-help-chef-mail" href="#">Contact support</a>' +
      '</div></div></div>';
    return wrap;
  }

  function openSheet(backdrop, sheet, fab) {
    sheet.hidden = false;
    backdrop.classList.add('is-open');
    sheet.classList.add('is-open');
    fab.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet(backdrop, sheet, fab) {
    backdrop.classList.remove('is-open');
    sheet.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () {
      sheet.hidden = true;
    }, 280);
  }

  function applyChefIndex(urls, idx, fabImg, sheetImg) {
    var u = urls[idx % urls.length];
    if (fabImg) fabImg.src = u;
    if (sheetImg) sheetImg.src = u;
    localStorage.setItem(STORAGE_KEY, String(idx % urls.length));
  }

  function showPanel(homeEl, tourEl, mode) {
    if (mode === 'tour') {
      homeEl.hidden = true;
      tourEl.hidden = false;
    } else {
      tourEl.hidden = true;
      homeEl.hidden = false;
    }
  }

  function renderTourStep(ctx) {
    var step = ctx.steps[ctx.tourIndex];
    var urls = ctx.urls;
    if (!step) return;

    document.getElementById('iterum-help-tour-title').textContent = step.title;
    document.getElementById('iterum-help-chef-tour-body').textContent =
      step.body;
    document.getElementById('iterum-help-chef-progress').textContent =
      'Step ' + (ctx.tourIndex + 1) + ' of ' + ctx.steps.length;

    applyChefIndex(
      urls,
      step.chef != null ? step.chef : ctx.tourIndex,
      ctx.fabImg,
      ctx.sheetImg
    );

    var linksEl = document.getElementById('iterum-help-chef-tour-links');
    linksEl.innerHTML = '';
    (step.links || []).forEach(function (L) {
      var a = document.createElement('a');
      a.href = L.href;
      a.textContent = L.label;
      a.className = L.primary ? 'primary' : 'secondary';
      linksEl.appendChild(a);
    });

    var backBtn = document.getElementById('iterum-help-chef-tour-back');
    var nextBtn = document.getElementById('iterum-help-chef-tour-next');
    backBtn.disabled = ctx.tourIndex === 0;
    backBtn.style.opacity = ctx.tourIndex === 0 ? '0.5' : '1';

    if (ctx.tourIndex >= ctx.steps.length - 1) {
      nextBtn.textContent = 'Done';
    } else {
      nextBtn.textContent = 'Next';
    }
  }

  function updateHomePanel(state) {
    var dash = document.getElementById('iterum-help-chef-home-dash');
    if (!dash) return;
    if (state === 'ready') {
      dash.style.display = 'block';
      dash.textContent = 'Go to dashboard';
      dash.href = 'dashboard.html';
    } else if (state === 'needs_setup') {
      dash.style.display = 'block';
      dash.textContent = 'Continue setup';
      dash.href = 'setup.html';
    } else {
      var onSignin =
        (window.location.pathname || '').toLowerCase().indexOf('signin') !== -1;
      dash.style.display = 'block';
      if (onSignin) {
        dash.textContent = 'Create account (home)';
        dash.href = 'index.html';
      } else {
        dash.textContent = 'Sign in';
        dash.href = 'signin.html';
      }
    }
  }

  window.initIterumHelpChefWidget = function () {
    if (!shouldShowWidget()) return;
    if (document.querySelector('[data-iterum-help-chef]')) return;

    var urls = chefImageUrls();
    if (!urls.length) return;

    injectStyles();
    var root = buildMarkup(urls);
    document.body.appendChild(root);

    var fab = document.getElementById('iterum-help-chef-fab-btn');
    var fabImg = document.getElementById('iterum-help-chef-fab-img');
    var backdrop = document.getElementById('iterum-help-chef-backdrop');
    var sheet = document.getElementById('iterum-help-chef-sheet');
    var sheetImg = document.getElementById('iterum-help-chef-sheet-img');
    var closeBtn = document.getElementById('iterum-help-chef-close');
    var cycleBtn = document.getElementById('iterum-help-chef-cycle');
    var mailA = document.getElementById('iterum-help-chef-mail');
    var homePanel = document.getElementById('iterum-help-home-panel');
    var tourPanel = document.getElementById('iterum-help-tour-panel');
    var startTourBtn = document.getElementById('iterum-help-chef-start-tour');
    var tourBack = document.getElementById('iterum-help-chef-tour-back');
    var tourNext = document.getElementById('iterum-help-chef-tour-next');
    var tourExit = document.getElementById('iterum-help-chef-tour-exit');

    var tourCtx = {
      steps: [],
      tourIndex: 0,
      urls: urls,
      fabImg: fabImg,
      sheetImg: sheetImg
    };

    var startIdx = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (isNaN(startIdx)) startIdx = 0;
    applyChefIndex(urls, startIdx, fabImg, sheetImg);

    var email =
      typeof window.ITERUM_HELP_EMAIL === 'string'
        ? window.ITERUM_HELP_EMAIL
        : 'hello@iterumfoods.com';
    mailA.href =
      'mailto:' +
      encodeURIComponent(email) +
      '?subject=' +
      encodeURIComponent('Iterum app help');

    if (
      typeof window.ITERUM_HELP_FAQ_URL === 'string' &&
      window.ITERUM_HELP_FAQ_URL
    ) {
      var faq = document.createElement('a');
      faq.className = 'secondary';
      faq.href = window.ITERUM_HELP_FAQ_URL;
      faq.target = '_blank';
      faq.rel = 'noopener noreferrer';
      faq.textContent = 'Help center';
      mailA.parentNode.insertBefore(faq, mailA);
    }

    function refreshHomeState() {
      updateHomePanel(getTourState());
    }

    refreshHomeState();

    fab.addEventListener('click', function () {
      showPanel(homePanel, tourPanel, 'home');
      refreshHomeState();
      document.getElementById('iterum-help-sheet-title').textContent =
        'Your chef guide';
      openSheet(backdrop, sheet, fab);
    });

    closeBtn.addEventListener('click', function () {
      closeSheet(backdrop, sheet, fab);
      showPanel(homePanel, tourPanel, 'home');
    });

    backdrop.addEventListener('click', function () {
      closeSheet(backdrop, sheet, fab);
      showPanel(homePanel, tourPanel, 'home');
    });

    cycleBtn.addEventListener('click', function () {
      var idx = nextChefIndex(urls.length);
      applyChefIndex(urls, idx, fabImg, sheetImg);
    });

    startTourBtn.addEventListener('click', function () {
      tourCtx.steps = filterTourSteps(getTourState());
      tourCtx.tourIndex = 0;
      if (!tourCtx.steps.length) return;
      showPanel(homePanel, tourPanel, 'tour');
      renderTourStep(tourCtx);
    });

    tourBack.addEventListener('click', function () {
      if (tourCtx.tourIndex > 0) {
        tourCtx.tourIndex--;
        renderTourStep(tourCtx);
      }
    });

    tourNext.addEventListener('click', function () {
      if (tourCtx.tourIndex < tourCtx.steps.length - 1) {
        tourCtx.tourIndex++;
        renderTourStep(tourCtx);
      } else {
        showPanel(homePanel, tourPanel, 'home');
        refreshHomeState();
      }
    });

    tourExit.addEventListener('click', function () {
      showPanel(homePanel, tourPanel, 'home');
      refreshHomeState();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('is-open')) {
        closeSheet(backdrop, sheet, fab);
        showPanel(homePanel, tourPanel, 'home');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.initIterumHelpChefWidget();
    });
  } else {
    window.initIterumHelpChefWidget();
  }
})();
