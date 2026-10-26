import { Redis } from '@upstash/redis';

import { RedisNotConfiguredError } from './blog-errors';

/**
 * Singleton Redis client reference.
 */
let cachedRedisClient: Redis | null = null;
let testRedisClientOverride: Redis | null = null;

/**
 * Redis Key Prefix Constants for Blog CMS storage and indexing.
 */
export const BLOG_REDIS_KEYS = {
  POST_PREFIX: 'blog:post:',
  SLUG_PREFIX: 'blog:slug:',
  INDEX_ALL: 'blog:posts:all',
  INDEX_PUBLISHED: 'blog:posts:published',
  INDEX_DRAFTS: 'blog:posts:drafts',
  INDEX_TAG_PREFIX: 'blog:tag:',
  postKey: (id: string) => `blog:post:${id}`,
  slugKey: (slug: string) => `blog:slug:${slug}`,
  tagKey: (tag: string) => `blog:tag:${tag.toLowerCase()}`,
} as const;

/**
 * Checks whether Upstash Redis environment variables are configured.
 */
export function isRedisConfigured(): boolean {
  if (testRedisClientOverride) {
    return true;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  return Boolean(url && token);
}

/**
 * Returns a configured Upstash Redis client singleton, or null if unconfigured.
 */
export function getRedisClient(): Redis | null {
  if (testRedisClientOverride) {
    return testRedisClientOverride;
  }

  if (!isRedisConfigured()) {
    return null;
  }

  if (!cachedRedisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

    cachedRedisClient = new Redis({
      url: url!,
      token: token!,
    });
  }

  return cachedRedisClient;
}

/**
 * Returns the configured Upstash Redis client or throws a clean RedisNotConfiguredError.
 */
export function requireRedisClient(): Redis {
  const client = getRedisClient();
  if (!client) {
    throw new RedisNotConfiguredError();
  }
  return client;
}

/**
 * Internal testing helper to inject a mock or alternate Redis instance.
 */
export function setRedisClientForTesting(client: Redis | null): void {
  testRedisClientOverride = client;
}

/**
 * Resets cached Redis client instances (useful during test teardown).
 */
export function resetRedisClient(): void {
  cachedRedisClient = null;
  testRedisClientOverride = null;
}
