// Equipment Manager for Iterum R&D Chef Notebook
// Handles equipment database browsing and user equipment management

// Prevent duplicate loading
if (typeof window.equipmentDatabase !== 'undefined') {
    console.log('EquipmentManager already loaded, skipping initialization');
} else {
    // Initialize global variables
    window.equipmentDatabase = [];
    window.currentUserEquipment = [];

    // Initialize equipment management
    function initEquipmentManager() {
        // Load equipment database
        loadEquipmentDatabase();
        
        // Set up event listeners
        setupEquipmentEventListeners();
        
        // Set up URL import integration
        setupUrlImportIntegration();
        
        // Load current user's equipment
        loadCurrentUserEquipment();
    }

    // Initialize equipment management for the dedicated page
    function initializeEquipmentManagement() {
        // Load equipment database
        loadEquipmentDatabase();
        
        // Set up event listeners for the dedicated page
        setupEquipmentManagementEventListeners();
        
        // Set up URL import integration
        setupUrlImportIntegration();
        
        // Load and display current user's equipment
        loadCurrentUserEquipment();
        
        // Update summary stats
        updateEquipmentSummaryStats();
        
        // Load vendors for vendor equipment management
        // loadVendorsForEquipment(); // REMOVED: Now handled by vendor-management.html
    }

    // Get all user equipment (for integration with other modules)
    function getAllEquipment() {
        return window.currentUserEquipment || [];
    }

    // Load equipment database from backend
    async function loadEquipmentDatabase() {
        try {
            const userId = (window.userDataManager && window.userDataManager.getCurrentUserId) ? window.userDataManager.getCurrentUserId() : (JSON.parse(localStorage.getItem('current_user')||'{}').id || null);
            let url = 'http://localhost:8000/api/data/equipment';
            if (userId) url += `?user_id=${encodeURIComponent(userId)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Handle different response formats
            if (Array.isArray(result)) {
                window.equipmentDatabase = result;
            } else if (result.success && result.data) {
                window.equipmentDatabase = result.data;
            } else if (result.equipment) {
                window.equipmentDatabase = result.equipment;
            } else {
                console.warn('Unexpected equipment data format:', result);
                window.equipmentDatabase = [];
            }
            
            console.log('Equipment database loaded:', window.equipmentDatabase.length, 'items');
        } catch (error) {
            console.error('Error loading equipment database:', error);
            window.equipmentDatabase = [];
        }
    }

    // Set up event listeners for equipment management
    function setupEquipmentEventListeners() {
        // Browse Equipment Database button
        const browseBtn = document.getElementById('browse-equipment-db-btn');
        if (browseBtn) {
            browseBtn.addEventListener('click', () => {
                showEquipmentDatabaseModal();
            });
        }
        
        // Close Equipment Database modal
        const closeDbModal = document.getElementById('close-equipment-db-modal');
        if (closeDbModal) {
            closeDbModal.addEventListener('click', () => {
                hideEquipmentDatabaseModal();
            });
        }
        
        // Load Equipment Database button
        const loadDbBtn = document.getElementById('load-equipment-db');
        if (loadDbBtn) {
            loadDbBtn.addEventListener('click', () => {
                loadAndDisplayEquipmentDatabase();
            });
        }
        
        // Equipment Database search
        const dbSearch = document.getElementById('equipment-db-search');
        if (dbSearch) {
            dbSearch.addEventListener('input', debounce(() => {
                filterEquipmentDatabase();
            }, 300));
        }
        
        // Equipment Database category filter
        const dbCategoryFilter = document.getElementById('equipment-db-category-filter');
        if (dbCategoryFilter) {
            dbCategoryFilter.addEventListener('change', () => {
                filterEquipmentDatabase();
            });
        }
        
        // Equipment form enhancements
        setupEquipmentFormEnhancements();
    }

    // Set up event listeners for the dedicated equipment management page
    function setupEquipmentManagementEventListeners() {
        // Add equipment button
        const addEquipmentBtn = document.getElementById('add-equipment-btn');
        if (addEquipmentBtn) {
            addEquipmentBtn.addEventListener('click', () => {
                showAddEquipmentModal();
            });
        }
        
        // Browse equipment database button
        const browseDbBtn = document.getElementById('browse-equipment-db-btn');
        if (browseDbBtn) {
            browseDbBtn.addEventListener('click', () => {
                showEquipmentDatabaseModal();
            });
        }
        
        // Modal close buttons
        const closeAddModal = document.getElementById('close-add-equipment-modal');
        const cancelAddBtn = document.getElementById('cancel-add-equipment');
        const closeEditModal = document.getElementById('close-edit-equipment-modal');
        const cancelEditBtn = document.getElementById('cancel-edit-equipment');
        const closeDbModal = document.getElementById('close-equipment-db-modal');
        // Vendor equipment modals removed - now handled by vendor-management.html
        
        if (closeAddModal) closeAddModal.addEventListener('click', hideAddEquipmentModal);
        if (cancelAddBtn) cancelAddBtn.addEventListener('click', hideAddEquipmentModal);
        if (closeEditModal) closeEditModal.addEventListener('click', hideEditEquipmentModal);
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', hideEditEquipmentModal);
        if (closeDbModal) closeDbModal.addEventListener('click', hideEquipmentDatabaseModal);
        // Vendor equipment event listeners removed - now handled by vendor-management.html
        
        // Form submissions
        const addEquipmentForm = document.getElementById('add-equipment-form');
        const editEquipmentForm = document.getElementById('edit-equipment-form');
        // Vendor equipment form removed - now handled by vendor-management.html
        
        if (addEquipmentForm) {
            addEquipmentForm.addEventListener('submit', handleAddEquipment);
        }
        
        if (editEquipmentForm) {
            editEquipmentForm.addEventListener('submit', handleEditEquipment);
        }
        
        // Vendor equipment form event listener removed - now handled by vendor-management.html
        
        // Equipment database controls
        const loadDbBtn = document.getElementById('load-equipment-db');
        const dbSearch = document.getElementById('equipment-db-search');
        const dbCategoryFilter = document.getElementById('equipment-db-category-filter');
        
        if (loadDbBtn) {
            loadDbBtn.addEventListener('click', () => {
                loadAndDisplayEquipmentDatabase();
            });
        }
        
        if (dbSearch) {
            dbSearch.addEventListener('input', debounce(() => {
                filterEquipmentDatabase();
            }, 300));
        }
        
        if (dbCategoryFilter) {
            dbCategoryFilter.addEventListener('change', () => {
                filterEquipmentDatabase();
            });
        }
        
        // Vendor equipment controls
        // Vendor equipment controls removed - now handled by vendor-management.html
        
        // Filter controls
        const searchInput = document.getElementById('equipment-search');
        const categoryFilter = document.getElementById('equipment-category-filter');
        const statusFilter = document.getElementById('equipment-status-filter');
        const maintenanceFilter = document.getElementById('maintenance-filter');
        
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                filterEquipment();
            }, 300));
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterEquipment);
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', filterEquipment);
        }
        
        if (maintenanceFilter) {
            maintenanceFilter.addEventListener('change', filterEquipment);
        }
        
        // Quick filter buttons
        const showAllBtn = document.getElementById('show-all-equipment');
        const showMaintenanceBtn = document.getElementById('show-maintenance-due');
        const showRepairBtn = document.getElementById('show-needs-repair');
        const showOverdueBtn = document.getElementById('show-overdue');
        const resetFiltersBtn = document.getElementById('reset-equipment-filters');
        
        if (showAllBtn) showAllBtn.addEventListener('click', () => resetFilters());
        if (showMaintenanceBtn) showMaintenanceBtn.addEventListener('click', () => filterByMaintenance('due-soon'));
        if (showRepairBtn) showRepairBtn.addEventListener('click', () => filterByStatus('Repair'));
        if (showOverdueBtn) showOverdueBtn.addEventListener('click', () => filterByMaintenance('overdue'));
        if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
        
        // WebstaurantStore modal event listeners
        const closeWebstaurantModal = document.getElementById('close-webstaurant-modal');
        if (closeWebstaurantModal) {
            closeWebstaurantModal.addEventListener('click', closeWebstaurantModal);
        }
        
        const webstaurantSearchBtn = document.getElementById('webstaurant-search-btn');
        if (webstaurantSearchBtn) {
            webstaurantSearchBtn.addEventListener('click', () => searchWebstaurantStore());
        }
        
        const webstaurantSearchInput = document.getElementById('webstaurant-search');
        if (webstaurantSearchInput) {
            webstaurantSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchWebstaurantStore();
                }
            });
        }
        
        // Category buttons
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                searchWebstaurantByCategory(category);
            });
        });
        
        // Retry button
        const webstaurantRetryBtn = document.getElementById('webstaurant-retry-btn');
        if (webstaurantRetryBtn) {
            webstaurantRetryBtn.addEventListener('click', () => searchWebstaurantStore());
        }
    }

    // Show add equipment modal
    function showAddEquipmentModal() {
        const modal = document.getElementById('add-equipment-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Reset form
            document.getElementById('add-equipment-form').reset();
        }
    }

    // Hide add equipment modal
    function hideAddEquipmentModal() {
        const modal = document.getElementById('add-equipment-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Show edit equipment modal
    function showEditEquipmentModal(equipment) {
        console.log('showEditEquipmentModal called with equipment:', equipment);
        
        const modal = document.getElementById('edit-equipment-modal');
        console.log('Found modal:', modal);
        
        if (modal) {
            modal.classList.remove('hidden');
            populateEditForm(equipment);
        } else {
            console.error('Edit equipment modal not found');
        }
    }

    // Hide edit equipment modal
    function hideEditEquipmentModal() {
        const modal = document.getElementById('edit-equipment-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Populate edit form with equipment data
    function populateEditForm(equipment) {
        console.log('Populating edit form with equipment:', equipment);
        
        try {
            document.getElementById('edit-equipment-id').value = equipment.id;
            document.getElementById('edit-equipment-name').value = equipment.name;
            document.getElementById('edit-equipment-category').value = equipment.category;
            document.getElementById('edit-equipment-quantity').value = equipment.quantity || 1;
            document.getElementById('edit-equipment-brand').value = equipment.brand || '';
            document.getElementById('edit-equipment-serial').value = equipment.serialNumber || '';
            document.getElementById('edit-equipment-purchase-date').value = equipment.purchaseDate || '';
            document.getElementById('edit-equipment-warranty').value = equipment.warrantyExpiry || '';
            document.getElementById('edit-equipment-status').value = equipment.status;
            document.getElementById('edit-equipment-location').value = equipment.location || '';
            document.getElementById('edit-equipment-last-maintenance').value = equipment.lastMaintenanceDate || '';
            document.getElementById('edit-equipment-next-maintenance').value = equipment.nextMaintenanceDate || '';
            document.getElementById('edit-equipment-maintenance-notes').value = equipment.maintenanceNotes || '';
            document.getElementById('edit-equipment-description').value = equipment.description || '';
            
            console.log('Edit form populated successfully');
        } catch (error) {
            console.error('Error populating edit form:', error);
        }
    }

    // Handle add equipment form submission
    async function handleAddEquipment(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const equipment = {
            id: Date.now().toString(),
            name: formData.get('equipment-name') || document.getElementById('equipment-name').value,
            category: formData.get('equipment-category') || document.getElementById('equipment-category').value,
            quantity: parseInt(formData.get('equipment-quantity') || document.getElementById('equipment-quantity').value) || 1,
            brand: formData.get('equipment-brand') || document.getElementById('equipment-brand').value,
            serialNumber: formData.get('equipment-serial') || document.getElementById('equipment-serial').value,
            purchaseDate: formData.get('equipment-purchase-date') || document.getElementById('equipment-purchase-date').value,
            warrantyExpiry: formData.get('equipment-warranty') || document.getElementById('equipment-warranty').value,
            status: formData.get('equipment-status') || document.getElementById('equipment-status').value,
            location: formData.get('equipment-location') || document.getElementById('equipment-location').value,
            lastMaintenanceDate: formData.get('equipment-last-maintenance') || document.getElementById('equipment-last-maintenance').value,
            nextMaintenanceDate: formData.get('equipment-next-maintenance') || document.getElementById('equipment-next-maintenance').value,
            maintenanceNotes: formData.get('equipment-maintenance-notes') || document.getElementById('equipment-maintenance-notes').value,
            description: formData.get('equipment-description') || document.getElementById('equipment-description').value,
            addedAt: new Date().toISOString()
        };
        
        try {
            await addEquipmentToUser(equipment);
            
            // Check if this is refrigeration equipment and add HACCP tasks
            if (isRefrigerationEquipment(equipment)) {
                await setupHACCPForRefrigeration(equipment);
            }
            
            hideAddEquipmentModal();
            showNotification('Equipment added successfully!', 'success');
            loadCurrentUserEquipment();
            updateEquipmentSummaryStats();
        } catch (error) {
            console.error('Error adding equipment:', error);
            showNotification('Error adding equipment. Please try again.', 'error');
        }
    }

    // Handle edit equipment form submission
    async function handleEditEquipment(event) {
        event.preventDefault();
        
        const equipmentId = document.getElementById('edit-equipment-id').value;
        const equipment = {
            id: equipmentId,
            name: document.getElementById('edit-equipment-name').value,
            category: document.getElementById('edit-equipment-category').value,
            quantity: parseInt(document.getElementById('edit-equipment-quantity').value) || 1,
            brand: document.getElementById('edit-equipment-brand').value,
            serialNumber: document.getElementById('edit-equipment-serial').value,
            purchaseDate: document.getElementById('edit-equipment-purchase-date').value,
            warrantyExpiry: document.getElementById('edit-equipment-warranty').value,
            status: document.getElementById('edit-equipment-status').value,
            location: document.getElementById('edit-equipment-location').value,
            lastMaintenanceDate: document.getElementById('edit-equipment-last-maintenance').value,
            nextMaintenanceDate: document.getElementById('edit-equipment-next-maintenance').value,
            maintenanceNotes: document.getElementById('edit-equipment-maintenance-notes').value,
            description: document.getElementById('edit-equipment-description').value,
            updatedAt: new Date().toISOString()
        };
        
        try {
            await updateEquipmentInUser(equipment);
            hideEditEquipmentModal();
            showNotification('Equipment updated successfully!', 'success');
            loadCurrentUserEquipment();
            updateEquipmentSummaryStats();
        } catch (error) {
            console.error('Error updating equipment:', error);
            showNotification('Error updating equipment. Please try again.', 'error');
        }
    }

    // Filter equipment based on current filters
    function filterEquipment() {
        const searchTerm = document.getElementById('equipment-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('equipment-category-filter')?.value || '';
        const statusFilter = document.getElementById('equipment-status-filter')?.value || '';
        const maintenanceFilter = document.getElementById('maintenance-filter')?.value || '';
        
        let filteredEquipment = window.currentUserEquipment.filter(equipment => {
            // Search filter
            if (searchTerm && !equipment.name.toLowerCase().includes(searchTerm) && 
                !(equipment.brand && equipment.brand.toLowerCase().includes(searchTerm)) &&
                !(equipment.description && equipment.description.toLowerCase().includes(searchTerm))) {
                return false;
            }
            
            // Category filter
            if (categoryFilter && equipment.category !== categoryFilter) {
                return false;
            }
            
            // Status filter
            if (statusFilter && equipment.status !== statusFilter) {
                return false;
            }
            
            // Maintenance filter
            if (maintenanceFilter) {
                const maintenanceStatus = getMaintenanceStatus(equipment);
                if (maintenanceFilter === 'overdue' && maintenanceStatus !== 'overdue') return false;
                if (maintenanceFilter === 'due-soon' && maintenanceStatus !== 'due-soon') return false;
                if (maintenanceFilter === 'due-month' && maintenanceStatus !== 'due-month') return false;
            }
            
            return true;
        });
        
        displayEquipmentGrid(filteredEquipment);
    }

    // Filter by maintenance status
    function filterByMaintenance(status) {
        document.getElementById('maintenance-filter').value = status;
        filterEquipment();
    }

    // Filter by status
    function filterByStatus(status) {
        document.getElementById('equipment-status-filter').value = status;
        filterEquipment();
    }

    // Reset all filters
    function resetFilters() {
        document.getElementById('equipment-search').value = '';
        document.getElementById('equipment-category-filter').value = '';
        document.getElementById('equipment-status-filter').value = '';
        document.getElementById('maintenance-filter').value = '';
        filterEquipment();
    }

    // Get maintenance status for equipment
    function getMaintenanceStatus(equipment) {
        if (!equipment.nextMaintenanceDate) return 'no-maintenance';
        
        const today = new Date();
        const maintenanceDate = new Date(equipment.nextMaintenanceDate);
        const daysUntilMaintenance = Math.ceil((maintenanceDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilMaintenance < 0) return 'overdue';
        if (daysUntilMaintenance <= 7) return 'due-soon';
        if (daysUntilMaintenance <= 30) return 'due-month';
        return 'ok';
    }

    // Update equipment summary statistics
    function updateEquipmentSummaryStats() {
        const stats = {
            active: 0,
            maintenance: 0,
            repair: 0,
            total: window.currentUserEquipment.length,
            totalQuantity: 0
        };
        
        window.currentUserEquipment.forEach(equipment => {
            const quantity = equipment.quantity || 1;
            stats.totalQuantity += quantity;
            
            switch (equipment.status) {
                case 'Active':
                    stats.active += quantity;
                    break;
                case 'Maintenance':
                    stats.maintenance += quantity;
                    break;
                case 'Repair':
                    stats.repair += quantity;
                    break;
            }
        });
        
        // Update display
        const activeCount = document.getElementById('active-count');
        const maintenanceCount = document.getElementById('maintenance-count');
        const repairCount = document.getElementById('repair-count');
        const totalCount = document.getElementById('total-count');
        const totalQuantityCount = document.getElementById('total-quantity-count');
        
        if (activeCount) activeCount.textContent = stats.active;
        if (maintenanceCount) maintenanceCount.textContent = stats.maintenance;
        if (repairCount) repairCount.textContent = stats.repair;
        if (totalCount) totalCount.textContent = stats.total;
        if (totalQuantityCount) totalQuantityCount.textContent = stats.totalQuantity;
    }

    // Display equipment in grid format
    function displayEquipmentGrid(equipmentList) {
        const container = document.getElementById('equipment-grid-container');
        const noResults = document.getElementById('no-equipment-results');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!equipmentList || equipmentList.length === 0) {
            noResults.classList.remove('hidden');
            return;
        }
        
        noResults.classList.add('hidden');
        
        equipmentList.forEach(equipment => {
            const card = createEquipmentCard(equipment);
            container.appendChild(card);
        });
    }

    // Create equipment card for grid display
    function createEquipmentCard(equipment) {
        const card = document.createElement('div');
        const maintenanceStatus = getMaintenanceStatus(equipment);
        const statusClass = `status-${equipment.status.toLowerCase().replace(' ', '-')}`;
        const maintenanceClass = getMaintenanceClass(maintenanceStatus);
        
        card.className = `equipment-card ${statusClass} ${maintenanceClass}`;
        
        const categoryIcon = getCategoryIcon(equipment.category);
        const statusIcon = getStatusIcon(equipment.status);
        const maintenanceIcon = getMaintenanceIcon(maintenanceStatus);
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800 mb-1">${equipment.name}</h4>
                    <p class="text-sm text-gray-600">${categoryIcon} ${equipment.category}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">${statusIcon} ${equipment.status}</span>
                    ${maintenanceIcon ? `<span class="text-sm">${maintenanceIcon}</span>` : ''}
                </div>
            </div>
            
            <div class="space-y-2 text-sm text-gray-700 mb-4">
                <p><strong>Quantity:</strong> ${equipment.quantity || 1}</p>
                ${equipment.brand ? `<p><strong>Brand:</strong> ${equipment.brand}</p>` : ''}
                ${equipment.serialNumber ? `<p><strong>Serial:</strong> ${equipment.serialNumber}</p>` : ''}
                ${equipment.location ? `<p><strong>Location:</strong> ${equipment.location}</p>` : ''}
            </div>
            
            <div class="space-y-2 text-sm mb-4">
                ${equipment.purchaseDate ? `<p><strong>Purchased:</strong> ${formatDate(equipment.purchaseDate)}</p>` : ''}
                ${equipment.warrantyExpiry ? `<p><strong>Warranty:</strong> ${formatDate(equipment.warrantyExpiry)}</p>` : ''}
                ${equipment.lastMaintenanceDate ? `<p><strong>Last Maintenance:</strong> ${formatDate(equipment.lastMaintenanceDate)}</p>` : ''}
                ${equipment.nextMaintenanceDate ? `<p><strong>Next Maintenance:</strong> ${formatDate(equipment.nextMaintenanceDate)}</p>` : ''}
            </div>
            
            ${equipment.maintenanceNotes ? `
            <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-sm text-yellow-800"><strong>Maintenance Notes:</strong></p>
                <p class="text-sm text-yellow-700">${equipment.maintenanceNotes}</p>
            </div>
            ` : ''}
            
            <div class="flex gap-2 pt-3 border-t border-gray-100">
                <button onclick="editEquipment('${equipment.id}')" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
                    ✏️ Edit
                </button>
                <button onclick="deleteEquipment('${equipment.id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        return card;
    }

    // Get maintenance CSS class
    function getMaintenanceClass(status) {
        switch (status) {
            case 'overdue': return 'maintenance-overdue';
            case 'due-soon': return 'maintenance-warning';
            default: return '';
        }
    }

    // Get status icon
    function getStatusIcon(status) {
        switch (status) {
            case 'Active': return '🟢';
            case 'Maintenance': return '🟡';
            case 'Repair': return '��';
            case 'Retired': return '⚫';
            default: return '⚪';
        }
    }

    // Get maintenance icon
    function getMaintenanceIcon(status) {
        switch (status) {
            case 'overdue': return '🚨';
            case 'due-soon': return '⚠️';
            case 'due-month': return '📅';
            default: return '';
        }
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    // Show equipment database modal
    function showEquipmentDatabaseModal() {
        const modal = document.getElementById('equipment-db-modal');
        if (modal) {
            modal.classList.remove('hidden');
            loadAndDisplayEquipmentDatabase();
        }
    }

    // Hide equipment database modal
    function hideEquipmentDatabaseModal() {
        const modal = document.getElementById('equipment-db-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Load and display equipment database
    function loadAndDisplayEquipmentDatabase() {
        const container = document.getElementById('equipment-db-container');
        const loading = document.getElementById('equipment-db-loading');
        const noResults = document.getElementById('equipment-db-no-results');
        
        if (!container) return;
        
        // Show loading
        container.innerHTML = '';
        loading.classList.remove('hidden');
        noResults.classList.add('hidden');
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            loading.classList.add('hidden');
            displayEquipmentDatabase(window.equipmentDatabase);
        }, 500);
    }

    // Display equipment database items
    function displayEquipmentDatabase(items) {
        const container = document.getElementById('equipment-db-container');
        const noResults = document.getElementById('equipment-db-no-results');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!items || items.length === 0) {
            noResults.classList.remove('hidden');
            return;
        }
        
        noResults.classList.add('hidden');
        
        items.forEach(item => {
            const card = createEquipmentDatabaseCard(item);
            container.appendChild(card);
        });
    }

    // Create equipment database card
    function createEquipmentDatabaseCard(item) {
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow';
        
        const categoryIcon = getCategoryIcon(item.category);
        const price = item.price ? `$${parseFloat(item.price).toFixed(2)}` : 'Price not specified';
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800 mb-1">${item.name}</h4>
                    <p class="text-sm text-gray-600">${categoryIcon} ${item.category}</p>
                </div>
                <button class="add-equipment-from-db bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        data-equipment='${JSON.stringify(item)}'>
                    ➕ Add
                </button>
            </div>
            
            <div class="space-y-2 text-sm text-gray-700">
                ${item.brand ? `<p><strong>Brand:</strong> ${item.brand}</p>` : ''}
                ${item.model ? `<p><strong>Model:</strong> ${item.model}</p>` : ''}
                ${item.specs ? `<p><strong>Specs:</strong> ${item.specs}</p>` : ''}
                <p><strong>Price:</strong> ${price}</p>
                ${item.status ? `<p><strong>Status:</strong> ${item.status}</p>` : ''}
            </div>
            
            <div class="mt-3 pt-3 border-t border-gray-100">
                <div class="flex gap-2">
                    ${item.spec_url ? `<a href="${item.spec_url}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm">📋 Specs</a>` : ''}
                    ${item.manual_url ? `<a href="${item.manual_url}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm">📖 Manual</a>` : ''}
                </div>
            </div>
        `;
        
        // Add event listener to Add button
        const addBtn = card.querySelector('.add-equipment-from-db');
        addBtn.addEventListener('click', () => {
            addEquipmentFromDatabase(item);
        });
        
        return card;
    }

    // Add equipment from database to user's equipment
    function addEquipmentFromDatabase(dbItem) {
        // Pre-fill the add equipment form with database data
        document.getElementById('equipment-name').value = dbItem.name;
        document.getElementById('equipment-category').value = dbItem.category;
        document.getElementById('equipment-quantity').value = '1'; // Default to 1
        document.getElementById('equipment-brand').value = dbItem.brand || '';
        document.getElementById('equipment-description').value = dbItem.specs || '';
        
        // Hide database modal and show add equipment modal
        hideEquipmentDatabaseModal();
        showAddEquipmentModal();
    }

    // Filter equipment database
    function filterEquipmentDatabase() {
        const searchTerm = document.getElementById('equipment-db-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('equipment-db-category-filter')?.value || '';
        
        let filteredItems = window.equipmentDatabase.filter(item => {
            if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && 
                !(item.brand && item.brand.toLowerCase().includes(searchTerm))) {
                return false;
            }
            
            if (categoryFilter && item.category !== categoryFilter) {
                return false;
            }
            
            return true;
        });
        
        displayEquipmentDatabase(filteredItems);
    }

    // Set up equipment form enhancements
    function setupEquipmentFormEnhancements() {
        // Add maintenance activity tracking
        function addMaintenanceActivity(equipmentId, action, description = '') {
            const equipment = window.currentUserEquipment.find(e => e.id === equipmentId);
            if (!equipment) return;
            
            const maintenance = {
                id: Date.now(),
                equipmentId: equipmentId,
                equipmentName: equipment.name,
                action: action,
                description: description,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString(),
                timestamp: new Date().toISOString()
            };
            
            // Save to localStorage
            let maintenanceLog = JSON.parse(localStorage.getItem('iterum_maintenance_log') || '[]');
            maintenanceLog.push(maintenance);
            localStorage.setItem('iterum_maintenance_log', JSON.stringify(maintenanceLog));
            
            // Add to calendar manager if available
            if (window.calendarManager) {
                window.calendarManager.addMaintenanceActivity(maintenance);
            }
            
            showNotification(`Maintenance activity logged for ${equipment.name}`, 'success');
        }

        // Auto-calculate next maintenance date based on last maintenance
        const lastMaintenanceInput = document.getElementById('equipment-last-maintenance');
        const nextMaintenanceInput = document.getElementById('equipment-next-maintenance');

        if (lastMaintenanceInput && nextMaintenanceInput) {
                lastMaintenanceInput.addEventListener('change', () => {
                    if (lastMaintenanceInput.value) {
                        const lastDate = new Date(lastMaintenanceInput.value);
                        const nextDate = new Date(lastDate);
                        nextDate.setMonth(nextDate.getMonth() + 6); // Default 6 months
                        nextMaintenanceInput.value = nextDate.toISOString().split('T')[0];
                    }
                });
            }
    }

    // Save equipment with new fields
    async function saveEquipmentWithNewFields() {
        const form = document.getElementById('equipment-form');
        if (!form) return;
        
        const formData = new FormData(form);
        const equipment = {
            id: Date.now().toString(),
            name: formData.get('equipment-name'),
            category: formData.get('equipment-category'),
            quantity: parseInt(formData.get('equipment-quantity')) || 1,
            brand: formData.get('equipment-brand'),
            model: formData.get('equipment-model'),
            serialNumber: formData.get('equipment-serial'),
            purchaseDate: formData.get('equipment-purchase-date'),
            warrantyExpiry: formData.get('equipment-warranty'),
            status: formData.get('equipment-status'),
            location: formData.get('equipment-location'),
            lastMaintenanceDate: formData.get('equipment-last-maintenance'),
            nextMaintenanceDate: formData.get('equipment-next-maintenance'),
            maintenanceNotes: formData.get('equipment-maintenance-notes'),
            description: formData.get('equipment-description'),
            addedAt: new Date().toISOString()
        };
        
        try {
            await addEquipmentToUser(equipment);
            form.reset();
            showNotification('Equipment added successfully!', 'success');
            loadCurrentUserEquipment();
            updateEquipmentSummaryStats();
        } catch (error) {
            console.error('Error saving equipment:', error);
            showNotification('Error saving equipment. Please try again.', 'error');
        }
    }

    // Add equipment to user's equipment list
    async function addEquipmentToUser(equipment) {
        try {
            const userId = (window.userDataManager && window.userDataManager.getCurrentUserId) ? window.userDataManager.getCurrentUserId() : (JSON.parse(localStorage.getItem('current_user')||'{}').id || null);
            const response = await fetch('http://localhost:8000/api/data/equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...equipment, user_id: userId })
            });
            const result = await response.json();
            
            if (result.success) {
                window.currentUserEquipment.push(result.data);
                showNotification('Equipment added successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to add equipment');
            }
        } catch (error) {
            console.error('Error adding equipment:', error);
            showNotification('Error adding equipment. Please try again.', 'error');
        }
    }

    // Update equipment in user's equipment list
    async function updateEquipmentInUser(equipment) {
        try {
            const userId = (window.userDataManager && window.userDataManager.getCurrentUserId) ? window.userDataManager.getCurrentUserId() : (JSON.parse(localStorage.getItem('current_user')||'{}').id || null);
            const response = await fetch('http://localhost:8000/api/data/equipment', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...equipment, user_id: userId })
            });
            const result = await response.json();
            
            if (result.success) {
                const index = window.currentUserEquipment.findIndex(e => e.id === equipment.id);
                if (index !== -1) {
                    window.currentUserEquipment[index] = result.data;
                }
                showNotification('Equipment updated successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to update equipment');
            }
        } catch (error) {
            console.error('Error updating equipment:', error);
            showNotification('Error updating equipment. Please try again.', 'error');
        }
    }

    // Load current user's equipment
    function loadCurrentUserEquipment() {
        // Use user-specific data manager
        if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
            window.currentUserEquipment = window.userDataManager.getUserEquipment();
        } else {
            // Fallback to old method
            const currentUser = getCurrentUser();
            if (!currentUser) {
                window.currentUserEquipment = [];
                return;
            }
            
            const savedEquipment = localStorage.getItem(`equipment_${currentUser.id}`);
            window.currentUserEquipment = savedEquipment ? JSON.parse(savedEquipment) : [];
        }
        
        // Update display
        updateEquipmentDisplay();
        updateEquipmentSummaryStats();
    }

    // Update equipment display
    function updateEquipmentDisplay() {
        // Check if we're on the equipment management page
        const equipmentGrid = document.getElementById('equipment-grid-container');
        if (equipmentGrid) {
            displayEquipmentGrid(window.currentUserEquipment);
            return;
        }
        
        // Fallback to old display method for main page
        const container = document.getElementById('equipment-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        window.currentUserEquipment.forEach(equipment => {
            const card = createUserEquipmentCard(equipment);
            container.appendChild(card);
        });
    }

    // Create user equipment card (for main page)
    function createUserEquipmentCard(equipment) {
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-lg p-4 mb-4';
        
        const categoryIcon = getCategoryIcon(equipment.category);
        const statusIcon = getStatusIcon(equipment.status);
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800 mb-1">${equipment.name}</h4>
                    <p class="text-sm text-gray-600">${categoryIcon} ${equipment.category}</p>
                </div>
                <span class="text-sm font-medium">${statusIcon} ${equipment.status}</span>
            </div>
            
            <div class="space-y-2 text-sm text-gray-700 mb-3">
                <p><strong>Quantity:</strong> ${equipment.quantity || 1}</p>
                ${equipment.brand ? `<p><strong>Brand:</strong> ${equipment.brand}</p>` : ''}
                ${equipment.location ? `<p><strong>Location:</strong> ${equipment.location}</p>` : ''}
                ${equipment.nextMaintenanceDate ? `<p><strong>Next Maintenance:</strong> ${formatDate(equipment.nextMaintenanceDate)}</p>` : ''}
            </div>
            
            <div class="flex gap-2">
                <button onclick="editEquipment('${equipment.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    ✏️ Edit
                </button>
                <button onclick="deleteEquipment('${equipment.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        return card;
    }

    // Edit equipment
    function editEquipment(equipmentId) {
        console.log('editEquipment called with ID:', equipmentId);
        console.log('Current user equipment:', window.currentUserEquipment);
        
        const equipment = window.currentUserEquipment.find(e => e.id === equipmentId);
        console.log('Found equipment:', equipment);
        
        if (equipment) {
            showEditEquipmentModal(equipment);
        } else {
            console.error('Equipment not found with ID:', equipmentId);
        }
    }

    // Delete equipment
    async function deleteEquipment(equipmentId) {
        if (!confirm('Are you sure you want to delete this equipment?')) {
            return;
        }
        
        const currentUser = getCurrentUser();
        if (!currentUser) {
            showNotification('No user logged in', 'error');
            return;
        }
        
        try {
            // Remove from array
            window.currentUserEquipment = window.currentUserEquipment.filter(e => e.id !== equipmentId);
            
            // Save to localStorage
            localStorage.setItem(`equipment_${currentUser.id}`, JSON.stringify(window.currentUserEquipment));
            
            // Update display
            updateEquipmentDisplay();
            updateEquipmentSummaryStats();
            
            showNotification('Equipment deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting equipment:', error);
            showNotification('Error deleting equipment. Please try again.', 'error');
        }
    }

    // Get category icon
    function getCategoryIcon(category) {
        const icons = {
            'Front of House': '🍽️',
            'Small Kitchenware': '🥄',
            'Large Equipment': '🏭',
            'Beverage Equipment': '🥤',
            'Refrigeration': '❄️',
            'Storage': '📦',
            'Safety': '🛡️'
        };
        return icons[category] || '🔧';
    }

    // Get current user
    function getCurrentUser() {
        const currentUser = localStorage.getItem('current_user');
        return currentUser ? JSON.parse(currentUser) : null;
    }

    // Show equipment modal
    function showEquipmentModal() {
        const modal = document.getElementById('equipment-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Hide equipment modal
    function hideEquipmentModal() {
        const modal = document.getElementById('equipment-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Debounce function
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

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEquipmentManager);
    } else {
        initEquipmentManager();
    }

    // Export functions for use in other scripts
    window.equipmentManager = {
        initEquipmentManager,
        initializeEquipmentManagement,
        addEquipmentToUser,
        updateEquipmentInUser,
        deleteEquipment,
        editEquipment,
        loadCurrentUserEquipment,
        getAllEquipment,
        showNotification
    };

    // Ensure equipmentManager is available immediately
    if (typeof window !== 'undefined') {
        console.log('✅ equipmentManager loaded and available on window');
    }

    // Make functions globally available for onclick handlers
    window.editEquipment = editEquipment;
    window.deleteEquipment = deleteEquipment; 

    // --- PDF Import for Equipment ---
    document.getElementById('bulk-import-equipment-pdf')?.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (typeof pdfjsLib === 'undefined') {
            alert('PDF.js library not loaded.');
            return;
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
        let allText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            allText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        const lines = allText.split('\n').map(l => l.trim()).filter(l => l);
        let tableRows = lines.map(line => line.split(/\s{2,}|\t|\|/));
        const previewDiv = document.getElementById('equipment-pdf-preview');
        const head = document.getElementById('equipment-pdf-preview-head');
        const body = document.getElementById('equipment-pdf-preview-body');
        const mappingDiv = document.getElementById('equipment-pdf-mapping');
        if (!tableRows.length) {
            previewDiv.classList.add('hidden');
            return;
        }
        // Assume first row is header
        const headers = tableRows[0];
        // Mapping UI
        const fields = ['Ignore','Name','Category','Status','Location','Brand','Serial','Notes'];
        mappingDiv.innerHTML = headers.map((h,i) => `<select class='notebook-input text-xs' data-col='${i}'>${fields.map(f => `<option value='${f}'>${f}</option>`).join('')}</select>`).join('');
        head.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
        body.innerHTML = tableRows.slice(1).map(row => '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>').join('');
        previewDiv.classList.remove('hidden');
        // Import button
        if (!document.getElementById('equipment-pdf-import-btn')) {
            const btn = document.createElement('button');
            btn.id = 'equipment-pdf-import-btn';
            btn.className = 'sticky-btn mt-2';
            btn.textContent = 'Import';
            previewDiv.appendChild(btn);
            btn.addEventListener('click', function() {
                const selects = mappingDiv.querySelectorAll('select');
                const map = Array.from(selects).map(s => s.value);
                const imported = [];
                for (let row of tableRows.slice(1)) {
                    const obj = {};
                    map.forEach((field, i) => {
                        if (field !== 'Ignore') obj[field.toLowerCase()] = row[i] || '';
                    });
                    if (obj.name) imported.push(obj);
                }
                // Add to equipment list (replace with your add logic)
                imported.forEach(eq => addEquipment(eq));
                showNotification('Imported ' + imported.length + ' equipment items from PDF.');
                previewDiv.classList.add('hidden');
            });
        }
    }); 

    function updateUserInfo() {
      const userInfo = document.getElementById('user-info');
      if (!userInfo) return;
      const username = localStorage.getItem('username');
      userInfo.textContent = username ? username : 'Guest';
    }
    document.addEventListener('DOMContentLoaded', updateUserInfo);

    // Check if equipment is refrigeration equipment
    function isRefrigerationEquipment(equipment) {
        const refrigerationKeywords = [
            'refrigerator', 'fridge', 'freezer', 'walk-in', 'cooler', 'chiller',
            'refrigeration', 'cold storage', 'ice machine', 'blast chiller'
        ];
        
        const equipmentName = equipment.name.toLowerCase();
        const equipmentCategory = equipment.category.toLowerCase();
        const equipmentDescription = (equipment.description || '').toLowerCase();
        
        // Check if category is refrigeration
        if (equipmentCategory.includes('refrigeration') || equipmentCategory.includes('storage')) {
            return true;
        }
        
        // Check if name contains refrigeration keywords
        for (const keyword of refrigerationKeywords) {
            if (equipmentName.includes(keyword)) {
                return true;
            }
        }
        
        // Check if description contains refrigeration keywords
        for (const keyword of refrigerationKeywords) {
            if (equipmentDescription.includes(keyword)) {
                return true;
            }
        }
        
        return false;
    }

    // Setup HACCP tasks for refrigeration equipment
    async function setupHACCPForRefrigeration(equipment) {
        try {
            // Create HACCP temperature monitoring tasks
            const haccpTasks = createHACCPTasks(equipment);
            
            // Save HACCP tasks to user data
            if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
                const existingHACCP = window.userDataManager.getUserData('haccp_tasks') || [];
                existingHACCP.push(...haccpTasks);
                window.userDataManager.saveUserData('haccp_tasks', existingHACCP);
            } else {
                // Fallback to localStorage
                const currentUser = getCurrentUser();
                if (currentUser) {
                    const existingHACCP = JSON.parse(localStorage.getItem(`haccp_tasks_${currentUser.id}`) || '[]');
                    existingHACCP.push(...haccpTasks);
                    localStorage.setItem(`haccp_tasks_${currentUser.id}`, JSON.stringify(existingHACCP));
                }
            }
            
            // Show notification about HACCP setup
            showNotification(`✅ HACCP temperature monitoring setup for ${equipment.name}! 3x daily temperature checks and daily notes will be tracked.`, 'success');
            
            // Also show a more detailed notification
            setTimeout(() => {
                showNotification(`📋 Created ${haccpTasks.length} HACCP tasks for the next 30 days. Check the HACCP page to view and complete tasks.`, 'info');
            }, 2000);
            
            console.log('HACCP tasks created for refrigeration equipment:', equipment.name, haccpTasks);
            
        } catch (error) {
            console.error('Error setting up HACCP for refrigeration equipment:', error);
            showNotification('Warning: Could not setup HACCP monitoring for refrigeration equipment.', 'warning');
        }
    }

    // Create HACCP tasks for refrigeration equipment
    function createHACCPTasks(equipment) {
        const tasks = [];
        const today = new Date();
        
        // Determine temperature range based on equipment type
        let tempRange = { min: 32, max: 41, unit: '°F' };
        if (equipment.name.toLowerCase().includes('freezer')) {
            tempRange = { min: -10, max: 0, unit: '°F' };
        } else if (equipment.name.toLowerCase().includes('walk-in')) {
            tempRange = { min: 32, max: 41, unit: '°F' };
        }
        
        // Create daily temperature monitoring tasks for the next 30 days
        for (let day = 0; day < 30; day++) {
            const taskDate = new Date(today);
            taskDate.setDate(today.getDate() + day);
            const dateString = taskDate.toISOString().split('T')[0];
            
            // Morning temperature check (6-10 AM)
            tasks.push({
                id: `temp_${equipment.id}_${dateString}_morning`,
                equipmentId: equipment.id,
                equipmentName: equipment.name,
                date: dateString,
                timeSlot: 'morning',
                type: 'temperature',
                status: 'pending',
                targetRange: tempRange,
                notes: '',
                createdAt: new Date().toISOString(),
                completedAt: null,
                reading: null
            });
            
            // Afternoon temperature check (2-6 PM)
            tasks.push({
                id: `temp_${equipment.id}_${dateString}_afternoon`,
                equipmentId: equipment.id,
                equipmentName: equipment.name,
                date: dateString,
                timeSlot: 'afternoon',
                type: 'temperature',
                status: 'pending',
                targetRange: tempRange,
                notes: '',
                createdAt: new Date().toISOString(),
                completedAt: null,
                reading: null
            });
            
            // Evening temperature check (6-10 PM)
            tasks.push({
                id: `temp_${equipment.id}_${dateString}_evening`,
                equipmentId: equipment.id,
                equipmentName: equipment.name,
                date: dateString,
                timeSlot: 'evening',
                type: 'temperature',
                status: 'pending',
                targetRange: tempRange,
                notes: '',
                createdAt: new Date().toISOString(),
                completedAt: null,
                reading: null
            });
            
            // Daily notes task
            tasks.push({
                id: `notes_${equipment.id}_${dateString}`,
                equipmentId: equipment.id,
                equipmentName: equipment.name,
                date: dateString,
                timeSlot: 'daily',
                type: 'notes',
                status: 'pending',
                notes: '',
                createdAt: new Date().toISOString(),
                completedAt: null
            });
        }
        
        return tasks;
    }

    // Load vendors for equipment management - REMOVED: Now handled by vendor-management.html
    // async function loadVendorsForEquipment() { ... }

    // Global functions for equipment management page
    window.openAddEquipmentModal = function() {
        showAddEquipmentModal();
    };

    window.openEquipmentDatabaseModal = function() {
        showEquipmentDatabaseModal();
    };

    // Vendor management now handled by dedicated vendor-management.html page
    window.openVendorEquipmentModal = function() {
        window.location.href = 'vendor-management.html';
    };

    window.exportEquipmentData = function() {
        exportEquipmentData();
    };

    window.importEquipmentData = function() {
        importEquipmentData();
    };

    // Vendor equipment modals removed - now handled by vendor-management.html

    // Load vendor equipment
    // async function loadVendorEquipment(vendorId) { ... }

    // Display vendor equipment
    // function displayVendorEquipment(equipment) { ... }

    // Create vendor equipment card
    // function createVendorEquipmentCard(item) { ... }

    // Get availability class
    // function getAvailabilityClass(availability) { ... }

    // Add vendor equipment to inventory
    // async function addVendorEquipmentToInventory(equipmentId) { ... }

    // Export equipment data
    function exportEquipmentData() {
        const data = {
            equipment: window.currentUserEquipment,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `equipment-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Equipment data exported successfully!', 'success');
    }

    // Import equipment data
    function importEquipmentData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    
                    if (data.equipment && Array.isArray(data.equipment)) {
                        // Import equipment
                        for (const equipment of data.equipment) {
                            await addEquipmentToUser(equipment);
                        }
                        
                        showNotification(`Imported ${data.equipment.length} equipment items successfully!`, 'success');
                        loadCurrentUserEquipment();
                    } else {
                        showNotification('Invalid equipment data format', 'error');
                    }
                } catch (error) {
                    console.error('Error importing equipment data:', error);
                    showNotification('Error importing equipment data', 'error');
                }
            }
        };
        input.click();
    }

    // Handle add vendor equipment form submission - REMOVED: Now handled by vendor-management.html
    // async function handleAddVendorEquipment(event) { ... }

    // Filter vendor equipment - REMOVED: Now handled by vendor-management.html
    // function filterVendorEquipment() { ... }

    // View vendor equipment details - REMOVED: Now handled by vendor-management.html
    // function viewVendorEquipmentDetails(equipmentId) { ... }

    // Global functions for vendor equipment - REMOVED: Now handled by vendor-management.html
    // window.addVendorEquipmentToInventory = function(equipmentId) { ... };
    // window.viewVendorEquipmentDetails = function(equipmentId) { ... };

    // URL Import Integration
    function setupUrlImportIntegration() {
        // Open URL import modal
        const openUrlImportBtn = document.getElementById('open-url-import-btn');
        if (openUrlImportBtn) {
            openUrlImportBtn.addEventListener('click', openUrlImportModal);
        }

        // Close URL import modal
        const closeUrlImportBtn = document.getElementById('close-url-import-modal');
        if (closeUrlImportBtn) {
            closeUrlImportBtn.addEventListener('click', closeUrlImportModal);
        }

        // Parse URL button
        const parseUrlBtn = document.getElementById('parse-url-btn');
        if (parseUrlBtn) {
            parseUrlBtn.addEventListener('click', parseEquipmentUrl);
        }

        // Import parsed equipment button
        const importParsedBtn = document.getElementById('import-parsed-equipment');
        if (importParsedBtn) {
            importParsedBtn.addEventListener('click', importParsedEquipment);
        }

        // Edit parsed equipment button
        const editParsedBtn = document.getElementById('edit-parsed-equipment');
        if (editParsedBtn) {
            editParsedBtn.addEventListener('click', editParsedEquipment);
        }

        // URL input Enter key support
        const urlInput = document.getElementById('equipment-url-input');
        if (urlInput) {
            urlInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    parseEquipmentUrl();
                }
            });
        }
    }

    function openUrlImportModal() {
        document.getElementById('url-import-modal').classList.remove('hidden');
        clearUrlImportResults();
        loadRecentUrls();
    }

    function closeUrlImportModal() {
        document.getElementById('url-import-modal').classList.add('hidden');
        clearUrlImportResults();
    }

    function clearUrlImportResults() {
        document.getElementById('url-parsing-loading').classList.add('hidden');
        document.getElementById('url-parsing-error').classList.add('hidden');
        document.getElementById('parsed-equipment-preview').classList.add('hidden');
        document.getElementById('equipment-url-input').value = '';
        
        // Clear parsed data
        window.currentParsedEquipment = null;
    }

    async function parseEquipmentUrl() {
        const urlInput = document.getElementById('equipment-url-input');
        const url = urlInput.value.trim();
        
        if (!url) {
            alert('Please enter a URL');
            return;
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            showUrlError('Invalid URL format. Please enter a complete URL starting with http:// or https://');
            return;
        }

        // Show loading state
        clearUrlImportResults();
        document.getElementById('url-parsing-loading').classList.remove('hidden');

        try {
            // Call the backend API
            const response = await fetch('http://localhost:8000/api/integrations/equipment/parse-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.equipment) {
                displayParsedEquipment(data.equipment);
                saveRecentUrl(url, data.equipment.supplier);
            } else {
                throw new Error('Failed to parse equipment data from URL');
            }
        } catch (error) {
            console.error('URL parsing error:', error);
            showUrlError(error.message);
        }
    }

    function displayParsedEquipment(equipment) {
        // Hide loading and error states
        document.getElementById('url-parsing-loading').classList.add('hidden');
        document.getElementById('url-parsing-error').classList.add('hidden');
        
        // Store parsed equipment globally
        window.currentParsedEquipment = equipment;
        
        // Populate preview
        document.getElementById('parsed-name').textContent = equipment.name || 'Unknown';
        document.getElementById('parsed-brand').textContent = equipment.brand || 'Unknown';
        document.getElementById('parsed-model').textContent = equipment.model || 'N/A';
        document.getElementById('parsed-category').textContent = equipment.category || 'Equipment';
        document.getElementById('parsed-price').textContent = equipment.price || '0.00';
        document.getElementById('parsed-supplier').textContent = equipment.supplier || 'Unknown';
        document.getElementById('parsed-description').textContent = equipment.description || 'No description available';
        
        // Populate specifications
        const specsContainer = document.getElementById('parsed-specs');
        if (equipment.specifications && Object.keys(equipment.specifications).length > 0) {
            specsContainer.innerHTML = Object.entries(equipment.specifications)
                .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                .join('');
        } else {
            specsContainer.innerHTML = '<p class="text-gray-500">No specifications available</p>';
        }
        
        // Show preview
        document.getElementById('parsed-equipment-preview').classList.remove('hidden');
    }

    function showUrlError(message) {
        document.getElementById('url-parsing-loading').classList.add('hidden');
        document.getElementById('parsed-equipment-preview').classList.add('hidden');
        document.getElementById('url-error-message').textContent = message;
        document.getElementById('url-parsing-error').classList.remove('hidden');
    }

    function importParsedEquipment() {
        if (!window.currentParsedEquipment) {
            alert('No equipment data to import');
            return;
        }
        
        const equipment = window.currentParsedEquipment;
        
        // Populate the add equipment form with parsed data
        document.getElementById('equipment-name').value = equipment.name || '';
        document.getElementById('equipment-brand').value = equipment.brand || '';
        document.getElementById('equipment-category').value = equipment.category || '';
        
        // Create description with all available info
        let description = equipment.description || '';
        if (equipment.model) {
            description += `\nModel: ${equipment.model}`;
        }
        if (equipment.specifications && Object.keys(equipment.specifications).length > 0) {
            description += '\n\nSpecifications:\n';
            description += Object.entries(equipment.specifications)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
        }
        if (equipment.source_url) {
            description += `\n\nSource: ${equipment.source_url}`;
        }
        
        document.getElementById('equipment-description').value = description;
        
        // Set price if available
        if (equipment.price && equipment.price > 0) {
            const priceField = document.getElementById('equipment-price');
            if (priceField) {
                priceField.value = equipment.price;
            }
        }
        
        // Close URL import modal and open add equipment modal
        closeUrlImportModal();
        document.getElementById('add-equipment-modal').classList.remove('hidden');
        
        showNotification(`Equipment "${equipment.name}" imported from ${equipment.supplier}! Review and save.`, 'success');
    }

    function editParsedEquipment() {
        if (!window.currentParsedEquipment) {
            alert('No equipment data to edit');
            return;
        }
        
        // Same as import but keep URL modal open for further editing
        importParsedEquipment();
        
        // Reopen URL modal
        setTimeout(() => {
            openUrlImportModal();
            displayParsedEquipment(window.currentParsedEquipment);
        }, 100);
    }

    function saveRecentUrl(url, supplier) {
        const recent = JSON.parse(localStorage.getItem('recentEquipmentUrls') || '[]');
        const urlData = {
            url: url,
            supplier: supplier,
            timestamp: new Date().toISOString()
        };
        
        // Remove if already exists
        const filtered = recent.filter(item => item.url !== url);
        
        // Add to beginning and limit to 10
        filtered.unshift(urlData);
        const limited = filtered.slice(0, 10);
        
        localStorage.setItem('recentEquipmentUrls', JSON.stringify(limited));
    }

    function loadRecentUrls() {
        const recent = JSON.parse(localStorage.getItem('recentEquipmentUrls') || '[]');
        const container = document.getElementById('recent-urls-list');
        
        if (recent.length === 0) {
            document.getElementById('recent-urls-section').classList.add('hidden');
            return;
        }
        
        container.innerHTML = recent.map(item => `
            <div class="flex items-center gap-3 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                 onclick="useRecentUrl('${item.url}')">
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-800">${item.supplier}</p>
                    <p class="text-xs text-gray-600 truncate" title="${item.url}">${item.url}</p>
                </div>
                <div class="text-xs text-gray-500">
                    ${new Date(item.timestamp).toLocaleDateString()}
                </div>
                <button onclick="event.stopPropagation(); removeRecentUrl('${item.url}')" 
                        class="text-red-500 hover:text-red-700 text-sm">×</button>
            </div>
        `).join('');
        
        document.getElementById('recent-urls-section').classList.remove('hidden');
    }

    window.useRecentUrl = function(url) {
        document.getElementById('equipment-url-input').value = url;
        parseEquipmentUrl();
    };

    window.removeRecentUrl = function(url) {
        const recent = JSON.parse(localStorage.getItem('recentEquipmentUrls') || '[]');
        const filtered = recent.filter(item => item.url !== url);
        localStorage.setItem('recentEquipmentUrls', JSON.stringify(filtered));
        loadRecentUrls();
    };

    // WebstaurantStore Integration
    function openWebstaurantModal() {
        document.getElementById('webstaurant-modal').classList.remove('hidden');
        // Clear previous results
        clearWebstaurantResults();
    }

    function closeWebstaurantModal() {
        document.getElementById('webstaurant-modal').classList.add('hidden');
        clearWebstaurantResults();
    }

    function clearWebstaurantResults() {
        document.getElementById('webstaurant-loading').classList.add('hidden');
        document.getElementById('webstaurant-results').classList.add('hidden');
        document.getElementById('webstaurant-no-results').classList.add('hidden');
        document.getElementById('webstaurant-error').classList.add('hidden');
        document.getElementById('webstaurant-products').innerHTML = '';
        document.getElementById('webstaurant-search').value = '';
    }

    async function searchWebstaurantStore(query = null) {
        const searchInput = document.getElementById('webstaurant-search');
        const searchTerm = query || searchInput.value.trim();
        
        if (!searchTerm) {
            alert('Please enter a search term');
            return;
        }

        // Show loading state
        clearWebstaurantResults();
        document.getElementById('webstaurant-loading').classList.remove('hidden');

        try {
            // Call the backend API
            const response = await fetch(`http://localhost:8000/api/integrations/webstaurant/search?query=${encodeURIComponent(searchTerm)}&limit=20`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.products.length > 0) {
                displayWebstaurantResults(data.products);
            } else {
                document.getElementById('webstaurant-no-results').classList.remove('hidden');
            }
        } catch (error) {
            console.error('WebstaurantStore search error:', error);
            document.getElementById('webstaurant-error').classList.remove('hidden');
            document.getElementById('webstaurant-error-message').textContent = error.message;
        }
    }



    function displayWebstaurantResults(products) {
        const container = document.getElementById('webstaurant-products');
        const countElement = document.getElementById('webstaurant-result-count');
        
        countElement.textContent = products.length;
        
        container.innerHTML = products.map(product => `
            <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div class="flex items-start gap-4">
                    <img src="${product.image_url}" alt="${product.name}" class="w-20 h-20 object-cover rounded">
                    <div class="flex-1">
                        <h5 class="font-semibold text-gray-800 mb-1">${product.name}</h5>
                        <p class="text-sm text-gray-600 mb-2">${product.brand} ${product.model}</p>
                        <p class="text-sm text-gray-500 mb-2">${product.category} - ${product.subcategory}</p>
                        <div class="flex items-center gap-2 mb-2">
                            <p class="text-lg font-bold text-[#4a7c2c]">$${product.sale_price || product.price}</p>
                            ${product.sale_price ? `<p class="text-sm text-gray-500 line-through">$${product.price}</p>` : ''}
                        </div>
                        <p class="text-xs text-gray-600 mb-3 line-clamp-2">${product.description}</p>
                        <div class="flex gap-2">
                            <button onclick="importWebstaurantProduct('${product.id}')" 
                                    class="px-3 py-1 bg-[#4a7c2c] text-white text-xs rounded hover:bg-[#3d6a25] transition-colors">
                                📥 Import
                            </button>
                            <a href="${product.product_url}" target="_blank" 
                               class="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors">
                                🔗 View
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('webstaurant-results').classList.remove('hidden');
    }

    async function importWebstaurantProduct(productId) {
        try {
            // Fetch product details from API
            const response = await fetch(`http://localhost:8000/api/integrations/webstaurant/product/${productId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success || !data.product) {
                throw new Error('Product not found');
            }
            
            const product = data.product;
            
            // Populate the add equipment form
            document.getElementById('equipment-name').value = product.name;
            document.getElementById('equipment-brand').value = `${product.brand} ${product.model}`;
            document.getElementById('equipment-category').value = product.category;
            document.getElementById('equipment-description').value = product.description;
            
            // Add specifications to description if available
            if (product.specifications) {
                const specs = Object.entries(product.specifications)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                document.getElementById('equipment-description').value += `\n\nSpecifications: ${specs}`;
            }
            
            // Close WebstaurantStore modal and open add equipment modal
            closeWebstaurantModal();
            openAddEquipmentModal();
            
            // Show success message
            showNotification(`✅ Imported ${product.name} from WebstaurantStore`, 'success');
            
        } catch (error) {
            console.error('Error importing product:', error);
            showNotification(`❌ Failed to import product: ${error.message}`, 'error');
        }
    }

    function searchWebstaurantByCategory(category) {
        const categoryMap = {
            'refrigeration': 'refrigerator freezer cooling',
            'cooking': 'oven stove range grill',
            'preparation': 'mixer processor blender',
            'storage': 'shelf rack cabinet',
            'cleaning': 'dishwasher sink sanitizer',
            'safety': 'fire extinguisher hood',
            'smallwares': 'utensil tool knife',
            'beverage': 'coffee tea juice dispenser'
        };
        
        const searchTerm = categoryMap[category] || category;
        document.getElementById('webstaurant-search').value = searchTerm;
        searchWebstaurantStore(searchTerm);
    }
} 