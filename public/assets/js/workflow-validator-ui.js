/**
 * Workflow Validator UI
 * Provides UI components for ingredient workflow validation
 */

class WorkflowValidatorUI {
  /**
   * Show validation report in modal
   */
  static showValidationReport() {
    if (!window.IngredientValidator) {
      alert('Validator not available');
      return;
    }

    const report = window.IngredientValidator.generateReport();
    
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
    `;

    const statusColor = report.overall.allValid ? '#10b981' : '#f59e0b';
    const statusIcon = report.overall.allValid ? '✅' : '⚠️';

    modal.innerHTML = `
      <div style="background: white; border-radius: 16px; padding: 32px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto;">
        <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 8px;">
          ${statusIcon} Workflow Validation Report
        </h2>
        <p style="color: #64748b; margin-bottom: 24px;">
          Generated: ${new Date(report.timestamp).toLocaleString()}
        </p>

        <!-- Overall Status -->
        <div style="background: ${statusColor}15; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 2px solid ${statusColor}40;">
          <div style="font-size: 20px; font-weight: 700; color: ${statusColor}; margin-bottom: 8px;">
            ${report.overall.allValid ? 'All Systems Valid' : 'Issues Found'}
          </div>
          <div style="color: #64748b; font-size: 0.875rem;">
            ${report.overall.allValid 
              ? 'All ingredients, recipes, and inventory items are properly linked.' 
              : 'Some references need attention. See details below.'}
          </div>
        </div>

        <!-- Ingredients -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">📦 Ingredients</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${report.ingredients.total}</div>
              <div style="font-size: 0.875rem; color: #64748b;">Total</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #10b981;">${report.ingredients.valid}</div>
              <div style="font-size: 0.875rem; color: #64748b;">Valid IDs</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${report.ingredients.invalid}</div>
              <div style="font-size: 0.875rem; color: #64748b;">Invalid IDs</div>
            </div>
          </div>
          ${Object.keys(report.ingredients.stats).length > 0 ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 8px;">By Source:</div>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                ${Object.entries(report.ingredients.stats).map(([source, count]) => `
                  <div style="padding: 6px 12px; background: white; border-radius: 6px; font-size: 0.75rem;">
                    ${source}: ${count}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Recipes -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">📝 Recipes</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${report.recipes.total}</div>
              <div style="font-size: 0.875rem; color: #64748b;">Total</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #10b981;">${report.recipes.allValid}</div>
              <div style="font-size: 0.875rem; color: #64748b;">All Valid</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${report.recipes.hasIssues}</div>
              <div style="font-size: 0.875rem; color: #64748b;">Has Issues</div>
            </div>
          </div>
        </div>

        <!-- Inventory -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">📦 Inventory</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${report.inventory.total}</div>
              <div style="font-size: 0.875rem; color: #64748b;">Total</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #10b981;">${report.inventory.valid}</div>
              <div style="font-size: 0.875rem; color: #64748b;">Valid</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${report.inventory.invalid}</div>
              <div style="font-size: 0.875rem; color: #64748b;">Invalid</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${report.inventory.missing}</div>
              <div style="font-size: 0.875rem; color: #64748b;">Missing ID</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 12px;">
          <button onclick="this.closest('div[style*=fixed]').remove()" 
                  style="flex: 1; padding: 14px; background: #f1f5f9; color: #64748b; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            Close
          </button>
          ${!report.overall.allValid ? `
            <button onclick="WorkflowValidatorUI.attemptAutoFix()" 
                    style="flex: 1; padding: 14px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              🔧 Attempt Auto-Fix
            </button>
          ` : ''}
        </div>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    document.body.appendChild(modal);
  }

  /**
   * Attempt to auto-fix orphaned references
   */
  static attemptAutoFix() {
    if (!window.IngredientValidator) {
      alert('Validator not available');
      return;
    }

    const recipes = JSON.parse(localStorage.getItem('iterum_recipes') || '[]');
    let fixed = 0;

    recipes.forEach(recipe => {
      if (recipe.ingredients) {
        recipe.ingredients.forEach(ing => {
          if (!ing.ingredientId || !window.IngredientValidator.validateIngredientId(ing.ingredientId)) {
            const match = window.IngredientValidator.fixOrphanedReference(ing);
            if (match) {
              ing.ingredientId = match.id;
              ing.name = match.name;
              fixed++;
            }
          }
        });
      }
    });

    // Save fixed recipes
    if (fixed > 0) {
      localStorage.setItem('iterum_recipes', JSON.stringify(recipes));
      alert(`✅ Fixed ${fixed} orphaned references in recipes!`);
      this.showValidationReport(); // Refresh report
    } else {
      alert('No fixable issues found. Some references may need manual attention.');
    }
  }
}

// Make available globally
window.WorkflowValidatorUI = WorkflowValidatorUI;

console.log('✅ Workflow Validator UI loaded');
