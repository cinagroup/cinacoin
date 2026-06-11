/**
 * POST /api/funnel/analyze
 *
 * Run funnel analysis on on-ramp conversion events.
 * Returns stage-by-stage conversion rates and dropoff analysis.
 */

import { logger } from '@cinacoin/logger';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AnalyticsEngine, type FunnelQuery } from "../../../../lib/analytics";

const funnelQuerySchema = z.object({
  timeRange: z.object({
    from: z.number(),
    to: z.number(),
  }),
  steps: z.array(z.string()),
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
    const validation = funnelQuerySchema.safeParse(body);

    if (!validation.success) {
      logger.warn("[funnel/analyze] Invalid request", { error: validation.error.flatten() });
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const eng = getEngine();
    const result = eng.analyzeFunnel(validation.data as FunnelQuery);

    return NextResponse.json({ funnel: result });
  } catch (err) {
    logger.error("[funnel/analyze] Error:", err);
    return NextResponse.json(
      { error: "Failed to analyze funnel" },
      { status: 500 },
    );
  }
}
