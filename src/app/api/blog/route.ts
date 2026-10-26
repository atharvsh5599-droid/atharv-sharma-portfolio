import { NextRequest, NextResponse } from 'next/server';

import { PUBLIC_CACHE_HEADERS, handleApiError } from '@/lib/api-response';
import { listPosts } from '@/lib/blog-storage';
import { cmsPostToPreview } from '@/types/blog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/blog
 * Public endpoint returning ONLY published blog posts.
 * Drafts are strictly excluded regardless of query parameters.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const tagParam = searchParams.get('tag');
    const queryParam = searchParams.get('q');

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Strict security: Force status to 'published' ONLY
    const result = await listPosts({
      status: 'published',
      limit: isNaN(limit) ? 20 : limit,
      offset: isNaN(offset) ? 0 : offset,
      tag: tagParam || undefined,
    });

    let posts = result.posts.map(cmsPostToPreview);

    // Optional published-only search filter
    if (queryParam && queryParam.trim().length > 0) {
      const q = queryParam.trim().toLowerCase();
      posts = posts.filter(
        (p) =>
          p.frontmatter.title.toLowerCase().includes(q) ||
          p.frontmatter.description.toLowerCase().includes(q) ||
          p.frontmatter.tags.some((t) => t.toLowerCase().includes(q)) ||
          (p.frontmatter.category &&
            p.frontmatter.category.toLowerCase().includes(q)),
      );
    }

    return NextResponse.json(
      {
        success: true,
        posts,
        total: queryParam ? posts.length : result.total,
        hasMore: queryParam ? false : result.hasMore,
        offset,
        limit,
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
