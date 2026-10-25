export type GfgContributionLevel = 0 | 1 | 2 | 3 | 4;

export type GfgDailyContribution = {
  date: string;
  count: number;
  level: GfgContributionLevel;
};

export type GfgStats = {
  totalSubmissions: number;
  totalActiveDays: number;
  currentStreak: number;
  longestStreak: number;
  maxDailySubmissions: number;
  firstActiveDate: string | null;
  lastActiveDate: string | null;
};

export type GfgCoverage = {
  startDate: string;
  endDate: string;
};

export type GfgActivitySuccessResponse = {
  success: true;
  username: string;
  stats: GfgStats;
  contributions: GfgDailyContribution[];
  coverage: GfgCoverage;
};

export type GfgActivityErrorResponse = {
  success: false;
  error: string;
};

export type GfgActivityResponse =
  GfgActivitySuccessResponse | GfgActivityErrorResponse;
