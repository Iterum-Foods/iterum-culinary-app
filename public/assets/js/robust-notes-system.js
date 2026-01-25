/**
 * Robust Notes System
 * Advanced note-taking with categories, templates, search, and collaboration
 * @version 1.0.0
 */

class RobustNotesSystem {
    constructor() {
        this.notes = [];
        this.categories = [];
        this.templates = [];
        this.tags = [];
        this.searchIndex = [];
        this.currentFilter = 'all';
        this.currentSort = 'date';
        this.init();
    }

    init() {
        console.log('📝 Robust Notes System initialized');
        this.loadNotes();
        this.loadCategories();
        this.loadTemplates();
        this.setupEventListeners();
        this.buildSearchIndex();
    }

    /**
     * Load notes from localStorage
     */
    loadNotes() {
        try {
            const saved = localStorage.getItem('robust_notes');
            if (saved) {
                this.notes = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
        }
    }

    /**
     * Save notes to localStorage
     */
    saveNotes() {
        try {
            localStorage.setItem('robust_notes', JSON.stringify(this.notes));
            this.buildSearchIndex();
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    /**
     * Load categories
     */
    loadCategories() {
        this.categories = [
            { id: 'recipe', name: 'Recipe Development', icon: '🍳', color: '#f59e0b' },
            { id: 'ingredient', name: 'Ingredients', icon: '🥕', color: '#10b981' },
            { id: 'technique', name: 'Cooking Techniques', icon: '👨‍🍳', color: '#3b82f6' },
            { id: 'menu', name: 'Menu Planning', icon: '📋', color: '#8b5cf6' },
            { id: 'service', name: 'Service Notes', icon: '🍽️', color: '#ef4444' },
            { id: 'kitchen', name: 'Kitchen Operations', icon: '🏠', color: '#64748b' },
            { id: 'business', name: 'Business Notes', icon: '💼', color: '#059669' },
            { id: 'personal', name: 'Personal Notes', icon: '📝', color: '#7c3aed' },
            { id: 'inspiration', name: 'Inspiration', icon: '💡', color: '#f97316' },
            { id: 'research', name: 'Research', icon: '🔬', color: '#06b6d4' }
        ];
    }

    /**
     * Load note templates
     */
    loadTemplates() {
        this.templates = [
            {
                id: 'recipe_development',
                name: 'Recipe Development',
                category: 'recipe',
                template: `# Recipe: [Recipe Name]

## Concept
- **Cuisine Style:** 
- **Main Ingredients:** 
- **Cooking Method:** 
- **Serving Size:** 

## Ingredients
- [ ] Ingredient 1 - Amount
- [ ] Ingredient 2 - Amount
- [ ] Ingredient 3 - Amount

## Instructions
1. **Prep:** 
2. **Cook:** 
3. **Plate:** 

## Notes
- **Flavor Profile:** 
- **Texture:** 
- **Presentation:** 
- **Variations:** 

## Cost Analysis
- **Ingredient Cost:** $0.00
- **Labor Cost:** $0.00
- **Total Cost:** $0.00
- **Selling Price:** $0.00
- **Profit Margin:** 0%`
            },
            {
                id: 'menu_planning',
                name: 'Menu Planning',
                category: 'menu',
                template: `# Menu: [Menu Name]

## Concept
- **Theme:** 
- **Target Audience:** 
- **Price Point:** 
- **Season:** 

## Courses
### Appetizers
- [ ] Dish 1 - $0.00
- [ ] Dish 2 - $0.00

### Main Courses
- [ ] Dish 1 - $0.00
- [ ] Dish 2 - $0.00

### Desserts
- [ ] Dish 1 - $0.00
- [ ] Dish 2 - $0.00

## Considerations
- **Dietary Restrictions:** 
- **Seasonal Ingredients:** 
- **Kitchen Capacity:** 
- **Staff Skills:** 

## Pricing Strategy
- **Food Cost Target:** 30%
- **Labor Cost Target:** 25%
- **Overhead:** 20%
- **Profit Target:** 25%`
            },
            {
                id: 'service_notes',
                name: 'Service Notes',
                category: 'service',
                template: `# Service Notes - [Date]

## Service Summary
- **Date:** 
- **Shift:** 
- **Cover Count:** 
- **Revenue:** $0.00

## Highlights
- **Positive Feedback:** 
- **Special Requests:** 
- **New Customers:** 

## Issues & Improvements
- **Problems:** 
- **Solutions:** 
- **Follow-up Needed:** 

## Staff Notes
- **Performance:** 
- **Training Needs:** 
- **Scheduling:** 

## Kitchen Notes
- **Equipment Issues:** 
- **Ingredient Quality:** 
- **Prep Efficiency:** 

## Next Steps
- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3`
            },
            {
                id: 'ingredient_research',
                name: 'Ingredient Research',
                category: 'ingredient',
                template: `# Ingredient: [Ingredient Name]

## Basic Info
- **Name:** 
- **Category:** 
- **Season:** 
- **Origin:** 

## Quality Assessment
- **Appearance:** 
- **Texture:** 
- **Aroma:** 
- **Taste:** 

## Suppliers
- **Primary:** 
- **Backup:** 
- **Price:** $0.00/lb
- **Quality Rating:** ⭐⭐⭐⭐⭐

## Usage Ideas
- **Primary Use:** 
- **Secondary Use:** 
- **Pairings:** 
- **Substitutions:** 

## Storage & Handling
- **Temperature:** 
- **Humidity:** 
- **Shelf Life:** 
- **Prep Notes:** 

## Cost Analysis
- **Cost per Unit:** $0.00
- **Waste Factor:** 0%
- **Yield:** 0%
- **Final Cost:** $0.00`
            },
            {
                id: 'technique_study',
                name: 'Technique Study',
                category: 'technique',
                template: `# Technique: [Technique Name]

## Overview
- **Technique:** 
- **Difficulty:** ⭐⭐⭐⭐⭐
- **Time Required:** 
- **Equipment Needed:** 

## Step-by-Step Process
1. **Preparation:** 
2. **Execution:** 
3. **Timing:** 
4. **Finishing:** 

## Key Points
- **Critical Success Factors:** 
- **Common Mistakes:** 
- **Pro Tips:** 
- **Troubleshooting:** 

## Applications
- **Best For:** 
- **Variations:** 
- **Advanced Techniques:** 

## Practice Notes
- **First Attempt:** 
- **Improvements:** 
- **Mastery Level:** 
- **Next Steps:** `
            }
        ];
    }

    /**
     * Create new note
     */
    createNote(data = {}) {
        const note = {
            id: Date.now(),
            title: data.title || 'Untitled Note',
            content: data.content || '',
            category: data.category || 'personal',
            tags: data.tags || [],
            priority: data.priority || 'medium',
            status: data.status || 'draft',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            author: data.author || this.getCurrentUser(),
            project: data.project || this.getCurrentProject(),
            attachments: data.attachments || [],
            collaborators: data.collaborators || [],
            isPublic: data.isPublic || false,
            isPinned: data.isPinned || false,
            wordCount: 0,
            readingTime: 0
        };

        this.notes.push(note);
        this.saveNotes();
        this.buildSearchIndex();
        return note;
    }

    /**
     * Update note
     */
    updateNote(id, updates) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex !== -1) {
            this.notes[noteIndex] = {
                ...this.notes[noteIndex],
                ...updates,
                modified: new Date().toISOString(),
                wordCount: this.calculateWordCount(updates.content || this.notes[noteIndex].content),
                readingTime: this.calculateReadingTime(updates.content || this.notes[noteIndex].content)
            };
            this.saveNotes();
            this.buildSearchIndex();
            return this.notes[noteIndex];
        }
        return null;
    }

    /**
     * Delete note
     */
    deleteNote(id) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex !== -1) {
            const deletedNote = this.notes.splice(noteIndex, 1)[0];
            this.saveNotes();
            this.buildSearchIndex();
            return deletedNote;
        }
        return null;
    }

    /**
     * Get notes with filtering and sorting
     */
    getNotes(filter = 'all', sort = 'date', search = '') {
        let filteredNotes = [...this.notes];

        // Apply category filter
        if (filter !== 'all') {
            filteredNotes = filteredNotes.filter(note => note.category === filter);
        }

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filteredNotes = filteredNotes.filter(note => 
                note.title.toLowerCase().includes(searchLower) ||
                note.content.toLowerCase().includes(searchLower) ||
                note.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        // Apply sorting
        switch (sort) {
            case 'date':
                filteredNotes.sort((a, b) => new Date(b.modified) - new Date(a.modified));
                break;
            case 'title':
                filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'category':
                filteredNotes.sort((a, b) => a.category.localeCompare(b.category));
                break;
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                filteredNotes.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                break;
        }

        return filteredNotes;
    }

    /**
     * Create note from template
     */
    createFromTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return null;

        return this.createNote({
            title: `New ${template.name}`,
            content: template.template,
            category: template.category,
            tags: ['template', template.category]
        });
    }

    /**
     * Add attachment to note
     */
    addAttachment(noteId, attachment) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.attachments.push({
                id: Date.now(),
                name: attachment.name,
                type: attachment.type,
                size: attachment.size,
                url: attachment.url,
                added: new Date().toISOString()
            });
            this.saveNotes();
            return note;
        }
        return null;
    }

    /**
     * Add collaborator to note
     */
    addCollaborator(noteId, collaborator) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.collaborators.push({
                id: Date.now(),
                email: collaborator.email,
                name: collaborator.name,
                role: collaborator.role || 'viewer',
                added: new Date().toISOString()
            });
            this.saveNotes();
            return note;
        }
        return null;
    }

    /**
     * Build search index for fast searching
     */
    buildSearchIndex() {
        this.searchIndex = this.notes.map(note => ({
            id: note.id,
            title: note.title.toLowerCase(),
            content: note.content.toLowerCase(),
            tags: note.tags.map(tag => tag.toLowerCase()),
            category: note.category,
            author: note.author,
            project: note.project
        }));
    }

    /**
     * Search notes
     */
    searchNotes(query) {
        if (!query) return this.notes;

        const queryLower = query.toLowerCase();
        const results = this.searchIndex.filter(index => 
            index.title.includes(queryLower) ||
            index.content.includes(queryLower) ||
            index.tags.some(tag => tag.includes(queryLower)) ||
            index.category.includes(queryLower)
        );

        return results.map(result => 
            this.notes.find(note => note.id === result.id)
        ).filter(Boolean);
    }

    /**
     * Get note statistics
     */
    getStats() {
        const totalNotes = this.notes.length;
        const totalWords = this.notes.reduce((sum, note) => sum + note.wordCount, 0);
        const totalReadingTime = this.notes.reduce((sum, note) => sum + note.readingTime, 0);
        const categories = this.notes.reduce((acc, note) => {
            acc[note.category] = (acc[note.category] || 0) + 1;
            return acc;
        }, {});

        return {
            totalNotes,
            totalWords,
            totalReadingTime,
            categories,
            averageWordsPerNote: totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0,
            averageReadingTime: totalNotes > 0 ? Math.round(totalReadingTime / totalNotes) : 0
        };
    }

    /**
     * Calculate word count
     */
    calculateWordCount(content) {
        return content.split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Calculate reading time (words per minute)
     */
    calculateReadingTime(content) {
        const wordsPerMinute = 200;
        const wordCount = this.calculateWordCount(content);
        return Math.ceil(wordCount / wordsPerMinute);
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        try {
            const user = localStorage.getItem('current_user');
            return user ? JSON.parse(user).name : 'Unknown User';
        } catch {
            return 'Unknown User';
        }
    }

    /**
     * Get current project
     */
    getCurrentProject() {
        try {
            const project = localStorage.getItem('current_project');
            return project ? JSON.parse(project).name : 'Default Project';
        } catch {
            return 'Default Project';
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for note updates
        document.addEventListener('noteUpdated', (event) => {
            if (event.detail && event.detail.noteId) {
                this.updateNote(event.detail.noteId, event.detail.updates);
            }
        });

        // Listen for note creation
        document.addEventListener('noteCreated', (event) => {
            if (event.detail && event.detail.note) {
                this.createNote(event.detail.note);
            }
        });
    }

    /**
     * Export notes
     */
    exportNotes(format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(this.notes, null, 2);
            case 'csv':
                return this.exportToCSV();
            case 'markdown':
                return this.exportToMarkdown();
            default:
                return JSON.stringify(this.notes, null, 2);
        }
    }

    /**
     * Export to CSV
     */
    exportToCSV() {
        const headers = ['Title', 'Category', 'Tags', 'Created', 'Modified', 'Author', 'Project', 'Word Count'];
        const rows = this.notes.map(note => [
            note.title,
            note.category,
            note.tags.join(';'),
            note.created,
            note.modified,
            note.author,
            note.project,
            note.wordCount
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    /**
     * Export to Markdown
     */
    exportToMarkdown() {
        return this.notes.map(note => 
            `# ${note.title}\n\n**Category:** ${note.category}\n**Tags:** ${note.tags.join(', ')}\n**Created:** ${note.created}\n**Modified:** ${note.modified}\n\n${note.content}\n\n---\n`
        ).join('\n');
    }
}

// Initialize global instance
window.robustNotesSystem = new RobustNotesSystem();

console.log('📝 Robust Notes System loaded');
