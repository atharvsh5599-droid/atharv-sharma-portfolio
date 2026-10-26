import Container from '@/components/common/Container';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPostLoading() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        {/* Back Button Skeleton */}
        <Skeleton className="h-9 w-36 rounded-lg" />

        {/* Header Skeleton */}
        <div className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>

          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4 rounded-lg" />

          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>

          <Skeleton className="aspect-video w-full rounded-xl" />

          <Separator />
        </div>

        {/* Content Paragraph Skeletons */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <div className="pt-4">
            <Skeleton className="h-8 w-1/3 rounded-lg" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </div>
    </Container>
  );
}
