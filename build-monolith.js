import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import 'dotenv/config';

console.log('[Barakah Builder] Starting monolithic build...');

const DIST_DIR = './dist';
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

// 1. Read source index.html
let html = fs.readFileSync('./index.html', 'utf8');

// 2. Inline CSS
console.log('Inlining tailwind.css...');
if (fs.existsSync('./src/css/tailwind.css')) {
    const css = fs.readFileSync('./src/css/tailwind.css', 'utf8');
    html = html.replace(
        /<link\s+rel="stylesheet"\s+href="\.\/src\/css\/tailwind\.css\?v=\d+">/g,
        `<style>\n${css}\n</style>`
    );
} else {
    console.warn('⚠️ tailwind.css not found! Build before running this script.');
}

// 3. Inline ALL JS scripts — preserve type="module" and defer
const scriptsToInline = [
    'crypto-storage.js',
    'i18n.js',
    'store.js',
    'ai.js',
    'board.js',
    'main.js',
    'activity-log.js',
    'auth.js',
    'db.js',
    'firebase-init.js'
];

scriptsToInline.forEach(script => {
    console.log(`Inlining ${script}...`);
    if (fs.existsSync(`./src/js/${script}`)) {
        const js = fs.readFileSync(`./src/js/${script}`, 'utf8');
        const escapedName = script.replace('.', '\\.');
        const regex = new RegExp(`<script([^>]*)src="\\.\\/src\\/js\\/${escapedName}(?:\\?[^"]*)?"([^>]*)><\\/script>`, 'g');

        let matchFound = false;
        html = html.replace(regex, (match, before, after) => {
            matchFound = true;
            const attrs = (before + ' ' + after).trim();
            const isModule = /type=["']module["']/.test(attrs);
            const isDefer = /\bdefer\b/.test(attrs);

            let finalJs = js;
            if (script === 'firebase-init.js') {
                const apiKey = process.env.FIREBASE_API_KEY || '';
                finalJs = finalJs.replace('__FIREBASE_API_KEY__', apiKey);
                if (!apiKey) {
                    console.warn("⚠️ WARNING: FIREBASE_API_KEY is not set.");
                }
            }

            const typeAttr = isModule ? ' type="module"' : '';
            const deferAttr = isDefer ? ' defer' : '';
            return `<script${typeAttr}${deferAttr}>\n${finalJs}\n</script>`;
        });

        if (!matchFound) {
            console.warn(`⚠️ Could not find script tag for ${script} in index.html`);
        }
    } else {
        console.warn(`⚠️ Script ${script} not found!`);
    }
});

// 4. Fix paths that pointed to ./public/ — in dist they're in the root
html = html.replace(/\.\/public\/favicon\.ico/g, './favicon.ico');
html = html.replace(/\.\/public\/sw\.js/g, './sw.js');
html = html.replace(/\.\/public\/manifest\.json/g, './manifest.json');

// 5. Copy assets from public/ to dist/ root (sw.js, manifest.json, favicon, banners, og-images)
const PUBLIC_DIR = './public';
if (fs.existsSync(PUBLIC_DIR)) {
    console.log('Copying public assets to dist root...');
    const files = fs.readdirSync(PUBLIC_DIR);
    files.forEach(file => {
        fs.copyFileSync(path.join(PUBLIC_DIR, file), path.join(DIST_DIR, file));
    });
}

// 6. Copy sitemap and robots
['sitemap.xml', 'robots.txt'].forEach(f => {
    if (fs.existsSync(`./${f}`)) {
        fs.copyFileSync(`./${f}`, path.join(DIST_DIR, f));
    }
});

// 7. Write final monolith
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
console.log('✅ Build complete! Monolithic file generated at dist/index.html');
