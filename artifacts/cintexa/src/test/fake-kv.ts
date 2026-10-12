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
  keys(prefix = "") {
    return [...this.store.keys()].filter((k) => k.startsWith(prefix));
  }
}
