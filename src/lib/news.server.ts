// Economic calendar (Forex Factory feed) + market news headlines (server-only).

export type CalendarEvent = {
  id: string;
  title: string;
  country: string;
  date: string; // ISO
  impact: "High" | "Medium" | "Low" | "Holiday" | string;
  forecast: string;
  previous: string;
  actual?: string;
};

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  pubDate: string;
};

const CALENDAR_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

const NEWS_FEEDS: { url: string; source: string }[] = [
  { url: "https://www.investing.com/rss/news_1.rss", source: "Forex" },
  { url: "https://www.investing.com/rss/news_11.rss", source: "Commodities" },
  { url: "https://www.investing.com/rss/news_25.rss", source: "Economy" },
  { url: "https://www.investing.com/rss/news_285.rss", source: "Economic indicators" },
];

type CacheEntry<T> = { at: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();
const TTL = 60 * 1000; // 1 minute — Forex Factory blocks more frequent polling

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const data = await loader();
  cache.set(key, { at: Date.now(), data });
  return data;
}

export async function fetchCalendar(): Promise<CalendarEvent[]> {
  return cached("calendar", async () => {
    try {
      const res = await fetch(CALENDAR_URL, {
        headers: { "user-agent": "Mozilla/5.0", accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return [];
      const raw = (await res.json()) as Array<Record<string, string>>;
      if (!Array.isArray(raw)) return [];
      return raw.map((e, i) => ({
        id: `${e['date'] ?? i}-${e['title'] ?? i}-${i}`,
        title: String(e['title'] ?? ""),
        country: String(e['country'] ?? "All"),
        date: String(e['date'] ?? ""),
        impact: String(e['impact'] ?? "Low"),
        forecast: String(e['forecast'] ?? ""),
        previous: String(e['previous'] ?? ""),
      }));
    } catch {
      return [];
    }
  });
}

function decode(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function parseRss(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of blocks) {
    const body = block.split(/<\/item>/i)[0] ?? "";
    const title = decode(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const link = decode(body.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "");
    const pubDate = decode(body.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "");
    if (!title) continue;
    items.push({ id: `${source}-${link || title}`, title, link, source, pubDate });
  }
  return items;
}

export async function fetchNews(): Promise<NewsItem[]> {
  return cached("news", async () => {
    const results = await Promise.all(
      NEWS_FEEDS.map(async ({ url, source }) => {
        try {
          const res = await fetch(url, {
            headers: { "user-agent": "Mozilla/5.0", accept: "application/rss+xml, text/xml" },
            signal: AbortSignal.timeout(12000),
          });
          if (!res.ok) return [];
          return parseRss(await res.text(), source);
        } catch {
          return [];
        }
      }),
    );
    const all = results.flat();
    const seen = new Set<string>();
    const unique = all.filter((n) => {
      const key = n.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort((a, b) => {
      const ta = Date.parse(a.pubDate) || 0;
      const tb = Date.parse(b.pubDate) || 0;
      return tb - ta;
    });
    return unique.slice(0, 120);
  });
}
