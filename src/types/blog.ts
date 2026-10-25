export type BlogCategory =
  'DSA' | 'C++' | 'Web Development' | 'AI/ML' | 'Projects' | 'Learning Notes';

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  category?: BlogCategory | string;
  tags: string[];
  published?: boolean;
  isPublished?: boolean; // backwards compatibility
  coverImage?: string;
  image?: string; // backwards compatibility
  readTime?: string;
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
  readingTime: string;
  toc?: TableOfContentsItem[];
  prevPost?: BlogPostPreview | null;
  nextPost?: BlogPostPreview | null;
}

export interface BlogPostPreview {
  slug: string;
  frontmatter: BlogFrontmatter;
  readingTime: string;
}
