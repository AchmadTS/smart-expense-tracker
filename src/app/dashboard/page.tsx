import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Target,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format";
import KpiCard from "@/components/KpiCard";
import CategoryBadge from "@/components/CategoryBadge";
import MonthlyTrendChart from "@/components/charts/MonthlyTrendChart";
import CategoryBreakdownChart from "@/components/charts/CategoryBreakdownChart";
import { redirect } from "next/navigation";
import { getUserFromSession } from "@/services/auth";
import { getDashboardData } from "@/services/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const currency = (user as { currency?: string | null }).currency || "IDR";
  const data = await getDashboardData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          An overview of your finances this month
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Balance"
          value={formatCurrency(data.summary.balance, currency)}
          icon={Wallet}
          accent="emerald"
        />
        <KpiCard
          label="Income"
          value={formatCurrency(data.summary.incomeThisMonth, currency)}
          delta={data.summary.incomeDelta}
          icon={TrendingUp}
          accent="orange"
        />
        <KpiCard
          label="Expenses"
          value={formatCurrency(data.summary.expenseThisMonth, currency)}
          delta={data.summary.expenseDelta}
          icon={TrendingDown}
          accent="rose"
        />
        <KpiCard
          label="Savings Rate"
          value={`${data.summary.savingsRate.toFixed(2)}%`}
          icon={PiggyBank}
          accent="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 transition-colors">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Monthly Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Income vs expenses, last 6 months
            </p>
          </div>
          <MonthlyTrendChart data={data.monthlyTrendData} currency={currency} />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 transition-colors">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Top Categories
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Spending this month
            </p>
          </div>
          <CategoryBreakdownChart
            data={data.categoryBreakdownData}
            currency={currency}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 transition-colors">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recent Transactions
            </h2>
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-1">
              {data.recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryBadge
                      icon={t.categoryIcon || ""}
                      color={t.categoryColor || ""}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {t.description || t.categoryName || "Untitled"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t.categoryName || "Uncategorized"} ·{" "}
                        {formatDate(t.createdAt || t.transactionDate)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      t.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-orange-500 dark:text-orange-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 transition-colors">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Budget Status
            </h2>
            <Link
              href="/dashboard/budgets"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {data.userBudgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Target size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                No budgets yet
              </p>
              <Link
                href="/dashboard/budgets"
                className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                Create one →
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {formatCurrency(data.totalSpent, currency)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      of {formatCurrency(data.totalBudget, currency)} total
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-sm font-bold"
                      style={{ color: data.aggColor }}
                    >
                      {data.aggPct.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      used
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(data.aggPct, 100)}%`,
                      backgroundColor: data.aggColor,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {" "}
                {data.userBudgets.slice(0, 4).map((b) => {
                  const spent = parseFloat(b.spent || "0");
                  const total = parseFloat(b.amount || "0");
                  const pct =
                    total > 0 ? Math.min((spent / total) * 100, 100) : 0;
                  const color =
                    pct >= 100 ? "#F43F5E" : pct >= 70 ? "#F59E0B" : "#10B981";

                  return (
                    <div key={b.id} className="group">
                      {" "}
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                          {b.categoryName}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 shrink-0 ml-2 text-[11px]">
                          {formatCurrency(spent, currency)} /{" "}
                          {formatCurrency(total, currency)}
                        </span>
                      </div>
                      <div className="relative h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full transition-all duration-300 group-hover:h-3">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-bold text-white shadow-sm pointer-events-none">
                          {pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
