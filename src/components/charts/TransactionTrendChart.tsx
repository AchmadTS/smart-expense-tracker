"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/utils/format";

interface ChartData {
  label: string;
  income: number;
  expense: number;
  key?: string;
}

interface TransactionTrendChartProps {
  data: ChartData[];
  currency: string;
  interval?: number;
}

export default function TransactionTrendChart({
  data,
  currency,
  interval = 3,
}: TransactionTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No data yet
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-100 dark:stroke-slate-800"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={interval}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "#64748b", strokeDasharray: "3 3" }}
            contentStyle={{
              backgroundColor: "#0f172a",
              borderRadius: 12,
              border: "1px solid #334155",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              fontSize: 12,
              color: "#f8fafc",
            }}
            itemStyle={{
              color: "#f8fafc",
              fontWeight: 600,
            }}
            formatter={(value) =>
              formatCurrency(Number(value as number) || 0, currency)
            }
          />
          <Area
            name="Income"
            type="monotone"
            dataKey="income"
            stroke="#10B981"
            strokeWidth={2.5}
            fill="url(#incomeArea)"
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Area
            name="Expense"
            type="monotone"
            dataKey="expense"
            stroke="#F43F5E"
            strokeWidth={2.5}
            fill="url(#expenseArea)"
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
