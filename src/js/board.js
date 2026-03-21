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
    let boardEditorCounter = 0;

    // Helper to safely clear noteLayer without destroying the Transformer
    function clearNoteLayer() {
        const children = noteLayer.getChildren().slice();
        children.forEach(child => {
            if (child.getClassName() !== 'Transformer') {
                child.destroy();
            }
        });
    }

    // Guard: when a node that is being transformed gets destroyed mid-drag
    // Konva fires _drag → _fireAndBubble → setAttrs on a null child → crash.
    // Attaching a safe boundBoxFunc prevents this.
    tr.boundBoxFunc((oldBox, newBox) => {
        // If the attached node is gone, just return the old box
        try { return newBox; } catch(e) { return oldBox; }
    });
    // Patch: detach transformer if its node has been destroyed
    stage.on('dragstart', () => {
        const nodes = tr.nodes();
        const valid = nodes.filter(n => n.getStage && n.getStage() === stage);
        if (valid.length !== nodes.length) tr.nodes(valid);
    });

    function isNodeAttachedToStage(node) {
        return !!node && typeof node.getStage === 'function' && node.getStage() === stage;
    }

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
    const colorsMap = {
        yellow: '#fef08a', green: '#bbf7d0', blue: '#bfdbfe', pink: '#fbcfe8',
        orange: '#fde68a', white: '#ffffff', slate: '#334155', red: '#ef4444', transparent: 'transparent'
    };

    function updateContextMenuPosition() {
        if (!isNodeAttachedToStage(selectedNode) || !ctxMenu) {
            if (!isNodeAttachedToStage(selectedNode)) {
                selectedNode = null;
                tr.nodes([]);
            }
            if(ctxMenu) {
                ctxMenu.style.opacity = '0';
                ctxMenu.style.pointerEvents = 'none';
                ctxMenu.style.top = '-1000px';
            }
            return;
        }
        const box = selectedNode.getClientRect();
        const containerPos = container.getBoundingClientRect();
        // Account for offsetParent to fix position when ctxMenu is inside a relative container
        const parentRect = ctxMenu.offsetParent?.getBoundingClientRect() || { top: 0, left: 0 };
        
        let top = containerPos.top + box.y - ctxMenu.offsetHeight - 15 - parentRect.top;
        let left = containerPos.left + box.x + box.width / 2 - ctxMenu.offsetWidth / 2 - parentRect.left;
        
        // Prevent going off-screen top
        if (top < 10) top = containerPos.top + box.y + box.height + 15 - parentRect.top;

        ctxMenu.style.left = `${left}px`;
        ctxMenu.style.top = `${top}px`;
        ctxMenu.style.opacity = '1';
        ctxMenu.style.pointerEvents = 'auto';
    }


    function selectNode(node) {
        const nextNode = isNodeAttachedToStage(node) ? node : null;
        if (selectedNode === nextNode) return;
        selectedNode = nextNode;
        if (node) {
            // FIX #1: Move the selected node to top of noteLayer first,
            // then move transformer on top of it — all within noteLayer only.
            // This prevents z-order conflict between noteLayer and pathLayer.
            selectedNode.moveToTop();
            tr.nodes([selectedNode]);
            tr.moveToTop(); // tr is in noteLayer, so this is safe
            
            // Sync selected node color to visually highlight current color
            let nodeColor = '#fef08a';
            if (selectedNode.getClassName() === 'Rect') nodeColor = selectedNode.fill();
            else if (selectedNode.getClassName() === 'Arrow') nodeColor = selectedNode.stroke();
            else if (selectedNode.getClassName() === 'Group') {
                const rect = selectedNode.getChildren((n) => n.getClassName() === 'Rect')[0];
                const text = selectedNode.getChildren((n) => n.getClassName() === 'Text')[0] || selectedNode.getChildren((n) => n.getClassName() === 'Text')[1];
                if (rect) nodeColor = rect.fill();
                else if (text) nodeColor = text.fill();
            }
            // Highlight the matching swatch
            document.querySelectorAll('.ctx-color-option').forEach(sw => {
                const swColor = sw.style.backgroundColor;
                const matches = nodeColor && swColor && (swColor === nodeColor || 
                    colorsMap[sw.dataset.color] === nodeColor);
                sw.style.borderColor = matches ? '#6366f1' : 'transparent';
                sw.style.transform = matches ? 'scale(1.2)' : '';
            });
            
            // Enable/Disable Font Size buttons based on node type
            const isText = node.getClassName() === 'Group' && node.getChildren((n) => n.getClassName() === 'Text').length > 0;
            if (ctxFontUp) ctxFontUp.style.display = isText ? 'flex' : 'none';
            if (ctxFontDown) ctxFontDown.style.display = isText ? 'flex' : 'none';

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

    document.querySelectorAll('.ctx-color-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!selectedNode) return;
            const colorKey = e.target.closest('[data-color]')?.dataset.color || 'yellow';
            const color = colorsMap[colorKey] || e.target.style.backgroundColor;
            
            currentColor = (color === 'transparent') ? '#1e293b' : color;
            
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
    // btnShape handled inside initShapePicker (opens picker, not setMode directly)
    if(btnArrow) btnArrow.addEventListener('click', () => setMode('arrow'));
    if(btnPencil) btnPencil.addEventListener('click', () => setMode('pencil'));
    if(btnEraser) btnEraser.addEventListener('click', () => setMode('eraser'));
    // Expose setMode globally so shape picker can use it
    window.board_setMode = setMode;

    // --- Shape Picker Init ---
    (function initShapePicker() {
        const shapeIcons = {
            rect: 'far fa-square', circle: 'far fa-circle', ellipse: 'fas fa-egg',
            triangle: 'fas fa-caret-up', star: 'far fa-star',
            pentagon: 'fas fa-draw-polygon', hexagon: 'fas fa-draw-polygon', diamond: 'far fa-gem'
        };
        window._activeShapeType = window._activeShapeType || 'rect';
        const picker = document.getElementById('shape-picker');
        const shapeBtn = document.getElementById('tool-shape');
        const shapeIcon = document.getElementById('tool-shape-icon');
        if (!picker || !shapeBtn) return;

        // Clicking the shape button just opens the picker
        shapeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            picker.classList.toggle('hidden');
        });

        document.querySelectorAll('.shape-pick-btn').forEach(function(pb) {
            pb.addEventListener('click', function(e) {
                e.stopPropagation();
                window._activeShapeType = pb.dataset.shape;
                const ic = shapeIcons[pb.dataset.shape];
                if (ic && shapeIcon) shapeIcon.className = ic;
                picker.classList.add('hidden');
                setMode('shape');
            });
        });

        // Close picker on outside click
        document.addEventListener('click', function() {
            picker.classList.add('hidden');
        });
    })();

    // --- Keyboard Shortcuts ---
    // FIX: Remove any previously registered board keyboard handler to prevent duplicates
    // when the board is re-initialized (e.g. navigating away and back).
    if (window._boardKeyHandler) {
        document.removeEventListener('keydown', window._boardKeyHandler);
        window._boardKeyHandler = null;
    }

    function handleBoardKeys(e) {
        // Don't trigger when typing in inputs/textareas/contenteditable
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isEditing = tag === 'input' || tag === 'textarea' || document.activeElement.isContentEditable;

        if (e.ctrlKey || e.metaKey) {
            if (e.code === 'KeyZ' || (e.key && e.key.toLowerCase() === 'z')) {
                if (!isEditing) { e.preventDefault(); undo(); }
                return;
            }
            if (e.code === 'KeyY' || (e.key && e.key.toLowerCase() === 'y')) {
                if (!isEditing) { e.preventDefault(); redo(); }
                return;
            }
        }
        if (isEditing) return;

        const code = e.code || '';
        const key = (e.key || '').toLowerCase();

        if (code === 'KeyV' || key === 'v') setMode('pan');
        else if (code === 'KeyT' || key === 't') setMode('text');
        else if (code === 'KeyN' || key === 'n') setMode('sticky');
        else if (code === 'KeyS' || key === 's') setMode('shape');
        else if (code === 'KeyA' || key === 'a') setMode('arrow');
        else if (code === 'KeyP' || key === 'p') setMode('pencil');
        else if (code === 'KeyE' || key === 'e') setMode('eraser');
        else if (code === 'Escape' || key === 'escape') setMode('pan');
    }
    document.addEventListener('keydown', handleBoardKeys);
    // Store cleanup ref so we can remove it if board is destroyed
    window._boardKeyHandler = handleBoardKeys;


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
                stroke: mode === 'eraser' ? 'rgba(0,0,0,1)' : currentColor,
                strokeWidth: mode === 'eraser' ? brushSize * 8 : brushSize,
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
            const shapeType = window._activeShapeType || 'rect';
            if (shapeType === 'circle') {
                tempShape = new Konva.Circle({
                    x: pos.x, y: pos.y, radius: 0,
                    fill: 'transparent', stroke: currentColor, strokeWidth: 3,
                    draggable: true, name: 'CircleNode'
                });
            } else if (shapeType === 'ellipse') {
                tempShape = new Konva.Ellipse({
                    x: pos.x, y: pos.y, radiusX: 0, radiusY: 0,
                    fill: 'transparent', stroke: currentColor, strokeWidth: 3,
                    draggable: true, name: 'EllipseNode'
                });
            } else if (shapeType === 'triangle') {
                tempShape = new Konva.RegularPolygon({
                    x: pos.x, y: pos.y, sides: 3, radius: 0,
                    fill: 'transparent', stroke: currentColor, strokeWidth: 3,
                    draggable: true, name: 'TriangleNode'
                });
            } else if (shapeType === 'star') {
                tempShape = new Konva.Star({
                    x: pos.x, y: pos.y, numPoints: 5, innerRadius: 0, outerRadius: 0,
                    fill: 'transparent', stroke: currentColor, strokeWidth: 3,
                    draggable: true, name: 'StarNode'
                });
            } else if (shapeType === 'pentagon') {
                tempShape = new Konva.RegularPolygon({
                    x: pos.x, y: pos.y, sides: 5, radius: 0,
                    fill: 'transparent', stroke: currentColor, strokeWidth: 3,
                    draggable: true, name: 'PentagonNode'
                });
            } else if (shapeType === 'hexagon') {
                tempShape = new Konva.RegularPolygon({
                    x: pos.x, y: pos.y, sides: 6, radius: 0,
                    fill: 'transparent', stroke: currentColor, strokeWidth: 3,
                    draggable: true, name: 'HexagonNode'
                });
            } else if (shapeType === 'diamond') {
                tempShape = new Konva.RegularPolygon({
                    x: pos.x, y: pos.y, sides: 4, radius: 0,
                    fill: 'transparent', stroke: currentColor, strokeWidth: 3,
                    draggable: true, name: 'DiamondNode',
                    rotation: 45
                });
            } else {
                tempShape = new Konva.Rect({
                    x: pos.x, y: pos.y, width: 0, height: 0,
                    fill: 'transparent', stroke: currentColor, strokeWidth: 3,
                    cornerRadius: 8, draggable: true, name: 'RectNode'
                });
            }
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
            const shapeType = window._activeShapeType || 'rect';
            if (shapeType === 'circle') {
                const r = Math.sqrt(Math.pow(pos.x - tempShape.x(),2) + Math.pow(pos.y - tempShape.y(),2));
                tempShape.radius(r);
            } else if (shapeType === 'ellipse') {
                tempShape.radiusX(Math.abs(pos.x - tempShape.x()));
                tempShape.radiusY(Math.abs(pos.y - tempShape.y()));
            } else if (['triangle','pentagon','hexagon','diamond'].includes(shapeType)) {
                const r = Math.sqrt(Math.pow(pos.x - tempShape.x(),2) + Math.pow(pos.y - tempShape.y(),2));
                tempShape.radius(r);
            } else if (shapeType === 'star') {
                const r = Math.sqrt(Math.pow(pos.x - tempShape.x(),2) + Math.pow(pos.y - tempShape.y(),2));
                tempShape.outerRadius(r);
                tempShape.innerRadius(r * 0.45);
            } else {
                tempShape.width(pos.x - tempShape.x());
                tempShape.height(pos.y - tempShape.y());
            }
        }
    });

    stage.on('mouseup touchend', function() {
        if(isPaint) {
            isPaint = false;
            if (mode === 'shape' || mode === 'arrow') {
                // FIX #3: Don't save zero-size shapes to history (accidental click without drag)
                let isValid = true;
                if (tempShape) {
                    const cls = tempShape.getClassName();
                    if (cls === 'Rect') isValid = Math.abs(tempShape.width()) > 5 || Math.abs(tempShape.height()) > 5;
                    else if (cls === 'Circle') isValid = tempShape.radius() > 3;
                    else if (cls === 'Ellipse') isValid = tempShape.radiusX() > 3 || tempShape.radiusY() > 3;
                    else if (cls === 'RegularPolygon' || cls === 'Star') isValid = (tempShape.radius ? tempShape.radius() : tempShape.outerRadius()) > 5;
                    else if (cls === 'Arrow') {
                        const pts = tempShape.points();
                        const dx = pts[2] - pts[0], dy = pts[3] - pts[1];
                        isValid = Math.sqrt(dx*dx + dy*dy) > 10;
                    }
                }
                if (!isValid && tempShape) {
                    tempShape.destroy();
                    tempShape = null;
                    return;
                }
                selectNode(tempShape);
                setMode('pan');
                saveBoardState();
                saveHistory();
            } else {
                saveHistory();
                requestPathSave();
            }
        }
    });

    // --- Undo / Redo (Full Board State: pathLayer + noteLayer) ---
    function saveHistory() {
        // Clear transformer selection before serializing to avoid stale Transformer nodes in JSON
        const prevSelected = selectedNode;
        tr.nodes([]);
        historyStep++;
        history.splice(historyStep);
        history.push({
            path: pathLayer.toJSON(),
            notes: noteLayer.toJSON()
        });
        // Restore selection after snapshot
        if (isNodeAttachedToStage(prevSelected)) {
            tr.nodes([prevSelected]);
            tr.moveToTop();
        }
    }

    function undo() {
        selectNode(null); // clear stale refs before restoring
        if (historyStep > 0) {
            historyStep--;
            const snap = history[historyStep];
            restorePathLayerFromJSON(snap.path);
            restoreNoteLayerFromJSON(snap.notes);
            requestPathSave();
            saveBoardState();
            stage.draw();
        } else if (historyStep === 0) {
            // FIX: was decrementing to -1 but never clearing canvas. Now clears and stays at 0.
            pathLayer.destroyChildren();
            clearNoteLayer();
            requestPathSave();
            saveBoardState();
            stage.draw();
            // Do NOT decrement historyStep below 0 — keep it at 0 (empty-board snapshot)
        }
    }

    function redo() {
        if (historyStep < history.length - 1) {
            selectNode(null);
            historyStep++;
            const snap = history[historyStep];
            restorePathLayerFromJSON(snap.path);
            restoreNoteLayerFromJSON(snap.notes);
            requestPathSave();
            saveBoardState();
            stage.draw();
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

    function restoreNoteLayerFromJSON(jsonStr) {
        selectNode(null);
        clearNoteLayer();
        if (!jsonStr) return;
        const tempLayer = Konva.Node.create(jsonStr);
        tempLayer.getChildren().forEach(blob => {
            if (blob.getClassName() === 'Transformer') return;
            const node = blob.clone();
            // FIX: ensure nodes restored from history are draggable and listening
            node.draggable(true);
            node.listening(true);
            if (node.getClassName() === 'Group') {
                // Re-attach dblclick to ALL text nodes inside groups
                node.getChildren(n => n.getClassName() === 'Text').forEach(textNode => {
                    textNode.on('dblclick dbltap', () => bindTextArea(textNode, node));
                });
                node.on('dragend', () => { saveBoardState(); saveHistory(); });
            } else if (node.getClassName() === 'Rect' || node.getClassName() === 'Arrow' ||
                       node.getClassName() === 'Circle' || node.getClassName() === 'Ellipse' ||
                       node.getClassName() === 'RegularPolygon' || node.getClassName() === 'Star') {
                node.on('dragend', () => { saveBoardState(); saveHistory(); });
            }
            noteLayer.add(node);
        });
        tempLayer.destroy();
    }


    if(btnClearDrawing) {
        btnClearDrawing.addEventListener('click', () => {
            if(confirm('Очистить весь холст? Внимание, удалятся все фигуры и стикеры!')) {
                selectNode(null);
                pathLayer.destroyChildren();
                clearNoteLayer();
                tr.nodes([]);
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

        // FIX #2: Accurate textarea position at any zoom level.
        // absolutePosition() returns coords in the Konva canvas coordinate space
        // (already accounting for stage pan & zoom). We convert to viewport pixel
        // position by adding the canvas element's bounding rect.
        const stageCanvasEl = stage.content.querySelector('canvas');
        const canvasRect = stageCanvasEl
            ? stageCanvasEl.getBoundingClientRect()
            : container.getBoundingClientRect();
        const absPos = textNode.absolutePosition();
        const scale = stage.scaleX();

        // absolutePosition() is in stage pixel coords (includes pan+zoom transform),
        // so we just need to add the canvas element's viewport offset.
        const left = canvasRect.left + absPos.x;
        const top  = canvasRect.top  + absPos.y;

        const textarea = document.createElement('textarea');
        const editorId = `board-text-editor-${++boardEditorCounter}`;
        textarea.id = editorId;
        textarea.name = editorId;
        textarea.setAttribute('aria-label', 'Board text editor');
        document.body.appendChild(textarea);

        const nodeW = Math.max(100, textNode.width()  * scale);
        const nodeH = Math.max(40,  textNode.height() * scale);
        const fontSize = Math.max(12, textNode.fontSize() * scale);

        // Strip placeholder text
        textarea.value = textNode.text()
            .replace('Дважды кликните...', '')
            .replace('Нажмите ESC...', '')
            .replace('Текст...', '');

        Object.assign(textarea.style, {
            position:        'fixed',
            left:            left + 'px',
            top:             top + 'px',
            width:           nodeW + 'px',
            minHeight:       nodeH + 'px',
            fontSize:        fontSize + 'px',
            fontFamily:      textNode.fontFamily(),
            lineHeight:      '1.4',
            color:           textNode.fill() === 'transparent' ? '#1e293b' : textNode.fill(),
            border:          '2px dashed #3b82f6',
            borderRadius:    '4px',
            padding:         Math.round((textNode.padding() || 0) * scale) + 'px',
            margin:          '0',
            overflow:        'hidden',
            background:      'transparent',
            outline:         'none',
            resize:          'none',
            textAlign:       textNode.align() || 'left',
            transformOrigin: 'left top',
            zIndex:          '10001',
            boxSizing:       'border-box',
        });
        textarea.focus();
        textarea.select();

        // Auto-grow height
        function autoGrow() {
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(nodeH, textarea.scrollHeight) + 'px';
        }
        textarea.addEventListener('input', autoGrow);
        autoGrow();

        let isSaving = false;
        let isClosed = false;

        const cleanupTextarea = () => {
            if (isClosed) return;
            isClosed = true;
            textarea.removeEventListener('input', autoGrow);
            textarea.removeEventListener('keydown', handleKeydown);
            textarea.removeEventListener('blur', saveHandler);
            textarea.remove();
        };

        const saveHandler = () => {
            if (isSaving || isClosed) return;
            isSaving = true;
            try {
                if(textarea.value.trim() === '') {
                    if (group.getChildren((n) => n.getClassName() === 'Rect').length === 0) {
                        if (selectedNode === group) selectNode(null);
                        group.destroy();
                    } else {
                        textNode.text('');
                        textNode.show();
                    }
                } else {
                    textNode.text(textarea.value);
                    textNode.show();
                }
                tr.show();
                cleanupTextarea();
                saveBoardState();
                if (tr.nodes().length > 0) tr.forceUpdate();
                stage.draw();
            } catch(e) {
                console.warn('[Board] saveHandler error:', e.message);
            } finally {
                isSaving = false;
            }
        };

        function handleKeydown(e) {
            if(e.keyCode === 13 && !e.shiftKey) { e.preventDefault(); saveHandler(); }
            if(e.keyCode === 27) saveHandler();
        }
        textarea.addEventListener('keydown', handleKeydown);
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
        group.on('dragend', () => { saveBoardState(); saveHistory(); });

        selectNode(group);
        bindTextArea(textNode, group); // Edit immediately
        saveHistory();
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
        group.on('dragend', () => { saveBoardState(); saveHistory(); });

        selectNode(group);
        window.ActivityLog?.log('note_created', { colorKey });
        saveBoardState();
        saveHistory();
    }

    // --- Sync Save/Load ---
    let pathSaveTimer = null;
    function requestPathSave() {
        if (pathSaveTimer) clearTimeout(pathSaveTimer);
        pathSaveTimer = setTimeout(() => { window.Store.saveDrawing(pathLayer.toJSON(), window.currentBoardId || 'main_board'); }, 1000);
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
            }, window.currentBoardId || 'main_board');
            if (isNodeAttachedToStage(selectedNode)) trNode.nodes([selectedNode]); // restore selection
            else selectedNode = null;
        }, 500);
    }

    async function loadData() {
        const boardData = window.Store.getBoardData(window.currentBoardId || 'main_board');
        selectNode(null);
        if(boardData) {
            if(boardData.viewport) {
                stage.x(boardData.viewport.x);
                stage.y(boardData.viewport.y);
                stage.scaleX(boardData.viewport.zoom);
                stage.scaleY(boardData.viewport.zoom);
                drawGrid();
            }
            if(boardData.konvaNotes) {
                clearNoteLayer();
                const tempLayer = Konva.Node.create(boardData.konvaNotes);
                
                tempLayer.getChildren().forEach(blob => {
                    if (blob.getClassName() === 'Transformer') return; // skip saved transform states
                    const node = blob.clone();
                    
                    if (node.getClassName() === 'Group') {
                        // Re-attach dblclick to all text children, not just first
                        node.getChildren(n => n.getClassName() === 'Text').forEach(textNode => {
                            textNode.on('dblclick dbltap', () => bindTextArea(textNode, node));
                        });
                        node.on('dragend', () => { saveBoardState(); saveHistory(); });
                    } else if (node.getClassName() === 'Rect' || node.getClassName() === 'Arrow' ||
                               node.getClassName() === 'Circle' || node.getClassName() === 'Ellipse' ||
                               node.getClassName() === 'RegularPolygon' || node.getClassName() === 'Star') {
                        node.on('dragend', () => { saveBoardState(); saveHistory(); });
                    }
                    
                    noteLayer.add(node);
                });
                tempLayer.destroy();
            } else {
                clearNoteLayer();
            }
        } else {
            clearNoteLayer();
        }

        const drawingData = await window.Store.getDrawing(window.currentBoardId || 'main_board');
        if(drawingData && drawingData.startsWith('{')) {
            restorePathLayerFromJSON(drawingData);
        } else {
            pathLayer.destroyChildren();
        }
        // FIX: Save initial state as history[0] (the starting snapshot).
        // Reset history so Ctrl+Z always has a clean baseline to return to.
        history.length = 0;
        historyStep = -1;
        saveHistory(); // snapshot index 0 = initial loaded state
    }
    document.addEventListener('loadSpecificBoard', loadData);

    setMode('pan');
    loadData();

    document.addEventListener('cloudDataSynced', () => loadData());
};

