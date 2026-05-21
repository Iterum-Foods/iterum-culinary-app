#!/usr/bin/env python3
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "public" / "recipe-developer.html"
text = p.read_text(encoding="utf-8")

def must_replace(old: str, new: str, label: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f"{label} not found ({len(old)} chars)")
    text = text.replace(old, new, 1)

must_replace(
    "            <div class=\"tc-rd-sticky-bar\">\n            <motion.div class=\"recipe-progress tc-rd-step-bar\">".replace(
        "motion.div", "div"
    ),
    """            <div class="tc-rd-sticky-bar">
                <div class="tc-rd-toolbar">
                    <div class="tc-rd-toolbar__brand">
                        <span class="tc-rd-toolbar__icon" aria-hidden="true">📖</span>
                        <div class="min-w-0">
                            <div class="tc-rd-toolbar__eyebrow" id="tc-rd-type-label">Kitchen dish · Working draft</div>
                            <div class="tc-rd-toolbar__title" id="tc-rd-toolbar-title">Untitled recipe</div>
                        </div>
                    </div>
                    <div class="tc-rd-toolbar__actions">
                        <span class="tc-rd-save-hint" id="tc-rd-save-hint" aria-live="polite">Auto-save every 30s</span>
                        <span id="recipe-status" class="tc-status-pill tc-status-pill--draft">New recipe</span>
                        <button type="button" class="btn btn-secondary btn-sm tc-btn tc-btn-outline" onclick="saveRecipe()">Save</button>
                        <button type="button" class="btn btn-primary btn-sm tc-btn tc-btn-accent" onclick="saveAndContinue()">Save &amp; continue</button>
                    </div>
                </div>
                <div class="tc-rd-type-grid" role="group" aria-label="Recipe type">
                    <button type="button" class="tc-rd-type-btn" data-recipe-type="bar-prep" data-category="prep-recipe">
                        <span class="tc-rd-type-btn__glyph" aria-hidden="true">🧪</span>
                        <span><span class="tc-rd-type-btn__label">Bar prep</span><span class="tc-rd-type-btn__sub">Syrups · infusions</span></span>
                    </button>
                    <button type="button" class="tc-rd-type-btn" data-recipe-type="bar" data-category="beverage">
                        <span class="tc-rd-type-btn__glyph" aria-hidden="true">🍸</span>
                        <span><span class="tc-rd-type-btn__label">Bar</span><span class="tc-rd-type-btn__sub">Cocktails · builds</span></span>
                    </button>
                    <button type="button" class="tc-rd-type-btn" data-recipe-type="kitchen-prep" data-category="prep-recipe">
                        <span class="tc-rd-type-btn__glyph" aria-hidden="true">🍲</span>
                        <span><span class="tc-rd-type-btn__label">Kitchen prep</span><span class="tc-rd-type-btn__sub">Stocks · sauces</span></span>
                    </button>
                    <button type="button" class="tc-rd-type-btn is-active" data-recipe-type="kitchen-dish" data-category="main-course">
                        <span class="tc-rd-type-btn__glyph" aria-hidden="true">🍽️</span>
                        <span><span class="tc-rd-type-btn__label">Kitchen dish</span><span class="tc-rd-type-btn__sub">Plated · service</span></span>
                    </button>
                </div>
                <motion.div class="recipe-progress tc-rd-step-bar">""".replace("motion.div", "div"),
    "toolbar",
)

must_replace(
    """            </div>
            
            <!-- Quick Tips -->
            <div class="quick-tips">
                <div class="quick-tips-title">💡 Pro Tips</div>
                <ul>
                    <li>Use <strong>Ctrl+S</strong> to save your recipe anytime</li>
                    <li>Your work is auto-saved every 30 seconds</li>
                    <li>Scale recipes easily with the calculator in the recipe library</li>
                    <li>Add component recipes to build complex dishes</li>
                </ul>
            </div>
            
            <!-- Removed legacy page header to avoid duplicate with unified header -->

            <!-- Recipe Development Layout -->
            <div class="recipe-development-layout">""",
    """            </div>
            </div>

            <div class="recipe-development-layout tc-rd-grid">""",
    "quicktips",
)

must_replace(
    "                <!-- Recipe Ideas Sidebar -->\n                <div class=\"recipe-ideas-sidebar\">",
    "                <aside class=\"tc-rd-rail\">\n                <div class=\"recipe-ideas-sidebar\">",
    "rail",
)

cost = """
                <div class="tc-card tc-rd-cost-card" id="tc-rd-cost-card" aria-live="polite">
                    <h3>Live costing</h3>
                    <dl class="tc-rd-cost-dl">
                        <div class="tc-rd-cost-row"><dt>Batch cost</dt><dd id="tc-rd-batch-cost">$0.00</dd></div>
                        <div class="tc-rd-cost-row"><dt>Cost / portion</dt><dd id="tc-rd-cost-portion">$0.00</dd></div>
                        <div class="tc-rd-cost-row tc-rd-cost-row--accent"><dt>Suggested price (28% FC)</dt><dd id="tc-rd-suggested-price">$0.00</dd></div>
                    </dl>
                </div>
                </aside>
"""

