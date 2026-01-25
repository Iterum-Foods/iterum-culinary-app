/**
 * USDA Bulk Download Processor
 * Processes USDA bulk download files (JSON/CSV) and imports ingredients
 * Handles Foundation Foods and Branded Foods datasets
 */

class USDABulkProcessor {
  constructor() {
    this.ingredientsManager = window.ingredientsManager;
    this.usdaApiClient = window.usdaApiClient;
  }

  /**
   * Process USDA Foundation Foods JSON file
   * @param {File|Object} file - File object or JSON data
   * @param {Object} options - Processing options
   */
  async processFoundationFoods(file, options = {}) {
    const {
      importLimit = null, // Limit number of items to import
      overwriteExisting = false,
      progressCallback = null
    } = options;

    try {
      console.log('📦 Processing USDA Foundation Foods...');
      
      let data;
      if (file instanceof File) {
        // Read file
        const text = await file.text();
        data = JSON.parse(text);
      } else {
        data = file;
      }

      // Handle different USDA JSON structures
      let foods = [];
      if (data.FoundationFoods) {
        foods = data.FoundationFoods;
      } else if (Array.isArray(data)) {
        foods = data;
      } else if (data.foods) {
        foods = data.foods;
      }

      if (foods.length === 0) {
        throw new Error('No foods found in file');
      }

      console.log(`📊 Found ${foods.length} foods in file`);

      // Limit if specified
      if (importLimit) {
        foods = foods.slice(0, importLimit);
        console.log(`📝 Limiting import to ${importLimit} items`);
      }

      // Process and transform
      const ingredients = [];
      const total = foods.length;

      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        const ingredient = this.usdaApiClient.transformToIngredient(food);
        ingredients.push(ingredient);

        // Progress callback
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: total,
            percent: Math.round(((i + 1) / total) * 100),
            ingredient: ingredient.name
          });
        }
      }

      console.log(`✅ Processed ${ingredients.length} ingredients`);

      // Import to database
      const importResult = await this.importIngredients(ingredients, overwriteExisting);

      return {
        success: true,
        processed: ingredients.length,
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: importResult.errors
      };

    } catch (error) {
      console.error('❌ Error processing Foundation Foods:', error);
      return {
        success: false,
        error: error.message,
        processed: 0,
        imported: 0
      };
    }
  }

  /**
   * Process USDA Branded Foods JSON file
   * @param {File|Object} file - File object or JSON data
   * @param {Object} options - Processing options
   */
  async processBrandedFoods(file, options = {}) {
    const {
      importLimit = 1000, // Default limit for branded (usually large)
      categoryFilter = null, // Filter by category
      overwriteExisting = false,
      progressCallback = null
    } = options;

    try {
      console.log('📦 Processing USDA Branded Foods...');
      
      let data;
      if (file instanceof File) {
        const text = await file.text();
        data = JSON.parse(text);
      } else {
        data = file;
      }

      // Handle different JSON structures
      let foods = [];
      if (data.BrandedFoods) {
        foods = data.BrandedFoods;
      } else if (Array.isArray(data)) {
        foods = data;
      } else if (data.foods) {
        foods = data.foods;
      }

      if (foods.length === 0) {
        throw new Error('No branded foods found in file');
      }

      console.log(`📊 Found ${foods.length} branded foods in file`);

      // Filter by category if specified
      if (categoryFilter) {
        foods = foods.filter(food => 
          food.brandedFoodCategory?.toLowerCase().includes(categoryFilter.toLowerCase())
        );
        console.log(`🔍 Filtered to ${foods.length} foods in category: ${categoryFilter}`);
      }

      // Limit
      if (importLimit && foods.length > importLimit) {
        foods = foods.slice(0, importLimit);
        console.log(`📝 Limiting import to ${importLimit} items`);
      }

      // Process
      const ingredients = [];
      const total = foods.length;

      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        const ingredient = this.usdaApiClient.transformToIngredient(food);
        ingredients.push(ingredient);

        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: total,
            percent: Math.round(((i + 1) / total) * 100),
            ingredient: ingredient.name
          });
        }
      }

      console.log(`✅ Processed ${ingredients.length} branded ingredients`);

      // Import
      const importResult = await this.importIngredients(ingredients, overwriteExisting);

      return {
        success: true,
        processed: ingredients.length,
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: importResult.errors
      };

    } catch (error) {
      console.error('❌ Error processing Branded Foods:', error);
      return {
        success: false,
        error: error.message,
        processed: 0,
        imported: 0
      };
    }
  }

  /**
   * Process CSV file (if USDA provides CSV format)
   * @param {File} file - CSV file
   * @param {Object} options - Processing options
   */
  async processCSV(file, options = {}) {
    try {
      console.log('📦 Processing CSV file...');
      
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      // Map CSV columns to ingredient fields
      const ingredients = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        // Transform to ingredient format
        const ingredient = this.csvRowToIngredient(row);
        if (ingredient) {
          ingredients.push(ingredient);
        }
      }

      console.log(`✅ Processed ${ingredients.length} ingredients from CSV`);

      // Import
      const importResult = await this.importIngredients(ingredients, options.overwriteExisting);

      return {
        success: true,
        processed: ingredients.length,
        imported: importResult.imported,
        skipped: importResult.skipped
      };

    } catch (error) {
      console.error('❌ Error processing CSV:', error);
      return {
        success: false,
        error: error.message,
        processed: 0,
        imported: 0
      };
    }
  }

  /**
   * Parse CSV line (handles quoted values with commas)
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  /**
   * Convert CSV row to ingredient
   */
  csvRowToIngredient(row) {
    // This would need to be customized based on CSV format
    // Example mapping:
    return {
      id: `usda_${row.fdcId || row.id || Date.now()}`,
      name: row.description || row.name || 'Unknown',
      category: row.category || 'Other',
      default_unit: 'g',
      source: 'USDA FoodData Central',
      sourceId: row.fdcId || null
    };
  }

  /**
   * Import ingredients to database
   * @param {Array} ingredients - Ingredients to import
   * @param {boolean} overwriteExisting - Overwrite if exists
   */
  async importIngredients(ingredients, overwriteExisting = false) {
    const imported = [];
    const skipped = [];
    const errors = [];

    // Get existing ingredients
    const existingIngredients = this.ingredientsManager 
      ? this.ingredientsManager.getAllIngredients()
      : JSON.parse(localStorage.getItem('ingredients_database') || '[]');

    const existingIds = new Set(existingIngredients.map(ing => ing.id));
    const existingNames = new Set(existingIngredients.map(ing => ing.name.toLowerCase()));

    for (const ingredient of ingredients) {
      try {
        // Check if exists
        const existsById = existingIds.has(ingredient.id);
        const existsByName = existingNames.has(ingredient.name.toLowerCase());

        if ((existsById || existsByName) && !overwriteExisting) {
          skipped.push(ingredient);
          continue;
        }

        // Add or update
        if (this.ingredientsManager) {
          if (existsById || existsByName) {
            // Update existing
            const existing = existingIngredients.find(
              ing => ing.id === ingredient.id || ing.name.toLowerCase() === ingredient.name.toLowerCase()
            );
            if (existing) {
              Object.assign(existing, ingredient);
            }
          } else {
            // Add new
            this.ingredientsManager.addCustomIngredient(ingredient);
          }
        } else {
          // Fallback to direct localStorage
          if (!existsById && !existsByName) {
            existingIngredients.push(ingredient);
            existingIds.add(ingredient.id);
            existingNames.add(ingredient.name.toLowerCase());
          }
        }

        imported.push(ingredient);

      } catch (error) {
        errors.push({ ingredient: ingredient.name, error: error.message });
        console.error(`❌ Error importing ${ingredient.name}:`, error);
      }
    }

    // Save to localStorage if not using manager
    if (!this.ingredientsManager) {
      localStorage.setItem('ingredients_database', JSON.stringify(existingIngredients));
      localStorage.setItem('ingredients', JSON.stringify(existingIngredients));
    }

    console.log(`✅ Imported ${imported.length} ingredients, skipped ${skipped.length}, errors: ${errors.length}`);

    return {
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      errorDetails: errors
    };
  }

  /**
   * Process file (auto-detect type)
   * @param {File} file - File to process
   * @param {Object} options - Processing options
   */
  async processFile(file, options = {}) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.json')) {
      // Try to determine type from file name or content
      if (fileName.includes('foundation') || fileName.includes('sr-legacy')) {
        return await this.processFoundationFoods(file, options);
      } else if (fileName.includes('branded')) {
        return await this.processBrandedFoods(file, options);
      } else {
        // Try Foundation first (smaller)
        return await this.processFoundationFoods(file, options);
      }
    } else if (fileName.endsWith('.csv')) {
      return await this.processCSV(file, options);
    } else {
      throw new Error('Unsupported file type. Please use JSON or CSV.');
    }
  }
}

// Create global instance
window.usdaBulkProcessor = new USDABulkProcessor();

console.log('📦 USDA Bulk Processor loaded');
