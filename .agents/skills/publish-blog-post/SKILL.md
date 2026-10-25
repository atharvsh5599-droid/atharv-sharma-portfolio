---
name: publish-blog-post
description: Standardized, beginner-friendly workflow to draft, format, validate, preview, and publish technical MDX blog articles in this portfolio.
---

# Publishing a Technical Blog Post

Follow this step-by-step procedure whenever you want to write and publish a new technical article or engineering note on Atharv Sharma's portfolio.

## Architecture Context

- **Articles Directory:** `src/data/blog/<slug>.mdx`
- **Article Types:** `src/types/blog.ts` (`BlogFrontmatter`, `BlogPost`, `BlogPostPreview`)
- **Content Engine:** `src/lib/blog.ts` (using `gray-matter` for frontmatter parsing and TOC extraction)
- **Image Assets:** `public/blog/<image-filename>.png`
- **Syntax Highlighting:** Shiki (`@shikijs/rehype`) with copy button in code blocks
- **Listing Page:** `/blog` with category filtering, search, and pagination
- **Article Page:** `/blog/[slug]` with Table of Contents and Prev/Next links

---

## Step-by-Step Publishing Workflow

### 1. Choose a Descriptive File Slug

Create a new file in `src/data/blog/<slug>.mdx`.
The slug should be lowercase and hyphen-separated (e.g., `modern-cpp-templates.mdx`, `graph-algorithms-guide.mdx`).

### 2. Define the Frontmatter Block

Every article must start with a valid YAML frontmatter block at the very top:

```mdx
---
title: 'A Practical Guide to Modern C++ Templates'
description: 'Understanding template metaprogramming, concepts, and type deduction in C++20.'
date: '2026-10-25'
category: 'C++'
tags: ['C++', 'Templates', 'Modern C++']
published: true
coverImage: '/blog/workspace.png'
---
```

#### Field Specifications:

- **`title`** _(string, required)_: The clear, engaging headline of the article.
- **`description`** _(string, required)_: 1-2 sentence summary displayed on cards and in SEO search snippets.
- **`date`** _(string, required)_: Publication date in `YYYY-MM-DD` format.
- **`category`** _(string, required)_: Must be one of the supported categories:
  - `DSA`
  - `C++`
  - `Web Development`
  - `AI/ML`
  - `Projects`
  - `Learning Notes`
- **`tags`** _(array of strings, required)_: 2 to 5 relevant technical tags (e.g., `['C++', 'STL']`).
- **`published`** _(boolean, required)_: Set to `true` to publish publicly, or `false` to keep it as a draft. Drafts are completely hidden from public listings and return 404 if accessed directly.
- **`coverImage`** _(string, optional)_: Image path starting with `/blog/` (e.g. `/blog/time.png`). If omitted, defaults to `/meta/blogs.png`.
- **`readTime`** _(string, optional)_: If omitted, the system automatically calculates reading time from word count (e.g., "5 min read").

### 3. Write Article Body

- **Headings:** Use `##` for major sections and `###` for sub-sections. The system automatically builds a Table of Contents for articles with 2+ headings!
- **Code Blocks:** Always include language tags for Shiki syntax highlighting:
  ````markdown
  ```cpp
  #include <vector>
  std::vector<int> numbers = {1, 2, 3};
  ```
  ````
- **Tables:** Standard markdown tables are automatically rendered with responsive horizontal scrolling.
- **Callout Quotes:** Use `> ...` for emphasis, notes, or tips.

### 4. Verification & Preview

1. Start the local development server:
   ```bash
   bun run dev
   # or
   npm run dev
   ```
2. Navigate to `http://localhost:3000/blog` to verify that your card appears with its title, cover image, category badge, date, and reading time.
3. Test search and category filtering to ensure the article is indexed correctly.
4. Click into the article (`/blog/<slug>`) to verify markdown headings, code block syntax highlighting, and table of contents.
