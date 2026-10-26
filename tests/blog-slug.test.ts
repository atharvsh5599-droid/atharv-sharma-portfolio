import { beforeEach, describe, expect, it } from 'vitest';

import { SlugConflictError } from '@/lib/blog-errors';
import {
  createPost,
  getSlugOwner,
  resolveUniqueSlug,
  updatePost,
} from '@/lib/blog-storage';

import { MockRedisClient } from './mock-redis';

describe('Blog Slug Uniqueness & Collision Handling', () => {
  let mockRedis: MockRedisClient;

  beforeEach(() => {
    mockRedis = new MockRedisClient();
  });

  it('returns candidate slug when it is available in Redis', async () => {
    const slug = await resolveUniqueSlug(
      'my-new-article',
      undefined,
      mockRedis,
    );
    expect(slug).toBe('my-new-article');
  });

  it('resolves conflicting slugs by appending incrementing numeric suffixes', async () => {
    // Simulate existing post holding 'c-plus-plus-pointers'
    await mockRedis.set('blog:slug:c-plus-plus-pointers', 'post-1');

    const resolved = await resolveUniqueSlug(
      'c-plus-plus-pointers',
      undefined,
      mockRedis,
    );
    expect(resolved).toBe('c-plus-plus-pointers-1');

    // Simulate both base and suffix 1 taken
    await mockRedis.set('blog:slug:c-plus-plus-pointers-1', 'post-2');
    const resolved2 = await resolveUniqueSlug(
      'c-plus-plus-pointers',
      undefined,
      mockRedis,
    );
    expect(resolved2).toBe('c-plus-plus-pointers-2');
  });

  it('allows the same slug if owned by the current post ID during update', async () => {
    await mockRedis.set('blog:slug:advanced-ai-agents', 'post-existing-99');

    const resolved = await resolveUniqueSlug(
      'advanced-ai-agents',
      'post-existing-99',
      mockRedis,
    );
    expect(resolved).toBe('advanced-ai-agents');
  });

  it('throws SlugConflictError on createPost when slug is taken and autoDisambiguateSlug is false', async () => {
    // First post
    await createPost(
      {
        title: 'Mastering Redis',
        slug: 'mastering-redis',
        content: 'Article content here.',
      },
      { client: mockRedis },
    );

    // Second post trying to claim identical slug without autoDisambiguateSlug
    await expect(
      createPost(
        {
          title: 'Mastering Redis Again',
          slug: 'mastering-redis',
          content: 'Another article content.',
        },
        { client: mockRedis, autoDisambiguateSlug: false },
      ),
    ).rejects.toThrow(SlugConflictError);
  });

  it('auto-disambiguates slug on createPost when autoDisambiguateSlug is true', async () => {
    const post1 = await createPost(
      {
        title: 'High Performance Computing',
        slug: 'hpc-guide',
        content: 'Post 1 content',
      },
      { client: mockRedis },
    );
    expect(post1.slug).toBe('hpc-guide');

    const post2 = await createPost(
      {
        title: 'High Performance Computing 2',
        slug: 'hpc-guide',
        content: 'Post 2 content',
      },
      { client: mockRedis, autoDisambiguateSlug: true },
    );
    expect(post2.slug).toBe('hpc-guide-1');
  });

  it('allows updating an existing post with the same slug without collision', async () => {
    const post = await createPost(
      {
        title: 'Original Title',
        slug: 'my-unique-slug',
        content: 'Initial content',
      },
      { client: mockRedis },
    );

    const updated = await updatePost(
      post.id,
      {
        title: 'Revised Title',
        slug: 'my-unique-slug', // Same slug!
      },
      { client: mockRedis },
    );

    expect(updated.slug).toBe('my-unique-slug');
    expect(updated.title).toBe('Revised Title');
    const owner = await getSlugOwner('my-unique-slug', mockRedis);
    expect(owner).toBe(post.id);
  });

  it('throws SlugConflictError if updating to a slug owned by a different post', async () => {
    await createPost(
      {
        title: 'Post Alpha',
        slug: 'post-alpha',
        content: 'Content A',
      },
      { client: mockRedis },
    );

    const postB = await createPost(
      {
        title: 'Post Beta',
        slug: 'post-beta',
        content: 'Content B',
      },
      { client: mockRedis },
    );

    // Attempt to rename postB to post-alpha
    await expect(
      updatePost(
        postB.id,
        {
          slug: 'post-alpha',
        },
        { client: mockRedis, autoDisambiguateSlug: false },
      ),
    ).rejects.toThrow(SlugConflictError);
  });
});
