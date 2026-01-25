// Recipe Review Management System for Iterum R&D Chef Notebook
// Handles the review workflow for newly uploaded recipes

class RecipeReviewManager {
    constructor() {
        this.pendingRecipes = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.selectedRecipes = new Set();
        this.currentFilePreview = null;
        this.editMode = false;
        this.originalRecipeData = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadPendingReviews();
    }
    
    setupEventListeners() {
        // Pending reviews button
        const pendingReviewsBtn = document.getElementById('show-pending-reviews');
        if (pendingReviewsBtn) {
            pendingReviewsBtn.addEventListener('click', () => this.showPendingReviews());
        }
        
        // Review modal controls
        const reviewModal = document.getElementById('review-modal');
        if (reviewModal) {
            const closeBtn = reviewModal.querySelector('#close-review-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideReviewModal());
            }
        }
        
        // Review actions
        const approveAllBtn = document.getElementById('approve-all-recipes');
        const rejectAllBtn = document.getElementById('reject-all-recipes');
        const approveSelectedBtn = document.getElementById('approve-selected-recipes');
        const rejectSelectedBtn = document.getElementById('reject-selected-recipes');
        
        if (approveAllBtn) approveAllBtn.addEventListener('click', () => this.batchReview('approve', 'all'));
        if (rejectAllBtn) rejectAllBtn.addEventListener('click', () => this.batchReview('reject', 'all'));
        if (approveSelectedBtn) approveSelectedBtn.addEventListener('click', () => this.batchReview('approve', 'selected'));
        if (rejectSelectedBtn) rejectSelectedBtn.addEventListener('click', () => this.batchReview('reject', 'selected'));
        
        // Selection controls
        const selectAllBtn = document.getElementById('select-all-recipes');
        const clearSelectionBtn = document.getElementById('clear-selection');
        
        if (selectAllBtn) selectAllBtn.addEventListener('click', () => this.selectAllRecipes());
        if (clearSelectionBtn) clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        
        // File preview actions
        const downloadFileBtn = document.getElementById('download-original-file');
        const openLocationBtn = document.getElementById('open-file-location');
        
        if (downloadFileBtn) downloadFileBtn.addEventListener('click', () => this.downloadOriginalFile());
        if (openLocationBtn) openLocationBtn.addEventListener('click', () => this.openFileLocation());
        
        // Edit mode controls
        const toggleEditBtn = document.getElementById('toggle-edit-mode');
        const saveEditsBtn = document.getElementById('save-edits');
        const cancelEditsBtn = document.getElementById('cancel-edits');
        
        if (toggleEditBtn) toggleEditBtn.addEventListener('click', () => this.toggleEditMode());
        if (saveEditsBtn) saveEditsBtn.addEventListener('click', () => this.saveEdits());
        if (cancelEditsBtn) cancelEditsBtn.addEventListener('click', () => this.cancelEdits());
        
        // Edit form controls
        const addIngredientBtn = document.getElementById('add-edit-ingredient');
        const addInstructionBtn = document.getElementById('add-edit-instruction');
        const addTagBtn = document.getElementById('add-edit-tag');
        
        if (addIngredientBtn) addIngredientBtn.addEventListener('click', () => this.addEditIngredient());
        if (addInstructionBtn) addInstructionBtn.addEventListener('click', () => this.addEditInstruction());
        if (addTagBtn) addTagBtn.addEventListener('click', () => this.addEditTag());
        
        // Tag input enter key
        const tagInput = document.getElementById('edit-add-tag');
        if (tagInput) {
            tagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addEditTag();
                }
            });
        }
    }
    
    // Show pending reviews modal
    showPendingReviews() {
        const modal = document.getElementById('review-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadPendingReviews();
        }
    }
    
    // Hide review modal
    hideReviewModal() {
        const modal = document.getElementById('review-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.selectedRecipes.clear();
            this.currentFilePreview = null;
            this.updateSelectionUI();
            this.clearFilePreview();
        }
    }
    
    // Load pending reviews from both localStorage and backend
    async loadPendingReviews() {
        try {
            // 1. Load local pending recipes
            let pendingLocal = [];
            try {
                pendingLocal = JSON.parse(localStorage.getItem('pendingRecipes') || '[]').map(r => ({ ...r, _source: 'Uploaded' }));
            } catch (e) {
                console.warn('Could not load local pending recipes:', e);
                pendingLocal = [];
            }

            // 2. Load DB pending recipes with enhanced error handling
            let pendingDB = [];
            let dbConnectionStatus = 'unknown';
            
            try {
                // Add timeout to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(`/api/recipes/review/pending?page=${this.currentPage}&limit=${this.itemsPerPage}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    pendingDB = (data.recipes || []).map(r => ({ ...r, _source: 'Database' }));
                    dbConnectionStatus = 'connected';
                    console.log(`✅ Loaded ${pendingDB.length} recipes from database`);
                } else {
                    dbConnectionStatus = 'error';
                    console.warn(`⚠️ API returned ${response.status}: ${response.statusText}`);
                    
                    // Show user-friendly message for specific errors
                    if (response.status === 404) {
                        console.info('📝 Recipe review endpoint not implemented yet - using local storage only');
                    } else if (response.status === 500) {
                        console.warn('🔧 Database server error - using local storage only');
                    }
                }
            } catch (e) {
                dbConnectionStatus = 'offline';
                if (e.name === 'AbortError') {
                    console.warn('⏱️ Database connection timeout - server may be down');
                } else if (e.message.includes('Failed to fetch')) {
                    console.warn('🔌 Cannot connect to backend server - using offline mode');
                } else {
                    console.warn('❌ Database connection error:', e.message);
                }
            }

            // 3. Merge both sources
            this.pendingRecipes = [...pendingLocal, ...pendingDB];
            
            // 4. Show connection status to user
            this.showConnectionStatus(dbConnectionStatus, pendingLocal.length, pendingDB.length);
            
            this.displayPendingReviews();
            this.updateReviewStats();
            
        } catch (error) {
            console.error('Error in loadPendingReviews:', error);
            
            // Fallback to just local recipes
            try {
                const fallbackLocal = JSON.parse(localStorage.getItem('pendingRecipes') || '[]');
                this.pendingRecipes = fallbackLocal.map(r => ({ ...r, _source: 'Uploaded' }));
                this.displayPendingReviews();
                this.updateReviewStats();
                this.showUserMessage('Using offline mode - only locally stored recipes available', 'warning');
            } catch (fallbackError) {
                console.error('Complete failure loading reviews:', fallbackError);
                this.pendingRecipes = [];
                this.displayPendingReviews();
                this.showUserMessage('Unable to load recipes. Please refresh the page.', 'error');
            }
        }
    }

    // Show connection status to users
    showConnectionStatus(status, localCount, dbCount) {
        const statusContainer = document.getElementById('review-status-indicator');
        if (!statusContainer) return;

        let statusHTML = '';
        switch (status) {
            case 'connected':
                statusHTML = `
                    <div class="flex items-center gap-2 text-green-600 text-sm">
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        Connected • ${localCount} local + ${dbCount} database recipes
                    </div>
                `;
                break;
            case 'error':
                statusHTML = `
                    <div class="flex items-center gap-2 text-orange-600 text-sm">
                        <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Database error • Using ${localCount} local recipes only
                    </div>
                `;
                break;
            case 'offline':
                statusHTML = `
                    <div class="flex items-center gap-2 text-blue-600 text-sm">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Offline mode • ${localCount} local recipes available
                    </div>
                `;
                break;
            default:
                statusHTML = `
                    <div class="flex items-center gap-2 text-gray-600 text-sm">
                        <div class="w-2 h-2 bg-gray-500 rounded-full"></div>
                        ${localCount} recipes loaded
                    </div>
                `;
        }
        
        statusContainer.innerHTML = statusHTML;
    }

    // Show user messages
    showUserMessage(message, type = 'info') {
        // You can implement this based on your notification system
        // For now, just log to console
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // If you have a toast/notification system, use it here
        if (window.showNotification) {
            window.showNotification(message, type);
        }
    }
    
    // Display pending reviews in the modal
    displayPendingReviews() {
        const container = document.getElementById('pending-reviews-container');
        if (!container) return;
        
        if (this.pendingRecipes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">✅</div>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">No recipes pending review</h3>
                    <p class="text-gray-500">All uploaded recipes have been reviewed!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        this.pendingRecipes.forEach(recipe => {
            const recipeCard = this.createReviewCard(recipe);
            container.appendChild(recipeCard);
        });
    }
    
    // Create a review card for a recipe
    createReviewCard(recipe) {
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer';
        card.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0">
                    <input type="checkbox" class="recipe-checkbox" data-recipe-id="${recipe.id}" 
                           ${this.selectedRecipes.has(recipe.id) ? 'checked' : ''}>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-semibold text-gray-800">${recipe.title}</h3>
                        <div class="flex gap-2">
                            <button class="approve-recipe bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm" 
                                    data-recipe-id="${recipe.id}">
                                ✅ Approve
                            </button>
                            <button class="reject-recipe bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" 
                                    data-recipe-id="${recipe.id}">
                                ❌ Reject
                            </button>
                        </div>
                    </div>
                    
                    <p class="text-sm text-gray-600 mb-2">${recipe.description || 'No description'}</p>
                    
                    <div class="flex gap-4 text-xs text-gray-500 mb-3">
                        <span>📁 ${recipe.category || 'Uncategorized'}</span>
                        <span>🌍 ${recipe.cuisine_type || 'Unknown'}</span>
                        <span>👥 ${recipe.servings || 'Unknown'} servings</span>
                        <span>⏱️ ${(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                    </div>
                    
                    <div class="text-xs text-gray-400">
                        📅 Imported: ${recipe.imported_at ? new Date(recipe.imported_at).toLocaleDateString() : 'Unknown'}
                        ${recipe.source ? `<br>📄 Source: ${recipe.source}` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        const checkbox = card.querySelector('.recipe-checkbox');
        const approveBtn = card.querySelector('.approve-recipe');
        const rejectBtn = card.querySelector('.reject-recipe');
        
        // Make entire card clickable for file preview
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !e.target.closest('input')) {
                this.showFilePreview(recipe);
            }
        });
        
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            if (e.target.checked) {
                this.selectedRecipes.add(recipe.id);
            } else {
                this.selectedRecipes.delete(recipe.id);
            }
            this.updateSelectionUI();
        });
        
        approveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.reviewRecipe(recipe.id, 'approve');
        });
        
        rejectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.reviewRecipe(recipe.id, 'reject');
        });
        
        return card;
    }
    
    // Show file preview for a recipe
    async showFilePreview(recipe) {
        this.currentFilePreview = recipe;
        
        // Update file info
        const fileInfo = document.getElementById('file-info');
        if (fileInfo) {
            fileInfo.textContent = `Source: ${recipe.source || 'Unknown file'}`;
        }
        
        // Try to load the original file content
        await this.loadFileContent(recipe);
        
        // Enable file action buttons
        const downloadBtn = document.getElementById('download-original-file');
        const openLocationBtn = document.getElementById('open-file-location');
        
        if (downloadBtn) downloadBtn.disabled = false;
        if (openLocationBtn) openLocationBtn.disabled = false;
    }
    
    // Load file content for preview
    async loadFileContent(recipe) {
        const contentDiv = document.getElementById('file-preview-content');
        if (!contentDiv) return;
        
        // Show loading state
        contentDiv.innerHTML = `
            <div class="text-center py-8">
                <div class="text-2xl mb-2">⏳</div>
                <p class="text-gray-600">Loading file content...</p>
            </div>
        `;
        
        try {
            // Try to get the original file content from the backend
            const response = await fetch(`/api/recipes/${recipe.id}/original-file`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayFileContent(data.content, data.filename, data.file_type);
            } else {
                // Fallback: show recipe data as file content
                this.displayRecipeAsFile(recipe);
            }
        } catch (error) {
            console.error('Error loading file content:', error);
            this.displayRecipeAsFile(recipe);
        }
    }
    
    // Display file content in the preview panel
    displayFileContent(content, filename, fileType) {
        const contentDiv = document.getElementById('file-preview-content');
        if (!contentDiv) return;
        
        let displayContent = '';
        
        if (fileType === 'text' || fileType === 'txt') {
            // Display as formatted text
            displayContent = `
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h5 class="font-semibold mb-3">${filename}</h5>
                    <pre class="whitespace-pre-wrap text-sm text-gray-800 font-mono">${content}</pre>
                </div>
            `;
        } else if (fileType === 'csv') {
            // Display as table
            const lines = content.split('\n');
            const tableRows = lines.map(line => {
                const cells = line.split(',').map(cell => `<td class="px-2 py-1 border">${cell.trim()}</td>`);
                return `<tr>${cells.join('')}</tr>`;
            }).join('');
            
            displayContent = `
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h5 class="font-semibold mb-3">${filename}</h5>
                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse border border-gray-300">
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            // Generic display
            displayContent = `
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h5 class="font-semibold mb-3">${filename}</h5>
                    <div class="text-sm text-gray-800">${content}</div>
                </div>
            `;
        }
        
        contentDiv.innerHTML = displayContent;
    }
    
    // Display recipe data as file content (fallback)
    displayRecipeAsFile(recipe) {
        const contentDiv = document.getElementById('file-preview-content');
        if (!contentDiv) return;
        
        const content = `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-semibold mb-3">Recipe Data (${recipe.title})</h5>
                <div class="space-y-3 text-sm">
                    <div><strong>Title:</strong> ${recipe.title}</div>
                    <div><strong>Description:</strong> ${recipe.description || 'No description'}</div>
                    <div><strong>Category:</strong> ${recipe.category || 'Uncategorized'}</div>
                    <div><strong>Cuisine:</strong> ${recipe.cuisine_type || 'Unknown'}</div>
                    <div><strong>Servings:</strong> ${recipe.servings || 'Unknown'}</div>
                    <div><strong>Prep Time:</strong> ${recipe.prep_time || 0} min</div>
                    <div><strong>Cook Time:</strong> ${recipe.cook_time || 0} min</div>
                    <div><strong>Difficulty:</strong> ${recipe.difficulty_level || 'Unknown'}</div>
                    <div><strong>Tags:</strong> ${(recipe.tags || []).join(', ') || 'None'}</div>
                    <div><strong>Source:</strong> ${recipe.source || 'Unknown'}</div>
                    <div><strong>Imported:</strong> ${recipe.imported_at ? new Date(recipe.imported_at).toLocaleString() : 'Unknown'}</div>
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = content;
    }
    
    // Clear file preview
    clearFilePreview() {
        const contentDiv = document.getElementById('file-preview-content');
        const fileInfo = document.getElementById('file-info');
        const downloadBtn = document.getElementById('download-original-file');
        const openLocationBtn = document.getElementById('open-file-location');
        
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">📄</div>
                    <p>Select a recipe to view the original file content</p>
                </div>
            `;
        }
        
        if (fileInfo) fileInfo.textContent = 'Select a recipe to view the original file';
        if (downloadBtn) downloadBtn.disabled = true;
        if (openLocationBtn) openLocationBtn.disabled = true;
        
        this.currentFilePreview = null;
    }
    
    // Download original file
    async downloadOriginalFile() {
        if (!this.currentFilePreview) return;
        
        try {
            const response = await fetch(`/api/recipes/${this.currentFilePreview.id}/download-original`, {
                method: 'GET'
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = this.currentFilePreview.source || 'recipe-file';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                this.showNotification('Failed to download original file', 'error');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            this.showNotification('Error downloading file', 'error');
        }
    }
    
    // Open file location
    openFileLocation() {
        if (!this.currentFilePreview) return;
        
        // This would typically open the file location in the file explorer
        // For now, we'll show a notification
        this.showNotification('File location feature not implemented yet', 'info');
    }
    
    // Select all recipes
    selectAllRecipes() {
        this.pendingRecipes.forEach(recipe => {
            this.selectedRecipes.add(recipe.id);
        });
        this.updateSelectionUI();
        this.updateCheckboxes();
    }
    
    // Clear selection
    clearSelection() {
        this.selectedRecipes.clear();
        this.updateSelectionUI();
        this.updateCheckboxes();
    }
    
    // Update checkboxes to match selection
    updateCheckboxes() {
        document.querySelectorAll('.recipe-checkbox').forEach(checkbox => {
            const recipeId = parseInt(checkbox.dataset.recipeId);
            checkbox.checked = this.selectedRecipes.has(recipeId);
        });
    }
    
    // Update reviewRecipe to handle both sources
    async reviewRecipe(recipeId, action) {
        // Find the recipe and its source
        const recipe = this.pendingRecipes.find(r => r.id === recipeId);
        const source = recipe?._source;
        let notes = '';
        if (action === 'approve' || action === 'reject') {
            notes = prompt(`Enter review notes for ${action}ing this recipe (optional):`) || '';
        }
        try {
            if (source === 'Uploaded') {
                // Approve: POST to /api/recipes/ then remove from localStorage
                if (action === 'approve') {
                    const payload = {
                        title: recipe.title || recipe.name,
                        ingredients: (recipe.ingredients||[]).map(i=>typeof i==="string"?{name:i,amount:0,unit:''}:i),
                        instructions: (recipe.instructions||recipe.steps||[]).map(i=>typeof i==="string"?{instruction:i}:i),
                        status: 'pending',
                        author_id: getCurrentUserId(), // Add author_id
                        // Add more fields as needed
                    };
                    const res = await fetch('/api/recipes/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        // Remove from localStorage
                        let pending = JSON.parse(localStorage.getItem('pendingRecipes') || '[]');
                        pending = pending.filter(r => r.id !== recipeId);
                        localStorage.setItem('pendingRecipes', JSON.stringify(pending));
                        this.showNotification('Recipe approved and saved to database', 'success');
                    } else {
                        this.showNotification('Failed to save recipe to database.', 'error');
                        return;
                    }
                } else {
                    // Reject: just remove from localStorage
                    let pending = JSON.parse(localStorage.getItem('pendingRecipes') || '[]');
                    pending = pending.filter(r => r.id !== recipeId);
                    localStorage.setItem('pendingRecipes', JSON.stringify(pending));
                    this.showNotification('Recipe rejected and removed from uploads', 'success');
                }
            } else {
                // Database recipe: POST to /api/recipes/{id}/review
                const res = await fetch(`/api/recipes/${recipeId}/review`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected', notes })
                });
                if (res.ok) {
                    this.showNotification(`Recipe ${action}d successfully`, 'success');
                } else {
                    this.showNotification(`Failed to ${action} recipe`, 'error');
                    return;
                }
            }
            // Remove from pending list and update UI
            this.pendingRecipes = this.pendingRecipes.filter(r => r.id !== recipeId);
            this.selectedRecipes.delete(recipeId);
            if (this.currentFilePreview && this.currentFilePreview.id === recipeId) {
                this.clearFilePreview();
            }
            this.displayPendingReviews();
            this.updateReviewStats();
        } catch (error) {
            console.error(`Error ${action}ing recipe:`, error);
            this.showNotification(`Error ${action}ing recipe`, 'error');
        }
    }
    
    // Batch review recipes
    async batchReview(action, scope) {
        let recipeIds = [];
        
        if (scope === 'all') {
            recipeIds = this.pendingRecipes.map(r => r.id);
        } else if (scope === 'selected') {
            recipeIds = Array.from(this.selectedRecipes);
        }
        
        if (recipeIds.length === 0) {
            this.showNotification('No recipes selected for review', 'warning');
            return;
        }
        
        const notes = prompt(`Enter review notes for ${action}ing ${recipeIds.length} recipes (optional):`);
        
        try {
            const formData = new FormData();
            formData.append('action', action);
            formData.append('notes', notes || '');
            
            // Add recipe IDs
            recipeIds.forEach(id => formData.append('recipe_ids', id));
            
            const response = await fetch('/api/recipes/review/batch', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification(
                    `Successfully ${action}d ${result.successful} recipes (${result.failed} failed)`, 
                    'success'
                );
                
                // Remove reviewed recipes from pending list
                this.pendingRecipes = this.pendingRecipes.filter(r => !recipeIds.includes(r.id));
                this.selectedRecipes.clear();
                
                // Clear file preview if current recipe was reviewed
                if (this.currentFilePreview && recipeIds.includes(this.currentFilePreview.id)) {
                    this.clearFilePreview();
                }
                
                this.displayPendingReviews();
                this.updateReviewStats();
            } else {
                this.showNotification(`Failed to ${action} recipes`, 'error');
            }
        } catch (error) {
            console.error(`Error batch ${action}ing recipes:`, error);
            this.showNotification(`Error ${action}ing recipes`, 'error');
        }
    }
    
    // Update selection UI
    updateSelectionUI() {
        const selectedCount = this.selectedRecipes.size;
        const totalCount = this.pendingRecipes.length;
        
        // Update selection text
        const selectionText = document.getElementById('selection-text');
        if (selectionText) {
            selectionText.textContent = `${selectedCount} of ${totalCount} recipes selected`;
        }
        
        // Update button states
        const approveSelectedBtn = document.getElementById('approve-selected-recipes');
        const rejectSelectedBtn = document.getElementById('reject-selected-recipes');
        
        if (approveSelectedBtn) {
            approveSelectedBtn.disabled = selectedCount === 0;
            approveSelectedBtn.classList.toggle('opacity-50', selectedCount === 0);
        }
        
        if (rejectSelectedBtn) {
            rejectSelectedBtn.disabled = selectedCount === 0;
            rejectSelectedBtn.classList.toggle('opacity-50', selectedCount === 0);
        }
    }
    
    // Update review statistics
    updateReviewStats() {
        const pendingCount = this.pendingRecipes.length;
        
        // Update the pending reviews button
        const pendingReviewsBtn = document.getElementById('show-pending-reviews');
        if (pendingReviewsBtn) {
            if (pendingCount > 0) {
                pendingReviewsBtn.innerHTML = `🔍 Pending Review (${pendingCount})`;
                pendingReviewsBtn.classList.add('animate-pulse');
            } else {
                pendingReviewsBtn.innerHTML = '🔍 Pending Review';
                pendingReviewsBtn.classList.remove('animate-pulse');
            }
        }
        
        // Update stats in modal
        const statsElement = document.getElementById('review-stats');
        if (statsElement) {
            statsElement.textContent = `${pendingCount} recipes pending review`;
        }
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    // Get current user
    getCurrentUser() {
        const currentUser = localStorage.getItem('current_user');
        return currentUser ? JSON.parse(currentUser) : null;
    }

    // Helper to get current user ID
    getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('current_user') || '{}');
        return user && user.id ? user.id : null;
    }

    // Toggle edit mode
    toggleEditMode() {
        if (!this.currentFilePreview) {
            this.showNotification('Please select a recipe to edit', 'warning');
            return;
        }
        
        this.editMode = !this.editMode;
        this.updateEditModeUI();
        
        if (this.editMode) {
            this.populateEditForm();
        } else {
            this.showFilePreview(this.currentFilePreview);
        }
    }
    
    // Update edit mode UI
    updateEditModeUI() {
        const toggleBtn = document.getElementById('toggle-edit-mode');
        const saveBtn = document.getElementById('save-edits');
        const cancelBtn = document.getElementById('cancel-edits');
        const editForm = document.getElementById('recipe-edit-form');
        const filePreview = document.getElementById('file-preview-content');
        
        if (this.editMode) {
            if (toggleBtn) toggleBtn.textContent = '👁️ View File';
            if (saveBtn) saveBtn.classList.remove('hidden');
            if (cancelBtn) cancelBtn.classList.remove('hidden');
            if (editForm) editForm.classList.remove('hidden');
            if (filePreview) filePreview.classList.add('hidden');
        } else {
            if (toggleBtn) toggleBtn.textContent = '✏️ Quick Edit';
            if (saveBtn) saveBtn.classList.add('hidden');
            if (cancelBtn) cancelBtn.classList.add('hidden');
            if (editForm) editForm.classList.add('hidden');
            if (filePreview) filePreview.classList.remove('hidden');
        }
    }
    
    // Populate edit form with current recipe data
    populateEditForm() {
        if (!this.currentFilePreview) return;
        
        const recipe = this.currentFilePreview;
        this.originalRecipeData = JSON.parse(JSON.stringify(recipe)); // Deep copy
        
        // Basic info
        document.getElementById('edit-recipe-name').value = recipe.title || '';
        document.getElementById('edit-recipe-category').value = recipe.category || 'Imported';
        document.getElementById('edit-recipe-cuisine').value = recipe.cuisine_type || 'Unknown';
        document.getElementById('edit-recipe-servings').value = recipe.servings || 4;
        document.getElementById('edit-recipe-difficulty').value = recipe.difficulty_level || 'Medium';
        document.getElementById('edit-recipe-prep-time').value = recipe.prep_time || 0;
        document.getElementById('edit-recipe-cook-time').value = recipe.cook_time || 0;
        document.getElementById('edit-recipe-description').value = recipe.description || '';
        
        // Ingredients
        this.populateIngredients(recipe.ingredients || []);
        
        // Instructions
        this.populateInstructions(recipe.instructions || []);
        
        // Tags
        this.populateTags(recipe.tags || []);
    }
    
    // Populate ingredients in edit form
    populateIngredients(ingredients) {
        const container = document.getElementById('edit-ingredients-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        ingredients.forEach((ingredient, index) => {
            const ingredientDiv = document.createElement('div');
            ingredientDiv.className = 'flex gap-2 items-center';
            ingredientDiv.innerHTML = `
                <input type="text" placeholder="Ingredient name" value="${ingredient.name || ''}" 
                       class="notebook-input flex-1 ingredient-name">
                <input type="number" placeholder="Amount" value="${ingredient.amount || ''}" step="0.01" min="0" 
                       class="notebook-input w-24 ingredient-amount">
                <select class="notebook-input w-24 ingredient-unit">
                    <option value="">Unit</option>
                    <option value="g" ${ingredient.unit === 'g' ? 'selected' : ''}>g</option>
                    <option value="kg" ${ingredient.unit === 'kg' ? 'selected' : ''}>kg</option>
                    <option value="ml" ${ingredient.unit === 'ml' ? 'selected' : ''}>ml</option>
                    <option value="L" ${ingredient.unit === 'L' ? 'selected' : ''}>L</option>
                    <option value="cup" ${ingredient.unit === 'cup' ? 'selected' : ''}>cup</option>
                    <option value="tbsp" ${ingredient.unit === 'tbsp' ? 'selected' : ''}>tbsp</option>
                    <option value="tsp" ${ingredient.unit === 'tsp' ? 'selected' : ''}>tsp</option>
                    <option value="each" ${ingredient.unit === 'each' ? 'selected' : ''}>each</option>
                </select>
                <button type="button" class="remove-ingredient bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">×</button>
            `;
            
            container.appendChild(ingredientDiv);
            
            // Add remove event listener
            const removeBtn = ingredientDiv.querySelector('.remove-ingredient');
            removeBtn.addEventListener('click', () => ingredientDiv.remove());
        });
    }
    
    // Populate instructions in edit form
    populateInstructions(instructions) {
        const container = document.getElementById('edit-instructions-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        instructions.forEach((instruction, index) => {
            const instructionDiv = document.createElement('div');
            instructionDiv.className = 'flex gap-2 items-start';
            instructionDiv.innerHTML = `
                <span class="text-sm font-medium text-gray-600 mt-2">${index + 1}.</span>
                <textarea placeholder="Instruction step" class="notebook-textarea flex-1 instruction-text" rows="2">${instruction}</textarea>
                <button type="button" class="remove-instruction bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm mt-1">×</button>
            `;
            
            container.appendChild(instructionDiv);
            
            // Add remove event listener
            const removeBtn = instructionDiv.querySelector('.remove-instruction');
            removeBtn.addEventListener('click', () => instructionDiv.remove());
        });
    }
    
    // Populate tags in edit form
    populateTags(tags) {
        const container = document.getElementById('edit-tags-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'bg-orange-200 text-orange-800 px-2 py-1 rounded text-sm flex items-center gap-1';
            tagSpan.innerHTML = `
                ${tag}
                <button type="button" class="remove-tag text-orange-600 hover:text-orange-800">×</button>
            `;
            
            container.appendChild(tagSpan);
            
            // Add remove event listener
            const removeBtn = tagSpan.querySelector('.remove-tag');
            removeBtn.addEventListener('click', () => tagSpan.remove());
        });
    }
    
    // Add ingredient to edit form
    addEditIngredient() {
        const container = document.getElementById('edit-ingredients-container');
        if (!container) return;
        
        const ingredientDiv = document.createElement('div');
        ingredientDiv.className = 'flex gap-2 items-center';
        ingredientDiv.innerHTML = `
            <input type="text" placeholder="Ingredient name" class="notebook-input flex-1 ingredient-name">
            <input type="number" placeholder="Amount" step="0.01" min="0" class="notebook-input w-24 ingredient-amount">
            <select class="notebook-input w-24 ingredient-unit">
                <option value="">Unit</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="cup">cup</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
                <option value="each">each</option>
            </select>
            <button type="button" class="remove-ingredient bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">×</button>
        `;
        
        container.appendChild(ingredientDiv);
        
        // Add remove event listener
        const removeBtn = ingredientDiv.querySelector('.remove-ingredient');
        removeBtn.addEventListener('click', () => ingredientDiv.remove());
    }
    
    // Add instruction to edit form
    addEditInstruction() {
        const container = document.getElementById('edit-instructions-container');
        if (!container) return;
        
        const instructionDiv = document.createElement('div');
        instructionDiv.className = 'flex gap-2 items-start';
        const stepNumber = container.children.length + 1;
        instructionDiv.innerHTML = `
            <span class="text-sm font-medium text-gray-600 mt-2">${stepNumber}.</span>
            <textarea placeholder="Instruction step" class="notebook-textarea flex-1 instruction-text" rows="2"></textarea>
            <button type="button" class="remove-instruction bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm mt-1">×</button>
        `;
        
        container.appendChild(instructionDiv);
        
        // Add remove event listener
        const removeBtn = instructionDiv.querySelector('.remove-instruction');
        removeBtn.addEventListener('click', () => instructionDiv.remove());
    }
    
    // Add tag to edit form
    addEditTag() {
        const tagInput = document.getElementById('edit-add-tag');
        const container = document.getElementById('edit-tags-container');
        
        if (!tagInput || !container) return;
        
        const tag = tagInput.value.trim();
        if (!tag) return;
        
        const tagSpan = document.createElement('span');
        tagSpan.className = 'bg-orange-200 text-orange-800 px-2 py-1 rounded text-sm flex items-center gap-1';
        tagSpan.innerHTML = `
            ${tag}
            <button type="button" class="remove-tag text-orange-600 hover:text-orange-800">×</button>
        `;
        
        container.appendChild(tagSpan);
        tagInput.value = '';
        
        // Add remove event listener
        const removeBtn = tagSpan.querySelector('.remove-tag');
        removeBtn.addEventListener('click', () => tagSpan.remove());
    }
    
    // Save edits
    async saveEdits() {
        if (!this.currentFilePreview) return;
        
        try {
            const updatedRecipe = this.collectEditFormData();
            
            const response = await fetch(`/api/recipes/${this.currentFilePreview.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...updatedRecipe, author_id: getCurrentUserId() }) // Add author_id
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Update the current recipe data
                Object.assign(this.currentFilePreview, updatedRecipe);
                
                // Update the recipe card in the list
                this.updateRecipeCard(this.currentFilePreview);
                
                this.showNotification('Recipe updated successfully', 'success');
                this.toggleEditMode(); // Switch back to view mode
            } else {
                this.showNotification('Failed to update recipe', 'error');
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
            this.showNotification('Error saving recipe', 'error');
        }
    }
    
    // Collect data from edit form
    collectEditFormData() {
        const ingredients = [];
        const instructions = [];
        const tags = [];
        
        // Collect ingredients
        document.querySelectorAll('#edit-ingredients-container .ingredient-name').forEach((nameInput, index) => {
            const amountInput = nameInput.parentElement.querySelector('.ingredient-amount');
            const unitSelect = nameInput.parentElement.querySelector('.ingredient-unit');
            
            if (nameInput.value.trim()) {
                ingredients.push({
                    name: nameInput.value.trim(),
                    amount: parseFloat(amountInput.value) || 0,
                    unit: unitSelect.value,
                    order_index: index
                });
            }
        });
        
        // Collect instructions
        document.querySelectorAll('#edit-instructions-container .instruction-text').forEach((textArea, index) => {
            if (textArea.value.trim()) {
                instructions.push({
                    instruction: textArea.value.trim(),
                    step_number: index + 1
                });
            }
        });
        
        // Collect tags
        document.querySelectorAll('#edit-tags-container span').forEach(tagSpan => {
            const tagText = tagSpan.textContent.replace('×', '').trim();
            if (tagText) {
                tags.push(tagText);
            }
        });
        
        return {
            title: document.getElementById('edit-recipe-name').value,
            category: document.getElementById('edit-recipe-category').value,
            cuisine_type: document.getElementById('edit-recipe-cuisine').value,
            servings: parseInt(document.getElementById('edit-recipe-servings').value) || 4,
            difficulty_level: document.getElementById('edit-recipe-difficulty').value,
            prep_time: parseInt(document.getElementById('edit-recipe-prep-time').value) || 0,
            cook_time: parseInt(document.getElementById('edit-recipe-cook-time').value) || 0,
            description: document.getElementById('edit-recipe-description').value,
            ingredients: ingredients,
            instructions: instructions,
            tags: tags
        };
    }
    
    // Cancel edits
    cancelEdits() {
        this.toggleEditMode();
        this.showNotification('Edits cancelled', 'info');
    }
    
    // Update recipe card in the list
    updateRecipeCard(recipe) {
        // Find and update the recipe card
        const recipeCards = document.querySelectorAll('.recipe-card');
        recipeCards.forEach(card => {
            const recipeId = card.dataset.recipeId;
            if (recipeId == recipe.id) {
                // Update the card content
                const titleElement = card.querySelector('h3');
                if (titleElement) titleElement.textContent = recipe.title;
                
                const descriptionElement = card.querySelector('p');
                if (descriptionElement) descriptionElement.textContent = recipe.description || 'No description';
                
                // Update other elements as needed
                const categoryElement = card.querySelector('.category');
                if (categoryElement) categoryElement.textContent = recipe.category || 'Uncategorized';
                
                const cuisineElement = card.querySelector('.cuisine');
                if (cuisineElement) cuisineElement.textContent = recipe.cuisine_type || 'Unknown';
            }
        });
    }
}

// Initialize recipe review manager when DOM is loaded
let recipeReviewManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        recipeReviewManager = new RecipeReviewManager();
    });
} else {
    recipeReviewManager = new RecipeReviewManager();
}

// Export for use in other scripts
window.RecipeReviewManager = RecipeReviewManager;
window.recipeReviewManager = recipeReviewManager; 