/**
 * UX Enhancement System
 * Makes the app more user-friendly with:
 * - Tooltips
 * - Helpful hints
 * - Better empty states
 * - Success/error notifications
 * - Quick action suggestions
 * - Onboarding guidance
 */

class UXEnhancementSystem {
  constructor() {
    this.tooltips = new Map();
    this.notifications = [];
    this.onboardingSteps = [];
    this.helpMode = false;
  }

  /**
   * Initialize UX enhancements
   */
  init() {
    console.log('✨ UX Enhancement System initializing...');
    
    this.setupTooltips();
    this.setupNotifications();
    this.checkFirstTimeUser();
    this.addQuickHelp();
    
    console.log('✅ UX Enhancements active');
  }

  /**
   * Check if first-time user and show onboarding
   */
  checkFirstTimeUser() {
    const hasSeenOnboarding = localStorage.getItem('onboarding_completed');
    const user = window.authManager?.currentUser;
    
    if (!hasSeenOnboarding && user) {
      // Show welcome guide after a moment
      setTimeout(() => {
        this.showOnboardingGuide();
      }, 2000);
    }
  }

  /**
   * Show onboarding guide
   */
  showOnboardingGuide() {
    const guide = document.createElement('div');
    guide.id = 'onboarding-guide';
    guide.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease;">
        <div style="background: white; border-radius: 20px; max-width: 600px; width: 90%; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.4s ease;">
          <div style="text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🎉</div>
            <h2 style="font-size: 2rem; font-weight: 800; color: #1e293b; margin-bottom: 15px;">Welcome to Iterum!</h2>
            <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 30px; line-height: 1.6;">
              Your professional culinary workspace is ready. Here's a quick tour to get you started.
            </p>
          </div>

          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
            <h3 style="font-weight: 700; color: #667eea; margin-bottom: 15px;">🚀 Quick Start Guide</h3>
            
            <div style="margin-bottom: 12px; display: flex; align-items: start; gap: 12px;">
              <span style="background: #667eea; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">1</span>
              <div>
                <strong style="display: block; color: #1e293b;">Add Ingredients</strong>
                <p style="color: #64748b; font-size: 0.9rem; margin: 4px 0 0;">Go to <strong>Ingredients</strong> → Auto-imports 145 professional ingredients</p>
              </div>
            </div>

            <div style="margin-bottom: 12px; display: flex; align-items: start; gap: 12px;">
              <span style="background: #667eea; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">2</span>
              <div>
                <strong style="display: block; color: #1e293b;">Create Your First Recipe</strong>
                <p style="color: #64748b; font-size: 0.9rem; margin: 4px 0 0;">Use <strong>Recipe Developer</strong> or <strong>Quick Dish Creator</strong></p>
              </div>
            </div>

            <div style="margin-bottom: 12px; display: flex; align-items: start; gap: 12px;">
              <span style="background: #667eea; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">3</span>
              <div>
                <strong style="display: block; color: #1e293b;">Build a Menu</strong>
                <p style="color: #64748b; font-size: 0.9rem; margin: 4px 0 0;">Go to <strong>Menu Builder</strong> → Add your recipes to a menu</p>
              </div>
            </div>

            <div style="display: flex; align-items: start; gap: 12px;">
              <span style="background: #667eea; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">4</span>
              <div>
                <strong style="display: block; color: #1e293b;">Generate Kitchen Tools</strong>
                <p style="color: #64748b; font-size: 0.9rem; margin: 4px 0 0;">Use <strong>Kitchen Management</strong> for PDFs, checklists, prep lists</p>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 12px;">
            <button onclick="document.getElementById('onboarding-guide').remove()" style="flex: 1; padding: 14px; background: #e2e8f0; color: #1e293b; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Skip
            </button>
            <button onclick="startGuidedTour()" style="flex: 1; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Start Tour →
            </button>
          </div>

          <label style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; cursor: pointer;">
            <input type="checkbox" onchange="localStorage.setItem('onboarding_completed', 'true')" style="width: 18px; height: 18px;">
            <span style="color: #64748b; font-size: 0.9rem;">Don't show this again</span>
          </label>
        </div>
      </div>

      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(guide);
  }

  /**
   * Setup notification system
   */
  setupNotifications() {
    // Create notification container if doesn't exist
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
  }

  /**
   * Show notification
   */
  showNotification(title, message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const colors = {
      success: { bg: '#dcfce7', border: '#22c55e', text: '#166534', icon: '✅' },
      error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '❌' },
      warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⚠️' },
      info: { bg: '#e0e7ff', border: '#667eea', text: '#3730a3', icon: 'ℹ️' }
    };
    
