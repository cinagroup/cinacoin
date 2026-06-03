/**
 * POST /api/funnel/analyze
 *
 * Run funnel analysis on on-ramp conversion events.
 * Returns stage-by-stage conversion rates and dropoff analysis.
 */
import { NextResponse } from "next/server";
import { AnalyticsEngine } from "../../../../lib/analytics";
const engine = new AnalyticsEngine();
export async function POST(req) {
    try {
        const body = (await req.json());
        if (!body.timeRange?.from || !body.timeRange?.to) {
            return NextResponse.json({ error: "timeRange.from and timeRange.to are required" }, { status: 400 });
        }
        const result = engine.analyzeFunnel(body);
        return NextResponse.json({ funnel: result });
    }
    catch (err) {
        console.error("[funnel/analyze] Error:", err);
        return NextResponse.json({ error: "Failed to analyze funnel" }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map