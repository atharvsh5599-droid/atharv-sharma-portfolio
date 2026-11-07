'use client';

import { ImagePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { CmsProject } from '@/types/project';

const empty = {
  title: '',
  slug: '',
  description: '',
  image: '',
  technologies: '',
  github: '',
  live: '',
  timeline: '',
  role: '',
  team: '',
  content: '',
  challenges: '',
  learnings: '',
  featured: false,
};

export function AdminProjectEditor({ project }: { project?: CmsProject }) {
  const router = useRouter();
  const [values, setValues] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (project)
      setValues({
        title: project.title,
        slug: project.slug,
        description: project.description,
        image: project.image,
        technologies: project.technologies.join(', '),
        github: project.github,
        live: project.live,
        timeline: project.timeline,
        role: project.role,
        team: project.team,
        content: project.content,
        challenges: project.challenges.join('\n'),
        learnings: project.learnings.join('\n'),
        featured: project.featured,
      });
  }, [project]);
  const field = (
    name: keyof typeof empty,
    label: string,
    multiline = false,
  ) => (
    <label className="grid gap-1.5 text-sm font-medium" key={name}>
      {label}
      {multiline ? (
        <textarea
          rows={name === 'content' ? 14 : 3}
          value={values[name] as string}
          onChange={(event) =>
            setValues({ ...values, [name]: event.target.value })
          }
          className="bg-background border-input rounded-md border px-3 py-2 font-normal"
        />
      ) : (
        <input
          value={values[name] as string}
          onChange={(event) =>
            setValues({ ...values, [name]: event.target.value })
          }
          className="bg-background border-input rounded-md border px-3 py-2 font-normal"
        />
      )}
    </label>
  );
  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(
        file.type,
      )
    ) {
      setError('Choose a PNG, JPEG, WebP, or GIF image.');
      event.target.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      setError('Choose an image smaller than 1 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setValues((current) => ({
          ...current,
          image: reader.result as string,
        }));
        setError('');
      }
    };
    reader.onerror = () => setError('Could not read the selected image.');
    reader.readAsDataURL(file);
    event.target.value = '';
  }
  async function save(status: 'draft' | 'published') {
    setSaving(true);
    setError('');
    const payload = {
      ...values,
      status,
      technologies: values.technologies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      challenges: values.challenges
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      learnings: values.learnings
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      const response = await fetch(
        project ? `/api/admin/projects/${project.id}` : '/api/admin/projects',
        {
          method: project ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Could not save project.');
      router.push('/admin/projects');
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save project.',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      className="mx-auto max-w-4xl space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void save('draft');
      }}
    >
      <div>
        <h1 className="text-3xl font-bold">
          {project ? 'Edit project' : 'New project'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Add the project details and case study visitors will see.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {field('title', 'Project title *')}
        {field('slug', 'URL slug (optional)')}
        {field('description', 'Short summary *')}
        <label className="grid gap-2 text-sm font-medium">
          Cover image
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />
          <span className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="border-input inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <ImagePlus className="size-4" /> Upload image
            </button>
            {values.image && (
              <button
                type="button"
                onClick={() => setValues({ ...values, image: '' })}
                className="text-muted-foreground px-2 text-sm"
              >
                Remove image
              </button>
            )}
          </span>
          <input
            value={values.image.startsWith('data:') ? '' : values.image}
            onChange={(event) =>
              setValues({ ...values, image: event.target.value })
            }
            placeholder="Or paste an image URL"
            className="bg-background border-input rounded-md border px-3 py-2 font-normal"
          />
          <span className="text-muted-foreground text-xs font-normal">
            Upload PNG, JPEG, WebP, or GIF under 1 MB, or paste an image URL.
          </span>
          {values.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={values.image}
              alt="Project cover preview"
              className="aspect-video w-full rounded-md border object-cover"
            />
          )}
        </label>
        {field('technologies', 'Technologies (comma separated)')}
        {field('timeline', 'Timeline')}
        {field('role', 'Your role')}
        {field('team', 'Team')}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {field('github', 'GitHub URL')}
        {field('live', 'Live URL')}
      </div>
      {field('content', 'Case study (Markdown)', true)}
      <div className="grid gap-4 md:grid-cols-2">
        {field('challenges', 'Challenges (one per line)', true)}
        {field('learnings', 'Learnings (one per line)', true)}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.featured}
          onChange={(event) =>
            setValues({ ...values, featured: event.target.checked })
          }
        />{' '}
        Feature this project
      </label>
      <div className="flex flex-wrap gap-3">
        <button disabled={saving} className="bg-secondary rounded-md px-4 py-2">
          Save draft
        </button>
        <button
          disabled={saving}
          type="button"
          onClick={() => void save('published')}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2"
        >
          {saving ? 'Saving…' : 'Publish project'}
        </button>
      </div>
    </form>
  );
}
