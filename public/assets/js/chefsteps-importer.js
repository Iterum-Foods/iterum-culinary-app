(function () {
class ChefStepsImporter {
    constructor(options = {}) {
      this.utils = window.RecipeImportUtils || {};
      this.defaultOptions = options;
    }

    isChefStepsUrl(url) {
      try {
        const { hostname, pathname } = new URL(url);
        return hostname.includes('chefsteps.com') && /\/recipes\//i.test(pathname);
        } catch (error) {
            return false;
        }
    }

    async importUrls(urls, progressCallback = () => {}) {
      const recipes = [];
      const warnings = [];

      for (let index = 0; index < urls.length; index += 1) {
        const url = urls[index];
        try {
          progressCallback(index + 1, urls.length, url);
          const recipe = await this.importUrl(url);
          if (recipe) {
            recipes.push(recipe);
          }
        } catch (error) {
          warnings.push({ url, message: error.message });
        }
      }

      return { recipes, warnings };
    }

    async importUrl(url) {
      if (!this.isChefStepsUrl(url)) {
        throw new Error('Please provide a valid ChefSteps recipe URL (https://www.chefsteps.com/recipes/...).');
      }

      let html;
      try {
        html = await this.fetchHtml(url);
      } catch (error) {
        throw new Error('ChefSteps blocks direct access from the browser. Download the recipe JSON (Share → Export JSON) and upload it via the Files tab.');
      }

      const recipes = this.extractRecipesFromHtml(html, url);
      if (!recipes.length) {
        throw new Error('No structured recipe data found. Download the recipe JSON and import it through the Files tab.');
      }

      return recipes[0];
    }

    async fetchHtml(url) {
      const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    }

    extractRecipesFromHtml(html, url) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      const recipes = [];

      scripts.forEach((script) => {
        const content = script.textContent;
        if (!content) return;
        try {
          const data = JSON.parse(content);
          recipes.push(...this.collectSchemaRecipes(data, url));
        } catch (error) {
          // Ignore malformed JSON blocks
        }
      });

      return recipes;
    }

    collectSchemaRecipes(node, url) {
      const results = [];
      if (!node) return results;

      if (Array.isArray(node)) {
        node.forEach((child) => {
          results.push(...this.collectSchemaRecipes(child, url));
        });
        return results;
      }

      if (typeof node === 'object') {
        if (Array.isArray(node['@graph'])) {
          results.push(...this.collectSchemaRecipes(node['@graph'], url));
        }

        const type = node['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.some((value) => String(value || '').toLowerCase() === 'recipe')) {
          const normalized = this.normalizeSchemaRecipe(node, url);
          if (normalized) {
            results.push(normalized);
          }
        }
      }

      return results;
    }

    normalizeSchemaRecipe(schema, url) {
      const utils = this.utils;
      const title = schema.name || schema.headline;
      if (!title) return null;

      const base = {
        title,
        description: schema.description || '',
        recipeIngredient: schema.recipeIngredient || schema.ingredients || [],
        recipeInstructions: schema.recipeInstructions || schema.instructions || [],
        recipeYield: schema.recipeYield || schema.yield || schema.servings,
        prepTime: schema.prepTime,
        cookTime: schema.cookTime,
        totalTime: schema.totalTime,
        recipeCategory: schema.recipeCategory,
        recipeCuisine: schema.recipeCuisine,
        tags: schema.keywords
      };

      const context = {
        id: `chefsteps_${utils.slugify ? utils.slugify(title) : Date.now()}`,
        source: 'chefsteps-url',
        sourceUrl: url,
        fileName: null,
        format: 'chefsteps'
      };

      let normalized = null;
      if (typeof utils.normalizeRecipeFromData === 'function') {
        normalized = utils.normalizeRecipeFromData(base, context);
      }

      if (!normalized) {
        // Minimal fallback if utility helpers are unavailable
        const ingredients = Array.isArray(base.recipeIngredient)
          ? base.recipeIngredient.map((line) => ({ raw: line, ingredient: line }))
          : [];
        const instructions = [];
        const instructionSource = base.recipeInstructions;
        if (Array.isArray(instructionSource)) {
          instructionSource.forEach((item) => {
            if (typeof item === 'string') {
              instructions.push(item);
            } else if (item && typeof item === 'object' && item.text) {
              instructions.push(item.text);
            }
          });
        }

        normalized = {
          id: context.id,
          title,
          description: base.description,
          ingredients,
          instructions,
          servings: schema.recipeYield || 4,
          category: schema.recipeCategory || 'ChefSteps',
          cuisine: schema.recipeCuisine || 'Unknown',
          prepTime: 0,
          cookTime: 0,
          totalTime: 0,
          tags: Array.isArray(schema.keywords) ? schema.keywords : [],
          importSource: 'chefsteps',
          sourceUrl: url,
            source: 'ChefSteps',
          createdAt: new Date().toISOString()
        };
      }

                return {
        ...normalized,
        id: normalized.id || context.id,
        importSource: 'chefsteps',
        sourceUrl: url,
        source: 'ChefSteps'
      };
    }
  }

    window.ChefStepsImporter = ChefStepsImporter;
})();
