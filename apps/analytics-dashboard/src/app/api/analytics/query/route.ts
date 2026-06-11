/**
 * POST /api/analytics/query
 *
 * Executes a metrics query and returns time-series aggregation results.
 */

import { logger } from '@cinacoin/logger';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AnalyticsEngine, type QueryParams } from "../../../../lib/analytics";

const querySchema = z.object({
  timeRange: z.object({
    from: z.number(),
    to: z.number(),
  }),
  metrics: z.array(z.string()).optional(),
  groupBy: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
});

// Shared engine instance - in production, this should be initialized with data from D1/Worker
let engine: AnalyticsEngine | null = null;

function getEngine(): AnalyticsEngine {
  if (!engine) {
    engine = new AnalyticsEngine();
    // TODO: Load initial data from D1 or analytics-worker
    // engine.loadEvents(await fetchInitialData());
  }
  return engine;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = querySchema.safeParse(body);

    if (!validation.success) {
      logger.warn("[analytics/query] Invalid request", { error: validation.error.flatten() });
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const eng = getEngine();
    const results = eng.query(validation.data as QueryParams);

    return NextResponse.json({ results });
  } catch (err) {
    logger.error("[analytics/query] Error:", err);
    return NextResponse.json(
      { error: "Failed to execute metrics query" },
      { status: 500 },
    );
  }
}