// --- MIRO DASHBOARD LOGIC ---
window.initBoardsDashboard = function() {
    const tableBody = document.getElementById('boards-table-body');
    if (!tableBody) return;
    
    const boards = window.Store.getBoardsMeta();
    tableBody.innerHTML = '';
    
    const lang = localStorage.getItem('barakah_lang') || 'en';
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    
    boards.forEach(board => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group';
        
        let formattedDate = board.lastOpened;
        try {
            const dateObj = new Date(board.lastOpened);
            const daysDiff = Math.abs(Math.round((dateObj - new Date()) / (1000 * 60 * 60 * 24)));
            formattedDate = daysDiff < 7 ? rtf.format(-daysDiff, 'day') : dateObj.toLocaleDateString(lang);
        } catch(e){}
        
        const owner = board.owner || 'You';
        
        tr.innerHTML = `
            <td class="p-4">
                <div class="flex items-center gap-3 cursor-pointer" onclick="openBoard('${board.id}')">
                    <img src="https://mirostatic.com/board-image-assets/20250610/112x112/board_icon_${board.thumbnail || 1}.png" class="w-8 h-8 object-contain">
                    <span class="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">${board.name}</span>
                </div>
            </td>
            <td class="p-4 text-gray-500">${owner}</td>
            <td class="p-4 text-gray-500 cursor-pointer" onclick="openBoard('${board.id}')">${formattedDate}</td>
            <td class="p-4">
                <button class="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 disabled:hover:bg-transparent" title="Delete" onclick="deleteBoard('${board.id}')" ${board.id === 'main_board' ? 'disabled' : ''}>
                    <i class="fas fa-trash-alt hover:text-red-500"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.openBoard = function(boardId) {
    window.currentBoardId = boardId;
    
    // Update lastOpened and Title
    const boards = window.Store.getBoardsMeta();
    const meta = boards.find(b => b.id === boardId);
    if(meta) {
        meta.lastOpened = new Date().toISOString();
        window.Store.saveBoardsMeta(boards);
        document.getElementById('board-thumbnail-img').src = `https://mirostatic.com/board-image-assets/20250610/112x112/board_icon_${meta.thumbnail || 1}.png`;
        const titleEl = document.getElementById('board-title-text');
        if (titleEl) titleEl.innerText = meta.name;
    }

    const viewsBoards = document.getElementById('view-boards');
    const boardView = document.getElementById('view-board');
    
    viewsBoards.classList.remove('active', 'page-flip-in');
    viewsBoards.classList.add('page-flip-out');
    
    setTimeout(() => {
        viewsBoards.classList.add('hidden');
        viewsBoards.classList.remove('page-flip-out');
        
        boardView.classList.remove('hidden');
        boardView.classList.add('active', 'page-flip-in');
        
        document.getElementById('btn-back-to-boards').classList.remove('hidden');
        
        // Show the creation toolbar
        const creationBar = document.getElementById('miro-creation-bar');
        if (creationBar) {
            creationBar.classList.remove('hidden');
            creationBar.style.display = 'flex';
        }
        
        if(!window._boardInitialized) {
            window.initBoard(window.showToast);
            window._boardInitialized = true;
        } else {
            document.dispatchEvent(new CustomEvent('loadSpecificBoard'));
        }
    }, 550);
}

