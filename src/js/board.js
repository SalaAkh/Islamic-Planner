window.initBoard = function (showToast) {
    if(!window.Konva) {
        console.error('Konva is not loaded!');
        return;
    }

    const containerId = 'board-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    container.style.padding = '0';

    // Vertical Toolbar elements
    const btnPan = document.getElementById('tool-pan');
    const btnText = document.getElementById('tool-text');
    const btnSticky = document.getElementById('tool-sticky');
    const btnShape = document.getElementById('tool-shape');
    const btnArrow = document.getElementById('tool-arrow');
    const btnPencil = document.getElementById('tool-pencil');
    const btnEraser = document.getElementById('tool-eraser');
    const btnClearDrawing = document.getElementById('clear-drawing');
    const btnUndo = document.getElementById('tool-undo');
    const btnRedo = document.getElementById('tool-redo');
    const btnReset = document.getElementById('reset-board-view');

    // Context Menu elements
    const ctxMenu = document.getElementById('canvas-context-menu');
    const ctxColorIndicator = document.getElementById('ctx-color-indicator');
    const ctxFontUp = document.getElementById('ctx-font-up');
    const ctxFontDown = document.getElementById('ctx-font-down');
    const ctxFront = document.getElementById('ctx-front');
    const ctxDelete = document.getElementById('ctx-delete');

    let isPaint = false;
    let mode = 'pan'; // pan | pencil | eraser | arrow | shape | text | sticky
    let tempShape; 
    let currentColor = '#1e293b'; 
    let brushSize = 3;

    // Undo/Redo tracking for Path Layer (Freehand)
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
    const noteLayer = new Konva.Layer(); // holds stickies, free text, shapes, arrows

    stage.add(gridLayer);
    stage.add(pathLayer);
    stage.add(noteLayer);

    // Transformer for selection
    const tr = new Konva.Transformer({
        ignoreStroke: true,
        padding: 5,
        borderStroke: '#3b82f6',
        anchorStroke: '#3b82f6',
        anchorFill: '#ffffff',
        anchorSize: 10,
        rotationSnaps: [0, 90, 180, 270],
        keepRatio: false
    });
    noteLayer.add(tr);
    let selectedNode = null;

    // --- Grid Background ---
    const DOT_SPACING = 50;
    const DOT_RADIUS = 1.5;

    function drawGrid() {
        gridLayer.destroyChildren();
        const scale = stage.scaleX();
        const startX = -stage.x() / scale;
        const startY = -stage.y() / scale;
        const width = stage.width() / scale;
        const height = stage.height() / scale;

        const firstX = Math.floor(startX / DOT_SPACING) * DOT_SPACING;
        const firstY = Math.floor(startY / DOT_SPACING) * DOT_SPACING;

        const dots = [];
        for (let x = firstX; x < startX + width; x += DOT_SPACING) {
            for (let y = firstY; y < startY + height; y += DOT_SPACING) {
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

    // --- Responsive ---
    const resizeObserver = new ResizeObserver(() => {
        if(container.offsetWidth > 0 && container.offsetHeight > 0) {
            stage.width(container.offsetWidth);
            stage.height(container.offsetHeight);
            drawGrid();
            updateContextMenuPosition();
        }
    });
    resizeObserver.observe(container);

    // --- Zoom (Wheel + Pinch) ---
    const scaleBy = 1.1;
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
    function getDistance(p1, p2) { return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)); }
    function getCenter(p1, p2) { return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; }

    stage.on('touchmove', function(e) {
        e.evt.preventDefault();
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        if (touch1 && touch2) {
            if (stage.isDragging()) stage.stopDrag();
            const p1 = { x: touch1.clientX, y: touch1.clientY };
            const p2 = { x: touch2.clientX, y: touch2.clientY };

            if (!lastCenter) { lastCenter = getCenter(p1, p2); return; }
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
    stage.on('touchend', function() { lastDist = 0; lastCenter = null; });

    // --- Stage Event Handlers ---
    stage.on('dragmove zoom', () => {
        drawGrid();
        updateContextMenuPosition();
    });

    if(btnReset) {
        btnReset.addEventListener('click', () => {
            selectNode(null);
            stage.position({x:0, y:0});
            stage.scale({x:1, y:1});
            stage.fire('zoom');
            saveBoardState();
        });
    }

    // --- Selection and Context Menu Logic ---
    function updateContextMenuPosition() {
        if (!selectedNode || !ctxMenu) {
            if(ctxMenu) {
                ctxMenu.style.opacity = '0';
                ctxMenu.style.pointerEvents = 'none';
                ctxMenu.style.top = '-1000px';
            }
            return;
        }
        const box = selectedNode.getClientRect();
        const containerPos = container.getBoundingClientRect();
        
        // Calculate absolute position
        let top = containerPos.top + box.y - ctxMenu.offsetHeight - 15;
        let left = containerPos.left + box.x + box.width / 2 - ctxMenu.offsetWidth / 2;
        
        // Prevent going off-screen top
        if (top < containerPos.top + 10) top = containerPos.top + box.y + box.height + 15;

        ctxMenu.style.left = `${left}px`;
        ctxMenu.style.top = `${top}px`;
        ctxMenu.style.opacity = '1';
        ctxMenu.style.pointerEvents = 'auto';
    }

    function selectNode(node) {
        if (selectedNode === node) return;
        selectedNode = node;
        if (node) {
            tr.nodes([node]);
            tr.moveToTop();
            node.moveToTop();
            
            // Sync Color Indicator
            let nodeColor = '#000000';
            if (node.getClassName() === 'Rect') nodeColor = node.fill();
            else if (node.getClassName() === 'Arrow') nodeColor = node.stroke();
            else if (node.getClassName() === 'Group') {
                const rect = node.getChildren((n) => n.getClassName() === 'Rect')[0];
                const text = node.getChildren((n) => n.getClassName() === 'Text')[0] || node.getChildren((n) => n.getClassName() === 'Text')[1];
                if (rect) nodeColor = rect.fill();
                else if (text) nodeColor = text.fill();
            }
            if(ctxColorIndicator) {
                ctxColorIndicator.style.backgroundColor = (nodeColor === 'transparent' || !nodeColor) ? '#f8fafc' : nodeColor;
            }
            
            // Enable/Disable Font Size buttons based on node type
            const isText = node.getClassName() === 'Group' && node.getChildren((n) => n.getClassName() === 'Text').length > 0;
            ctxFontUp.style.display = isText ? 'flex' : 'none';
            ctxFontDown.style.display = isText ? 'flex' : 'none';

        } else {
            tr.nodes([]);
        }
        updateContextMenuPosition();
        stage.draw();
    }

    stage.on('click tap', (e) => {
        if (mode !== 'pan') return;
        
        // Click on empty space or grid or path (freehand lines are unselectable individually easily)
        if (e.target === stage || e.target.parent === gridLayer || e.target.parent === pathLayer) {
            selectNode(null);
            return;
        }

        // Click on transformer
        if (e.target.parent?.getClassName() === 'Transformer' || e.target.getClassName() === 'Transformer') {
            return;
        }

        let target = e.target;
        // Group logic (for stickies and text)
        if (target.parent && target.parent.getClassName() === 'Group') {
            target = target.parent;
        }

        selectNode(target);
    });

    tr.on('transform', () => updateContextMenuPosition());
    tr.on('dragmove', () => updateContextMenuPosition());
    
    // --- Context Menu Actions ---
    const colorsMap = {
        yellow: '#fef08a', green: '#bbf7d0', blue: '#bfdbfe', pink: '#fbcfe8',
        white: '#ffffff', slate: '#334155', red: '#ef4444', transparent: 'transparent'
    };

    document.querySelectorAll('.ctx-color-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!selectedNode) return;
            const colorKey = e.target.dataset.color || 'yellow';
            const color = colorsMap[colorKey] || e.target.style.backgroundColor;
            
            ctxColorIndicator.style.backgroundColor = color === 'transparent' ? '#f8fafc' : color;
            currentColor = color === 'transparent' ? '#1e293b' : color; // Also update active drawing color
            
            if (selectedNode.getClassName() === 'Rect') {
                selectedNode.fill(color);
            } else if (selectedNode.getClassName() === 'Arrow') {
                selectedNode.fill(color === 'transparent' ? '#1e293b' : color);
                selectedNode.stroke(color === 'transparent' ? '#1e293b' : color);
            } else if (selectedNode.getClassName() === 'Group') {
                const rect = selectedNode.getChildren((n) => n.getClassName() === 'Rect')[0];
                const text = selectedNode.getChildren((n) => n.getClassName() === 'Text')[0] || selectedNode.getChildren((n) => n.getClassName() === 'Text')[1];
                
                if (rect) {
                    rect.fill(color);
                } else if (text) {
                    text.fill(color === 'transparent' ? '#1e293b' : color);
                }
            }
            saveBoardState();
            stage.draw();
        });
    });

    if(ctxFontUp) ctxFontUp.addEventListener('click', () => {
        if(!selectedNode || selectedNode.getClassName() !== 'Group') return;
        const textNode = selectedNode.getChildren((n) => n.getClassName() === 'Text')[0] || selectedNode.getChildren((n) => n.getClassName() === 'Text')[1];
        if(textNode) { textNode.fontSize(textNode.fontSize() + 4); updateContextMenuPosition(); saveBoardState(); tr.forceUpdate(); }
    });
    if(ctxFontDown) ctxFontDown.addEventListener('click', () => {
        if(!selectedNode || selectedNode.getClassName() !== 'Group') return;
        const textNode = selectedNode.getChildren((n) => n.getClassName() === 'Text')[0] || selectedNode.getChildren((n) => n.getClassName() === 'Text')[1];
        if(textNode) { textNode.fontSize(Math.max(8, textNode.fontSize() - 4)); updateContextMenuPosition(); saveBoardState(); tr.forceUpdate(); }
    });
    if(ctxFront) ctxFront.addEventListener('click', () => {
        if(selectedNode) { selectedNode.moveToTop(); tr.moveToTop(); saveBoardState(); stage.draw(); updateContextMenuPosition(); }
    });
    if(ctxDelete) ctxDelete.addEventListener('click', () => {
        if(selectedNode) {
            const node = selectedNode;
            selectNode(null);
            node.destroy();
            saveBoardState();
            stage.draw();
        }
    });

    // --- Tools Logic (Creation Bar) ---
    function setMode(newMode) {
        mode = newMode;
        selectNode(null); // Deselect when switching tools
        
        [btnPan, btnText, btnSticky, btnShape, btnArrow, btnPencil, btnEraser].forEach(b => b && b.classList.remove('tool-active'));
        if (mode === 'pan' && btnPan) btnPan.classList.add('tool-active');
        if (mode === 'text' && btnText) btnText.classList.add('tool-active');
        if (mode === 'sticky' && btnSticky) btnSticky.classList.add('tool-active');
        if (mode === 'shape' && btnShape) btnShape.classList.add('tool-active');
        if (mode === 'arrow' && btnArrow) btnArrow.classList.add('tool-active');
        if (mode === 'pencil' && btnPencil) btnPencil.classList.add('tool-active');
        if (mode === 'eraser' && btnEraser) btnEraser.classList.add('tool-active');

        if(mode === 'pan') {
            stage.draggable(true);
            container.style.cursor = 'grab';
        } else if (mode === 'text' || mode === 'sticky') {
            stage.draggable(false);
            container.style.cursor = 'crosshair';
        } else {
            stage.draggable(false);
            container.style.cursor = 'crosshair';
        }
    }

    if(btnPan) btnPan.addEventListener('click', () => setMode('pan'));
    if(btnText) btnText.addEventListener('click', () => setMode('text'));
    if(btnSticky) btnSticky.addEventListener('click', () => setMode('sticky'));
    if(btnShape) btnShape.addEventListener('click', () => setMode('shape'));
    if(btnArrow) btnArrow.addEventListener('click', () => setMode('arrow'));
    if(btnPencil) btnPencil.addEventListener('click', () => setMode('pencil'));
    if(btnEraser) btnEraser.addEventListener('click', () => setMode('eraser'));

    // --- Drawing Events ---
    stage.on('mousedown touchstart', function(e) {
        if(mode === 'pan') return;
        
        // Prevent drawing/creation if interacting with menus or transformer
        if(e.target.getClassName() === 'Transformer' || e.target.parent?.getClassName() === 'Transformer') return;

        const pos = stage.getRelativePointerPosition();

        if (mode === 'text') {
            addFreeText(pos.x, pos.y);
            setMode('pan'); 
            return;
        }
        if (mode === 'sticky') {
            addStickyNote('yellow', pos.x, pos.y);
            setMode('pan');
            return;
        }

        isPaint = true;
        
        if (mode === 'pencil' || mode === 'eraser') {
            tempShape = new Konva.Line({
                stroke: mode === 'eraser' ? 'white' : currentColor,
                strokeWidth: mode === 'eraser' ? brushSize * 5 : brushSize,
                globalCompositeOperation: mode === 'eraser' ? 'destination-out' : 'source-over',
                lineCap: 'round',
                lineJoin: 'round',
                points: [pos.x, pos.y],
                listening: false, // unselectable
            });
            pathLayer.add(tempShape);
        } else if (mode === 'arrow') {
            tempShape = new Konva.Arrow({
                points: [pos.x, pos.y, pos.x, pos.y],
                pointerLength: 15,
                pointerWidth: 15,
                fill: currentColor,
                stroke: currentColor,
                strokeWidth: 3,
                draggable: true,
                name: 'ArrowNode'
            });
            noteLayer.add(tempShape);
        } else if (mode === 'shape') {
            tempShape = new Konva.Rect({
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                fill: 'transparent',
                stroke: currentColor,
                strokeWidth: 3,
                cornerRadius: 8,
                draggable: true,
                name: 'RectNode'
            });
            noteLayer.add(tempShape);
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

    stage.on('mouseup touchend', function() {
        if(isPaint) {
            isPaint = false;
            if (mode === 'shape' || mode === 'arrow') {
                selectNode(tempShape);
                setMode('pan');
                saveBoardState();
            } else {
                saveHistory();
                requestPathSave();
            }
        }
    });

    // --- Undo / Redo (Only for Path Layer) ---
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

    if(btnClearDrawing) {
        btnClearDrawing.addEventListener('click', () => {
            if(confirm('Очистить весь холст? Внимание, удалятся все фигуры и стикеры!')) {
                selectNode(null);
                pathLayer.destroyChildren();
                noteLayer.destroyChildren();
                tr.nodes([]);
                noteLayer.add(tr);
                saveHistory();
                requestPathSave();
                saveBoardState();
                if(window.showToast) window.showToast('Холст очищен');
            }
        });
    }

    // --- Text Editing Binder ---
    function bindTextArea(textNode, group) {
        if(window.innerWidth < 768 && window.prompt) {
            const res = prompt("Редактировать текст:", textNode.text());
            if (res !== null) { textNode.text(res); saveBoardState(); }
            return;
        }

        textNode.hide();
        tr.hide(); 
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
        textarea.style.color = textNode.fill() === 'transparent' ? '#1e293b' : textNode.fill();
        textarea.style.zIndex = '1000';
        textarea.focus();

        const saveHandler = () => {
            if(textarea.parentNode) {
                if(textarea.value.trim() === '') {
                    // Empty text - don't destroy if it has a shape background (sticky)
                    if (group.getChildren((n) => n.getClassName() === 'Rect').length === 0) {
                        group.destroy(); 
                        selectNode(null);
                    } else {
                        textNode.text('');
                        textNode.show();
                    }
                } else {
                    textNode.text(textarea.value);
                    textNode.show();
                }
                tr.show();
                document.body.removeChild(textarea);
                saveBoardState();
                tr.forceUpdate();
            }
        };

        textarea.addEventListener('keydown', function(e) {
            if(e.keyCode === 13 && !e.shiftKey) { e.preventDefault(); saveHandler(); }
            if(e.keyCode === 27) saveHandler();
        });
        textarea.addEventListener('blur', saveHandler);
    }

    // --- Creating Objects ---
    function addFreeText(x, y) {
        const group = new Konva.Group({ x, y, draggable: true });
        const textNode = new Konva.Text({
            text: 'Текст...',
            fontSize: 24,
            fontFamily: 'Caveat, cursive, sans-serif',
            fill: currentColor,
            padding: 10
        });

        group.add(textNode);
        noteLayer.add(group);

        textNode.on('dblclick dbltap', () => bindTextArea(textNode, group));
        group.on('dragend', () => saveBoardState());

        selectNode(group);
        bindTextArea(textNode, group); // Edit immediately
    }

    function addStickyNote(colorKey, startX, startY) {
        const bgFill = colorsMap[colorKey] || colorsMap.yellow;
        const x = startX !== undefined ? startX : -stage.x() / stage.scaleX() + container.offsetWidth / 2 / stage.scaleX() - 75;
        const y = startY !== undefined ? startY : -stage.y() / stage.scaleX() + container.offsetHeight / 2 / stage.scaleX() - 75;

        const group = new Konva.Group({ x, y, draggable: true });

        const rect = new Konva.Rect({
            width: 150, height: 150,
            fill: bgFill,
            shadowColor: 'black', shadowBlur: 10, shadowOffset: { x: 5, y: 5 }, shadowOpacity: 0.1,
            cornerRadius: 4
        });

        const textNode = new Konva.Text({
            text: 'Дважды кликните...',
            x: 10, y: 10, width: 130, height: 130,
            fontSize: 18,
            fontFamily: 'Caveat, cursive, sans-serif',
            fill: '#334155'
        });

        group.add(rect).add(textNode);
        noteLayer.add(group);

        textNode.on('dblclick dbltap', () => bindTextArea(textNode, group));
        group.on('dragend', () => saveBoardState());

        selectNode(group);
        window.ActivityLog?.log('note_created', { colorKey });
        saveBoardState();
    }

    // --- Sync Save/Load ---
    let pathSaveTimer = null;
    function requestPathSave() {
        if (pathSaveTimer) clearTimeout(pathSaveTimer);
        pathSaveTimer = setTimeout(() => { window.Store.saveDrawing(pathLayer.toJSON()); }, 1000);
    }

    let boardSaveTimer = null;
    function saveBoardState() {
        if (boardSaveTimer) clearTimeout(boardSaveTimer);
        const trNode = tr;
        trNode.nodes([]); // temporarily clear selection
        boardSaveTimer = setTimeout(() => {
            window.Store.saveBoardData({
                viewport: { x: stage.x(), y: stage.y(), zoom: stage.scaleX() },
                konvaNotes: noteLayer.toJSON()
            });
            if (selectedNode) trNode.nodes([selectedNode]); // restore selection
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
                noteLayer.add(tr); // Re-add transformer
                const tempLayer = Konva.Node.create(boardData.konvaNotes);
                
                tempLayer.getChildren().forEach(blob => {
                    if (blob.getClassName() === 'Transformer') return; // skip saved transform states
                    const node = blob.clone();
                    
                    if (node.getClassName() === 'Group') {
                        const textNode = node.getChildren((n) => n.getClassName() === 'Text')[0] || node.getChildren((n) => n.getClassName() === 'Text')[1];
                        if(textNode) textNode.on('dblclick dbltap', () => bindTextArea(textNode, node));
                        node.on('dragend', () => saveBoardState());
                    } else if (node.getClassName() === 'Rect' || node.getClassName() === 'Arrow') {
                        node.on('dragend', () => saveBoardState());
                    }
                    
                    noteLayer.add(node);
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

    document.addEventListener('cloudDataSynced', () => loadData());
};
