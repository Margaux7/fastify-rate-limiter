import LRU from 'lru-cache';

export interface LimiterOpts {
  max?: number;
  timeWindow?: number;
}

export default class TokenBucketLimiter {
  public capacity = 100;
  public timeWindow = 60;
  private speed: number;
  private lru: LRU<string, { last: number; token: number }>;
  public after: number;

  constructor(opts: LimiterOpts) {
    this.capacity = opts.max || this.capacity;
    this.timeWindow = opts.timeWindow || this.timeWindow;
    this.speed = this.capacity / this.timeWindow;
    this.after = (this.timeWindow / this.capacity) | 0;
    this.lru = new LRU({ max: 5000, ttl: this.timeWindow * 1000 });
  }

  public check(key: string): {
    rejected: boolean;
    remain: number;
  } {
    const now = Date.now();
    const cache = this.lru.get(key) || { last: null, token: this.capacity };
    let rejected = true;

    if (cache.last) {
      const interval = ((now - cache.last) / 1000) | 0;
      cache.token = Math.min(
        (cache.token + interval * this.speed) | 0,
        this.capacity,
      );
    }

    if (cache.token > 0) {
      cache.token--;
      rejected = false;
    }
    cache.last = now;
    this.lru.set(key, cache);
    return {
      rejected,
      remain: cache.token,
    };
  }
}
