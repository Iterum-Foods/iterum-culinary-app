from pathlib import Path
ROOT = Path(r"c:/Iterum Innovation/iterum-culinary-app")
text = (ROOT / "public/recipe-developer.html").read_text(encoding="utf-8")
sticky = (ROOT / "scripts/rd-layout-sticky.html").read_text(encoding="utf-8")
old = (
    "            <!-- Progress Indicator -->\n"
    "            <div class=\"recipe-progress\">\n"
    "                <div class=\"progress-steps\">"
)
text = text.replace(old, sticky, 1)
i = text.find("<!-- Quick Tips -->")
snippet = text[i-30:i+400]
print(snippet)
print("---")
tips = """<!-- Quick Tips -->
            <div class="quick-tips">
                <div class="quick-tips-title">"""
print(tips in text[i:i+200])
