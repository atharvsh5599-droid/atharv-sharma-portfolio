import type { Redis } from '@upstash/redis';
import type { Session } from 'next-auth';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as publishHandler } from '@/app/api/admin/blog/[id]/publish/route';
// Admin route handlers
import {
  DELETE as deletePostHandler,
  GET as getPostAdminHandler,
  PUT as updatePostHandler,
} from '@/app/api/admin/blog/[id]/route';
import { POST as unpublishHandler } from '@/app/api/admin/blog/[id]/unpublish/route';
import {
  POST as createPostAdminHandler,
  GET as listPostsAdminHandler,
} from '@/app/api/admin/blog/route';
// Public route handlers
import { GET as getPublicPostBySlug } from '@/app/api/blog/[slug]/route';
import { GET as listPublicPosts } from '@/app/api/blog/route';
import { auth } from '@/auth';
import { resetRedisClient, setRedisClientForTesting } from '@/lib/redis';
import type { CmsBlogPost } from '@/types/blog';

import { MockRedisClient } from './mock-redis';

// Mock NextAuth session
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Blog CMS Server-Side API Suite', () => {
  let mockRedis: MockRedisClient;
  const ADMIN_ID = '253749531';
  const UNAUTHORIZED_ID = '999999999';
  const mockAuth = vi.mocked(auth) as unknown as {
    mockResolvedValue: (value: Session | null) => void;
  };

  beforeEach(() => {
    mockRedis = new MockRedisClient();
    setRedisClientForTesting(mockRedis as unknown as Redis);
    process.env.ADMIN_GITHUB_ID = ADMIN_ID;

    // Default: Authenticated as authorized admin
    mockAuth.mockResolvedValue({
      user: {
        githubId: ADMIN_ID,
        isAdmin: true,
        name: 'Atharv Sharma',
        email: 'atharv@example.com',
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });
  });

  afterEach(() => {
    resetRedisClient();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Authorization & Security Enforcement on Admin Endpoints
  // =========================================================================
  describe('Admin Authorization Guard', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      mockAuth.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/blog');
      const res = await listPostsAdminHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Authentication required');
      expect(res.headers.get('Cache-Control')).toContain('no-store');
    });

    it('rejects unauthorized GitHub users with 403 Forbidden', async () => {
      mockAuth.mockResolvedValue({
        user: {
          githubId: UNAUTHORIZED_ID,
          isAdmin: false,
          name: 'Unauthorized User',
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/blog');
      const res = await listPostsAdminHandler(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Access denied');
      expect(res.headers.get('Cache-Control')).toContain('no-store');
    });

    it('fails safely with 500 when ADMIN_GITHUB_ID server config is missing', async () => {
      delete process.env.ADMIN_GITHUB_ID;
      delete process.env.ADMIN_GITHUB_IDS;

      const req = new NextRequest('http://localhost:3000/api/admin/blog');
      const res = await listPostsAdminHandler(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Server configuration error');
    });

    it('enforces independent authorization on all admin mutation routes', async () => {
      mockAuth.mockResolvedValue(null); // unauthenticated

      const dummyParams = { params: Promise.resolve({ id: 'any-post-id' }) };

      // POST create
      const createRes = await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({ title: 'Test', content: 'Content' }),
        }),
      );
      expect(createRes.status).toBe(401);

      // GET by id
      const getRes = await getPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog/any-post-id'),
        dummyParams,
      );
      expect(getRes.status).toBe(401);

      // PUT update
      const updateRes = await updatePostHandler(
        new NextRequest('http://localhost:3000/api/admin/blog/any-post-id', {
          method: 'PUT',
          body: JSON.stringify({ title: 'New Title' }),
        }),
        dummyParams,
      );
      expect(updateRes.status).toBe(401);

      // DELETE
      const deleteRes = await deletePostHandler(
        new NextRequest('http://localhost:3000/api/admin/blog/any-post-id', {
          method: 'DELETE',
        }),
        dummyParams,
      );
      expect(deleteRes.status).toBe(401);

      // Publish
      const publishRes = await publishHandler(
        new NextRequest(
          'http://localhost:3000/api/admin/blog/any-post-id/publish',
          { method: 'POST' },
        ),
        dummyParams,
      );
      expect(publishRes.status).toBe(401);

      // Unpublish
      const unpublishRes = await unpublishHandler(
        new NextRequest(
          'http://localhost:3000/api/admin/blog/any-post-id/unpublish',
          { method: 'POST' },
        ),
        dummyParams,
      );
      expect(unpublishRes.status).toBe(401);
    });
  });

  // =========================================================================
  // 2. Admin Post Creation (`POST /api/admin/blog`)
  // =========================================================================
  describe('Admin Create Post', () => {
    it('creates a draft blog post successfully and returns 201', async () => {
      const payload = {
        title: 'Mastering Modern C++ Coroutines',
        content:
          '# Coroutines in C++20\n\nCoroutines allow cooperative multitasking.',
        tags: ['C++', 'Coroutines', 'Async'],
        status: 'draft',
      };

      const req = new NextRequest('http://localhost:3000/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await createPostAdminHandler(req);
      expect(res.status).toBe(201);
      expect(res.headers.get('Cache-Control')).toContain('no-store');

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.post.id).toBeDefined();
      expect(data.post.title).toBe(payload.title);
      expect(data.post.slug).toBe('mastering-modern-c-coroutines');
      expect(data.post.status).toBe('draft');
      expect(data.post.publishedAt).toBeNull();
      expect(data.post.readingTime).toBe('1 min read');
    });

    it('rejects post creation with 400 Bad Request if title or content is empty', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '', content: '' }),
      });

      const res = await createPostAdminHandler(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.issues).toBeDefined();
    });

    it('rejects malformed JSON with 400 Bad Request', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json syntax {',
      });

      const res = await createPostAdminHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Malformed JSON payload');
    });

    it('rejects conflicting slug with 409 Conflict', async () => {
      // Create first post
      await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Identical Title',
            slug: 'identical-slug',
            content: 'First post content.',
          }),
        }),
      );

      // Attempt to create second post with same slug
      const req2 = new NextRequest('http://localhost:3000/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Another Post',
          slug: 'identical-slug',
          content: 'Second post content.',
        }),
      });

      const res2 = await createPostAdminHandler(req2);
      expect(res2.status).toBe(409);
      const data2 = await res2.json();
      expect(data2.success).toBe(false);
      expect(data2.error).toContain('already exists');
    });
  });

  // =========================================================================
  // 3. Admin Listing (`GET /api/admin/blog`)
  // =========================================================================
  describe('Admin List Posts', () => {
    it('returns both published posts and drafts for authorized admin', async () => {
      // Create 1 draft and 1 published post
      await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Draft Post 1',
            content: 'Draft content.',
            status: 'draft',
          }),
        }),
      );

      await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Published Post 1',
            content: 'Published content.',
            status: 'published',
          }),
        }),
      );

      const req = new NextRequest('http://localhost:3000/api/admin/blog');
      const res = await listPostsAdminHandler(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(2);
      expect(data.posts.length).toBe(2);
      const posts = data.posts as CmsBlogPost[];
      expect(posts.some((post) => post.status === 'draft')).toBe(true);
      expect(posts.some((post) => post.status === 'published')).toBe(true);
    });

    it('filters by status=draft accurately', async () => {
      await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Draft Only',
            content: 'Draft text',
            status: 'draft',
          }),
        }),
      );

      const req = new NextRequest(
        'http://localhost:3000/api/admin/blog?status=draft',
      );
      const res = await listPostsAdminHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(
        (data.posts as CmsBlogPost[]).every((post) => post.status === 'draft'),
      ).toBe(true);
    });
  });

  // =========================================================================
  // 4. Admin Retrieve Single Post (`GET /api/admin/blog/[id]`)
  // =========================================================================
  describe('Admin Retrieve Post by ID or Slug', () => {
    it('retrieves draft post by ID for editing', async () => {
      const createdRes = await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Secret Draft',
            content: 'Draft secrets.',
            status: 'draft',
          }),
        }),
      );
      const { post } = await createdRes.json();

      const req = new NextRequest(
        `http://localhost:3000/api/admin/blog/${post.id}`,
      );
      const res = await getPostAdminHandler(req, {
        params: Promise.resolve({ id: post.id }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.post.id).toBe(post.id);
      expect(data.post.content).toBe('Draft secrets.');
    });

    it('retrieves post by slug as a fallback', async () => {
      const createdRes = await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Slug Lookup Post',
            slug: 'custom-slug-name',
            content: 'Content here.',
          }),
        }),
      );
      const { post } = await createdRes.json();

      const req = new NextRequest(
        `http://localhost:3000/api/admin/blog/custom-slug-name`,
      );
      const res = await getPostAdminHandler(req, {
        params: Promise.resolve({ id: 'custom-slug-name' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.post.id).toBe(post.id);
    });

    it('returns 404 Not Found for nonexistent post ID', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/admin/blog/nonexistent-id`,
      );
      const res = await getPostAdminHandler(req, {
        params: Promise.resolve({ id: 'nonexistent-id' }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  // =========================================================================
  // 5. Admin Update Post (`PUT /api/admin/blog/[id]`)
  // =========================================================================
  describe('Admin Update Post', () => {
    it('updates title and content while preserving creation date and updating updatedAt', async () => {
      const createdRes = await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Initial Title',
            content: 'Initial content',
          }),
        }),
      );
      const { post: initial } = await createdRes.json();

      const updatePayload = {
        title: 'Updated Title',
        content: 'Brand new updated content.',
      };

      const req = new NextRequest(
        `http://localhost:3000/api/admin/blog/${initial.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        },
      );
      const res = await updatePostHandler(req, {
        params: Promise.resolve({ id: initial.id }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.post.title).toBe('Updated Title');
      expect(data.post.content).toBe('Brand new updated content.');
      expect(data.post.createdAt).toBe(initial.createdAt); // Preserved
      expect(new Date(data.post.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(initial.updatedAt).getTime(),
      );
    });

    it('returns 404 Not Found when updating nonexistent post', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/blog/missing-id',
        {
          method: 'PUT',
          body: JSON.stringify({ title: 'New' }),
        },
      );
      const res = await updatePostHandler(req, {
        params: Promise.resolve({ id: 'missing-id' }),
      });

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 6. Admin Publish & Unpublish Endpoints
  // =========================================================================
  describe('Admin Publish & Unpublish Transitions', () => {
    it('publishes a draft post via POST /api/admin/blog/[id]/publish', async () => {
      const createdRes = await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Ready for Release',
            content: 'Exciting news!',
            status: 'draft',
          }),
        }),
      );
      const { post } = await createdRes.json();
      expect(post.status).toBe('draft');

      const req = new NextRequest(
        `http://localhost:3000/api/admin/blog/${post.id}/publish`,
        { method: 'POST' },
      );
      const res = await publishHandler(req, {
        params: Promise.resolve({ id: post.id }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.post.status).toBe('published');
      expect(data.post.publishedAt).toBeDefined();
    });

    it('unpublishes a published post via POST /api/admin/blog/[id]/unpublish', async () => {
      const createdRes = await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Take Down Article',
            content: 'Needs revision.',
            status: 'published',
          }),
        }),
      );
      const { post } = await createdRes.json();
      expect(post.status).toBe('published');

      const req = new NextRequest(
        `http://localhost:3000/api/admin/blog/${post.id}/unpublish`,
        { method: 'POST' },
      );
      const res = await unpublishHandler(req, {
        params: Promise.resolve({ id: post.id }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.post.status).toBe('draft');
      expect(data.post.publishedAt).toBeNull();
    });
  });

  // =========================================================================
  // 7. Admin Delete Post (`DELETE /api/admin/blog/[id]`)
  // =========================================================================
  describe('Admin Delete Post', () => {
    it('deletes post and all index entries cleanly', async () => {
      const createdRes = await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'To Be Deleted',
            slug: 'delete-me',
            content: 'Goodbye.',
          }),
        }),
      );
      const { post } = await createdRes.json();

      const req = new NextRequest(
        `http://localhost:3000/api/admin/blog/${post.id}`,
        { method: 'DELETE' },
      );
      const res = await deletePostHandler(req, {
        params: Promise.resolve({ id: post.id }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');

      // Verify nonexistent after deletion
      const checkRes = await getPostAdminHandler(req, {
        params: Promise.resolve({ id: post.id }),
      });
      expect(checkRes.status).toBe(404);
    });
  });

  // =========================================================================
  // 8. Public Endpoints & Draft Leakage Prevention
  // =========================================================================
  describe('Public API Security & Draft Containment', () => {
    it('returns ONLY published posts via GET /api/blog (drafts are excluded)', async () => {
      // Create 1 draft and 1 published
      await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Top Secret Draft',
            content: 'Draft secrets.',
            status: 'draft',
          }),
        }),
      );

      await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Public Tutorial',
            content: 'Public tutorial text.',
            status: 'published',
          }),
        }),
      );

      // Public caller tries to ask for drafts or all
      const req = new NextRequest(
        'http://localhost:3000/api/blog?status=draft',
      );
      const res = await listPublicPosts(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('public');

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.posts.length).toBeGreaterThanOrEqual(1);
      expect(
        data.posts.some(
          (post: { frontmatter: { title: string } }) =>
            post.frontmatter.title === 'Public Tutorial',
        ),
      ).toBe(true);
      expect(
        data.posts.some(
          (post: { frontmatter: { title: string } }) =>
            post.frontmatter.title === 'Top Secret Draft',
        ),
      ).toBe(false);
    });

    it('returns 404 Not Found when a public user attempts to access an unpublished draft by slug', async () => {
      await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Unpublished Research Note',
            slug: 'unpublished-research-note',
            content: 'Classified findings.',
            status: 'draft',
          }),
        }),
      );

      const req = new NextRequest(
        'http://localhost:3000/api/blog/unpublished-research-note',
      );
      const res = await getPublicPostBySlug(req, {
        params: Promise.resolve({ slug: 'unpublished-research-note' }),
      });

      // SECURITY CRITICAL: MUST return 404, never 200 with draft data!
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
      expect(data.post).toBeUndefined();
    });

    it('returns 200 and formatted post when accessing a published post by slug', async () => {
      await createPostAdminHandler(
        new NextRequest('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Published Article',
            slug: 'published-article',
            content: 'Welcome to this public article.',
            status: 'published',
          }),
        }),
      );

      const req = new NextRequest(
        'http://localhost:3000/api/blog/published-article',
      );
      const res = await getPublicPostBySlug(req, {
        params: Promise.resolve({ slug: 'published-article' }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('public');
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.post.slug).toBe('published-article');
      expect(data.post.frontmatter.published).toBe(true);
    });

    it('correctly falls back to existing published filesystem MDX posts', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/blog/cpp-stl-vector-deep-dive',
      );
      const res = await getPublicPostBySlug(req, {
        params: Promise.resolve({ slug: 'cpp-stl-vector-deep-dive' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.post.frontmatter.title).toContain('std::vector');
    });

    it('returns 404 for filesystem draft MDX posts (draft-advanced-pointer-patterns)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/blog/draft-advanced-pointer-patterns',
      );
      const res = await getPublicPostBySlug(req, {
        params: Promise.resolve({
          slug: 'draft-advanced-pointer-patterns',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });
});
