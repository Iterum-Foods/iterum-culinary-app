/**
 * Enhanced Notes Interface
 * Advanced UI for the robust notes system
 * @version 1.0.0
 */

class EnhancedNotesInterface {
    constructor() {
        this.currentNote = null;
        this.isEditing = false;
        this.searchQuery = '';
        this.currentFilter = 'all';
        this.currentSort = 'date';
        this.init();
    }

    init() {
        console.log('📝 Enhanced Notes Interface initialized');
        this.createNotesInterface();
        this.setupEventListeners();
        this.loadNotes();
    }

    /**
     * Create the enhanced notes interface
     */
    createNotesInterface() {
        const notesContainer = document.createElement('div');
        notesContainer.id = 'enhanced-notes-interface';
        notesContainer.className = 'enhanced-notes-interface';
        notesContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            z-index: 9999;
            display: none;
            flex-direction: column;
            font-family: 'Inter', sans-serif;
        `;

        notesContainer.innerHTML = `
            <div class="notes-header" style="
                padding: 20px 24px;
                background: rgba(15, 23, 42, 0.95);
                border-bottom: 1px solid #334155;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            ">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="font-size: 28px;">📝</span>
                    <div>
                        <h2 style="color: #e2e8f0; margin: 0; font-size: 24px; font-weight: 600;">Enhanced Notes</h2>
                        <p style="color: #94a3b8; margin: 0; font-size: 14px;">Advanced note-taking with categories, templates, and collaboration</p>
                    </div>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="window.enhancedNotesInterface.newNote()" class="notes-btn" style="
                        background: rgba(16, 185, 129, 0.2);
                        border: 1px solid rgba(16, 185, 129, 0.3);
                        color: #10b981;
                        padding: 10px 16px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(16, 185, 129, 0.3)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.2)'">
                        ✏️ New Note
                    </button>
                    <button onclick="window.enhancedNotesInterface.openBrainstorming()" class="notes-btn" style="
                        background: rgba(59, 130, 246, 0.2);
                        border: 1px solid rgba(59, 130, 246, 0.3);
                        color: #3b82f6;
                        padding: 10px 16px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(59, 130, 246, 0.3)'" onmouseout="this.style.background='rgba(59, 130, 246, 0.2)'">
                        🧠 Brainstorm
                    </button>
                    <button onclick="window.enhancedNotesInterface.openNapkin()" class="notes-btn" style="
                        background: rgba(245, 158, 11, 0.2);
                        border: 1px solid rgba(245, 158, 11, 0.3);
                        color: #f59e0b;
                        padding: 10px 16px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(245, 158, 11, 0.3)'" onmouseout="this.style.background='rgba(245, 158, 11, 0.2)'">
                        🧻 Napkin
                    </button>
                    <button onclick="window.enhancedNotesInterface.closeInterface()" class="notes-btn" style="
                        background: rgba(239, 68, 68, 0.2);
                        border: 1px solid rgba(239, 68, 68, 0.3);
                        color: #ef4444;
                        padding: 10px 16px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(239, 68, 68, 0.3)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">
                        ✕ Close
                    </button>
                </div>
            </div>

            <div class="notes-content" style="
                flex: 1;
                display: grid;
                grid-template-columns: 300px 1fr 300px;
                gap: 20px;
                padding: 20px;
                overflow: hidden;
            ">
                <!-- Left Panel: Categories & Filters -->
                <div class="notes-sidebar" style="
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #334155;
                    overflow-y: auto;
                ">
                    <h3 style="color: #e2e8f0; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📂 Categories</h3>
                    <div id="category-list" style="margin-bottom: 20px;">
                        <!-- Categories will be populated here -->
                    </div>
                    
