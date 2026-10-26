import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

import { authConfig } from './auth.config';

const clientId = process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID;
const clientSecret =
  process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GitHub({
      clientId,
      clientSecret,
    }),
  ],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
