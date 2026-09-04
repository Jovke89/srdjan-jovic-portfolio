export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry on transient Sanity errors (429/502/503/network) with backoff. */
export async function retry<T>(fn: () => Promise<T>, label = 'op', attempts = 6): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const code = (err as { statusCode?: number; response?: { statusCode?: number } })?.statusCode;
      const transient =
        code === 429 ||
        code === 502 ||
        code === 503 ||
        code === 504 ||
        /ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|network/i.test(String(err));
      if (!transient) throw err;
      const wait = Math.min(1000 * 2 ** i, 15000) + Math.random() * 500;
      console.warn(`  … ${label} failed (${code ?? 'net'}), retry ${i + 1}/${attempts} in ${Math.round(wait)}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}
