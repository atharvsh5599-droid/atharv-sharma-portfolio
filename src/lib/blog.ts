import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

import {
  BlogCategory,
  BlogFrontmatter,
  BlogPost,
  BlogPostPreview,
  TableOfContentsItem,
} from '@/types/blog';

const blogDirectory = path.join(process.cwd(), 'src/data/blog');

/**
 * Slugify heading text into a valid URL/HTML ID
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculate reading time from markdown content
 */
export function calculateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Extract Table of Contents from markdown H2 and H3 headings
 */
export function extractTableOfContents(content: string): TableOfContentsItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: TableOfContentsItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length; // 2 for h2, 3 for h3
    const rawText = match[2].trim();
    // Strip bold/italic/links markdown formatting from heading text
    const text = rawText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`(.*?)`/g, '$1');

    const id = slugify(text);

    if (id && text) {
      toc.push({ id, text, level });
    }
  }

  return toc;
}

/**
 * Get all blog post filenames (without extension) from the blog directory
 */
export function getBlogPostSlugs(): string[] {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const files = fs.readdirSync(blogDirectory);
  return files
    .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    .map((file) => file.replace(/\.(mdx|md)$/, ''));
}

/**
 * Normalize and validate frontmatter
 */
function normalizeFrontmatter(data: Record<string, unknown>): BlogFrontmatter {
  const isPublished =
    data.published !== undefined
      ? Boolean(data.published)
      : data.isPublished !== undefined
        ? Boolean(data.isPublished)
        : true;

  const coverImage =
    typeof data.coverImage === 'string'
      ? data.coverImage
      : typeof data.image === 'string'
        ? data.image
        : '/meta/blogs.png';

  const category = (data.category as BlogCategory) || 'Learning Notes';

  const rawTags = Array.isArray(data.tags)
    ? data.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  return {
    title: String(data.title || 'Untitled Post'),
    description: String(data.description || ''),
    date: String(data.date || new Date().toISOString().split('T')[0]),
    category,
    tags: rawTags,
    published: isPublished,
    isPublished,
    coverImage,
    image: coverImage,
    readTime: typeof data.readTime === 'string' ? data.readTime : undefined,
  };
}

/**
 * Get blog post by slug with full content and metadata
 */
export function getBlogPostBySlug(slug: string): BlogPost | null {
  try {
    let fullPath = path.join(blogDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(blogDirectory, `${slug}.md`);
    }

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    if (!data.title || !data.description) {
      console.warn(
        `[blog] Incomplete frontmatter in ${slug}.mdx: missing title or description`,
      );
      return null;
    }

    const frontmatter = normalizeFrontmatter(data);
    const readingTime = frontmatter.readTime || calculateReadingTime(content);
    const toc = extractTableOfContents(content);

    return {
      slug,
      frontmatter,
      content,
      readingTime,
      toc,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

/**
 * Get all blog posts with frontmatter only (sorted newest first)
 */
export function getAllBlogPosts(): BlogPostPreview[] {
  const slugs = getBlogPostSlugs();

  const posts = slugs
    .map((slug) => {
      const post = getBlogPostBySlug(slug);
      if (!post) return null;

      return {
        slug: post.slug,
        frontmatter: post.frontmatter,
        readingTime: post.readingTime,
      };
    })
    .filter((post): post is BlogPostPreview => post !== null)
    .sort((a, b) => {
      return (
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
      );
    });

  return posts;
}

/**
 * Get all published blog posts
 */
export function getPublishedBlogPosts(): BlogPostPreview[] {
  const allPosts = getAllBlogPosts();
  return allPosts.filter(
    (post) => post.frontmatter.published && post.frontmatter.isPublished,
  );
}

/**
 * Get adjacent published posts (previous and next) for a given slug
 */
export function getAdjacentPosts(slug: string): {
  prevPost: BlogPostPreview | null;
  nextPost: BlogPostPreview | null;
} {
  const published = getPublishedBlogPosts();
  const index = published.findIndex((p) => p.slug === slug);

  if (index === -1) {
    return { prevPost: null, nextPost: null };
  }

  // sorted newest first, so index - 1 is newer (next) and index + 1 is older (prev)
  const nextPost = index > 0 ? published[index - 1] : null;
  const prevPost = index < published.length - 1 ? published[index + 1] : null;

  return { prevPost, nextPost };
}

/**
 * Get blog posts by tag
 */
export function getBlogPostsByTag(tag: string): BlogPostPreview[] {
  const publishedPosts = getPublishedBlogPosts();
  return publishedPosts.filter((post) =>
    post.frontmatter.tags.some(
      (postTag) => postTag.toLowerCase() === tag.toLowerCase(),
    ),
  );
}

/**
 * Get blog posts by category
 */
export function getBlogPostsByCategory(category: string): BlogPostPreview[] {
  const publishedPosts = getPublishedBlogPosts();
  if (category.toLowerCase() === 'all') {
    return publishedPosts;
  }
  return publishedPosts.filter(
    (post) =>
      post.frontmatter.category &&
      post.frontmatter.category.toLowerCase() === category.toLowerCase(),
  );
}

/**
 * Get all unique tags from published posts
 */
export function getAllTags(): string[] {
  const publishedPosts = getPublishedBlogPosts();
  const tagsSet = new Set<string>();

  publishedPosts.forEach((post) => {
    post.frontmatter.tags.forEach((tag) => {
      tagsSet.add(tag);
    });
  });

  return Array.from(tagsSet).sort();
}

/**
 * Get all categories with post counts
 */
export function getAllCategories(): { name: string; count: number }[] {
  const publishedPosts = getPublishedBlogPosts();
  const categoryMap = new Map<string, number>();

  publishedPosts.forEach((post) => {
    const cat = post.frontmatter.category || 'Learning Notes';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });

  return Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));
}

/**
 * Get related posts based on shared category and tags (excluding the current post)
 */
export function getRelatedPosts(
  currentSlug: string,
  maxPosts = 3,
): BlogPostPreview[] {
  const currentPost = getBlogPostBySlug(currentSlug);
  if (!currentPost || !currentPost.frontmatter.published) {
    return [];
  }

  const allPosts = getPublishedBlogPosts();
  const currentTags = currentPost.frontmatter.tags.map((tag) =>
    tag.toLowerCase(),
  );
  const currentCategory = currentPost.frontmatter.category?.toLowerCase();

  const postsWithScore = allPosts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => {
      let score = 0;
      // Category match gives 2 points
      if (
        currentCategory &&
        post.frontmatter.category?.toLowerCase() === currentCategory
      ) {
        score += 2;
      }
      // Tag match gives 1 point each
      const sharedTags = post.frontmatter.tags.filter((tag) =>
        currentTags.includes(tag.toLowerCase()),
      );
      score += sharedTags.length;

      return {
        post,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return postsWithScore.slice(0, maxPosts).map((item) => item.post);
}
