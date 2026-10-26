import { Metadata } from 'next';
import { Suspense } from 'react';

import Container from '@/components/common/Container';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { siteConfig } from '@/config/Meta';
import { getUnifiedPublishedBlogPosts, getUnifiedTags } from '@/lib/blog';

import { BlogPageClient } from './BlogPageClient';

export const revalidate = 60;

export const generateMetadata = (): Metadata => {
  const title = 'Blog & Engineering Notes | Atharv Sharma';
  const description =
    'Practical tutorials, deep dives, and technical notes on C++, Data Structures & Algorithms, and modern web engineering by Atharv Sharma.';
  const url = `${siteConfig.url}/blog`;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: '/meta/blogs.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/meta/blogs.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
};

function BlogPageLoading() {
  return (
    <Container className="py-16">
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-12 w-48 rounded-xl" />
          <Skeleton className="mx-auto h-6 w-96 rounded-lg" />
        </div>

        <Separator />

        {/* Categories Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Blog Posts Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-xl border p-5">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}

export default async function BlogPage() {
  const allPosts = await getUnifiedPublishedBlogPosts();
  const allTags = await getUnifiedTags();

  return (
    <Suspense fallback={<BlogPageLoading />}>
      <BlogPageClient initialPosts={allPosts} initialTags={allTags} />
    </Suspense>
  );
}
