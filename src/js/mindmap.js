// mindmap.js
window.initMindMap = function () {
    if (!window.Konva) {
        console.error('Konva is not loaded!');
        return;
    }

    const containerId = 'mindmap-container';
    const container = document.getElementById(containerId);
    if (!container) return;

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

    // Constants
    const NODE_WIDTH = 160;
    const NODE_HEIGHT = 45;
    const HORIZONTAL_SPACING = 80;
    const VERTICAL_SPACING = 20;

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
        x: stage.width() / 4,
        y: stage.height() / 2
    });
    drawGrid();

    // -- Layout Engine (Right-expanding tree) --
    // Calculates heights
    function calculateSubtreeHeight(node) {
        if (!node.children || node.children.length === 0) {
            node._height = NODE_HEIGHT;
            return node._height;
        }
        let totalHeight = 0;
        node.children.forEach(child => {
            totalHeight += calculateSubtreeHeight(child) + VERTICAL_SPACING;
        });
        totalHeight -= VERTICAL_SPACING; // remove last spacing
        node._height = Math.max(NODE_HEIGHT, totalHeight);
        return node._height;
    }

    function calculatePositions(node, x, y) {
        node._x = x;
        node._y = y;

        if (!node.children || node.children.length === 0) return;

        let startY = y - (node._height / 2);
        node.children.forEach(child => {
            let childY = startY + (child._height / 2);
            calculatePositions(child, x + NODE_WIDTH + HORIZONTAL_SPACING, childY);
            startY += child._height + VERTICAL_SPACING;
        });
    }

    // -- Rendering --
    function renderTree() {
        linkLayer.destroyChildren();
        nodeLayer.destroyChildren();

        calculateSubtreeHeight(treeData);
        calculatePositions(treeData, 0, 0);

        drawNodeRecursive(treeData);
        
        linkLayer.draw();
        nodeLayer.draw();
        saveTree();
    }

    function drawNodeRecursive(node) {
        // Draw Links
        if (node.children) {
            node.children.forEach(child => {
                const startX = node._x + NODE_WIDTH;
                const startY = node._y + NODE_HEIGHT / 2;
                const endX = child._x;
                const endY = child._y + NODE_HEIGHT / 2;

                const cp1X = startX + (endX - startX) / 2;
                const cp1Y = startY;
                const cp2X = startX + (endX - startX) / 2;
                const cp2Y = endY;

                const bezier = new Konva.Shape({
                    stroke: '#94a3b8',
                    strokeWidth: 2,
                    sceneFunc: (ctx, shape) => {
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
                        ctx.strokeShape(shape);
                    },
                    listening: false
                });
                linkLayer.add(bezier);

                drawNodeRecursive(child);
            });
        }

        // Draw Node
        const isSelected = node.id === selectedNodeId;
        const isRoot = node.id === 'root';

        const group = new Konva.Group({
            x: node._x,
            y: node._y,
            id: node.id,
            draggable: false
        });

        const rect = new Konva.Rect({
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            fill: isRoot ? '#10b981' : (isSelected ? '#e0e7ff' : '#ffffff'),
            stroke: isSelected ? '#4f46e5' : (isRoot ? '#059669' : '#cbd5e1'),
            strokeWidth: isSelected ? 2 : 1,
            cornerRadius: 8,
            shadowColor: '#000',
            shadowBlur: 10,
            shadowOffset: { x: 0, y: 4 },
            shadowOpacity: 0.05
        });

        const text = new Konva.Text({
            text: node.text || "Идея",
            fontSize: isRoot ? 16 : 14,
            fontFamily: 'Inter, sans-serif',
            fill: isRoot ? '#ffffff' : '#1e293b',
            width: NODE_WIDTH - 20,
            padding: 10,
            align: 'center',
            verticalAlign: 'middle',
            height: NODE_HEIGHT,
            wrap: 'none',
            ellipsis: true
        });

        group.add(rect);
        group.add(text);

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
            
            // Находим новые отрисованные ноды, так как renderTree удалил старые
            const newGroup = nodeLayer.findOne('#' + node.id);
            if (newGroup) {
                const newTextNode = newGroup.getChildren()[1];
                startTextEdit(node, newGroup, newTextNode);
            }
        });

        nodeLayer.add(group);
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
        if (targetId === 'root') return; // Can't delete root
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
            if (!parent.children) parent.children = [];
            const newId = 'node_' + Date.now();
            const newNode = { id: newId, text: 'Новая идея', children: [] };
            parent.children.push(newNode);
            selectedNodeId = newId;
            renderTree();
            // Optional: Auto-edit immediately
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
    // Ensure we don't bind multiple times if tab is re-clicked
    document.removeEventListener('keydown', window._mindMapKeyHandler);
    window._mindMapKeyHandler = keyHandler;
    document.addEventListener('keydown', keyHandler);

    // -- Text Edit Logic (HTML Overlay) --
    function startTextEdit(nodeData, groupNode, textNode) {
        isEditing = true;
        textNode.hide();
        nodeLayer.draw();

        const textPosition = textNode.absolutePosition();
        const stageBox = stage.container().getBoundingClientRect();
        
        // Account for offsetParent to fix position
        const parentRect = container.offsetParent?.getBoundingClientRect() || { top: 0, left: 0 };
        
        const areaPosition = {
            x: stageBox.left + textPosition.x - parentRect.left,
            y: stageBox.top + textPosition.y - parentRect.top,
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        textarea.value = nodeData.text;
        textarea.style.position = 'absolute';
        textarea.style.top = areaPosition.y + 'px';
        textarea.style.left = areaPosition.x + 'px';
        textarea.style.width = textNode.width() * stage.scaleX() + 'px';
        textarea.style.height = textNode.height() * stage.scaleY() + 'px';
        textarea.style.fontSize = (textNode.fontSize() * stage.scaleY()) + 'px';
        textarea.style.border = '2px solid #4f46e5';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = '#ffffff';
        textarea.style.color = '#1e293b';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = textNode.lineHeight();
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = textNode.align();
        textarea.style.borderRadius = '6px';
        textarea.style.zIndex = '1000';

        textarea.focus();
        textarea.select();

        function removeTextarea() {
            if(!textarea.parentNode) return;
            textarea.parentNode.removeChild(textarea);
            window.removeEventListener('click', handleOutsideClick);
            isEditing = false;
            
            nodeData.text = textarea.value;
            textNode.text(textarea.value);
            textNode.show();
            renderTree(); // re-render to apply changes
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
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                removeTextarea();
            }
            if (e.key === 'Escape') {
                removeTextarea();
            }
        });
    }

    function saveTree() {
        localStorage.setItem('barakah_mindmap', JSON.stringify(treeData));
        if (window.DbSync && typeof window.DbSync.syncToCloud === 'function') {
            window.DbSync.syncToCloud('mindmap', treeData);
        }
    }

    // Initial Render
    renderTree();
};
