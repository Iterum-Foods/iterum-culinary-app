/**
 * Sync Status Indicator
 * Shows persistent sync status in bottom right corner
 */

class SyncStatusIndicator {
    constructor() {
        this.indicator = null;
        this.init();
    }

    init() {
        this.createIndicator();
        this.setupEventListeners();
        console.log('✅ Sync status indicator initialized');
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.id = 'sync-status-indicator';
        this.indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 10px 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 9998;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s ease;
            cursor: pointer;
        `;
        
        this.indicator.innerHTML = `
            <div class="sync-dot" style="width: 10px; height: 10px; border-radius: 50%; background: #94a3b8;"></div>
            <span class="sync-text">Checking...</span>
        `;
        
        this.indicator.onclick = () => {
            if (window.cloudDataSync) {
                window.cloudDataSync.manualSync();
            }
        };
        
        document.body.appendChild(this.indicator);
    }

    setupEventListeners() {
        // Listen for storage changes
        window.addEventListener('storage', () => {
            this.updateStatus('saving', 'Saving...');
        });

        // Listen for cloud sync events
        window.addEventListener('cloudSyncComplete', (event) => {
            const count = event.detail?.itemsDownloaded || 0;
            this.updateStatus('synced', count > 0 ? `Synced ${count} items` : 'Synced');
            setTimeout(() => this.updateStatus('idle', 'All saved'), 2000);
        });

        // Update status every 5 seconds
        setInterval(() => {
            this.checkSyncStatus();
        }, 5000);
    }

    updateStatus(status, text) {
        if (!this.indicator) return;

        const dot = this.indicator.querySelector('.sync-dot');
        const textEl = this.indicator.querySelector('.sync-text');

        if (status === 'syncing') {
            dot.style.background = '#3b82f6';
            dot.style.animation = 'pulse 1.5s infinite';
            this.indicator.style.borderColor = '#3b82f6';
        } else if (status === 'synced') {
            dot.style.background = '#10b981';
            dot.style.animation = 'none';
            this.indicator.style.borderColor = '#10b981';
        } else if (status === 'error') {
            dot.style.background = '#ef4444';
            dot.style.animation = 'none';
            this.indicator.style.borderColor = '#ef4444';
        } else if (status === 'saving') {
            dot.style.background = '#f59e0b';
            dot.style.animation = 'pulse 1.5s infinite';
            this.indicator.style.borderColor = '#f59e0b';
        } else {
            dot.style.background = '#94a3b8';
            dot.style.animation = 'none';
            this.indicator.style.borderColor = '#e5e7eb';
        }

        textEl.textContent = text;
    }

    checkSyncStatus() {
        if (!window.cloudDataSync) return;

        const status = window.cloudDataSync.getSyncStatus();
        
        if (status.isSyncing) {
            this.updateStatus('syncing', 'Syncing...');
        } else if (status.queueLength > 0) {
            this.updateStatus('saving', `Saving (${status.queueLength})`);
        } else if (status.online) {
            const lastSync = status.lastSync ? new Date(status.lastSync) : null;
            if (lastSync) {
                const minutesAgo = Math.floor((Date.now() - lastSync) / 60000);
                if (minutesAgo < 1) {
                    this.updateStatus('synced', 'Just synced');
                } else {
                    this.updateStatus('idle', `${minutesAgo}m ago`);
                }
            } else {
                this.updateStatus('idle', 'Ready');
            }
        } else {
            this.updateStatus('error', 'Offline');
        }
    }
}

// Add pulse animation (only if not already added)
if (!document.getElementById('sync-status-indicator-styles')) {
    const syncStyle = document.createElement('style');
    syncStyle.id = 'sync-status-indicator-styles';
    syncStyle.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        #sync-status-indicator:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 30px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(syncStyle);
}

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.syncStatusIndicator = new SyncStatusIndicator();
    });
} else {
    window.syncStatusIndicator = new SyncStatusIndicator();
}

console.log('✅ Sync Status Indicator script loaded');

