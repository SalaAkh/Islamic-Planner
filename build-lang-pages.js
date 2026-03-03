/**
 * build-lang-pages.js
 * Generates static language-specific HTML pages for each supported locale.
 * Each page has hardcoded meta tags (title, description, og:image, og:locale etc.)
 * so Telegram, WhatsApp and other bots that don't run JS see the correct language preview.
 *
 * Output:
 *   kk/index.html   → https://islamic-planer.web.app/kk/
 *   en/index.html   → https://islamic-planer.web.app/en/
 *   ar/index.html   → https://islamic-planer.web.app/ar/
 *   (Russian stays as the root /index.html)
 *
 * Run: node build-lang-pages.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://islamic-planer.web.app';

const LANGS = {
    kk: {
        htmlLang: 'kk',
        dir: 'ltr',
        title: 'Barakah Planner — Исламдық Күнделік және Намаз Жоспарлаушы',
        description: 'Күніңізді Ислам бойынша жоспарлаңыз: намаз трекері (Бамдат, Бесін, Екінті, Ақшам, Құптан), Ақырет пен Дүние мақсаттары, Tafakkur тақтасы. Тегін және жарнамасыз.',
        og: {
            title: 'Barakah Planner — Исламдық Күнделік',
            description: 'Намаз трекері, Ақырет пен Дүние мақсаттары, Tafakkur тақтасы. Тегін және жарнамасыз.',
            image: `${BASE_URL}/public/banner-kk.png`,
            locale: 'kk_KZ',
        },
        langParam: 'kk',
    },
    en: {
        htmlLang: 'en',
        dir: 'ltr',
        title: 'Barakah Planner — Islamic Daily Planner & Prayer Tracker',
        description: 'Plan your day according to Islam: prayer tracker (Fajr, Dhuhr, Asr, Maghrib, Isha), Akhirah & Dunya goals, Tafakkur idea board, cloud sync. Free and ad-free.',
        og: {
            title: 'Barakah Planner — Islamic Daily Planner',
            description: 'Prayer tracker, Akhirah & Dunya goals, Tafakkur board. Free and ad-free.',
            image: `${BASE_URL}/public/banner-en.png`,
            locale: 'en_US',
        },
        langParam: 'en',
    },
    ar: {
        htmlLang: 'ar',
        dir: 'rtl',
        title: 'Barakah Planner — يوميات إسلامية ومخطط الصلاة',
        description: 'خطط ليومك وفقًا للإسلام: متتبع الصلاة (الفجر، الظهر، العصر، المغرب، العشاء)، أهداف الآخرة والدنيا، لوحة أفكار تفكر. مجاني وبلا إعلانات.',
        og: {
            title: 'Barakah Planner — يوميات إسلامية',
            description: 'متتبع الصلاة، أهداف الآخرة والدنيا، لوحة تفكر. مجاني وبلا إعلانات.',
            image: `${BASE_URL}/public/banner-ar.png`,
            locale: 'ar_SA',
        },
        langParam: 'ar',
    },
};

// Read the main Russian index.html from dist/
const basePath = path.join(__dirname, 'dist', 'index.html');
const baseHtml = fs.readFileSync(basePath, 'utf-8');

for (const [lang, cfg] of Object.entries(LANGS)) {
    let html = baseHtml;

    // 1. Switch html[lang] and dir
    html = html.replace(/<html lang="[^"]*"/, `<html lang="${cfg.htmlLang}"`);
    html = html.replace(/(<html[^>]*)(>)/, `$1 dir="${cfg.dir}"$2`);
    // avoid double dir= if already present
    html = html.replace(/dir="[^"]*"\s*dir="[^"]*"/, `dir="${cfg.dir}"`);

    // 2. Switch <title>
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${cfg.title}</title>`);

    // 3. Switch primary meta description
    html = html.replace(
        /<meta name="description"\s+content="[^"]*">/,
        `<meta name="description" content="${cfg.description}">`
    );

    // 4. Switch OG tags
    html = html.replace(/(<meta property="og:title" content=")[^"]*"/, `$1${cfg.og.title}"`);
    html = html.replace(/(<meta property="og:description"\s+content=")[^"]*"/, `$1${cfg.og.description}"`);
    html = html.replace(/(<meta property="og:image" content=")[^"]*"/, `$1${cfg.og.image}"`);
    html = html.replace(/(<meta property="og:locale" content=")[^"]*"/, `$1${cfg.og.locale}"`);
    html = html.replace(/(<meta property="og:url" content=")[^"]*"/, `$1${BASE_URL}/${lang}/"`);

    // 5. Switch Twitter card tags
    html = html.replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${cfg.og.title}"`);
    html = html.replace(/(<meta name="twitter:description"\s+content=")[^"]*"/, `$1${cfg.og.description}"`);
    html = html.replace(/(<meta name="twitter:image" content=")[^"]*"/, `$1${cfg.og.image}"`);

    // 6. Switch canonical URL
    html = html.replace(/(<link rel="canonical" href=")[^"]*"/, `$1${BASE_URL}/${lang}/"`);

    // 7. Inject default lang for i18n script so page auto-starts in the correct language
    const initScript = `\n    <script>/* SSG language seed */localStorage.setItem('barakah_lang','${lang}');</script>`;
    html = html.replace(/(<script\s+type="module")/, `${initScript}\n    $1`);

    // 8. Fix relative paths → absolute so /en/sw.js doesn't 404
    html = html.replace(/href="\.\/favicon\.ico"/g, 'href="/favicon.ico"');
    html = html.replace(/href="\.\/manifest\.json"/g, 'href="/manifest.json"');
    html = html.replace(/src="\.\/favicon\.ico"/g, 'src="/favicon.ico"');
    // SW registration: './sw.js' → '/sw.js' (must be absolute for correct scope)
    html = html.replace(/navigator\.serviceWorker\.register\(['"]\.\/sw\.js['"]\)/g,
        `navigator.serviceWorker.register('/sw.js')`);

    // 9. Write output file into dist/<lang>/index.html
    const outDir = path.join(__dirname, 'dist', lang);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'index.html');
    fs.writeFileSync(outPath, html, 'utf-8');

    console.log(`✅  dist/${lang}/index.html → title: "${cfg.title}"`);
}

console.log('\n🎉  Language pages generated successfully! Now run: firebase deploy --only hosting');
