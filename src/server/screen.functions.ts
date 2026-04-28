import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { UNIVERSE } from "./universe";
import { fetchScreenerRow, type ScreenerRow } from "./finimpulse.server";

// Fetch metrics for the entire curated universe in parallel.
// The frontend applies all filters/sorts/scoring locally on the returned dataset.
export const fetchUniverse = createServerFn({ method: "POST" })
  .inputValidator(z.object({ regions: z.array(z.string()).optional() }).optional().default({}))
  .handler(async ({ data }) => {
    const filtered = data?.regions?.length
      ? UNIVERSE.filter((u) => data.regions!.includes(u.region))
      : UNIVERSE;

    // Batch in chunks to avoid overwhelming the upstream API
    const CHUNK = 20;
    const out: ScreenerRow[] = [];
    for (let i = 0; i < filtered.length; i += CHUNK) {
      const chunk = filtered.slice(i, i + CHUNK);
      const rows = await Promise.all(chunk.map((u) => fetchScreenerRow(u).catch(() => null)));
      for (const r of rows) if (r) out.push(r);
    }

    const mockCount = out.filter((r) => r.isMock).length;
    return {
      rows: out,
      meta: {
        retrievedAt: new Date().toISOString(),
        total: out.length,
        mockCount,
        liveCount: out.length - mockCount,
        universeSize: filtered.length,
      },
    } as const;
  });
