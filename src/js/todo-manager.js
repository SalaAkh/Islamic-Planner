class TodoManager {
    constructor() {
        this.lists = [];
        this.currentListId = null;
        
        // DOM Elements
        this.sidebar = document.getElementById('project-lists-sidebar');
        this.tasksContainer = document.getElementById('tasks-container');
        this.newTaskInput = document.getElementById('new-task-input');
        this.newTaskWrapper = document.getElementById('new-task-wrapper');
        this.addListBtn = document.getElementById('add-new-list-btn');
        this.deleteListBtn = document.getElementById('delete-list-btn');
        this.currentListTitle = document.getElementById('current-list-title');
        this.emptyTasksMsg = document.getElementById('empty-tasks-msg');
        this.emptyListsMsg = document.getElementById('lists-sidebar-empty');
        this.loadingOverlay = document.getElementById('tasks-loading');

        this.mainSortable = null;

        if(this.sidebar) {
            this.initListeners();
        }
    }

    initListeners() {
        const tabLists = document.getElementById('tab-lists');
        if (tabLists) {
            tabLists.addEventListener('click', () => this.loadLists());
        }

        this.addListBtn?.addEventListener('click', () => this.createNewList());
        
        this.newTaskInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.newTaskInput.value.trim() !== '') {
                this.addTask(this.newTaskInput.value.trim());
            }
        });

        this.deleteListBtn?.addEventListener('click', () => this.deleteCurrentList());
    }

    async loadLists() {
        if (!window.Store || typeof window.Store.getTodoLists !== 'function') return;
        
        this.showLoading(true);
        try {
            this.lists = window.Store.getTodoLists();
            this.lists.sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));

            // Attach parent list ID to all tasks for smart views
            this.lists.forEach(l => {
                if(l.tasks) l.tasks.forEach(t => t.parentListId = l.id);
            });

            this.renderSidebar();
            
            if(!this.currentListId) {
                this.selectList('smart_my_day'); // default to My Day
            } else {
                this.selectList(this.currentListId);
            }
        } catch (e) {
            console.error('Error loading lists:', e);
        } finally {
            this.showLoading(false);
        }
    }

    getTodayDateString() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    renderSidebar() {
        if (!this.sidebar) return;
        this.sidebar.innerHTML = '';
        
        // --- SMART LISTS ---
        const today = this.getTodayDateString();
        let myDayCount = 0;
        let importantCount = 0;

        this.lists.forEach(l => {
            if(l.tasks) {
                l.tasks.forEach(t => {
                    if (t.myDay === today && !t.completed) myDayCount++;
                    if (t.isImportant && !t.completed) importantCount++;
                });
            }
        });

        const smartLists = [
            { id: 'smart_my_day', title: 'Мой день', icon: 'fa-sun text-yellow-500', count: myDayCount },
            { id: 'smart_important', title: 'Важное', icon: 'fa-star text-red-500', count: importantCount }
        ];

        smartLists.forEach(sl => {
            const li = document.createElement('li');
            const isActive = sl.id === this.currentListId;
            li.className = `cursor-pointer px-3 py-2 rounded-lg font-semibold flex items-center justify-between transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'}`;
            li.innerHTML = `
                <span class="truncate pr-2 flex items-center gap-2"><i class="fas ${sl.icon} w-5 text-center"></i> ${sl.title}</span>
                ${sl.count > 0 ? `<span class="bg-gray-200 dark:bg-slate-600 text-xs font-mono px-2 py-0.5 rounded-full">${sl.count}</span>` : ''}
            `;
            li.addEventListener('click', () => this.selectList(sl.id));
            this.sidebar.appendChild(li);
        });

        const divider = document.createElement('hr');
        divider.className = 'my-2 border-slate-200 dark:border-slate-700';
        this.sidebar.appendChild(divider);

        // --- REGULAR LISTS ---
        if (this.lists.length === 0) {
            if (this.emptyListsMsg) this.sidebar.appendChild(this.emptyListsMsg);
            return;
        }

        this.lists.forEach(list => {
            const li = document.createElement('li');
            const isActive = list.id === this.currentListId;
            li.className = `cursor-pointer px-3 py-2 rounded-lg font-semibold flex items-center justify-between transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'}`;
            
            const totalTasks = list.tasks ? list.tasks.length : 0;
            const completedTasks = list.tasks ? list.tasks.filter(t => t.completed).length : 0;
            
            li.innerHTML = `
                <span class="truncate pr-2 flex items-center gap-2"><i class="fas fa-list-ul w-5 text-center text-gray-400"></i> ${list.title}</span>
                <span class="${isActive ? 'bg-blue-200 dark:bg-blue-800' : 'bg-gray-200 dark:bg-slate-600'} text-xs font-mono px-2 py-0.5 rounded-full whitespace-nowrap">${completedTasks}/${totalTasks}</span>
            `;
            
            li.addEventListener('click', () => this.selectList(list.id));
            this.sidebar.appendChild(li);
        });
    }

    selectList(listId) {
        this.currentListId = listId;

        if (listId === 'smart_my_day' || listId === 'smart_important') {
            const title = listId === 'smart_my_day' ? 'Мой день' : 'Важное';
            if(this.currentListTitle) this.currentListTitle.textContent = title;
            if(this.deleteListBtn) this.deleteListBtn.classList.add('hidden');
            if(this.newTaskWrapper) this.newTaskWrapper.classList.remove('opacity-50', 'pointer-events-none');
            
            let smartTasks = [];
            const today = this.getTodayDateString();
            this.lists.forEach(l => {
                if(l.tasks) {
                    l.tasks.forEach(t => {
                        if(listId === 'smart_my_day' && t.myDay === today) smartTasks.push(t);
                        if(listId === 'smart_important' && t.isImportant) smartTasks.push(t);
                    });
                }
            });
            this.renderSidebar();
            this.renderTasks(smartTasks, true); // true = disable drag & drop
        } else {
            const list = this.lists.find(l => l.id === listId);
            if (!list) return;
            
            if(this.currentListTitle) this.currentListTitle.textContent = list.title;
            if(this.newTaskWrapper) this.newTaskWrapper.classList.remove('opacity-50', 'pointer-events-none');
            if(this.deleteListBtn) this.deleteListBtn.classList.remove('hidden');
            
            this.renderSidebar();
            this.renderTasks(list.tasks || [], false);
        }
    }

    renderTasks(tasks, isSmartView = false) {
        if(!this.tasksContainer) return;
        this.tasksContainer.innerHTML = '';
        
        if (tasks.length === 0) {
            if(this.emptyTasksMsg) {
                this.emptyTasksMsg.textContent = isSmartView ? "Отдыхайте, тут пока пусто." : "В этом списке пока нет задач.";
                this.tasksContainer.appendChild(this.emptyTasksMsg);
            }
            if(this.mainSortable) this.mainSortable.destroy();
            return;
        }

        tasks.forEach(task => {
            const taskEl = this.createTaskElement(task, isSmartView);
            this.tasksContainer.appendChild(taskEl);
        });

        // Initialize Native Drag & Drop using SortableJS (only for real lists)
        if(isSmartView) {
            if(this.mainSortable) this.mainSortable.destroy();
        } else {
            this.initSortable();
        }
    }

    createTaskElement(task, isSmartView) {
        const el = document.createElement('div');
        el.className = 'task-item bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow transition-all mb-2';
        el.dataset.id = task.id;

        const subtasks = task.subtasks || [];
        const completedSubtasks = subtasks.filter(s => s.completed).length;
        const hasSubtasks = subtasks.length > 0;
        const parentListId = task.parentListId || this.currentListId;

        const isMyDay = task.myDay === this.getTodayDateString();

        el.innerHTML = `
            <div class="flex flex-col gap-2 p-3">
                <div class="flex items-center justify-between group">
                    <div class="flex items-center gap-3 flex-grow min-w-0">
                        <!-- Drag Handle -->
                        ${!isSmartView ? `<div class="drag-handle cursor-grab text-gray-300 hover:text-gray-500 py-1 px-1"><i class="fas fa-grip-vertical"></i></div>` : `<div class="w-2"></div>`}
                        
                        <!-- Checkbox -->
                        <button onclick="window.todoManager.toggleTask('${task.id}', '${parentListId}')" class="flex-shrink-0 w-5 h-5 rounded border ${task.completed ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 dark:border-gray-600 dark:bg-slate-900'} flex items-center justify-center transition-colors">
                            ${task.completed ? '<i class="fas fa-check text-[10px]"></i>' : ''}
                        </button>
                        
                        <!-- Title & Meta -->
                        <div class="flex flex-col flex-grow min-w-0">
                            <span class="${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-slate-700 dark:text-gray-200'} font-medium truncate cursor-pointer" onclick="window.todoManager.toggleTaskExpand('${task.id}')">
                                ${task.title}
                            </span>
                            <div class="flex items-center gap-2 mt-0.5 whitespace-nowrap overflow-x-auto no-scrollbar">
                                ${isSmartView ? `<span class="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 rounded">${this.lists.find(l=>l.id===parentListId)?.title || 'Список'}</span>` : ''}
                                ${hasSubtasks ? `<span class="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 rounded cursor-pointer" onclick="window.todoManager.toggleTaskExpand('${task.id}')"><i class="fas fa-code-branch mr-0.5"></i>${completedSubtasks}/${subtasks.length}</span>` : ''}
                                ${task.dueDate ? `<span class="text-[10px] bg-red-50 text-red-500 px-1.5 rounded"><i class="far fa-calendar-alt mr-0.5"></i>${task.dueDate}</span>` : ''}
                                ${task.note ? `<span class="text-[10px] bg-yellow-50 text-yellow-600 px-1.5 rounded cursor-pointer" onclick="window.todoManager.toggleTaskExpand('${task.id}')"><i class="far fa-sticky-note mr-0.5"></i>Заметка</span>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <!-- Smart Actions -->
                        <button onclick="window.todoManager.toggleMyDay('${task.id}', '${parentListId}')" class="p-1 transition-colors ${isMyDay ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}" title="В Мой день">
                            <i class="${isMyDay ? 'fas text-yellow-500' : 'far'} fa-sun"></i>
                        </button>
                        <button onclick="window.todoManager.toggleImportant('${task.id}', '${parentListId}')" class="p-1 transition-colors ${task.isImportant ? 'text-red-500' : 'text-gray-300 hover:text-red-500'}" title="Важное">
                            <i class="${task.isImportant ? 'fas text-red-500' : 'far'} fa-star"></i>
                        </button>
                        <button onclick="window.todoManager.removeTask('${task.id}', '${parentListId}')" class="text-gray-300 hover:text-red-500 transition-colors p-1" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- Subtasks & Notes Area (Hidden) -->
                <div id="subtasks-${task.id}" class="hidden ml-8 mt-2 space-y-2 border-l-2 border-gray-100 dark:border-slate-700 pl-3 pb-1">
                    
                    <!-- Advanced Metadata -->
                    <div class="flex gap-2 mb-2 text-xs">
                        <button onclick="window.todoManager.setDueDate('${task.id}', '${parentListId}')" class="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300 transition"><i class="far fa-calendar-alt mr-1"></i> Срок</button>
                        <button onclick="window.todoManager.editNote('${task.id}', '${parentListId}')" class="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300 transition"><i class="far fa-sticky-note mr-1"></i> Заметка</button>
                    </div>

                    ${task.note ? `<div class="text-xs text-gray-500 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded mb-2 whitespace-pre-wrap">${task.note}</div>` : ''}

                    ${subtasks.map(sub => `
                        <div class="flex items-center justify-between group/sub">
                            <div class="flex items-center gap-2 cursor-pointer flex-grow min-w-0" onclick="window.todoManager.toggleSubtask('${task.id}', '${sub.id}', '${parentListId}')">
                                <button class="flex-shrink-0 w-4 h-4 rounded-sm border ${sub.completed ? 'border-blue-400 bg-blue-400 text-white' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center transition-colors">
                                    ${sub.completed ? '<i class="fas fa-check text-[8px]"></i>' : ''}
                                </button>
                                <span class="text-sm ${sub.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'} truncate">${sub.title}</span>
                            </div>
                            <button onclick="window.todoManager.removeSubtask('${task.id}', '${sub.id}', '${parentListId}')" class="text-gray-300 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity text-xs p-1">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                    
                    <div class="flex items-center gap-2 mt-2 group/addsub cursor-text" onclick="window.todoManager.addSubtaskPrompt('${task.id}', '${parentListId}')">
                        <i class="fas fa-plus text-xs text-blue-400 opacity-50 group-hover/addsub:opacity-100"></i>
                        <span class="text-xs text-gray-400 group-hover/addsub:text-blue-500 transition-colors">Добавить шаг</span>
                    </div>
                </div>
            </div>
        `;
        return el;
    }

    initSortable() {
        if (!window.Sortable || !this.tasksContainer) return;
        if (this.mainSortable) this.mainSortable.destroy();

        this.mainSortable = new Sortable(this.tasksContainer, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'opacity-50',
            onEnd: async (evt) => {
                const list = this.lists.find(l => l.id === this.currentListId);
                if(!list || !list.tasks) return;
                
                // Reorder array
                const itemEl = list.tasks.splice(evt.oldIndex, 1)[0];
                list.tasks.splice(evt.newIndex, 0, itemEl);
                
                await this.syncList(list);
            }
        });
    }

    toggleTaskExpand(taskId) {
        const subArea = document.getElementById(`subtasks-${taskId}`);
        if(subArea) {
            subArea.classList.toggle('hidden');
        }
    }

    async toggleImportant(taskId, parentListId) {
        const list = this.lists.find(l => l.id === parentListId);
        if(!list || !list.tasks) return;
        const task = list.tasks.find(t => t.id === taskId);
        if(task) {
            task.isImportant = !task.isImportant;
            this.selectList(this.currentListId); // re-render view
            await this.syncList(list);
        }
    }

    async toggleMyDay(taskId, parentListId) {
        const list = this.lists.find(l => l.id === parentListId);
        if(!list || !list.tasks) return;
        const task = list.tasks.find(t => t.id === taskId);
        if(task) {
            const today = this.getTodayDateString();
            task.myDay = (task.myDay === today) ? null : today;
            this.selectList(this.currentListId); // re-render view
            await this.syncList(list);
        }
    }

    async setDueDate(taskId, parentListId) {
        const list = this.lists.find(l => l.id === parentListId);
        if(!list || !list.tasks) return;
        const task = list.tasks.find(t => t.id === taskId);
        if(task) {
            const current = task.dueDate || this.getTodayDateString();
            const dateStr = prompt('Формат ГГГГ-ММ-ДД:', current);
            if(dateStr !== null) {
                task.dueDate = dateStr.trim();
                this.selectList(this.currentListId);
                await this.syncList(list);
            }
        }
    }

    async editNote(taskId, parentListId) {
        const list = this.lists.find(l => l.id === parentListId);
        if(!list || !list.tasks) return;
        const task = list.tasks.find(t => t.id === taskId);
        if(task) {
            const noteStr = prompt('Заметка для задачи:', task.note || '');
            if(noteStr !== null) {
                task.note = noteStr.trim();
                this.selectList(this.currentListId);
                await this.syncList(list);
            }
        }
    }

    async addSubtaskPrompt(taskId, parentListId) {
        const title = prompt('Название подзадачи:');
        if (!title || !title.trim()) return;

        const list = this.lists.find(l => l.id === parentListId);
        if (!list) return;

        const task = list.tasks.find(t => t.id === taskId);
        if(!task) return;

        if(!task.subtasks) task.subtasks = [];
        task.subtasks.push({
            id: 'sub_' + Date.now(),
            title: title.trim(),
            completed: false
        });

        this.selectList(this.currentListId);
        const subArea = document.getElementById(`subtasks-${taskId}`);
        if(subArea) subArea.classList.remove('hidden');

        await this.syncList(list);
    }

    async toggleSubtask(taskId, subtaskId, parentListId) {
        const list = this.lists.find(l => l.id === parentListId);
        if (!list) return;

        const task = list.tasks.find(t => t.id === taskId);
        if(!task || !task.subtasks) return;

        const sub = task.subtasks.find(s => s.id === subtaskId);
        if(sub) {
            sub.completed = !sub.completed;
            if (task.subtasks.length > 0 && task.subtasks.every(s => s.completed)) {
                task.completed = true;
            } else if (task.completed) {
                task.completed = false; 
            }
            this.selectList(this.currentListId);
            const subArea = document.getElementById(`subtasks-${taskId}`);
            if(subArea) subArea.classList.remove('hidden');
            await this.syncList(list);
        }
    }

    async removeSubtask(taskId, subtaskId, parentListId) {
        if(!confirm('Удалить подзадачу?')) return;
        const list = this.lists.find(l => l.id === parentListId);
        if (!list) return;

        const task = list.tasks.find(t => t.id === taskId);
        if(!task || !task.subtasks) return;

        task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
        
        this.selectList(this.currentListId);
        const subArea = document.getElementById(`subtasks-${taskId}`);
        if(subArea) subArea.classList.remove('hidden');
        await this.syncList(list);
    }

    async createNewList() {
        const title = prompt('Название нового списка:');
        if (!title || !title.trim()) return;

        const newList = {
            id: 'list_' + Date.now(),
            title: title.trim(),
            tasks: [],
            createdAt: Date.now()
        };

        this.lists.push(newList);
        this.selectList(newList.id);
        await this.syncList(newList);
    }

    async addTask(title) {
        let listStrId = this.currentListId;
        
        // If adding from a smart list, add to Default "Задачи" or the first available list
        if (listStrId === 'smart_my_day' || listStrId === 'smart_important') {
            if (this.lists.length === 0) {
                // Auto create a list
                const newList = {
                    id: 'list_default',
                    title: 'Задачи',
                    tasks: [],
                    createdAt: Date.now()
                };
                this.lists.push(newList);
                await this.syncList(newList);
            }
            // add to the first list
            listStrId = this.lists[0].id;
        }
        
        const list = this.lists.find(l => l.id === listStrId);
        if (!list) return;

        const newTask = {
            id: 't_' + Date.now(),
            title: title,
            completed: false,
            createdAt: Date.now(),
            subtasks: [],
            parentListId: listStrId
        };

        if (this.currentListId === 'smart_my_day') newTask.myDay = this.getTodayDateString();
        if (this.currentListId === 'smart_important') newTask.isImportant = true;

        if (!list.tasks) list.tasks = [];
        list.tasks.unshift(newTask);
        
        if(this.newTaskInput) this.newTaskInput.value = '';
        this.selectList(this.currentListId);
        await this.syncList(list);
    }

    async toggleTask(taskId, parentListId) {
        const list = this.lists.find(l => l.id === parentListId);
        if (!list) return;

        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            if(task.completed && task.subtasks) {
                task.subtasks.forEach(s => s.completed = true);
            }
            this.selectList(this.currentListId);
            await this.syncList(list);
        }
    }

    async removeTask(taskId, parentListId) {
        if(!confirm('Удалить эту задачу?')) return;
        const list = this.lists.find(l => l.id === parentListId);
        if (!list) return;

        list.tasks = list.tasks.filter(t => t.id !== taskId);
        this.selectList(this.currentListId);
        await this.syncList(list);
    }

    async deleteCurrentList() {
        if(!this.currentListId || this.currentListId.startsWith('smart_')) return;
        if(!confirm('Точно удалить список и все его задачи?')) return;

        const listId = this.currentListId;
        this.lists = this.lists.filter(l => l.id !== listId);
        this.currentListId = null;
        
        this.selectList('smart_my_day'); // Fallback to Smart View
        await this.syncList();
    }

    async syncList(_list) {
        if (!window.Store || typeof window.Store.saveTodoLists !== 'function') return;
        try {
            window.Store.saveTodoLists(this.lists);
        } catch (e) {
            console.error('Error syncing list:', e);
        }
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            if (show) this.loadingOverlay.classList.replace('hidden', 'flex');
            else this.loadingOverlay.classList.replace('flex', 'hidden');
        }
    }
}

const todoManager = new TodoManager();
window.todoManager = todoManager;
