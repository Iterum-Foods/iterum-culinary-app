/**
 * Menu Item Viewer
 * Beautiful modal for viewing and editing menu item details
 */

class MenuItemViewer {
    constructor() {
        console.log('🍽️ Menu Item Viewer initialized');
    }

    viewMenuItem(menuId, itemIndex) {
        console.log(`👁️ Viewing menu item: ${menuId}, index: ${itemIndex}`);
        
        // Get menu
        const menu = this.getMenu(menuId);
        if (!menu) {
            alert('Menu not found');
            return;
        }
        
        const item = menu.items[itemIndex];
        if (!item) {
            alert('Menu item not found');
            return;
        }
        
        this.showItemModal(item, menu, itemIndex);
    }

    getMenu(menuId) {
        const user = window.authManager?.currentUser;
        if (!user) return null;
        
        const userId = user.userId || user.id;
        const menuKey = `menus_${userId}`;
        const menus = JSON.parse(localStorage.getItem(menuKey) || '[]');
        
        return menus.find(m => m.id === menuId);
    }

    showItemModal(item, menu, itemIndex) {
        // Create modal
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
        const ingredientsHTML = item.ingredients && item.ingredients.length > 0
            ? `
                <div style="padding: 25px; background: white; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                        <span>🥬</span> Ingredients <span style="background: #667eea; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">${item.ingredients.length}</span>
                    </h3>
                    <ul style="list-style: none; margin: 0; padding: 0;">
                        ${item.ingredients.map(ing => {
                            const ingredient = typeof ing === 'string' ? ing : ing.name || ing.ingredient;
                            const quantity = typeof ing === 'object' ? `${ing.quantity || ''} ${ing.unit || ''}` : '';
                            return `
                                <li style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: 500; color: #1e293b;">${ingredient}</span>
                                    ${quantity ? `<span style="color: #64748b; font-size: 0.9rem;">${quantity}</span>` : ''}
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            `
            : '';

        // Build allergens
        const allergensHTML = item.allergens && item.allergens.length > 0
            ? `
                <div style="padding: 20px 25px; background: #fef3c7; border-bottom: 2px solid #fbbf24;">
                    <h3 style="font-size: 1.1rem; font-weight: 700; color: #92400e; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        <span>⚠️</span> Allergen Information
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${item.allergens.map(allergen => `
                            <span style="display: inline-block; background: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                                ${allergen}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `
            : '';

        // Build dietary info
        const dietaryHTML = item.dietary && item.dietary.length > 0
            ? `
                <div style="padding: 20px 25px; background: #dcfce7; border-bottom: 2px solid #10b981;">
                    <h3 style="font-size: 1.1rem; font-weight: 700; color: #15803d; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        <span>🌱</span> Dietary Information
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${item.dietary.map(diet => `
                            <span style="display: inline-block; background: #d1fae5; color: #065f46; padding: 6px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                                ${diet}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `
            : '';

        // Build prep instructions
        const prepHTML = item.prepInstructions || item.preparation
            ? `
                <div style="padding: 25px; background: #f8fafc; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        <span>👨‍🍳</span> Preparation
                    </h3>
                    <p style="color: #1e293b; line-height: 1.8; margin: 0; white-space: pre-wrap;">${item.prepInstructions || item.preparation}</p>
                </div>
            `
            : '';

        // Build plating
        const platingHTML = item.plating
            ? `
                <div style="padding: 25px; background: white; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        <span>🎨</span> Plating & Presentation
                    </h3>
                    <p style="color: #1e293b; line-height: 1.8; margin: 0; white-space: pre-wrap;">${item.plating}</p>
                </div>
            `
            : '';

        modal.innerHTML = `
            <div style="background: white; border-radius: 20px; max-width: 900px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 30px 90px rgba(0,0,0,0.5);">
                
                <!-- Header -->
                <div style="padding: 30px; background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%); color: white; position: relative;">
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 44px; height: 44px; font-size: 1.5rem; cursor: pointer; color: white; transition: all 0.2s; backdrop-filter: blur(10px);">
                        ✕
                    </button>
                    <h2 style="font-size: 2rem; font-weight: 700; margin: 0 0 12px 0;">${item.name}</h2>
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <span style="display: inline-block; background: rgba(255,255,255,0.25); color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">
                            ${item.category || 'Uncategorized'}
                        </span>
                        <span style="display: inline-block; background: rgba(255,255,255,0.25); color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">
                            💰 $${item.price?.toFixed(2) || '0.00'}
                        </span>
                        ${item.cost ? `
                            <span style="display: inline-block; background: rgba(255,255,255,0.25); color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">
                                📊 Cost: $${item.cost.toFixed(2)}
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Content -->
                <div style="overflow-y: auto; flex: 1;">
                    
                    <!-- Description -->
                    ${item.description ? `
                        <div style="padding: 25px; background: #f8fafc; border-bottom: 2px solid #f1f5f9;">
                            <p style="color: #1e293b; line-height: 1.8; font-size: 1.05rem; margin: 0; font-style: italic;">${item.description}</p>
                        </div>
                    ` : ''}

                    <!-- Allergens -->
                    ${allergensHTML}

                    <!-- Dietary -->
                    ${dietaryHTML}

                    <!-- Ingredients -->
                    ${ingredientsHTML}

                    <!-- Preparation -->
                    ${prepHTML}

                    <!-- Plating -->
                    ${platingHTML}

                    <!-- Chef's Notes -->
                    ${item.notes ? `
                        <div style="padding: 25px; background: #fef3c7; border-bottom: 2px solid #f1f5f9;">
                            <h3 style="font-size: 1.2rem; font-weight: 700; color: #92400e; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                                <span>💡</span> Chef's Notes
                            </h3>
                            <p style="color: #78350f; line-height: 1.8; margin: 0; white-space: pre-wrap;">${item.notes}</p>
                        </div>
                    ` : ''}

                </div>

                <!-- Footer Actions -->
                <div style="padding: 20px 25px; background: white; border-top: 2px solid #e5e7eb; display: flex; gap: 12px; flex-wrap: wrap;">
                    <button onclick="window.menuItemViewer.editMenuItem('${menu.id}', ${itemIndex})" style="flex: 1; min-width: 120px; padding: 14px; background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(90, 103, 216, 0.3);">
                        ✏️ Edit Item
                    </button>
                    <button onclick="window.menuItemViewer.duplicateMenuItem('${menu.id}', ${itemIndex})" style="flex: 1; min-width: 120px; padding: 14px; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        📋 Duplicate
                    </button>
                    <button onclick="window.menuItemViewer.printMenuItem('${menu.id}', ${itemIndex})" style="flex: 1; min-width: 120px; padding: 14px; background: #f59e0b; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                        🖨️ Print
                    </button>
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="padding: 14px 28px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">
                        Close
                    </button>
                </div>
            </div>
        `;

        // Add animation CSS
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

    editMenuItem(menuId, itemIndex) {
        console.log(`✏️ Editing menu item: ${menuId}, index: ${itemIndex}`);
        
        const menu = this.getMenu(menuId);
        if (!menu) {
            alert('Menu not found');
            return;
        }
        
        const item = menu.items[itemIndex];
        if (!item) {
            alert('Menu item not found');
            return;
        }

        // Close any open modals
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => el.remove());

        // Show edit modal
        this.showEditModal(item, menu, itemIndex);
    }

    showEditModal(item, menu, itemIndex) {
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
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 20px; max-width: 700px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 30px 90px rgba(0,0,0,0.5);">
                
                <!-- Header -->
                <div style="padding: 25px; background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%); color: white;">
                    <h2 style="font-size: 1.8rem; font-weight: 700; margin: 0;">✏️ Edit Menu Item</h2>
                    <p style="margin: 8px 0 0 0; opacity: 0.9;">${item.name}</p>
                </div>

                <!-- Form -->
                <div style="overflow-y: auto; flex: 1; padding: 25px;">
                    
                    <!-- Name -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Dish Name</label>
                        <input type="text" id="edit-name" value="${item.name}" style="width: 100%; padding: 12px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 1rem; color: #0f172a;">
                    </div>

                    <!-- Category & Price -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Category</label>
                            <input type="text" id="edit-category" value="${item.category || ''}" style="width: 100%; padding: 12px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 1rem;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Price</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem; font-weight: 700;">$</span>
                                <input type="number" id="edit-price" value="${item.price || ''}" step="0.01" min="0" style="flex: 1; padding: 12px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 1rem; font-weight: 600;">
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Description</label>
                        <textarea id="edit-description" style="width: 100%; padding: 12px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 1rem; min-height: 80px; resize: vertical;">${item.description || ''}</textarea>
                    </div>

                    <!-- Ingredients (Textarea) -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Ingredients (one per line)</label>
                        <textarea id="edit-ingredients" style="width: 100%; padding: 12px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; min-height: 150px; resize: vertical; font-family: monospace;">${this.ingredientsToText(item.ingredients)}</textarea>
                    </div>

                    <!-- Allergens -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Allergens (comma separated)</label>
                        <input type="text" id="edit-allergens" value="${item.allergens?.join(', ') || ''}" style="width: 100%; padding: 12px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 1rem;" placeholder="dairy, gluten, nuts">
                    </div>

                </div>

                <!-- Footer -->
                <div style="padding: 20px 25px; background: white; border-top: 2px solid #e5e7eb; display: flex; gap: 12px;">
                    <button onclick="window.menuItemViewer.saveMenuItem('${menu.id}', ${itemIndex})" style="flex: 1; padding: 14px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        💾 Save Changes
                    </button>
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="padding: 14px 28px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }

    ingredientsToText(ingredients) {
        if (!ingredients || !Array.isArray(ingredients)) return '';
        
        return ingredients.map(ing => {
            if (typeof ing === 'string') return ing;
            const name = ing.name || ing.ingredient || '';
            const quantity = ing.quantity ? `${ing.quantity} ${ing.unit || ''}`.trim() : '';
            return quantity ? `${name} - ${quantity}` : name;
        }).join('\n');
    }

    textToIngredients(text) {
        if (!text) return [];
        
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .map(line => {
                // Try to parse "ingredient - quantity unit" format
                const parts = line.split('-').map(p => p.trim());
                if (parts.length === 2) {
                    const quantityParts = parts[1].split(/\s+/);
                    return {
                        name: parts[0],
                        quantity: quantityParts[0] || '',
                        unit: quantityParts.slice(1).join(' ') || ''
                    };
                }
                return { name: line };
            });
    }

    saveMenuItem(menuId, itemIndex) {
        console.log(`💾 Saving menu item: ${menuId}, index: ${itemIndex}`);
        
        const user = window.authManager?.currentUser;
        if (!user) {
            alert('Please sign in first');
            return;
        }
        
        const userId = user.userId || user.id;
        const menuKey = `menus_${userId}`;
        const menus = JSON.parse(localStorage.getItem(menuKey) || '[]');
        const menu = menus.find(m => m.id === menuId);
        
        if (!menu || !menu.items[itemIndex]) {
            alert('Menu item not found');
            return;
        }

        // Get form values
        const name = document.getElementById('edit-name').value.trim();
        const category = document.getElementById('edit-category').value.trim();
        const price = parseFloat(document.getElementById('edit-price').value) || 0;
        const description = document.getElementById('edit-description').value.trim();
        const ingredientsText = document.getElementById('edit-ingredients').value;
        const allergensText = document.getElementById('edit-allergens').value;

        if (!name) {
            alert('Please enter a dish name');
            return;
        }

        // Update item
        menu.items[itemIndex] = {
            ...menu.items[itemIndex],
            name,
            category,
            price,
            description,
            ingredients: this.textToIngredients(ingredientsText),
            allergens: allergensText.split(',').map(a => a.trim()).filter(a => a),
            lastModified: new Date().toISOString()
        };

        // Save menu
        localStorage.setItem(menuKey, JSON.stringify(menus));
        
        // Close modal
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => el.remove());
        
        // Refresh display
        if (typeof displayMenuItems === 'function') {
            displayMenuItems(menu);
        }
        
        // Show success
        this.showToast('✅ Menu item updated!');
    }

    duplicateMenuItem(menuId, itemIndex) {
        console.log(`📋 Duplicating menu item: ${menuId}, index: ${itemIndex}`);
        
        const user = window.authManager?.currentUser;
        if (!user) return;
        
        const userId = user.userId || user.id;
        const menuKey = `menus_${userId}`;
        const menus = JSON.parse(localStorage.getItem(menuKey) || '[]');
        const menu = menus.find(m => m.id === menuId);
        
        if (!menu || !menu.items[itemIndex]) {
            alert('Menu item not found');
            return;
        }

        const item = menu.items[itemIndex];
        const duplicate = {
            ...item,
            name: `${item.name} (Copy)`,
            id: `item_${Date.now()}`,
            createdAt: new Date().toISOString()
        };

        menu.items.push(duplicate);
        localStorage.setItem(menuKey, JSON.stringify(menus));

        // Close modal and refresh
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => el.remove());
        
        if (typeof displayMenuItems === 'function') {
            displayMenuItems(menu);
        }

        this.showToast('✅ Menu item duplicated!');
    }

    printMenuItem(menuId, itemIndex) {
        console.log(`🖨️ Printing menu item: ${menuId}, index: ${itemIndex}`);
        
        const menu = this.getMenu(menuId);
        if (!menu || !menu.items[itemIndex]) {
            alert('Menu item not found');
            return;
        }

        const item = menu.items[itemIndex];
        
        const printWindow = window.open('', '_blank');
        
        const ingredientsHTML = item.ingredients && item.ingredients.length > 0
            ? item.ingredients.map(ing => {
                const name = typeof ing === 'string' ? ing : ing.name || ing.ingredient;
                const quantity = typeof ing === 'object' ? `${ing.quantity || ''} ${ing.unit || ''}`.trim() : '';
                return `<li>${name}${quantity ? ` - ${quantity}` : ''}</li>`;
            }).join('')
            : '<li>No ingredients listed</li>';
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${item.name} - ${menu.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                    h1 { color: #1e293b; border-bottom: 3px solid #5a67d8; padding-bottom: 10px; }
                    h2 { color: #5a67d8; margin-top: 30px; }
                    .meta { display: flex; gap: 20px; margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
                    .meta-item { flex: 1; }
                    .meta-label { font-size: 0.85rem; color: #64748b; font-weight: 600; }
                    .meta-value { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-top: 5px; }
                    ul { line-height: 1.8; }
                    li { margin-bottom: 8px; }
                    .description { font-size: 1.05rem; line-height: 1.7; margin: 20px 0; padding: 15px; background: #f8fafc; border-left: 4px solid #5a67d8; font-style: italic; }
                    .allergens { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                    @media print {
                        body { margin: 0; padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1>${item.name}</h1>
                    <p style="color: #64748b; font-size: 1.1rem;">${menu.name}</p>
                </div>
                
                ${item.description ? `<div class="description">${item.description}</div>` : ''}
                
                <div class="meta">
                    <div class="meta-item">
                        <div class="meta-label">Category</div>
                        <div class="meta-value">${item.category || 'Uncategorized'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Price</div>
                        <div class="meta-value">$${item.price?.toFixed(2) || '0.00'}</div>
                    </div>
                    ${item.cost ? `
                        <div class="meta-item">
                            <div class="meta-label">Cost</div>
                            <div class="meta-value">$${item.cost.toFixed(2)}</div>
                        </div>
                    ` : ''}
                </div>
                
                ${item.allergens && item.allergens.length > 0 ? `
                    <div class="allergens">
                        <strong>⚠️ Contains Allergens:</strong> ${item.allergens.join(', ')}
                    </div>
                ` : ''}
                
                <h2>🥬 Ingredients</h2>
                <ul>${ingredientsHTML}</ul>
                
                ${item.prepInstructions || item.preparation ? `
                    <h2>👨‍🍳 Preparation</h2>
                    <p style="line-height: 1.8; white-space: pre-wrap;">${item.prepInstructions || item.preparation}</p>
                ` : ''}
                
                ${item.plating ? `
                    <h2>🎨 Plating</h2>
                    <p style="line-height: 1.8; white-space: pre-wrap;">${item.plating}</p>
                ` : ''}
                
                ${item.notes ? `
                    <h2>💡 Chef's Notes</h2>
                    <p style="font-style: italic; background: #fef3c7; padding: 15px; border-radius: 8px; line-height: 1.8;">${item.notes}</p>
                ` : ''}
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #94a3b8; font-size: 0.9rem;">
                    ${menu.name} | Printed from Iterum Culinary App | ${new Date().toLocaleDateString()}
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 999999;
            animation: slideDown 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Initialize global instance
window.menuItemViewer = new MenuItemViewer();

// Make functions globally available
window.viewMenuItem = (menuId, itemIndex) => window.menuItemViewer.viewMenuItem(menuId, itemIndex);
window.editMenuItem = (menuId, itemIndex) => window.menuItemViewer.editMenuItem(menuId, itemIndex);
window.duplicateMenuItem = (menuId, itemIndex) => window.menuItemViewer.duplicateMenuItem(menuId, itemIndex);

