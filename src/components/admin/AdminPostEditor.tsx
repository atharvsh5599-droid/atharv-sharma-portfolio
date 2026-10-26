'use client';

import {
  AlertCircle,
  ArrowLeft,
  Bold,
  ChevronDown,
  ChevronUp,
  Clock,
  Code,
  Eye,
  FileCode,
  FileText,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Save,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  calculateReadingTime,
  generateExcerpt,
  normalizeSlug,
} from '@/lib/blog-schema';
import { BlogPostStatus, CmsBlogPost } from '@/types/blog';

const PRESET_CATEGORIES = [
  'DSA',
  'C++',
  'Web Development',
  'AI/ML',
  'Projects',
  'Learning Notes',
] as const;

interface AdminPostEditorProps {
  mode: 'create' | 'edit';
  initialPost?: CmsBlogPost;
}

export function AdminPostEditor({ mode, initialPost }: AdminPostEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form states
  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [category, setCategory] = useState<string>(
    initialPost?.category || 'Learning Notes',
  );
  const [customCategory, setCustomCategory] = useState('');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || '');
  const [tags, setTags] = useState<string[]>(initialPost?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<BlogPostStatus>(
    initialPost?.status || 'draft',
  );
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(
    initialPost?.seoDescription || '',
  );

  // UI state
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>(
    'split',
  );
  const [showSeo, setShowSeo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Track initial state to detect unsaved changes
  const initialState = useMemo(
    () => ({
      title: initialPost?.title || '',
      slug: initialPost?.slug || '',
      category: initialPost?.category || 'Learning Notes',
      excerpt: initialPost?.excerpt || '',
      content: initialPost?.content || '',
      coverImage: initialPost?.coverImage || '',
      tags: initialPost?.tags || [],
      status: initialPost?.status || 'draft',
      seoTitle: initialPost?.seoTitle || '',
      seoDescription: initialPost?.seoDescription || '',
    }),
    [initialPost],
  );

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return (
      title !== initialState.title ||
      slug !== initialState.slug ||
      category !== initialState.category ||
      excerpt !== initialState.excerpt ||
      content !== initialState.content ||
      coverImage !== initialState.coverImage ||
      tags.join(',') !== initialState.tags.join(',') ||
      status !== initialState.status ||
      seoTitle !== initialState.seoTitle ||
      seoDescription !== initialState.seoDescription
    );
  }, [
    title,
    slug,
    category,
    excerpt,
    content,
    coverImage,
    tags,
    status,
    seoTitle,
    seoDescription,
    initialState,
  ]);

  // Warn on browser tab close when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Live metrics
  const wordCount = useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readingTime = useMemo(() => {
    return calculateReadingTime(content);
  }, [content]);

  // Auto-generate slug from title if slug has not been manually customized
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (validationErrors.title) {
      setValidationErrors((prev) => ({ ...prev, title: '' }));
    }

    if (mode === 'create' && (!slug || slug === normalizeSlug(title))) {
      setSlug(normalizeSlug(newTitle));
    }
  };

  // Add tag
  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Auto-generate excerpt
  const handleAutoExcerpt = () => {
    if (!content.trim()) {
      toast.error('Add some article content before generating an excerpt.');
      return;
    }
    const generated = generateExcerpt(content, 180);
    setExcerpt(generated);
    toast.success('Excerpt generated from content.');
  };

  // Markdown formatting tool helper
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4),
      );
    }, 10);
  };

  // Form submission (Save Draft or Publish)
  const handleSubmit = async (targetStatus?: BlogPostStatus) => {
    // Basic validation
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Title cannot be empty.';
    if (!content.trim()) errors.content = 'Article content cannot be empty.';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please resolve the required fields before saving.');
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    const chosenStatus = targetStatus || status;
    const finalSlug = slug.trim() ? normalizeSlug(slug) : normalizeSlug(title);
    const finalCategory =
      category === 'Other' && customCategory.trim()
        ? customCategory.trim()
        : category;

    const payload = {
      title: title.trim(),
      slug: finalSlug,
      category: finalCategory,
      excerpt: excerpt.trim() || undefined,
      content,
      coverImage: coverImage.trim() || undefined,
      tags,
      status: chosenStatus,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
    };

    try {
      const endpoint =
        mode === 'create'
          ? '/api/admin/blog'
          : `/api/admin/blog/${initialPost?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 409) {
          throw new Error(
            `The slug "/${finalSlug}" is already in use by another article. Please change the slug.`,
          );
        }
        if (data.issues) {
          const issueMsg = data.issues
            .map(
              (i: { path: string; message: string }) =>
                `${i.path}: ${i.message}`,
            )
            .join(', ');
          throw new Error(`Validation failed: ${issueMsg}`);
        }
        throw new Error(data.error || 'Failed to save article.');
      }

      toast.success(
        chosenStatus === 'published'
          ? 'Article published live!'
          : 'Article draft saved successfully.',
      );

      // Navigate back to admin post list
      router.push('/admin/blog');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'An error occurred.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete article (edit mode)
  const handleDelete = async () => {
    if (!initialPost) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/blog/${initialPost.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete article.');
      }

      toast.success(`"${initialPost.title}" deleted.`);
      router.push('/admin/blog');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Deletion failed.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Cancel action
  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      router.push('/admin/blog');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-muted-foreground hover:text-foreground w-fit gap-1.5"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Articles</span>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          <Badge
            variant={status === 'published' ? 'default' : 'secondary'}
            className={
              status === 'published'
                ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            }
          >
            {status === 'published' ? 'Ready to Publish' : 'Draft'}
          </Badge>

          {/* Delete (Edit mode) */}
          {mode === 'edit' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-muted-foreground hover:text-destructive gap-1.5"
              disabled={isSubmitting}
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}

          {/* Full-Fidelity Preview (Edit mode) */}
          {mode === 'edit' && initialPost && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5"
              title="Open full page preview"
            >
              <a
                href={`/admin/blog/${initialPost.id}/preview`}
                target="_blank"
                rel="noreferrer"
              >
                <Eye className="size-3.5" />
                <span className="hidden sm:inline">Preview Page</span>
              </a>
            </Button>
          )}

          {/* Save Draft Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <Save className="size-3.5" />
            <span>Save Draft</span>
          </Button>

          {/* Publish Action */}
          <Button
            size="sm"
            onClick={() => handleSubmit('published')}
            disabled={isSubmitting}
            className="gap-1.5 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
          >
            <Send className="size-3.5" />
            <span>
              {isSubmitting
                ? 'Publishing...'
                : mode === 'edit' && initialPost?.status === 'published'
                  ? 'Update Published'
                  : 'Publish Live'}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Columns: Title, Markdown Editor & Rendered Preview */}
        <div className="space-y-6 lg:col-span-2">
          {/* Article Title Input */}
          <div className="space-y-2">
            <Label htmlFor="post-title" className="text-sm font-semibold">
              Article Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="post-title"
              type="text"
              placeholder="e.g. Demystifying std::vector in C++: Memory, Growth, and Pitfalls"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-foreground placeholder:text-muted-foreground/60 h-12 text-lg font-bold"
            />
            {validationErrors.title && (
              <p className="text-destructive flex items-center gap-1 text-xs">
                <AlertCircle className="size-3.5" />
                {validationErrors.title}
              </p>
            )}
          </div>

          {/* Markdown Writing Toolbar & Tabs */}
          <div className="border-border/60 bg-card/60 overflow-hidden rounded-xl border shadow-xs">
            <div className="border-border/60 bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-b p-2">
              {/* Formatting Quick Tools */}
              <div className="flex flex-wrap items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => insertFormatting('## ', '\n')}
                  title="Heading 2 (##)"
                >
                  <Heading2 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => insertFormatting('### ', '\n')}
                  title="Heading 3 (###)"
                >
                  <Heading3 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => insertFormatting('**', '**')}
                  title="Bold (**text**)"
                >
                  <Bold className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => insertFormatting('*', '*')}
                  title="Italic (*text*)"
                >
                  <Italic className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => insertFormatting('`', '`')}
                  title="Inline code (`code`)"
                >
                  <Code className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    insertFormatting('```cpp\n// write code here\n', '\n```\n')
                  }
                  title="Code Block (```cpp)"
                >
                  <FileCode className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => insertFormatting('> ', '\n')}
                  title="Quote (> blockquote)"
                >
                  <Quote className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => insertFormatting('- ', '\n')}
                  title="Bullet list (- item)"
                >
                  <List className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => insertFormatting('1. ', '\n')}
                  title="Numbered list (1. item)"
                >
                  <ListOrdered className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    insertFormatting('[', '](https://example.com)')
                  }
                  title="Link ([text](url))"
                >
                  <LinkIcon className="size-4" />
                </Button>
              </div>

              {/* View Mode Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(val) =>
                  setActiveTab(val as 'write' | 'preview' | 'split')
                }
              >
                <TabsList className="bg-background/80 h-8">
                  <TabsTrigger value="write" className="px-2.5 text-xs">
                    Write
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="px-2.5 text-xs">
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="split"
                    className="hidden px-2.5 text-xs lg:inline-flex"
                  >
                    Split
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Editor & Preview Panes */}
            <div className="grid min-h-[550px] divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {/* Write Textarea */}
              {(activeTab === 'write' || activeTab === 'split') && (
                <div
                  className={`relative flex flex-col ${
                    activeTab === 'split' ? '' : 'lg:col-span-2'
                  }`}
                >
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (validationErrors.content) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          content: '',
                        }));
                      }
                    }}
                    placeholder="Write article content using Markdown syntax...

