// Inventory Manager for Iterum R&D Chef Notebook
// Handles inventory CRUD, search/filter/sort, and integration with ingredient library

let inventory = [];
let ingredients = [];
let editingIndex = null;

// Utility: Load from localStorage
function loadInventory() {
    // Use user-specific data manager
    if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
        inventory = window.userDataManager.getUserInventory();
    } else {
        // Fallback to global storage
        inventory = JSON.parse(localStorage.getItem('iterum_inventory') || '[]');
    }
}
function saveInventory() {
    // Use user-specific data manager
    if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
        window.userDataManager.saveUserInventory(inventory);
    } else {
        // Fallback to global storage
        localStorage.setItem('iterum_inventory', JSON.stringify(inventory));
    }
}
function loadIngredients() {
    // Use user-specific data manager
    if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
        ingredients = window.userDataManager.getUserIngredients();
    } else {
        // Fallback to global storage
        ingredients = JSON.parse(localStorage.getItem('iterum_ingredients') || '[]');
    }
}

// Populate ingredient dropdown
function populateIngredientDropdown() {
    const select = document.getElementById('inventory-ingredient');
    if (!select) return;
    select.innerHTML = '<option value="">Select ingredient...</option>';
    ingredients.forEach(ing => {
        select.innerHTML += `<option value="${ing.name}" data-unit="${ing.unit}">${ing.name} (${ing.unit})</option>`;
    });
}

// Populate inventory table
function renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    let filtered = filterAndSortInventory();
    filtered.forEach((item, idx) => {
        const lowStock = Number(item.quantity) <= 2;
        const expiring = item.expiry_date && daysUntil(item.expiry_date) <= 3;
        tbody.innerHTML += `
            <tr class="${lowStock ? 'low-stock' : ''} ${expiring ? 'expiring-soon' : ''}">
                <td class="px-4 py-2">${item.ingredient}</td>
                <td class="px-4 py-2">${item.quantity}</td>
                <td class="px-4 py-2">${item.unit}</td>
                <td class="px-4 py-2">${item.location}</td>
                <td class="px-4 py-2">${item.date_received || ''}</td>
                <td class="px-4 py-2">${item.expiry_date || ''}</td>
                <td class="px-4 py-2">${item.notes || ''}</td>
                <td class="px-4 py-2 text-center">
                    <button class="text-blue-600 hover:underline mr-2" onclick="editInventory(${idx})">Edit</button>
                    <button class="text-red-600 hover:underline" onclick="deleteInventory(${idx})">Delete</button>
                </td>
            </tr>
        `;
    });
}

// Filter and sort inventory
function filterAndSortInventory() {
    let filtered = [...inventory];
    const search = document.getElementById('inventory-search').value.toLowerCase();
    const location = document.getElementById('location-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    if (search) {
        filtered = filtered.filter(item => item.ingredient.toLowerCase().includes(search));
    }
    if (location) {
        filtered = filtered.filter(item => item.location === location);
    }
    // Low stock and expiring soon handled by buttons
    if (window.showingLowStock) {
        filtered = filtered.filter(item => Number(item.quantity) <= 2);
    }
    if (window.showingExpiring) {
        filtered = filtered.filter(item => item.expiry_date && daysUntil(item.expiry_date) <= 3);
    }
    // Sort
    filtered.sort((a, b) => {
        if (sortBy === 'name') return a.ingredient.localeCompare(b.ingredient);
        if (sortBy === 'quantity') return Number(a.quantity) - Number(b.quantity);
        if (sortBy === 'expiry') return (a.expiry_date || '').localeCompare(b.expiry_date || '');
        if (sortBy === 'location') return (a.location || '').localeCompare(b.location || '');
        return 0;
    });
    return filtered;
}

// Days until expiry
function daysUntil(dateStr) {
    const today = new Date();
    const date = new Date(dateStr);
    return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
}

