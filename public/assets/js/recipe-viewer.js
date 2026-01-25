/**
 * Enhanced Recipe Viewer
 * Beautiful modal for viewing recipe details
 */

class RecipeViewer {
    constructor() {
        this.currentRecipe = null;
    }

    viewRecipe(recipeId) {
        console.log(`👁️ Viewing recipe: ${recipeId}`);
        
        // Get recipe from universal recipe manager
        let recipe = null;
        if (window.universalRecipeManager) {
            recipe = window.universalRecipeManager.getRecipe(recipeId);
        }
        
        // Fallback to localStorage
        if (!recipe) {
            const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
            recipe = recipes.find(r => r.id === recipeId);
        }
        
        if (!recipe) {
            console.error('Recipe not found:', recipeId);
            alert('Recipe not found');
            return;
        }
        
        this.currentRecipe = recipe;
        this.showRecipeModal(recipe);
    }

    showRecipeModal(recipe) {
        // Create modal backdrop
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            padding: 20px;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        // Build ingredients list
        const ingredientsHTML = recipe.ingredients && recipe.ingredients.length > 0
            ? recipe.ingredients.map(ing => `
                <li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 500; color: #1e293b;">${ing.name || ing.ingredient || ing}</span>
                    <span style="color: #64748b; font-size: 0.9rem;">${ing.quantity || ''} ${ing.unit || ''}</span>
                </li>
            `).join('')
            : '<li style="color: #94a3b8; padding: 20px; text-align: center;">No ingredients listed</li>';

        // Build instructions
        const instructionsHTML = recipe.instructions && recipe.instructions.length > 0
            ? recipe.instructions.map((step, i) => `
                <div style="display: flex; gap: 15px; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #667eea;">
                    <div style="flex-shrink: 0; width: 32px; height: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">
                        ${i + 1}
                    </div>
                    <p style="margin: 0; line-height: 1.7; color: #1e293b; flex: 1;">${step.text || step}</p>
                </div>
            `).join('')
            : '<p style="color: #94a3b8; padding: 20px; text-align: center;">No instructions provided</p>';

        // Build tags
        const tagsHTML = recipe.tags && recipe.tags.length > 0
            ? recipe.tags.map(tag => `
                <span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 5px 12px; border-radius: 16px; font-size: 0.85rem; font-weight: 600; margin: 4px;">
                    ${tag}
                </span>
            `).join('')
            : '<span style="color: #94a3b8;">No tags</span>';

        // Build components section if available
        const componentsHTML = recipe.components && recipe.components.length > 0
            ? `
                <div style="padding: 25px; background: white; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                        <span>🧩</span> Components
                    </h3>
                    <div style="display: grid; gap: 15px;">
                        ${recipe.components.map(comp => `
                            <div style="padding: 15px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #10b981;">
                                <div style="font-weight: 700; color: #1e293b; margin-bottom: 8px;">${comp.name}</div>
                                <div style="color: #64748b; font-size: 0.9rem; line-height: 1.6;">${comp.description || comp.instructions || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `
            : '';

        // Build plating/presentation section
        const platingHTML = recipe.plating || recipe.presentation
            ? `
                <div style="padding: 25px; background: #f8fafc; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        <span>🎨</span> Plating & Presentation
                    </h3>
                    <p style="color: #1e293b; line-height: 1.8; margin: 0;">${recipe.plating || recipe.presentation}</p>
                </div>
            `
            : '';

        // Build photo section
        const photoHTML = recipe.photo
            ? `<img src="${recipe.photo}" style="width: 100%; height: 300px; object-fit: cover; cursor: pointer;" onclick="window.open('${recipe.photo}', '_blank')" title="Click to view full size">`
            : '';

        modal.innerHTML = `
            <div style="background: white; border-radius: 20px; max-width: 1000px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 30px 90px rgba(0,0,0,0.5);">
                
                <!-- Header with Photo -->
                <div style="position: relative; ${recipe.photo ? '' : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px;'}">
                    ${photoHTML}
                    <div style="${recipe.photo ? 'position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 30px;' : ''}">
                        <button onclick="this.closest('div[style*=fixed]').remove()" style="position: absolute; ${recipe.photo ? 'top: 15px; right: 15px; background: rgba(0,0,0,0.6);' : 'top: 20px; right: 20px; background: rgba(255,255,255,0.2);'} border: none; border-radius: 50%; width: 44px; height: 44px; font-size: 1.5rem; cursor: pointer; color: white; transition: all 0.2s; backdrop-filter: blur(10px); z-index: 10;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'">
                            ✕
                        </button>
                        <h2 style="font-size: 2.2rem; font-weight: 700; margin: 0 0 12px 0; color: white; ${recipe.photo ? 'text-shadow: 0 2px 10px rgba(0,0,0,0.5);' : ''}">${recipe.name || 'Untitled Recipe'}</h2>
                        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                            <span style="display: inline-block; background: ${recipe.photo ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)'}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; backdrop-filter: blur(10px);">
                                ${recipe.category || 'Uncategorized'}
                            </span>
                            <span style="display: inline-block; background: ${recipe.photo ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)'}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; backdrop-filter: blur(10px);">
                                ${recipe.difficulty || 'Medium'}
                            </span>
                            ${recipe.cuisine ? `
                                <span style="display: inline-block; background: ${recipe.photo ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)'}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; backdrop-filter: blur(10px);">
                                    ${recipe.cuisine}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div style="overflow-y: auto; flex: 1;">
                    
                    <!-- Description & Stats -->
                    <div style="padding: 25px; background: #f8fafc; border-bottom: 2px solid #f1f5f9;">
                        <p style="color: #1e293b; line-height: 1.8; font-size: 1.05rem; margin: 0 0 20px 0;">${recipe.description || 'No description provided.'}</p>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
                            ${recipe.prepTime ? `
                                <div style="text-align: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size: 1.8rem; font-weight: 700; color: #667eea; margin-bottom: 5px;">⏱️</div>
                                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">PREP TIME</div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-top: 3px;">${recipe.prepTime}</div>
                                </div>
                            ` : ''}
                            ${recipe.cookTime ? `
                                <div style="text-align: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size: 1.8rem; font-weight: 700; color: #ef4444; margin-bottom: 5px;">🔥</div>
                                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">COOK TIME</div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-top: 3px;">${recipe.cookTime}</div>
                                </div>
                            ` : ''}
                            ${recipe.servings ? `
                                <div style="text-align: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size: 1.8rem; font-weight: 700; color: #10b981; margin-bottom: 5px;">🍽️</div>
                                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">SERVINGS</div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-top: 3px;">${recipe.servings}</div>
                                </div>
                            ` : ''}
                            ${recipe.yield ? `
                                <div style="text-align: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size: 1.8rem; font-weight: 700; color: #f59e0b; margin-bottom: 5px;">📊</div>
                                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">YIELD</div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-top: 3px;">${recipe.yield}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Tags -->
                    ${recipe.tags && recipe.tags.length > 0 ? `
                        <div style="padding: 20px 25px; background: white; border-bottom: 2px solid #f1f5f9;">
                            <div style="line-height: 2;">
                                ${tagsHTML}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Components -->
                    ${componentsHTML}

                    <!-- Ingredients -->
                    <div style="padding: 25px; background: white; border-bottom: 2px solid #f1f5f9;">
                        <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                            <span>🥬</span> Ingredients
                        </h3>
                        <ul style="list-style: none; margin: 0; padding: 0;">
                            ${ingredientsHTML}
                        </ul>
                    </div>

                    <!-- Instructions -->
                    <div style="padding: 25px; background: #f8fafc; border-bottom: 2px solid #f1f5f9;">
                        <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                            <span>📝</span> Instructions
                        </h3>
                        <div>
                            ${instructionsHTML}
                        </div>
                    </div>

                    <!-- Plating -->
                    ${platingHTML}

                    <!-- Notes -->
                    ${recipe.notes ? `
                        <div style="padding: 25px; background: white; border-bottom: 2px solid #f1f5f9;">
                            <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                                <span>💡</span> Chef's Notes
                            </h3>
                            <p style="color: #1e293b; line-height: 1.8; margin: 0; font-style: italic; background: #fef3c7; padding: 15px; border-radius: 12px; border-left: 4px solid #f59e0b;">${recipe.notes}</p>
                        </div>
                    ` : ''}

                </div>

                <!-- Footer Actions -->
                <div style="padding: 20px 25px; background: white; border-top: 2px solid #e5e7eb; display: flex; gap: 12px; flex-wrap: wrap;">
                    <button onclick="window.recipeViewer.editRecipe('${recipe.id}')" style="flex: 1; min-width: 120px; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                        ✏️ Edit Recipe
                    </button>
                    <button onclick="window.recipeViewer.duplicateRecipe('${recipe.id}')" style="flex: 1; min-width: 120px; padding: 14px; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        📋 Duplicate
                    </button>
                    <button onclick="window.recipeViewer.printRecipe('${recipe.id}')" style="flex: 1; min-width: 120px; padding: 14px; background: #f59e0b; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                        🖨️ Print
                    </button>
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="padding: 14px 28px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">
                        Close
                    </button>
                </div>
            </div>
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }

    editRecipe(recipeId) {
        // Store recipe ID and navigate to editor
        localStorage.setItem('recipe_to_edit', recipeId);
        sessionStorage.setItem('recipe_to_edit', recipeId);
        window.location.href = `recipe-developer.html?edit=${recipeId}`;
    }

    duplicateRecipe(recipeId) {
        console.log(`📋 Duplicating recipe: ${recipeId}`);
        
        let recipe = null;
        if (window.universalRecipeManager) {
            recipe = window.universalRecipeManager.getRecipe(recipeId);
        } else {
            const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
            recipe = recipes.find(r => r.id === recipeId);
        }
        
        if (!recipe) {
            alert('Recipe not found');
            return;
        }
        
        // Create duplicate with new ID and modified name
        const duplicate = {
            ...recipe,
            id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${recipe.name} (Copy)`,
            dateAdded: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Save duplicate
        if (window.universalRecipeManager) {
            window.universalRecipeManager.saveRecipe(duplicate);
        } else {
            const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
            recipes.push(duplicate);
            localStorage.setItem('recipes', JSON.stringify(recipes));
        }
        
        // Close modal and reload
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => el.remove());
        alert('✅ Recipe duplicated successfully!');
        
        // Reload recipes if on library page
        if (typeof loadRecipes === 'function') {
            loadRecipes();
        }
    }

    printRecipe(recipeId) {
        console.log(`🖨️ Printing recipe: ${recipeId}`);
        
        let recipe = null;
        if (window.universalRecipeManager) {
            recipe = window.universalRecipeManager.getRecipe(recipeId);
        } else {
            const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
            recipe = recipes.find(r => r.id === recipeId);
        }
        
        if (!recipe) {
            alert('Recipe not found');
            return;
        }
        
        // Create print window
        const printWindow = window.open('', '_blank');
        
        const ingredientsHTML = recipe.ingredients && recipe.ingredients.length > 0
            ? recipe.ingredients.map(ing => `<li>${ing.name || ing.ingredient || ing} - ${ing.quantity || ''} ${ing.unit || ''}</li>`).join('')
            : '<li>No ingredients listed</li>';
        
        const instructionsHTML = recipe.instructions && recipe.instructions.length > 0
            ? recipe.instructions.map((step, i) => `<li><strong>Step ${i + 1}:</strong> ${step.text || step}</li>`).join('')
            : '<li>No instructions provided</li>';
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${recipe.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                    h1 { color: #1e293b; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
                    h2 { color: #667eea; margin-top: 30px; }
                    .meta { display: flex; gap: 20px; margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
                    .meta-item { flex: 1; }
                    .meta-label { font-size: 0.85rem; color: #64748b; font-weight: 600; }
                    .meta-value { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-top: 5px; }
                    ul { line-height: 1.8; }
                    li { margin-bottom: 10px; }
                    .description { font-size: 1.05rem; line-height: 1.7; margin: 20px 0; padding: 15px; background: #f8fafc; border-left: 4px solid #667eea; }
                    @media print {
                        body { margin: 0; padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <h1>${recipe.name}</h1>
                
                <div class="description">${recipe.description || ''}</div>
                
                <div class="meta">
                    ${recipe.prepTime ? `<div class="meta-item"><div class="meta-label">Prep Time</div><div class="meta-value">${recipe.prepTime}</div></div>` : ''}
                    ${recipe.cookTime ? `<div class="meta-item"><div class="meta-label">Cook Time</div><div class="meta-value">${recipe.cookTime}</div></div>` : ''}
                    ${recipe.servings ? `<div class="meta-item"><div class="meta-label">Servings</div><div class="meta-value">${recipe.servings}</div></div>` : ''}
                    ${recipe.difficulty ? `<div class="meta-item"><div class="meta-label">Difficulty</div><div class="meta-value">${recipe.difficulty}</div></div>` : ''}
                </div>
                
                <h2>🥬 Ingredients</h2>
                <ul>${ingredientsHTML}</ul>
                
                <h2>📝 Instructions</h2>
                <ol>${instructionsHTML}</ol>
                
                ${recipe.notes ? `<h2>💡 Chef's Notes</h2><p style="font-style: italic; background: #fef3c7; padding: 15px; border-radius: 8px;">${recipe.notes}</p>` : ''}
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #94a3b8; font-size: 0.9rem;">
                    Printed from Iterum Culinary App | ${new Date().toLocaleDateString()}
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Wait a bit then trigger print
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
}

// Initialize global instance
window.recipeViewer = new RecipeViewer();

// Make functions globally available for onclick handlers
window.viewRecipe = (id) => window.recipeViewer.viewRecipe(id);
window.editRecipe = (id) => window.recipeViewer.editRecipe(id);
window.duplicateRecipe = (id) => window.recipeViewer.duplicateRecipe(id);

