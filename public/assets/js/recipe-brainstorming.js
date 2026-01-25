/**
 * Recipe Brainstorming & Ideation System
 * Enhanced creative workflow for recipe development
 * @version 1.0.0
 */

class RecipeBrainstorming {
    constructor() {
        this.currentSketch = null;
        this.notes = [];
        this.ideas = [];
        this.templates = [];
        this.init();
    }

    init() {
        console.log('🧠 Recipe Brainstorming System initialized');
        this.loadTemplates();
        this.setupEventListeners();
    }

    /**
     * Load recipe idea templates
     */
    loadTemplates() {
        this.templates = [
            {
                id: 'fusion',
                name: 'Fusion Cuisine',
                description: 'Combine two different culinary traditions',
                prompts: [
                    'What two cuisines excite you?',
                    'Which traditional dish could be reimagined?',
                    'What unexpected ingredient could bridge cultures?',
                    'How can you honor both traditions?'
                ],
                examples: ['Korean-Mexican tacos', 'Italian-Japanese pasta', 'Indian-French curry']
            },
            {
                id: 'seasonal',
                name: 'Seasonal Spotlight',
                description: 'Highlight peak seasonal ingredients',
                prompts: [
                    'What\'s in season right now?',
                    'Which ingredient is at its peak?',
                    'How can you showcase its natural flavor?',
                    'What cooking method would enhance it?'
                ],
                examples: ['Spring asparagus risotto', 'Summer tomato salad', 'Fall apple tart']
            },
            {
                id: 'comfort',
                name: 'Comfort Food Reimagined',
                description: 'Elevate classic comfort dishes',
                prompts: [
                    'What comfort food do you crave?',
                    'How can you make it more sophisticated?',
                    'What unexpected twist could you add?',
                    'How can you improve the texture?'
                ],
                examples: ['Gourmet mac and cheese', 'Elevated grilled cheese', 'Artisanal pizza']
            },
            {
                id: 'healthy',
                name: 'Healthy Innovation',
                description: 'Create nutritious dishes that don\'t compromise on flavor',
                prompts: [
                    'What healthy ingredient could be the star?',
                    'How can you add more vegetables?',
                    'What alternative cooking method could you use?',
                    'How can you boost nutrition without losing taste?'
                ],
                examples: ['Cauliflower rice bowl', 'Zucchini noodle pasta', 'Quinoa power salad']
            },
            {
                id: 'technique',
                name: 'Technique Focus',
                description: 'Master a specific cooking technique',
                prompts: [
                    'What technique do you want to practice?',
                    'Which ingredient would showcase this technique?',
                    'How can you perfect the method?',
                    'What variations could you explore?'
                ],
                examples: ['Sous vide steak', 'Fermented vegetables', 'Smoked fish']
            },
            {
                id: 'presentation',
                name: 'Visual Story',
                description: 'Create dishes that tell a story through presentation',
                prompts: [
                    'What story do you want to tell?',
                    'How can colors create emotion?',
                    'What plating technique would be dramatic?',
                    'How can you use negative space?'
                ],
                examples: ['Garden on a plate', 'Abstract art dessert', 'Minimalist elegance']
            }
        ];
    }

