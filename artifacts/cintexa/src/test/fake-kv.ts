/** In-memory stand-in for a Workers KV namespace (get / put / delete). */
export class FakeKV {
  store = new Map<string, string>();
  ttl = new Map<string, number | undefined>();
  async get(k: string) {
    return this.store.get(k) ?? null;
  }
  async put(k: string, v: string, opts?: { expirationTtl?: number }) {
    this.store.set(k, v);
    this.ttl.set(k, opts?.expirationTtl);
  }
  async delete(k: string) {
    this.store.delete(k);
  }
  /** Minimal KV list(): ascending by key, cursor = offset. */
  async list(opts: { prefix?: string; cursor?: string; limit?: number } = {}) {
    const all = [...this.store.keys()].filter((k) => k.startsWith(opts.prefix ?? "")).sort();
    const start = Number(opts.cursor ?? 0) || 0;
    const limit = opts.limit ?? 1000;
    const slice = all.slice(start, start + limit);
    const done = start + limit >= all.length;
    return { keys: slice.map((name) => ({ name })), list_complete: done, cursor: done ? undefined : String(start + limit) };
  }
  keys(prefix = "") {
    return [...this.store.keys()].filter((k) => k.startsWith(prefix));
  }
}
