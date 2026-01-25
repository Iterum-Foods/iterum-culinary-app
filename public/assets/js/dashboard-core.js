/**
 * Dashboard Core Functionality
 * Handles notes, tasks, ideas, and project context
 */

(function () {
  const Dashboard = {
    storagePrefix: 'iterum.dashboard.simplified',
    projectId: 'master',
    activeDate: '',
    init() {
      this.cacheElements();
      this.syncProjectContext();
      this.bindEvents();
      this.ensureDate();
      this.renderAll();
      document.addEventListener('projectChanged', (event) => this.handleProjectChanged(event));
    },
    cacheElements() {
      this.dateInput = document.getElementById('dashboard-date');
      this.projectChip = document.getElementById('header-project-chip');
      this.notesContent = document.getElementById('notes-content');
      this.notesStatus = document.getElementById('notes-status');
      this.saveNotesBtn = document.getElementById('save-notes');
      this.clearNotesBtn = document.getElementById('clear-notes');
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
        this.saveNotesBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.saveNotes();
        });
      }
      if (this.clearNotesBtn) {
        this.clearNotesBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.notesContent.value = '';
        });
      }
      if (this.taskForm) {
        this.taskForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.addTask();
        });
      }
      if (this.clearCompletedBtn) {
        this.clearCompletedBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.clearCompletedTasks();
        });
      }
      if (this.resetTasksBtn) {
        this.resetTasksBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.resetTaskList();
        });
      }
      if (this.taskList) {
        this.taskList.addEventListener('click', (e) => {
          const target = e.target;
          const taskId = target.dataset.taskId;
          if (!taskId) return;
          if (target.dataset.action === 'delete') {
            this.deleteTask(taskId);
          }
        });
        this.taskList.addEventListener('change', (e) => {
          const target = e.target;
          if (target.matches('input[type="checkbox"][data-task-id]')) {
            this.toggleTask(target.dataset.taskId, target.checked);
          }
        });
      }
      if (this.ideaForm) {
        this.ideaForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.addIdea();
        });
      }
      if (this.clearIdeasBtn) {
        this.clearIdeasBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.clearIdeas();
        });
      }
      if (this.ideaList) {
        this.ideaList.addEventListener('click', (e) => {
          const target = e.target;
          const ideaId = target.dataset.ideaId;
          if (!ideaId) return;
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
        const openTasks = tasks.filter((task) => !task.done).length;
        this.quickStatTasks.textContent = openTasks;
      }
      if (this.quickStatIdeas) {
        const ideas = this.getIdeas();
        const openIdeas = ideas.filter((idea) => idea.status !== 'done').length;
        this.quickStatIdeas.textContent = openIdeas;
      }
      if (this.quickStatNotes) {
        const notesMap = this.getNotesMap();
        this.quickStatNotes.textContent = Object.keys(notesMap).length;
      }
    },
    syncProjectContext() {
      try {
        if (window.projectManager) {
          if (typeof window.projectManager.getActiveProject === 'function') {
            const project = window.projectManager.getActiveProject();
            if (project) {
              this.projectId = project.id || project.projectId || this.projectId;
              this.updateProjectChip(project.name || project.title || 'Active Project');
              return;
            }
          }
          if (window.projectManager.currentProjectId) {
            this.projectId = window.projectManager.currentProjectId;
            this.updateProjectChip(window.projectManager.currentProjectName || 'Active Project');
            return;
          }
          if (window.projectManager.currentProject) {
            this.projectId = window.projectManager.currentProject.id || this.projectId;
            this.updateProjectChip(window.projectManager.currentProject.name || 'Active Project');
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
    saveNotes() {
      const map = this.getNotesMap();
      const content = this.notesContent.value.trim();
      if (content) {
        map[this.activeDate] = {
          content,
          updatedAt: new Date().toISOString(),
        };
      } else {
        delete map[this.activeDate];
      }
      this.setNotesMap(map);
      this.setStatus(this.notesStatus, 'Saved');
      this.renderNotes();
    },
    renderNotes() {
      const map = this.getNotesMap();
      const entry = map[this.activeDate];
      this.notesContent.value = entry ? entry.content : '';
      const totalDays = Object.keys(map).length;
      if (totalDays === 0) {
        this.notesStatus.textContent = 'No saved notes yet';
      } else {
        const lastUpdated = entry?.updatedAt ? new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
        this.notesStatus.textContent = entry ? `Saved · ${lastUpdated}` : `${totalDays} day${totalDays === 1 ? '' : 's'} logged`;
      }
      this.updateQuickStats();
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
        createdAt: new Date().toISOString(),
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
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        task.done = !!done;
        this.setTasksMap(map);
        this.renderTasks();
      }
    },
    deleteTask(taskId) {
      const map = this.getTasksMap();
      const tasks = map[this.activeDate] || [];
      map[this.activeDate] = tasks.filter((t) => t.id !== taskId);
      this.setTasksMap(map);
      this.renderTasks();
      this.setStatus(this.taskStatus, 'Task removed');
    },
    clearCompletedTasks() {
      const map = this.getTasksMap();
      const tasks = map[this.activeDate] || [];
      const remaining = tasks.filter((t) => !t.done);
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
        this.taskList.innerHTML = '<li class="text-sm text-center py-4" style="color: var(--brand-text-muted);">No tasks yet. Add the first one above.</li>';
        this.taskStatus.textContent = 'Nothing queued';
        this.updateQuickStats();
        return;
      }
      const openCount = tasks.filter((t) => !t.done).length;
      this.taskStatus.textContent = `${openCount} open · ${tasks.length} total`;
      tasks
        .sort((a, b) => {
          if (a.done === b.done) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          return a.done ? 1 : -1;
        })
        .forEach((task) => {
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
        createdAt: new Date().toISOString(),
      });
      this.setIdeas(ideas);
      this.ideaTitle.value = '';
      this.ideaNotes.value = '';
      this.renderIdeas();
      this.setStatus(this.ideaStatus, 'Idea captured');
    },
    toggleIdeaStatus(ideaId) {
      const ideas = this.getIdeas();
      const idea = ideas.find((item) => item.id === ideaId);
      if (idea) {
        idea.status = idea.status === 'done' ? 'open' : 'done';
        this.setIdeas(ideas);
        this.renderIdeas();
      }
    },
    deleteIdea(ideaId) {
      const ideas = this.getIdeas().filter((item) => item.id !== ideaId);
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
        this.ideaList.innerHTML = '<div class="text-sm text-center py-4" style="color: var(--brand-text-muted);">No recipe ideas captured yet.</div>';
        this.ideaStatus.textContent = 'No ideas yet';
        this.updateQuickStats();
        return;
      }
      this.ideaStatus.textContent = `${ideas.length} idea${ideas.length === 1 ? '' : 's'}`;
      ideas.forEach((idea) => {
        const card = document.createElement('div');
        card.className = 'idea-item flex flex-col gap-2 p-3 rounded-md border mb-2';
        card.style.borderColor = 'var(--brand-border-light)';
        card.style.backgroundColor = 'var(--brand-bg-primary)';
        const createdAt = new Date(idea.createdAt);
        const prettyDate = createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
          this.updateProjectChip(project?.name || project?.title || 'Active Project');
          this.renderAll();
        }
      } catch (error) {
        console.warn('⚠️ Failed to handle project change:', error);
      }
    },
    setStatus(element, message) {
      if (!element) return;
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
    },
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

