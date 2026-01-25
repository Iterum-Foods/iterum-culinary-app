/**
 * Napkin Brainstorming System
 * Mimics the natural flow of brainstorming on napkins and paper
 * @version 1.0.0
 */

class NapkinBrainstorming {
    constructor() {
        this.currentNapkin = null;
        this.napkins = [];
        this.isDrawing = false;
        this.init();
    }

    init() {
        console.log('🧻 Napkin Brainstorming System initialized');
        this.loadNapkins();
        this.setupEventListeners();
    }

    /**
     * Create napkin-style brainstorming workspace
     */
    createNapkinWorkspace() {
        const workspace = document.createElement('div');
        workspace.id = 'napkin-workspace';
        workspace.className = 'napkin-workspace';
        workspace.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            z-index: 9999;
            display: none;
            flex-direction: column;
            font-family: 'Kalam', 'Shadows Into Light', cursive;
        `;

        workspace.innerHTML = `
            <div class="napkin-header" style="
                padding: 16px 24px;
                background: rgba(248, 250, 252, 0.95);
                border-bottom: 2px solid #cbd5e1;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 28px;">🧻</span>
                    <h2 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 400; font-family: 'Kalam', cursive;">Napkin Brainstorming</h2>
                    <span style="color: #64748b; font-size: 14px; font-style: italic;">Just like the pros do it</span>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="window.napkinBrainstorming.newNapkin()" class="napkin-btn" style="
                        background: #f1f5f9;
                        border: 2px solid #cbd5e1;
                        color: #475569;
                        padding: 8px 16px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: 'Kalam', cursive;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                        📄 New Napkin
                    </button>
                    <button onclick="window.napkinBrainstorming.saveNapkin()" class="napkin-btn" style="
                        background: #dcfce7;
                        border: 2px solid #86efac;
                        color: #166534;
                        padding: 8px 16px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: 'Kalam', cursive;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#bbf7d0'" onmouseout="this.style.background='#dcfce7'">
                        💾 Save
                    </button>
                    <button onclick="window.napkinBrainstorming.closeNapkin()" class="napkin-btn" style="
                        background: #fef2f2;
                        border: 2px solid #fca5a5;
                        color: #991b1b;
                        padding: 8px 16px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: 'Kalam', cursive;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                        ✕ Close
                    </button>
                </div>
            </div>

            <div class="napkin-content" style="
                flex: 1;
                display: flex;
                gap: 20px;
                padding: 20px;
                overflow: hidden;
            ">
                <!-- Napkin Stack (Left) -->
                <div class="napkin-stack" style="
                    width: 200px;
                    background: rgba(248, 250, 252, 0.8);
                    border-radius: 12px;
                    padding: 16px;
                    border: 2px solid #e2e8f0;
                    overflow-y: auto;
                ">
                    <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 16px; font-family: 'Kalam', cursive;">📚 Your Napkins</h3>
                    <div id="napkin-list" style="display: flex; flex-direction: column; gap: 8px;">
                        <!-- Napkins will be listed here -->
                    </div>
                    <button onclick="window.napkinBrainstorming.newNapkin()" style="
                        width: 100%;
                        background: #f1f5f9;
                        border: 2px dashed #cbd5e1;
                        color: #64748b;
                        padding: 12px;
                        border-radius: 8px;
                        font-size: 12px;
                        font-family: 'Kalam', cursive;
                        cursor: pointer;
                        margin-top: 12px;
                    " onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                        + Add New Napkin
                    </button>
                </div>

                <!-- Main Napkin Canvas -->
                <div class="napkin-canvas-container" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    border: 2px solid #e2e8f0;
                    overflow: hidden;
                ">
                    <!-- Napkin Header -->
                    <div class="napkin-header-bar" style="
                        background: linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%);
                        padding: 12px 20px;
                        border-bottom: 1px solid #cbd5e1;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 20px;">🧻</span>
                            <input type="text" id="napkin-title" placeholder="Recipe idea..." style="
                                background: transparent;
                                border: none;
                                font-size: 18px;
                                font-family: 'Kalam', cursive;
                                color: #1e293b;
                                font-weight: 600;
                                outline: none;
                                min-width: 200px;
                            ">
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.napkinBrainstorming.clearNapkin()" class="napkin-tool-btn" style="
                                background: #fef3c7;
                                border: 1px solid #fbbf24;
                                color: #92400e;
                                padding: 6px 12px;
                                border-radius: 6px;
                                font-size: 12px;
                                font-family: 'Kalam', cursive;
                                cursor: pointer;
                            ">🗑️ Clear</button>
                            <button onclick="window.napkinBrainstorming.exportNapkin()" class="napkin-tool-btn" style="
                                background: #dbeafe;
                                border: 1px solid #60a5fa;
                                color: #1e40af;
                                padding: 6px 12px;
                                border-radius: 6px;
                                font-size: 12px;
                                font-family: 'Kalam', cursive;
                                cursor: pointer;
                            ">📤 Export</button>
                        </div>
                    </div>

