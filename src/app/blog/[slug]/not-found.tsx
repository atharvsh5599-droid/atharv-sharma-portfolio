import { FileQuestion, Home } from 'lucide-react';
import { Link } from 'next-view-transitions';

import Container from '@/components/common/Container';
import ArrowLeft from '@/components/svgs/ArrowLeft';
import { Button } from '@/components/ui/button';

export default function BlogPostNotFound() {
  return (
    <Container className="py-24">
      <div className="border-border/60 bg-card mx-auto max-w-xl rounded-2xl border p-8 text-center shadow-sm sm:p-12">
        <div className="bg-muted text-muted-foreground mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
          <FileQuestion className="size-8" />
        </div>

        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          Article Not Found
        </h1>

        <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed sm:text-base">
          The article you are looking for does not exist, has been removed, or
          is currently unpublished.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="default" className="gap-2">
            <Link href="/blog">
              <ArrowLeft className="size-4" />
              <span>Browse All Articles</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              <span>Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
