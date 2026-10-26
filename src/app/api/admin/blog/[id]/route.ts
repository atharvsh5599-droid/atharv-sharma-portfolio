import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_CACHE_HEADERS, handleApiError } from '@/lib/api-response';
import { assertAdminApi } from '@/lib/auth/server-guard';
import { PostNotFoundError } from '@/lib/blog-errors';
import {
  deletePost,
  getPostById,
  getPostBySlug,
  updatePost,
} from '@/lib/blog-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Helper to resolve post by either ID or slug.
 */
async function resolveExistingPost(idOrSlug: string) {
  let post = await getPostById(idOrSlug);
  if (!post) {
    post = await getPostBySlug(idOrSlug);
  }
  return post;
}

/**
 * GET /api/admin/blog/[id]
 * Retrieves a single blog post (draft or published) by ID or slug for the authenticated admin.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await assertAdminApi();
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const { id } = await params;
    const post = await resolveExistingPost(id);

    if (!post) {
      throw new PostNotFoundError(id);
    }

    return NextResponse.json(
      {
        success: true,
        post,
      },
      {
        status: 200,
        headers: ADMIN_CACHE_HEADERS,
      },
    );
  } catch (error) {
    return handleApiError(error, false);
  }
}

/**
 * PUT /api/admin/blog/[id]
 * Updates an existing blog post for the authenticated admin.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const guard = await assertAdminApi();
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const { id } = await params;
    const existing = await resolveExistingPost(id);

    if (!existing) {
      throw new PostNotFoundError(id);
    }

    const body = await request.json();
    const updated = await updatePost(existing.id, body);

    try {
      revalidatePath('/blog');
      revalidatePath(`/blog/${existing.slug}`);
      if (existing.slug !== updated.slug) {
        revalidatePath(`/blog/${updated.slug}`);
      }
      revalidatePath('/sitemap.xml');
    } catch {
      // Non-critical during test runs
    }

    return NextResponse.json(
      {
        success: true,
        post: updated,
      },
      {
        status: 200,
        headers: ADMIN_CACHE_HEADERS,
      },
    );
  } catch (error) {
    return handleApiError(error, false);
  }
}

/**
 * PATCH /api/admin/blog/[id]
 * Supports PATCH method identical to PUT.
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  return PUT(request, context);
}

/**
 * DELETE /api/admin/blog/[id]
 * Deletes a blog post and all its index entries for the authenticated admin.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const guard = await assertAdminApi();
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const { id } = await params;
    const existing = await resolveExistingPost(id);

    if (!existing) {
      throw new PostNotFoundError(id);
    }

    await deletePost(existing.id);

    try {
      revalidatePath('/blog');
      revalidatePath(`/blog/${existing.slug}`);
      revalidatePath('/sitemap.xml');
    } catch {
      // Non-critical during test runs
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Blog post deleted successfully.',
      },
      {
        status: 200,
        headers: ADMIN_CACHE_HEADERS,
      },
    );
  } catch (error) {
    return handleApiError(error, false);
  }
}
