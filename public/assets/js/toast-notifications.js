/**
 * Toast Notification System
 * Professional replacement for alert() calls
 */

class ToastNotification {
    constructor() {
        this.container = null;
        this.init();
        console.log('🍞 Toast Notification System initialized');
    }
    
    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                top: 90px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }
    
    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Get icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        // Get colors based on type
        const colors = {
            success: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', icon: '#10b981' },
            error: { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', icon: '#ef4444' },
            warning: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', icon: '#f59e0b' },
            info: { bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', icon: '#3b82f6' }
        };
        
        const color = colors[type] || colors.info;
        const icon = icons[type] || icons.info;
        
        toast.style.cssText = `
            background: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            min-width: 300px;
            max-width: 500px;
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: auto;
            cursor: pointer;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${color.icon};
        `;
        
        toast.innerHTML = `
            <div style="
                width: 32px;
                height: 32px;
                background: ${color.bg};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 900;
                font-size: 18px;
                flex-shrink: 0;
            ">${icon}</div>
            <div style="flex: 1; color: #1e293b; font-weight: 500; font-size: 14px; line-height: 1.5;">
                ${message}
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: #64748b;
                font-size: 20px;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
                opacity: 0.6;
                transition: opacity 0.2s;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">×</button>
        `;
        
        // Add animation styles if not already added
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
                
                .toast:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
                }
            `;
            document.head.appendChild(style);
        }
        
        this.container.appendChild(toast);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, duration);
        }
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
        
        return toast;
    }
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Initialize global toast system
window.toast = new ToastNotification();

// Convenience functions for global use
window.showToast = (message, type, duration) => window.toast.show(message, type, duration);
window.showSuccess = (message, duration) => window.toast.success(message, duration);
window.showError = (message, duration) => window.toast.error(message, duration);
window.showWarning = (message, duration) => window.toast.warning(message, duration);
window.showInfo = (message, duration) => window.toast.info(message, duration);

console.log('✅ Toast functions available: showSuccess(), showError(), showWarning(), showInfo()');


