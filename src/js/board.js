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

    // =====================
    // STATE
    // =====================
    const state = {
        viewport: { x: 0, y: 0, zoom: 1 },
        // Tool: 'pan', 'pencil', 'eraser'
        activeTool: 'pan',
        isPanning: false,
        isSpaceDown: false,
        prevTool: null,
        startX: 0, startY: 0,
        notes: [],
        activeNote: null,
        dragStartX: 0, dragStartY: 0,
        maxZIndex: 10,
        // Drawing
        isDrawing: false,
        drawColor: '#1e293b',
        drawSize: 3,
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
        loadBoardData();
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
    if (btnClearDrawing) {
        btnClearDrawing.addEventListener('click', () => {
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            Store.clearDrawing();   // async IndexedDB delete
            showToastSafe((window.t && window.t('drawing_cleared_toast')) || 'Рисунок очищен');
        });
    }

    // =====================
    // DRAWING CANVAS (overlays the viewport, NOT the infinite canvas)
    // =====================
    function resizeDrawingCanvas() {
        const rect = container.getBoundingClientRect();
        // Preserve existing drawing on resize
        const oldW = drawingCanvas.width;
        const oldH = drawingCanvas.height;
        if (oldW > 0 && oldH > 0) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = oldW;
            tempCanvas.height = oldH;
            tempCanvas.getContext('2d').drawImage(drawingCanvas, 0, 0);
            drawingCanvas.width = rect.width || window.innerWidth;
            drawingCanvas.height = rect.height || 800;
            ctx.drawImage(tempCanvas, 0, 0);
        } else {
            drawingCanvas.width = rect.width || window.innerWidth;
            drawingCanvas.height = rect.height || 800;
        }
    }

    window.addEventListener('resize', resizeDrawingCanvas);

    function getDrawingPos(clientX, clientY) {
        const rect = container.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

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
            state.isDrawing = true;
            const pos = getDrawingPos(e.clientX, e.clientY);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            if (state.activeTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = state.drawSize * 5;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = state.drawColor;
                ctx.lineWidth = state.drawSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
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
            const pos = getDrawingPos(e.clientX, e.clientY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
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
            ctx.closePath();
            ctx.globalCompositeOperation = 'source-over';
            requestDrawingSave();  // Debounced save
        }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            state.isSpaceDown = true;
            state.prevTool = state.activeTool;
            setActiveTool('pan');
        }
        // Shortcuts: P = pencil, E = eraser, V = pan
        if (e.code === 'KeyP' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') setActiveTool('pencil');
        if (e.code === 'KeyE' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') setActiveTool('eraser');
        if (e.code === 'KeyV' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') setActiveTool('pan');
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
            const pos = getDrawingPos(e.touches[0].clientX, e.touches[0].clientY);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            if (state.activeTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = state.drawSize * 5;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = state.drawColor;
                ctx.lineWidth = state.drawSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
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
                const pos = getDrawingPos(e.touches[0].clientX, e.touches[0].clientY);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
        }
    }, { passive: false });

    container.addEventListener('touchend', () => {
        state.isPanning = false;
        state.lastTouchDist = null;
        if (state.isDrawing) {
            state.isDrawing = false;
            ctx.closePath();
            ctx.globalCompositeOperation = 'source-over';
            requestDrawingSave();  // Debounced save
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
    }

    function saveBoardData() {
        Store.saveBoardData({
            viewport: state.viewport,
            notes: state.notes,
        });
    }

    let _drawSaveTimer = null;
    function requestDrawingSave() {
        if (_drawSaveTimer) clearTimeout(_drawSaveTimer);
        _drawSaveTimer = setTimeout(saveDrawingData, 2000);
    }

    async function saveDrawingData() {
        try {
            const dataUrl = drawingCanvas.toDataURL();
            await Store.saveDrawing(dataUrl);
            window.ActivityLog?.log('drawing_stroke_saved');
        } catch (e) {
            console.error('[Board] Failed to save drawing:', e);
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
        // Restore drawing from IndexedDB (async, no size limit)
        try {
            const drawingData = await Store.getDrawing();
            if (drawingData) {
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0);
                img.src = drawingData;
            }
        } catch (e) {
            console.warn('[Board] Could not restore drawing:', e);
        }
    }

    function showToastSafe(msg) {
        if (typeof showToast === 'function') showToast(msg);
    }
}
