---
name: add-project-case-study
description: Step-by-step procedure to add a new project case study to the portfolio, update project configurations, wire technology icons, create MDX case study files, and synchronize the AI chatbot assistant knowledge base.
---

# Add Project Case Study Procedure

Follow this runbook when the user asks to add, update, or feature a new software project or case study on their portfolio.

## Architecture Context

- **Project List Config:** `src/config/Projects.tsx` (exports `projects: Project[]`)
- **Project Type Definition:** `src/types/project.ts` (`Project`, `ProjectCaseStudyFrontmatter`)
- **MDX Case Studies Directory:** `src/data/projects/<slug>.mdx`
- **Technology SVGs:** `src/components/technologies/`
- **Chatbot Knowledge Sync:** `src/lib/chat-knowledge.ts`

---

## Step-by-Step Procedure

### 1. Gather Project Details

Confirm the following information from the user:

- **`title`**: Name of the project (e.g., "AI Code Assistant")
- **`slug`**: URL-safe identifier (e.g., `ai-code-assistant`)
- **`description`**: 1-2 sentence overview for preview cards
- **`technologies`**: List of tech used (e.g., Next.js, TypeScript, Python, Tailwind CSS)
- **`github`**: GitHub repository URL
- **`live`**: Live deployment URL (optional)
- **`image`**: Screenshot path in `public/project/<slug>.png` or `.svg`

### 2. Register Project in `src/config/Projects.tsx`

Add the new project entry into `export const projects: Project[] = [...]`.
Match technology icons with components from `src/components/technologies/`:

```tsx
import NextJs from '@/components/technologies/NextJs';
import Python from '@/components/technologies/Python';
import TailwindCss from '@/components/technologies/TailwindCss';
import TypeScript from '@/components/technologies/TypeScript';
import type { Project } from '@/types/project';

export const projects: Project[] = [
  {
    title: 'Project Title',
    slug: 'project-slug',
    description: 'One-sentence summary of the project.',
    image: '/project/project-slug.png',
    technologies: [
      { name: 'Next.js', href: 'https://nextjs.org', icon: <NextJs /> },
      {
        name: 'TypeScript',
        href: 'https://www.typescriptlang.org',
        icon: <TypeScript />,
      },
      { name: 'Python', href: 'https://www.python.org', icon: <Python /> },
      {
        name: 'Tailwind CSS',
        href: 'https://tailwindcss.com',
        icon: <TailwindCss />,
      },
    ],
    github: 'https://github.com/username/project-slug',
    live: 'https://project-slug.vercel.app', // or omit if no live link
  },
  // ... other projects
];
```

### 3. Create Case Study MDX (`src/data/projects/<slug>.mdx`)

Create `src/data/projects/<slug>.mdx` with valid frontmatter matching `ProjectCaseStudyFrontmatter`:

```mdx
---
title: 'Project Title'
description: 'In-depth overview and engineering architecture of Project Title.'
image: '/project/project-slug.png'
date: '2026-10-25'
technologies: ['Next.js', 'TypeScript', 'Python', 'Tailwind CSS']
github: 'https://github.com/username/project-slug'
live: 'https://project-slug.vercel.app'
---

## Overview

A comprehensive description of why this project was built, problems solved, and outcomes achieved.

## Architecture & Tech Stack

- **Frontend:** Next.js 15, Tailwind CSS
- **Backend / Core:** Python, FastAPI
- **Storage / DB:** PostgreSQL

## Key Challenges & Solutions

Highlight engineering decisions, algorithmic approaches, or performance optimizations.
```

### 4. Sync Chatbot Assistant Knowledge

Update `src/lib/chat-knowledge.ts` so the AI assistant accurately answers visitor queries regarding this project:

- Verify `getRelevantProjects()` includes relevant domain keywords.
- Check that `formatProject()` outputs clean Markdown links.

### 5. Verification

- Ensure `src/data/projects/<slug>.mdx` loads at `/projects/<slug>`.
- Verify that card previews display cleanly on `/projects` and `/` home landing page.
