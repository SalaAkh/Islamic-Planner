// =====================================================================
// AI PLANNER ASSISTANT (SurviveKit Feature)
// Powered by Groq/Gemini API via Fetch (BYOK model)
// =====================================================================

const AI_SYSTEM_PROMPT = `
Ты исламский планировщик продуктивности. Твоя задача — получить сырой текст пользователя (его планы на день) и строго распределить активности по 5 исламским блокам времени. 

Блоки времени:
1. fajr_zuhr (Утро: духовность, фокус, главная задача)
2. zuhr_asr (Обед: рутина, созвоны, работа)
3. asr_maghrib (Вечер: отдых, бытовые дела, семья)
4. maghrib_isha (Поздний вечер: семья, ужин)
5. isha_sleep (Ночь: уединение, чтение, подготовка ко сну)

ПРАВИЛА:
- Верни ТОЛЬКО валидный JSON. Никакого текста до или после. Никаких markdown блоков \`\`\`json.
- Формат ответа: {"fajr_zuhr": ["задача 1", "задача 2", "задача 3"], "zuhr_asr": [...], "asr_maghrib": [...], "maghrib_isha": [...], "isha_sleep": [...]}
- Интегрируй сырой текст пользователя в подходящие блоки времени.
- Для ВСЕХ блоков времени (даже если пользователь их не упомянул) распиши подробный идеальный план, соответствующий идеологии Barakah (баланс религии и дуньи). Придумай по 3-5 логичных и полезных задач для КАЖДОГО блока.
- Формулируй задачи кратко и емко (до 5-7 слов).
`;

class AiAssistant {
    constructor() {
        this.apiKey = '';

        // UI Elements
        this.fab = document.getElementById('ai-fab-btn');
        this.modal = document.getElementById('ai-modal');
        this.closeBtn = document.getElementById('close-ai-modal');
        this.modalContent = this.modal.querySelector('div');

        this.setupArea = document.getElementById('ai-setup-area');
        this.apiForm = document.getElementById('ai-api-form');
        this.chatArea = document.getElementById('ai-chat-area');
        this.apiKeyInput = document.getElementById('ai-api-key');
        this.saveKeyBtn = document.getElementById('save-ai-key');
        this.settingsBtn = document.getElementById('ai-settings-btn');

        this.promptInput = document.getElementById('ai-prompt');
        this.submitBtn = document.getElementById('ai-submit-btn');
        this.loadingOverlay = document.getElementById('ai-loading');

        // Load encrypted key, then register event listeners
        this._loadKey().then(() => this.init());
    }

    async _loadKey() {
        if (typeof window.decryptApiKey === 'function') {
            this.apiKey = await window.decryptApiKey();
        }
    }

    init() {
        // Event Listeners
        if (this.fab) this.fab.addEventListener('click', () => this.openModal());
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }

