/**
 * Serializes JSON-LD safely for an inline <script> tag.
 * Replacing HTML-significant characters prevents attacker-controlled content
 * such as product names/descriptions containing </script> from terminating
 * the script element before the JSON parser sees it.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
