/**
 * Canvas-Style Recipe Builder
 * Visual drag-and-drop interface for creating dishes
 */

class RecipeCanvasBuilder {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.ingredients = [];
        this.steps = [];
        this.platedIngredients = [];
        this.selectedIngredient = null;
        this.draggedElement = null;
        this.recipeData = {
            title: '',
            description: '',
            servings: 4,
            prepTime: 0,
            cookTime: 0,
            difficulty: 'medium',
            cuisine: '',
            tags: [],
            nutrition: {}
        };
        
        this.init();
    }

    init() {
        console.log('🎨 Recipe Canvas Builder initializing...');
        this.loadIngredients();
        this.setupEventListeners();
        this.setupCanvas();
        this.loadSavedRecipe();
    }

    loadIngredients() {
        // Load from localStorage or use default
        const saved = localStorage.getItem('ingredients_database');
        if (saved) {
            this.ingredients = JSON.parse(saved);
        } else {
            // Default ingredients for demo
            this.ingredients = [
                { id: '1', name: 'Chicken Breast', category: 'Proteins', unit: 'lb', icon: '🍗' },
                { id: '2', name: 'Olive Oil', category: 'Oils', unit: 'cup', icon: '🫒' },
                { id: '3', name: 'Garlic', category: 'Produce', unit: 'clove', icon: '🧄' },
                { id: '4', name: 'Tomatoes', category: 'Produce', unit: 'lb', icon: '🍅' },
                { id: '5', name: 'Basil', category: 'Herbs', unit: 'bunch', icon: '🌿' },
            ];
        }
        this.renderIngredientLibrary();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('ingredient-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterIngredients(e.target.value);
            });
        }

        // Canvas title
        const titleInput = document.querySelector('.canvas-title-input');
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                this.recipeData.title = e.target.value;
            });
        }

        // Add step button
        const addStepBtn = document.querySelector('.add-step-btn');
        if (addStepBtn) {
            addStepBtn.addEventListener('click', () => {
                this.addStep();
            });
        }

        // Save button
        const saveBtn = document.querySelector('.canvas-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveRecipe();
            });
        }

        // Drop zones
        const dishCanvas = document.querySelector('.dish-canvas');
        if (dishCanvas) {
            dishCanvas.addEventListener('dragover', (e) => {
                e.preventDefault();
                dishCanvas.classList.add('drag-over');
            });

            dishCanvas.addEventListener('dragleave', () => {
                dishCanvas.classList.remove('drag-over');
            });

            dishCanvas.addEventListener('drop', (e) => {
                e.preventDefault();
                dishCanvas.classList.remove('drag-over');
                this.handleDrop(e);
            });
        }
    }

    setupCanvas() {
        const canvasEl = document.querySelector('.dish-canvas');
        if (!canvasEl) return;

        // Create visual canvas for dish representation
        this.canvas = document.createElement('canvas');
        this.canvas.width = canvasEl.offsetWidth;
        this.canvas.height = 400;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.borderRadius = '20px';
        
        this.ctx = this.canvas.getContext('2d');
        canvasEl.appendChild(this.canvas);
        
        this.drawDish();
    }

    renderIngredientLibrary() {
        let library = document.querySelector('.ingredient-library .ingredient-categories');
        if (!library) {
            // Create container if it doesn't exist
            const libraryContainer = document.querySelector('.ingredient-library');
            if (libraryContainer) {
                library = document.createElement('div');
                library.className = 'ingredient-categories';
                libraryContainer.appendChild(library);
            } else {
                return;
            }
        }

        // Group by category
        const categories = {};
        this.ingredients.forEach(ing => {
            if (!categories[ing.category]) {
                categories[ing.category] = [];
            }
            categories[ing.category].push(ing);
        });

        library.innerHTML = Object.keys(categories).map(category => `
            <div class="ingredient-category">
                <div class="category-title">${category}</div>
                ${categories[category].map(ing => `
                    <div class="ingredient-card" draggable="true" data-ingredient-id="${ing.id}">
                        <div class="ingredient-icon">${ing.icon || '🥘'}</div>
                        <div class="ingredient-info">
                            <div class="ingredient-name">${ing.name}</div>
                            <div class="ingredient-meta">${ing.unit || 'unit'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');

        // Setup drag events
        document.querySelectorAll('.ingredient-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                this.draggedElement = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', e.target.dataset.ingredientId);
            });

            card.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });
        });
    }

    filterIngredients(query) {
        const cards = document.querySelectorAll('.ingredient-card');
        const lowerQuery = query.toLowerCase();
        
        cards.forEach(card => {
            const name = card.querySelector('.ingredient-name').textContent.toLowerCase();
            const category = card.closest('.ingredient-category').querySelector('.category-title').textContent.toLowerCase();
            
            if (name.includes(lowerQuery) || category.includes(lowerQuery)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    handleDrop(e) {
        const ingredientId = e.dataTransfer.getData('text/plain');
        const ingredient = this.ingredients.find(ing => ing.id === ingredientId);
        
        if (!ingredient) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.addPlatedIngredient(ingredient, x, y);
    }

    addPlatedIngredient(ingredient, x, y) {
        const plated = {
            id: `plated_${Date.now()}`,
            ingredientId: ingredient.id,
            name: ingredient.name,
            amount: '1',
            unit: ingredient.unit || 'unit',
            x: Math.max(0, Math.min(x, 600)),
            y: Math.max(0, Math.min(y, 350))
        };

        this.platedIngredients.push(plated);
        this.renderPlatedIngredients();
        this.drawDish();
    }

    renderPlatedIngredients() {
        const canvas = document.querySelector('.dish-canvas');
        if (!canvas) return;

        // Remove existing plated items
        canvas.querySelectorAll('.plated-ingredient').forEach(el => el.remove());

        // Add new plated items
        this.platedIngredients.forEach(plated => {
            const ing = this.ingredients.find(i => i.id === plated.ingredientId);
            const element = document.createElement('div');
            element.className = 'plated-ingredient';
            element.style.left = `${plated.x}px`;
            element.style.top = `${plated.y}px`;
            element.dataset.platedId = plated.id;
            
            element.innerHTML = `
                <div class="plated-ingredient-header">
                    <div class="plated-ingredient-name">${plated.name}</div>
                    <button class="plated-ingredient-remove" onclick="recipeCanvas.removePlatedIngredient('${plated.id}')">×</button>
                </div>
                <div class="plated-ingredient-amount">${plated.amount} ${plated.unit}</div>
            `;

            // Make draggable
            this.makeDraggable(element, plated);
            canvas.appendChild(element);
        });

        if (this.platedIngredients.length > 0) {
            canvas.classList.add('has-content');
        } else {
            canvas.classList.remove('has-content');
        }
    }

    makeDraggable(element, plated) {
        let isDragging = false;
        let offset = { x: 0, y: 0 };

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = element.getBoundingClientRect();
            offset.x = e.clientX - rect.left;
            offset.y = e.clientY - rect.top;
            element.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const canvas = document.querySelector('.dish-canvas');
            const rect = canvas.getBoundingClientRect();
            
            let x = e.clientX - rect.left - offset.x;
            let y = e.clientY - rect.top - offset.y;
            
            // Constrain to canvas
            x = Math.max(0, Math.min(x, canvas.offsetWidth - element.offsetWidth));
            y = Math.max(0, Math.min(y, canvas.offsetHeight - element.offsetHeight));
            
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            
            plated.x = x;
            plated.y = y;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
            }
        });
    }

    removePlatedIngredient(id) {
        this.platedIngredients = this.platedIngredients.filter(p => p.id !== id);
        this.renderPlatedIngredients();
        this.drawDish();
    }

    drawDish() {
        if (!this.ctx) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Draw plate background
        const centerX = width / 2;
        const centerY = height / 2;
        const plateRadius = Math.min(width, height) * 0.35;

        // Plate shadow
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + 10, plateRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fill();

        // Plate
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, plateRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fill();
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw ingredient indicators (simplified visual representation)
        this.platedIngredients.forEach((plated, index) => {
            const angle = (index / this.platedIngredients.length) * Math.PI * 2;
            const radius = plateRadius * 0.6;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = '#10b981';
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    addStep() {
        const step = {
            id: `step_${Date.now()}`,
            number: this.steps.length + 1,
            text: '',
            time: 0,
            temperature: null
        };

        this.steps.push(step);
        this.renderSteps();
    }

    renderSteps() {
        const timeline = document.querySelector('.steps-timeline .timeline-steps');
        if (!timeline) return;

        timeline.innerHTML = this.steps.map((step, index) => `
            <div class="timeline-step">
                <div class="timeline-step-number">${step.number}</div>
                <div class="timeline-step-content">
                    <textarea class="step-textarea" placeholder="Describe this step..." data-step-id="${step.id}">${step.text}</textarea>
                    <div class="step-actions">
                        <button class="step-action-btn" onclick="recipeCanvas.removeStep('${step.id}')">Remove</button>
                        <button class="step-action-btn" onclick="recipeCanvas.moveStepUp('${step.id}')">↑</button>
                        <button class="step-action-btn" onclick="recipeCanvas.moveStepDown('${step.id}')">↓</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners for text changes
        timeline.querySelectorAll('.step-textarea').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const step = this.steps.find(s => s.id === e.target.dataset.stepId);
                if (step) {
                    step.text = e.target.value;
                }
            });
        });
    }

    removeStep(id) {
        this.steps = this.steps.filter(s => s.id !== id);
        this.steps.forEach((step, index) => {
            step.number = index + 1;
        });
        this.renderSteps();
    }

    moveStepUp(id) {
        const index = this.steps.findIndex(s => s.id === id);
        if (index > 0) {
            [this.steps[index - 1], this.steps[index]] = [this.steps[index], this.steps[index - 1]];
            this.steps.forEach((step, i) => {
                step.number = i + 1;
            });
            this.renderSteps();
        }
    }

    moveStepDown(id) {
        const index = this.steps.findIndex(s => s.id === id);
        if (index < this.steps.length - 1) {
            [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
            this.steps.forEach((step, i) => {
                step.number = i + 1;
            });
            this.renderSteps();
        }
    }

    saveRecipe() {
        // Collect all recipe data
        const recipe = {
            id: this.recipeData.id || `recipe_${Date.now()}`,
            title: this.recipeData.title || 'Untitled Recipe',
            description: this.recipeData.description,
            servings: this.recipeData.servings,
            prepTime: this.recipeData.prepTime,
            cookTime: this.recipeData.cookTime,
            difficulty: this.recipeData.difficulty,
            cuisine: this.recipeData.cuisine,
            tags: this.recipeData.tags,
            
            // Canvas data
            ingredients: this.platedIngredients.map(plated => {
                const ing = this.ingredients.find(i => i.id === plated.ingredientId);
                return {
                    ingredientId: ing.id,
                    name: ing.name,
                    amount: parseFloat(plated.amount) || 1,
                    unit: plated.unit,
                    position: { x: plated.x, y: plated.y }
                };
            }),
            
            instructions: this.steps.map(step => ({
                step: step.number,
                text: step.text,
                time: step.time,
                temperature: step.temperature
            })),
            
            nutrition: this.recipeData.nutrition,
            createdAt: this.recipeData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to localStorage
        const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
        const existingIndex = recipes.findIndex(r => r.id === recipe.id);
        
        if (existingIndex >= 0) {
            recipes[existingIndex] = recipe;
        } else {
            recipes.push(recipe);
        }
        
        localStorage.setItem('recipes', JSON.stringify(recipes));

        // Show success message
        this.showNotification('✅ Recipe saved successfully!', 'success');
        
        console.log('💾 Recipe saved:', recipe);
    }

    loadSavedRecipe() {
        // Load recipe from URL params or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');
        
        if (recipeId) {
            const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
            const recipe = recipes.find(r => r.id === recipeId);
            
            if (recipe) {
                this.recipeData = recipe;
                this.platedIngredients = recipe.ingredients || [];
                this.steps = (recipe.instructions || []).map(inst => ({
                    id: `step_${inst.step}`,
                    number: inst.step,
                    text: inst.text,
                    time: inst.time,
                    temperature: inst.temperature
                }));
                
                // Populate UI
                const titleInput = document.querySelector('.canvas-title-input');
                if (titleInput) {
                    titleInput.value = recipe.title;
                }
                
                this.renderPlatedIngredients();
                this.renderSteps();
                this.drawDish();
            }
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-weight: 600;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is ready
let recipeCanvas;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        recipeCanvas = new RecipeCanvasBuilder();
        window.recipeCanvas = recipeCanvas;
    });
} else {
    recipeCanvas = new RecipeCanvasBuilder();
    window.recipeCanvas = recipeCanvas;
}

