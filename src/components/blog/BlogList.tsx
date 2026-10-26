import { FileText } from 'lucide-react';

import { BlogPostPreview } from '@/types/blog';

import { BlogCard } from './BlogCard';

interface BlogListProps {
  posts: BlogPostPreview[];
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onClearFilters?: () => void;
}

export function BlogList({
  posts,
  className = '',
  emptyTitle = 'No blog articles found',
  emptyDescription = 'Try adjusting your search query or selecting a different category.',
  onClearFilters,
}: BlogListProps) {
  if (posts.length === 0) {
    return (
      <div className="border-border/60 rounded-xl border border-dashed px-6 py-16 text-center">
        <div className="bg-muted text-muted-foreground mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <FileText className="size-7" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">{emptyTitle}</h3>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
          {emptyDescription}
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-primary hover:text-primary/80 mt-4 inline-flex items-center text-sm font-medium underline underline-offset-4"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-2 ${className}`}>
      {posts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
