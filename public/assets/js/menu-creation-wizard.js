/**
 * Menu Creation Wizard
 * Provides a guided workflow for creating complete menus with new dishes
 */

class MenuCreationWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.menuData = {
            name: '',
            type: '',
            occasion: '',
            cuisine: '',
            season: '',
            description: '',
            dishes: [],
            targetPrice: null,
            servings: null
        };
        this.templates = this.loadMenuTemplates();
        this.init();
    }

    /**
     * Initialize the wizard
     */
    init() {
        console.log('🧙 Initializing Menu Creation Wizard...');
    }

    /**
     * Show the Menu Creation Wizard
     */
    showWizard() {
        console.log('🧙 Showing Menu Creation Wizard...');
        this.renderWizardModal();
        this.showStep(1);
    }

    /**
     * Render the wizard modal
     */
    renderWizardModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'menu-creation-wizard-modal';
        
        modal.innerHTML = `
            <div class="modal-content modal-extra-large">
                <div class="modal-header">
                    <h3>🧙 Menu Creation Wizard</h3>
                    <span class="modal-close" onclick="menuCreationWizard.closeWizard()">&times;</span>
                </div>
                
                <div class="modal-body">
                    <!-- Progress Indicator -->
                    <div class="wizard-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-steps">
                            <div class="progress-step active" data-step="1">
                                <div class="step-number">1</div>
                                <div class="step-label">Foundation</div>
                            </div>
                            <div class="progress-step" data-step="2">
                                <div class="step-number">2</div>
                                <div class="step-label">Planning</div>
                            </div>
                            <div class="progress-step" data-step="3">
                                <div class="step-number">3</div>
                                <div class="step-label">Dishes</div>
                            </div>
                            <div class="progress-step" data-step="4">
                                <div class="step-number">4</div>
                                <div class="step-label">Pricing</div>
                            </div>
                            <div class="progress-step" data-step="5">
                                <div class="step-number">5</div>
                                <div class="step-label">Review</div>
                            </div>
                        </div>
                    </div>

                    <!-- Step Content -->
                    <div class="wizard-content">
                        <!-- Step 1: Menu Foundation -->
                        <div class="wizard-step" id="step-1">
                            <h4>🏗️ Menu Foundation</h4>
                            <p>Let's start with the basics of your menu.</p>
                            
                            <div class="form-grid">
                                <div class="form-group full-width">
                                    <label for="menu-name">Menu Name *</label>
                                    <input type="text" id="menu-name" placeholder="e.g., Summer Dinner Menu, Wedding Reception..." 
                                           oninput="menuCreationWizard.updateMenuData('name', this.value)">
                                </div>
                                
                                <div class="form-group">
                                    <label for="menu-type">Menu Type *</label>
                                    <select id="menu-type" onchange="menuCreationWizard.updateMenuData('type', this.value)">
                                        <option value="">Select type...</option>
                                        <option value="restaurant">Restaurant Menu</option>
                                        <option value="catering">Catering Menu</option>
                                        <option value="event">Special Event</option>
                                        <option value="seasonal">Seasonal Menu</option>
                                        <option value="tasting">Tasting Menu</option>
                                        <option value="family">Family Dinner</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="menu-occasion">Occasion</label>
                                    <select id="menu-occasion" onchange="menuCreationWizard.updateMenuData('occasion', this.value)">
                                        <option value="">Select occasion...</option>
                                        <option value="breakfast">Breakfast</option>
                                        <option value="brunch">Brunch</option>
                                        <option value="lunch">Lunch</option>
                                        <option value="dinner">Dinner</option>
                                        <option value="wedding">Wedding</option>
                                        <option value="birthday">Birthday Party</option>
                                        <option value="corporate">Corporate Event</option>
                                        <option value="holiday">Holiday Celebration</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="menu-cuisine">Cuisine Style</label>
                                    <select id="menu-cuisine" onchange="menuCreationWizard.updateMenuData('cuisine', this.value)">
                                        <option value="">Select cuisine...</option>
                                        <option value="italian">Italian</option>
                                        <option value="french">French</option>
                                        <option value="asian">Asian</option>
                                        <option value="mexican">Mexican</option>
                                        <option value="american">American</option>
                                        <option value="mediterranean">Mediterranean</option>
                                        <option value="fusion">Fusion</option>
                                        <option value="international">International</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="menu-season">Season</label>
                                    <select id="menu-season" onchange="menuCreationWizard.updateMenuData('season', this.value)">
                                        <option value="">Select season...</option>
                                        <option value="spring">Spring</option>
                                        <option value="summer">Summer</option>
                                        <option value="fall">Fall</option>
                                        <option value="winter">Winter</option>
                                        <option value="year-round">Year Round</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="menu-servings">Expected Servings</label>
                                    <input type="number" id="menu-servings" min="1" placeholder="50" 
                                           oninput="menuCreationWizard.updateMenuData('servings', parseInt(this.value))">
                                </div>
                                
                                <div class="form-group full-width">
                                    <label for="menu-description">Description</label>
                                    <textarea id="menu-description" rows="3" 
                                              placeholder="Brief description of your menu concept..."
                                              oninput="menuCreationWizard.updateMenuData('description', this.value)"></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Step 2: Menu Planning -->
                        <div class="wizard-step" id="step-2" style="display: none;">
                            <h4>📋 Menu Planning</h4>
                            <p>Let's plan the structure and dishes for your menu.</p>
                            
                            <div class="planning-section">
                                <h5>🎯 Quick Start Options</h5>
                                <div class="template-grid">
                                    <div class="template-card" onclick="menuCreationWizard.selectTemplate('classic')">
                                        <div class="template-icon">🍽️</div>
                                        <h6>Classic Menu</h6>
                                        <p>Appetizer, Main, Dessert</p>
                                    </div>
                                    <div class="template-card" onclick="menuCreationWizard.selectTemplate('tasting')">
                                        <div class="template-icon">👨‍🍳</div>
                                        <h6>Tasting Menu</h6>
                                        <p>5-course experience</p>
                                    </div>
                                    <div class="template-card" onclick="menuCreationWizard.selectTemplate('family')">
                                        <div class="template-icon">👨‍👩‍👧‍👦</div>
                                        <h6>Family Style</h6>
                                        <p>Shared dishes</p>
                                    </div>
                                    <div class="template-card" onclick="menuCreationWizard.selectTemplate('custom')">
                                        <div class="template-icon">⚙️</div>
                                        <h6>Custom Structure</h6>
                                        <p>Build your own</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="planning-section">
                                <h5>📊 Menu Structure</h5>
                                <div class="structure-builder" id="structure-builder">
                                    <!-- Structure will be built here -->
                                </div>
                                
                                <div class="structure-actions">
                                    <button class="btn btn-secondary" onclick="menuCreationWizard.addCategory()">
                                        + Add Category
                                    </button>
                                    <button class="btn btn-secondary" onclick="menuCreationWizard.autoSuggestStructure()">
                                        🤖 Auto-Suggest
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Step 3: Dish Creation -->
                        <div class="wizard-step" id="step-3" style="display: none;">
                            <h4>🍳 Dish Creation</h4>
                            <p>Create the dishes for your menu. You can add existing recipes or create new ones.</p>
                            
                            <div class="dishes-section">
                                <div class="dishes-header">
                                    <h5>📝 Menu Dishes</h5>
                                    <button class="btn btn-primary" onclick="menuCreationWizard.openDishCreator()">
                                        + Add Dish
                                    </button>
                                </div>
                                
                                <div class="dishes-list" id="dishes-list">
                                    <div class="empty-state">
                                        <div class="empty-state-icon">🍽️</div>
                                        <h4>No Dishes Yet</h4>
                                        <p>Add your first dish to get started</p>
                                    </div>
                                </div>
                                
                                <div class="batch-actions">
                                    <button class="btn btn-secondary" onclick="menuCreationWizard.batchCreateDishes()">
                                        🔄 Batch Create
                                    </button>
                                    <button class="btn btn-secondary" onclick="menuCreationWizard.importFromLibrary()">
                                        📚 Import from Library
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Step 4: Pricing & Analysis -->
                        <div class="wizard-step" id="step-4" style="display: none;">
                            <h4>💰 Pricing & Analysis</h4>
                            <p>Set pricing and analyze costs for your menu.</p>
                            
                            <div class="pricing-section">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="target-price">Target Price Range</label>
                                        <select id="target-price" onchange="menuCreationWizard.updateMenuData('targetPrice', this.value)">
                                            <option value="">Select range...</option>
                                            <option value="budget">Budget ($10-20)</option>
                                            <option value="mid-range">Mid-Range ($20-40)</option>
                                            <option value="premium">Premium ($40-80)</option>
                                            <option value="luxury">Luxury ($80+)</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="profit-margin">Target Profit Margin (%)</label>
                                        <input type="number" id="profit-margin" min="0" max="100" value="30" 
                                               placeholder="30">
                                    </div>
                                </div>
                                
                                <div class="pricing-analysis" id="pricing-analysis">
                                    <h5>📊 Cost Analysis</h5>
                                    <div class="analysis-grid">
                                        <div class="analysis-card">
                                            <div class="analysis-icon">💵</div>
                                            <div class="analysis-label">Total Cost</div>
                                            <div class="analysis-value" id="total-cost">$0.00</div>
                                        </div>
                                        <div class="analysis-card">
                                            <div class="analysis-icon">💰</div>
                                            <div class="analysis-label">Suggested Price</div>
                                            <div class="analysis-value" id="suggested-price">$0.00</div>
                                        </div>
                                        <div class="analysis-card">
                                            <div class="analysis-icon">📈</div>
                                            <div class="analysis-label">Profit Margin</div>
                                            <div class="analysis-value" id="profit-margin-display">0%</div>
                                        </div>
                                        <div class="analysis-card">
                                            <div class="analysis-icon">🎯</div>
                                            <div class="analysis-label">Price Range</div>
                                            <div class="analysis-value" id="price-range">$0.00 - $0.00</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="menu-balance" id="menu-balance">
                                    <h5>⚖️ Menu Balance</h5>
                                    <div class="balance-items">
                                        <div class="balance-item">
                                            <span>Categories:</span>
                                            <span id="category-count">0</span>
                                        </div>
                                        <div class="balance-item">
                                            <span>Dishes:</span>
                                            <span id="dish-count">0</span>
                                        </div>
                                        <div class="balance-item">
                                            <span>Price Range:</span>
                                            <span id="price-range-status">Balanced</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Step 5: Review & Save -->
                        <div class="wizard-step" id="step-5" style="display: none;">
                            <h4>✅ Review & Save</h4>
                            <p>Review your menu and save it to your library.</p>
                            
                            <div class="review-section">
                                <div class="menu-preview" id="menu-preview">
                                    <h5>📋 Menu Preview</h5>
                                    <div class="preview-content">
                                        <!-- Menu preview will be generated here -->
                                    </div>
                                </div>
                                
                                <div class="save-options">
                                    <h5>💾 Save Options</h5>
                                    <div class="save-options-grid">
                                        <label class="save-option">
                                            <input type="checkbox" checked> Save as Draft
                                        </label>
                                        <label class="save-option">
                                            <input type="checkbox"> Publish Menu
                                        </label>
                                        <label class="save-option">
                                            <input type="checkbox"> Export as PDF
                                        </label>
                                        <label class="save-option">
                                            <input type="checkbox"> Share with Team
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <div class="footer-left">
                        <button class="btn btn-secondary" id="prev-btn" onclick="menuCreationWizard.previousStep()" style="display: none;">
                            ← Previous
                        </button>
                    </div>
                    <div class="footer-right">
                        <button class="btn btn-secondary" onclick="menuCreationWizard.closeWizard()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="next-btn" onclick="menuCreationWizard.nextStep()">
                            Next →
                        </button>
                        <button class="btn btn-success" id="finish-btn" onclick="menuCreationWizard.finishWizard()" style="display: none;">
                            ✅ Create Menu
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addWizardStyles();
        this.initializeWizard();
    }

    /**
     * Add styles for the wizard
     */
    addWizardStyles() {
        if (document.getElementById('menu-wizard-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'menu-wizard-styles';
        styles.textContent = `
            .wizard-progress {
                margin-bottom: 30px;
            }
            
            .progress-bar {
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                margin-bottom: 20px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #10b981);
                border-radius: 2px;
                transition: width 0.3s ease;
                width: 20%;
            }
            
            .progress-steps {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .progress-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                opacity: 0.5;
                transition: opacity 0.3s ease;
            }
            
            .progress-step.active,
            .progress-step.completed {
                opacity: 1;
            }
            
            .step-number {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #e5e7eb;
                color: #6b7280;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            
            .progress-step.active .step-number {
                background: #3b82f6;
                color: white;
            }
            
            .progress-step.completed .step-number {
                background: #10b981;
                color: white;
            }
            
            .step-label {
                font-size: 12px;
                color: #6b7280;
                text-align: center;
                font-weight: 500;
            }
            
            .wizard-content {
                min-height: 400px;
            }
            
            .wizard-step {
                padding: 20px 0;
            }
            
            .template-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin: 20px 0;
            }
            
            .template-card {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .template-card:hover {
                border-color: #3b82f6;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            }
            
            .template-icon {
                font-size: 32px;
                margin-bottom: 12px;
            }
            
            .template-card h6 {
                margin: 0 0 8px 0;
                color: #1f2937;
                font-weight: 600;
            }
            
            .template-card p {
                margin: 0;
                color: #6b7280;
                font-size: 14px;
            }
            
            .planning-section {
                margin-bottom: 30px;
            }
            
            .planning-section h5 {
                margin: 0 0 16px 0;
                color: #1f2937;
                font-weight: 600;
            }
            
            .structure-builder {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
            }
            
            .structure-actions {
                display: flex;
                gap: 12px;
                margin-top: 16px;
            }
            
            .dishes-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .dishes-header h5 {
                margin: 0;
                color: #1f2937;
                font-weight: 600;
            }
            
            .dishes-list {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                min-height: 200px;
            }
            
            .batch-actions {
                display: flex;
                gap: 12px;
            }
            
            .pricing-section {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            
            .analysis-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
                margin: 16px 0;
            }
            
            .analysis-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                text-align: center;
            }
            
            .analysis-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }
            
            .analysis-label {
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 4px;
            }
            
            .analysis-value {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
            }
            
            .menu-balance {
                background: #f0f9ff;
                border: 1px solid #0ea5e9;
                border-radius: 8px;
                padding: 16px;
            }
            
            .balance-items {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .balance-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .balance-item:last-child {
                border-bottom: none;
            }
            
            .review-section {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            
            .menu-preview {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
            }
            
            .save-options {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
            }
            
            .save-options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
                margin-top: 16px;
            }
            
            .save-option {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
            }
            
            .save-option input[type="checkbox"] {
                width: auto;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Initialize the wizard
     */
    initializeWizard() {
        // Setup form validation
        this.setupFormValidation();
    }

    /**
     * Show specific step
     */
    showStep(stepNumber) {
        // Hide all steps
        for (let i = 1; i <= this.totalSteps; i++) {
            document.getElementById(`step-${i}`).style.display = 'none';
            document.querySelector(`[data-step="${i}"]`).classList.remove('active', 'completed');
        }
        
        // Show current step
        document.getElementById(`step-${stepNumber}`).style.display = 'block';
        document.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');
        
        // Mark previous steps as completed
        for (let i = 1; i < stepNumber; i++) {
            document.querySelector(`[data-step="${i}"]`).classList.add('completed');
        }
        
        // Update progress bar
        const progress = (stepNumber / this.totalSteps) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Update navigation buttons
        this.updateNavigationButtons(stepNumber);
        
        this.currentStep = stepNumber;
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons(stepNumber) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const finishBtn = document.getElementById('finish-btn');
        
        // Show/hide previous button
        prevBtn.style.display = stepNumber > 1 ? 'block' : 'none';
        
        // Show/hide next/finish buttons
        if (stepNumber === this.totalSteps) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            finishBtn.style.display = 'none';
        }
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.showStep(this.currentStep + 1);
                
                // Initialize step-specific content
                this.initializeStepContent(this.currentStep);
            }
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Validate current step
     */
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                const name = document.getElementById('menu-name').value.trim();
                const type = document.getElementById('menu-type').value;
                if (!name || !type) {
                    alert('Please fill in menu name and type.');
                    return false;
                }
                break;
            case 2:
                // Validation for planning step
                break;
            case 3:
                if (this.menuData.dishes.length === 0) {
                    alert('Please add at least one dish to your menu.');
                    return false;
                }
                break;
            case 4:
                // Validation for pricing step
                break;
            case 5:
                // Validation for review step
                break;
        }
        return true;
    }

    /**
     * Initialize step-specific content
     */
    initializeStepContent(stepNumber) {
        switch (stepNumber) {
            case 2:
                this.initializePlanningStep();
                break;
            case 3:
                this.initializeDishesStep();
                break;
            case 4:
                this.initializePricingStep();
                break;
            case 5:
                this.initializeReviewStep();
                break;
        }
    }

    /**
     * Initialize planning step
     */
    initializePlanningStep() {
        // Auto-suggest structure based on menu type
        this.autoSuggestStructure();
    }

    /**
     * Initialize dishes step
     */
    initializeDishesStep() {
        this.renderDishesList();
    }

    /**
     * Initialize pricing step
     */
    initializePricingStep() {
        this.calculatePricing();
    }

    /**
     * Initialize review step
     */
    initializeReviewStep() {
        this.generateMenuPreview();
    }

    /**
     * Update menu data
     */
    updateMenuData(field, value) {
        this.menuData[field] = value;
        console.log('Menu data updated:', field, value);
    }

    /**
     * Select template
     */
    selectTemplate(templateType) {
        console.log('Selected template:', templateType);
        
        if (templateType === 'custom') {
            // Let user build custom structure
            return;
        }
        
        const template = this.templates[templateType];
        if (template) {
            // Apply template structure
            this.applyTemplate(template);
        }
    }

    /**
     * Apply template
     */
    applyTemplate(template) {
        // Clear existing structure
        document.getElementById('structure-builder').innerHTML = '';
        
        // Add template categories
        template.categories.forEach((category, index) => {
            this.addCategory(category.name, category.dishes);
        });
    }

    /**
     * Add category
     */
    addCategory(name = '', dishes = []) {
        const container = document.getElementById('structure-builder');
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'structure-category';
        categoryDiv.innerHTML = `
            <div class="category-header">
                <input type="text" placeholder="Category name..." value="${name}">
                <span class="drag-handle">⋮⋮</span>
                <button class="remove-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="category-dishes">
                ${dishes.map(dish => `
                    <div class="dish-item">
                        <span>${dish}</span>
                        <button class="remove-btn" onclick="this.parentElement.remove()">×</button>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-sm btn-secondary" onclick="this.previousElementSibling.appendChild(quickDishCreator.addDishItem())">
                + Add Dish
            </button>
        `;
        
        container.appendChild(categoryDiv);
    }

    /**
     * Auto-suggest structure
     */
    autoSuggestStructure() {
        const menuType = this.menuData.type;
        const cuisine = this.menuData.cuisine;
        
        let suggestedStructure = [];
        
        if (menuType === 'restaurant') {
            suggestedStructure = [
                { name: 'Appetizers', dishes: ['House Salad', 'Soup of the Day', 'Bruschetta'] },
                { name: 'Main Courses', dishes: ['Grilled Salmon', 'Beef Tenderloin', 'Vegetarian Pasta'] },
                { name: 'Desserts', dishes: ['Tiramisu', 'Chocolate Cake', 'Ice Cream'] }
            ];
        } else if (menuType === 'tasting') {
            suggestedStructure = [
                { name: 'Amuse Bouche', dishes: ['Seasonal Bite'] },
                { name: 'First Course', dishes: ['Soup or Salad'] },
                { name: 'Second Course', dishes: ['Fish or Seafood'] },
                { name: 'Main Course', dishes: ['Meat or Poultry'] },
                { name: 'Dessert', dishes: ['Sweet Finish'] }
            ];
        }
        
        // Apply suggested structure
        suggestedStructure.forEach(category => {
            this.addCategory(category.name, category.dishes);
        });
    }

    /**
     * Open dish creator
     */
    openDishCreator() {
        if (window.quickDishCreator) {
            window.quickDishCreator.showCreator();
        } else {
            alert('Quick Dish Creator not available. Please use the regular dish selection.');
        }
    }

    /**
     * Render dishes list
     */
    renderDishesList() {
        const container = document.getElementById('dishes-list');
        
        if (this.menuData.dishes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🍽️</div>
                    <h4>No Dishes Yet</h4>
                    <p>Add your first dish to get started</p>
                </div>
            `;
        } else {
            container.innerHTML = this.menuData.dishes.map((dish, index) => `
                <div class="dish-item">
                    <div class="dish-info">
                        <h6>${dish.name}</h6>
                        <p>${dish.category} - ${dish.price ? '$' + dish.price : 'No price'}</p>
                    </div>
                    <div class="dish-actions">
                        <button class="btn btn-sm btn-secondary" onclick="menuCreationWizard.editDish(${index})">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="menuCreationWizard.removeDish(${index})">
                            Remove
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Batch create dishes
     */
    batchCreateDishes() {
        alert('Batch dish creation feature coming soon!');
    }

    /**
     * Import from library
     */
    importFromLibrary() {
        alert('Import from library feature coming soon!');
    }

    /**
     * Calculate pricing
     */
    calculatePricing() {
        // Calculate total cost
        const totalCost = this.menuData.dishes.reduce((sum, dish) => {
            return sum + (dish.cost || 0);
        }, 0);
        
        // Calculate suggested price
        const profitMargin = parseInt(document.getElementById('profit-margin').value) || 30;
        const suggestedPrice = totalCost * (1 + profitMargin / 100);
        
        // Update display
        document.getElementById('total-cost').textContent = `$${totalCost.toFixed(2)}`;
        document.getElementById('suggested-price').textContent = `$${suggestedPrice.toFixed(2)}`;
        document.getElementById('profit-margin-display').textContent = `${profitMargin}%`;
        
        // Update category and dish counts
        const categories = [...new Set(this.menuData.dishes.map(dish => dish.category))];
        document.getElementById('category-count').textContent = categories.length;
        document.getElementById('dish-count').textContent = this.menuData.dishes.length;
        
        // Calculate price range
        const prices = this.menuData.dishes.map(dish => dish.price).filter(p => p);
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            document.getElementById('price-range').textContent = `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
        }
    }

    /**
     * Generate menu preview
     */
    generateMenuPreview() {
        const container = document.querySelector('#menu-preview .preview-content');
        
        let previewHTML = `
            <div class="preview-header">
                <h3>${this.menuData.name || 'Untitled Menu'}</h3>
                <p>${this.menuData.description || 'No description provided'}</p>
            </div>
        `;
        
        // Group dishes by category
        const categories = {};
        this.menuData.dishes.forEach(dish => {
            if (!categories[dish.category]) {
                categories[dish.category] = [];
            }
            categories[dish.category].push(dish);
        });
        
        // Render categories
        Object.entries(categories).forEach(([categoryName, dishes]) => {
            previewHTML += `
                <div class="preview-category">
                    <h4>${categoryName}</h4>
                    <div class="preview-dishes">
                        ${dishes.map(dish => `
                            <div class="preview-dish">
                                <div class="dish-name">${dish.name}</div>
                                <div class="dish-price">${dish.price ? '$' + dish.price : ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = previewHTML;
    }

    /**
     * Finish wizard
     */
    finishWizard() {
        // Collect all data
        const finalMenuData = {
            ...this.menuData,
            createdAt: new Date().toISOString(),
            status: 'draft'
        };
        
        // Save to localStorage or send to backend
        const menus = JSON.parse(localStorage.getItem('menus') || '[]');
        menus.push({
            id: Date.now(),
            ...finalMenuData
        });
        localStorage.setItem('menus', JSON.stringify(menus));
        
        // Add to current menu manager if available
        if (window.menuManager) {
            // Transfer dishes to menu manager
            this.menuData.dishes.forEach(dish => {
                const category = window.menuManager.ensureDefaultCategory();
                window.menuManager.addItem(category.id, dish);
            });
        }
        
        this.closeWizard();
        alert('Menu created successfully!');
    }

    /**
     * Close wizard
     */
    closeWizard() {
        const modal = document.getElementById('menu-creation-wizard-modal');
        if (modal) {
            modal.remove();
        }
        
        // Clean up styles
        const styles = document.getElementById('menu-wizard-styles');
        if (styles) {
            styles.remove();
        }
        
        // Reset wizard state
        this.currentStep = 1;
        this.menuData = {
            name: '',
            type: '',
            occasion: '',
            cuisine: '',
            season: '',
            description: '',
            dishes: [],
            targetPrice: null,
            servings: null
        };
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        // Add real-time validation
        const requiredFields = ['menu-name', 'menu-type'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(field);
                });
            }
        });
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        if (field.hasAttribute('required') && !field.value.trim()) {
            field.style.borderColor = '#ef4444';
            return false;
        } else {
            field.style.borderColor = '#e5e7eb';
            return true;
        }
    }

    /**
     * Load menu templates
     */
    loadMenuTemplates() {
        return {
            classic: {
                categories: [
                    { name: 'Appetizers', dishes: ['House Salad', 'Soup of the Day'] },
                    { name: 'Main Courses', dishes: ['Grilled Salmon', 'Beef Tenderloin'] },
                    { name: 'Desserts', dishes: ['Tiramisu', 'Chocolate Cake'] }
                ]
            },
            tasting: {
                categories: [
                    { name: 'Amuse Bouche', dishes: ['Seasonal Bite'] },
                    { name: 'First Course', dishes: ['Soup or Salad'] },
                    { name: 'Second Course', dishes: ['Fish or Seafood'] },
                    { name: 'Main Course', dishes: ['Meat or Poultry'] },
                    { name: 'Dessert', dishes: ['Sweet Finish'] }
                ]
            },
            family: {
                categories: [
                    { name: 'Shared Appetizers', dishes: ['Cheese Board', 'Charcuterie'] },
                    { name: 'Family Style Mains', dishes: ['Roast Chicken', 'Pasta', 'Vegetables'] },
                    { name: 'Desserts', dishes: ['Ice Cream', 'Cookies'] }
                ]
            }
        };
    }
}

// Initialize global instance
window.menuCreationWizard = new MenuCreationWizard();