                    <!-- Napkin Canvas -->
                    <div class="napkin-canvas-wrapper" style="
                        flex: 1;
                        position: relative;
                        background: #fefefe;
                        overflow: hidden;
                    ">
                        <canvas id="napkin-canvas" style="
                            width: 100%;
                            height: 100%;
                            background: #fefefe;
                            cursor: crosshair;
                            display: block;
                        "></canvas>
                        
                        <!-- Napkin Texture Overlay -->
                        <div class="napkin-texture" style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: 
                                radial-gradient(circle at 20% 20%, rgba(0,0,0,0.02) 1px, transparent 1px),
                                radial-gradient(circle at 80% 80%, rgba(0,0,0,0.02) 1px, transparent 1px),
                                radial-gradient(circle at 40% 60%, rgba(0,0,0,0.01) 1px, transparent 1px);
                            background-size: 50px 50px, 30px 30px, 70px 70px;
                            pointer-events: none;
                            opacity: 0.3;
                        "></div>
                    </div>

                    <!-- Napkin Tools -->
                    <div class="napkin-tools" style="
                        background: #f8fafc;
                        border-top: 1px solid #e2e8f0;
                        padding: 12px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <span style="color: #64748b; font-size: 12px; font-family: 'Kalam', cursive;">Tools:</span>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="window.napkinBrainstorming.setTool('pen')" class="tool-btn active" data-tool="pen" style="
                                    width: 32px;
                                    height: 32px;
                                    border-radius: 50%;
                                    background: #3b82f6;
                                    border: 2px solid #1d4ed8;
                                    color: white;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 14px;
                                ">✏️</button>
                                <button onclick="window.napkinBrainstorming.setTool('marker')" class="tool-btn" data-tool="marker" style="
                                    width: 32px;
                                    height: 32px;
                                    border-radius: 50%;
                                    background: #64748b;
                                    border: 2px solid #475569;
                                    color: white;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 14px;
                                ">🖍️</button>
                                <button onclick="window.napkinBrainstorming.setTool('highlighter')" class="tool-btn" data-tool="highlighter" style="
                                    width: 32px;
                                    height: 32px;
                                    border-radius: 50%;
                                    background: #64748b;
                                    border: 2px solid #475569;
                                    color: white;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 14px;
                                ">🖊️</button>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <span style="color: #64748b; font-size: 12px; font-family: 'Kalam', cursive;">Size:</span>
                            <input type="range" id="brush-size" min="1" max="20" value="3" 
                                   onchange="window.napkinBrainstorming.setBrushSize(this.value)"
                                   style="width: 80px;">
                            <span id="brush-size-display" style="color: #475569; font-size: 11px; font-family: 'Kalam', cursive;">3px</span>
                        </div>

