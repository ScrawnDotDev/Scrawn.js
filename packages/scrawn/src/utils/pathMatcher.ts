/**
 * Match a path against a pattern with wildcard support.
 *
 * Supports:
 * - Exact match: /api/users
 * - Single segment wildcard (*): /api/star matches /api/users but not /api/users/123
 * - Multi-segment wildcard (**): /api/starstar matches /api/users, /api/users/123, etc.
 * - Mixed patterns: /api/star/profile, /api/starstar/data, starstar.php, etc.
 *
 * @param path - The request path to match
 * @param pattern - The pattern to match against
 * @returns true if the path matches the pattern
 *
 * @example
 * ```typescript
 * matchPath('/api/users', '/api/users') // true - exact match
 * matchPath('/api/users', '/api/*') // true - single segment wildcard
 * matchPath('/api/users/123', '/api/*') // false - too many segments
 * matchPath('/api/users/123', '/api/**') // true - multi-segment wildcard
 * matchPath('/api/v1/users/data', '/api/** /data') // true - mixed pattern
 * matchPath('/index.php', '**.php') // true - file extension match
 * ```
 */
export function matchPath(path: string, pattern: string): boolean {
  // Exact match
  if (path === pattern) return true;

  // No wildcards, no match
  if (!pattern.includes("*")) return false;

  // Convert pattern to regex
  // Escape special regex characters except * and /
  let regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    // Replace ** with a placeholder to handle it separately
    .replace(/\*\*/g, "___DOUBLE_STAR___")
    // Replace * with single segment match (anything except /)
    .replace(/\*/g, "[^/]+")
    // Replace ** placeholder with multi-segment match (anything including /)
    .replace(/___DOUBLE_STAR___/g, ".*");

  // Ensure we match the full path
  regexPattern = `^${regexPattern}$`;

  const regex = new RegExp(regexPattern);
  return regex.test(path);
}
