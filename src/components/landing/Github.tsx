'use client';

import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { githubConfig } from '@/config/Github';
import type {
  GithubActivityResponse,
  GithubContributionItem,
} from '@/types/github';

import Container from '../common/Container';
import GithubIcon from '../svgs/Github';
import { Button } from '../ui/button';

const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then((mod) => mod.default),
  { ssr: false },
);

export default function Github() {
  const [contributions, setContributions] = useState<GithubContributionItem[]>(
    [],
  );
  const [totalContributions, setTotalContributions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setHasError(false);

        const response = await fetch(githubConfig.apiUrl);
        if (!response.ok) {
          throw new Error(`GitHub activity returned HTTP ${response.status}`);
        }

        const data: GithubActivityResponse = await response.json();

        if (!isMounted) return;

        if (data.success && Array.isArray(data.contributions)) {
          setTotalContributions(data.totalContributions);
          setContributions(data.contributions);
        } else {
          setHasError(true);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to fetch GitHub contributions:', err);
        setHasError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Container className="mt-20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-bold">
              {githubConfig.title}
            </h2>
            <p className="text-muted-foreground text-sm">
              <b>{githubConfig.username}</b>&apos;s {githubConfig.subtitle}
            </p>
            {!isLoading && !hasError && totalContributions > 0 && (
              <p className="text-primary mt-1 text-sm font-medium">
                Total:{' '}
                <span className="font-black">
                  {totalContributions.toLocaleString()}
                </span>{' '}
                contributions
              </p>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link
              href={`https://github.com/${githubConfig.username}`}
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon className="mr-2 h-4 w-4" />
              Visit My GitHub
            </Link>
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div
            className="flex items-center justify-center py-16"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <div
                className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                aria-hidden="true"
              />
              <p className="text-muted-foreground text-sm">
                {githubConfig.loadingState.description}
              </p>
            </div>
          </div>
        ) : hasError || contributions.length === 0 ? (
          <div
            className="text-muted-foreground border-border rounded-xl border-2 border-dashed p-8 text-center"
            role="alert"
          >
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <GithubIcon className="h-8 w-8" />
            </div>
            <p className="text-foreground mb-2 font-medium">
              {githubConfig.errorState.title}
            </p>
            <p className="mb-4 text-sm">
              {githubConfig.errorState.description}
            </p>
            <Button variant="outline" asChild>
              <Link
                href={`https://github.com/${githubConfig.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                <GithubIcon className="h-4 w-4" />
                {githubConfig.errorState.buttonText}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="relative overflow-hidden">
            <div className="bg-background/50 relative rounded-lg border border-dashed border-black/20 p-6 backdrop-blur-sm dark:border-white/10">
              <div
                className="w-full overflow-x-auto"
                tabIndex={0}
                aria-label="GitHub Daily Activity Heatmap"
              >
                <ActivityCalendar
                  data={contributions}
                  blockSize={12}
                  blockMargin={4}
                  fontSize={githubConfig.fontSize}
                  colorScheme={theme === 'dark' ? 'dark' : 'light'}
                  maxLevel={githubConfig.maxLevel}
                  hideTotalCount={true}
                  hideColorLegend={false}
                  hideMonthLabels={false}
                  theme={githubConfig.theme}
                  labels={{
                    months: githubConfig.months,
                    weekdays: githubConfig.weekdays,
                    totalCount: githubConfig.totalCountLabel,
                  }}
                  renderBlock={(block, activity) =>
                    React.cloneElement(block, {
                      children: (
                        <title>
                          {activity.count === 0
                            ? `No contributions on ${activity.date}`
                            : `${activity.count} contribution${
                                activity.count === 1 ? '' : 's'
                              } on ${activity.date}`}
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
