/**
 * Serving Ware Manager
 * Specialized manager for plates, silverware, and glassware inventory
 */

class ServingWareManager {
    constructor() {
        this.equipmentManager = null;
        this.init();
    }

    async init() {
        // Wait for equipment manager
        if (window.equipmentManager && window.equipmentManager.initialized) {
            this.equipmentManager = window.equipmentManager;
            console.log('✅ Serving Ware Manager initialized');
        } else {
            window.addEventListener('equipmentManagerReady', () => {
                this.equipmentManager = window.equipmentManager;
                console.log('✅ Serving Ware Manager initialized');
            });
        }
    }

    /**
     * Display serving ware inventory by category
     */
    displayServingWareInventory(category) {
        if (!this.equipmentManager) {
            console.error('Equipment Manager not initialized');
            return;
        }

        const inventory = this.equipmentManager.getServingWareInventory();
        const items = inventory[category] || [];

        const container = document.getElementById(`${category}-inventory`);
        if (!container) {
            console.error(`Container not found: ${category}-inventory`);
            return;
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #6B7280;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">📦</div>
                    <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 8px; color: #374151;">
                        No ${this.getCategoryName(category)} Yet
                    </h3>
                    <p>Add your first items to start tracking inventory</p>
                    <button onclick="openAddServingWare('${category}')" class="btn btn-primary" style="margin-top: 16px;">
                        ➕ Add ${this.getCategoryName(category)}
                    </button>
                </div>
            `;
            return;
        }

        const html = `
            <table class="w-full">
                <thead>
                    <tr style="background: linear-gradient(135deg, #2A2420 0%, #1F2A22 100%);">
                        <th style="padding: 12px; text-align: left; color: white; font-weight: 800;">Item</th>
                        <th style="padding: 12px; text-align: left; color: white; font-weight: 800;">Type</th>
                        <th style="padding: 12px; text-align: center; color: white; font-weight: 800;">Quantity</th>
                        <th style="padding: 12px; text-align: center; color: white; font-weight: 800;">Condition</th>
                        <th style="padding: 12px; text-align: center; color: white; font-weight: 800;">Linked Recipes</th>
                        <th style="padding: 12px; text-align: center; color: white; font-weight: 800;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px; font-weight: 600; color: #1F2937;">${item.name}</td>
                            <td style="padding: 12px; color: #4B5563;">${item.subcategory || 'N/A'}</td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge" style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600;">
                                    ${item.quantity}
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge" style="background: ${this.getConditionColor(item.condition)}; color: white; padding: 4px 12px; border-radius: 12px;">
                                    ${item.condition}
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <button onclick="servingWareManager.showLinkedRecipes('${item.id}')" class="btn-sm" style="padding: 6px 12px; background: #3b82f6; color: white; border-radius: 6px; border: none; cursor: pointer;">
                                    ${(item.linkedRecipes || []).length} Recipes
                                </button>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <div style="display: flex; gap: 8px; justify-content: center;">
                                    <button onclick="servingWareManager.editItem('${item.id}')" class="btn-sm" style="padding: 6px 12px; background: #f59e0b; color: white; border-radius: 6px; border: none; cursor: pointer;">
                                        ✏️
                                    </button>
                                    <button onclick="servingWareManager.updateQuantity('${item.id}')" class="btn-sm" style="padding: 6px 12px; background: #10b981; color: white; border-radius: 6px; border: none; cursor: pointer;">
                                        📊
                                    </button>
                                    <button onclick="servingWareManager.linkToRecipe('${item.id}')" class="btn-sm" style="padding: 6px 12px; background: #8b5cf6; color: white; border-radius: 6px; border: none; cursor: pointer;">
                                        🔗
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    /**
     * Get category display name
     */
    getCategoryName(category) {
        const names = {
            'plates': 'Plates & Dishes',
            'silverware': 'Silverware & Flatware',
            'glassware': 'Glassware & Barware'
        };
        return names[category] || category;
    }

    /**
     * Get condition color
     */
    getConditionColor(condition) {
        const colors = {
            'Excellent': '#10b981',
            'Good': '#3b82f6',
            'Fair': '#f59e0b',
            'Poor': '#ef4444',
            'Needs Replacement': '#dc2626'
        };
        return colors[condition] || '#6b7280';
    }

    /**
     * Show linked recipes modal
     */
    showLinkedRecipes(itemId) {
        const item = this.equipmentManager.equipment.find(e => e.id === itemId);
        if (!item) return;

        const linkedRecipes = item.linkedRecipes || [];

        const modal = `
            <div class="modal-backdrop" id="linked-recipes-modal" onclick="if(event.target===this) closeModal('linked-recipes-modal')">
                <div class="modal" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>Linked Recipes - ${item.name}</h2>
                    </div>
                    <div class="modal-body">
                        ${linkedRecipes.length === 0 ? `
                            <div style="text-align: center; padding: 40px; color: #6B7280;">
                                <div style="font-size: 3rem; margin-bottom: 16px;">📝</div>
                                <p>No recipes linked to this item yet</p>
                            </div>
                        ` : `
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${linkedRecipes.map(recipe => `
                                    <div style="padding: 16px; background: #F3F4F6; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600; color: #1F2937;">${recipe.recipeName}</div>
                                            <div style="font-size: 0.875rem; color: #6B7280; margin-top: 4px;">
                                                Linked: ${new Date(recipe.linkedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button onclick="servingWareManager.unlinkRecipe('${itemId}', '${recipe.recipeId}')" class="btn-sm" style="padding: 6px 12px; background: #ef4444; color: white; border-radius: 6px; border: none; cursor: pointer;">
                                            🗑️ Unlink
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <button onclick="closeModal('linked-recipes-modal')" class="btn btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);
    }

    /**
     * Link item to recipe
     */
    async linkToRecipe(itemId) {
        const item = this.equipmentManager.equipment.find(e => e.id === itemId);
        if (!item) return;

        // Get all recipes
        const recipes = window.universalRecipeManager ? window.universalRecipeManager.getAllRecipes() : [];

        if (recipes.length === 0) {
            alert('No recipes found. Create some recipes first!');
            return;
        }

        const modal = `
            <div class="modal-backdrop" id="link-recipe-modal" onclick="if(event.target===this) closeModal('link-recipe-modal')">
                <div class="modal" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>Link Recipe - ${item.name}</h2>
                    </div>
                    <div class="modal-body">
                        <label class="form-label">Select Recipe</label>
                        <select id="recipe-select" class="form-select" style="width: 100%; padding: 12px; border: 2px solid #5C4D39; border-radius: 8px;">
                            <option value="">Choose a recipe...</option>
                            ${recipes.map(recipe => `
                                <option value="${recipe.id}:${recipe.name}">${recipe.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button onclick="servingWareManager.confirmLinkRecipe('${itemId}')" class="btn btn-primary">Link Recipe</button>
                        <button onclick="closeModal('link-recipe-modal')" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);
    }

    /**
     * Confirm link recipe
     */
    confirmLinkRecipe(itemId) {
        const select = document.getElementById('recipe-select');
        const value = select.value;

        if (!value) {
            alert('Please select a recipe');
            return;
        }

        const [recipeId, recipeName] = value.split(':');
        this.equipmentManager.linkServingWareToRecipe(itemId, recipeId, recipeName);

        closeModal('link-recipe-modal');
        this.refreshCurrentTab();
    }

    /**
     * Unlink recipe
     */
    unlinkRecipe(itemId, recipeId) {
        if (confirm('Are you sure you want to unlink this recipe?')) {
            this.equipmentManager.unlinkServingWareFromRecipe(itemId, recipeId);
            closeModal('linked-recipes-modal');
            this.refreshCurrentTab();
        }
    }

    /**
     * Update quantity
     */
    updateQuantity(itemId) {
        const item = this.equipmentManager.equipment.find(e => e.id === itemId);
        if (!item) return;

        const newQuantity = prompt(`Update quantity for ${item.name}:\n\nCurrent: ${item.quantity}`, item.quantity);

        if (newQuantity === null) return;

        const quantity = parseInt(newQuantity);
        if (isNaN(quantity) || quantity < 0) {
            alert('Please enter a valid quantity');
            return;
        }

        this.equipmentManager.updateServingWareQuantity(itemId, quantity, 'Manual Count');
        this.refreshCurrentTab();
    }

    /**
     * Edit item
     */
    editItem(itemId) {
        // Redirect to equipment edit
        window.editEquipment(itemId);
    }

    /**
     * Refresh current tab
     */
    refreshCurrentTab() {
        const activeTab = document.querySelector('.equipment-tab:not(.hidden)');
        if (activeTab) {
            const category = activeTab.id.replace('tab-', '');
            if (['plates', 'silverware', 'glassware'].includes(category)) {
                this.displayServingWareInventory(category);
            }
        }
    }
}

// Helper function to close modals
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Initialize on page load
window.servingWareManager = new ServingWareManager();

