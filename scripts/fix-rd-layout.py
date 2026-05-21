#!/usr/bin/env python3
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "public" / "recipe-developer.html"
t = p.read_text(encoding="utf-8")

old = (
    "                <motion.div class=\"tc-rd-toolbar\">\n"
    "                <div class=\"progress-steps\">"
).replace("motion.div", "motion.div")
old = old.replace("motion.div", "motion.div")
# actual file content
old = (
    "                <motion.div class=\"tc-rd-toolbar\">\n"
    "                <div class=\"progress-steps\">"
)
# grep showed motion.div in file
if "<motion.div class=\"tc-rd-toolbar\">" in t:
    old = "                <motion.div class=\"tc-rd-toolbar\">\n                <div class=\"progress-steps\">"
elif "<div class=\"tc-rd-toolbar\">" in t:
    old = "                <div class=\"tc-rd-toolbar\">\n                <motion.div class=\"progress-steps\">".replace("motion.div", "div")
    old = "                <div class=\"tc-rd-toolbar\">\n                <div class=\"progress-steps\">"

new_start = """                <div class="tc-rd-toolbar">
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
                <div class="recipe-progress tc-rd-step-bar">
                <div class="progress-steps">"""

# normalize motion in file
t = t.replace("<motion.div class=\"tc-rd-toolbar\">", "<MARK_TOOLBAR>")
if "<MARK_TOOLBAR>" not in t:
    raise SystemExit("marker not found")
idx = t.index("<MARK_TOOLBAR>")
end = t.index("            </div>\n            \n            <!-- Quick Tips -->", idx)
block = t[idx:end]
rest = """                <div class="recipe-progress tc-rd-step-bar">
                <div class="progress-steps">"""
if "<div class=\"progress-steps\">" in block:
    steps_part = block[block.index("<motion.div class=\"progress-steps\">".replace("motion.div","motion.div")):]
    steps_part = block[block.index("<div class=\"progress-steps\">"):]
else:
    raise SystemExit("no progress-steps")

# extract from progress-steps to end of block (closing divs before quick tips)
steps_start = block.index("<div class=\"progress-steps\">")
steps_block = block[steps_start:]
# fix closing: should end with </div></motion.div> for progress + sticky
if not steps_block.strip().endswith("</div>"):
    pass

replacement = new_start + steps_block
# steps_block already has progress-steps - new_start ends with progress-steps duplicate
new_start2 = new_start.replace(
    "                <div class=\"recipe-progress tc-rd-step-bar\">\n                <div class=\"progress-steps\">",
    "",
)
replacement = new_start2 + steps_block
# ensure progress wrapper
if "recipe-progress tc-rd-step-bar" not in replacement:
    replacement = replacement.replace(
        "<div class=\"progress-steps\">",
        "<div class=\"recipe-progress tc-rd-step-bar\">\n                <div class=\"progress-steps\">",
        1,
    )
    # close extra div before end
    replacement = replacement.rstrip()
    if replacement.endswith("</div>"):
        replacement = replacement[:-len("</div>")] + "</div>\n                </div>"

t = t[:idx] + replacement + t[end:]
t = t.replace("<MARK_TOOLBAR>", "")

# quick tips removal + grid class
qt = """            </motion.div>
            
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
            <div class="recipe-development-layout">"""
qt = qt.replace("motion.div", "div")
if qt in t:
    t = t.replace(qt, "\n            <div class=\"recipe-development-layout tc-rd-grid\">", 1)

p.write_text(t, encoding="utf-8")
print("fixed toolbar block")
