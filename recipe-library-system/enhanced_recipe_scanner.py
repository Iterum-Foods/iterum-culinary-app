#!/usr/bin/env python3
"""
Enhanced Recipe Scanner
Thoroughly searches directories for recipe files with comprehensive analysis
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import sqlite3
import hashlib
from datetime import datetime
import json
import logging

# Add RecipeLibrarySystem to path
sys.path.insert(0, str(Path(__file__).parent / "RecipeLibrarySystem"))
from recipe_library_system import RecipeLibrary, RecipeEntry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedRecipeScanner:
    """Enhanced scanner that thoroughly searches directories for recipes."""
    
    def __init__(self, library_path: str = "recipe_library"):
        self.library_path = Path(library_path)
        self.library_path.mkdir(exist_ok=True)
        self.db_path = self.library_path / "recipe_library.db"
        
        # Supported file extensions
        self.recipe_extensions = {
            '.xlsx', '.xls', '.csv', '.pdf', '.txt', '.docx', '.doc', 
            '.json', '.html', '.htm', '.md', '.rtf'
        }
        
        # Initialize library system
        self.library = RecipeLibrary(library_path=library_path)
    
    def scan_directory_thoroughly(self, directory_path: str, recursive: bool = True) -> Dict[str, Any]:
        """
        Thoroughly scan a directory for recipe files.
        
        Args:
            directory_path: Path to directory to scan
            recursive: Whether to scan subdirectories recursively
            
        Returns:
            Dictionary with scan results and statistics
        """
        directory = Path(directory_path)
        
        if not directory.exists():
            return {
                'success': False,
                'error': f'Directory not found: {directory_path}',
                'files_found': 0,
                'recipes_imported': 0
            }
        
        logger.info(f"Scanning directory: {directory.absolute()}")
        
        # Find all recipe files
        recipe_files = []
        total_files = 0
        skipped_files = []
        
        if recursive:
            # Recursive search
            for file_path in directory.rglob('*'):
                if file_path.is_file():
                    total_files += 1
                    if file_path.suffix.lower() in self.recipe_extensions:
                        recipe_files.append(file_path)
        else:
            # Non-recursive search
            for file_path in directory.iterdir():
                if file_path.is_file():
                    total_files += 1
                    if file_path.suffix.lower() in self.recipe_extensions:
                        recipe_files.append(file_path)
        
        logger.info(f"Found {len(recipe_files)} recipe files out of {total_files} total files")
        
        # Import recipes
        imported_recipes = []
        errors = []
        
        for file_path in recipe_files:
            try:
                # Temporarily set source folder to the file's directory
                original_source = self.library.source_folder
                self.library.source_folder = file_path.parent
                
                # Analyze and import
                recipe_entry = self.library.analyze_and_import_file(file_path)
                
                if recipe_entry:
                    imported_recipes.append(recipe_entry)
                    logger.info(f"Imported: {file_path.name}")
                else:
                    skipped_files.append({
                        'path': str(file_path),
                        'reason': 'Low confidence or not a recipe'
                    })
                
                # Restore original source
                self.library.source_folder = original_source
                
            except Exception as e:
                errors.append({
                    'file': str(file_path),
                    'error': str(e)
                })
                logger.error(f"Error processing {file_path.name}: {e}")
        
        return {
            'success': True,
            'directory': str(directory.absolute()),
            'total_files': total_files,
            'recipe_files_found': len(recipe_files),
            'recipes_imported': len(imported_recipes),
            'skipped_files': skipped_files,
            'errors': errors,
            'imported_recipes': [
                {
                    'id': r.id,
                    'title': r.title,
                    'cuisine': r.cuisine_type,
                    'category': r.category,
                    'difficulty': r.difficulty,
                    'file_path': r.file_path
                }
                for r in imported_recipes
            ]
        }
    
    def scan_multiple_directories(self, directories: List[str], recursive: bool = True) -> Dict[str, Any]:
        """Scan multiple directories and combine results."""
        all_results = []
        total_imported = 0
        total_errors = 0
        
        for directory in directories:
            result = self.scan_directory_thoroughly(directory, recursive)
            all_results.append(result)
            
            if result['success']:
                total_imported += result['recipes_imported']
                total_errors += len(result['errors'])
        
        return {
            'success': True,
            'directories_scanned': len(directories),
            'total_recipes_imported': total_imported,
            'total_errors': total_errors,
            'results': all_results
        }
    
    def get_scan_statistics(self) -> Dict[str, Any]:
        """Get statistics about scanned recipes."""
        return self.library.get_library_stats()

def main():
    """Command line interface for enhanced scanner."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Enhanced Recipe Scanner')
    parser.add_argument('directory', nargs='?', help='Directory to scan')
    parser.add_argument('--recursive', '-r', action='store_true', default=True,
                       help='Scan subdirectories recursively (default: True)')
    parser.add_argument('--no-recursive', action='store_true',
                       help='Do not scan subdirectories')
    parser.add_argument('--multiple', '-m', nargs='+', help='Scan multiple directories')
    
    args = parser.parse_args()
    
    scanner = EnhancedRecipeScanner()
    
    if args.multiple:
        recursive = not args.no_recursive
        result = scanner.scan_multiple_directories(args.multiple, recursive)
        print(f"\n{'='*80}")
        print("SCAN COMPLETE")
        print(f"{'='*80}")
        print(f"Directories scanned: {result['directories_scanned']}")
        print(f"Total recipes imported: {result['total_recipes_imported']}")
        print(f"Total errors: {result['total_errors']}")
        
    elif args.directory:
        recursive = not args.no_recursive
        result = scanner.scan_directory_thoroughly(args.directory, recursive)
        
        if result['success']:
            print(f"\n{'='*80}")
            print("SCAN COMPLETE")
            print(f"{'='*80}")
            print(f"Directory: {result['directory']}")
            print(f"Total files: {result['total_files']}")
            print(f"Recipe files found: {result['recipe_files_found']}")
            print(f"Recipes imported: {result['recipes_imported']}")
            print(f"Skipped files: {len(result['skipped_files'])}")
            print(f"Errors: {len(result['errors'])}")
            
            if result['imported_recipes']:
                print(f"\nImported Recipes:")
                for recipe in result['imported_recipes']:
                    print(f"  - {recipe['title']} ({recipe['cuisine']}, {recipe['category']})")
        else:
            print(f"Error: {result['error']}")
    else:
        # Interactive mode
        print("\n" + "="*80)
        print("ENHANCED RECIPE SCANNER")
        print("="*80)
        print("\nThis tool thoroughly scans directories for recipe files.")
        print("It searches recursively through all subdirectories.\n")
        
        directory = input("Enter directory path to scan: ").strip('"')
        
        if not directory:
            print("No directory provided.")
            return
        
        recursive_input = input("Scan subdirectories recursively? (Y/n): ").strip().lower()
        recursive = recursive_input != 'n'
        
        result = scanner.scan_directory_thoroughly(directory, recursive)
        
        if result['success']:
            print(f"\n{'='*80}")
            print("SCAN COMPLETE")
            print(f"{'='*80}")
            print(f"Directory: {result['directory']}")
            print(f"Total files: {result['total_files']}")
            print(f"Recipe files found: {result['recipe_files_found']}")
            print(f"Recipes imported: {result['recipes_imported']}")
            print(f"Skipped files: {len(result['skipped_files'])}")
            print(f"Errors: {len(result['errors'])}")
        else:
            print(f"Error: {result['error']}")

if __name__ == "__main__":
    main()



