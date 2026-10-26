import { Metadata } from 'next';

import { siteConfig } from '@/config/Meta';

import { getUnifiedBlogPostBySlug } from './blog';

/**
 * Strict robots meta directives for all administration and preview pages.
 */
export const ADMIN_ROBOTS_DIRECTIVES: Metadata['robots'] = {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true,
  nocache: true,
};

/**
 * Pure server-side generator for single blog post SEO and OpenGraph metadata.
 * Strictly prevents data leakage by returning 404/noindex metadata for unpublished drafts.
 */
export async function generateBlogPostMetadata(
  slug: string,
): Promise<Metadata> {
  const post = await getUnifiedBlogPostBySlug(slug);

  // SECURITY REQUIREMENT: Never leak draft metadata into search engine results or OpenGraph
  if (!post || !post.frontmatter.published) {
    return {
      title: 'Post Not Found | Atharv Sharma',
      robots: {
        index: false,
        follow: false,
        noarchive: true,
      },
    };
  }

  const { title, description, coverImage, image, date, tags } =
    post.frontmatter;
  const metaTitle = title;
  const metaDesc = description;
  const postImage = coverImage || image || '/meta/blogs.png';
  const url = `${siteConfig.url}/blog/${slug}`;

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${metaTitle} | Atharv Sharma`,
    description: metaDesc,
    keywords: tags,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url,
      images: [
        {
          url: postImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      type: 'article',
      publishedTime: date,
      authors: [siteConfig.author.name],
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDesc,
      images: [postImage],
    },
    robots: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}
