/**
 * POST /api/analytics/kpi
 *
 * Computes dashboard KPIs for a given time range with period-over-period comparison.
 */

import { logger } from '@cinacoin/logger';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AnalyticsEngine, type TimeRange } from "../../../../lib/analytics";

const engine = new AnalyticsEngine();

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = kpiSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { timeRange, previousTimeRange } = validation.data;
    const kpis = engine.computeKPIs(timeRange as TimeRange, previousTimeRange as TimeRange | undefined);

    return NextResponse.json({ kpis });
  } catch (err) {
    logger.error("[analytics/kpi] Error:", err);
    return NextResponse.json(
      { error: "Failed to compute KPIs" },
      { status: 500 },
    );
  }
}
