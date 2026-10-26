import { FileQuestion, Home } from 'lucide-react';
import { Metadata } from 'next';
import { Link } from 'next-view-transitions';

import Container from '@/components/common/Container';
import ArrowLeft from '@/components/svgs/ArrowLeft';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Page Not Found | Atharv Sharma',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootNotFound() {
  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-24">
      <div className="border-border/60 bg-card mx-auto max-w-lg rounded-2xl border p-8 text-center shadow-sm sm:p-12">
        <div className="bg-primary/10 text-primary mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
          <FileQuestion className="size-8" />
        </div>

        <h1 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
          404 - Page Not Found
        </h1>

        <p className="text-muted-foreground mx-auto mt-4 max-w-sm text-sm leading-relaxed sm:text-base">
          The page or article you are searching for does not exist, has been
          relocated, or is currently unpublished.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="default" className="gap-2 rounded-xl">
            <Link href="/blog">
              <ArrowLeft className="size-4" />
              <span>Browse Blog Articles</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link href="/">
              <Home className="size-4" />
              <span>Go to Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
