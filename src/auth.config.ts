import type { NextAuthConfig } from 'next-auth';

import {
  getAdminGithubIds,
  isAllowedAdminGithubId,
} from './lib/auth/admin-allowlist';

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const githubId = auth?.user?.githubId;
      const isAdmin = !!githubId && isAllowedAdminGithubId(githubId);

      const isProtectedAdminRoute =
        nextUrl.pathname.startsWith('/admin') &&
        !nextUrl.pathname.startsWith('/admin/login');
      const isProtectedAdminApi = nextUrl.pathname.startsWith('/api/admin');

      if (isProtectedAdminApi) {
        // API routes will be rejected or allowed
        return isAdmin;
      }

      if (isProtectedAdminRoute) {
        if (!isLoggedIn) return false; // redirect to signIn page
        if (!isAdmin) return false;
        return true;
      }

      return true;
    },
    async jwt({ token, profile, account }) {
      // profile is available on initial sign in
      if (profile?.id != null) {
        token.githubId = String(profile.id);
      } else if (account?.providerAccountId) {
        token.githubId = account.providerAccountId;
      }

      if (token.githubId != null) {
        token.isAdmin = isAllowedAdminGithubId(String(token.githubId));
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.githubId = (token.githubId as string) || undefined;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
    async signIn({ account, profile }) {
      // Server-side allowlist gate at the very moment of sign in
      const adminIds = getAdminGithubIds();

      // Safe fail: if allowlist is empty, reject all sign-ins
      if (adminIds.size === 0) {
        console.error(
          '[auth] ADMIN_GITHUB_ID is not configured on the server. Rejecting sign-in attempt.',
        );
        return false;
      }

      // Check the immutable numeric GitHub user ID
      const githubId =
        profile?.id != null ? String(profile.id) : account?.providerAccountId;

      if (!githubId || !isAllowedAdminGithubId(githubId)) {
        console.warn(
          `[auth] Access denied: Unauthorized GitHub numeric ID (${githubId || 'unknown'}) attempted sign-in.`,
        );
        return false; // Auth.js redirects to error page with ?error=AccessDenied
      }

      return true;
    },
  },
};
