/**
 * Beverage menu quick-add — cocktails, wine, beer, mocktails.
 */
(function () {
  'use strict';

  const KINDS = {
    cocktail: {
      label: 'Cocktail',
      icon: '🍸',
      recipeType: 'bar',
      targetFoodCost: 18,
      prepStation: 'Bar',
      defaultSection: 'Signature Cocktails',
      placeholder: 'e.g. Last Word'
    },
    wine: {
      label: 'Wine',
      icon: '🍷',
      recipeType: 'beverage',
      targetFoodCost: 25,
      prepStation: 'Bar',
      defaultSection: 'White',
      placeholder: 'e.g. Sancerre — Pascal Jolivet'
    },
    beer: {
      label: 'Beer',
      icon: '🍺',
      recipeType: 'beverage',
      targetFoodCost: 22,
      prepStation: 'Bar',
      defaultSection: 'On Draft',
      placeholder: 'e.g. Jack’s Abby House Lager'
    },
    mocktail: {
      label: 'Mocktail',
      icon: '🫧',
      recipeType: 'bar',
      targetFoodCost: 15,
      prepStation: 'Bar',
      defaultSection: 'Signature Zero-Proof',
      placeholder: 'e.g. Cucumber Cooler'
    }
  };

  function getActiveMenu() {
    return window.currentSelectedMenu || window.enhancedMenuManager?.currentMenu;
  }

  function isBeverageMenuActive(menu) {
    const m = menu || getActiveMenu();
    const type = m?.menuType || m?.menu_type;
    return window.MenuPlanFormat?.isBeverageMenuType(type) || false;
  }

  function menuSections(menu) {
    const m = menu || getActiveMenu();
    if (m?.categories?.length) return m.categories;
    if (m?.sections?.length) {
      return m.sections.map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean);
    }
    const type = m?.menuType || m?.menu_type || 'cocktails';
    return window.MenuPlanFormat?.previewSectionsForType(type) || [];
  }

  function defaultKindForMenu(menu) {
    const type = menu?.menuType || menu?.menu_type;
    if (type === 'wine') return 'wine';
    if (type === 'beer') return 'beer';
    if (type === 'mocktails') return 'mocktail';
    return 'cocktail';
  }

  function parseBuildLines(text) {
    return String(text || '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const m = line.match(/^([\d./\s]+)\s*([a-z]+)?\s+(.+)$/i);
        if (m) {
          return {
            ingredient: m[3].trim(),
            amount: m[1].trim(),
            unit: (m[2] || 'oz').trim()
          };
        }
        return { ingredient: line, amount: '', unit: '' };
      });
  }

  function buildDescription(kind, data) {
    const parts = [];
    if (kind === 'wine') {
      if (data.varietal) parts.push(data.varietal);
      if (data.region) parts.push(data.region);
      if (data.vintage) parts.push(data.vintage);
      if (data.pourSize) parts.push(data.pourSize);
    } else if (kind === 'beer') {
      if (data.brewery) parts.push(data.brewery);
      if (data.style) parts.push(data.style);
      if (data.format) parts.push(data.format);
      if (data.abv) parts.push(`${data.abv}% ABV`);
    } else {
      if (data.glass) parts.push(data.glass);
      if (data.method) parts.push(data.method);
      if (data.garnish) parts.push(data.garnish);
    }
    if (data.description) parts.push(data.description);
    return parts.filter(Boolean).join(' · ');
  }

  function buildMenuItem(kind, form) {
    const cfg = KINDS[kind];
    const menu = getActiveMenu();
    const section =
      form.section ||
      cfg.defaultSection ||
      menuSections(menu)[0] ||
      'Beverages';

    const item = {
      name: form.name.trim(),
      description: buildDescription(kind, form),
      category: section,
      price: parseFloat(form.price) || 0,
      targetFoodCost: cfg.targetFoodCost,
      prepStation: cfg.prepStation,
      recipeType: cfg.recipeType,
      beverageKind: kind,
      beverageMeta: {
        glass: form.glass || '',
        method: form.method || '',
        garnish: form.garnish || '',
        build: form.build || '',
        producer: form.producer || '',
        region: form.region || '',
        varietal: form.varietal || '',
        vintage: form.vintage || '',
        pourSize: form.pourSize || '',
        brewery: form.brewery || '',
        style: form.style || '',
        format: form.format || '',
        abv: form.abv || ''
      },
      dietaryInfo: kind === 'mocktail' ? ['Non-alcoholic'] : [],
      availability: {
        daysAvailable: ['all'],
        mealPeriods: menu?.service?.mealPeriods || ['dinner']
      }
    };

    if (form.build) {
      item.components = parseBuildLines(form.build).map(l =>
        l.amount ? `${l.amount} ${l.unit} ${l.ingredient}`.trim() : l.ingredient
      );
    }

    return item;
  }

  function buildRecipeInstructions(kind, form) {
    if (kind === 'wine') {
      const lines = [];
      if (form.pourSize) lines.push(`Pour: ${form.pourSize}`);
      if (form.producer) lines.push(`Producer: ${form.producer}`);
      return lines;
    }
    if (kind === 'beer') {
      const lines = [];
      if (form.format) lines.push(`Serve: ${form.format}`);
      if (form.brewery) lines.push(`Brewery: ${form.brewery}`);
      return lines;
    }
    const steps = [];
    if (form.method) steps.push(`${form.method} and strain.`);
    if (form.glass) steps.push(`Serve in ${form.glass}.`);
    if (form.garnish) steps.push(`Garnish: ${form.garnish}.`);
    return steps;
  }

  function renderFieldHtml(field, sections, cfg) {
    const id = `bev-${field.id}`;
    if (field.type === 'select' && field.id === 'section') {
      const opts = sections
        .map(
          s =>
            `<option value="${String(s).replace(/"/g, '&quot;')}">${s}</option>`
        )
        .join('');
      return `
        <div class="form-group">
          <label class="form-label" for="${id}">${field.label}</label>
          <select id="${id}" class="form-select">${opts}</select>
        </div>`;
    }
    if (field.type === 'select') {
      const opts = (field.options || [])
        .map(
          o =>
            `<option value="${o}">${o}</option>`
        )
        .join('');
      return `
        <div class="form-group">
          <label class="form-label" for="${id}">${field.label}</label>
          <select id="${id}" class="form-select">${opts}</select>
        </div>`;
    }
    if (field.type === 'textarea') {
      return `
        <div class="form-group">
          <label class="form-label" for="${id}">${field.label}</label>
          <textarea id="${id}" class="form-textarea" rows="${field.rows || 3}" placeholder="${field.placeholder || ''}"></textarea>
        </div>`;
    }
    return `
      <div class="form-group">
        <label class="form-label" for="${id}">${field.label}${field.required ? ' *' : ''}</label>
        <input type="${field.inputType || 'text'}" id="${id}" class="form-input" placeholder="${field.placeholder || cfg.placeholder || ''}"${field.required ? ' required' : ''}${field.step ? ` step="${field.step}"` : ''}${field.min != null ? ` min="${field.min}"` : ''}>
      </div>`;
  }

  function fieldsForKind(kind) {
    const common = [
      {
        id: 'name',
        label: 'Name',
        required: true,
        placeholder: KINDS[kind].placeholder
      },
      {
        id: 'price',
        label: 'Menu price',
        inputType: 'number',
        step: '0.01',
        min: 0,
        required: true
      },
      { id: 'section', label: 'Section', type: 'select' }
    ];

    if (kind === 'cocktail' || kind === 'mocktail') {
      return common.concat([
        {
          id: 'build',
          label: 'Build (one ingredient per line)',
          type: 'textarea',
          placeholder: '2 oz gin\n0.75 oz lime\n0.5 oz maraschino',
          rows: 4
        },
        { id: 'glass', label: 'Glass', placeholder: 'Coupe, rocks, collins…' },
        {
          id: 'method',
          label: 'Method',
          type: 'select',
          options: ['Shake', 'Stir', 'Build', 'Blend', 'Throw']
        },
        { id: 'garnish', label: 'Garnish', placeholder: 'Lime wheel, expressed oils…' },
        {
          id: 'description',
          label: 'Guest-facing line (optional)',
          type: 'textarea',
          rows: 2,
          placeholder: 'Bright, citrus-forward, herbaceous finish'
        }
      ]);
    }

    if (kind === 'wine') {
      return common.concat([
        { id: 'producer', label: 'Producer' },
        { id: 'varietal', label: 'Varietal / cuvée' },
        { id: 'region', label: 'Region' },
        { id: 'vintage', label: 'Vintage', placeholder: '2022 or NV' },
        {
          id: 'pourSize',
          label: 'Pour',
          type: 'select',
          options: ['5 oz', '6 oz', 'By the glass', 'Bottle']
        },
        {
          id: 'description',
          label: 'Tasting note (optional)',
          type: 'textarea',
          rows: 2
        }
      ]);
    }

    return common.concat([
      { id: 'brewery', label: 'Brewery' },
      { id: 'style', label: 'Style', placeholder: 'Pilsner, IPA, stout…' },
      {
        id: 'format',
        label: 'Format',
        type: 'select',
        options: ['Draft', 'Bottle', 'Can', 'Large format']
      },
      { id: 'abv', label: 'ABV %', inputType: 'number', step: '0.1', min: 0 },
      {
        id: 'description',
        label: 'Note (optional)',
        type: 'textarea',
        rows: 2
      }
    ]);
  }

  function readForm(kind) {
    const data = {};
    fieldsForKind(kind).forEach(field => {
      const el = document.getElementById(`bev-${field.id}`);
      if (el) data[field.id] = el.value;
    });
    return data;
  }

  function closeModal() {
    const modal = document.getElementById('beverage-quick-add-modal');
    if (modal) modal.remove();
  }

  async function submitBeverage(kind) {
    const form = readForm(kind);
    if (!form.name?.trim()) {
      alert('Enter a name.');
      return;
    }
    if (!form.price) {
      alert('Enter a price.');
      return;
    }

    const menu = getActiveMenu();
    if (!menu) {
      alert('Select a menu first.');
      return;
    }

    const item = buildMenuItem(kind, form);
    item.recipeInstructions = buildRecipeInstructions(kind, form);

    if (window.enhancedMenuManager) {
      window.enhancedMenuManager.currentMenu = menu;
      window.enhancedMenuManager.menuItems = menu.items || [];
      await window.enhancedMenuManager.addMenuItem(item, true);
    } else {
      alert('Menu builder is still loading.');
      return;
    }

    closeModal();
    if (window.menuBuilderRevampUI?.refresh) {
      window.menuBuilderRevampUI.refresh();
    } else if (typeof window.displayMenuItems === 'function') {
      window.displayMenuItems(menu);
    }
  }

  function openQuickAdd(options) {
    const opts = options || {};
    const menu = getActiveMenu();
    if (!menu) {
      alert('Select or create a menu first.');
      return;
    }

    let kind = opts.kind;
    if (!kind && opts.category && window.MenuPlanFormat) {
      kind = window.MenuPlanFormat.inferBeverageKindFromSection(
        opts.category,
        menu.menuType || menu.menu_type
      );
    }
    if (!kind) {
      kind = defaultKindForMenu(menu);
    }

    const menuType = menu.menuType || menu.menu_type;
    if (menuType === 'bar-full' && !opts.kind && !opts.category) {
      openKindPicker();
      return;
    }

    showBeverageModal(kind, opts.category);
  }

  function openKindPicker() {
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'beverage-quick-add-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 420px;">
        <div class="modal-header">
          <h3>Add to bar menu</h3>
          <span class="modal-close" onclick="MenuBeverageHelper.closeModal()">&times;</span>
        </div>
        <div class="modal-body mb-bev-kind-grid">
          ${Object.entries(KINDS)
            .map(
              ([key, cfg]) => `
            <button type="button" class="mb-bev-kind-btn" data-bev-kind="${key}">
              <span class="mb-bev-kind-btn__icon">${cfg.icon}</span>
              <span class="mb-bev-kind-btn__label">${cfg.label}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-bev-kind]').forEach(btn => {
      btn.addEventListener('click', () => {
        showBeverageModal(btn.dataset.bevKind);
      });
    });
  }

  function showBeverageModal(kind, preferredSection) {
    closeModal();
    const cfg = KINDS[kind];
    if (!cfg) return;

    const sections = menuSections();
    const fields = fieldsForKind(kind);
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'beverage-quick-add-modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>${cfg.icon} Add ${cfg.label}</h3>
          <span class="modal-close" onclick="MenuBeverageHelper.closeModal()">&times;</span>
        </div>
        <div class="modal-body">
          <p class="text-sm" style="color:hsl(var(--tc-muted-foreground));margin:0 0 1rem;line-height:1.45;">
            Saves to your menu and creates a <strong>bar recipe draft</strong> in Recipe Developer.
          </p>
          <form id="beverage-quick-add-form" onsubmit="event.preventDefault(); MenuBeverageHelper.submit('${kind}');">
            ${fields.map(f => renderFieldHtml(f, sections, cfg)).join('')}
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="MenuBeverageHelper.closeModal()">Cancel</button>
          <button type="button" class="btn btn-primary tc-btn tc-btn-accent" onclick="MenuBeverageHelper.submit('${kind}')">Add ${cfg.label}</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    const sectionEl = document.getElementById('bev-section');
    if (sectionEl) {
      const pick =
        preferredSection ||
        cfg.defaultSection ||
        sections.find(s => s.toLowerCase().includes(kind === 'wine' ? 'white' : kind)) ||
        sections[0];
      if (pick && [...sectionEl.options].some(o => o.value === pick)) {
        sectionEl.value = pick;
      }
    }

    setTimeout(() => document.getElementById('bev-name')?.focus(), 50);
  }

  function updateQuickBarVisibility() {
    const bar = document.getElementById('mb-beverage-quick-bar');
    if (!bar) return;
    const show = isBeverageMenuActive();
    bar.hidden = !show;
    const addBtn = document.getElementById('mb-btn-add-item');
    if (addBtn) {
      addBtn.innerHTML = show
        ? '<i class="fa-solid fa-plus" aria-hidden="true"></i> Add drink'
        : '<i class="fa-solid fa-plus" aria-hidden="true"></i> Add item';
    }
  }

  window.MenuBeverageHelper = {
    KINDS,
    isBeverageMenuActive,
    openQuickAdd,
    openKindPicker,
    submit: submitBeverage,
    closeModal,
    updateQuickBarVisibility,
    buildMenuItem
  };
})();
