const fs = require('fs');

try {
    const rawData = fs.readFileSync('api_all_cities.json', 'utf8');
    const cities = JSON.parse(rawData);
    const jsContent = 'const MUFTYAT_CITIES = ' + JSON.stringify(cities) + ';\nwindow.MUFTYAT_CITIES = MUFTYAT_CITIES;\n';
    fs.writeFileSync('src/js/muftyat-cities.js', jsContent, 'utf8');
    console.log('Successfully fixed src/js/muftyat-cities.js');
} catch (e) {
    console.error('Error:', e.message);
}
