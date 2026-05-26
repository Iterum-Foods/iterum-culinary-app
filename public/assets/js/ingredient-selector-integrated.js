/**
 * Integrated Ingredient Selector Component
 * Provides ingredient selection with vendor pricing, unit conversion, and costing
 * Available across recipes, prep lists, and menu items
 */

class IngredientSelectorIntegrated {
  constructor() {
    this.ingredients = [];
    this.prepRecipes = [];
    this.unitConverter = window.unitConverter;
    this.vendorComparator = window.vendorPriceComparator;
    this.initialized = false;
  }

  /**
   * Initialize and load ingredients
   */
  async init() {
    if (this.initialized) {
      return;
    }

    await this.loadIngredients();
    await this.loadPrepRecipes();
    this.initialized = true;
    console.log('✅ Integrated Ingredient Selector initialized');
  }

  /**
   * Load ingredients from database
   */
  async loadIngredients() {
    // Load from enhanced manager if available
    if (window.ingredientsManager) {
      this.ingredients = window.ingredientsManager.getAllIngredients();
    } else {
      // Fallback to direct localStorage
      this.ingredients = JSON.parse(
        localStorage.getItem('ingredients_database') ||
          localStorage.getItem('ingredients') ||
          '[]'
      );
    }

    console.log(
      `📦 Loaded ${this.ingredients.length} ingredients for selector`
    );
  }

  /**
   * Load prep recipes (bar/kitchen) for use as sub-recipe ingredients
   */
  async loadPrepRecipes() {
    const prepCategories = new Set([
      'prep-recipe',
      'prep',
      'bar-prep',
      'kitchen-prep',
    ]);
    let all = [];

    if (window.userDataManager) {
      all = window.userDataManager.loadData('recipes', { filterByProject: false });
    } else if (window.universalRecipeManager) {
      all = window.universalRecipeManager.getAllRecipes();
    } else {
      try {
        all = JSON.parse(localStorage.getItem('recipes') || '[]');
      } catch (_e) {
        all = [];
      }
    }

    const editingId = localStorage.getItem('editing_recipe_id');

    this.prepRecipes = all
      .filter(r => {
        if (!r || r.id === editingId) return false;
        const cat = (r.category || '').toLowerCase();
        const type = (r.recipeType || '').toLowerCase();
        return prepCategories.has(cat) || prepCategories.has(type);
      })
      .map(r => ({
        id: `prep:${r.id}`,
        recipeId: r.id,
        name: r.title || r.name || 'Prep recipe',
        category: 'Prep recipe',
        unit: r.defaultUnit || r.yieldUnit || 'oz',
        isPrepRecipe: true,
        bestPrice: null,
      }));

    console.log(
      `🧪 Loaded ${this.prepRecipes.length} prep recipes for ingredient picker`
    );
  }

  /**
   * Search raw ingredients + prep recipes
   */
  searchItems(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const fromIngredients = this.ingredients
      .filter(
        ing =>
          ing.name.toLowerCase().includes(q) ||
          (ing.category && ing.category.toLowerCase().includes(q)) ||
          (ing.subcategory && ing.subcategory.toLowerCase().includes(q))
      )
      .slice(0, 16);

    const fromPrep = this.prepRecipes
      .filter(
        ing =>
          ing.name.toLowerCase().includes(q) ||
          (ing.category && ing.category.toLowerCase().includes(q))
      )
      .slice(0, 8);

    return [...fromPrep, ...fromIngredients];
  }

  /**
   * Create ingredient selector HTML
   * @param {Object} options - Configuration options
   */
  createSelector(options = {}) {
    const {
      id = `ingredient-select-${Date.now()}`,
      name = 'ingredient',
      placeholder = 'Search or select ingredient...',
      onSelect = null,
      showVendorInfo = true,
      showPrice = true,
      classNames = ''
    } = options;

    const container = document.createElement('div');
    container.className = `ingredient-selector-container ${classNames}`;
    container.innerHTML = `
            <div class="ingredient-selector-wrapper">
                <input 
                    type="text" 
                    id="${id}-input" 
                    class="ingredient-search-input"
                    placeholder="${placeholder}"
                    autocomplete="off"
                />
                <div id="${id}-dropdown" class="ingredient-dropdown hidden"></div>
                <input type="hidden" id="${id}-id" name="${name}_id" />
                <input type="hidden" id="${id}-name" name="${name}_name" />
                <input type="hidden" id="${id}-base-unit" name="${name}_base_unit" />
                <input type="hidden" id="${id}-best-price" name="${name}_best_price" />
                <input type="hidden" id="${id}-kind" name="${name}_kind" value="ingredient" />
            </div>
            <div id="${id}-info" class="ingredient-info hidden"></div>
        `;

    // Setup search functionality
    this.setupSearch(id, onSelect, showVendorInfo, showPrice);

    return container;
  }

