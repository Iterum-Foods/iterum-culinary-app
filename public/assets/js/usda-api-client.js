/**
 * USDA FoodData Central API Client
 * Provides access to 300,000+ foods and ingredients from USDA database
 * Free, public domain (CC0 1.0) - No restrictions
 */

class USDAApiClient {
  constructor(apiKey = null) {
    // SHARED API KEY - Set your USDA API key here
    // Get one free at: https://api.data.gov/signup/
    const SHARED_API_KEY = '647BkIDtEo9JI6JTwB9Bi52phTGUvadg9aacrA5q'; // ⬅️ API KEY CONFIGURED

    // Priority: provided key > user's saved key > shared key
    this.apiKey = apiKey || this.getStoredApiKey() || SHARED_API_KEY;
    this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get stored API key (user override - optional)
   */
  getStoredApiKey() {
    // Check for user's saved key (allows override of shared key)
    const stored = localStorage.getItem('usda_api_key');
    return stored || null;
  }

  /**
   * Set API key (user override - optional)
   * Users can override the shared key with their own if needed
   */
  setApiKey(key) {
    this.apiKey = key;
    if (key) {
      localStorage.setItem('usda_api_key', key);
    } else {
      localStorage.removeItem('usda_api_key');
    }
  }

  /**
   * Check if API key is set
   */
  hasApiKey() {
    return !!this.apiKey;
  }

  /**
   * Search for foods
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  async searchFoods(query, options = {}) {
    if (!this.apiKey) {
      throw new Error('USDA API key not configured. Please set SHARED_API_KEY in usda-api-client.js or contact your administrator.');
    }

    const {
      pageSize = 50,
      pageNumber = 1,
      dataType = null, // Foundation, SR Legacy, Branded
      brandOwner = null,
      sortBy = 'dataType.keyword',
      sortOrder = 'asc'
    } = options;

    // Check cache
    const cacheKey = `search_${query}_${pageSize}_${pageNumber}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      let url = `${this.baseUrl}/foods/search?api_key=${this.apiKey}`;
      url += `&query=${encodeURIComponent(query)}`;
      url += `&pageSize=${pageSize}`;
      url += `&pageNumber=${pageNumber}`;
      url += `&sortBy=${sortBy}`;
      url += `&sortOrder=${sortOrder}`;
      
      if (dataType) {
        url += `&dataType=${dataType}`;
      }
      if (brandOwner) {
        url += `&brandOwner=${encodeURIComponent(brandOwner)}`;
      }

      console.log(`🔍 Searching USDA database: "${query}"`);
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Invalid API key. Check your key at https://api.data.gov/');
        }
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache result
      this.saveToCache(cacheKey, data);
      
      console.log(`✅ Found ${data.totalHits || 0} results for "${query}"`);
      return data;

    } catch (error) {
      console.error('❌ USDA API search error:', error);
      throw error;
    }
  }

  /**
   * Get food details by FDC ID
   * @param {number} fdcId - FoodData Central ID
   */
  async getFoodDetails(fdcId) {
    if (!this.apiKey) {
      throw new Error('USDA API key not set');
    }

    // Check cache
    const cacheKey = `food_${fdcId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache result
      this.saveToCache(cacheKey, data);
      
      return data;

    } catch (error) {
      console.error(`❌ Error fetching food ${fdcId}:`, error);
      throw error;
    }
  }

  /**
   * Get list of foods (paged)
   * @param {Object} options - List options
   */
  async listFoods(options = {}) {
    if (!this.apiKey) {
      throw new Error('USDA API key not set');
    }

    const {
      pageSize = 50,
      pageNumber = 1,
      dataType = null
    } = options;

    try {
      let url = `${this.baseUrl}/foods/list?api_key=${this.apiKey}`;
      url += `&pageSize=${pageSize}`;
      url += `&pageNumber=${pageNumber}`;
      
      if (dataType) {
        url += `&dataType=${dataType}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ USDA API list error:', error);
      throw error;
    }
  }

