/**
 * Empty States Component
 * Beautiful, engaging empty state cards with CTAs
 */

class EmptyStates {
    constructor() {
        this.injectStyles();
        console.log('📭 Empty States component initialized');
    }
    
    injectStyles() {
        if (document.getElementById('empty-states-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'empty-states-styles';
        style.textContent = `
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 40px;
                text-align: center;
                background: linear-gradient(145deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
                border-radius: 16px;
                border: 2px dashed rgba(102, 126, 234, 0.3);
                min-height: 300px;
            }
            
            .empty-state-icon {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.8;
                animation: float 3s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .empty-state-title {
                font-size: 24px;
                font-weight: 800;
                color: #1e293b;
                margin-bottom: 12px;
            }
            
            .empty-state-message {
                font-size: 16px;
                color: #64748b;
                margin-bottom: 24px;
                max-width: 400px;
                line-height: 1.6;
            }
            
            .empty-state-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .empty-state:hover {
                border-color: rgba(102, 126, 234, 0.5);
                background: linear-gradient(145deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
            }
        `;
        document.head.appendChild(style);
    }
    
    create(options = {}) {
        const {
            icon = '📭',
            title = 'No items found',
            message = 'Get started by adding your first item.',
            actions = [],
            customClass = ''
        } = options;
        
        const actionsHTML = actions.map(action => {
            const isPrimary = action.primary !== false;
            const buttonClass = isPrimary ? 'btn btn-primary' : 'btn btn-secondary';
            const onClick = action.onClick ? `onclick="${action.onClick}"` : '';
            const href = action.href ? `href="${action.href}"` : '';
            
            if (href) {
                return `<a ${href} class="${buttonClass}">${action.icon || ''} ${action.label}</a>`;
            } else {
                return `<button ${onClick} class="${buttonClass}">${action.icon || ''} ${action.label}</button>`;
            }
        }).join('');
        
        return `
            <div class="empty-state ${customClass}">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-message">${message}</p>
                ${actions.length > 0 ? `<div class="empty-state-actions">${actionsHTML}</div>` : ''}
            </div>
        `;
    }
    
    // Predefined empty states for common scenarios
    recipes() {
        return this.create({
            icon: '🧪',
            title: 'No recipes yet',
            message: 'Start creating your culinary masterpieces! Every great dish begins with an idea.',
            actions: [
                {
                    label: 'Create Recipe',
                    icon: '➕',
                    href: 'recipe-developer.html',
                    primary: true
                },
                {
                    label: 'Import Recipes',
                    icon: '📥',
                    href: 'recipe-upload.html',
                    primary: false
                }
            ]
        });
    }
    
    ingredients() {
        return this.create({
            icon: '🥬',
            title: 'No ingredients yet',
            message: 'Build your ingredient library to start creating recipes and managing inventory.',
            actions: [
                {
                    label: 'Add Ingredient',
                    icon: '➕',
                    onClick: 'document.querySelector(\'.add-ingredient-form\')?.scrollIntoView({behavior: \'smooth\'})',
                    primary: true
                },
                {
                    label: 'Import Database',
                    icon: '📥',
                    onClick: 'importBaseIngredients()',
                    primary: false
                }
            ]
        });
    }
    
    menus() {
        return this.create({
            icon: '🍽️',
            title: 'No menus created',
            message: 'Design beautiful menus that showcase your culinary vision.',
            actions: [
                {
                    label: 'Create Menu',
                    icon: '➕',
                    href: 'menu-builder.html',
                    primary: true
                }
            ]
        });
    }
    
    vendors() {
        return this.create({
            icon: '🏪',
            title: 'No vendors added',
            message: 'Add your suppliers to track orders, compare prices, and manage relationships.',
            actions: [
                {
                    label: 'Add Vendor',
                    icon: '➕',
                    onClick: 'openAddVendorModal()',
                    primary: true
                },
                {
                    label: 'Import Vendors',
                    icon: '📥',
                    onClick: 'importVendors()',
                    primary: false
                }
            ]
        });
    }
    
    equipment() {
        return this.create({
            icon: '🔧',
            title: 'No equipment tracked',
            message: 'Keep track of your kitchen equipment, maintenance, and inventory.',
            actions: [
                {
                    label: 'Add Equipment',
                    icon: '➕',
                    onClick: 'openAddEquipmentModal()',
                    primary: true
                }
            ]
        });
    }
    
    inventory() {
        return this.create({
            icon: '📦',
            title: 'Inventory is empty',
            message: 'Start tracking your ingredient stock levels and reduce waste.',
            actions: [
                {
                    label: 'Add Item',
                    icon: '➕',
                    onClick: 'openAddInventoryModal()',
                    primary: true
                },
                {
                    label: 'Bulk Import',
                    icon: '📥',
                    href: 'bulk-ingredient-import.html',
                    primary: false
                }
            ]
        });
    }
    
    searchResults(query) {
        return this.create({
            icon: '🔍',
            title: 'No results found',
            message: `We couldn't find any matches for "${query}". Try adjusting your search or filters.`,
            actions: [
                {
                    label: 'Clear Filters',
                    icon: '↺',
                    onClick: 'resetFilters()',
                    primary: true
                }
            ]
        });
    }
    
    error() {
        return this.create({
            icon: '⚠️',
            title: 'Something went wrong',
            message: 'We encountered an error loading this data. Please try refreshing the page.',
            actions: [
                {
                    label: 'Refresh Page',
                    icon: '🔄',
                    onClick: 'location.reload()',
                    primary: true
                }
            ]
        });
    }
    
    // Show empty state in an element
    show(element, type = 'recipes', options = {}) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        let html;
        if (typeof type === 'string' && this[type]) {
            html = this[type]();
        } else if (typeof type === 'object') {
            html = this.create(type);
        } else {
            html = this.create(options);
        }
        
        element.innerHTML = html;
    }
}

// Initialize global empty states system
window.emptyStates = new EmptyStates();

// Convenience functions
window.showEmptyState = (element, type, options) => window.emptyStates.show(element, type, options);
window.createEmptyState = (options) => window.emptyStates.create(options);

console.log('✅ Empty State functions available: showEmptyState(), createEmptyState()');