                        <div style="display: flex; gap: 12px; align-items: center;">
                            <span style="color: #64748b; font-size: 12px; font-family: 'Kalam', cursive;">Color:</span>
                            <div style="display: flex; gap: 4px;">
                                <button onclick="window.napkinBrainstorming.setColor('#1e293b')" class="color-btn active" data-color="#1e293b" style="
                                    width: 24px;
                                    height: 24px;
                                    border-radius: 50%;
                                    background: #1e293b;
                                    border: 2px solid #0f172a;
                                    cursor: pointer;
                                "></button>
                                <button onclick="window.napkinBrainstorming.setColor('#dc2626')" class="color-btn" data-color="#dc2626" style="
                                    width: 24px;
                                    height: 24px;
                                    border-radius: 50%;
                                    background: #dc2626;
                                    border: 2px solid #991b1b;
                                    cursor: pointer;
                                "></button>
                                <button onclick="window.napkinBrainstorming.setColor('#ea580c')" class="color-btn" data-color="#ea580c" style="
                                    width: 24px;
                                    height: 24px;
                                    border-radius: 50%;
                                    background: #ea580c;
                                    border: 2px solid #c2410c;
                                    cursor: pointer;
                                "></button>
                                <button onclick="window.napkinBrainstorming.setColor('#16a34a')" class="color-btn" data-color="#16a34a" style="
                                    width: 24px;
                                    height: 24px;
                                    border-radius: 50%;
                                    background: #16a34a;
                                    border: 2px solid #15803d;
                                    cursor: pointer;
                                "></button>
                                <button onclick="window.napkinBrainstorming.setColor('#2563eb')" class="color-btn" data-color="#2563eb" style="
                                    width: 24px;
                                    height: 24px;
                                    border-radius: 50%;
                                    background: #2563eb;
                                    border: 2px solid #1d4ed8;
                                    cursor: pointer;
                                "></button>
                                <button onclick="window.napkinBrainstorming.setColor('#7c3aed')" class="color-btn" data-color="#7c3aed" style="
                                    width: 24px;
                                    height: 24px;
                                    border-radius: 50%;
                                    background: #7c3aed;
                                    border: 2px solid #6d28d9;
                                    cursor: pointer;
                                "></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(workspace);
        this.setupNapkinCanvas();
        this.renderNapkinList();
        this.newNapkin();