                    <h3 style="color: #e2e8f0; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🔍 Search & Filter</h3>
                    <div style="margin-bottom: 16px;">
                        <input type="text" id="notes-search" placeholder="Search notes..." style="
                            width: 100%;
                            padding: 10px 12px;
                            background: rgba(15, 23, 42, 0.5);
                            border: 1px solid #475569;
                            border-radius: 8px;
                            color: #e2e8f0;
                            font-size: 14px;
                        " onkeyup="window.enhancedNotesInterface.searchNotes(this.value)">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block;">Sort by:</label>
                        <select id="notes-sort" onchange="window.enhancedNotesInterface.sortNotes(this.value)" style="
                            width: 100%;
                            padding: 8px 12px;
                            background: rgba(15, 23, 42, 0.5);
                            border: 1px solid #475569;
                            border-radius: 6px;
                            color: #e2e8f0;
                            font-size: 14px;
                        ">
                            <option value="date">Date Modified</option>
                            <option value="title">Title</option>
                            <option value="category">Category</option>
                            <option value="priority">Priority</option>
                        </select>
                    </div>
                    
                    <h3 style="color: #e2e8f0; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📋 Templates</h3>
                    <div id="template-list" style="margin-bottom: 20px;">
                        <!-- Templates will be populated here -->
                    </div>
                    
                    <h3 style="color: #e2e8f0; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📊 Statistics</h3>
                    <div id="notes-stats" style="
                        background: rgba(51, 65, 85, 0.3);
                        border-radius: 8px;
                        padding: 12px;
                        font-size: 12px;
                        color: #cbd5e1;
                    ">
                        <!-- Stats will be populated here -->
                    </div>
                </div>

                <!-- Center Panel: Notes List -->
                <div class="notes-main" style="
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #334155;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: #e2e8f0; margin: 0; font-size: 18px; font-weight: 600;">📝 Notes</h3>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.enhancedNotesInterface.toggleView('list')" class="view-btn active" data-view="list" style="
                                padding: 6px 12px;
                                background: #3b82f6;
                                border: 1px solid #1d4ed8;
                                color: white;
                                border-radius: 6px;
                                font-size: 12px;
                                cursor: pointer;
                            ">📋 List</button>
                            <button onclick="window.enhancedNotesInterface.toggleView('grid')" class="view-btn" data-view="grid" style="
                                padding: 6px 12px;
                                background: #64748b;
                                border: 1px solid #475569;
                                color: #cbd5e1;
                                border-radius: 6px;
                                font-size: 12px;
                                cursor: pointer;
                            ">⊞ Grid</button>
                        </div>
                    </div>
                    
                    <div id="notes-list" style="flex: 1; overflow-y: auto;">
                        <!-- Notes will be populated here -->
                    </div>
                </div>

                <!-- Right Panel: Note Editor -->
                <div class="notes-editor" style="
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #334155;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                ">
                    <div id="note-editor-header" style="margin-bottom: 16px;">
                        <h3 style="color: #e2e8f0; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">📝 Note Editor</h3>
                        <p style="color: #94a3b8; margin: 0; font-size: 14px;">Select a note to edit</p>
                    </div>
                    
