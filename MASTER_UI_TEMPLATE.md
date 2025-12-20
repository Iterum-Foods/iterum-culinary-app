# 🎨 Master UI Template & Branding Kit Implementation Guide

## 📋 **Standard CSS Load Order (MUST FOLLOW)**

All pages should load CSS in this exact order:

```html
<!-- 1. Fonts (Load First) -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

<!-- 2. ITERUM BRAND KIT - MUST LOAD FIRST (Before all other styles) -->
<link rel="stylesheet" href="assets/css/iterum-brand-kit.css">

<!-- 3. Design System & UI Components -->
<link rel="stylesheet" href="assets/css/iterum-design-system.css">
<link rel="stylesheet" href="assets/css/premium-ui-system.css">
<link rel="stylesheet" href="assets/css/unified-cards.css">
<link rel="stylesheet" href="assets/css/page-layouts.css">

<!-- 4. Theme & Color Systems -->
<link rel="stylesheet" href="assets/css/modern-nordic-vintage.css">
<link rel="stylesheet" href="assets/css/nordic-design-system.css">
<link rel="stylesheet" href="assets/css/dark-mode-enhancements.css">

<!-- 5. Page-Specific Styles (if needed) -->
<!-- <link rel="stylesheet" href="assets/css/[page-specific].css"> -->

<!-- 6. Modal & High Contrast (if needed) -->
<link rel="stylesheet" href="assets/css/modal-high-contrast.css">

<!-- 7. UNIFIED HEADER - MUST LOAD LAST (to override other styles) -->
<link rel="stylesheet" href="assets/css/header-universal.css">

<!-- 8. Favicon -->
<link rel="icon" type="image/x-icon" href="assets/icons/iterum.ico">
```

---

## 🎯 **Required CSS Files (All Pages)**

### **Core (Required on ALL pages)**
1. ✅ `iterum-brand-kit.css` - **MUST BE FIRST**
2. ✅ `header-universal.css` - **MUST BE LAST**
3. ✅ `iterum-design-system.css` - Design system
4. ✅ `modern-nordic-vintage.css` - Theme

### **Recommended (Most Pages)**
5. ✅ `premium-ui-system.css` - UI components
6. ✅ `unified-cards.css` - Card styles
7. ✅ `page-layouts.css` - Layout utilities
8. ✅ `dark-mode-enhancements.css` - Dark mode support

### **Optional (As Needed)**
- `modal-high-contrast.css` - For modals
- `high-contrast-universal.css` - Accessibility
- Page-specific CSS files

---

## 📐 **Standard HTML Head Template**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Page Title] - Iterum Culinary</title>
    <meta name="description" content="[Page description]">
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- ITERUM BRAND KIT - MUST LOAD FIRST -->
    <link rel="stylesheet" href="assets/css/iterum-brand-kit.css">
    
    <!-- Design System -->
    <link rel="stylesheet" href="assets/css/iterum-design-system.css">
    <link rel="stylesheet" href="assets/css/premium-ui-system.css">
    <link rel="stylesheet" href="assets/css/unified-cards.css">
    <link rel="stylesheet" href="assets/css/page-layouts.css">
    
    <!-- Theme -->
    <link rel="stylesheet" href="assets/css/modern-nordic-vintage.css">
    <link rel="stylesheet" href="assets/css/nordic-design-system.css">
    <link rel="stylesheet" href="assets/css/dark-mode-enhancements.css">
    
    <!-- Modals (if needed) -->
    <link rel="stylesheet" href="assets/css/modal-high-contrast.css">
    
    <!-- UNIFIED HEADER - MUST LOAD LAST -->
    <link rel="stylesheet" href="assets/css/header-universal.css">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="assets/icons/iterum.ico">
</head>
<body class="bg-gray-50 min-h-screen" style="padding-top: 80px;">
    <!-- Header injected by unified-nav-header.js -->
    
    <!-- Page Content -->
    
    <!-- Scripts -->
    <script src="assets/js/unified-nav-header.js" defer></script>
    <!-- Other scripts -->
</body>
</html>
```

---

## ✅ **Implementation Checklist**

For each page, ensure:

- [ ] `iterum-brand-kit.css` is loaded FIRST
- [ ] `header-universal.css` is loaded LAST
- [ ] All required CSS files are included
- [ ] Font (Inter) is loaded
- [ ] Favicon is included
- [ ] Body has `padding-top: 80px` for header
- [ ] Unified header script is included
- [ ] No conflicting inline styles override brand kit

---

## 🎨 **Brand Kit Variables (Available on All Pages)**

### **Colors**
- `--brand-bg-primary` - Main background
- `--brand-bg-secondary` - Secondary background
- `--brand-card-bg` - Card background
- `--brand-text-primary` - Primary text
- `--brand-accent-primary` - Primary accent (Nordic Moss)
- `--brand-accent-secondary` - Secondary accent (Nordic Blue)

### **Spacing**
- `--space-xs` through `--space-3xl`

### **Typography**
- `--font-family-primary` - Inter font
- `--font-size-xs` through `--font-size-5xl`
- `--font-weight-light` through `--font-weight-extrabold`

### **Components**
- `.card` - Universal card style
- `.btn`, `.btn-primary`, `.btn-secondary` - Buttons
- `.form-input`, `.form-select`, `.form-textarea` - Form inputs
- `.modal` - Modal styles

---

## 🔧 **Quick Fix Script**

To update a page, replace the `<head>` section with the standard template above, then add any page-specific CSS after the standard includes.

---

**Last Updated**: 2025-01-XX


