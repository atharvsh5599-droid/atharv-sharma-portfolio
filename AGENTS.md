# Workspace Rules & Guidelines for Antigravity Agents

## Project Overview

This repository contains the personal portfolio website for **Atharv Sharma** (B.Tech in Computer Science Engineering AI/ML, expected graduation 2029).

### Core Stack

- **Framework:** Next.js 15 (App Router, Turbopack, React 19)
- **Styling:** Tailwind CSS v4, Motion (`motion`), Radix UI primitives
- **Content:** MDX via `gray-matter` and `@next/mdx` / `next-mdx-remote`
- **AI Chat Assistant:** Server-side route calling Google Gemini Flash API (`/api/chat`)
- **Package Manager:** Bun (`bun.lock` / `bun.lockb`) or npm

---

## Agent Guidelines & Rules

### 1. Source of Truth & Factual Integrity

- Treat files in `src/config/` as the single source of truth for all personal information, education, skills, projects, and work experience.
- **NEVER hallucinate or fabricate** projects, repositories, job titles, awards, or degrees.
- When adding or updating projects or experience, **always synchronize** `src/lib/chat-knowledge.ts` and `src/config/ChatPrompt.ts` so the built-in AI assistant answers visitors with 100% accuracy.

### 2. TypeScript & Component Standards

- Strict typing: Avoid `any` types. Define interfaces in `src/types/` (e.g., `src/types/project.ts`, `src/types/blog.ts`).
- Use the `cn()` utility (`src/lib/utils.ts`) for conditional Tailwind CSS classes.
- Keep client components marked with `'use client'` only when they use React hooks or browser APIs.
- When adding technology badges, check for existing SVG components in `src/components/technologies/` before creating new ones.

### 3. MDX Content Standards

- All MDX files in `src/data/blog/*.mdx` and `src/data/projects/*.mdx` must begin with valid YAML frontmatter matching their TypeScript definitions.
- Code blocks must specify language tags (e.g., ``tsx`, ``python`, ````cpp`) to enable Shiki syntax highlighting.

### 4. Code Quality & Formatting

- Always format modified files with Prettier (`.prettierrc`) to maintain consistent Tailwind class ordering and import sorting.
- Run Knip (`bun run knip`) periodically to catch unused files, exports, or dead dependencies.
