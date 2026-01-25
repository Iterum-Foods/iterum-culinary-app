/**
 * Recipe Developer Enhancement System
 * Adds autosave, progress tracking, validation, and UX improvements
 */

class RecipeDeveloperEnhancements {
    constructor() {
        this.autosaveInterval = null;
        this.lastSaveTime = null;
        this.hasUnsavedChanges = false;
        this.completedSections = new Set();
        this.formData = {};
        
        console.log('📝 Recipe Developer Enhancements initialized');
    }
    
    init() {
        this.setupProgressTracking();
        this.setupAutosave();
        this.setupFormValidation();
        this.setupCharacterCounters();
        this.setupCollapsibleSections();
        this.setupKeyboardShortcuts();
        this.restoreAutoSave();
        console.log('✅ All enhancements loaded');
    }
    
    // Progress Tracking
    setupProgressTracking() {
        const sections = ['basics', 'ingredients', 'instructions', 'details'];
        
        sections.forEach(section => {
            const inputs = document.querySelectorAll(`[data-section="${section}"] input, [data-section="${section}"] textarea, [data-section="${section}"] select`);
            
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    this.checkSectionCompletion(section);
                    this.updateProgressBar();
                });
            });
        });
        
        // Initial check
        this.updateProgressBar();
    }
    
    checkSectionCompletion(section) {
        let isComplete = false;
        
        switch(section) {
            case 'basics':
                const name = document.getElementById('recipe-name')?.value;
                const category = document.getElementById('recipe-category')?.value;
                isComplete = name && category;
                break;
                
            case 'ingredients':
                const ingredients = document.querySelectorAll('.ingredient-item');
                isComplete = ingredients.length > 0;
                break;
                
            case 'instructions':
                const steps = document.querySelectorAll('.step-item');
                isComplete = steps.length > 0;
                break;
                
            case 'details':
                const servings = document.getElementById('recipe-servings')?.value;
                const time = document.getElementById('recipe-time')?.value;
                isComplete = servings && time;
                break;
        }
        
        if (isComplete) {
            this.completedSections.add(section);
        } else {
            this.completedSections.delete(section);
        }
    }
    
    updateProgressBar() {
        const sections = ['basics', 'ingredients', 'instructions', 'details'];
        
        sections.forEach((section, index) => {
            const stepEl = document.querySelector(`.progress-step[data-step="${section}"]`);
            if (stepEl) {
                stepEl.classList.remove('active', 'completed');
                
                if (this.completedSections.has(section)) {
                    stepEl.classList.add('completed');
                } else {
                    // Mark first incomplete as active
                    const firstIncomplete = sections.find(s => !this.completedSections.has(s));
                    if (section === firstIncomplete) {
                        stepEl.classList.add('active');
                    }
                }
            }
        });
    }
    
    // Autosave System
    setupAutosave() {
        // Track all form changes
        const formInputs = document.querySelectorAll('input, textarea, select');
        
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.hasUnsavedChanges = true;
            });
        });
        
        // Autosave every 30 seconds
        this.autosaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.performAutosave();
            }
        }, 30000);
        
        // Save before leaving page
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                this.performAutosave();
                e.preventDefault();
                e.returnValue = '';
            }
        });
        
        console.log('💾 Autosave enabled (every 30 seconds)');
    }
    
    performAutosave() {
        this.showAutosaveIndicator('saving');
        
        // Collect form data
        const formData = {
            name: document.getElementById('recipe-name')?.value,
            category: document.getElementById('recipe-category')?.value,
            servings: document.getElementById('recipe-servings')?.value,
            time: document.getElementById('recipe-time')?.value,
            description: document.getElementById('recipe-description')?.value,
            ingredients: this.collectIngredients(),
            instructions: this.collectInstructions(),
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        try {
            localStorage.setItem('recipe_autosave', JSON.stringify(formData));
            this.hasUnsavedChanges = false;
            this.lastSaveTime = new Date();
            
            setTimeout(() => {
                this.showAutosaveIndicator('saved');
                setTimeout(() => {
                    this.hideAutosaveIndicator();
                }, 2000);
            }, 500);
            
            console.log('💾 Autosaved at', this.lastSaveTime.toLocaleTimeString());
        } catch (error) {
            console.error('❌ Autosave failed:', error);
            this.showAutosaveIndicator('error');
        }
    }
    
    collectIngredients() {
        const ingredients = [];
        document.querySelectorAll('.ingredient-item').forEach(item => {
            const name = item.querySelector('[name*="name"]')?.value;
            const quantity = item.querySelector('[name*="quantity"]')?.value;
            const unit = item.querySelector('[name*="unit"]')?.value;
            if (name) {
                ingredients.push({ name, quantity, unit });
            }
        });
        return ingredients;
    }
    
    collectInstructions() {
        const instructions = [];
        document.querySelectorAll('.step-item textarea, .step-item input[type="text"]').forEach(input => {
            const text = input.value;
            if (text) {
                instructions.push({ text });
            }
        });
        return instructions;
    }
    
    restoreAutoSave() {
        const savedData = localStorage.getItem('recipe_autosave');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                const savedTime = new Date(data.timestamp);
                const now = new Date();
                const hoursSince = (now - savedTime) / (1000 * 60 * 60);
                
                // Only restore if saved within last 24 hours
                if (hoursSince < 24) {
                    const restore = confirm(`Found autosaved draft from ${savedTime.toLocaleString()}.\n\nWould you like to restore it?`);
                    
                    if (restore) {
                        this.restoreFormData(data);
                        console.log('↺ Autosaved draft restored');
                    } else {
                        localStorage.removeItem('recipe_autosave');
                    }
                }
            } catch (error) {
                console.error('❌ Failed to restore autosave:', error);
            }
        }
    }
    
    restoreFormData(data) {
        if (data.name) document.getElementById('recipe-name').value = data.name;
        if (data.category) document.getElementById('recipe-category').value = data.category;
        if (data.servings) document.getElementById('recipe-servings').value = data.servings;
        if (data.time) document.getElementById('recipe-time').value = data.time;
        if (data.description) document.getElementById('recipe-description').value = data.description;
        
        // Note: Ingredients and instructions would need custom restoration logic
        // based on your existing add functions
    }
    
    showAutosaveIndicator(status) {
        let indicator = document.getElementById('autosave-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autosave-indicator';
            indicator.className = 'autosave-indicator';
            document.body.appendChild(indicator);
        }
        
        indicator.classList.remove('saving', 'saved', 'error');
        indicator.classList.add('show');
        
        if (status === 'saving') {
            indicator.classList.add('saving');
            indicator.innerHTML = '<div class="autosave-spinner"></div><span>Saving draft...</span>';
        } else if (status === 'saved') {
            indicator.innerHTML = '✓ Draft saved';
        } else if (status === 'error') {
            indicator.innerHTML = '⚠ Save failed';
            indicator.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        }
    }
    
    hideAutosaveIndicator() {
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }
    
    // Form Validation
    setupFormValidation() {
        // Recipe name validation
        const nameInput = document.getElementById('recipe-name');
        if (nameInput) {
            nameInput.addEventListener('blur', () => {
                if (!nameInput.value.trim()) {
                    this.showFieldError(nameInput, 'Recipe name is required');
                } else {
                    this.clearFieldError(nameInput);
                }
            });
        }
        
        // Servings validation
        const servingsInput = document.getElementById('recipe-servings');
        if (servingsInput) {
            servingsInput.addEventListener('input', () => {
                const value = parseInt(servingsInput.value);
                if (value < 1) {
                    this.showFieldError(servingsInput, 'Servings must be at least 1');
                } else if (value > 100) {
                    this.showFieldError(servingsInput, 'Servings cannot exceed 100');
                } else {
                    this.clearFieldError(servingsInput);
                }
            });
        }
        
        // Time validation
        const timeInput = document.getElementById('recipe-time');
        if (timeInput) {
            timeInput.addEventListener('input', () => {
                const value = parseInt(timeInput.value);
                if (value < 1) {
                    this.showFieldError(timeInput, 'Time must be at least 1 minute');
                } else {
                    this.clearFieldError(timeInput);
                }
            });
        }
    }
    
    showFieldError(input, message) {
        input.classList.add('error');
        let errorEl = input.nextElementSibling;
        
        if (!errorEl || !errorEl.classList.contains('form-error')) {
            errorEl = document.createElement('div');
            errorEl.className = 'form-error';
            input.parentNode.insertBefore(errorEl, input.nextSibling);
        }
        
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    
    clearFieldError(input) {
        input.classList.remove('error');
        const errorEl = input.nextElementSibling;
        if (errorEl && errorEl.classList.contains('form-error')) {
            errorEl.style.display = 'none';
        }
    }
    
    // Character Counters
    setupCharacterCounters() {
        const textareas = document.querySelectorAll('textarea[maxlength]');
        
        textareas.forEach(textarea => {
            const maxLength = textarea.getAttribute('maxlength');
            
            // Create counter
            const counter = document.createElement('div');
            counter.className = 'char-counter';
            textarea.parentNode.appendChild(counter);
            
            // Update counter
            const updateCounter = () => {
                const remaining = maxLength - textarea.value.length;
                counter.textContent = `${textarea.value.length} / ${maxLength}`;
                
                counter.classList.remove('warning', 'error');
                if (remaining < 50) {
                    counter.classList.add('warning');
                }
                if (remaining < 10) {
                    counter.classList.add('error');
                }
            };
            
            textarea.addEventListener('input', updateCounter);
            updateCounter();
        });
    }
    
    // Collapsible Sections
    setupCollapsibleSections() {
        document.querySelectorAll('.collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.closest('.recipe-form-section');
                const content = section.querySelector('.section-content');
                
                content.classList.toggle('collapsed');
                btn.textContent = content.classList.contains('collapsed') ? 'Expand ▼' : 'Collapse ▲';
            });
        });
    }
    
    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.performAutosave();
                
                // Also trigger main save if available
                const saveBtn = document.querySelector('[onclick*="saveRecipe"]');
                if (saveBtn) {
                    saveBtn.click();
                }
            }
            
            // Ctrl/Cmd + K for quick actions (if implemented)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                console.log('⚡ Quick actions (to be implemented)');
            }
        });
        
        console.log('⌨️ Keyboard shortcuts enabled: Ctrl+S (Save)');
    }
    
    // Public API
    clearAutosave() {
        localStorage.removeItem('recipe_autosave');
        this.hasUnsavedChanges = false;
        console.log('🗑️ Autosave cleared');
    }
    
    getCompletionPercentage() {
        const totalSections = 4;
        return Math.round((this.completedSections.size / totalSections) * 100);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.recipeDeveloperEnhancements = new RecipeDeveloperEnhancements();
        window.recipeDeveloperEnhancements.init();
    });
} else {
    window.recipeDeveloperEnhancements = new RecipeDeveloperEnhancements();
    window.recipeDeveloperEnhancements.init();
}

console.log('✨ Recipe Developer Enhancement System loaded');

