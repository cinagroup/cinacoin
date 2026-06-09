/**
 * Server component for injecting JSON-LD structured data.
 * Usage: <StructuredData data={yourSchemaObject} />
 */
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
