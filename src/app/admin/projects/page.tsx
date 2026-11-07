import { Metadata } from 'next';
import Link from 'next/link';

import { AdminHeader } from '@/components/admin/AdminHeader';
import Container from '@/components/common/Container';
import { requireAdminPage } from '@/lib/auth/server-guard';
import { listCmsProjects } from '@/lib/project-storage';

export const metadata: Metadata = {
  title: 'Project CMS | Atharv Sharma',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const admin = await requireAdminPage();
  const projects = await listCmsProjects(true);
  return (
    <div className="bg-background min-h-screen pb-20">
      <AdminHeader admin={admin} section="projects" />
      <Container className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Create case studies and manage published projects.
            </p>
          </div>
          <Link
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            href="/admin/projects/new"
          >
            New project
          </Link>
        </div>
        <div className="divide-border rounded-lg border">
          {projects.length ? (
            projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b p-4 last:border-0"
              >
                <div>
                  <Link
                    className="font-semibold hover:underline"
                    href={`/admin/projects/${project.id}/edit`}
                  >
                    {project.title}
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    /{project.slug} · {project.status}
                  </p>
                </div>
                <Link
                  className="text-primary text-sm underline"
                  href={`/projects/${project.slug}`}
                  target="_blank"
                >
                  Preview
                </Link>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground p-6">
              No projects yet. Create your first project case study.
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
