import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_CACHE_HEADERS, handleApiError } from '@/lib/api-response';
import { assertAdminApi } from '@/lib/auth/server-guard';
import { createPost, listPosts } from '@/lib/blog-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/blog
 * Lists all posts (including drafts and published posts) for the authenticated admin.
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate admin
  const guard = await assertAdminApi();
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const tagParam = searchParams.get('tag');

    let status: 'all' | 'published' | 'draft' = 'all';
    if (statusParam === 'published' || statusParam === 'draft') {
      status = statusParam;
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const result = await listPosts({
      status,
      limit: isNaN(limit) ? 20 : limit,
      offset: isNaN(offset) ? 0 : offset,
      tag: tagParam || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
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
 * POST /api/admin/blog
 * Creates a new blog post in Redis for the authenticated admin.
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate admin
  const guard = await assertAdminApi();
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const body = await request.json();
    const post = await createPost(body);

    // Revalidate public caches on write
    try {
      revalidatePath('/blog');
      revalidatePath(`/blog/${post.slug}`);
      revalidatePath('/sitemap.xml');
    } catch {
      // Non-critical during test runs
    }

    return NextResponse.json(
      {
        success: true,
        post,
      },
      {
        status: 201,
        headers: ADMIN_CACHE_HEADERS,
      },
    );
  } catch (error) {
    return handleApiError(error, false);
  }
}
