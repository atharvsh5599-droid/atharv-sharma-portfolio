import { NextResponse } from 'next/server';

import {
  BlogValidationError,
  PostNotFoundError,
  RedisNotConfiguredError,
  SlugConflictError,
  sanitizeErrorMessage,
} from './blog-errors';

/**
 * Strict cache prevention headers for all authenticated admin endpoints.
 * Ensures sensitive draft content and admin state are never stored by CDNs or browsers.
 */
export const ADMIN_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
} as const;

/**
 * Edge and browser caching headers for published public blog content.
 */
export const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
} as const;

/**
 * Centralized error handler for Blog CMS API endpoints.
 * Maps domain errors to standard HTTP response codes and sanitizes error details.
 */
export function handleApiError(
  error: unknown,
  isPublic: boolean = false,
): NextResponse {
  const headers = isPublic ? PUBLIC_CACHE_HEADERS : ADMIN_CACHE_HEADERS;

  // 1. Validation errors -> 400 Bad Request
  if (error instanceof BlogValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        issues: error.issues,
      },
      { status: 400, headers },
    );
  }

  // 2. Slug collision -> 409 Conflict
  if (error instanceof SlugConflictError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        slug: error.slug,
      },
      { status: 409, headers },
    );
  }

  // 3. Post not found -> 404 Not Found
  if (error instanceof PostNotFoundError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 404, headers },
    );
  }

  // 4. Redis unconfigured or unavailable -> 503 Service Unavailable
  if (error instanceof RedisNotConfiguredError) {
    return NextResponse.json(
      {
        success: false,
        error: sanitizeErrorMessage(error),
      },
      { status: 503, headers },
    );
  }

  // 5. Malformed JSON parsing error -> 400 Bad Request
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return NextResponse.json(
      {
        success: false,
        error: 'Malformed JSON payload in request body.',
      },
      { status: 400, headers },
    );
  }

  // 6. Generic or unknown errors -> 500 Internal Server Error (Sanitized)
  console.error('[blog-api] Unhandled server error:', error);
  return NextResponse.json(
    {
      success: false,
      error: sanitizeErrorMessage(error),
    },
    { status: 500, headers },
  );
}
