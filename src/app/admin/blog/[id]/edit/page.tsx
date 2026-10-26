import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminPostEditor } from '@/components/admin/AdminPostEditor';
import Container from '@/components/common/Container';
import { requireAdminPage } from '@/lib/auth/server-guard';
import { getPostById, getPostBySlug } from '@/lib/blog-storage';

export const metadata: Metadata = {
  title: 'Edit Blog Article | CMS Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminEditPostPage({ params }: EditPostPageProps) {
  const admin = await requireAdminPage();
  const { id } = await params;

  let post = await getPostById(id);
  if (!post) {
    post = await getPostBySlug(id);
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      <AdminHeader admin={admin} currentPage="edit" />
      <Container className="py-8">
        <AdminPostEditor mode="edit" initialPost={post} />
      </Container>
    </div>
  );
}
