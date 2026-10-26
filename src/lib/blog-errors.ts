/**
 * Domain-specific error types and error sanitization for the Blog CMS and Redis storage layer.
 */

export class BlogStorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'BlogStorageError';
  }
}

export class PostNotFoundError extends BlogStorageError {
  constructor(public readonly identifier: string) {
    super(`Blog post "${identifier}" was not found.`);
    this.name = 'PostNotFoundError';
  }
}

export class SlugConflictError extends BlogStorageError {
  constructor(public readonly slug: string) {
    super(`A blog post with the slug "${slug}" already exists.`);
    this.name = 'SlugConflictError';
  }
}

export class BlogValidationError extends BlogStorageError {
  constructor(
    message: string,
    public readonly issues?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = 'BlogValidationError';
  }
}

export class RedisNotConfiguredError extends BlogStorageError {
  constructor() {
    super(
      'Redis storage is not configured. Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN.',
    );
    this.name = 'RedisNotConfiguredError';
  }
}

/**
 * Sanitizes any error message or unknown caught exception so that Redis credentials,
 * connection tokens, URLs, or internal stack traces are NEVER leaked to callers or the browser.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred.';
  }

  // Handle known domain errors with safe client messages
  if (error instanceof PostNotFoundError) {
    return error.message;
  }
  if (error instanceof SlugConflictError) {
    return error.message;
  }
  if (error instanceof BlogValidationError) {
    return error.message;
  }
  if (error instanceof RedisNotConfiguredError) {
    return 'Storage service is currently unavailable or unconfigured.';
  }

  let message = error instanceof Error ? error.message : String(error);

  // Redact URLs (e.g. Upstash REST endpoints)
  message = message.replace(/https?:\/\/[^\s"']+/gi, '[REDACTED_URL]');

  // Redact auth tokens, bearer headers, keys
  message = message.replace(
    /(?:token|key|secret|authorization|bearer|password)\s*[:=]\s*[^\s"']+/gi,
    'credential=[REDACTED]',
  );

  // Redact long hex/base64-looking random strings (potential tokens)
  message = message.replace(/[A-Za-z0-9_-]{32,}/g, '[REDACTED_SECRET]');

  // Redact file paths
  message = message.replace(/(?:\/[a-zA-Z0-9._-]+)+/g, '[REDACTED_PATH]');

  return message;
}
