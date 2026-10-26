import { UpstashRedisLike, UpstashTransactionLike } from '@/lib/blog-storage';

export class MockRedisClient implements UpstashRedisLike {
  public data = new Map<string, string>();
  public sortedSets = new Map<string, Map<string, number>>();
  public shouldFailExec = false;
  public failExecMessage = 'Simulated Redis connection failure';

  public async get<T = unknown>(key: string): Promise<T | null> {
    const val = this.data.get(key);
    if (val === undefined) {
      return null;
    }
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  public async set(key: string, value: unknown): Promise<'OK'> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    this.data.set(key, serialized);
    return 'OK';
  }

  public async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.data.delete(key)) count++;
      if (this.sortedSets.delete(key)) count++;
    }
    return count;
  }

  public async zadd(
    key: string,
    ...scoreMembers: { score: number; member: string }[]
  ): Promise<number> {
    let set = this.sortedSets.get(key);
    if (!set) {
      set = new Map<string, number>();
      this.sortedSets.set(key, set);
    }
    let added = 0;
    for (const sm of scoreMembers) {
      if (!set.has(sm.member)) added++;
      set.set(sm.member, sm.score);
    }
    return added;
  }

  public async zrem(key: string, ...members: string[]): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  public async zcard(key: string): Promise<number> {
    const set = this.sortedSets.get(key);
    return set ? set.size : 0;
  }

  public async zrange<T = unknown>(
    key: string,
    start: number | string,
    stop: number | string,
    options?: { rev?: boolean },
  ): Promise<T[]> {
    const set = this.sortedSets.get(key);
    if (!set) return [] as unknown as T[];

    // Convert entries to array and sort by score
    const entries = Array.from(set.entries());
    entries.sort((a, b) => (options?.rev ? b[1] - a[1] : a[1] - b[1]));

    const numStart = Number(start);
    const numStop = Number(stop);

    // Negative indexing or unbounded
    const startIndex = Math.max(0, numStart);
    const stopIndex = numStop < 0 ? entries.length : numStop + 1;

    const sliced = entries.slice(startIndex, stopIndex).map((e) => e[0]);
    return sliced as unknown as T[];
  }

  public multi(): UpstashTransactionLike {
    const ops: Array<() => void> = [];
    const tx: UpstashTransactionLike = {
      set: (key: string, value: string) => {
        ops.push(() => {
          this.data.set(key, value);
        });
        return tx;
      },
      del: (...keys: string[]) => {
        ops.push(() => {
          for (const k of keys) {
            this.data.delete(k);
            this.sortedSets.delete(k);
          }
        });
        return tx;
      },
      zadd: (
        key: string,
        ...scoreMembers: { score: number; member: string }[]
      ) => {
        ops.push(() => {
          let s = this.sortedSets.get(key);
          if (!s) {
            s = new Map<string, number>();
            this.sortedSets.set(key, s);
          }
          for (const sm of scoreMembers) {
            s.set(sm.member, sm.score);
          }
        });
        return tx;
      },
      zrem: (key: string, ...members: string[]) => {
        ops.push(() => {
          const s = this.sortedSets.get(key);
          if (s) {
            for (const m of members) {
              s.delete(m);
            }
          }
        });
        return tx;
      },
      exec: async (): Promise<unknown[]> => {
        if (this.shouldFailExec) {
          throw new Error(this.failExecMessage);
        }
        for (const op of ops) {
          op();
        }
        return ops.map(() => 'OK');
      },
    };

    return tx;
  }

  public clear(): void {
    this.data.clear();
    this.sortedSets.clear();
    this.shouldFailExec = false;
  }
}
