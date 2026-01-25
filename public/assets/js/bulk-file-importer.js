
(function () {
  const FRACTION_MAP = {
    '¼': 0.25,
    '½': 0.5,
    '¾': 0.75,
    '⅓': 1 / 3,
    '⅔': 2 / 3,
    '⅛': 0.125,
    '⅜': 0.375,
    '⅝': 0.625,
    '⅞': 0.875
  };

  const DEFAULT_SERVINGS = 4;
  const INGREDIENT_KEYS = ['ingredients', 'recipeIngredient', 'ingredientList', 'items'];
  const INSTRUCTION_KEYS = ['instructions', 'recipeInstructions', 'steps', 'directions', 'method'];

  function slugify(value) {
    if (!value) return 'recipe';
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parseFractionToken(token) {
    if (!token) return null;
    const trimmed = token.trim();
    if (FRACTION_MAP[trimmed] !== undefined) {
      return FRACTION_MAP[trimmed];
    }
    if (/^[0-9]+\\/[0-9]+$/.test(trimmed)) {
      const parts = trimmed.split('/');
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1] || 1);
      if (!Number.isNaN(numerator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
    const numeric = parseFloat(trimmed.replace(',', '.'));
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
    return null;
  }

  function parseQuantityFromString(text) {
    if (!text) return '';
    const match = String(text).trim().match(/^([0-9\\s\\/.,¼½¾⅓⅔⅛⅜⅝⅞-]+)/);
    if (!match) return '';
    const tokens = match[1].trim().split(/\\s+/);
    let total = 0;
    let found = false;
    tokens.forEach(token => {
      const parsed = parseFractionToken(token);
      if (parsed !== null) {
        total += parsed;
        found = true;
      }
    });
    return found ? total : '';
  }

  function stripQuantityFromLine(line) {
    if (!line) return { remainder: '', quantity: '', unit: '' };
    const cleaned = line.trim();
    const quantityMatch = cleaned.match(/^([0-9\\s\\/.,¼½¾⅓⅔⅛⅜⅝⅞-]+)/);
    let remainder = cleaned;
    let unit = '';
    let quantity = '';

    if (quantityMatch) {
      quantity = parseQuantityFromString(quantityMatch[0]);
      remainder = cleaned.slice(quantityMatch[0].length).trim();

      const unitMatch = remainder.match(/^(\\w+)/);
      if (unitMatch) {
        unit = unitMatch[1];
        remainder = remainder.slice(unit.length).trim();
      }
    }

    return { remainder, quantity, unit };
  }

  function parseServings(value) {
    if (value === null || value === undefined) return DEFAULT_SERVINGS;
    if (typeof value === 'number') return value || DEFAULT_SERVINGS;
    const text = String(value).trim();
    const match = text.match(/([0-9]+)/);
    if (match) {
      return parseInt(match[1], 10) || DEFAULT_SERVINGS;
    }
    return DEFAULT_SERVINGS;
  }

  function parseIsoDuration(duration) {
    if (!duration || typeof duration !== 'string') return 0;
    const match = duration.match(/P(?:(\\d+)D)?(?:T(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?)?/i);
    if (!match) return 0;
    const days = parseInt(match[1] || '0', 10);
    const hours = parseInt(match[2] || '0', 10);
    const minutes = parseInt(match[3] || '0', 10);
    const seconds = parseInt(match[4] || '0', 10);
    return days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
  }

  function parseDuration(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const text = String(value).trim();
    if (/^P/i.test(text)) {
      return parseIsoDuration(text);
    }
    const hourMatch = text.match(/([0-9.]+)\\s*(hours?|hrs?|h)/i);
    if (hourMatch) {
      return Math.round(parseFloat(hourMatch[1]) * 60);
    }
    const minuteMatch = text.match(/([0-9.]+)\\s*(minutes?|mins?|m)/i);
    if (minuteMatch) {
      return Math.round(parseFloat(minuteMatch[1]));
    }
    return 0;
  }

  function normalizeTags(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(tag => String(tag).trim()).filter(Boolean);
    }
    return String(value)
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  function collectIngredientEntries(node, label = null) {
    const results = [];
    if (!node || typeof node !== 'object') return results;

    const addEntry = (value, component) => {
      if (value === null || value === undefined || value === '') return;
      results.push({ value, component });
    };

    INGREDIENT_KEYS.forEach(key => {
      const value = node[key];
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(item => addEntry(item, label));
      } else if (typeof value === 'string') {
        addEntry(value, label);
      }
    });

    ['components', 'sections', 'parts', 'componentList'].forEach(key => {
      const list = node[key];
      if (Array.isArray(list)) {
        list.forEach(item => {
          const nestedLabel = item?.name || item?.title || label;
          collectIngredientEntries(item, nestedLabel).forEach(entry => results.push(entry));
        });
      }
    });

    return results;
  }

  function normalizeIngredientEntry(entry) {
    if (!entry) return null;
    const component = entry.component || null;
    let payload = entry.value !== undefined ? entry.value : entry;

    if (payload === null || payload === undefined) return null;

    if (Array.isArray(payload)) {
      const flattened = [];
      payload.forEach(item => {
        const normalized = normalizeIngredientEntry({ value: item, component });
        if (Array.isArray(normalized)) {
          normalized.forEach(n => flattened.push(n));
        } else if (normalized) {
          flattened.push(normalized);
        }
      });
      return flattened;
    }

    if (typeof payload === 'object' && payload.ingredients) {
      return collectIngredientEntries(payload, payload.name || payload.title || component)
        .map(item => normalizeIngredientEntry(item))
        .flat()
        .filter(Boolean);
    }

    let rawLine = '';
    let quantity = '';
    let unit = '';
    let ingredientName = '';
    let preparation = '';

    if (typeof payload === 'string') {
      rawLine = payload.trim();
      const parsed = stripQuantityFromLine(rawLine);
      quantity = parsed.quantity;
      unit = parsed.unit;
      ingredientName = parsed.remainder || rawLine;
    } else if (typeof payload === 'object') {
      rawLine = (payload.original || payload.raw || payload.text || payload.line || payload.item || '').trim();
      if (!rawLine) {
        const parts = [
          payload.quantity || payload.amount || '',
          payload.unit || payload.measure || '',
          payload.name || payload.ingredient || ''
        ].filter(Boolean);
        rawLine = parts.join(' ').trim();
      }
      const parsed = stripQuantityFromLine(rawLine);
      quantity = payload.quantity !== undefined ? payload.quantity : (payload.amount !== undefined ? payload.amount : parsed.quantity);
      unit = payload.unit || payload.measure || parsed.unit;
      ingredientName = (payload.name || payload.ingredient || parsed.remainder || rawLine).trim();
      preparation = payload.preparation || payload.note || payload.comment || '';
    }

    if (!rawLine) rawLine = ingredientName;
    if (!ingredientName) ingredientName = rawLine;

    return {
      raw: rawLine,
      ingredient: ingredientName,
      quantity,
      unit,
      preparation,
      component
    };
  }

  function normalizeIngredients(raw) {
    const entries = collectIngredientEntries(raw);
    const normalized = [];
    entries.forEach(entry => {
      const result = normalizeIngredientEntry(entry);
      if (Array.isArray(result)) {
        result.forEach(item => {
          if (item && item.raw) normalized.push(item);
        });
      } else if (result && result.raw) {
        normalized.push(result);
      }
    });
    return normalized;
  }

  function collectInstructionEntries(node) {
    const results = [];
    if (!node || typeof node !== 'object') return results;

    const addEntry = value => {
      if (value === null || value === undefined || value === '') return;
      results.push(value);
    };

    INSTRUCTION_KEYS.forEach(key => {
      const value = node[key];
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(item => addEntry(item));
      } else {
        addEntry(value);
      }
    });

    ['sections', 'components', 'parts', 'itemListElement'].forEach(key => {
      const list = node[key];
      if (Array.isArray(list)) {
        list.forEach(item => {
          collectInstructionEntries(item).forEach(entry => results.push(entry));
        });
      } else if (list && typeof list === 'object') {
        collectInstructionEntries(list).forEach(entry => results.push(entry));
      }
    });

    return results;
  }

  function normalizeInstructionEntry(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      return trimmed ? trimmed : null;
    }
    if (Array.isArray(entry)) {
      return entry
        .map(item => normalizeInstructionEntry(item))
        .flat()
        .filter(Boolean);
    }
    if (typeof entry === 'object') {
      if (Array.isArray(entry.itemListElement)) {
        return entry.itemListElement
          .map(item => normalizeInstructionEntry(item))
          .flat()
          .filter(Boolean);
      }
      if (entry.text) return entry.text.trim();
      if (entry.description) return entry.description.trim();
      if (entry.content) return entry.content.trim();
    }
    return null;
  }

  function normalizeInstructions(raw) {
    const entries = collectInstructionEntries(raw);
    const normalized = [];
    entries.forEach(entry => {
      const result = normalizeInstructionEntry(entry);
      if (Array.isArray(result)) {
        result.forEach(item => {
          if (item) normalized.push(item);
        });
      } else if (result) {
        normalized.push(result);
      }
    });
    return normalized;
  }

  function normalizeRecipeFromData(raw, context = {}) {
    if (!raw) return null;
    const title = context.title || raw.title || raw.name || raw.recipeName || raw.label;
    if (!title) return null;

    const ingredients = normalizeIngredients(raw);
    const instructions = normalizeInstructions(raw);

    const prepTime = parseDuration(context.prepTime || raw.prepTime);
    const cookTime = parseDuration(context.cookTime || raw.cookTime);
    const totalTimeRaw = parseDuration(context.totalTime || raw.totalTime);
    const totalTime = totalTimeRaw || (prepTime + cookTime);

    const idBase = context.id || raw.id || raw.slug;
    const recipeId = idBase ? `json_${slugify(idBase)}` : null;

    return {
      id: recipeId,
      title,
      description: context.description || raw.description || raw.summary || '',
      ingredients,
      instructions,
      servings: parseServings(context.servings || raw.servings || raw.recipeYield || raw.yield),
      category: context.category || raw.category || raw.recipeCategory || 'Imported',
      cuisine: context.cuisine || raw.cuisine || raw.recipeCuisine || 'Unknown',
      difficulty: context.difficulty || raw.difficulty || 'Medium',
      prepTime,
      cookTime,
      totalTime,
      tags: normalizeTags(context.tags || raw.tags || raw.keywords || raw.labels),
      createdAt: context.createdAt || new Date().toISOString(),
      sourceFile: context.fileName || null,
      sourceFormat: context.format || null,
      importSource: context.source || 'json-file',
      isComplete: ingredients.length > 0 && instructions.length > 0,
      metadata: {
        original: raw,
        sourceFile: context.fileName || null,
        sourceUrl: context.sourceUrl || null
      }
    };
  }

  function getExtension(fileName) {
    if (!fileName) return '';
    const parts = fileName.split('.');
    if (parts.length <= 1) return '';
    return parts.pop().toLowerCase();
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => reject(new Error(`Unable to read file ${file.name}`));
      reader.readAsText(file);
    });
  }

  class BulkFileRecipeImporter {
    constructor(options = {}) {
      this.options = options;
      this.detector = null;
    }

    ensureDetector() {
      if (!this.detector && typeof window.MultiRecipeDetector === 'function') {
        this.detector = new window.MultiRecipeDetector();
      }
      return this.detector;
    }

    async importFiles(files, onProgress = () => {}) {
      const recipes = [];
      const warnings = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const label = file.name || `File ${i + 1}`;
          onProgress(i + 1, files.length, label);
          const importedRecipes = await this.importFile(file, i);
          importedRecipes.forEach(recipe => recipes.push(recipe));
        } catch (error) {
          warnings.push({ file: file.name, message: error.message });
        }
      }

      return { recipes, warnings };
    }

    async importFile(file, index = 0) {
      const extension = getExtension(file.name);
      if (extension === 'json') {
        return this.parseJsonFile(file);
      }
      if (['txt', 'text', 'md', 'markdown'].includes(extension)) {
        return this.parseTextFile(file);
      }
      if (extension === 'csv') {
        return this.parseCsvFile(file);
      }
      throw new Error(`Unsupported file format \"${extension || 'unknown'}\". Try JSON, TXT, or CSV files.`);
    }

    async parseJsonFile(file) {
      const text = await readFileAsText(file);
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error('Invalid JSON file.');
      }

      const rawRecipes = this.extractJsonRecipes(data);
      if (!rawRecipes.length) {
        throw new Error('No recipes found in JSON file.');
      }

      return rawRecipes
        .map((raw, idx) => normalizeRecipeFromData(raw, {
          id: raw.id ? `json_${slugify(raw.id)}` : null,
          fileName: file.name,
          format: getExtension(file.name),
          source: 'json-file',
          index: idx
        }))
        .filter(Boolean)
        .map((recipe, idx) => ({
          ...recipe,
          id: recipe.id || this.makeId(file.name, idx),
          sourceFile: file.name,
          sourceFormat: getExtension(file.name),
          importSource: 'json-file'
        }));
    }

    extractJsonRecipes(data) {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.recipes)) return data.recipes;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.data)) return data.data;
      if (data.recipe) return [data.recipe];
      return [data];
    }

    async parseTextFile(file) {
      const detector = this.ensureDetector();
      if (!detector) {
        throw new Error('Text parser not available.');
      }
      const text = await readFileAsText(file);
      const recipes = detector.detectRecipes(text) || [];
      return recipes.map((recipe, idx) => ({
        ...recipe,
        id: recipe.id || this.makeId(file.name, idx),
        createdAt: recipe.createdAt || new Date().toISOString(),
        importSource: 'text-file',
        sourceFile: file.name,
        sourceFormat: getExtension(file.name),
        isComplete: typeof recipe.isComplete === 'boolean'
          ? recipe.isComplete
          : (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 &&
             Array.isArray(recipe.instructions) && recipe.instructions.length > 0)
      }));
    }

    async parseCsvFile(file) {
      const text = await readFileAsText(file);
      const detector = this.ensureDetector();
      if (detector) {
        const recipes = detector.detectRecipes(text) || [];
        if (recipes.length) {
          return recipes.map((recipe, idx) => ({
            ...recipe,
            id: recipe.id || this.makeId(file.name, idx),
            createdAt: recipe.createdAt || new Date().toISOString(),
            importSource: 'csv-file',
            sourceFile: file.name,
            sourceFormat: getExtension(file.name)
          }));
        }
      }
      // Fallback: treat CSV as lines joined with newlines
      const normalized = normalizeRecipeFromData({
        title: file.name.replace(/\\.[^.]+$/, ''),
        ingredients: text.split('\\n').slice(1)
      }, {
        fileName: file.name,
        format: getExtension(file.name),
        source: 'csv-file'
      });
      return normalized ? [{ ...normalized, id: normalized.id || this.makeId(file.name, 0) }] : [];
    }

    makeId(fileName, index) {
      return `${slugify(fileName)}_${Date.now()}_${index}`;
    }
  }

  const RecipeImportUtils = {
    slugify,
    parseServings,
    parseDuration,
    parseIsoDuration,
    normalizeIngredients,
    normalizeInstructions,
    normalizeRecipeFromData
  };

  window.RecipeImportUtils = RecipeImportUtils;
  window.BulkFileRecipeImporter = BulkFileRecipeImporter;
})();
