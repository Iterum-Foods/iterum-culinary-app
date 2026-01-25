/**
 * Ingredient URL Scraper
 * Supports scraping ingredient data from various sources including fooddb.ca
 */

class IngredientURLScraper {
  constructor() {
    this.corsProxies = [
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?',
      'https://api.codetabs.com/v1/proxy?quest='
    ];
    this.proxyIndex = 0;
  }

  /**
   * Main function to fetch ingredient metadata from URL
   */
  async fetchIngredientMetadata(url) {
    if (!url || !url.trim()) {
      throw new Error('URL is required');
    }

    const normalizedUrl = this.normalizeURL(url);
    const domain = new URL(normalizedUrl).hostname.toLowerCase();

    console.log(`🔍 Fetching ingredient data from: ${domain}`);

    try {
      // Check if it's fooddb.ca
      if (domain.includes('fooddb.ca')) {
        return await this.scrapeFoodDBCa(normalizedUrl);
      }
      
      // Check other known sources
      if (domain.includes('wikipedia.org')) {
        return await this.scrapeWikipedia(normalizedUrl);
      }
      
      if (domain.includes('usda.gov') || domain.includes('nutrition')) {
        return await this.scrapeNutritionDatabase(normalizedUrl);
      }

      // Generic scraping
      return await this.scrapeGeneric(normalizedUrl);
    } catch (error) {
      console.error('❌ Error scraping ingredient:', error);
      throw error;
    }
  }

