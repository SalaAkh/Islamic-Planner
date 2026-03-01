// =====================================================================
// CRYPTO STORAGE — Secure localStorage for sensitive data
// Uses Web Crypto API (AES-GCM 256-bit). No external dependencies.
// =====================================================================

const CRYPTO_KEY_STORE = 'barakah_crypto_key';
const AI_KEY_STORE     = 'barakah_ai_key';

/** Convert ArrayBuffer to base64 string */
function bufToB64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/** Convert base64 string to ArrayBuffer */
function b64ToBuf(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}

/** Get (or generate) the persistent AES-GCM CryptoKey for this device */
async function getOrCreateCryptoKey() {
    const stored = localStorage.getItem(CRYPTO_KEY_STORE);
    if (stored) {
        const raw = b64ToBuf(stored);
        return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    }
    // Generate a new 256-bit key and persist the raw bytes
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const raw = await crypto.subtle.exportKey('raw', key);
    localStorage.setItem(CRYPTO_KEY_STORE, bufToB64(raw));
    return key;
}

/**
 * Encrypt a plain-text string and store it under AI_KEY_STORE.
 * @param {string} plainText
 */
window.encryptApiKey = async function(plainText) {
    try {
        const key  = await getOrCreateCryptoKey();
        const iv   = crypto.getRandomValues(new Uint8Array(12));
        const enc  = new TextEncoder();
        const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));

        // Store  iv + ciphertext as base64
        const combined = new Uint8Array(iv.byteLength + data.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(data), iv.byteLength);
        localStorage.setItem(AI_KEY_STORE, bufToB64(combined.buffer));
    } catch (e) {
        console.error('[CryptoStorage] Encrypt failed:', e);
    }
};

/**
 * Decrypt and return the stored API key, or '' if not found / corrupted.
 * @returns {Promise<string>}
 */
window.decryptApiKey = async function() {
    try {
        const raw = localStorage.getItem(AI_KEY_STORE);
        if (!raw) return '';
        const key      = await getOrCreateCryptoKey();
        const combined = new Uint8Array(b64ToBuf(raw));
        const iv       = combined.slice(0, 12);
        const data     = combined.slice(12).buffer;
        const dec      = new TextDecoder();
        const plain    = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        return dec.decode(plain);
    } catch (e) {
        // Key may have been rotated or storage corrupted — clear and return empty
        console.warn('[CryptoStorage] Decrypt failed, clearing stored key:', e);
        localStorage.removeItem(AI_KEY_STORE);
        return '';
    }
};