window.deleteBoard = function(boardId) {
    if(boardId === 'main_board') return;
    if(confirm((window.t && window.t('delete_board_confirm')) || 'Are you sure you want to delete this board?')) {
        let boards = window.Store.getBoardsMeta();
        boards = boards.filter(b => b.id !== boardId);
        window.Store.saveBoardsMeta(boards);
        
        localStorage.removeItem('barakah_board_state_' + boardId);
        window.Store.clearDrawing(boardId);
        if (window.DbSync) window.DbSync.syncToCloud('board_state_' + boardId, { deleted: true });
        
        initBoardsDashboard();
    }
}

function initDashboardEvents() {
    document.getElementById('btn-create-board')?.addEventListener('click', () => {
        const id = 'board_' + Date.now();
        const boards = window.Store.getBoardsMeta();
        boards.unshift({
            id,
            name: 'Untitled board',
            lastOpened: new Date().toISOString(),
            owner: 'You',
            thumbnail: Math.floor(Math.random() * 20) + 1
        });
        window.Store.saveBoardsMeta(boards);
        initBoardsDashboard();
    });

    document.getElementById('btn-back-to-boards')?.addEventListener('click', () => {
        const boardView = document.getElementById('view-board');
        const viewsBoards = document.getElementById('view-boards');
        
        boardView.classList.remove('active', 'page-flip-in');
        boardView.classList.add('page-flip-out');
        
        setTimeout(() => {
            boardView.classList.add('hidden');
            boardView.classList.remove('page-flip-out');
            
            // Hide the creation toolbar
            const _bar = document.getElementById('miro-creation-bar');
            if (_bar) { _bar.classList.add('hidden'); _bar.style.display = ''; }
            
            viewsBoards.classList.remove('hidden');
            viewsBoards.classList.add('active', 'page-flip-in');
            initBoardsDashboard();
        }, 550);
    });
    
    // Thumbnail change event -> update meta
    const thumbModal = document.getElementById('miro-thumb-modal');
    const thumbModalContent = document.getElementById('miro-thumb-modal-content');
    
    document.getElementById('btn-miro-thumbnail')?.addEventListener('click', () => {
        if (!thumbModal) return;
        const grid = document.getElementById('thumb-grid');
        grid.innerHTML = '';
        for(let i=1; i<=20; i++) {
            grid.innerHTML += `
                <button data-icon-id="${i}" class="w-16 h-16 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors border-2 border-transparent focus:border-blue-500">
                    <img src="https://mirostatic.com/board-image-assets/20250610/112x112/board_icon_${i}.png" class="w-10 h-10 object-contain pointer-events-none">
                </button>
            `;
        }
        
        thumbModal.classList.remove('hidden');
        thumbModal.classList.add('flex');
        setTimeout(() => {
            thumbModalContent.classList.remove('scale-95', 'opacity-0');
            thumbModalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    });
    
    document.getElementById('close-miro-thumb-modal')?.addEventListener('click', () => {
        if (!thumbModal) return;
        thumbModalContent.classList.add('scale-95', 'opacity-0');
        thumbModalContent.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            thumbModal.classList.add('hidden');
            thumbModal.classList.remove('flex');
        }, 200);
    });

    thumbModal?.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-icon-id]');
        if(btn) {
            const iconId = btn.getAttribute('data-icon-id');
            const boards = window.Store.getBoardsMeta();
            const meta = boards.find(b => b.id === (window.currentBoardId || 'main_board'));
            if(meta) {
                meta.thumbnail = iconId;
                window.Store.saveBoardsMeta(boards);
                document.getElementById('board-thumbnail-img').src = `https://mirostatic.com/board-image-assets/20250610/112x112/board_icon_${iconId}.png`;
            }
            document.getElementById('close-miro-thumb-modal').click();
        }
    });

    // Handle board rename
    document.getElementById('board-title-text')?.addEventListener('blur', (e) => {
        const newName = e.target.innerText.trim() || 'Untitled board';
        e.target.innerText = newName;
        const boards = window.Store.getBoardsMeta();
        const meta = boards.find(b => b.id === (window.currentBoardId || 'main_board'));
        if(meta) {
            meta.name = newName;
            window.Store.saveBoardsMeta(boards);
            initBoardsDashboard(); // update the dashboard list if it's there
        }
    });
    
    document.getElementById('board-title-text')?.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardEvents);
} else {
    initDashboardEvents();
}
