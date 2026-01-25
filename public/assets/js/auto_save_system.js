/**
 * Auto-Save System for Iterum R&D Chef Notebook
 * Automatically saves form data when navigating between screens
 * Version: 1.0
 */

class AutoSaveManager {
    constructor(options = {}) {
        this.options = {
            saveInterval: options.saveInterval || 30000, // 30 seconds
            debounceDelay: options.debounceDelay || 2000, // 2 seconds
            storagePrefix: options.storagePrefix || 'iterum_autosave_',
            apiEndpoint: options.apiEndpoint || '/api/autosave',
            showNotifications: options.showNotifications !== false,
            excludeFields: options.excludeFields || ['password', 'confirm-password'],
            ...options
        };
        
        this.saveQueue = new Map();
        this.lastSaveTime = new Map();
        this.saveTimeouts = new Map();
        this.isOnline = navigator.onLine;
        this.currentPageId = this.generatePageId();
        
        this.init();
    }
    
    init() {
        console.log('🔄 Initializing Auto-Save System...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start periodic save
        this.startPeriodicSave();
        
        // Load any existing auto-saved data
        this.loadAutoSavedData();
        
        // Show initialization notification
        if (this.options.showNotifications) {
            this.showNotification('Auto-save enabled', 'success');
        }
        
        console.log('✅ Auto-Save System initialized');
    }
    
    generatePageId() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop().replace('.html', '') || 'index';
        return pageName;
    }
    
