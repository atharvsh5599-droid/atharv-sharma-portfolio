import { z } from 'zod';

import { CreateBlogPostInput, UpdateBlogPostInput } from '@/types/blog';

import { BlogValidationError } from './blog-errors';

/**
 * Converts a text string into a URL-safe, lowercase kebab-case slug.
 */
export function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special chars except word chars, whitespace, hyphens
    .replace(/[\s_-]+/g, '-') // convert spaces, underscores, multiple hyphens to single hyphen
    .replace(/^-+|-+$/g, ''); // strip leading and trailing hyphens
}

/**
 * Strips common markdown syntax to produce plain text for excerpts.
 */
export function stripMarkdown(content: string): string {
  return content
    .replace(/^#+\s+(.+)$/gm, '$1') // headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/~~(.*?)~~/g, '$1') // strikethrough
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // inline code and code blocks
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
    .replace(/!\[(.*?)\]\(.*?\)/g, '') // images
    .replace(/>\s+(.+)$/gm, '$1') // blockquotes
    .replace(/[-*+]\s+(.+)$/gm, '$1') // list items
    .replace(/\n+/g, ' ') // collapse newlines
    .trim();
}

/**
 * Generates a clean plain-text excerpt from markdown content.
 */
export function generateExcerpt(
  content: string,
  maxLength: number = 160,
): string {
  const plainText = stripMarkdown(content);
  if (!plainText) {
    return '';
  }

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Slice at the last space before maxLength to avoid cutting words in half
  const truncated = plainText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const safeExcerpt =
    lastSpace > maxLength * 0.6 ? truncated.slice(0, lastSpace) : truncated;

  return `${safeExcerpt.trim()}...`;
}

/**
 * Calculates estimated reading time in minutes from markdown content.
 */
export function calculateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Normalizes an array of tags: trims, lowercases, removes duplicates and empty strings.
 */
export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of tags) {
    if (typeof item === 'string') {
      const clean = item.trim().toLowerCase();
      if (clean.length > 0 && !seen.has(clean)) {
        seen.add(clean);
        normalized.push(clean);
      }
    }
  }

  return normalized;
}

/**
 * Zod status enum.
 */
export const blogPostStatusSchema = z.enum(['draft', 'published']);

/**
 * Strict schema for the persisted CmsBlogPost database record.
 */
export const cmsBlogPostSchema = z.object({
  id: z.string().min(1, 'Post ID is required'),
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),
  slug: z
    .string()
    .min(1, 'Slug cannot be empty')
    .max(150, 'Slug cannot exceed 150 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens',
    ),
  excerpt: z.string().max(500, 'Excerpt cannot exceed 500 characters'),
  content: z.string().min(1, 'Content cannot be empty'),
  coverImage: z.string().optional(),
  tags: z.array(z.string()),
  status: blogPostStatusSchema,
  createdAt: z
    .string()
    .datetime({ message: 'createdAt must be a valid ISO 8601 string' }),
  updatedAt: z
    .string()
    .datetime({ message: 'updatedAt must be a valid ISO 8601 string' }),
  publishedAt: z
    .string()
    .datetime({ message: 'publishedAt must be a valid ISO 8601 string' })
    .nullable()
    .optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(300).optional(),
  category: z.string().max(100).optional(),
  readingTime: z.string().max(50).optional(),
});

/**
 * Schema for creating a new blog post.
 */
export const createBlogPostInputSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),
  content: z
    .string({ required_error: 'Content is required' })
    .min(1, 'Content cannot be empty'),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? normalizeSlug(val) : undefined)),
  excerpt: z
    .string()
    .trim()
    .max(500, 'Excerpt cannot exceed 500 characters')
    .optional(),
  coverImage: z.string().trim().optional(),
  tags: z
    .array(z.string())
    .optional()
    .transform((val) => normalizeTags(val)),
  status: blogPostStatusSchema.default('draft'),
  publishedAt: z
    .string()
    .datetime({ message: 'publishedAt must be a valid ISO 8601 string' })
    .nullable()
    .optional(),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  category: z.string().trim().max(100).optional(),
  id: z.string().trim().optional(),
});

/**
 * Schema for updating an existing blog post.
 */
export const updateBlogPostInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  content: z.string().min(1, 'Content cannot be empty').optional(),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? normalizeSlug(val) : undefined)),
  excerpt: z
    .string()
    .trim()
    .max(500, 'Excerpt cannot exceed 500 characters')
    .optional(),
  coverImage: z.string().trim().optional(),
  tags: z
    .array(z.string())
    .optional()
    .transform((val) => (val ? normalizeTags(val) : undefined)),
  status: blogPostStatusSchema.optional(),
  publishedAt: z
    .string()
    .datetime({ message: 'publishedAt must be a valid ISO 8601 string' })
    .nullable()
    .optional(),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  category: z.string().trim().max(100).optional(),
});

/**
 * Validates and normalizes incoming data for creating a blog post.
 */
export function validateCreatePostInput(
  rawInput: unknown,
): CreateBlogPostInput {
  const result = createBlogPostInputSchema.safeParse(rawInput);
  if (!result.success) {
    const issues = result.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    throw new BlogValidationError('Invalid blog post input', issues);
  }
  return result.data;
}

/**
 * Validates and normalizes incoming data for updating a blog post.
 */
export function validateUpdatePostInput(
  rawInput: unknown,
): UpdateBlogPostInput {
  const result = updateBlogPostInputSchema.safeParse(rawInput);
  if (!result.success) {
    const issues = result.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    throw new BlogValidationError('Invalid blog post update input', issues);
  }
  return result.data;
}