    const color = colors[type] || colors.info;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: ${color.bg};
      border-left: 4px solid ${color.border};
      color: ${color.text};
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: all;
      cursor: pointer;
      animation: slideInRight 0.3s ease, fadeOut 0.3s ease 4.7s;
      min-width: 300px;
      max-width: 400px;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="font-size: 1.5rem;">${color.icon}</div>
        <div style="flex: 1;">
          <div style="font-weight: 700; margin-bottom: 4px;">${title}</div>
          <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; opacity: 0.6;">×</button>
      </div>
    `;
    
    notification.onclick = () => notification.remove();
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Setup tooltips
   */
  setupTooltips() {
    // Add CSS for tooltips
    if (!document.getElementById('tooltip-styles')) {
      const style = document.createElement('style');
      style.id = 'tooltip-styles';
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
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        .tooltip {
          position: relative;
          cursor: help;
        }
        
        .tooltip::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          background: #1e293b;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
          z-index: 1000;
        }
        
        .tooltip:hover::after {
          opacity: 1;
        }
        
        .help-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: #667eea;
          color: white;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: help;
          margin-left: 6px;
        }
        
        .quick-hint {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b;
          padding: 15px 20px;
          border-radius: 8px;
          margin: 15px 0;
          font-size: 0.95rem;
          color: #92400e;
        }
        
        .quick-hint strong {
          color: #78350f;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Add quick help button
   */
  addQuickHelp() {
    if (document.getElementById('quick-help-btn')) return;
    
    const helpBtn = document.createElement('button');
    helpBtn.id = 'quick-help-btn';
    helpBtn.innerHTML = '?';
    helpBtn.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 2rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
      z-index: 9998;
      transition: all 0.3s;
    `;
    
