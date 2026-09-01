let counter = 0;

/**
 * Local-only identifier. These never collide across a single device, which is
 * the only scope that matters here — nothing is ever synced or merged.
 */
export function newId(prefix = 'e'): string {
  counter = (counter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${rand}`;
}
