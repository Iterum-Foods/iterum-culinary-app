# 🚀 Enhanced Recipe Management System

## Overview

This enhanced recipe management system provides a modern, comprehensive solution for organizing, converting, and managing recipes. It features:

- ✅ **Thorough Directory Scanning** - Recursively searches directories for recipe files
- ✅ **Uniform Conversion** - Converts all recipes to standardized Iterum format
- ✅ **Missing Information Detection** - Identifies what information needs to be added
- ✅ **Advanced Sorting & Filtering** - Sort and filter recipes by multiple criteria
- ✅ **Modern Web UI** - Beautiful, responsive interface
- ✅ **Comprehensive Organization** - Organizes recipes in a structured library

---

## 🎯 Key Features

### 1. Thorough Directory Scanner
- **Recursive Search**: Searches all subdirectories automatically
- **Smart Detection**: Analyzes file content to identify recipes
- **Multiple Formats**: Supports .xlsx, .xls, .csv, .pdf, .docx, .txt, .md, .json, .html
- **Duplicate Prevention**: Uses hash-based naming to prevent duplicates
- **Progress Tracking**: Real-time progress updates during scanning

### 2. Uniform Recipe Conversion
- **Iterum Format**: Converts all recipes to professional Iterum format
- **Standardized Layout**: Uniform structure for all recipes
- **Costing Ready**: Includes AP/EP cost fields, yields, and portions
- **Batch Processing**: Converts all recipes at once
- **Error Reporting**: Detailed error reports for failed conversions

### 3. Missing Information Detection
- **Comprehensive Analysis**: Analyzes all recipes for missing fields
- **Priority Levels**: Categorizes missing info by priority (high/medium/low)
- **Completeness Score**: Calculates completeness percentage for each recipe
- **Detailed Reports**: Shows exactly what information is missing
- **Location Tracking**: Identifies where missing information should be added

### 4. Advanced Sorting & Filtering
- **Multiple Sort Options**: Sort by title, date, cuisine, difficulty
- **Ascending/Descending**: Choose sort order
- **Multi-Filter**: Filter by cuisine, category, difficulty simultaneously
- **Search**: Full-text search across recipe titles and content
- **View Modes**: Grid and list view options

### 5. Modern Web Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Beautiful UI**: Modern, professional design
- **Real-time Updates**: Live progress indicators
- **Interactive**: Smooth animations and transitions
- **User-Friendly**: Intuitive navigation and controls

---

## 📦 Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Install Dependencies

```bash
pip install flask openpyxl pandas sqlite3
```

Or use the requirements file:
```bash
pip install -r requirements_recipe_finder.txt
```

---

## 🚀 Quick Start

### Option 1: Web Interface (Recommended)

1. **Start the enhanced web application:**
   ```bash
   python enhanced_web_app.py
   ```
   Or double-click: `start_enhanced_app.bat`

2. **Open your browser:**
   Navigate to: `http://localhost:5000`

3. **Use the interface:**
   - Click "Scan Directory" to scan for recipes
   - Click "Convert to Iterum" to convert recipes
   - Click "Check Missing Info" to see what needs to be added
   - Browse and sort recipes with advanced filters

### Option 2: Command Line

#### Scan Directory Thoroughly
```bash
python enhanced_recipe_scanner.py "C:\Your\Recipe\Folder"
```

#### Scan Multiple Directories
```bash
python enhanced_recipe_scanner.py --multiple "C:\Folder1" "C:\Folder2" "C:\Folder3"
```

#### Check Missing Information
```bash
python missing_info_detector.py --all
```

#### Generate Missing Info Report
```bash
python missing_info_detector.py --all --report missing_info_report.txt
```

---

## 📖 Detailed Usage

### 1. Scanning Directories

#### Web Interface
1. Navigate to "Organize & Scan Recipes"
2. Enter directory path
3. Enable/disable recursive scanning
4. Click "Start Scanning"
5. View results and imported recipes

#### Command Line
```bash
# Basic scan
python enhanced_recipe_scanner.py "C:\Recipes"

# Non-recursive scan (current directory only)
python enhanced_recipe_scanner.py "C:\Recipes" --no-recursive

# Multiple directories
python enhanced_recipe_scanner.py --multiple "C:\Folder1" "C:\Folder2"
```

### 2. Converting Recipes

#### Web Interface
1. Navigate to "Convert to Iterum Format"
2. Review missing information summary
3. Click "Convert All Recipes"
4. View conversion results

#### Command Line
```bash
python standardize_recipes.py --auto
```

### 3. Checking Missing Information

#### Web Interface
1. Navigate to "Missing Information Analysis"
2. View summary statistics
3. Click "Details" on any recipe to see missing fields
4. Export report if needed

#### Command Line
```bash
# Analyze all recipes
python missing_info_detector.py --all

# Analyze specific recipe
python missing_info_detector.py --recipe-id <recipe_id>

# Analyze specific file
python missing_info_detector.py --file "path/to/recipe.xlsx"

# Generate report
python missing_info_detector.py --all --report report.txt
```

### 4. Sorting and Filtering Recipes

