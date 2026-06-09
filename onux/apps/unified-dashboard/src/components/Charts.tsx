"use client";

import { cn } from "@/lib/utils";
import type { TimeRange } from "./TimeRangeSelector";
import { useMetrics } from "@/providers/MetricsProvider";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Chart Card Wrapper ────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <div className={cn("cc-card p-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--cc-ink)]">{title}</h3>
          {subtitle && (
            <p className="text-xs text-[var(--cc-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Line Chart ────────────────────────────────────────────────────────

interface DashboardLineChartProps {
  title: string;
  subtitle?: string;
  dataKey: string;
  color?: string;
  timeRange: TimeRange;
  className?: string;
}

export function DashboardLineChart({
  title,
  subtitle,
  dataKey,
  color = "#3b82f6",
  timeRange,
  className,
}: DashboardLineChartProps) {
  const { getTimeSeriesData } = useMetrics();
  const data = getTimeSeriesData(dataKey, timeRange);

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cc-hairline)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "var(--cc-muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--cc-hairline)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--cc-muted)" }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--cc-canvas)",
                border: "1px solid var(--cc-hairline)",
                borderRadius: "var(--cc-radius-md)",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ─── Area Chart ────────────────────────────────────────────────────────

interface DashboardAreaChartProps {
  title: string;
  subtitle?: string;
  dataKey: string;
  color?: string;
  timeRange: TimeRange;
  className?: string;
}

export function DashboardAreaChart({
  title,
  subtitle,
  dataKey,
  color = "#3b82f6",
  timeRange,
  className,
}: DashboardAreaChartProps) {
  const { getTimeSeriesData } = useMetrics();
  const data = getTimeSeriesData(dataKey, timeRange);

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cc-hairline)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "var(--cc-muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--cc-hairline)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--cc-muted)" }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--cc-canvas)",
                border: "1px solid var(--cc-hairline)",
                borderRadius: "var(--cc-radius-md)",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ─── Bar Chart ─────────────────────────────────────────────────────────

interface DashboardBarChartProps {
  title: string;
  subtitle?: string;
  dataKey: string;
  color?: string;
  timeRange: TimeRange;
  className?: string;
}

export function DashboardBarChart({
  title,
  subtitle,
  dataKey,
  color = "#3b82f6",
  timeRange,
  className,
}: DashboardBarChartProps) {
  const { getTimeSeriesData } = useMetrics();
  const data = getTimeSeriesData(dataKey, timeRange);

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cc-hairline)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "var(--cc-muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--cc-hairline)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--cc-muted)" }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--cc-canvas)",
                border: "1px solid var(--cc-hairline)",
                borderRadius: "var(--cc-radius-md)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ─── Pie Chart ─────────────────────────────────────────────────────────

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface DashboardPieChartProps {
  title: string;
  subtitle?: string;
  data: PieDataItem[];
  className?: string;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function DashboardPieChart({
  title,
  subtitle,
  data,
  className,
}: DashboardPieChartProps) {
  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={data[index]?.color || PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--cc-canvas)",
                border: "1px solid var(--cc-hairline)",
                borderRadius: "var(--cc-radius-md)",
                fontSize: "12px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span style={{ color: "var(--cc-ink-soft)", fontSize: "12px" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
