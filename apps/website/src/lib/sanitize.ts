/**
 * HTML Sanitization utility for safe rendering of translated content
 * Uses isomorphic-dompurify for both client and server-side sanitization
 */
import DOMPurify from 'isomorphic-dompurify';

// Allowed tags for legal/content pages
const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any content rendered with dangerouslySetInnerHTML
 * Works on both client and server (SSR)
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}

/**
 * Strip all HTML tags - use when you only need plain text
 * Works on both client and server (SSR)
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
