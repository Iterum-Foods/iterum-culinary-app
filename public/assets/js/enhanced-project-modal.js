/**
 * Enhanced Project Creation Modal
 * Beautiful, centered, and professional project creation UI
 */

class EnhancedProjectModal {
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.injectStyles();
    }

    /**
     * Show the enhanced project creation modal
     */
    show() {
        const modal = this.createModal();
        document.body.appendChild(modal);
        
        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('active');
            
            // Focus first input
            setTimeout(() => {
                const nameInput = modal.querySelector('#enhanced-project-name');
                if (nameInput) nameInput.focus();
            }, 150);
        });
        
        return modal;
    }

    /**
     * Create the enhanced modal
     */
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'enhanced-project-modal';
        modal.id = 'enhanced-project-modal';

        modal.innerHTML = `
            <div class="enhanced-modal-backdrop" onclick="this.closest('.enhanced-project-modal').remove()"></div>
            <div class="enhanced-modal-container">
                <!-- Header -->
                <div class="enhanced-modal-header">
                    <div class="header-content">
                        <div class="modal-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                <line x1="12" y1="11" x2="12" y2="17"/>
                                <line x1="9" y1="14" x2="15" y2="14"/>
                            </svg>
                        </div>
                        <div class="header-text">
                            <h1>Create New Project</h1>
                            <p>Set up a new culinary project or restaurant workspace</p>
                        </div>
                    </div>
                    <button class="enhanced-close-btn" onclick="this.closest('.enhanced-project-modal').remove()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <!-- Body -->
                <div class="enhanced-modal-body">
                    <form id="enhanced-project-form" class="enhanced-form">
                        <!-- Project Identity Section -->
                        <div class="form-section">
                            <div class="section-header">
                                <span class="section-icon">🏢</span>
                                <h3>Project Identity</h3>
                            </div>
                            
                            <div class="input-group">
                                <label for="enhanced-project-name" class="input-label">
                                    Project Name <span class="required">*</span>
                                </label>
                                <input type="text" 
                                       id="enhanced-project-name" 
                                       name="name" 
                                       required 
                                       class="enhanced-input" 
                                       placeholder="e.g., Downtown Bistro, Catering Menu, Special Events"
                                       maxlength="200">
                                <div class="input-hint">This will be the main identifier for your project</div>
                            </div>
                            
                            <div class="input-group">
                                <label for="enhanced-project-restaurant" class="input-label">
                                    Restaurant/Venue Name
                                </label>
                                <input type="text" 
                                       id="enhanced-project-restaurant" 
                                       name="restaurant_name" 
                                       class="enhanced-input"
                                       placeholder="e.g., The Emerald Kitchen, Chef's Table"
                                       maxlength="200">
                                <div class="input-hint">Optional - physical location or brand name</div>
                            </div>
                        </div>

                        <!-- Style & Settings Section -->
                        <div class="form-section">
                            <div class="section-header">
                                <span class="section-icon">🎨</span>
                                <h3>Style & Settings</h3>
                            </div>
                            
                            <div class="input-grid">
                                <div class="input-group">
                                    <label for="enhanced-project-cuisine" class="input-label">Cuisine Type</label>
                                    <div class="select-wrapper">
                                        <select id="enhanced-project-cuisine" name="cuisine_type" class="enhanced-select">
                                            <option value="">Select cuisine style</option>
                                            <option value="American">🇺🇸 American</option>
                                            <option value="Italian">🇮🇹 Italian</option>
                                            <option value="French">🇫🇷 French</option>
                                            <option value="Mexican">🇲🇽 Mexican</option>
                                            <option value="Chinese">🇨🇳 Chinese</option>
                                            <option value="Japanese">🇯🇵 Japanese</option>
                                            <option value="Indian">🇮🇳 Indian</option>
                                            <option value="Thai">🇹🇭 Thai</option>
                                            <option value="Mediterranean">🫒 Mediterranean</option>
                                            <option value="Middle Eastern">🥙 Middle Eastern</option>
                                            <option value="Korean">🇰🇷 Korean</option>
                                            <option value="Vietnamese">🇻🇳 Vietnamese</option>
                                            <option value="Fusion">🌍 Fusion</option>
                                            <option value="Bakery">🥖 Bakery & Pastry</option>
                                            <option value="Seafood">🐟 Seafood</option>
                                            <option value="Steakhouse">🥩 Steakhouse</option>
                                            <option value="Vegetarian">🥗 Vegetarian/Vegan</option>
                                            <option value="Fast Casual">🍔 Fast Casual</option>
                                            <option value="Fine Dining">🍽️ Fine Dining</option>
                                            <option value="Catering">🎉 Catering</option>
                                            <option value="Other">✨ Other</option>
                                        </select>
                                        <div class="select-arrow">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="6,9 12,15 18,9"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="input-group">
                                    <label class="input-label">Color Theme</label>
                                    <div class="color-selection">
                                        <input type="color" 
                                               id="enhanced-project-color" 
                                               name="color_theme" 
                                               value="#3B82F6" 
                                               class="enhanced-color-input">
                                        <div class="color-grid">
                                            <button type="button" class="color-option active" data-color="#3B82F6" style="background: #3B82F6" title="Ocean Blue"></button>
                                            <button type="button" class="color-option" data-color="#10B981" style="background: #10B981" title="Emerald Green"></button>
                                            <button type="button" class="color-option" data-color="#F59E0B" style="background: #F59E0B" title="Warm Orange"></button>
                                            <button type="button" class="color-option" data-color="#EF4444" style="background: #EF4444" title="Cherry Red"></button>
                                            <button type="button" class="color-option" data-color="#8B5CF6" style="background: #8B5CF6" title="Royal Purple"></button>
                                            <button type="button" class="color-option" data-color="#EC4899" style="background: #EC4899" title="Rose Pink"></button>
                                            <button type="button" class="color-option" data-color="#14B8A6" style="background: #14B8A6" title="Teal"></button>
                                            <button type="button" class="color-option" data-color="#6B7280" style="background: #6B7280" title="Cool Gray"></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Description Section -->
                        <div class="form-section">
                            <div class="section-header">
                                <span class="section-icon">📝</span>
                                <h3>Description</h3>
                            </div>
                            
                            <div class="input-group">
                                <label for="enhanced-project-description" class="input-label">Project Description</label>
                                <textarea id="enhanced-project-description" 
                                          name="description" 
                                          class="enhanced-textarea" 
                                          rows="3"
                                          placeholder="Describe your project's concept, style, or special focus..."
                                          maxlength="500"></textarea>
                                <div class="input-hint">Help your team understand this project's unique identity</div>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Footer -->
                <div class="enhanced-modal-footer">
                    <button type="button" class="btn-cancel" onclick="this.closest('.enhanced-project-modal').remove()">
                        Cancel
                    </button>
                    <button type="button" class="btn-create" onclick="window.enhancedProjectModal.createProject()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            <line x1="12" y1="11" x2="12" y2="17"/>
                            <line x1="9" y1="14" x2="15" y2="14"/>
                        </svg>
                        Create Project
                    </button>
                </div>
            </div>
        `;

        this.setupEventHandlers(modal);
        return modal;
    }

    /**
     * Setup event handlers for the modal
     */
    setupEventHandlers(modal) {
        // Color selection
        const colorOptions = modal.querySelectorAll('.color-option');
        const colorInput = modal.querySelector('#enhanced-project-color');
        
        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const color = option.dataset.color;
                colorInput.value = color;
                
                // Update active state
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // Custom color input
        colorInput.addEventListener('change', () => {
            colorOptions.forEach(opt => opt.classList.remove('active'));
        });

        // Escape key handler
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Form validation
        const form = modal.querySelector('#enhanced-project-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });
    }

    /**
     * Create project with enhanced validation
     */
    async createProject() {
        const form = document.getElementById('enhanced-project-form');
        const formData = new FormData(form);
        const projectData = Object.fromEntries(formData.entries());

        // Validation
        if (!projectData.name || projectData.name.trim().length < 2) {
            this.showError('Project name must be at least 2 characters long');
            return;
        }

        // Create the project
        try {
            const success = await this.projectManager.createProjectFromData(projectData);
            if (success) {
                document.getElementById('enhanced-project-modal').remove();
                this.showSuccess('Project created successfully!');
            }
        } catch (error) {
            this.showError('Failed to create project: ' + error.message);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // You can implement a toast notification here
        console.log('✅', message);
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // You can implement a toast notification here
        console.error('❌', message);
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * Inject enhanced modal styles
     */
    injectStyles() {
        if (document.getElementById('enhanced-project-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'enhanced-project-modal-styles';
        style.textContent = `
            /* Enhanced Project Modal Styles */
            .enhanced-project-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .enhanced-project-modal.active {
                opacity: 1;
            }

            .enhanced-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }

            .enhanced-modal-container {
                position: relative;
                background: white;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow: hidden;
                transform: scale(0.95) translateY(20px);
                transition: transform 0.3s ease;
            }

            .enhanced-project-modal.active .enhanced-modal-container {
                transform: scale(1) translateY(0);
            }

            /* Header */
            .enhanced-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 2rem 2rem 1rem 2rem;
                border-bottom: 1px solid #f1f5f9;
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            }

            .header-content {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .modal-icon {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }

            .header-text h1 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 700;
                color: #1e293b;
                line-height: 1.2;
            }

            .header-text p {
                margin: 0.25rem 0 0 0;
                font-size: 0.875rem;
                color: #64748b;
                line-height: 1.4;
            }

            .enhanced-close-btn {
                width: 40px;
                height: 40px;
                border: none;
                background: #f1f5f9;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #64748b;
                transition: all 0.2s ease;
            }

            .enhanced-close-btn:hover {
                background: #e2e8f0;
                color: #475569;
                transform: scale(1.05);
            }

            /* Body */
            .enhanced-modal-body {
                padding: 2rem;
                max-height: calc(90vh - 180px);
                overflow-y: auto;
            }

            .enhanced-form {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }

            .form-section {
                background: #f8fafc;
                border-radius: 12px;
                padding: 1.5rem;
                border: 1px solid #e2e8f0;
            }

            .section-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
            }

            .section-icon {
                font-size: 1.25rem;
                width: 32px;
                height: 32px;
                background: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #e2e8f0;
            }

            .section-header h3 {
                margin: 0;
                font-size: 1.125rem;
                font-weight: 600;
                color: #1e293b;
            }

            .input-group {
                margin-bottom: 1.5rem;
            }

            .input-group:last-child {
                margin-bottom: 0;
            }

            .input-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
            }

            .input-label {
                display: block;
                font-size: 0.875rem;
                font-weight: 500;
                color: #374151;
                margin-bottom: 0.5rem;
            }

            .required {
                color: #ef4444;
                font-weight: 600;
            }

            .enhanced-input,
            .enhanced-select,
            .enhanced-textarea {
                width: 100%;
                padding: 0.75rem 1rem;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 0.875rem;
                background: white;
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            .enhanced-input:focus,
            .enhanced-select:focus,
            .enhanced-textarea:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .enhanced-textarea {
                resize: vertical;
                min-height: 80px;
                font-family: inherit;
            }

            .select-wrapper {
                position: relative;
            }

            .select-arrow {
                position: absolute;
                right: 1rem;
                top: 50%;
                transform: translateY(-50%);
                pointer-events: none;
                color: #9ca3af;
            }

            .input-hint {
                font-size: 0.75rem;
                color: #6b7280;
                margin-top: 0.25rem;
                line-height: 1.4;
            }

            /* Color Selection */
            .color-selection {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .enhanced-color-input {
                width: 48px;
                height: 48px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                cursor: pointer;
                padding: 0;
            }

            .color-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 0.5rem;
                flex: 1;
            }

            .color-option {
                width: 32px;
                height: 32px;
                border: 2px solid transparent;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                background-clip: padding-box;
            }

            .color-option:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }

            .color-option.active {
                border-color: #1e293b;
                transform: scale(1.1);
                box-shadow: 0 0 0 2px white, 0 0 0 4px #1e293b;
            }

            /* Footer */
            .enhanced-modal-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 1rem;
                padding: 1.5rem 2rem 2rem 2rem;
                border-top: 1px solid #f1f5f9;
                background: #f8fafc;
            }

            .btn-cancel,
            .btn-create {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                border: none;
            }

            .btn-cancel {
                background: #f1f5f9;
                color: #64748b;
            }

            .btn-cancel:hover {
                background: #e2e8f0;
                color: #475569;
            }

            .btn-create {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }

            .btn-create:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
            }

            /* Responsive */
            @media (max-width: 640px) {
                .enhanced-modal-container {
                    margin: 1rem;
                    max-height: calc(100vh - 2rem);
                }

                .enhanced-modal-header,
                .enhanced-modal-body,
                .enhanced-modal-footer {
                    padding-left: 1.5rem;
                    padding-right: 1.5rem;
                }

                .input-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .color-grid {
                    grid-template-columns: repeat(4, 1fr);
                }

                .enhanced-modal-footer {
                    flex-direction: column-reverse;
                    gap: 0.75rem;
                }

                .btn-cancel,
                .btn-create {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize enhanced project modal when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for project manager to be available
    const initEnhancedModal = () => {
        if (window.projectManager) {
            window.enhancedProjectModal = new EnhancedProjectModal(window.projectManager);
            
            // Replace the original showNewProjectModal method
            window.projectManager.showNewProjectModal = () => {
                window.enhancedProjectModal.show();
            };
            
            // Add createProjectFromData method if it doesn't exist
            if (!window.projectManager.createProjectFromData) {
                window.projectManager.createProjectFromData = async function(projectData) {
                    // Use existing createProject logic with the form data
                    const form = document.createElement('form');
                    Object.entries(projectData).forEach(([key, value]) => {
                        const input = document.createElement('input');
                        input.name = key;
                        input.value = value;
                        form.appendChild(input);
                    });
                    
                    // Temporarily replace the form query with our created form
                    const originalQuery = document.getElementById;
                    document.getElementById = (id) => {
                        if (id === 'enhanced-project-form') return form;
                        return originalQuery.call(document, id);
                    };
                    
                    try {
                        await this.createProject();
                        return true;
                    } catch (error) {
                        throw error;
                    } finally {
                        document.getElementById = originalQuery;
                    }
                };
            }
            
            console.log('✅ Enhanced project modal initialized');
        } else {
            setTimeout(initEnhancedModal, 100);
        }
    };
    
    initEnhancedModal();
});