    setupEventListeners() {
        // Save before page unload
        window.addEventListener('beforeunload', (e) => {
            this.saveAllData(true); // Force immediate save
        });
        
        // Save when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveAllData(true);
            }
        });
        
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
            console.log('🌐 Connection restored - syncing offline data');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📡 Connection lost - saving locally');
        });
        
        // Monitor form inputs
        this.setupFormMonitoring();
        
        // Save when clicking navigation links
        this.setupNavigationSaving();
    }
    
    setupFormMonitoring() {
        // Monitor all form inputs, textareas, and select elements
        const selector = 'input:not([type="password"]), textarea, select';
        
        document.addEventListener('input', (e) => {
            if (e.target.matches(selector)) {
                this.scheduleFieldSave(e.target);
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.matches(selector)) {
                this.scheduleFieldSave(e.target);
            }
        });
        
        // Monitor contenteditable elements
        document.addEventListener('input', (e) => {
            if (e.target.contentEditable === 'true') {
                this.scheduleFieldSave(e.target);
            }
        });
    }
    
    setupNavigationSaving() {
        // Save when clicking navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.href.startsWith('#')) {
                this.saveAllData(true);
            }
        });
        
        // Save when using browser navigation
        window.addEventListener('popstate', () => {
            this.saveAllData(true);
        });
    }
    
    scheduleFieldSave(element) {
        if (!element.id && !element.name) return; // Skip elements without identifiers
        
        const fieldId = element.id || element.name;
        const pageFieldId = `${this.currentPageId}_${fieldId}`;
        
        // Clear existing timeout
        if (this.saveTimeouts.has(pageFieldId)) {
            clearTimeout(this.saveTimeouts.get(pageFieldId));
        }
        
        // Schedule new save
        const timeout = setTimeout(() => {
            this.saveField(element);
            this.saveTimeouts.delete(pageFieldId);
        }, this.options.debounceDelay);
        
        this.saveTimeouts.set(pageFieldId, timeout);
    }
    
    saveField(element) {
        if (!element || this.shouldExcludeField(element)) return;
        
        const fieldId = element.id || element.name;
        if (!fieldId) return;
        
        const pageFieldId = `${this.currentPageId}_${fieldId}`;
        const value = this.getFieldValue(element);
        
        // Save to localStorage
        const storageKey = this.options.storagePrefix + pageFieldId;
        const saveData = {
            value: value,
            timestamp: Date.now(),
            fieldType: element.type || element.tagName.toLowerCase(),
            pageId: this.currentPageId
        };
        
        try {
            localStorage.setItem(storageKey, JSON.stringify(saveData));
            this.lastSaveTime.set(pageFieldId, Date.now());
            
            // Add to queue for server sync
            this.saveQueue.set(pageFieldId, saveData);
            
            console.log(`💾 Auto-saved: ${fieldId}`);
            this.showSaveIndicator(element);
            
        } catch (error) {
            console.error('Failed to save field:', fieldId, error);
        }
    }
    
    getFieldValue(element) {
        if (element.type === 'checkbox') {
            return element.checked;
        } else if (element.type === 'radio') {
            return element.checked ? element.value : null;
        } else if (element.tagName.toLowerCase() === 'select') {
            return element.value;
        } else if (element.contentEditable === 'true') {
            return element.innerHTML;
        } else {
            return element.value;
        }
    }
    
    shouldExcludeField(element) {
        const fieldName = (element.name || element.id || '').toLowerCase();
        return this.options.excludeFields.some(excluded => 
            fieldName.includes(excluded.toLowerCase())
        );
    }
    
    saveAllData(immediate = false) {
        const forms = document.querySelectorAll('form');
        const formData = {};
        
        forms.forEach(form => {
            const formId = form.id || `form_${Array.from(document.forms).indexOf(form)}`;
            formData[formId] = this.serializeForm(form);
        });
        
        // Save all form data
        const allDataKey = this.options.storagePrefix + `${this.currentPageId}_all_data`;
        const saveData = {
            forms: formData,
            timestamp: Date.now(),
            pageId: this.currentPageId,
            url: window.location.href
        };
        
        try {
            localStorage.setItem(allDataKey, JSON.stringify(saveData));
            
            if (immediate || this.isOnline) {
                this.syncToServer(saveData);
            }
            
            console.log(`💾 Auto-saved all data for page: ${this.currentPageId}`);
            
            if (this.options.showNotifications && immediate) {
                this.showNotification('Progress saved automatically', 'success');
            }
            
        } catch (error) {
            console.error('Failed to save all data:', error);
        }
    }
    
    serializeForm(form) {
        const formData = {};
        const elements = form.querySelectorAll('input, textarea, select');
        
        elements.forEach(element => {
            if (element.name && !this.shouldExcludeField(element)) {
                const value = this.getFieldValue(element);
                if (value !== null) {
                    formData[element.name] = value;
                }
            }
        });
        
        return formData;
    }
    
    loadAutoSavedData() {
        const allDataKey = this.options.storagePrefix + `${this.currentPageId}_all_data`;
        const savedDataStr = localStorage.getItem(allDataKey);
        
        if (!savedDataStr) return;
        
        try {
            const savedData = JSON.parse(savedDataStr);
            const ageMinutes = (Date.now() - savedData.timestamp) / 1000 / 60;
            
            // Only restore data that's less than 24 hours old
            if (ageMinutes < 1440) {
                this.showRestorePrompt(savedData, ageMinutes);
            } else {
                // Clean up old data
                localStorage.removeItem(allDataKey);
            }
            
        } catch (error) {
            console.error('Failed to load auto-saved data:', error);
        }
    }
    
    showRestorePrompt(savedData, ageMinutes) {
        const timeAgo = ageMinutes < 1 ? 'less than a minute ago' :
                       ageMinutes < 60 ? `${Math.round(ageMinutes)} minutes ago` :
                       `${Math.round(ageMinutes / 60)} hours ago`;
        
        const modal = this.createRestoreModal(timeAgo);
        document.body.appendChild(modal);
        
        // Handle restore decision
        modal.querySelector('.restore-yes').onclick = () => {
            this.restoreData(savedData);
            modal.remove();
            this.showNotification('Previous work restored', 'success');
        };
        
        modal.querySelector('.restore-no').onclick = () => {
            modal.remove();
            this.clearAutoSavedData();
        };
        
        modal.querySelector('.restore-close').onclick = () => {
            modal.remove();
        };
    }
    
    createRestoreModal(timeAgo) {
        const modal = document.createElement('div');
        modal.className = 'auto-save-modal';
        modal.innerHTML = `
            <div class="auto-save-modal-overlay">
                <div class="auto-save-modal-content">
                    <div class="auto-save-modal-header">
                        <h3>🔄 Restore Previous Work?</h3>
                        <button class="restore-close">&times;</button>
                    </div>
                    <div class="auto-save-modal-body">
                        <p>We found unsaved work from <strong>${timeAgo}</strong>.</p>
                        <p>Would you like to restore it?</p>
                    </div>
                    <div class="auto-save-modal-footer">
                        <button class="restore-yes btn-primary">✅ Restore</button>
                        <button class="restore-no btn-secondary">❌ Start Fresh</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        if (!document.getElementById('auto-save-styles')) {
            this.addModalStyles();
        }
        
        return modal;
    }
    
    addModalStyles() {
        const styles = document.createElement('style');
        styles.id = 'auto-save-styles';
        styles.textContent = `
            .auto-save-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
            }
            
            .auto-save-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(4px);
            }
            
            .auto-save-modal-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                width: 90%;
                max-height: 90vh;
                overflow: hidden;
                animation: modalSlideIn 0.3s ease-out;
            }
            
            @keyframes modalSlideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .auto-save-modal-header {
                padding: 20px 20px 10px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: between;
                align-items: center;
            }
            
            .auto-save-modal-header h3 {
                margin: 0;
                color: #374151;
                font-size: 18px;
                flex: 1;
            }
            
            .restore-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
            }
            
            .restore-close:hover {
                background-color: #f3f4f6;
                color: #374151;
            }
            
            .auto-save-modal-body {
                padding: 20px;
                color: #4b5563;
                line-height: 1.5;
            }
            
            .auto-save-modal-body p {
                margin: 0 0 10px 0;
            }
            
            .auto-save-modal-footer {
                padding: 15px 20px 20px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .auto-save-modal-footer button {
                padding: 8px 16px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .btn-primary {
                background-color: #10b981;
                color: white;
            }
            
            .btn-primary:hover {
                background-color: #059669;
                transform: translateY(-1px);
            }
            
            .btn-secondary {
                background-color: #f3f4f6;
                color: #374151;
            }
            
            .btn-secondary:hover {
                background-color: #e5e7eb;
            }
            
            .auto-save-indicator {
                position: absolute;
                top: -25px;
                right: 0;
                background: #10b981;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
                z-index: 1000;
            }
            
            .auto-save-indicator.show {
                opacity: 1;
            }
            
            .auto-save-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 16px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 9999;
                transform: translateX(400px);
                transition: transform 0.3s ease-out;
            }
            
            .auto-save-notification.show {
                transform: translateX(0);
            }
            
            .auto-save-notification.success {
                background-color: #10b981;
            }
            
            .auto-save-notification.error {
                background-color: #ef4444;
            }
        `;
        document.head.appendChild(styles);
    }
    
    restoreData(savedData) {
        if (!savedData.forms) return;
        
        Object.entries(savedData.forms).forEach(([formId, formData]) => {
            const form = document.getElementById(formId) || document.forms[parseInt(formId.replace('form_', ''))];
            if (!form) return;
            
            Object.entries(formData).forEach(([fieldName, value]) => {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (!field || this.shouldExcludeField(field)) return;
                
                this.setFieldValue(field, value);
            });
        });
    }
    
    setFieldValue(element, value) {
        if (element.type === 'checkbox') {
            element.checked = value;
        } else if (element.type === 'radio') {
            if (element.value === value) {
                element.checked = true;
            }
        } else if (element.contentEditable === 'true') {
            element.innerHTML = value;
        } else {
            element.value = value;
        }
        
        // Trigger change event
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    showSaveIndicator(element) {
        // Remove existing indicator
        const existingIndicator = element.parentNode.querySelector('.auto-save-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.textContent = '💾 Saved';
        
        // Position relative to element
        const parent = element.parentNode;
        parent.style.position = 'relative';
        parent.appendChild(indicator);
        
        // Show with animation
        setTimeout(() => indicator.classList.add('show'), 10);
        
        // Hide after 2 seconds
        setTimeout(() => {
            indicator.classList.remove('show');
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `auto-save-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    startPeriodicSave() {
        setInterval(() => {
            this.saveAllData();
        }, this.options.saveInterval);
    }
    
    syncToServer(data) {
        if (!this.isOnline) return;
        
        fetch(this.options.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).catch(error => {
            console.log('Server sync failed (offline backup saved):', error);
        });
    }
    
    syncOfflineData() {
        // Sync any offline data when connection is restored
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith(this.options.storagePrefix)
        );
        
        keys.forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                this.syncToServer(data);
            } catch (error) {
                console.error('Failed to sync offline data:', error);
            }
        });
    }
    
    clearAutoSavedData(pageId = null) {
        const targetPageId = pageId || this.currentPageId;
        const prefix = this.options.storagePrefix + targetPageId;
        
        const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
        keys.forEach(key => localStorage.removeItem(key));
        
        console.log(`🧹 Cleared auto-saved data for: ${targetPageId}`);
    }
    
    // Public methods
    forceSave() {
        this.saveAllData(true);
    }
    
    enableAutoSave() {
        this.options.enabled = true;
        console.log('✅ Auto-save enabled');
    }
    
    disableAutoSave() {
        this.options.enabled = false;
        console.log('⏸️ Auto-save disabled');
    }
    
    getAutoSaveStatus() {
        return {
            enabled: this.options.enabled,
            online: this.isOnline,
            lastSave: Math.max(...Array.from(this.lastSaveTime.values())),
            queueSize: this.saveQueue.size
        };
    }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.AutoSaveManager = AutoSaveManager;
    
    // Initialize auto-save when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.autoSave = new AutoSaveManager();
        });
    } else {
        window.autoSave = new AutoSaveManager();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoSaveManager;
}