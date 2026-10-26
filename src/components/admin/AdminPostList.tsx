'use client';

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'next-view-transitions';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CmsBlogPost } from '@/types/blog';

interface AdminPostListProps {
  initialPosts: CmsBlogPost[];
}

export function AdminPostList({ initialPosts }: AdminPostListProps) {
  const [posts, setPosts] = useState<CmsBlogPost[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'published' | 'draft'
  >('all');
  const [postToDelete, setPostToDelete] = useState<CmsBlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Compute counts
  const totalCount = posts.length;
  const publishedCount = useMemo(
    () => posts.filter((p) => p.status === 'published').length,
    [posts],
  );
  const draftCount = totalCount - publishedCount;

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Status filter
      if (selectedStatus !== 'all' && post.status !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = post.title.toLowerCase().includes(q);
        const slugMatch = post.slug.toLowerCase().includes(q);
        const tagMatch = post.tags.some((t) => t.toLowerCase().includes(q));
        const catMatch = (post.category || '').toLowerCase().includes(q);
        if (!titleMatch && !slugMatch && !tagMatch && !catMatch) {
          return false;
        }
      }

      return true;
    });
  }, [posts, selectedStatus, searchQuery]);

  // Handle quick toggle publish/unpublish
  const handleTogglePublish = async (post: CmsBlogPost) => {
    const isCurrentlyPublished = post.status === 'published';
    const endpoint = `/api/admin/blog/${post.id}/${
      isCurrentlyPublished ? 'unpublish' : 'publish'
    }`;
    setTogglingId(post.id);

    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update post status.');
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? (data.post as CmsBlogPost) : p)),
      );

      toast.success(
        isCurrentlyPublished
          ? `"${post.title}" moved to drafts.`
          : `"${post.title}" is now published publicly!`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Action failed. Please retry.',
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/blog/${postToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete post.');
      }

      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      toast.success(`"${postToDelete.title}" deleted permanently.`);
      setPostToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not delete post.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8">
      {/* Metrics Summary Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium tracking-wider uppercase">
              Total Articles
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground p-4 pt-0 text-xs">
            Stored in Upstash Redis database
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium tracking-wider uppercase">
              Published Live
            </CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {publishedCount}
              <CheckCircle2 className="size-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground p-4 pt-0 text-xs">
            Visible to public visitors on /blog
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium tracking-wider uppercase">
              Drafts in Progress
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {draftCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground p-4 pt-0 text-xs">
            Private and hidden from public endpoints
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search posts by title, slug, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/80 pr-9 pl-9 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 p-1"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <Tabs
            value={selectedStatus}
            onValueChange={(val) =>
              setSelectedStatus(val as 'all' | 'published' | 'draft')
            }
          >
            <TabsList className="bg-muted/60">
              <TabsTrigger value="all" className="text-xs">
                All ({totalCount})
              </TabsTrigger>
              <TabsTrigger value="published" className="text-xs">
                Published ({publishedCount})
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs">
                Drafts ({draftCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Button asChild className="gap-2 rounded-xl shadow-xs">
          <Link href="/admin/blog/new">
            <Plus className="size-4" />
            <span>Create Article</span>
          </Link>
        </Button>
      </div>

      {/* Posts Table */}
      <div className="border-border/60 bg-card/60 overflow-hidden rounded-xl border shadow-sm">
        {filteredPosts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="bg-muted text-muted-foreground mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
              <FileText className="size-6" />
            </div>
            <h3 className="text-foreground text-base font-semibold">
              {searchQuery || selectedStatus !== 'all'
                ? 'No matching articles'
                : 'No articles published yet'}
            </h3>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
              {searchQuery || selectedStatus !== 'all'
                ? 'Try adjusting your search keywords or switching status filters.'
                : 'Create your first post with the Markdown editor to start publishing.'}
            </p>
            {searchQuery || selectedStatus !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                }}
                className="mt-4 text-xs"
              >
                Reset Filters
              </Button>
            ) : (
              <Button asChild size="sm" className="mt-4 gap-1.5 text-xs">
                <Link href="/admin/blog/new">
                  <Plus className="size-3.5" />
                  <span>Create First Post</span>
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="w-[45%]">Article</TableHead>
                  <TableHead className="w-[12%]">Status</TableHead>
                  <TableHead className="w-[18%]">Tags</TableHead>
                  <TableHead className="w-[13%]">Updated</TableHead>
                  <TableHead className="w-[12%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => {
                  const isPublished = post.status === 'published';
                  const isToggling = togglingId === post.id;

                  return (
                    <TableRow
                      key={post.id}
                      className="border-border/60 hover:bg-muted/40 transition-colors"
                    >
                      {/* Title & Slug */}
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/blog/${post.id}/edit`}
                              className="text-foreground hover:text-primary line-clamp-1 font-semibold transition-colors"
                            >
                              {post.title}
                            </Link>
                            {post.category && (
                              <Badge
                                variant="outline"
                                className="border-border/70 text-[10px] font-normal"
                              >
                                {post.category}
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
                            <span className="truncate">/{post.slug}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-sans text-[11px]">
                              <Clock className="size-3" />
                              {post.readingTime || '1 min read'}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-top">
                        {isPublished ? (
                          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
                            <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500"></span>
                            Published
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="border-amber-500/20 bg-amber-500/10 text-xs font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                          >
                            <span className="mr-1.5 size-1.5 rounded-full bg-amber-500"></span>
                            Draft
                          </Badge>
                        )}
                      </TableCell>

                      {/* Tags */}
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-1">
                          {post.tags && post.tags.length > 0 ? (
                            post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px]"
                              >
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground/60 text-xs italic">
                              No tags
                            </span>
                          )}
                          {post.tags && post.tags.length > 3 && (
                            <span className="text-muted-foreground text-[10px]">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Dates */}
                      <TableCell className="text-muted-foreground align-top text-xs">
                        <div className="space-y-0.5">
                          <div className="text-foreground flex items-center gap-1 font-medium">
                            <Calendar className="size-3" />
                            <span>{formatDate(post.updatedAt)}</span>
                          </div>
                          {post.publishedAt && (
                            <div className="text-[11px] opacity-80">
                              Published: {formatDate(post.publishedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right align-top">
                        <div className="flex items-center justify-end gap-1">
                          {/* Admin Preview link (both drafts and published) */}
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="size-8"
                            title={
                              isPublished ? 'Preview layout' : 'Preview draft'
                            }
                          >
                            <Link href={`/admin/blog/${post.id}/preview`}>
                              <Eye className="text-muted-foreground hover:text-foreground size-3.5" />
                            </Link>
                          </Button>

                          {/* Public View link (published only) */}
                          {isPublished && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="size-8"
                              title="View public live article"
                            >
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            </Button>
                          )}

                          {/* Quick publish / unpublish toggle */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePublish(post)}
                            disabled={isToggling}
                            className="size-8"
                            title={
                              isPublished
                                ? 'Unpublish (revert to draft)'
                                : 'Publish article publicly'
                            }
                          >
                            {isToggling ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : isPublished ? (
                              <EyeOff className="text-muted-foreground size-3.5 hover:text-amber-500" />
                            ) : (
                              <Eye className="text-muted-foreground size-3.5 hover:text-emerald-500" />
                            )}
                          </Button>

                          {/* Edit button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="size-8"
                            title="Edit post"
                          >
                            <Link href={`/admin/blog/${post.id}/edit`}>
                              <Edit className="size-3.5" />
                            </Link>
                          </Button>

                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPostToDelete(post)}
                            className="text-muted-foreground hover:text-destructive size-8"
                            title="Delete post"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={postToDelete !== null}
        onOpenChange={(open) => !open && setPostToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="size-5" />
              <span>Delete Blog Post</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-foreground">
                  &ldquo;{postToDelete?.title}&rdquo;
                </strong>
                ?
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                This action is irreversible. The article record and its slug (
                <code className="text-foreground font-mono">
                  /{postToDelete?.slug}
                </code>
                ) will be removed from Upstash Redis immediately.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
