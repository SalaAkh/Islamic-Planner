// mindmap.js
window.initMindMap = function () {
    if (!window.Konva) {
        console.error('Konva is not loaded!');
        return;
    }

    const containerId = 'mindmap-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    // Constants & Colors
    const PADDING_X = 16;
    const PADDING_Y = 12;
    const MIN_WIDTH = 80;
    const MAX_WIDTH = 250;
    const HORIZONTAL_SPACING = 60;
    const VERTICAL_SPACING = 20;
    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

    // Default state
    let treeData = {
        id: 'root',
        text: 'Главная Идея',
        children: []
    };

    // Load from Store if exists
    const stored = localStorage.getItem('barakah_mindmap');
    if (stored) {
        try {
            treeData = JSON.parse(stored);
        } catch (e) {
            console.error(e);
        }
    }

    // State Management (Undo/Redo)
    let undoStack = [];
    let redoStack = [];

    function saveState() {
        undoStack.push(JSON.stringify(treeData));
        redoStack = [];
        if (undoStack.length > 50) undoStack.shift();
        persistData();
    }

    function persistData() {
        localStorage.setItem('barakah_mindmap', JSON.stringify(treeData));
        if (window.DbSync && typeof window.DbSync.syncToCloud === 'function') {
            window.DbSync.syncToCloud('mindmap', treeData);
        }
    }

    function undo() {
        if (undoStack.length === 0) return;
        redoStack.push(JSON.stringify(treeData));
        treeData = JSON.parse(undoStack.pop());
        selectedNodeId = null;
        renderTree();
    }

    function redo() {
        if (redoStack.length === 0) return;
        undoStack.push(JSON.stringify(treeData));
        treeData = JSON.parse(redoStack.pop());
        selectedNodeId = null;
        renderTree();
    }

    let selectedNodeId = 'root';
    let isEditing = false;

    let initialWidth = container.offsetWidth;
    let initialHeight = container.offsetHeight;
    if (initialWidth === 0) initialWidth = window.innerWidth;
    if (initialHeight === 0) initialHeight = window.innerHeight;

    // Setup Konva
    const stage = new Konva.Stage({
        container: containerId,
        width: initialWidth,
        height: initialHeight,
        draggable: true
    });

    const gridLayer = new Konva.Layer();
    const linkLayer = new Konva.Layer();
    const nodeLayer = new Konva.Layer();

    stage.add(gridLayer);
    stage.add(linkLayer);
    stage.add(nodeLayer);

    // Zoom setup
    const scaleBy = 1.1;
    stage.on('wheel', (e) => {
        e.evt.preventDefault();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
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
        drawGrid();
    });

    stage.on('dragmove', drawGrid);

    // Touch pinch zoom
    let lastDist = 0;
    let lastCenter = null;

    function getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    function getCenter(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
        };
    }

    stage.on('touchmove', (e) => {
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        if (touch1 && touch2) {
            e.evt.preventDefault();
            if (stage.isDragging()) {
                stage.stopDrag();
            }

            const p1 = { x: touch1.clientX, y: touch1.clientY };
            const p2 = { x: touch2.clientX, y: touch2.clientY };

            if (!lastDist) {
                lastDist = getDistance(p1, p2);
            }
            if (!lastCenter) {
                lastCenter = getCenter(p1, p2);
                return;
            }

            const dist = getDistance(p1, p2);
            const center = getCenter(p1, p2);

            const oldScale = stage.scaleX();
            const newScale = oldScale * (dist / lastDist);
            const boundedScale = Math.max(0.1, Math.min(5, newScale));

            const stageBox = stage.container().getBoundingClientRect();
            const pointer = {
                x: center.x - stageBox.left,
                y: center.y - stageBox.top,
            };

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            stage.scale({ x: boundedScale, y: boundedScale });
            stage.position({
                x: pointer.x - mousePointTo.x * boundedScale,
                y: pointer.y - mousePointTo.y * boundedScale,
            });

            lastDist = dist;
            lastCenter = center;
            drawGrid();
        }
    });

    stage.on('touchend', () => {
        lastDist = 0;
        lastCenter = null;
    });

    // Grid
    const DOT_SPACING = 50;
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
            sceneFunc: (ctx) => {
                ctx.beginPath();
                ctx.fillStyle = '#e2e8f0'; 
                for (let i = 0; i < dots.length; i += 2) {
                    ctx.moveTo(dots[i], dots[i+1]);
                    ctx.arc(dots[i], dots[i+1], 1.5 / scale, 0, Math.PI * 2);
                }
                ctx.fill();
            },
            listening: false
        });
        gridLayer.add(gridShape);
    }

    const resizeObserver = new ResizeObserver(() => {
        if(container.offsetWidth > 0 && container.offsetHeight > 0) {
            stage.width(container.offsetWidth);
            stage.height(container.offsetHeight);
            drawGrid();
        }
    });
    resizeObserver.observe(container);

    // Center root on init
    stage.position({
        x: stage.width() / 2,
        y: stage.height() / 2
    });
    drawGrid();

    // -- Bilateral Layout Engine --

    const dummyText = new Konva.Text({
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        wrap: 'word',
        width: MAX_WIDTH
    });

    function calculateNodeSize(node) {
        dummyText.text(node.text || "Идея");
        dummyText.fontSize(node.id === 'root' ? 18 : 14);
        dummyText.fontStyle(node.id === 'root' ? 'bold' : 'normal');
        dummyText.width(null);

        let naturalWidth = dummyText.width();
        if (naturalWidth > MAX_WIDTH) {
            dummyText.width(MAX_WIDTH);
            node._width = MAX_WIDTH + PADDING_X * 2;
        } else {
            node._width = Math.max(MIN_WIDTH, naturalWidth + PADDING_X * 2);
        }

        node._height = dummyText.height() + PADDING_Y * 2;

        if (node.isCollapsed || !node.children || node.children.length === 0) {
            node._subtreeHeight = node._height;
            return;
        }

        let totalHeight = 0;
        node.children.forEach(child => {
            calculateNodeSize(child);
            totalHeight += child._subtreeHeight + VERTICAL_SPACING;
        });
        totalHeight -= VERTICAL_SPACING;
        node._subtreeHeight = Math.max(node._height, totalHeight);
    }

    function calculatePositions() {
        calculateNodeSize(treeData);
        // Root is at (0,0) in logical coordinates
        treeData._x = -(treeData._width / 2);
        treeData._y = -(treeData._height / 2);

        if (!treeData.children || treeData.isCollapsed) return;

        const leftChildren = [];
        const rightChildren = [];
        
        treeData.children.forEach((child, idx) => {
            if (idx % 2 === 0) rightChildren.push(child);
            else leftChildren.push(child);
            
            if (!child.color) {
                child.color = COLORS[idx % COLORS.length];
            }
        });

        function positionChildren(nodeList, startX, startY, direction) {
            let currentY = startY;
            nodeList.forEach(child => {
                let childY = currentY + (child._subtreeHeight / 2);
                child._x = direction === 'right' ? startX : startX - child._width;
                child._y = childY - (child._height / 2);
                
                positionSubtree(child, direction);
                currentY += child._subtreeHeight + VERTICAL_SPACING;
            });
        }

        function positionSubtree(node, direction) {
            if (!node.children || node.isCollapsed) return;
            let startX = direction === 'right' ? node._x + node._width + HORIZONTAL_SPACING : node._x - HORIZONTAL_SPACING;
            let currentY = node._y + (node._height / 2) - (node._subtreeHeight / 2);

            node.children.forEach(child => {
                // Inherit color
                if (!child.color) child.color = node.color;

                let childY = currentY + (child._subtreeHeight / 2);
                child._x = direction === 'right' ? startX : startX - child._width;
                child._y = childY - (child._height / 2);

                positionSubtree(child, direction);
                currentY += child._subtreeHeight + VERTICAL_SPACING;
            });
        }

        let rightHeight = rightChildren.reduce((sum, c) => sum + c._subtreeHeight + VERTICAL_SPACING, 0) - VERTICAL_SPACING;
        let leftHeight = leftChildren.reduce((sum, c) => sum + c._subtreeHeight + VERTICAL_SPACING, 0) - VERTICAL_SPACING;

        positionChildren(rightChildren, treeData._x + treeData._width + HORIZONTAL_SPACING, treeData._y + treeData._height/2 - rightHeight / 2, 'right');
        positionChildren(leftChildren, treeData._x - HORIZONTAL_SPACING, treeData._y + treeData._height/2 - leftHeight / 2, 'left');
    }

    // -- Rendering --
    function renderTree() {
        linkLayer.destroyChildren();
        nodeLayer.destroyChildren();

        calculatePositions();

        drawNodeRecursive(treeData, null, 'right');
        
        linkLayer.draw();
        nodeLayer.draw();
        persistData();
        if (typeof updateToolbarButtons === 'function') {
            updateToolbarButtons();
        }
    }

    let dragTarget = null;
    let highlightRect = null;

    function drawNodeRecursive(node, parentNode, direction) {
        // Draw Links from parent to node
        if (parentNode) {
            const isParentRoot = parentNode.id === 'root';
            let startX, startY;
            
            if (isParentRoot) {
                startX = parentNode._x + parentNode._width / 2;
                startY = parentNode._y + parentNode._height / 2;
            } else {
                startX = direction === 'right' ? parentNode._x + parentNode._width : parentNode._x;
                startY = parentNode._y + parentNode._height / 2;
            }

            const endX = direction === 'right' ? node._x : node._x + node._width;
            const endY = node._y + node._height / 2;

            const cp1X = startX + (endX - startX) / 2;
            const cp1Y = startY;
            const cp2X = startX + (endX - startX) / 2;
            const cp2Y = endY;

            const linkColor = node.color || '#cbd5e1';

            const bezier = new Konva.Shape({
                stroke: linkColor,
                strokeWidth: 2,
                opacity: 0.6,
                sceneFunc: (ctx, shape) => {
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
                    ctx.strokeShape(shape);
                },
                listening: false
            });
            linkLayer.add(bezier);
        }

        const isSelected = node.id === selectedNodeId;
        const isRoot = node.id === 'root';
        const nodeColor = node.color || '#10b981';

        const group = new Konva.Group({
            x: node._x,
            y: node._y,
            id: node.id,
            draggable: !isRoot
        });

        // Background Rect
        const rect = new Konva.Rect({
            width: node._width,
            height: node._height,
            fill: isRoot ? '#10b981' : (isSelected ? nodeColor : '#ffffff'),
            stroke: isSelected ? '#1e293b' : nodeColor,
            strokeWidth: isSelected ? 2 : 1.5,
            cornerRadius: 12,
            shadowColor: nodeColor,
            shadowBlur: isSelected ? 12 : 4,
            shadowOffset: { x: 0, y: 2 },
            shadowOpacity: isSelected ? 0.3 : 0.1
        });

        // Text
        const text = new Konva.Text({
            text: node.text || "Идея",
            fontSize: isRoot ? 18 : 14,
            fontFamily: 'Inter, sans-serif',
            fontStyle: isRoot ? 'bold' : 'normal',
            fill: (isRoot || isSelected) ? '#ffffff' : '#1e293b',
            width: Math.min(MAX_WIDTH, node._width) - PADDING_X * 2,
            padding: 0,
            x: PADDING_X,
            y: PADDING_Y,
            align: 'center',
            verticalAlign: 'middle',
            wrap: 'word'
        });

        group.add(rect);
        group.add(text);

        // Collapse/Expand Button
        if (node.children && node.children.length > 0) {
            const btnRadius = 8;
            const btnX = direction === 'right' ? node._width : 0;
            const btnY = node._height / 2;

            const toggleGroup = new Konva.Group({
                x: btnX,
                y: btnY,
                cursor: 'pointer'
            });

            const toggleBg = new Konva.Circle({
                radius: btnRadius,
                fill: '#ffffff',
                stroke: nodeColor,
                strokeWidth: 1.5
            });

            const toggleSign = new Konva.Text({
                text: node.isCollapsed ? '+' : '-',
                fontSize: 14,
                fontFamily: 'monospace',
                fontStyle: 'bold',
                fill: nodeColor,
                width: btnRadius * 2,
                height: btnRadius * 2,
                x: -btnRadius,
                y: -btnRadius,
                align: 'center',
                verticalAlign: 'middle'
            });

            toggleGroup.add(toggleBg);
            toggleGroup.add(toggleSign);

            toggleGroup.on('click tap', (e) => {
                e.cancelBubble = true;
                saveState();
                node.isCollapsed = !node.isCollapsed;
                renderTree();
            });

            toggleGroup.on('mouseenter', () => {
                stage.container().style.cursor = 'pointer';
                toggleBg.fill(nodeColor);
                toggleSign.fill('#ffffff');
                nodeLayer.draw();
            });

            toggleGroup.on('mouseleave', () => {
                stage.container().style.cursor = 'default';
                toggleBg.fill('#ffffff');
                toggleSign.fill(nodeColor);
                nodeLayer.draw();
            });

            group.add(toggleGroup);
        }

        // Drag and Drop Logic
        if (!isRoot) {
            group.on('dragstart', (e) => {
                e.cancelBubble = true;
                group.moveToTop();
            });

            group.on('dragmove', (e) => {
                const pos = stage.getPointerPosition();
                const transform = stage.getAbsoluteTransform().copy();
                transform.invert();
                const localPos = transform.point(pos);

                let found = null;
                function checkIntersect(n) {
                    if (n.id === node.id) return; // skip self and subtree
                    if (localPos.x >= n._x && localPos.x <= n._x + n._width &&
                        localPos.y >= n._y && localPos.y <= n._y + n._height) {
                        found = n;
                    }
                    if (n.children && !n.isCollapsed) {
                        // don't search inside node being dragged
                        if (n.id !== node.id) {
                            n.children.forEach(checkIntersect);
                        }
                    }
                }
                checkIntersect(treeData);

                if (found !== dragTarget) {
                    if (highlightRect) highlightRect.destroy();
                    dragTarget = found;
                    if (dragTarget) {
                        highlightRect = new Konva.Rect({
                            x: dragTarget._x - 4,
                            y: dragTarget._y - 4,
                            width: dragTarget._width + 8,
                            height: dragTarget._height + 8,
                            stroke: '#3b82f6',
                            strokeWidth: 3,
                            cornerRadius: 14,
                            dash: [5, 5]
                        });
                        nodeLayer.add(highlightRect);
                    }
                }
            });

            group.on('dragend', (e) => {
                e.cancelBubble = true;
                if (highlightRect) highlightRect.destroy();
                highlightRect = null;

                if (dragTarget && dragTarget.id !== node.id) {
                    saveState();
                    // Remove from old parent
                    const oldParent = findNodeParent(treeData, node.id);
                    if (oldParent) {
                        oldParent.children = oldParent.children.filter(c => c.id !== node.id);
                    }
                    
                    // Add to new parent
                    if (!dragTarget.children) dragTarget.children = [];
                    // Reset color so it inherits
                    if (dragTarget.id !== 'root') {
                        node.color = undefined;
                        function clearColors(n) { n.color = undefined; if(n.children) n.children.forEach(clearColors); }
                        if(node.children) node.children.forEach(clearColors);
                    }
                    dragTarget.children.push(node);
                    dragTarget.isCollapsed = false;
                    selectedNodeId = node.id;
                    renderTree();
                } else {
                    // snap back
                    renderTree();
                }
                dragTarget = null;
            });
        }

        group.on('click tap', (e) => {
            e.cancelBubble = true;
            if (!isEditing) {
                selectedNodeId = node.id;
                renderTree();
            }
        });

        group.on('dblclick dbltap', (e) => {
            e.cancelBubble = true;
            selectedNodeId = node.id;
            renderTree();
            
            const newGroup = nodeLayer.findOne('#' + node.id);
            if (newGroup) {
                const newTextNode = newGroup.getChildren()[1];
                startTextEdit(node, newGroup, newTextNode);
            }
        });

        nodeLayer.add(group);

        if (node.children && !node.isCollapsed) {
            node.children.forEach((child, idx) => {
                let childDirection = direction;
                if (isRoot) {
                    childDirection = (idx % 2 === 0) ? 'right' : 'left';
                }
                drawNodeRecursive(child, node, childDirection);
            });
        }
    }

    stage.on('click tap', (e) => {
        if (e.target === stage && !isEditing) {
            selectedNodeId = null;
            renderTree();
        }
    });

    // -- Tree Modification Operations --
    function findNodeParent(root, targetId) {
        if (!root.children) return null;
        for (let child of root.children) {
            if (child.id === targetId) return root;
            const found = findNodeParent(child, targetId);
            if (found) return found;
        }
        return null;
    }

    function findNode(root, targetId) {
        if (root.id === targetId) return root;
        if (!root.children) return null;
        for (let child of root.children) {
            const found = findNode(child, targetId);
            if (found) return found;
        }
        return null;
    }

    function deleteNode(targetId) {
        if (targetId === 'root') return;
        saveState();
        const parent = findNodeParent(treeData, targetId);
        if (parent) {
            parent.children = parent.children.filter(c => c.id !== targetId);
            selectedNodeId = parent.id;
            renderTree();
        }
    }

    function addChild(parentId) {
        const parent = findNode(treeData, parentId);
        if (parent) {
            saveState();
            if (!parent.children) parent.children = [];
            const newId = 'node_' + Date.now();
            const newNode = { id: newId, text: 'Новая идея', children: [] };
            parent.children.push(newNode);
            parent.isCollapsed = false;
            selectedNodeId = newId;
            renderTree();
            
            const group = nodeLayer.findOne('#' + newId);
            if (group) {
                const textNode = group.getChildren()[1];
                startTextEdit(newNode, group, textNode);
            }
        }
    }

    function addSibling(nodeId) {
        if (nodeId === 'root') {
            addChild('root');
            return;
        }
        const parent = findNodeParent(treeData, nodeId);
        if (parent) {
            saveState();
            const newId = 'node_' + Date.now();
            const newNode = { id: newId, text: 'Новая идея', children: [] };
            const idx = parent.children.findIndex(c => c.id === nodeId);
            parent.children.splice(idx + 1, 0, newNode);
            selectedNodeId = newId;
            renderTree();
            
            const group = nodeLayer.findOne('#' + newId);
            if (group) {
                const textNode = group.getChildren()[1];
                startTextEdit(newNode, group, textNode);
            }
        }
    }

    // -- Keyboard Shortcuts --
    const keyHandler = (e) => {
        if (isEditing) return;
        
        // Handle Undo/Redo
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                undo();
                return;
            }
            if (e.key === 'y' || e.key === 'Y') {
                e.preventDefault();
                redo();
                return;
            }
        }

        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || document.activeElement.isContentEditable) return;

        if (selectedNodeId) {
            if (e.key === 'Tab') {
                e.preventDefault();
                addChild(selectedNodeId);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                addSibling(selectedNodeId);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                deleteNode(selectedNodeId);
            }
        }
    };
    
    document.removeEventListener('keydown', window._mindMapKeyHandler);
    window._mindMapKeyHandler = keyHandler;
    document.addEventListener('keydown', keyHandler);

    // -- Text Edit Logic (HTML Overlay) --
    function startTextEdit(nodeData, groupNode, textNode) {
        isEditing = true;
        textNode.hide();
        nodeLayer.draw();

        const groupPosition = groupNode.absolutePosition();
        
        const textarea = document.createElement('textarea');
        textarea.id = 'mindmap-editor';
        textarea.name = 'mindmap-editor';
        stage.container().appendChild(textarea);

        textarea.value = nodeData.text;
        textarea.style.position = 'absolute';
        textarea.style.top = groupPosition.y + 'px';
        textarea.style.left = groupPosition.x + 'px';
        textarea.style.width = (nodeData._width * stage.scaleX()) + 'px';
        textarea.style.height = (nodeData._height * stage.scaleY()) + 'px';
        textarea.style.fontSize = (textNode.fontSize() * stage.scaleY()) + 'px';
        textarea.style.border = '2px solid #4f46e5';
        textarea.style.padding = (PADDING_Y * stage.scaleY()) + 'px ' + (PADDING_X * stage.scaleX()) + 'px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = '#ffffff';
        textarea.style.color = '#1e293b';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = textNode.lineHeight() || 1.2;
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = textNode.align();
        textarea.style.borderRadius = '12px';
        textarea.style.zIndex = '1000';
        textarea.style.boxSizing = 'border-box';

        textarea.focus();
        textarea.select();

        // Auto-resize textarea while typing
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
        });

        function removeTextarea() {
            if(!textarea.parentNode) return;
            textarea.parentNode.removeChild(textarea);
            window.removeEventListener('click', handleOutsideClick);
            isEditing = false;
            
            if (nodeData.text !== textarea.value) {
                saveState();
                nodeData.text = textarea.value;
            }
            
            textNode.show();
            renderTree(); 
        }

        function handleOutsideClick(e) {
            if (e.target !== textarea) {
                removeTextarea();
            }
        }

        setTimeout(() => {
            window.addEventListener('click', handleOutsideClick);
        });

        textarea.addEventListener('keydown', function (e) {
            // Allow shift+enter for newlines
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                removeTextarea();
            }
            if (e.key === 'Escape') {
                removeTextarea();
            }
        });
    }

    // -- Floating Toolbar State update and Handlers --
    function updateToolbarButtons() {
        const toolbarButtons = {
            child: document.getElementById('mm-btn-add-child'),
            sibling: document.getElementById('mm-btn-add-sibling'),
            edit: document.getElementById('mm-btn-edit'),
            del: document.getElementById('mm-btn-delete')
        };

        const hasSelection = !!selectedNodeId;
        const isRoot = selectedNodeId === 'root';

        if (toolbarButtons.child) {
            if (hasSelection) toolbarButtons.child.classList.remove('opacity-40', 'pointer-events-none');
            else toolbarButtons.child.classList.add('opacity-40', 'pointer-events-none');
        }
        if (toolbarButtons.sibling) {
            if (hasSelection) toolbarButtons.sibling.classList.remove('opacity-40', 'pointer-events-none');
            else toolbarButtons.sibling.classList.add('opacity-40', 'pointer-events-none');
        }
        if (toolbarButtons.edit) {
            if (hasSelection) toolbarButtons.edit.classList.remove('opacity-40', 'pointer-events-none');
            else toolbarButtons.edit.classList.add('opacity-40', 'pointer-events-none');
        }
        if (toolbarButtons.del) {
            if (hasSelection && !isRoot) toolbarButtons.del.classList.remove('opacity-40', 'pointer-events-none');
            else toolbarButtons.del.classList.add('opacity-40', 'pointer-events-none');
        }
    }

    const btnAddChild = document.getElementById('mm-btn-add-child');
    const btnAddSibling = document.getElementById('mm-btn-add-sibling');
    const btnEdit = document.getElementById('mm-btn-edit');
    const btnDelete = document.getElementById('mm-btn-delete');
    const btnCenter = document.getElementById('mm-btn-center');

    if (btnAddChild) {
        btnAddChild.onclick = (e) => {
            e.stopPropagation();
            if (selectedNodeId) addChild(selectedNodeId);
        };
    }
    if (btnAddSibling) {
        btnAddSibling.onclick = (e) => {
            e.stopPropagation();
            if (selectedNodeId) addSibling(selectedNodeId);
        };
    }
    if (btnEdit) {
        btnEdit.onclick = (e) => {
            e.stopPropagation();
            if (selectedNodeId && !isEditing) {
                const node = findNode(treeData, selectedNodeId);
                const group = nodeLayer.findOne('#' + selectedNodeId);
                if (node && group) {
                    const textNode = group.getChildren()[1];
                    startTextEdit(node, group, textNode);
                }
            }
        };
    }
    if (btnDelete) {
        btnDelete.onclick = (e) => {
            e.stopPropagation();
            if (selectedNodeId) deleteNode(selectedNodeId);
        };
    }
    if (btnCenter) {
        btnCenter.onclick = (e) => {
            e.stopPropagation();
            stage.position({
                x: stage.width() / 2,
                y: stage.height() / 2
            });
            stage.scale({ x: 1, y: 1 });
            drawGrid();
        };
    }

    // Initial Render
    renderTree();
};