  /**
   * Setup search and selection functionality
   */
  setupSearch(id, onSelect, showVendorInfo, showPrice) {
    const input = document.getElementById(`${id}-input`);
    const dropdown = document.getElementById(`${id}-dropdown`);
    const hiddenId = document.getElementById(`${id}-id`);
    const hiddenName = document.getElementById(`${id}-name`);
    const hiddenUnit = document.getElementById(`${id}-base-unit`);
    const hiddenPrice = document.getElementById(`${id}-best-price`);
    const hiddenKind = document.getElementById(`${id}-kind`);
    const info = document.getElementById(`${id}-info`);

    // Search input handler
    input.addEventListener('input', e => {
      const query = e.target.value.toLowerCase().trim();

      if (query.length < 1) {
        dropdown.classList.add('hidden');
        return;
      }

      const filteredIngredients = this.searchItems(query).slice(0, 24);

      this.renderDropdown(dropdown, filteredIngredients, ingredient => {
        this.selectIngredient(
          ingredient,
          id,
          input,
          dropdown,
          hiddenId,
          hiddenName,
          hiddenUnit,
          hiddenPrice,
          hiddenKind,
          info,
          showVendorInfo,
          showPrice,
          onSelect
        );
      });
    });

    // Focus handler
    input.addEventListener('focus', () => {
      if (input.value.length >= 1) {
        const filteredIngredients = this.searchItems(input.value).slice(0, 24);
        this.renderDropdown(dropdown, filteredIngredients, ingredient => {
          this.selectIngredient(
            ingredient,
            id,
            input,
            dropdown,
            hiddenId,
            hiddenName,
            hiddenUnit,
            hiddenPrice,
            hiddenKind,
            info,
            showVendorInfo,
            showPrice,
            onSelect
          );
        });
      }
    });

    // Click outside to close
    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  /**
   * Render dropdown with ingredients
   */
  renderDropdown(dropdown, ingredients, onSelect) {
    if (ingredients.length === 0) {
      dropdown.innerHTML =
        '<div class="dropdown-item">No ingredients found</div>';
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = ingredients
      .map(ing => {
        const bestPrice = ing.bestPrice || {};
        const vendorCount = ing.vendorPrices?.length || 0;
        const isBuiltIn = /^ing_\d+$/.test(ing.id);
        const isPrep = !!ing.isPrepRecipe;

        return `
                <div class="dropdown-item ingredient-item" data-id="${ing.id}">
                    <div class="ingredient-item-name">
                        ${ing.name}
                        ${
                          isPrep
                            ? '<span class="badge-prep-recipe">🧪 Prep</span>'
                            : isBuiltIn
                              ? '<span class="badge-builtin">📦 Built-in</span>'
                              : '<span class="badge-custom">➕ My Product</span>'
                        }
                    </div>
                    <div class="ingredient-item-meta">
                        <span class="ingredient-category">${ing.category || 'Uncategorized'}</span>
                        ${
                          bestPrice.price
                            ? `
                            <span class="ingredient-price">$${bestPrice.price.toFixed(2)}/${bestPrice.unit}</span>
                        `
                            : ''
                        }
                        ${vendorCount > 0 ? `<span class="vendor-count">${vendorCount} vendor${vendorCount !== 1 ? 's' : ''}</span>` : ''}
                    </div>
                </div>
            `;
      })
      .join('');

    // Add click handlers
    dropdown.querySelectorAll('.ingredient-item').forEach(item => {
      item.addEventListener('click', () => {
        const ingredientId = item.dataset.id;
        const ingredient =
          this.ingredients.find(ing => ing.id === ingredientId) ||
          this.prepRecipes.find(ing => ing.id === ingredientId);
        if (ingredient) {
          onSelect(ingredient);
        }
      });
    });

    dropdown.classList.remove('hidden');
  }

  /**
   * Handle ingredient selection
   */
  selectIngredient(
    ingredient,
    id,
    input,
    dropdown,
    hiddenId,
    hiddenName,
    hiddenUnit,
    hiddenPrice,
    hiddenKind,
    info,
    showVendorInfo,
    showPrice,
    onSelect
  ) {
    const isPrep = !!ingredient.isPrepRecipe;

    // Update hidden fields
    hiddenId.value = ingredient.id;
    hiddenName.value = ingredient.name;
    hiddenUnit.value = ingredient.unit || ingredient.default_unit || (isPrep ? 'oz' : 'g');
    if (hiddenKind) {
      hiddenKind.value = isPrep ? 'prep-recipe' : 'ingredient';
    }

    // Get best price
    const bestPrice = ingredient.bestPrice || {
      price: ingredient.cost || 0,
      unit: ingredient.unit || 'g',
      vendor: ingredient.supplier || 'Default'
    };

    hiddenPrice.value = bestPrice.normalizedPrice || bestPrice.price || 0;

    // Update input display
    input.value = ingredient.name;

    // Hide dropdown
    dropdown.classList.add('hidden');

    // Show info panel
    if (isPrep) {
      info.innerHTML = `
        <div class="ingredient-info-content">
          <div class="info-row">
            <span class="info-label">Type:</span>
            <span class="info-value">Prep recipe (linked sub-recipe)</span>
          </div>
        </div>`;
      info.classList.remove('hidden');
    } else if (showVendorInfo || showPrice) {
      this.renderInfo(ingredient, info, showVendorInfo, showPrice);
      info.classList.remove('hidden');
    } else {
      info.classList.add('hidden');
    }

    // Callback
    if (onSelect) {
      onSelect(ingredient);
    }
  }

  /**
   * Render ingredient info panel
   */
  renderInfo(ingredient, info, showVendorInfo, showPrice) {
    const bestPrice = ingredient.bestPrice || {};
    const vendorCount = ingredient.vendorPrices?.length || 0;

    let html = `<div class="ingredient-info-content">`;

    if (showPrice && bestPrice.price) {
      html += `
                <div class="info-row">
                    <span class="info-label">Best Price:</span>
                    <span class="info-value">$${bestPrice.price.toFixed(2)}/${bestPrice.unit}</span>
                    ${bestPrice.vendor ? `<span class="info-vendor">from ${bestPrice.vendor}</span>` : ''}
                </div>
            `;
    }

    html += `
            <div class="info-row">
                <span class="info-label">Base Unit:</span>
                <span class="info-value">${ingredient.unit || 'g'}</span>
            </div>
        `;

    if (showVendorInfo && vendorCount > 0) {
      html += `
                <div class="info-row">
                    <span class="info-label">Vendors:</span>
                    <span class="info-value">${vendorCount} available</span>
                </div>
            `;
    }

    if (ingredient.casePricing) {
      html += `
                <div class="info-row">
                    <span class="info-label">Case Pricing:</span>
                    <span class="info-value">
                        $${ingredient.casePricing.pricePerCase.toFixed(2)} / 
                        ${ingredient.casePricing.caseSize} ${ingredient.casePricing.caseUnit}
                    </span>
                </div>
            `;
    }

    html += `</div>`;
    info.innerHTML = html;
  }

  /**
   * Create quantity and unit selector
   */
  createQuantityUnitSelector(options = {}) {
    const {
      id = `qty-unit-${Date.now()}`,
      name = 'ingredient',
      defaultValue = 1,
      defaultUnit = 'g',
      ingredient = null,
      onUnitChange = null
    } = options;

    const container = document.createElement('div');
    container.className = 'quantity-unit-selector';

    // Get available units based on ingredient
    const availableUnits = ingredient
      ? this.getAvailableUnits(ingredient)
      : this.getAllUnits();

    container.innerHTML = `
            <input 
                type="number" 
                id="${id}-qty" 
                name="${name}_quantity"
                class="quantity-input"
                value="${defaultValue}"
                step="0.01"
                min="0"
            />
            <select 
                id="${id}-unit" 
                name="${name}_unit"
                class="unit-select"
            >
                ${availableUnits
                  .map(
                    unit => `
                    <option value="${unit.value}" ${unit.value === defaultUnit ? 'selected' : ''}>
                        ${unit.label}
                    </option>
                `
                  )
                  .join('')}
            </select>
        `;

    // Add unit change handler
    if (onUnitChange) {
      const unitSelect = container.querySelector(`#${id}-unit`);
      unitSelect.addEventListener('change', () => {
        onUnitChange(unitSelect.value);
      });
    }

    return container;
  }

  /**
   * Get available units for an ingredient
   */
  getAvailableUnits(ingredient) {
    const baseUnit = ingredient.unit || ingredient.default_unit || 'g';
    const category = this.unitConverter.getUnitCategory(baseUnit);

    let units = [];

    if (category === 'weight') {
      units = [
        { value: 'g', label: 'g' },
        { value: 'kg', label: 'kg' },
        { value: 'oz', label: 'oz' },
        { value: 'lb', label: 'lb' }
      ];
    } else if (category === 'volume') {
      units = [
        { value: 'ml', label: 'ml' },
        { value: 'l', label: 'L' },
        { value: 'fl oz', label: 'fl oz' },
        { value: 'cup', label: 'cup' },
        { value: 'qt', label: 'qt' },
        { value: 'gal', label: 'gal' }
      ];
    } else {
      units = [
        { value: 'piece', label: 'piece' },
        { value: 'each', label: 'each' },
        { value: 'bunch', label: 'bunch' }
      ];
    }

    return units;
  }

  /**
   * Get all available units
   */
  getAllUnits() {
    return [
      { value: 'g', label: 'g' },
      { value: 'kg', label: 'kg' },
      { value: 'oz', label: 'oz' },
      { value: 'lb', label: 'lb' },
      { value: 'ml', label: 'ml' },
      { value: 'l', label: 'L' },
      { value: 'fl oz', label: 'fl oz' },
      { value: 'cup', label: 'cup' },
      { value: 'piece', label: 'piece' },
      { value: 'each', label: 'each' }
    ];
  }

  /**
   * Calculate cost for recipe ingredient
   */
  calculateIngredientCost(ingredient, quantity, unit) {
    if (!this.vendorComparator) {
      return null;
    }

    return (
      this.vendorComparator.vendorComparator?.calculateIngredientCost(
        ingredient,
        quantity,
        unit
      ) ||
      this.unitConverter.calculateIngredientCost(ingredient, quantity, unit)
    );
  }

  /**
   * Get ingredient by ID
   */
  getIngredientById(id) {
    return this.ingredients.find(ing => ing.id === id);
  }

  /**
   * Get ingredient by name (fuzzy match)
   */
  getIngredientByName(name) {
    const normalized = name.toLowerCase().trim();
    return this.ingredients.find(
      ing =>
        ing.name.toLowerCase() === normalized ||
        ing.name.toLowerCase().includes(normalized)
    );
  }

  /**
   * Refresh ingredients list
   */
  async refresh() {
    await this.loadIngredients();
    await this.loadPrepRecipes();
  }
}

// Create global instance
window.ingredientSelector = new IngredientSelectorIntegrated();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ingredientSelector.init();
  });
} else {
  window.ingredientSelector.init();
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    .ingredient-selector-container {
        position: relative;
        width: 100%;
    }

    .ingredient-selector-wrapper {
        position: relative;
    }

    .ingredient-search-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #cbd5e1;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    .ingredient-search-input:focus {
        outline: none;
        border-color: #5B9BAD;
    }

    .ingredient-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 2px solid #cbd5e1;
        border-radius: 8px;
        margin-top: 4px;
        max-height: 400px;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 1000;
    }

    .ingredient-dropdown.hidden {
        display: none;
    }

    .dropdown-item {
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.2s;
    }

    .dropdown-item:hover {
        background: #f8fafc;
    }

    .dropdown-item:last-child {
        border-bottom: none;
    }

    .ingredient-item-name {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .badge-builtin,
    .badge-custom {
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
    }

    .badge-builtin {
        background: #667eea;
        color: white;
    }

    .badge-custom {
        background: #10b981;
        color: white;
    }

    .badge-prep-recipe {
        background: #0d9488;
        color: white;
    }

    .ingredient-item-meta {
        display: flex;
        gap: 12px;
        font-size: 0.875rem;
        color: #64748b;
    }

    .ingredient-price {
        color: #10b981;
        font-weight: 600;
    }

    .vendor-count {
        color: #5B9BAD;
    }

    .ingredient-info {
        margin-top: 12px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid #5B9BAD;
    }

    .ingredient-info.hidden {
        display: none;
    }

    .ingredient-info-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .info-row {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .info-label {
        font-weight: 600;
        color: #475569;
        min-width: 100px;
    }

    .info-value {
        color: #1e293b;
    }

    .info-vendor {
        color: #64748b;
        font-size: 0.875rem;
    }

    .quantity-unit-selector {
        display: flex;
        gap: 8px;
    }

    .quantity-input {
        flex: 1;
        padding: 12px;
        border: 2px solid #cbd5e1;
        border-radius: 8px;
        font-size: 1rem;
    }

    .unit-select {
        padding: 12px;
        border: 2px solid #cbd5e1;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
        min-width: 100px;
    }
`;

document.head.appendChild(style);

console.log('📦 Integrated Ingredient Selector loaded');
