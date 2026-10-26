import type { Redis } from '@upstash/redis';
import type { Session } from 'next-auth';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as getPreviewApiHandler } from '@/app/api/admin/blog/[id]/preview/route';
import sitemap from '@/app/sitemap';
import { auth } from '@/auth';
import { generateBlogPostMetadata } from '@/lib/blog-seo';
import { createPost } from '@/lib/blog-storage';
import { resetRedisClient, setRedisClientForTesting } from '@/lib/redis';

import { MockRedisClient } from './mock-redis';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('Blog CMS SEO, Sitemap & Draft Preview Security Suite', () => {
  let mockRedis: MockRedisClient;
  const ADMIN_ID = '253749531';
  const UNAUTHORIZED_ID = '888888888';
  const mockAuth = vi.mocked(auth) as unknown as {
    mockResolvedValue: (value: Session | null) => void;
  };

  beforeEach(() => {
    mockRedis = new MockRedisClient();
    setRedisClientForTesting(mockRedis as unknown as Redis);
    process.env.ADMIN_GITHUB_ID = ADMIN_ID;

    // Authorized admin by default
    mockAuth.mockResolvedValue({
      user: {
        githubId: ADMIN_ID,
        isAdmin: true,
        name: 'Atharv Sharma',
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });
  });

  afterEach(() => {
    resetRedisClient();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Page Metadata & Open Graph for Published Articles
  // =========================================================================
  describe('SEO Metadata Generation for Published Posts', () => {
    it('generates full SEO metadata with canonical URL and OpenGraph for published posts', async () => {
      await createPost(
        {
          title: 'Mastering C++20 Ranges',
          slug: 'mastering-cpp20-ranges',
          content: 'Deep dive into std::ranges and composable views.',
          excerpt: 'A comprehensive guide to composable pipelines in C++20.',
          tags: ['C++', 'Ranges', 'Modern C++'],
          status: 'published',
          coverImage: '/blog/ranges.png',
        },
        { client: mockRedis },
      );

      const metadata = await generateBlogPostMetadata('mastering-cpp20-ranges');

      expect(metadata.title).toContain('Mastering C++20 Ranges');
      expect(metadata.description).toBe(
        'A comprehensive guide to composable pipelines in C++20.',
      );
      expect(metadata.alternates?.canonical).toContain(
        '/blog/mastering-cpp20-ranges',
      );

      // Open Graph assertions
      expect(JSON.stringify(metadata.openGraph)).toContain('"type":"article"');
      expect(metadata.openGraph?.title).toContain('Mastering C++20 Ranges');
      expect(metadata.openGraph?.images).toBeDefined();

      // Twitter card
      expect(JSON.stringify(metadata.twitter)).toContain(
        '"card":"summary_large_image"',
      );
    });

    it('works seamlessly for local published MDX articles', async () => {
      const metadata = await generateBlogPostMetadata(
        'cpp-stl-vector-deep-dive',
      );

      expect(metadata.title).toContain('std::vector');
      expect(metadata.alternates?.canonical).toContain(
        '/blog/cpp-stl-vector-deep-dive',
      );
      expect(JSON.stringify(metadata.openGraph)).toContain('"type":"article"');
    });
  });

  // =========================================================================
  // 2. Draft Privacy & Non-Leakage in SEO Metadata
  // =========================================================================
  describe('Draft Privacy in SEO Metadata', () => {
    it('never leaks draft titles or content in metadata for unpublished Redis posts', async () => {
      await createPost(
        {
          title: 'Top Secret Unreleased Article',
          slug: 'top-secret-unreleased-article',
          content: 'Confidential content that should not be crawled.',
          excerpt: 'Classified summary.',
          status: 'draft',
        },
        { client: mockRedis },
      );

      const metadata = await generateBlogPostMetadata(
        'top-secret-unreleased-article',
      );

      // Must NOT leak draft title or description to search engine crawlers
      expect(metadata.title).toBe('Post Not Found | Atharv Sharma');
      expect(metadata.description).toBeUndefined();
      expect(metadata.openGraph).toBeUndefined();
      expect(metadata.robots).toEqual({
        index: false,
        follow: false,
        noarchive: true,
      });
    });

    it('returns not-found metadata for local unpublished drafts (draft-advanced-pointer-patterns)', async () => {
      const metadata = await generateBlogPostMetadata(
        'draft-advanced-pointer-patterns',
      );

      expect(metadata.title).toBe('Post Not Found | Atharv Sharma');
      expect(metadata.robots).toEqual({
        index: false,
        follow: false,
        noarchive: true,
      });
    });

    it('returns not-found metadata with noindex for nonexistent slugs', async () => {
      const metadata = await generateBlogPostMetadata('nonexistent-slug-xyz');

      expect(metadata.title).toBe('Post Not Found | Atharv Sharma');
      expect(metadata.robots).toEqual({
        index: false,
        follow: false,
        noarchive: true,
      });
    });
  });

  // =========================================================================
  // 3. Sitemap Generation
  // =========================================================================
  describe('Sitemap Generator Integrity', () => {
    it('generates a sitemap containing published posts only and strictly excluding drafts', async () => {
      // 1 published, 1 draft in Redis
      await createPost(
        {
          title: 'Redis Published Post',
          slug: 'redis-published-post',
          content: 'Content',
          status: 'published',
        },
        { client: mockRedis },
      );

      await createPost(
        {
          title: 'Redis Secret Draft',
          slug: 'redis-secret-draft',
          content: 'Content',
          status: 'draft',
        },
        { client: mockRedis },
      );

      const items = await sitemap();
      const urls = items.map((i) => i.url);

      // Verify static core pages are present
      expect(urls.some((u) => u.endsWith('/blog'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/projects'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/work-experience'))).toBe(true);

      // Verify published posts are included
      expect(urls.some((u) => u.includes('redis-published-post'))).toBe(true);
      expect(urls.some((u) => u.includes('cpp-stl-vector-deep-dive'))).toBe(
        true,
      );

      // SECURITY CRITICAL: Drafts must NEVER be in sitemap
      expect(urls.some((u) => u.includes('redis-secret-draft'))).toBe(false);
      expect(
        urls.some((u) => u.includes('draft-advanced-pointer-patterns')),
      ).toBe(false);
    });

    it('generates valid Date objects for lastModified', async () => {
      const items = await sitemap();
      for (const item of items) {
        expect(item.lastModified).toBeDefined();
        if (!item.lastModified) continue;
        const lastModified =
          item.lastModified instanceof Date
            ? item.lastModified
            : new Date(item.lastModified);
        expect(lastModified).toBeInstanceOf(Date);
        expect(isNaN(lastModified.getTime())).toBe(false);
      }
    });
  });

  // =========================================================================
  // 4. Draft Preview API Security (`GET /api/admin/blog/[id]/preview`)
  // =========================================================================
  describe('Protected Draft Preview API', () => {
    it('allows the authorized administrator to preview draft content', async () => {
      const draft = await createPost(
        {
          title: 'Unpublished Draft In Progress',
          slug: 'unpublished-draft-in-progress',
          content: '# Header\n\nPreviewing this draft.',
          status: 'draft',
        },
        { client: mockRedis },
      );

      const req = new NextRequest(
        `http://localhost:3000/api/admin/blog/${draft.id}/preview`,
      );
      const res = await getPreviewApiHandler(req, {
        params: Promise.resolve({ id: draft.id }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      expect(res.headers.get('X-Robots-Tag')).toContain('noindex');

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isPreview).toBe(true);
      expect(data.post.frontmatter.title).toBe('Unpublished Draft In Progress');
      expect(data.post.content).toContain('Previewing this draft.');
    });

    it('rejects unauthenticated users from previewing drafts with 401', async () => {
      mockAuth.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/blog/draft-id/preview',
      );
      const res = await getPreviewApiHandler(req, {
        params: Promise.resolve({ id: 'draft-id' }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('rejects unauthorized GitHub users from previewing drafts with 403', async () => {
      mockAuth.mockResolvedValue({
        user: {
          githubId: UNAUTHORIZED_ID,
          isAdmin: false,
          name: 'Intruder',
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/blog/draft-id/preview',
      );
      const res = await getPreviewApiHandler(req, {
        params: Promise.resolve({ id: 'draft-id' }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('returns 404 when previewing a nonexistent post ID', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/blog/missing-id/preview',
      );
      const res = await getPreviewApiHandler(req, {
        params: Promise.resolve({ id: 'missing-id' }),
      });

      expect(res.status).toBe(404);
    });
  });
});
