"use client";

import { useState, useMemo } from "react";
import TransactionTrendChart from "@/components/charts/TransactionTrendChart";
import { Transaction } from "@/types/transaction";

interface TransactionTrendCardProps {
  allTransactions: Transaction[];
  currency: string;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function TransactionTrendCard({
  allTransactions,
  currency,
}: TransactionTrendCardProps) {
  const [timeRange, setTimeRange] = useState("monthly");

  const trendData = useMemo(() => {
    const now = new Date();
    const txnKey = (t: Transaction) => (t.transaction_date || "").split("T")[0];
    const addAmount = (
      entry: { income: number; expense: number },
      t: Transaction,
    ) => {
      const amount = parseFloat(String(t.amount));
      if (t.type === "income") entry.income += amount;
      else if (t.type === "expense") entry.expense += amount;
    };

    if (timeRange === "30d" || timeRange === "3m") {
      const totalDays = timeRange === "30d" ? 30 : 90;
      const buckets = [];
      for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - i,
        );
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        buckets.push({ key, label, income: 0, expense: 0 });
      }
      const map = new Map(buckets.map((b) => [b.key, b]));
      allTransactions.forEach((t) => {
        const entry = map.get(txnKey(t));
        if (entry) addAmount(entry, t);
      });
      return buckets;
    }

    if (timeRange === "monthly") {
      const buckets = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
        buckets.push({ key, label, income: 0, expense: 0 });
      }
      const map = new Map(buckets.map((b) => [b.key, b]));
      allTransactions.forEach((t) => {
        const parts = txnKey(t).split("-");
        if (parts.length >= 2) {
          const entry = map.get(`${parts[0]}-${parts[1]}`);
          if (entry) addAmount(entry, t);
        }
      });
      return buckets;
    }

    if (timeRange === "yearly") {
      const buckets = [];
      for (let i = 4; i >= 0; i--) {
        const y = String(now.getFullYear() - i);
        buckets.push({ key: y, label: y, income: 0, expense: 0 });
      }
      const map = new Map(buckets.map((b) => [b.key, b]));
      allTransactions.forEach((t) => {
        const year = txnKey(t).split("-")[0];
        const entry = map.get(year);
        if (entry) addAmount(entry, t);
      });
      return buckets;
    }

    return [];
  }, [allTransactions, timeRange]);

  const chartInterval = timeRange === "30d" ? 3 : timeRange === "3m" ? 10 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs transition-colors">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Transaction Trend
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Income vs expenses over time
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full shrink-0">
          {[
            { value: "30d", label: "30D" },
            { value: "3m", label: "3M" },
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                timeRange === r.value
                  ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <TransactionTrendChart
        data={trendData}
        currency={currency}
        interval={chartInterval}
      />
    </div>
  );
}
