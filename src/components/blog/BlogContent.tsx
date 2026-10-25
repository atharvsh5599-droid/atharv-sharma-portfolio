import rehypeHighlight from '@shikijs/rehype';
import { AlignLeft, Clock } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BlogFrontmatter, TableOfContentsItem } from '@/types/blog';

import Calender from '../svgs/Calender';
import { BlogComponents } from './BlogComponents';

interface BlogContentProps {
  frontmatter: BlogFrontmatter;
  content: string;
  readingTime?: string;
  toc?: TableOfContentsItem[];
}

export function BlogContent({
  frontmatter,
  content,
  readingTime,
  toc = [],
}: BlogContentProps) {
  const { title, description, coverImage, image, tags, date, category } =
    frontmatter;
  const displayImage = coverImage || image || '/meta/blogs.png';

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="mx-auto max-w-3xl">
      {/* Header */}
      <header className="mb-10 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <Badge className="bg-primary text-primary-foreground px-3 py-1 font-semibold">
              {category}
            </Badge>
          )}
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        <h1 className="text-foreground text-3xl leading-[1.15] font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        <p className="text-muted-foreground text-lg leading-relaxed sm:text-xl">
          {description}
        </p>

        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs sm:text-sm">
          <span className="flex items-center gap-1.5">
            <Calender className="size-4" />
            <time dateTime={date}>{formattedDate}</time>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            <span>{readingTime || '5 min read'}</span>
          </span>
        </div>

        {displayImage && (
          <div className="border-border/80 bg-muted relative aspect-video w-full overflow-hidden rounded-xl border shadow-sm">
            <Image
              src={displayImage}
              alt={title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 800px) 100vw, 800px"
            />
          </div>
        )}

        <Separator />
      </header>

      {/* Table of Contents for longer articles */}
      {toc.length >= 2 && (
        <aside
          className="bg-muted/30 border-border/70 my-8 rounded-xl border p-5 sm:p-6"
          aria-label="Table of contents"
        >
          <div className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlignLeft className="text-primary size-4" />
            <span>Table of Contents</span>
          </div>
          <nav>
            <ul className="space-y-2 text-sm">
              {toc.map((item) => (
                <li
                  key={item.id}
                  className={
                    item.level === 3
                      ? 'text-muted-foreground ml-4 list-disc text-xs'
                      : 'font-medium'
                  }
                >
                  <a
                    href={`#${item.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors hover:underline"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}

      {/* Article Markdown Body */}
      <div className="prose prose-neutral dark:prose-invert text-foreground/90 max-w-none">
        <MDXRemote
          source={content}
          components={BlogComponents}
          options={{
            mdxOptions: {
              rehypePlugins: [
                [
                  rehypeHighlight,
                  {
                    theme: 'github-dark',
                  },
                ],
              ],
            },
          }}
        />
      </div>
    </article>
  );
}
