import { CmsProject } from '@/types/project';

import { getSafeProjectImage } from './project-image';
import { PROJECT_REDIS_KEYS, getRedisClient } from './redis';

type ProjectInput = Partial<CmsProject> &
  Pick<CmsProject, 'title' | 'description'>;

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'project'
  );
}

function normalize(
  input: ProjectInput,
  id: string,
  current?: CmsProject,
): CmsProject {
  const now = new Date().toISOString();
  const status = input.status === 'published' ? 'published' : 'draft';
  return {
    id,
    slug: slugify(input.slug || input.title),
    title: input.title.trim(),
    description: input.description.trim(),
    image: getSafeProjectImage(input.image),
    technologies: (input.technologies || [])
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean),
    github: input.github?.trim() || '',
    live: input.live?.trim() || '',
    timeline: input.timeline?.trim() || '',
    role: input.role?.trim() || '',
    team: input.team?.trim() || '',
    status,
    featured: Boolean(input.featured),
    content: input.content || '',
    challenges: (input.challenges || [])
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean),
    learnings: (input.learnings || [])
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean),
    createdAt: current?.createdAt || now,
    updatedAt: now,
    publishedAt: status === 'published' ? current?.publishedAt || now : null,
  };
}

export async function listCmsProjects(
  includeDrafts = false,
): Promise<CmsProject[]> {
  const redis = getRedisClient();
  if (!redis) return [];
  const ids = await redis.zrange<string[]>(PROJECT_REDIS_KEYS.index, 0, -1, {
    rev: true,
  });
  const records = await Promise.all(
    ids.map((id) => redis.get<CmsProject>(PROJECT_REDIS_KEYS.item(id))),
  );
  return records.filter(
    (p): p is CmsProject =>
      Boolean(p) && (includeDrafts || p!.status === 'published'),
  );
}

export async function getCmsProject(
  idOrSlug: string,
): Promise<CmsProject | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  const all = await listCmsProjects(true);
  const byId = await redis.get<CmsProject>(PROJECT_REDIS_KEYS.item(idOrSlug));
  return byId || all.find((project) => project.slug === idOrSlug) || null;
}

export async function saveCmsProject(
  raw: ProjectInput,
  id?: string,
): Promise<CmsProject> {
  const redis = getRedisClient();
  if (!redis)
    throw new Error('Project publishing requires Upstash Redis configuration.');
  if (!raw.title?.trim() || !raw.description?.trim())
    throw new Error('Project title and summary are required.');
  const recordId = id || crypto.randomUUID();
  const existing = id ? await getCmsProject(id) : null;
  const project = normalize(raw, recordId, existing || undefined);
  const collision = (await listCmsProjects(true)).find(
    (item) => item.slug === project.slug && item.id !== recordId,
  );
  if (collision) throw new Error('A project already uses this slug.');
  await redis.set(PROJECT_REDIS_KEYS.item(recordId), project);
  await redis.zadd(PROJECT_REDIS_KEYS.index, {
    score: Date.now(),
    member: recordId,
  });
  return project;
}

export async function deleteCmsProject(id: string) {
  const redis = getRedisClient();
  if (!redis)
    throw new Error('Project publishing requires Upstash Redis configuration.');
  await redis.del(PROJECT_REDIS_KEYS.item(id));
  await redis.zrem(PROJECT_REDIS_KEYS.index, id);
}
