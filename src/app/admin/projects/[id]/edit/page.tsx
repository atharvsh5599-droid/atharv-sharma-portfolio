import { notFound } from 'next/navigation';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminProjectEditor } from '@/components/admin/AdminProjectEditor';
import Container from '@/components/common/Container';
import { requireAdminPage } from '@/lib/auth/server-guard';
import { getCmsProject } from '@/lib/project-storage';

export const dynamic = 'force-dynamic';
export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminPage();
  const project = await getCmsProject((await params).id);
  if (!project) notFound();
  return (
    <div className="bg-background min-h-screen pb-20">
      <AdminHeader admin={admin} section="projects" currentPage="edit" />
      <Container className="py-8">
        <AdminProjectEditor project={project} />
      </Container>
    </div>
  );
}
