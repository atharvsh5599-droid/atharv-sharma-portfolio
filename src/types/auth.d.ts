import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      githubId?: string;
      isAdmin: boolean;
    } & DefaultSession['user'];
  }

  interface Profile {
    id?: number | string;
    login?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    githubId?: string;
    isAdmin?: boolean;
  }
}