// Show/hide modals
function showInventoryModal(editIdx = null) {
    editingIndex = editIdx;
    document.getElementById('inventory-modal-title').textContent = editIdx === null ? 'Add Inventory' : 'Edit Inventory';
    document.getElementById('inventory-modal').classList.remove('hidden');
    document.getElementById('inventory-form').reset();
    populateIngredientDropdown();
    if (editIdx !== null) {
        const item = inventory[editIdx];
        document.getElementById('inventory-ingredient').value = item.ingredient;
        document.getElementById('inventory-quantity').value = item.quantity;
        document.getElementById('inventory-unit').value = item.unit;
        document.getElementById('inventory-location').value = item.location;
        document.getElementById('inventory-date-received').value = item.date_received;
        document.getElementById('inventory-expiry-date').value = item.expiry_date;
        document.getElementById('inventory-notes').value = item.notes;
    } else {
        document.getElementById('inventory-date-received').value = new Date().toISOString().split('T')[0];
        document.getElementById('inventory-unit').value = '';
    }
}
function hideInventoryModal() {
    document.getElementById('inventory-modal').classList.add('hidden');
    editingIndex = null;
}
function showBulkImportModal() {
    document.getElementById('bulk-import-modal').classList.remove('hidden');
    document.getElementById('bulk-import-form').reset();
}
function hideBulkImportModal() {
    document.getElementById('bulk-import-modal').classList.add('hidden');
}

// Add or edit inventory
function handleInventoryForm(e) {
    e.preventDefault();
    const ing = document.getElementById('inventory-ingredient').value;
    const qty = document.getElementById('inventory-quantity').value;
    const unit = document.getElementById('inventory-unit').value;
    const loc = document.getElementById('inventory-location').value;
    const dateR = document.getElementById('inventory-date-received').value;
    const dateE = document.getElementById('inventory-expiry-date').value;
    const notes = document.getElementById('inventory-notes').value;
    const item = { ingredient: ing, quantity: qty, unit: unit, location: loc, date_received: dateR, expiry_date: dateE, notes: notes };
    if (editingIndex === null) {
        inventory.push(item);
    } else {
        inventory[editingIndex] = item;
    }
    saveInventory();
    renderInventoryTable();
    hideInventoryModal();
}

// Edit inventory
function editInventory(idx) {
    showInventoryModal(idx);
}
// Delete inventory
function deleteInventory(idx) {
    if (confirm('Delete this inventory item?')) {
        inventory.splice(idx, 1);
        saveInventory();
        renderInventoryTable();
    }
}

// Ingredient unit autofill
function handleIngredientChange() {
    const select = document.getElementById('inventory-ingredient');
    const unitInput = document.getElementById('inventory-unit');
    const selected = select.options[select.selectedIndex];
    unitInput.value = selected ? selected.getAttribute('data-unit') || '' : '';
}

// Bulk import
function handleBulkImportForm(e) {
    e.preventDefault();
    const csv = document.getElementById('bulk-import-csv').value;
    const rows = csv.split('\n').map(r => r.trim()).filter(r => r);
    for (let row of rows) {
        const [ingredient, quantity, unit, location, date_received, expiry_date, notes] = row.split(',').map(s => s.trim());
        if (ingredient && quantity && unit && location) {
            inventory.push({ ingredient, quantity, unit, location, date_received, expiry_date, notes });
        }
    }
    saveInventory();
    renderInventoryTable();
    hideBulkImportModal();
}

// --- Excel and PDF Import ---
function handleExcelImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        const data = evt.target.result;
        if (file.name.endsWith('.csv')) {
            // CSV: parse as text
            const text = new TextDecoder('utf-8').decode(data);
            parseAndAddInventoryRows(text.split('\n').map(r => r.trim()).filter(r => r));
        } else {
            // Excel: use SheetJS
            if (typeof XLSX === 'undefined') {
                alert('SheetJS (XLSX) library not loaded.');
                return;
            }
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            // Skip header row if present
            if (rows.length > 1 && rows[0][0].toLowerCase().includes('ingredient')) rows.shift();
            parseAndAddInventoryRows(rows.map(r => r.join(',')));
        }
    };
    if (file.name.endsWith('.csv')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function handlePDFImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (typeof pdfjsLib === 'undefined') {
        alert('PDF.js library not loaded.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
        const typedarray = new Uint8Array(evt.target.result);
        pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
            let allText = '';
            let loadPage = function(pageNum) {
                pdf.getPage(pageNum).then(function(page) {
                    page.getTextContent().then(function(textContent) {
                        const pageText = textContent.items.map(i => i.str).join(' ');
                        allText += pageText + '\n';
                        if (pageNum < pdf.numPages) {
                            loadPage(pageNum + 1);
                        } else {
                            // Try to split into rows by line
                            const lines = allText.split('\n').map(l => l.trim()).filter(l => l);
                            // Try to find table-like lines
                            const tableLines = lines.filter(l => l.split(',').length >= 4 || l.split(/\s{2,}/).length >= 4);
                            parseAndAddInventoryRows(tableLines);
                        }
                    });
                });
            };
            loadPage(1);
        }, function(error) {
            alert('PDF parsing failed: ' + error.message);
        });
    };
    reader.readAsArrayBuffer(file);
}

