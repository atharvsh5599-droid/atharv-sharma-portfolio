import { Clock } from 'lucide-react';
import { Link } from 'next-view-transitions';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { BlogPostPreview } from '@/types/blog';

import ArrowRight from '../svgs/ArrowRight';
import Calender from '../svgs/Calender';
import { SafeBlogImage } from './SafeBlogImage';

interface BlogCardProps {
  post: BlogPostPreview;
}

export function BlogCard({ post }: BlogCardProps) {
  const { slug, frontmatter, readingTime } = post;
  const { title, description, coverImage, image, tags, date, category } =
    frontmatter || {};
  const displayImage = coverImage || image || '/meta/blogs.png';

  const parsedDate = date ? new Date(date) : null;
  const formattedDate =
    parsedDate && !isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Recent';

  return (
    <Card className="group border-border/60 bg-card hover:border-foreground/30 flex h-full flex-col overflow-hidden rounded-xl border p-0 shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="p-0">
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          <Link href={`/blog/${slug}`} tabIndex={-1} aria-hidden="true">
            <SafeBlogImage
              src={displayImage}
              alt={title || 'Blog article cover'}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </Link>
          {category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-background/90 text-foreground hover:bg-background font-semibold shadow-xs backdrop-blur-sm">
                {category}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-5">
        <div className="text-muted-foreground mb-3 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <Calender className="size-3.5" />
            <time dateTime={date || undefined}>{formattedDate}</time>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            <span>{readingTime || '4 min read'}</span>
          </span>
        </div>

        <Link
          href={`/blog/${slug}`}
          className="group-hover:text-primary transition-colors"
        >
          <h3 className="text-card-foreground line-clamp-2 text-xl font-bold tracking-tight">
            {title || 'Untitled Article'}
          </h3>
        </Link>

        {description && (
          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">
            {description}
          </p>
        )}

        {tags && tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 pt-2">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-2 py-0.5 text-[11px] font-normal"
              >
                #{tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <span className="text-muted-foreground self-center text-xs">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-border/40 mt-auto border-t p-5 pt-0">
        <Link
          href={`/blog/${slug}`}
          className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 pt-3 text-sm font-medium transition-colors"
        >
          Read Article{' '}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}
