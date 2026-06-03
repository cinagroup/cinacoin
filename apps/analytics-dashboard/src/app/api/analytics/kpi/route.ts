/**
 * POST /api/analytics/kpi
 *
 * Computes dashboard KPIs for a given time range with period-over-period comparison.
 */

import { NextRequest, NextResponse } from "next/server";
import { AnalyticsQueryEngine, type TimeRange } from "../../../lib/analytics.js";

const engine = new AnalyticsQueryEngine();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const timeRange: TimeRange = body.timeRange;
    const previousTimeRange: TimeRange | undefined = body.previousTimeRange;

    if (!timeRange?.from || !timeRange?.to) {
      return NextResponse.json(
        { error: "timeRange.from and timeRange.to are required" },
        { status: 400 },
      );
    }

    const kpis = engine.computeKPIs(timeRange, previousTimeRange);

    return NextResponse.json({ kpis });
  } catch (err) {
    console.error("[analytics/kpi] Error:", err);
    return NextResponse.json(
      { error: "Failed to compute KPIs" },
      { status: 500 },
    );
  }
}