        console.log('🧻 Napkin workspace created');
    }

    /**
     * Setup napkin canvas with natural drawing feel
     */
    setupNapkinCanvas() {
        const canvas = document.getElementById('napkin-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Drawing state
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        let currentTool = 'pen';
        let currentColor = '#1e293b';
        let currentSize = 3;

        // Natural drawing with slight randomness
        const draw = (e) => {
            if (!isDrawing) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            
            // Add slight randomness for natural feel
            const randomOffset = (Math.random() - 0.5) * 0.5;
            ctx.lineWidth = currentSize + randomOffset;
            
            // Different tools have different styles
            if (currentTool === 'pen') {
                ctx.globalAlpha = 0.9;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            } else if (currentTool === 'marker') {
                ctx.globalAlpha = 0.6;
                ctx.lineCap = 'square';
                ctx.lineJoin = 'miter';
            } else if (currentTool === 'highlighter') {
                ctx.globalAlpha = 0.3;
                ctx.lineCap = 'square';
                ctx.lineJoin = 'miter';
            }

            ctx.strokeStyle = currentColor;
            ctx.stroke();

            lastX = x;
            lastY = y;
        };

        // Mouse events
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
        });

        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseout', () => isDrawing = false);

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDrawing = true;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            lastX = touch.clientX - rect.left;
            lastY = touch.clientY - rect.top;
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDrawing) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.lineWidth = currentSize + (Math.random() - 0.5) * 0.5;
                ctx.strokeStyle = currentColor;
                ctx.stroke();
                
                lastX = x;
                lastY = y;
            }
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            isDrawing = false;
        });

        // Store references
        this.canvas = canvas;
        this.ctx = ctx;
        this.currentTool = currentTool;
        this.currentColor = currentColor;
        this.currentSize = currentSize;
    }

    /**
     * Set drawing tool
     */
    setTool(tool) {
        this.currentTool = tool;
        
        // Update active tool button
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '#64748b';
            btn.style.borderColor = '#475569';
        });
        
        const activeBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = '#3b82f6';
            activeBtn.style.borderColor = '#1d4ed8';
        }
    }

    /**
     * Set brush color
     */
    setColor(color) {
        this.currentColor = color;
        
        // Update active color button
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.borderWidth = '2px';
        });
        
        const activeBtn = document.querySelector(`[data-color="${color}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.borderWidth = '3px';
        }
    }

    /**
     * Set brush size
     */
    setBrushSize(size) {
        this.currentSize = parseInt(size);
        document.getElementById('brush-size-display').textContent = `${size}px`;
    }

    /**
     * Create new napkin
     */
    newNapkin() {
        const napkin = {
            id: Date.now(),
            title: 'New Recipe Idea',
            timestamp: new Date().toISOString(),
            data: null
        };
        
        this.currentNapkin = napkin;
        this.napkins.push(napkin);
        
        // Clear canvas
        this.clearNapkin();
        
        // Update title
        const titleInput = document.getElementById('napkin-title');
        if (titleInput) {
            titleInput.value = napkin.title;
        }
        
        this.renderNapkinList();
        this.showNotification('New napkin created!', 'success');
    }

    /**
     * Save current napkin
     */
    saveNapkin() {
        if (!this.currentNapkin) return;
        
        const title = document.getElementById('napkin-title').value || 'Untitled Recipe';
        this.currentNapkin.title = title;
        this.currentNapkin.data = this.canvas.toDataURL();
        this.currentNapkin.timestamp = new Date().toISOString();
        
        // Update in napkins array
        const index = this.napkins.findIndex(n => n.id === this.currentNapkin.id);
        if (index !== -1) {
            this.napkins[index] = this.currentNapkin;
        }
        
        // Save to localStorage
        localStorage.setItem('napkin_brainstorming', JSON.stringify(this.napkins));
        
        this.renderNapkinList();
        this.showNotification('Napkin saved!', 'success');
    }

    /**
     * Load napkin
     */
    loadNapkin(napkinId) {
        const napkin = this.napkins.find(n => n.id === napkinId);
        if (!napkin) return;
        
        this.currentNapkin = napkin;
        
        // Update title
        document.getElementById('napkin-title').value = napkin.title;
        
        // Load canvas data
        if (napkin.data) {
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = napkin.data;
        } else {
            this.clearNapkin();
        }
        
        this.showNotification(`Loaded: ${napkin.title}`, 'info');
    }

    /**
     * Clear napkin
     */
    clearNapkin() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Export napkin
     */
    exportNapkin() {
        if (!this.currentNapkin) return;
        
        const link = document.createElement('a');
        link.download = `${this.currentNapkin.title.replace(/[^a-z0-9]/gi, '_')}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        
        this.showNotification('Napkin exported!', 'success');
    }

    /**
     * Close napkin workspace
     */
    closeNapkin() {
        const workspace = document.getElementById('napkin-workspace');
        if (workspace) {
            workspace.style.display = 'none';
        }
    }

    /**
     * Render napkin list
     */
    renderNapkinList() {
        const container = document.getElementById('napkin-list');
        if (!container) return;

        container.innerHTML = this.napkins.map(napkin => `
            <div class="napkin-item" onclick="window.napkinBrainstorming.loadNapkin(${napkin.id})" style="
                background: ${napkin.id === this.currentNapkin?.id ? '#dbeafe' : '#f8fafc'};
                border: 2px solid ${napkin.id === this.currentNapkin?.id ? '#3b82f6' : '#e2e8f0'};
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Kalam', cursive;
            " onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='${napkin.id === this.currentNapkin?.id ? '#dbeafe' : '#f8fafc'}'">
                <div style="color: #1e293b; font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                    ${napkin.title}
                </div>
                <div style="color: #64748b; font-size: 11px;">
                    ${new Date(napkin.timestamp).toLocaleDateString()}
                </div>
                ${napkin.data ? '<div style="color: #10b981; font-size: 10px; margin-top: 4px;">📝 Has content</div>' : ''}
            </div>
        `).join('');
    }

    /**
     * Load napkins from localStorage
     */
    loadNapkins() {
        try {
            const saved = localStorage.getItem('napkin_brainstorming');
            if (saved) {
                this.napkins = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading napkins:', error);
            this.napkins = [];
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
                this.openNapkinWorkspace();
            }
        });
    }

    /**
     * Open napkin workspace
     */
    openNapkinWorkspace() {
        const workspace = document.getElementById('napkin-workspace');
        if (workspace) {
            workspace.style.display = 'flex';
        } else {
            this.createNapkinWorkspace();
            document.getElementById('napkin-workspace').style.display = 'flex';
        }
    }
}

// Initialize global instance
window.napkinBrainstorming = new NapkinBrainstorming();

console.log('🧻 Napkin Brainstorming System loaded');
console.log('💡 Press Ctrl+N to open napkin workspace');
