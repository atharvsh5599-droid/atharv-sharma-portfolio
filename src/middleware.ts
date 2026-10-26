import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig } from './auth.config';
import { isAllowedAdminGithubId } from './lib/auth/admin-allowlist';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const githubId = session?.user?.githubId;
  const isAuthorized = !!githubId && isAllowedAdminGithubId(githubId);

  const isLoginPage = nextUrl.pathname === '/admin/login';
  const isAdminApi = nextUrl.pathname.startsWith('/api/admin');
  const isAdminPage = nextUrl.pathname.startsWith('/admin') && !isLoginPage;

  // If user visits /admin/login while already authenticated as admin, redirect to /admin/blog
  if (isLoginPage) {
    if (isAuthorized) {
      return NextResponse.redirect(new URL('/admin/blog', nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Protect all /api/admin/* endpoints
  if (isAdminApi) {
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unauthorized: Authentication required. Please sign in via GitHub.',
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        },
      );
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Forbidden: Your GitHub account is not authorized for administration.',
        },
        {
          status: 403,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        },
      );
    }

    return NextResponse.next();
  }

  // Protect all /admin/* pages (e.g. /admin/blog, /admin/blog/new, /admin/blog/:id/preview)
  if (isAdminPage) {
    if (!session?.user) {
      const loginUrl = new URL('/admin/login', nextUrl.origin);
      loginUrl.searchParams.set(
        'callbackUrl',
        nextUrl.pathname + nextUrl.search,
      );
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return redirectRes;
    }

    if (!isAuthorized) {
      const deniedUrl = new URL('/admin/login', nextUrl.origin);
      deniedUrl.searchParams.set('error', 'AccessDenied');
      const redirectRes = NextResponse.redirect(deniedUrl);
      redirectRes.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return redirectRes;
    }

    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res;
  }

  const res = NextResponse.next();
  if (isLoginPage) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return res;
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
