/**
 * Data Tagging System - Associate data with projects
 * Handles tagging ingredients, recipes, and menus with specific projects
 */

class DataTaggingSystem {
    constructor() {
        this.storageKey = 'iterum_data_tags';
        this.tags = new Map(); // projectId -> { ingredients: [], recipes: [], menus: [] }
        this.init();
    }

    /**
     * Initialize the tagging system
     */
    init() {
        this.loadTags();
        console.log('✅ Data Tagging System initialized');
    }

    /**
     * Load tags from local storage
     */
    loadTags() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.tags = new Map(Object.entries(parsed));
            }
            console.log('📚 Loaded data tags:', this.tags.size, 'projects');
        } catch (error) {
            console.error('❌ Error loading data tags:', error);
            this.tags = new Map();
        }
    }

    /**
     * Save tags to local storage
     */
    saveTags() {
        try {
            const serialized = Object.fromEntries(this.tags);
            localStorage.setItem(this.storageKey, JSON.stringify(serialized));
            console.log('✅ Data tags saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving data tags:', error);
        }
    }

    /**
     * Tag an item with a project
     */
    tagItem(projectId, itemType, itemId) {
        if (!this.tags.has(projectId)) {
            this.tags.set(projectId, {
                ingredients: [],
                recipes: [],
                menus: []
            });
        }

        const projectTags = this.tags.get(projectId);
        if (!projectTags[itemType].includes(itemId)) {
            projectTags[itemType].push(itemId);
            this.saveTags();
            console.log(`✅ Tagged ${itemType} ${itemId} with project ${projectId}`);
        }

        return true;
    }

    /**
     * Remove tag from an item
     */
    untagItem(projectId, itemType, itemId) {
        if (this.tags.has(projectId)) {
            const projectTags = this.tags.get(projectId);
            const index = projectTags[itemType].indexOf(itemId);
            if (index > -1) {
                projectTags[itemType].splice(index, 1);
                this.saveTags();
                console.log(`✅ Untagged ${itemType} ${itemId} from project ${projectId}`);
                return true;
            }
        }
        return false;
    }

    /**
     * Get all items tagged with a specific project
     */
    getProjectItems(projectId) {
        return this.tags.get(projectId) || {
            ingredients: [],
            recipes: [],
            menus: []
        };
    }

    /**
     * Get all projects that have tagged a specific item
     */
    getItemProjects(itemType, itemId) {
        const projects = [];
        for (const [projectId, tags] of this.tags.entries()) {
            if (tags[itemType].includes(itemId)) {
                projects.push(projectId);
            }
        }
        return projects;
    }

    /**
     * Check if an item is tagged with a specific project
     */
    isItemTagged(projectId, itemType, itemId) {
        if (this.tags.has(projectId)) {
            const projectTags = this.tags.get(projectId);
            return projectTags[itemType].includes(itemId);
        }
        return false;
    }

    /**
     * Get all items of a specific type across all projects
     */
    getAllTaggedItems(itemType) {
        const allItems = new Set();
        for (const tags of this.tags.values()) {
            tags[itemType].forEach(itemId => allItems.add(itemId));
        }
        return Array.from(allItems);
    }

    /**
     * Bulk tag multiple items
     */
    bulkTagItems(projectId, itemType, itemIds) {
        if (!this.tags.has(projectId)) {
            this.tags.set(projectId, {
                ingredients: [],
                recipes: [],
                menus: []
            });
        }

        const projectTags = this.tags.get(projectId);
        itemIds.forEach(itemId => {
            if (!projectTags[itemType].includes(itemId)) {
                projectTags[itemType].push(itemId);
            }
        });

        this.saveTags();
        console.log(`✅ Bulk tagged ${itemIds.length} ${itemType} with project ${projectId}`);
        return true;
    }

    /**
     * Bulk untag multiple items
     */
    bulkUntagItems(projectId, itemType, itemIds) {
        if (this.tags.has(projectId)) {
            const projectTags = this.tags.get(projectId);
            itemIds.forEach(itemId => {
                const index = projectTags[itemType].indexOf(itemId);
                if (index > -1) {
                    projectTags[itemType].splice(index, 1);
                }
            });
            this.saveTags();
            console.log(`✅ Bulk untagged ${itemIds.length} ${itemType} from project ${projectId}`);
            return true;
        }
        return false;
    }

    /**
     * Get project statistics
     */
    getProjectStats(projectId) {
        const items = this.getProjectItems(projectId);
        return {
            ingredients: items.ingredients.length,
            recipes: items.recipes.length,
            menus: items.menus.length,
            total: items.ingredients.length + items.recipes.length + items.menus.length
        };
    }

    /**
     * Get all project statistics
     */
    getAllProjectStats() {
        const stats = {};
        for (const [projectId] of this.tags.entries()) {
            stats[projectId] = this.getProjectStats(projectId);
        }
        return stats;
    }

    /**
     * Clear all tags for a project (when project is deleted)
     */
    clearProjectTags(projectId) {
        if (this.tags.has(projectId)) {
            this.tags.delete(projectId);
            this.saveTags();
            console.log(`✅ Cleared all tags for project ${projectId}`);
            return true;
        }
        return false;
    }

    /**
     * Export tags for a specific project
     */
    exportProjectTags(projectId) {
        const items = this.getProjectItems(projectId);
        return {
            projectId,
            exportDate: new Date().toISOString(),
            items
        };
    }

    /**
     * Import tags for a project
     */
    importProjectTags(projectId, importedTags) {
        if (importedTags && importedTags.items) {
            this.tags.set(projectId, importedTags.items);
            this.saveTags();
            console.log(`✅ Imported tags for project ${projectId}`);
            return true;
        }
        return false;
    }

    /**
     * Get tag suggestions based on existing data
     */
    getTagSuggestions(projectId, itemType) {
        // This could be enhanced with AI suggestions in the future
        const suggestions = [];
        const existingItems = this.getProjectItems(projectId)[itemType];
        
        // For now, return empty suggestions
        // In the future, this could analyze patterns and suggest relevant items
        return suggestions;
    }

    /**
     * Search for items by tag criteria
     */
    searchByTags(criteria) {
        const results = {
            ingredients: [],
            recipes: [],
            menus: []
        };

        for (const [projectId, tags] of this.tags.entries()) {
            if (criteria.projectId && criteria.projectId !== projectId) {
                continue;
            }

            if (criteria.itemType) {
                if (tags[criteria.itemType]) {
                    results[criteria.itemType].push(...tags[criteria.itemType]);
                }
            } else {
                // Search all types
                Object.keys(tags).forEach(type => {
                    results[type].push(...tags[type]);
                });
            }
        }

        // Remove duplicates
        Object.keys(results).forEach(type => {
            results[type] = [...new Set(results[type])];
        });

        return results;
    }
}

// Initialize the data tagging system
console.log('🚀 Creating DataTaggingSystem instance...');
const dataTagger = new DataTaggingSystem();

// Make it globally available
console.log('🚀 Making dataTagger globally available...');
window.dataTagger = dataTagger;
console.log('🚀 Global dataTagger object:', window.dataTagger);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataTaggingSystem;
}
