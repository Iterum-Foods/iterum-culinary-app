/**
 * Vendor URL Importer
 * Automatically extracts vendor information from website URLs
 */

class VendorURLImporter {
    constructor() {
        this.currentModal = null;
    }

    /**
     * Show add vendor modal with URL import
     */
    showAddVendorModal() {
        this.closeModal();

        const modal = document.createElement('div');
        modal.className = 'vendor-modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="window.vendorImporter.closeModal()"></div>
            <div class="modal-content">
                <!-- Header -->
                <div class="modal-header">
                    <div>
                        <h2>Add New Vendor</h2>
                        <p>Enter vendor URL for automatic import or fill details manually</p>
                    </div>
                    <button class="modal-close" onclick="window.vendorImporter.closeModal()">✕</button>
                </div>

                <!-- Body -->
                <div class="modal-body">
                    <!-- URL Import Section -->
                    <div class="url-import-section">
                        <label class="form-label">
                            🌐 Import from Website URL
                            <span class="label-badge">Smart Import</span>
                        </label>
                        <div class="url-input-group">
                            <input type="url" id="vendor-website-url" class="form-input" 
                                   placeholder="https://vendorwebsite.com"
                                   onkeypress="if(event.key==='Enter') window.vendorImporter.importFromURL()">
                            <button class="btn-fetch" onclick="window.vendorImporter.importFromURL()">
                                <span>🔍</span>
                                <span>Fetch Info</span>
                            </button>
                        </div>
                        <div class="url-hint">
                            💡 We'll automatically extract: Company name, description, contact info, and more
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div id="url-loading" class="url-loading" style="display: none;">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Fetching vendor information...</div>
                    </div>

                    <!-- OR Divider -->
                    <div class="or-divider">
                        <span>OR</span>
                    </div>

                    <!-- Manual Entry Form -->
                    <form id="vendor-form" onsubmit="window.vendorImporter.handleSubmit(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Vendor Name <span class="required">*</span></label>
                                <input type="text" id="vendor-name" class="form-input" 
                                       placeholder="ACME Foods" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <select id="vendor-category" class="form-select">
                                    <option value="">Select Category...</option>
                                    <option value="produce">Produce</option>
                                    <option value="protein">Protein/Meat</option>
                                    <option value="dairy">Dairy</option>
                                    <option value="dry-goods">Dry Goods</option>
                                    <option value="beverage">Beverage</option>
                                    <option value="seafood">Seafood</option>
                                    <option value="specialty">Specialty Items</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea id="vendor-description" class="form-textarea" rows="2"
                                      placeholder="Brief description of products/services"></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Contact Name</label>
                                <input type="text" id="vendor-contact-name" class="form-input" 
                                       placeholder="John Smith">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="vendor-email" class="form-input" 
                                       placeholder="contact@vendor.com">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Phone</label>
                                <input type="tel" id="vendor-phone" class="form-input" 
                                       placeholder="(555) 123-4567">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Website</label>
                                <input type="url" id="vendor-website" class="form-input" 
                                       placeholder="https://vendor.com">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Address</label>
                            <input type="text" id="vendor-address" class="form-input" 
                                   placeholder="123 Main St, City, State ZIP">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Minimum Order</label>
                                <input type="text" id="vendor-min-order" class="form-input" 
                                       placeholder="$500">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Payment Terms</label>
                                <select id="vendor-payment-terms" class="form-select">
                                    <option value="">Select Terms...</option>
                                    <option value="net-30">Net 30</option>
                                    <option value="net-60">Net 60</option>
                                    <option value="cod">COD</option>
                                    <option value="prepay">Prepay</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea id="vendor-notes" class="form-textarea" rows="2"
                                      placeholder="Additional notes about this vendor"></textarea>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="window.vendorImporter.closeModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn-primary">
                                <span>✓</span>
                                <span>Add Vendor</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.addModalStyles();
        document.body.appendChild(modal);
        this.currentModal = modal;

        // Animate in
        setTimeout(() => modal.classList.add('show'), 10);

        // Focus URL input
        setTimeout(() => document.getElementById('vendor-website-url')?.focus(), 100);
    }

