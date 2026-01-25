// HACCP Temperature Tracking System for Iterum R&D Chef Notebook
// Handles refrigerator temperature monitoring, alerts, and compliance tracking

// Prevent duplicate loading
if (typeof window.HACCPManager !== 'undefined') {
    console.log('HACCPManager already loaded, skipping initialization');
} else {
    class HACCPManager {
        constructor() {
            this.temperatureReadings = [];
            this.sanitizerTests = [];
            this.dishwasherTests = [];
            this.refrigerators = [];
            this.temperatureRanges = {
                refrigerator: { min: 32, max: 41, unit: '°F' },
                freezer: { min: -10, max: 0, unit: '°F' },
                walkIn: { min: 32, max: 41, unit: '°F' }
            };
            this.sanitizerRanges = {
                chlorine: { min: 50, max: 200, unit: 'ppm' },
                quaternary: { min: 200, max: 400, unit: 'ppm' },
                iodine: { min: 12.5, max: 25, unit: 'ppm' }
            };
            this.dishwasherRanges = {
                temperature: { min: 180, max: 195, unit: '°F' },
                sanitizer: { min: 50, max: 200, unit: 'ppm' },
                cycleTime: { min: 1.5, max: 3.0, unit: 'min' }
            };
            this.timeSlots = {
                morning: { start: 6, end: 10, label: '🌅 Morning (6-10 AM)' },
                afternoon: { start: 14, end: 18, label: '🌞 Afternoon (2-6 PM)' },
                evening: { start: 18, end: 22, label: '🌆 Evening (6-10 PM)' },
                night: { start: 22, end: 6, label: '🌙 Night (10 PM-6 AM)' }
            };
            
            this.init();
        }
        
        init() {
            this.loadFromLocalStorage();
            this.setupEventListeners();
            this.loadRefrigeratorsFromEquipment();
            this.updateDisplay();
            this.checkForAlerts();
        }
        
        loadFromLocalStorage() {
            // Use user-specific data manager
            if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
                this.temperatureReadings = window.userDataManager.getUserHACCPReadings();
                this.sanitizerTests = window.userDataManager.getUserData('haccp_sanitizer') || [];
                this.dishwasherTests = window.userDataManager.getUserData('haccp_dishwasher') || [];
            } else {
                // Fallback to global storage
                const saved = localStorage.getItem('iterum_haccp_readings');
                if (saved) {
                    this.temperatureReadings = JSON.parse(saved);
                }
                
                const savedSanitizer = localStorage.getItem('iterum_haccp_sanitizer');
                if (savedSanitizer) {
                    this.sanitizerTests = JSON.parse(savedSanitizer);
                }
                
                const savedDishwasher = localStorage.getItem('iterum_haccp_dishwasher');
                if (savedDishwasher) {
                    this.dishwasherTests = JSON.parse(savedDishwasher);
                }
            }
        }
        
        saveToLocalStorage() {
            // Use user-specific data manager
            if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
                window.userDataManager.saveUserHACCPReadings(this.temperatureReadings);
                window.userDataManager.saveUserData('haccp_sanitizer', this.sanitizerTests);
                window.userDataManager.saveUserData('haccp_dishwasher', this.dishwasherTests);
            } else {
                // Fallback to global storage
                localStorage.setItem('iterum_haccp_readings', JSON.stringify(this.temperatureReadings));
                localStorage.setItem('iterum_haccp_sanitizer', JSON.stringify(this.sanitizerTests));
                localStorage.setItem('iterum_haccp_dishwasher', JSON.stringify(this.dishwasherTests));
            }
        }
        
        loadRefrigeratorsFromEquipment() {
            // Load refrigerators from equipment database
            const equipmentData = localStorage.getItem('iterum_equipment');
            if (equipmentData) {
                const equipment = JSON.parse(equipmentData);
                this.refrigerators = equipment.filter(item => 
                    item.category === 'Refrigeration' || 
                    item.name.toLowerCase().includes('refrigerator') ||
                    item.name.toLowerCase().includes('fridge') ||
                    item.name.toLowerCase().includes('freezer') ||
                    item.name.toLowerCase().includes('walk-in')
                );
            }
            
            this.updateRefrigeratorSelects();
        }
        
        updateRefrigeratorSelects() {
            const selects = ['quick-fridge-select', 'haccp-filter-fridge'];
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    // Keep the first option (placeholder)
                    const placeholder = select.options[0];
                    select.innerHTML = '';
                    select.appendChild(placeholder);
                    
                    // Add refrigerators
                    this.refrigerators.forEach(fridge => {
                        const option = document.createElement('option');
                        option.value = fridge.id;
                        option.textContent = fridge.name;
                        select.appendChild(option);
                    });
                    
                    // Add sanitizer locations
                    const sanitizerLocations = ['Prep Station', 'Dish Station', 'Service Station', 'Bar Station', 'Back Kitchen', 'Front Kitchen'];
                    sanitizerLocations.forEach(location => {
                        const option = document.createElement('option');
                        option.value = location;
                        option.textContent = `🧪 ${location}`;
                        select.appendChild(option);
                    });
                    
                    // Add dishwashers
                    const dishwashers = ['Main Dishwasher', 'Bar Dishwasher', 'Prep Dishwasher'];
                    dishwashers.forEach(dishwasher => {
                        const option = document.createElement('option');
                        option.value = dishwasher;
                        option.textContent = `🧽 ${dishwasher}`;
                        select.appendChild(option);
                    });
                }
            });
        }
        
        setupEventListeners() {
            // Quick temperature entry
            const quickAddBtn = document.getElementById('quick-add-temp');
            if (quickAddBtn) {
                quickAddBtn.addEventListener('click', () => this.addQuickTemperatureReading());
            }
            
            // Add reading button
            const addReadingBtn = document.getElementById('add-haccp-reading');
            if (addReadingBtn) {
                addReadingBtn.addEventListener('click', () => this.showAddReadingModal());
            }
            
            // Generate report button
            const reportBtn = document.getElementById('haccp-report');
            if (reportBtn) {
                reportBtn.addEventListener('click', () => this.generateHACCPReport());
            }
            
            // Export data button
            const exportBtn = document.getElementById('haccp-export');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportHACCPData());
            }
            
            // Sanitizer test button
            const addSanitizerBtn = document.getElementById('add-sanitizer-test');
            if (addSanitizerBtn) {
                addSanitizerBtn.addEventListener('click', () => this.addSanitizerTest());
            }
            
            // Dishwasher test button
            const addDishwasherBtn = document.getElementById('add-dishwasher-test');
            if (addDishwasherBtn) {
                addDishwasherBtn.addEventListener('click', () => this.addDishwasherTest());
            }
            
            // Filters
            const filterFridge = document.getElementById('haccp-filter-fridge');
            if (filterFridge) {
                filterFridge.addEventListener('change', () => this.updateHistoricalDisplay());
            }
            
            const filterDate = document.getElementById('haccp-filter-date');
            if (filterDate) {
                filterDate.addEventListener('change', () => this.updateHistoricalDisplay());
            }
        }
        
        addQuickTemperatureReading() {
            const fridgeSelect = document.getElementById('quick-fridge-select');
            const tempInput = document.getElementById('quick-temp');
            const timeSlotSelect = document.getElementById('quick-time-slot');
            
            const fridgeId = fridgeSelect.value;
            const temperature = parseFloat(tempInput.value);
            const timeSlot = timeSlotSelect.value;
            
            if (!fridgeId || isNaN(temperature)) {
                this.showNotification('Please select a refrigerator and enter a valid temperature', 'error');
                return;
            }
            
            const fridge = this.refrigerators.find(f => f.id == fridgeId);
            if (!fridge) {
                this.showNotification('Selected refrigerator not found', 'error');
                return;
            }
            
            const reading = {
                id: Date.now(),
                refrigerator_id: fridgeId,
                refrigerator_name: fridge.name,
                temperature: temperature,
                time_slot: timeSlot,
                timestamp: new Date().toISOString(),
                notes: '',
                status: this.getTemperatureStatus(temperature, fridge.category || 'refrigerator')
            };
            
            this.temperatureReadings.push(reading);
            this.saveToLocalStorage();
            this.updateDisplay();
            this.checkForAlerts();
            
            // Clear form
            tempInput.value = '';
            
            this.showNotification(`Temperature logged: ${fridge.name} - ${temperature}°F`, 'success');
        }
        
        showAddReadingModal() {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div class="flex justify-between items-center p-6 border-b">
                        <h2 class="text-xl font-bold text-gray-800">Add Temperature Reading</h2>
                        <button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" onclick="this.closest('.fixed').remove()">&times;</button>
                    </div>
                    <div class="p-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Refrigerator</label>
                                <select id="modal-fridge-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option value="">Select Refrigerator</option>
                                    ${this.refrigerators.map(fridge => `<option value="${fridge.id}">${fridge.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Temperature (°F)</label>
                                <input type="number" id="modal-temp" step="0.1" placeholder="35.0" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                                <select id="modal-time-slot" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option value="morning">🌅 Morning (6-10 AM)</option>
                                    <option value="afternoon">🌞 Afternoon (2-6 PM)</option>
                                    <option value="evening">🌆 Evening (6-10 PM)</option>
                                    <option value="night">🌙 Night (10 PM-6 AM)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea id="modal-notes" rows="3" placeholder="Any additional notes about this reading..."
                                          class="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
                            </div>
                        </div>
                        <div class="flex gap-3 mt-6">
                            <button id="modal-add-reading" class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                                Add Reading
                            </button>
                            <button class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onclick="this.closest('.fixed').remove()">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const addBtn = modal.querySelector('#modal-add-reading');
            addBtn.addEventListener('click', () => this.addModalTemperatureReading(modal));
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
        
        addModalTemperatureReading(modal) {
            const fridgeSelect = modal.querySelector('#modal-fridge-select');
            const tempInput = modal.querySelector('#modal-temp');
            const timeSlotSelect = modal.querySelector('#modal-time-slot');
            const notesInput = modal.querySelector('#modal-notes');
            
            const fridgeId = fridgeSelect.value;
            const temperature = parseFloat(tempInput.value);
            const timeSlot = timeSlotSelect.value;
            const notes = notesInput.value.trim();
            
            if (!fridgeId || isNaN(temperature)) {
                this.showNotification('Please select a refrigerator and enter a valid temperature', 'error');
                return;
            }
            
            const fridge = this.refrigerators.find(f => f.id == fridgeId);
            if (!fridge) {
                this.showNotification('Selected refrigerator not found', 'error');
                return;
            }
            
            const reading = {
                id: Date.now(),
                refrigerator_id: fridgeId,
                refrigerator_name: fridge.name,
                temperature: temperature,
                time_slot: timeSlot,
                timestamp: new Date().toISOString(),
                notes: notes,
                status: this.getTemperatureStatus(temperature, fridge.category || 'refrigerator')
            };
            
            this.temperatureReadings.push(reading);
            this.saveToLocalStorage();
            this.updateDisplay();
            this.checkForAlerts();
            
            modal.remove();
            this.showNotification(`Temperature logged: ${fridge.name} - ${temperature}°F`, 'success');
        }
        
        getTemperatureStatus(temperature, category) {
            const ranges = this.temperatureRanges[category] || this.temperatureRanges.refrigerator;
            
            if (temperature < ranges.min) {
                return 'too_cold';
            } else if (temperature > ranges.max) {
                return 'too_warm';
            } else {
                return 'normal';
            }
        }
        
        getStatusDisplay(status) {
            switch (status) {
                case 'normal':
                    return '<span class="text-green-600 font-medium">✓ Normal</span>';
                case 'too_cold':
                    return '<span class="text-blue-600 font-medium">❄️ Too Cold</span>';
                case 'too_warm':
                    return '<span class="text-red-600 font-medium">🔥 Too Warm</span>';
                default:
                    return '<span class="text-gray-600 font-medium">Unknown</span>';
            }
        }
        
        updateDisplay() {
            this.updateTodayReadings();
            this.updateHistoricalDisplay();
            this.updateStatus();
            this.updateTodaySanitizerTests();
            this.updateTodayDishwasherTests();
        }
        
        updateTodayReadings() {
            const todayContainer = document.getElementById('today-readings');
            if (!todayContainer) return;
            
            const today = new Date().toDateString();
            const todayReadings = this.temperatureReadings.filter(reading => 
                new Date(reading.timestamp).toDateString() === today
            );
            
            if (todayReadings.length === 0) {
                todayContainer.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No temperature readings for today</p>';
                return;
            }
            
            todayContainer.innerHTML = todayReadings.map(reading => `
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-semibold text-gray-800">${reading.refrigerator_name}</h4>
                        <span class="text-sm text-gray-500">${this.timeSlots[reading.time_slot]?.label || reading.time_slot}</span>
                    </div>
                    <div class="text-2xl font-bold ${reading.status === 'normal' ? 'text-green-600' : reading.status === 'too_cold' ? 'text-blue-600' : 'text-red-600'}">
                        ${reading.temperature}°F
                    </div>
                    <div class="mt-2">
                        ${this.getStatusDisplay(reading.status)}
                    </div>
                    ${reading.notes ? `<p class="text-sm text-gray-600 mt-2">${reading.notes}</p>` : ''}
                    <div class="mt-3 flex gap-2">
                        <button onclick="haccpManager.editReading(${reading.id})" class="text-blue-600 hover:text-blue-800 text-sm">
                            ✏️ Edit
                        </button>
                        <button onclick="haccpManager.deleteReading(${reading.id})" class="text-red-600 hover:text-red-800 text-sm">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        updateHistoricalDisplay(tabType = 'temperature') {
            const tableBody = document.getElementById('haccp-table-body');
            if (!tableBody) return;
            
            const filterFridge = document.getElementById('haccp-filter-fridge')?.value;
            const filterDate = document.getElementById('haccp-filter-date')?.value;
            
            let filteredData = [];
            
            switch (tabType) {
                case 'temperature':
                    filteredData = [...this.temperatureReadings];
                    break;
                case 'sanitizer':
                    filteredData = [...this.sanitizerTests];
                    break;
                case 'dishwasher':
                    filteredData = [...this.dishwasherTests];
                    break;
            }
            
            // Apply filters
            if (filterFridge) {
                filteredData = filteredData.filter(item => {
                    if (tabType === 'temperature') {
                        return item.refrigerator_id == filterFridge;
                    } else if (tabType === 'sanitizer') {
                        return item.location === filterFridge;
                    } else if (tabType === 'dishwasher') {
                        return item.dishwasher === filterFridge;
                    }
                    return true;
                });
            }
            
            if (filterDate && filterDate !== 'all') {
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - parseInt(filterDate));
                filteredData = filteredData.filter(item => 
                    new Date(item.timestamp) >= daysAgo
                );
            }
            
            // Sort by timestamp (newest first)
            filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            if (filteredData.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No ${tabType} data found</td></tr>`;
                return;
            }
            
            switch (tabType) {
                case 'temperature':
                    tableBody.innerHTML = filteredData.map(reading => {
                        const date = new Date(reading.timestamp);
                        return `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-2 text-sm">${date.toLocaleDateString()}</td>
                                <td class="px-4 py-2 text-sm">${this.timeSlots[reading.time_slot]?.label || reading.time_slot}</td>
                                <td class="px-4 py-2 text-sm font-medium">${reading.refrigerator_name}</td>
                                <td class="px-4 py-2 text-sm font-bold ${reading.status === 'normal' ? 'text-green-600' : reading.status === 'too_cold' ? 'text-blue-600' : 'text-red-600'}">
                                    ${reading.temperature}°F
                                </td>
                                <td class="px-4 py-2 text-sm">${this.getStatusDisplay(reading.status)}</td>
                                <td class="px-4 py-2 text-sm text-gray-600">${reading.notes || '-'}</td>
                                <td class="px-4 py-2 text-sm">
                                    <button onclick="haccpManager.editReading(${reading.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                                        ✏️
                                    </button>
                                    <button onclick="haccpManager.deleteReading(${reading.id})" class="text-red-600 hover:text-red-800">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                    break;
                    
                case 'sanitizer':
                    tableBody.innerHTML = filteredData.map(test => {
                        const date = new Date(test.timestamp);
                        return `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-2 text-sm">${date.toLocaleDateString()}</td>
                                <td class="px-4 py-2 text-sm">${this.timeSlots[test.time_slot]?.label || test.time_slot}</td>
                                <td class="px-4 py-2 text-sm font-medium">${test.location}</td>
                                <td class="px-4 py-2 text-sm font-bold ${test.status === 'normal' ? 'text-green-600' : test.status === 'too_low' ? 'text-red-600' : 'text-orange-600'}">
                                    ${test.concentration} ppm
                                </td>
                                <td class="px-4 py-2 text-sm">${this.getSanitizerStatusDisplay(test.status)}</td>
                                <td class="px-4 py-2 text-sm text-gray-600">${test.type}</td>
                                <td class="px-4 py-2 text-sm">
                                    <button onclick="haccpManager.deleteSanitizerTest(${test.id})" class="text-red-600 hover:text-red-800">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                    break;
                    
                case 'dishwasher':
                    tableBody.innerHTML = filteredData.map(test => {
                        const date = new Date(test.timestamp);
                        return `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-2 text-sm">${date.toLocaleDateString()}</td>
                                <td class="px-4 py-2 text-sm">${this.timeSlots[test.time_slot]?.label || test.time_slot}</td>
                                <td class="px-4 py-2 text-sm font-medium">${test.dishwasher}</td>
                                <td class="px-4 py-2 text-sm font-bold ${test.temp_status === 'passed' ? 'text-green-600' : test.temp_status === 'warning' ? 'text-orange-600' : 'text-red-600'}">
                                    ${test.temperature}°F
                                </td>
                                <td class="px-4 py-2 text-sm font-bold ${test.sanitizer_status === 'passed' ? 'text-green-600' : test.sanitizer_status === 'warning' ? 'text-orange-600' : 'text-red-600'}">
                                    ${test.sanitizer} ppm
                                </td>
                                <td class="px-4 py-2 text-sm">${this.getDishwasherStatusDisplay(test.status)}</td>
                                <td class="px-4 py-2 text-sm">
                                    <button onclick="haccpManager.deleteDishwasherTest(${test.id})" class="text-red-600 hover:text-red-800">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                    break;
            }
        }
        
        updateStatus() {
            const statusElement = document.getElementById('haccp-status');
            if (!statusElement) return;
            
            const today = new Date().toDateString();
            const todayReadings = this.temperatureReadings.filter(reading => 
                new Date(reading.timestamp).toDateString() === today
            );
            
            const alerts = todayReadings.filter(reading => reading.status !== 'normal');
            
            if (alerts.length === 0) {
                statusElement.textContent = 'All temperatures within range';
                statusElement.className = 'text-sm text-green-600';
            } else {
                statusElement.textContent = `${alerts.length} temperature alert(s) today`;
                statusElement.className = 'text-sm text-red-600 font-medium';
            }
        }
        
        checkForAlerts() {
            const alertsContainer = document.getElementById('haccp-alerts');
            const alertList = document.getElementById('alert-list');
            
            if (!alertsContainer || !alertList) return;
            
            const today = new Date().toDateString();
            const todayReadings = this.temperatureReadings.filter(reading => 
                new Date(reading.timestamp).toDateString() === today
            );
            const todaySanitizerTests = this.sanitizerTests.filter(test => 
                new Date(test.timestamp).toDateString() === today
            );
            const todayDishwasherTests = this.dishwasherTests.filter(test => 
                new Date(test.timestamp).toDateString() === today
            );
            
            const tempAlerts = todayReadings.filter(reading => reading.status !== 'normal');
            const sanitizerAlerts = todaySanitizerTests.filter(test => test.status !== 'normal');
            const dishwasherAlerts = todayDishwasherTests.filter(test => test.status === 'failed');
            
            const allAlerts = [...tempAlerts, ...sanitizerAlerts, ...dishwasherAlerts];
            
            if (allAlerts.length === 0) {
                alertsContainer.classList.add('hidden');
                return;
            }
            
            alertsContainer.classList.remove('hidden');
            alertList.innerHTML = allAlerts.map(alert => {
                if (alert.refrigerator_name) {
                    // Temperature alert
                    return `
                        <div class="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                            <div>
                                <span class="font-medium text-red-800">🌡️ ${alert.refrigerator_name}</span>
                                <span class="text-red-600 ml-2">${alert.temperature}°F</span>
                                <span class="text-red-600 ml-2">(${this.getStatusDisplay(alert.status).replace(/<[^>]*>/g, '')})</span>
                            </div>
                            <span class="text-sm text-red-600">${this.timeSlots[alert.time_slot]?.label || alert.time_slot}</span>
                        </div>
                    `;
                } else if (alert.location) {
                    // Sanitizer alert
                    return `
                        <div class="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
                            <div>
                                <span class="font-medium text-orange-800">🧪 ${alert.location}</span>
                                <span class="text-orange-600 ml-2">${alert.concentration} ppm</span>
                                <span class="text-orange-600 ml-2">(${this.getSanitizerStatusDisplay(alert.status).replace(/<[^>]*>/g, '')})</span>
                            </div>
                            <span class="text-sm text-orange-600">${this.timeSlots[alert.time_slot]?.label || alert.time_slot}</span>
                        </div>
                    `;
                } else if (alert.dishwasher) {
                    // Dishwasher alert
                    return `
                        <div class="flex items-center justify-between p-3 bg-purple-100 rounded-lg">
                            <div>
                                <span class="font-medium text-purple-800">🧽 ${alert.dishwasher}</span>
                                <span class="text-purple-600 ml-2">${alert.temperature}°F / ${alert.sanitizer} ppm</span>
                                <span class="text-purple-600 ml-2">(${this.getDishwasherStatusDisplay(alert.status).replace(/<[^>]*>/g, '')})</span>
                            </div>
                            <span class="text-sm text-purple-600">${this.timeSlots[alert.time_slot]?.label || alert.time_slot}</span>
                        </div>
                    `;
                }
            }).join('');
        }
        
        updateTodaySanitizerTests() {
            const today = new Date().toDateString();
            const todayTests = this.sanitizerTests.filter(test => 
                new Date(test.timestamp).toDateString() === today
            );
            
            // Add sanitizer tests to today's readings display
            const todayContainer = document.getElementById('today-readings');
            if (!todayContainer) return;
            
            if (todayTests.length > 0) {
                const sanitizerCards = todayTests.map(test => `
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-semibold text-gray-800">🧪 ${test.location}</h4>
                            <span class="text-sm text-gray-500">${this.timeSlots[test.time_slot]?.label || test.time_slot}</span>
                        </div>
                        <div class="text-2xl font-bold ${test.status === 'normal' ? 'text-green-600' : test.status === 'too_low' ? 'text-red-600' : 'text-orange-600'}">
                            ${test.concentration} ppm
                        </div>
                        <div class="mt-2">
                            ${this.getSanitizerStatusDisplay(test.status)}
                        </div>
                        <div class="text-sm text-gray-600 mt-1">${test.type}</div>
                    </div>
                `).join('');
                
                // Append sanitizer cards to existing content
                todayContainer.innerHTML += sanitizerCards;
            }
        }
        
        updateTodayDishwasherTests() {
            const today = new Date().toDateString();
            const todayTests = this.dishwasherTests.filter(test => 
                new Date(test.timestamp).toDateString() === today
            );
            
            // Add dishwasher tests to today's readings display
            const todayContainer = document.getElementById('today-readings');
            if (!todayContainer) return;
            
            if (todayTests.length > 0) {
                const dishwasherCards = todayTests.map(test => `
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-semibold text-gray-800">🧽 ${test.dishwasher}</h4>
                            <span class="text-sm text-gray-500">${this.timeSlots[test.time_slot]?.label || test.time_slot}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span class="text-gray-600">Temp:</span>
                                <span class="font-medium ${test.temp_status === 'passed' ? 'text-green-600' : test.temp_status === 'warning' ? 'text-orange-600' : 'text-red-600'}">
                                    ${test.temperature}°F
                                </span>
                            </div>
                            <div>
                                <span class="text-gray-600">Sanitizer:</span>
                                <span class="font-medium ${test.sanitizer_status === 'passed' ? 'text-green-600' : test.sanitizer_status === 'warning' ? 'text-orange-600' : 'text-red-600'}">
                                    ${test.sanitizer} ppm
                                </span>
                            </div>
                        </div>
                        <div class="mt-2">
                            ${this.getDishwasherStatusDisplay(test.status)}
                        </div>
                        <div class="text-sm text-gray-600 mt-1">Cycle: ${test.cycle_time} min</div>
                    </div>
                `).join('');
                
                // Append dishwasher cards to existing content
                todayContainer.innerHTML += dishwasherCards;
            }
        }
        
        editReading(readingId) {
            const reading = this.temperatureReadings.find(r => r.id === readingId);
            if (!reading) return;
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div class="flex justify-between items-center p-6 border-b">
                        <h2 class="text-xl font-bold text-gray-800">Edit Temperature Reading</h2>
                        <button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" onclick="this.closest('.fixed').remove()">&times;</button>
                    </div>
                    <div class="p-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Refrigerator</label>
                                <select id="edit-fridge-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    ${this.refrigerators.map(fridge => 
                                        `<option value="${fridge.id}" ${fridge.id == reading.refrigerator_id ? 'selected' : ''}>${fridge.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Temperature (°F)</label>
                                <input type="number" id="edit-temp" step="0.1" value="${reading.temperature}" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                                <select id="edit-time-slot" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option value="morning" ${reading.time_slot === 'morning' ? 'selected' : ''}>🌅 Morning (6-10 AM)</option>
                                    <option value="afternoon" ${reading.time_slot === 'afternoon' ? 'selected' : ''}>🌞 Afternoon (2-6 PM)</option>
                                    <option value="evening" ${reading.time_slot === 'evening' ? 'selected' : ''}>🌆 Evening (6-10 PM)</option>
                                    <option value="night" ${reading.time_slot === 'night' ? 'selected' : ''}>🌙 Night (10 PM-6 AM)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea id="edit-notes" rows="3" 
                                          class="w-full px-3 py-2 border border-gray-300 rounded-lg">${reading.notes || ''}</textarea>
                            </div>
                        </div>
                        <div class="flex gap-3 mt-6">
                            <button id="edit-save-reading" class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                                Save Changes
                            </button>
                            <button class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onclick="this.closest('.fixed').remove()">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const saveBtn = modal.querySelector('#edit-save-reading');
            saveBtn.addEventListener('click', () => this.saveEditedReading(readingId, modal));
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
        
        saveEditedReading(readingId, modal) {
            const fridgeSelect = modal.querySelector('#edit-fridge-select');
            const tempInput = modal.querySelector('#edit-temp');
            const timeSlotSelect = modal.querySelector('#edit-time-slot');
            const notesInput = modal.querySelector('#edit-notes');
            
            const reading = this.temperatureReadings.find(r => r.id === readingId);
            if (!reading) return;
            
            const fridge = this.refrigerators.find(f => f.id == fridgeSelect.value);
            if (!fridge) return;
            
            reading.refrigerator_id = fridgeSelect.value;
            reading.refrigerator_name = fridge.name;
            reading.temperature = parseFloat(tempInput.value);
            reading.time_slot = timeSlotSelect.value;
            reading.notes = notesInput.value.trim();
            reading.status = this.getTemperatureStatus(reading.temperature, fridge.category || 'refrigerator');
            
            this.saveToLocalStorage();
            this.updateDisplay();
            this.checkForAlerts();
            
            modal.remove();
            this.showNotification('Temperature reading updated', 'success');
        }
        
        deleteReading(readingId) {
            if (!confirm('Are you sure you want to delete this temperature reading?')) {
                return;
            }
            
            this.temperatureReadings = this.temperatureReadings.filter(r => r.id !== readingId);
            this.saveToLocalStorage();
            this.updateDisplay();
            this.checkForAlerts();
            
            this.showNotification('Temperature reading deleted', 'success');
        }
        
        deleteSanitizerTest(testId) {
            if (!confirm('Are you sure you want to delete this sanitizer test?')) {
                return;
            }
            
            this.sanitizerTests = this.sanitizerTests.filter(t => t.id !== testId);
            this.saveToLocalStorage();
            this.updateDisplay();
            this.checkForAlerts();
            
            this.showNotification('Sanitizer test deleted', 'success');
        }
        
        deleteDishwasherTest(testId) {
            if (!confirm('Are you sure you want to delete this dishwasher test?')) {
                return;
            }
            
            this.dishwasherTests = this.dishwasherTests.filter(t => t.id !== testId);
            this.saveToLocalStorage();
            this.updateDisplay();
            this.checkForAlerts();
            
            this.showNotification('Dishwasher test deleted', 'success');
        }
        
        generateHACCPReport() {
            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            const weekReadings = this.temperatureReadings.filter(reading => 
                new Date(reading.timestamp) >= lastWeek
            );
            
            const report = {
                generated: today.toISOString(),
                period: 'Last 7 Days',
                total_readings: weekReadings.length,
                refrigerators: {},
                alerts: weekReadings.filter(r => r.status !== 'normal'),
                compliance_rate: 0
            };
            
            // Group by refrigerator
            weekReadings.forEach(reading => {
                if (!report.refrigerators[reading.refrigerator_name]) {
                    report.refrigerators[reading.refrigerator_name] = {
                        readings: 0,
                        alerts: 0,
                        avg_temp: 0,
                        min_temp: Infinity,
                        max_temp: -Infinity
                    };
                }
                
                const fridge = report.refrigerators[reading.refrigerator_name];
                fridge.readings++;
                if (reading.status !== 'normal') fridge.alerts++;
                fridge.avg_temp += reading.temperature;
                fridge.min_temp = Math.min(fridge.min_temp, reading.temperature);
                fridge.max_temp = Math.max(fridge.max_temp, reading.temperature);
            });
            
            // Calculate averages
            Object.values(report.refrigerators).forEach(fridge => {
                fridge.avg_temp = fridge.avg_temp / fridge.readings;
                fridge.compliance_rate = ((fridge.readings - fridge.alerts) / fridge.readings * 100).toFixed(1);
            });
            
            report.compliance_rate = weekReadings.length > 0 ? 
                ((weekReadings.length - report.alerts.length) / weekReadings.length * 100).toFixed(1) : 0;
            
            // Create report modal
            this.showHACCPReport(report);
        }
        
        showHACCPReport(report) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div class="flex justify-between items-center p-6 border-b">
                        <h2 class="text-xl font-bold text-gray-800">HACCP Temperature Report</h2>
                        <button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" onclick="this.closest('.fixed').remove()">&times;</button>
                    </div>
                    <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-blue-800">Total Readings</h3>
                                <p class="text-2xl font-bold text-blue-600">${report.total_readings}</p>
                            </div>
                            <div class="bg-green-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-green-800">Compliance Rate</h3>
                                <p class="text-2xl font-bold text-green-600">${report.compliance_rate}%</p>
                            </div>
                            <div class="bg-red-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-red-800">Alerts</h3>
                                <p class="text-2xl font-bold text-red-600">${report.alerts.length}</p>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-gray-800">Refrigerator Summary</h3>
                            ${Object.entries(report.refrigerators).map(([name, data]) => `
                                <div class="border border-gray-200 rounded-lg p-4">
                                    <h4 class="font-semibold text-gray-800 mb-2">${name}</h4>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span class="text-gray-600">Readings:</span>
                                            <span class="font-medium">${data.readings}</span>
                                        </div>
                                        <div>
                                            <span class="text-gray-600">Alerts:</span>
                                            <span class="font-medium ${data.alerts > 0 ? 'text-red-600' : 'text-green-600'}">${data.alerts}</span>
                                        </div>
                                        <div>
                                            <span class="text-gray-600">Avg Temp:</span>
                                            <span class="font-medium">${data.avg_temp.toFixed(1)}°F</span>
                                        </div>
                                        <div>
                                            <span class="text-gray-600">Compliance:</span>
                                            <span class="font-medium">${data.compliance_rate}%</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${report.alerts.length > 0 ? `
                            <div class="mt-6">
                                <h3 class="text-lg font-semibold text-red-800 mb-3">Temperature Alerts</h3>
                                <div class="space-y-2">
                                    ${report.alerts.map(alert => `
                                        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <div class="flex justify-between items-center">
                                                <span class="font-medium text-red-800">${alert.refrigerator_name}</span>
                                                <span class="text-red-600">${alert.temperature}°F</span>
                                            </div>
                                            <div class="text-sm text-red-600">
                                                ${new Date(alert.timestamp).toLocaleDateString()} - ${this.timeSlots[alert.time_slot]?.label || alert.time_slot}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
        
        exportHACCPData() {
            // Temperature data
            const tempData = this.temperatureReadings.map(reading => ({
                Date: new Date(reading.timestamp).toLocaleDateString(),
                Time: this.timeSlots[reading.time_slot]?.label || reading.time_slot,
                Type: 'Temperature',
                Equipment: reading.refrigerator_name,
                Value: `${reading.temperature}°F`,
                Status: reading.status === 'normal' ? 'Normal' : reading.status === 'too_cold' ? 'Too Cold' : 'Too Warm',
                Notes: reading.notes || ''
            }));
            
            // Sanitizer data
            const sanitizerData = this.sanitizerTests.map(test => ({
                Date: new Date(test.timestamp).toLocaleDateString(),
                Time: this.timeSlots[test.time_slot]?.label || test.time_slot,
                Type: 'Sanitizer',
                Equipment: test.location,
                Value: `${test.concentration} ppm`,
                Status: test.status === 'normal' ? 'Normal' : test.status === 'too_low' ? 'Too Low' : 'Too High',
                Notes: test.notes || ''
            }));
            
            // Dishwasher data
            const dishwasherData = this.dishwasherTests.map(test => ({
                Date: new Date(test.timestamp).toLocaleDateString(),
                Time: this.timeSlots[test.time_slot]?.label || test.time_slot,
                Type: 'Dishwasher',
                Equipment: test.dishwasher,
                Value: `Temp: ${test.temperature}°F, Sanitizer: ${test.sanitizer} ppm, Cycle: ${test.cycle_time} min`,
                Status: test.status === 'passed' ? 'Passed' : test.status === 'warning' ? 'Warning' : 'Failed',
                Notes: test.notes || ''
            }));
            
            const allData = [...tempData, ...sanitizerData, ...dishwasherData];
            
            const csv = this.convertToCSV(allData);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `haccp_complete_data_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            this.showNotification('HACCP data exported successfully', 'success');
        }
        
        convertToCSV(data) {
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
            ].join('\n');
            return csvContent;
        }
        
        // Method to add temperature reading from daily notes
        addTemperatureFromDailyNotes(fridgeName, temperature, timeSlot = 'morning', notes = '') {
            const fridge = this.refrigerators.find(f => 
                f.name.toLowerCase().includes(fridgeName.toLowerCase()) ||
                fridgeName.toLowerCase().includes(f.name.toLowerCase())
            );
            
            if (!fridge) {
                // Create a temporary refrigerator entry
                const tempFridge = {
                    id: Date.now(),
                    name: fridgeName,
                    category: 'Refrigeration'
                };
                this.refrigerators.push(tempFridge);
            }
            
            const reading = {
                id: Date.now(),
                refrigerator_id: fridge ? fridge.id : tempFridge.id,
                refrigerator_name: fridge ? fridge.name : fridgeName,
                temperature: parseFloat(temperature),
                time_slot: timeSlot,
                timestamp: new Date().toISOString(),
                notes: notes,
                status: this.getTemperatureStatus(parseFloat(temperature), 'refrigerator')
            };
            
            this.temperatureReadings.push(reading);
            this.saveToLocalStorage();
            this.updateDisplay();
            this.checkForAlerts();
            
            return reading;
        }
        
        showNotification(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
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
        
        // Sanitizer Testing Methods
        addSanitizerTest() {
            const location = document.getElementById('sanitizer-location').value;
            const type = document.getElementById('sanitizer-type').value;
            const concentration = parseFloat(document.getElementById('sanitizer-concentration').value);
            const timeSlot = document.getElementById('sanitizer-time-slot').value;
            
            if (!location || !type || isNaN(concentration)) {
                this.showNotification('Please fill in all sanitizer test fields', 'error');
                return;
            }
            
            const sanitizerType = type.toLowerCase().split(' ')[0]; // Extract "Chlorine" from "Chlorine (50-200 ppm)"
            const ranges = this.sanitizerRanges[sanitizerType];
            
            if (!ranges) {
                this.showNotification('Invalid sanitizer type', 'error');
                return;
            }
            
            const status = this.getSanitizerStatus(concentration, sanitizerType);
            
            const test = {
                id: Date.now(),
                location: location,
                type: type,
                sanitizer_type: sanitizerType,
                concentration: concentration,
                time_slot: timeSlot,
                timestamp: new Date().toISOString(),
                status: status,
                notes: ''
            };
            
            this.sanitizerTests.push(test);
            this.saveToLocalStorage();
            this.updateDisplay();
            this.checkForAlerts();
            
            // Clear form
            document.getElementById('sanitizer-concentration').value = '';
            
            this.showNotification(`Sanitizer test logged: ${location} - ${concentration} ppm`, 'success');
        }
        
        addDishwasherTest() {
            const dishwasher = document.getElementById('dishwasher-select').value;
            const temperature = parseFloat(document.getElementById('dishwasher-temp').value);
            const sanitizer = parseFloat(document.getElementById('dishwasher-sanitizer').value);
            const cycleTime = parseFloat(document.getElementById('dishwasher-cycle-time').value);
            const timeSlot = document.getElementById('dishwasher-time-slot').value;
            
            if (!dishwasher || isNaN(temperature) || isNaN(sanitizer) || isNaN(cycleTime)) {
                this.showNotification('Please fill in all dishwasher test fields', 'error');
                return;
            }
            
            const tempStatus = this.getDishwasherTempStatus(temperature);
            const sanitizerStatus = this.getDishwasherSanitizerStatus(sanitizer);
            const cycleStatus = this.getDishwasherCycleStatus(cycleTime);
            
            // Overall status is the worst of the three
            const status = [tempStatus, sanitizerStatus, cycleStatus].includes('failed') ? 'failed' : 
                          [tempStatus, sanitizerStatus, cycleStatus].includes('warning') ? 'warning' : 'passed';
            
            const test = {
                id: Date.now(),
                dishwasher: dishwasher,
                temperature: temperature,
                sanitizer: sanitizer,
                cycle_time: cycleTime,
                time_slot: timeSlot,
                timestamp: new Date().toISOString(),
                status: status,
                temp_status: tempStatus,
                sanitizer_status: sanitizerStatus,
                cycle_status: cycleStatus,
                notes: ''
            };
            
            this.dishwasherTests.push(test);
            this.saveToLocalStorage();
            this.updateDisplay();
            this.checkForAlerts();
            
            // Clear form
            document.getElementById('dishwasher-temp').value = '';
            document.getElementById('dishwasher-sanitizer').value = '';
            document.getElementById('dishwasher-cycle-time').value = '';
            
            this.showNotification(`Dishwasher test logged: ${dishwasher}`, 'success');
        }
        
        getSanitizerStatus(concentration, type) {
            const ranges = this.sanitizerRanges[type];
            if (!ranges) return 'unknown';
            
            if (concentration < ranges.min) {
                return 'too_low';
            } else if (concentration > ranges.max) {
                return 'too_high';
            } else {
                return 'normal';
            }
        }
        
        getDishwasherTempStatus(temperature) {
            const ranges = this.dishwasherRanges.temperature;
            if (temperature < ranges.min) {
                return 'failed';
            } else if (temperature > ranges.max) {
                return 'warning';
            } else {
                return 'passed';
            }
        }
        
        getDishwasherSanitizerStatus(sanitizer) {
            const ranges = this.dishwasherRanges.sanitizer;
            if (sanitizer < ranges.min) {
                return 'failed';
            } else if (sanitizer > ranges.max) {
                return 'warning';
            } else {
                return 'passed';
            }
        }
        
        getDishwasherCycleStatus(cycleTime) {
            const ranges = this.dishwasherRanges.cycleTime;
            if (cycleTime < ranges.min) {
                return 'failed';
            } else if (cycleTime > ranges.max) {
                return 'warning';
            } else {
                return 'passed';
            }
        }
        
        getSanitizerStatusDisplay(status) {
            switch (status) {
                case 'normal':
                    return '<span class="text-green-600 font-medium">✓ Normal</span>';
                case 'too_low':
                    return '<span class="text-red-600 font-medium">⚠️ Too Low</span>';
                case 'too_high':
                    return '<span class="text-orange-600 font-medium">⚠️ Too High</span>';
                default:
                    return '<span class="text-gray-600 font-medium">Unknown</span>';
            }
        }
        
        getDishwasherStatusDisplay(status) {
            switch (status) {
                case 'passed':
                    return '<span class="text-green-600 font-medium">✓ Passed</span>';
                case 'warning':
                    return '<span class="text-orange-600 font-medium">⚠️ Warning</span>';
                case 'failed':
                    return '<span class="text-red-600 font-medium">❌ Failed</span>';
                default:
                    return '<span class="text-gray-600 font-medium">Unknown</span>';
            }
        }
        
        showHistoricalTab(tabType) {
            // Update tab styling
            const tabs = ['temp-tab', 'sanitizer-tab', 'dishwasher-tab'];
            tabs.forEach(tabId => {
                const tab = document.getElementById(tabId);
                if (tab) {
                    tab.className = 'px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700';
                }
            });
            
            const activeTab = document.getElementById(`${tabType}-tab`);
            if (activeTab) {
                activeTab.className = 'px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600';
            }
            
            // Update table headers based on tab type
            const headers = document.getElementById('haccp-table-headers');
            if (headers) {
                switch (tabType) {
                    case 'temperature':
                        headers.innerHTML = `
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Refrigerator</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Temperature</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Notes</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                        `;
                        break;
                    case 'sanitizer':
                        headers.innerHTML = `
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Location</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Concentration</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                        `;
                        break;
                    case 'dishwasher':
                        headers.innerHTML = `
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Dishwasher</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Temperature</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Sanitizer</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                        `;
                        break;
                }
            }
            
            // Update the historical display
            this.updateHistoricalDisplay(tabType);
        }
    }

    // Initialize HACCP Manager
    let haccpManager;
    document.addEventListener('DOMContentLoaded', () => {
        haccpManager = new HACCPManager();
        // Make it globally available for integration with daily notes
        window.haccpManager = haccpManager;
    });
} 