/** Normalize free-form URL inputs into absolute https links. */
export function normalizeStreamUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Deduped URL list for save / display. */
export function normalizeStreamUrls(
  values: Array<string | null | undefined>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const next = normalizeStreamUrl(value ?? "");
    if (!next || seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}

/** Read `stream_urls` jsonb (string[] or legacy {url} objects) + old stream_url. */
export function parseStreamUrls(value: unknown, legacyUrl?: string | null) {
  const collect = (items: unknown[]) =>
    normalizeStreamUrls(
      items.map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return String((item as { url?: unknown }).url ?? "");
        }
        return "";
      }),
    );

  if (Array.isArray(value)) return collect(value);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return collect(parsed);
    } catch {
      return normalizeStreamUrls([value]);
    }
  }
  if (legacyUrl) return normalizeStreamUrls([legacyUrl]);
  return [];
}