function parseAndAddInventoryRows(rows) {
    for (let row of rows) {
        let cols = row.split(',');
        if (cols.length < 4) cols = row.split(/\s{2,}/); // fallback: split by 2+ spaces
        const [ingredient, quantity, unit, location, date_received, expiry_date, notes] = cols.map(s => s && s.trim ? s.trim() : s);
        if (ingredient && quantity && unit && location) {
            inventory.push({ ingredient, quantity, unit, location, date_received, expiry_date, notes });
        }
    }
    saveInventory();
    renderInventoryTable();
    hideBulkImportModal();
}

// Search/filter/sort buttons
function setupFilterButtons() {
    document.getElementById('show-low-stock').onclick = () => {
        window.showingLowStock = !window.showingLowStock;
        window.showingExpiring = false;
        renderInventoryTable();
    };
    document.getElementById('show-expiring').onclick = () => {
        window.showingExpiring = !window.showingExpiring;
        window.showingLowStock = false;
        renderInventoryTable();
    };
}

// Event listeners
function setupInventoryEvents() {
    document.getElementById('add-inventory-btn').onclick = () => showInventoryModal();
    document.getElementById('close-inventory-modal').onclick = hideInventoryModal;
    document.getElementById('cancel-inventory').onclick = hideInventoryModal;
    document.getElementById('inventory-form').onsubmit = handleInventoryForm;
    document.getElementById('inventory-ingredient').onchange = handleIngredientChange;
    document.getElementById('bulk-import-btn').onclick = showBulkImportModal;
    document.getElementById('close-bulk-import-modal').onclick = hideBulkImportModal;
    document.getElementById('cancel-bulk-import').onclick = hideBulkImportModal;
    document.getElementById('bulk-import-form').onsubmit = handleBulkImportForm;
    document.getElementById('inventory-search').oninput = renderInventoryTable;
    document.getElementById('location-filter').onchange = renderInventoryTable;
    document.getElementById('sort-by').onchange = renderInventoryTable;
    setupFilterButtons();
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadIngredients();
    loadInventory();
    setupInventoryEvents();
    renderInventoryTable();
    const excelInput = document.getElementById('bulk-import-excel');
    if (excelInput) excelInput.addEventListener('change', handleExcelImport);
    const pdfInput = document.getElementById('bulk-import-pdf');
    if (pdfInput) pdfInput.addEventListener('change', handlePDFImport);
}); 

// --- PDF Import for Inventory ---
document.getElementById('bulk-import-inventory-pdf')?.addEventListener('change', async function(e) {
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
    const previewDiv = document.getElementById('inventory-pdf-preview');
    const head = document.getElementById('inventory-pdf-preview-head');
    const body = document.getElementById('inventory-pdf-preview-body');
    const mappingDiv = document.getElementById('inventory-pdf-mapping');
    if (!tableRows.length) {
        previewDiv.classList.add('hidden');
        return;
    }
    // Assume first row is header
    const headers = tableRows[0];
    // Mapping UI
    const fields = ['Ignore','Name','Quantity','Unit','Location','Date Received','Expiry Date','Notes'];
    mappingDiv.innerHTML = headers.map((h,i) => `<select class='notebook-input text-xs' data-col='${i}'>${fields.map(f => `<option value='${f}'>${f}</option>`).join('')}</select>`).join('');
    head.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    body.innerHTML = tableRows.slice(1).map(row => '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>').join('');
    previewDiv.classList.remove('hidden');
    // Import button
    if (!document.getElementById('inventory-pdf-import-btn')) {
        const btn = document.createElement('button');
        btn.id = 'inventory-pdf-import-btn';
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
                    if (field !== 'Ignore') obj[field.toLowerCase().replace(/ /g,'_')] = row[i] || '';
                });
                if (obj.name) imported.push(obj);
            }
            // Add to inventory list (replace with your add logic)
            imported.forEach(item => addInventoryItem(item));
            showNotification('Imported ' + imported.length + ' inventory items from PDF.');
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