import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { assertAdminApi } from '@/lib/auth/server-guard';
import { listCmsProjects, saveCmsProject } from '@/lib/project-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await assertAdminApi();
  if (!guard.authorized) return guard.response;
  return NextResponse.json(
    { projects: await listCmsProjects(true) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: NextRequest) {
  const guard = await assertAdminApi();
  if (!guard.authorized) return guard.response;
  try {
    const project = await saveCmsProject(await request.json());
    revalidatePath('/projects');
    revalidatePath(`/projects/${project.slug}`);
    revalidatePath('/sitemap.xml');
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to save project.',
      },
      { status: 400 },
    );
  }
}
