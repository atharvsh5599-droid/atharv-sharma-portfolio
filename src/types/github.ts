export type GithubContributionLevel = 0 | 1 | 2 | 3 | 4;

export type GithubContributionItem = {
  date: string;
  count: number;
  level: GithubContributionLevel;
};

export type GithubActivitySuccessResponse = {
  success: true;
  username: string;
  totalContributions: number;
  contributions: GithubContributionItem[];
};

export type GithubActivityErrorResponse = {
  success: false;
  error: string;
};

export type GithubActivityResponse =
  GithubActivitySuccessResponse | GithubActivityErrorResponse;
