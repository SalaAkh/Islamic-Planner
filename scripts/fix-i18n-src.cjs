// Script to replace inline i18n.js in app.html with a <script src> tag
// so that build-monolith.js can properly inline the latest src/js/i18n.js

const fs = require('fs');
const path = require('path');

const appHtmlPath = path.join(__dirname, '..', 'app.html');
let html = fs.readFileSync(appHtmlPath, 'utf8');

// Find the inline i18n.js block: it starts with <script> and contains // Словарь переводов
const regex = /<script>\s*\/\/\s*Словарь переводов[\s\S]*?<\/script>/;
const match = html.match(regex);

if (match) {
    console.log(`Found inline i18n.js block (${match[0].length} chars). Replacing...`);
    html = html.replace(regex, '<script src="./src/js/i18n.js"></script>');
    fs.writeFileSync(appHtmlPath, html, 'utf8');
    console.log('✅ app.html updated: inline i18n.js replaced with <script src="./src/js/i18n.js">');
} else {
    console.error('❌ Could not find inline i18n.js block! Check the regex or file content.');
    process.exit(1);
}
