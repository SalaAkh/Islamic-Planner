import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import 'dotenv/config';

console.log('[Barakah Builder] Starting monolithic build...');

const DIST_DIR = './dist';
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

// ─── Helper: inline CSS into any HTML ───
function inlineCSS(html) {
    if (fs.existsSync('./src/css/tailwind.css')) {
        const css = fs.readFileSync('./src/css/tailwind.css', 'utf8');
        return html.replace(
            /<link\s+rel="stylesheet"\s+href="\.\/src\/css\/tailwind\.css\?v=\d+">/g,
            `<style>\n${css}\n</style>`
        );
    }
    console.warn('⚠️ tailwind.css not found!');
    return html;
}

// ─── Helper: inline JS scripts into any HTML ───
const scriptsToInline = [
    'i18n.js', 'store.js',
    'board.js', 'namaz-tracker.js', 'main.js', 'activity-log.js', 'auth.js',
    'db.js', 'firebase-init.js'
];

function inlineScripts(html) {
    scriptsToInline.forEach(script => {
        console.log(`Inlining ${script}...`);
        if (fs.existsSync(`./src/js/${script}`)) {
            const js = fs.readFileSync(`./src/js/${script}`, 'utf8');
            const escapedName = script.replace('.', '\\.');
            const regex = new RegExp(`<script([^>]*)src="\\.\\/src\\/js\\/${escapedName}(?:\\?[^"]*)?\"([^>]*)><\\/script>`, 'g');

            html = html.replace(regex, (match, before, after) => {
                const attrs = (before + ' ' + after).trim();
                const isModule = /type=["']module["']/.test(attrs);
                const isDefer = /\bdefer\b/.test(attrs);

                let finalJs = js;
                if (script === 'firebase-init.js') {
                    const apiKey = process.env.FIREBASE_API_KEY || '';
                    finalJs = finalJs.replace(/__FIREBASE_API_KEY__/g, apiKey);
                    if (!apiKey) console.warn('⚠️ WARNING: FIREBASE_API_KEY is not set.');
                }

                const typeAttr = isModule ? ' type="module"' : '';
                const deferAttr = isDefer ? ' defer' : '';
                return `<script${typeAttr}${deferAttr}>\n${finalJs}\n</script>`;
            });
        } else {
            console.warn(`⚠️ Script ${script} not found!`);
        }
    });
    return html;
}

// ─── 1. Build app.html (main PWA) ───
console.log('\n[1/2] Building app.html (main PWA)...');
let appHtml = fs.readFileSync('./app.html', 'utf8');
appHtml = inlineCSS(appHtml);
appHtml = inlineScripts(appHtml);

// Fix paths: ./public/ → ./
appHtml = appHtml.replace(/\.\/public\/favicon\.ico/g, './favicon.ico');
appHtml = appHtml.replace(/\.\/public\/sw\.js/g, './sw.js');
appHtml = appHtml.replace(/\.\/public\/manifest\.json/g, './manifest.json');

fs.writeFileSync(path.join(DIST_DIR, 'app.html'), appHtml);
console.log('✅ app.html built!');

// ─── 2. Build index.html (Landing Page) ───
console.log('\n[2/2] Building index.html (Landing Page)...');
let landingHtml = fs.readFileSync('./index.html', 'utf8');
// Fix public paths in landing too
landingHtml = landingHtml.replace(/\.\/public\/favicon\.ico/g, './favicon.ico');
landingHtml = landingHtml.replace(/\.\/public\/manifest\.json/g, './manifest.json');

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), landingHtml);
console.log('✅ index.html (landing) built!');

// ─── 3. Copy assets from public/ to dist/ root ───
const PUBLIC_DIR = './public';
if (fs.existsSync(PUBLIC_DIR)) {
    console.log('\nCopying public assets to dist root...');
    const files = fs.readdirSync(PUBLIC_DIR);
    files.forEach(file => {
        const srcPath = path.join(PUBLIC_DIR, file);
        const destPath = path.join(DIST_DIR, file);
        if (file === 'firebase-messaging-sw.js') {
            let content = fs.readFileSync(srcPath, 'utf8');
            const apiKey = process.env.FIREBASE_API_KEY || '';
            content = content.replace(/__FIREBASE_API_KEY__/g, apiKey);
            if (!apiKey) console.warn(`⚠️ WARNING: FIREBASE_API_KEY is not set for ${file}.`);
            fs.writeFileSync(destPath, content);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

const JS_DIST = path.join(DIST_DIR, 'src', 'js');
if (!fs.existsSync(JS_DIST)) fs.mkdirSync(JS_DIST, { recursive: true });
if (fs.existsSync('./src/js/muftyat-cities.js')) {
    fs.copyFileSync('./src/js/muftyat-cities.js', path.join(JS_DIST, 'muftyat-cities.js'));
    console.log('✅ Copied muftyat-cities.js to dist/src/js/');
}

// ─── 4. Copy sitemap, robots, google verification ───
['sitemap.xml', 'robots.txt', 'google4a672bfea76db3c6.html'].forEach(f => {
    if (fs.existsSync(`./${f}`)) {
        fs.copyFileSync(`./${f}`, path.join(DIST_DIR, f));
    }
});

// ─── 5. Generate language-specific social preview pages ───
const BASE_URL = 'https://islamic-planer.web.app';
const LANG_META = {
    kk: {
        lang: 'kk', dir: 'ltr',
        title: 'Barakah Planner — Исламдық Күнделік және Намаз Жоспарлаушы',
        desc: 'Күніңізді Ислам бойынша жоспарлаңыз: намаз трекері, Ақырет пен Дүние мақсаттары, Tafakkur тақтасы. Тегін.',
        image: `${BASE_URL}/banner-kk.png`,
        url: `${BASE_URL}/?lang=kk`,
    },
    en: {
        lang: 'en', dir: 'ltr',
        title: 'Barakah Planner — Islamic Daily Planner & Prayer Tracker',
        desc: 'Plan your day according to Islam: prayer tracker, Akhirah & Dunya goals, Tafakkur idea board. Free.',
        image: `${BASE_URL}/banner-en.png`,
        url: `${BASE_URL}/?lang=en`,
    },
    ar: {
        lang: 'ar', dir: 'rtl',
        title: 'Barakah Planner — يوميات إسلامية ومخطط الصلاة',
        desc: 'خطط ليومك وفقًا للإسلام: متتبع الصلاة، أهداف الآخرة والدنيا، لوحة تفكر. مجاني.',
        image: `${BASE_URL}/banner-ar.png`,
        url: `${BASE_URL}/?lang=ar`,
    },
};

Object.entries(LANG_META).forEach(([langCode, meta]) => {
    const langDir = path.join(DIST_DIR, langCode);
    if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });

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
    console.log(`✅ Language page: dist/${langCode}/index.html`);
});

console.log('\n🚀 Build complete! Files: dist/index.html (landing) + dist/app.html (PWA)');