    /**
     * Create brainstorming workspace
     */
    createBrainstormingWorkspace() {
        const workspace = document.createElement('div');
        workspace.id = 'brainstorming-workspace';
        workspace.className = 'brainstorming-workspace';
        workspace.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            z-index: 9999;
            display: none;
            flex-direction: column;
        `;

        workspace.innerHTML = `
            <div class="brainstorming-header" style="
                padding: 20px;
                background: rgba(15, 23, 42, 0.9);
                border-bottom: 1px solid #334155;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">🧠</span>
                    <h2 style="color: #e2e8f0; margin: 0; font-size: 20px;">Recipe Brainstorming</h2>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="window.recipeBrainstorming.saveWorkspace()" class="btn btn-primary" style="
                        background: rgba(16, 185, 129, 0.2);
                        border: 1px solid rgba(16, 185, 129, 0.3);
                        color: #10b981;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 12px;
                    ">💾 Save</button>
                    <button onclick="window.recipeBrainstorming.closeWorkspace()" class="btn btn-secondary" style="
                        background: rgba(239, 68, 68, 0.2);
                        border: 1px solid rgba(239, 68, 68, 0.3);
                        color: #fca5a5;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 12px;
                    ">✕ Close</button>
                </div>
            </div>

            <div class="brainstorming-content" style="
                flex: 1;
                display: grid;
                grid-template-columns: 300px 1fr 300px;
                gap: 20px;
                padding: 20px;
                overflow: hidden;
            ">
                <!-- Left Panel: Templates & Ideas -->
                <div class="left-panel" style="
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #334155;
                    overflow-y: auto;
                ">
                    <h3 style="color: #e2e8f0; margin: 0 0 16px 0; font-size: 16px;">💡 Inspiration</h3>
                    <div id="template-selector"></div>
                    <div id="idea-generator" style="margin-top: 20px;"></div>
                </div>

                <!-- Center Panel: Sketching Canvas -->
                <div class="center-panel" style="
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #334155;
                    display: flex;
                    flex-direction: column;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: #e2e8f0; margin: 0; font-size: 16px;">🎨 Sketch Your Idea</h3>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.recipeBrainstorming.clearCanvas()" class="btn btn-sm" style="
                                background: rgba(59, 130, 246, 0.2);
                                border: 1px solid rgba(59, 130, 246, 0.3);
                                color: #60a5fa;
                                padding: 6px 12px;
                                border-radius: 4px;
                                font-size: 11px;
                            ">🗑️ Clear</button>
                            <button onclick="window.recipeBrainstorming.saveSketch()" class="btn btn-sm" style="
                                background: rgba(16, 185, 129, 0.2);
                                border: 1px solid rgba(16, 185, 129, 0.3);
                                color: #10b981;
                                padding: 6px 12px;
                                border-radius: 4px;
                                font-size: 11px;
                            ">💾 Save</button>
                        </div>
                    </div>
                    <canvas id="sketching-canvas" style="
                        flex: 1;
                        background: white;
                        border-radius: 8px;
                        cursor: crosshair;
                        border: 2px dashed #64748b;
                    "></canvas>
                    <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="window.recipeBrainstorming.setBrushSize(2)" class="brush-size-btn active" data-size="2" style="
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            background: #3b82f6;
                            border: 2px solid #1d4ed8;
                            cursor: pointer;
                        "></button>
                        <button onclick="window.recipeBrainstorming.setBrushSize(5)" class="brush-size-btn" data-size="5" style="
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            background: #64748b;
                            border: 2px solid #475569;
                            cursor: pointer;
                        "></button>
                        <button onclick="window.recipeBrainstorming.setBrushSize(10)" class="brush-size-btn" data-size="10" style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: #64748b;
                            border: 2px solid #475569;
                            cursor: pointer;
                        "></button>
                        <input type="color" id="brush-color" value="#3b82f6" onchange="window.recipeBrainstorming.setBrushColor(this.value)" style="
                            width: 40px;
                            height: 40px;
                            border-radius: 8px;
                            border: none;
                            cursor: pointer;
                        ">
                    </div>
                </div>

                <!-- Right Panel: Notes & Development -->
                <div class="right-panel" style="
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #334155;
                    overflow-y: auto;
                ">
                    <h3 style="color: #e2e8f0; margin: 0 0 16px 0; font-size: 16px;">📝 Development Notes</h3>
                    <div id="notes-container"></div>
                    <div id="flavor-profile" style="margin-top: 20px;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(workspace);
        this.setupCanvas();
        this.renderTemplates();
        this.renderNotes();
        this.renderFlavorProfile();
    }

