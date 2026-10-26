import { Metadata } from 'next';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminPostEditor } from '@/components/admin/AdminPostEditor';
import Container from '@/components/common/Container';
import { requireAdminPage } from '@/lib/auth/server-guard';

export const metadata: Metadata = {
  title: 'Create Blog Article | CMS Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminNewPostPage() {
  const admin = await requireAdminPage();

  return (
    <div className="bg-background min-h-screen pb-20">
      <AdminHeader admin={admin} currentPage="new" />
      <Container className="py-8">
        <AdminPostEditor mode="create" />
      </Container>
    </div>
  );
}
