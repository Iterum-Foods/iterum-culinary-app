/**
 * Recipe Developer — ingredient rows (search selector, qty/unit, prep recipes).
 */
(function () {
  const PREP_CATEGORIES = new Set([
    'prep-recipe',
    'prep',
    'bar-prep',
    'kitchen-prep'
  ]);

  function getContainer() {
    return document.getElementById('ingredients-container');
  }

  function rowCount() {
    const c = getContainer();
    return c ? c.querySelectorAll('.ingredient-row').length : 0;
  }

  function reindexRows() {
    const c = getContainer();
    if (!c) return;
    c.querySelectorAll('.ingredient-row').forEach((row, index) => {
      row.dataset.ingredientIndex = String(index);
      const selectEl = row.querySelector('.ingredient-select-container');
      const qtyEl = row.querySelector('.quantity-unit-container');
      if (selectEl) selectEl.id = `ingredient-select-${index}`;
      if (qtyEl) qtyEl.id = `ingredient-qty-unit-${index}`;
    });
  }

  function getIngredientOptionsHtml() {
    if (typeof getIngredientOptions === 'function') {
      return getIngredientOptions();
    }
    let list = [];
    try {
      list = JSON.parse(
        localStorage.getItem('ingredients_database') ||
          localStorage.getItem('ingredients') ||
          '[]'
      );
    } catch (_e) {
      list = [];
    }
    return list
      .map(
        ing =>
          `<option value="${ing.id}">${(ing.name || '').replace(/</g, '&lt;')}</option>`
      )
      .join('');
  }

  function updateQuantityUnitSelector(index, ingredient, preset = {}) {
    const container = document.getElementById(`ingredient-qty-unit-${index}`);
    if (!container || !window.ingredientSelector) return;

    const defaultUnit =
      preset.unit ||
      ingredient?.unit ||
      ingredient?.default_unit ||
      (ingredient?.isPrepRecipe ? 'oz' : 'g');

    container.innerHTML = '';
    const qtyBlock = window.ingredientSelector.createQuantityUnitSelector({
      id: `ingredient-qty-unit-${index}`,
      name: `ingredient_${index}`,
      defaultValue: preset.quantity ?? preset.amount ?? 1,
      defaultUnit,
      ingredient: ingredient?.isPrepRecipe ? null : ingredient
    });
    container.appendChild(qtyBlock);
  }

  function setRowValues(index, data) {
    const kind = data.type || data.kind || 'ingredient';
    const isPrep = kind === 'prep-recipe' || data.isPrepRecipe;

    const idInput = document.getElementById(`ingredient-select-${index}-id`);
    const nameInput = document.getElementById(
      `ingredient-select-${index}-name`
    );
    const kindInput = document.getElementById(
      `ingredient-select-${index}-kind`
    );
    const searchInput = document.getElementById(
      `ingredient-select-${index}-input`
    );
    const baseUnit = document.getElementById(
      `ingredient-select-${index}-base-unit`
    );

    let id = data.id || data.ingredientId || data.recipeId || '';
    const name = data.name || '';
    if (isPrep && id && !String(id).startsWith('prep:')) {
      id = `prep:${id}`;
    }

    if (idInput) idInput.value = id;
    if (nameInput) nameInput.value = name;
    if (kindInput) kindInput.value = isPrep ? 'prep-recipe' : 'ingredient';
    if (searchInput) searchInput.value = name;
    if (baseUnit) baseUnit.value = data.unit || 'g';

    const row = document.querySelector(
      `.ingredient-row[data-ingredient-index="${index}"]`
    );
    if (row) {
      row.dataset.ingredientKind = isPrep ? 'prep-recipe' : 'ingredient';
      if (isPrep) row.classList.add('is-prep-ingredient');
    }

    const pseudo = isPrep
      ? { isPrepRecipe: true, name, unit: data.unit || 'oz' }
      : window.ingredientSelector?.getIngredientById(id) ||
        window.ingredientSelector?.getIngredientByName(name);

    updateQuantityUnitSelector(index, pseudo || null, data);

    const qtyInput = document.getElementById(
      `ingredient-qty-unit-${index}-qty`
    );
    const unitSelect = document.getElementById(
      `ingredient-qty-unit-${index}-unit`
    );
    const qty = data.quantity ?? data.amount;
    if (qtyInput && qty != null && qty !== '') qtyInput.value = qty;
    if (unitSelect && data.unit) unitSelect.value = data.unit;

    const notesEl = row?.querySelector('.ingredient-notes');
    if (notesEl && data.notes != null) notesEl.value = data.notes;

    const wasteEl = row?.querySelector('.ingredient-waste');
    if (wasteEl && data.wastePercentage != null) {
      wasteEl.value = data.wastePercentage;
    }
  }

  function mountIngredientRow(index, rowEl, preset = {}) {
    if (!rowEl) return;

    rowEl.dataset.ingredientIndex = String(index);

    let selectWrap = rowEl.querySelector('.ingredient-select-container');
    let qtyWrap = rowEl.querySelector('.quantity-unit-container');

    if (!selectWrap) {
      selectWrap = document.createElement('div');
      selectWrap.className = 'ingredient-select-container';
      rowEl.prepend(selectWrap);
    }
    if (!qtyWrap) {
      qtyWrap = document.createElement('div');
      qtyWrap.className = 'quantity-unit-container';
      rowEl.insertBefore(qtyWrap, selectWrap.nextSibling);
    }

    selectWrap.id = `ingredient-select-${index}`;
    qtyWrap.id = `ingredient-qty-unit-${index}`;
    selectWrap.innerHTML = '';

    if (window.ingredientSelector?.initialized) {
      const selector = window.ingredientSelector.createSelector({
        id: `ingredient-select-${index}`,
        name: `ingredient_${index}`,
        placeholder: 'Search ingredient or prep recipe…',
        onSelect: ingredient => {
          rowEl.dataset.ingredientKind = ingredient.isPrepRecipe
            ? 'prep-recipe'
            : 'ingredient';
          rowEl.classList.toggle(
            'is-prep-ingredient',
            !!ingredient.isPrepRecipe
          );
          updateQuantityUnitSelector(index, ingredient);
        }
      });
      selectWrap.appendChild(selector);
    } else {
      selectWrap.innerHTML = `
        <select class="form-select ingredient-select" style="width:100%">
          <option value="">Select ingredient…</option>
          ${getIngredientOptionsHtml()}
        </select>`;
    }

    updateQuantityUnitSelector(index, null, preset);

    if (preset && (preset.id || preset.name || preset.recipeId)) {
      setRowValues(index, preset);
    }
  }

  function createRowHtml(index) {
    return `
      <div class="quantity-unit-container" id="ingredient-qty-unit-${index}"></div>
      <div class="ingredient-select-container" id="ingredient-select-${index}"></div>
      <input type="text" class="form-input ingredient-notes" placeholder="Notes">
      <button type="button" class="btn btn-secondary btn-sm" onclick="removeIngredient(this)" title="Remove">🗑️</button>
    `;
  }

  function addIngredientRow(preset = {}) {
    const container = getContainer();
    if (!container) return;

    const index = rowCount();
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.dataset.ingredientIndex = String(index);
    row.innerHTML = createRowHtml(index);
    container.appendChild(row);
    mountIngredientRow(index, row, preset);
  }

  function initializeIngredientSelectors() {
    const container = getContainer();
    if (!container) return;

    container.querySelectorAll('.ingredient-row').forEach((row, index) => {
      mountIngredientRow(index, row, {});
    });
  }

  function resetIngredientsContainer() {
    const container = getContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="ingredient-row" data-ingredient-index="0">
        <div class="quantity-unit-container" id="ingredient-qty-unit-0"></div>
        <div class="ingredient-select-container" id="ingredient-select-0"></div>
        <input type="text" class="form-input ingredient-notes" placeholder="Notes">
        <button type="button" class="btn btn-secondary btn-sm" onclick="removeIngredient(this)" title="Remove">🗑️</button>
      </div>`;

    const boot = () => {
      if (window.ingredientSelector?.initialized) {
        mountIngredientRow(0, container.querySelector('.ingredient-row'), {});
      } else {
        window.ingredientSelector?.init?.().then(() => {
          mountIngredientRow(0, container.querySelector('.ingredient-row'), {});
        });
      }
    };
    boot();
  }

  function loadIngredientsIntoForm(ingredients) {
    const container = getContainer();
    if (!container || !Array.isArray(ingredients)) return;

    container.innerHTML = '';
    ingredients.forEach(ing => addIngredientRow(ing));
    if (ingredients.length === 0) resetIngredientsContainer();
  }

  function collectIngredients() {
    const ingredients = [];
    document
      .querySelectorAll('#ingredients-container .ingredient-row')
      .forEach(row => {
        const index = row.dataset.ingredientIndex;
        const kind =
          row.dataset.ingredientKind ||
          document.getElementById(`ingredient-select-${index}-kind`)?.value ||
          'ingredient';

        const hiddenId = document.getElementById(
          `ingredient-select-${index}-id`
        );
        const hiddenName = document.getElementById(
          `ingredient-select-${index}-name`
        );
        const fallbackSelect = row.querySelector('.ingredient-select');
        const qtyInput = document.getElementById(
          `ingredient-qty-unit-${index}-qty`
        );
        const unitSelect = document.getElementById(
          `ingredient-qty-unit-${index}-unit`
        );
        const notesInput = row.querySelector('.ingredient-notes');
        const wasteInput = row.querySelector('.ingredient-waste');

        let id = hiddenId?.value?.trim() || '';
        let name = hiddenName?.value?.trim() || '';

        if (!id && fallbackSelect?.value) {
          id = fallbackSelect.value;
          name =
            fallbackSelect.options[
              fallbackSelect.selectedIndex
            ]?.text?.trim() || name;
        }

        if (!id && !name) return;

        const quantity = qtyInput?.value?.trim() || '';
        const unit = unitSelect?.value || '';
        const wastePercentage = wasteInput
          ? parseFloat(wasteInput.value) || 0
          : 0;
        const isPrep = kind === 'prep-recipe' || id.startsWith('prep:');

        const entry = {
          type: isPrep ? 'prep-recipe' : 'ingredient',
          id: isPrep ? id.replace(/^prep:/, '') : id,
          name,
          quantity,
          amount: quantity,
          unit,
          wastePercentage,
          trimPercentage: wastePercentage,
          waste: wastePercentage,
          notes: notesInput?.value?.trim() || ''
        };

        if (isPrep) {
          entry.recipeId = entry.id;
          entry.isPrepRecipe = true;
        }

        ingredients.push(entry);
      });
    return ingredients;
  }

  function loadPrepRecipesForPicker() {
    let all = [];
    if (window.userDataManager) {
      all = window.userDataManager.loadData('recipes', {
        filterByProject: false
      });
    } else if (window.universalRecipeManager) {
      all = window.universalRecipeManager.getAllRecipes();
    } else {
      try {
        all = JSON.parse(localStorage.getItem('recipes') || '[]');
      } catch (_e) {
        all = [];
      }
    }

    const editingId =
      typeof currentRecipeId !== 'undefined' && currentRecipeId
        ? currentRecipeId
        : localStorage.getItem('editing_recipe_id');

    return all.filter(r => {
      if (!r || r.id === editingId) return false;
      const cat = (r.category || r.recipeType || '').toLowerCase();
      const type = (r.recipeType || '').toLowerCase();
      return (
        PREP_CATEGORIES.has(cat) ||
        PREP_CATEGORIES.has(type) ||
        type === 'bar-prep' ||
        type === 'kitchen-prep'
      );
    });
  }

  function openAddPrepRecipeIngredient() {
    const prepRecipes = loadPrepRecipesForPicker();
    if (!prepRecipes.length) {
      alert(
        'No prep recipes found. Save a recipe as Bar prep or Kitchen prep first, then link it here.'
      );
      return;
    }

    const options = prepRecipes
      .map(
        r =>
          `<option value="${r.id}">${(r.title || r.name || 'Untitled').replace(/</g, '&lt;')}</option>`
      )
      .join('');

    const modal = document.createElement('div');
    modal.className = 'tc-rd-prep-picker-modal';
    modal.innerHTML = `
      <div class="tc-rd-prep-picker-backdrop" data-close="1"></div>
      <div class="tc-rd-prep-picker-dialog" role="dialog" aria-labelledby="tc-rd-prep-picker-title">
        <h3 id="tc-rd-prep-picker-title">Add prep recipe as ingredient</h3>
        <p class="tc-rd-prep-picker-hint">Use syrups, batches, and mise as building blocks in drinks and dishes.</p>
        <label class="form-label" for="tc-rd-prep-recipe-select">Prep recipe</label>
        <select id="tc-rd-prep-recipe-select" class="form-select">${options}</select>
        <label class="form-label" for="tc-rd-prep-qty">Amount</label>
        <input id="tc-rd-prep-qty" type="number" class="form-input" min="0" step="0.01" value="1">
        <label class="form-label" for="tc-rd-prep-unit">Unit</label>
        <select id="tc-rd-prep-unit" class="form-select">
          <option value="oz">oz</option>
          <option value="ml">ml</option>
          <option value="fl oz">fl oz</option>
          <option value="cup">cup</option>
          <option value="g">g</option>
          <option value="each">each</option>
        </select>
        <div class="tc-rd-prep-picker-actions">
          <button type="button" class="btn btn-secondary" data-close="1">Cancel</button>
          <button type="button" class="btn btn-primary" id="tc-rd-prep-confirm">Add to recipe</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', close);
    });

    modal
      .querySelector('#tc-rd-prep-confirm')
      ?.addEventListener('click', () => {
        const select = modal.querySelector('#tc-rd-prep-recipe-select');
        const recipe = prepRecipes.find(r => r.id === select?.value);
        if (!recipe) return;

        const qty = modal.querySelector('#tc-rd-prep-qty')?.value || '1';
        const unit = modal.querySelector('#tc-rd-prep-unit')?.value || 'oz';
        const title = recipe.title || recipe.name || 'Prep recipe';

        addIngredientRow({
          type: 'prep-recipe',
          isPrepRecipe: true,
          id: `prep:${recipe.id}`,
          recipeId: recipe.id,
          name: title,
          quantity: qty,
          unit,
          notes: 'Prep recipe'
        });
        close();
      });
  }

  function removeIngredientRow(button) {
    const saved = collectIngredients();
    const row = button.closest('.ingredient-row');
    if (!row) return;

    const container = getContainer();
    const rows = container?.querySelectorAll('.ingredient-row');
    if (!rows?.length) return;

    if (rows.length <= 1) {
      resetIngredientsContainer();
      return;
    }

    const index = Array.from(rows).indexOf(row);
    if (index >= 0) saved.splice(index, 1);
    loadIngredientsIntoForm(saved);
  }

  window.initializeIngredientSelectors = initializeIngredientSelectors;
  window.updateQuantityUnitSelector = updateQuantityUnitSelector;
  window.addIngredient = addIngredientRow;
  window.removeIngredient = removeIngredientRow;
  window.openAddPrepRecipeIngredient = openAddPrepRecipeIngredient;
  window.collectIngredientsFromRows = collectIngredients;

  window.RecipeDeveloperIngredients = {
    initAll: initializeIngredientSelectors,
    addRow: addIngredientRow,
    collect: collectIngredients,
    loadIntoForm: loadIngredientsIntoForm,
    reset: resetIngredientsContainer,
    addPrepRecipe: openAddPrepRecipeIngredient,
    removeRow: removeIngredientRow,
    reindexRows
  };

  function bootIngredientRows() {
    const run = () => initializeIngredientSelectors();
    if (window.ingredientSelector?.initialized) {
      run();
    } else if (window.ingredientSelector) {
      window.ingredientSelector.init().then(run);
    } else {
      run();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootIngredientRows);
  } else {
    bootIngredientRows();
  }
})();
