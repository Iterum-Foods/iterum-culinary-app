class ImportService {
  constructor() {
    this.modal = null;
    this.csvData = null;
    this.csvHeaders = [];
    this.mappings = {};
    this.currentType = null;
    this.importBatchId = null;
    console.log('📥 ImportService ready');
  }

  openEquipmentCSVImport() {
    this.openCSVImport({
      type: 'equipment',
      title: 'Import Equipment from CSV/Excel',
      fields: [
        { key: 'name', label: 'Equipment Name', required: true },
        { key: 'category', label: 'Category', required: true },
        { key: 'subcategory', label: 'Subcategory', required: false },
        { key: 'location', label: 'Location', required: false },
        { key: 'quantity', label: 'Quantity', required: false },
        { key: 'status', label: 'Status', required: false },
        { key: 'brand', label: 'Brand/Model', required: false },
        { key: 'notes', label: 'Notes', required: false }
      ]
    });
  }

  openIngredientCSVImport() {
    this.openCSVImport({
      type: 'ingredients',
      title: 'Import Ingredients from CSV',
      fields: [
        { key: 'name', label: 'Ingredient Name', required: true },
        { key: 'category', label: 'Category', required: true },
        { key: 'subcategory', label: 'Subcategory / Type / Brand', required: false },
        { key: 'unit', label: 'Base Unit (e.g. g, kg, ml, l)', required: true },
        { key: 'cost', label: 'Cost', required: false },
        { key: 'costPer', label: 'Cost Per (unit)', required: false },
        { key: 'supplier', label: 'Supplier', required: false },
        { key: 'storage', label: 'Storage (dry/refrigerated/frozen)', required: false },
        { key: 'shelfLifeDays', label: 'Shelf Life (days)', required: false },
        { key: 'notes', label: 'Notes', required: false }
      ]
    });
  }

  openIngredientURLImport() {
    if (!window.fetchIngredientMetadata) {
      alert('Bulk URL import is only available on the ingredient page.');
      return;
    }

    this.closeModal();
    this.importBatchId = `url_${Date.now()}`;

    const modal = document.createElement('div');
    modal.id = 'import-url-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="background:white;border-radius:16px;width:min(640px,92vw);max-height:90vh;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:white;">
          <h2 style="margin:0;font-size:1.2rem;font-weight:600;">Bulk Import Ingredients from URLs</h2>
        </div>
        <div style="padding:20px 24px;flex:1;overflow-y:auto;">
          <p style="color:#475569;font-size:0.9rem;margin-bottom:12px;">
            Paste one or more product URLs (one per line). We will scrape each link and add the ingredients that succeed.
          </p>
          <textarea id="bulk-ingredient-urls" class="form-textarea" rows="10" placeholder="https://example.com/product-1
https://example.com/product-2"></textarea>
          <p style="color:#94a3b8;font-size:0.75rem;margin-top:8px;">
            We recommend batching 5–10 links at a time for best performance.
          </p>
          <div id="bulk-import-progress" style="margin-top:12px;font-size:0.85rem;color:#475569;"></div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:12px;background:#f8fafc;">
          <button class="btn btn-secondary" onclick="window.importService.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="window.importService.executeBulkUrlImport()">Import URLs</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (event) => {
      if (event.target === modal) this.closeModal();
    });

    document.body.appendChild(modal);
    this.modal = modal;
  }

  async executeBulkUrlImport() {
    const textarea = document.getElementById('bulk-ingredient-urls');
    if (!textarea) return;

    const progressEl = document.getElementById('bulk-import-progress');
    const raw = textarea.value.trim();
    if (!raw) {
      alert('Please paste at least one URL.');
      return;
    }

    const urls = Array.from(new Set(raw.split(/\n+/).map(line => line.trim()).filter(Boolean)));
    if (!urls.length) {
      alert('Please paste valid URLs.');
      return;
    }

    progressEl.innerHTML = `⏳ Importing ${urls.length} URLs…`;

    let successCount = 0;
    let failureCount = 0;
    for (const url of urls) {
      try {
        const metadata = await window.fetchIngredientMetadata(url);
        const ingredient = this.createIngredientFromMetadata(metadata);
        if (ingredient) {
          this.saveIngredientRecord(ingredient);
          successCount++;
          progressEl.innerHTML = `✅ Imported ${successCount}/${urls.length}…`;
        } else {
          failureCount++;
          progressEl.innerHTML = `⚠️ Skipped ${failureCount} URL(s)…`;
        }
      } catch (error) {
        console.warn('Bulk URL import error:', error);
        failureCount++;
        progressEl.innerHTML = `⚠️ Skipped ${failureCount} URL(s)…`;
      }
    }

    this.closeModal();
    alert(`Bulk URL import finished. Added ${successCount} ingredient(s). ${failureCount ? failureCount + ' failed/skipped.' : ''}`);
    window.refreshIngredientsView?.();
  }

  createIngredientFromMetadata(metadata) {
    if (!metadata || !metadata.name) return null;
    const now = new Date().toISOString();
    return {
      id: `ing_url_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: metadata.name,
      category: metadata.category || 'other',
      unit: metadata.unit || metadata.defaultUnit || 'g',
      cost: metadata.cost ?? 0,
      costCurrency: metadata.costCurrency || 'USD',
      supplier: metadata.supplier || '',
      storage: metadata.storage || 'dry',
      shelfLifeDays: metadata.shelfLifeDays || null,
      dateAdded: now,
      createdVia: 'bulk-url',
      source_url: metadata.url,
      source_host: metadata.site,
      description: metadata.description || '',
      tags: metadata.tags || [],
      nutritional_info: metadata.nutritionalInfo || null
    };
  }

  openCSVImport(config) {
    this.closeModal();
    this.currentType = config.type;
    this.csvData = null;
    this.csvHeaders = [];
    this.mappings = {};
    this.importBatchId = `csv_${Date.now()}`;

    const modal = document.createElement('div');
    modal.id = 'csv-import-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="background:white;border-radius:16px;width:min(760px,94vw);max-height:90vh;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;background:linear-gradient(135deg,#6366f1 0%,#4338ca 100%);color:white;">
          <h2 style="margin:0;font-size:1.2rem;font-weight:600;">${config.title}</h2>
        </div>
        <div style="padding:20px 24px;flex:1;overflow-y:auto;">
          <div style="margin-bottom:16px;">
            <label class="form-label">Upload File</label>
            <input type="file" id="csv-import-file" accept=".csv,.tsv,.txt,.xlsx,.xls" class="form-input">
            <p style="color:#94a3b8;font-size:0.75rem;margin-top:6px;">Supported: CSV / TSV / Excel (.xlsx, .xls). First row should be headers.</p>
          </div>
          <div id="csv-mapping-section" style="display:none;">
            <h3 style="font-size:1rem;font-weight:600;margin-bottom:8px;">Map Columns</h3>
            <p style="color:#475569;font-size:0.85rem;margin-bottom:12px;">Select which CSV column corresponds to each required field.</p>
            <div id="csv-mapping-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;"></div>
          </div>
          <div id="csv-preview-section" style="display:none;margin-top:16px;">
            <h3 style="font-size:1rem;font-weight:600;margin-bottom:8px;">Preview</h3>
            <div id="csv-preview-table" style="max-height:180px;overflow:auto;border:1px solid #e2e8f0;border-radius:12px;"></div>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:12px;background:#f8fafc;">
          <button class="btn btn-secondary" onclick="window.importService.closeModal()">Cancel</button>
          <button class="btn btn-primary" id="csv-import-submit" disabled onclick="window.importService.executeCSVImport()">Import Records</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (event) => {
      if (event.target === modal) this.closeModal();
    });

    document.body.appendChild(modal);
    this.modal = modal;

    const fileInput = modal.querySelector('#csv-import-file');
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const lower = (file.name || '').toLowerCase();
      // Excel path
      if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        if (typeof XLSX === 'undefined') {
          alert('Excel parser not loaded. Please include xlsx.full.min.js.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (!raw || !raw.length) {
              alert('No rows found in Excel sheet.');
              return;
            }
            const headers = (raw[0] || []).map(h => String(h || '').trim());
            const rows = [];
            const rawRows = [];
            for (let i = 1; i < raw.length; i++) {
              const arr = raw[i];
              if (!arr || !arr.length) continue;
              const record = {};
              headers.forEach((h, idx) => {
                if (!h) return;
                const cell = arr[idx];
                record[h] = (cell == null ? '' : String(cell));
              });
              rawRows.push((arr || []).map(v => (v == null ? '' : String(v))));
              rows.push(record);
            }
            const parsed = { headers, rows, rawRows };
            this.handleParsedTable(parsed, config);
          } catch (err) {
            console.error('Excel parse error:', err);
            alert('Unable to parse Excel file. Try saving as CSV and re-importing.');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // CSV/TSV path
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result;
            this.handleCSVText(text, config);
          } catch (error) {
            console.error('CSV read error:', error);
            alert('Unable to read that file. Please try another CSV.');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  handleCSVText(text, config) {
    if (!text) {
      alert('Empty file.');
      return;
    }
    const parsed = this.parseCSV(text);
    if (!parsed || !parsed.rows.length) {
      alert('No rows found in file.');
      return;
    }
    this.handleParsedTable(parsed, config);
  }

  handleParsedTable(parsed, config) {
    if (!parsed || !parsed.headers || !parsed.rows) {
      alert('Unable to read table data.');
      return;
    }

    this.csvHeaders = parsed.headers;
    this.csvData = parsed.rows;
    const mappingSection = this.modal.querySelector('#csv-mapping-section');
    const mappingGrid = this.modal.querySelector('#csv-mapping-grid');
    const previewSection = this.modal.querySelector('#csv-preview-section');
    const previewTable = this.modal.querySelector('#csv-preview-table');
    const submitButton = this.modal.querySelector('#csv-import-submit');

    mappingSection.style.display = 'block';
    previewSection.style.display = 'block';

    mappingGrid.innerHTML = config.fields.map(field => {
      const defaultHeader = this.findBestHeaderMatch(field.key, this.csvHeaders);
      this.mappings[field.key] = defaultHeader || '';
      const options = [
        `<option value="">-- Not Mapped --</option>`,
        ...this.csvHeaders.map(header => `<option value="${header}" ${header === defaultHeader ? 'selected' : ''}>${header}</option>`)
      ];
      return `
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:0.85rem;font-weight:600;color:#1f2937;">
            ${field.label}${field.required ? ' *' : ''}
          </span>
          <select class="form-select csv-mapping-select" data-field="${field.key}">
            ${options.join('')}
          </select>
        </label>
      `;
    }).join('');

    mappingGrid.querySelectorAll('.csv-mapping-select').forEach(select => {
      select.addEventListener('change', (event) => {
        const field = event.target.dataset.field;
        this.mappings[field] = event.target.value;
        submitButton.disabled = !this.validateMappings(config.fields);
      });
    });

    this.renderCSVPreview(previewTable, parsed);
    submitButton.disabled = !this.validateMappings(config.fields);
  }

  renderCSVPreview(container, parsed) {
    const rows = [parsed.headers].concat(parsed.rawRows.slice(0, 5));
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    rows.forEach((row, index) => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const cellEl = document.createElement(index === 0 ? 'th' : 'td');
        cellEl.textContent = cell;
        cellEl.style.padding = '8px';
        cellEl.style.borderBottom = '1px solid #e2e8f0';
        cellEl.style.textAlign = 'left';
        if (index === 0) {
          cellEl.style.background = '#f8fafc';
          cellEl.style.fontWeight = '600';
        }
        tr.appendChild(cellEl);
      });
      table.appendChild(tr);
    });
    container.innerHTML = '';
    container.appendChild(table);
  }

  validateMappings(fields) {
    return fields.every(field => !field.required || this.mappings[field.key]);
  }

  async executeCSVImport() {
    if (!this.csvData) {
      alert('No CSV data loaded.');
      return;
    }

    const fields = Object.keys(this.mappings);
    const importRows = this.csvData.map(row => {
      const record = {};
      fields.forEach(field => {
        const header = this.mappings[field];
        record[field] = header ? row[header] : '';
      });
      return record;
    });

    let imported = 0;
    if (this.currentType === 'equipment') {
      imported = this.importEquipmentRows(importRows);
    } else if (this.currentType === 'ingredients') {
      imported = this.importIngredientRows(importRows);
    }

    this.closeModal();
    alert(`✅ Imported ${imported} ${this.currentType === 'equipment' ? 'equipment items' : 'ingredients'} from file.`);

    if (this.currentType === 'equipment') {
      try {
        window.dispatchEvent(new CustomEvent('equipmentUpdated', { detail: { count: imported } }));
      } catch (e) {}
      if (typeof loadEquipment === 'function') {
        loadEquipment();
      } else {
        window.refreshEquipmentView?.();
      }
    } else if (this.currentType === 'ingredients') {
      window.refreshIngredientsView?.();
    }
  }

  importEquipmentRows(rows) {
    if (!window.equipmentManager) {
      alert('Equipment manager is not available on this page.');
      return 0;
    }

    let count = 0;
    rows.forEach(row => {
      if (!row.name) return;
      const quantity = parseInt(row.quantity, 10);
      const payload = {
        name: row.name,
        category: row.category || 'Uncategorized',
        subcategory: row.subcategory || '',
        location: row.location || '',
        quantity: Number.isFinite(quantity) ? quantity : 1,
        status: row.status || 'Active',
        brand: row.brand || '',
        notes: row.notes || '',
        createdVia: 'csv-import',
        importBatchId: this.importBatchId
      };
      const added = window.equipmentManager.addEquipment(payload, { skipDuplicateCheck: false });
      if (added) count++;
    });
    return count;
  }

  importIngredientRows(rows) {
    const existing = JSON.parse(localStorage.getItem('ingredients_database') || '[]');
    const byName = new Map(existing.map(item => [item.name.toLowerCase(), item]));
    const now = new Date().toISOString();

    let count = 0;
    rows.forEach(row => {
      if (!row.name) return;
      if (byName.has(row.name.toLowerCase())) {
        console.log('Skipping duplicate ingredient:', row.name);
        return;
      }
      const cost = parseFloat(row.cost);
      const shelfLife = parseInt(row.shelfLifeDays, 10);
      const ingredient = {
        id: `ing_csv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: row.name,
        category: row.category || 'other',
        subcategory: row.subcategory ? row.subcategory.trim() : null,
        unit: row.unit || 'g',
        cost: Number.isFinite(cost) ? cost : 0,
        costPer: row.costPer || row.unit || 'unit',
        supplier: row.supplier || '',
        storage: row.storage || 'dry',
        shelfLifeDays: Number.isFinite(shelfLife) ? shelfLife : null,
        dateAdded: now,
        createdVia: 'csv-import',
        importBatchId: this.importBatchId,
        notes: row.notes || ''
      };
      existing.push(ingredient);
      byName.set(row.name.toLowerCase(), ingredient);
      count++;
    });

    localStorage.setItem('ingredients_database', JSON.stringify(existing));
    localStorage.setItem('ingredients', JSON.stringify(existing));
    return count;
  }

  parseCSV(text) {
    const delimiter = this.detectDelimiter(text);
    const lines = text.split(/\r?\n/).filter(line => line.trim().length);
    if (!lines.length) return null;

    const headers = this.parseCSVLine(lines[0], delimiter);
    const rows = [];
    const rawRows = [];

    for (let i = 1; i < lines.length; i++) {
      const rawRow = this.parseCSVLine(lines[i], delimiter);
      if (!rawRow.length) continue;
      rawRows.push(rawRow);
      const record = {};
      headers.forEach((header, index) => {
        record[header] = rawRow[index] ?? '';
      });
      rows.push(record);
    }

    return { headers, rows, rawRows };
  }

  parseCSVLine(line, delimiter) {
    const pattern = new RegExp(
      `(?!\\s*$)\\s*(?:'([^']*(?:''[^']*)*)'|"([^"]*(?:""[^"]*)*)"|([^${delimiter}"'\\s][^${delimiter}]*?)|(${delimiter}))\\s*(?:${delimiter}|$)`,
      'g'
    );
    const cells = [];
    let match;
    let lastIndex = 0;
    while ((match = pattern.exec(line)) !== null) {
      if (match.index === lastIndex && match[4]) {
        cells.push('');
        lastIndex = pattern.lastIndex;
        continue;
      }
      lastIndex = pattern.lastIndex;
      let value = match[1] || match[2] || match[3] || '';
      value = value.replace(/''/g, "'").replace(/""/g, '"').trim();
      cells.push(value);
    }
    return cells;
  }

  detectDelimiter(text) {
    const commaCount = (text.match(/,/g) || []).length;
    const semicolonCount = (text.match(/;/g) || []).length;
    const tabCount = (text.match(/\t/g) || []).length;
    if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
    if (semicolonCount > commaCount) return ';';
    return ',';
  }

  findBestHeaderMatch(fieldKey, headers) {
    const normalizedField = fieldKey.toLowerCase();
    const match = headers.find(header => header.toLowerCase() === normalizedField);
    if (match) return match;
    const looseMatch = headers.find(header => header.toLowerCase().includes(normalizedField));
    return looseMatch || '';
  }

  saveIngredientRecord(ingredient) {
    const existing = JSON.parse(localStorage.getItem('ingredients_database') || '[]');
    const duplicate = existing.some(item => item.name.toLowerCase() === ingredient.name.toLowerCase());
    if (duplicate) {
      console.log('Skipping duplicate ingredient:', ingredient.name);
      return false;
    }
    existing.push(ingredient);
    localStorage.setItem('ingredients_database', JSON.stringify(existing));
    localStorage.setItem('ingredients', JSON.stringify(existing));
    return true;
  }

  closeModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}

window.importService = new ImportService();

