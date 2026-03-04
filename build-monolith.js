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
['sitemap.xml', 'robots.txt', 'google4a672bfea76db3c6.html'].forEach(f => {
    if (fs.existsSync(`./${f}`)) {
        fs.copyFileSync(`./${f}`, path.join(DIST_DIR, f));
    }
});

// 7. Write final monolith
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
console.log('✅ Build complete! Monolithic file generated at dist/index.html');

// 8. Generate language-specific static HTML pages for Telegram/social previews
const BASE_URL = 'https://islamic-planer.web.app';
const LANG_META = {
    kk: {
        lang: 'kk',
        dir: 'ltr',
        title: 'Barakah Planner — Исламдық Күнделік және Намаз Жоспарлаушы',
        desc: 'Күніңізді Ислам бойынша жоспарлаңыз: намаз трекері, Ақырет пен Дүние мақсаттары, Tafakkur идеялар тақтасы. Тегін.',
        image: `${BASE_URL}/banner-kk.png`,
        url: `${BASE_URL}/?lang=kk`,
    },
    en: {
        lang: 'en',
        dir: 'ltr',
        title: 'Barakah Planner — Islamic Daily Planner & Prayer Tracker',
        desc: 'Plan your day according to Islam: prayer tracker, Akhirah & Dunya goals, Tafakkur idea board. Free.',
        image: `${BASE_URL}/banner-en.png`,
        url: `${BASE_URL}/?lang=en`,
    },
    ar: {
        lang: 'ar',
        dir: 'rtl',
        title: 'Barakah Planner — يوميات إسلامية ومخطط الصلاة',
        desc: 'خطط ليومك وفقًا للإسلام: متتبع الصلاة، أهداف الآخرة والدنيا، لوحة أفكار تفكر. مجاني.',
        image: `${BASE_URL}/banner-ar.png`,
        url: `${BASE_URL}/?lang=ar`,
    },
};

Object.entries(LANG_META).forEach(([langCode, meta]) => {
    // Create subfolder
    const langDir = path.join(DIST_DIR, langCode);
    if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });

    // Build a minimal HTML file that instantly redirects but has proper static og meta
    const langHtml = `<!DOCTYPE html>
<html lang="${meta.lang}" dir="${meta.dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.title}</title>
<meta name="description" content="${meta.desc}">
<link rel="canonical" href="${meta.url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${meta.url}">
<meta property="og:site_name" content="Barakah Planner">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.desc}">
<meta property="og:image" content="${meta.image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${meta.title}">
<meta name="twitter:description" content="${meta.desc}">
<meta name="twitter:image" content="${meta.image}">
<meta http-equiv="refresh" content="0; url=${meta.url}">
<script>window.location.replace('${meta.url}');</script>
</head>
<body></body>
</html>`;

    fs.writeFileSync(path.join(langDir, 'index.html'), langHtml);
    console.log(`✅ Language page generated: dist/${langCode}/index.html`);
});

