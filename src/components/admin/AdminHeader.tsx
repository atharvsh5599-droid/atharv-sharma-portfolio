import {
  ArrowLeft,
  CheckCircle2,
  LogOut,
  Plus,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import React from 'react';

import { signOut } from '@/auth';
import Container from '@/components/common/Container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminUser } from '@/lib/auth/server-guard';

interface AdminHeaderProps {
  admin: AdminUser;
  currentPage?: 'list' | 'new' | 'edit';
}

export function AdminHeader({ admin, currentPage = 'list' }: AdminHeaderProps) {
  return (
    <header className="border-border/60 bg-card/60 sticky top-0 z-30 border-b backdrop-blur-md">
      <Container className="py-3.5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Branding & Breadcrumb Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link
                href="/blog"
                className="flex items-center gap-1.5 text-xs font-medium"
              >
                <ArrowLeft className="size-3.5" />
                <span>Public Blog</span>
              </Link>
            </Button>

            <span className="text-muted-foreground/40">/</span>

            <Link
              href="/admin/blog"
              className="text-foreground hover:text-primary flex items-center gap-2 text-sm font-bold tracking-tight transition-colors"
            >
              <ShieldCheck className="text-primary size-4" />
              <span>CMS Admin</span>
            </Link>

            {currentPage === 'new' && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-muted-foreground text-xs font-medium">
                  New Post
                </span>
              </>
            )}

            {currentPage === 'edit' && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-muted-foreground text-xs font-medium">
                  Edit Post
                </span>
              </>
            )}
          </div>

          {/* Right: Actions, Admin Info & Sign Out */}
          <div className="flex flex-wrap items-center gap-3">
            {currentPage !== 'new' && (
              <Button
                size="sm"
                asChild
                className="gap-1.5 rounded-xl shadow-xs"
              >
                <Link href="/admin/blog/new">
                  <Plus className="size-4" />
                  <span>New Post</span>
                </Link>
              </Button>
            )}

            {/* Admin Identity Indicator */}
            <div className="border-border/60 bg-muted/40 hidden items-center gap-2 rounded-full border py-1 pr-3 pl-1 md:flex">
              {admin.image ? (
                <div className="relative size-6 overflow-hidden rounded-full border">
                  <Image
                    src={admin.image}
                    alt={admin.name || 'Admin'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-primary/20 text-primary flex size-6 items-center justify-center rounded-full text-xs">
                  <User className="size-3.5" />
                </div>
              )}
              <span className="text-foreground max-w-[120px] truncate text-xs font-medium">
                {admin.name || 'Admin'}
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-[10px] text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="mr-0.5 size-2.5" />
                {admin.githubId}
              </Badge>
            </div>

            {/* Sign Out Action */}
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/admin/login' });
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-muted-foreground hover:text-destructive gap-1.5 text-xs"
                title="Sign out of administration"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </header>
  );
}
