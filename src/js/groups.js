import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    onSnapshot, 
    query, 
    where, 
    arrayUnion, 
    arrayRemove, 
    setDoc, 
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const escapeHtml = (str) => (window.escapeHtml || ((s) => { if (typeof s !== 'string') return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }))(str);

window.currentGroupId = null;

window.Groups = {
    myGroups: [],
    activeListeners: {},
    groupMetadata: {},

    init() {
        // Listen to Auth state changes
        document.addEventListener('authInitComplete', () => this.setupUserGroupsListener());
        document.addEventListener('cloudDataSynced', () => this.setupUserGroupsListener());
        
        // Setup initial listener if auth is already resolved
        if (window.Auth && window.Auth.user) {
            this.setupUserGroupsListener();
        }
    },

    setupUserGroupsListener() {
        if (!window.firebaseDb || !window.Auth || !window.Auth.user) {
            this.myGroups = [];
            this.renderGroupsUI();
            this.renderWorkspaceSwitcher();
            return;
        }

        // Clean up old list listener if any
        if (this.activeListeners['groups_list']) {
            this.activeListeners['groups_list']();
            delete this.activeListeners['groups_list'];
        }

        const email = window.Auth.user.email;
        if (!email) return;

        try {
            console.log(`[Groups] Subscribing to groups for member: ${email}`);
            const q = query(collection(window.firebaseDb, "groups"), where("members", "array-contains", email));
            
            this.activeListeners['groups_list'] = onSnapshot(q, (snapshot) => {
                this.myGroups = [];
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    this.myGroups.push({
                        id: docSnap.id,
                        ...data
                    });
                    this.groupMetadata[docSnap.id] = data;
                });
                console.log(`[Groups] Synced ${this.myGroups.length} groups.`);
                
                // If the user was in a group that they are no longer a member of, force switch to personal
                if (window.currentGroupId && !this.myGroups.some(g => g.id === window.currentGroupId)) {
                    this.selectPersonal();
                }

                this.renderGroupsUI();
                this.renderWorkspaceSwitcher();
                this.renderActiveGroupDetails();
                
                // Trigger updates if we are actively viewing group data
                if (window.currentGroupId) {
                    const groupData = this.groupMetadata[window.currentGroupId];
                    if (groupData) {
                        document.dispatchEvent(new CustomEvent('groupMetadataUpdated', { detail: groupData }));
                    }
                }
            }, (error) => {
                console.error("[Groups] Error listening to groups list:", error);
            });
        } catch (e) {
            console.error("[Groups] Error setting up groups listener:", e);
        }
    },

    async createGroup(name) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.user) {
            alert(window.t ? window.t('auth_no_access_title') : 'Войдите в аккаунт');
            return;
        }
        if (!window.Auth.isPremium) {
            alert(window.t ? window.t('msg_premium_required') : 'Требуется Premium статус');
            return;
        }
        if (!name.trim()) {
            alert(window.t ? window.t('msg_empty_group_name') : 'Пожалуйста, введите название группы.');
            return;
        }

        try {
            const docRef = await addDoc(collection(window.firebaseDb, 'groups'), {
                name: name.trim(),
                createdBy: window.Auth.user.uid,
                members: [window.Auth.user.email],
                createdAt: new Date().toISOString()
            });
            console.log(`[Groups] Group created with ID: ${docRef.id}`);
            window.ActivityLog?.log('group_created', { name, groupId: docRef.id });
            window.showToast(window.t ? window.t('group_created_toast') : 'Группа создана!');
            
            // Auto switch to the new group workspace
            this.selectGroup(docRef.id);
        } catch (e) {
            console.error("[Groups] Error creating group:", e);
            alert('Ошибка создания группы: ' + e.message);
        }
    },

    async inviteMember(groupId, email) {
        if (!window.firebaseDb || !groupId || !email.trim()) return;

        try {
            const groupRef = doc(window.firebaseDb, 'groups', groupId);
            await updateDoc(groupRef, {
                members: arrayUnion(email.trim().toLowerCase())
            });
            console.log(`[Groups] Invited member: ${email} to ${groupId}`);
            window.showToast(window.t ? window.t('member_invited_toast') : 'Участник приглашен!');
            window.ActivityLog?.log('group_member_invited', { groupId, email });
        } catch (e) {
            console.error("[Groups] Error inviting member:", e);
            alert('Ошибка приглашения: ' + e.message);
        }
    },

    async leaveGroup(groupId) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.user || !groupId) return;
        
        if (!confirm(window.t ? window.t('confirm_leave_group') : 'Вы действительно хотите выйти из группы?')) {
            return;
        }

        try {
            const email = window.Auth.user.email;
            const groupRef = doc(window.firebaseDb, 'groups', groupId);
            await updateDoc(groupRef, {
                members: arrayRemove(email)
            });
            console.log(`[Groups] Left group: ${groupId}`);
            window.ActivityLog?.log('group_left', { groupId });
            
            if (window.currentGroupId === groupId) {
                this.selectPersonal();
            }
        } catch (e) {
            console.error("[Groups] Error leaving group:", e);
            alert('Ошибка выхода из группы: ' + e.message);
        }
    },

    async deleteGroup(groupId) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.user || !groupId) return;
        
        const group = this.groupMetadata[groupId];
        if (!group) return;
        
        const isCreator = group.createdBy && window.Auth.user.uid === group.createdBy;
        if (!isCreator) {
            alert(window.t ? window.t('err_not_group_creator') : 'Только создатель группы может её удалить.');
            return;
        }

        if (!confirm(window.t ? window.t('confirm_delete_group') : 'Вы действительно хотите удалить эту группу? Это действие сотрет все данные группы и отменит членство всех участников.')) {
            return;
        }

        try {
            const groupRef = doc(window.firebaseDb, 'groups', groupId);
            await deleteDoc(groupRef);
            console.log(`[Groups] Deleted group: ${groupId}`);
            window.ActivityLog?.log('group_deleted', { groupId, name: group.name });
            
            if (window.currentGroupId === groupId) {
                this.selectPersonal();
            }
            window.showToast(window.t ? window.t('group_deleted_toast') : 'Группа удалена');
        } catch (e) {
            console.error("[Groups] Error deleting group:", e);
            alert('Ошибка удаления группы: ' + e.message);
        }
    },

    selectGroup(groupId) {
        if (window.currentGroupId === groupId) return;

        // Clear existing workspace listeners
        this.clearGroupSyncListeners();

        window.currentGroupId = groupId;
        const group = this.groupMetadata[groupId];
        
        if (!group) {
            this.selectPersonal();
            return;
        }

        console.log(`[Groups] Activating group workspace: ${group.name} (${groupId})`);

        // Setup real-time collaborative listeners
        this.setupGroupSyncListeners(groupId);

        // Inject active workspace class to body for custom layout styling
        document.body.classList.add('group-mode-active');
        
        // Render details of active group
        this.renderActiveGroupDetails();

        // Dispatch event so other modules know workspace changed
        document.dispatchEvent(new CustomEvent('workspaceChanged', { detail: { mode: 'group', groupId, name: group.name } }));
        
        window.showToast((window.t ? window.t('group_mode_active') : 'Активировано групповое пространство: ') + group.name);
    },

    selectPersonal() {
        if (window.currentGroupId === null) return;

        this.clearGroupSyncListeners();
        window.currentGroupId = null;

        console.log(`[Groups] Activating personal workspace`);
        document.body.classList.remove('group-mode-active');
        
        // Render details of active group (clears details card)
        this.renderActiveGroupDetails();

        document.dispatchEvent(new CustomEvent('workspaceChanged', { detail: { mode: 'personal' } }));
        
        window.showToast(window.t ? window.t('workspace_personal') : 'Личное пространство');
    },

    setupGroupSyncListeners(groupId) {
        if (!window.firebaseDb) return;

        console.log(`[Groups] Setting up collaborative listeners for group: ${groupId}`);

        // 1. Board Notes Sync
        const boardRef = doc(window.firebaseDb, `groups/${groupId}/data`, 'board_state');
        this.activeListeners['board_state'] = onSnapshot(boardRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // To avoid drawing conflict, compare content
                const localStr = localStorage.getItem(`barakah_group_${groupId}_board_state`);
                const remoteStr = JSON.stringify(data);
                if (localStr !== remoteStr) {
                    localStorage.setItem(`barakah_group_${groupId}_board_state`, remoteStr);
                    document.dispatchEvent(new CustomEvent('groupBoardUpdated', { detail: data }));
                }
            }
        });

        // 2. Board Drawing Sync
        const drawingRef = doc(window.firebaseDb, `groups/${groupId}/data`, 'board_drawing');
        this.activeListeners['board_drawing'] = onSnapshot(drawingRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data && data.dataUrl) {
                    const localStore = window.Store;
                    if (localStore) {
                        const localDrawing = await localStore.getDrawing();
                        if (localDrawing !== data.dataUrl) {
                            // Flag to prevent loop
                            window._isSyncingDrawing = true;
                            await localStore.saveDrawing(data.dataUrl);
                            window._isSyncingDrawing = false;
                            document.dispatchEvent(new CustomEvent('groupDrawingUpdated', { detail: data.dataUrl }));
                        }
                    }
                }
            }
        });

        // 3. Events Sync
        const eventsRef = doc(window.firebaseDb, `groups/${groupId}/data`, 'events');
        this.activeListeners['events'] = onSnapshot(eventsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const localStr = localStorage.getItem(`barakah_group_${groupId}_events`);
                const remoteStr = JSON.stringify(data.events || {});
                if (localStr !== remoteStr) {
                    localStorage.setItem(`barakah_group_${groupId}_events`, remoteStr);
                    document.dispatchEvent(new CustomEvent('groupEventsUpdated', { detail: data.events }));
                }
            }
        });

        // 4. Todo Lists Sync
        const listsRef = doc(window.firebaseDb, `groups/${groupId}/data`, 'todo_lists');
        this.activeListeners['todo_lists'] = onSnapshot(listsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const localStr = localStorage.getItem(`barakah_group_${groupId}_todo_lists`);
                const remoteStr = JSON.stringify(data.todoLists || []);
                if (localStr !== remoteStr) {
                    localStorage.setItem(`barakah_group_${groupId}_todo_lists`, remoteStr);
                    document.dispatchEvent(new CustomEvent('groupTodoListsUpdated', { detail: data.todoLists }));
                }
            }
        });
    },

    clearGroupSyncListeners() {
        ['board_state', 'board_drawing', 'events', 'todo_lists', 'day'].forEach(key => {
            if (this.activeListeners[key]) {
                this.activeListeners[key](); // unsubscribe
                delete this.activeListeners[key];
            }
        });
        this.activeDayString = null;
    },

    // ─── Cloud sync triggers called from Store ───
    async saveGroupBoardState(groupId, lightData) {
        if (!window.firebaseDb) return;
        try {
            await setDoc(doc(window.firebaseDb, `groups/${groupId}/data`, 'board_state'), lightData);
        } catch (e) {
            console.error('[Groups] Save board state error:', e);
        }
    },

    async saveGroupBoardDrawing(groupId, dataUrl) {
        if (!window.firebaseDb) return;
        try {
            await setDoc(doc(window.firebaseDb, `groups/${groupId}/data`, 'board_drawing'), { dataUrl });
        } catch (e) {
            console.error('[Groups] Save board drawing error:', e);
        }
    },

    async saveGroupEvents(groupId, events) {
        if (!window.firebaseDb) return;
        try {
            await setDoc(doc(window.firebaseDb, `groups/${groupId}/data`, 'events'), { events });
        } catch (e) {
            console.error('[Groups] Save events error:', e);
        }
    },

    async saveGroupTodoLists(groupId, todoLists) {
        if (!window.firebaseDb) return;
        try {
            await setDoc(doc(window.firebaseDb, `groups/${groupId}/data`, 'todo_lists'), { todoLists });
        } catch (e) {
            console.error('[Groups] Save todo lists error:', e);
        }
    },

    async saveGroupDayData(groupId, dateString, data) {
        if (!window.firebaseDb) return;
        try {
            let docContent = data;
            if (window.DbSync && typeof window.DbSync._cleanUndefined === 'function') {
                docContent = window.DbSync._cleanUndefined(docContent);
            }
            await setDoc(doc(window.firebaseDb, `groups/${groupId}/data`, `day_${dateString}`), docContent);
        } catch (e) {
            console.error('[Groups] Save day data error:', e);
        }
    },

    syncActiveDay(dateString) {
        if (!window.firebaseDb) return;
        
        const groupId = window.currentGroupId;
        
        if (!groupId) {
            if (this.activeListeners['day']) {
                this.activeListeners['day']();
                delete this.activeListeners['day'];
                this.activeDayString = null;
            }
            return;
        }

        if (this.activeDayString === `${groupId}_${dateString}`) {
            return; // Already listening to this day for this group
        }

        if (this.activeListeners['day']) {
            this.activeListeners['day']();
            delete this.activeListeners['day'];
        }

        this.activeDayString = `${groupId}_${dateString}`;
        console.log(`[Groups] Syncing active day for group ${groupId}: ${dateString}`);

        const dayRef = doc(window.firebaseDb, `groups/${groupId}/data`, `day_${dateString}`);
        this.activeListeners['day'] = onSnapshot(dayRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const localStr = localStorage.getItem(`barakah_group_${groupId}_day_${dateString}`);
                const remoteStr = JSON.stringify(data);
                if (localStr !== remoteStr) {
                    localStorage.setItem(`barakah_group_${groupId}_day_${dateString}`, remoteStr);
                    document.dispatchEvent(new CustomEvent('groupDayUpdated', { detail: { dateString, data } }));
                }
            }
        });
    },

    // ─── UI Rendering ───
    renderGroupsUI() {
        const listContainer = document.getElementById('groups-list-container');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        
        if (!window.Auth.user) {
            listContainer.innerHTML = `
                <div class="p-6 text-center text-slate-400">
                    <i class="fas fa-lock text-3xl mb-3 opacity-40"></i>
                    <p data-i18n="log_no_access_title">Войдите в аккаунт, чтобы работать в группах</p>
                </div>
            `;
            if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
                window.i18n.applyTranslations(localStorage.getItem('barakah_lang') || 'ru');
            }
            return;
        }

        if (this.myGroups.length === 0) {
            listContainer.innerHTML = `
                <div class="p-6 text-center text-slate-400">
                    <i class="fas fa-users-slash text-3xl mb-3 opacity-40"></i>
                    <p data-i18n="no_groups_yet">Вы пока не состоите ни в одной группе</p>
                </div>
            `;
            if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
                window.i18n.applyTranslations(localStorage.getItem('barakah_lang') || 'ru');
            }
            return;
        }

        this.myGroups.forEach(group => {
            const isActive = window.currentGroupId === group.id;
            const item = document.createElement('div');
            item.className = `p-4 rounded-2xl border transition-all flex items-center justify-between shadow-sm hover:shadow ${
                isActive 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30' 
                : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50'
            }`;

            const isAdmin = group.createdBy === window.Auth.user.uid;
            const adminLabel = window.t ? window.t('group_admin_label') : 'Администратор';
            const leaveLabel = window.t ? window.t('btn_leave_group') : 'Выйти';

            item.innerHTML = `
                <div class="min-w-0 flex-1 cursor-pointer" onclick="window.Groups.selectGroup('${group.id}')">
                    <div class="flex items-center gap-2">
                        <h3 class="font-bold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(group.name)}</h3>
                        ${isActive ? '<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>' : ''}
                    </div>
                    <p class="text-xs text-slate-400 truncate mt-1">
                        ${group.members.length} участников ${isAdmin ? `(${adminLabel})` : ''}
                    </p>
                </div>
                <div class="flex items-center gap-2 ml-4">
                    <button class="text-slate-400 hover:text-red-500 text-sm p-2 transition cursor-pointer" title="${leaveLabel}" onclick="window.Groups.leaveGroup('${group.id}')">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
            listContainer.appendChild(item);
        });

        // Trigger dynamic translation for newly appended items
        if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
            window.i18n.applyTranslations(localStorage.getItem('barakah_lang') || 'ru');
        }
    },

    renderWorkspaceSwitcher() {
        const switcherContainers = document.querySelectorAll('.workspace-switcher-placeholder');
        if (switcherContainers.length === 0) return;

        switcherContainers.forEach(container => {
            container.innerHTML = '';
            
            if (!window.Auth.user) return;

            const div = document.createElement('div');
            div.className = 'relative inline-block text-left z-[99]';

            const personalName = window.t ? window.t('workspace_personal') : 'Личное пространство';
            const currentName = window.currentGroupId 
                ? (this.groupMetadata[window.currentGroupId]?.name || 'Группа')
                : personalName;

            div.innerHTML = `
                <button type="button" id="workspace-switcher-btn" class="bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    <i class="fas ${window.currentGroupId ? 'fa-users text-emerald-600 dark:text-emerald-400' : 'fa-user text-slate-500'} text-sm"></i>
                    <span>${escapeHtml(currentName)}</span>
                    <i class="fas fa-chevron-down text-[10px] opacity-60"></i>
                </button>
                <div id="workspace-switcher-dropdown" class="hidden absolute left-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden z-[99]">
                    <div class="py-1">
                        <button onclick="window.Groups.selectPersonal()" class="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer">
                            <i class="fas fa-user text-slate-500 w-4"></i>
                            <span>${personalName}</span>
                        </button>
                        ${this.myGroups.map(group => `
                            <button onclick="window.Groups.selectGroup('${group.id}')" class="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer ${window.currentGroupId === group.id ? 'bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : ''}">
                                <i class="fas fa-users text-emerald-600 dark:text-emerald-400 w-4"></i>
                                <span class="truncate flex-1">${escapeHtml(group.name)}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;

            container.appendChild(div);

            const btn = div.querySelector('#workspace-switcher-btn');
            const dropdown = div.querySelector('#workspace-switcher-dropdown');

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', () => {
                dropdown.classList.add('hidden');
            });
        });
    },

    renderActiveGroupDetails() {
        const detailsCard = document.getElementById('active-group-details-card');
        const noActiveCard = document.getElementById('no-active-group-card');
        if (!detailsCard || !noActiveCard) return;

        if (!window.currentGroupId) {
            detailsCard.classList.add('hidden');
            noActiveCard.classList.remove('hidden');
            return;
        }

        const group = this.groupMetadata[window.currentGroupId];
        if (!group) return;

        detailsCard.classList.remove('hidden');
        noActiveCard.classList.add('hidden');

        const titleEl = document.getElementById('active-group-details-name');
        if (titleEl) titleEl.textContent = group.name;

        const membersList = document.getElementById('active-group-members-list');
        if (membersList) {
            membersList.innerHTML = '';
            group.members.forEach(member => {
                const isCreator = group.createdBy && member === group.createdBy;
                const div = document.createElement('div');
                div.className = 'flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/40';
                div.innerHTML = `
                    <div class="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs uppercase border border-emerald-500/15">
                        ${escapeHtml(member.charAt(0))}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">${escapeHtml(member)}</p>
                        ${isCreator ? `<span class="text-[9px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">${window.t ? window.t('group_admin_label') : 'Админ'}</span>` : ''}
                    </div>
                `;
                membersList.appendChild(div);
            });
        }

        // Add actions section
        let actionsDiv = detailsCard.querySelector('.group-actions-container');
        if (!actionsDiv) {
            actionsDiv = document.createElement('div');
            actionsDiv.className = 'group-actions-container flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/80';
            detailsCard.appendChild(actionsDiv);
        }
        
        const isUserCreator = window.Auth && window.Auth.user && group.createdBy === window.Auth.user.uid;
        
        const leaveLabel = window.t ? window.t('btn_leave_group') : 'Выйти из группы';
        const deleteLabel = window.t ? window.t('btn_delete_group') : 'Удалить группу';
        const switchPersonalLabel = window.t ? window.t('btn_switch_personal') : 'Перейти в личный планер';
        
        actionsDiv.innerHTML = `
            <button onclick="window.Groups.selectPersonal()" class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-600/50">
                <i class="fas fa-arrow-left"></i>
                <span>${escapeHtml(switchPersonalLabel)}</span>
            </button>
            
            ${isUserCreator ? `
                <button onclick="window.Groups.deleteGroup('${window.currentGroupId}')" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm">
                    <i class="fas fa-trash-can"></i>
                    <span>${escapeHtml(deleteLabel)}</span>
                </button>
            ` : `
                <button onclick="window.Groups.leaveGroup('${window.currentGroupId}')" class="border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>${escapeHtml(leaveLabel)}</span>
                </button>
            `}
        `;
    }
};

// Auto init on load
document.addEventListener('DOMContentLoaded', () => {
    window.Groups.init();
});
