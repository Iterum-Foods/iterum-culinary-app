/**
 * Timestamp System
 * Internal clock and date tracking for all app changes
 * - Real-time clock display
 * - Automatic timestamp on all data changes
 * - Audit trail logging
 * - Last modified tracking
 * - Change history documentation
 */

class TimestampSystem {
  constructor() {
    this.currentTime = new Date();
    this.auditLog = [];
    this.clockUpdateInterval = null;
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Initialize timestamp system
   */
  init() {
    console.log('⏰ Timestamp System initializing...');
    console.log(`📍 Timezone: ${this.timezone}`);
    
    this.startClock();
    this.setupAuditLogging();
    this.addClockDisplay();
    this.interceptDataChanges();
    
    console.log('✅ Timestamp System active');
  }

  /**
   * Start internal clock
   */
  startClock() {
    // Update every second
    this.clockUpdateInterval = setInterval(() => {
      this.currentTime = new Date();
      this.updateClockDisplays();
    }, 1000);
  }

  /**
   * Get current timestamp in various formats
   */
  now() {
    return {
      iso: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      datetime: new Date().toLocaleString(),
      unix: Date.now(),
      formatted: this.formatTimestamp(new Date())
    };
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    
    return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  getRelativeTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }

  /**
   * Add clock display to header
   */
  addClockDisplay() {
    // Find header or create clock container
    const header = document.querySelector('.iterum-header');
    
    if (header) {
      const clockDiv = document.createElement('div');
      clockDiv.id = 'system-clock';
      clockDiv.style.cssText = `
        position: fixed;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        z-index: 999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      
      clockDiv.innerHTML = `
        <span id="clock-date">Loading...</span>
        <span style="opacity: 0.6;">|</span>
        <span id="clock-time">Loading...</span>
      `;
      
      document.body.appendChild(clockDiv);
      
      // Initial update
      this.updateClockDisplays();
    }
  }

  /**
   * Update all clock displays
   */
  updateClockDisplays() {
    const dateEl = document.getElementById('clock-date');
    const timeEl = document.getElementById('clock-time');
    
    if (dateEl) {
      dateEl.textContent = this.currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    
    if (timeEl) {
      timeEl.textContent = this.currentTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  /**
   * Setup audit logging
   */
  setupAuditLogging() {
    // Load existing audit log
    this.auditLog = JSON.parse(localStorage.getItem('audit_log') || '[]');
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Log an action to audit trail
   */
  logAction(action, entityType, entityId, details = {}) {
    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: action, // 'created', 'updated', 'deleted', 'viewed'
      entityType: entityType, // 'recipe', 'menu', 'ingredient', 'equipment'
      entityId: entityId,
      userId: window.authManager?.currentUser?.userId,
      userEmail: window.authManager?.currentUser?.email,
      details: details,
      page: window.location.pathname
    };
    
    this.auditLog.push(logEntry);
    
    // Keep only last 1000
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
    
    // Save to localStorage
    localStorage.setItem('audit_log', JSON.stringify(this.auditLog));
    
    console.log(`📝 Logged: ${action} ${entityType} (${entityId})`);
  }

  /**
   * Get audit trail for specific entity
   */
  getEntityHistory(entityId) {
    return this.auditLog
      .filter(entry => entry.entityId === entityId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit = 10) {
    return this.auditLog
      .slice(-limit)
      .reverse();
  }

  /**
   * Intercept data changes to auto-timestamp
   */
  interceptDataChanges() {
    // Intercept localStorage.setItem to add timestamps
    const originalSetItem = localStorage.setItem.bind(localStorage);
    
    localStorage.setItem = (key, value) => {
      // Add timestamp metadata for specific keys
      if (key.includes('recipe') || key.includes('menu') || key.includes('ingredient') || key.includes('equipment')) {
        try {
          const data = JSON.parse(value);
          
          if (Array.isArray(data)) {
            // Add updatedAt to each item if not present
            data.forEach(item => {
              if (typeof item === 'object' && item !== null) {
                if (!item.createdAt) item.createdAt = new Date().toISOString();
                item.updatedAt = new Date().toISOString();
                item.lastModifiedBy = window.authManager?.currentUser?.email || 'Unknown';
              }
            });
            value = JSON.stringify(data);
          } else if (typeof data === 'object' && data !== null) {
            // Single object
            if (!data.createdAt) data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            data.lastModifiedBy = window.authManager?.currentUser?.email || 'Unknown';
            value = JSON.stringify(data);
          }
        } catch (e) {
          // Not JSON, proceed with original
        }
      }
      
      return originalSetItem(key, value);
    };
  }

  /**
   * Add timestamps to data object
   */
  timestamp(data) {
    return {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModifiedBy: window.authManager?.currentUser?.email || 'Unknown',
      timezone: this.timezone
    };
  }

  /**
   * Show timestamp on UI element
   */
  showTimestamp(elementId, timestamp, options = {}) {
    const {
      format = 'relative', // 'relative', 'full', 'date', 'time'
      prefix = 'Last updated: '
    } = options;
    
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let displayText = '';
    
    switch (format) {
      case 'relative':
        displayText = prefix + this.getRelativeTime(timestamp);
        break;
      case 'full':
        displayText = prefix + this.formatTimestamp(timestamp);
        break;
      case 'date':
        displayText = prefix + new Date(timestamp).toLocaleDateString();
        break;
      case 'time':
        displayText = prefix + new Date(timestamp).toLocaleTimeString();
        break;
    }
    
    element.textContent = displayText;
    element.title = new Date(timestamp).toLocaleString(); // Tooltip with full datetime
  }

  /**
   * View audit log
   */
  viewAuditLog() {
    console.log('\n📋 AUDIT LOG (Last 50 entries):');
    console.log('═'.repeat(80));
    
    this.getRecentActivity(50).forEach((entry, index) => {
      console.log(`\n${index + 1}. ${entry.action.toUpperCase()} ${entry.entityType}`);
      console.log(`   Time: ${this.formatTimestamp(entry.timestamp)}`);
      console.log(`   User: ${entry.userEmail || 'Unknown'}`);
      console.log(`   Entity: ${entry.entityId}`);
      if (Object.keys(entry.details).length > 0) {
        console.log(`   Details:`, entry.details);
      }
    });
    
    console.log('\n' + '═'.repeat(80));
  }

  /**
   * Export audit log
   */
  exportAuditLog() {
    const data = {
      exported: new Date().toISOString(),
      timezone: this.timezone,
      totalEntries: this.auditLog.length,
      entries: this.auditLog
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    console.log('📥 Audit log exported');
  }

  /**
   * Clear old audit entries (older than X days)
   */
  clearOldAudit(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const originalLength = this.auditLog.length;
    this.auditLog = this.auditLog.filter(entry => 
      new Date(entry.timestamp) > cutoffDate
    );
    
    localStorage.setItem('audit_log', JSON.stringify(this.auditLog));
    
    const removed = originalLength - this.auditLog.length;
    console.log(`🧹 Cleared ${removed} old audit entries (kept ${daysToKeep} days)`);
  }
}

// Global helper functions
window.getCurrentTimestamp = function() {
  return new Date().toISOString();
};

window.formatDate = function(timestamp) {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleDateString();
};

window.formatDateTime = function(timestamp) {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleString();
};

window.getRelativeTime = function(timestamp) {
  if (window.timestampSystem) {
    return window.timestampSystem.getRelativeTime(timestamp);
  }
  return 'Unknown';
};

window.viewAuditLog = function() {
  if (window.timestampSystem) {
    window.timestampSystem.viewAuditLog();
  }
};

window.exportAuditLog = function() {
  if (window.timestampSystem) {
    window.timestampSystem.exportAuditLog();
  }
};

// Initialize global instance
window.timestampSystem = new TimestampSystem();

// Auto-initialize on page load
window.addEventListener('load', () => {
  setTimeout(() => {
    window.timestampSystem.init();
  }, 500);
});

console.log('⏰ Timestamp System loaded');

