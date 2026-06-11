/**
 * Sanitize JSON string for safe embedding inside a <script> tag.
 * Replaces characters that could break out of the script context or
 * be abused for XSS (e.g. `</script>`, HTML entities, quotes).
 */
function sanitizeJsonForScript(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027')
    .replace(/"/g, '\\u0022');
}

/**
 * Server component for injecting JSON-LD structured data.
 * Usage: <StructuredData data={yourSchemaObject} />
 */
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(data) }}
    />
  );
}
