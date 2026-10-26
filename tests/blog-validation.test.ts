import { describe, expect, it } from 'vitest';

import { BlogValidationError, sanitizeErrorMessage } from '@/lib/blog-errors';
import {
  calculateReadingTime,
  cmsBlogPostSchema,
  generateExcerpt,
  normalizeSlug,
  normalizeTags,
  stripMarkdown,
  validateCreatePostInput,
  validateUpdatePostInput,
} from '@/lib/blog-schema';
import { CmsBlogPost } from '@/types/blog';

describe('Blog Schema Validation & Normalization', () => {
  describe('normalizeSlug', () => {
    it('converts titles into lowercase kebab-case slugs', () => {
      expect(normalizeSlug('Hello World! 2026')).toBe('hello-world-2026');
      expect(normalizeSlug('  C++ STL Vector: Deep Dive & Patterns  ')).toBe(
        'c-stl-vector-deep-dive-patterns',
      );
      expect(normalizeSlug('multiple---dashes___and spaces')).toBe(
        'multiple-dashes-and-spaces',
      );
      expect(normalizeSlug('!@#$%^&*()_+')).toBe('');
    });
  });

  describe('stripMarkdown & generateExcerpt', () => {
    it('strips markdown syntax and returns plain text', () => {
      const md = `
# Main Header
This is **bold** text and *italic* text with a [link](https://example.com).
Here is an \`inline code\` snippet and a blockquote:
> Some important quote.
- Item 1
- Item 2
      `;
      const clean = stripMarkdown(md);
      expect(clean).not.toContain('#');
      expect(clean).not.toContain('**');
      expect(clean).not.toContain('*');
      expect(clean).not.toContain('`');
      expect(clean).not.toContain('[');
      expect(clean).toContain('bold text and italic text with a link');
    });

    it('generates a truncated excerpt on word boundaries', () => {
      const longText =
        'Next.js 15 introduces powerful App Router features along with React 19 server actions, improved caching defaults, and seamless static rendering options for modern high-performance web applications.';
      const excerpt = generateExcerpt(longText, 60);
      expect(excerpt.length).toBeLessThanOrEqual(63); // 60 + '...'
      expect(excerpt.endsWith('...')).toBe(true);
      expect(excerpt).not.toContain('  ');
    });

    it('returns short content as-is without ellipsis', () => {
      const short = 'Short summary.';
      expect(generateExcerpt(short, 100)).toBe('Short summary.');
    });
  });

  describe('calculateReadingTime', () => {
    it('calculates reading time correctly based on word count', () => {
      expect(calculateReadingTime('')).toBe('1 min read');
      const text100Words = Array(100).fill('word').join(' ');
      expect(calculateReadingTime(text100Words)).toBe('1 min read');

      const text450Words = Array(450).fill('word').join(' ');
      expect(calculateReadingTime(text450Words)).toBe('3 min read');
    });
  });

  describe('normalizeTags', () => {
    it('trims, lowercases, and deduplicates tags', () => {
      const raw = [' Next.js ', 'React', 'next.js', '', '  ', 'C++', 'c++'];
      expect(normalizeTags(raw)).toEqual(['next.js', 'react', 'c++']);
    });

    it('handles non-array inputs safely', () => {
      expect(normalizeTags(null)).toEqual([]);
      expect(normalizeTags(undefined)).toEqual([]);
      expect(normalizeTags('string' as unknown as string[])).toEqual([]);
    });
  });

  describe('validateCreatePostInput', () => {
    it('validates a complete, valid post creation payload', () => {
      const input = {
        title: 'Building Modern Next.js 15 Applications',
        content: '# Introduction\n\nThis is a deep dive into Next.js 15.',
        slug: 'building-modern-nextjs-15',
        tags: ['Next.js', 'TypeScript'],
        status: 'published',
        coverImage: 'https://example.com/cover.png',
        category: 'Web Development',
      };

      const result = validateCreatePostInput(input);
      expect(result.title).toBe('Building Modern Next.js 15 Applications');
      expect(result.slug).toBe('building-modern-nextjs-15');
      expect(result.status).toBe('published');
      expect(result.tags).toEqual(['next.js', 'typescript']);
    });

    it('defaults status to draft if not specified', () => {
      const input = {
        title: 'Draft Post Title',
        content: 'Draft content body.',
      };
      const result = validateCreatePostInput(input);
      expect(result.status).toBe('draft');
    });

    it('rejects empty or whitespace-only title', () => {
      expect(() =>
        validateCreatePostInput({
          title: '   ',
          content: 'Some content',
        }),
      ).toThrow(BlogValidationError);
    });

    it('rejects empty content', () => {
      expect(() =>
        validateCreatePostInput({
          title: 'Valid Title',
          content: '',
        }),
      ).toThrow(BlogValidationError);
    });

    it('rejects titles longer than 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() =>
        validateCreatePostInput({
          title: longTitle,
          content: 'Some content',
        }),
      ).toThrow(BlogValidationError);
    });
  });

  describe('validateUpdatePostInput', () => {
    it('accepts partial updates', () => {
      const result = validateUpdatePostInput({
        title: 'Updated Post Title',
      });
      expect(result.title).toBe('Updated Post Title');
      expect(result.content).toBeUndefined();
    });

    it('rejects empty title in update', () => {
      expect(() =>
        validateUpdatePostInput({
          title: '',
        }),
      ).toThrow(BlogValidationError);
    });
  });

  describe('cmsBlogPostSchema', () => {
    it('strictly validates a full CmsBlogPost database record', () => {
      const post: CmsBlogPost = {
        id: 'post-12345',
        title: 'Mastering Big O',
        slug: 'mastering-big-o',
        excerpt: 'An algorithmic breakdown',
        content: 'Full content here',
        coverImage: '/images/cover.jpg',
        tags: ['algorithms', 'c++'],
        status: 'published',
        createdAt: '2026-10-26T12:00:00.000Z',
        updatedAt: '2026-10-26T14:00:00.000Z',
        publishedAt: '2026-10-26T12:00:00.000Z',
        seoTitle: 'Mastering Big O in C++',
        seoDescription: 'Algorithmic efficiency deep dive',
        category: 'DSA',
        readingTime: '5 min read',
      };

      const parsed = cmsBlogPostSchema.parse(post);
      expect(parsed.id).toBe('post-12345');
      expect(parsed.status).toBe('published');
    });

    it('rejects invalid slug format with spaces or uppercase', () => {
      const invalid = {
        id: 'post-12345',
        title: 'Title',
        slug: 'Invalid Slug!',
        excerpt: 'Excerpt',
        content: 'Content',
        tags: [],
        status: 'draft',
        createdAt: '2026-10-26T12:00:00.000Z',
        updatedAt: '2026-10-26T14:00:00.000Z',
      };

      expect(() => cmsBlogPostSchema.parse(invalid)).toThrow();
    });

    it('rejects invalid ISO dates', () => {
      const invalid = {
        id: 'post-12345',
        title: 'Title',
        slug: 'valid-slug',
        excerpt: 'Excerpt',
        content: 'Content',
        tags: [],
        status: 'draft',
        createdAt: 'not-a-date',
        updatedAt: '2026-10-26T14:00:00.000Z',
      };

      expect(() => cmsBlogPostSchema.parse(invalid)).toThrow();
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('redacts Redis URLs and sensitive tokens', () => {
      const raw =
        'Error connecting to https://eu2-fresh-marten-1234.upstash.io with token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
      const clean = sanitizeErrorMessage(raw);
      expect(clean).not.toContain('upstash.io');
      expect(clean).not.toContain('eyJhbGci');
      expect(clean).toContain('[REDACTED_URL]');
    });
  });
});
