"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatCurrency } from "@/utils/format";

const GRADIENTS = [
  { id: "cat-emerald", from: "#34D399", to: "#059669", solid: "#059669" },
  { id: "cat-teal", from: "#2DD4BF", to: "#0D9488", solid: "#0D9488" },
  { id: "cat-cyan", from: "#22D3EE", to: "#0891B2", solid: "#0891B2" },
  { id: "cat-mint", from: "#6EE7B7", to: "#10B981", solid: "#10B981" },
  { id: "cat-darkteal", from: "#14B8A6", to: "#0F766E", solid: "#0F766E" },
  { id: "cat-sage", from: "#A7F3D0", to: "#047857", solid: "#047857" },
];

export interface CategoryBreakdownData {
  category_name: string;
  total: number | string;
}

interface CategoryBreakdownChartProps {
  data: CategoryBreakdownData[];
  currency?: string;
}

export default function CategoryBreakdownChart({
  data,
  currency = "IDR",
}: CategoryBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No expenses yet
      </div>
    );
  }

  const top = data.slice(0, 5);
  const formatted = top.map((d, i) => {
    const g = GRADIENTS[i % GRADIENTS.length];
    return {
      name: d.category_name,
      value: Number(d.total) || 0,
      gradientId: g.id,
      solid: g.solid,
    };
  });

  return (
    <div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {GRADIENTS.map((g) => (
                <linearGradient
                  key={g.id}
                  id={g.id}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={g.from} />
                  <stop offset="100%" stopColor={g.to} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={formatted}
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {formatted.map((entry) => (
                <Cell key={entry.name} fill={`url(#${entry.gradientId})`} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 12px rgba(107, 114, 128, 0.15)",
                fontSize: 12,
              }}
              formatter={(value) => {
                if (value === undefined || value === null) return [""];
                const numericValue = Array.isArray(value)
                  ? Number(value[0])
                  : Number(value);
                return [formatCurrency(numericValue, currency)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-2">
        {formatted.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: c.solid }}
              />
              <span className="text-xs text-slate-700 truncate">{c.name}</span>
            </div>
            <span className="text-xs font-medium text-slate-900 shrink-0 ml-2">
              {formatCurrency(c.value, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
