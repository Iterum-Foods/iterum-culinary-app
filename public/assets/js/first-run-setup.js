/**
 * First Run Setup Wizard
 * Guides new users through profile enrichment, first project creation,
 * and optional bulk recipe import into local storage.
 */
(function () {
    class FirstRunSetup {
        constructor() {
            this.currentStep = 0;
            this.totalSteps = 3;
            this.modal = null;
            this.user = null;
            this.userKey = null;
            this.state = {
                profile: {},
                project: null,
                import: {
                    scanned: 0,
                    supported: 0,
                    imported: 0,
                    menuFiles: 0,
                    menuItems: 0,
                    draftsSaved: 0,
                    errors: [],
                    warnings: [],
                    completed: false,
                    inProgress: false
                }
            };
            this.recipeImporter = null;
            this.universalRecipeManager = null;
            this.directorySupport = 'showDirectoryPicker' in window;
            this.extractorEndpoint = window.APP_CONFIG?.extractorUrl || 'http://localhost:8081/extract';

            document.addEventListener('DOMContentLoaded', () => this.init());
        }

        async init() {
            await this.waitForReadiness();

            this.user = this.getCurrentUser();
            if (!this.user) {
                return;
            }

            this.userKey = `first_run_setup_status_${this.user.id}`;
            const status = localStorage.getItem(this.userKey);
            if (status === 'complete' || status === 'skipped') {
                return;
            }

            if (typeof window.RecipeImportExport === 'function') {
                this.recipeImporter = new window.RecipeImportExport();
            }

            if (window.universalRecipeManager) {
                this.universalRecipeManager = window.universalRecipeManager;
            }

            this.injectStyles();
            this.renderModal();
            this.updateStep();
        }

        async waitForReadiness(timeout = 8000) {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                const hasUser =
                    (window.authManager && window.authManager.currentUser) ||
                    localStorage.getItem('current_user');
                const hasProjectManager = window.projectManager && window.projectManager.createProject;

                if (hasUser && hasProjectManager) {
                    return true;
                }

                await this.sleep(150);
            }
            return false;
        }

        getCurrentUser() {
            if (window.authManager?.currentUser) {
                return window.authManager.currentUser;
            }

            try {
                const stored = localStorage.getItem('current_user');
                return stored ? JSON.parse(stored) : null;
            } catch (error) {
                console.error('❌ Unable to parse current_user from storage:', error);
                return null;
            }
        }

        injectStyles() {
            if (document.getElementById('first-run-setup-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'first-run-setup-styles';
            style.textContent = `
                #first-run-setup-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.78);
                    backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 24px;
                }

                #first-run-setup-modal {
                    width: min(820px, 100%);
                    background: #f8fafc;
                    border-radius: 24px;
                    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    max-height: 95vh;
                }

               .frs-header {
                    padding: 28px 32px 16px;
                    background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(59,130,246,0.15));
                    border-bottom: 1px solid rgba(148, 163, 184, 0.35);
                }

                .frs-title {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 6px;
                }

                .frs-subtitle {
                    color: #475569;
                }

                .frs-progress {
                    display: flex;
                    gap: 12px;
                    padding: 0 32px 20px;
                }

                .frs-progress-step {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #94a3b8;
                    font-weight: 600;
                }

                .frs-progress-step.active {
                    color: #2563eb;
                }

                .frs-progress-step.completed {
                    color: #0f172a;
                }

                .frs-progress-circle {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #e2e8f0;
                    display: grid;
                    place-items: center;
                    font-weight: 700;
                    transition: all 0.3s ease;
                }

                .frs-progress-step.active .frs-progress-circle {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
                }

                .frs-progress-step.completed .frs-progress-circle {
                    background: #22c55e;
                    color: white;
                }

                .frs-content {
                    padding: 24px 32px 0;
                    overflow-y: auto;
                }

                .frs-step {
                    display: none;
                    animation: frsFade 0.3s ease;
                }

                .frs-step.active {
                    display: block;
                }

                .frs-form-group {
                    margin-bottom: 20px;
                }

                .frs-form-group label {
                    display: block;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 8px;
                }

                .frs-form-group input,
                .frs-form-group select,
                .frs-form-group textarea {
                    width: 100%;
                    padding: 14px 16px;
                    border-radius: 12px;
                    border: 1px solid #cbd5f5;
                    background: white;
                    font-size: 15px;
                    transition: all 0.2s ease;
                }

                .frs-form-group textarea {
                    min-height: 110px;
                    resize: vertical;
                }

                .frs-form-group input:focus,
                .frs-form-group select:focus,
                .frs-form-group textarea:focus {
                    border-color: #2563eb;
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
                }

                .frs-message {
                    margin-top: 12px;
                    padding: 12px 14px;
                    border-radius: 12px;
                    font-size: 14px;
                    display: none;
                }

                .frs-message.show {
                    display: block;
                }

                .frs-message.error {
                    background: rgba(239, 68, 68, 0.12);
                    color: #b91c1c;
                }

                .frs-message.success {
                    background: rgba(34, 197, 94, 0.12);
                    color: #166534;
                }

                .frs-import-card {
                    border: 1px dashed rgba(148, 163, 184, 0.6);
                    border-radius: 16px;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.9);
                    text-align: center;
                }

                .frs-import-status {
                    margin-top: 16px;
                    color: #475569;
                    font-size: 15px;
                    text-align: left;
                    max-height: 180px;
                    overflow-y: auto;
                }

                .frs-footer {
                    padding: 20px 32px 28px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    border-top: 1px solid rgba(148, 163, 184, 0.25);
                    background: rgba(248, 250, 252, 0.95);
                }

                .frs-secondary-button {
                    background: none;
                    border: none;
                    color: #64748b;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 10px 12px;
                    border-radius: 10px;
                    transition: background 0.2s ease;
                }

                .frs-secondary-button:hover {
                    background: rgba(148, 163, 184, 0.12);
                }

                .frs-primary-button {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    border: none;
                    padding: 12px 28px;
                    border-radius: 999px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    min-width: 160px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 14px 35px rgba(37, 99, 235, 0.28);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .frs-primary-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 18px 40px rgba(37, 99, 235, 0.35);
                }

                .frs-primary-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                @keyframes frsFade {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 640px) {
                    #first-run-setup-overlay {
                        padding: 12px;
                    }
                    #first-run-setup-modal {
                        border-radius: 20px;
                    }
                    .frs-footer {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .frs-primary-button {
                        width: 100%;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        getMenuDraftStorageKey() {
            const userId = this.user?.id || 'guest';
            return `first_run_menu_drafts_${userId}`;
        }

        storeMenuDraft(source, items, metadata = {}) {
            if (!items || !items.length) {
                return 0;
            }

            const key = this.getMenuDraftStorageKey();
            let existing = [];

            try {
                const stored = localStorage.getItem(key);
                existing = stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.warn('⚠️ Unable to read existing menu drafts:', error);
                existing = [];
            }

            const cappedItems = items.slice(0, 100);
            const preview = metadata.preview || cappedItems.slice(0, 3).map(item => item.name).join(', ');

            existing.push({
                source,
                importedAt: new Date().toISOString(),
                itemCount: items.length,
                sections: metadata.sectionCount || metadata.sections || 1,
                preview,
                metadata,
                items: cappedItems
            });

            localStorage.setItem(key, JSON.stringify(existing));
            this.state.import.draftsSaved = existing.length;
            return items.length;
        }

        async classifyFile(file) {
            const name = file.name.toLowerCase();
            const ext = name.includes('.') ? name.split('.').pop() : '';
            const result = {
                type: 'other',
                format: ext,
                confidence: 0,
                snippet: ''
            };

            const probableMenuName = /(menu|prix|specials|banquet|dining|prix-fixe|tasting)/i.test(name);
            const probableRecipeName = /(recipe|recipes|cookbook|prep|ingredient)/i.test(name);

            let snippet = '';
            try {
                snippet = await this.readFileSnippet(file, 20000);
            } catch (error) {
                console.warn('⚠️ Unable to read file snippet for classification:', file.name, error);
            }

            result.snippet = snippet;
            const lowerSnippet = snippet.toLowerCase();
            const recipeScore = this.scoreRecipeSignals(lowerSnippet);
            const priceSignals = this.countPriceSignals(snippet);

            const recipeExtensions = ['json', 'csv', 'txt'];
            const menuExtensions = ['menu', 'menutxt'];

            if (recipeExtensions.includes(ext)) {
                if (ext === 'txt') {
                    if (recipeScore >= 2 || probableRecipeName) {
                        result.type = 'recipe';
                        result.confidence = 0.7;
                        return result;
                    }
                    if (priceSignals >= 3 || probableMenuName) {
                        result.type = 'menu';
                        result.confidence = 0.6;
                        return result;
                    }
                } else {
                    result.type = 'recipe';
                    result.confidence = 0.85;
                    return result;
                }
            }

            if (menuExtensions.includes(ext) || probableMenuName) {
                result.type = 'menu';
                result.confidence = 0.7;
                return result;
            }

            if (recipeScore >= 3 && (['txt'].includes(ext) || recipeExtensions.includes(ext))) {
                result.type = 'recipe';
                result.confidence = 0.65;
                return result;
            }

            if (priceSignals >= 4) {
                result.type = 'menu';
                result.confidence = 0.65;
                return result;
            }

            return result;
        }

        async readFileSnippet(file, length = 12000) {
            const slice = file.slice(0, length);
            return await slice.text();
        }

        scoreRecipeSignals(text) {
            if (!text) return 0;
            const indicators = [
                /ingredients?:/i,
                /instructions?:/i,
                /method:/i,
                /yield:/i,
                /servings?:/i,
                /prep\s*time/i,
                /cook\s*time/i
            ];
            let score = 0;
            for (const regex of indicators) {
                if (regex.test(text)) {
                    score += 1;
                }
            }
            return score;
        }

        countPriceSignals(text) {
            if (!text) return 0;
            const currencyMatches = text.match(/(?:\$|€|£)\s?\d+(?:\.\d{2})?/g) || [];
            const dottedNumbers = text.match(/\b\d{1,3}\.\d{2}\b/g) || [];
            const spacedPrices = text.match(/\b\d{1,3}\s?(?:-\s?)?\d{1,3}\b/g) || [];

            const unique = new Set();
            [...currencyMatches, ...dottedNumbers, ...spacedPrices].forEach(match => {
                unique.add(match);
            });

            return unique.size;
        }

        async processMenuFile(file, classification) {
            try {
                const content = classification.snippet && classification.snippet.length === file.size
                    ? classification.snippet
                    : await file.text();

                const parsed = this.parseMenuText(content, file.name);

                if (!parsed.items.length) {
                    this.state.import.errors.push({
                        file: file.name,
                        message: 'No menu items detected in this document.'
                    });
                    return null;
                }

                this.storeMenuDraft(file.name, parsed.items, {
                    sectionCount: parsed.sectionCount,
                    preview: parsed.preview,
                    parser: 'text-heuristic'
                });
                return parsed;
            } catch (error) {
                console.error('❌ Failed to process menu file:', file.name, error);
                this.state.import.errors.push({
                    file: file.name,
                    message: error.message
                });
                return null;
            }
        }

        parseMenuText(content, fileName = '') {
            const lines = content.split(/\r?\n/);
            const priceRegex = /(\$|€|£)\s?\d+(?:\.\d{2})?|^\s*\d{1,3}\.\d{2}\s*$/;

            const items = [];
            const seenNames = new Set();
            let currentSection = 'General';
            let currentItem = null;

            const toTitleCase = (str) => str.replace(/\w\S*/g, txt =>
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );

            for (let rawLine of lines) {
                if (!rawLine) continue;
                let line = rawLine.trim();
                if (!line) continue;

                const isSection = line.length <= 48 &&
                    line === line.toUpperCase() &&
                    !priceRegex.test(line) &&
                    !/\d{1,3}\.\d{2}/.test(line);

                if (isSection) {
                    currentSection = toTitleCase(line.toLowerCase());
                    continue;
                }

                const priceMatch = line.match(/(\$|€|£)\s?\d+(?:\.\d{2})?/);
                const trailingPriceMatch = line.match(/\b\d{1,3}\.\d{2}\b(?!.*\b\d{1,3}\.\d{2}\b)/);

                if (priceMatch || trailingPriceMatch) {
                    const priceToken = priceMatch ? priceMatch[0] : trailingPriceMatch[0];
                    const priceValue = parseFloat(priceToken.replace(/[^\d.]/g, ''));

                    let namePart = line.replace(priceToken, '').trim();
                    namePart = namePart.replace(/[-–—]+$/, '').replace(/\.+$/, '').trim();
                    namePart = namePart.replace(/\s{2,}/g, ' ');

                    if (namePart.length < 2) {
                        continue;
                    }

                    const nameKey = namePart.toLowerCase();
                    if (seenNames.has(nameKey)) {
                        currentItem = items.find(item => item.name.toLowerCase() === nameKey);
                        if (currentItem && !currentItem.price && priceValue) {
                            currentItem.price = priceValue;
                        }
                        continue;
                    }

                    currentItem = {
                        id: `menu_import_${fileName}_${items.length}`,
                        name: toTitleCase(namePart),
                        price: priceValue || null,
                        description: '',
                        category: currentSection,
                        source: fileName
                    };

                    items.push(currentItem);
                    seenNames.add(nameKey);
                    continue;
                }

                if (currentItem) {
                    currentItem.description = currentItem.description
                        ? `${currentItem.description} ${line}`
                        : line;
                }
            }

            const filtered = items.filter(item => item.name && item.name.length > 1);
            const sectionCount = new Set(filtered.map(item => item.category)).size;
            const preview = filtered.slice(0, 3).map(item => item.name).join(', ');

            return {
                items: filtered,
                sectionCount,
                preview
            };
        }

        async extractWithBackend(file) {
            if (!this.extractorEndpoint) {
                throw new Error('Extractor endpoint not configured.');
            }

            const formData = new FormData();
            formData.append('file', file, file.name);

            const response = await fetch(this.extractorEndpoint, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const detail = await response.json().catch(() => ({}));
                const message = detail?.detail || response.statusText || 'Unknown error';
                throw new Error(message);
            }

            return await response.json();
        }

        renderModal() {
            this.modal = document.createElement('div');
            this.modal.id = 'first-run-setup-overlay';
            this.modal.innerHTML = `
                <div id="first-run-setup-modal">
                    <div class="frs-header">
                        <div class="frs-title">Welcome, ${this.user.name || 'Chef'}!</div>
                        <div class="frs-subtitle">Let’s personalize your workspace and bring your existing recipes into Iterum.</div>
                    </div>

                    <div class="frs-progress">
                        ${this.renderProgressStep(0, 'Profile Details')}
                        ${this.renderProgressStep(1, 'First Project')}
                        ${this.renderProgressStep(2, 'Import Recipes')}
                    </div>

                    <div class="frs-content">
                        ${this.renderStepOne()}
                        ${this.renderStepTwo()}
                        ${this.renderStepThree()}
                    </div>

                    <div class="frs-footer">
                        <button class="frs-secondary-button" id="frs-skip-btn">Skip for now</button>

                        <div style="display: flex; gap: 12px;">
                            <button class="frs-secondary-button" id="frs-back-btn" style="display: none;">Back</button>
                            <button class="frs-primary-button" id="frs-next-btn">Save & Continue</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(this.modal);

            this.bindEvents();
        }

        renderProgressStep(index, label) {
            return `
                <div class="frs-progress-step" data-progress-index="${index}">
                    <div class="frs-progress-circle">${index + 1}</div>
                    <div>${label}</div>
                </div>
            `;
        }

        renderStepOne() {
            return `
                <section class="frs-step" data-step="0">
                    <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 12px;">Tell us about your kitchen</h2>
                    <p style="color: #475569; margin-bottom: 28px;">We’ll tailor the workspace to match your role, team, and culinary focus.</p>

                    <div class="frs-form-group">
                        <label for="frs-role">Primary role</label>
                        <select id="frs-role" required>
                            <option value="">Select your role</option>
                            <option value="executive_chef">Executive Chef / Culinary Director</option>
                            <option value="rnd_chef">R&D / Innovation Chef</option>
                            <option value="pastry_chef">Pastry / Baking Lead</option>
                            <option value="consultant">Consultant / Agency</option>
                            <option value="educator">Educator / Culinary School</option>
                            <option value="operator">Restaurant / Hospitality Operator</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div class="frs-form-group">
                        <label for="frs-organization">Organization or kitchen name</label>
                        <input id="frs-organization" type="text" placeholder="Iterum Test Kitchen" />
                    </div>

                    <div class="frs-form-group">
                        <label for="frs-team-size">Team size (optional)</label>
                        <input id="frs-team-size" type="number" min="1" placeholder="5" />
                    </div>

                    <div class="frs-form-group">
                        <label for="frs-focus">Key focus areas</label>
                        <textarea id="frs-focus" placeholder="Nordic tasting menus, fermentation lab, seasonal R&D..."></textarea>
                    </div>

                    <div class="frs-message error" id="frs-step1-error"></div>
                </section>
            `;
        }

        renderStepTwo() {
            const suggestedName = this.user && this.user.name
                ? `${this.user.name.split(' ')[0]}'s R&D Lab`
                : 'Signature R&D Project';

            return `
                <section class="frs-step" data-step="1">
                    <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 12px;">Create your first project</h2>
                    <p style="color: #475569; margin-bottom: 28px;">Projects keep recipes, menus, testing notes, and vendor data organized for each client or initiative.</p>

                    <div class="frs-form-group">
                        <label for="frs-project-name">Project name</label>
                        <input id="frs-project-name" type="text" value="${suggestedName}" />
                    </div>

                    <div class="frs-form-group">
                        <label for="frs-project-type">Project type</label>
                        <select id="frs-project-type">
                            <option value="culinary">Culinary Development</option>
                            <option value="menu_launch">Menu Launch</option>
                            <option value="client_pitch">Client Pitch</option>
                            <option value="seasonal_refresh">Seasonal Refresh</option>
                            <option value="innovation_lab">Innovation Lab</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div class="frs-form-group">
                        <label for="frs-project-description">Project goals</label>
                        <textarea id="frs-project-description" placeholder="Capture the vision, target audience, or deliverables for this project..."></textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-top: 20px;">
                        ${this.renderProjectQuickPick('Client collaboration', '🤝')}
                        ${this.renderProjectQuickPick('Seasonal tasting menu', '🍽️')}
                        ${this.renderProjectQuickPick('Catering expansion', '🎉')}
                        ${this.renderProjectQuickPick('Product development', '🧪')}
                    </div>

                    <div class="frs-message success" id="frs-step2-success"></div>
                    <div class="frs-message error" id="frs-step2-error"></div>
                </section>
            `;
        }

        renderProjectQuickPick(label, icon) {
            return `
                <button type="button" class="frs-secondary-button" data-quick-pick="${label}" style="justify-content: center; padding: 16px; border-radius: 14px; border: 1px solid rgba(148, 163, 184, 0.4); background: white; color: #1e293b; font-weight: 600;">
                    <span style="font-size: 20px;">${icon}</span> <span>${label}</span>
                </button>
            `;
        }

        renderStepThree() {
            return `
                <section class="frs-step" data-step="2">
                    <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 12px;">Import your existing recipes & menus</h2>
                    <p style="color: #475569; margin-bottom: 24px;">We’ll scan folders you choose for supported files (JSON, CSV, TXT, PDF, Excel) and add them to your workspace automatically.</p>

                    <div class="frs-import-card">
                        <div style="font-size: 48px;">📁</div>
                        <p style="margin: 12px 0; color: #334155;">Select a folder that contains your recipes or export files.</p>
                        <button class="frs-primary-button" type="button" id="frs-import-trigger">
                            ${this.directorySupport ? 'Choose a folder to scan' : 'Select recipe files'}
                        </button>
                        <input type="file" id="frs-import-input" style="display: none;" ${this.directorySupport ? 'webkitdirectory multiple' : 'multiple'} accept=".json,.csv,.txt,.pdf,.xls,.xlsx" />
                        <div class="frs-import-status" id="frs-import-status">
                            <strong>No files imported yet.</strong>
                            <p style="margin-top: 6px;">You can skip this for now and import anytime from the recipe library.</p>
                        </div>
                    </div>

                    <div class="frs-message error" id="frs-step3-error"></div>
                </section>
            `;
        }

        bindEvents() {
            const skipBtn = this.modal.querySelector('#frs-skip-btn');
            const backBtn = this.modal.querySelector('#frs-back-btn');
            const nextBtn = this.modal.querySelector('#frs-next-btn');
            const quickPickButtons = this.modal.querySelectorAll('[data-quick-pick]');
            const importTrigger = this.modal.querySelector('#frs-import-trigger');
            const importInput = this.modal.querySelector('#frs-import-input');

            skipBtn.addEventListener('click', () => this.skipSetup());
            backBtn.addEventListener('click', () => this.prevStep());
            nextBtn.addEventListener('click', () => this.handleNext());

            quickPickButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    const label = button.getAttribute('data-quick-pick');
                    const descriptionField = this.modal.querySelector('#frs-project-description');

                    if (descriptionField) {
                        if (!descriptionField.value.includes(label)) {
                            descriptionField.value = descriptionField.value
                                ? `${descriptionField.value}\n• ${label}`
                                : `• ${label}`;
                        }
                    }
                });
            });

            if (importTrigger) {
                importTrigger.addEventListener('click', () => this.startImportScan());
            }

            if (importInput) {
                importInput.addEventListener('change', (event) => {
                    const files = Array.from(event.target.files || []);
                    if (files.length) {
                        this.processFileSelection(files);
                    }
                });
            }
        }

        updateStep() {
            const steps = this.modal.querySelectorAll('.frs-step');
            steps.forEach((step, index) => {
                step.classList.toggle('active', index === this.currentStep);
            });

            const progressSteps = this.modal.querySelectorAll('.frs-progress-step');
            progressSteps.forEach((step, index) => {
                step.classList.toggle('active', index === this.currentStep);
                step.classList.toggle('completed', index < this.currentStep);
            });

            const backBtn = this.modal.querySelector('#frs-back-btn');
            const nextBtn = this.modal.querySelector('#frs-next-btn');

            if (this.currentStep === 0) {
                backBtn.style.display = 'none';
            } else {
                backBtn.style.display = 'inline-flex';
            }

            if (this.currentStep === this.totalSteps - 1) {
                nextBtn.textContent = 'Finish setup';
            } else if (this.currentStep === 1) {
                nextBtn.textContent = 'Create project';
            } else {
                nextBtn.textContent = 'Save & Continue';
            }
        }

        async handleNext() {
            switch (this.currentStep) {
                case 0: {
                    const valid = await this.saveProfileDetails();
                    if (valid) {
                        this.currentStep += 1;
                        this.updateStep();
                    }
                    break;
                }
                case 1: {
                    const created = await this.createInitialProject();
                    if (created) {
                        this.currentStep += 1;
                        this.updateStep();
                    }
                    break;
                }
                case 2: {
                    this.completeSetup();
                    break;
                }
                default:
                    break;
            }
        }

        prevStep() {
            if (this.currentStep > 0) {
                this.currentStep -= 1;
                this.updateStep();
            }
        }

        async saveProfileDetails() {
            const role = this.modal.querySelector('#frs-role').value;
            const organization = this.modal.querySelector('#frs-organization').value.trim();
            const teamSizeRaw = this.modal.querySelector('#frs-team-size').value;
            const focus = this.modal.querySelector('#frs-focus').value.trim();
            const errorEl = this.modal.querySelector('#frs-step1-error');

            if (!role) {
                this.showMessage(errorEl, 'Please select your primary role to continue.', 'error');
                return false;
            }

            const updates = {
                role,
                organization: organization || null,
                teamSize: teamSizeRaw ? Number(teamSizeRaw) : null,
                focusAreas: focus || null,
                onboarding: {
                    source: 'first_run_setup',
                    completedAt: new Date().toISOString()
                }
            };

            if (window.authManager?.updateCurrentUserProfile) {
                await window.authManager.updateCurrentUserProfile(updates);
            } else {
                const user = this.user || {};
                const updated = {
                    ...user,
                    profile: {
                        ...(user.profile || {}),
                        ...updates,
                        lastUpdated: new Date().toISOString()
                    }
                };
                localStorage.setItem('current_user', JSON.stringify(updated));
                this.user = updated;
            }

            this.state.profile = updates;
            this.showMessage(errorEl, '', 'error');
            return true;
        }

        async createInitialProject() {
            if (!window.projectManager || typeof window.projectManager.createProject !== 'function') {
                this.showMessage(
                    this.modal.querySelector('#frs-step2-error'),
                    'Project manager is not ready yet. Please try again in a moment.',
                    'error'
                );
                return false;
            }

            const nameInput = this.modal.querySelector('#frs-project-name');
            const typeInput = this.modal.querySelector('#frs-project-type');
            const descriptionInput = this.modal.querySelector('#frs-project-description');
            const errorEl = this.modal.querySelector('#frs-step2-error');
            const successEl = this.modal.querySelector('#frs-step2-success');

            const name = nameInput.value.trim();
            if (!name) {
                this.showMessage(errorEl, 'Please enter a project name.', 'error');
                return false;
            }

            const projectData = {
                name,
                type: typeInput.value,
                description: descriptionInput.value.trim(),
                icon: '🧪',
                color: '#2563eb',
                status: 'active',
                tags: ['first-run']
            };

            try {
                const project = window.projectManager.createProject(projectData);
                if (project) {
                    window.projectManager.setCurrentProject(project.id);
                    this.state.project = project;

                    this.showMessage(successEl, `Project "${project.name}" created and set as active.`, 'success');
                    this.showMessage(errorEl, '', 'error');

                    return true;
                }

                this.showMessage(errorEl, 'We could not create the project. Please try again.', 'error');
                return false;
            } catch (error) {
                console.error('❌ Failed to create initial project:', error);
                this.showMessage(
                    errorEl,
                    'Something went wrong while creating the project. Please try again.',
                    'error'
                );
                return false;
            }
        }

        async startImportScan() {
            if (this.state.import.inProgress) {
                return;
            }

            if (this.directorySupport) {
                try {
                    const directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
                    this.state.import.inProgress = true;
                    const files = [];
                    await this.walkDirectoryHandle(directoryHandle, files);
                    await this.processFileSelection(files);
                } catch (error) {
                    if (error?.name !== 'AbortError') {
                        console.error('❌ Directory scan failed:', error);
                        this.showImportStatus(`Unable to access folder: ${error.message}`, true);
                    }
                } finally {
                    this.state.import.inProgress = false;
                }
            } else {
                const input = this.modal.querySelector('#frs-import-input');
                input?.click();
            }
        }

        async walkDirectoryHandle(directoryHandle, files, depth = 0) {
            if (depth > 8) {
                return;
            }

            for await (const entry of directoryHandle.values()) {
                if (entry.kind === 'file') {
                    try {
                        const file = await entry.getFile();
                        files.push(file);
                    } catch (error) {
                        console.warn('⚠️ Unable to read file:', error);
                    }
                } else if (entry.kind === 'directory') {
                    await this.walkDirectoryHandle(entry, files, depth + 1);
                }
            }
        }

        async processFileSelection(files) {
            if (!files.length) {
                this.showImportStatus('No files found in the selected location.', true);
                return;
            }

            this.state.import.scanned += files.length;
            let recipesImported = 0;
            let menuItemsCaptured = 0;
            let processedSupported = 0;

            for (const file of files) {
                const extension = (file.name?.split('.').pop() || '').toLowerCase();

                if (['pdf', 'xls', 'xlsx'].includes(extension)) {
                    this.state.import.supported += 1;

                    try {
                        const data = await this.extractWithBackend(file);
                        const recipes = Array.isArray(data?.recipes) ? data.recipes : [];
                        const menuItems = Array.isArray(data?.menu_items ?? data?.menuItems)
                            ? (data?.menu_items ?? data?.menuItems)
                            : [];
                        const warnings = Array.isArray(data?.warnings) ? data.warnings : [];

                        warnings.forEach(message => {
                            this.state.import.warnings.push(`${file.name}: ${message}`);
                        });

                        if (recipes.length && this.universalRecipeManager) {
                            recipes.forEach(recipe => {
                                this.universalRecipeManager.addToLibrary(recipe, 'backend_extract');
                            });
                            recipesImported += recipes.length;
                            this.state.import.imported += recipes.length;
                        }

                        if (menuItems.length) {
                            const saved = this.storeMenuDraft(file.name, menuItems, {
                                ...(data?.metadata || {}),
                                parser: 'backend-extractor'
                            });
                            if (saved > 0) {
                                menuItemsCaptured += saved;
                                this.state.import.menuItems += saved;
                                this.state.import.menuFiles += 1;
                            }
                        }

                        if (!recipes.length && !menuItems.length) {
                            this.state.import.warnings.push(`${file.name}: No recipes or menu items detected.`);
                        }
                    } catch (error) {
                        this.state.import.errors.push({
                            file: file.name,
                            message: error.message || 'Extraction failed'
                        });
                    }

                    processedSupported += 1;
                    if (processedSupported % 3 === 0 || processedSupported === this.state.import.supported) {
                        this.showImportStatus(
                            `Processed ${processedSupported}/${this.state.import.supported} files • Recipes: ${recipesImported} • Menu items detected: ${menuItemsCaptured}`
                        );
                        await this.sleep(10);
                    }
                    continue;
                }

                if (!['json', 'csv', 'txt'].includes(extension)) {
                    continue;
                }

                if (extension === 'txt') {
                    const classification = await this.classifyFile(file);
                    if (classification.type === 'menu') {
                        const parsed = await this.processMenuFile(file, classification);
                        if (parsed?.items?.length) {
                            const saved = this.storeMenuDraft(file.name, parsed.items, {
                                sectionCount: parsed.sectionCount,
                                preview: parsed.preview,
                                parser: 'text-heuristic'
                            });
                            if (saved > 0) {
                                menuItemsCaptured += saved;
                                this.state.import.menuItems += saved;
                                this.state.import.menuFiles += 1;
                            }
                        }

                        processedSupported += 1;
                        this.state.import.supported += 1;

                        if (processedSupported % 3 === 0 || processedSupported === this.state.import.supported) {
                            this.showImportStatus(
                                `Processed ${processedSupported}/${this.state.import.supported} files • Recipes: ${recipesImported} • Menu items detected: ${menuItemsCaptured}`
                            );
                            await this.sleep(10);
                        }

                        continue;
                    }
                }

                this.state.import.supported += 1;

                if (!this.recipeImporter) {
                    this.state.import.errors.push({
                        file: file.name,
                        message: 'Recipe importer not available.'
                    });
                    continue;
                }

                try {
                    const result = await this.recipeImporter.importRecipes(file);
                    if (result.success && result.recipes?.length) {
                        recipesImported += result.recipes.length;
                        this.state.import.imported += result.recipes.length;

                        result.recipes.forEach(recipe => {
                            if (this.universalRecipeManager) {
                                this.universalRecipeManager.addToLibrary(recipe, 'bulk_import_setup');
                            }
                        });
                    }
                } catch (error) {
                    console.error('❌ Import failed for file:', file.name, error);
                    this.state.import.errors.push({
                        file: file.name,
                        message: error.message
                    });
                }

                processedSupported += 1;
                if (processedSupported % 3 === 0 || processedSupported === this.state.import.supported) {
                    this.showImportStatus(
                        `Processed ${processedSupported}/${this.state.import.supported} files • Recipes: ${recipesImported} • Menu items detected: ${menuItemsCaptured}`
                    );
                    await this.sleep(10);
                }
            }

            this.state.import.completed = (this.state.import.imported + this.state.import.menuItems) > 0;

            if (recipesImported > 0) {
                window.showSuccess?.(`Imported ${recipesImported} recipes into your library.`);
            }

            if (menuItemsCaptured > 0) {
                window.showInfo?.(
                    `Captured ${menuItemsCaptured} menu items. Review drafts later in the Menu Builder (saved as "First Run Imports").`
                );
            }

            if (recipesImported === 0 && menuItemsCaptured === 0) {
                this.showImportStatus(
                    `Scanned ${files.length} files but did not find recognizable recipes or menus. Try selecting exports in JSON/CSV/TXT/PDF/Excel format.`,
                    true
                );
            } else {
                this.showImportStatus(
                    `✅ Imported ${recipesImported} recipes and captured ${menuItemsCaptured} menu items from ${this.state.import.supported} files.`,
                    false
                );
            }
        }

        showImportStatus(message, isError = false) {
            const statusEl = this.modal.querySelector('#frs-import-status');
            if (!statusEl) {
                return;
            }

            statusEl.innerHTML = `
                <strong>${isError ? 'Heads up' : 'Status'}:</strong>
                <p style="margin-top: 6px;">${message}</p>
                <p style="margin-top: 12px; font-size: 13px; color: #94a3b8;">
                    Files scanned: ${this.state.import.scanned} • Recipe files: ${this.state.import.supported} • Menu files: ${this.state.import.menuFiles}
                </p>
                <p style="margin-top: 4px; font-size: 13px; color: #94a3b8;">
                    Recipes imported: ${this.state.import.imported} • Menu items captured: ${this.state.import.menuItems} • Drafts saved: ${this.state.import.draftsSaved}
                </p>
            `;

            if (!isError && this.state.import.draftsSaved > 0) {
                statusEl.innerHTML += `
                    <p style="margin-top: 6px; font-size: 12px; color: #64748b;">
                        Menu drafts are stored for later review. Visit the Menu Builder to apply them to active menus.
                    </p>
                `;
            }

            if (this.state.import.errors.length) {
                const list = document.createElement('ul');
                list.style.marginTop = '10px';
                list.style.paddingLeft = '18px';
                list.style.color = '#ef4444';

                this.state.import.errors.slice(-5).forEach(err => {
                    const li = document.createElement('li');
                    li.textContent = `${err.file}: ${err.message}`;
                    list.appendChild(li);
                });

                statusEl.appendChild(list);
            }

            if (this.state.import.warnings.length) {
                const warnList = document.createElement('ul');
                warnList.style.marginTop = '8px';
                warnList.style.paddingLeft = '18px';
                warnList.style.color = '#f97316';
                this.state.import.warnings.slice(-5).forEach(message => {
                    const li = document.createElement('li');
                    li.textContent = message;
                    warnList.appendChild(li);
                });
                statusEl.appendChild(warnList);
            }
        }

        completeSetup() {
            localStorage.setItem(this.userKey, 'complete');

            if (!this.state.import.completed) {
                localStorage.setItem(`first_run_import_pending_${this.user.id}`, 'true');
            }

            window.showSuccess?.('Setup complete! Your workspace is ready.');
            this.closeModal();
        }

        skipSetup() {
            localStorage.setItem(this.userKey, 'skipped');
            window.showInfo?.('You can restart setup later from the Help menu.');
            this.closeModal();
        }

        closeModal() {
            this.modal?.remove();
            this.modal = null;
        }

        showMessage(element, message, type) {
            if (!element) return;

            if (!message) {
                element.classList.remove('show', 'error', 'success');
                element.textContent = '';
                return;
            }

            element.textContent = message;
            element.classList.add('show', type);
        }

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        if (!window.firstRunSetup) {
            window.firstRunSetup = new FirstRunSetup();
        }
    });
})();


