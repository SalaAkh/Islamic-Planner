import fs from 'fs';
import path from 'path';
import 'dotenv/config';

console.log('[SurviveKit Builder] Starting monolithic build...');

const DIST_DIR = './dist';
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

// 1. Читаем исходный index.html
let html = fs.readFileSync('./index.html', 'utf8');

// 2. Встраиваем CSS
console.log('Inlining tailwind.css...');
if (fs.existsSync('./tailwind.css')) {
    const css = fs.readFileSync('./tailwind.css', 'utf8');
    html = html.replace(
        '<link rel="stylesheet" href="./tailwind.css">',
        `<style>\n${css}\n</style>`
    );
} else {
    console.warn('⚠️ tailwind.css not found! Build before running this script.');
}

// 3. Встраиваем JS файлы
const scriptsToInline = ['i18n.js', 'store.js', 'ai.js', 'board.js', 'main.js', 'auth.js', 'db.js', 'firebase-init.js'];

scriptsToInline.forEach(script => {
    console.log(`Inlining ${script}...`);
    if (fs.existsSync(`./${script}`)) {
        const js = fs.readFileSync(`./${script}`, 'utf8');
        // Находим тег <script ... src="./script(?v=...)"></script>
        // Регулярное выражение теперь учитывает возможные атрибуты (type, defer) и query-параметры (?v=...)
        const regex = new RegExp(`<script[^>]*src="\\.\\/${script.replace('.', '\\.')}(?:\\?[^"]*)?"[^>]*><\\/script>`, 'g');

        let matchFound = false;
        html = html.replace(regex, (match) => {
            matchFound = true;
            const isDefer = match.includes('defer');

            // Замена ключа Firebase, если мы внедряем firebase-init.js
            let finalJs = js;
            if (script === 'firebase-init.js') {
                const apiKey = process.env.FIREBASE_API_KEY || '';
                finalJs = finalJs.replace('__FIREBASE_API_KEY__', apiKey);
                if (!apiKey) {
                    console.warn('⚠️ WARNING: FIREBASE_API_KEY is not set in environment. Firebase won\'t initialize properly.');
                }
            }

            return `<script${isDefer ? ' defer' : ''}>\n${finalJs}\n</script>`;
        });

        if (!matchFound) {
            console.warn(`⚠️ Could not find script tag for ${script} in index.html`);
        }
    } else {
        console.warn(`⚠️ Script ${script} not found!`);
    }
});

// 4. Копируем статику из public в dist
const PUBLIC_DIR = './public';
if (fs.existsSync(PUBLIC_DIR)) {
    console.log('Copying public assets (manifest.json, sw.js, favicon.ico)...');
    const files = fs.readdirSync(PUBLIC_DIR);
    files.forEach(file => {
        fs.copyFileSync(path.join(PUBLIC_DIR, file), path.join(DIST_DIR, file));
    });
}

// 5. Сохраняем результат
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
console.log('✅ Build complete! Monolithic file generated at dist/index.html');