  /**
   * Scrape fooddb.ca specifically
   */
  async scrapeFoodDBCa(url) {
    try {
      const html = await this.fetchWithCORS(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const ingredient = {
        name: '',
        description: '',
        category: 'other',
        unit: 'g',
        cost: null,
        supplier: '',
        storage: 'dry',
        nutritional_info: {},
        allergens: [],
        tags: [],
        source_url: url,
        source_host: 'fooddb.ca'
      };

      // Extract name - usually in h1 or title
      const nameEl = doc.querySelector('h1') || doc.querySelector('.product-title') || doc.querySelector('title');
      if (nameEl) {
        ingredient.name = nameEl.textContent.trim();
        // Clean up common suffixes
        ingredient.name = ingredient.name.replace(/\s*-\s*FoodDB.*$/i, '').trim();
      }

      // Extract description
      const descEl = doc.querySelector('.description') || doc.querySelector('.product-description') || 
                     doc.querySelector('meta[name="description"]') || doc.querySelector('p');
      if (descEl) {
        ingredient.description = descEl.textContent?.trim() || descEl.getAttribute('content') || '';
        if (ingredient.description.length > 500) {
          ingredient.description = ingredient.description.substring(0, 500) + '...';
        }
      }

      // Extract nutritional information
      const nutritionData = this.extractNutritionFromFoodDB(doc);
      if (nutritionData) {
        ingredient.nutritional_info = nutritionData;
      }

      // Extract category
      const category = this.extractCategoryFromFoodDB(doc);
      if (category) {
        ingredient.category = category;
      }

      // Extract allergens if available
      const allergens = this.extractAllergensFromFoodDB(doc);
      if (allergens.length > 0) {
        ingredient.allergens = allergens;
      }

      // Extract tags/keywords
      const tags = this.extractTagsFromFoodDB(doc);
      if (tags.length > 0) {
        ingredient.tags = tags;
      }

      // Set default unit based on category
      if (this.isLiquidCategory(ingredient.category)) {
        ingredient.unit = 'ml';
      } else if (this.isWeightCategory(ingredient.category)) {
        ingredient.unit = 'g';
      }

      console.log('✅ Scraped from fooddb.ca:', ingredient.name);
      return ingredient;
    } catch (error) {
      console.error('❌ Error scraping fooddb.ca:', error);
      throw new Error(`Failed to scrape fooddb.ca: ${error.message}`);
    }
  }

  /**
   * Extract nutrition data from FoodDB page
   */
  extractNutritionFromFoodDB(doc) {
    const nutrition = {};

    // Look for nutrition tables or structured data
    const nutritionTable = doc.querySelector('table.nutrition') || 
                         doc.querySelector('.nutrition-info') ||
                         doc.querySelector('[class*="nutrition"]');

    if (nutritionTable) {
      const rows = nutritionTable.querySelectorAll('tr, .nutrition-row');
      rows.forEach(row => {
        const label = row.querySelector('td:first-child, .label, .nutrient-name')?.textContent?.toLowerCase() || '';
        const value = row.querySelector('td:last-child, .value, .nutrient-value')?.textContent?.trim() || '';

        if (label.includes('calorie') || label.includes('energy')) {
          nutrition.calories = this.parseNumber(value);
        } else if (label.includes('protein')) {
          nutrition.protein = this.parseNumber(value);
        } else if (label.includes('fat') || label.includes('lipid')) {
          nutrition.fat = this.parseNumber(value);
        } else if (label.includes('carb') || label.includes('carbohydrate')) {
          nutrition.carbohydrates = this.parseNumber(value);
        } else if (label.includes('fiber') || label.includes('fibre')) {
          nutrition.fiber = this.parseNumber(value);
        } else if (label.includes('sugar')) {
          nutrition.sugar = this.parseNumber(value);
        } else if (label.includes('sodium')) {
          nutrition.sodium = this.parseNumber(value);
        }
      });
    }

    // Also check for JSON-LD structured data
    const jsonLd = doc.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd.textContent);
        if (data.nutrition) {
          Object.assign(nutrition, data.nutrition);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return Object.keys(nutrition).length > 0 ? nutrition : null;
  }

  /**
   * Extract category from FoodDB page
   */
  extractCategoryFromFoodDB(doc) {
    // Look for breadcrumbs, categories, or tags
    const breadcrumbs = doc.querySelector('.breadcrumb, .breadcrumbs, nav[aria-label="breadcrumb"]');
    if (breadcrumbs) {
      const links = breadcrumbs.querySelectorAll('a');
      for (const link of links) {
        const text = link.textContent.toLowerCase();
        if (this.isValidCategory(text)) {
          return this.normalizeCategory(text);
        }
      }
    }

    // Check meta tags
    const metaCategory = doc.querySelector('meta[property="article:section"]') ||
                        doc.querySelector('meta[name="category"]');
    if (metaCategory) {
      const cat = metaCategory.getAttribute('content')?.toLowerCase();
      if (cat && this.isValidCategory(cat)) {
        return this.normalizeCategory(cat);
      }
    }

    // Check for category tags
    const categoryTags = doc.querySelectorAll('.category, .tag, [class*="category"]');
    for (const tag of categoryTags) {
      const text = tag.textContent.toLowerCase();
      if (this.isValidCategory(text)) {
        return this.normalizeCategory(text);
      }
    }

    return null;
  }

  /**
   * Extract allergens from FoodDB page
   */
  extractAllergensFromFoodDB(doc) {
    const allergens = [];
    
    // Look for allergen information
    const allergenSection = doc.querySelector('.allergens, .allergen-info, [class*="allergen"]');
    if (allergenSection) {
      const allergenText = allergenSection.textContent.toLowerCase();
      const commonAllergens = ['milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soy', 'sesame'];
      
      commonAllergens.forEach(allergen => {
        if (allergenText.includes(allergen)) {
          allergens.push(allergen);
        }
      });
    }

    return allergens;
  }

  /**
   * Extract tags from FoodDB page
   */
  extractTagsFromFoodDB(doc) {
    const tags = [];
    
    // Look for tag elements
    const tagElements = doc.querySelectorAll('.tag, .keyword, [class*="tag"]');
    tagElements.forEach(el => {
      const text = el.textContent.trim();
      if (text && text.length < 30) {
        tags.push(text);
      }
    });

    // Also check meta keywords
    const metaKeywords = doc.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      const keywords = metaKeywords.getAttribute('content')?.split(',').map(k => k.trim());
      if (keywords) {
        tags.push(...keywords);
      }
    }

    return tags.slice(0, 10); // Limit to 10 tags
  }

