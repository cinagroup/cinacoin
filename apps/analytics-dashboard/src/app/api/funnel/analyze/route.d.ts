/**
 * POST /api/funnel/analyze
 *
 * Run funnel analysis on on-ramp conversion events.
 * Returns stage-by-stage conversion rates and dropoff analysis.
 */
import { NextRequest, NextResponse } from "next/server";
export declare function POST(req: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    funnel: import("../../../../lib/analytics").FunnelResult;
}>>;
//# sourceMappingURL=route.d.ts.map