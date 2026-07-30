"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatMonth, formatCurrency } from "@/utils/format";

export interface MonthlyTrendData {
  month: string;
  income: number | string;
  expense: number | string;
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
  currency?: string;
}

export default function MonthlyTrendChart({
  data,
  currency = "IDR",
}: MonthlyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No data yet
      </div>
    );
  }

  const formatted = data.map((d) => ({
    month: formatMonth(d.month),
    income: Number(d.income) || 0,
    expense: Number(d.expense) || 0,
  }));

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto pb-2 no-scrollbar [-webkit-overflow-scrolling:touch]">
        <div className="h-72 min-w-140 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} barCategoryGap="30%" barGap={6}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2DD4BF" />
                  <stop offset="100%" stopColor="#0D9488" />
                </linearGradient>
                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#FB7185" />
                  <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={96}
                tickFormatter={(value: number) =>
                  formatCurrency(value, currency)
                }
              />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                  fontSize: "12px",
                  color: "#0f172a",
                }}
                itemStyle={{
                  color: "#334155",
                  fontWeight: 600,
                }}
                formatter={(value) => {
                  if (value === undefined || value === null) return [""];
                  const numericValue = Array.isArray(value)
                    ? Number(value[0])
                    : Number(value);
                  return [formatCurrency(numericValue, currency)];
                }}
              />
              <Bar
                dataKey="income"
                name="Pemasukan"
                fill="url(#incomeGradient)"
                radius={[10, 10, 10, 10]}
                background={{ fill: "#f8fafc" }}
              />
              <Bar
                dataKey="expense"
                name="Pengeluaran"
                fill="url(#expenseGradient)"
                radius={[10, 10, 10, 10]}
                background={{ fill: "#f8fafc" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pt-3 text-xs font-medium border-t border-slate-100 mt-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-600 shrink-0" />
          <span className="text-slate-600">Pemasukan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600 shrink-0" />
          <span className="text-slate-600">Pengeluaran</span>
        </div>
      </div>
    </div>
  );
}
