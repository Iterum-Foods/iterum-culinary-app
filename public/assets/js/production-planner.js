/**
 * Production Planning System
 * Scale recipes, generate prep lists, organize tasks, manage timelines
 */

class ProductionPlanner {
  constructor() {
    this.plansKey = 'production_plans';
    this.init();
  }

  init() {
    console.log('📋 Production Planner initialized');
  }

  /**
   * Scale a recipe
   */
  scaleRecipe(recipe, targetServings) {
    const scaleFactor = targetServings / (recipe.servings || 1);
    
    return {
      ...recipe,
      originalServings: recipe.servings,
      servings: targetServings,
      scaleFactor: scaleFactor,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        originalQuantity: ing.quantity,
        quantity: ing.quantity * scaleFactor,
        scaledAmount: `${(ing.quantity * scaleFactor).toFixed(2)} ${ing.unit}`
      })),
      prepTime: Math.ceil(recipe.prepTime * Math.sqrt(scaleFactor)), // Scales less than linear
      cookTime: Math.ceil(recipe.cookTime * Math.sqrt(scaleFactor)),
      totalTime: Math.ceil((recipe.prepTime + recipe.cookTime) * Math.sqrt(scaleFactor))
    };
  }

  /**
   * Create production plan
   */
  createProductionPlan(planData) {
    const plan = {
      id: `plan_${Date.now()}`,
      name: planData.name || 'Untitled Plan',
      eventDate: planData.eventDate,
      servings: planData.servings || 0,
      recipes: planData.recipes || [],
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: this.getCurrentUserId()
    };

    // Scale all recipes
    plan.scaledRecipes = plan.recipes.map(recipeRef => {
      const recipe = this.getRecipeById(recipeRef.recipeId);
      if (recipe) {
        return this.scaleRecipe(recipe, recipeRef.servings);
      }
      return null;
    }).filter(Boolean);

    // Generate shopping list
    plan.shoppingList = this.generateShoppingList(plan.scaledRecipes);

    // Generate prep list
    plan.prepList = this.generatePrepList(plan.scaledRecipes, planData.eventDate);

    // Calculate timeline
    plan.timeline = this.generateTimeline(plan.scaledRecipes, planData.eventDate);

    // Save plan
    this.savePlan(plan);

    return plan;
  }

  /**
   * Generate consolidated shopping list
   */
  generateShoppingList(scaledRecipes) {
    const ingredientMap = {};

    // Consolidate ingredients from all recipes
    scaledRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const key = `${ing.name}_${ing.unit}`;
        
        if (!ingredientMap[key]) {
          ingredientMap[key] = {
            name: ing.name,
            totalQuantity: 0,
            unit: ing.unit,
            recipes: []
          };
        }

        ingredientMap[key].totalQuantity += ing.quantity;
        ingredientMap[key].recipes.push({
          recipeName: recipe.name || recipe.title,
          quantity: ing.quantity
        });
      });
    });

    // Convert to array and sort
    return Object.values(ingredientMap)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(item => ({
        ...item,
        totalQuantity: Math.ceil(item.totalQuantity * 100) / 100, // Round up to 2 decimals
        displayAmount: `${Math.ceil(item.totalQuantity * 100) / 100} ${item.unit}`
      }));
  }

  /**
   * Generate prep list with tasks
   */
  generatePrepList(scaledRecipes, eventDate) {
    const tasks = [];

    scaledRecipes.forEach((recipe, recipeIndex) => {
      // Add main recipe prep task
      tasks.push({
        id: `prep_${Date.now()}_${recipeIndex}`,
        recipeName: recipe.name || recipe.title,
        taskName: `Prepare ${recipe.name || recipe.title}`,
        servings: recipe.servings,
        station: this.getStationForRecipe(recipe),
        estimatedTime: recipe.prepTime || 30,
        priority: this.calculatePriority(recipe, eventDate),
        ingredients: recipe.ingredients,
        instructions: recipe.instructions || [],
        completed: false,
        assignedTo: null
      });

      // Break down into sub-tasks if recipe has steps
      if (recipe.instructions && recipe.instructions.length > 0) {
        recipe.instructions.forEach((instruction, stepIndex) => {
          if (this.isSignificantStep(instruction)) {
            tasks.push({
              id: `prep_${Date.now()}_${recipeIndex}_${stepIndex}`,
              recipeName: recipe.name || recipe.title,
              taskName: this.extractTaskName(instruction),
              servings: recipe.servings,
              station: this.getStationForRecipe(recipe),
              estimatedTime: Math.ceil(recipe.prepTime / recipe.instructions.length),
              priority: this.calculatePriority(recipe, eventDate),
              step: stepIndex + 1,
              instruction: instruction,
              completed: false,
              assignedTo: null
            });
          }
        });
      }
    });

    return tasks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate timeline
   */
  generateTimeline(scaledRecipes, eventDate) {
    const eventTime = new Date(eventDate);
    const timeline = [];

    scaledRecipes.forEach(recipe => {
      const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
      const startTime = new Date(eventTime.getTime() - totalTime * 60000); // Convert minutes to ms

      timeline.push({
        recipeName: recipe.name || recipe.title,
        startTime: startTime.toISOString(),
        prepStart: startTime,
        prepEnd: new Date(startTime.getTime() + (recipe.prepTime || 0) * 60000),
        cookStart: new Date(startTime.getTime() + (recipe.prepTime || 0) * 60000),
        cookEnd: eventTime,
        totalMinutes: totalTime,
        servings: recipe.servings
      });
    });

    return timeline.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }

  /**
   * Helper: Get station for recipe
   */
  getStationForRecipe(recipe) {
    const category = (recipe.category || '').toLowerCase();
    
    if (category.includes('dessert') || category.includes('baking')) return 'Pastry';
    if (category.includes('salad') || category.includes('cold')) return 'Garde Manger';
    if (category.includes('grill') || category.includes('meat')) return 'Grill';
    if (category.includes('sauce') || category.includes('soup')) return 'Sauté';
    
    return 'Hot Line';
  }

  /**
   * Helper: Calculate priority
   */
  calculatePriority(recipe, eventDate) {
    const hoursUntilEvent = (new Date(eventDate) - new Date()) / (1000 * 60 * 60);
    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    
    // Higher priority if less time until event and longer prep time
    return Math.round((totalTime / hoursUntilEvent) * 100);
  }

  /**
   * Helper: Check if step is significant
   */
  isSignificantStep(instruction) {
    const significantWords = ['chop', 'dice', 'mince', 'sauté', 'roast', 'boil', 'mix', 'prepare', 'marinate'];
    const lowerInstruction = instruction.toLowerCase();
    return significantWords.some(word => lowerInstruction.includes(word));
  }

  /**
   * Helper: Extract task name from instruction
   */
  extractTaskName(instruction) {
    // Take first sentence or up to 50 chars
    const firstSentence = instruction.split('.')[0];
    return firstSentence.length > 50 ? 
      firstSentence.substring(0, 47) + '...' : 
      firstSentence;
  }

  /**
   * Save production plan
   */
  savePlan(plan) {
    const plans = this.getPlans();
    const existingIndex = plans.findIndex(p => p.id === plan.id);

    plan.updatedAt = new Date().toISOString();

    if (existingIndex >= 0) {
      plans[existingIndex] = plan;
    } else {
      plans.push(plan);
    }

    localStorage.setItem(this.plansKey, JSON.stringify(plans));
    
    // Track analytics
    if (window.analyticsTracker) {
      window.analyticsTracker.trackCustomEvent('production_plan_created', {
        recipes: plan.scaledRecipes.length,
        servings: plan.servings
      });
    }

    return plan;
  }

  /**
   * Get all plans
   */
  getPlans() {
    return JSON.parse(localStorage.getItem(this.plansKey) || '[]');
  }

  /**
   * Get plan by ID
   */
  getPlanById(planId) {
    const plans = this.getPlans();
    return plans.find(p => p.id === planId);
  }

  /**
   * Delete plan
   */
  deletePlan(planId) {
    const plans = this.getPlans();
    const filtered = plans.filter(p => p.id !== planId);
    localStorage.setItem(this.plansKey, JSON.stringify(filtered));
  }

  /**
   * Execute production plan (deduct from inventory)
   */
  executePlan(planId) {
    const plan = this.getPlanById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    if (!window.inventoryManager) {
      console.warn('Inventory manager not available');
      return;
    }

    // Deduct ingredients from inventory for each recipe
    const transactions = [];
    plan.scaledRecipes.forEach(recipe => {
      try {
        const trans = window.inventoryManager.deductForRecipe(
          recipe.id,
          recipe.name || recipe.title,
          recipe.ingredients,
          1 // Already scaled
        );
        transactions.push(...trans);
      } catch (error) {
        console.error(`Error deducting for ${recipe.name}:`, error);
      }
    });

    // Update plan status
    plan.status = 'executed';
    plan.executedAt = new Date().toISOString();
    this.savePlan(plan);

    return {
      plan: plan,
      transactions: transactions
    };
  }

  /**
   * Get recipe by ID (from localStorage)
   */
  getRecipeById(recipeId) {
    const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
    return recipes.find(r => r.id === recipeId);
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    if (window.authManager?.currentUser) {
      return window.authManager.currentUser.userId;
    }
    return 'guest';
  }

  /**
   * Export plan to PDF-friendly format
   */
  exportPlanToPrint(planId) {
    const plan = this.getPlanById(planId);
    if (!plan) return null;

    // Generate printable HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Production Plan: ${plan.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #667eea; }
          h2 { color: #764ba2; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #667eea; color: white; }
          .checkbox { width: 20px; height: 20px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📋 Production Plan: ${plan.name}</h1>
        <p><strong>Event Date:</strong> ${new Date(plan.eventDate).toLocaleString()}</p>
        <p><strong>Total Servings:</strong> ${plan.servings}</p>
        <p><strong>Recipes:</strong> ${plan.scaledRecipes.length}</p>

        <h2>📝 Shopping List</h2>
        <table>
          <thead>
            <tr>
              <th>☐</th>
              <th>Ingredient</th>
              <th>Amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${plan.shoppingList.map(item => `
              <tr>
                <td class="checkbox">☐</td>
                <td>${item.name}</td>
                <td>${item.displayAmount}</td>
                <td>${item.recipes.map(r => r.recipeName).join(', ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>👨‍🍳 Prep List</h2>
        <table>
          <thead>
            <tr>
              <th>☐</th>
              <th>Task</th>
              <th>Recipe</th>
              <th>Station</th>
              <th>Est. Time</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            ${plan.prepList.map(task => `
              <tr>
                <td class="checkbox">☐</td>
                <td>${task.taskName}</td>
                <td>${task.recipeName}</td>
                <td>${task.station}</td>
                <td>${task.estimatedTime} min</td>
                <td>_________</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>⏰ Timeline</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Recipe</th>
              <th>Action</th>
              <th>Servings</th>
            </tr>
          </thead>
          <tbody>
            ${plan.timeline.map(item => `
              <tr>
                <td>${new Date(item.startTime).toLocaleTimeString()}</td>
                <td>${item.recipeName}</td>
                <td>Start Prep</td>
                <td>${item.servings}</td>
              </tr>
              <tr>
                <td>${item.cookStart.toLocaleTimeString()}</td>
                <td>${item.recipeName}</td>
                <td>Start Cooking</td>
                <td>${item.servings}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <button class="no-print" onclick="window.print()">🖨️ Print</button>
      </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// Initialize global instance
window.productionPlanner = new ProductionPlanner();

console.log('📋 Production Planner loaded');