    /**
     * Setup sketching canvas
     */
    setupCanvas() {
        const canvas = document.getElementById('sketching-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        let isDrawing = false;
        let currentBrushSize = 2;
        let currentColor = '#3b82f6';

        // Drawing events
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.stroke();
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        canvas.addEventListener('mouseout', () => {
            isDrawing = false;
        });

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(x, y);
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDrawing) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            isDrawing = false;
        });

        // Store canvas context
        this.canvas = canvas;
        this.ctx = ctx;
    }

    /**
     * Set brush size
     */
    setBrushSize(size) {
        this.ctx.lineWidth = size;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Update active button
        document.querySelectorAll('.brush-size-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '#64748b';
            btn.style.borderColor = '#475569';
        });
        
        const activeBtn = document.querySelector(`[data-size="${size}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = '#3b82f6';
            activeBtn.style.borderColor = '#1d4ed8';
        }
    }

    /**
     * Set brush color
     */
    setBrushColor(color) {
        this.ctx.strokeStyle = color;
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Save sketch
     */
    saveSketch() {
        const dataURL = this.canvas.toDataURL();
        const sketch = {
            id: Date.now(),
            data: dataURL,
            timestamp: new Date().toISOString(),
            title: prompt('Name your sketch:') || 'Untitled Sketch'
        };
        
        // Save to localStorage
        const sketches = JSON.parse(localStorage.getItem('recipe_sketches') || '[]');
        sketches.push(sketch);
        localStorage.setItem('recipe_sketches', JSON.stringify(sketches));
        
        console.log('Sketch saved:', sketch.title);
        this.showNotification('Sketch saved!', 'success');
    }

    /**
     * Render templates
     */
    renderTemplates() {
        const container = document.getElementById('template-selector');
        if (!container) return;

        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <label style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Choose a starting point:</label>
            </div>
            ${this.templates.map(template => `
                <div class="template-card" onclick="window.recipeBrainstorming.selectTemplate('${template.id}')" style="
                    background: rgba(51, 65, 85, 0.3);
                    border: 1px solid #475569;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'" onmouseout="this.style.background='rgba(51, 65, 85, 0.3)'">
                    <div style="color: #e2e8f0; font-weight: 600; font-size: 13px; margin-bottom: 4px;">${template.name}</div>
                    <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">${template.description}</div>
                    <div style="color: #64748b; font-size: 10px;">${template.examples.join(', ')}</div>
                </div>
            `).join('')}
        `;
    }

    /**
     * Select template
     */
    selectTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        // Add template prompts to notes
        template.prompts.forEach(prompt => {
            this.addNote(prompt, 'template');
        });

        // Show template examples
        this.showNotification(`Selected: ${template.name}`, 'info');
        this.renderNotes();
    }

    /**
     * Render notes
     */
    renderNotes() {
        const container = document.getElementById('notes-container');
        if (!container) return;

        container.innerHTML = `
            <div style="margin-bottom: 12px;">
                <input type="text" id="new-note" placeholder="Add a note or idea..." style="
                    width: 100%;
                    padding: 8px 12px;
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid #475569;
                    border-radius: 6px;
                    color: #e2e8f0;
                    font-size: 12px;
                " onkeypress="if(event.key==='Enter') window.recipeBrainstorming.addNoteFromInput()">
            </div>
            <div id="notes-list" style="max-height: 200px; overflow-y: auto;">
                ${this.notes.map(note => `
                    <div class="note-item" style="
                        background: rgba(51, 65, 85, 0.3);
                        border: 1px solid #475569;
                        border-radius: 6px;
                        padding: 8px;
                        margin-bottom: 6px;
                        font-size: 11px;
                        color: #cbd5e1;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <span>${note.text}</span>
                            <button onclick="window.recipeBrainstorming.removeNote(${note.id})" style="
                                background: none;
                                border: none;
                                color: #ef4444;
                                cursor: pointer;
                                font-size: 10px;
                                padding: 2px;
                            ">✕</button>
                        </div>
                        <div style="color: #64748b; font-size: 9px; margin-top: 4px;">
                            ${note.type} • ${new Date(note.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Add note from input
     */
    addNoteFromInput() {
        const input = document.getElementById('new-note');
        if (input && input.value.trim()) {
            this.addNote(input.value.trim(), 'manual');
            input.value = '';
            this.renderNotes();
        }
    }

    /**
     * Add note
     */
    addNote(text, type = 'manual') {
        const note = {
            id: Date.now(),
            text,
            type,
            timestamp: new Date().toISOString()
        };
        this.notes.push(note);
    }

    /**
     * Remove note
     */
    removeNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.renderNotes();
    }

    /**
     * Render flavor profile
     */
    renderFlavorProfile() {
        const container = document.getElementById('flavor-profile');
        if (!container) return;

        const flavors = [
            { name: 'Sweet', value: 0, color: '#f59e0b' },
            { name: 'Salty', value: 0, color: '#3b82f6' },
            { name: 'Sour', value: 0, color: '#10b981' },
            { name: 'Bitter', value: 0, color: '#8b5cf6' },
            { name: 'Umami', value: 0, color: '#ef4444' },
            { name: 'Spicy', value: 0, color: '#f97316' }
        ];

        container.innerHTML = `
            <h4 style="color: #e2e8f0; margin: 0 0 12px 0; font-size: 14px;">👅 Flavor Profile</h4>
            ${flavors.map(flavor => `
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="color: #cbd5e1; font-size: 11px;">${flavor.name}</span>
                        <span style="color: #94a3b8; font-size: 10px;">${flavor.value}/10</span>
                    </div>
                    <div style="
                        width: 100%;
                        height: 6px;
                        background: rgba(51, 65, 85, 0.5);
                        border-radius: 3px;
                        overflow: hidden;
                    ">
                        <div style="
                            width: ${flavor.value * 10}%;
                            height: 100%;
                            background: ${flavor.color};
                            transition: width 0.3s;
                        "></div>
                    </div>
                    <input type="range" min="0" max="10" value="${flavor.value}" 
                           onchange="window.recipeBrainstorming.updateFlavor('${flavor.name}', this.value)"
                           style="
                               width: 100%;
                               height: 4px;
                               background: transparent;
                               outline: none;
                               cursor: pointer;
                           ">
                </div>
            `).join('')}
        `;
    }

    /**
     * Update flavor profile
     */
    updateFlavor(flavorName, value) {
        // Update the visual bar
        const flavorDiv = document.querySelector(`[data-flavor="${flavorName}"]`);
        if (flavorDiv) {
            const bar = flavorDiv.querySelector('.flavor-bar');
            if (bar) {
                bar.style.width = `${value * 10}%`;
            }
        }
    }

    /**
     * Open brainstorming workspace
     */
    openWorkspace() {
        const workspace = document.getElementById('brainstorming-workspace');
        if (workspace) {
            workspace.style.display = 'flex';
        } else {
            this.createBrainstormingWorkspace();
            document.getElementById('brainstorming-workspace').style.display = 'flex';
        }
    }

    /**
     * Close brainstorming workspace
     */
    closeWorkspace() {
        const workspace = document.getElementById('brainstorming-workspace');
        if (workspace) {
            workspace.style.display = 'none';
        }
    }

    /**
     * Save workspace
     */
    saveWorkspace() {
        const workspaceData = {
            notes: this.notes,
            sketch: this.canvas ? this.canvas.toDataURL() : null,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('recipe_brainstorming', JSON.stringify(workspaceData));
        this.showNotification('Workspace saved!', 'success');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Use existing toast system if available
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
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                this.openWorkspace();
            }
        });
    }
}

// Initialize global instance
window.recipeBrainstorming = new RecipeBrainstorming();

console.log('🧠 Recipe Brainstorming System loaded');
console.log('💡 Press Ctrl+B to open brainstorming workspace');
