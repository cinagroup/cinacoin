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

const engine = new AnalyticsEngine();

const funnelQuerySchema = z.object({
  timeRange: z.object({
    from: z.number(),
    to: z.number(),
  }),
  steps: z.array(z.string()),
  filters: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = funnelQuerySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const result = engine.analyzeFunnel(validation.data as FunnelQuery);

    return NextResponse.json({ funnel: result });
  } catch (err) {
    logger.error("[funnel/analyze] Error:", err);
    return NextResponse.json(
      { error: "Failed to analyze funnel" },
      { status: 500 },
    );
  }
}
