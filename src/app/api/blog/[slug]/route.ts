import { NextRequest, NextResponse } from 'next/server';

import { PUBLIC_CACHE_HEADERS, handleApiError } from '@/lib/api-response';
import { getUnifiedBlogPostBySlug } from '@/lib/blog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/blog/[slug]
 * Public endpoint to retrieve a single published blog post by slug.
 * Drafts (both in Redis and local files) return 404 Not Found to prevent data leakage.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const post = await getUnifiedBlogPostBySlug(slug);

    if (!post || !post.frontmatter.published) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found.',
        },
        {
          status: 404,
          headers: PUBLIC_CACHE_HEADERS,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        post,
      },
      {
        status: 200,
        headers: PUBLIC_CACHE_HEADERS,
      },
    );
  } catch (error) {
    return handleApiError(error, true);
  }
}
