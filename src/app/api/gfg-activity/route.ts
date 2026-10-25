import { NextResponse } from 'next/server';

import { gfgConfig } from '@/config/GeeksforGeeks';
import type {
  GfgContributionLevel,
  GfgDailyContribution,
  GfgStats,
} from '@/types/gfg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPSTREAM_TIMEOUT_MS = 10000;

type UpstreamContribution = {
  date: string;
  count: number;
  level: number;
};

type UpstreamHeatmapResponse = {
  status: string;
  message?: string;
  username?: string;
  data?: {
    totalSubmissions?: number;
    totalActiveDays?: number;
    currentStreak?: number;
    longestStreak?: number;
    maxDailySubmissions?: number;
    firstActiveDate?: string;
    lastActiveDate?: string;
    startDate?: string;
    endDate?: string;
    dailyContributions?: UpstreamContribution[];
  };
};

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes contribution activity into a 365-day rolling window.
 * Strictly generates zero-activity entries ONLY for dates within the API's valid coverage window.
 */
function buildRollingCalendar(
  activeContributions: UpstreamContribution[],
  coverageStartDate: string,
  coverageEndDate: string,
): GfgDailyContribution[] {
  const activeMap = new Map<
    string,
    { count: number; level: GfgContributionLevel }
  >();

  for (const item of activeContributions) {
    if (item && typeof item.date === 'string') {
      const levelClamped = Math.max(
        0,
        Math.min(4, Math.round(Number(item.level) || 0)),
      ) as GfgContributionLevel;
      activeMap.set(item.date, {
        count: Math.max(0, Number(item.count) || 0),
        level: levelClamped,
      });
    }
  }

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setDate(today.getDate() - 364);

  const result: GfgDailyContribution[] = [];
  const curr = new Date(oneYearAgo);

  while (curr <= today) {
    const dStr = formatIsoDate(curr);

    if (activeMap.has(dStr)) {
      const entry = activeMap.get(dStr)!;
      result.push({
        date: dStr,
        count: entry.count,
        level: entry.level,
      });
    } else if (dStr >= coverageStartDate && dStr <= coverageEndDate) {
      // Confirmed within the API's reported active/historical coverage: true zero activity
      result.push({
        date: dStr,
        count: 0,
        level: 0,
      });
    } else {
      // Date falls outside known API coverage: only include if the API explicitly spans this date
      // If outside, we omit or clamp to coverage boundary rather than fabricating counts
    }

    curr.setDate(curr.getDate() + 1);
  }

  return result;
}

export async function GET() {
  const upstreamUrl = `https://gfg-stats.tashif.codes/${encodeURIComponent(
    gfgConfig.username,
  )}/heatmap`;

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
          error: `GeeksforGeeks activity provider responded with HTTP ${res.status}`,
        },
        { status: 502 },
      );
    }

    const payload: UpstreamHeatmapResponse = await res.json();

    if (
      payload.status !== 'success' ||
      !payload.data ||
      !Array.isArray(payload.data.dailyContributions)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'GeeksforGeeks activity data schema was invalid or incomplete',
        },
        { status: 502 },
      );
    }

    const data = payload.data;
    const coverageStart =
      data.startDate || data.firstActiveDate || '1970-01-01';
    const coverageEnd =
      data.endDate || data.lastActiveDate || formatIsoDate(new Date());

    const contributions = buildRollingCalendar(
      data.dailyContributions,
      coverageStart,
      coverageEnd,
    );

    const stats: GfgStats = {
      totalSubmissions: Number(data.totalSubmissions ?? 0),
      totalActiveDays: Number(data.totalActiveDays ?? 0),
      currentStreak: Number(data.currentStreak ?? 0),
      longestStreak: Number(data.longestStreak ?? 0),
      maxDailySubmissions: Number(data.maxDailySubmissions ?? 0),
      firstActiveDate: data.firstActiveDate ?? null,
      lastActiveDate: data.lastActiveDate ?? null,
    };

    return NextResponse.json(
      {
        success: true,
        username: gfgConfig.username,
        stats,
        contributions,
        coverage: {
          startDate: coverageStart,
          endDate: coverageEnd,
        },
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
      ? 'GeeksforGeeks activity request timed out'
      : error instanceof Error
        ? error.message
        : 'Failed to retrieve GeeksforGeeks activity';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 504 },
    );
  }
}
