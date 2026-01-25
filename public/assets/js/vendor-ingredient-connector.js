/**
 * Vendor-Ingredient Connector
 * Connects ingredients to vendors with brand/farm information
 */

class VendorIngredientConnector {
  constructor() {
    this.connectionsKey = 'vendor_ingredient_connections';
    this.init();
  }

  init() {
    console.log('🔗 Vendor-Ingredient Connector initialized');
  }

  /**
   * Show modal to connect ingredient to vendor
   */
  showConnectModal(ingredientId, ingredientName) {
    const modal = document.createElement('div');
    modal.id = 'vendor-ingredient-connect-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;

    const vendors = JSON.parse(localStorage.getItem('iterum_vendors') || '[]');

    modal.innerHTML = `
      <div style="background: white; border-radius: 16px; padding: 32px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          🔗 Connect to Vendor
        </h2>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
          Connect <strong>${ingredientName}</strong> to a vendor with brand/farm details
        </p>

        <form id="vendor-connect-form">
          <!-- Vendor Selection -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #475569;">
              Vendor *
            </label>
            <select id="connect-vendor-id" required
                    style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
              <option value="">Select a vendor...</option>
              ${vendors.map(v => `
                <option value="${v.id}">${v.name} ${v.company ? `(${v.company})` : ''}</option>
              `).join('')}
            </select>
          </div>

          <!-- Brand Name -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #475569;">
              🏷️ Brand Name
            </label>
            <input type="text" id="connect-brand-name" 
                   style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;"
                   placeholder="e.g., Organic Valley, Tyson, Nature's Best">
            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
              The specific brand this vendor supplies
            </p>
          </div>

          <!-- Farm/Producer -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #475569;">
              🌾 Farm / Producer
            </label>
            <input type="text" id="connect-farm-name" 
                   style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;"
                   placeholder="e.g., Green Valley Farm, Local Farms Co-op">
            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
              The farm or producer of this ingredient
            </p>
          </div>

          <!-- Product Code -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #475569;">
              🔢 Product Code / SKU
            </label>
            <input type="text" id="connect-product-code" 
                   style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;"
                   placeholder="e.g., SKU-12345, PROD-ABC">
            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
              Vendor's product code for ordering
            </p>
          </div>

          <!-- Price -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #475569;">
              💰 Price per Unit
            </label>
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
              <input type="number" id="connect-price" step="0.01" min="0"
                     style="padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;"
                     placeholder="0.00">
              <select id="connect-unit"
                      style="padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
                <option value="lb">per lb</option>
                <option value="oz">per oz</option>
                <option value="kg">per kg</option>
                <option value="g">per g</option>
                <option value="each">per each</option>
                <option value="dozen">per dozen</option>
                <option value="case">per case</option>
                <option value="box">per box</option>
              </select>
            </div>
          </div>

          <!-- Minimum Order -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #475569;">
              📦 Minimum Order Quantity
            </label>
            <input type="number" id="connect-min-order" min="1"
                   style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;"
                   placeholder="1">
          </div>

          <!-- Notes -->
          <div style="margin-bottom: 24px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #475569;">
              📝 Notes
            </label>
            <textarea id="connect-notes" rows="3"
                      style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; resize: vertical;"
                      placeholder="Any additional notes about this product..."></textarea>
          </div>

          <!-- Buttons -->
          <div style="display: flex; gap: 12px;">
            <button type="button" onclick="this.closest('#vendor-ingredient-connect-modal').remove()" 
                    style="flex: 1; padding: 12px; background: #f1f5f9; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Cancel
            </button>
            <button type="submit" 
                    style="flex: 2; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
              ✅ Connect Vendor
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    document.getElementById('vendor-connect-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveConnection(ingredientId, ingredientName);
    });
  }

  /**
   * Save vendor-ingredient connection
   */
  saveConnection(ingredientId, ingredientName) {
    const vendorId = document.getElementById('connect-vendor-id').value;
    const brandName = document.getElementById('connect-brand-name').value.trim();
    const farmName = document.getElementById('connect-farm-name').value.trim();
    const productCode = document.getElementById('connect-product-code').value.trim();
    const price = parseFloat(document.getElementById('connect-price').value) || 0;
    const unit = document.getElementById('connect-unit').value;
    const minOrder = parseInt(document.getElementById('connect-min-order').value) || 1;
    const notes = document.getElementById('connect-notes').value.trim();

    if (!vendorId) {
      alert('Please select a vendor');
      return;
    }

    // Get vendor name
    const vendors = JSON.parse(localStorage.getItem('iterum_vendors') || '[]');
    const vendor = vendors.find(v => v.id == vendorId);
    const vendorName = vendor ? vendor.name : 'Unknown Vendor';

    // Load existing connections
    const connections = JSON.parse(localStorage.getItem(this.connectionsKey) || '[]');

    // Create new connection
    const connection = {
      id: `conn_${Date.now()}`,
      ingredientId: ingredientId,
      ingredientName: ingredientName,
      vendorId: vendorId,
      vendorName: vendorName,
      brandName: brandName,
      farmName: farmName,
      productCode: productCode,
      price: price,
      unit: unit,
      minOrder: minOrder,
      notes: notes,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Add to connections
    connections.push(connection);
    localStorage.setItem(this.connectionsKey, JSON.stringify(connections));

    // Update ingredient with vendor info
    this.updateIngredientVendorInfo(ingredientId, connection);

    // Close modal
    document.getElementById('vendor-ingredient-connect-modal').remove();

    // Show success
    this.showNotification(`✅ Connected ${ingredientName} to ${vendorName}${brandName ? ` (${brandName})` : ''}`, 'success');

    // Track analytics
    if (window.analyticsTracker) {
      window.analyticsTracker.trackCustomEvent('vendor_ingredient_connected', {
        has_brand: !!brandName,
        has_farm: !!farmName,
        has_price: price > 0
      });
    }

    // Refresh page data
    setTimeout(() => {
      if (typeof displayIngredients === 'function') {
        displayIngredients();
      }
    }, 500);
  }

  /**
   * Update ingredient with vendor info
   */
  updateIngredientVendorInfo(ingredientId, connection) {
    const ingredients = JSON.parse(localStorage.getItem('ingredients_database') || '[]');
    const ingredient = ingredients.find(ing => ing.id === ingredientId);

    if (ingredient) {
      if (!ingredient.vendor_info) {
        ingredient.vendor_info = [];
      }

      // Add vendor connection info
      ingredient.vendor_info.push({
        vendorId: connection.vendorId,
        vendorName: connection.vendorName,
        brandName: connection.brandName,
        farmName: connection.farmName,
        price: connection.price,
        unit: connection.unit
      });

      // Update brand/farm at ingredient level if not set
      if (!ingredient.brand && connection.brandName) {
        ingredient.brand = connection.brandName;
      }
      if (!ingredient.farm && connection.farmName) {
        ingredient.farm = connection.farmName;
      }

      localStorage.setItem('ingredients_database', JSON.stringify(ingredients));
    }
  }

  /**
   * Get all connections for an ingredient
   */
  getConnectionsForIngredient(ingredientId) {
    const connections = JSON.parse(localStorage.getItem(this.connectionsKey) || '[]');
    return connections.filter(conn => conn.ingredientId === ingredientId);
  }

  /**
   * Get all connections for a vendor
   */
  getConnectionsForVendor(vendorId) {
    const connections = JSON.parse(localStorage.getItem(this.connectionsKey) || '[]');
    return connections.filter(conn => conn.vendorId == vendorId);
  }

  /**
   * Delete a connection
   */
  deleteConnection(connectionId) {
    const connections = JSON.parse(localStorage.getItem(this.connectionsKey) || '[]');
    const filtered = connections.filter(conn => conn.id !== connectionId);
    localStorage.setItem(this.connectionsKey, JSON.stringify(filtered));
    
    this.showNotification('🗑️ Connection removed', 'info');
  }

  /**
   * Show vendor info badge for ingredient
   */
  createVendorBadge(ingredientId) {
    const connections = this.getConnectionsForIngredient(ingredientId);
    
    if (connections.length === 0) {
      return `<span style="font-size: 12px; color: #94a3b8;">No vendors</span>`;
    }

    let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">';
    
    connections.forEach(conn => {
      const display = [];
      if (conn.brandName) display.push(`🏷️ ${conn.brandName}`);
      if (conn.farmName) display.push(`🌾 ${conn.farmName}`);
      if (display.length === 0) display.push(conn.vendorName);
      
      html += `
        <div style="display: inline-block; padding: 4px 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; font-size: 11px; font-weight: 600;">
          ${display.join(' • ')}
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

// Initialize global instance
window.vendorIngredientConnector = new VendorIngredientConnector();

console.log('🔗 Vendor-Ingredient Connector loaded');

