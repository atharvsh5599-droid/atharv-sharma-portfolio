import { NextResponse } from 'next/server';

import { githubConfig } from '@/config/Github';
import type {
  GithubContributionItem,
  GithubContributionLevel,
} from '@/types/github';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPSTREAM_TIMEOUT_MS = 10000;

type UpstreamContribution = {
  date: string;
  count: number;
  level: number;
};

type UpstreamResponse = {
  total?: Record<string, number>;
  contributions?: UpstreamContribution[];
};

export async function GET() {
  const upstreamUrl = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(
    githubConfig.username,
  )}?y=last`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    const res = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AtharvSharma-Portfolio/1.0',
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `GitHub activity provider responded with HTTP ${res.status}`,
        },
        { status: 502 },
      );
    }

    const payload: UpstreamResponse = await res.json();

    if (!payload || !Array.isArray(payload.contributions)) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub activity provider returned an invalid schema',
        },
        { status: 502 },
      );
    }

    const contributions: GithubContributionItem[] = payload.contributions
      .filter((item) => item && typeof item.date === 'string')
      .map((item) => {
        const count = Math.max(0, Math.round(Number(item.count) || 0));
        const level = Math.max(
          0,
          Math.min(4, Math.round(Number(item.level) || 0)),
        ) as GithubContributionLevel;

        return {
          date: item.date,
          count,
          level,
        };
      });

    const totalFromHeader = payload.total?.lastYear;
    const totalCalculated = contributions.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const totalContributions =
      typeof totalFromHeader === 'number' ? totalFromHeader : totalCalculated;

    return NextResponse.json(
      {
        success: true,
        username: githubConfig.username,
        totalContributions,
        contributions,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      },
    );
  } catch (error) {
    const isAbort =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('abort'));
    const message = isAbort
      ? 'GitHub activity request timed out'
      : error instanceof Error
        ? error.message
        : 'Failed to retrieve GitHub activity';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 504 },
    );
  }
}
