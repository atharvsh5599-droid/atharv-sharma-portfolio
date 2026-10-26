import { beforeEach, describe, expect, it } from 'vitest';

import { BlogStorageError, PostNotFoundError } from '@/lib/blog-errors';
import {
  createPost,
  deletePost,
  getPostById,
  getPostBySlug,
  listPosts,
  updatePost,
} from '@/lib/blog-storage';
import { BLOG_REDIS_KEYS } from '@/lib/redis';
import { cmsPostToBlogPost, cmsPostToPreview } from '@/types/blog';

import { MockRedisClient } from './mock-redis';

describe('Upstash Redis Blog Storage & Indexing Layer', () => {
  let mockRedis: MockRedisClient;

  beforeEach(() => {
    mockRedis = new MockRedisClient();
  });

  describe('createPost', () => {
    it('creates a draft post and maintains indexes in Redis via transaction', async () => {
      const post = await createPost(
        {
          title: 'Understanding Async C++',
          content:
            '# Async C++\n\nCoroutines in C++20 allow modern async programming.',
          tags: ['C++', 'Async'],
          status: 'draft',
        },
        { client: mockRedis },
      );

      expect(post.id).toBeDefined();
      expect(post.slug).toBe('understanding-async-c');
      expect(post.status).toBe('draft');
      expect(post.publishedAt).toBeNull();
      expect(post.readingTime).toBe('1 min read');
      expect(post.excerpt).toContain('Coroutines in C++20');

      // Verify primary post record in Redis
      const stored = await mockRedis.get<string>(
        BLOG_REDIS_KEYS.postKey(post.id),
      );
      expect(stored).toBeDefined();

      // Verify slug index
      const slugOwner = await mockRedis.get<string>(
        BLOG_REDIS_KEYS.slugKey(post.slug),
      );
      expect(slugOwner).toBe(post.id);

      // Verify sorted set indexes
      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_ALL)?.has(post.id),
      ).toBe(true);
      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_DRAFTS)?.has(post.id),
      ).toBe(true);
      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_PUBLISHED)?.has(post.id),
      ).toBeUndefined();
    });

    it('creates a published post and assigns publishedAt timestamp', async () => {
      const post = await createPost(
        {
          title: 'Deep Learning on STM32 Microcontrollers',
          content: 'Running neural networks on edge ARM Cortex-M devices.',
          tags: ['AI/ML', 'Embedded'],
          status: 'published',
        },
        { client: mockRedis },
      );

      expect(post.status).toBe('published');
      expect(post.publishedAt).toBeDefined();
      expect(typeof post.publishedAt).toBe('string');

      // Verify published index has post, drafts does not
      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_PUBLISHED)?.has(post.id),
      ).toBe(true);
      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_DRAFTS)?.has(post.id),
      ).toBeFalsy();
    });
  });

  describe('updatePost & Date Preservation', () => {
    it('RULE 5: preserves original createdAt and RULE 6: updates updatedAt', async () => {
      const initial = await createPost(
        {
          title: 'Initial Post Title',
          content: 'Initial content',
          status: 'draft',
        },
        { client: mockRedis },
      );

      const originalCreatedAt = initial.createdAt;

      // Small delay to ensure timestamp progression
      await new Promise((resolve) => setTimeout(resolve, 15));

      const updated = await updatePost(
        initial.id,
        {
          title: 'Updated Post Title',
          // Attempting to override createdAt should be ignored at runtime.
          createdAt: '1999-01-01T00:00:00.000Z',
        },
        { client: mockRedis },
      );

      expect(updated.createdAt).toBe(originalCreatedAt);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(initial.updatedAt).getTime(),
      );
      expect(updated.title).toBe('Updated Post Title');
    });

    it('RULE 7: re-balances indexes when status changes from draft to published', async () => {
      const draft = await createPost(
        {
          title: 'Draft Post',
          content: 'Draft content body',
          status: 'draft',
        },
        { client: mockRedis },
      );

      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_DRAFTS)?.has(draft.id),
      ).toBe(true);
      expect(
        mockRedis.sortedSets
          .get(BLOG_REDIS_KEYS.INDEX_PUBLISHED)
          ?.has(draft.id),
      ).toBeFalsy();

      const published = await updatePost(
        draft.id,
        {
          status: 'published',
        },
        { client: mockRedis },
      );

      expect(published.status).toBe('published');
      expect(published.publishedAt).toBeDefined();

      // Now draft set should NOT have post, published set MUST have post
      expect(
        mockRedis.sortedSets
          .get(BLOG_REDIS_KEYS.INDEX_PUBLISHED)
          ?.has(draft.id),
      ).toBe(true);
      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_DRAFTS)?.has(draft.id),
      ).toBe(false);
    });

    it('RULE 7: re-balances indexes when status changes from published to draft', async () => {
      const published = await createPost(
        {
          title: 'Published Post',
          content: 'Content',
          status: 'published',
        },
        { client: mockRedis },
      );

      const unpub = await updatePost(
        published.id,
        {
          status: 'draft',
        },
        { client: mockRedis },
      );

      expect(unpub.status).toBe('draft');
      expect(unpub.publishedAt).toBeNull();

      expect(
        mockRedis.sortedSets
          .get(BLOG_REDIS_KEYS.INDEX_PUBLISHED)
          ?.has(published.id),
      ).toBe(false);
      expect(
        mockRedis.sortedSets
          .get(BLOG_REDIS_KEYS.INDEX_DRAFTS)
          ?.has(published.id),
      ).toBe(true);
    });

    it('cleans up old slug index and creates new slug index when slug changes', async () => {
      const post = await createPost(
        {
          title: 'Original Post',
          slug: 'original-slug',
          content: 'Content',
        },
        { client: mockRedis },
      );

      expect(await mockRedis.get('blog:slug:original-slug')).toBe(post.id);

      const updated = await updatePost(
        post.id,
        {
          slug: 'brand-new-slug',
        },
        { client: mockRedis },
      );

      expect(updated.slug).toBe('brand-new-slug');
      // Old slug key must be deleted
      expect(await mockRedis.get('blog:slug:original-slug')).toBeNull();
      // New slug key must point to post ID
      expect(await mockRedis.get('blog:slug:brand-new-slug')).toBe(post.id);

      // Retrieval by old slug returns null
      const byOldSlug = await getPostBySlug('original-slug', {
        client: mockRedis,
      });
      expect(byOldSlug).toBeNull();

      // Retrieval by new slug returns updated post
      const byNewSlug = await getPostBySlug('brand-new-slug', {
        client: mockRedis,
      });
      expect(byNewSlug?.id).toBe(post.id);
    });

    it('throws PostNotFoundError when updating non-existent post', async () => {
      await expect(
        updatePost('non-existent-id', { title: 'New' }, { client: mockRedis }),
      ).rejects.toThrow(PostNotFoundError);
    });
  });

  describe('deletePost', () => {
    it('deletes post and all associated slug and index entries', async () => {
      const post = await createPost(
        {
          title: 'To Be Deleted',
          slug: 'to-be-deleted',
          content: 'Temporary content',
          status: 'published',
        },
        { client: mockRedis },
      );

      const deleted = await deletePost(post.id, { client: mockRedis });
      expect(deleted).toBe(true);

      // Verify post record deleted
      expect(await getPostById(post.id, { client: mockRedis })).toBeNull();
      // Verify slug deleted
      expect(await mockRedis.get('blog:slug:to-be-deleted')).toBeNull();
      // Verify removed from indexes
      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_ALL)?.has(post.id),
      ).toBe(false);
      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_PUBLISHED)?.has(post.id),
      ).toBe(false);
    });

    it('throws PostNotFoundError when deleting non-existent post', async () => {
      await expect(
        deletePost('unknown-id', { client: mockRedis }),
      ).rejects.toThrow(PostNotFoundError);
    });
  });

  describe('Transaction Safety (RULE 8)', () => {
    it('prevents partial writes if transaction fails', async () => {
      mockRedis.shouldFailExec = true;

      await expect(
        createPost(
          {
            title: 'Will Fail Transaction',
            slug: 'will-fail',
            content: 'Content',
          },
          { client: mockRedis },
        ),
      ).rejects.toThrow(BlogStorageError);

      // Ensure no state was written
      expect(await mockRedis.get('blog:slug:will-fail')).toBeNull();
      expect(
        mockRedis.sortedSets.get(BLOG_REDIS_KEYS.INDEX_ALL)?.size ?? 0,
      ).toBe(0);
    });
  });

  describe('listPosts Pagination & Filtering', () => {
    beforeEach(async () => {
      // Seed 3 published posts and 2 draft posts
      await createPost(
        {
          title: 'Post 1',
          slug: 'post-1',
          content: 'Content 1',
          status: 'published',
          tags: ['dsa'],
        },
        { client: mockRedis },
      );
      await createPost(
        {
          title: 'Post 2',
          slug: 'post-2',
          content: 'Content 2',
          status: 'draft',
          tags: ['web'],
        },
        { client: mockRedis },
      );
      await createPost(
        {
          title: 'Post 3',
          slug: 'post-3',
          content: 'Content 3',
          status: 'published',
          tags: ['dsa'],
        },
        { client: mockRedis },
      );
      await createPost(
        {
          title: 'Post 4',
          slug: 'post-4',
          content: 'Content 4',
          status: 'published',
          tags: ['ai'],
        },
        { client: mockRedis },
      );
      await createPost(
        {
          title: 'Post 5',
          slug: 'post-5',
          content: 'Content 5',
          status: 'draft',
          tags: ['c++'],
        },
        { client: mockRedis },
      );
    });

    it('lists all posts with status: all', async () => {
      const result = await listPosts({ status: 'all', client: mockRedis });
      expect(result.total).toBe(5);
      expect(result.posts.length).toBe(5);
    });

    it('lists only published posts when status: published', async () => {
      const result = await listPosts({
        status: 'published',
        client: mockRedis,
      });
      expect(result.total).toBe(3);
      expect(result.posts.length).toBe(3);
      expect(result.posts.every((p) => p.status === 'published')).toBe(true);
    });

    it('lists only draft posts when status: draft', async () => {
      const result = await listPosts({ status: 'draft', client: mockRedis });
      expect(result.total).toBe(2);
      expect(result.posts.length).toBe(2);
      expect(result.posts.every((p) => p.status === 'draft')).toBe(true);
    });

    it('supports pagination with limit and offset', async () => {
      const page1 = await listPosts({
        status: 'published',
        limit: 2,
        offset: 0,
        client: mockRedis,
      });
      expect(page1.posts.length).toBe(2);
      expect(page1.hasMore).toBe(true);

      const page2 = await listPosts({
        status: 'published',
        limit: 2,
        offset: 2,
        client: mockRedis,
      });
      expect(page2.posts.length).toBe(1);
      expect(page2.hasMore).toBe(false);
    });

    it('filters posts by tag', async () => {
      const result = await listPosts({
        status: 'all',
        tag: 'dsa',
        client: mockRedis,
      });
      expect(result.posts.length).toBe(2);
      expect(result.posts.every((p) => p.tags.includes('dsa'))).toBe(true);
    });
  });

  describe('Post Converters', () => {
    it('converts CmsBlogPost to BlogPost for public reader compatibility', async () => {
      const post = await createPost(
        {
          title: 'Converter Test',
          content: '## Heading 2\n\nSome great content here.',
          status: 'published',
          tags: ['testing'],
        },
        { client: mockRedis },
      );

      const blogPost = cmsPostToBlogPost(post);
      expect(blogPost.slug).toBe(post.slug);
      expect(blogPost.frontmatter.title).toBe(post.title);
      expect(blogPost.frontmatter.published).toBe(true);
      expect(blogPost.frontmatter.tags).toEqual(['testing']);

      const preview = cmsPostToPreview(post);
      expect(preview.slug).toBe(post.slug);
      expect(preview.frontmatter.title).toBe(post.title);
      expect(preview.readingTime).toBe(post.readingTime);
    });
  });
});