  /**
   * Generic scraping for unknown sources
   */
  async scrapeGeneric(url) {
    const html = await this.fetchWithCORS(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const ingredient = {
      name: '',
      description: '',
      category: 'other',
      unit: 'g',
      source_url: url,
      source_host: new URL(url).hostname
    };

    // Extract name
    const nameEl = doc.querySelector('h1') || doc.querySelector('title');
    if (nameEl) {
      ingredient.name = nameEl.textContent.trim();
    }

    // Extract description
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc) {
      ingredient.description = metaDesc.getAttribute('content') || '';
    } else {
      const firstPara = doc.querySelector('p');
      if (firstPara) {
        ingredient.description = firstPara.textContent.trim().substring(0, 300);
      }
    }

    return ingredient;
  }

  /**
   * Scrape Wikipedia
   */
  async scrapeWikipedia(url) {
    const html = await this.fetchWithCORS(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const ingredient = {
      name: '',
      description: '',
      category: 'other',
      unit: 'g',
      source_url: url,
      source_host: 'wikipedia.org'
    };

    // Extract name from title
    const title = doc.querySelector('h1.firstHeading, h1');
    if (title) {
      ingredient.name = title.textContent.trim();
    }

    // Extract first paragraph
    const firstPara = doc.querySelector('.mw-parser-output p');
    if (firstPara) {
      let desc = firstPara.textContent.trim();
      desc = desc.replace(/\[\d+\]/g, ''); // Remove citations
      ingredient.description = desc.substring(0, 500);
    }

    return ingredient;
  }

  /**
   * Scrape nutrition database
   */
  async scrapeNutritionDatabase(url) {
    // Similar to generic but with nutrition focus
    return await this.scrapeGeneric(url);
  }

  /**
   * Fetch HTML with CORS proxy fallback
   */
  async fetchWithCORS(url) {
    let lastError = null;

    for (let i = 0; i < this.corsProxies.length; i++) {
      try {
        const proxy = this.corsProxies[this.proxyIndex];
        const proxyUrl = proxy + encodeURIComponent(url);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.text();
        
        // Handle allorigins.win format
        if (proxy.includes('allorigins.win')) {
          try {
            const json = JSON.parse(data);
            return json.contents || data;
          } catch (e) {
            return data;
          }
        }

        return data;
      } catch (error) {
        console.warn(`⚠️ Proxy ${this.proxyIndex} failed:`, error.message);
        lastError = error;
        this.proxyIndex = (this.proxyIndex + 1) % this.corsProxies.length;
      }
    }

    throw new Error(`All CORS proxies failed. Last error: ${lastError?.message}`);
  }

  /**
   * Normalize URL
   */
  normalizeURL(url) {
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  /**
   * Parse number from string
   */
  parseNumber(str) {
    if (!str) return null;
    const match = str.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  /**
   * Check if category is valid
   */
  isValidCategory(cat) {
    const validCategories = [
      'vegetable', 'fruit', 'protein', 'grain', 'dairy', 'spice', 'herb',
      'oil', 'fat', 'nut', 'seed', 'legume', 'beverage', 'condiment'
    ];
    return validCategories.some(valid => cat.includes(valid));
  }

  /**
   * Normalize category name
   */
  normalizeCategory(cat) {
    const mappings = {
      'vegetable': 'vegetables',
      'fruit': 'fruits',
      'protein': 'proteins',
      'grain': 'grains',
      'dairy': 'dairy',
      'spice': 'spices',
      'herb': 'spices',
      'oil': 'oils',
      'fat': 'oils',
      'nut': 'nuts',
      'seed': 'nuts',
      'legume': 'proteins',
      'beverage': 'beverages',
      'condiment': 'condiments'
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (cat.includes(key)) {
        return value;
      }
    }

    return 'other';
  }

  /**
   * Check if category is liquid
   */
  isLiquidCategory(cat) {
    return ['beverages', 'oils', 'condiments'].includes(cat);
  }

  /**
   * Check if category is weight-based
   */
  isWeightCategory(cat) {
    return ['vegetables', 'fruits', 'proteins', 'grains', 'dairy', 'nuts'].includes(cat);
  }
}

// Initialize and expose globally
window.ingredientURLScraper = new IngredientURLScraper();
window.fetchIngredientMetadata = (url) => window.ingredientURLScraper.fetchIngredientMetadata(url);

console.log('✅ Ingredient URL Scraper loaded (supports fooddb.ca)');

