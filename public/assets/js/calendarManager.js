// Calendar Manager for Iterum R&D Chef Notebook
// Handles calendar display, day details, and activity tracking

// Prevent duplicate loading
if (typeof window.CalendarManager !== 'undefined') {
    console.log('CalendarManager already loaded, skipping initialization');
} else {
    class CalendarManager {
        constructor() {
            this.currentDate = new Date();
            this.selectedDate = new Date();
            this.journalEntries = [];
            this.recipeChanges = [];
            this.equipmentMaintenance = [];
            
            this.init();
        }
        
        init() {
            this.loadFromLocalStorage();
            this.setupEventListeners();
            this.renderCalendar();
        }
        
        loadFromLocalStorage() {
            // Use user-specific data manager
            if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
                this.journalEntries = window.userDataManager.getUserJournalEntries();
                this.recipeChanges = window.userDataManager.getUserData('recipe_changes') || [];
                this.equipmentMaintenance = window.userDataManager.getUserData('maintenance_log') || [];
            } else {
                // Fallback to global storage
                const savedJournal = localStorage.getItem('iterum_journal_entries');
                if (savedJournal) {
                    this.journalEntries = JSON.parse(savedJournal);
                }
                
                const savedRecipes = localStorage.getItem('iterum_recipe_changes');
                if (savedRecipes) {
                    this.recipeChanges = JSON.parse(savedRecipes);
                }
                
                const savedMaintenance = localStorage.getItem('iterum_maintenance_log');
                if (savedMaintenance) {
                    this.equipmentMaintenance = JSON.parse(savedMaintenance);
                }
            }
        }
        
        saveToLocalStorage() {
            // Use user-specific data manager
            if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
                window.userDataManager.saveUserJournalEntries(this.journalEntries);
                window.userDataManager.saveUserData('recipe_changes', this.recipeChanges);
                window.userDataManager.saveUserData('maintenance_log', this.equipmentMaintenance);
            } else {
                // Fallback to global storage
                localStorage.setItem('iterum_journal_entries', JSON.stringify(this.journalEntries));
                localStorage.setItem('iterum_recipe_changes', JSON.stringify(this.recipeChanges));
                localStorage.setItem('iterum_maintenance_log', JSON.stringify(this.equipmentMaintenance));
            }
        }
        
        setupEventListeners() {
            // Navigation buttons
            const prevBtn = document.getElementById('prev-month');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.previousMonth());
            }
            
            const nextBtn = document.getElementById('next-month');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.nextMonth());
            }
            
            const todayBtn = document.getElementById('today-btn');
            if (todayBtn) {
                todayBtn.addEventListener('click', () => this.goToToday());
            }
            
            // Modal close button
            const closeModalBtn = document.getElementById('close-day-modal');
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => this.closeDayModal());
            }
            
            // Close modal when clicking outside
            const modal = document.getElementById('day-details-modal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeDayModal();
                    }
                });
            }
        }
        
        renderCalendar() {
            const currentMonth = document.getElementById('current-month');
            const calendarGrid = document.getElementById('calendar-grid');
            
            if (!currentMonth || !calendarGrid) return;
            
            // Update month display
            currentMonth.textContent = this.currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
            
            // Clear calendar grid
            calendarGrid.innerHTML = '';
            
            // Get first day of month and number of days
            const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            // Generate calendar days
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const dayElement = this.createDayElement(date);
                calendarGrid.appendChild(dayElement);
            }
        }
        
        createDayElement(date) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'min-h-[120px] p-2 border border-gray-200 hover:bg-gray-50 cursor-pointer';
            
            const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
            const isToday = this.isToday(date);
            const isSelected = this.isSameDate(date, this.selectedDate);
            
            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = `text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
            } ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`;
            dayNumber.textContent = date.getDate();
            
            dayDiv.appendChild(dayNumber);
            
            // Activity indicators
            const activities = this.getDayActivities(date);
            if (activities.length > 0) {
                const activityDiv = document.createElement('div');
                activityDiv.className = 'space-y-1';
                
                activities.forEach(activity => {
                    const indicator = document.createElement('div');
                    indicator.className = `text-xs px-1 py-0.5 rounded ${this.getActivityColor(activity.type)}`;
                    indicator.textContent = activity.icon;
                    indicator.title = activity.title;
                    activityDiv.appendChild(indicator);
                });
                
                dayDiv.appendChild(activityDiv);
            }
            
            // Add click event
            dayDiv.addEventListener('click', () => this.selectDate(date));
            
            // Highlight selected date
            if (isSelected) {
                dayDiv.classList.add('bg-blue-100', 'border-blue-300');
            }
            
            return dayDiv;
        }
        
        getDayActivities(date) {
            const activities = [];
            const dateString = date.toDateString();
            
            // Check for journal entries
            const journalEntry = this.journalEntries.find(entry => 
                new Date(entry.date).toDateString() === dateString
            );
            if (journalEntry) {
                activities.push({
                    type: 'journal',
                    icon: '📝',
                    title: 'Journal Entry'
                });
            }
            
            // Check for HACCP data
            if (window.haccpManager) {
                const haccpData = window.haccpManager.temperatureReadings.filter(reading => 
                    new Date(reading.timestamp).toDateString() === dateString
                );
                if (haccpData.length > 0) {
                    activities.push({
                        type: 'haccp',
                        icon: '🌡️',
                        title: `${haccpData.length} HACCP readings`
                    });
                }
            }
            
            // Check for recipe changes
            const recipeChanges = this.recipeChanges.filter(change => 
                new Date(change.date).toDateString() === dateString
            );
            if (recipeChanges.length > 0) {
                activities.push({
                    type: 'recipe',
                    icon: '📚',
                    title: `${recipeChanges.length} recipe changes`
                });
            }
            
            // Check for maintenance
            const maintenance = this.equipmentMaintenance.filter(item => 
                new Date(item.date).toDateString() === dateString
            );
            if (maintenance.length > 0) {
                activities.push({
                    type: 'maintenance',
                    icon: '🔧',
                    title: `${maintenance.length} maintenance items`
                });
            }
            
            return activities;
        }
        
        getActivityColor(type) {
            switch (type) {
                case 'journal':
                    return 'bg-blue-100 text-blue-800';
                case 'haccp':
                    return 'bg-red-100 text-red-800';
                case 'recipe':
                    return 'bg-yellow-100 text-yellow-800';
                case 'maintenance':
                    return 'bg-orange-100 text-orange-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        }
        
        selectDate(date) {
            this.selectedDate = date;
            this.renderCalendar();
            this.showDayDetails(date);
        }
        
        showDayDetails(date) {
            const modal = document.getElementById('day-details-modal');
            const modalTitle = document.getElementById('modal-date-title');
            
            if (!modal || !modalTitle) return;
            
            modalTitle.textContent = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            this.populateDayDetails(date);
            modal.classList.remove('hidden');
        }
        
        populateDayDetails(date) {
            const dateString = date.toDateString();
            
            // Populate journal entries
            this.populateJournalEntries(dateString);
            
            // Populate HACCP data
            this.populateHACCPData(dateString);
            
            // Populate recipe changes
            this.populateRecipeChanges(dateString);
            
            // Populate maintenance
            this.populateMaintenance(dateString);
        }
        
        populateJournalEntries(dateString) {
            const container = document.getElementById('day-journal-entries');
            if (!container) return;
            
            const entry = this.journalEntries.find(entry => 
                new Date(entry.date).toDateString() === dateString
            );
            
            if (entry) {
                container.innerHTML = `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-semibold text-blue-800 mb-2">Journal Entry</h4>
                        <p class="text-sm text-gray-700">${entry.notes || 'No notes'}</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <p>No journal entry for this date</p>
                    </div>
                `;
            }
        }
        
        populateHACCPData(dateString) {
            const container = document.getElementById('day-haccp-data');
            if (!container) return;
            
            if (window.haccpManager) {
                const haccpData = window.haccpManager.temperatureReadings.filter(reading => 
                    new Date(reading.timestamp).toDateString() === dateString
                );
                
                if (haccpData.length > 0) {
                    container.innerHTML = `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 class="font-semibold text-red-800 mb-2">HACCP Readings</h4>
                            <div class="space-y-2">
                                ${haccpData.map(reading => `
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm">${reading.fridgeName}: ${reading.temperature}°F</span>
                                        <span class="text-xs text-gray-500">${reading.timeSlot}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    container.innerHTML = `
                        <div class="text-center text-gray-500 py-8">
                            <p>No HACCP data for this date</p>
                        </div>
                    `;
                }
            } else {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <p>HACCP manager not available</p>
                    </div>
                `;
            }
        }
        
        populateRecipeChanges(dateString) {
            const container = document.getElementById('day-recipe-changes');
            if (!container) return;
            
            const changes = this.recipeChanges.filter(change => 
                new Date(change.date).toDateString() === dateString
            );
            
            if (changes.length > 0) {
                container.innerHTML = `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 class="font-semibold text-yellow-800 mb-2">Recipe Changes</h4>
                        <div class="space-y-2">
                            ${changes.map(change => `
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h5 class="font-medium text-yellow-800">${change.recipeName}</h5>
                                        <p class="text-sm text-gray-700">${change.action}</p>
                                    </div>
                                    <span class="text-xs text-gray-500">${change.time}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <p>No recipe changes for this date</p>
                    </div>
                `;
            }
        }
        
        populateMaintenance(dateString) {
            const container = document.getElementById('day-maintenance');
            if (!container) return;
            
            const maintenance = this.equipmentMaintenance.filter(item => 
                new Date(item.date).toDateString() === dateString
            );
            
            if (maintenance.length > 0) {
                container.innerHTML = `
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 class="font-semibold text-orange-800 mb-2">Maintenance Activities</h4>
                        <div class="space-y-2">
                            ${maintenance.map(item => `
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h5 class="font-medium text-orange-800">${item.equipmentName}</h5>
                                        <p class="text-sm text-gray-700">${item.action}</p>
                                    </div>
                                    <span class="text-xs text-gray-500">${item.time}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <p>No maintenance activities for this date</p>
                    </div>
                `;
            }
        }
        
        closeDayModal() {
            const modal = document.getElementById('day-details-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        }
        
        previousMonth() {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        }
        
        nextMonth() {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        }
        
        goToToday() {
            this.currentDate = new Date();
            this.selectedDate = new Date();
            this.renderCalendar();
        }
        
        isToday(date) {
            const today = new Date();
            return date.getDate() === today.getDate() &&
                   date.getMonth() === today.getMonth() &&
                   date.getFullYear() === today.getFullYear();
        }
        
        isSameDate(date1, date2) {
            return date1.getDate() === date2.getDate() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getFullYear() === date2.getFullYear();
        }
        
        // Method to add journal entry from daily notes
        addJournalEntry(entry) {
            this.journalEntries.push(entry);
            this.saveToLocalStorage();
            this.renderCalendar();
        }
        
        // Method to add recipe change
        addRecipeChange(change) {
            this.recipeChanges.push(change);
            this.saveToLocalStorage();
            this.renderCalendar();
        }
        
        // Method to add maintenance activity
        addMaintenanceActivity(activity) {
            this.equipmentMaintenance.push(activity);
            this.saveToLocalStorage();
            this.renderCalendar();
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
    }
    
    // Initialize Calendar Manager
    let calendarManager;
    document.addEventListener('DOMContentLoaded', () => {
        calendarManager = new CalendarManager();
        // Make it globally available for integration
        window.calendarManager = calendarManager;
    });
} 