    helpBtn.onmouseover = () => {
      helpBtn.style.transform = 'scale(1.1)';
      helpBtn.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.6)';
    };
    
    helpBtn.onmouseout = () => {
      helpBtn.style.transform = 'scale(1)';
      helpBtn.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
    };
    
    helpBtn.onclick = () => this.showHelpMenu();
    
    document.body.appendChild(helpBtn);
  }

  /**
   * Show help menu
   */
  showHelpMenu() {
    const currentPage = this.detectCurrentPage();
    const help = this.getPageHelp(currentPage);
    
    const menu = document.createElement('div');
    menu.id = 'help-menu';
    menu.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
        <div style="background: white; border-radius: 16px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="font-size: 1.8rem; font-weight: 700; color: #1e293b;">💡 Help & Tips</h2>
            <button onclick="this.closest('#help-menu').remove()" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: #64748b;">×</button>
          </div>

          <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="font-weight: 700; color: #6b21a8; margin-bottom: 10px;">${help.title}</h3>
            <p style="color: #581c87; font-size: 0.95rem; line-height: 1.6;">${help.description}</p>
          </div>

          <h3 style="font-weight: 700; margin-bottom: 15px; color: #667eea;">Quick Actions:</h3>
          ${help.actions.map(action => `
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #667eea;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 5px;">${action.title}</div>
              <div style="color: #64748b; font-size: 0.9rem;">${action.description}</div>
              ${action.link ? `<a href="${action.link}" style="color: #667eea; font-weight: 600; font-size: 0.9rem; text-decoration: none;">→ Go there</a>` : ''}
            </div>
          `).join('')}

          <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
            <button onclick="window.uxEnhancement.showOnboardingGuide(); this.closest('#help-menu').remove();" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 10px;">
              🎓 Show Getting Started Guide
            </button>
            <button onclick="location.href='QUICK_START_GUIDE.md'" style="width: 100%; padding: 12px; background: #e2e8f0; color: #1e293b; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              📖 View Full Documentation
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(menu);
  }

  /**
   * Detect current page
   */
  detectCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/') return 'dashboard';
    if (path.includes('recipe-library')) return 'recipe-library';
    if (path.includes('recipe-developer')) return 'recipe-developer';
    if (path.includes('recipe-upload')) return 'recipe-upload';
    if (path.includes('menu-builder')) return 'menu-builder';
    if (path.includes('ingredients')) return 'ingredients';
    if (path.includes('equipment')) return 'equipment';
    if (path.includes('kitchen-management')) return 'kitchen-management';
    if (path.includes('server-info')) return 'server-info';
    if (path.includes('ingredient-highlights')) return 'highlights';
    
    return 'other';
  }

  /**
   * Get page-specific help
   */
  getPageHelp(page) {
    const helpContent = {
      'dashboard': {
        title: 'Dashboard - Your Command Center',
        description: 'Access all features from here. Click any card to jump to that tool.',
        actions: [
          { title: 'Create First Recipe', description: 'Start with Recipe Developer or Quick Dish Creator', link: 'recipe-developer.html' },
          { title: 'Import Ingredients', description: 'Load 145 professional ingredients automatically', link: 'ingredients.html' },
          { title: 'Build Your Menu', description: 'Create a menu with your recipes', link: 'menu-builder.html' }
        ]
      },
      'ingredients': {
        title: 'Ingredients Database',
        description: 'Manage your ingredient library. Auto-imports 145 professional ingredients on first visit.',
        actions: [
          { title: 'Auto-Import Ingredients', description: 'Click "Import Base Ingredients" to load 145 professional ingredients', link: null },
          { title: 'Add Custom Ingredient', description: 'Use the form at the top to add your own ingredients', link: null },
          { title: 'Filter & Search', description: 'Use filters to find ingredients by category or vendor', link: null }
        ]
      },
      'recipe-library': {
        title: 'Recipe Library',
        description: 'All your recipes in one place. Filter by category, search by name, or view by project.',
        actions: [
          { title: 'Create New Recipe', description: 'Use Recipe Developer for detailed recipes', link: 'recipe-developer.html' },
          { title: 'Quick Add', description: 'Use Quick Dish Creator for fast entry', link: 'index.html#quick-dish' },
          { title: 'Import Recipes', description: 'Upload PDFs or paste text in Bulk Import', link: 'bulk-recipe-import.html' }
        ]
      },
      'recipe-developer': {
        title: 'Recipe Developer',
        description: 'Create detailed recipes with components, equipment, and plating instructions.',
        actions: [
          { title: 'Select Ingredients', description: 'Use dropdowns to select from your ingredient database', link: null },
          { title: 'Link Equipment', description: 'Check boxes for equipment needed in this recipe', link: null },
          { title: 'Add Components', description: 'Break complex recipes into prep components', link: null }
        ]
      },
      'menu-builder': {
        title: 'Menu Builder',
        description: 'Create professional menus with pricing, categories, and linked recipes.',
        actions: [
          { title: 'Create New Menu', description: 'Start a new menu for your restaurant or event', link: null },
          { title: 'Add Menu Items', description: 'Link your recipes to create menu dishes', link: null },
          { title: 'Set Pricing', description: 'Add prices and track costs for profitability', link: null }
        ]
      },
      'kitchen-management': {
        title: 'Kitchen Management Tools',
        description: 'Professional tools for running your kitchen: PDFs, build sheets, checklists, and prep lists.',
        actions: [
          { title: 'Generate Recipe Book', description: 'Create a professional PDF with all your recipes', link: null },
          { title: 'Create Build Sheets', description: 'Detailed component sheets for each recipe', link: null },
          { title: 'Prep Lists', description: 'Auto-prioritized prep list for tomorrow', link: null }
        ]
      },
      'server-info': {
        title: 'Server Information Sheet',
        description: 'Create FOH reference sheets with talking points, allergens, and pairing suggestions.',
        actions: [
          { title: 'Select Menu', description: 'Choose a menu to generate server info', link: null },
          { title: 'Add Custom Notes', description: 'Click "Add Custom Point" to add talking points', link: null },
          { title: 'Download PDF', description: 'Print or email to your service staff', link: null }
        ]
      },
      'highlights': {
        title: 'Ingredient Highlights',
        description: 'Showcase your unique ingredients with stories, sourcing, and pronunciation guides.',
        actions: [
          { title: 'Add Highlight', description: 'Click "Add Ingredient Highlight" to feature a special ingredient', link: null },
          { title: 'Tell the Story', description: 'Add origin, vendor, flavor profile, and why it\'s special', link: null },
          { title: 'Link to Dishes', description: 'Show which dishes use this ingredient', link: null }
        ]
      },
      'other': {
        title: 'Help & Support',
        description: 'Need help? We\'re here to guide you.',
        actions: [
          { title: 'Back to Dashboard', description: 'Return to main dashboard', link: 'index.html' },
          { title: 'View Documentation', description: 'Read full guides and tutorials', link: 'QUICK_START_GUIDE.md' },
          { title: 'Run Setup', description: 'Load 89 Charles menu data', link: 'SETUP_89_CHARLES.html' }
        ]
      }
    };
    
    return helpContent[page] || helpContent.other;
  }

  /**
   * Add helpful hints to empty states
   */
  enhanceEmptyState(element, hints) {
    if (!element) return;
    
    const hintHtml = `
      <div class="quick-hint" style="margin-top: 20px;">
        <strong>💡 Quick Tip:</strong> ${hints.join(' ')}
      </div>
    `;
    
    element.insertAdjacentHTML('beforeend', hintHtml);
  }

  /**
   * Add help icon to labels
   */
  addHelpIcon(labelText, tooltipText) {
    return `${labelText} <span class="help-icon tooltip" data-tooltip="${tooltipText}">?</span>`;
  }
}

// Global helper function for notifications
window.showNotification = function(title, message, type = 'info') {
  if (window.uxEnhancement) {
    window.uxEnhancement.showNotification(title, message, type);
  }
};

// Global guided tour function
window.startGuidedTour = function() {
  document.getElementById('onboarding-guide')?.remove();
  window.showNotification(
    '🎓 Guided Tour',
    'Tour feature coming soon! For now, explore each section from the dashboard.',
    'info'
  );
};

// Initialize global instance
window.uxEnhancement = new UXEnhancementSystem();

// Auto-initialize on page load
window.addEventListener('load', () => {
  setTimeout(() => {
    window.uxEnhancement.init();
  }, 1000);
});

console.log('✨ UX Enhancement System loaded');