    /**
     * Import vendor info from URL
     */
    async importFromURL() {
        const urlInput = document.getElementById('vendor-website-url');
        const url = urlInput?.value.trim();

        if (!url) {
            alert('Please enter a vendor website URL');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch (e) {
            alert('Please enter a valid URL (e.g., https://vendorwebsite.com)');
            return;
        }

        // Show loading
        const loadingEl = document.getElementById('url-loading');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        }

        try {
            // Fetch vendor information
            const vendorInfo = await this.fetchVendorInfo(url);
            
            // Hide loading
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }

            // Pre-fill form
            this.prefillForm(vendorInfo);

            // Show success message
            this.showToast('✅ Vendor information imported! Review and save.', 'success');

            // Track analytics
            if (window.analyticsTracker) {
                window.analyticsTracker.trackCustomEvent('vendor_imported_from_url', {
                    success: true,
                    url_domain: new URL(url).hostname
                });
            }

        } catch (error) {
            console.error('Error importing vendor:', error);
            
            // Hide loading
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }

            // Try to extract at least the domain as vendor name
            const domain = new URL(url).hostname.replace('www.', '');
            const vendorName = domain.split('.')[0];
            
            document.getElementById('vendor-name').value = vendorName.charAt(0).toUpperCase() + vendorName.slice(1);
            document.getElementById('vendor-website').value = url;