## Getting Started
Explain your concept, share code samples, or provide a tutorial."
                    className="text-foreground placeholder:text-muted-foreground/50 h-full min-h-[550px] w-full resize-none bg-transparent p-5 font-mono text-sm leading-relaxed focus:outline-hidden"
                  />
                  {validationErrors.content && (
                    <div className="bg-destructive/10 border-destructive/30 border-t p-3">
                      <p className="text-destructive flex items-center gap-1.5 text-xs">
                        <AlertCircle className="size-4" />
                        {validationErrors.content}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Rendered Markdown Preview */}
              {(activeTab === 'preview' || activeTab === 'split') && (
                <div
                  className={`bg-muted/10 h-full min-h-[550px] overflow-y-auto p-6 ${
                    activeTab === 'split' ? '' : 'lg:col-span-2'
                  }`}
                >
                  {content.trim() ? (
                    <article className="prose prose-neutral dark:prose-invert max-w-none text-sm">
                      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                    </article>
                  ) : (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                      <FileText className="text-muted-foreground/40 mb-2 size-8" />
                      <p className="text-muted-foreground text-xs italic">
                        Type Markdown in the editor to see rendered preview
                        here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Metadata Bar */}
            <div className="border-border/60 bg-muted/30 text-muted-foreground flex flex-wrap items-center justify-between border-t px-4 py-2 text-xs">
              <div className="flex items-center gap-4">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{content.length} characters</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {readingTime}
                </span>
              </div>
              <div className="text-[11px] font-medium">Markdown Supported</div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Metadata, Cover Image, Tags, Category & SEO */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold">
                Post Metadata
              </CardTitle>
              <CardDescription className="text-xs">
                Configure taxonomy, slug and cover image.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-5 pt-2">
              {/* Slug Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="post-slug" className="text-xs font-semibold">
                    URL Slug
                  </Label>
                  <button
                    type="button"
                    onClick={() => setSlug(normalizeSlug(title))}
                    className="text-primary text-[11px] hover:underline"
                  >
                    Generate from title
                  </button>
                </div>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs">
                    /blog/
                  </span>
                  <Input
                    id="post-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                    placeholder="my-article-slug"
                    className="pl-14 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="post-category"
                  className="text-xs font-semibold"
                >
                  Topic Category
                </Label>
                <Select
                  value={
                    (PRESET_CATEGORIES as readonly string[]).includes(category)
                      ? category
                      : 'Other'
                  }
                  onValueChange={(val) => {
                    setCategory(val);
                    if (val !== 'Other') setCustomCategory('');
                  }}
                >
                  <SelectTrigger id="post-category" className="text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other" className="text-xs">
                      Custom Category...
                    </SelectItem>
                  </SelectContent>
                </Select>

                {category === 'Other' && (
                  <Input
                    type="text"
                    placeholder="Enter custom category name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="mt-2 text-xs"
                  />
                )}
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1.5">
                <Label htmlFor="post-cover" className="text-xs font-semibold">
                  Cover Image URL
                </Label>
                <Input
                  id="post-cover"
                  type="text"
                  placeholder="e.g. /blog/workspace.png or https://..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="text-xs"
                />
                {coverImage && (
                  <div className="border-border/60 bg-muted relative mt-2 aspect-video w-full overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Tags Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tags</Label>
                <div className="flex gap-1.5">
                  <Input
                    type="text"
                    placeholder="Type tag & press enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    className="text-xs"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1 text-xs"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Excerpt Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="post-excerpt"
                    className="text-xs font-semibold"
                  >
                    Article Summary / Excerpt
                  </Label>
                  <button
                    type="button"
                    onClick={handleAutoExcerpt}
                    className="text-primary flex items-center gap-1 text-[11px] hover:underline"
                  >
                    <Sparkles className="size-3" />
                    Auto-generate
                  </button>
                </div>
                <Textarea
                  id="post-excerpt"
                  placeholder="1-2 sentences summarizing the article for cards and SEO snippets..."
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="text-xs leading-relaxed"
                />
              </div>

              {/* Status Switch */}
              <div className="border-border/60 bg-muted/40 flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="post-status-toggle"
                    className="cursor-pointer text-xs font-semibold"
                  >
                    Public Visibility
                  </Label>
                  <p className="text-muted-foreground text-[11px]">
                    {status === 'published'
                      ? 'Live on /blog for all visitors'
                      : 'Draft — hidden from public views'}
                  </p>
                </div>
                <Switch
                  id="post-status-toggle"
                  checked={status === 'published'}
                  onCheckedChange={(checked) =>
                    setStatus(checked ? 'published' : 'draft')
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Metadata Accordion Card */}
          <Card className="border-border/60 bg-card/60">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <div>
                <h4 className="text-sm font-semibold">SEO & Social Sharing</h4>
                <p className="text-muted-foreground text-xs">
                  Optional custom search engine title & description.
                </p>
              </div>
              {showSeo ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>

            {showSeo && (
              <CardContent className="space-y-4 p-5 pt-0">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="post-seo-title"
                    className="text-xs font-semibold"
                  >
                    SEO Meta Title
                  </Label>
                  <Input
                    id="post-seo-title"
                    type="text"
                    placeholder={title || 'Defaults to article title'}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="post-seo-desc"
                    className="text-xs font-semibold"
                  >
                    SEO Meta Description
                  </Label>
                  <Textarea
                    id="post-seo-desc"
                    placeholder={
                      excerpt || 'Defaults to article summary excerpt'
                    }
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="size-5" />
              <span>Delete This Article?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-foreground">
                  &ldquo;{title}&rdquo;
                </strong>
                ?
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                This will delete the post data and release the slug (
                <code className="text-foreground font-mono">/{slug}</code>)
                immediately. This cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? 'Deleting...' : 'Delete Article'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Unsaved Changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              You have unsaved changes in this article. Leaving this page will
              discard your edits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/admin/blog')}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
