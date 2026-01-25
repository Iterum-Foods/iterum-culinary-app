/**
 * Purchase Order & Inventory Ordering System
 * Integrates vendors, ingredients, and inventory management
 */

class OrderingSystem {
    constructor() {
        this.purchaseOrders = [];
        this.orderItems = [];
        this.orderHistory = [];
        this.currentOrder = null;
        this.init();
    }

    init() {
        console.log('🛒 Initializing Ordering System...');
        this.loadOrders();
        this.loadVendors();
        console.log('✅ Ordering System ready');
    }

    /**
     * Load purchase orders from storage
     */
    loadOrders() {
        try {
            const userId = this.getCurrentUserId();
            const key = userId ? `purchase_orders_${userId}` : 'purchase_orders';
            this.purchaseOrders = JSON.parse(localStorage.getItem(key) || '[]');
            console.log(`📦 Loaded ${this.purchaseOrders.length} purchase orders`);
        } catch (error) {
            console.error('Error loading orders:', error);
            this.purchaseOrders = [];
        }
    }

    /**
     * Load vendors from storage
     */
    loadVendors() {
        try {
            const userId = this.getCurrentUserId();
            const key = userId ? `vendors_${userId}` : 'vendors';
            this.vendors = JSON.parse(localStorage.getItem(key) || '[]');
            console.log(`🏪 Loaded ${this.vendors.length} vendors`);
        } catch (error) {
            console.error('Error loading vendors:', error);
            this.vendors = [];
        }
    }

    /**
     * Create a new purchase order
     */
    createPurchaseOrder(vendorId, deliveryDate = null, notes = '') {
        const vendor = this.vendors.find(v => v.id === vendorId);
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        const order = {
            id: `PO-${Date.now()}`,
            poNumber: this.generatePONumber(),
            vendorId: vendorId,
            vendorName: vendor.name,
            vendorCompany: vendor.company,
            status: 'draft',
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0,
            notes: notes,
            createdAt: new Date().toISOString(),
            createdBy: this.getCurrentUserName(),
            expectedDeliveryDate: deliveryDate,
            actualDeliveryDate: null,
            submittedAt: null,
            receivedAt: null,
            invoiceNumber: null,
            paymentStatus: 'unpaid',
            paymentMethod: null,
            paidAt: null
        };

        this.currentOrder = order;
        return order;
    }

    /**
     * Add item to current purchase order
     */
    addItemToOrder(ingredientId, quantity, unitPrice = null) {
        if (!this.currentOrder) {
            throw new Error('No active purchase order');
        }

        // Get ingredient details
        const ingredient = this.getIngredient(ingredientId);
        if (!ingredient) {
            throw new Error('Ingredient not found');
        }

        // Use ingredient's vendor price if not specified
        const price = unitPrice || ingredient.vendor_info?.unitPrice || 0;

        const item = {
            id: Date.now(),
            ingredientId: ingredientId,
            ingredientName: ingredient.name,
            quantity: quantity,
            unit: ingredient.default_unit,
            unitPrice: price,
            lineTotal: quantity * price,
            packSize: ingredient.vendor_info?.packSize || '',
            vendorSKU: ingredient.vendor_info?.vendorSKU || '',
            received: false,
            receivedQuantity: 0,
            receivedDate: null,
            notes: ''
        };

        this.currentOrder.items.push(item);
        this.calculateOrderTotals();

        return item;
    }

    /**
     * Calculate order totals
     */
    calculateOrderTotals() {
        if (!this.currentOrder) return;

        const subtotal = this.currentOrder.items.reduce((sum, item) => sum + item.lineTotal, 0);
        const tax = subtotal * 0.08; // 8% tax (configurable)
        const shipping = this.currentOrder.shipping || 0;
        const total = subtotal + tax + shipping;

        this.currentOrder.subtotal = subtotal;
        this.currentOrder.tax = tax;
        this.currentOrder.total = total;
    }

    /**
     * Submit purchase order
     */
    submitPurchaseOrder(orderId = null) {
        const order = orderId ? this.purchaseOrders.find(o => o.id === orderId) : this.currentOrder;
        
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.items.length === 0) {
            throw new Error('Cannot submit empty order');
        }

        order.status = 'submitted';
        order.submittedAt = new Date().toISOString();

        // If this was current order, save it to orders list
        if (order === this.currentOrder) {
            this.purchaseOrders.push(order);
            this.currentOrder = null;
        }

        this.saveOrders();
        
        // Create notification/email (future enhancement)
        console.log('📧 Purchase order submitted:', order.poNumber);
        
