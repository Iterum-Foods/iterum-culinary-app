#!/usr/bin/env python3
"""Ensure authenticated app HTML pages load unified nav + canonical CSS + project selector."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

SKIP = {
    "404.html",
    "company.html",
    "fallback.html",
    "foh-first-shift.html",
    "index.html",
    "landing.html",
    "mobile-compliance.html",
    "pitch.html",
    "privacy.html",
    "signin.html",
    "simple-test.html",
    "test-auth.html",
    "test-direct.html",
    "test-simple.html",
    "test-site.html",
    "test.html",
    "launch.html",
}

NAV_SCRIPT = '<script src="assets/js/unified-nav-header.js" defer></script>'
PM_SCRIPT = '<script src="assets/js/project-management-system.js" defer></script>'
SEL_SCRIPT = '<script src="assets/js/unified-project-selector.js" defer></script>'
CANONICAL_LINK = (
    '<link rel="stylesheet" href="assets/css/iterum-canonical-app.css">'
)


def patch_html(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    orig = text
    changes: list[str] = []

    if CANONICAL_LINK not in text:
        if "</head>" in text:
            text = text.replace("</head>", f"  {CANONICAL_LINK}\n</head>", 1)
            changes.append("canonical-css")

    if NAV_SCRIPT not in text:
        if "</body>" in text:
            text = text.replace("</body>", f"  {NAV_SCRIPT}\n</body>", 1)
            changes.append("nav-script")

    has_pm = "project-management-system.js" in text
    has_sel = "unified-project-selector.js" in text

    if NAV_SCRIPT in text or "nav-script" in changes:
        if not has_pm:
            text = text.replace(NAV_SCRIPT, f"{PM_SCRIPT}\n  {NAV_SCRIPT}", 1)
            changes.append("project-manager")
            has_pm = True
        if not has_sel:
            anchor = PM_SCRIPT if PM_SCRIPT in text else NAV_SCRIPT
            text = text.replace(anchor, f"{anchor}\n  {SEL_SCRIPT}", 1)
            changes.append("project-selector")

    body_m = re.search(r"<body([^>]*)>", text, re.I)
    if body_m and "tc-revamp-body" not in body_m.group(0):
        attrs = body_m.group(1)
        if re.search(r'class\s*=\s*["\']', attrs, re.I):
            attrs = re.sub(
                r'class\s*=\s*(["\'])([^"\']*)\1',
                lambda m: f'class={m.group(1)}{m.group(2)} tc-revamp-body{m.group(1)}',
                attrs,
                count=1,
                flags=re.I,
            )
        else:
            attrs = attrs + ' class="tc-revamp-body"'
        text = text[: body_m.start()] + "<body" + attrs + ">" + text[body_m.end() :]
        changes.append("tc-revamp-body")

    if text != orig:
        path.write_text(text, encoding="utf-8", newline="\n")
    return changes


def main() -> None:
    touched = []
    for html in sorted(PUBLIC.glob("*.html")):
        if html.name in SKIP:
            continue
        ch = patch_html(html)
        if ch:
            touched.append((html.name, ch))
    for name, ch in touched:
        print(f"{name}: {', '.join(ch)}")
    print(f"Updated {len(touched)} file(s)")


if __name__ == "__main__":
    main()
