/**
 * taste-craft-revamp interactions for recipe-developer.html (layout is in HTML/CSS).
 */
(function () {
  const TYPE_LABELS = {
    'bar-prep': { label: 'Bar prep', category: 'prep-recipe' },
    bar: { label: 'Bar', category: 'beverage' },
    'kitchen-prep': { label: 'Kitchen prep', category: 'prep-recipe' },
    'kitchen-dish': { label: 'Kitchen dish', category: 'main-course' },
  };

  function syncToolbarTitle() {
    const name = document.getElementById('recipe-name');
    const title = document.getElementById('tc-rd-toolbar-title');
    if (name && title) {
      title.textContent = name.value.trim() || 'Untitled recipe';
    }
  }

  function setActiveType(typeKey) {
    const meta = TYPE_LABELS[typeKey] || TYPE_LABELS['kitchen-dish'];
    document.querySelectorAll('.tc-rd-type-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.recipeType === typeKey);
    });
    const label = meta.label + ' · Working draft';
    const eyebrow = document.getElementById('tc-rd-type-label');
    const badge = document.getElementById('tc-rd-cover-badge');
    if (eyebrow) eyebrow.textContent = label;
    if (badge) badge.textContent = label;
    const cat = document.getElementById('recipe-category');
    if (cat && meta.category) cat.value = meta.category;
  }

  function inferTypeFromCategory() {
    const cat = document.getElementById('recipe-category');
    if (!cat) return 'kitchen-dish';
    if (cat.value === 'beverage') return 'bar';
    if (cat.value === 'prep-recipe') return 'kitchen-prep';
    return 'kitchen-dish';
  }

  function wireTypeButtons() {
    document.querySelectorAll('.tc-rd-type-btn').forEach(btn => {
      btn.addEventListener('click', () => setActiveType(btn.dataset.recipeType || 'kitchen-dish'));
    });
    setActiveType(inferTypeFromCategory());
  }

  function wireProgressSteps() {
    document.querySelectorAll('.tc-rd-step-bar .progress-step').forEach(step => {
      step.style.cursor = 'pointer';
      step.addEventListener('click', () => {
        const key = step.dataset.step;
        const target = document.querySelector('[data-section="' + key + '"]');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function init() {
    document.body.classList.add('tc-revamp-body');
    const name = document.getElementById('recipe-name');
    if (name) {
      name.addEventListener('input', syncToolbarTitle);
      syncToolbarTitle();
    }
    wireTypeButtons();
    wireProgressSteps();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
