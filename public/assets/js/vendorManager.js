/**
 * Vendor Management System for Iterum R&D Chef Notebook
 * Handles vendor CRUD operations, bulk import/export, and management
 */

class VendorManager {
    constructor() {
        this.vendors = [];
        this.selectedVendors = new Set();
        this.currentView = 'list';
        this.currentFilters = {
            search: '',
            company: '',
            city: '',
            state: '',
            status: 'all'
        };
        
        this.init();
    }
    
    init() {
        console.log('🏪 Initializing Vendor Manager...');
        this.setupEventListeners();
        this.loadVendors();
        this.updateVendorCount();
    }
    
    setupEventListeners() {
        // Add vendor button
        const addVendorBtn = document.getElementById('add-vendor-btn');
        if (addVendorBtn) {
            addVendorBtn.addEventListener('click', () => this.showAddVendorModal());
        }
        
        // Import vendors button
        const importVendorsBtn = document.getElementById('import-vendors-btn');
        if (importVendorsBtn) {
            importVendorsBtn.addEventListener('click', () => this.showImportModal());
        }
        
        // Export vendors button
        const exportVendorsBtn = document.getElementById('export-vendors-btn');
        if (exportVendorsBtn) {
            exportVendorsBtn.addEventListener('click', () => this.exportVendors());
        }
        
        // Bulk actions
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteVendors());
        }
        
        const bulkEditBtn = document.getElementById('bulk-edit-btn');
        if (bulkEditBtn) {
            bulkEditBtn.addEventListener('click', () => this.bulkEditVendors());
        }
        
        // Search and filters
        const searchInput = document.getElementById('vendor-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.filterVendors(), 300));
        }
        
        const companyFilter = document.getElementById('company-filter');
        if (companyFilter) {
            companyFilter.addEventListener('change', () => this.filterVendors());
        }
        
        const cityFilter = document.getElementById('city-filter');
        if (cityFilter) {
            cityFilter.addEventListener('change', () => this.filterVendors());
        }
        
        const stateFilter = document.getElementById('state-filter');
        if (stateFilter) {
            stateFilter.addEventListener('change', () => this.filterVendors());
        }
        
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterVendors());
        }
        
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-vendors');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        }
    }
    
    async loadVendors() {
        try {
            console.log('🔍 Loading vendors...');
            
            // Try to load from backend API first
            const response = await fetch('/api/vendors/');
            if (response.ok) {
                const data = await response.json();
                this.vendors = data.vendors || [];
                console.log(`✅ Loaded ${this.vendors.length} vendors from API`);
            } else {
                console.log('⚠️ API not available, trying user file storage');
                // Try to load from user file storage
                if (!this.loadVendorsFromFile()) {
                    console.log('📁 No user file found, using sample data');
                    this.loadSampleVendors();
                }
            }
            
            this.updateVendorCount();
            this.displayVendors();
            this.updateFilters();
            
        } catch (error) {
            console.error('❌ Error loading vendors:', error);
            // Try to load from user file storage
            if (!this.loadVendorsFromFile()) {
                console.log('📁 No user file found, using sample data');
                this.loadSampleVendors();
            }
        }
    }
    
    loadSampleVendors() {
        // Sample vendor data for demonstration
        this.vendors = [
            {
                id: 1,
                name: 'John Smith',
                company: 'Fresh Foods Inc',
                email: 'john@freshfoods.com',
                phone: '555-1234',
                mobile: '555-5678',
                city: 'Boston',
                state: 'MA',
                zip_code: '02101',
                specialties: ['produce', 'dairy'],
                notes: 'Reliable supplier for fresh produce',
                products: [
                    { name: 'Heirloom Tomatoes', packSize: '10 lb flat', unitCost: 36.5, sku: 'PRD-HT10', notes: 'Peak season June-Aug' },
                    { name: 'European Butter', packSize: '1 lb blocks (case of 12)', unitCost: 54.0, sku: 'DRY-EB12', notes: 'Plugra unsalted' }
                ],
                invoiceAttachment: null,
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Sarah Johnson',
                company: 'Quality Meats Co',
                email: 'sarah@qualitymeats.com',
                phone: '555-2345',
                mobile: '555-6789',
                city: 'Chicago',
                state: 'IL',
                zip_code: '60601',
                specialties: ['meat', 'poultry'],
                notes: 'Premium meat supplier',
                products: [
                    { name: 'Prime Ribeye', packSize: '15 lb case', unitCost: 198.0, sku: 'MEAT-PR15', notes: 'Aged 21 days' },
                    { name: 'Airline Chicken Breast', packSize: '10 lb case', unitCost: 62.5, sku: 'POUL-AL10', notes: '8 oz portions' }
                ],
                invoiceAttachment: null,
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Mike Chen',
                company: 'Asian Spices Ltd',
                email: 'mike@asianspices.com',
                phone: '555-3456',
                mobile: '555-7890',
                city: 'Los Angeles',
                state: 'CA',
                zip_code: '90001',
                specialties: ['spices', 'asian ingredients'],
                notes: 'Specialized in Asian ingredients',
                products: [
                    { name: 'Szechuan Peppercorn', packSize: '2 lb bag', unitCost: 24.0, sku: 'SPC-SZ2', notes: 'High-voltage heat' },
                    { name: 'Yuzu Juice', packSize: '6 x 720ml', unitCost: 78.0, sku: 'SPC-YZ6', notes: 'Frozen, keep chilled' }
                ],
                invoiceAttachment: null,
                is_active: true,
                created_at: new Date().toISOString()
            }
        ];
        
        // Save sample vendors to user file
        this.saveVendorsToFile();
    }
    
    saveVendorsToFile() {
        // Use user-specific file storage first, fallback to localStorage
        if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
            const userId = window.userDataManager.getCurrentUserId();
            const filename = `user_${userId}_vendors.json`;
            window.userDataManager.saveUserFile(filename, this.vendors);
            console.log(`💾 Saved ${this.vendors.length} vendors to user file`);
        } else {
            // Fallback to localStorage
            localStorage.setItem('iterum_vendors', JSON.stringify(this.vendors));
            console.log(`💾 Saved ${this.vendors.length} vendors to localStorage`);
        }
    }
    
    loadVendorsFromFile() {
        // Use user-specific file storage first, fallback to localStorage
        if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
            const userId = window.userDataManager.getCurrentUserId();
            const filename = `user_${userId}_vendors.json`;
            const loadedVendors = window.userDataManager.loadUserFile(filename);
            if (loadedVendors && Array.isArray(loadedVendors)) {
                this.vendors = loadedVendors;
                console.log(`📖 Loaded ${this.vendors.length} vendors from user file`);
                return true;
            }
        } else {
            // Fallback to localStorage
            const storedVendors = localStorage.getItem('iterum_vendors');
            if (storedVendors) {
                this.vendors = JSON.parse(storedVendors);
                console.log(`📖 Loaded ${this.vendors.length} vendors from localStorage`);
                return true;
            }
        }
        return false;
    }
    
    displayVendors() {
        const container = document.getElementById('vendors-container');
        if (!container) {
            console.error('❌ Vendors container not found!');
            return;
        }
        
        console.log(`📊 Displaying ${this.vendors.length} vendors`);
        
        if (this.vendors.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏪</div>
                    <h3 class="empty-state-title">No Vendors Found</h3>
                    <p class="empty-state-description">Get started by adding your first vendor or importing from Excel/CSV.</p>
                    <div class="empty-state-actions">
                        <button onclick="vendorManager.showAddVendorModal()" class="btn btn-primary">
                            ➕ Add First Vendor
                        </button>
                        <button onclick="vendorManager.showImportModal()" class="btn btn-secondary">
                            📥 Import Vendors
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const filteredVendors = this.getFilteredVendors();
        
        container.innerHTML = `
            <div class="vendors-table-container">
                <table class="vendors-table">
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" id="select-all-vendors" class="vendor-checkbox">
                            </th>
                            <th>Vendor</th>
                            <th>Company</th>
                            <th>Contact</th>
                            <th>Location</th>
                            <th>Specialties</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredVendors.map(vendor => this.renderVendorRow(vendor)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Re-attach event listeners
        this.attachRowEventListeners();
    }
    
    renderVendorRow(vendor) {
        const isSelected = this.selectedVendors.has(vendor.id);
        const specialties = Array.isArray(vendor.specialties) ? vendor.specialties : [];
        const specialtyBadges = specialties.length
            ? specialties.map((item) => `<span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">${this.escapeHtml(item)}</span>`).join('')
            : '<span class="text-xs text-slate-400">No specialties</span>';
        const productBadge = Array.isArray(vendor.products) && vendor.products.length
            ? `<span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">🧾 ${vendor.products.length} item${vendor.products.length === 1 ? '' : 's'}</span>`
            : '';
        const invoiceBadge = vendor.invoiceAttachment
            ? '<span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">📎 Invoice</span>'
            : '';
        const statusClass = vendor.is_active ? 'status-active' : 'status-inactive';
        const statusText = vendor.is_active ? 'Active' : 'Inactive';
        
        return `
            <tr class="vendor-row ${isSelected ? 'selected' : ''}" data-vendor-id="${vendor.id}">
                <td>
                    <input type="checkbox" class="vendor-checkbox" value="${vendor.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td>
                    <div class="vendor-info">
                        <div class="vendor-name">${this.escapeHtml(vendor.name)}</div>
                        <div class="vendor-email">${vendor.email ? this.escapeHtml(vendor.email) : 'No email'}</div>
                    </div>
                </td>
                <td>
                    <div class="company-info">
                        <div class="company-name">${vendor.company ? this.escapeHtml(vendor.company) : 'No company'}</div>
                        <div class="company-website">${vendor.website ? `<a href="${vendor.website}" target="_blank">${this.escapeHtml(vendor.website)}</a>` : 'No website'}</div>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        <div class="contact-phone">${vendor.phone ? this.escapeHtml(vendor.phone) : 'No phone'}</div>
                        <div class="contact-mobile">${vendor.mobile ? this.escapeHtml(vendor.mobile) : 'No mobile'}</div>
                    </div>
                </td>
                <td>
                    <div class="location-info">
                        <div class="location-city">${vendor.city ? this.escapeHtml(vendor.city) : 'No city'}</div>
                        <div class="location-state">${vendor.state ? this.escapeHtml(vendor.state) : 'No state'}</div>
                    </div>
                </td>
                <td>
                    <div class="flex flex-wrap gap-2">
                        ${productBadge}
                        ${invoiceBadge}
                        ${specialtyBadges}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="vendor-actions">
                        <button onclick="vendorManager.viewVendorProfile('${vendor.id}')" class="btn btn-sm btn-primary" title="View Profile">
                            👁️ View
                        </button>
                        <button onclick="vendorManager.editVendor(${vendor.id})" class="btn btn-sm btn-secondary">
                            ✏️ Edit
                        </button>
                        <button onclick="vendorManager.deleteVendor(${vendor.id})" class="btn btn-sm btn-danger">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    attachRowEventListeners() {
        // Checkbox selection
        document.querySelectorAll('.vendor-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const vendorId = parseInt(e.target.value);
                if (e.target.checked) {
                    this.selectedVendors.add(vendorId);
                } else {
                    this.selectedVendors.delete(vendorId);
                }
                this.updateBulkActions();
                this.updateRowSelection(vendorId, e.target.checked);
            });
        });
        
        // Select all functionality
        const selectAllCheckbox = document.getElementById('select-all-vendors');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }
    }
    
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.vendor-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const vendorId = parseInt(checkbox.value);
            if (checked) {
                this.selectedVendors.add(vendorId);
            } else {
                this.selectedVendors.delete(vendorId);
            }
            this.updateRowSelection(vendorId, checked);
        });
        this.updateBulkActions();
    }
    
    updateRowSelection(vendorId, selected) {
        const row = document.querySelector(`[data-vendor-id="${vendorId}"]`);
        if (row) {
            row.classList.toggle('selected', selected);
        }
    }
    
    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        if (!bulkActions) return;
        
        const hasSelection = this.selectedVendors.size > 0;
        bulkActions.style.display = hasSelection ? 'flex' : 'none';
        
        if (hasSelection) {
            const countElement = document.getElementById('selected-count');
            if (countElement) {
                countElement.textContent = this.selectedVendors.size;
            }
        }
    }
    
    escapeHtml(text) {
        if (text === null || text === undefined) {
            return '';
        }
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    getFilteredVendors() {
        let filtered = [...this.vendors];
        
        // Search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(vendor => 
                vendor.name.toLowerCase().includes(searchTerm) ||
                vendor.company?.toLowerCase().includes(searchTerm) ||
                vendor.email?.toLowerCase().includes(searchTerm) ||
                vendor.city?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Company filter
        if (this.currentFilters.company) {
            filtered = filtered.filter(vendor => 
                vendor.company === this.currentFilters.company
            );
        }
        
        // City filter
        if (this.currentFilters.city) {
            filtered = filtered.filter(vendor => 
                vendor.city === this.currentFilters.city
            );
        }
        
        // State filter
        if (this.currentFilters.state) {
            filtered = filtered.filter(vendor => 
                vendor.state === this.currentFilters.state
            );
        }
        
        // Status filter
        if (this.currentFilters.status !== 'all') {
            const isActive = this.currentFilters.status === 'active';
            filtered = filtered.filter(vendor => vendor.is_active === isActive);
        }
        
        return filtered;
    }
    
    filterVendors() {
        // Update filters from form inputs
        const searchInput = document.getElementById('vendor-search');
        const companyFilter = document.getElementById('company-filter');
        const cityFilter = document.getElementById('city-filter');
        const stateFilter = document.getElementById('state-filter');
        const statusFilter = document.getElementById('status-filter');
        
        if (searchInput) this.currentFilters.search = searchInput.value;
        if (companyFilter) this.currentFilters.company = companyFilter.value;
        if (cityFilter) this.currentFilters.city = cityFilter.value;
        if (stateFilter) this.currentFilters.state = stateFilter.value;
        if (statusFilter) this.currentFilters.status = statusFilter.value;
        
        this.displayVendors();
    }
    
    updateFilters() {
        // Get unique values for filter dropdowns
        const companies = [...new Set(this.vendors.map(v => v.company).filter(Boolean))];
        const cities = [...new Set(this.vendors.map(v => v.city).filter(Boolean))];
        const states = [...new Set(this.vendors.map(v => v.state).filter(Boolean))];
        
        // Update company filter
        const companyFilter = document.getElementById('company-filter');
        if (companyFilter) {
            companyFilter.innerHTML = `
                <option value="">All Companies</option>
                ${companies.map(company => `<option value="${company}">${company}</option>`).join('')}
            `;
        }
        
        // Update city filter
        const cityFilter = document.getElementById('city-filter');
        if (cityFilter) {
            cityFilter.innerHTML = `
                <option value="">All Cities</option>
                ${cities.map(city => `<option value="${city}">${city}</option>`).join('')}
            `;
        }
        
        // Update state filter
        const stateFilter = document.getElementById('state-filter');
        if (stateFilter) {
            stateFilter.innerHTML = `
                <option value="">All States</option>
                ${states.map(state => `<option value="${state}">${state}</state>`).join('')}
            `;
        }
    }
    
    updateVendorCount() {
        const countElement = document.getElementById('vendor-count');
        if (countElement) {
            countElement.textContent = this.vendors.length;
        }
    }
    
    showAddVendorModal() {
        this.showVendorModal('add');
    }
    
    showVendorModal(mode = 'add', vendor = null) {
        const modal = this.createVendorModal(mode, vendor);
        if (modal) {
            document.body.appendChild(modal);
            this.initializeVendorModal(modal, vendor);
            
            // Show modal with animation
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
            
            console.log(`✅ Vendor ${mode} modal displayed`);
        }
    }
    
    createVendorModal(mode, vendor) {
        const isEdit = mode === 'edit';
        const title = isEdit ? 'Edit Vendor' : 'Add New Vendor';
        const buttonText = isEdit ? 'Update Vendor' : 'Add Vendor';
        
        const modal = document.createElement('div');
        modal.className = 'vendor-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
        modal.setAttribute('data-modal', 'vendor');
        
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 class="text-xl font-semibold text-gray-900">${title}</h2>
                    <p class="text-sm text-gray-600 mt-1">${isEdit ? 'Update vendor information' : 'Add a new vendor to your system'}</p>
                </div>
                
                <div class="p-6">
                    <form id="vendor-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="vendor-name" class="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input type="text" id="vendor-name" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter vendor name"
                                       value="${vendor?.name || ''}">
                            </div>
                            
                            <div>
                                <label for="vendor-company" class="block text-sm font-medium text-gray-700 mb-1">
                                    Company
                                </label>
                                <input type="text" id="vendor-company"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter company name"
                                       value="${vendor?.company || ''}">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="vendor-email" class="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input type="email" id="vendor-email"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter email address"
                                       value="${vendor?.email || ''}">
                            </div>
                            
                            <div>
                                <label for="vendor-phone" class="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input type="tel" id="vendor-phone"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter phone number"
                                       value="${vendor?.phone || ''}">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="vendor-mobile" class="block text-sm font-medium text-gray-700 mb-1">
                                    Mobile
                                </label>
                                <input type="tel" id="vendor-mobile"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter mobile number"
                                       value="${vendor?.mobile || ''}">
                            </div>
                            
                            <div>
                                <label for="vendor-website" class="block text-sm font-medium text-gray-700 mb-1">
                                    Website
                                </label>
                                <input type="url" id="vendor-website"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter website URL"
                                       value="${vendor?.website || ''}">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="vendor-street" class="block text-sm font-medium text-gray-700 mb-1">
                                    Street
                                </label>
                                <input type="text" id="vendor-street"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter street address"
                                       value="${vendor?.street || ''}">
                            </div>
                            
                            <div>
                                <label for="vendor-city" class="block text-sm font-medium text-gray-700 mb-1">
                                    City
                                </label>
                                <input type="text" id="vendor-city"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter city"
                                       value="${vendor?.city || ''}">
                            </div>
                            
                            <div>
                                <label for="vendor-state" class="block text-sm font-medium text-gray-700 mb-1">
                                    State
                                </label>
                                <input type="text" id="vendor-state"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter state"
                                       value="${vendor?.state || ''}">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="vendor-zip" class="block text-sm font-medium text-gray-700 mb-1">
                                    ZIP Code
                                </label>
                                <input type="text" id="vendor-zip"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="Enter ZIP code"
                                       value="${vendor?.zip_code || ''}">
                            </div>
                            
                            <div>
                                <label for="vendor-specialties" class="block text-sm font-medium text-gray-700 mb-1">
                                    Specialties
                                </label>
                                <input type="text" id="vendor-specialties"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="e.g., produce, dairy, meat"
                                       value="${vendor?.specialties?.join(', ') || ''}">
                            </div>
                        </div>
                        
                        <div>
                            <label for="vendor-notes" class="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea id="vendor-notes" rows="3"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Enter any additional notes about this vendor">${vendor?.notes || ''}</textarea>
                        </div>

                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="block text-sm font-medium text-gray-700">
                                    Signature products & pricing
                                </label>
                                <button type="button" data-action="add-product" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200 transition">
                                    ➕ Add item
                                </button>
                            </div>
                            <p class="text-xs text-gray-500">Track the items you rely on from this vendor—pack sizes, SKUs, and current pricing stay at your fingertips.</p>
                            <div id="vendor-products-list" class="space-y-3"></div>
                        </div>

                        <div class="mt-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Latest invoice or quote snapshot
                            </label>
                            <div id="vendor-invoice-dropzone" class="relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 text-center bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer">
                                <input type="file" id="vendor-invoice-file" accept="image/*,application/pdf" class="hidden">
                                <div class="text-3xl">📎</div>
                                <div class="text-sm font-medium text-gray-700">Drag & drop or click to attach</div>
                                <p class="text-xs text-gray-500">We'll keep a snapshot with the vendor so you can reference pricing quickly.</p>
                            </div>
                            <div id="vendor-invoice-preview" class="mt-3"></div>
                        </div>
                        
                        <div class="flex items-center">
                            <input type="checkbox" id="vendor-active" class="mr-2"
                                   ${vendor?.is_active !== false ? 'checked' : ''}>
                            <label for="vendor-active" class="text-sm text-gray-700">
                                Vendor is active
                            </label>
                        </div>
                    </form>
                    
                    <div class="flex space-x-3 pt-6">
                        <button onclick="vendorManager.saveVendor()" 
                                class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                            ${buttonText}
                        </button>
                        <button onclick="vendorManager.closeVendorModal()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    initializeVendorModal(modal, vendor = {}) {
        if (!modal) {
            return;
        }
        if (vendor?.id) {
            modal.dataset.vendorId = vendor.id;
        }
        const productContainer = modal.querySelector('#vendor-products-list');
        const addProductButton = modal.querySelector('[data-action="add-product"]');
        const existingProducts = Array.isArray(vendor?.products) ? vendor.products : [];
        if (productContainer) {
            productContainer.innerHTML = '';
            if (existingProducts.length) {
                existingProducts.forEach(product => this.addProductRow(productContainer, product));
            } else {
                this.addProductRow(productContainer);
            }
            productContainer.addEventListener('click', (event) => {
                const removeButton = event.target.closest('[data-action="remove-product"]');
                if (!removeButton) return;
                event.preventDefault();
                const row = removeButton.closest('.vendor-product-row');
                if (!row) return;
                if (productContainer.querySelectorAll('.vendor-product-row').length > 1) {
                    row.remove();
                } else {
                    row.querySelectorAll('input, textarea').forEach((input) => {
                        input.value = '';
                    });
                }
            });
        }
        if (addProductButton && productContainer) {
            addProductButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.addProductRow(productContainer);
            });
        }
        this.setupInvoiceCapture(modal, vendor);
    }

    addProductRow(container, product = {}) {
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'vendor-product-row space-y-3 rounded-xl border border-gray-200 bg-white shadow-sm p-4';
        const safeName = this.escapeHtml(product?.name || '');
        const safePack = this.escapeHtml(product?.packSize || '');
        const safeSku = this.escapeHtml(product?.sku || '');
        const safeNotes = this.escapeHtml(product?.notes || '');
        const priceValue = product?.unitCost ?? '';
        row.innerHTML = `
            <div class="grid gap-3 md:grid-cols-4">
                <div class="md:col-span-2">
                    <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Item</label>
                    <input type="text" data-field="name" value="${safeName}" placeholder="e.g., Heirloom tomatoes flat" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:ring focus:ring-indigo-200">
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Pack size</label>
                    <input type="text" data-field="pack" value="${safePack}" placeholder="10 lb case" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:ring focus:ring-indigo-200">
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Unit cost</label>
                    <div class="relative">
                        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" min="0" step="0.01" data-field="price" value="${priceValue !== '' ? priceValue : ''}" placeholder="0.00" class="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-indigo-400 focus:ring focus:ring-indigo-200">
                    </div>
                </div>
            </div>
            <div class="grid gap-3 md:grid-cols-5 md:items-end">
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">SKU / Code</label>
                    <input type="text" data-field="sku" value="${safeSku}" placeholder="Vendor ref" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:ring focus:ring-indigo-200">
                </div>
                <div class="md:col-span-3">
                    <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Notes</label>
                    <textarea data-field="notes" rows="1" placeholder="Seasonal pricing or quality callouts" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:ring focus:ring-indigo-200 resize-none">${safeNotes}</textarea>
                </div>
                <div class="flex justify-end">
                    <button type="button" data-action="remove-product" class="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50">
                        ✕ Remove
                    </button>
                </div>
            </div>
        `;
        container.appendChild(row);
    }

    collectProductData(container) {
        if (!container) return [];
        const rows = Array.from(container.querySelectorAll('.vendor-product-row'));
        return rows.map((row) => {
            const name = row.querySelector('[data-field="name"]')?.value.trim() || '';
            const packSize = row.querySelector('[data-field="pack"]')?.value.trim() || '';
            const sku = row.querySelector('[data-field="sku"]')?.value.trim() || '';
            const notes = row.querySelector('[data-field="notes"]')?.value.trim() || '';
            const priceRaw = row.querySelector('[data-field="price"]')?.value;
            const hasContent = name || packSize || sku || notes || priceRaw;
            if (!hasContent) {
                return null;
            }
            const unitCost = priceRaw !== '' && priceRaw !== null ? parseFloat(priceRaw) : null;
            return {
                name,
                packSize,
                sku,
                notes,
                unitCost: Number.isFinite(unitCost) ? unitCost : null
            };
        }).filter(Boolean);
    }

    setupInvoiceCapture(modal, vendor = {}) {
        const dropzone = modal.querySelector('#vendor-invoice-dropzone');
        const fileInput = modal.querySelector('#vendor-invoice-file');
        const preview = modal.querySelector('#vendor-invoice-preview');
        if (!dropzone || !fileInput || !preview) {
            return;
        }
        const attachment = vendor?.invoiceAttachment || null;
        if (attachment) {
            try {
                modal.dataset.invoiceAttachment = JSON.stringify(attachment);
                this.renderInvoicePreview(preview, attachment);
            } catch (error) {
                console.warn('⚠️ Unable to load existing invoice attachment:', error);
                modal.dataset.invoiceAttachment = '';
                preview.innerHTML = '<p class="text-sm text-gray-500">No file attached yet.</p>';
            }
        } else {
            modal.dataset.invoiceAttachment = '';
            preview.innerHTML = '<p class="text-sm text-gray-500">No file attached yet.</p>';
        }
        dropzone.addEventListener('click', (event) => {
            event.preventDefault();
            fileInput.click();
        });
        dropzone.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropzone.classList.add('border-indigo-400', 'bg-indigo-50');
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('border-indigo-400', 'bg-indigo-50');
        });
        dropzone.addEventListener('drop', (event) => {
            event.preventDefault();
            dropzone.classList.remove('border-indigo-400', 'bg-indigo-50');
            if (event.dataTransfer?.files?.length) {
                const file = event.dataTransfer.files[0];
                this.processInvoiceFile(modal, file, preview);
            }
        });
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (file) {
                this.processInvoiceFile(modal, file, preview);
            }
        });
        preview.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-action="remove-invoice"]');
            if (removeBtn) {
                event.preventDefault();
                modal.dataset.invoiceAttachment = '';
                fileInput.value = '';
                preview.innerHTML = '<p class="text-sm text-gray-500">No file attached yet.</p>';
            }
        });
    }

    processInvoiceFile(modal, file, preview) {
        if (!file) return;
        const maxSize = 8 * 1024 * 1024; // 8MB safety guard
        if (file.size > maxSize) {
            alert('Please choose a file under 8MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const attachment = {
                name: file.name,
                type: file.type || 'application/octet-stream',
                data: reader.result
            };
            modal.dataset.invoiceAttachment = JSON.stringify(attachment);
            this.renderInvoicePreview(preview, attachment);
        };
        reader.onerror = () => {
            alert('We could not read that file. Please try again.');
        };
        reader.readAsDataURL(file);
    }

    renderInvoicePreview(preview, attachment) {
        if (!preview) return;
        if (!attachment) {
            preview.innerHTML = '<p class="text-sm text-gray-500">No file attached yet.</p>';
            return;
        }
        const safeName = this.escapeHtml(attachment.name || 'Invoice');
        const fileHref = attachment.data ? `href="${attachment.data}"` : 'href="#"';
        const isImage = attachment.type?.startsWith('image/');
        if (isImage) {
            preview.innerHTML = `
                <div class="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                    <img src="${attachment.data}" alt="${safeName}" class="w-full object-cover max-h-60">
                    <div class="flex items-center justify-between px-3 py-2 text-sm bg-gray-50">
                        <span class="text-gray-600 truncate">${safeName}</span>
                        <div class="flex items-center gap-2">
                            <a ${fileHref} download="${safeName}" target="_blank" rel="noopener" class="text-indigo-600 hover:text-indigo-700 font-medium">Download</a>
                            <button type="button" data-action="remove-invoice" class="text-red-500 hover:text-red-600 font-medium">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const descriptor = this.escapeHtml(attachment.type || 'Document');
            preview.innerHTML = `
                <div class="flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">📄</span>
                        <div>
                            <div class="text-sm font-medium text-gray-800">${safeName}</div>
                            <div class="text-xs text-gray-500">${descriptor} attached</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <a ${fileHref} download="${safeName}" target="_blank" rel="noopener" class="text-indigo-600 hover:text-indigo-700 font-medium">Open</a>
                        <button type="button" data-action="remove-invoice" class="text-red-500 hover:text-red-600 font-medium">Remove</button>
                    </div>
                </div>
            `;
        }
    }
    
    async saveVendor() {
        const form = document.getElementById('vendor-form');
        if (!form) {
            console.error('❌ Vendor form not found!');
            return;
        }
        
        console.log('💾 Saving vendor...');
        
        const modal = document.querySelector('.vendor-modal-overlay[data-modal="vendor"]');
        
        const formData = {
            name: document.getElementById('vendor-name').value.trim(),
            company: document.getElementById('vendor-company').value.trim(),
            email: document.getElementById('vendor-email').value.trim(),
            phone: document.getElementById('vendor-phone').value.trim(),
            mobile: document.getElementById('vendor-mobile').value.trim(),
            website: document.getElementById('vendor-website').value.trim(),
            street: document.getElementById('vendor-street').value.trim(),
            city: document.getElementById('vendor-city').value.trim(),
            state: document.getElementById('vendor-state').value.trim(),
            zip_code: document.getElementById('vendor-zip').value.trim(),
            specialties: document.getElementById('vendor-specialties').value.trim().split(',').map(s => s.trim()).filter(Boolean),
            notes: document.getElementById('vendor-notes').value.trim(),
            is_active: document.getElementById('vendor-active').checked
        };
        
        const productsContainer = modal ? modal.querySelector('#vendor-products-list') : null;
        formData.products = this.collectProductData(productsContainer);
        
        let invoiceAttachment = null;
        if (modal?.dataset?.invoiceAttachment) {
            try {
                invoiceAttachment = JSON.parse(modal.dataset.invoiceAttachment);
            } catch (error) {
                console.warn('⚠️ Failed to parse invoice attachment data:', error);
            }
        }
        formData.invoiceAttachment = invoiceAttachment;
        
        if (!formData.name) {
            alert('Please enter a vendor name');
            return;
        }
        
        // Check if we're editing or adding
        const isEdit = modal && modal.dataset.vendorId;
        
        try {
            if (isEdit) {
                // UPDATE existing vendor
                const response = await fetch(`/api/vendors/${formData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    const updatedVendor = await response.json();
                    const index = this.vendors.findIndex(v => v.id === formData.id);
                    if (index !== -1) {
                        this.vendors[index] = {
                            ...this.vendors[index],
                            ...formData,
                            ...updatedVendor,
                            id: formData.id,
                            updated_at: new Date().toISOString()
                        };
                    }
                    console.log('✅ Vendor updated in API:', formData.name);
                } else {
                    // Fallback to local storage
                    const index = this.vendors.findIndex(v => v.id === formData.id);
                    if (index !== -1) {
                        this.vendors[index] = {
                            ...this.vendors[index],
                            ...formData,
                            updated_at: new Date().toISOString()
                        };
                    }
                    console.log('✅ Vendor updated locally:', formData.name);
                }
            } else {
                // ADD new vendor
                const response = await fetch('/api/vendors/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    const savedVendor = await response.json();
                    const newVendor = {
                        ...formData,
                        ...savedVendor,
                        id: savedVendor.id || Date.now(),
                        created_at: savedVendor.created_at || new Date().toISOString()
                    };
                    this.vendors.push(newVendor);
                    console.log('✅ Vendor saved to API:', newVendor.name);
                } else {
                    // Fallback to local storage
                    const newVendor = {
                        id: Date.now(),
                        ...formData,
                        created_at: new Date().toISOString()
                    };
                    this.vendors.push(newVendor);
                    console.log('✅ Vendor saved locally:', newVendor.name);
                }
            }
            
            // Save to user file storage
            this.saveVendorsToFile();
            
            console.log(`✅ Vendor "${formData.name}" saved. Total vendors: ${this.vendors.length}`);
            
            // Close modal first
            this.closeVendorModal();
            
            // Then update display with a small delay to ensure modal is closed
            setTimeout(() => {
                this.updateVendorCount();
                this.displayVendors();
                this.updateFilters();
                this.showNotification(`Vendor "${formData.name}" saved successfully!`, 'success');
                
                // Also reload the page if display still empty
                setTimeout(() => {
                    const container = document.getElementById('vendors-container');
                    if (container && container.children.length === 0) {
                        console.log('⚠️ Display still empty, forcing reload');
                        this.displayVendors();
                    }
                }, 500);
            }, 100);
            
        } catch (error) {
            console.error('❌ Error saving vendor:', error);
            alert('Error saving vendor. Please try again.');
        }
    }
    
    editVendor(vendorId) {
        const vendor = this.vendors.find(v => v.id === vendorId);
        if (vendor) {
            const modal = this.showVendorModal('edit', vendor);
            // Store vendor ID for editing
            setTimeout(() => {
                const modalElement = document.querySelector('.vendor-modal-overlay[data-modal="vendor"]');
                if (modalElement) {
                    modalElement.dataset.vendorId = vendorId;
                }
            }, 50);
        }
    }
    
    async deleteVendor(vendorId) {
        if (!confirm('Are you sure you want to delete this vendor?')) {
            return;
        }
        
        try {
            // Try to delete from backend API
            const response = await fetch(`/api/vendors/${vendorId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log('✅ Vendor deleted from API');
            } else {
                console.log('⚠️ API not available, deleting locally');
            }
            
            // Remove from local array
            this.vendors = this.vendors.filter(v => v.id !== vendorId);
            this.selectedVendors.delete(vendorId);
            
            // Save to user file storage
            this.saveVendorsToFile();
            
            this.updateVendorCount();
            this.displayVendors();
            this.updateFilters();
            this.updateBulkActions();
            
            this.showNotification('Vendor deleted successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting vendor:', error);
            alert('Error deleting vendor. Please try again.');
        }
    }
    
    closeVendorModal() {
        const modal = document.querySelector('.vendor-modal-overlay[data-modal="vendor"]');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                console.log('✅ Vendor modal closed');
            }, 300);
        }
    }
    
    showImportModal() {
        const modal = this.createImportModal();
        if (modal) {
            document.body.appendChild(modal);
            
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
            
            console.log('✅ Import modal displayed');
        }
    }
    
    createImportModal() {
        const modal = document.createElement('div');
        modal.className = 'import-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
        modal.setAttribute('data-modal', 'import');
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 16px 16px 0 0; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px;">📥 Import Vendors</h2>
                            <p style="opacity: 0.9; font-size: 0.95rem;">Import vendors from CSV or Excel files</p>
                        </div>
                        <button onclick="vendorManager.closeImportModal()" style="background: rgba(255,255,255,0.2); border: none; border-radius: 8px; width: 36px; height: 36px; cursor: pointer; color: white; font-size: 20px; transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            ✕
                        </button>
                    </div>
                </div>
                
                <div style="padding: 30px;">
                    <!-- File Upload Zone -->
                    <div id="drop-zone" style="border: 3px dashed #d1d5db; border-radius: 12px; padding: 40px; text-align: center; transition: all 0.3s; background: #f9fafb; cursor: pointer;" onmouseover="this.style.borderColor='#10b981'; this.style.background='#f0fdf4'" onmouseout="this.style.borderColor='#d1d5db'; this.style.background='#f9fafb'" onclick="document.getElementById('vendor-file-input').click()">
                        <div style="font-size: 4rem; margin-bottom: 15px;">📂</div>
                        <h3 style="font-size: 1.2rem; font-weight: 600; color: #1f2937; margin-bottom: 10px;">Drop your file here</h3>
                        <p style="color: #6b7280; margin-bottom: 20px;">or click to browse</p>
                        
                        <input type="file" id="vendor-file-input" accept=".csv,.xlsx,.xls" 
                               style="display: none;" onchange="vendorManager.handleFileSelect(event)">
                        
                        <button onclick="event.stopPropagation(); document.getElementById('vendor-file-input').click()" 
                                style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            📁 Choose File
                        </button>
                        
                        <p style="font-size: 0.85rem; color: #9ca3af; margin-top: 15px;">
                            Supported: CSV, Excel (.xlsx, .xls) • Max size: 10MB
                        </p>
                    </div>
                    
                    <!-- Selected File Display -->
                    <div id="selected-file-display" style="display: none; margin-top: 20px; padding: 15px; background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 2rem;">✅</span>
                                <div>
                                    <div style="font-weight: 600; color: #065f46;" id="file-name"></div>
                                    <div style="font-size: 0.85rem; color: #059669;" id="file-size"></div>
                                </div>
                            </div>
                            <button onclick="vendorManager.clearSelectedFile()" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.5rem;" title="Remove file">
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    <!-- Template Download Section -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-top: 25px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span style="font-size: 2.5rem;">📋</span>
                            <div style="flex: 1;">
                                <h4 style="font-weight: 600; color: #78350f; margin-bottom: 5px;">Need a template?</h4>
                                <p style="font-size: 0.9rem; color: #92400e;">Download our CSV template with correct column headers</p>
                            </div>
                            <button onclick="vendorManager.downloadTemplate()" 
                                    style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                📥 Download
                            </button>
                        </div>
                    </div>
                    
                    <!-- Import Options -->
                    <div style="margin-top: 25px; padding: 20px; background: #f9fafb; border-radius: 12px;">
                        <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                            <span>⚙️</span> Import Options
                        </h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="import-skip-duplicates" checked style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                                <span style="color: #4b5563;">Skip duplicate vendors (recommended)</span>
                            </label>
                            
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="import-overwrite" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                                <span style="color: #4b5563;">Overwrite existing vendors by name</span>
                            </label>
                            
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="import-validate-email" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                                <span style="color: #4b5563;">Validate email addresses</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Progress Bar (hidden by default) -->
                    <div id="import-progress" style="display: none; margin-top: 25px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-weight: 600; color: #1f2937;">Processing...</span>
                            <span id="progress-text" style="color: #6b7280;">0%</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                            <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #10b981, #059669); transition: width 0.3s;"></div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 12px; margin-top: 30px;">
                        <button onclick="vendorManager.closeImportModal()" 
                                style="flex: 1; background: #f3f4f6; color: #374151; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                            Cancel
                        </button>
                        <button id="start-import-btn" onclick="vendorManager.startImport()" disabled
                                style="flex: 1; background: #d1d5db; color: #9ca3af; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: not-allowed;">
                            🚀 Start Import
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add drag and drop functionality
        const dropZone = modal.querySelector('#drop-zone');
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#10b981';
            dropZone.style.background = '#f0fdf4';
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#d1d5db';
            dropZone.style.background = '#f9fafb';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#d1d5db';
            dropZone.style.background = '#f9fafb';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files: [files[0]] } });
            }
        });
        
        return modal;
    }
    
    selectedFile = null;
    
    clearSelectedFile() {
        this.selectedFile = null;
        const fileDisplay = document.getElementById('selected-file-display');
        const startBtn = document.getElementById('start-import-btn');
        
        if (fileDisplay) fileDisplay.style.display = 'none';
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.style.background = '#d1d5db';
            startBtn.style.color = '#9ca3af';
            startBtn.style.cursor = 'not-allowed';
        }
    }
    
    startImport() {
        if (!this.selectedFile) {
            alert('Please select a file first');
            return;
        }
        
        this.processFile(this.selectedFile);
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            
            // Show file info
            const fileDisplay = document.getElementById('selected-file-display');
            const fileName = document.getElementById('file-name');
            const fileSize = document.getElementById('file-size');
            const startBtn = document.getElementById('start-import-btn');
            
            if (fileDisplay && fileName && fileSize) {
                fileName.textContent = file.name;
                fileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;
                fileDisplay.style.display = 'block';
            }
            
            // Enable start button
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                startBtn.style.color = 'white';
                startBtn.style.cursor = 'pointer';
            }
        }
    }
    
    async processFile(file) {
        console.log('🔍 Processing file:', file.name);
        
        try {
            let csvContent = '';
            
            if (file.name.endsWith('.csv')) {
                // Process CSV directly
                csvContent = await file.text();
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // Convert Excel to CSV
                csvContent = await this.convertExcelToCSV(file);
            } else {
                throw new Error('Unsupported file format');
            }
            
            // Process the CSV content
            await this.processCSVContent(csvContent);
            
        } catch (error) {
            console.error('❌ Error processing file:', error);
            alert('Error processing file: ' + error.message);
        }
    }
    
    async convertExcelToCSV(file) {
        // For now, we'll use a simple approach
        // In a production environment, you'd want to use a library like SheetJS
        console.log('⚠️ Excel conversion not fully implemented - please use CSV format for now');
        throw new Error('Excel conversion requires additional setup. Please convert to CSV format.');
    }
    
    async processCSVContent(csvContent) {
        try {
            // Try to import via API
            const response = await fetch('/api/vendors/import-csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ csv_content: csvContent })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Import successful:', result);
                
                // Reload vendors
                await this.loadVendors();
                
                this.showNotification(`Successfully imported ${result.imported_count} vendors!`, 'success');
                this.closeImportModal();
                
            } else {
                throw new Error('API import failed');
            }
            
        } catch (error) {
            console.log('⚠️ API import failed, processing locally:', error.message);
            
            // Fallback to local processing
            const importedVendors = this.parseCSVLocally(csvContent);
            this.vendors.push(...importedVendors);
            
            this.updateVendorCount();
            this.displayVendors();
            this.updateFilters();
            
            this.showNotification(`Successfully imported ${importedVendors.length} vendors locally!`, 'success');
            this.closeImportModal();
        }
    }
    
    parseCSVLocally(csvContent) {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const vendors = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim());
            const vendor = {
                id: Date.now() + i,
                name: values[0] || '',
                company: values[1] || '',
                email: values[2] || '',
                phone: values[3] || '',
                mobile: values[4] || '',
                fax: values[5] || '',
                website: values[6] || '',
                street: values[7] || '',
                city: values[8] || '',
                state: values[9] || '',
                zip_code: values[10] || '',
                specialties: values[11] ? values[11].split(';').map(s => s.trim()) : [],
                notes: values[12] || '',
                is_active: true,
                created_at: new Date().toISOString()
            };
            
            if (vendor.name) {
                vendors.push(vendor);
            }
        }
        
        return vendors;
    }
    
    downloadTemplate() {
        const template = `Name,Company,Email,Phone,Mobile,Fax,Website,Street,City,State,ZIP,Specialties,Notes
John Smith,Fresh Foods Inc,john@freshfoods.com,555-1234,555-5678,,https://freshfoods.com,123 Main St,Boston,MA,02101,"produce;dairy",Reliable supplier
Sarah Johnson,Quality Meats Co,sarah@qualitymeats.com,555-2345,555-6789,,https://qualitymeats.com,456 Oak Ave,Chicago,IL,60601,"meat;poultry",Premium meat supplier`;
        
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vendor-import-template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Template downloaded');
    }
    
    closeImportModal() {
        const modal = document.querySelector('.import-modal-overlay[data-modal="import"]');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                console.log('✅ Import modal closed');
            }, 300);
        }
    }
    
    exportVendors() {
        if (this.vendors.length === 0) {
            alert('No vendors to export');
            return;
        }
        
        this.showExportModal();
    }
    
    showExportModal() {
        const modal = document.createElement('div');
        modal.className = 'export-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
        modal.setAttribute('data-modal', 'export');
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 600px; width: 90%;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 25px; border-radius: 16px 16px 0 0; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px;">📤 Export Vendors</h2>
                            <p style="opacity: 0.9; font-size: 0.95rem;">Download your vendor list in CSV format</p>
                        </div>
                        <button onclick="vendorManager.closeExportModal()" style="background: rgba(255,255,255,0.2); border: none; border-radius: 8px; width: 36px; height: 36px; cursor: pointer; color: white; font-size: 20px; transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            ✕
                        </button>
                    </div>
                </div>
                
                <div style="padding: 30px;">
                    <!-- Export Summary -->
                    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span style="font-size: 3rem;">📊</span>
                            <div>
                                <div style="font-size: 2rem; font-weight: 700; color: #1e40af;">${this.vendors.length}</div>
                                <div style="color: #1e40af; font-weight: 600;">Vendors ready to export</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Export Options -->
                    <div style="margin-bottom: 25px;">
                        <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                            <span>⚙️</span> Export Options
                        </h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <label style="display: flex; align-items: center; cursor: pointer; padding: 12px; background: #f9fafb; border-radius: 8px; transition: background 0.3s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='#f9fafb'">
                                <input type="radio" name="export-status" value="all" checked style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                                <span style="color: #4b5563; font-weight: 500;">All Vendors (${this.vendors.length})</span>
                            </label>
                            
                            <label style="display: flex; align-items: center; cursor: pointer; padding: 12px; background: #f9fafb; border-radius: 8px; transition: background 0.3s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='#f9fafb'">
                                <input type="radio" name="export-status" value="active" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                                <span style="color: #4b5563; font-weight: 500;">Active Vendors Only (${this.vendors.filter(v => v.is_active).length})</span>
                            </label>
                            
                            <label style="display: flex; align-items: center; cursor: pointer; padding: 12px; background: #f9fafb; border-radius: 8px; transition: background 0.3s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='#f9fafb'">
                                <input type="radio" name="export-status" value="inactive" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                                <span style="color: #4b5563; font-weight: 500;">Inactive Vendors Only (${this.vendors.filter(v => !v.is_active).length})</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- File Name -->
                    <div style="margin-bottom: 25px;">
                        <label style="display: block; font-weight: 600; color: #1f2937; margin-bottom: 8px;">File Name</label>
                        <input type="text" id="export-filename" value="vendors-export-${new Date().toISOString().split('T')[0]}" 
                               style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; transition: border 0.3s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                        <small style="color: #6b7280; display: block; margin-top: 5px;">The .csv extension will be added automatically</small>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 12px;">
                        <button onclick="vendorManager.closeExportModal()" 
                                style="flex: 1; background: #f3f4f6; color: #374151; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                            Cancel
                        </button>
                        <button onclick="vendorManager.executeExport()" 
                                style="flex: 1; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                            📥 Download CSV
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }
    
    executeExport() {
        // Get selected status filter
        const statusFilter = document.querySelector('input[name="export-status"]:checked').value;
        const filename = document.getElementById('export-filename').value || 'vendors-export';
        
        // Filter vendors based on selection
        let vendorsToExport = this.vendors;
        if (statusFilter === 'active') {
            vendorsToExport = this.vendors.filter(v => v.is_active);
        } else if (statusFilter === 'inactive') {
            vendorsToExport = this.vendors.filter(v => !v.is_active);
        }
        
        // Convert vendors to CSV
        const headers = ['Name', 'Company', 'Email', 'Phone', 'Mobile', 'Fax', 'Website', 'Street', 'City', 'State', 'ZIP', 'Specialties', 'Notes', 'Status'];
        const csvContent = [
            headers.join(','),
            ...vendorsToExport.map(vendor => [
                vendor.name,
                vendor.company || '',
                vendor.email || '',
                vendor.phone || '',
                vendor.mobile || '',
                vendor.fax || '',
                vendor.website || '',
                vendor.street || '',
                vendor.city || '',
                vendor.state || '',
                vendor.zip_code || '',
                (vendor.specialties || []).join(';'),
                vendor.notes || '',
                vendor.is_active ? 'Active' : 'Inactive'
            ].join(','))
        ].join('\n');
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`✅ Exported ${vendorsToExport.length} vendors`);
        this.showNotification(`Successfully exported ${vendorsToExport.length} vendors!`, 'success');
        
        this.closeExportModal();
    }
    
    closeExportModal() {
        const modal = document.querySelector('[data-modal="export"]');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
    
    bulkDeleteVendors() {
        if (this.selectedVendors.size === 0) {
            alert('Please select vendors to delete');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${this.selectedVendors.size} vendors?`)) {
            return;
        }
        
        // Delete selected vendors
        this.selectedVendors.forEach(vendorId => {
            this.deleteVendor(vendorId);
        });
        
        this.selectedVendors.clear();
        this.updateBulkActions();
    }
    
    bulkEditVendors() {
        if (this.selectedVendors.size === 0) {
            alert('Please select vendors to edit');
            return;
        }
        
        // For now, show a simple bulk edit modal
        // In a more sophisticated implementation, you'd allow editing common fields
        alert(`Bulk edit for ${this.selectedVendors.size} vendors - Feature coming soon!`);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-[10000] transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// View vendor profile with notes
VendorManager.prototype.viewVendorProfile = function(vendorId) {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor) {
        console.error('Vendor not found:', vendorId);
        return;
    }
    
    console.log(`👁️ Viewing profile for vendor: ${vendor.name}`);
    
    // Get notes for this vendor
    const user = window.authManager?.currentUser;
    const userId = user?.userId || user?.id;
    const notesKey = `vendor_notes_${userId}_${vendorId}`;
    const notes = JSON.parse(localStorage.getItem(notesKey) || '[]');
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        backdrop-filter: blur(4px);
    `;
    
    // Build specialties badges
    const specialties = Array.isArray(vendor.specialties) ? vendor.specialties : [];
    const specialtiesHTML = specialties.length
        ? specialties.map(s => `<span style="display: inline-flex; align-items: center; gap: 6px; background: #e0e7ff; color: #3730a3; padding: 6px 14px; border-radius: 999px; font-size: 0.85rem; font-weight: 600;">⭐ ${this.escapeHtml(s)}</span>`).join(' ')
        : '<span style="color: #94a3b8;">None specified</span>';

    // Build product list
    const productItemsHTML = Array.isArray(vendor.products) && vendor.products.length
        ? vendor.products.map(item => {
            const safeName = this.escapeHtml(item?.name || 'Untitled item');
            const safePack = this.escapeHtml(item?.packSize || 'Pack TBD');
            const safeSku = this.escapeHtml(item?.sku || 'No SKU');
            const safeNotes = this.escapeHtml(item?.notes || 'No additional notes');
            const price = Number.isFinite(item?.unitCost) ? `$${Number(item.unitCost).toFixed(2)}` : 'Pricing TBD';
            return `
                <div style="padding: 18px; border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                        <div>
                            <div style="font-weight: 700; color: #1e293b; font-size: 1rem;">${safeName}</div>
                            <div style="font-size: 0.85rem; color: #64748b; margin-top: 6px; line-height: 1.6;">${safeNotes}</div>
                        </div>
                        <span style="display: inline-flex; align-items: center; gap: 6px; background: #fef3c7; color: #b45309; padding: 6px 12px; border-radius: 999px; font-weight: 600; font-size: 0.8rem;">💵 ${price}</span>
                    </div>
                    <div style="display: flex; gap: 18px; margin-top: 12px; font-size: 0.8rem; color: #475569; flex-wrap: wrap;">
                        <span style="display: inline-flex; align-items: center; gap: 6px;">📦 ${safePack}</span>
                        <span style="display: inline-flex; align-items: center; gap: 6px;">🆔 ${safeSku}</span>
                    </div>
                </div>
            `;
        }).join('')
        : `<div style="padding: 20px; border: 2px dashed #cbd5e1; border-radius: 16px; text-align: center; color: #64748b; font-size: 0.9rem; background: #f8fafc;">No products tracked yet. Capture your go-to items directly from the vendor modal.</div>`;

    const productsSectionHTML = `
        <div style="padding: 25px; border-bottom: 2px solid #f1f5f9; background: white;">
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 18px 0; display: flex; align-items: center; gap: 10px;">
                <span>🍋</span> Product Catalogue <span style="background: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">${Array.isArray(vendor.products) ? vendor.products.length : 0}</span>
            </h3>
            <div style="display: grid; gap: 16px;">
                ${productItemsHTML}
            </div>
        </div>
    `;

    // Build invoice preview
    let invoiceSectionHTML = '';
    if (vendor.invoiceAttachment?.data) {
        const attachment = vendor.invoiceAttachment;
        const safeName = this.escapeHtml(attachment.name || 'Invoice');
        if ((attachment.type || '').startsWith('image/')) {
            invoiceSectionHTML = `
                <div style="padding: 25px; border-bottom: 2px solid #f1f5f9; background: #f8fafc;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        <span>🧾</span> Latest Invoice Snapshot
                    </h3>
                    <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: white;">
                        <img src="${attachment.data}" alt="${safeName}" style="width: 100%; max-height: 320px; object-fit: cover;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8fafc; font-size: 0.9rem; color: #475569;">
                            <span style="font-weight: 600;">${safeName}</span>
                            <a href="${attachment.data}" download="${safeName}" target="_blank" rel="noopener" style="color: #4f46e5; font-weight: 600;">Download</a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const descriptor = this.escapeHtml(attachment.type || 'Document');
            invoiceSectionHTML = `
                <div style="padding: 25px; border-bottom: 2px solid #f1f5f9; background: #f8fafc;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        <span>🧾</span> Latest Invoice Snapshot
                    </h3>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; border: 1px solid #e2e8f0; border-radius: 14px; background: white;">
                        <div>
                            <div style="font-size: 0.95rem; font-weight: 600; color: #1e293b;">${safeName}</div>
                            <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">${descriptor} attached</div>
                        </div>
                        <a href="${attachment.data}" download="${safeName}" target="_blank" rel="noopener" style="color: #4f46e5; font-weight: 600;">Open</a>
                    </div>
                </div>
            `;
        }
    } else {
        invoiceSectionHTML = `
            <div style="padding: 25px; border-bottom: 2px solid #f1f5f9; background: #f8fafc;">
                <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                    <span>🧾</span> Latest Invoice Snapshot
                </h3>
                <div style="padding: 20px; border: 2px dashed #cbd5e1; border-radius: 16px; color: #64748b; font-size: 0.9rem; background: white; text-align: center;">
                    No invoice on file yet. Upload the latest quote from the vendor modal to keep pricing handy.
                </div>
            </div>
        `;
    }
    
    // Build contact info
    const contactHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${vendor.phone ? `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">📞</span>
                    <div>
                        <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Phone</div>
                        <a href="tel:${vendor.phone}" style="color: #667eea; text-decoration: none; font-weight: 600;">${vendor.phone}</a>
                    </div>
                </div>
            ` : ''}
            ${vendor.mobile ? `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">📱</span>
                    <div>
                        <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Mobile</div>
                        <a href="tel:${vendor.mobile}" style="color: #667eea; text-decoration: none; font-weight: 600;">${vendor.mobile}</a>
                    </div>
                </div>
            ` : ''}
            ${vendor.email ? `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">✉️</span>
                    <div>
                        <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Email</div>
                        <a href="mailto:${vendor.email}" style="color: #667eea; text-decoration: none; font-weight: 600;">${vendor.email}</a>
                    </div>
                </div>
            ` : ''}
            ${vendor.website ? `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">🌐</span>
                    <div>
                        <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Website</div>
                        <a href="${vendor.website}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 600;">Visit Site →</a>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Build location info
    const locationHTML = vendor.address || vendor.city || vendor.state || vendor.zip_code
        ? `
            <div style="display: flex; align-items: start; gap: 10px;">
                <span style="font-size: 1.5rem;">📍</span>
                <div style="line-height: 1.6;">
                    ${vendor.address ? `<div>${vendor.address}</div>` : ''}
                    <div>${[vendor.city, vendor.state, vendor.zip_code].filter(Boolean).join(', ')}</div>
                </div>
            </div>
        `
        : '<span style="color: #94a3b8;">No address provided</span>';
    
    // Build notes section
    const notesHTML = notes.length === 0 
        ? `<div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1;">
            <p style="font-size: 2.5rem; margin-bottom: 10px;">📝</p>
            <p style="color: #64748b; margin: 0;">No notes yet for this vendor.</p>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 8px;">Add notes from the Chef's Dashboard!</p>
           </div>`
        : notes.map(note => {
            const date = new Date(note.timestamp).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            const time = new Date(note.timestamp).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const photoHTML = note.photo 
                ? `<img src="${note.photo}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-top: 10px; cursor: pointer; border: 2px solid #e5e7eb;" onclick="window.open('${note.photo}', '_blank')" title="Click to view full size">`
                : '';
            
            return `
                <div style="padding: 16px; background: white; border-radius: 12px; margin-bottom: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">📅 ${date}</span>
                        <span style="font-size: 0.85rem; color: #94a3b8;">⏰ ${time}</span>
                    </div>
                    <p style="color: #1e293b; margin: 0; line-height: 1.7; font-size: 0.95rem;">${note.text}</p>
                    ${photoHTML}
                </div>
            `;
        }).join('');
    
    // Status badge
    const statusBadge = vendor.is_active 
        ? '<span style="display: inline-block; background: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">✅ Active</span>'
        : '<span style="display: inline-block; background: #fee2e2; color: #991b1b; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">❌ Inactive</span>';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 900px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 80px rgba(0,0,0,0.4);">
            
            <!-- Header -->
            <div style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; position: relative;">
                <button onclick="this.closest('div[style*=fixed]').remove()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 44px; height: 44px; font-size: 1.5rem; cursor: pointer; color: white; transition: all 0.2s; backdrop-filter: blur(10px);" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    ✕
                </button>
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; backdrop-filter: blur(10px);">
                        🏪
                    </div>
                    <div style="flex: 1;">
                        <h2 style="font-size: 2rem; font-weight: 700; margin: 0 0 8px 0;">${vendor.name}</h2>
                        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            ${statusBadge.replace('background: #dcfce7; color: #15803d', 'background: rgba(255,255,255,0.25); color: white').replace('background: #fee2e2; color: #991b1b', 'background: rgba(255,255,255,0.25); color: white')}
                            ${vendor.company ? `<span style="opacity: 0.9; font-size: 0.95rem;">🏢 ${vendor.company}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div style="padding: 0; overflow-y: auto; flex: 1;">
                
                <!-- Contact Info Section -->
                <div style="padding: 25px; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                        <span>📞</span> Contact Information
                    </h3>
                    ${contactHTML}
                </div>

                <!-- Location Section -->
                <div style="padding: 25px; background: #f8fafc; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        <span>📍</span> Location
                    </h3>
                    ${locationHTML}
                </div>

                <!-- Specialties Section -->
                <div style="padding: 25px; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        <span>⭐</span> Specialties
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${specialtiesHTML}
                    </div>
                </div>

                ${productsSectionHTML}

                ${invoiceSectionHTML}

                <!-- Notes Section -->
                <div style="padding: 25px; background: #f8fafc;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span>📝</span> Notes & History <span style="background: #667eea; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">${notes.length}</span>
                        </h3>
                        <button onclick="vendorManager.promptVendorNote('${vendor.id}', this)" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                            ➕ Add Note
                        </button>
                    </div>
                    <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                        ${notesHTML}
                    </div>
                </div>

            </div>

            <!-- Footer Actions -->
            <div style="padding: 20px 25px; background: white; border-top: 2px solid #e5e7eb; display: flex; gap: 12px;">
                <button onclick="vendorManager.editVendor(${vendor.id}); this.closest('div[style*=fixed]').remove();" style="flex: 1; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
                    ✏️ Edit Vendor
                </button>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="padding: 14px 28px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
};

VendorManager.prototype.promptVendorNote = function(vendorId, triggerElement) {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor) {
        console.error('Vendor not found:', vendorId);
        return;
    }

    const noteText = window.prompt(`Add a note for ${vendor.name}:`);
    if (!noteText || !noteText.trim()) {
        return;
    }

    const user = window.authManager?.currentUser;
    const userId = user?.userId || user?.id || 'local';
    const author = user?.email || user?.name || 'Team';
    const notesKey = `vendor_notes_${userId}_${vendorId}`;
    const notes = JSON.parse(localStorage.getItem(notesKey) || '[]');

    notes.unshift({
        id: `vendor_note_${Date.now()}`,
        text: noteText.trim(),
        author,
        timestamp: new Date().toISOString(),
    });

    localStorage.setItem(notesKey, JSON.stringify(notes));
    this.showNotification('Vendor note captured', 'success');

    const modal = triggerElement?.closest('div[style*="position: fixed"]');
    if (modal) {
        modal.remove();
    }

    this.viewVendorProfile(vendorId);
};

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize vendor manager when DOM is loaded
let vendorManager;
document.addEventListener('DOMContentLoaded', function() {
    vendorManager = new VendorManager();
    window.vendorManager = vendorManager;
});
