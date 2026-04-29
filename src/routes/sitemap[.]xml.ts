import { createFileRoute } from "@tanstack/react-router";
import { fetchUniverse } from "@/server/screen.functions";

const SITE = "https://rankaisolutions.tech";
const STATIC_PATHS = [
  "/",
  "/terminal",
  "/compare",
  "/watchlist",
  "/events",
  "/data-quality",
  "/sources",
  "/settings",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);
        let symbols: string[] = [];
        try {
          const u = await fetchUniverse({ data: {} });
          symbols = (u?.rows ?? []).map((r: any) => r.symbol).filter(Boolean);
        } catch {
          symbols = [];
        }

        const urls: string[] = [];
        for (const p of STATIC_PATHS) {
          urls.push(
            `<url><loc>${SITE}${p === "/" ? "" : p}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>${p === "/" ? "1.0" : "0.7"}</priority></url>`,
          );
        }
        for (const sym of symbols) {
          const safe = encodeURIComponent(sym);
          urls.push(
            `<url><loc>${SITE}/terminal/${safe}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.6</priority></url>`,
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
