import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
    plugins: [
        tailwindcss(),
        viteSingleFile(),
    ],
    server: {
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
        }
    }
});
