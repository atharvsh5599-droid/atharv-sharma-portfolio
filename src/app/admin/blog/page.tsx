import { Metadata } from 'next';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminPostList } from '@/components/admin/AdminPostList';
import Container from '@/components/common/Container';
import { requireAdminPage } from '@/lib/auth/server-guard';
import { listPosts } from '@/lib/blog-storage';
import { CmsBlogPost } from '@/types/blog';

export const metadata: Metadata = {
  title: 'Blog CMS Dashboard | Atharv Sharma',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  // Independent defense-in-depth authorization check
  const admin = await requireAdminPage();

  let posts: CmsBlogPost[] = [];
  try {
    const result = await listPosts({ status: 'all', limit: 100 });
    posts = result.posts;
  } catch (error) {
    console.error('[admin:blog] Error listing posts from Redis:', error);
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      <AdminHeader admin={admin} currentPage="list" />
      <Container className="py-8">
        <AdminPostList initialPosts={posts} />
      </Container>
    </div>
  );
}
