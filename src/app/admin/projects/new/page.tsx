import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminProjectEditor } from '@/components/admin/AdminProjectEditor';
import Container from '@/components/common/Container';
import { requireAdminPage } from '@/lib/auth/server-guard';

export const dynamic = 'force-dynamic';
export default async function NewProjectPage() {
  const admin = await requireAdminPage();
  return (
    <div className="bg-background min-h-screen pb-20">
      <AdminHeader admin={admin} section="projects" currentPage="new" />
      <Container className="py-8">
        <AdminProjectEditor />
      </Container>
    </div>
  );
}
