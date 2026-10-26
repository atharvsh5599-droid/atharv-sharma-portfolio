import { beforeEach, describe, expect, it } from 'vitest';

import {
  getUnifiedAdjacentPosts,
  getUnifiedBlogPostBySlug,
  getUnifiedCategories,
  getUnifiedPublishedBlogPosts,
  getUnifiedRelatedPosts,
  getUnifiedTags,
} from '@/lib/blog';
import { createPost } from '@/lib/blog-storage';

import { MockRedisClient } from './mock-redis';

describe('Unified Public Blog Experience (Redis + Local MDX)', () => {
  let mockRedis: MockRedisClient;

  beforeEach(() => {
    mockRedis = new MockRedisClient();
  });

  describe('1. Existing Local MDX Articles', () => {
    it('retrieves published local MDX articles', async () => {
      const post = await getUnifiedBlogPostBySlug(
        'cpp-stl-vector-deep-dive',
        mockRedis,
      );

      expect(post).not.toBeNull();
      expect(post?.slug).toBe('cpp-stl-vector-deep-dive');
      expect(post?.frontmatter.title.toLowerCase()).toContain('vector');
      expect(post?.frontmatter.published).toBe(true);
      expect(post?.toc && post.toc.length).toBeGreaterThan(0);
    });

    it('rejects unpublished local MDX drafts from public routes', async () => {
      // draft-advanced-pointer-patterns.mdx has published: false
      const post = await getUnifiedBlogPostBySlug(
        'draft-advanced-pointer-patterns',
        mockRedis,
      );

      expect(post).toBeNull();
    });

    it('lists published local MDX articles while strictly excluding local drafts', async () => {
      const posts = await getUnifiedPublishedBlogPosts(mockRedis);

      expect(posts.length).toBeGreaterThanOrEqual(3);
      expect(posts.some((p) => p.slug === 'cpp-stl-vector-deep-dive')).toBe(
        true,
      );
      expect(
        posts.some((p) => p.slug === 'draft-advanced-pointer-patterns'),
      ).toBe(false);
    });
  });

  describe('2. Published Redis Posts', () => {
    it('retrieves published post from Redis with extracted Table of Contents', async () => {
      await createPost(
        {
          title: 'Graph Neural Networks in C++',
          slug: 'gnn-in-cpp',
          content: `## Introduction to GNNs\n\nGraph networks are powerful.\n\n### Message Passing\n\nPassing node features.`,
          tags: ['AI/ML', 'C++'],
          status: 'published',
          category: 'AI/ML',
        },
        { client: mockRedis },
      );

      const post = await getUnifiedBlogPostBySlug('gnn-in-cpp', mockRedis);

      expect(post).not.toBeNull();
      expect(post?.slug).toBe('gnn-in-cpp');
      expect(post?.frontmatter.title).toBe('Graph Neural Networks in C++');
      expect(post?.frontmatter.published).toBe(true);
      expect(post?.toc).toBeDefined();
      expect(post?.toc?.length).toBe(2);
      expect(post?.toc?.[0].text).toBe('Introduction to GNNs');
      expect(post?.toc?.[1].text).toBe('Message Passing');
    });

    it('includes published Redis posts in public listings', async () => {
      await createPost(
        {
          title: 'Redis CMS Integration',
          slug: 'redis-cms-integration',
          content: 'How the dual-source engine works.',
          status: 'published',
          tags: ['web development'],
        },
        { client: mockRedis },
      );

      const posts = await getUnifiedPublishedBlogPosts(mockRedis);
      const found = posts.find((p) => p.slug === 'redis-cms-integration');

      expect(found).toBeDefined();
      expect(found?.frontmatter.title).toBe('Redis CMS Integration');
    });
  });

  describe('3. Unpublished Redis Posts (Drafts)', () => {
    it('returns null when querying draft Redis post by slug', async () => {
      await createPost(
        {
          title: 'Top Secret Unreleased Article',
          slug: 'top-secret-draft',
          content: 'Draft content that should not leak.',
          status: 'draft',
        },
        { client: mockRedis },
      );

      const post = await getUnifiedBlogPostBySlug(
        'top-secret-draft',
        mockRedis,
      );
      expect(post).toBeNull();
    });

    it('excludes draft Redis posts from published blog listings', async () => {
      await createPost(
        {
          title: 'Unpublished Draft Article',
          slug: 'unpub-draft',
          content: 'Draft content.',
          status: 'draft',
        },
        { client: mockRedis },
      );

      const posts = await getUnifiedPublishedBlogPosts(mockRedis);
      expect(posts.some((p) => p.slug === 'unpub-draft')).toBe(false);
    });
  });

  describe('4. Duplicate Slugs & Conflict Resolution Strategy', () => {
    it('gives Redis published post precedence over local MDX on slug match', async () => {
      // Local MDX has 'cpp-stl-vector-deep-dive'
      // Admin overrides it in Redis with an updated title
      await createPost(
        {
          title: 'C++ STL Vector Deep Dive (2026 Edition)',
          slug: 'cpp-stl-vector-deep-dive',
          content: '# Updated Vector Article\n\nRewritten for C++26 standards.',
          tags: ['c++', 'dsa', 'modern-cpp'],
          status: 'published',
          category: 'C++',
        },
        { client: mockRedis },
      );

      // Query single post
      const post = await getUnifiedBlogPostBySlug(
        'cpp-stl-vector-deep-dive',
        mockRedis,
      );
      expect(post?.frontmatter.title).toBe(
        'C++ STL Vector Deep Dive (2026 Edition)',
      );
      expect(post?.content).toContain('C++26');

      // Listing must contain it exactly once (deduplicated)
      const allPosts = await getUnifiedPublishedBlogPosts(mockRedis);
      const matches = allPosts.filter(
        (p) => p.slug === 'cpp-stl-vector-deep-dive',
      );
      expect(matches.length).toBe(1);
      expect(matches[0].frontmatter.title).toBe(
        'C++ STL Vector Deep Dive (2026 Edition)',
      );
    });

    it('suppresses local MDX post if admin saved that slug as draft in Redis', async () => {
      // Admin unpublishes 'cpp-stl-vector-deep-dive' in CMS
      await createPost(
        {
          title: 'C++ STL Vector (Taken Down)',
          slug: 'cpp-stl-vector-deep-dive',
          content: 'Unpublished draft.',
          status: 'draft',
        },
        { client: mockRedis },
      );

      // Public lookup must return null
      const post = await getUnifiedBlogPostBySlug(
        'cpp-stl-vector-deep-dive',
        mockRedis,
      );
      expect(post).toBeNull();

      // Listing must not include it
      const allPosts = await getUnifiedPublishedBlogPosts(mockRedis);
      expect(allPosts.some((p) => p.slug === 'cpp-stl-vector-deep-dive')).toBe(
        false,
      );
    });
  });

  describe('5. Missing Slugs', () => {
    it('returns null for missing slug', async () => {
      const post = await getUnifiedBlogPostBySlug(
        'completely-fictional-post-slug',
        mockRedis,
      );
      expect(post).toBeNull();
    });

    it('returns null for empty or invalid slug string', async () => {
      expect(await getUnifiedBlogPostBySlug('', mockRedis)).toBeNull();
      expect(await getUnifiedBlogPostBySlug('   ', mockRedis)).toBeNull();
    });
  });

  describe('6. Adjacent & Related Posts Navigation', () => {
    it('calculates adjacent prev/next posts across the unified dataset', async () => {
      const all = await getUnifiedPublishedBlogPosts(mockRedis);
      expect(all.length).toBeGreaterThanOrEqual(2);

      const target = all[1];
      const { prevPost, nextPost } = await getUnifiedAdjacentPosts(
        target.slug,
        mockRedis,
      );

      expect(nextPost?.slug).toBe(all[0].slug); // Newer
      if (all.length > 2) {
        expect(prevPost?.slug).toBe(all[2].slug); // Older
      }
    });

    it('calculates related posts based on shared category and tags', async () => {
      const related = await getUnifiedRelatedPosts(
        'cpp-stl-vector-deep-dive',
        2,
        mockRedis,
      );

      expect(Array.isArray(related)).toBe(true);
      expect(related.every((p) => p.slug !== 'cpp-stl-vector-deep-dive')).toBe(
        true,
      );
    });
  });

  describe('7. Unified Tags and Categories', () => {
    it('aggregates unique tags and category counts across sources', async () => {
      const tags = await getUnifiedTags(mockRedis);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some((t) => t.toLowerCase() === 'c++')).toBe(true);

      const categories = await getUnifiedCategories(mockRedis);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some((c) => c.name === 'C++')).toBe(true);
    });
  });
});
