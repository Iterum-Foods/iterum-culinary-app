/**
 * Unified Menu Creator
 * Single entry point for all menu creation workflows
 * Replaces fragmented MenuManager, Wizard, and Builder systems
 */

class UnifiedMenuCreator {
    constructor() {
        this.modes = {
            'quick': {
                name: 'Quick Menu',
                description: 'Create a simple menu in 3 steps',
                steps: 3,
                timeEstimate: '~3 minutes',
                icon: '⚡'
            },
            'guided': {
                name: 'Guided Creation',
                description: 'Step-by-step menu building with assistance',
                steps: 5,
                timeEstimate: '~10 minutes',
                icon: '🧙'
            },
            'template': {
                name: 'From Template',
                description: 'Start with a professional template',
                steps: 2,
                timeEstimate: '~5 minutes',
                icon: '📋'
            },
            'advanced': {
                name: 'Advanced Builder',
                description: 'Full control with all features',
                steps: 1,
                timeEstimate: '~15 minutes',
                icon: '⚙️'
            }
        };
        
        this.currentMode = null;
        this.currentStep = 1;
        this.menuData = this.createEmptyMenuData();
        this.templates = this.loadTemplates();
        this.collaborators = [];
        this.isCollaborative = false;
        
        this.init();
    }

    /**
     * Initialize the unified menu creator
     */
    init() {
        console.log('🎯 Initializing Unified Menu Creator...');
        this.setupEventListeners();
        this.loadUserPreferences();
    }

    /**
     * Show the menu creation interface
     */
    showCreator() {
        this.renderCreatorModal();
        this.showModeSelection();
    }

    /**
     * Render the main creator modal
     */
    renderCreatorModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay unified-menu-creator-modal';
        modal.id = 'unified-menu-creator-modal';
        
        modal.innerHTML = `
            <div class="modal-content modal-extra-large">
                <div class="modal-header">
                    <h2>🎯 Create New Menu</h2>
                    <button class="modal-close" onclick="unifiedMenuCreator.closeCreator()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <!-- Mode Selection -->
                    <div class="creator-mode-selection" id="mode-selection">
                        <!-- Will be populated by showModeSelection() -->
                    </div>
                    
                    <!-- Quick Mode Content -->
                    <div class="creator-content quick-mode" id="quick-mode" style="display: none;">
                        <!-- Will be populated by showQuickMode() -->
                    </div>
                    
                    <!-- Guided Mode Content -->
                    <div class="creator-content guided-mode" id="guided-mode" style="display: none;">
                        <!-- Will be populated by showGuidedMode() -->
                    </div>
                    
                    <!-- Template Mode Content -->
                    <div class="creator-content template-mode" id="template-mode" style="display: none;">
                        <!-- Will be populated by showTemplateMode() -->
                    </div>
                    
                    <!-- Advanced Mode Content -->
                    <div class="creator-content advanced-mode" id="advanced-mode" style="display: none;">
                        <!-- Will be populated by showAdvancedMode() -->
                    </div>
                    
                    <!-- Live Preview -->
                    <div class="creator-preview" id="live-preview" style="display: none;">
                        <h3>📋 Live Preview</h3>
                        <div class="preview-content" id="preview-content">
                            <!-- Live menu preview will be generated here -->
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <div class="footer-left">
                        <button class="btn btn-secondary" id="back-btn" onclick="unifiedMenuCreator.goBack()" style="display: none;">
                            ← Back
                        </button>
                    </div>
                    <div class="footer-right">
                        <button class="btn btn-secondary" onclick="unifiedMenuCreator.closeCreator()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="next-btn" onclick="unifiedMenuCreator.nextStep()" style="display: none;">
                            Next →
                        </button>
                        <button class="btn btn-success" id="create-btn" onclick="unifiedMenuCreator.createMenu()" style="display: none;">
                            ✅ Create Menu
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addCreatorStyles();
    }

    /**
     * Show mode selection interface
     */
    showModeSelection() {
        const container = document.getElementById('mode-selection');
        container.innerHTML = `
            <div class="mode-selection-header">
                <h3>Choose your creation method</h3>
                <p>Select the approach that best fits your needs</p>
            </div>
            
