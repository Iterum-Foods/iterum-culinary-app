class MenuManager {
	constructor() {
		this.menu = this.createEmptyMenu();
		this.userId = this.getCurrentUserId();
		this.projectId = this.getCurrentProjectId();
		this.storageKey = this.buildStorageKey();
		this.categoryIdCounter = 1;
		this.itemIdCounter = 1;

		this.loadFromStorage();
		this.renderAll();
	}

	createEmptyMenu() {
		return {
			id: Date.now(),
			name: '',
			type: '',
			description: '',
			season: '',
			validUntil: '',
			categories: [],
			createdAt: new Date().toISOString(),
			createdBy: null,
			projectId: null
		};
	}

	getCurrentUserId() {
		try {
			const user = (window.userSystem && window.userSystem.getCurrentUser && window.userSystem.getCurrentUser()) || null;
			return user?.id || user?.userId || 'guest';
		} catch { return 'guest'; }
	}

	getCurrentProjectId() {
		try {
			const stored = localStorage.getItem('iterum_current_project');
			if (stored) {
				const p = JSON.parse(stored);
				return p?.id || p?.projectId || 'master';
			}
			return 'master';
		} catch { return 'master'; }
	}

	buildStorageKey() {
		return `iterum_menu_draft_${this.userId}_${this.projectId}`;
	}

	loadFromStorage() {
		try {
			const raw = localStorage.getItem(this.storageKey);
			if (raw) {
				const parsed = JSON.parse(raw);
				this.menu = parsed;
				// recover id counters
				const allItemIds = this.menu.categories.flatMap(c => c.items.map(i => i.id));
				const allCategoryIds = this.menu.categories.map(c => c.id);
				this.itemIdCounter = (allItemIds.length ? Math.max(...allItemIds) : 0) + 1;
				this.categoryIdCounter = (allCategoryIds.length ? Math.max(...allCategoryIds) : 0) + 1;
			}
		} catch {}
	}

	saveToStorage() {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(this.menu));
		} catch {}
	}

	// Form sync
	syncFromForm() {
		const nameEl = document.getElementById('menu-name');
		const typeEl = document.getElementById('menu-type');
		const descEl = document.getElementById('menu-description');
		const seasonEl = document.getElementById('menu-season');
		const validEl = document.getElementById('menu-validity');
		if (nameEl) this.menu.name = nameEl.value.trim();
		if (typeEl) this.menu.type = typeEl.value;
		if (descEl) this.menu.description = descEl.value.trim();
		if (seasonEl) this.menu.season = seasonEl.value;
		if (validEl) this.menu.validUntil = validEl.value;
		this.menu.createdBy = this.userId;
		this.menu.projectId = this.projectId;
	}

	renderAll() {
		this.syncFromForm();
		this.renderCategories();
		this.updatePricingSummary();
		this.updatePreview();
	}

	addCategory(name = '') {
		const newCategory = {
			id: this.categoryIdCounter++,
			name: name || `New Category ${this.categoryIdCounter - 1}`,
			items: []
		};
		this.menu.categories.push(newCategory);
		this.saveToStorage();
		this.renderAll();
	}

	addItem(categoryId, item) {
		const category = this.menu.categories.find(c => c.id === categoryId) || this.ensureDefaultCategory();
		const newItem = {
			id: this.itemIdCounter++,
			name: item?.name || 'New Item',
			description: item?.description || '',
			price: item?.price != null ? Number(item.price) : null
		};
		category.items.push(newItem);
		this.saveToStorage();
		this.renderAll();
	}

	ensureDefaultCategory() {
		if (this.menu.categories.length === 0) {
			this.addCategory('Uncategorized');
		}
		return this.menu.categories[0];
	}

	applyImportedItems(items = []) {
		// Group by category
		const byCategory = new Map();
		for (const it of items) {
			const cat = it.category || 'Uncategorized';
			if (!byCategory.has(cat)) byCategory.set(cat, []);
			byCategory.get(cat).push(it);
		}
		// Ensure categories exist and add items
		for (const [catName, catItems] of byCategory.entries()) {
			let category = this.menu.categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
			if (!category) {
				category = { id: this.categoryIdCounter++, name: catName, items: [] };
				this.menu.categories.push(category);
			}
			for (const it of catItems) {
				category.items.push({
					id: this.itemIdCounter++,
					name: it.name || 'Imported Item',
					description: it.description || '',
					price: it.price != null ? Number(it.price) : null
				});
			}
		}
		this.saveToStorage();
		this.renderAll();
	}

	removeCategory(categoryId) {
		this.menu.categories = this.menu.categories.filter(c => c.id !== categoryId);
		this.saveToStorage();
		this.renderAll();
	}

	removeItem(categoryId, itemId) {
		const category = this.menu.categories.find(c => c.id === categoryId);
		if (!category) return;
		category.items = category.items.filter(i => i.id !== itemId);
		this.saveToStorage();
		this.renderAll();
	}

	renderCategories() {
		const container = document.getElementById('categories-container');
		if (!container) return;
		if (this.menu.categories.length === 0) {
			container.innerHTML = `
				<div class="empty-state">
					<div class="empty-state-icon">📂</div>
					<h4>No Categories Yet</h4>
					<p>Start by adding your first menu category</p>
					<button class="btn btn-primary" onclick="menuManager.addCategory()"><span>➕</span><span>Add First Category</span></button>
				</div>
			`;
			return;
		}
		container.innerHTML = this.menu.categories.map(c => this.renderCategoryCard(c)).join('');
	}

	renderCategoryCard(category) {
		const itemsHtml = category.items.length === 0
			? '<div class="text-sm text-gray-500">No items yet</div>'
			: category.items.map(i => `
				<div class="flex justify-between items-center p-3 border-b last:border-0">
					<div>
						<div class="font-semibold text-gray-800">${this.escape(i.name)}</div>
						${i.description ? `<div class=\"text-sm text-gray-500\">${this.escape(i.description)}</div>` : ''}
					</div>
					<div class="flex items-center gap-2">
						<div class="font-semibold text-emerald-600">${i.price != null ? `$${Number(i.price).toFixed(2)}` : ''}</div>
						<button class="btn btn-sm btn-secondary" onclick="menuManager.removeItem(${category.id}, ${i.id})">🗑️</button>
					</div>
				</div>
			`).join('');
		return `
			<div class="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
				<div class="flex justify-between items-center p-4 border-b">
					<div class="flex items-center gap-2">
						<span>📂</span>
						<input class="form-input" value="${this.escape(category.name)}" onchange="menuManager.renameCategory(${category.id}, this.value)">
					</div>
					<div class="flex items-center gap-2">
						<button class="btn btn-sm btn-primary" onclick="menuManager.addItem(${category.id}, { name: 'New Item' })">➕ Add Item</button>
						<button class="btn btn-sm btn-secondary" onclick="menuManager.removeCategory(${category.id})">🗑️ Remove</button>
					</div>
				</div>
				<div>${itemsHtml}</div>
			</div>
		`;
	}

	renameCategory(categoryId, newName) {
		const category = this.menu.categories.find(c => c.id === categoryId);
		if (!category) return;
		category.name = (newName || '').trim() || category.name;
		this.saveToStorage();
		this.renderAll();
	}

	updatePricingSummary() {
		const totalItems = this.menu.categories.reduce((sum, c) => sum + c.items.length, 0);
		const prices = this.menu.categories.flatMap(c => c.items.map(i => i.price).filter(p => p != null));
		const avg = prices.length ? (prices.reduce((a,b)=>a+b,0) / prices.length) : 0;
		const min = prices.length ? Math.min(...prices) : 0;
		const max = prices.length ? Math.max(...prices) : 0;
		const totalRevenue = prices.reduce((a,b)=>a+b,0);

		const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
		setText('total-items', String(totalItems));
		setText('avg-price', `$${avg.toFixed(2)}`);
		setText('total-revenue', `$${totalRevenue.toFixed(2)}`);
		setText('price-range', `$${min.toFixed(2)} - $${max.toFixed(2)}`);
	}

	updatePreview() {
		const preview = document.getElementById('menu-preview');
		if (!preview) return;
		if (this.menu.categories.length === 0) return;
		const html = this.menu.categories.map(c => `
			<div class="mb-4">
				<h4 class="font-bold text-gray-800 mb-2">${this.escape(c.name)}</h4>
				<ul class="space-y-1">
					${c.items.map(i => `<li class="flex justify-between text-sm">
						<span>${this.escape(i.name)}${i.description ? ` – <span class=\"text-gray-500\">${this.escape(i.description)}</span>` : ''}</span>
						<span class="font-semibold text-emerald-600">${i.price != null ? `$${Number(i.price).toFixed(2)}` : ''}</span>
					</li>`).join('')}
				</ul>
			</div>
		`).join('');
		preview.innerHTML = html;
	}

	saveMenu() {
		this.syncFromForm();
		this.saveToStorage();
		alert('Menu saved locally for this user and project.');
	}

	exportMenu() {
		this.syncFromForm();
		const blob = new Blob([JSON.stringify(this.menu, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${(this.menu.name || 'menu').replace(/\s+/g,'_')}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	printMenu() {
		window.print();
	}

	finishMenu() {
		this.saveMenu();
		alert('Menu completed. You can now export or print.');
	}

	downloadTemplate() {
		const csv = 'Name,Price,Category,Description\nBruschetta,8,Appetizers,Grilled bread with tomatoes\nGrilled Salmon,24,Main Courses,With lemon butter sauce\nCheesecake,9,Desserts,Creamy with berry coulis';
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'menu-import-template.csv';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	escape(text) {
		return String(text || '').replace(/[&<>"\\]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'\\\\'}[s]));
	}
}

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
	try {
		window.menuManager = new MenuManager();
		// Expose helpers for inline handlers
		window.addCategory = () => window.menuManager.addCategory();
		window.addMenuItem = () => window.menuManager.addItem(window.menuManager.ensureDefaultCategory().id, { name: 'New Item' });
		window.saveMenu = () => window.menuManager.saveMenu();
		window.exportMenu = () => window.menuManager.exportMenu();
		window.printMenu = () => window.menuManager.printMenu();
		window.finishMenu = () => window.menuManager.finishMenu();
	} catch (e) { console.error('MenuManager init error', e); }
});

/**
 * Menu Manager - Project-aware menu management
 * Handles menu creation, editing, and organization within projects
 */

class MenuManager {
    constructor() {
        this.menus = [];
        this.currentProject = null;
        this.apiBase = 'http://localhost:8000/api';
        this.init();
    }

    /**
     * Initialize menu manager
     */
    init() {
        this.setupProjectListener();
        this.loadCurrentProject();
    }

    /**
     * Setup project change listener
     */
    setupProjectListener() {
        document.addEventListener('projectChanged', (event) => {
            this.currentProject = event.detail.project;
            this.loadMenus();
        });
    }

    /**
     * Load current project from project manager
     */
    loadCurrentProject() {
        if (window.projectManager) {
            this.currentProject = window.projectManager.getCurrentProject();
            this.loadMenus();
        } else {
            // Wait for project manager to load
            setTimeout(() => this.loadCurrentProject(), 500);
        }
    }

    /**
     * Load menus for current project
     */
    async loadMenus() {
        if (!this.currentProject) return;

        try {
            const response = await fetch(`${this.apiBase}/menus/?project_id=${this.currentProject.id}`, {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.menus = await response.json();
                console.log(`📋 Loaded ${this.menus.length} menus for project: ${this.currentProject.name}`);
            } else {
                console.warn('⚠️ Failed to load menus from API, using local storage');
                this.loadMenusFromStorage();
            }
        } catch (error) {
            console.warn('⚠️ Menu API unavailable, using local storage');
            this.loadMenusFromStorage();
        }

        this.displayMenus();
    }

    /**
     * Load menus from user file storage or local storage
     */
    loadMenusFromStorage() {
        if (!this.currentProject) return;

        // Try to load from user-specific file storage first
        if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
            const userId = window.userDataManager.getCurrentUserId();
            
            // Use project-aware filename if project manager is available
            let filename;
            if (window.projectManager) {
                filename = `user_${userId}_${window.projectManager.getProjectFilePath('menus')}`;
            } else {
                filename = `user_${userId}_menus.json`;
            }
            
            const loadedMenus = window.userDataManager.loadUserFile(filename);
            if (loadedMenus && Array.isArray(loadedMenus)) {
                this.menus = loadedMenus;
                console.log(`📋 Loaded ${this.menus.length} menus from user file: ${filename}`);
                return;
            }
        }

        // Fallback to project-based or user-based localStorage
        const key = window.projectManager ? 
            window.projectManager.getProjectStorageKey('menus') : 
            `menus_${this.getCurrentUser()?.id || 'anonymous'}`;

        const stored = localStorage.getItem(key);
        this.menus = stored ? JSON.parse(stored) : [];
        console.log(`📋 Loaded ${this.menus.length} menus from localStorage: ${key}`);
    }

    /**
     * Save menus to user file storage or local storage
     */
    saveMenusToStorage() {
        if (!this.currentProject) return;

        // Try to save to user-specific file storage first
        if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
            const userId = window.userDataManager.getCurrentUserId();
            
            // Use project-aware filename if project manager is available
            let filename;
            if (window.projectManager) {
                filename = `user_${userId}_${window.projectManager.getProjectFilePath('menus')}`;
            } else {
                filename = `user_${userId}_menus.json`;
            }
            
            window.userDataManager.saveUserFile(filename, this.menus);
            console.log(`💾 Saved ${this.menus.length} menus to user file: ${filename}`);
        } else {
            // Fallback to project-based or user-based localStorage
            const key = window.projectManager ? 
                window.projectManager.getProjectStorageKey('menus') : 
                `menus_${this.getCurrentUser()?.id || 'anonymous'}`;

            localStorage.setItem(key, JSON.stringify(this.menus));
            console.log(`💾 Saved ${this.menus.length} menus to localStorage: ${key}`);
        }
    }

    /**
     * Create new menu
     */
    
    /**
     * Import menu from uploaded file (PDF, image, etc.)
     */
    async importMenuFromFile(file) {
        try {
            console.log('📁 Starting menu import from file:', file.name);
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${this.apiBase}/menu/extract-and-parse`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Import failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Menu extracted successfully:', result.menu_data);
                
                // Show import preview modal
                this.showImportPreviewModal(result);
                return result;
            } else {
                throw new Error(result.error || 'Menu extraction failed');
            }
            
        } catch (error) {
            console.error('❌ Menu import failed:', error);
            this.showNotification(`Menu import failed: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Show import preview modal
     */
    showImportPreviewModal(importResult) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'import-preview-modal';
        
        const sections = importResult.menu_data.sections;
        const summary = importResult.menu_data.summary;
        
        let sectionsHtml = '';
        sections.forEach(section => {
            sectionsHtml += `
                <div class="mb-6">
                    <h4 class="font-bold text-lg text-gray-800 mb-3">${section.name} (${section.item_count} items)</h4>
                    <div class="space-y-2">
                        ${section.items.map(item => `
                            <div class="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">${item.title}</div>
                                    ${item.description ? `<div class="text-sm text-gray-600 mt-1">${item.description}</div>` : ''}
                                    <div class="flex gap-2 mt-2">
                                        ${item.dietary_tags.map(tag => `<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">${tag}</span>`).join('')}
                                        ${item.spice_level ? `<span class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">${item.spice_level}</span>` : ''}
                                    </div>
                                </div>
                                <div class="text-right ml-4">
                                    ${item.price ? `<div class="font-bold text-green-600">$${item.price.toFixed(2)}</div>` : '<div class="text-gray-400">No price</div>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-bold text-gray-900">Menu Import Preview</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="mt-4 text-sm text-gray-600">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><strong>Total Items:</strong> ${summary.total_items}</div>
                            <div><strong>Sections:</strong> ${summary.total_sections}</div>
                            <div><strong>Price Coverage:</strong> ${summary.price_coverage.toFixed(1)}%</div>
                            <div><strong>Confidence:</strong> ${importResult.parsing_confidence.toFixed(1)}%</div>
                        </div>
                        ${summary.price_range.min ? `
                            <div class="mt-2">
                                <strong>Price Range:</strong> $${summary.price_range.min.toFixed(2)} - $${summary.price_range.max.toFixed(2)} 
                                (Avg: $${summary.price_range.average.toFixed(2)})
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Menu Name</label>
                        <input type="text" id="import-menu-name" 
                               value="Imported Menu - ${new Date().toLocaleDateString()}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea id="import-menu-description" rows="3" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                  placeholder="Optional description for this menu...">Imported from ${importResult.filename}</textarea>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="font-bold text-lg text-gray-800 mb-3">Extracted Menu Items</h4>
                        ${sectionsHtml}
                    </div>
                    
                    <div class="flex justify-end gap-3">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button onclick="window.menuManager.createMenuFromImport(${JSON.stringify(importResult).replace(/"/g, '&quot;')})" 
                                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            Create Menu
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Create menu from imported data
     */
    async createMenuFromImport(importResult) {
        try {
            const menuName = document.getElementById('import-menu-name').value;
            const menuDescription = document.getElementById('import-menu-description').value;
            
            // Convert imported data to menu format
            const menuData = {
                name: menuName,
                description: menuDescription,
                project_id: this.currentProject?.id,
                sections: importResult.menu_data.sections.map(section => ({
                    name: section.name,
                    items: section.items.map(item => ({
                        name: item.title,
                        description: item.description,
                        price: item.price,
                        dietary_tags: item.dietary_tags,
                        spice_level: item.spice_level
                    }))
                })),
                metadata: {
                    imported_from: importResult.filename,
                    import_confidence: importResult.parsing_confidence,
                    import_summary: importResult.menu_data.summary,
                    imported_at: new Date().toISOString()
                }
            };
            
            // Create the menu
            const newMenu = await this.createMenu(menuData);
            
            // Close modal
            document.getElementById('import-preview-modal').remove();
            
            // Show success message
            this.showNotification(`Menu "${menuName}" created successfully from import!`, 'success');
            
            // Refresh menu list
            this.loadMenus();
            
            return newMenu;
            
        } catch (error) {
            console.error('❌ Failed to create menu from import:', error);
            this.showNotification(`Failed to create menu: ${error.message}`, 'error');
            throw error;
        }
    }
    async createMenu(menuData) {
        if (!this.currentProject) {
            throw new Error('No project selected');
        }

        const menu = {
            id: Date.now().toString(),
            name: menuData.name,
            description: menuData.description || '',
            menu_type: menuData.menu_type || 'Regular',
            project_id: this.currentProject.id,
            sections: [],
            items: [],
            pricing: {},
            is_active: true,
            is_published: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            const response = await fetch(`${this.apiBase}/menus/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(menu)
            });

            if (response.ok) {
                const savedMenu = await response.json();
                this.menus.push(savedMenu);
                this.displayMenus();
                return savedMenu;
            } else {
                throw new Error('Failed to save menu to server');
            }
        } catch (error) {
            console.warn('⚠️ Saving menu locally due to API error:', error);
            this.menus.push(menu);
            this.saveMenusToStorage();
            this.displayMenus();
            return menu;
        }
    }

    /**
     * Update menu
     */
    async updateMenu(menuId, updates) {
        const menuIndex = this.menus.findIndex(m => m.id === menuId);
        if (menuIndex === -1) {
            throw new Error('Menu not found');
        }

        const updatedMenu = {
            ...this.menus[menuIndex],
            ...updates,
            updated_at: new Date().toISOString()
        };

        try {
            const response = await fetch(`${this.apiBase}/menus/${menuId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(updatedMenu)
            });

            if (response.ok) {
                const savedMenu = await response.json();
                this.menus[menuIndex] = savedMenu;
                this.displayMenus();
                return savedMenu;
            } else {
                throw new Error('Failed to update menu on server');
            }
        } catch (error) {
            console.warn('⚠️ Updating menu locally due to API error:', error);
            this.menus[menuIndex] = updatedMenu;
            this.saveMenusToStorage();
            this.displayMenus();
            return updatedMenu;
        }
    }

    /**
     * Delete menu
     */
    async deleteMenu(menuId) {
        const menuIndex = this.menus.findIndex(m => m.id === menuId);
        if (menuIndex === -1) {
            throw new Error('Menu not found');
        }

        try {
            const response = await fetch(`${this.apiBase}/menus/${menuId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.menus.splice(menuIndex, 1);
                this.displayMenus();
                return true;
            } else {
                throw new Error('Failed to delete menu from server');
            }
        } catch (error) {
            console.warn('⚠️ Deleting menu locally due to API error:', error);
            this.menus.splice(menuIndex, 1);
            this.saveMenusToStorage();
            this.displayMenus();
            return true;
        }
    }

    /**
     * Display menus in UI
     */
    displayMenus() {
        const menuContainer = document.getElementById('menu-list');
        if (!menuContainer) return;

        if (this.menus.length === 0) {
            menuContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>No Menus Yet</h3>
                    <p>Create your first menu for "${this.currentProject?.name || 'this project'}"</p>
                    <button class="btn btn-primary" onclick="window.menuManager.showCreateMenuModal()">
                        Create Menu
                    </button>
                </div>
            `;
            return;
        }

        menuContainer.innerHTML = this.menus.map(menu => `
            <div class="menu-card" data-menu-id="${menu.id}">
                <div class="menu-header">
                    <div class="menu-info">
                        <h3 class="menu-name">${menu.name}</h3>
                        <div class="menu-meta">
                            <span class="menu-type">${menu.menu_type}</span>
                            <span class="menu-status ${menu.is_published ? 'published' : 'draft'}">
                                ${menu.is_published ? 'Published' : 'Draft'}
                            </span>
                        </div>
                    </div>
                    <div class="menu-actions">
                        <button class="btn-icon" onclick="window.menuManager.editMenu('${menu.id}')" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-icon" onclick="window.menuManager.duplicateMenu('${menu.id}')" title="Duplicate">
                            📋
                        </button>
                        <button class="btn-icon btn-danger" onclick="window.menuManager.confirmDeleteMenu('${menu.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="menu-content">
                    <p class="menu-description">${menu.description || 'No description'}</p>
                    <div class="menu-stats">
                        <span>${(menu.sections || []).length} sections</span>
                        <span>${(menu.items || []).length} items</span>
                        <span>Updated ${this.formatDate(menu.updated_at)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Show create menu modal
     */
    showCreateMenuModal() {
        const modal = this.createMenuModal();
        document.body.appendChild(modal);
        
        setTimeout(() => {
            const nameInput = modal.querySelector('#menu-name');
            if (nameInput) nameInput.focus();
        }, 100);
    }

    /**
     * Create menu modal HTML
     */
    createMenuModal(menu = null) {
        const isEdit = !!menu;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = isEdit ? 'edit-menu-modal' : 'create-menu-modal';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit Menu' : 'Create New Menu'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <form id="menu-form">
                        <div class="form-group">
                            <label for="menu-name">Menu Name *</label>
                            <input type="text" id="menu-name" name="name" required 
                                   value="${menu?.name || ''}" placeholder="Dinner Menu, Specials, etc.">
                        </div>
                        
                        <div class="form-group">
                            <label for="menu-type">Menu Type</label>
                            <select id="menu-type" name="menu_type">
                                <option value="Regular" ${menu?.menu_type === 'Regular' ? 'selected' : ''}>Regular</option>
                                <option value="Seasonal" ${menu?.menu_type === 'Seasonal' ? 'selected' : ''}>Seasonal</option>
                                <option value="Special Event" ${menu?.menu_type === 'Special Event' ? 'selected' : ''}>Special Event</option>
                                <option value="Catering" ${menu?.menu_type === 'Catering' ? 'selected' : ''}>Catering</option>
                                <option value="Limited Time" ${menu?.menu_type === 'Limited Time' ? 'selected' : ''}>Limited Time</option>
                                <option value="Tasting" ${menu?.menu_type === 'Tasting' ? 'selected' : ''}>Tasting</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="menu-description">Description</label>
                            <textarea id="menu-description" name="description" rows="3" 
                                      placeholder="Brief description of this menu...">${menu?.description || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="menu-published" name="is_published" 
                                       ${menu?.is_published ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Publish menu immediately
                            </label>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" 
                            onclick="window.menuManager.${isEdit ? 'saveMenuEdit' : 'saveNewMenu'}('${menu?.id || ''}')">
                        ${isEdit ? 'Save Changes' : 'Create Menu'}
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * Save new menu
     */
    async saveNewMenu() {
        const form = document.getElementById('menu-form');
        if (!form) return;

        const formData = new FormData(form);
        const menuData = {
            name: formData.get('name').trim(),
            menu_type: formData.get('menu_type'),
            description: formData.get('description').trim(),
            is_published: formData.has('is_published')
        };

        if (!menuData.name) {
            alert('Please enter a menu name');
            return;
        }

        try {
            await this.createMenu(menuData);
            document.getElementById('create-menu-modal')?.remove();
            this.showNotification(`Menu "${menuData.name}" created successfully!`, 'success');
        } catch (error) {
            console.error('Error creating menu:', error);
            alert(`Failed to create menu: ${error.message}`);
        }
    }

    /**
     * Edit menu
     */
    editMenu(menuId) {
        const menu = this.menus.find(m => m.id === menuId);
        if (!menu) return;

        const modal = this.createMenuModal(menu);
        document.body.appendChild(modal);
    }

    /**
     * Save menu edits
     */
    async saveMenuEdit(menuId) {
        const form = document.getElementById('menu-form');
        if (!form) return;

        const formData = new FormData(form);
        const updates = {
            name: formData.get('name').trim(),
            menu_type: formData.get('menu_type'),
            description: formData.get('description').trim(),
            is_published: formData.has('is_published')
        };

        if (!updates.name) {
            alert('Please enter a menu name');
            return;
        }

        try {
            await this.updateMenu(menuId, updates);
            document.getElementById('edit-menu-modal')?.remove();
            this.showNotification(`Menu "${updates.name}" updated successfully!`, 'success');
        } catch (error) {
            console.error('Error updating menu:', error);
            alert(`Failed to update menu: ${error.message}`);
        }
    }

    /**
     * Confirm delete menu
     */
    confirmDeleteMenu(menuId) {
        const menu = this.menus.find(m => m.id === menuId);
        if (!menu) return;

        if (confirm(`Are you sure you want to delete the menu "${menu.name}"? This action cannot be undone.`)) {
            this.deleteMenu(menuId);
        }
    }

    /**
     * Duplicate menu
     */
    async duplicateMenu(menuId) {
        const menu = this.menus.find(m => m.id === menuId);
        if (!menu) return;

        const duplicateData = {
            name: `${menu.name} (Copy)`,
            description: menu.description,
            menu_type: menu.menu_type,
            is_published: false
        };

        try {
            await this.createMenu(duplicateData);
            this.showNotification(`Menu duplicated successfully!`, 'success');
        } catch (error) {
            console.error('Error duplicating menu:', error);
            alert(`Failed to duplicate menu: ${error.message}`);
        }
    }

    /**
     * Helper: Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'today';
        if (diffDays <= 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    /**
     * Helper: Get current user
     */
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('current_user'));
        } catch {
            return null;
        }
    }

    /**
     * Helper: Get auth headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem('auth_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }

        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize menu manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.menuManager = new MenuManager();
    });
} else {
    window.menuManager = new MenuManager();
}