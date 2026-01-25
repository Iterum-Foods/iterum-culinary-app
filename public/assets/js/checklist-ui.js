class ChecklistUI {
    constructor(manager) {
        this.manager = manager;
        this.container = null;
        this.statusContainer = null;
        this.recentContainer = null;
        this.modal = null;
    }

    init() {
        this.container = document.getElementById('checklist-dashboard-card');
        if (!this.container) {
            console.warn('ChecklistUI: container element not found.');
            return;
        }

        this.renderBase();
        this.renderStatus();
        this.renderRecent();

        this.manager.on('projectChanged', () => {
            this.renderStatus();
            this.renderRecent();
        });

        this.manager.on('entriesLoaded', () => {
            this.renderStatus();
            this.renderRecent();
        });

        this.manager.on('entryAdded', () => {
            this.renderStatus();
            this.renderRecent();
        });

        this.manager.on('entrySynced', () => {
            this.renderStatus();
            this.renderRecent();
        });
    }

    renderBase() {
        this.container.innerHTML = `
            <div class="dashboard-card-header">
                <div>
                    <div class="dashboard-card-title">Food Safety Checklists</div>
                    <div class="text-xs text-gray-500">Track refrigeration temps and sanitizer levels across all projects.</div>
                </div>
                <div class="checklist-action-buttons">
                    <button class="btn btn-primary btn-sm" data-template="refrigeration_temp">Log Temperature</button>
                    <button class="btn btn-secondary btn-sm" data-template="sanitizer_log">Log Sanitizer</button>
                </div>
            </div>
            <div class="checklist-status" id="checklist-status-list"></div>
            <div class="checklist-recent-wrapper">
                <div class="checklist-recent-header">
                    <h4 class="heading-4">Recent Entries</h4>
                    <button class="btn btn-sm btn-secondary" id="checklist-review-all">View All Entries</button>
                </div>
                <div id="checklist-recent-list" class="checklist-recent-list"></div>
            </div>
        `;

        this.injectStyles();

        this.statusContainer = this.container.querySelector('#checklist-status-list');
        this.recentContainer = this.container.querySelector('#checklist-recent-list');

        this.container.querySelectorAll('[data-template]').forEach((button) => {
            button.addEventListener('click', () => {
                const templateId = button.getAttribute('data-template');
                this.openEntryModal(templateId);
            });
        });

        const reviewButton = this.container.querySelector('#checklist-review-all');
        reviewButton.addEventListener('click', () => {
            this.openHistoryModal();
        });
    }

    renderStatus() {
        if (!this.statusContainer) return;

        const projectId = this.manager.getActiveProjectId();
        const templates = this.manager.getTemplates();

        if (!templates.length) {
            this.statusContainer.innerHTML = '<p class="text-sm text-gray-500">No checklists configured.</p>';
            return;
        }

        const items = templates.map((template) => {
            const status = this.manager.getTemplateStatus(template.id, projectId);
            return this.renderStatusCard(status);
        });

        this.statusContainer.innerHTML = `<div class="checklist-status-grid">${items.join('')}</div>`;

        this.statusContainer.querySelectorAll('[data-template-log]').forEach((button) => {
            const templateId = button.getAttribute('data-template-log');
            button.addEventListener('click', () => this.openEntryModal(templateId));
        });
    }

    renderStatusCard(status) {
        const template = status.template;
        const className = status.overdue ? 'status-pill status-pill-danger' : 'status-pill status-pill-safe';
        const dueLabel = status.overdue
            ? 'Overdue'
            : status.dueInMinutes !== null
                ? `Due in ${this.formatMinutes(status.dueInMinutes)}`
                : 'Log Needed';

        const lastEntry = status.lastEntry
            ? `${this.formatRelativeTime(status.lastEntry.timestamp)} • ${status.lastEntry.status === 'attention' ? '⚠️ Requires review' : '✅ Normal'}`
            : 'No entries recorded';

        return `
            <div class="checklist-status-card">
                <div class="checklist-status-header">
                    <div>
                        <div class="checklist-status-title">${template.name}</div>
                        <div class="checklist-status-subtitle">${template.schedule?.label || 'As needed'}</div>
                    </div>
                    <span class="${className}">${dueLabel}</span>
                </div>
                <div class="checklist-status-body">
                    <div class="status-row">
                        <span class="status-label">Last Entry</span>
                        <span class="status-value">${lastEntry}</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Project Tags</span>
                        <span class="status-value">${(template.projectTags || []).map((tag) => `#${tag}`).join(' ') || '—'}</span>
                    </div>
                </div>
                <div class="checklist-status-footer">
                    <button class="btn btn-sm btn-secondary" data-template-log="${template.id}">Log Now</button>
                </div>
            </div>
        `;
    }

    renderRecent() {
        if (!this.recentContainer) return;

        const projectId = this.manager.getActiveProjectId();
        const entries = this.manager.getRecentEntries(projectId, 6);

        if (!entries.length) {
            this.recentContainer.innerHTML = '<p class="text-sm text-gray-500">No checklist entries yet.</p>';
            return;
        }

        const listItems = entries
            .map((entry) => {
                const template = this.manager.getTemplate(entry.templateId);
                const statusIcon = entry.status === 'attention' ? '⚠️' : '✅';
                const summary = this.buildEntrySummary(template, entry);

                return `
                    <div class="checklist-entry-row">
                        <div class="entry-meta">
                            <div class="entry-title">${statusIcon} ${template?.name || entry.templateId}</div>
                            <div class="entry-subtitle">${this.formatRelativeTime(entry.timestamp)} • ${entry.projectTags?.map((tag) => `#${tag}`).join(' ') || ''}</div>
                        </div>
                        <div class="entry-summary">${summary}</div>
                    </div>
                `;
            })
            .join('');

        this.recentContainer.innerHTML = listItems;
    }

    buildEntrySummary(template, entry) {
        if (!template) return '';
        const fields = template.fields || [];
        const pieces = [];

        fields.forEach((field) => {
            const value = entry.data?.[field.id];
            if (value === undefined || value === null || value === '') return;
            if (field.type === 'textarea') return; // skip verbose fields in summary

            let displayValue = value;
            if (field.type === 'number') {
                displayValue = Number(value).toFixed(1);
                if (field.id === 'temperature') {
                    displayValue += '°F';
                } else if (field.id === 'concentration') {
                    displayValue += ' ppm';
                }
            }

            pieces.push(`<span>${field.label}: <strong>${displayValue}</strong></span>`);
        });

        if (entry.requiresAttention) {
            pieces.push('<span class="entry-flag">⚠️ Attention Required</span>');
        }

        return pieces.join(' • ') || 'No data recorded';
    }

    openEntryModal(templateId) {
        const template = this.manager.getTemplate(templateId);
        if (!template) {
            window.showError?.('Checklist template not found.');
            return;
        }

        this.closeModal();
        this.modal = document.createElement('div');
        this.modal.className = 'checklist-modal-overlay';
        this.modal.innerHTML = `
            <div class="checklist-modal">
                <div class="checklist-modal-header">
                    <h3>${template.name}</h3>
                    <button class="checklist-modal-close" aria-label="Close">✕</button>
                </div>
                <div class="checklist-modal-body">
                    <form id="checklist-entry-form">
                        ${this.renderFormFields(template)}
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Entry</button>
                            <button type="button" class="btn btn-secondary" data-dismiss>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        this.modal.querySelector('.checklist-modal-close').addEventListener('click', () => this.closeModal());
        this.modal.querySelector('[data-dismiss]').addEventListener('click', () => this.closeModal());

        const form = this.modal.querySelector('#checklist-entry-form');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleFormSubmit(template);
        });
    }

    openHistoryModal() {
        const projectId = this.manager.getActiveProjectId();
        const entries = this.manager.getEntries(projectId);

        this.closeModal();
        this.modal = document.createElement('div');
        this.modal.className = 'checklist-modal-overlay';

        const rows = entries.slice(0, 50).map((entry) => {
            const template = this.manager.getTemplate(entry.templateId);
            const statusIcon = entry.status === 'attention' ? '⚠️' : '✅';
            const summary = this.buildEntrySummary(template, entry);
            return `
                <tr>
                    <td>${statusIcon}</td>
                    <td>${template?.name || entry.templateId}</td>
                    <td>${this.formatDate(entry.timestamp)}</td>
                    <td>${summary}</td>
                    <td>${entry.requiresAttention ? 'Needs Review' : 'Complete'}</td>
                </tr>
            `;
        });

        this.modal.innerHTML = `
            <div class="checklist-modal checklist-modal-wide">
                <div class="checklist-modal-header">
                    <h3>Checklist History</h3>
                    <button class="checklist-modal-close" aria-label="Close">✕</button>
                </div>
                <div class="checklist-modal-body checklist-history-body">
                    <table class="checklist-history-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Checklist</th>
                                <th>Timestamp</th>
                                <th>Summary</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.join('') || '<tr><td colspan="5">No entries recorded.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.modal.querySelector('.checklist-modal-close').addEventListener('click', () => this.closeModal());
    }

    renderFormFields(template) {
        return template.fields
            .map((field) => {
                const fieldId = `chk-field-${template.id}-${field.id}`;
                const requiredAttr = field.required ? 'required' : '';

                if (field.type === 'textarea') {
                    return `
                        <div class="form-group">
                            <label for="${fieldId}" class="form-label">${field.label}${field.requiredOnAlert ? ' *' : ''}</label>
                            <textarea id="${fieldId}" name="${field.id}" class="form-textarea" ${requiredAttr} placeholder="${field.placeholder || ''}"></textarea>
                        </div>
                    `;
                }

                if (field.type === 'number') {
                    const minAttr = field.min !== undefined ? `min="${field.min}"` : '';
                    const maxAttr = field.max !== undefined ? `max="${field.max}"` : '';
                    const stepAttr = field.step !== undefined ? `step="${field.step}"` : 'step="0.1"';
                    return `
                        <div class="form-group">
                            <label for="${fieldId}" class="form-label">${field.label}${field.required ? ' *' : ''}</label>
                            <input id="${fieldId}" name="${field.id}" type="number" class="form-input" ${requiredAttr} ${minAttr} ${maxAttr} ${stepAttr} />
                        </div>
                    `;
                }

                if (field.type === 'select') {
                    const options = (field.options || []).map((option) => `<option value="${option}">${option}</option>`).join('');
                    const datalistId = `${fieldId}-options`;

                    return `
                        <div class="form-group">
                            <label for="${fieldId}" class="form-label">${field.label}${field.required ? ' *' : ''}</label>
                            <input id="${fieldId}" name="${field.id}" class="form-input" list="${datalistId}" ${requiredAttr} placeholder="${field.placeholder || ''}" />
                            <datalist id="${datalistId}">
                                ${options}
                            </datalist>
                        </div>
                    `;
                }

                return `
                    <div class="form-group">
                        <label for="${fieldId}" class="form-label">${field.label}${field.required ? ' *' : ''}</label>
                        <input id="${fieldId}" name="${field.id}" type="text" class="form-input" ${requiredAttr} placeholder="${field.placeholder || ''}" />
                    </div>
                `;
            })
            .join('');
    }

    handleFormSubmit(template) {
        const form = this.modal.querySelector('#checklist-entry-form');
        const formData = new FormData(form);
        const payload = {};

        template.fields.forEach((field) => {
            let value = formData.get(field.id);
            if (value === null || value === undefined || value === '') {
                if (field.required) {
                    value = '';
                } else {
                    return;
                }
            }

            if (field.type === 'number') {
                value = Number(value);
                if (Number.isNaN(value)) {
                    window.showError?.(`${field.label} must be a valid number.`);
                    throw new Error('Invalid numeric entry');
                }
            } else {
                value = value.toString();
            }

            payload[field.id] = value;
        });

        try {
            const entry = this.manager.addEntry(template.id, payload);
            if (entry.requiresAttention) {
                window.showWarning?.('Entry saved, but values are outside target range. Please complete corrective actions.');
            } else {
                window.showSuccess?.('Checklist entry saved.');
            }
            this.closeModal();
        } catch (error) {
            console.error('Checklist entry error:', error);
            window.showError?.(error.message || 'Unable to save checklist entry.');
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    formatRelativeTime(timestamp) {
        const date = this.manager.parseTimestamp(timestamp);
        if (!date) return 'N/A';
        const diffMs = Date.now() - date;
        const diffMinutes = Math.round(diffMs / 60000);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hr ago`;
        const diffDays = Math.round(diffHours / 24);
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }

    formatMinutes(minutes) {
        if (minutes === null || minutes === undefined) return 'Now';
        if (minutes <= 0) return 'Now';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.round(minutes / 60);
        return `${hours} hr`;
    }

    formatDate(timestamp) {
        const date = new Date(this.manager.parseTimestamp(timestamp));
        if (Number.isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleString();
    }

    injectStyles() {
        if (document.getElementById('checklist-ui-styles')) return;
        const style = document.createElement('style');
        style.id = 'checklist-ui-styles';
        style.textContent = `
            .checklist-status-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 16px;
                margin-top: 16px;
            }

            .checklist-status-card {
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.04), rgba(148, 163, 184, 0.08));
                border: 1px solid rgba(148, 163, 184, 0.2);
                border-radius: 16px;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .checklist-status-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
            }

            .checklist-status-title {
                font-weight: 700;
                color: #0f172a;
            }

            .checklist-status-subtitle {
                font-size: 12px;
                color: #64748b;
            }

            .checklist-status-body {
                font-size: 13px;
                color: #334155;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .status-row {
                display: flex;
                justify-content: space-between;
                gap: 12px;
            }

            .status-label {
                font-weight: 600;
                color: #475569;
            }

            .status-value {
                text-align: right;
            }

            .status-pill {
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }

            .status-pill-danger {
                background: rgba(248, 113, 113, 0.15);
                color: #b91c1c;
            }

            .status-pill-safe {
                background: rgba(34, 197, 94, 0.15);
                color: #166534;
            }

            .checklist-action-buttons {
                display: flex;
                gap: 8px;
            }

            .checklist-recent-wrapper {
                margin-top: 24px;
                border-top: 1px solid rgba(148, 163, 184, 0.2);
                padding-top: 16px;
            }

            .checklist-recent-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .checklist-entry-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                padding: 10px 0;
                border-bottom: 1px dashed rgba(148, 163, 184, 0.2);
            }

            .checklist-entry-row:last-child {
                border-bottom: none;
            }

            .entry-meta {
                max-width: 50%;
            }

            .entry-title {
                font-weight: 600;
                color: #0f172a;
            }

            .entry-subtitle {
                font-size: 12px;
                color: #64748b;
            }

            .entry-summary {
                font-size: 13px;
                color: #334155;
                text-align: right;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .entry-flag {
                color: #b91c1c;
                font-weight: 600;
            }

            .checklist-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
            }

            .checklist-modal {
                width: min(560px, 100%);
                background: #ffffff;
                border-radius: 18px;
                box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                max-height: 90vh;
            }

            .checklist-modal-wide {
                width: min(800px, 100%);
            }

            .checklist-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px 22px;
                border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(59, 130, 246, 0.1));
            }

            .checklist-modal-body {
                padding: 22px;
                overflow-y: auto;
            }

            .checklist-modal-close {
                border: none;
                background: transparent;
                font-size: 18px;
                cursor: pointer;
                color: #475569;
            }

            .checklist-history-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
                color: #1e293b;
            }

            .checklist-history-table th,
            .checklist-history-table td {
                padding: 10px 12px;
                border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                text-align: left;
            }

            .checklist-history-table th {
                background: rgba(148, 163, 184, 0.12);
                font-weight: 600;
                color: #0f172a;
            }

            @media (max-width: 640px) {
                .checklist-status-grid {
                    grid-template-columns: 1fr;
                }

                .entry-summary {
                    text-align: left;
                }

                .checklist-action-buttons {
                    flex-direction: column;
                    align-items: stretch;
                }

                .checklist-entry-row {
                    flex-direction: column;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.checklistManager) return;
    window.checklistUI = new ChecklistUI(window.checklistManager);
    window.checklistUI.init();
});


