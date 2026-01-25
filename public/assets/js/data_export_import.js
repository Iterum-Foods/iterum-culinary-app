/**
 * Data Export/Import System for Iterum R&D Chef Notebook
 * Provides comprehensive backup, restore, and data management functionality
 */

class DataExportImport {
    constructor() {
        this.exportFormats = ['json', 'csv', 'xlsx'];
        this.importFormats = ['json', 'csv', 'xlsx'];
        this.backupInterval = null;
        this.init();
    }

    /**
     * Initialize the system
     */
    init() {
        this.setupAutoBackup();
        this.setupEventListeners();
        this.injectStyles();
    }

    /**
     * Setup automatic backup
     */
    setupAutoBackup() {
        // Auto backup every 24 hours
        this.backupInterval = setInterval(() => {
            this.createAutoBackup();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * Create automatic backup
     */
    async createAutoBackup() {
        try {
            const backup = await this.createBackup();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `auto_backup_${timestamp}.json`;
            
            this.saveToLocalStorage(filename, backup);
            this.cleanupOldBackups();
            
            console.log('Auto backup created:', filename);
        } catch (error) {
            console.error('Auto backup failed:', error);
        }
    }

    /**
     * Cleanup old backups (keep last 7)
     */
    cleanupOldBackups() {
        const backups = this.getBackupList();
        if (backups.length > 7) {
            const toDelete = backups.slice(7);
            toDelete.forEach(backup => {
                localStorage.removeItem(`backup_${backup.filename}`);
            });
        }
    }

    /**
     * Get list of available backups
     */
    getBackupList() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('backup_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        filename: key.replace('backup_', ''),
                        timestamp: data.metadata.timestamp,
                        size: JSON.stringify(data).length,
                        type: data.metadata.type
                    });
                } catch (error) {
                    console.error('Error parsing backup:', key, error);
                }
            }
        }
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Create comprehensive backup
     */
    async createBackup() {
        const backup = {
            metadata: {
                version: '1.0',
                timestamp: new Date().toISOString(),
                type: 'full_backup',
                app: 'Iterum R&D Chef Notebook'
            },
            data: {
                recipes: await this.getAllRecipes(),
                ingredients: await this.getAllIngredients(),
                equipment: await this.getAllEquipment(),
                vendors: await this.getAllVendors(),
                users: await this.getAllUsers(),
                settings: await this.getSettings()
            }
        };

        return backup;
    }

    /**
     * Export data in specified format
     */
    async exportData(type = 'all', format = 'json', options = {}) {
        try {
            let data;
            
            switch (type) {
                case 'all':
                    data = await this.createBackup();
                    break;
                case 'recipes':
                    data = await this.exportRecipes(options);
                    break;
                case 'ingredients':
                    data = await this.exportIngredients(options);
                    break;
                case 'equipment':
                    data = await this.exportEquipment(options);
                    break;
                case 'vendors':
                    data = await this.exportVendors(options);
                    break;
                case 'users':
                    data = await this.exportUsers(options);
                    break;
                default:
                    throw new Error(`Unknown export type: ${type}`);
            }

            const filename = this.generateFilename(type, format);
            
            switch (format) {
                case 'json':
                    this.downloadJSON(data, filename);
                    break;
                case 'csv':
                    this.downloadCSV(data, filename);
                    break;
                case 'xlsx':
                    await this.downloadXLSX(data, filename);
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            return { success: true, filename };
        } catch (error) {
            console.error('Export failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Import data from file
     */
    async importData(file, options = {}) {
        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            let data;

            switch (fileExtension) {
                case 'json':
                    data = await this.parseJSONFile(file);
                    break;
                case 'csv':
                    data = await this.parseCSVFile(file);
                    break;
                case 'xlsx':
                    data = await this.parseXLSXFile(file);
                    break;
                default:
                    throw new Error(`Unsupported file format: ${fileExtension}`);
            }

            // Validate data structure
            const validation = this.validateImportData(data);
            if (!validation.valid) {
                throw new Error(`Invalid data format: ${validation.error}`);
            }

            // Import data
            const result = await this.processImportData(data, options);
            
            // Create backup before import
            await this.createBackup();
            
            return { success: true, result };
        } catch (error) {
            console.error('Import failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Export recipes
     */
    async exportRecipes(options = {}) {
        const recipes = await this.getAllRecipes();
        
        if (options.includeVersions) {
            // Include version history
            return await Promise.all(recipes.map(async (recipe) => ({
                ...recipe,
                versions: await this.getRecipeVersions(recipe.id)
            })));
        }
        
        return recipes;
    }

    /**
     * Export ingredients
     */
    async exportIngredients(options = {}) {
        const ingredients = await this.getAllIngredients();
        
        if (options.includeNutrition) {
            // Include nutritional information
            return await Promise.all(ingredients.map(async (ingredient) => ({
                ...ingredient,
                nutrition: await this.getIngredientNutrition(ingredient.id)
            })));
        }
        
        return ingredients;
    }

    /**
     * Export equipment
     */
    async exportEquipment(options = {}) {
        const equipment = await this.getAllEquipment();
        
        if (options.includeMaintenance) {
            // Include maintenance history
            return await Promise.all(equipment.map(async (item) => ({
                ...item,
                maintenance: await this.getEquipmentMaintenance(item.id)
            })));
        }
        
        return equipment;
    }

    /**
     * Export vendors
     */
    async exportVendors(options = {}) {
        const vendors = await this.getAllVendors();
        
        if (options.includeProducts) {
            // Include vendor products
            return await Promise.all(vendors.map(async (vendor) => ({
                ...vendor,
                products: await this.getVendorProducts(vendor.id)
            })));
        }
        
        return vendors;
    }

    /**
     * Export users
     */
    async exportUsers(options = {}) {
        const users = await this.getAllUsers();
        
        // Remove sensitive information
        return users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            restaurant: user.restaurant,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        }));
    }

    /**
     * Download JSON file
     */
    downloadJSON(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        this.downloadFile(jsonString, filename, 'application/json');
    }

    /**
     * Download CSV file
     */
    downloadCSV(data, filename) {
        if (Array.isArray(data)) {
            const csv = this.convertToCSV(data);
            this.downloadFile(csv, filename, 'text/csv');
        } else {
            throw new Error('Data must be an array for CSV export');
        }
    }

    /**
     * Download XLSX file
     */
    async downloadXLSX(data, filename) {
        // This would require a library like SheetJS
        // For now, we'll create a simple implementation
        const workbook = this.createWorkbook(data);
        const xlsxData = await this.workbookToBlob(workbook);
        this.downloadBlob(xlsxData, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    /**
     * Convert data to CSV
     */
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value || '';
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }

    /**
     * Create workbook for XLSX export
     * Note: Requires SheetJS library for full implementation
     */
    createWorkbook(data) {
        console.warn('XLSX export requires SheetJS library');
        return { sheets: [{ name: 'Data', data: data }] };
    }

    /**
     * Convert workbook to blob
     * Note: Requires SheetJS library for full implementation
     */
    async workbookToBlob(workbook) {
        console.warn('XLSX export requires SheetJS library');
        return new Blob(['CSV export recommended'], { type: 'text/plain' });
    }

    /**
     * Parse JSON file
     */
    async parseJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Parse CSV file
     */
    async parseCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const data = this.parseCSV(csv);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid CSV file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Parse XLSX file
     * Note: Requires SheetJS library for full implementation
     */
    async parseXLSXFile(file) {
        console.warn('XLSX import requires SheetJS library');
        throw new Error('XLSX import not available - use CSV import instead');
    }

    /**
     * Parse CSV string
     */
    parseCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        return data;
    }

    /**
     * Validate import data
     */
    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Data must be an object' };
        }

        // Check for required fields based on data type
        if (data.metadata) {
            // Full backup format
            if (!data.data) {
                return { valid: false, error: 'Missing data field' };
            }
        } else if (Array.isArray(data)) {
            // Array format (CSV import)
            if (data.length === 0) {
                return { valid: false, error: 'Empty data array' };
            }
        } else {
            return { valid: false, error: 'Invalid data format' };
        }

        return { valid: true };
    }

    /**
     * Process import data
     */
    async processImportData(data, options = {}) {
        const results = {
            recipes: { imported: 0, errors: 0 },
            ingredients: { imported: 0, errors: 0 },
            equipment: { imported: 0, errors: 0 },
            vendors: { imported: 0, errors: 0 },
            users: { imported: 0, errors: 0 }
        };

        if (data.metadata && data.data) {
            // Full backup format
            for (const [type, items] of Object.entries(data.data)) {
                if (Array.isArray(items)) {
                    for (const item of items) {
                        try {
                            await this.importItem(type, item, options);
                            results[type].imported++;
                        } catch (error) {
                            console.error(`Error importing ${type}:`, error);
                            results[type].errors++;
                        }
                    }
                }
            }
        } else if (Array.isArray(data)) {
            // Array format - assume recipes
            for (const item of data) {
                try {
                    await this.importItem('recipes', item, options);
                    results.recipes.imported++;
                } catch (error) {
                    console.error('Error importing recipe:', error);
                    results.recipes.errors++;
                }
            }
        }

        return results;
    }

    /**
     * Import individual item
     */
    async importItem(type, item, options = {}) {
        switch (type) {
            case 'recipes':
                return await this.importRecipe(item, options);
            case 'ingredients':
                return await this.importIngredient(item, options);
            case 'equipment':
                return await this.importEquipment(item, options);
            case 'vendors':
                return await this.importVendor(item, options);
            case 'users':
                return await this.importUser(item, options);
            default:
                throw new Error(`Unknown item type: ${type}`);
        }
    }

    /**
     * Import recipe
     */
    async importRecipe(recipe, options = {}) {
        if (options.overwrite) {
            // Update existing recipe
            return await this.updateRecipe(recipe.id, recipe);
        } else {
            // Create new recipe
            const newRecipe = { ...recipe };
            delete newRecipe.id; // Remove ID to create new
            return await this.createRecipe(newRecipe);
        }
    }

    /**
     * Import ingredient
     */
    async importIngredient(ingredient, options = {}) {
        if (options.overwrite) {
            return await this.updateIngredient(ingredient.id, ingredient);
        } else {
            const newIngredient = { ...ingredient };
            delete newIngredient.id;
            return await this.createIngredient(newIngredient);
        }
    }

    /**
     * Import equipment
     */
    async importEquipment(equipment, options = {}) {
        if (options.overwrite) {
            return await this.updateEquipment(equipment.id, equipment);
        } else {
            const newEquipment = { ...equipment };
            delete newEquipment.id;
            return await this.createEquipment(newEquipment);
        }
    }

    /**
     * Import vendor
     */
    async importVendor(vendor, options = {}) {
        if (options.overwrite) {
            return await this.updateVendor(vendor.id, vendor);
        } else {
            const newVendor = { ...vendor };
            delete newVendor.id;
            return await this.createVendor(newVendor);
        }
    }

    /**
     * Import user
     */
    async importUser(user, options = {}) {
        if (options.overwrite) {
            return await this.updateUser(user.id, user);
        } else {
            const newUser = { ...user };
            delete newUser.id;
            return await this.createUser(newUser);
        }
    }

    /**
     * Generate filename
     */
    generateFilename(type, format) {
        const timestamp = new Date().toISOString().split('T')[0];
        return `iterum_${type}_${timestamp}.${format}`;
    }

    /**
     * Download file
     */
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        this.downloadBlob(blob, filename, contentType);
    }

    /**
     * Download blob
     */
    downloadBlob(blob, filename, contentType) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage(filename, data) {
        try {
            localStorage.setItem(`backup_${filename}`, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save backup:', error);
            // Try to save with smaller data
            const compressed = this.compressData(data);
            localStorage.setItem(`backup_${filename}`, JSON.stringify(compressed));
        }
    }

    /**
     * Compress data for storage
     */
    compressData(data) {
        // Simple compression - remove unnecessary fields
        const compressed = { ...data };
        if (compressed.data) {
            Object.keys(compressed.data).forEach(key => {
                if (Array.isArray(compressed.data[key])) {
                    compressed.data[key] = compressed.data[key].map(item => {
                        const { id, name, createdAt, updatedAt } = item;
                        return { id, name, createdAt, updatedAt };
                    });
                }
            });
        }
        return compressed;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Export buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-export]')) {
                const type = e.target.dataset.export;
                const format = e.target.dataset.format || 'json';
                this.exportData(type, format);
            }
        });

        // Import file input
        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-import]')) {
                const file = e.target.files[0];
                if (file) {
                    this.importData(file);
                }
            }
        });
    }

    /**
     * Get all recipes (placeholder)
     */
    async getAllRecipes() {
        return window.recipeLibrary ? window.recipeLibrary.getAllRecipes() : [];
    }

    /**
     * Get all ingredients (placeholder)
     */
    async getAllIngredients() {
        return window.ingredientLibrary ? window.ingredientLibrary.getAllIngredients() : [];
    }

    /**
     * Get all equipment (placeholder)
     */
    async getAllEquipment() {
        return window.equipmentManager ? window.equipmentManager.getAllEquipment() : [];
    }

    /**
     * Get all vendors (placeholder)
     */
    async getAllVendors() {
        return []; // Implement based on your vendor management
    }

    /**
     * Get all users (placeholder)
     */
    async getAllUsers() {
        return []; // Implement based on your user management
    }

    /**
     * Get settings (placeholder)
     */
    async getSettings() {
        return {}; // Implement based on your settings management
    }

    // Note: CRUD operations are handled by individual managers (userDataManager, etc.)

    /**
     * Inject styles
     */
    injectStyles() {
        const styles = `
            /* Data Export/Import Styles */
            .data-export-import {
                padding: 24px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }

            .export-section,
            .import-section {
                margin-bottom: 32px;
            }

            .section-title {
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 16px;
                color: #374151;
            }

            .export-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }

            .export-option {
                padding: 16px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
            }

            .export-option:hover {
                border-color: #4f46e5;
                background: #f8fafc;
            }

            .export-icon {
                font-size: 2rem;
                margin-bottom: 8px;
            }

            .export-title {
                font-weight: 600;
                margin-bottom: 4px;
                color: #374151;
            }

            .export-description {
                font-size: 0.875rem;
                color: #6b7280;
            }

            .import-area {
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                padding: 32px;
                text-align: center;
                transition: border-color 0.2s;
            }

            .import-area:hover {
                border-color: #4f46e5;
            }

            .import-area.dragover {
                border-color: #4f46e5;
                background: #f8fafc;
            }

            .import-icon {
                font-size: 3rem;
                margin-bottom: 16px;
                color: #6b7280;
            }

            .import-text {
                font-size: 1.1rem;
                margin-bottom: 8px;
                color: #374151;
            }

            .import-hint {
                font-size: 0.875rem;
                color: #6b7280;
            }

            .backup-section {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
            }

            .backup-list {
                display: grid;
                gap: 12px;
            }

            .backup-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: #f9fafb;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }

            .backup-info {
                flex: 1;
            }

            .backup-name {
                font-weight: 500;
                color: #374151;
                margin-bottom: 4px;
            }

            .backup-meta {
                font-size: 0.875rem;
                color: #6b7280;
            }

            .backup-actions {
                display: flex;
                gap: 8px;
            }

            .btn-restore,
            .btn-delete {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                font-size: 0.875rem;
                cursor: pointer;
                transition: background 0.2s;
            }

            .btn-restore {
                background: #4f46e5;
                color: white;
            }

            .btn-restore:hover {
                background: #3730a3;
            }

            .btn-delete {
                background: #dc2626;
                color: white;
            }

            .btn-delete:hover {
                background: #b91c1c;
            }

            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                margin: 16px 0;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4f46e5, #7c3aed);
                transition: width 0.3s ease;
            }

            .status-message {
                text-align: center;
                padding: 16px;
                border-radius: 6px;
                margin: 16px 0;
            }

            .status-success {
                background: #dcfce7;
                color: #166534;
                border: 1px solid #bbf7d0;
            }

            .status-error {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }

            .status-info {
                background: #dbeafe;
                color: #1e40af;
                border: 1px solid #bfdbfe;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize data export/import system when dependencies are ready
function initializeDataExportImport() {
    if (!window.equipmentManager || typeof window.equipmentManager.getAllEquipment !== 'function') {
        console.log('⏳ DataExportImport waiting for equipmentManager...');
        setTimeout(initializeDataExportImport, 100);
        return;
    }
    
    const dataExportImport = new DataExportImport();
    window.dataExportImport = dataExportImport;
    console.log('✅ Data export/import system initialized');
}

// Start initialization
initializeDataExportImport();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataExportImport;
} 