#### Web Interface
1. Navigate to "Browse & Sort Recipes"
2. Use search box for text search
3. Select filters (cuisine, category, difficulty)
4. Choose sort field and order
5. Click "Apply Filters"
6. Toggle between grid and list view

---

## 📁 File Structure

```
recipe-library-system/
├── enhanced_web_app.py          # Enhanced web application
├── enhanced_recipe_scanner.py  # Thorough directory scanner
├── missing_info_detector.py    # Missing information detector
├── standardize_recipes.py      # Recipe converter
├── start_enhanced_app.bat      # Windows startup script
│
├── templates/
│   ├── enhanced_index.html     # Enhanced dashboard
│   ├── enhanced_organize.html  # Enhanced organize page
│   ├── enhanced_recipes.html   # Enhanced browse page
│   ├── enhanced_convert.html   # Enhanced convert page
│   └── missing_info.html       # Missing info report page
│
├── recipe_library/              # Organized recipe library
│   ├── recipe_library.db       # SQLite database
│   └── [hash].xlsx             # Recipe files
│
└── converted_iterum/            # Converted Iterum format files
    └── [Recipe Name].xlsx
```

---

## 🔍 Missing Information Detection

The system checks for:

### Header Fields
- Recipe name
- Concept
- Submitted by
- Number of portions
- Cuisine
- Category
- Date
- Serving size

### Ingredients
- Ingredient names
- Quantities (weight/volume)
- AP$ / Unit (As Purchased cost)
- Unit of measure
- Yield percentage
- EP$ / Unit (Edible Portion cost)
- Total cost

### Method
- Instructions/method section
- Step-by-step directions

### Priority Levels
- **High Priority**: Critical fields (recipe name, portions, ingredients)
- **Medium Priority**: Important fields (cuisine, yields, costs)
- **Low Priority**: Optional fields (concept, serving size)

---

## 🎨 Web Interface Features

### Dashboard
- Library statistics
- Recent recipes
- Quick action buttons
- Cuisine distribution

### Organize & Scan
- Directory path input
- Recursive scan toggle
- Real-time progress
- Detailed results
- Imported recipes list

### Convert to Iterum
- Batch conversion
- Missing info summary
- Conversion progress
- Error reporting
- Success statistics

### Browse & Sort
- Advanced filters
- Multiple sort options
- Search functionality
- Grid/List view toggle
- Recipe cards with details

### Missing Information
- Summary statistics
- Detailed analysis table
- Completeness scores
- Priority indicators
- Export capabilities

---

## 📊 Statistics & Reports

### Library Statistics
- Total recipes
- By cuisine
- By category
- By difficulty
- Recent additions

### Missing Information Report
- Total issues by priority
- Average completeness
- Per-recipe analysis
- Missing field locations
- Exportable reports

---

## 🛠️ Troubleshooting

### Issue: Scanner not finding recipes
**Solution**: 
- Check file extensions are supported
- Verify directory path is correct
- Enable recursive scanning
- Check file permissions

### Issue: Conversion errors
**Solution**:
- Check recipe files are valid
- Verify Excel files aren't corrupted
- Review error details in results
- Try converting individual recipes

### Issue: Missing info detector not working
**Solution**:
- Ensure recipes are in library
- Check database connection
- Verify file paths are correct
- Check file permissions

### Issue: Web app won't start
**Solution**:
- Check Python version (3.7+)
- Install all dependencies
- Check port 5000 is available
- Review error messages

---

## 💡 Tips & Best Practices

1. **Scan First**: Always scan directories before converting
2. **Check Missing Info**: Review missing information before finalizing recipes
3. **Use Filters**: Use advanced filters to find specific recipes quickly
4. **Regular Scans**: Scan new directories regularly to keep library updated
5. **Backup**: Keep backups of your recipe library
6. **Review Reports**: Check missing info reports to improve recipe completeness

---

## 🔄 Workflow

### Recommended Workflow

1. **Scan Directories**
   - Use "Organize & Scan Recipes" to scan new directories
   - Review imported recipes

2. **Check Missing Information**
   - View missing info report
   - Identify what needs to be added

3. **Convert to Iterum**
   - Convert all recipes to uniform format
   - Review conversion results

4. **Fill Missing Information**
   - Open converted Excel files
   - Add missing information
   - Update costs and yields

5. **Organize & Sort**
   - Use filters and sorting to organize recipes
   - Create collections by cuisine or category

---

## 📚 Additional Resources

- **Iterum Format Guide**: See `CONVERT_TO_ITERUM.md`
- **System Overview**: See `COMPLETE_SYSTEM_OVERVIEW.md`
- **Master Guide**: See `MASTER_GUIDE.md`

---

## 🎉 Features Summary

✅ Thorough directory scanning with recursive search  
✅ Uniform Iterum format conversion  
✅ Missing information detection with priority levels  
✅ Advanced sorting and filtering  
✅ Modern, responsive web interface  
✅ Comprehensive recipe organization  
✅ Real-time progress tracking  
✅ Detailed error reporting  
✅ Exportable reports  
✅ Duplicate prevention  

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review error messages
3. Check log files
4. Review documentation files

---

**Happy Recipe Managing! 🍳**

*Enhanced Recipe Management System v2.0*



