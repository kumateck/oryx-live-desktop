export class BoundedLruCache<T> {
  private readonly values = new Map<string, T>();
  private hits = 0;
  private misses = 0;

  constructor(private readonly maximumEntries: number) {}

  get(key: string): T | undefined {
    const value = this.values.get(key);
    if (value === undefined) {
      this.misses += 1;
      return undefined;
    }
    this.values.delete(key);
    this.values.set(key, value);
    this.hits += 1;
    return value;
  }

  set(key: string, value: T): void {
    if (this.values.has(key)) this.values.delete(key);
    this.values.set(key, value);
    if (this.values.size <= this.maximumEntries) return;
    const oldest = this.values.keys().next().value;
    if (oldest !== undefined) this.values.delete(oldest);
  }

  metrics() {
    return {
      entries: this.values.size,
      maximumEntries: this.maximumEntries,
      hits: this.hits,
      misses: this.misses,
    };
  }
}
