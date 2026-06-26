/**
 * SOP Hub — manage how-to guides for web + mobile Shift.
 */
(function () {
  'use strict';

  var state = {
    pack: null,
    activeCategory: 'all',
    editingId: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, isError) {
    var el = $('sop-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError
      ? 'hsl(var(--tc-destructive, 0 84% 60%))'
      : 'hsl(var(--tc-muted-foreground))';
  }

  function toast(msg, type) {
    if (window.showToast) window.showToast(msg, type || 'info');
    else setStatus(msg, type === 'error');
  }

  function getProjectId() {
    return (
      window.projectManager?.getCurrentProject?.()?.id ||
      window.projectManager?.currentProject?.id ||
      localStorage.getItem('active_project') ||
      null
    );
  }

  function getDb() {
    return window.firestoreSync?.db || window.firebaseDb || null;
  }

  async function loadPack() {
    var pid = getProjectId();
    if (!pid) {
      setStatus('Select a workspace in the sidebar first.', true);
      state.pack = window.iterumSopPack?.emptyPack?.() || { categories: [], sops: [] };
      render();
      return;
    }
    setStatus('Loading…');
    try {
      state.pack = await window.iterumSopPack.loadPack(getDb(), pid);
      setStatus(
        `${state.pack.sops.length} guide(s) · ${state.pack.categories.length} categories · workspace ${pid}`
      );
    } catch (e) {
      console.error(e);
      setStatus('Could not load SOP pack.', true);
      state.pack = window.iterumSopPack.loadLocal(pid) || window.iterumSopPack.emptyPack();
    }
    render();
  }

  async function publishPack() {
    var pid = getProjectId();
    if (!pid || !state.pack) {
      toast('Select a workspace first.', 'error');
      return;
    }
    setStatus('Publishing to Shift…');
    try {
      state.pack = await window.iterumSopPack.savePack(getDb(), pid, state.pack);
      setStatus(`Published ${state.pack.sops.length} guide(s) to mobile How-to tab.`);
      toast('SOPs published to Shift app', 'success');
    } catch (e) {
      console.error(e);
      setStatus('Publish failed — saved locally only.', true);
      window.iterumSopPack.saveLocal(pid, state.pack);
    }
  }

  function renderCategoryTabs() {
    var el = $('sop-cat-tabs');
    if (!el || !state.pack) return;
    var cats = state.pack.categories || [];
    var tabs = [
      '<button type="button" class="sop-cat-tab' +
        (state.activeCategory === 'all' ? ' is-active' : '') +
        '" data-cat="all">All</button>'
    ];
    cats.forEach(function (c) {
      var count = state.pack.sops.filter(function (s) {
        return s.categoryId === c.id;
      }).length;
      tabs.push(
        '<button type="button" class="sop-cat-tab' +
          (state.activeCategory === c.id ? ' is-active' : '') +
          '" data-cat="' +
          c.id +
          '">' +
          (c.icon ? c.icon + ' ' : '') +
          c.name +
          ' (' +
          count +
          ')</button>'
      );
    });
    el.innerHTML = tabs.join('');
  }

  function renderList() {
    var el = $('sop-list');
    if (!el || !state.pack) return;
    var sops = state.pack.sops.slice();
    if (state.activeCategory !== 'all') {
      sops = sops.filter(function (s) {
        return s.categoryId === state.activeCategory;
      });
    }
    sops.sort(function (a, b) {
      return (a.sort || 0) - (b.sort || 0);
    });

    if (!sops.length) {
      el.innerHTML =
        '<p style="color:hsl(var(--tc-muted-foreground));margin:0;">No guides in this category. Import the test pack or add one.</p>';
      return;
    }

    el.innerHTML = sops
      .map(function (s) {
        var catName = window.iterumSopPack.categoryName(state.pack, s.categoryId);
        return (
          '<article class="sop-card" data-sop-id="' +
          s.id +
          '">' +
          '<div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:hsl(var(--tc-muted-foreground));margin-bottom:4px;">' +
          catName +
          '</div>' +
          '<h3>' +
          escapeHtml(s.title) +
          '</h3>' +
          '<pre>' +
          escapeHtml(s.body) +
          '</pre>' +
          '<div class="sop-card-actions">' +
          '<button type="button" class="sop-btn" data-sop-edit="' +
          s.id +
          '">Edit</button>' +
          '<button type="button" class="sop-btn" data-sop-del="' +
          s.id +
          '">Remove</button>' +
          '</div></article>'
        );
      })
      .join('');
  }

  function renderCategorySelect() {
    var sel = $('sop-f-category');
    if (!sel || !state.pack) return;
    sel.innerHTML = (state.pack.categories || [])
      .map(function (c) {
        return (
          '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>'
        );
      })
      .join('');
  }

  function render() {
    renderCategoryTabs();
    renderList();
    renderCategorySelect();
  }

  function escapeHtml(t) {
    if (t == null) return '';
    return String(t)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openModal(sop) {
    state.editingId = sop ? sop.id : null;
    $('sop-modal-title').textContent = sop ? 'Edit guide' : 'Add guide';
    $('sop-f-title').value = sop ? sop.title : '';
    $('sop-f-body').value = sop ? sop.body : '';
    if (sop && $('sop-f-category')) {
      $('sop-f-category').value = sop.categoryId;
    }
    $('sop-modal').classList.add('is-open');
  }

  function closeModal() {
    state.editingId = null;
    $('sop-modal').classList.remove('is-open');
  }

  function saveModal() {
    var title = ($('sop-f-title').value || '').trim();
    var body = ($('sop-f-body').value || '').trim();
    var categoryId = $('sop-f-category').value;
    if (!title) {
      toast('Enter a title.', 'error');
      return;
    }
    if (!state.pack) state.pack = window.iterumSopPack.emptyPack();

    if (state.editingId) {
      var existing = state.pack.sops.find(function (s) {
        return s.id === state.editingId;
      });
      if (existing) {
        existing.title = title;
        existing.body = body;
        existing.categoryId = categoryId;
      }
    } else {
      state.pack.sops.push({
        id: 'sop_' + Date.now(),
        categoryId: categoryId,
        title: title,
        body: body,
        sort: state.pack.sops.length + 1
      });
    }

    var pid = getProjectId();
    if (pid) window.iterumSopPack.saveLocal(pid, state.pack);
    closeModal();
    render();
    setStatus('Saved locally — click Publish to push to Shift.');
  }

  function removeSop(id) {
    if (!state.pack || !confirm('Remove this guide?')) return;
    state.pack.sops = state.pack.sops.filter(function (s) {
      return s.id !== id;
    });
    var pid = getProjectId();
    if (pid) window.iterumSopPack.saveLocal(pid, state.pack);
    render();
  }

  async function importSample() {
    var pid = getProjectId();
    if (!pid) {
      toast('Select a workspace first.', 'error');
      return;
    }
    if (
      state.pack?.sops?.length &&
      !confirm('Replace current guides with the test SOP pack?')
    ) {
      return;
    }
    try {
      state.pack = await window.iterumSopPack.importSample(getDb(), pid);
      render();
      setStatus(
        `Imported ${state.pack.sops.length} test guides in ${state.pack.categories.length} categories.`
      );
      toast('Test SOP pack loaded', 'success');
    } catch (e) {
      console.error(e);
      toast('Import failed.', 'error');
    }
  }

  function bind() {
    $('sop-btn-refresh')?.addEventListener('click', function () {
      void loadPack();
    });
    $('sop-btn-import')?.addEventListener('click', function () {
      void importSample();
    });
    $('sop-btn-publish')?.addEventListener('click', function () {
      void publishPack();
    });
    $('sop-btn-add')?.addEventListener('click', function () {
      openModal(null);
    });
    $('sop-btn-cancel')?.addEventListener('click', closeModal);
    $('sop-btn-save')?.addEventListener('click', saveModal);

    $('sop-cat-tabs')?.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cat]');
      if (!btn) return;
      state.activeCategory = btn.dataset.cat;
      render();
    });

    $('sop-list')?.addEventListener('click', function (e) {
      var edit = e.target.closest('[data-sop-edit]');
      var del = e.target.closest('[data-sop-del]');
      if (edit) {
        var sop = state.pack.sops.find(function (s) {
          return s.id === edit.dataset.sopEdit;
        });
        if (sop) openModal(sop);
      }
      if (del) removeSop(del.dataset.sopDel);
    });

    document.addEventListener('projectChanged', function () {
      void loadPack();
    });
  }

  function init() {
    if (!window.iterumSopPack) {
      setStatus('SOP tools failed to load.', true);
      return;
    }
    bind();
    setTimeout(function () {
      void loadPack();
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
