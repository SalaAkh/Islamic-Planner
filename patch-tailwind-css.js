import fs from 'fs';

const filePath = './src/css/tailwind.css';

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Finds the block with media tags and removes vertical-align from it
    const updatedContent = content.replace(
        /(img,\s*svg,\s*video,\s*canvas,\s*audio,\s*iframe,\s*embed,\s*object\s*\{[^}]*)vertical-align:\s*middle;([^}]*\})/g,
        '$1$2'
    );

    if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent);
        console.log('[Fix] Patched tailwind.css to remove vertical-align conflict.');
    }
}
