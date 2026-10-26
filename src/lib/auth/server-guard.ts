import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

import { auth } from '@/auth';

import { getAdminGithubIds, isAllowedAdminGithubId } from './admin-allowlist';

export interface AdminUser {
  githubId: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface AdminAuthResult {
  isAuthorized: boolean;
  status: 200 | 401 | 403 | 500;
  error?: string;
  user?: AdminUser;
}

/**
 * Validates the current session against the server-side numeric GitHub ID allowlist.
 * Never trusts client headers, client cookies, or client query params.
 */
export async function verifyAdminSession(): Promise<AdminAuthResult> {
  // 1. Fail safe: verify that server configuration is present
  const adminIds = getAdminGithubIds();
  if (adminIds.size === 0) {
    console.error(
      '[auth:guard] ADMIN_GITHUB_ID is not configured on the server.',
    );
    return {
      isAuthorized: false,
      status: 500,
      error:
        'Server configuration error: Administrator allowlist is not configured.',
    };
  }

  // 2. Fetch authenticated session via Auth.js (verified via cryptographic JWT signature)
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error('[auth:guard] Error reading auth session:', error);
    return {
      isAuthorized: false,
      status: 500,
      error: 'Authentication verification encountered a server error.',
    };
  }

  // 3. Reject unauthenticated requests
  if (!session || !session.user) {
    return {
      isAuthorized: false,
      status: 401,
      error:
        'Authentication required. Please sign in with the authorized GitHub administrator account.',
    };
  }

  // 4. Verify numeric GitHub account ID from verified token
  const githubId = session.user.githubId;
  if (!githubId || !isAllowedAdminGithubId(githubId)) {
    console.warn(
      `[auth:guard] Access denied: User with GitHub ID "${githubId || 'none'}" is not in the allowlist.`,
    );
    return {
      isAuthorized: false,
      status: 403,
      error:
        'Access denied: Your GitHub account is not authorized to access this administration area.',
    };
  }

  return {
    isAuthorized: true,
    status: 200,
    user: {
      githubId,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  };
}

/**
 * Guard utility for Route Handlers (app/api/admin/...)
 * Returns { authorized: true, user } or { authorized: false, response } for immediate return.
 */
export async function assertAdminApi(): Promise<
  | { authorized: true; user: AdminUser }
  | { authorized: false; response: NextResponse }
> {
  const result = await verifyAdminSession();

  if (!result.isAuthorized || !result.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: result.error || 'Unauthorized',
        },
        {
          status: result.status,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        },
      ),
    };
  }

  return {
    authorized: true,
    user: result.user,
  };
}

/**
 * Guard utility for Server Components (app/admin/...)
 * Redirects to /admin/login if unauthenticated or unauthorized.
 */
export async function requireAdminPage(): Promise<AdminUser> {
  const result = await verifyAdminSession();

  if (!result.isAuthorized || !result.user) {
    if (result.status === 403) {
      redirect('/admin/login?error=AccessDenied');
    } else if (result.status === 500) {
      redirect('/admin/login?error=Configuration');
    } else {
      redirect('/admin/login');
    }
  }

  return result.user;
}