            <div class="mode-grid">
                ${Object.entries(this.modes).map(([key, mode]) => `
                    <div class="mode-card" data-mode="${key}" onclick="unifiedMenuCreator.selectMode('${key}')">
                        <div class="mode-icon">${mode.icon}</div>
                        <div class="mode-info">
                            <h4>${mode.name}</h4>
                            <p>${mode.description}</p>
                            <div class="mode-meta">
                                <span class="steps">${mode.steps} steps</span>
                                <span class="time">${mode.timeEstimate}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="mode-features">
                <h4>✨ Smart Features</h4>
                <div class="features-grid">
                    <div class="feature-item">
                        <span class="feature-icon">🤖</span>
                        <span class="feature-text">AI-powered suggestions</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📱</span>
                        <span class="feature-text">Mobile optimized</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">👥</span>
                        <span class="feature-text">Real-time collaboration</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📊</span>
                        <span class="feature-text">Live preview</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Select creation mode
     */
    selectMode(mode) {
        this.currentMode = mode;
        console.log(`Selected mode: ${mode}`);
        
        // Hide mode selection
        document.getElementById('mode-selection').style.display = 'none';
        
        // Show appropriate mode content
        switch (mode) {
            case 'quick':
                this.showQuickMode();
                break;
            case 'guided':
                this.showGuidedMode();
                break;
            case 'template':
                this.showTemplateMode();
                break;
            case 'advanced':
                this.showAdvancedMode();
                break;
        }
        
        // Show navigation buttons
        this.updateNavigationButtons();
    }

    /**
     * Show quick mode interface
     */
    showQuickMode() {
        const container = document.getElementById('quick-mode');
        container.style.display = 'block';
        
        container.innerHTML = `
            <div class="quick-mode-content">
                <div class="step-indicator">
                    <div class="step active" data-step="1">1</div>
                    <div class="step" data-step="2">2</div>
                    <div class="step" data-step="3">3</div>
                </div>
                
                <div class="step-content" id="quick-step-1">
                    <h3>🏗️ Menu Basics</h3>
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label for="quick-menu-name">Menu Name *</label>
                            <input type="text" id="quick-menu-name" placeholder="e.g., Summer Dinner Menu" 
                                   oninput="unifiedMenuCreator.updateMenuData('name', this.value)">
                        </div>
                        
                        <div class="form-group">
                            <label for="quick-menu-type">Menu Type *</label>
                            <select id="quick-menu-type" onchange="unifiedMenuCreator.updateMenuData('type', this.value)">
                                <option value="">Select type...</option>
                                <option value="restaurant">Restaurant Menu</option>
                                <option value="catering">Catering Menu</option>
                                <option value="event">Special Event</option>
                                <option value="seasonal">Seasonal Menu</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="quick-menu-cuisine">Cuisine Style</label>
                            <select id="quick-menu-cuisine" onchange="unifiedMenuCreator.updateMenuData('cuisine', this.value)">
                                <option value="">Select cuisine...</option>
                                <option value="italian">Italian</option>
                                <option value="french">French</option>
                                <option value="asian">Asian</option>
                                <option value="mexican">Mexican</option>
                                <option value="american">American</option>
                                <option value="mediterranean">Mediterranean</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="step-content" id="quick-step-2" style="display: none;">
                    <h3>🍽️ Menu Structure</h3>
                    <div class="structure-builder">
                        <div class="structure-suggestions">
                            <h4>Quick Start Options</h4>
                            <div class="suggestion-cards">
                                <div class="suggestion-card" onclick="unifiedMenuCreator.applyQuickStructure('classic')">
                                    <span class="suggestion-icon">🍽️</span>
                                    <span class="suggestion-text">Classic (Appetizer, Main, Dessert)</span>
                                </div>
                                <div class="suggestion-card" onclick="unifiedMenuCreator.applyQuickStructure('full')">
                                    <span class="suggestion-icon">👨‍🍳</span>
                                    <span class="suggestion-text">Full Service (5 courses)</span>
                                </div>
                                <div class="suggestion-card" onclick="unifiedMenuCreator.applyQuickStructure('casual')">
                                    <span class="suggestion-icon">🍕</span>
                                    <span class="suggestion-text">Casual Dining</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="structure-custom">
                            <h4>Or build your own</h4>
                            <div class="category-builder" id="category-builder">
                                <!-- Categories will be added here -->
                            </div>
                            <button class="btn btn-secondary" onclick="unifiedMenuCreator.addQuickCategory()">
                                + Add Category
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="step-content" id="quick-step-3" style="display: none;">
                    <h3>💰 Pricing & Finish</h3>
                    <div class="pricing-section">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="quick-price-range">Price Range</label>
                                <select id="quick-price-range" onchange="unifiedMenuCreator.updateMenuData('priceRange', this.value)">
                                    <option value="">Select range...</option>
                                    <option value="budget">Budget ($10-20)</option>
                                    <option value="mid-range">Mid-Range ($20-40)</option>
                                    <option value="premium">Premium ($40-80)</option>
                                    <option value="luxury">Luxury ($80+)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="quick-servings">Expected Servings</label>
                                <input type="number" id="quick-servings" min="1" placeholder="50" 
                                       oninput="unifiedMenuCreator.updateMenuData('servings', parseInt(this.value))">
                            </div>
                        </div>
                        
                        <div class="pricing-summary" id="quick-pricing-summary">
                            <!-- Pricing summary will be calculated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.currentStep = 1;
        this.updateQuickStep();
    }

    /**
     * Show guided mode interface
     */
    showGuidedMode() {
        const container = document.getElementById('guided-mode');
        container.style.display = 'block';
        
        container.innerHTML = `
            <div class="guided-mode-content">
                <div class="progress-indicator">
                    <div class="progress-bar">
                        <div class="progress-fill" id="guided-progress"></div>
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
                
                <div class="guided-content" id="guided-content">
                    <!-- Content will be populated by showGuidedStep() -->
                </div>
            </div>
        `;
        
        this.currentStep = 1;
        this.showGuidedStep(1);
    }

    /**
     * Show template mode interface
     */
    showTemplateMode() {
        const container = document.getElementById('template-mode');
        container.style.display = 'block';
        
        container.innerHTML = `
            <div class="template-mode-content">
                <div class="template-selection">
                    <h3>📋 Choose a Template</h3>
                    <div class="template-filters">
                        <button class="filter-btn active" data-filter="all">All</button>
                        <button class="filter-btn" data-filter="restaurant">Restaurant</button>
                        <button class="filter-btn" data-filter="catering">Catering</button>
                        <button class="filter-btn" data-filter="event">Event</button>
                    </div>
                    
                    <div class="template-grid" id="template-grid">
                        <!-- Templates will be populated here -->
                    </div>
                </div>
                
                <div class="template-customization" id="template-customization" style="display: none;">
                    <h3>✏️ Customize Template</h3>
                    <div class="customization-content">
                        <!-- Customization options will be populated here -->
                    </div>
                </div>
            </div>
        `;
        
        this.loadTemplates();
    }

    /**
     * Show advanced mode interface
     */
    showAdvancedMode() {
        const container = document.getElementById('advanced-mode');
        container.style.display = 'block';
        
        container.innerHTML = `
            <div class="advanced-mode-content">
                <div class="advanced-header">
                    <h3>⚙️ Advanced Menu Builder</h3>
                    <p>Full control with all features and options</p>
                </div>
                
                <div class="advanced-tabs">
                    <button class="tab-btn active" data-tab="basic">Basic Info</button>
                    <button class="tab-btn" data-tab="structure">Structure</button>
                    <button class="tab-btn" data-tab="dishes">Dishes</button>
                    <button class="tab-btn" data-tab="pricing">Pricing</button>
                    <button class="tab-btn" data-tab="settings">Settings</button>
                </div>
                
                <div class="advanced-content">
                    <div class="tab-content active" id="tab-basic">
                        <!-- Basic information form -->
                    </div>
                    <div class="tab-content" id="tab-structure">
                        <!-- Structure builder -->
                    </div>
                    <div class="tab-content" id="tab-dishes">
                        <!-- Dish management -->
                    </div>
                    <div class="tab-content" id="tab-pricing">
                        <!-- Pricing tools -->
                    </div>
                    <div class="tab-content" id="tab-settings">
                        <!-- Advanced settings -->
                    </div>
                </div>
            </div>
        `;
        
        this.initializeAdvancedMode();
    }

    /**
     * Update menu data
     */
    updateMenuData(field, value) {
        this.menuData[field] = value;
        console.log(`Menu data updated: ${field} = ${value}`);
        
        // Update live preview
        this.updateLivePreview();
        
        // Auto-advance in quick mode
        if (this.currentMode === 'quick' && this.shouldAutoAdvance(field)) {
            setTimeout(() => this.nextStep(), 500);
        }
    }

    /**
     * Check if should auto-advance
     */
    shouldAutoAdvance(field) {
        const autoAdvanceFields = ['name', 'type', 'cuisine'];
        return autoAdvanceFields.includes(field) && this.menuData[field];
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentMode === 'quick') {
            this.nextQuickStep();
        } else if (this.currentMode === 'guided') {
            this.nextGuidedStep();
        }
    }

