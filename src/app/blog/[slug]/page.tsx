import { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import { notFound } from 'next/navigation';

import { BlogContent } from '@/components/blog/BlogContent';
import { BlogList } from '@/components/blog/BlogList';
import Container from '@/components/common/Container';
import FontSizeControls from '@/components/common/FontSizeControls';
import ArrowLeft from '@/components/svgs/ArrowLeft';
import ArrowRight from '@/components/svgs/ArrowRight';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { siteConfig } from '@/config/Meta';
import {
  getAdjacentPosts,
  getBlogPostBySlug,
  getPublishedBlogPosts,
  getRelatedPosts,
} from '@/lib/blog';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static paths for all published blog posts
export async function generateStaticParams() {
  const posts = getPublishedBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for each blog post
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post || !post.frontmatter.published) {
    return {
      title: 'Post Not Found | Atharv Sharma',
    };
  }

  const { title, description, coverImage, image, date, tags } =
    post.frontmatter;
  const postImage = coverImage || image || '/meta/blogs.png';
  const url = `${siteConfig.url}/blog/${slug}`;

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${title} | Atharv Sharma`,
    description,
    keywords: tags,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: postImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'article',
      publishedTime: date,
      authors: [siteConfig.author.name],
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [postImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post || !post.frontmatter.published) {
    notFound();
  }

  const { prevPost, nextPost } = getAdjacentPosts(slug);
  const relatedPosts = getRelatedPosts(slug, 2);

  return (
    <>
      <Container className="py-16">
        <div className="space-y-12">
          {/* Back Button */}
          <div>
            <Button variant="ghost" asChild className="group">
              <Link href="/blog" className="flex items-center space-x-2">
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                <span>Back to Articles</span>
              </Link>
            </Button>
          </div>

          {/* Main Article Content */}
          <BlogContent
            frontmatter={post.frontmatter}
            content={post.content}
            readingTime={post.readingTime}
            toc={post.toc}
          />

          {/* Previous / Next Article Navigation */}
          {(prevPost || nextPost) && (
            <div className="mx-auto max-w-3xl pt-6">
              <Separator className="mb-8" />
              <div className="grid gap-4 sm:grid-cols-2">
                {prevPost ? (
                  <Link
                    href={`/blog/${prevPost.slug}`}
                    className="group border-border/70 hover:border-foreground/30 hover:bg-muted/30 rounded-xl border p-4 transition-colors"
                  >
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-1" />{' '}
                      Older Article
                    </span>
                    <p className="group-hover:text-primary text-foreground mt-1 line-clamp-1 text-sm font-semibold">
                      {prevPost.frontmatter.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
                {nextPost ? (
                  <Link
                    href={`/blog/${nextPost.slug}`}
                    className="group border-border/70 hover:border-foreground/30 hover:bg-muted/30 rounded-xl border p-4 text-right transition-colors sm:col-start-2"
                  >
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      Newer Article{' '}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </span>
                    <p className="group-hover:text-primary text-foreground mt-1 line-clamp-1 text-sm font-semibold">
                      {nextPost.frontmatter.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <div className="mx-auto max-w-3xl space-y-6 pt-6">
              <Separator />
              <div className="space-y-6">
                <h2 className="text-foreground text-2xl font-bold tracking-tight">
                  Related Articles
                </h2>
                <BlogList posts={relatedPosts} />
              </div>
            </div>
          )}

          {/* Back to Blog CTA */}
          <div className="pt-4 text-center">
            <Separator className="mx-auto mb-8 max-w-3xl" />
            <Button asChild size="lg" className="rounded-xl px-8">
              <Link href="/blog">Browse All Articles</Link>
            </Button>
          </div>
        </div>
      </Container>
      <FontSizeControls />
    </>
  );
}
