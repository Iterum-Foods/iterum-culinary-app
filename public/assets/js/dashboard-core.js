/**
 * Dashboard Core Functionality
 * Handles notes, tasks, ideas, and project context
 */

(function () {
  const Dashboard = {
    storagePrefix: 'iterum.dashboard.simplified',
    projectId: 'master',
    activeDate: '',
    /** @type {null | (() => void)} */
    teamShiftFeedUnsub: null,
    init() {
      this.cacheElements();
      this.syncProjectContext();
      this.bindEvents();
      this.ensureDate();
      this.renderAll();
      document.addEventListener('projectChanged', event =>
        this.handleProjectChanged(event)
      );
      window.addEventListener('firestoreSyncReady', () => {
        this.attachTeamShiftFeedListener();
      });
    },
    cacheElements() {
      this.dateInput = document.getElementById('dashboard-date');
      this.projectChip = document.getElementById('header-project-chip');
      this.notesDaily = document.getElementById('notes-daily-content');
      this.notesManager = document.getElementById('notes-manager-content');
      this.notesManagerSection = document.getElementById(
        'notes-manager-section'
      );
      this.notesStatus = document.getElementById('notes-status');
      this.notesTeamShiftFeed = document.getElementById(
        'notes-team-shift-feed'
      );
      this.saveNotesBtn = document.getElementById('save-notes');
      this.clearNotesDailyBtn = document.getElementById('clear-notes-daily');
      this.clearNotesManagerBtn = document.getElementById(
        'clear-notes-manager'
      );
      this.taskForm = document.getElementById('task-form');
      this.taskInput = document.getElementById('task-input');
      this.taskList = document.getElementById('task-list');
      this.taskStatus = document.getElementById('task-status');
      this.clearCompletedBtn = document.getElementById('clear-completed');
      this.resetTasksBtn = document.getElementById('reset-tasks');
      this.ideaForm = document.getElementById('idea-form');
      this.ideaTitle = document.getElementById('idea-title');
      this.ideaNotes = document.getElementById('idea-notes');
      this.clearIdeasBtn = document.getElementById('clear-ideas');
      this.ideaList = document.getElementById('idea-list');
      this.ideaStatus = document.getElementById('idea-status');
      this.quickStatTasks = document.getElementById('quick-stat-tasks');
      this.quickStatIdeas = document.getElementById('quick-stat-ideas');
      this.quickStatNotes = document.getElementById('quick-stat-notes');
    },
    bindEvents() {
      if (this.dateInput) {
        this.dateInput.addEventListener('change', () => {
          this.ensureDate();
          this.renderAll();
        });
      }
      if (this.saveNotesBtn) {
        this.saveNotesBtn.addEventListener('click', e => {
          e.preventDefault();
          this.saveNotes();
        });
      }
      if (this.clearNotesDailyBtn) {
        this.clearNotesDailyBtn.addEventListener('click', e => {
          e.preventDefault();
          if (this.notesDaily) {
            this.notesDaily.value = '';
          }
        });
      }
      if (this.clearNotesManagerBtn) {
        this.clearNotesManagerBtn.addEventListener('click', e => {
          e.preventDefault();
          if (this.notesManager) {
            this.notesManager.value = '';
          }
        });
      }
      if (this.taskForm) {
        this.taskForm.addEventListener('submit', e => {
          e.preventDefault();
          this.addTask();
        });
      }
      if (this.clearCompletedBtn) {
        this.clearCompletedBtn.addEventListener('click', e => {
          e.preventDefault();
          this.clearCompletedTasks();
        });
      }
      if (this.resetTasksBtn) {
        this.resetTasksBtn.addEventListener('click', e => {
          e.preventDefault();
          this.resetTaskList();
        });
      }
      if (this.taskList) {
        this.taskList.addEventListener('click', e => {
          const target = e.target;
          const taskId = target.dataset.taskId;
          if (!taskId) {
            return;
          }
          if (target.dataset.action === 'delete') {
            this.deleteTask(taskId);
          }
        });
        this.taskList.addEventListener('change', e => {
          const target = e.target;
          if (target.matches('input[type="checkbox"][data-task-id]')) {
            this.toggleTask(target.dataset.taskId, target.checked);
          }
        });
      }
      if (this.ideaForm) {
        this.ideaForm.addEventListener('submit', e => {
          e.preventDefault();
          this.addIdea();
        });
      }
      if (this.clearIdeasBtn) {
        this.clearIdeasBtn.addEventListener('click', e => {
          e.preventDefault();
          this.clearIdeas();
        });
      }
      if (this.ideaList) {
        this.ideaList.addEventListener('click', e => {
          const target = e.target;
          const ideaId = target.dataset.ideaId;
          if (!ideaId) {
            return;
          }
          if (target.dataset.action === 'delete') {
            this.deleteIdea(ideaId);
          } else if (target.dataset.action === 'toggle') {
            this.toggleIdeaStatus(ideaId);
          }
        });
      }
    },
    updateQuickStats() {
      if (this.quickStatTasks) {
        const map = this.getTasksMap();
        const tasks = map[this.activeDate] || [];
        const openTasks = tasks.filter(task => !task.done).length;
        this.quickStatTasks.textContent = openTasks;
      }
      if (this.quickStatIdeas) {
        const ideas = this.getIdeas();
        const openIdeas = ideas.filter(idea => idea.status !== 'done').length;
        this.quickStatIdeas.textContent = openIdeas;
      }
      if (this.quickStatNotes) {
        const notesMap = this.getNotesMap();
        this.quickStatNotes.textContent = this.countDaysWithNotes(notesMap);
      }
    },
    syncProjectContext() {
      try {
        if (window.projectManager) {
          if (typeof window.projectManager.getActiveProject === 'function') {
            const project = window.projectManager.getActiveProject();
            if (project) {
              this.projectId =
                project.id || project.projectId || this.projectId;
              this.updateProjectChip(
                project.name || project.title || 'Active Project'
              );
              return;
            }
          }
          if (window.projectManager.currentProjectId) {
            this.projectId = window.projectManager.currentProjectId;
            this.updateProjectChip(
              window.projectManager.currentProjectName || 'Active Project'
            );
            return;
          }
          if (window.projectManager.currentProject) {
            this.projectId =
              window.projectManager.currentProject.id || this.projectId;
            this.updateProjectChip(
              window.projectManager.currentProject.name || 'Active Project'
            );
            return;
          }
        }
        const storedName = localStorage.getItem('active_project_name');
        const storedId = localStorage.getItem('active_project_id');
        if (storedId) {
          this.projectId = storedId;
        }
        this.updateProjectChip(storedName || 'Master Project');
      } catch (error) {
        console.warn('⚠️ Failed to sync project context:', error);
        this.updateProjectChip('Master Project');
      }
    },
    updateProjectChip(name) {
      if (this.projectChip) {
        this.projectChip.textContent = `Project: ${name || 'Master Project'}`;
      }
    },
    ensureDate() {
      const today = this.getToday();
      if (!this.dateInput.value) {
        this.dateInput.value = today;
      }
      this.activeDate = this.dateInput.value || today;
    },
    getToday() {
      return new Date().toISOString().slice(0, 10);
    },
    getNotesMap() {
      const key = `${this.storagePrefix}.notes.${this.projectId}`;
      try {
        return JSON.parse(localStorage.getItem(key)) || {};
      } catch (error) {
        console.warn('⚠️ Failed to parse notes map:', error);
        return {};
      }
    },
    setNotesMap(map) {
      const key = `${this.storagePrefix}.notes.${this.projectId}`;
      localStorage.setItem(key, JSON.stringify(map));
    },
    canViewManagerNotes() {
      return (
        typeof window.iterumCanViewManagerNotes === 'function' &&
        window.iterumCanViewManagerNotes()
      );
    },
    normalizeDayEntry(raw) {
      if (!raw || typeof raw !== 'object') {
        return {
          daily: '',
          manager: '',
          dailyUpdatedAt: null,
          managerUpdatedAt: null
        };
      }
      if (
        typeof raw.content === 'string' &&
        raw.daily === undefined &&
        raw.manager === undefined
      ) {
        return {
          daily: raw.content,
          manager: '',
          dailyUpdatedAt: raw.updatedAt || null,
          managerUpdatedAt: null
        };
      }
      return {
        daily: typeof raw.daily === 'string' ? raw.daily : '',
        manager: typeof raw.manager === 'string' ? raw.manager : '',
        dailyUpdatedAt: raw.dailyUpdatedAt || null,
        managerUpdatedAt: raw.managerUpdatedAt || null
      };
    },
    countDaysWithNotes(map) {
      let n = 0;
      Object.keys(map).forEach(dateKey => {
        const e = this.normalizeDayEntry(map[dateKey]);
        const hasDaily = !!(e.daily && e.daily.trim());
        const hasManager = !!(e.manager && e.manager.trim());
        if (hasDaily || hasManager) {
          n += 1;
        }
      });
      return n;
    },
    saveNotes() {
      const map = this.getNotesMap();
      const prev = this.normalizeDayEntry(map[this.activeDate]);
      const daily = (this.notesDaily && this.notesDaily.value.trim()) || '';
      const manager = this.canViewManagerNotes()
        ? (this.notesManager && this.notesManager.value.trim()) || ''
        : prev.manager;
      const now = new Date().toISOString();
      const hasDaily = !!daily;
      const hasManager = !!manager;
      if (!hasDaily && !hasManager) {
        delete map[this.activeDate];
      } else {
        const next = {
          daily,
          manager,
          dailyUpdatedAt: hasDaily ? now : prev.dailyUpdatedAt || null,
          managerUpdatedAt: hasManager ? now : prev.managerUpdatedAt || null
        };
        if (!hasDaily) {
          next.dailyUpdatedAt = prev.dailyUpdatedAt || null;
        }
        if (!hasManager) {
          next.managerUpdatedAt = prev.managerUpdatedAt || null;
        }
        map[this.activeDate] = next;
      }
      this.setNotesMap(map);
      this.setStatus(this.notesStatus, 'Saved');
      this.renderNotes();
    },
    renderNotes() {
      const showManager = this.canViewManagerNotes();
      if (this.notesManagerSection) {
        this.notesManagerSection.hidden = !showManager;
        this.notesManagerSection.setAttribute(
          'aria-hidden',
          showManager ? 'false' : 'true'
        );
      }
      if (this.clearNotesManagerBtn) {
        this.clearNotesManagerBtn.hidden = !showManager;
      }
      const map = this.getNotesMap();
      const entry = this.normalizeDayEntry(map[this.activeDate]);
      if (this.notesDaily) {
        this.notesDaily.value = entry.daily;
      }
      if (this.notesManager) {
        this.notesManager.value = showManager ? entry.manager : '';
      }
      const totalDays = this.countDaysWithNotes(map);
      if (totalDays === 0) {
        this.notesStatus.textContent = 'No saved notes yet';
      } else {
        const times = [];
        if (entry.daily && entry.dailyUpdatedAt) {
          times.push(new Date(entry.dailyUpdatedAt).getTime());
        }
        if (showManager && entry.manager && entry.managerUpdatedAt) {
          times.push(new Date(entry.managerUpdatedAt).getTime());
        }
        const lastMs = times.length ? Math.max.apply(null, times) : null;
        const lastUpdated = lastMs
          ? new Date(lastMs).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          : '—';
        const hasToday =
          (entry.daily && entry.daily.trim()) ||
          (showManager && entry.manager && entry.manager.trim());
        this.notesStatus.textContent = hasToday
          ? `Saved · ${lastUpdated}`
          : `${totalDays} day${totalDays === 1 ? '' : 's'} logged`;
      }
      this.updateQuickStats();
      this.attachTeamShiftFeedListener();
    },
    formatShiftPostRow(p) {
      const body = this.escapeHtml(String(p.body || '')).replace(/\n/g, '<br>');
      const who = this.escapeHtml(String(p.authorName || 'Team'));
      const pr =
        p.priority === 'out' ? 'out' : p.priority === 'low' ? 'low' : 'normal';
      const cat = p.category === 'inventory' ? 'inventory' : 'shift';
      let badge =
        cat === 'inventory'
          ? pr === 'out'
            ? '<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1" style="background:#fee2e2;color:#991b1b;">OUT</span>'
            : pr === 'low'
              ? '<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1" style="background:#fef3c7;color:#92400e;">LOW STOCK</span>'
              : '<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1" style="background:#e0e7ff;color:#3730a3;">INVENTORY</span>'
          : '<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1" style="background:var(--brand-bg-tertiary);color:var(--brand-text-secondary);">SHIFT</span>';
      const time =
        p.createdAt && typeof p.createdAt.toDate === 'function'
          ? p.createdAt.toDate().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          : '';
      return `<div class="mb-2 pb-2 border-b last:border-0 last:pb-0 last:mb-0" style="border-color: var(--brand-border-light);">${badge}<span class="text-xs font-semibold" style="color: var(--brand-text-primary);">${who}</span>${time ? ` <span class="text-xs" style="color: var(--brand-text-muted);">${time}</span>` : ''}<div class="mt-1" style="color: var(--brand-text-secondary);">${body}</div></div>`;
    },
    detachTeamShiftFeedListener() {
      if (typeof this.teamShiftFeedUnsub === 'function') {
        try {
          this.teamShiftFeedUnsub();
        } catch (e) {
          /* ignore */
        }
        this.teamShiftFeedUnsub = null;
      }
    },
    attachTeamShiftFeedListener() {
      const el = this.notesTeamShiftFeed;
      if (!el) {
        return;
      }
      this.detachTeamShiftFeedListener();
      const fs = window.firestoreSync;
      if (!fs || !fs.initialized || !fs.db) {
        el.innerHTML =
          '<p class="text-xs" style="color: var(--brand-text-muted);">Team posts appear when you’re signed in and Firestore is on.</p>';
        return;
      }
      if (typeof fs.subscribeShiftDayPosts !== 'function') {
        void this.refreshTeamShiftFeedOnce();
        return;
      }
      const pid = this.projectId;
      if (!pid || pid === 'mobile-default') {
        el.innerHTML =
          '<p class="text-xs" style="color: var(--brand-text-muted);">Select a project to load shift-app posts.</p>';
        return;
      }
      const dateKey = this.activeDate;
      if (!dateKey) {
        return;
      }
      el.innerHTML =
        '<p class="text-xs" style="color: var(--brand-text-muted);">Loading team posts…</p>';
      this.teamShiftFeedUnsub = fs.subscribeShiftDayPosts(
        pid,
        dateKey,
        posts => {
          if (!this.notesTeamShiftFeed) {
            return;
          }
          if (this.projectId !== pid || this.activeDate !== dateKey) {
            return;
          }
          if (!posts.length) {
            el.innerHTML =
              '<p class="text-xs" style="color: var(--brand-text-muted);">No shift-app posts for this date yet.</p>';
            return;
          }
          el.innerHTML = posts.map(p => this.formatShiftPostRow(p)).join('');
        },
        err => {
          console.warn('team shift feed', err);
          if (this.notesTeamShiftFeed === el) {
            el.innerHTML =
              '<p class="text-xs" style="color: var(--brand-text-muted);">Could not load team posts. Deploy Firestore rules and indexes if needed.</p>';
          }
        }
      );
    },
    async refreshTeamShiftFeedOnce() {
      const el = this.notesTeamShiftFeed;
      if (!el) {
        return;
      }
      const fs = window.firestoreSync;
      if (!fs || !fs.initialized || !fs.db) {
        el.innerHTML =
          '<p class="text-xs" style="color: var(--brand-text-muted);">Team posts appear when you’re signed in and Firestore is on.</p>';
        return;
      }
      const pid = this.projectId;
      if (!pid || pid === 'mobile-default') {
        el.innerHTML =
          '<p class="text-xs" style="color: var(--brand-text-muted);">Select a project to load shift-app posts.</p>';
        return;
      }
      el.innerHTML =
        '<p class="text-xs" style="color: var(--brand-text-muted);">Loading team posts…</p>';
      try {
        const posts = await fs.getShiftDayPosts(pid, this.activeDate);
        if (!posts.length) {
          el.innerHTML =
            '<p class="text-xs" style="color: var(--brand-text-muted);">No shift-app posts for this date yet.</p>';
          return;
        }
        el.innerHTML = posts.map(p => this.formatShiftPostRow(p)).join('');
      } catch (err) {
        console.warn('refreshTeamShiftFeedOnce', err);
        el.innerHTML =
          '<p class="text-xs" style="color: var(--brand-text-muted);">Could not load team posts. Deploy Firestore rules and indexes if needed.</p>';
      }
    },
    getTasksMap() {
      const key = `${this.storagePrefix}.tasks.${this.projectId}`;
      try {
        return JSON.parse(localStorage.getItem(key)) || {};
      } catch (error) {
        console.warn('⚠️ Failed to parse tasks map:', error);
        return {};
      }
    },
    setTasksMap(map) {
      const key = `${this.storagePrefix}.tasks.${this.projectId}`;
      localStorage.setItem(key, JSON.stringify(map));
    },
    addTask() {
      const text = (this.taskInput.value || '').trim();
      if (!text) {
        this.setStatus(this.taskStatus, 'Enter a task first');
        return;
      }
      const map = this.getTasksMap();
      const tasks = map[this.activeDate] || [];
      tasks.push({
        id: this.generateId(),
        text,
        done: false,
        createdAt: new Date().toISOString()
      });
      map[this.activeDate] = tasks;
      this.setTasksMap(map);
      this.taskInput.value = '';
      this.renderTasks();
      this.setStatus(this.taskStatus, 'Task added');
    },
    toggleTask(taskId, done) {
      const map = this.getTasksMap();
      const tasks = map[this.activeDate] || [];
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.done = !!done;
        this.setTasksMap(map);
        this.renderTasks();
      }
    },
    deleteTask(taskId) {
      const map = this.getTasksMap();
      const tasks = map[this.activeDate] || [];
      map[this.activeDate] = tasks.filter(t => t.id !== taskId);
      this.setTasksMap(map);
      this.renderTasks();
      this.setStatus(this.taskStatus, 'Task removed');
    },
    clearCompletedTasks() {
      const map = this.getTasksMap();
      const tasks = map[this.activeDate] || [];
      const remaining = tasks.filter(t => !t.done);
      if (remaining.length === tasks.length) {
        this.setStatus(this.taskStatus, 'Nothing to clear');
        return;
      }
      map[this.activeDate] = remaining;
      this.setTasksMap(map);
      this.renderTasks();
      this.setStatus(this.taskStatus, 'Completed tasks cleared');
    },
    resetTaskList() {
      const map = this.getTasksMap();
      delete map[this.activeDate];
      this.setTasksMap(map);
      this.renderTasks();
      this.setStatus(this.taskStatus, 'List reset');
    },
    renderTasks() {
      const map = this.getTasksMap();
      const tasks = map[this.activeDate] || [];
      this.taskList.innerHTML = '';
      if (tasks.length === 0) {
        this.taskList.innerHTML =
          '<li class="text-sm text-center py-4" style="color: var(--brand-text-muted);">No tasks yet. Add the first one above.</li>';
        this.taskStatus.textContent = 'Nothing queued';
        this.updateQuickStats();
        return;
      }
      const openCount = tasks.filter(t => !t.done).length;
      this.taskStatus.textContent = `${openCount} open · ${tasks.length} total`;
      tasks
        .sort((a, b) => {
          if (a.done === b.done) {
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          }
          return a.done ? 1 : -1;
        })
        .forEach(task => {
          const item = document.createElement('li');
          item.className = 'task-item';
          item.innerHTML = `
            <input type="checkbox" data-task-id="${task.id}" ${task.done ? 'checked' : ''}>
            <span class="task-text flex-1 ${task.done ? 'done' : ''}" style="color: var(--brand-text-primary);">${this.escapeHtml(task.text)}</span>
            <button data-task-id="${task.id}" data-action="delete" class="text-xs px-2 py-1 rounded" style="color: var(--brand-text-muted);">Delete</button>
          `;
          this.taskList.appendChild(item);
        });
      this.updateQuickStats();
    },
    getIdeas() {
      const key = `${this.storagePrefix}.ideas.${this.projectId}`;
      try {
        return JSON.parse(localStorage.getItem(key)) || [];
      } catch (error) {
        console.warn('⚠️ Failed to parse ideas list:', error);
        return [];
      }
    },
    setIdeas(list) {
      const key = `${this.storagePrefix}.ideas.${this.projectId}`;
      localStorage.setItem(key, JSON.stringify(list));
    },
    addIdea() {
      const title = (this.ideaTitle.value || '').trim();
      const notes = (this.ideaNotes.value || '').trim();
      if (!title && !notes) {
        this.setStatus(this.ideaStatus, 'Add a title or some notes first');
        return;
      }
      const ideas = this.getIdeas();
      ideas.unshift({
        id: this.generateId(),
        title: title || 'Untitled idea',
        notes,
        status: 'open',
        createdAt: new Date().toISOString()
      });
      this.setIdeas(ideas);
      this.ideaTitle.value = '';
      this.ideaNotes.value = '';
      this.renderIdeas();
      this.setStatus(this.ideaStatus, 'Idea captured');
    },
    toggleIdeaStatus(ideaId) {
      const ideas = this.getIdeas();
      const idea = ideas.find(item => item.id === ideaId);
      if (idea) {
        idea.status = idea.status === 'done' ? 'open' : 'done';
        this.setIdeas(ideas);
        this.renderIdeas();
      }
    },
    deleteIdea(ideaId) {
      const ideas = this.getIdeas().filter(item => item.id !== ideaId);
      this.setIdeas(ideas);
      this.renderIdeas();
      this.setStatus(this.ideaStatus, 'Idea removed');
    },
    clearIdeas() {
      this.setIdeas([]);
      this.renderIdeas();
      this.setStatus(this.ideaStatus, 'Ideas cleared');
    },
    renderIdeas() {
      const ideas = this.getIdeas();
      this.ideaList.innerHTML = '';
      if (ideas.length === 0) {
        this.ideaList.innerHTML =
          '<div class="text-sm text-center py-4" style="color: var(--brand-text-muted);">No recipe ideas captured yet.</div>';
        this.ideaStatus.textContent = 'No ideas yet';
        this.updateQuickStats();
        return;
      }
      this.ideaStatus.textContent = `${ideas.length} idea${ideas.length === 1 ? '' : 's'}`;
      ideas.forEach(idea => {
        const card = document.createElement('div');
        card.className =
          'idea-item flex flex-col gap-2 p-3 rounded-md border mb-2';
        card.style.borderColor = 'var(--brand-border-light)';
        card.style.backgroundColor = 'var(--brand-bg-primary)';
        const createdAt = new Date(idea.createdAt);
        const prettyDate = createdAt.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
        card.innerHTML = `
          <div class="flex justify-between items-center text-xs" style="color: var(--brand-text-muted);">
            <span>${prettyDate}</span>
            ${idea.status === 'done' ? '<span class="px-2 py-0.5 rounded-full text-xs" style="background-color: var(--brand-secondary-accent); color: white;">Ready to build</span>' : ''}
          </div>
          <h3 class="font-semibold" style="color: var(--brand-text-primary);">${this.escapeHtml(idea.title)}</h3>
          ${idea.notes ? `<p class="text-sm" style="color: var(--brand-text-secondary);">${this.escapeHtml(idea.notes)}</p>` : ''}
          <div class="flex gap-2 mt-2">
            <button data-idea-id="${idea.id}" data-action="toggle" class="text-xs px-3 py-1 rounded" style="background-color: var(--brand-bg-tertiary); color: var(--brand-text-primary);">
              ${idea.status === 'done' ? 'Mark active' : 'Mark ready'}
            </button>
            <button data-idea-id="${idea.id}" data-action="delete" class="text-xs px-3 py-1 rounded" style="background-color: transparent; color: var(--brand-text-muted); border: 1px solid var(--brand-border-light);">Delete</button>
          </div>
        `;
        this.ideaList.appendChild(card);
      });
      this.updateQuickStats();
    },
    renderAll() {
      this.renderNotes();
      this.renderTasks();
      this.renderIdeas();
      this.updateQuickStats();
    },
    handleProjectChanged(event) {
      try {
        const detail = event?.detail || {};
        const project = detail.project || detail;
        const nextId = project?.id || project?.projectId || detail.projectId;
        if (nextId && nextId !== this.projectId) {
          this.projectId = nextId;
          this.updateProjectChip(
            project?.name || project?.title || 'Active Project'
          );
          this.renderAll();
        }
      } catch (error) {
        console.warn('⚠️ Failed to handle project change:', error);
      }
    },
    setStatus(element, message) {
      if (!element) {
        return;
      }
      element.textContent = message;
      element.style.transition = 'all 0.3s';
      element.style.opacity = '0.7';
      setTimeout(() => {
        element.style.opacity = '1';
      }, 300);
    },
    escapeHtml(text) {
      return text
        ? text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
        : '';
    },
    generateId() {
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => Dashboard.init(), 100);
    });
  } else {
    setTimeout(() => Dashboard.init(), 100);
  }

  // Make Dashboard available globally for debugging
  window.Dashboard = Dashboard;
})();
