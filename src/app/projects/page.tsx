import { Metadata } from 'next';

import Container from '@/components/common/Container';
import { ProjectList } from '@/components/projects/ProjectList';
import { Separator } from '@/components/ui/separator';
import { generateMetadata as getMetadata } from '@/config/Meta';
import { projects } from '@/config/Projects';
import { listCmsProjects } from '@/lib/project-storage';

export const metadata: Metadata = {
  ...getMetadata('/projects'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const cmsProjects = await listCmsProjects();
  const listedProjects = [
    ...cmsProjects.map((project) => ({
      title: project.title,
      description: project.description,
      image: project.image,
      link: project.live || project.github || `/projects/${project.slug}`,
      technologies: project.technologies.map((name) => ({
        name,
        icon: <span className="text-[10px]">{name.slice(0, 1)}</span>,
      })),
      github: project.github || undefined,
      live: project.live || project.github || `/projects/${project.slug}`,
      details: true,
      projectDetailsPageSlug: `/projects/${project.slug}`,
      isWorking: true,
    })),
    ...projects,
  ];
  return (
    <Container className="py-16">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Projects
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Selected projects will appear here as I build and document my work.
          </p>
        </div>

        <Separator />

        {/* Projects */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              All Projects
              {projects.length > 0 && (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  ({listedProjects.length}{' '}
                  {listedProjects.length === 1 ? 'project' : 'projects'})
                </span>
              )}
            </h2>
          </div>

          <ProjectList projects={listedProjects} />
        </div>
      </div>
    </Container>
  );
}
