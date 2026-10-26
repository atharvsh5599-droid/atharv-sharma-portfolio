export type BlogCategory =
  'DSA' | 'C++' | 'Web Development' | 'AI/ML' | 'Projects' | 'Learning Notes';

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  category?: BlogCategory | string;
  tags: string[];
  published?: boolean;
  isPublished?: boolean; // backwards compatibility
  coverImage?: string;
  image?: string; // backwards compatibility
  readTime?: string;
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
  readingTime: string;
  toc?: TableOfContentsItem[];
  prevPost?: BlogPostPreview | null;
  nextPost?: BlogPostPreview | null;
}

export interface BlogPostPreview {
  slug: string;
  frontmatter: BlogFrontmatter;
  readingTime: string;
}

/**
 * Status of a blog post in the CMS / Redis database.
 */
export type BlogPostStatus = 'draft' | 'published';

/**
 * Strict database model for blog posts stored in Upstash Redis.
 */
export interface CmsBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  status: BlogPostStatus;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  publishedAt?: string | null; // ISO 8601 string when published
  seoTitle?: string;
  seoDescription?: string;
  category?: BlogCategory | string;
  readingTime?: string;
}

/**
 * Convenience aliases for CMS blog post model
 */
export type BlogPostRecord = CmsBlogPost;
export type StoredBlogPost = CmsBlogPost;

/**
 * Server-side input for creating a new blog post.
 */
export interface CreateBlogPostInput {
  title: string;
  content: string;
  slug?: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  status?: BlogPostStatus;
  publishedAt?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  category?: BlogCategory | string;
  id?: string;
}

/**
 * Server-side input for updating an existing blog post.
 */
export interface UpdateBlogPostInput {
  title?: string;
  content?: string;
  slug?: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  status?: BlogPostStatus;
  publishedAt?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  category?: BlogCategory | string;
}

/**
 * Query options for listing posts from storage.
 */
export interface BlogListOptions {
  status?: 'all' | 'published' | 'draft';
  limit?: number;
  offset?: number;
  tag?: string;
}

/**
 * Paginated response when querying posts.
 */
export interface BlogListResult {
  posts: CmsBlogPost[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

/**
 * Converts a CmsBlogPost database record into the BlogPost shape used by the portfolio renderer.
 */
export function cmsPostToBlogPost(cmsPost: CmsBlogPost): BlogPost {
  const isPublished = cmsPost.status === 'published';
  const coverImage = cmsPost.coverImage || '/meta/blogs.png';
  const category = (cmsPost.category as BlogCategory) || 'Learning Notes';

  return {
    slug: cmsPost.slug,
    frontmatter: {
      title: cmsPost.title,
      description: cmsPost.excerpt || cmsPost.seoDescription || '',
      date: cmsPost.publishedAt || cmsPost.createdAt,
      category,
      tags: cmsPost.tags,
      published: isPublished,
      isPublished,
      coverImage,
      image: coverImage,
      readTime: cmsPost.readingTime,
    },
    content: cmsPost.content,
    readingTime: cmsPost.readingTime || '1 min read',
  };
}

/**
 * Converts a CmsBlogPost into a BlogPostPreview for listing views.
 */
export function cmsPostToPreview(cmsPost: CmsBlogPost): BlogPostPreview {
  const isPublished = cmsPost.status === 'published';
  const coverImage = cmsPost.coverImage || '/meta/blogs.png';
  const category = (cmsPost.category as BlogCategory) || 'Learning Notes';

  return {
    slug: cmsPost.slug,
    frontmatter: {
      title: cmsPost.title,
      description: cmsPost.excerpt || cmsPost.seoDescription || '',
      date: cmsPost.publishedAt || cmsPost.createdAt,
      category,
      tags: cmsPost.tags,
      published: isPublished,
      isPublished,
      coverImage,
      image: coverImage,
      readTime: cmsPost.readingTime,
    },
    readingTime: cmsPost.readingTime || '1 min read',
  };
}
