/**
 * POST /api/analytics/kpi
 *
 * Computes dashboard KPIs for a given time range with period-over-period comparison.
 */
import { NextRequest, NextResponse } from "next/server";
export declare function POST(req: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    kpis: import("../../../../lib/analytics").DashboardKPIs;
}>>;
//# sourceMappingURL=route.d.ts.map