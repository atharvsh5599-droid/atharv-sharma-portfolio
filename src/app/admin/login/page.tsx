import { AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth, signIn } from '@/auth';
import Container from '@/components/common/Container';
import Github from '@/components/svgs/Github';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { isAllowedAdminGithubId } from '@/lib/auth/admin-allowlist';

export const metadata: Metadata = {
  title: 'Admin Sign In | Atharv Sharma',
  robots: {
    index: false,
    follow: false,
  },
};

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    callbackUrl?: string;
  }>;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const { error, callbackUrl } = await searchParams;

  // If already authenticated with authorized GitHub ID, redirect straight to /admin/blog
  if (
    session?.user?.githubId &&
    isAllowedAdminGithubId(session.user.githubId)
  ) {
    redirect('/admin/blog');
  }

  const getErrorMessage = (err?: string) => {
    switch (err) {
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          desc: 'Your GitHub account is not on the administrator allowlist. Administration is restricted exclusively to the portfolio owner.',
        };
      case 'Configuration':
        return {
          title: 'Configuration Error',
          desc: 'Server authentication configuration is incomplete. Required environment variables are missing.',
        };
      case 'OAuthSignin':
      case 'OAuthCallback':
        return {
          title: 'Sign-in Failed',
          desc: 'An error occurred during GitHub authorization. Please try again.',
        };
      default:
        return null;
    }
  };

  const errorDetails = getErrorMessage(error);

  return (
    <Container className="flex min-h-[75vh] items-center justify-center py-16">
      <Card className="border-border/80 bg-card/90 w-full max-w-md shadow-lg backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
            <Lock className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Blog Administration
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Sign in with your authorized GitHub account to manage portfolio blog
            posts.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorDetails && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="size-4" />
              <AlertTitle>{errorDetails.title}</AlertTitle>
              <AlertDescription className="text-xs">
                {errorDetails.desc}
              </AlertDescription>
            </Alert>
          )}

          <div className="border-border/60 bg-muted/40 rounded-lg border p-3.5 text-xs">
            <div className="text-foreground flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="text-primary size-4" />
              <span>Allowlist Protected</span>
            </div>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Access is strictly restricted by server-side GitHub numeric user
              ID. Any unauthorized account will be rejected automatically.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <form
            action={async () => {
              'use server';
              await signIn('github', {
                redirectTo: callbackUrl || '/admin/blog',
              });
            }}
            className="w-full"
          >
            <Button type="submit" size="lg" className="w-full gap-2 rounded-xl">
              <Github className="size-5" />
              <span>Sign in with GitHub</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </Container>
  );
}
