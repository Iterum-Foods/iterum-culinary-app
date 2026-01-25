/**
 * Modern Dashboard for Iterum R&D Chef Notebook
 * Provides widgets, statistics, and quick actions
 */

class ModernDashboard {
    constructor() {
        this.widgets = new Map();
        this.stats = {};
        this.quickActions = [];
        this.recentActivity = [];
        this.init();
    }

    /**
     * Initialize dashboard
     */
    init() {
        this.loadData();
        this.setupWidgets();
        this.setupEventListeners();
        this.injectStyles();
        this.render();
    }

    /**
     * Load dashboard data
     */
    async loadData() {
        try {
            // Load statistics
            this.stats = await this.calculateStats();
            
            // Load recent activity
            this.recentActivity = await this.getRecentActivity();
            
            // Setup quick actions
            this.setupQuickActions();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    /**
     * Calculate dashboard statistics
     */
    async calculateStats() {
        const recipes = this.getAllRecipes();
        const ingredients = this.getAllIngredients();
        const equipment = this.getAllEquipment();
        const users = this.getAllUsers();

        return {
            totalRecipes: recipes.length,
            totalIngredients: ingredients.length,
            totalEquipment: equipment.length,
            totalUsers: users.length,
            recentRecipes: recipes.filter(r => this.isRecent(r.createdAt, 7)).length,
            favoriteRecipes: recipes.filter(r => r.favorite).length,
            pendingReviews: recipes.filter(r => r.reviewStatus === 'pending').length,
            completedToday: this.getCompletedToday()
        };
    }

    /**
     * Get recent activity
     */
    async getRecentActivity() {
        const activities = [];
        
        // Get recent recipe changes
        const recipes = this.getAllRecipes();
        recipes.forEach(recipe => {
            if (this.isRecent(recipe.updatedAt, 7)) {
                activities.push({
                    type: 'recipe',
                    action: 'updated',
                    title: recipe.name,
                    timestamp: recipe.updatedAt,
                    icon: '🍳'
                });
            }
        });

        // Get recent ingredient additions
        const ingredients = this.getAllIngredients();
        ingredients.forEach(ingredient => {
            if (this.isRecent(ingredient.createdAt, 7)) {
                activities.push({
                    type: 'ingredient',
                    action: 'added',
                    title: ingredient.name,
                    timestamp: ingredient.createdAt,
                    icon: '🥘'
                });
            }
        });

        // Sort by timestamp
        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    }

    /**
     * Setup quick actions
     */
    setupQuickActions() {
        this.quickActions = [
            {
                id: 'new-recipe',
                title: 'New Recipe',
                description: 'Create a new recipe',
                icon: '🍳',
                action: () => window.location.href = 'recipe-developer.html',
                color: '#4f46e5'
            },
            {
                id: 'import-recipe',
                title: 'Import Recipe',
                description: 'Import from file',
                icon: '📁',
                action: () => window.location.href = 'recipe-upload.html',
                color: '#059669'
            },
            {
                id: 'manage-ingredients',
                title: 'Ingredients',
                description: 'Manage ingredients',
                icon: '🥘',
                action: () => window.location.href = 'ingredients.html',
                color: '#dc2626'
            },
            {
                id: 'equipment',
                title: 'Equipment',
                description: 'Manage equipment',
                icon: '🔧',
                action: () => window.location.href = 'equipment-management.html',
                color: '#7c3aed'
            },
            {
                id: 'vendors',
                title: 'Vendors',
                description: 'Manage vendors',
                icon: '🏪',
                action: () => window.location.href = 'vendor-management.html',
                color: '#ea580c'
            },
            {
                id: 'menu-builder',
                title: 'Menu Builder',
                description: 'Create menus',
                icon: '📋',
                action: () => window.location.href = 'menu-builder.html',
                color: '#0891b2'
            }
        ];
    }

    /**
     * Setup dashboard widgets
     */
    setupWidgets() {
        this.widgets.set('stats', {
            id: 'stats',
            title: 'Statistics',
            type: 'stats',
            size: 'large'
        });

        this.widgets.set('recent-activity', {
            id: 'recent-activity',
            title: 'Recent Activity',
            type: 'activity',
            size: 'medium'
        });

        this.widgets.set('quick-actions', {
            id: 'quick-actions',
            title: 'Quick Actions',
            type: 'actions',
            size: 'medium'
        });

        this.widgets.set('favorites', {
            id: 'favorites',
            title: 'Favorite Recipes',
            type: 'recipes',
            size: 'small'
        });

        this.widgets.set('pending-reviews', {
            id: 'pending-reviews',
            title: 'Pending Reviews',
            type: 'reviews',
            size: 'small'
        });
    }

    /**
     * Render dashboard
     */
    render() {
        const dashboardContainer = document.getElementById('dashboard-container');
        if (!dashboardContainer) return;

        dashboardContainer.innerHTML = `
            <div class="dashboard-header">
                <h1 class="dashboard-title">Welcome back, ${this.getCurrentUserName()}!</h1>
                <p class="dashboard-subtitle">Here's what's happening in your kitchen today</p>
            </div>
            
            <div class="dashboard-grid">
                ${this.renderStatsWidget()}
                ${this.renderQuickActionsWidget()}
                ${this.renderRecentActivityWidget()}
                ${this.renderFavoritesWidget()}
                ${this.renderPendingReviewsWidget()}
            </div>
        `;

        // Initialize charts and interactive elements
        this.initializeCharts();
    }

    /**
     * Render statistics widget
     */
    renderStatsWidget() {
        return `
            <div class="widget widget-stats" data-widget="stats">
                <div class="widget-header">
                    <h3>Kitchen Statistics</h3>
                    <button class="widget-refresh" onclick="modernDashboard.refreshStats()">
                        <span>🔄</span>
                    </button>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">🍳</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.stats.totalRecipes}</div>
                            <div class="stat-label">Total Recipes</div>
                        </div>
                        <div class="stat-trend positive">+${this.stats.recentRecipes}</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🥘</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.stats.totalIngredients}</div>
                            <div class="stat-label">Ingredients</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🔧</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.stats.totalEquipment}</div>
                            <div class="stat-label">Equipment</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.stats.favoriteRecipes}</div>
                            <div class="stat-label">Favorites</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render quick actions widget
     */
    renderQuickActionsWidget() {
        return `
            <div class="widget widget-actions" data-widget="quick-actions">
                <div class="widget-header">
                    <h3>Quick Actions</h3>
                </div>
                <div class="actions-grid">
                    ${this.quickActions.map(action => `
                        <div class="action-card" onclick="modernDashboard.executeAction('${action.id}')">
                            <div class="action-icon" style="background: ${action.color}">${action.icon}</div>
                            <div class="action-content">
                                <div class="action-title">${action.title}</div>
                                <div class="action-description">${action.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render recent activity widget
     */
    renderRecentActivityWidget() {
        return `
            <div class="widget widget-activity" data-widget="recent-activity">
                <div class="widget-header">
                    <h3>Recent Activity</h3>
                    <button class="widget-view-all" onclick="modernDashboard.viewAllActivity()">
                        View All
                    </button>
                </div>
                <div class="activity-list">
                    ${this.recentActivity.length > 0 ? 
                        this.recentActivity.map(activity => `
                            <div class="activity-item">
                                <div class="activity-icon">${activity.icon}</div>
                                <div class="activity-content">
                                    <div class="activity-title">${activity.title}</div>
                                    <div class="activity-meta">
                                        ${activity.action} • ${this.formatTimeAgo(activity.timestamp)}
                                    </div>
                                </div>
                            </div>
                        `).join('') :
                        '<div class="no-activity">No recent activity</div>'
                    }
                </div>
            </div>
        `;
    }

    /**
     * Render favorites widget
     */
    renderFavoritesWidget() {
        const favorites = this.getAllRecipes().filter(r => r.favorite).slice(0, 5);
        
        return `
            <div class="widget widget-favorites" data-widget="favorites">
                <div class="widget-header">
                    <h3>Favorite Recipes</h3>
                    <button class="widget-view-all" onclick="modernDashboard.viewAllFavorites()">
                        View All
                    </button>
                </div>
                <div class="favorites-list">
                    ${favorites.length > 0 ? 
                        favorites.map(recipe => `
                            <div class="favorite-item" onclick="modernDashboard.viewRecipe('${recipe.id}')">
                                <div class="favorite-icon">🍳</div>
                                <div class="favorite-content">
                                    <div class="favorite-title">${recipe.name}</div>
                                    <div class="favorite-meta">${recipe.difficulty || 'Unknown'} • ${recipe.cookingTime || 'Unknown'} min</div>
                                </div>
                            </div>
                        `).join('') :
                        '<div class="no-favorites">No favorite recipes yet</div>'
                    }
                </div>
            </div>
        `;
    }

    /**
     * Render pending reviews widget
     */
    renderPendingReviewsWidget() {
        const pendingReviews = this.getAllRecipes().filter(r => r.reviewStatus === 'pending').slice(0, 5);
        
        return `
            <div class="widget widget-reviews" data-widget="pending-reviews">
                <div class="widget-header">
                    <h3>Pending Reviews</h3>
                    <button class="widget-view-all" onclick="modernDashboard.viewAllReviews()">
                        View All
                    </button>
                </div>
                <div class="reviews-list">
                    ${pendingReviews.length > 0 ? 
                        pendingReviews.map(recipe => `
                            <div class="review-item" onclick="modernDashboard.reviewRecipe('${recipe.id}')">
                                <div class="review-icon">📝</div>
                                <div class="review-content">
                                    <div class="review-title">${recipe.name}</div>
                                    <div class="review-meta">Awaiting review</div>
                                </div>
                            </div>
                        `).join('') :
                        '<div class="no-reviews">No pending reviews</div>'
                    }
                </div>
            </div>
        `;
    }

    /**
     * Initialize charts and interactive elements
     */
    initializeCharts() {
        // Add any chart initialization here
        // For now, we'll just add some interactive elements
        this.setupWidgetInteractions();
    }

    /**
     * Setup widget interactions
     */
    setupWidgetInteractions() {
        // Add hover effects and click handlers
        document.querySelectorAll('.widget').forEach(widget => {
            widget.addEventListener('mouseenter', () => {
                widget.classList.add('widget-hover');
            });
            
            widget.addEventListener('mouseleave', () => {
                widget.classList.remove('widget-hover');
            });
        });
    }

    /**
     * Execute quick action
     */
    executeAction(actionId) {
        const action = this.quickActions.find(a => a.id === actionId);
        if (action && action.action) {
            action.action();
        }
    }

    /**
     * Refresh statistics
     */
    async refreshStats() {
        this.stats = await this.calculateStats();
        const statsWidget = document.querySelector('[data-widget="stats"]');
        if (statsWidget) {
            statsWidget.innerHTML = this.renderStatsWidget();
        }
    }

    /**
     * View all activity
     */
    viewAllActivity() {
        // Navigate to activity page or show modal
        console.log('View all activity');
    }

    /**
     * View all favorites
     */
    viewAllFavorites() {
        window.location.href = 'recipe-library.html?filter=favorites';
    }

    /**
     * View all reviews
     */
    viewAllReviews() {
        window.location.href = 'recipe-review.html?filter=pending';
    }

    /**
     * View recipe
     */
    viewRecipe(recipeId) {
        window.location.href = `recipe-review.html?id=${recipeId}`;
    }

    /**
     * Review recipe
     */
    reviewRecipe(recipeId) {
        window.location.href = `recipe-review.html?id=${recipeId}&mode=review`;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh dashboard data periodically
        setInterval(() => {
            this.loadData();
        }, 300000); // Refresh every 5 minutes
    }

    /**
     * Get current user name
     */
    getCurrentUserName() {
        const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        return currentUser.name || 'Chef';
    }

    /**
     * Check if date is recent (within days)
     */
    isRecent(dateString, days) {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    }

    /**
     * Format time ago
     */
    formatTimeAgo(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays < 7) return `${diffDays - 1} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    /**
     * Get completed today
     */
    getCompletedToday() {
        // This would be implemented based on your actual data structure
        return 0;
    }

    /**
     * Get all recipes (placeholder)
     */
    getAllRecipes() {
        return window.recipeLibrary ? window.recipeLibrary.getAllRecipes() : [];
    }

    /**
     * Get all ingredients (placeholder)
     */
    getAllIngredients() {
        return window.ingredientLibrary ? window.ingredientLibrary.getAllIngredients() : [];
    }

    /**
     * Get all equipment (placeholder)
     */
    getAllEquipment() {
        return window.equipmentManager ? window.equipmentManager.getAllEquipment() : [];
    }

    /**
     * Get all users (placeholder)
     */
    getAllUsers() {
        return []; // Implement based on your user management system
    }

    /**
     * Inject dashboard styles
     */
    injectStyles() {
        const styles = `
            /* Modern Dashboard Styles */
            .dashboard-header {
                text-align: center;
                margin-bottom: 32px;
                padding: 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                color: white;
            }

            .dashboard-title {
                font-size: 2.5rem;
                font-weight: 700;
                margin: 0 0 8px 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .dashboard-subtitle {
                font-size: 1.1rem;
                opacity: 0.9;
                margin: 0;
            }

            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(12, 1fr);
                gap: 24px;
                margin-bottom: 32px;
            }

            /* Widget Styles */
            .widget {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid #e5e7eb;
                transition: all 0.3s ease;
                overflow: hidden;
            }

            .widget:hover {
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }

            .widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #f3f4f6;
                background: #fafafa;
            }

            .widget-header h3 {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 600;
                color: #374151;
            }

            .widget-refresh,
            .widget-view-all {
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.2s;
            }

            .widget-refresh:hover,
            .widget-view-all:hover {
                background: #f3f4f6;
                color: #374151;
            }

            /* Stats Widget */
            .widget-stats {
                grid-column: span 12;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                padding: 24px;
            }

            .stat-card {
                display: flex;
                align-items: center;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }

            .stat-icon {
                font-size: 2rem;
                margin-right: 16px;
            }

            .stat-content {
                flex: 1;
            }

            .stat-number {
                font-size: 2rem;
                font-weight: 700;
                color: #111827;
                line-height: 1;
            }

            .stat-label {
                font-size: 0.875rem;
                color: #6b7280;
                margin-top: 4px;
            }

            .stat-trend {
                font-size: 0.875rem;
                font-weight: 600;
                padding: 4px 8px;
                border-radius: 4px;
            }

            .stat-trend.positive {
                background: #dcfce7;
                color: #166534;
            }

            .stat-trend.negative {
                background: #fef2f2;
                color: #dc2626;
            }

            /* Quick Actions Widget */
            .widget-actions {
                grid-column: span 6;
            }

            .actions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
                padding: 24px;
            }

            .action-card {
                display: flex;
                align-items: center;
                padding: 16px;
                background: #f9fafb;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid #e5e7eb;
            }

            .action-card:hover {
                background: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transform: translateY(-1px);
            }

            .action-icon {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
                margin-right: 12px;
                color: white;
            }

            .action-content {
                flex: 1;
            }

            .action-title {
                font-weight: 600;
                color: #374151;
                margin-bottom: 4px;
            }

            .action-description {
                font-size: 0.875rem;
                color: #6b7280;
            }

            /* Activity Widget */
            .widget-activity {
                grid-column: span 6;
            }

            .activity-list {
                padding: 0;
            }

            .activity-item {
                display: flex;
                align-items: center;
                padding: 16px 24px;
                border-bottom: 1px solid #f3f4f6;
                transition: background 0.2s;
            }

            .activity-item:hover {
                background: #f9fafb;
            }

            .activity-item:last-child {
                border-bottom: none;
            }

            .activity-icon {
                font-size: 1.25rem;
                margin-right: 12px;
            }

            .activity-content {
                flex: 1;
            }

            .activity-title {
                font-weight: 500;
                color: #374151;
                margin-bottom: 4px;
            }

            .activity-meta {
                font-size: 0.875rem;
                color: #6b7280;
            }

            /* Favorites Widget */
            .widget-favorites {
                grid-column: span 3;
            }

            .favorites-list {
                padding: 0;
            }

            .favorite-item {
                display: flex;
                align-items: center;
                padding: 12px 24px;
                border-bottom: 1px solid #f3f4f6;
                cursor: pointer;
                transition: background 0.2s;
            }

            .favorite-item:hover {
                background: #f9fafb;
            }

            .favorite-item:last-child {
                border-bottom: none;
            }

            .favorite-icon {
                font-size: 1rem;
                margin-right: 12px;
            }

            .favorite-content {
                flex: 1;
            }

            .favorite-title {
                font-weight: 500;
                color: #374151;
                font-size: 0.875rem;
                margin-bottom: 2px;
            }

            .favorite-meta {
                font-size: 0.75rem;
                color: #6b7280;
            }

            /* Reviews Widget */
            .widget-reviews {
                grid-column: span 3;
            }

            .reviews-list {
                padding: 0;
            }

            .review-item {
                display: flex;
                align-items: center;
                padding: 12px 24px;
                border-bottom: 1px solid #f3f4f6;
                cursor: pointer;
                transition: background 0.2s;
            }

            .review-item:hover {
                background: #f9fafb;
            }

            .review-item:last-child {
                border-bottom: none;
            }

            .review-icon {
                font-size: 1rem;
                margin-right: 12px;
            }

            .review-content {
                flex: 1;
            }

            .review-title {
                font-weight: 500;
                color: #374151;
                font-size: 0.875rem;
                margin-bottom: 2px;
            }

            .review-meta {
                font-size: 0.75rem;
                color: #6b7280;
            }

            /* Empty States */
            .no-activity,
            .no-favorites,
            .no-reviews {
                padding: 24px;
                text-align: center;
                color: #6b7280;
                font-style: italic;
            }

            /* Responsive Design */
            @media (max-width: 1024px) {
                .dashboard-grid {
                    grid-template-columns: repeat(6, 1fr);
                }
                
                .widget-actions,
                .widget-activity {
                    grid-column: span 6;
                }
                
                .widget-favorites,
                .widget-reviews {
                    grid-column: span 3;
                }
            }

            @media (max-width: 768px) {
                .dashboard-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                
                .widget-actions,
                .widget-activity,
                .widget-favorites,
                .widget-reviews {
                    grid-column: span 1;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .actions-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .dashboard-title {
                    font-size: 2rem;
                }
            }

            @media (max-width: 480px) {
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .actions-grid {
                    grid-template-columns: 1fr;
                }
                
                .dashboard-title {
                    font-size: 1.75rem;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize modern dashboard when dependencies are ready
function initializeModernDashboard() {
    if (window.equipmentManager && typeof window.equipmentManager.getAllEquipment === 'function') {
        const modernDashboard = new ModernDashboard();
        window.modernDashboard = modernDashboard;
        console.log('✅ Modern dashboard initialized');
    } else {
        console.log('⏳ Waiting for equipmentManager to be available...');
        setTimeout(initializeModernDashboard, 100);
    }
}

// Start initialization
initializeModernDashboard();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernDashboard;
} 