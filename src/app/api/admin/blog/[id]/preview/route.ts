import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_CACHE_HEADERS, handleApiError } from '@/lib/api-response';
import { assertAdminApi } from '@/lib/auth/server-guard';
import { getBlogPostBySlug } from '@/lib/blog';
import { PostNotFoundError } from '@/lib/blog-errors';
import { getPostById, getPostBySlug } from '@/lib/blog-storage';
import { cmsPostToBlogPost } from '@/types/blog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/admin/blog/[id]/preview
 * Protected preview API endpoint requiring a valid administrator session.
 * Exposes draft content ONLY to the authenticated administrator.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  // 1. Strict administrator verification
  const guard = await assertAdminApi();
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const { id } = await params;

    // 2. Fetch from Redis
    let redisPost = await getPostById(id);
    if (!redisPost) {
      redisPost = await getPostBySlug(id);
    }

    if (redisPost) {
      return NextResponse.json(
        {
          success: true,
          post: cmsPostToBlogPost(redisPost),
          rawPost: redisPost,
          isPreview: true,
        },
        {
          status: 200,
          headers: ADMIN_CACHE_HEADERS,
        },
      );
    }

    // 3. Fallback to local filesystem MDX
    const localPost = getBlogPostBySlug(id);
    if (localPost) {
      return NextResponse.json(
        {
          success: true,
          post: localPost,
          isPreview: true,
        },
        {
          status: 200,
          headers: ADMIN_CACHE_HEADERS,
        },
      );
    }

    throw new PostNotFoundError(id);
  } catch (error) {
    return handleApiError(error, false);
  }
}
