import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { assertAdminApi } from '@/lib/auth/server-guard';
import {
  deleteCmsProject,
  getCmsProject,
  saveCmsProject,
} from '@/lib/project-storage';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await assertAdminApi();
  if (!guard.authorized) return guard.response;
  const { id } = await params;
  const project = await getCmsProject(id);
  return project
    ? NextResponse.json(
        { project },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    : NextResponse.json({ error: 'Project not found.' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await assertAdminApi();
  if (!guard.authorized) return guard.response;
  const { id } = await params;
  try {
    const project = await saveCmsProject(await request.json(), id);
    revalidatePath('/projects');
    revalidatePath(`/projects/${project.slug}`);
    return NextResponse.json({ project });
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await assertAdminApi();
  if (!guard.authorized) return guard.response;
  const { id } = await params;
  const project = await getCmsProject(id);
  await deleteCmsProject(id);
  revalidatePath('/projects');
  if (project) revalidatePath(`/projects/${project.slug}`);
  return NextResponse.json({ success: true });
}
