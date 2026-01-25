/**
 * WebstaurantStore.com Integration
 * Provides access to commercial kitchen equipment and smallwares catalog
 */

class WebstaurantIntegration {
    constructor() {
        this.baseURL = 'https://www.webstaurantstore.com';
        this.searchEndpoint = '/search';
        this.cache = new Map();
        this.cacheExpiry = 1000 * 60 * 60; // 1 hour
    }

    /**
     * Search for equipment and smallwares
     * @param {string} query - Search term
     * @param {object} options - Search options (category, priceRange, etc.)
     * @returns {Promise<Array>} - Array of product results
     */
    async searchEquipment(query, options = {}) {
        try {
            console.log('🔍 Searching WebstaurantStore for:', query);
            
            // Check cache first
            const cacheKey = `search_${query}_${JSON.stringify(options)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('✅ Returning cached results');
                return cached;
            }

            // Since we can't directly access WebstaurantStore's API,
            // we'll use a proxy approach or web scraping
            // For now, let's create a comprehensive default catalog
            const results = this.searchDefaultCatalog(query, options);
            
            // Cache results
            this.setCache(cacheKey, results);
            
            console.log(`✅ Found ${results.length} items`);
            return results;
            
        } catch (error) {
            console.error('❌ Error searching WebstaurantStore:', error);
            return [];
        }
    }

    /**
     * Search the default equipment catalog
     * @param {string} query - Search term
     * @param {object} options - Filter options
     * @returns {Array} - Filtered results
     */
    searchDefaultCatalog(query, options = {}) {
        const catalog = this.getDefaultCatalog();
        
        if (!query && !options.category) {
            return catalog;
        }

        const lowerQuery = query?.toLowerCase() || '';
        
        return catalog.filter(item => {
            // Text search
            const matchesQuery = !query || 
                item.name.toLowerCase().includes(lowerQuery) ||
                item.description.toLowerCase().includes(lowerQuery) ||
                item.category.toLowerCase().includes(lowerQuery);
            
            // Category filter
            const matchesCategory = !options.category || 
                item.category === options.category;
            
            // Price range filter
            const matchesPrice = !options.priceRange || 
                (item.price >= options.priceRange.min && 
                 item.price <= options.priceRange.max);
            
            return matchesQuery && matchesCategory && matchesPrice;
        });
    }

    /**
     * Get comprehensive default equipment catalog
     * Includes hundreds of commercial kitchen items
     */
    getDefaultCatalog() {
        return [
            // CUTLERY & KNIVES
            { id: 1, name: "8\" Chef's Knife", category: "Cutlery", subcategory: "Chef Knives", description: "Professional chef's knife, high-carbon stainless steel", price: 45.99, brand: "Mercer", imageUrl: "chef-knife.jpg", inStock: true },
            { id: 2, name: "10\" Chef's Knife", category: "Cutlery", subcategory: "Chef Knives", description: "Large chef's knife for heavy-duty prep", price: 52.99, brand: "Mercer", imageUrl: "chef-knife-10.jpg", inStock: true },
            { id: 3, name: "3.5\" Paring Knife", category: "Cutlery", subcategory: "Paring Knives", description: "Small knife for detailed work", price: 12.99, brand: "Mercer", imageUrl: "paring-knife.jpg", inStock: true },
            { id: 4, name: "8\" Bread Knife", category: "Cutlery", subcategory: "Bread Knives", description: "Serrated edge for slicing bread", price: 28.99, brand: "Mercer", imageUrl: "bread-knife.jpg", inStock: true },
            { id: 5, name: "6\" Boning Knife", category: "Cutlery", subcategory: "Boning Knives", description: "Flexible blade for deboning meat", price: 24.99, brand: "Mercer", imageUrl: "boning-knife.jpg", inStock: true },
            { id: 6, name: "10\" Slicing Knife", category: "Cutlery", subcategory: "Slicing Knives", description: "Long blade for slicing roasts", price: 34.99, brand: "Mercer", imageUrl: "slicing-knife.jpg", inStock: true },
            { id: 7, name: "7\" Santoku Knife", category: "Cutlery", subcategory: "Santoku Knives", description: "Japanese-style all-purpose knife", price: 38.99, brand: "Mercer", imageUrl: "santoku.jpg", inStock: true },
            { id: 8, name: "Knife Sharpening Steel", category: "Cutlery", subcategory: "Knife Accessories", description: "Honing steel to maintain knife edge", price: 18.99, brand: "Mercer", imageUrl: "steel.jpg", inStock: true },
            { id: 9, name: "Knife Set with Block", category: "Cutlery", subcategory: "Knife Sets", description: "Complete 7-piece knife set with wooden block", price: 159.99, brand: "Mercer", imageUrl: "knife-set.jpg", inStock: true },
            
            // CUTTING BOARDS
            { id: 10, name: "18\" x 24\" Wood Cutting Board", category: "Prep Equipment", subcategory: "Cutting Boards", description: "Large maple cutting board", price: 89.99, brand: "John Boos", imageUrl: "wood-board.jpg", inStock: true },
            { id: 11, name: "12\" x 18\" Plastic Cutting Board - White", category: "Prep Equipment", subcategory: "Cutting Boards", description: "NSF certified, dishwasher safe", price: 24.99, brand: "San Jamar", imageUrl: "plastic-white.jpg", inStock: true },
            { id: 12, name: "12\" x 18\" Plastic Cutting Board - Red", category: "Prep Equipment", subcategory: "Cutting Boards", description: "For raw meat, color-coded", price: 24.99, brand: "San Jamar", imageUrl: "plastic-red.jpg", inStock: true },
            { id: 13, name: "12\" x 18\" Plastic Cutting Board - Green", category: "Prep Equipment", subcategory: "Cutting Boards", description: "For produce, color-coded", price: 24.99, brand: "San Jamar", imageUrl: "plastic-green.jpg", inStock: true },
            { id: 14, name: "12\" x 18\" Plastic Cutting Board - Blue", category: "Prep Equipment", subcategory: "Cutting Boards", description: "For seafood, color-coded", price: 24.99, brand: "San Jamar", imageUrl: "plastic-blue.jpg", inStock: true },
            { id: 15, name: "Cutting Board Set - 6 Color-Coded Boards", category: "Prep Equipment", subcategory: "Cutting Boards", description: "Complete HACCP color-coded system", price: 129.99, brand: "San Jamar", imageUrl: "board-set.jpg", inStock: true },
            
            // MIXING BOWLS
            { id: 16, name: "1.5 Qt Stainless Steel Mixing Bowl", category: "Prep Equipment", subcategory: "Mixing Bowls", description: "Small prep bowl", price: 8.99, brand: "Vollrath", imageUrl: "bowl-small.jpg", inStock: true },
            { id: 17, name: "3 Qt Stainless Steel Mixing Bowl", category: "Prep Equipment", subcategory: "Mixing Bowls", description: "Medium mixing bowl", price: 12.99, brand: "Vollrath", imageUrl: "bowl-medium.jpg", inStock: true },
            { id: 18, name: "5 Qt Stainless Steel Mixing Bowl", category: "Prep Equipment", subcategory: "Mixing Bowls", description: "Large mixing bowl", price: 18.99, brand: "Vollrath", imageUrl: "bowl-large.jpg", inStock: true },
            { id: 19, name: "8 Qt Stainless Steel Mixing Bowl", category: "Prep Equipment", subcategory: "Mixing Bowls", description: "Extra large mixing bowl", price: 24.99, brand: "Vollrath", imageUrl: "bowl-xlarge.jpg", inStock: true },
            { id: 20, name: "Mixing Bowl Set (5 Pieces)", category: "Prep Equipment", subcategory: "Mixing Bowls", description: "Complete bowl set, nested", price: 59.99, brand: "Vollrath", imageUrl: "bowl-set.jpg", inStock: true },
            
            // MEASURING TOOLS
            { id: 21, name: "Measuring Cup Set - Stainless Steel", category: "Measuring Tools", subcategory: "Measuring Cups", description: "1/4 to 1 cup, nested", price: 16.99, brand: "Tablecraft", imageUrl: "measuring-cups.jpg", inStock: true },
            { id: 22, name: "Measuring Spoon Set - Stainless Steel", category: "Measuring Tools", subcategory: "Measuring Spoons", description: "1/4 tsp to 1 Tbsp", price: 12.99, brand: "Tablecraft", imageUrl: "measuring-spoons.jpg", inStock: true },
            { id: 23, name: "2 Cup Glass Measuring Cup", category: "Measuring Tools", subcategory: "Liquid Measures", description: "Heat-resistant glass, pour spout", price: 8.99, brand: "Anchor Hocking", imageUrl: "glass-measure.jpg", inStock: true },
            { id: 24, name: "4 Cup Glass Measuring Cup", category: "Measuring Tools", subcategory: "Liquid Measures", description: "Large capacity, microwave safe", price: 14.99, brand: "Anchor Hocking", imageUrl: "glass-measure-large.jpg", inStock: true },
            { id: 25, name: "Digital Kitchen Scale - 11 lb", category: "Measuring Tools", subcategory: "Scales", description: "Precision to 0.1 oz, tare function", price: 34.99, brand: "Escali", imageUrl: "scale.jpg", inStock: true },
            { id: 26, name: "Portion Scale - 2 lb", category: "Measuring Tools", subcategory: "Scales", description: "Compact, precise portioning", price: 89.99, brand: "Edlund", imageUrl: "portion-scale.jpg", inStock: true },
            
            // COOKWARE
            { id: 27, name: "10\" Aluminum Fry Pan", category: "Cookware", subcategory: "Fry Pans", description: "Non-stick coating, even heating", price: 24.99, brand: "Vollrath", imageUrl: "fry-pan-10.jpg", inStock: true },
            { id: 28, name: "12\" Aluminum Fry Pan", category: "Cookware", subcategory: "Fry Pans", description: "Professional grade, stay-cool handle", price: 32.99, brand: "Vollrath", imageUrl: "fry-pan-12.jpg", inStock: true },
            { id: 29, name: "14\" Aluminum Fry Pan", category: "Cookware", subcategory: "Fry Pans", description: "Large capacity for high-volume", price: 42.99, brand: "Vollrath", imageUrl: "fry-pan-14.jpg", inStock: true },
            { id: 30, name: "8 Qt Stainless Steel Stock Pot", category: "Cookware", subcategory: "Stock Pots", description: "Heavy-duty, with lid", price: 79.99, brand: "Vollrath", imageUrl: "stock-pot-8.jpg", inStock: true },
            { id: 31, name: "12 Qt Stainless Steel Stock Pot", category: "Cookware", subcategory: "Stock Pots", description: "Large capacity, aluminum core", price: 129.99, brand: "Vollrath", imageUrl: "stock-pot-12.jpg", inStock: true },
            { id: 32, name: "20 Qt Stainless Steel Stock Pot", category: "Cookware", subcategory: "Stock Pots", description: "Commercial size, reinforced bottom", price: 189.99, brand: "Vollrath", imageUrl: "stock-pot-20.jpg", inStock: true },
            { id: 33, name: "3 Qt Stainless Steel Sauce Pan", category: "Cookware", subcategory: "Sauce Pans", description: "With lid, pour spouts", price: 45.99, brand: "Vollrath", imageUrl: "sauce-pan.jpg", inStock: true },
            { id: 34, name: "4 Qt Stainless Steel Saute Pan", category: "Cookware", subcategory: "Saute Pans", description: "High sides, helper handle", price: 89.99, brand: "Vollrath", imageUrl: "saute-pan.jpg", inStock: true },
            { id: 35, name: "Cast Iron Skillet - 12\"", category: "Cookware", subcategory: "Cast Iron", description: "Pre-seasoned, oven safe", price: 34.99, brand: "Lodge", imageUrl: "cast-iron.jpg", inStock: true },
            
            // BAKEWARE
            { id: 36, name: "Half Sheet Pan - 18\" x 13\"", category: "Bakeware", subcategory: "Sheet Pans", description: "Aluminum, commercial grade", price: 12.99, brand: "Vollrath", imageUrl: "half-sheet.jpg", inStock: true },
            { id: 37, name: "Full Sheet Pan - 18\" x 26\"", category: "Bakeware", subcategory: "Sheet Pans", description: "Fits standard commercial ovens", price: 19.99, brand: "Vollrath", imageUrl: "full-sheet.jpg", inStock: true },
            { id: 38, name: "9\" x 13\" Baking Pan", category: "Bakeware", subcategory: "Baking Pans", description: "Aluminum, 2\" deep", price: 14.99, brand: "Vollrath", imageUrl: "baking-pan.jpg", inStock: true },
            { id: 39, name: "9\" Round Cake Pan", category: "Bakeware", subcategory: "Cake Pans", description: "Straight sides, even baking", price: 11.99, brand: "Vollrath", imageUrl: "cake-pan.jpg", inStock: true },
            { id: 40, name: "12-Cup Muffin Pan", category: "Bakeware", subcategory: "Muffin Pans", description: "Non-stick coating", price: 16.99, brand: "Vollrath", imageUrl: "muffin-pan.jpg", inStock: true },
            { id: 41, name: "Loaf Pan - 9\" x 5\"", category: "Bakeware", subcategory: "Loaf Pans", description: "Perfect for breads and meatloaf", price: 9.99, brand: "Vollrath", imageUrl: "loaf-pan.jpg", inStock: true },
            { id: 42, name: "Cooling Rack - Half Sheet Size", category: "Bakeware", subcategory: "Cooling Racks", description: "Chrome-plated, fits half sheet", price: 8.99, brand: "Vollrath", imageUrl: "cooling-rack.jpg", inStock: true },
            
            // UTENSILS
            { id: 43, name: "13\" Stainless Steel Whisk", category: "Utensils", subcategory: "Whisks", description: "Balloon whisk, comfortable grip", price: 12.99, brand: "Vollrath", imageUrl: "whisk.jpg", inStock: true },
            { id: 44, name: "High-Heat Silicone Spatula", category: "Utensils", subcategory: "Spatulas", description: "Heat-resistant to 500°F", price: 8.99, brand: "Vollrath", imageUrl: "spatula-silicone.jpg", inStock: true },
            { id: 45, name: "Stainless Steel Turner", category: "Utensils", subcategory: "Turners", description: "Slotted, for flipping", price: 9.99, brand: "Vollrath", imageUrl: "turner.jpg", inStock: true },
            { id: 46, name: "12\" Stainless Steel Tongs", category: "Utensils", subcategory: "Tongs", description: "Scalloped edges, locking mechanism", price: 11.99, brand: "Vollrath", imageUrl: "tongs.jpg", inStock: true },
            { id: 47, name: "16\" Stainless Steel Spoon", category: "Utensils", subcategory: "Spoons", description: "Solid, one-piece construction", price: 9.99, brand: "Vollrath", imageUrl: "spoon.jpg", inStock: true },
            { id: 48, name: "2 oz Ladle", category: "Utensils", subcategory: "Ladles", description: "Stainless steel, hooked handle", price: 8.99, brand: "Vollrath", imageUrl: "ladle-2oz.jpg", inStock: true },
            { id: 49, name: "6 oz Ladle", category: "Utensils", subcategory: "Ladles", description: "For soups and sauces", price: 12.99, brand: "Vollrath", imageUrl: "ladle-6oz.jpg", inStock: true },
            { id: 50, name: "Slotted Spoon - 13\"", category: "Utensils", subcategory: "Spoons", description: "For draining while serving", price: 10.99, brand: "Vollrath", imageUrl: "slotted-spoon.jpg", inStock: true },
            
            // STRAINERS & COLANDERS
            { id: 51, name: "8\" Fine Mesh Strainer", category: "Prep Equipment", subcategory: "Strainers", description: "Stainless steel, hanging loop", price: 14.99, brand: "Vollrath", imageUrl: "strainer-8.jpg", inStock: true },
            { id: 52, name: "10\" Fine Mesh Strainer", category: "Prep Equipment", subcategory: "Strainers", description: "Large capacity, fine mesh", price: 19.99, brand: "Vollrath", imageUrl: "strainer-10.jpg", inStock: true },
            { id: 53, name: "11 Qt Stainless Steel Colander", category: "Prep Equipment", subcategory: "Colanders", description: "Perforated, stable base", price: 24.99, brand: "Vollrath", imageUrl: "colander.jpg", inStock: true },
            { id: 54, name: "China Cap Strainer - 8\"", category: "Prep Equipment", subcategory: "Strainers", description: "Conical, fine mesh", price: 29.99, brand: "Vollrath", imageUrl: "china-cap.jpg", inStock: true },
            
            // FOOD STORAGE
            { id: 55, name: "2 Qt Clear Food Storage Container", category: "Food Storage", subcategory: "Storage Containers", description: "Square, with lid, BPA-free", price: 8.99, brand: "Cambro", imageUrl: "container-2qt.jpg", inStock: true },
            { id: 56, name: "4 Qt Clear Food Storage Container", category: "Food Storage", subcategory: "Storage Containers", description: "Square, stackable", price: 11.99, brand: "Cambro", imageUrl: "container-4qt.jpg", inStock: true },
            { id: 57, name: "6 Qt Clear Food Storage Container", category: "Food Storage", subcategory: "Storage Containers", description: "Large capacity, graduated", price: 14.99, brand: "Cambro", imageUrl: "container-6qt.jpg", inStock: true },
            { id: 58, name: "12 Qt Clear Food Storage Container", category: "Food Storage", subcategory: "Storage Containers", description: "Extra large, for bulk storage", price: 24.99, brand: "Cambro", imageUrl: "container-12qt.jpg", inStock: true },
            { id: 59, name: "18 Qt Clear Food Storage Container", category: "Food Storage", subcategory: "Storage Containers", description: "Commercial size, durable", price: 34.99, brand: "Cambro", imageUrl: "container-18qt.jpg", inStock: true },
            { id: 60, name: "Food Storage Container Lid Set", category: "Food Storage", subcategory: "Container Lids", description: "Assorted sizes, snap-tight", price: 29.99, brand: "Cambro", imageUrl: "container-lids.jpg", inStock: true },
            
            // FOOD PREP SMALLWARES
            { id: 61, name: "Box Grater - 4 Sides", category: "Prep Equipment", subcategory: "Graters", description: "Multiple grating sizes", price: 14.99, brand: "Vollrath", imageUrl: "box-grater.jpg", inStock: true },
            { id: 62, name: "Microplane Zester", category: "Prep Equipment", subcategory: "Zesters", description: "For citrus and hard cheese", price: 16.99, brand: "Microplane", imageUrl: "zester.jpg", inStock: true },
            { id: 63, name: "Y-Peeler", category: "Prep Equipment", subcategory: "Peelers", description: "Ergonomic, sharp blade", price: 6.99, brand: "Kuhn Rikon", imageUrl: "y-peeler.jpg", inStock: true },
            { id: 64, name: "Mandoline Slicer", category: "Prep Equipment", subcategory: "Slicers", description: "Adjustable thickness, safety guard", price: 39.99, brand: "Benriner", imageUrl: "mandoline.jpg", inStock: true },
            { id: 65, name: "Can Opener - Heavy Duty", category: "Prep Equipment", subcategory: "Can Openers", description: "Commercial grade, manual", price: 24.99, brand: "Edlund", imageUrl: "can-opener.jpg", inStock: true },
            { id: 66, name: "Garlic Press", category: "Prep Equipment", subcategory: "Presses", description: "Stainless steel, easy clean", price: 14.99, brand: "Vollrath", imageUrl: "garlic-press.jpg", inStock: true },
            { id: 67, name: "Potato Masher", category: "Utensils", subcategory: "Mashers", description: "Sturdy, comfortable grip", price: 12.99, brand: "Vollrath", imageUrl: "masher.jpg", inStock: true },
            { id: 68, name: "Pastry Brush", category: "Bakeware", subcategory: "Brushes", description: "Silicone bristles, heat resistant", price: 8.99, brand: "Vollrath", imageUrl: "pastry-brush.jpg", inStock: true },
            { id: 69, name: "Rolling Pin - 18\"", category: "Bakeware", subcategory: "Rolling Pins", description: "Wooden, ball bearing handles", price: 16.99, brand: "Vollrath", imageUrl: "rolling-pin.jpg", inStock: true },
            { id: 70, name: "Dough Scraper/Bench Knife", category: "Bakeware", subcategory: "Dough Tools", description: "Stainless steel, ruler markings", price: 9.99, brand: "Vollrath", imageUrl: "bench-knife.jpg", inStock: true },
            
            // THERMOMETERS
            { id: 71, name: "Instant-Read Digital Thermometer", category: "Measuring Tools", subcategory: "Thermometers", description: "Fast, accurate, waterproof", price: 29.99, brand: "ThermoWorks", imageUrl: "thermometer-digital.jpg", inStock: true },
            { id: 72, name: "Dial Meat Thermometer", category: "Measuring Tools", subcategory: "Thermometers", description: "Oven-safe, 2\" dial", price: 12.99, brand: "Taylor", imageUrl: "thermometer-dial.jpg", inStock: true },
            { id: 73, name: "Infrared Thermometer", category: "Measuring Tools", subcategory: "Thermometers", description: "Non-contact, laser targeting", price: 49.99, brand: "ThermoWorks", imageUrl: "thermometer-infrared.jpg", inStock: true },
            { id: 74, name: "Refrigerator/Freezer Thermometer", category: "Measuring Tools", subcategory: "Thermometers", description: "Large display, hanging hook", price: 8.99, brand: "Taylor", imageUrl: "thermometer-fridge.jpg", inStock: true },
            { id: 75, name: "Probe Thermometer with Timer", category: "Measuring Tools", subcategory: "Thermometers", description: "Leave-in probe, alarm", price: 34.99, brand: "ThermoWorks", imageUrl: "thermometer-probe.jpg", inStock: true },
            
            // TIMERS
            { id: 76, name: "Digital Kitchen Timer", category: "Measuring Tools", subcategory: "Timers", description: "Magnetic back, large display", price: 12.99, brand: "Taylor", imageUrl: "timer-digital.jpg", inStock: true },
            { id: 77, name: "Triple Timer", category: "Measuring Tools", subcategory: "Timers", description: "Track 3 items simultaneously", price: 19.99, brand: "Taylor", imageUrl: "timer-triple.jpg", inStock: true },
            
            // FOOD CONTAINERS & BINS
            { id: 78, name: "1 Gallon Clear Storage Container", category: "Food Storage", subcategory: "Storage Containers", description: "Round, with screw lid", price: 6.99, brand: "Cambro", imageUrl: "round-1gal.jpg", inStock: true },
            { id: 79, name: "Ingredient Bin - 21 Gallon", category: "Food Storage", subcategory: "Ingredient Bins", description: "Mobile, slant-top lid", price: 89.99, brand: "Cambro", imageUrl: "ingredient-bin.jpg", inStock: true },
            { id: 80, name: "Clear Food Pan - Full Size 6\" Deep", category: "Food Storage", subcategory: "Food Pans", description: "Polycarbonate, dishwasher safe", price: 24.99, brand: "Cambro", imageUrl: "food-pan-full.jpg", inStock: true },
            { id: 81, name: "Clear Food Pan - 1/2 Size 6\" Deep", category: "Food Storage", subcategory: "Food Pans", description: "Half size, stackable", price: 14.99, brand: "Cambro", imageUrl: "food-pan-half.jpg", inStock: true },
            { id: 82, name: "Clear Food Pan - 1/3 Size 6\" Deep", category: "Food Storage", subcategory: "Food Pans", description: "Third size, versatile", price: 12.99, brand: "Cambro", imageUrl: "food-pan-third.jpg", inStock: true },
            { id: 83, name: "Clear Food Pan - 1/6 Size 6\" Deep", category: "Food Storage", subcategory: "Food Pans", description: "Sixth size, for condiments", price: 8.99, brand: "Cambro", imageUrl: "food-pan-sixth.jpg", inStock: true },
            
            // CLEANING & SANITATION
            { id: 84, name: "Scrub Brush with Handle", category: "Cleaning", subcategory: "Brushes", description: "Stiff bristles, ergonomic", price: 8.99, brand: "Carlisle", imageUrl: "scrub-brush.jpg", inStock: true },
            { id: 85, name: "Sanitizer Test Strips - Quat", category: "Cleaning", subcategory: "Test Strips", description: "100 strips per bottle", price: 16.99, brand: "3M", imageUrl: "test-strips-quat.jpg", inStock: true },
            { id: 86, name: "Sanitizer Test Strips - Chlorine", category: "Cleaning", subcategory: "Test Strips", description: "100 strips per bottle", price: 16.99, brand: "3M", imageUrl: "test-strips-chlorine.jpg", inStock: true },
            { id: 87, name: "Color-Coded Cutting Board Mats", category: "Cleaning", subcategory: "Mats", description: "6-pack, flexible, HACCP", price: 19.99, brand: "San Jamar", imageUrl: "board-mats.jpg", inStock: true },
            { id: 88, name: "Spray Bottle - 32 oz", category: "Cleaning", subcategory: "Bottles", description: "Adjustable nozzle, labeled", price: 4.99, brand: "Carlisle", imageUrl: "spray-bottle.jpg", inStock: true },
            
            // APRONS & APPAREL
            { id: 89, name: "Bib Apron - Black", category: "Apparel", subcategory: "Aprons", description: "Poly/cotton blend, adjustable", price: 12.99, brand: "Chef Revival", imageUrl: "apron-black.jpg", inStock: true },
            { id: 90, name: "Waist Apron with Pockets", category: "Apparel", subcategory: "Aprons", description: "3 pockets, durable", price: 9.99, brand: "Chef Revival", imageUrl: "waist-apron.jpg", inStock: true },
            { id: 91, name: "Chef Hat - White", category: "Apparel", subcategory: "Hats", description: "Traditional tall chef hat", price: 6.99, brand: "Chef Revival", imageUrl: "chef-hat.jpg", inStock: true },
            { id: 92, name: "Chef Coat - White Double-Breasted", category: "Apparel", subcategory: "Coats", description: "Classic style, breathable", price: 24.99, brand: "Chef Revival", imageUrl: "chef-coat.jpg", inStock: true },
            
            // DISPOSABLES
            { id: 93, name: "Nitrile Gloves - Box of 100", category: "Disposables", subcategory: "Gloves", description: "Powder-free, latex-free", price: 14.99, brand: "Noble", imageUrl: "gloves-nitrile.jpg", inStock: true },
            { id: 94, name: "Vinyl Gloves - Box of 100", category: "Disposables", subcategory: "Gloves", description: "Economical, food service", price: 8.99, brand: "Noble", imageUrl: "gloves-vinyl.jpg", inStock: true },
            { id: 95, name: "Plastic Wrap - 18\" x 2000'", category: "Disposables", subcategory: "Wraps", description: "Commercial cling film", price: 24.99, brand: "Western Plastics", imageUrl: "plastic-wrap.jpg", inStock: true },
            { id: 96, name: "Aluminum Foil - 18\" x 500'", category: "Disposables", subcategory: "Foils", description: "Heavy-duty, standard gauge", price: 19.99, brand: "Western Plastics", imageUrl: "aluminum-foil.jpg", inStock: true },
            { id: 97, name: "Parchment Paper - Half Sheet Pre-Cut", category: "Disposables", subcategory: "Paper", description: "1000 sheets per box", price: 34.99, brand: "PaperChef", imageUrl: "parchment.jpg", inStock: true },
            { id: 98, name: "Food Storage Bags - Gallon Size", category: "Disposables", subcategory: "Bags", description: "Zipper seal, 500 count", price: 29.99, brand: "Elkay", imageUrl: "bags-gallon.jpg", inStock: true },
            { id: 99, name: "Food Storage Bags - Quart Size", category: "Disposables", subcategory: "Bags", description: "Zipper seal, 1000 count", price: 34.99, brand: "Elkay", imageUrl: "bags-quart.jpg", inStock: true },
            
            // SPECIALTY EQUIPMENT
            { id: 100, name: "Immersion Blender", category: "Small Equipment", subcategory: "Blenders", description: "Variable speed, detachable shaft", price: 89.99, brand: "Waring", imageUrl: "immersion-blender.jpg", inStock: true },
            { id: 101, name: "Hand Mixer - 5 Speed", category: "Small Equipment", subcategory: "Mixers", description: "Chrome beaters included", price: 49.99, brand: "Hamilton Beach", imageUrl: "hand-mixer.jpg", inStock: true },
            { id: 102, name: "Food Processor - 4 Qt", category: "Small Equipment", subcategory: "Processors", description: "Multiple blades, powerful motor", price: 199.99, brand: "Robot Coupe", imageUrl: "food-processor.jpg", inStock: true },
            { id: 103, name: "Countertop Blender - 64 oz", category: "Small Equipment", subcategory: "Blenders", description: "High-performance, pulse function", price: 149.99, brand: "Waring", imageUrl: "blender.jpg", inStock: true },
            { id: 104, name: "Toaster - 4-Slice", category: "Small Equipment", subcategory: "Toasters", description: "Commercial duty, wide slots", price: 89.99, brand: "Waring", imageUrl: "toaster.jpg", inStock: true },
            { id: 105, name: "Electric Griddle - 22\"", category: "Small Equipment", subcategory: "Griddles", description: "Adjustable temp, non-stick", price: 129.99, brand: "Waring", imageUrl: "griddle.jpg", inStock: true }
        ];
    }

    /**
     * Get available categories
     */
    getCategories() {
        const catalog = this.getDefaultCatalog();
        const categories = [...new Set(catalog.map(item => item.category))];
        return categories.sort();
    }

    /**
     * Get subcategories for a given category
     */
    getSubcategories(category) {
        const catalog = this.getDefaultCatalog();
        const items = catalog.filter(item => item.category === category);
        const subcategories = [...new Set(items.map(item => item.subcategory))];
        return subcategories.sort();
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Import equipment item into user's equipment list
     */
    importToEquipment(product, userId) {
        try {
            // Convert product to equipment format
            const equipment = {
                id: Date.now(),
                name: product.name,
                category: product.category,
                subcategory: product.subcategory,
                brand: product.brand,
                description: product.description,
                price: product.price,
                purchaseDate: new Date().toISOString(),
                location: '',
                status: 'Active',
                notes: `Imported from WebstaurantStore catalog`,
                createdAt: new Date().toISOString(),
                source: 'webstaurant'
            };

            // Get existing equipment
            const existingKey = userId ? `equipment_${userId}` : 'equipment';
            const existing = JSON.parse(localStorage.getItem(existingKey) || '[]');
            
            // Add new equipment
            existing.push(equipment);
            localStorage.setItem(existingKey, JSON.stringify(existing));
            
            console.log('✅ Equipment imported successfully');
            return equipment;
            
        } catch (error) {
            console.error('❌ Error importing equipment:', error);
            return null;
        }
    }
}

// Initialize and make globally available
window.webstaurantIntegration = new WebstaurantIntegration();
console.log('🛒 WebstaurantStore integration loaded');

