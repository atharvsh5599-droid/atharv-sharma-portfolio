import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_CACHE_HEADERS, handleApiError } from '@/lib/api-response';
import { assertAdminApi } from '@/lib/auth/server-guard';
import { PostNotFoundError } from '@/lib/blog-errors';
import { getPostById, getPostBySlug, updatePost } from '@/lib/blog-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/admin/blog/[id]/unpublish
 * Reverts a published post to draft status and removes it from the public published index.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const guard = await assertAdminApi();
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const { id } = await params;
    let existing = await getPostById(id);
    if (!existing) {
      existing = await getPostBySlug(id);
    }

    if (!existing) {
      throw new PostNotFoundError(id);
    }

    const updated = await updatePost(existing.id, {
      status: 'draft',
      publishedAt: null,
    });

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
