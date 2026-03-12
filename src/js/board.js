window.initBoard = function (showToast) {
    const container = document.querySelector('.board-container');
    const infiniteCanvas = document.getElementById('infinite-canvas');
    const notesContainer = document.getElementById('notes-container');
    const drawingCanvas = document.getElementById('drawing-canvas');
    const ctx = drawingCanvas.getContext('2d');

    // Toolbar buttons
    const btnAddYellow = document.getElementById('add-note-yellow');
    const btnAddGreen = document.getElementById('add-note-green');
    const btnAddBlue = document.getElementById('add-note-blue');
    const btnAddPink = document.getElementById('add-note-pink');
    const btnReset = document.getElementById('reset-board-view');
    const btnPencil = document.getElementById('tool-pencil');
    const btnEraser = document.getElementById('tool-eraser');
    const btnPan = document.getElementById('tool-pan');
    const colorPicker = document.getElementById('draw-color');
    const brushSize = document.getElementById('brush-size');
    const btnClearDrawing = document.getElementById('clear-drawing');
    const btnUndo = document.getElementById('tool-undo');
    const btnRedo = document.getElementById('tool-redo');

    // =====================
    // STATE
    // =====================
    const state = {
        viewport: { x: 0, y: 0, zoom: 1 },
        activeTool: 'pan',
        isPanning: false,
        isSpaceDown: false,
        prevTool: null,
        startX: 0, startY: 0,
        notes: [],
        activeNote: null,
        dragStartX: 0, dragStartY: 0,
        maxZIndex: 10,
        // Drawing — PATH BASED (world-space coords)
        isDrawing: false,
        drawColor: '#1e293b',
        drawSize: 3,
        strokes: [],        // completed strokes: { tool, color, size, points:[{x,y}] }
        undoneStrokes: [],  // undone strokes for redo
        currentStroke: null,// stroke being drawn right now
        // Touch
        lastTouchDist: null,
        lastTouchMidX: 0, lastTouchMidY: 0,
    };

    // =====================
    // INIT
    // =====================
    resizeDrawingCanvas();
    loadBoardData();     // async — loads notes from LocalStorage, drawing from IndexedDB
    setActiveTool('pan');

    // Re-load on cloud sync
    document.addEventListener('cloudDataSynced', () => {
        console.log('[Board] Cloud data updated, refreshing...');
        flushDrawingSave().finally(() => loadBoardData());
    });

    // =====================
    // TOOL SWITCHER
    // =====================
    function setActiveTool(tool) {
        state.activeTool = tool;
        [btnPencil, btnEraser, btnPan].forEach(b => b && b.classList.remove('tool-active'));
        if (tool === 'pencil' && btnPencil) btnPencil.classList.add('tool-active');
        if (tool === 'eraser' && btnEraser) btnEraser.classList.add('tool-active');
        if (tool === 'pan' && btnPan) btnPan.classList.add('tool-active');

        if (tool === 'pencil') {
            container.style.cursor = 'crosshair';
            drawingCanvas.style.pointerEvents = 'all';
        } else if (tool === 'eraser') {
            container.style.cursor = 'cell';
            drawingCanvas.style.pointerEvents = 'all';
        } else {
            container.style.cursor = 'grab';
            drawingCanvas.style.pointerEvents = 'none';
        }
    }

    if (btnPencil) btnPencil.addEventListener('click', () => setActiveTool('pencil'));
    if (btnEraser) btnEraser.addEventListener('click', () => setActiveTool('eraser'));
    if (btnPan) btnPan.addEventListener('click', () => setActiveTool('pan'));

    if (colorPicker) {
        colorPicker.value = state.drawColor;
        colorPicker.addEventListener('input', () => { state.drawColor = colorPicker.value; });
    }
    if (brushSize) {
        brushSize.addEventListener('input', () => { state.drawSize = parseInt(brushSize.value); });
    }
    function doClearBoard() {
        state.strokes = [];
        state.undoneStrokes = [];
        state.currentStroke = null;
        renderStrokes();
        Store.clearDrawing();
        state.notes = [];
        if (notesContainer) notesContainer.innerHTML = '';
        saveBoardData();
        showToastSafe((window.t && window.t('drawing_cleared_toast')) || 'Доска очищена');
    }

    function showClearConfirm(onConfirm) {
        const lang = document.documentElement.lang || 'ru';
        const texts = {
            ru: { msg: 'Удалить весь рисунок и все стикеры?', yes: 'Удалить', no: 'Отмена' },
            en: { msg: 'Clear the entire drawing and all stickers?', yes: 'Clear', no: 'Cancel' },
            kk: { msg: 'Барлық сызбаларды және стикерлерді өшіру керек пе?', yes: 'Өшіру', no: 'Болдырмау' },
            ar: { msg: 'مسح الرسم بأكمله وجميع الملصقات؟', yes: 'مسح', no: 'إلغاء' },
        };
        const t = texts[lang] || texts.ru;

        // Build overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
        overlay.innerHTML = `
          <div style="background:#fff;border-radius:20px;padding:28px 32px;max-width:340px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.25);text-align:center;font-family:Inter,sans-serif">
            <div style="width:52px;height:52px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
              <i class="fas fa-trash-alt" style="color:#ef4444;font-size:20px"></i>
            </div>
            <p style="font-size:15px;font-weight:600;color:#1e293b;line-height:1.5;margin-bottom:20px">${t.msg}</p>
            <div style="display:flex;gap:10px;justify-content:center">
              <button id="_board_cancel" style="flex:1;padding:11px;border-radius:12px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#64748b;font-weight:600;cursor:pointer;font-size:14px">${t.no}</button>
              <button id="_board_confirm" style="flex:1;padding:11px;border-radius:12px;border:none;background:#ef4444;color:#fff;font-weight:700;cursor:pointer;font-size:14px">${t.yes}</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);

        const close = () => document.body.removeChild(overlay);
        overlay.querySelector('#_board_cancel').addEventListener('click', close);
        overlay.querySelector('#_board_confirm').addEventListener('click', () => { close(); onConfirm(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    }

    // Event delegation for toolbar buttons so they always work even if re-rendered
    document.body.addEventListener('click', (e) => {
        const btnClear = e.target.closest('#clear-drawing');
        if (btnClear) {
            e.preventDefault();
            showClearConfirm(doClearBoard);
        }
    });

    // =====================
    // DRAWING CANVAS — path-based, world-space rendering
    // =====================
    function resizeDrawingCanvas() {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return; // Tab is hidden
        const newWidth = Math.round(rect.width);
        const newHeight = Math.round(rect.height);

        if (drawingCanvas.width !== newWidth || drawingCanvas.height !== newHeight) {
            drawingCanvas.width = newWidth;
            drawingCanvas.height = newHeight;
            renderStrokes(); // Redraw paths after resize
        }
    }

    const resizeObserver = new ResizeObserver(() => resizeDrawingCanvas());
    resizeObserver.observe(container);

    // screen px → world coordinates
    // NOTE: .infinite-canvas has CSS top:50% left:50%, so world-space origin (0,0)
    // is at the CENTER of the board container — we must subtract that offset here.
    function screenToWorld(clientX, clientY) {
        const rect = drawingCanvas.getBoundingClientRect();
        const cx = drawingCanvas.width / 2;
        const cy = drawingCanvas.height / 2;
        return {
            x: (clientX - rect.left - cx - state.viewport.x) / state.viewport.zoom,
            y: (clientY - rect.top - cy - state.viewport.y) / state.viewport.zoom,
        };
    }

    // Render ALL strokes from world coords onto the screen canvas
    function renderStrokes() {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        ctx.save();
        // Transform mirrors CSS: origin at canvas center (matches .infinite-canvas top:50% left:50%)
        // then apply viewport pan + zoom
        const cx = drawingCanvas.width / 2;
        const cy = drawingCanvas.height / 2;
        ctx.translate(cx + state.viewport.x, cy + state.viewport.y);
        ctx.scale(state.viewport.zoom, state.viewport.zoom);

        const all = state.currentStroke
            ? [...state.strokes, state.currentStroke]
            : state.strokes;

        for (const stroke of all) {
            if (!stroke.points || stroke.points.length < 2) continue;
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (stroke.tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = stroke.size * 5;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.size;
            }
            ctx.stroke();
        }
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
    }

    function startStroke(worldPos) {
        state.currentStroke = {
            tool: state.activeTool,
            color: state.drawColor,
            size: state.drawSize,
            points: [worldPos],
        };
    }

    function continueStroke(worldPos) {
        if (!state.currentStroke) return;
        state.currentStroke.points.push(worldPos);
        renderStrokes();
    }

    function endStroke() {
        if (!state.currentStroke) return;
        if (state.currentStroke.points.length > 1) {
            state.strokes.push(state.currentStroke);
            state.undoneStrokes = []; // Clear redo history on new action
        }
        state.currentStroke = null;
        requestDrawingSave();
    }

    function undoStroke() {
        if (state.strokes.length > 0) {
            state.undoneStrokes.push(state.strokes.pop());
            renderStrokes();
            requestDrawingSave();
        }
    }

    function redoStroke() {
        if (state.undoneStrokes.length > 0) {
            state.strokes.push(state.undoneStrokes.pop());
            renderStrokes();
            requestDrawingSave();
        }
    }

    if (btnUndo) btnUndo.addEventListener('click', undoStroke);
    if (btnRedo) btnRedo.addEventListener('click', redoStroke);

    // =====================
    // MOUSE EVENTS
    // =====================

    // Container-level for PAN
    container.addEventListener('mousedown', (e) => {
        // Skip if clicking on inputs/textareas
        const tag = e.target.tagName;
        if (tag === 'TEXTAREA' || tag === 'INPUT') return;

        if (state.activeTool === 'pan' || state.isSpaceDown || e.button === 1) {
            e.preventDefault();
            state.isPanning = true;
            state.startX = e.clientX - state.viewport.x;
            state.startY = e.clientY - state.viewport.y;
            container.classList.add('panning');
        }
    });

    // Drawing canvas events
    drawingCanvas.addEventListener('mousedown', (e) => {
        if (state.activeTool === 'pencil' || state.activeTool === 'eraser') {
            e.preventDefault();
            state.isDrawing = true;
            startStroke(screenToWorld(e.clientX, e.clientY));
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (state.isPanning) {
            state.viewport.x = e.clientX - state.startX;
            state.viewport.y = e.clientY - state.startY;
            updateTransform();
            return;
        }
        if (state.activeNote) {
            const newX = e.clientX / state.viewport.zoom - state.dragStartX;
            const newY = e.clientY / state.viewport.zoom - state.dragStartY;
            state.activeNote.data.x = newX;
            state.activeNote.data.y = newY;
            state.activeNote.el.style.left = `${newX}px`;
            state.activeNote.el.style.top = `${newY}px`;
        }
        if (state.isDrawing) {
            continueStroke(screenToWorld(e.clientX, e.clientY));
        }
    });

    window.addEventListener('mouseup', () => {
        if (state.isPanning) {
            state.isPanning = false;
            container.classList.remove('panning');
            saveBoardData();
        }
        if (state.activeNote) {
            state.activeNote = null;
            saveBoardData();
        }
        if (state.isDrawing) {
            state.isDrawing = false;
            endStroke();
        }
    });

    // Avoid losing the latest stroke when user closes/reloads the page quickly.
    window.addEventListener('pagehide', () => { flushDrawingSave(); });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushDrawingSave();
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            state.isSpaceDown = true;
            state.prevTool = state.activeTool;
            setActiveTool('pan');
        }
        // Shortcuts: P = pencil, E = eraser, V = pan, Ctrl+Z = undo, Ctrl+Y = redo
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
            e.preventDefault();
            undoStroke();
        } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
            e.preventDefault();
            redoStroke();
        } else {
            if (e.code === 'KeyP' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') setActiveTool('pencil');
            if (e.code === 'KeyE' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') setActiveTool('eraser');
            if (e.code === 'KeyV' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') setActiveTool('pan');
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            state.isSpaceDown = false;
            state.isPanning = false;
            container.classList.remove('panning');
            if (state.prevTool) setActiveTool(state.prevTool);
        }
    });

    // Zoom
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        let newZoom = Math.max(0.15, Math.min(state.viewport.zoom * Math.exp(delta), 4));
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const canvasMouseX = (mouseX - state.viewport.x) / state.viewport.zoom;
        const canvasMouseY = (mouseY - state.viewport.y) / state.viewport.zoom;
        state.viewport.x = mouseX - canvasMouseX * newZoom;
        state.viewport.y = mouseY - canvasMouseY * newZoom;
        state.viewport.zoom = newZoom;
        updateTransform();
    }, { passive: false });

    // =====================
    // TOUCH EVENTS (Mobile)
    // =====================
    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && state.activeTool === 'pan') {
            state.isPanning = true;
            state.startX = e.touches[0].clientX - state.viewport.x;
            state.startY = e.touches[0].clientY - state.viewport.y;
        } else if (e.touches.length === 2) {
            // Pinch-to-zoom tracking
            state.isPanning = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            state.lastTouchDist = Math.hypot(dx, dy);
            state.lastTouchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            state.lastTouchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        } else if (e.touches.length === 1 && (state.activeTool === 'pencil' || state.activeTool === 'eraser')) {
            state.isDrawing = true;
            startStroke(screenToWorld(e.touches[0].clientX, e.touches[0].clientY));
        }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length === 2) {
            // Pinch-to-zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            if (state.lastTouchDist) {
                const scale = dist / state.lastTouchDist;
                let newZoom = Math.max(0.15, Math.min(state.viewport.zoom * scale, 4));
                const rect = container.getBoundingClientRect();
                const mx = midX - rect.left;
                const my = midY - rect.top;
                const cx = (mx - state.viewport.x) / state.viewport.zoom;
                const cy = (my - state.viewport.y) / state.viewport.zoom;
                state.viewport.x = mx - cx * newZoom;
                state.viewport.y = my - cy * newZoom;
                state.viewport.zoom = newZoom;
                updateTransform();
            }
            state.lastTouchDist = dist;
            state.lastTouchMidX = midX;
            state.lastTouchMidY = midY;
        } else if (e.touches.length === 1) {
            if (state.isPanning) {
                state.viewport.x = e.touches[0].clientX - state.startX;
                state.viewport.y = e.touches[0].clientY - state.startY;
                updateTransform();
            } else if (state.isDrawing) {
                continueStroke(screenToWorld(e.touches[0].clientX, e.touches[0].clientY));
            }
        }
    }, { passive: false });

    container.addEventListener('touchend', () => {
        state.isPanning = false;
        state.lastTouchDist = null;
        if (state.isDrawing) {
            state.isDrawing = false;
            endStroke();
        }
        saveBoardData();
    });

    // Reset
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            state.viewport = { x: 0, y: 0, zoom: 1 };
            updateTransform();
            saveBoardData();
        });
    }

    // =====================
    // STICKY NOTES
    // =====================
    function createNoteElement(noteData) {
        const el = document.createElement('div');
        el.className = `sticky-note note-${noteData.color}`;
        el.id = `note-${noteData.id}`;
        el.style.left = `${noteData.x}px`;
        el.style.top = `${noteData.y}px`;
        el.style.zIndex = noteData.zIndex;
        if (noteData.zIndex > state.maxZIndex) state.maxZIndex = noteData.zIndex;

        const header = document.createElement('div');
        header.className = 'note-drag-handle';
        header.innerHTML = '<i class="fas fa-grip-horizontal"></i>';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-note-btn';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';

        const textarea = document.createElement('textarea');
        textarea.className = 'sticky-content handwriting';
        textarea.id = `note-${noteData.id}-text`;
        textarea.name = `note-${noteData.id}-text`;
        textarea.setAttribute('aria-label', (window.t && window.t('note_placeholder')) || 'Бисмиллях...');
        textarea.placeholder = (window.t && window.t('note_placeholder')) || 'Бисмиллях...';
        textarea.value = noteData.text || '';

        header.appendChild(deleteBtn);
        el.appendChild(header);
        el.appendChild(textarea);
        notesContainer.appendChild(el);

        setupNoteEvents(el, noteData, textarea, deleteBtn, header);
        return el;
    }

    function setupNoteEvents(el, noteData, textarea, deleteBtn, handle) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            el.style.transform = 'scale(0.8)';
            el.style.opacity = '0';
            el.style.transition = 'all 0.2s ease';
            setTimeout(() => el.remove(), 200);
            state.notes = state.notes.filter(n => n.id !== noteData.id);
            saveBoardData();
            showToastSafe((window.t && window.t('note_deleted_toast')) || 'Стикер удален');
            window.ActivityLog?.log('note_deleted', { noteId: noteData.id, color: noteData.color });
        });

        textarea.addEventListener('input', () => {
            noteData.text = textarea.value;
            saveBoardData();
        });

        // Drag only from handle
        function startNoteDrag(clientX, clientY) {
            state.maxZIndex++;
            noteData.zIndex = state.maxZIndex;
            el.style.zIndex = state.maxZIndex;
            state.activeNote = { el, data: noteData };
            state.dragStartX = clientX / state.viewport.zoom - noteData.x;
            state.dragStartY = clientY / state.viewport.zoom - noteData.y;
        }

        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startNoteDrag(e.clientX, e.clientY);
        });

        // Touch drag on handle
        handle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            if (e.touches.length === 1) startNoteDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
    }

    window.addEventListener('touchmove', (e) => {
        if (state.activeNote && e.touches.length === 1) {
            const newX = e.touches[0].clientX / state.viewport.zoom - state.dragStartX;
            const newY = e.touches[0].clientY / state.viewport.zoom - state.dragStartY;
            state.activeNote.data.x = newX;
            state.activeNote.data.y = newY;
            state.activeNote.el.style.left = `${newX}px`;
            state.activeNote.el.style.top = `${newY}px`;
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        if (state.activeNote) {
            state.activeNote = null;
            saveBoardData();
        }
    });

    function addNewNote(color) {
        // infinite-canvas is positioned at 50% 50% in CSS, so x=0, y=0 is already the center of the viewport
        const canvasX = -state.viewport.x / state.viewport.zoom - 100;
        const canvasY = -state.viewport.y / state.viewport.zoom - 100;
        state.maxZIndex++;
        const newNote = {
            id: Date.now().toString(), color,
            text: '', x: canvasX, y: canvasY,
            zIndex: state.maxZIndex
        };
        state.notes.push(newNote);
        const el = createNoteElement(newNote);
        // Entrance animation
        el.style.transform = 'scale(0.5) rotate(-5deg)';
        el.style.opacity = '0';
        el.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        setTimeout(() => { el.style.transform = ''; el.style.opacity = '1'; }, 10);
        saveBoardData();
        setTimeout(() => el.querySelector('textarea').focus(), 50);
        showToastSafe((window.t && window.t('note_created_toast')) || 'МашаАллах, стикер добавлен 🌱');
        window.ActivityLog?.log('note_created', { noteId: newNote.id, color });
    }

    if (btnAddYellow) btnAddYellow.addEventListener('click', () => addNewNote('yellow'));
    if (btnAddGreen) btnAddGreen.addEventListener('click', () => addNewNote('green'));
    if (btnAddBlue) btnAddBlue.addEventListener('click', () => addNewNote('blue'));
    if (btnAddPink) btnAddPink.addEventListener('click', () => addNewNote('pink'));

    // =====================
    // HELPERS
    // =====================
    function updateTransform() {
        infiniteCanvas.style.transform = `translate(${state.viewport.x}px, ${state.viewport.y}px) scale(${state.viewport.zoom})`;
        renderStrokes(); // Redraw paths at new viewport
    }

    function saveBoardData() {
        Store.saveBoardData({
            viewport: state.viewport,
            notes: state.notes,
        });
    }

    let _drawSaveTimer = null;
    let _drawSaveInFlight = null;
    let _drawSaveNeedsResave = false;
    let _drawSaveToastPending = false;
    let _lastSavedDrawingPayload = null;

    function requestDrawingSave() {
        _drawSaveToastPending = true;
        return saveDrawingData();
    }

    function flushDrawingSave() {
        if (_drawSaveTimer) {
            clearTimeout(_drawSaveTimer);
            _drawSaveTimer = null;
        }
        return saveDrawingData();
    }

    async function saveDrawingData() {
        const currentPayload = JSON.stringify(state.strokes);
        if (!_drawSaveInFlight && currentPayload === _lastSavedDrawingPayload) return;

        if (_drawSaveInFlight) {
            _drawSaveNeedsResave = true;
            return _drawSaveInFlight;
        }

        _drawSaveInFlight = (async () => {
            do {
                _drawSaveNeedsResave = false;
                _drawSaveTimer = null;
                const payload = JSON.stringify(state.strokes);
                const writePromise = Store.saveDrawing(payload);
                _lastSavedDrawingPayload = payload;
                window.ActivityLog?.log('drawing_stroke_saved');
                if (_drawSaveToastPending) {
                    const msg = (window.t && window.t('toast_saved')) || 'Saved';
                    showToastSafe(msg);
                    _drawSaveToastPending = false;
                }
                await writePromise;
            } while (_drawSaveNeedsResave);
        })();

        try {
            await _drawSaveInFlight;
        } catch (e) {
            console.error('[Board] Failed to save drawing:', e);
        } finally {
            _drawSaveInFlight = null;
        }
    }

    async function loadBoardData() {
        const data = Store.getBoardData();
        if (!data) return;

        // Restore viewport
        if (data.viewport) {
            state.viewport = data.viewport;
            updateTransform();
        }
        // Restore sticky notes
        if (data.notes && Array.isArray(data.notes)) {
            state.notes = data.notes;
            notesContainer.innerHTML = '';
            state.notes.forEach(note => createNoteElement(note));
        }
        // Restore drawing strokes from IndexedDB
        try {
            const drawingData = await Store.getDrawing();
            if (drawingData) {
                // New format: JSON strokes array
                if (drawingData.trimStart().startsWith('[')) {
                    state.strokes = JSON.parse(drawingData);
                } else {
                    // Legacy: old dataURL format — load as background image once, discard
                    const img = new Image();
                    img.onload = () => {
                        // Convert legacy pixel image to a single stroke-less "background" entry
                        // We can't recover exact paths, so we render it as-is then clear on next save
                        ctx.save();
                        ctx.translate(state.viewport.x, state.viewport.y);
                        ctx.scale(state.viewport.zoom, state.viewport.zoom);
                        ctx.drawImage(img, 0, 0);
                        ctx.restore();
                    };
                    img.src = drawingData;
                }
                renderStrokes();
            }
        } catch (e) {
            console.warn('[Board] Could not restore drawing:', e);
        }
    }

    function showToastSafe(msg) {
        if (typeof window.showToast === 'function') {
            window.showToast(msg);
            return;
        }
        if (typeof showToast === 'function') {
            showToast(msg);
        }
    }
}

