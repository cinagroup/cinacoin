/**
 * POST /api/funnel/analyze
 *
 * Run funnel analysis on on-ramp conversion events.
 * Returns stage-by-stage conversion rates and dropoff analysis.
 */

import { logger } from '@cinacoin/logger';
import { NextRequest, NextResponse } from "next/server";
import { AnalyticsEngine, type FunnelQuery } from "../../../../lib/analytics";

const engine = new AnalyticsEngine();

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FunnelQuery;

    if (!body.timeRange?.from || !body.timeRange?.to) {
      return NextResponse.json(
        { error: "timeRange.from and timeRange.to are required" },
        { status: 400 },
      );
    }

    const result = engine.analyzeFunnel(body);

    return NextResponse.json({ funnel: result });
  } catch (err) {
    logger.error("[funnel/analyze] Error:", err);
    return NextResponse.json(
      { error: "Failed to analyze funnel" },
      { status: 500 },
    );
  }
}