  /**
   * Transform USDA food data to ingredient format
   * @param {Object} food - USDA food object
   */
  transformToIngredient(food) {
    // Extract nutrients
    const nutrients = {};
    if (food.foodNutrients) {
      food.foodNutrients.forEach(nutrient => {
        const name = nutrient.nutrient?.name?.toLowerCase().replace(/\s+/g, '_');
        if (name) {
          nutrients[name] = {
            value: nutrient.amount || nutrient.value || 0,
            unit: nutrient.nutrient?.unitName || '',
            id: nutrient.nutrient?.id
          };
        }
      });
    }

    // Map to our format
    return {
      id: `usda_${food.fdcId}`,
      name: food.description || food.brandedFoodCategory || 'Unknown',
      category: this.mapCategory(food.foodCategory),
      subcategory: food.brandedFoodCategory || food.brandedFoodCategory || null,
      default_unit: 'g', // USDA uses grams
      common_units: ['g', 'kg', 'oz', 'lb'],
      
      // Nutrition info
      nutritional_info: {
        calories_per_100g: nutrients.energy?.value || nutrients.calories?.value || 0,
        protein_g: nutrients.protein?.value || 0,
        fat_g: nutrients.total_lipid_fat?.value || nutrients.fat?.value || 0,
        carbs_g: nutrients.carbohydrate_by_difference?.value || nutrients.carbohydrates?.value || 0,
        fiber_g: nutrients.fiber_total_dietary?.value || 0,
        sugar_g: nutrients.sugars_total_including_nlea?.value || nutrients.sugars?.value || 0,
        sodium_mg: nutrients.sodium_na?.value || 0,
        calcium_mg: nutrients.calcium_ca?.value || 0,
        iron_mg: nutrients.iron_fe?.value || 0,
        vitamin_c_mg: nutrients.vitamin_c_total_ascorbic_acid?.value || 0
      },
      
      // Pricing (not available from USDA, set to 0)
      avg_price_per_lb: 0,
      cost: 0,
      
      // Source info
      source: 'USDA FoodData Central',
      sourceId: food.fdcId,
      dataType: food.dataType,
      
      // Brand info (if branded food)
      brandOwner: food.brandOwner || null,
      brandName: food.brandName || null,
      gtinUpc: food.gtinUpc || null,
      
      // Dates
      dateAdded: new Date().toISOString(),
      lastUpdated: food.publicationDate || new Date().toISOString(),
      
      // Other
      storage: null,
      shelf_life_days: null,
      substitutes: [],
      allergens: this.extractAllergens(food),
      dietary: this.extractDietary(food)
    };
  }

  /**
   * Map USDA category to our category
   */
  mapCategory(usdaCategory) {
    if (!usdaCategory) return 'Other';
    
    const categoryMap = {
      'Vegetables': 'Vegetables',
      'Fruits': 'Fruits',
      'Meats': 'Proteins',
      'Poultry': 'Proteins',
      'Seafood': 'Seafood',
      'Dairy and Egg Products': 'Dairy',
      'Grains': 'Grains',
      'Legumes': 'Legumes',
      'Nuts and Seeds': 'Nuts & Seeds',
      'Spices and Herbs': 'Spices',
      'Fats and Oils': 'Oils',
      'Beverages': 'Beverages',
      'Snacks': 'Other',
      'Sweets': 'Other'
    };

    const description = usdaCategory.description || '';
    
    for (const [key, value] of Object.entries(categoryMap)) {
      if (description.includes(key)) {
        return value;
      }
    }

    return 'Other';
  }

  /**
   * Extract allergen information
   */
  extractAllergens(food) {
    const allergens = [];
    // USDA doesn't directly provide allergens, but we can infer from ingredients
    // This would need enhancement with actual allergen data
    return allergens;
  }

  /**
   * Extract dietary information
   */
  extractDietary(food) {
    const dietary = [];
    // Can be enhanced based on food category and nutrients
    return dietary;
  }

  /**
   * Search and import ingredients
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results to import
   */
  async searchAndImport(query, maxResults = 50) {
    try {
      const results = await this.searchFoods(query, { pageSize: Math.min(maxResults, 200) });
      
      if (!results.foods || results.foods.length === 0) {
        return { success: false, message: 'No results found', ingredients: [] };
      }

      const ingredients = results.foods
        .slice(0, maxResults)
        .map(food => this.transformToIngredient(food));

      return {
        success: true,
        totalFound: results.totalHits,
        imported: ingredients.length,
        ingredients: ingredients
      };

    } catch (error) {
      console.error('❌ Search and import error:', error);
      return {
        success: false,
        message: error.message,
        ingredients: []
      };
    }
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  saveToCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Get API usage stats
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      hasApiKey: this.hasApiKey()
    };
  }
}

// Create global instance
window.usdaApiClient = new USDAApiClient();

console.log('📦 USDA API Client loaded');