            this.showToast('⚠️ Could not auto-import all details. Please fill in manually.', 'warning');
        }
    }

    /**
     * Fetch vendor information from URL
     */
    async fetchVendorInfo(url) {
        // Use CORS proxy for fetching external websites
        const corsProxy = 'https://api.allorigins.win/get?url=';
        const proxyUrl = corsProxy + encodeURIComponent(url);

        const response = await fetch(proxyUrl);
        const data = await response.json();
        const html = data.contents;

        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract information
        const vendorInfo = {
            name: '',
            description: '',
            email: '',
            phone: '',
            address: '',
            website: url
        };

        // Extract title (often company name)
        const titleTag = doc.querySelector('title');
        if (titleTag) {
            vendorInfo.name = titleTag.textContent.split('|')[0].split('-')[0].trim();
        }

        // Extract meta description
        const metaDesc = doc.querySelector('meta[name="description"]') || 
                        doc.querySelector('meta[property="og:description"]');
        if (metaDesc) {
            vendorInfo.description = metaDesc.content;
        }

        // Extract email (look for mailto links or text patterns)
        const mailtoLink = doc.querySelector('a[href^="mailto:"]');
        if (mailtoLink) {
            vendorInfo.email = mailtoLink.href.replace('mailto:', '').split('?')[0];
        } else {
            // Try to find email in text
            const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            const bodyText = doc.body?.textContent || '';
            const emailMatch = bodyText.match(emailPattern);
            if (emailMatch) {
                vendorInfo.email = emailMatch[0];
            }
        }

        // Extract phone (look for tel links or patterns)
        const telLink = doc.querySelector('a[href^="tel:"]');
        if (telLink) {
            vendorInfo.phone = telLink.textContent.trim();
        } else {
            // Try to find phone in text
            const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
            const bodyText = doc.body?.textContent || '';
            const phoneMatch = bodyText.match(phonePattern);
            if (phoneMatch) {
                vendorInfo.phone = phoneMatch[0];
            }
        }

        // Extract address (look for common patterns)
        const addressSelectors = [
            '[itemtype*="PostalAddress"]',
            '.address',
            '#address',
            '[class*="contact"] address',
            '.footer address'
        ];

        for (const selector of addressSelectors) {
            const addressEl = doc.querySelector(selector);
            if (addressEl) {
                vendorInfo.address = addressEl.textContent.trim().replace(/\s+/g, ' ');
                break;
            }
        }

        // Extract from Open Graph tags
        const ogTitle = doc.querySelector('meta[property="og:title"]');
        if (ogTitle && !vendorInfo.name) {
            vendorInfo.name = ogTitle.content;
        }

        const ogSiteName = doc.querySelector('meta[property="og:site_name"]');
        if (ogSiteName && !vendorInfo.name) {
            vendorInfo.name = ogSiteName.content;
        }

        // Fallback: Use domain name
        if (!vendorInfo.name) {
            const domain = new URL(url).hostname.replace('www.', '');
            vendorInfo.name = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        }

        console.log('✅ Extracted vendor info:', vendorInfo);
        return vendorInfo;
    }

    /**
     * Pre-fill form with extracted data
     */
    prefillForm(vendorInfo) {
        const fields = {
            'vendor-name': vendorInfo.name,
            'vendor-description': vendorInfo.description,
            'vendor-email': vendorInfo.email,
            'vendor-phone': vendorInfo.phone,
            'vendor-address': vendorInfo.address,
            'vendor-website': vendorInfo.website
        };

        for (const [fieldId, value] of Object.entries(fields)) {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
                // Highlight pre-filled fields
                field.style.background = '#f0fdf4';
                setTimeout(() => {
                    field.style.background = '';
                }, 2000);
            }
        }
    }

    /**
     * Handle form submission
     */
    handleSubmit(event) {
        event.preventDefault();

        const vendor = {
            id: 'vendor_' + Date.now(),
            name: document.getElementById('vendor-name').value.trim(),
            category: document.getElementById('vendor-category').value,
            description: document.getElementById('vendor-description').value.trim(),
            contactName: document.getElementById('vendor-contact-name').value.trim(),
            email: document.getElementById('vendor-email').value.trim(),
            phone: document.getElementById('vendor-phone').value.trim(),
            website: document.getElementById('vendor-website').value.trim(),
            address: document.getElementById('vendor-address').value.trim(),
            minOrder: document.getElementById('vendor-min-order').value.trim(),
            paymentTerms: document.getElementById('vendor-payment-terms').value,
            notes: document.getElementById('vendor-notes').value.trim(),
            status: 'active',
            createdAt: new Date().toISOString()
        };

        if (!vendor.name) {
            alert('Please enter a vendor name');
            return;
        }

        // Convert to vendorManager format
        const vendorForManager = {
            id: Date.now(),
            name: vendor.name,
            company: vendor.name, // Use name as company if not specified
            email: vendor.email,
            phone: vendor.phone,
            mobile: '',
            fax: '',
            website: vendor.website,
            street: vendor.address,
            city: '',
            state: '',
            zip_code: '',
            specialties: vendor.category ? [vendor.category] : [],
            notes: `${vendor.description || ''}\n${vendor.notes || ''}`.trim(),
            is_active: vendor.status === 'active',
            created_at: vendor.createdAt
        };

        // Integrate with vendorManager if available
        if (window.vendorManager) {
            window.vendorManager.vendors.push(vendorForManager);
            window.vendorManager.saveVendorsToFile();
            console.log('✅ Vendor added via URL importer and integrated with vendorManager');
            
            // Refresh the display
            setTimeout(() => {
                window.vendorManager.updateVendorCount();
                window.vendorManager.displayVendors();
                window.vendorManager.updateFilters();
            }, 100);
        } else {
            // Fallback to direct localStorage
            const vendors = JSON.parse(localStorage.getItem('iterum_vendors') || '[]');
            vendors.push(vendorForManager);
            localStorage.setItem('iterum_vendors', JSON.stringify(vendors));
            console.log('✅ Vendor added directly to localStorage');
        }

        // Track analytics
        if (window.analyticsTracker) {
            window.analyticsTracker.trackCustomEvent('vendor_created', {
                method: vendor.website ? 'url_import' : 'manual',
                category: vendor.category
            });
        }

        // Show success
        this.showToast('✅ Vendor added successfully!', 'success');
        this.closeModal();

        // Refresh vendor list if function exists
        if (typeof loadVendors === 'function') {
            loadVendors();
        }

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('vendorAdded', { detail: vendor }));
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('show');
            setTimeout(() => {
                this.currentModal?.remove();
                this.currentModal = null;
            }, 200);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `vendor-toast vendor-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
            </div>
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Add modal styles
     */
    addModalStyles() {
        if (document.getElementById('vendor-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'vendor-modal-styles';
        styles.textContent = `
            .vendor-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .vendor-modal-overlay.show {
                opacity: 1;
            }

            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
            }

            .modal-content {
                position: relative;
                background: white;
                border-radius: 20px;
                max-width: 800px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .vendor-modal-overlay.show .modal-content {
                transform: scale(1);
            }

            .modal-header {
                padding: 30px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }

            .modal-header h2 {
                font-size: 1.75rem;
                font-weight: 800;
                margin: 0 0 6px 0;
            }

            .modal-header p {
                font-size: 0.9375rem;
                opacity: 0.95;
                margin: 0;
            }

            .modal-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 24px;
                transition: all 0.2s;
            }

            .modal-close:hover {
                background: rgba(255,255,255,0.3);
            }

            .modal-body {
                padding: 30px;
            }

            .url-import-section {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 2px solid #3b82f6;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 24px;
            }

            .form-label {
                display: block;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 8px;
                font-size: 0.9375rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .label-badge {
                background: #3b82f6;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 700;
            }

            .url-input-group {
                display: flex;
                gap: 12px;
                margin-bottom: 12px;
            }

            .url-input-group .form-input {
                flex: 1;
            }

            .btn-fetch {
                padding: 12px 20px;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
            }

            .btn-fetch:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(59,130,246,0.3);
            }

            .url-hint {
                color: #1e40af;
                font-size: 0.875rem;
                font-style: italic;
            }

            .url-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 40px;
                background: #f8fafc;
                border-radius: 12px;
                margin-bottom: 24px;
            }

            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #e5e7eb;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-bottom: 16px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loading-text {
                color: #64748b;
                font-weight: 600;
            }

            .or-divider {
                text-align: center;
                margin: 30px 0;
                position: relative;
            }

            .or-divider::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                width: 100%;
                height: 2px;
                background: #e5e7eb;
                z-index: 0;
            }

            .or-divider span {
                background: white;
                padding: 0 20px;
                color: #64748b;
                font-weight: 600;
                position: relative;
                z-index: 1;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-input, .form-select, .form-textarea {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                font-size: 15px;
                font-family: 'Inter', sans-serif;
                transition: all 0.2s;
            }

            .form-input:focus, .form-select:focus, .form-textarea:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
            }

            .form-textarea {
                resize: vertical;
            }

            .required {
                color: #ef4444;
            }

            .modal-actions {
                display: flex;
                gap: 12px;
                margin-top: 30px;
                justify-content: flex-end;
                padding-top: 20px;
                border-top: 2px solid #f3f4f6;
            }

            .btn-primary, .btn-secondary {
                padding: 12px 24px;
                border-radius: 10px;
                border: none;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .btn-primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(99,102,241,0.3);
            }

            .btn-secondary {
                background: #f3f4f6;
                color: #1e293b;
            }

            .btn-secondary:hover {
                background: #e5e7eb;
            }

            .vendor-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                padding: 16px 20px;
                z-index: 10000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                border-left: 4px solid #3b82f6;
            }

            .vendor-toast.vendor-toast-success {
                border-left-color: #16a34a;
            }

            .vendor-toast.vendor-toast-warning {
                border-left-color: #f59e0b;
            }

            .vendor-toast.show {
                opacity: 1;
                transform: translateX(0);
            }

            .toast-message {
                font-weight: 600;
                color: #1e293b;
            }

            @media (max-width: 768px) {
                .form-row {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// Create global instance
window.vendorImporter = new VendorURLImporter();

