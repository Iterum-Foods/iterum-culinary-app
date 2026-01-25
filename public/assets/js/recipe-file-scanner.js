/**
 * Recipe File Scanner
 * Scans local computer and Google Drive for recipe files
 */

class RecipeFileScanner {
    constructor() {
        this.supportedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf', '.jpg', '.jpeg', '.png'];
        this.recipeKeywords = ['recipe', 'ingredient', 'cooking', 'kitchen', 'culinary', 'prep', 'instructions', 'serves', 'yield'];
        this.foundFiles = [];
        this.googleDriveEnabled = false;
        
        console.log('🔍 Recipe File Scanner initialized');
    }
    
    /**
     * Scan local computer for recipe files
     */
    async scanLocalFiles() {
        if (!('showDirectoryPicker' in window)) {
            showWarning('File System Access API not supported in this browser. Try Chrome or Edge.');
            return [];
        }
        
        try {
            showInfo('Select a folder to scan for recipes...');
            
            // Request directory access
            const dirHandle = await window.showDirectoryPicker({
                mode: 'read',
                startIn: 'documents'
            });
            
            const loaderId = showLoading('Scanning folder for recipe files...');
            
            const files = [];
            await this.scanDirectory(dirHandle, files);
            
            hideLoading(loaderId);
            
            // Filter for potential recipe files
            const recipeFiles = files.filter(file => this.isPotentialRecipeFile(file));
            
            this.foundFiles = recipeFiles;
            
            showSuccess(`Found ${recipeFiles.length} potential recipe files!`);
            return recipeFiles;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                showInfo('Folder selection cancelled');
            } else {
                console.error('Error scanning files:', error);
                showError('Failed to scan folder: ' + error.message);
            }
            return [];
        }
    }
    
    /**
     * Recursively scan directory
     */
    async scanDirectory(dirHandle, files, path = '') {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                files.push({
                    name: file.name,
                    path: path + '/' + file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    file: file,
                    source: 'local'
                });
            } else if (entry.kind === 'directory') {
                // Recursively scan subdirectories (limit depth to 3 levels)
                if (path.split('/').length < 3) {
                    await this.scanDirectory(entry, files, path + '/' + entry.name);
                }
            }
        }
    }
    
    /**
     * Check if file is potentially a recipe
     */
    isPotentialRecipeFile(file) {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        // Check extension
        if (!this.supportedExtensions.includes(ext)) {
            return false;
        }
        
        // Check filename for recipe keywords
        const nameLower = file.name.toLowerCase();
        return this.recipeKeywords.some(keyword => nameLower.includes(keyword));
    }
    
    /**
     * Connect to Google Drive
     */
    async connectGoogleDrive() {
        showInfo('Opening Google Drive authentication...');
        
        // Google Drive API configuration
        const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // User would need to set this up
        const API_KEY = 'YOUR_GOOGLE_API_KEY';
        const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
        
        try {
            // Load Google API
            if (!window.gapi) {
                await this.loadGoogleAPI();
            }
            
            await this.initializeGoogleAPI(CLIENT_ID, API_KEY, DISCOVERY_DOCS, SCOPES);
            
            // Sign in
            await window.gapi.auth2.getAuthInstance().signIn();
            
            this.googleDriveEnabled = true;
            showSuccess('Connected to Google Drive!');
            return true;
            
        } catch (error) {
            console.error('Google Drive connection error:', error);
            showError('Failed to connect to Google Drive. Please check your credentials.');
            return false;
        }
    }
    
    /**
     * Load Google API
     */
    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('client:auth2', resolve);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Initialize Google API
     */
    async initializeGoogleAPI(clientId, apiKey, discoveryDocs, scopes) {
        await window.gapi.client.init({
            apiKey: apiKey,
            clientId: clientId,
            discoveryDocs: discoveryDocs,
            scope: scopes
        });
    }
    
    /**
     * Search Google Drive for recipe files
     */
    async searchGoogleDrive() {
        if (!this.googleDriveEnabled) {
            const connected = await this.connectGoogleDrive();
            if (!connected) return [];
        }
        
        const loaderId = showLoading('Searching Google Drive for recipes...');
        
        try {
            const files = [];
            
            // Search for each supported file type with recipe keywords
            for (const keyword of this.recipeKeywords.slice(0, 3)) { // Limit to 3 keywords
                const query = `name contains '${keyword}' and (${this.supportedExtensions.map(ext => `name contains '${ext}'`).join(' or ')})`;
                
                const response = await window.gapi.client.drive.files.list({
                    q: query,
                    pageSize: 50,
                    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)'
                });
                
                files.push(...response.result.files.map(file => ({
                    name: file.name,
                    path: 'Google Drive',
                    size: file.size || 0,
                    type: file.mimeType,
                    lastModified: new Date(file.modifiedTime).getTime(),
                    driveId: file.id,
                    webViewLink: file.webViewLink,
                    source: 'google-drive'
                })));
            }
            
            hideLoading(loaderId);
            
            // Remove duplicates
            const uniqueFiles = Array.from(new Map(files.map(f => [f.name, f])).values());
            
            this.foundFiles = [...this.foundFiles, ...uniqueFiles];
            
            showSuccess(`Found ${uniqueFiles.length} recipe files in Google Drive!`);
            return uniqueFiles;
            
        } catch (error) {
            hideLoading(loaderId);
            console.error('Google Drive search error:', error);
            showError('Failed to search Google Drive: ' + error.message);
            return [];
        }
    }
    
    /**
     * Parse recipe file content
     */
    async parseRecipeFile(file) {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        try {
            if (ext === '.txt' || ext === '.md') {
                return await this.parseTextFile(file);
            } else if (ext === '.pdf') {
                return await this.parsePDFFile(file);
            } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                return await this.parseImageFile(file);
            } else {
                showWarning(`${ext} files require manual import`);
                return null;
            }
        } catch (error) {
            console.error('Parse error:', error);
            showError(`Failed to parse ${file.name}`);
            return null;
        }
    }
    
    /**
     * Parse text file
     */
    async parseTextFile(fileInfo) {
        const text = await fileInfo.file.text();
        return this.extractRecipeFromText(text, fileInfo.name);
    }
    
    /**
     * Parse PDF file (requires PDF.js library)
     */
    async parsePDFFile(fileInfo) {
        showWarning('PDF parsing requires PDF.js library. Opening file for manual review...');
        
        // For now, return basic info and let user manually import
        return {
            name: fileInfo.name.replace('.pdf', ''),
            description: 'Imported from PDF - Please add details manually',
            source: 'PDF Import',
            needsManualReview: true
        };
    }
    
    /**
     * Parse image file (requires OCR)
     */
    async parseImageFile(fileInfo) {
        showWarning('Image recipe extraction requires OCR. Please use manual import.');
        
        // Could integrate Tesseract.js for OCR here
        return {
            name: fileInfo.name.replace(/\.(jpg|jpeg|png)$/i, ''),
            description: 'Imported from image - Please add details manually',
            source: 'Image Import',
            needsManualReview: true,
            imageUrl: URL.createObjectURL(fileInfo.file)
        };
    }
    
    /**
     * Extract recipe data from text
     */
    extractRecipeFromText(text, filename) {
        const lines = text.split('\n');
        
        // Try to find title (usually first non-empty line or contains "recipe" keyword)
        let name = filename.replace(/\.(txt|md)$/i, '');
        for (const line of lines.slice(0, 5)) {
            if (line.trim().length > 5 && line.trim().length < 100) {
                name = line.trim();
                break;
            }
        }
        
        // Extract ingredients section
        const ingredients = [];
        let inIngredientsSection = false;
        
        for (const line of lines) {
            const lineLower = line.toLowerCase();
            
            if (lineLower.includes('ingredient')) {
                inIngredientsSection = true;
                continue;
            }
            
            if (inIngredientsSection) {
                if (lineLower.includes('instruction') || lineLower.includes('direction') || lineLower.includes('step')) {
                    break;
                }
                
                if (line.trim() && line.trim().length > 2) {
                    ingredients.push({ name: line.trim(), quantity: '', unit: '' });
                }
            }
        }
        
        // Extract instructions section
        const instructions = [];
        let inInstructionsSection = false;
        let stepNumber = 1;
        
        for (const line of lines) {
            const lineLower = line.toLowerCase();
            
            if (lineLower.includes('instruction') || lineLower.includes('direction') || lineLower.includes('step')) {
                inInstructionsSection = true;
                continue;
            }
            
            if (inInstructionsSection && line.trim() && line.trim().length > 10) {
                instructions.push({ 
                    step: stepNumber++, 
                    text: line.trim().replace(/^\d+\.\s*/, '') 
                });
            }
        }
        
        return {
            name: name,
            description: 'Imported from ' + filename,
            ingredients: ingredients,
            instructions: instructions,
            source: 'File Import',
            importedFrom: filename,
            importedAt: new Date().toISOString()
        };
    }
    
    /**
     * Create UI for browsing found files
     */
    createBrowserUI(files) {
        if (!files || files.length === 0) {
            return `
                <div class="empty-state" style="padding: 60px 40px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.6;">🔍</div>
                    <h3 style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">
                        No Recipe Files Found
                    </h3>
                    <p style="color: #64748b; margin-bottom: 24px;">
                        Try scanning a different folder or connect to Google Drive
                    </p>
                </div>
            `;
        }
        
        const filesBySource = {
            local: files.filter(f => f.source === 'local'),
            'google-drive': files.filter(f => f.source === 'google-drive')
        };
        
        let html = '<div class="recipe-files-browser" style="max-height: 600px; overflow-y: auto;">';
        
        for (const [source, sourceFiles] of Object.entries(filesBySource)) {
            if (sourceFiles.length === 0) continue;
            
            const sourceLabel = source === 'local' ? '💻 Local Files' : '☁️ Google Drive';
            
            html += `
                <div class="file-source-section" style="margin-bottom: 32px;">
                    <h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        ${sourceLabel}
                        <span style="background: rgba(102, 126, 234, 0.15); color: #667eea; padding: 4px 12px; border-radius: 12px; font-size: 13px;">
                            ${sourceFiles.length} files
                        </span>
                    </h3>
                    
                    <div style="display: grid; gap: 12px;">
                        ${sourceFiles.map((file, index) => this.createFileCard(file, index)).join('')}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        return html;
    }
    
    /**
     * Create file card HTML
     */
    createFileCard(file, index) {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toUpperCase();
        const sizeKB = Math.round(file.size / 1024);
        const date = new Date(file.lastModified).toLocaleDateString();
        
        return `
            <div class="recipe-file-card" style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
                <div style="flex: 1; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 12px;">
                        ${ext.replace('.', '')}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px;">${file.name}</div>
                        <div style="font-size: 13px; color: #64748b;">
                            ${file.path} • ${sizeKB} KB • ${date}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="window.recipeFileScanner.importFile(${index})" class="btn btn-primary" style="padding: 8px 16px;">
                        📥 Import
                    </button>
                    ${file.webViewLink ? `
                        <a href="${file.webViewLink}" target="_blank" class="btn btn-secondary" style="padding: 8px 16px; text-decoration: none;">
                            👁️ View
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Import file
     */
    async importFile(index) {
        const file = this.foundFiles[index];
        if (!file) {
            showError('File not found');
            return;
        }
        
        const loaderId = showLoading(`Importing ${file.name}...`);
        
        try {
            const recipeData = await this.parseRecipeFile(file);
            
            if (recipeData) {
                // Add to universal recipe manager
                if (window.universalRecipeManager) {
                    const recipe = {
                        id: 'recipe_' + Date.now(),
                        ...recipeData,
                        dateAdded: new Date().toISOString(),
                        userId: window.authManager?.currentUser?.id,
                        userEmail: window.authManager?.currentUser?.email
                    };
                    
                    window.universalRecipeManager.addRecipe(recipe);
                    
                    hideLoading(loaderId);
                    showSuccess(`Recipe "${recipeData.name}" imported successfully!`);
                    
                    // Ask if user wants to edit it
                    setTimeout(() => {
                        if (confirm('Recipe imported! Would you like to edit it now?')) {
                            window.location.href = `recipe-developer.html?edit=${recipe.id}`;
                        }
                    }, 500);
                } else {
                    hideLoading(loaderId);
                    showError('Recipe manager not available');
                }
            } else {
                hideLoading(loaderId);
            }
            
        } catch (error) {
            hideLoading(loaderId);
            console.error('Import error:', error);
            showError('Failed to import recipe');
        }
    }
}

// Initialize global scanner
window.recipeFileScanner = new RecipeFileScanner();

console.log('✅ Recipe File Scanner available globally');

