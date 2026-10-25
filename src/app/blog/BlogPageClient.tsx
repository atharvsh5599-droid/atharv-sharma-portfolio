'use client';

import { BookOpen, Filter, Search, Sparkles, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { BlogList } from '@/components/blog/BlogList';
import Container from '@/components/common/Container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { BlogPostPreview } from '@/types/blog';

const STANDARD_CATEGORIES = [
  'All',
  'DSA',
  'C++',
  'Web Development',
  'AI/ML',
  'Projects',
  'Learning Notes',
] as const;

const POSTS_PER_PAGE = 6;

interface BlogPageClientProps {
  initialPosts: BlogPostPreview[];
  initialTags: string[];
}

export function BlogPageClient({
  initialPosts,
  initialTags,
}: BlogPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { triggerHaptic, isMobile } = useHapticFeedback();

  // Read initial filters from URL or default
  const categoryParam = searchParams.get('category');
  const tagParam = searchParams.get('tag');
  const searchParam = searchParams.get('q');

  const [searchQuery, setSearchQuery] = useState(searchParam || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryParam || 'All',
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(tagParam);
  const [visibleCount, setVisibleCount] = useState<number>(POSTS_PER_PAGE);

  // Filter posts based on search query, selected category, and selected tag
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      // Category filter
      if (selectedCategory !== 'All') {
        const postCat = (
          post.frontmatter.category || 'Learning Notes'
        ).toLowerCase();
        if (postCat !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Tag filter
      if (selectedTag) {
        const hasTag = post.frontmatter.tags.some(
          (t) => t.toLowerCase() === selectedTag.toLowerCase(),
        );
        if (!hasTag) {
          return false;
        }
      }

      // Search query filter (title, description, tags, category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = post.frontmatter.title.toLowerCase().includes(q);
        const descMatch = post.frontmatter.description
          .toLowerCase()
          .includes(q);
        const tagMatch = post.frontmatter.tags.some((t) =>
          t.toLowerCase().includes(q),
        );
        const catMatch = (post.frontmatter.category || '')
          .toLowerCase()
          .includes(q);

        if (!titleMatch && !descMatch && !tagMatch && !catMatch) {
          return false;
        }
      }

      return true;
    });
  }, [initialPosts, selectedCategory, selectedTag, searchQuery]);

  // Paginated slice
  const displayedPosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  const hasMore = visibleCount < filteredPosts.length;

  const updateUrl = (cat: string, tag: string | null, query: string) => {
    const params = new URLSearchParams();
    if (cat !== 'All') params.set('category', cat);
    if (tag) params.set('tag', tag);
    if (query.trim()) params.set('q', query.trim());

    const qs = params.toString();
    router.replace(qs ? `/blog?${qs}` : '/blog');
  };

  const handleCategorySelect = (category: string) => {
    if (isMobile()) triggerHaptic('light');
    setSelectedCategory(category);
    setVisibleCount(POSTS_PER_PAGE);
    updateUrl(category, selectedTag, searchQuery);
  };

  const handleTagSelect = (tag: string) => {
    if (isMobile()) triggerHaptic('light');
    const newTag = selectedTag === tag ? null : tag;
    setSelectedTag(newTag);
    setVisibleCount(POSTS_PER_PAGE);
    updateUrl(selectedCategory, newTag, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setVisibleCount(POSTS_PER_PAGE);
    updateUrl(selectedCategory, selectedTag, val);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTag(null);
    setVisibleCount(POSTS_PER_PAGE);
    router.replace('/blog');
  };

  // Category counts
  const getCategoryCount = (category: string) => {
    if (category === 'All') return initialPosts.length;
    return initialPosts.filter(
      (p) =>
        (p.frontmatter.category || 'Learning Notes').toLowerCase() ===
        category.toLowerCase(),
    ).length;
  };

  const isFiltered =
    selectedCategory !== 'All' ||
    selectedTag !== null ||
    searchQuery.trim().length > 0;

  return (
    <Container className="py-16">
      <div className="space-y-10">
        {/* Editorial Hero Section */}
        <div className="border-border/60 from-muted/40 via-background to-background relative overflow-hidden rounded-2xl border bg-gradient-to-b p-8 text-center md:p-12">
          <div className="border-border/80 bg-background/80 text-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <BookOpen className="text-primary size-3.5" />
            <span>Technical Articles & Field Notes</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Engineering Insights & Notebook
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            Hands-on tutorials, design patterns, C++ deep dives, Data Structures
            & Algorithms, and modern web development lessons.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-lg">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search articles by title, topic, or tag..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-background/90 border-border/80 focus-visible:ring-primary h-11 rounded-xl pr-10 pl-10 text-sm shadow-xs"
                aria-label="Search articles"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    updateUrl(selectedCategory, selectedTag, '');
                  }}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <Filter className="text-primary size-4" />
              <span>Filter by Topic</span>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-4"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {STANDARD_CATEGORIES.map((cat) => {
              const count = getCategoryCount(cat);
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className="transition-all"
                >
                  <Badge
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                    <span className="ml-1.5 opacity-70">({count})</span>
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular Tags */}
        {initialTags.length > 0 && (
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Sparkles className="size-3.5" />
              <span>Filter by Tag:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {initialTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagSelect(tag)}
                    className="transition-all"
                  >
                    <Badge
                      variant={isSelected ? 'secondary' : 'outline'}
                      className={`cursor-pointer rounded-md px-2 py-0.5 text-[11px] ${
                        isSelected
                          ? 'border-primary/50 text-foreground bg-muted font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      #{tag}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Results Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              {selectedCategory !== 'All'
                ? `${selectedCategory} Articles`
                : 'All Articles'}
              {selectedTag && ` tagged #${selectedTag}`}
            </h2>
            <span className="text-muted-foreground text-xs sm:text-sm">
              Showing {displayedPosts.length} of {filteredPosts.length} post
              {filteredPosts.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Blog Cards List */}
          <BlogList
            posts={displayedPosts}
            onClearFilters={isFiltered ? handleClearFilters : undefined}
          />

          {/* Load More Pagination Button */}
          {hasMore && (
            <div className="mt-12 flex justify-center pt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
                className="rounded-xl px-8"
              >
                Load More Articles ({filteredPosts.length - visibleCount}{' '}
                remaining)
              </Button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
