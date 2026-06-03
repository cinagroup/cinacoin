/**
 * POST /api/analytics/query
 *
 * Executes a metrics query and returns time-series aggregation results.
 */
import { NextResponse } from "next/server";
import { AnalyticsEngine } from "../../../../lib/analytics";
// Shared engine instance (in production, use a real DB)
const engine = new AnalyticsEngine();
export async function POST(req) {
    try {
        const body = (await req.json());
        if (!body.timeRange?.from || !body.timeRange?.to) {
            return NextResponse.json({ error: "timeRange.from and timeRange.to are required" }, { status: 400 });
        }
        const results = engine.query(body);
        return NextResponse.json({ results });
    }
    catch (err) {
        console.error("[analytics/query] Error:", err);
        return NextResponse.json({ error: "Failed to execute metrics query" }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map