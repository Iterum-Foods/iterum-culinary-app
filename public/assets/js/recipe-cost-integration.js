/**
 * Recipe Cost Integration
 * Integrates the cost calculator into Recipe Developer and Library
 * @version 1.0.0
 */

(function() {
    'use strict';

    // Wait for cost calculator to load
    function waitForCostCalculator(callback) {
        if (window.costCalculator) {
            callback();
        } else {
            setTimeout(() => waitForCostCalculator(callback), 100);
        }
    }

    // Initialize cost integration when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCostIntegration);
    } else {
        initCostIntegration();
    }

    function initCostIntegration() {
        waitForCostCalculator(() => {
            console.log('💰 Initializing Cost Integration...');
            
            // Check what page we're on
            const path = window.location.pathname;
            
            if (path.includes('recipe-developer')) {
                initRecipeDeveloperCosts();
            } else if (path.includes('recipe-library')) {
                initRecipeLibraryCosts();
            } else if (path.includes('menu-builder')) {
                initMenuBuilderCosts();
            }
        });
    }

    /**
     * Initialize cost calculator for Recipe Developer
     */
    function initRecipeDeveloperCosts() {
        console.log('💰 Adding cost calculator to Recipe Developer');
        
        // Find the recipe canvas or main form area
        const recipeCanvas = document.querySelector('.recipe-canvas');
        if (!recipeCanvas) {
            console.warn('Recipe canvas not found');
            return;
        }

        // Create cost display section
        const costSection = document.createElement('div');
        costSection.id = 'recipe-cost-section';
        costSection.className = 'recipe-section';
        costSection.style.cssText = `
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        costSection.innerHTML = `
            <div class="recipe-section-title" style="color: #e2e8f0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">💰</span>
                    <span style="font-size: 18px; font-weight: 600;">Cost Analysis</span>
                </span>
                <button onclick="refreshRecipeCost()" class="btn btn-sm btn-secondary" style="background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; font-size: 12px; padding: 6px 12px;">
                    🔄 Refresh Costs
                </button>
            </div>
            <div id="cost-display-area">
                <div style="text-align: center; padding: 40px; color: #94a3b8;">
                    <div style="font-size: 48px; margin-bottom: 12px;">💰</div>
                    <div style="font-size: 16px; margin-bottom: 8px;">Add ingredients to see cost analysis</div>
                    <div style="font-size: 12px; opacity: 0.7;">Costs will update automatically as you add ingredients</div>
                </div>
            </div>
        `;

        // Insert after ingredients section or at a good position
        const ingredientsSection = Array.from(recipeCanvas.querySelectorAll('.recipe-section'))
            .find(section => section.textContent.includes('Ingredients') || section.textContent.includes('🥘'));
        
        if (ingredientsSection && ingredientsSection.nextSibling) {
            recipeCanvas.insertBefore(costSection, ingredientsSection.nextSibling);
        } else {
            // Insert before the save buttons
            const recipeHeader = recipeCanvas.querySelector('.recipe-header');
            if (recipeHeader && recipeHeader.nextSibling) {
                recipeCanvas.insertBefore(costSection, recipeHeader.nextSibling);
            } else {
                recipeCanvas.appendChild(costSection);
            }
        }

        // Make refreshRecipeCost available globally
        window.refreshRecipeCost = function() {
            const recipe = gatherRecipeData();
            if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
                displayRecipeCosts(recipe);
            } else {
                document.getElementById('cost-display-area').innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #94a3b8;">
                        <div style="font-size: 48px; margin-bottom: 12px;">💰</div>
                        <div style="font-size: 16px; margin-bottom: 8px;">Add ingredients to see cost analysis</div>
                        <div style="font-size: 12px; opacity: 0.7;">Costs will update automatically as you add ingredients</div>
                        <div style="font-size: 11px; opacity: 0.6; margin-top: 12px; padding: 12px; background: rgba(107, 142, 111, 0.1); border-radius: 8px; border: 1px solid rgba(107, 142, 111, 0.2);">
                            <strong>Phase 2:</strong> Add Waste/Trim % to ingredients for accurate cost calculation
                        </div>
                    </div>
                `;
            }
        };

        // Auto-refresh costs when ingredients change
        setupAutoRefresh();

        console.log('✅ Cost calculator added to Recipe Developer');
    }

    /**
     * Gather recipe data from the form
     */
    function gatherRecipeData() {
        const name = document.getElementById('recipe-name')?.value || 'Untitled Recipe';
        const servings = document.getElementById('servings')?.value || document.getElementById('yield')?.value || 4;
        const prepTime = document.getElementById('prep-time')?.value || '0 minutes';
        const cookTime = document.getElementById('cook-time')?.value || '0 minutes';
        
        // Get ingredients from the ingredients list
        const ingredientsList = document.getElementById('ingredients-list');
        const ingredients = [];
        
        if (ingredientsList) {
            const ingredientItems = ingredientsList.querySelectorAll('.ingredient-item');
            ingredientItems.forEach(item => {
                const nameElem = item.querySelector('[data-ingredient-name]') || item.querySelector('.ingredient-name');
                const quantityElem = item.querySelector('[data-ingredient-quantity]') || item.querySelector('.ingredient-quantity');
                const unitElem = item.querySelector('[data-ingredient-unit]') || item.querySelector('.ingredient-unit');
                
                if (nameElem && quantityElem) {
                    ingredients.push({
                        name: nameElem.textContent || nameElem.value,
                        quantity: parseFloat(quantityElem.textContent || quantityElem.value) || 1,
                        unit: unitElem ? (unitElem.textContent || unitElem.value) : 'unit'
                    });
                }
            });
        }

        return {
            name,
            servings,
            prepTime,
            cookTime,
            ingredients
        };
    }

    /**
     * Display recipe costs
     */
    function displayRecipeCosts(recipe) {
        const costData = window.costCalculator.calculateRecipeCost(recipe);
        const displayArea = document.getElementById('cost-display-area');
        
        if (displayArea) {
            let html = window.costCalculator.createCostSummaryHTML(costData);
            
            // Add detailed ingredient costs
            if (costData.ingredientCosts && costData.ingredientCosts.length > 0) {
                html += `
                    <div style="margin-top: 20px;">
                        <h4 style="color: #e2e8f0; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                            📋 Ingredient Cost Breakdown
                        </h4>
                        ${window.costCalculator.createIngredientCostsTableHTML(costData.ingredientCosts)}
                    </div>
                `;
            }
            
            displayArea.innerHTML = html;
        }
    }

    /**
     * Set up auto-refresh for costs when ingredients change
     */
    function setupAutoRefresh() {
        // Watch for changes to ingredients list
        const ingredientsList = document.getElementById('ingredients-list');
        if (ingredientsList) {
            const observer = new MutationObserver((mutations) => {
                // Debounce the refresh
                clearTimeout(window.costRefreshTimeout);
                window.costRefreshTimeout = setTimeout(() => {
                    if (window.refreshRecipeCost) {
                        window.refreshRecipeCost();
                    }
                }, 1000);
            });
            
            observer.observe(ingredientsList, {
                childList: true,
                subtree: true
            });
        }

        // Also watch form inputs
        const formInputs = ['recipe-name', 'servings', 'yield', 'prep-time', 'cook-time'];
        formInputs.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.addEventListener('change', () => {
                    if (window.refreshRecipeCost) {
                        window.refreshRecipeCost();
                    }
                });
            }
        });
    }

    /**
     * Initialize cost display for Recipe Library
     */
    function initRecipeLibraryCosts() {
        console.log('💰 Adding cost displays to Recipe Library');
        
        // Enhance recipe cards to show cost
        enhanceRecipeCards();
        
        // Enhance recipe viewer modal to show detailed costs
        enhanceRecipeViewer();
    }

    /**
     * Enhance recipe cards with cost badges
     */
    function enhanceRecipeCards() {
        const observer = new MutationObserver((mutations) => {
            document.querySelectorAll('.recipe-card:not([data-cost-added])').forEach(card => {
                card.setAttribute('data-cost-added', 'true');
                addCostToRecipeCard(card);
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Process existing cards
        document.querySelectorAll('.recipe-card').forEach(addCostToRecipeCard);
    }

    /**
     * Add cost display to a recipe card
     */
    function addCostToRecipeCard(card) {
        const recipeId = card.getAttribute('data-recipe-id');
        if (!recipeId) return;

        // Get recipe data
        const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        // Calculate cost
        const costData = window.costCalculator.calculateRecipeCost(recipe);

        // Create cost badge
        const costBadge = document.createElement('div');
        costBadge.className = 'cost-badge';
        costBadge.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            z-index: 10;
        `;
        costBadge.innerHTML = `$${costData.costPerServing}/serving`;
        
        card.style.position = 'relative';
        card.appendChild(costBadge);
    }

    /**
     * Enhance recipe viewer with detailed costs
     */
    function enhanceRecipeViewer() {
        // This will be called when a recipe modal is opened
        window.addCostToRecipeModal = function(recipeId) {
            const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe) return;

            const costData = window.costCalculator.calculateRecipeCost(recipe);
            const modal = document.querySelector('.recipe-modal') || document.querySelector('[role="dialog"]');
            
            if (modal) {
                const costSection = document.createElement('div');
                costSection.id = 'modal-cost-section';
                costSection.innerHTML = window.costCalculator.createCostSummaryHTML(costData);
                
                // Insert after recipe details
                const detailsSection = modal.querySelector('.recipe-details') || modal.querySelector('.modal-body');
                if (detailsSection) {
                    detailsSection.appendChild(costSection);
                }
            }
        };
    }

    /**
     * Initialize menu costing
     */
    function initMenuBuilderCosts() {
        console.log('💰 Adding menu costing to Menu Builder');
        
        // Add menu total cost display
        window.calculateMenuCost = function() {
            const menuItems = Array.from(document.querySelectorAll('.menu-item'));
            const recipes = [];
            
            menuItems.forEach(item => {
                const recipeId = item.getAttribute('data-recipe-id');
                if (recipeId) {
                    const allRecipes = JSON.parse(localStorage.getItem('recipes') || '[]');
                    const recipe = allRecipes.find(r => r.id === recipeId);
                    if (recipe) recipes.push(recipe);
                }
            });

            if (recipes.length > 0) {
                const menuCost = window.costCalculator.calculateMenuCost(recipes);
                displayMenuCost(menuCost);
            }
        };
    }

    /**
     * Display menu total cost
     */
    function displayMenuCost(menuCost) {
        let costDisplay = document.getElementById('menu-cost-display');
        
        if (!costDisplay) {
            costDisplay = document.createElement('div');
            costDisplay.id = 'menu-cost-display';
            costDisplay.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                border: 1px solid #334155;
                min-width: 250px;
                z-index: 1000;
            `;
            document.body.appendChild(costDisplay);
        }

        costDisplay.innerHTML = `
            <div style="color: #e2e8f0; font-size: 14px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                📊 Menu Cost Summary
            </div>
            <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #cbd5e1; font-size: 12px;">Total Items:</span>
                    <span style="color: #a855f7; font-weight: bold;">${menuCost.recipeCount}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #cbd5e1; font-size: 12px;">Total Servings:</span>
                    <span style="color: #3b82f6; font-weight: bold;">${menuCost.totalServings}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #334155;">
                    <span style="color: #e2e8f0; font-size: 13px; font-weight: 600;">Total Cost:</span>
                    <span style="color: #10b981; font-size: 18px; font-weight: bold;">$${menuCost.totalCost}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #cbd5e1; font-size: 11px;">Avg/Serving:</span>
                    <span style="color: #60a5fa; font-size: 14px; font-weight: bold;">$${menuCost.averageCostPerServing}</span>
                </div>
            </div>
        `;
    }

    console.log('💰 Recipe Cost Integration loaded');
})();

