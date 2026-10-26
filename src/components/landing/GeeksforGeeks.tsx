'use client';

import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import Container from '@/components/common/Container';
import GeeksforGeeksIcon from '@/components/svgs/GeeksforGeeks';
import { Button } from '@/components/ui/button';
import { gfgConfig } from '@/config/GeeksforGeeks';
import type {
  GfgActivityResponse,
  GfgDailyContribution,
  GfgStats,
} from '@/types/gfg';

const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then((mod) => mod.default),
  { ssr: false },
);

export default function GeeksforGeeks() {
  const [contributions, setContributions] = useState<GfgDailyContribution[]>(
    [],
  );
  const [stats, setStats] = useState<GfgStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    let isMounted = true;

    async function fetchGfgData() {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage(null);

        const response = await fetch(gfgConfig.apiUrl);
        const data: GfgActivityResponse = await response.json();

        if (!isMounted) return;

        if (data.success && Array.isArray(data.contributions)) {
          setContributions(data.contributions);
          setStats(data.stats);
        } else {
          setHasError(true);
          if (!data.success && data.error) {
            setErrorMessage(data.error);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setHasError(true);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Could not connect to activity endpoint',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchGfgData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Container className="mt-20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GeeksforGeeksIcon className="size-6 text-[#2f8d46]" />
              <h2 className="text-foreground text-2xl font-bold">
                {gfgConfig.title}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">
              <b>{gfgConfig.username}</b>&apos;s {gfgConfig.subtitle}
            </p>

            {/* Dynamic Stats Badges */}
            {!isLoading && !hasError && stats && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <span className="bg-muted text-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium">
                  Total Solved:
                  <b className="text-[#2f8d46]">
                    {stats.totalSubmissions.toLocaleString()}
                  </b>
                </span>
                <span className="bg-muted text-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium">
                  Active Days:
                  <b className="text-[#2f8d46]">
                    {stats.totalActiveDays.toLocaleString()}
                  </b>
                </span>
                <span className="bg-muted text-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium">
                  Current Streak:
                  <b className="text-[#2f8d46]">{stats.currentStreak}d</b>
                </span>
                <span className="bg-muted text-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium">
                  Longest Streak:
                  <b className="text-[#2f8d46]">{stats.longestStreak}d</b>
                </span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            asChild
            className="shrink-0 self-start sm:self-auto"
          >
            <Link
              href={gfgConfig.profileUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Visit GeeksforGeeks Profile"
            >
              <GeeksforGeeksIcon className="mr-2 h-4 w-4 text-[#2f8d46]" />
              Visit My GFG Profile
            </Link>
          </Button>
        </div>

        {/* Content States */}
        {isLoading ? (
          <div
            className="flex items-center justify-center py-16"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <div
                className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#2f8d46] border-t-transparent"
                aria-hidden="true"
              />
              <p className="text-muted-foreground text-sm">
                {gfgConfig.loadingState.description}
              </p>
            </div>
          </div>
        ) : hasError || contributions.length === 0 ? (
          <div
            className="text-muted-foreground border-border rounded-xl border-2 border-dashed p-8 text-center"
            role="alert"
          >
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <GeeksforGeeksIcon className="h-8 w-8 text-[#2f8d46]" />
            </div>
            <p className="text-foreground mb-1 font-semibold">
              {gfgConfig.errorState.title}
            </p>
            <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
              {errorMessage || gfgConfig.errorState.description}
            </p>
            <Button variant="outline" asChild>
              <Link
                href={gfgConfig.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                <GeeksforGeeksIcon className="h-4 w-4 text-[#2f8d46]" />
                {gfgConfig.errorState.buttonText}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="relative overflow-hidden">
            <div className="bg-background/50 relative rounded-lg border border-dashed border-black/20 p-6 backdrop-blur-sm dark:border-white/10">
              <div
                className="w-full overflow-x-auto"
                tabIndex={0}
                aria-label="GeeksforGeeks Daily Activity Heatmap"
              >
                <ActivityCalendar
                  data={contributions}
                  blockSize={gfgConfig.blockSize}
                  blockMargin={gfgConfig.blockMargin}
                  fontSize={gfgConfig.fontSize}
                  colorScheme={theme === 'dark' ? 'dark' : 'light'}
                  maxLevel={gfgConfig.maxLevel}
                  hideTotalCount={true}
                  hideColorLegend={false}
                  hideMonthLabels={false}
                  theme={gfgConfig.theme}
                  labels={{
                    months: gfgConfig.months,
                    weekdays: gfgConfig.weekdays,
                    totalCount: gfgConfig.totalCountLabel,
                  }}
                  renderBlock={(block, activity) =>
                    React.cloneElement(block, {
                      children: (
                        <title>
                          {activity.count === 0
                            ? `No problems solved on ${activity.date}`
                            : `${activity.count} problem${
                                activity.count === 1 ? '' : 's'
                              } solved on ${activity.date}`}
                        </title>
                      ),
                    })
                  }
                  style={{
                    color: 'rgb(139, 148, 158)',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
