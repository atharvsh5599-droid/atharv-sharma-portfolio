import {
  BlogListOptions,
  BlogListResult,
  BlogPostStatus,
  CmsBlogPost,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from '@/types/blog';

import {
  BlogStorageError,
  PostNotFoundError,
  RedisNotConfiguredError,
  SlugConflictError,
  sanitizeErrorMessage,
} from './blog-errors';
import {
  calculateReadingTime,
  cmsBlogPostSchema,
  generateExcerpt,
  normalizeSlug,
  validateCreatePostInput,
  validateUpdatePostInput,
} from './blog-schema';
import { BLOG_REDIS_KEYS, requireRedisClient } from './redis';

/**
 * Interface representing the subset of Upstash Redis transaction methods required by the storage layer.
 */
export interface UpstashTransactionLike {
  set(key: string, value: string): this;
  del(...keys: string[]): this;
  zadd(key: string, ...scoreMembers: { score: number; member: string }[]): this;
  zrem(key: string, ...members: string[]): this;
  exec(): Promise<unknown[]>;
}

/**
 * Interface representing the subset of Upstash Redis client methods required by the storage layer.
 */
export interface UpstashRedisLike {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  zadd(
    key: string,
    ...scoreMembers: { score: number; member: string }[]
  ): Promise<number>;
  zrem(key: string, ...members: string[]): Promise<number>;
  zrange<T = unknown>(
    key: string,
    start: number | string,
    stop: number | string,
    options?: { rev?: boolean },
  ): Promise<T[]>;
  zcard(key: string): Promise<number>;
  multi(): UpstashTransactionLike;
}

export interface StorageOptions {
  client?: UpstashRedisLike;
  autoDisambiguateSlug?: boolean;
}

/**
 * Resolves the Redis client to use, preferring injected client over global singleton.
 */
function resolveClient(injectedClient?: UpstashRedisLike): UpstashRedisLike {
  if (injectedClient) {
    return injectedClient;
  }
  return requireRedisClient() as unknown as UpstashRedisLike;
}

/**
 * Generates an epoch millisecond score from an ISO date string for Redis Sorted Sets.
 */
function toEpochMs(isoDate: string): number {
  const time = new Date(isoDate).getTime();
  return isNaN(time) ? Date.now() : time;
}

/**
 * Safely parses and validates a raw Redis value into a CmsBlogPost record.
 */
function parseBlogPostRecord(raw: unknown): CmsBlogPost | null {
  if (!raw) {
    return null;
  }

  let data: unknown = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  const result = cmsBlogPostSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Checks whether a given slug is currently reserved by a post in Redis.
 * If reserved, returns the post ID holding it; otherwise null.
 */
export async function getSlugOwner(
  slug: string,
  client?: UpstashRedisLike,
): Promise<string | null> {
  const redis = resolveClient(client);
  try {
    const raw = await redis.get<string>(BLOG_REDIS_KEYS.slugKey(slug));
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  } catch (error) {
    throw new BlogStorageError(
      `Failed to verify slug availability: ${sanitizeErrorMessage(error)}`,
      error,
    );
  }
}

/**
 * Finds a guaranteed unique slug in Redis.
 * If baseSlug is already taken by another post, appends incrementing numeric suffixes (-1, -2, -3...).
 */
export async function resolveUniqueSlug(
  baseSlug: string,
  currentPostId?: string,
  client?: UpstashRedisLike,
): Promise<string> {
  const redis = resolveClient(client);
  const normalizedBase = normalizeSlug(baseSlug) || 'post';

  let candidate = normalizedBase;
  let counter = 1;

  while (counter <= 1000) {
    const owner = await getSlugOwner(candidate, redis);
    if (!owner || owner === currentPostId) {
      return candidate;
    }
    candidate = `${normalizedBase}-${counter}`;
    counter++;
  }

  // Fallback to random suffix in extreme collision scenarios
  return `${normalizedBase}-${Date.now()}`;
}

/**
 * Retrieves a single blog post by its unique ID.
 * Returns null if the post does not exist or data is corrupt.
 */
export async function getPostById(
  id: string,
  options?: StorageOptions,
): Promise<CmsBlogPost | null> {
  const redis = resolveClient(options?.client);

  try {
    const raw = await redis.get(BLOG_REDIS_KEYS.postKey(id));
    return parseBlogPostRecord(raw);
  } catch (error) {
    if (error instanceof RedisNotConfiguredError) {
      throw error;
    }
    throw new BlogStorageError(
      `Failed to retrieve blog post by ID: ${sanitizeErrorMessage(error)}`,
      error,
    );
  }
}

/**
 * Retrieves a single blog post by its unique slug.
 * Returns null if not found.
 */
export async function getPostBySlug(
  slug: string,
  options?: StorageOptions,
): Promise<CmsBlogPost | null> {
  const redis = resolveClient(options?.client);
  const normalized = normalizeSlug(slug);

  if (!normalized) {
    return null;
  }

  try {
    const id = await getSlugOwner(normalized, redis);
    if (!id) {
      return null;
    }
    return await getPostById(id, { client: redis });
  } catch (error) {
    if (error instanceof BlogStorageError) {
      throw error;
    }
    throw new BlogStorageError(
      `Failed to retrieve blog post by slug: ${sanitizeErrorMessage(error)}`,
      error,
    );
  }
}

/**
 * Creates and stores a new blog post in Upstash Redis.
 * Enforces slug uniqueness, performs data normalization, and maintains all index ZSETs atomically.
 */
export async function createPost(
  rawInput: unknown,
  options?: StorageOptions,
): Promise<CmsBlogPost> {
  const redis = resolveClient(options?.client);
  const input: CreateBlogPostInput = validateCreatePostInput(rawInput);

  const id = input.id?.trim() || crypto.randomUUID();
  const baseSlug = input.slug || normalizeSlug(input.title) || 'post';

  // Slug uniqueness verification
  const existingOwner = await getSlugOwner(baseSlug, redis);
  let finalSlug: string;

  if (existingOwner && existingOwner !== id) {
    if (options?.autoDisambiguateSlug) {
      finalSlug = await resolveUniqueSlug(baseSlug, id, redis);
    } else {
      throw new SlugConflictError(baseSlug);
    }
  } else {
    finalSlug = baseSlug;
  }

  const now = new Date().toISOString();
  const createdAt = now;
  const updatedAt = now;
  const status: BlogPostStatus = input.status || 'draft';

  const publishedAt =
    status === 'published'
      ? input.publishedAt && input.publishedAt.trim().length > 0
        ? input.publishedAt
        : now
      : null;

  const excerpt =
    input.excerpt && input.excerpt.trim().length > 0
      ? input.excerpt.trim()
      : generateExcerpt(input.content);

  const readingTime = calculateReadingTime(input.content);

  const newPost: CmsBlogPost = {
    id,
    title: input.title,
    slug: finalSlug,
    excerpt,
    content: input.content,
    coverImage: input.coverImage,
    tags: input.tags || [],
    status,
    createdAt,
    updatedAt,
    publishedAt,
    seoTitle: input.seoTitle || input.title,
    seoDescription: input.seoDescription || excerpt,
    category: input.category || 'Learning Notes',
    readingTime,
  };

  // Strict model verification before committing
  const validatedPost = cmsBlogPostSchema.parse(newPost);

  try {
    const tx = redis.multi();
    tx.set(BLOG_REDIS_KEYS.postKey(id), JSON.stringify(validatedPost));
    tx.set(BLOG_REDIS_KEYS.slugKey(finalSlug), id);
    tx.zadd(BLOG_REDIS_KEYS.INDEX_ALL, {
      score: toEpochMs(createdAt),
      member: id,
    });

    if (status === 'published') {
      tx.zadd(BLOG_REDIS_KEYS.INDEX_PUBLISHED, {
        score: toEpochMs(publishedAt || createdAt),
        member: id,
      });
      tx.zrem(BLOG_REDIS_KEYS.INDEX_DRAFTS, id);
    } else {
      tx.zrem(BLOG_REDIS_KEYS.INDEX_PUBLISHED, id);
      tx.zadd(BLOG_REDIS_KEYS.INDEX_DRAFTS, {
        score: toEpochMs(updatedAt),
        member: id,
      });
    }

    await tx.exec();
    return validatedPost;
  } catch (error) {
    throw new BlogStorageError(
      `Failed to create blog post in Redis: ${sanitizeErrorMessage(error)}`,
      error,
    );
  }
}

/**
 * Updates an existing blog post in Upstash Redis.
 * Preserves the original creation date, updates updatedAt, handles slug changes and status index re-balancing.
 */
export async function updatePost(
  id: string,
  rawInput: unknown,
  options?: StorageOptions,
): Promise<CmsBlogPost> {
  const redis = resolveClient(options?.client);
  const input: UpdateBlogPostInput = validateUpdatePostInput(rawInput);

  // 1. Fetch the existing post record
  const existing = await getPostById(id, { client: redis });
  if (!existing) {
    throw new PostNotFoundError(id);
  }

  // 2. Slug handling
  let newSlug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    const candidateSlug = normalizeSlug(input.slug);
    const existingOwner = await getSlugOwner(candidateSlug, redis);

    if (existingOwner && existingOwner !== id) {
      if (options?.autoDisambiguateSlug) {
        newSlug = await resolveUniqueSlug(candidateSlug, id, redis);
      } else {
        throw new SlugConflictError(candidateSlug);
      }
    } else {
      newSlug = candidateSlug;
    }
  }

  // 3. Status and date transitions
  const newStatus: BlogPostStatus =
    input.status !== undefined ? input.status : existing.status;
  const now = new Date().toISOString();

  // RULE 5: Preserve creation date
  const createdAt = existing.createdAt;
  // RULE 6: Update modification date
  const updatedAt = now;

  let publishedAt: string | null | undefined = existing.publishedAt;
  if (input.publishedAt !== undefined) {
    publishedAt = input.publishedAt;
  } else if (newStatus === 'published' && existing.status !== 'published') {
    publishedAt = existing.publishedAt || now;
  } else if (newStatus === 'draft') {
    publishedAt = null;
  }

  // 4. Content and excerpt
  const title = input.title !== undefined ? input.title : existing.title;
  const content =
    input.content !== undefined ? input.content : existing.content;

  const excerpt =
    input.excerpt !== undefined
      ? input.excerpt
      : input.content !== undefined
        ? generateExcerpt(content)
        : existing.excerpt;

  const readingTime =
    input.content !== undefined
      ? calculateReadingTime(content)
      : existing.readingTime || calculateReadingTime(content);

  const updatedPost: CmsBlogPost = {
    id: existing.id,
    title,
    slug: newSlug,
    excerpt,
    content,
    coverImage:
      input.coverImage !== undefined ? input.coverImage : existing.coverImage,
    tags: input.tags !== undefined ? input.tags : existing.tags,
    status: newStatus,
    createdAt,
    updatedAt,
    publishedAt,
    seoTitle:
      input.seoTitle !== undefined
        ? input.seoTitle
        : existing.seoTitle || title,
    seoDescription:
      input.seoDescription !== undefined
        ? input.seoDescription
        : existing.seoDescription || excerpt,
    category: input.category !== undefined ? input.category : existing.category,
    readingTime,
  };

  const validatedPost = cmsBlogPostSchema.parse(updatedPost);

  try {
    const tx = redis.multi();

    // Store updated JSON
    tx.set(BLOG_REDIS_KEYS.postKey(id), JSON.stringify(validatedPost));

    // Handle slug migration if slug changed
    if (existing.slug !== newSlug) {
      tx.del(BLOG_REDIS_KEYS.slugKey(existing.slug));
      tx.set(BLOG_REDIS_KEYS.slugKey(newSlug), id);
    }

    // Refresh all posts index score
    tx.zadd(BLOG_REDIS_KEYS.INDEX_ALL, {
      score: toEpochMs(createdAt),
      member: id,
    });

    // RULE 7: Maintain indexes when publishing status changes
    if (newStatus === 'published') {
      tx.zadd(BLOG_REDIS_KEYS.INDEX_PUBLISHED, {
        score: toEpochMs(publishedAt || createdAt),
        member: id,
      });
      tx.zrem(BLOG_REDIS_KEYS.INDEX_DRAFTS, id);
    } else {
      tx.zrem(BLOG_REDIS_KEYS.INDEX_PUBLISHED, id);
      tx.zadd(BLOG_REDIS_KEYS.INDEX_DRAFTS, {
        score: toEpochMs(updatedAt),
        member: id,
      });
    }

    await tx.exec();
    return validatedPost;
  } catch (error) {
    throw new BlogStorageError(
      `Failed to update blog post in Redis: ${sanitizeErrorMessage(error)}`,
      error,
    );
  }
}

/**
 * Deletes a blog post and atomically removes all of its associated index entries.
 */
export async function deletePost(
  id: string,
  options?: StorageOptions,
): Promise<boolean> {
  const redis = resolveClient(options?.client);

  const existing = await getPostById(id, { client: redis });
  if (!existing) {
    throw new PostNotFoundError(id);
  }

  try {
    const tx = redis.multi();
    tx.del(BLOG_REDIS_KEYS.postKey(id));
    tx.del(BLOG_REDIS_KEYS.slugKey(existing.slug));
    tx.zrem(BLOG_REDIS_KEYS.INDEX_ALL, id);
    tx.zrem(BLOG_REDIS_KEYS.INDEX_PUBLISHED, id);
    tx.zrem(BLOG_REDIS_KEYS.INDEX_DRAFTS, id);

    await tx.exec();
    return true;
  } catch (error) {
    throw new BlogStorageError(
      `Failed to delete blog post from Redis: ${sanitizeErrorMessage(error)}`,
      error,
    );
  }
}

/**
 * Lists blog posts from Redis with pagination and status filtering.
 */
export async function listPosts(
  options?: BlogListOptions & StorageOptions,
): Promise<BlogListResult> {
  const redis = resolveClient(options?.client);
  const status = options?.status || 'all';
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 100));
  const offset = Math.max(0, options?.offset ?? 0);

  let targetIndexKey: string = BLOG_REDIS_KEYS.INDEX_ALL;
  if (status === 'published') {
    targetIndexKey = BLOG_REDIS_KEYS.INDEX_PUBLISHED;
  } else if (status === 'draft') {
    targetIndexKey = BLOG_REDIS_KEYS.INDEX_DRAFTS;
  }

  try {
    const total = await redis.zcard(targetIndexKey);
    if (total === 0) {
      return {
        posts: [],
        total: 0,
        hasMore: false,
        offset,
        limit,
      };
    }

    // Upstash zrange with rev: true returns highest scores (newest) first
    const stop = offset + limit - 1;
    const postIds = await redis.zrange<string>(targetIndexKey, offset, stop, {
      rev: true,
    });

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return {
        posts: [],
        total,
        hasMore: false,
        offset,
        limit,
      };
    }

    // Fetch records in parallel
    const postPromises = postIds.map((id) =>
      getPostById(id, { client: redis }),
    );
    const fetched = await Promise.all(postPromises);

    // Filter out any corrupted or missing records
    let validPosts = fetched.filter(
      (p): p is CmsBlogPost => p !== null && p !== undefined,
    );

    // Optional tag filtering if specified
    if (options?.tag) {
      const targetTag = options.tag.trim().toLowerCase();
      validPosts = validPosts.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === targetTag),
      );
    }

    const hasMore = offset + postIds.length < total;

    return {
      posts: validPosts,
      total,
      hasMore,
      offset,
      limit,
    };
  } catch (error) {
    if (error instanceof BlogStorageError) {
      throw error;
    }
    throw new BlogStorageError(
      `Failed to list blog posts from Redis: ${sanitizeErrorMessage(error)}`,
      error,
    );
  }
}
