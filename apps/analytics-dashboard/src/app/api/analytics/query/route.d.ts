/**
 * POST /api/analytics/query
 *
 * Executes a metrics query and returns time-series aggregation results.
 */
import { NextRequest, NextResponse } from "next/server";
export declare function POST(req: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    results: import("../../../../lib/analytics").TimeSeriesResult[];
}>>;
//# sourceMappingURL=route.d.ts.map