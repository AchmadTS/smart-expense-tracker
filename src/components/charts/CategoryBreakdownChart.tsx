"use client";

import { useState } from "react";
import { ResponsiveContainer, PieChart, Pie } from "recharts";
import { formatCurrency } from "@/utils/format";

const GRADIENTS = [
  { id: "cat-emerald", from: "#34D399", to: "#059669", solid: "#059669" },
  { id: "cat-teal", from: "#2DD4BF", to: "#0D9488", solid: "#0D9488" },
  { id: "cat-cyan", from: "#22D3EE", to: "#0891B2", solid: "#0891B2" },
  { id: "cat-mint", from: "#6EE7B7", to: "#10B981", solid: "#10B981" },
  { id: "cat-darkteal", from: "#14B8A6", to: "#0F766E", solid: "#0F766E" },
  { id: "cat-sage", from: "#A7F3D0", to: "#047857", solid: "#047857" },
  { id: "cat-slate", from: "#94a3b8", to: "#64748b", solid: "#64748b" },
];

export interface CategoryBreakdownData {
  category_name: string;
  total: number | string;
  color?: string;
}

interface CategoryBreakdownChartProps {
  data: CategoryBreakdownData[];
  currency?: string;
}

interface CustomizedLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
}

const renderCustomizedLabel = (props: CustomizedLabelProps) => {
  const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0 } = props;
  if (!percent || percent === 0) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#475569"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-[11px] font-semibold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function CategoryBreakdownChart({
  data,
  currency = "IDR",
}: CategoryBreakdownChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No expenses yet
      </div>
    );
  }

  const formatted = data.map((d, i) => {
    const g = GRADIENTS[i % GRADIENTS.length];
    return {
      name: d.category_name,
      value: Number(d.total) || 0,
      fill: d.category_name === "Lainnya" ? `url(#cat-slate)` : `url(#${g.id})`,
      solid: d.category_name === "Lainnya" ? "#64748b" : g.solid,
    };
  });

  const totalSum = formatted.reduce((acc, curr) => acc + curr.value, 0)
  const activeIdx = hoveredIndex !== null ? hoveredIndex : selectedIndex;
  const activeItem = activeIdx !== null ? formatted[activeIdx] : null;
  const displayTitle = activeItem ? activeItem.name : "Pengeluaran";
  const displayValue = activeItem ? activeItem.value : totalSum;

  return (
    <div className="w-full select-none" onClick={() => setSelectedIndex(null)}>
      <div className="relative h-56 w-full flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 z-10">
          <span className="text-xs font-medium text-slate-500 truncate max-w-30">
            {displayTitle}
          </span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-37.5">
            {formatCurrency(displayValue, currency)}
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
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
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
              label={renderCustomizedLabel}
              labelLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(_, index, e) => {
                e.stopPropagation();
                setSelectedIndex(index === selectedIndex ? null : index);
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div
        className="mt-2 space-y-2 max-h-40 overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {formatted.map((c, idx) => {
          const isSelected = selectedIndex === idx;
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={c.name}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() =>
                setSelectedIndex(selectedIndex === idx ? null : idx)
              }
              className={`flex items-center justify-between text-sm p-2 rounded-xl transition-colors cursor-pointer ${
                isSelected || isHovered
                  ? "bg-slate-100 font-semibold"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.solid }}
                />
                <span
                  className={`text-xs truncate ${isSelected || isHovered ? "text-slate-900 font-semibold" : "text-slate-700"}`}
                >
                  {c.name}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-900 shrink-0 ml-2">
                {formatCurrency(c.value, currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
