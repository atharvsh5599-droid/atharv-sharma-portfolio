/**
 * Server-side allowlist and configuration helper for Portfolio Admin.
 *
 * Enforces strict authorization by GitHub numeric account ID.
 * Usernames, email addresses, and client-supplied headers are NEVER used for authorization.
 */

/**
 * Returns a Set of allowed GitHub numeric IDs (as strings).
 * Reads from ADMIN_GITHUB_ID (single) and ADMIN_GITHUB_IDS (comma-separated).
 */
export function getAdminGithubIds(): Set<string> {
  const ids = new Set<string>();

  const singleId = process.env.ADMIN_GITHUB_ID?.trim();
  if (singleId) {
    ids.add(singleId);
  }

  const multiIds = process.env.ADMIN_GITHUB_IDS?.trim();
  if (multiIds) {
    multiIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .forEach((id) => ids.add(id));
  }

  return ids;
}

/**
 * Validates whether a given GitHub numeric account ID is authorized.
 * Strict comparison against server-side allowlist.
 */
export function isAllowedAdminGithubId(
  id: string | number | null | undefined,
): boolean {
  if (id === null || id === undefined) {
    return false;
  }

  const normalized = String(id).trim();
  if (!normalized) {
    return false;
  }

  const allowedIds = getAdminGithubIds();
  // Safe fail: if allowlist is empty, nobody is authorized.
  if (allowedIds.size === 0) {
    return false;
  }

  return allowedIds.has(normalized);
}

/**
 * Diagnostic helper to verify whether all required auth environment variables are present.
 * Fails safely without exposing secret values.
 */
export function checkAuthConfig(): {
  isConfigured: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    missing.push('AUTH_SECRET');
  }

  const clientId = process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    missing.push('AUTH_GITHUB_ID (or GITHUB_CLIENT_ID)');
  }

  const clientSecret =
    process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;
  if (!clientSecret) {
    missing.push('AUTH_GITHUB_SECRET (or GITHUB_CLIENT_SECRET)');
  }

  const adminIds = getAdminGithubIds();
  if (adminIds.size === 0) {
    missing.push('ADMIN_GITHUB_ID (or ADMIN_GITHUB_IDS)');
  }

  return {
    isConfigured: missing.length === 0,
    missing,
  };
}
