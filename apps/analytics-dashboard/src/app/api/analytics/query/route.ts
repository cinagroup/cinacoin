/**
 * POST /api/analytics/query
 *
 * Executes a metrics query and returns time-series aggregation results.
 */

import { NextRequest, NextResponse } from "next/server";
import { AnalyticsQueryEngine, type MetricsQuery } from "../../../lib/analytics.js";

// Shared engine instance (in production, use a real DB)
const engine = new AnalyticsQueryEngine();

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MetricsQuery;

    if (!body.timeRange?.from || !body.timeRange?.to) {
      return NextResponse.json(
        { error: "timeRange.from and timeRange.to are required" },
        { status: 400 },
      );
    }

    const results = engine.queryMetrics(body);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[analytics/query] Error:", err);
    return NextResponse.json(
      { error: "Failed to execute metrics query" },
      { status: 500 },
    );
  }
}
