import { ArrowLeft, Edit, ShieldAlert } from 'lucide-react';
import { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import { notFound } from 'next/navigation';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { BlogContent } from '@/components/blog/BlogContent';
import Container from '@/components/common/Container';
import FontSizeControls from '@/components/common/FontSizeControls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { requireAdminPage } from '@/lib/auth/server-guard';
import { getBlogPostBySlug } from '@/lib/blog';
import { getPostById, getPostBySlug } from '@/lib/blog-storage';
import { BlogPost, cmsPostToBlogPost } from '@/types/blog';

export const metadata: Metadata = {
  title: 'Draft Article Preview | CMS Admin',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export const dynamic = 'force-dynamic';

interface PreviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminDraftPreviewPage({
  params,
}: PreviewPageProps) {
  // 1. Strict administrator session verification (defense-in-depth)
  const admin = await requireAdminPage();
  const { id } = await params;

  // 2. Fetch from Redis first (by ID, then by slug)
  let redisPost = await getPostById(id);
  if (!redisPost) {
    redisPost = await getPostBySlug(id);
  }

  let post: BlogPost | null = null;
  let rawId = id;
  let isDraft = true;

  if (redisPost) {
    post = cmsPostToBlogPost(redisPost);
    rawId = redisPost.id;
    isDraft = redisPost.status !== 'published';
  } else {
    // Fallback to local filesystem MDX
    const localPost = getBlogPostBySlug(id);
    if (localPost) {
      post = localPost;
      isDraft = !localPost.frontmatter.published;
    }
  }

  // If not found in either source, return 404
  if (!post) {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen pb-24">
      <AdminHeader admin={admin} currentPage="edit" />

      {/* Prominent Sticky Draft Preview Banner */}
      <div className="sticky top-[57px] z-20 border-b border-amber-500/30 bg-amber-500/10 backdrop-blur-md dark:bg-amber-950/40">
        <Container className="py-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-foreground text-xs font-semibold">
                {isDraft
                  ? 'Administrator Draft Preview'
                  : 'Published Article Preview'}
              </span>
              <Badge
                variant={isDraft ? 'secondary' : 'default'}
                className={
                  isDraft
                    ? 'bg-amber-500/20 text-[10px] text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-600 text-[10px] text-white'
                }
              >
                {isDraft ? 'Unpublished Draft' : 'Live'}
              </Badge>
              <span className="text-muted-foreground hidden text-xs md:inline">
                • Hidden from public visitors
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 text-xs"
              >
                <Link href={`/admin/blog/${rawId}/edit`}>
                  <Edit className="mr-1.5 size-3" />
                  <span>Edit in CMS</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href="/admin/blog">
                  <ArrowLeft className="mr-1.5 size-3" />
                  <span>Back to Articles</span>
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Full-Fidelity Article Preview Container */}
      <Container className="py-12">
        <div className="space-y-10">
          <BlogContent
            frontmatter={post.frontmatter}
            content={post.content}
            readingTime={post.readingTime}
            toc={post.toc}
          />

          <Separator className="mx-auto max-w-3xl" />

          {/* Bottom Navigation */}
          <div className="mx-auto flex max-w-3xl justify-between pt-4">
            <Button variant="outline" asChild className="gap-2">
              <Link href="/admin/blog">
                <ArrowLeft className="size-4" />
                <span>Return to Dashboard</span>
              </Link>
            </Button>

            <Button asChild className="gap-2">
              <Link href={`/admin/blog/${rawId}/edit`}>
                <Edit className="size-4" />
                <span>Edit Article</span>
              </Link>
            </Button>
          </div>
        </div>
      </Container>

      <FontSizeControls />
    </div>
  );
}
