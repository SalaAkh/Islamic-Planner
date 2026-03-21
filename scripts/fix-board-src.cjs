// Script to replace inline board.js in app.html with a <script src> tag
// so that build-monolith.js can properly inline the latest src/js/board.js

const fs = require('fs');
const path = require('path');

const appHtmlPath = path.join(__dirname, '..', 'app.html');
let html = fs.readFileSync(appHtmlPath, 'utf8');

// Find the inline board.js block: it starts with <script> on its own line
// then immediately contains "window.initBoard = function"
// and closes with </script> before the namaz-tracker section

const konvaScriptLine = '<script src="https://cdn.jsdelivr.net/npm/konva@9.3.6/konva.min.js"></script>';
const inlineboardStart = '<script>\nwindow.initBoard = function (showToast) {';
const inlineboardStartAlt = '<script>\r\nwindow.initBoard = function (showToast) {';

// Find using regex - match the <script> tag that contains window.initBoard
const regex = /<script>\s*window\.initBoard\s*=\s*function[\s\S]*?<\/script>/;
const match = html.match(regex);

if (match) {
    console.log(`Found inline board.js block (${match[0].length} chars). Replacing...`);
    html = html.replace(regex, '<script src="./src/js/board.js"></script>');
    fs.writeFileSync(appHtmlPath, html, 'utf8');
    console.log('✅ app.html updated: inline board.js replaced with <script src="./src/js/board.js">');
} else {
    console.error('❌ Could not find inline board.js block! Check the regex or file content.');
    process.exit(1);
}
