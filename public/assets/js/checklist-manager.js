class ChecklistManager {
    constructor() {
        this.templates = new Map();
        this.entries = {};
        this.listeners = [];
        this.localPrefix = 'iterum_checklists_';
        this.activeProjectId = null;
        this.currentUserId = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.registerDefaultTemplates();
        this.currentUserId = window.authManager?.currentUser?.id || window.currentUser?.id || null;

        const currentProject = window.projectManager?.currentProject?.id || window.projectManager?.masterProjectId || 'master';
        this.setActiveProject(currentProject);

        window.addEventListener('projectChanged', (event) => {
            const project = event.detail?.project;
            if (project?.id) {
                this.setActiveProject(project.id);
            }
        });

        window.addEventListener('storage', (event) => {
            if (!event.key || !event.key.startsWith(this.localPrefix)) return;
            const projectId = event.key.replace(this.localPrefix, '');
            if (!projectId) return;
            this.entries[projectId] = this.readEntriesFromStorage(projectId);
            if (projectId === this.activeProjectId) {
                this.notify('entriesLoaded', { projectId, entries: this.getEntries(projectId) });
            }
        });

        this.initialized = true;
        window.checklistManager = this;
    }

    registerDefaultTemplates() {
        const refrigerationTemplate = {
            id: 'refrigeration_temp',
            name: 'Refrigeration Temp Log',
            description: 'Log cold storage temperatures and corrective actions.',
            category: 'foodSafety',
            projectTags: ['food-safety', 'cold-storage'],
            schedule: {
                intervalMinutes: 180,
                label: 'Every 3 hours',
            },
            fields: [
                {
                    id: 'location',
                    label: 'Unit / Location',
                    type: 'select',
                    options: ['Walk-in Cooler', 'Reach-in Cooler', 'Prep Line Cooler', 'Freezer', 'Bar Cooler'],
                    allowCustom: true,
                    required: true,
                },
                {
                    id: 'temperature',
                    label: 'Temperature (°F)',
                    type: 'number',
                    min: 33,
                    max: 41,
                    step: 0.1,
                    required: true,
                    alerts: {
                        low: 33,
                        high: 41,
                        message: 'Temperature must be between 33°F and 41°F to remain within HACCP guidelines.',
                    },
                },
                {
                    id: 'correctiveAction',
                    label: 'Corrective Action',
                    type: 'textarea',
                    placeholder: 'Describe any corrective action taken if out of range.',
                    requiredOnAlert: true,
                },
                {
                    id: 'notes',
                    label: 'Notes',
                    type: 'textarea',
                    placeholder: 'Optional notes or observations.',
                },
            ],
        };

        const sanitizerTemplate = {
            id: 'sanitizer_log',
            name: 'Sanitizer Concentration Log',
            description: 'Verify sanitizer buckets / stations are within safe ppm range.',
            category: 'foodSafety',
            projectTags: ['food-safety', 'sanitation'],
            schedule: {
                intervalMinutes: 240,
                label: 'Every 4 hours',
            },
            fields: [
                {
                    id: 'station',
                    label: 'Station / Area',
                    type: 'select',
                    options: ['Front Line', 'Prep Sink', 'Bar', 'Dish Pit', 'Server Station'],
                    allowCustom: true,
                    required: true,
                },
                {
                    id: 'solution',
                    label: 'Sanitizer Solution',
                    type: 'select',
                    options: ['Quat', 'Chlorine', 'Iodine'],
                    allowCustom: true,
                    required: true,
                },
                {
                    id: 'concentration',
                    label: 'Concentration (ppm)',
                    type: 'number',
                    min: 150,
                    max: 400,
                    required: true,
                    alerts: {
                        low: 150,
                        high: 400,
                        message: 'Sanitizer must be between 150 ppm and 400 ppm.',
                    },
                },
                {
                    id: 'testMethod',
                    label: 'Test Method',
                    type: 'select',
                    options: ['Test Strips', 'Digital Meter'],
                    allowCustom: true,
                    required: true,
                },
                {
                    id: 'correctiveAction',
                    label: 'Corrective Action',
                    type: 'textarea',
                    placeholder: 'Describe any corrective action taken if out of range.',
                    requiredOnAlert: true,
                },
                {
                    id: 'verifiedBy',
                    label: 'Verified By',
                    type: 'text',
                    placeholder: 'Initials or full name',
                },
            ],
        };

        this.registerTemplate(refrigerationTemplate);
        this.registerTemplate(sanitizerTemplate);
    }

    registerTemplate(template) {
        if (!template || !template.id) {
            console.warn('Checklist template missing id:', template);
            return;
        }
        const enrichedTemplate = {
            version: template.version || 1,
            ...template,
        };
        this.templates.set(enrichedTemplate.id, enrichedTemplate);
    }

    getTemplates() {
        return Array.from(this.templates.values());
    }

    getTemplate(templateId) {
        return this.templates.get(templateId) || null;
    }

    setActiveProject(projectId) {
        if (!projectId) return;
        this.activeProjectId = projectId;
        if (!this.entries[projectId]) {
            this.entries[projectId] = this.readEntriesFromStorage(projectId);
        }
        this.notify('projectChanged', { projectId, entries: this.getEntries(projectId) });
        this.fetchRemoteEntries(projectId);
    }

    getActiveProjectId() {
        return this.activeProjectId || window.projectManager?.currentProject?.id || 'master';
    }

    getEntries(projectId = this.getActiveProjectId()) {
        return this.entries[projectId] || [];
    }

    readEntriesFromStorage(projectId) {
        try {
            const raw = localStorage.getItem(this.localPrefix + projectId);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch (error) {
            console.warn('⚠️ Unable to read checklist entries from storage:', error);
            return [];
        }
    }

    persistProject(projectId) {
        try {
            const entries = this.getEntries(projectId);
            localStorage.setItem(this.localPrefix + projectId, JSON.stringify(entries));
        } catch (error) {
            console.warn('⚠️ Unable to persist checklist entries:', error);
        }
    }

    async fetchRemoteEntries(projectId) {
        if (!window.firestoreSync?.getChecklistEntries) return;
        try {
            const remoteEntries = await window.firestoreSync.getChecklistEntries(projectId, { limit: 250 });
            if (!remoteEntries || !remoteEntries.length) return;
            this.mergeRemoteEntries(projectId, remoteEntries);
        } catch (error) {
            console.warn('⚠️ Unable to fetch checklist entries from Firestore:', error);
        }
    }

    mergeRemoteEntries(projectId, remoteEntries) {
        const local = this.getEntries(projectId);
        const merged = new Map(local.map((entry) => [entry.id, entry]));

        remoteEntries.forEach((remote) => {
            if (!remote || !remote.id) return;
            const existing = merged.get(remote.id);
            const remoteUpdatedAt = this.parseTimestamp(remote.updatedAt || remote.timestamp);
            const existingUpdatedAt = this.parseTimestamp(existing?.updatedAt || existing?.timestamp);

            if (!existing || remoteUpdatedAt > existingUpdatedAt) {
                merged.set(remote.id, {
                    ...existing,
                    ...remote,
                    timestamp: remote.timestamp || existing?.timestamp,
                    updatedAt: remote.updatedAt || remote.timestamp || new Date().toISOString(),
                    syncedAt: new Date().toISOString(),
                });
            }
        });

        const combined = Array.from(merged.values()).sort((a, b) => {
            return this.parseTimestamp(b.timestamp) - this.parseTimestamp(a.timestamp);
        });

        this.entries[projectId] = combined.slice(0, 250);
        this.persistProject(projectId);
        this.notify('entriesLoaded', { projectId, entries: this.getEntries(projectId) });
    }

    addEntry(templateId, formData, options = {}) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Checklist template ${templateId} not found.`);
        }

        const projectId = options.projectId || this.getActiveProjectId();
        const projectTags = options.projectTags || template.projectTags || [];
        const projectCollaborators =
            options.collaborators ||
            window.projectManager?.currentProject?.collaborators ||
            [];

        const currentUser = window.authManager?.currentUser || window.currentUser || {};
        const ownerId = options.ownerId || currentUser.id || currentUser.userId || 'anonymous';

        const entryId =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `chk_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        const evaluation = this.evaluateEntry(template, formData);
        if (evaluation.requiresCorrectiveAction && (!formData.correctiveAction || !formData.correctiveAction.trim())) {
            throw new Error('Corrective action is required when readings fall outside accepted range.');
        }

        const timestamp = options.timestamp || new Date().toISOString();
        const entry = {
            id: entryId,
            templateId: template.id,
            templateName: template.name,
            templateVersion: template.version || 1,
            projectId,
            projectTags,
            ownerId,
            collaborators: projectCollaborators,
            data: formData,
            status: evaluation.status,
            flags: evaluation.flags,
            requiresAttention: evaluation.status === 'attention',
            requiresCorrectiveAction: evaluation.requiresCorrectiveAction,
            createdAt: timestamp,
            timestamp,
            updatedAt: timestamp,
            syncedAt: null,
        };

        const entries = this.getEntries(projectId);
        entries.unshift(entry);
        this.entries[projectId] = entries.slice(0, 250);
        this.persistProject(projectId);

        this.notify('entryAdded', { projectId, entry, template });

        if (window.firestoreSync?.saveChecklistEntry) {
            window.firestoreSync
                .saveChecklistEntry(entry)
                .then(() => {
                    entry.syncedAt = new Date().toISOString();
                    entry.updatedAt = entry.syncedAt;
                    this.persistProject(projectId);
                    this.notify('entrySynced', { projectId, entry });
                })
                .catch((error) => {
                    console.warn('⚠️ Failed to sync checklist entry with Firestore:', error);
                });
        }

        return entry;
    }

    evaluateEntry(template, data) {
        const flags = [];
        let status = 'completed';
        let requiresCorrectiveAction = false;

        template.fields.forEach((field) => {
            const value = data[field.id];
            if (value === undefined || value === null || value === '') return;

            if (field.type === 'number') {
                const numericValue = Number(value);
                if (Number.isNaN(numericValue)) return;

                if (field.min !== undefined && numericValue < field.min) {
                    flags.push({
                        fieldId: field.id,
                        type: 'out_of_range_low',
                        message:
                            field.alerts?.message ||
                            `${field.label} is below minimum (${field.min}).`,
                        actual: numericValue,
                    });
                    status = 'attention';
                    requiresCorrectiveAction = requiresCorrectiveAction || field.requiredOnAlert;
                }

                if (field.max !== undefined && numericValue > field.max) {
                    flags.push({
                        fieldId: field.id,
                        type: 'out_of_range_high',
                        message:
                            field.alerts?.message ||
                            `${field.label} is above maximum (${field.max}).`,
                        actual: numericValue,
                    });
                    status = 'attention';
                    requiresCorrectiveAction = requiresCorrectiveAction || field.requiredOnAlert;
                }
            }
        });

        return { status, flags, requiresCorrectiveAction };
    }

    getTemplateStatus(templateId, projectId = this.getActiveProjectId()) {
        const template = this.getTemplate(templateId);
        if (!template) return null;

        const entries = this.getEntries(projectId).filter((entry) => entry.templateId === templateId);
        const mostRecent = entries.length ? entries[0] : null;
        const now = Date.now();

        let nextDue = null;
        let overdue = false;
        let dueInMinutes = null;

        if (template.schedule?.intervalMinutes) {
            if (mostRecent) {
                const lastTime = this.parseTimestamp(mostRecent.timestamp);
                nextDue = lastTime + template.schedule.intervalMinutes * 60 * 1000;
                dueInMinutes = Math.round((nextDue - now) / 60000);
                overdue = now > nextDue;
            } else {
                overdue = true;
            }
        }

        return {
            template,
            lastEntry: mostRecent,
            nextDue,
            overdue,
            dueInMinutes,
        };
    }

    getRecentEntries(projectId = this.getActiveProjectId(), limit = 6) {
        return this.getEntries(projectId).slice(0, limit);
    }

    parseTimestamp(value) {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return Date.parse(value);
        if (value.toDate) return value.toDate().getTime();
        return 0;
    }

    on(eventName, callback) {
        this.listeners.push({ eventName, callback });
    }

    notify(eventName, payload) {
        this.listeners
            .filter((listener) => listener.eventName === eventName)
            .forEach((listener) => {
                try {
                    listener.callback(payload);
                } catch (error) {
                    console.error('Checklist listener error:', error);
                }
            });
    }
}

window.checklistManager = new ChecklistManager();

document.addEventListener('DOMContentLoaded', () => {
    window.checklistManager.init();
});


