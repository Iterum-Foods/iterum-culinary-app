#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
p = ROOT / "public" / "recipe-developer.html"
scripts = Path(__file__).parent
text = p.read_text(encoding="utf-8")
sticky = (scripts / "rd-layout-sticky.html").read_text(encoding="utf-8")

def rep(old: str, new: str, label: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f"{label}: not found")
    text = text.replace(old, new, 1)

if "recipe-developer-revamp-layout.css" not in text:
    rep(
        '<link rel="stylesheet" href="assets/css/recipe-developer-contrast-fix.css">',
        '<link rel="stylesheet" href="assets/css/recipe-developer-contrast-fix.css">\n'
        '    <link rel="stylesheet" href="assets/css/recipe-developer-revamp-layout.css">',
        "css",
    )

rep('<div class="page-layout">', '<div class="page-layout tc-rd-workspace">', "ws")

rep(
    "            <!-- Progress Indicator -->\n"
    "            <div class=\"recipe-progress\">\n"
    "                <div class=\"progress-steps\">",
    sticky,
    "sticky",
)

rep(
    "            </div>\n"
    "            \n"
    "            <!-- Quick Tips -->\n"
    "            <div class=\"quick-tips\">\n"
    "                <div class=\"quick-tips-title\">💡 Pro Tips</div>\n"
    "                <ul>\n"
    "                    <li>Use <strong>Ctrl+S</strong> to save your recipe anytime</li>\n"
    "                    <li>Your work is auto-saved every 30 seconds</li>\n"
    "                    <li>Scale recipes easily with the calculator in the recipe library</li>\n"
    "                    <li>Add component recipes to build complex dishes</li>\n"
    "                </ul>\n"
    "            </div>\n"
    "            \n"
    "            <!-- Removed legacy page header to avoid duplicate with unified header -->\n"
    "            \n"
    "            <!-- Recipe Development Layout -->\n"
    "            <div class=\"recipe-development-layout\">",
    "            </div>\n            </div>\n\n            <div class=\"recipe-development-layout tc-rd-grid\">",
    "tips",
)

rep(
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

rep(
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

NEW = """                    <header class="tc-rd-cover" data-section="basics">
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
                    <div class="tc-rd-notebook-body">"""

rep(OLD, NEW, "cover")

rep(
    "                <!-- Ingredients Section -->\n                <div class=\"recipe-section\">",
    "                <!-- Ingredients Section -->\n                <div class=\"recipe-section\" data-section=\"ingredients\">",
    "ing",
)

if "tc-rd-ingredients-head" not in text:
    rep(
        "                    <div id=\"ingredients-container\">",
        "                    <div class=\"tc-rd-ingredients-head\" aria-hidden=\"true\"><span>Qty</span><span>Unit</span><span>Ingredient</span><span>Notes</span><span></span></div>\n                    <div id=\"ingredients-container\">",
        "inghead",
    )

rep(
    "                <!-- Instructions Section -->\n                <div class=\"recipe-section\">",
    "                <!-- Instructions Section -->\n                <div class=\"recipe-section\" data-section=\"instructions\">",
    "instr",
)

rep(
    "                <!-- Action Buttons -->\n                <div class=\"action-buttons\">",
    "                    </div>\n                <!-- Action Buttons -->\n                <div class=\"action-buttons\">",
    "body",
)

rep(
    "            </div>\n        </div>\n    </div>\n</div>\n</main>",
    "            </article>\n        </div>\n    </div>\n</div>\n</main>",
    "end",
)

text = text.replace(
    '<span id="recipe-status" class="status-badge new">New Recipe</span>',
    '<span class="status-badge new">New Recipe</span>',
    1,
)

if "recipe-developer-revamp-ui.js" not in text:
    rep(
        '<script src="assets/js/recipe-developer-enhancements.js"></script>',
        '<script src="assets/js/recipe-developer-enhancements.js"></script>\n'
        '    <script src="assets/js/recipe-developer-revamp-ui.js"></script>',
        "js",
    )

# page hero if missing
if "tc-rd-page-hero" not in text:
    hero = """        <header class="tc-page-hero tc-rd-page-hero">
            <div class="tc-page-hero__inner">
                <div>
                    <p class="tc-eyebrow">Iterum Kitchen OS · R&amp;D</p>
                    <h1 class="tc-page-hero__title">Recipe Developer</h1>
                    <p class="tc-page-hero__desc">
                        Bar prep, cocktails, kitchen prep, and plated dishes — structured ingredients, method, versions, and costing in one workspace.
                    </p>
                </div>
                <div class="tc-page-hero__actions">
                    <button type="button" class="btn btn-primary tc-btn tc-btn-accent" onclick="createNewRecipe()">New recipe</button>
                    <button type="button" class="btn btn-secondary tc-btn tc-btn-outline" onclick="refreshRecipeIdeasOnDeveloperPage()">Refresh ideas</button>
                    <a href="recipe-library.html" class="btn btn-ghost tc-btn tc-btn-ghost" style="text-decoration: none;">Recipe library</a>
                </div>
            </div>
        </header>
"""
    rep("    <main class=\"page-shell\">\n        <div class=\"page-layout", "    <main class=\"page-shell\">\n" + hero + "        <div class=\"page-layout", "hero")

p.write_text(text, encoding="utf-8")
print("ok")