must_replace(
    "                </div>\n                \n                <!-- Recipe Canvas -->\n                <div class=\"recipe-canvas\">",
    "                </div>" + cost + "\n                <!-- Recipe Canvas -->\n                <article class=\"recipe-canvas tc-rd-notebook\">",
    "canvas",
)

text = text.replace('<div class="recipe-header">', '<div class="recipe-header tc-rd-toolbar-legacy">', 1)

OLD = """                    <!-- Recipe Name Section -->
                    <div class="recipe-section">
                        <div class="recipe-section-title">
                            <span>📝</span>
                            Recipe Information
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="form-group">
                                <label for="recipe-name" class="form-label">Recipe Name</label>
                                <input type="text" id="recipe-name" class="form-input" placeholder="Enter recipe name">
                            </div>
                            <div class="form-group">
                                <label for="recipe-category" class="form-label">Category</label>
                                <select id="recipe-category" class="form-select">
                                    <option value="">Select category</option>
                                    <option value="appetizer">Appetizer</option>
                                    <option value="main-course">Main Course</option>
                                    <option value="dessert">Dessert</option>
                                    <option value="beverage">Beverage</option>
                                    <option value="sauce">Sauce</option>
                                    <option value="prep-recipe">Prep Recipe</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="recipe-cuisine" class="form-label">Cuisine</label>
                                <input type="text" id="recipe-cuisine" class="form-input" placeholder="e.g., Italian, French, Asian">
                            </div>
                            <div class="form-group">
                                <label for="recipe-servings" class="form-label">Servings</label>
                                <input type="number" id="recipe-servings" class="form-input" min="1" value="4">
                            </div>
                        </div>
                    </div>"""

must_replace(
    OLD,
    """                    <header class="tc-rd-cover" data-section="basics">
                        <div class="tc-rd-cover__badge" id="tc-rd-cover-badge">Kitchen dish · Working draft</div>
                        <label class="sr-only" for="recipe-name">Recipe title</label>
                        <input type="text" id="recipe-name" class="tc-rd-title-input" placeholder="Recipe title" autocomplete="off">
                        <label class="sr-only" for="recipe-subtitle">Subtitle</label>
                        <input type="text" id="recipe-subtitle" class="tc-rd-subtitle-input" placeholder="A short subtitle or accompaniment line" autocomplete="off">
                        <div class="tc-rd-meta-strip">
                            <div class="form-group">
                                <label for="recipe-category" class="form-label">Category</label>
                                <select id="recipe-category" class="form-select">
                                    <option value="">Select category</option>
                                    <option value="appetizer">Appetizer</option>
                                    <option value="main-course">Main Course</option>
                                    <option value="dessert">Dessert</option>
                                    <option value="beverage">Beverage</option>
                                    <option value="sauce">Sauce</option>
                                    <option value="prep-recipe">Prep Recipe</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="recipe-cuisine" class="form-label">Cuisine</label>
                                <input type="text" id="recipe-cuisine" class="form-input" placeholder="e.g. Italian, French">
                            </div>
                            <div class="form-group">
                                <label for="recipe-servings" class="form-label">Yield / servings</label>
                                <input type="number" id="recipe-servings" class="form-input" min="1" value="4">
                            </div>
                            <div class="form-group">
                                <label for="recipe-story" class="form-label">Chef&apos;s note</label>
                                <input type="text" id="recipe-story" class="form-input" placeholder="Why this recipe, what to look for…">
                            </div>
                        </div>
                    </header>
                    <div class="tc-rd-notebook-body">""",
    "cover",
)

must_replace(
    "                <!-- Ingredients Section -->\n                <div class=\"recipe-section\">",
    "                <!-- Ingredients Section -->\n                <div class=\"recipe-section\" data-section=\"ingredients\">",
    "ing",
)

if "tc-rd-ingredients-head" not in text:
    must_replace(
        "                    <div id=\"ingredients-container\">",
        "                    <div class=\"tc-rd-ingredients-head\" aria-hidden=\"true\"><span>Qty</span><span>Unit</span><span>Ingredient</span><span>Notes</span><span></span></div>\n                    <div id=\"ingredients-container\">",
        "inghead",
    )

must_replace(
    "                <!-- Instructions Section -->\n                <div class=\"recipe-section\">",
    "                <!-- Instructions Section -->\n                <div class=\"recipe-section\" data-section=\"instructions\">",
    "instr",
)

must_replace(
    "                <!-- Action Buttons -->\n                <div class=\"action-buttons\">",
    "                    </div>\n                <!-- Action Buttons -->\n                <div class=\"action-buttons\">",
    "closebody",
)

must_replace(
    "            </div>\n        </div>\n    </div>\n</main>",
    "            </article>\n        </div>\n    </div>\n</main>",
    "end",
)

text = text.replace(
    '<span id="recipe-status" class="status-badge new">New Recipe</span>',
    '<span class="status-badge new">New Recipe</span>',
    1,
)

p.write_text(text, encoding="utf-8")
print("patched ok")
