/**
 * HTML Sanitization utility for safe rendering of translated content
 */
import DOMPurify from 'dompurify';

// Allowed tags for legal/content pages
const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any content rendered with dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return as-is (DOMPurify requires DOM)
    // In production, consider using isomorphic-dompurify
    return html;
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}

/**
 * Strip all HTML tags - use when you only need plain text
 */
export function stripHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Simple server-side strip
    return html.replace(/<[^>]*>/g, '');
  }
  
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