        if (this.apiForm) {
            this.apiForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveApiKey();
            });
        } else if (this.saveKeyBtn) {
            this.saveKeyBtn.addEventListener('click', () => this.saveApiKey());
        }
        if (this.settingsBtn) this.settingsBtn.addEventListener('click', () => this.toggleSettings());

        if (this.submitBtn) this.submitBtn.addEventListener('click', () => this.generatePlan());

        // Auto-resize prompt area
        if (this.promptInput) {
            this.promptInput.addEventListener('input', () => {
                this.submitBtn.disabled = this.promptInput.value.trim().length === 0;
            });
        }
    }

    openModal() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        // Trigger reflow for animation
        void this.modal.offsetWidth;
        this.modalContent.classList.remove('scale-95', 'opacity-0');
        this.modalContent.classList.add('scale-100', 'opacity-100');

        if (!this.apiKey) {
            this.setupArea.classList.remove('hidden');
        } else {
            this.promptInput.focus();
        }
    }

    closeModal() {
        this.modalContent.classList.remove('scale-100', 'opacity-100');
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
            this.setupArea.classList.add('hidden'); // Reset state
        }, 300);
    }

    toggleSettings() {
        if (this.setupArea.classList.contains('hidden')) {
            this.setupArea.classList.remove('hidden');
            this.apiKeyInput.value = this.apiKey;
            this.apiKeyInput.focus();
        } else {
            this.setupArea.classList.add('hidden');
        }
    }

    saveApiKey() {
        const val = this.apiKeyInput.value.trim();
        if (val) {
            this.apiKey = val;
            // Store key encrypted — satisfies CWE-312/315/359
            if (typeof window.encryptApiKey === 'function') {
                window.encryptApiKey(val);
            }

            // Sync to cloud if user is logged in
            if (window.DbSync && typeof window.DbSync.syncToCloud === 'function') {
                window.DbSync.syncToCloud('settings_ai', { apiKey: val });
            }

            this.setupArea.classList.add('hidden');
            if (window.showToast) window.showToast((window.t && window.t('ai_key_saved')) || 'API ключ сохранен!');
            this.promptInput.focus();
        }
    }

    async generatePlan() {
        if (!this.apiKey) {
            this.toggleSettings();
            return;
        }

        const promptText = this.promptInput.value.trim();
        if (!promptText) return;

        this.setLoading(true);

        try {
            // GEMINI API Fetch
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: AI_SYSTEM_PROMPT + `\n- Отвечай на ${window.t ? window.t('ai_lang_name') : 'русском'} языке.` }]
                    },
                    contents: [
                        { role: 'user', parts: [{ text: promptText }] }
                    ],
                    generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 1024,
                        responseMimeType: "application/json"
                    }
                })
            });

            if (!response.ok) {
                if (response.status === 400 || response.status === 403) throw new Error((window.t && window.t('ai_error_key')) || 'Неверный API ключ или параметры. Проверьте настройки.');
                throw new Error(`${(window.t && window.t('ai_error_server')) || 'Ошибка сервера'} (${response.status})`);
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error((window.t && window.t('ai_error_format')) || 'Непредвиденный формат ответа от Gemini.');
            }

            const content = data.candidates[0].content.parts[0].text;

            this.processAiResponse(content);

            this.promptInput.value = '';
            this.closeModal();
            if (window.showToast) window.showToast((window.t && window.t('ai_plan_generated')) || 'План сгенерирован! МашаАллах!');

        } catch (error) {
            console.error('[AI] Fetch error:', error);
            alert(`${(window.t && window.t('ai_error')) || 'Ошибка ИИ'}: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.loadingOverlay.classList.remove('hidden');
            this.loadingOverlay.classList.add('flex');
            this.submitBtn.disabled = true;
        } else {
            this.loadingOverlay.classList.add('hidden');
            this.loadingOverlay.classList.remove('flex');
            this.submitBtn.disabled = this.promptInput.value.trim().length === 0;
        }
    }

    processAiResponse(jsonStr) {
        try {
            // Очищаем потенциальный мусор вокруг JSON
            let start = jsonStr.indexOf('{');
            let end = jsonStr.lastIndexOf('}') + 1;
            if (start === -1 || end === 0) throw new Error('JSON не найден в ответе');

            let cleanJson = jsonStr.substring(start, end);
            const plan = JSON.parse(cleanJson);

            const mapping = {
                'fajr_zuhr': '1',
                'zuhr_asr': '2',
                'asr_maghrib': '3',
                'maghrib_isha': '4',
                'isha_sleep': '5'
            };

            for (const [key, tasks] of Object.entries(plan)) {
                if (mapping[key] && Array.isArray(tasks)) {
                    this.fillBlock(mapping[key], tasks);
                }
            }

            // Trigger save
            const container = document.querySelector('.md\\:col-span-8.space-y-8');
            if (container) {
                container.dispatchEvent(new Event('input', { bubbles: true }));
            }

        } catch (e) {
            console.error('[AI] Parsing failed:', e, jsonStr);
            alert((window.t && window.t('ai_error_format_retry')) || 'ИИ вернул неверный формат ответа. Попробуйте еще раз.');
        }
    }

    fillBlock(blockIndex, tasks) {
        const addBtn = document.querySelector(`button[data-block-index="${blockIndex}"]`);
        if (!addBtn) return;

        // Button is inside a div, so parent's previous sibling is the list container
        const listContainer = addBtn.parentElement.previousElementSibling;
        if (!listContainer) return;

        const existingInputs = listContainer.querySelectorAll('.day-input');

        let taskIndex = 0;

        // 1. Fill existing empty inputs
        existingInputs.forEach(input => {
            if (!input.value.trim() && taskIndex < tasks.length) {
                input.value = tasks[taskIndex];
                input.classList.remove('line-through', 'text-gray-400', 'opacity-60');
                const toggle = input.previousElementSibling;
                if (toggle && toggle.classList.contains('task-done')) {
                    toggle.classList.remove('task-done', 'text-green-700', 'border-green-700');
                    toggle.classList.add('text-transparent');
                    toggle.innerHTML = '';
                }
                taskIndex++;
            }
        });

        // 2. Add new rows if needed
        while (taskIndex < tasks.length) {
            const newIndex = Date.now() + Math.random();
            const deleteTitle = (window.t && window.t('btn_delete_goal')) || 'Удалить';
            const newRow = document.createElement('div');
            newRow.className = 'flex items-center group';
            newRow.innerHTML = `
                <button data-task-id="t_dyn_${newIndex}" class="task-toggle shrink-0 mr-3"></button>
                <input data-id="task_dyn_${newIndex}" id="task_dyn_${newIndex}" name="task_dyn_${newIndex}" type="text" class="ruled-input handwriting day-input w-full" value="${tasks[taskIndex]}" autocomplete="off">
                <button type="button" class="delete-dyn-task text-red-500 opacity-30 hover:opacity-100 transition-all p-2 shrink-0 ml-2 cursor-pointer relative z-50" title="${deleteTitle}"><i class="fas fa-trash text-sm pointer-events-none"></i></button>
            `;
            listContainer.appendChild(newRow);
            taskIndex++;
        }
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AiAssistant();
});
