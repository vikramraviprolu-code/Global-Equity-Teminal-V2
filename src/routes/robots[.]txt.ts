import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://rankaisolutions.tech/sitemap.xml\n`;
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