                    <div id="note-editor-content" style="flex: 1;">
                        <!-- Note editor will be populated here -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(notesContainer);
        this.renderCategories();
        this.renderTemplates();
        this.renderNotes();
        this.renderStats();
    }

    /**
     * Render categories
     */
    renderCategories() {
        const container = document.getElementById('category-list');
        if (!container) return;

        const categories = window.robustNotesSystem.categories;
        container.innerHTML = `
            <div class="category-item" onclick="window.enhancedNotesInterface.filterNotes('all')" style="
                background: rgba(51, 65, 85, 0.3);
                border: 1px solid #475569;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
                color: #cbd5e1;
            " onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'" onmouseout="this.style.background='rgba(51, 65, 85, 0.3)'">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">📁</span>
                    <span style="font-weight: 500;">All Notes</span>
                </div>
            </div>
            ${categories.map(category => `
                <div class="category-item" onclick="window.enhancedNotesInterface.filterNotes('${category.id}')" style="
                    background: rgba(51, 65, 85, 0.3);
                    border: 1px solid #475569;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #cbd5e1;
                " onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'" onmouseout="this.style.background='rgba(51, 65, 85, 0.3)'">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px;">${category.icon}</span>
                        <span style="font-weight: 500;">${category.name}</span>
                    </div>
                </div>
            `).join('')}
        `;
    }

    /**
     * Render templates
     */
    renderTemplates() {
        const container = document.getElementById('template-list');
        if (!container) return;

        const templates = window.robustNotesSystem.templates;
        container.innerHTML = templates.map(template => `
            <div class="template-item" onclick="window.enhancedNotesInterface.createFromTemplate('${template.id}')" style="
                background: rgba(51, 65, 85, 0.3);
                border: 1px solid #475569;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 6px;
                cursor: pointer;
                transition: all 0.2s;
                color: #cbd5e1;
                font-size: 12px;
            " onmouseover="this.style.background='rgba(16, 185, 129, 0.2)'" onmouseout="this.style.background='rgba(51, 65, 85, 0.3)'">
                <div style="font-weight: 500; margin-bottom: 2px;">${template.name}</div>
                <div style="color: #94a3b8; font-size: 10px;">${template.category}</div>
            </div>
        `).join('');
    }

    /**
     * Render notes list
     */
    renderNotes() {
        const container = document.getElementById('notes-list');
        if (!container) return;

        const notes = window.robustNotesSystem.getNotes(this.currentFilter, this.currentSort, this.searchQuery);
        
        if (notes.length === 0) {
            container.innerHTML = `
                <div style="
                    text-align: center;
                    padding: 40px 20px;
                    color: #94a3b8;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                    <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">No notes found</div>
                    <div style="font-size: 14px;">Create your first note or try a different filter</div>
                </div>
            `;
            return;
        }

        container.innerHTML = notes.map(note => `
            <div class="note-item" onclick="window.enhancedNotesInterface.selectNote(${note.id})" style="
                background: rgba(51, 65, 85, 0.3);
                border: 1px solid #475569;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.2s;
                color: #cbd5e1;
            " onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'" onmouseout="this.style.background='rgba(51, 65, 85, 0.3)'">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <h4 style="color: #e2e8f0; margin: 0; font-size: 16px; font-weight: 600;">${note.title}</h4>
                    <div style="display: flex; gap: 4px;">
                        ${note.isPinned ? '<span style="color: #f59e0b;">📌</span>' : ''}
                        ${note.priority === 'high' ? '<span style="color: #ef4444;">🔴</span>' : ''}
                        ${note.priority === 'medium' ? '<span style="color: #f59e0b;">🟡</span>' : ''}
                        ${note.priority === 'low' ? '<span style="color: #10b981;">🟢</span>' : ''}
                    </div>
                </div>
                <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">
                    ${note.category} • ${new Date(note.modified).toLocaleDateString()}
                </div>
                <div style="color: #cbd5e1; font-size: 14px; line-height: 1.4; margin-bottom: 8px;">
                    ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${note.tags.map(tag => `
                        <span style="
                            background: rgba(59, 130, 246, 0.2);
                            color: #60a5fa;
                            padding: 2px 6px;
                            border-radius: 4px;
                            font-size: 10px;
                        ">${tag}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Render statistics
     */
    renderStats() {
        const container = document.getElementById('notes-stats');
        if (!container) return;

        const stats = window.robustNotesSystem.getStats();
        container.innerHTML = `
            <div style="margin-bottom: 8px;">
                <span style="color: #e2e8f0; font-weight: 500;">${stats.totalNotes}</span> notes
            </div>
            <div style="margin-bottom: 8px;">
                <span style="color: #e2e8f0; font-weight: 500;">${stats.totalWords}</span> words
            </div>
            <div style="margin-bottom: 8px;">
                <span style="color: #e2e8f0; font-weight: 500;">${stats.totalReadingTime}</span> min reading
            </div>
            <div>
                <span style="color: #e2e8f0; font-weight: 500;">${stats.averageWordsPerNote}</span> avg words
            </div>
        `;
    }

    /**
     * Select note for editing
     */
    selectNote(noteId) {
        const note = window.robustNotesSystem.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentNote = note;
        this.renderNoteEditor();
    }

    /**
     * Render note editor
     */
    renderNoteEditor() {
        const container = document.getElementById('note-editor-content');
        if (!container || !this.currentNote) return;

        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <input type="text" id="note-title" value="${this.currentNote.title}" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid #475569;
                    border-radius: 8px;
                    color: #e2e8f0;
                    font-size: 16px;
                    font-weight: 600;
                " onchange="window.enhancedNotesInterface.updateNoteTitle(this.value)">
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <label style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Category</label>
                        <select id="note-category" onchange="window.enhancedNotesInterface.updateNoteCategory(this.value)" style="
                            width: 100%;
                            padding: 8px 12px;
                            background: rgba(15, 23, 42, 0.5);
                            border: 1px solid #475569;
                            border-radius: 6px;
                            color: #e2e8f0;
                            font-size: 14px;
                        ">
                            ${window.robustNotesSystem.categories.map(cat => 
                                `<option value="${cat.id}" ${cat.id === this.currentNote.category ? 'selected' : ''}>${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Priority</label>
                        <select id="note-priority" onchange="window.enhancedNotesInterface.updateNotePriority(this.value)" style="
                            width: 100%;
                            padding: 8px 12px;
                            background: rgba(15, 23, 42, 0.5);
                            border: 1px solid #475569;
                            border-radius: 6px;
                            color: #e2e8f0;
                            font-size: 14px;
                        ">
                            <option value="low" ${this.currentNote.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
                            <option value="medium" ${this.currentNote.priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
                            <option value="high" ${this.currentNote.priority === 'high' ? 'selected' : ''}>🔴 High</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Tags</label>
                <input type="text" id="note-tags" value="${this.currentNote.tags.join(', ')}" placeholder="Enter tags separated by commas" style="
                    width: 100%;
                    padding: 8px 12px;
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid #475569;
                    border-radius: 6px;
                    color: #e2e8f0;
                    font-size: 14px;
                " onchange="window.enhancedNotesInterface.updateNoteTags(this.value)">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Content</label>
                <textarea id="note-content" style="
                    width: 100%;
                    height: 300px;
                    padding: 12px;
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid #475569;
                    border-radius: 8px;
                    color: #e2e8f0;
                    font-size: 14px;
                    font-family: 'Inter', sans-serif;
                    resize: vertical;
                " onchange="window.enhancedNotesInterface.updateNoteContent(this.value)">${this.currentNote.content}</textarea>
            </div>
            
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button onclick="window.enhancedNotesInterface.saveNote()" style="
                    background: rgba(16, 185, 129, 0.2);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #10b981;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                ">💾 Save</button>
                <button onclick="window.enhancedNotesInterface.deleteNote()" style="
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                ">🗑️ Delete</button>
                <button onclick="window.enhancedNotesInterface.duplicateNote()" style="
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    color: #3b82f6;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                ">📋 Duplicate</button>
            </div>
            
            <div style="
                background: rgba(51, 65, 85, 0.3);
                border-radius: 8px;
                padding: 12px;
                font-size: 12px;
                color: #94a3b8;
            ">
                <div style="margin-bottom: 4px;">Created: ${new Date(this.currentNote.created).toLocaleString()}</div>
                <div style="margin-bottom: 4px;">Modified: ${new Date(this.currentNote.modified).toLocaleString()}</div>
                <div style="margin-bottom: 4px;">Words: ${this.currentNote.wordCount}</div>
                <div>Reading time: ${this.currentNote.readingTime} min</div>
            </div>
        `;
    }

    /**
     * Create new note
     */
    newNote() {
        const note = window.robustNotesSystem.createNote({
            title: 'New Note',
            content: '',
            category: 'personal'
        });
        this.currentNote = note;
        this.renderNoteEditor();
        this.renderNotes();
        this.renderStats();
    }

    /**
     * Create note from template
     */
    createFromTemplate(templateId) {
        const note = window.robustNotesSystem.createFromTemplate(templateId);
        if (note) {
            this.currentNote = note;
            this.renderNoteEditor();
            this.renderNotes();
            this.renderStats();
        }
    }

    /**
     * Update note title
     */
    updateNoteTitle(title) {
        if (this.currentNote) {
            window.robustNotesSystem.updateNote(this.currentNote.id, { title });
            this.currentNote.title = title;
        }
    }

    /**
     * Update note category
     */
    updateNoteCategory(category) {
        if (this.currentNote) {
            window.robustNotesSystem.updateNote(this.currentNote.id, { category });
            this.currentNote.category = category;
        }
    }

    /**
     * Update note priority
     */
    updateNotePriority(priority) {
        if (this.currentNote) {
            window.robustNotesSystem.updateNote(this.currentNote.id, { priority });
            this.currentNote.priority = priority;
        }
    }

    /**
     * Update note tags
     */
    updateNoteTags(tags) {
        if (this.currentNote) {
            const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            window.robustNotesSystem.updateNote(this.currentNote.id, { tags: tagArray });
            this.currentNote.tags = tagArray;
        }
    }

    /**
     * Update note content
     */
    updateNoteContent(content) {
        if (this.currentNote) {
            window.robustNotesSystem.updateNote(this.currentNote.id, { content });
            this.currentNote.content = content;
        }
    }

    /**
     * Save note
     */
    saveNote() {
        if (this.currentNote) {
            window.robustNotesSystem.updateNote(this.currentNote.id, {
                title: document.getElementById('note-title').value,
                content: document.getElementById('note-content').value,
                category: document.getElementById('note-category').value,
                priority: document.getElementById('note-priority').value,
                tags: document.getElementById('note-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
            });
            this.renderNotes();
            this.renderStats();
            this.showNotification('Note saved!', 'success');
        }
    }

    /**
     * Delete note
     */
    deleteNote() {
        if (this.currentNote && confirm('Are you sure you want to delete this note?')) {
            window.robustNotesSystem.deleteNote(this.currentNote.id);
            this.currentNote = null;
            this.renderNoteEditor();
            this.renderNotes();
            this.renderStats();
            this.showNotification('Note deleted!', 'info');
        }
    }

    /**
     * Duplicate note
     */
    duplicateNote() {
        if (this.currentNote) {
            const newNote = window.robustNotesSystem.createNote({
                title: `${this.currentNote.title} (Copy)`,
                content: this.currentNote.content,
                category: this.currentNote.category,
                tags: this.currentNote.tags,
                priority: this.currentNote.priority
            });
            this.currentNote = newNote;
            this.renderNoteEditor();
            this.renderNotes();
            this.renderStats();
            this.showNotification('Note duplicated!', 'success');
        }
    }

    /**
     * Filter notes
     */
    filterNotes(category) {
        this.currentFilter = category;
        this.renderNotes();
    }

    /**
     * Search notes
     */
    searchNotes(query) {
        this.searchQuery = query;
        this.renderNotes();
    }

    /**
     * Sort notes
     */
    sortNotes(sort) {
        this.currentSort = sort;
        this.renderNotes();
    }

    /**
     * Toggle view
     */
    toggleView(view) {
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '#64748b';
            btn.style.borderColor = '#475569';
            btn.style.color = '#cbd5e1';
        });
        
        const activeBtn = document.querySelector(`[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = '#3b82f6';
            activeBtn.style.borderColor = '#1d4ed8';
            activeBtn.style.color = 'white';
        }
        
        // TODO: Implement grid view
        this.renderNotes();
    }

    /**
     * Load notes
     */
    loadNotes() {
        this.renderNotes();
        this.renderStats();
    }

    /**
     * Open brainstorming
     */
    openBrainstorming() {
        if (window.recipeBrainstorming) {
            window.recipeBrainstorming.openWorkspace();
        }
    }

    /**
     * Open napkin brainstorming
     */
    openNapkin() {
        if (window.napkinBrainstorming) {
            window.napkinBrainstorming.openNapkinWorkspace();
        }
    }

    /**
     * Close interface
     */
    closeInterface() {
        const interface = document.getElementById('enhanced-notes-interface');
        if (interface) {
            interface.style.display = 'none';
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.openInterface();
            }
        });
    }

    /**
     * Open interface
     */
    openInterface() {
        const interface = document.getElementById('enhanced-notes-interface');
        if (interface) {
            interface.style.display = 'flex';
        } else {
            this.createNotesInterface();
            document.getElementById('enhanced-notes-interface').style.display = 'flex';
        }
    }
}

// Initialize global instance
window.enhancedNotesInterface = new EnhancedNotesInterface();

console.log('📝 Enhanced Notes Interface loaded');
console.log('💡 Press Ctrl+N to open enhanced notes');
