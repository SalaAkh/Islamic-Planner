import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Forward console logs to terminal
  page.on('console', msg => {
      const txt = msg.text();
      // Only show logs related to our debugging or errors
      if (txt.includes('[Undo Engine]') || msg.type() === 'error') {
          console.log(`PAGE LOG: ${txt}`);
      }
  });
  
  // 1. Navigate to the local server
  await page.goto('http://localhost:3000/app.html');
  console.log('Opened app.html...');
  
  // 2. Wait for app initialization
  await page.waitForTimeout(2000);
  
  // 3. Open the "Boards" section to init the board code
  const boardsTab = await page.$('#nav-boards');
  if (boardsTab) {
      await boardsTab.click();
      console.log('Clicked Boards tab...');
      await page.waitForTimeout(1000);
      
      const createBtn = await page.$('#btn-create-board');
      if (createBtn) {
          await createBtn.click();
          console.log('Created new board...');
          await page.waitForTimeout(1000);
          
          // Open the newly created board
          const firstBoard = await page.$('#boards-table-body tr td div');
          if (firstBoard) {
              await firstBoard.click();
              console.log('Opened the board...');
              await page.waitForTimeout(2000); // Wait for openBoard transition and initBoard
          }
      }
  }

  // Draw first shape (Sticky Note)
  console.log('Triggering N key (Sticky Note)...');
  await page.keyboard.press('n');
  await page.mouse.click(300, 300);
  await page.waitForTimeout(1000);

  // Draw second shape (Shape - Rect)
  console.log('Triggering S key (Shape)...');
  await page.evaluate(() => { window._activeShapeType = 'rect'; });
  await page.keyboard.press('s');
  await page.mouse.move(400, 400);
  await page.mouse.down();
  await page.mouse.move(500, 500, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  // Undo twice
  console.log('Triggering Undo (Ctrl+Z)...');
  await page.keyboard.down('Control');
  await page.keyboard.press('z');
  await page.keyboard.up('Control');
  await page.waitForTimeout(1000);

  console.log('Triggering Undo (Ctrl+Z) again...');
  await page.keyboard.down('Control');
  await page.keyboard.press('z');
  await page.keyboard.up('Control');
  await page.waitForTimeout(1000);

  // Check how many nodes are literally inside the NoteLayer
  const nodeCount = await page.evaluate(() => {
     let count = -1;
     // Hacky way to find noteLayer if it's not exposed
     // Stage children -> [GridLayer, PathLayer, NoteLayer]
     try {
         const stage = window.Konva.stages[0];
         const noteLayer = stage.children[2];
         count = noteLayer.children.length;
     } catch(e) {}
     return count;
  });
  console.log(`Final nodes in layer: ${nodeCount}`);

  await browser.close();
})();
