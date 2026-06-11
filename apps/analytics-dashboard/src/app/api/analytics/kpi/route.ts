/**
 * POST /api/analytics/kpi
 *
 * Computes dashboard KPIs for a given time range with period-over-period comparison.
 */

import { logger } from '@cinacoin/logger';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AnalyticsEngine, type TimeRange } from "../../../../lib/analytics";

const kpiSchema = z.object({
  timeRange: z.object({
    from: z.number(),
    to: z.number(),
  }),
  previousTimeRange: z.object({
    from: z.number(),
    to: z.number(),
  }).optional(),
});

// Shared engine instance - in production, this should be initialized with data from D1/Worker
// For now, we create a singleton that can be populated via loadEvents()
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
    const validation = kpiSchema.safeParse(body);

    if (!validation.success) {
      logger.warn("[analytics/kpi] Invalid request", { error: validation.error.flatten() });
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { timeRange, previousTimeRange } = validation.data;
    const eng = getEngine();
    const kpis = eng.computeKPIs(timeRange as TimeRange, previousTimeRange as TimeRange | undefined);

    return NextResponse.json({ kpis });
  } catch (err) {
    logger.error("[analytics/kpi] Error:", err);
    return NextResponse.json(
      { error: "Failed to compute KPIs" },
      { status: 500 },
    );
  }
}
