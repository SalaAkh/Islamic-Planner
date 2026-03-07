const fs = require('fs');
const https = require('https');

async function fetchAllCities() {
    let allCities = [];
    let nextUrl = 'https://api.muftyat.kz/cities/?format=json&limit=5000';

    console.log('Fetching cities...');

    while (nextUrl) {
        console.log(`Fetching ${nextUrl}...`);
        const data = await new Promise((resolve, reject) => {
            https.get(nextUrl, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve(JSON.parse(body)));
            }).on('error', reject);
        });

        if (data && data.results) {
            const mapped = data.results.map(c => ({
                i: c.id,
                t: c.title,
                la: c.lat,
                lo: c.lng,
                r: c.region || ''
            }));
            allCities = allCities.concat(mapped);
            nextUrl = data.next;
            // muftyat api uses http in next sometimes, so ensure https
            if (nextUrl && nextUrl.startsWith('http://')) {
                nextUrl = nextUrl.replace('http://', 'https://');
            }
        } else {
            break;
        }
    }

    console.log(`Fetched ${allCities.length} cities total.`);

    const jsContent = 'const MUFTYAT_CITIES = ' + JSON.stringify(allCities) + ';\nwindow.MUFTYAT_CITIES = MUFTYAT_CITIES;\n';
    fs.writeFileSync('src/js/muftyat-cities.js', jsContent, 'utf8');
    console.log('Successfully generated src/js/muftyat-cities.js');
}

fetchAllCities().catch(console.error);
