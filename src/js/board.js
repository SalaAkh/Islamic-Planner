window.initBoard = function (showToast) {
    if(!window.Konva) {
        console.error('Konva is not loaded!');
        return;
    }

    const containerId = 'board-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    container.style.padding = '0';

    // Toolbar elements
    const btnAddYellow = document.getElementById('add-note-yellow');
    const btnAddGreen = document.getElementById('add-note-green');
    const btnAddBlue = document.getElementById('add-note-blue');
    const btnAddPink = document.getElementById('add-note-pink');
    const btnReset = document.getElementById('reset-board-view');
    const btnPencil = document.getElementById('tool-pencil');
    const btnEraser = document.getElementById('tool-eraser');
    const btnPan = document.getElementById('tool-pan');
    const btnArrow = document.getElementById('tool-arrow');
    const btnShape = document.getElementById('tool-shape');
    const btnText = document.getElementById('tool-text');
    
    const colorPicker = document.getElementById('draw-color');
    const brushSize = document.getElementById('brush-size');
    const btnClearDrawing = document.getElementById('clear-drawing');
    const btnUndo = document.getElementById('tool-undo');
    const btnRedo = document.getElementById('tool-redo');

    let isPaint = false;
    let mode = 'pan'; // pan | pencil | eraser | arrow | shape | text
    let tempShape; // reference to the active drawing shape
    let color = colorPicker ? colorPicker.value : '#1e293b';
    let size = brushSize ? parseInt(brushSize.value) : 3;

    // State Tracking for Undo/Redo
    const history = []; 
    let historyStep = -1;

    // --- Konva Setup ---
    const stage = new Konva.Stage({
        container: containerId,
        width: container.offsetWidth,
        height: container.offsetHeight,
        draggable: true
    });

    const gridLayer = new Konva.Layer();
    const pathLayer = new Konva.Layer();
    const noteLayer = new Konva.Layer();

    stage.add(gridLayer);
    stage.add(pathLayer);
    stage.add(noteLayer);

    // --- Grid Background (Dot Grid) ---
    const DOT_SPACING = 40;
    const DOT_RADIUS = 1.5;

    function drawGrid() {
        gridLayer.destroyChildren();
        
        const scale = stage.scaleX();
        const stageX = stage.x();
        const stageY = stage.y();
        const width = stage.width();
        const height = stage.height();

        const startX = -stageX / scale;
        const startY = -stageY / scale;
        const endX = startX + width / scale;
        const endY = startY + height / scale;

        const firstX = Math.floor(startX / DOT_SPACING) * DOT_SPACING;
        const firstY = Math.floor(startY / DOT_SPACING) * DOT_SPACING;

        const dots = [];
        for (let x = firstX; x < endX; x += DOT_SPACING) {
            for (let y = firstY; y < endY; y += DOT_SPACING) {
                dots.push(x, y);
            }
        }

        const gridShape = new Konva.Shape({
            sceneFunc: (ctx, shape) => {
                ctx.beginPath();
                ctx.fillStyle = '#CBD5E1'; 
                for (let i = 0; i < dots.length; i += 2) {
                    ctx.moveTo(dots[i], dots[i+1]);
                    ctx.arc(dots[i], dots[i+1], DOT_RADIUS / scale, 0, Math.PI * 2);
                }
                ctx.fill();
            },
            listening: false
        });
        gridLayer.add(gridShape);
    }
    drawGrid();

    stage.on('dragmove zoom', drawGrid);

    // --- Responsive ---
    const resizeObserver = new ResizeObserver(() => {
        if(container.offsetWidth > 0 && container.offsetHeight > 0) {
            stage.width(container.offsetWidth);
            stage.height(container.offsetHeight);
            drawGrid();
        }
    });
    resizeObserver.observe(container);

    // --- Zoom (Wheel + Pinch) ---
    const scaleBy = 1.05;
    stage.on('wheel', (e) => {
        e.evt.preventDefault();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if(!pointer) return;
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        let direction = e.evt.deltaY > 0 ? -1 : 1;
        if (e.evt.ctrlKey) direction = -direction;

        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        stage.scale({ x: newScale, y: newScale });
        stage.position({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
        stage.fire('zoom'); 
    });

    let lastCenter = null;
    let lastDist = 0;

    function getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    function getCenter(p1, p2) {
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    stage.on('touchmove', function(e) {
        e.evt.preventDefault();
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        if (touch1 && touch2) {
            if (stage.isDragging()) stage.stopDrag();
            
            const p1 = { x: touch1.clientX, y: touch1.clientY };
            const p2 = { x: touch2.clientX, y: touch2.clientY };

            if (!lastCenter) {
                lastCenter = getCenter(p1, p2);
                return;
            }
            const newCenter = getCenter(p1, p2);

            const dist = getDistance(p1, p2);
            if (!lastDist) lastDist = dist;

            const pointTo = {
                x: (newCenter.x - stage.x()) / stage.scaleX(),
                y: (newCenter.y - stage.y()) / stage.scaleX(),
            };

            const scale = stage.scaleX() * (dist / lastDist);

            stage.scaleX(scale);
            stage.scaleY(scale);
            
            const dx = newCenter.x - lastCenter.x;
            const dy = newCenter.y - lastCenter.y;

            stage.position({
                x: newCenter.x - pointTo.x * scale + dx,
                y: newCenter.y - pointTo.y * scale + dy,
            });

            lastDist = dist;
            lastCenter = newCenter;
            stage.fire('zoom');
        }
    });

    stage.on('touchend', function() {
        lastDist = 0;
        lastCenter = null;
    });

    // --- Tools Logic ---
    function setMode(newMode) {
        mode = newMode;
        [btnPencil, btnEraser, btnPan, btnArrow, btnShape, btnText].forEach(b => b && b.classList.remove('tool-active'));
        if (mode === 'pencil' && btnPencil) btnPencil.classList.add('tool-active');
        if (mode === 'eraser' && btnEraser) btnEraser.classList.add('tool-active');
        if (mode === 'pan' && btnPan) btnPan.classList.add('tool-active');
        if (mode === 'arrow' && btnArrow) btnArrow.classList.add('tool-active');
        if (mode === 'shape' && btnShape) btnShape.classList.add('tool-active');
        if (mode === 'text' && btnText) btnText.classList.add('tool-active');

        if(mode === 'pan') {
            stage.draggable(true);
            container.style.cursor = 'grab';
        } else if (mode === 'text') {
            stage.draggable(false);
            container.style.cursor = 'text';
        } else {
            stage.draggable(false);
            container.style.cursor = 'crosshair';
        }
    }

    if(btnPan) btnPan.addEventListener('click', () => setMode('pan'));
    if(btnPencil) btnPencil.addEventListener('click', () => setMode('pencil'));
    if(btnEraser) btnEraser.addEventListener('click', () => setMode('eraser'));
    if(btnArrow) btnArrow.addEventListener('click', () => setMode('arrow'));
    if(btnShape) btnShape.addEventListener('click', () => setMode('shape'));
    if(btnText) btnText.addEventListener('click', () => setMode('text'));

    if(colorPicker) {
        colorPicker.addEventListener('input', () => color = colorPicker.value);
    }
    if(brushSize) {
        brushSize.addEventListener('input', () => size = parseInt(brushSize.value));
    }
    if(btnReset) {
        btnReset.addEventListener('click', () => {
            stage.position({x:0, y:0});
            stage.scale({x:1, y:1});
            stage.fire('zoom');
            saveBoardState();
        });
    }

    // --- Drawing Events ---
    stage.on('mousedown touchstart', function(e) {
        if(mode === 'pan') return;
        // Ignore if clicking on a note object to edit/drag it
        if(e.target.parent === noteLayer || e.target.parent?.parent === noteLayer) return;

        const pos = stage.getRelativePointerPosition();

        if (mode === 'text') {
            // Add free text on click
            addFreeText(pos.x, pos.y);
            setMode('pan'); // Reset to pan after adding text to prevent accidental multi-clicks
            return;
        }

        isPaint = true;
        
        if (mode === 'pencil' || mode === 'eraser') {
            tempShape = new Konva.Line({
                stroke: mode === 'eraser' ? 'white' : color,
                strokeWidth: mode === 'eraser' ? size * 5 : size,
                globalCompositeOperation: mode === 'eraser' ? 'destination-out' : 'source-over',
                lineCap: 'round',
                lineJoin: 'round',
                points: [pos.x, pos.y],
                listening: false,
            });
            pathLayer.add(tempShape);
        } else if (mode === 'arrow') {
            tempShape = new Konva.Arrow({
                points: [pos.x, pos.y, pos.x, pos.y],
                pointerLength: size * 3 + 5,
                pointerWidth: size * 3 + 5,
                fill: color,
                stroke: color,
                strokeWidth: size,
                listening: false,
            });
            pathLayer.add(tempShape);
        } else if (mode === 'shape') {
            tempShape = new Konva.Rect({
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                stroke: color,
                strokeWidth: size,
                listening: false,
            });
            pathLayer.add(tempShape);
        }
    });

    stage.on('mouseup touchend', function() {
        if(isPaint) {
            isPaint = false;
            saveHistory();
            requestPathSave();
        }
    });

    stage.on('mousemove touchmove', function(e) {
        if (!isPaint || !tempShape) return;
        e.evt.preventDefault();
        const pos = stage.getRelativePointerPosition();
        
        if (mode === 'pencil' || mode === 'eraser') {
            const newPoints = tempShape.points().concat([pos.x, pos.y]);
            tempShape.points(newPoints);
        } else if (mode === 'arrow') {
            const points = tempShape.points();
            tempShape.points([points[0], points[1], pos.x, pos.y]);
        } else if (mode === 'shape') {
            tempShape.width(pos.x - tempShape.x());
            tempShape.height(pos.y - tempShape.y());
        }
    });

    // --- Undo / Redo ---
    function saveHistory() {
        historyStep++;
        history.splice(historyStep);
        history.push(pathLayer.toJSON());
    }

    function undo() {
        if (historyStep > 0) {
            historyStep--;
            restorePathLayerFromJSON(history[historyStep]);
            requestPathSave();
        } else if (historyStep === 0) {
            historyStep--;
            pathLayer.destroyChildren();
            requestPathSave();
        }
    }

    function redo() {
        if (historyStep < history.length - 1) {
            historyStep++;
            restorePathLayerFromJSON(history[historyStep]);
            requestPathSave();
        }
    }

    if(btnUndo) btnUndo.addEventListener('click', undo);
    if(btnRedo) btnRedo.addEventListener('click', redo);

    function restorePathLayerFromJSON(jsonStr) {
        pathLayer.destroyChildren();
        if(!jsonStr) return;
        const tempLayer = Konva.Node.create(jsonStr);
        const children = tempLayer.getChildren().slice();
        children.forEach(c => pathLayer.add(c));
        tempLayer.destroy();
    }

    // --- Clear Board ---
    if(btnClearDrawing) {
        btnClearDrawing.addEventListener('click', () => {
            if(confirm('Очистить весь рисунок и стикеры?')) {
                pathLayer.destroyChildren();
                noteLayer.destroyChildren();
                saveHistory();
                requestPathSave();
                saveBoardState();
                if(window.showToast) window.showToast('Доска очищена');
            }
        });
    }

    // --- Text Editing Binder ---
    function bindTextArea(textNode, group) {
        if(window.innerWidth < 768 && window.prompt) {
            // For small mobile screens, prompt is often safer than floating absolute input zooming issues
            const res = prompt("Редактировать текст:", textNode.text());
            if (res !== null) {
                textNode.text(res);
                saveBoardState();
            }
            return;
        }

        textNode.hide();
        const textPosition = textNode.absolutePosition();
        const areaPosition = {
            x: stage.container().offsetLeft + textPosition.x,
            y: stage.container().offsetTop + textPosition.y,
        };
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = textNode.text().replace('Дважды кликните...', '').replace('Нажмите ESC...', '');
        textarea.style.position = 'absolute';
        textarea.style.top = areaPosition.y + 'px';
        textarea.style.left = areaPosition.x + 'px';
        // Auto width based on length, min 100px
        textarea.style.width = Math.max(100, textNode.width() * stage.scaleX()) + 20 + 'px';
        textarea.style.height = Math.max(50, textNode.height() * stage.scaleY()) + 20 + 'px';
        textarea.style.fontSize = (textNode.fontSize() * stage.scaleX()) + 'px';
        textarea.style.border = '1px dashed #3b82f6';
        textarea.style.padding = '0';
        textarea.style.margin = '0';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'transparent';
        textarea.style.outline = 'none';
        textarea.style.resize = 'both';
        textarea.style.lineHeight = textNode.lineHeight();
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = textNode.align();
        textarea.style.color = textNode.fill();
        textarea.focus();

        const saveHandler = () => {
            if(textarea.parentNode) {
                if(textarea.value.trim() === '') {
                    group.destroy(); // empty text = delete
                } else {
                    textNode.text(textarea.value);
                    textNode.show();
                }
                document.body.removeChild(textarea);
                saveBoardState();
            }
        };

        textarea.addEventListener('keydown', function(e) {
            // Save on Enter (shift+enter for newline)
            if(e.keyCode === 13 && !e.shiftKey) {
                e.preventDefault();
                saveHandler();
            }
            // Save on ESC
            if(e.keyCode === 27) saveHandler();
        });

        textarea.addEventListener('blur', saveHandler);
    }

    // --- Add Free Text ---
    function addFreeText(x, y) {
        const group = new Konva.Group({
            x: x - 10,
            y: y - 10,
            draggable: true
        });

        const textNode = new Konva.Text({
            text: 'Текст...',
            fontSize: 24,
            fontFamily: 'Caveat, cursive, sans-serif',
            fill: color,
            padding: 10
        });

        const deleteBtn = new Konva.Group({ x: -10, y: -10 });
        const delCircle = new Konva.Circle({ radius: 10, fill: '#ef4444' });
        const delText = new Konva.Text({
            text: '×', x: -4, y: -6, fontSize: 14, fill: 'white', fontStyle: 'bold'
        });
        deleteBtn.add(delCircle).add(delText);
        deleteBtn.hide();

        deleteBtn.on('click touchstart', () => { group.destroy(); saveBoardState(); });
        group.on('mouseenter', () => { deleteBtn.show(); });
        group.on('mouseleave', () => { deleteBtn.hide(); });

        group.add(textNode).add(deleteBtn);
        noteLayer.add(group);

        textNode.on('dblclick dbltap', () => bindTextArea(textNode, group));
        group.on('dragend', () => saveBoardState());
        group.on('mousedown touchstart', () => group.moveToTop());

        // Immediately edit
        bindTextArea(textNode, group);
    }

    // --- Sticky Notes ---
    const colorsMap = {
        yellow: '#fef08a',
        green: '#bbf7d0',
        blue: '#bfdbfe',
        pink: '#fbcfe8'
    };

    function addStickyNote(colorKey) {
        const bgFill = colorsMap[colorKey] || colorsMap.yellow;
        const centerX = -stage.x() / stage.scaleX() + container.offsetWidth / 2 / stage.scaleX();
        const centerY = -stage.y() / stage.scaleX() + container.offsetHeight / 2 / stage.scaleX();

        const group = new Konva.Group({
            x: centerX - 75,
            y: centerY - 75,
            draggable: true
        });

        const rect = new Konva.Rect({
            width: 150,
            height: 150,
            fill: bgFill,
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOffset: { x: 5, y: 5 },
            shadowOpacity: 0.2,
            cornerRadius: 8
        });

        const textNode = new Konva.Text({
            text: 'Дважды кликните...\nНажмите ESC/Enter\nдля сохранения.',
            x: 10,
            y: 10,
            width: 130,
            height: 130,
            fontSize: 16,
            fontFamily: 'Caveat, cursive, sans-serif',
            fill: '#334155'
        });

        const deleteBtn = new Konva.Group({ x: 130, y: -10 });
        const delCircle = new Konva.Circle({ radius: 10, fill: '#ef4444' });
        const delText = new Konva.Text({
            text: '×', x: -4, y: -6, fontSize: 14, fill: 'white', fontStyle: 'bold'
        });
        deleteBtn.add(delCircle).add(delText);
        deleteBtn.hide();

        deleteBtn.on('click touchstart', () => { group.destroy(); saveBoardState(); });
        group.on('mouseenter', () => { deleteBtn.show(); });
        group.on('mouseleave', () => { deleteBtn.hide(); });

        group.add(rect).add(textNode).add(deleteBtn);
        noteLayer.add(group);

        textNode.on('dblclick dbltap', () => {
            bindTextArea(textNode, group);
        });

        group.on('dragend', () => saveBoardState());
        group.on('mousedown touchstart', () => group.moveToTop());

        window.ActivityLog?.log('note_created', { colorKey });
        saveBoardState();
        if(window.showToast) window.showToast('Стикер добавлен');
    }

    if(btnAddYellow) btnAddYellow.addEventListener('click', () => addStickyNote('yellow'));
    if(btnAddGreen) btnAddGreen.addEventListener('click', () => addStickyNote('green'));
    if(btnAddBlue) btnAddBlue.addEventListener('click', () => addStickyNote('blue'));
    if(btnAddPink) btnAddPink.addEventListener('click', () => addStickyNote('pink'));

    // --- Firestore Sync (Save/Load) ---
    stage.on('dragend', () => {
        if(stage.isDragging()) saveBoardState();
    });

    let pathSaveTimer = null;
    function requestPathSave() {
        if (pathSaveTimer) clearTimeout(pathSaveTimer);
        pathSaveTimer = setTimeout(() => {
            window.Store.saveDrawing(pathLayer.toJSON());
        }, 1000);
    }

    let boardSaveTimer = null;
    function saveBoardState() {
        if (boardSaveTimer) clearTimeout(boardSaveTimer);
        boardSaveTimer = setTimeout(() => {
            window.Store.saveBoardData({
                viewport: { x: stage.x(), y: stage.y(), zoom: stage.scaleX() },
                konvaNotes: noteLayer.toJSON()
            });
        }, 500);
    }

    async function loadData() {
        const boardData = window.Store.getBoardData();
        if(boardData) {
            if(boardData.viewport) {
                stage.x(boardData.viewport.x);
                stage.y(boardData.viewport.y);
                stage.scaleX(boardData.viewport.zoom);
                stage.scaleY(boardData.viewport.zoom);
                drawGrid();
            }
            if(boardData.konvaNotes) {
                noteLayer.destroyChildren();
                const tempLayer = Konva.Node.create(boardData.konvaNotes);
                
                tempLayer.getChildren().forEach(group => {
                    const textNode = group.getChildren((node) => node.getClassName() === 'Text')[0] || group.getChildren((node) => node.getClassName() === 'Text')[1]; // handles both sticker (rect+text) and freetext (text)
                    const deleteBtn = group.getChildren((node) => node.getClassName() === 'Group')[0];
                    
                    if(deleteBtn) {
                        deleteBtn.hide();
                        group.on('mouseenter', () => deleteBtn.show());
                        group.on('mouseleave', () => deleteBtn.hide());
                        deleteBtn.on('click touchstart', () => { group.destroy(); saveBoardState(); });
                    }
                    if(textNode) {
                        textNode.on('dblclick dbltap', () => bindTextArea(textNode, group));
                    }
                    group.on('dragend', () => saveBoardState());
                    group.on('mousedown touchstart', () => group.moveToTop());
                    noteLayer.add(group);
                });
                tempLayer.destroy();
            }
        }

        const drawingData = await window.Store.getDrawing();
        if(drawingData && drawingData.startsWith('{')) {
            restorePathLayerFromJSON(drawingData);
            saveHistory(); 
        }
    }

    setMode('pan');
    loadData();

    document.addEventListener('cloudDataSynced', () => {
        loadData();
    });
};