        return order;
    }

    /**
     * Receive purchase order (mark as delivered)
     */
    receivePurchaseOrder(orderId, receivedItems = null) {
        const order = this.purchaseOrders.find(o => o.id === orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        order.status = 'received';
        order.receivedAt = new Date().toISOString();
        order.actualDeliveryDate = new Date().toISOString();

        // Update received quantities
        if (receivedItems) {
            receivedItems.forEach(received => {
                const item = order.items.find(i => i.id === received.itemId);
                if (item) {
                    item.received = true;
                    item.receivedQuantity = received.quantity;
                    item.receivedDate = new Date().toISOString();
                }
            });
        } else {
            // Mark all as received with ordered quantity
            order.items.forEach(item => {
                item.received = true;
                item.receivedQuantity = item.quantity;
                item.receivedDate = new Date().toISOString();
            });
        }

        this.saveOrders();

        // Auto-update inventory
        this.updateInventoryFromOrder(order);

        return order;
    }

    /**
     * Update inventory based on received order
     */
    updateInventoryFromOrder(order) {
        const userId = this.getCurrentUserId();
        const inventoryKey = userId ? `inventory_${userId}` : 'inventory';
        let inventory = JSON.parse(localStorage.getItem(inventoryKey) || '[]');

        order.items.forEach(item => {
            if (item.received && item.receivedQuantity > 0) {
                // Check if ingredient already in inventory
                const existingIndex = inventory.findIndex(inv => inv.ingredientId === item.ingredientId);

                if (existingIndex >= 0) {
                    // Update existing inventory item
                    inventory[existingIndex].quantity += item.receivedQuantity;
                    inventory[existingIndex].lastUpdated = new Date().toISOString();
                    inventory[existingIndex].lastRestocked = new Date().toISOString();
                } else {
                    // Add new inventory item
                    inventory.push({
                        id: Date.now() + Math.random(),
                        ingredientId: item.ingredientId,
                        ingredientName: item.ingredientName,
                        quantity: item.receivedQuantity,
                        unit: item.unit,
                        location: 'Dry Storage',
                        expirationDate: null,
                        lotNumber: order.poNumber,
                        receivedDate: item.receivedDate,
                        lastRestocked: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                        vendorId: order.vendorId,
                        vendorName: order.vendorName,
                        unitCost: item.unitPrice,
                        totalCost: item.lineTotal
                    });
                }
            }
        });

        localStorage.setItem(inventoryKey, JSON.stringify(inventory));
        console.log('✅ Inventory updated from order:', order.poNumber);
    }

    /**
     * Get ingredients by vendor
     */
    getIngredientsByVendor(vendorName) {
        const userId = this.getCurrentUserId();
        const ingredientsKey = userId ? `ingredients_${userId}` : 'iterum_ingredients';
        const ingredients = JSON.parse(localStorage.getItem(ingredientsKey) || '[]');
        
        return ingredients.filter(ing => 
            ing.primaryVendor === vendorName || 
            ing.vendor_info?.primaryVendor === vendorName ||
            ing.vendor_info?.alternateVendors?.includes(vendorName)
        );
    }

    /**
     * Get low stock ingredients (for automatic ordering)
     */
    getLowStockIngredients(threshold = 10) {
        const userId = this.getCurrentUserId();
        const inventoryKey = userId ? `inventory_${userId}` : 'inventory';
        const inventory = JSON.parse(localStorage.getItem(inventoryKey) || '[]');

        return inventory.filter(item => {
            const quantityNum = parseFloat(item.quantity) || 0;
            return quantityNum <= threshold;
        });
    }

    /**
     * Create purchase order from low stock items
     */
    createAutoOrderFromLowStock(vendorName, threshold = 10) {
        // Get low stock items for this vendor
        const lowStock = this.getLowStockIngredients(threshold);
        const vendorIngredients = this.getIngredientsByVendor(vendorName);
        
        // Find vendor
        const vendor = this.vendors.find(v => v.name === vendorName || v.company === vendorName);
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        // Create order
        const order = this.createPurchaseOrder(vendor.id, null, 'Auto-generated from low stock items');

        // Add low stock items that match this vendor
        lowStock.forEach(stockItem => {
            const ingredient = vendorIngredients.find(ing => ing.id === stockItem.ingredientId);
            if (ingredient) {
                // Calculate reorder quantity (2x current stock or minimum order)
                const currentStock = parseFloat(stockItem.quantity) || 0;
                const reorderQty = Math.max(currentStock * 2, 1);
                
                this.addItemToOrder(ingredient.id, reorderQty);
            }
        });

        return order;
    }

    /**
     * Generate PO number
     */
    generatePONumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const sequence = (this.purchaseOrders.length + 1).toString().padStart(4, '0');
        return `PO${year}${month}-${sequence}`;
    }

    /**
     * Get ingredient by ID
     */
    getIngredient(ingredientId) {
        const userId = this.getCurrentUserId();
        const ingredientsKey = userId ? `ingredients_${userId}` : 'iterum_ingredients';
        const ingredients = JSON.parse(localStorage.getItem(ingredientsKey) || '[]');
        return ingredients.find(ing => ing.id === ingredientId);
    }

    /**
     * Save orders to storage
     */
    saveOrders() {
        const userId = this.getCurrentUserId();
        const key = userId ? `purchase_orders_${userId}` : 'purchase_orders';
        localStorage.setItem(key, JSON.stringify(this.purchaseOrders));
        console.log('💾 Purchase orders saved');
    }

    /**
     * Get order statistics
     */
    getOrderStats() {
        const total = this.purchaseOrders.length;
        const draft = this.purchaseOrders.filter(o => o.status === 'draft').length;
        const submitted = this.purchaseOrders.filter(o => o.status === 'submitted').length;
        const received = this.purchaseOrders.filter(o => o.status === 'received').length;
        const cancelled = this.purchaseOrders.filter(o => o.status === 'cancelled').length;

        const totalValue = this.purchaseOrders.reduce((sum, order) => sum + order.total, 0);
        const pendingValue = this.purchaseOrders
            .filter(o => o.status === 'submitted')
            .reduce((sum, order) => sum + order.total, 0);

        return {
            total,
            draft,
            submitted,
            received,
            cancelled,
            totalValue,
            pendingValue
        };
    }

    /**
     * Get orders by vendor
     */
    getOrdersByVendor(vendorId) {
        return this.purchaseOrders.filter(o => o.vendorId === vendorId);
    }

    /**
     * Get orders by status
     */
    getOrdersByStatus(status) {
        return this.purchaseOrders.filter(o => o.status === status);
    }

    /**
     * Cancel purchase order
     */
    cancelOrder(orderId, reason = '') {
        const order = this.purchaseOrders.find(o => o.id === orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status === 'received') {
            throw new Error('Cannot cancel received order');
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date().toISOString();
        order.cancellationReason = reason;

        this.saveOrders();
        return order;
    }

    /**
     * Export order to PDF/Print
     */
    exportOrderToPDF(orderId) {
        const order = this.purchaseOrders.find(o => o.id === orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Generate printable HTML
        const html = this.generatePurchaseOrderHTML(order);
        
        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }

    /**
     * Generate HTML for purchase order
     */
    generatePurchaseOrderHTML(order) {
        const vendor = this.vendors.find(v => v.id === order.vendorId);
        const currentUser = this.getCurrentUser();

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Purchase Order ${order.poNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #4a7c2c; padding-bottom: 20px; }
                    .company-info h1 { margin: 0; color: #4a7c2c; }
                    .po-number { font-size: 24px; font-weight: bold; color: #4a7c2c; }
                    .section { margin-bottom: 20px; }
                    .section-title { font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background: #4a7c2c; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    .total-row { font-weight: bold; background: #f0f9ff; }
                    .grand-total { font-size: 18px; color: #4a7c2c; }
                    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-info">
                        <h1>🍃 Iterum Foods</h1>
                        <p>R&D Chef Notebook<br>Purchase Order System</p>
                    </div>
                    <div class="po-info">
                        <div class="po-number">PO #${order.poNumber}</div>
                        <div>Date: ${new Date(order.createdAt).toLocaleDateString()}</div>
                        <div>Status: ${order.status.toUpperCase()}</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Vendor Information</div>
                    <strong>${vendor?.company || order.vendorCompany}</strong><br>
                    ${vendor?.name || order.vendorName}<br>
                    ${vendor?.email || ''}<br>
                    ${vendor?.phone || ''}<br>
                    ${vendor?.street || ''} ${vendor?.city || ''}, ${vendor?.state || ''} ${vendor?.zip_code || ''}
                </div>

                <div class="section">
                    <div class="section-title">Order Details</div>
                    Expected Delivery: ${order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'TBD'}<br>
                    Ordered By: ${order.createdBy}<br>
                    Notes: ${order.notes || 'None'}
                </div>

                <div class="section">
                    <div class="section-title">Items Ordered</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Vendor SKU</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.ingredientName}</td>
                                    <td>${item.vendorSKU || '-'}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.unit}</td>
                                    <td>$${item.unitPrice.toFixed(2)}</td>
                                    <td>$${item.lineTotal.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td colspan="5" align="right">Subtotal:</td>
                                <td>$${order.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="5" align="right">Tax:</td>
                                <td>$${order.tax.toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="5" align="right">Shipping:</td>
                                <td>$${order.shipping.toFixed(2)}</td>
                            </tr>
                            <tr class="total-row grand-total">
                                <td colspan="5" align="right">TOTAL:</td>
                                <td>$${order.total.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="footer">
                    <p>This is an automatically generated purchase order from Iterum R&D Chef Notebook</p>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Get suggested reorder quantities based on usage
     */
    getSuggestedReorderQuantities(ingredientId) {
        // Get ingredient usage history
        const userId = this.getCurrentUserId();
        const recipesKey = userId ? `recipe_library_${userId}` : 'recipe_library';
        const recipes = JSON.parse(localStorage.getItem(recipesKey) || '[]');

        // Calculate average usage
        let totalUsage = 0;
        let usageCount = 0;

        recipes.forEach(recipe => {
            if (recipe.ingredients) {
                const ingredient = recipe.ingredients.find(ing => ing.id === ingredientId);
                if (ingredient) {
                    totalUsage += parseFloat(ingredient.amount) || 0;
                    usageCount++;
                }
            }
        });

        const avgUsage = usageCount > 0 ? totalUsage / usageCount : 0;
        const suggestedReorder = Math.ceil(avgUsage * 10); // 10x average usage

        return {
            averageUsage: avgUsage,
            usageCount: usageCount,
            suggestedReorder: suggestedReorder
        };
    }

    /**
     * Helper: Get current user ID
     */
    getCurrentUserId() {
        if (window.authLite?.getCurrentUser) {
            return window.authLite.getCurrentUser()?.id;
        }
        if (window.userDataManager?.getCurrentUserId) {
            return window.userDataManager.getCurrentUserId();
        }
        try {
            const user = JSON.parse(localStorage.getItem('current_user') || '{}');
            return user.id || null;
        } catch {
            return null;
        }
    }

    /**
     * Helper: Get current user name
     */
    getCurrentUserName() {
        if (window.authLite?.getCurrentUser) {
            return window.authLite.getCurrentUser()?.name || 'Unknown';
        }
        if (window.userDataManager?.getCurrentUserName) {
            return window.userDataManager.getCurrentUserName();
        }
        try {
            const user = JSON.parse(localStorage.getItem('current_user') || '{}');
            return user.name || 'Unknown';
        } catch {
            return 'Unknown';
        }
    }

    /**
     * Helper: Get current user
     */
    getCurrentUser() {
        if (window.authLite?.getCurrentUser) {
            return window.authLite.getCurrentUser();
        }
        if (window.userDataManager?.getCurrentUser) {
            return window.userDataManager.getCurrentUser();
        }
        try {
            return JSON.parse(localStorage.getItem('current_user') || '{}');
        } catch {
            return null;
        }
    }

    /**
     * Export order to CSV
     */
    exportOrderToCSV(orderId) {
        const order = this.purchaseOrders.find(o => o.id === orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const headers = ['Item', 'Vendor SKU', 'Quantity', 'Unit', 'Unit Price', 'Total'];
        const rows = order.items.map(item => [
            item.ingredientName,
            item.vendorSKU || '',
            item.quantity,
            item.unit,
            item.unitPrice.toFixed(2),
            item.lineTotal.toFixed(2)
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });
        csv += `\nSubtotal,,,,,$${order.subtotal.toFixed(2)}\n`;
        csv += `Tax,,,,,$${order.tax.toFixed(2)}\n`;
        csv += `Shipping,,,,,$${order.shipping.toFixed(2)}\n`;
        csv += `TOTAL,,,,,$${order.total.toFixed(2)}\n`;

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${order.poNumber}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Get vendor ordering statistics
     */
    getVendorOrderStats(vendorId) {
        const vendorOrders = this.getOrdersByVendor(vendorId);
        const totalOrders = vendorOrders.length;
        const totalSpent = vendorOrders
            .filter(o => o.status === 'received')
            .reduce((sum, order) => sum + order.total, 0);
        const pendingOrders = vendorOrders.filter(o => o.status === 'submitted').length;
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        return {
            totalOrders,
            totalSpent,
            pendingOrders,
            avgOrderValue,
            lastOrderDate: vendorOrders.length > 0 ? vendorOrders[vendorOrders.length - 1].createdAt : null
        };
    }
}

// Initialize and make globally available
setTimeout(() => {
    try {
        window.orderingSystem = new OrderingSystem();
        console.log('✅ Ordering System initialized');
    } catch (error) {
        console.error('❌ Ordering System initialization failed:', error);
    }
}, 200);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderingSystem;
}