    /**
     * Go to previous step
     */
    goBack() {
        if (this.currentMode === 'quick') {
            this.previousQuickStep();
        } else if (this.currentMode === 'guided') {
            this.previousGuidedStep();
        }
    }

    /**
     * Next quick step
     */
    nextQuickStep() {
        if (this.currentStep < 3) {
            this.currentStep++;
            this.updateQuickStep();
        } else {
            this.showCreateButton();
        }
    }

    /**
     * Previous quick step
     */
    previousQuickStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateQuickStep();
        }
    }

    /**
     * Update quick step display
     */
    updateQuickStep() {
        // Hide all steps
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`quick-step-${i}`).style.display = 'none';
            document.querySelector(`[data-step="${i}"]`).classList.remove('active');
        }
        
        // Show current step
        document.getElementById(`quick-step-${this.currentStep}`).style.display = 'block';
        document.querySelector(`[data-step="${this.currentStep}"]`).classList.add('active');
        
        // Update navigation
        this.updateNavigationButtons();
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const backBtn = document.getElementById('back-btn');
        const nextBtn = document.getElementById('next-btn');
        const createBtn = document.getElementById('create-btn');
        
        if (this.currentMode === 'quick') {
            backBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
            nextBtn.style.display = this.currentStep < 3 ? 'block' : 'none';
            createBtn.style.display = this.currentStep === 3 ? 'block' : 'none';
        }
    }

    /**
     * Show create button
     */
    showCreateButton() {
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('create-btn').style.display = 'block';
    }

    /**
     * Create menu
     */
    async createMenu() {
        try {
            console.log('Creating menu with data:', this.menuData);
            
            // Validate menu data
            if (!this.validateMenuData()) {
                return;
            }
            
            // Create menu using appropriate method
            let createdMenu;
            if (window.menuManager) {
                createdMenu = await window.menuManager.createMenu(this.menuData);
            } else {
                createdMenu = await this.createMenuLocally();
            }
            
            // Show success message
            this.showNotification(`Menu "${this.menuData.name}" created successfully!`, 'success');
            
            // Close creator
            this.closeCreator();
            
            return createdMenu;
            
        } catch (error) {
            console.error('Error creating menu:', error);
            this.showNotification(`Failed to create menu: ${error.message}`, 'error');
        }
    }

    /**
     * Validate menu data
     */
    validateMenuData() {
        if (!this.menuData.name || !this.menuData.type) {
            this.showNotification('Please fill in menu name and type.', 'error');
            return false;
        }
        return true;
    }

    /**
     * Create menu locally
     */
    async createMenuLocally() {
        const menu = {
            id: Date.now().toString(),
            ...this.menuData,
            createdAt: new Date().toISOString(),
            status: 'draft'
        };
        
        // Save to localStorage
        const menus = JSON.parse(localStorage.getItem('menus') || '[]');
        menus.push(menu);
        localStorage.setItem('menus', JSON.stringify(menus));
        
        return menu;
    }

    /**
     * Update live preview
     */
    updateLivePreview() {
        const preview = document.getElementById('preview-content');
        if (!preview) return;
        
        const previewHTML = this.generatePreviewHTML();
        preview.innerHTML = previewHTML;
        
        // Show preview if we have content
        if (this.menuData.name) {
            document.getElementById('live-preview').style.display = 'block';
        }
    }

    /**
     * Generate preview HTML
     */
    generatePreviewHTML() {
        if (!this.menuData.name) {
            return '<p class="preview-empty">Start filling in your menu details to see a live preview...</p>';
        }
        
        return `
            <div class="preview-menu">
                <div class="preview-header">
                    <h2>${this.menuData.name}</h2>
                    <div class="preview-meta">
                        <span class="menu-type">${this.menuData.type || 'Menu'}</span>
                        ${this.menuData.cuisine ? `<span class="menu-cuisine">${this.menuData.cuisine}</span>` : ''}
                    </div>
                </div>
                <div class="preview-content">
                    <p class="preview-description">${this.menuData.description || 'No description provided'}</p>
                    <!-- Menu items will be added here as they're created -->
                </div>
            </div>
        `;
    }

    /**
     * Close creator
     */
    closeCreator() {
        const modal = document.getElementById('unified-menu-creator-modal');
        if (modal) {
            modal.remove();
        }
        
        // Reset state
        this.currentMode = null;
        this.currentStep = 1;
        this.menuData = this.createEmptyMenuData();
    }

    /**
     * Create empty menu data
     */
    createEmptyMenuData() {
        return {
            name: '',
            type: '',
            cuisine: '',
            description: '',
            priceRange: '',
            servings: null,
            categories: [],
            items: [],
            createdAt: new Date().toISOString(),
            status: 'draft'
        };
    }

    /**
     * Load templates
     */
    loadTemplates() {
        return {
            'restaurant': {
                'italian': {
                    name: 'Italian Restaurant Menu',
                    categories: ['Antipasti', 'Primi', 'Secondi', 'Dolci']
                },
                'french': {
                    name: 'French Bistro Menu',
                    categories: ['Entrées', 'Plats', 'Desserts']
                }
            },
            'catering': {
                'wedding': {
                    name: 'Wedding Reception Menu',
                    categories: ['Cocktail Hour', 'Dinner', 'Dessert Bar']
                }
            }
        };
    }

    /**
     * Add creator styles
     */
    addCreatorStyles() {
        if (document.getElementById('unified-menu-creator-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'unified-menu-creator-styles';
        styles.textContent = `
            .unified-menu-creator-modal .modal-content {
                max-width: 1000px;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .mode-selection-header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .mode-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .mode-card {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 24px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
            }
            
            .mode-card:hover {
                border-color: #3b82f6;
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
            }
            
            .mode-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }
            
            .mode-info h4 {
                margin: 0 0 8px 0;
                color: #1f2937;
                font-weight: 600;
            }
            
            .mode-info p {
                margin: 0 0 12px 0;
                color: #6b7280;
                font-size: 14px;
            }
            
            .mode-meta {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #9ca3af;
            }
            
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-top: 20px;
            }
            
            .feature-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px;
                background: #f8fafc;
                border-radius: 8px;
            }
            
            .feature-icon {
                font-size: 20px;
            }
            
            .step-indicator {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .step {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #e5e7eb;
                color: #6b7280;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .step.active {
                background: #3b82f6;
                color: white;
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .form-group.full-width {
                grid-column: 1 / -1;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #374151;
            }
            
            .form-group input,
            .form-group select {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s ease;
            }
            
            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: #3b82f6;
            }
            
            .creator-preview {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin-top: 20px;
            }
            
            .preview-menu {
                background: white;
                border-radius: 8px;
                padding: 20px;
            }
            
            .preview-header h2 {
                margin: 0 0 8px 0;
                color: #1f2937;
            }
            
            .preview-meta {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .menu-type,
            .menu-cuisine {
                padding: 4px 8px;
                background: #e0f2fe;
                color: #0369a1;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .preview-empty {
                text-align: center;
                color: #6b7280;
                font-style: italic;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add any global event listeners here
    }

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        // Load user's preferred creation mode, templates, etc.
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize global instance
window.unifiedMenuCreator = new UnifiedMenuCreator();

// Expose for global access
window.showMenuCreator = () => window.unifiedMenuCreator.showCreator();
