/**
 * Security Utility — XSS Prevention
 * Provides safe HTML escaping for user-generated content.
 * 
 * Usage:
 *   import { escapeHtml } from './utils/sanitize.js';
 *   element.innerHTML = `<span>${escapeHtml(userInput)}</span>`;
 */

/**
 * Escapes HTML entities to prevent XSS attacks.
 * Use this when inserting user-generated content into HTML templates.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for innerHTML
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Expose globally for non-module scripts (board.js, main.js)
window.escapeHtml = escapeHtml;

/**
 * Safely sets text content on an element (inherently XSS-safe).
 * Use this instead of innerHTML when you only need plain text.
 * @param {HTMLElement} element - The target element
 * @param {string} text - The text to set
 */
export function safeSetText(element, text) {
    if (element) {
        element.textContent = text ?? '';
    }
}
