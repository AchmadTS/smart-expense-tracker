import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Target,
} from "lucide-react";
import { db } from "@/lib/db";
import { transactions, budgets, categories } from "@/schemas/schema";
import { desc, eq, and, sum, sql } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/utils/format";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import KpiCard from "@/components/KpiCard";
import CategoryBadge from "@/components/CategoryBadge";
import MonthlyTrendChart from "@/components/charts/MonthlyTrendChart";
import CategoryBreakdownChart from "@/components/charts/CategoryBreakdownChart";
import { DashboardTransaction, DashboardBudget } from "@/types/dashboard";
import { redirect } from "next/navigation";
import { getUserFromSession } from "@/services/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getUserFromSession();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const currency = (user as { currency?: string | null }).currency || "IDR";

  let recentTransactions: DashboardTransaction[] = [];
  let userBudgets: DashboardBudget[] = [];
  let monthlyTrendData: { month: string; income: number; expense: number }[] =
    [];

  let categoryBreakdownData: {
    category_name: string;
    total: number;
    color: string;
  }[] = [];

  let summary = {
    balance: 0,
    incomeThisMonth: 0,
    expenseThisMonth: 0,
    incomeDelta: 0,
    expenseDelta: 0,
    savingsRate: 0,
  };

  try {
    const now = new Date();
    const currentMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const currentMonthEnd = format(endOfMonth(now), "yyyy-MM-dd");
    const lastMonth = subMonths(now, 1);
    const lastMonthStart = format(startOfMonth(lastMonth), "yyyy-MM-dd");
    const lastMonthEnd = format(endOfMonth(lastMonth), "yyyy-MM-dd");
    const rawTransactions = await db
      .select({
        id: transactions.id,
        description: transactions.description,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        createdAt: transactions.createdAt,
        transactionDate: transactions.transactionDate,
        type: transactions.type,
        amount: transactions.amount,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(5);

    recentTransactions = rawTransactions.map((t) => ({
      ...t,
      categoryName: t.categoryName || "General",
      categoryIcon: t.categoryIcon || "wallet",
      categoryColor: t.categoryColor || "#059669",
    }));

    const [incomeCurrentRes] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "income"),
          sql`${transactions.transactionDate} >= ${currentMonthStart}`,
          sql`${transactions.transactionDate} <= ${currentMonthEnd}`,
        ),
      );

    const [expenseCurrentRes] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          sql`${transactions.transactionDate} >= ${currentMonthStart}`,
          sql`${transactions.transactionDate} <= ${currentMonthEnd}`,
        ),
      );

    const [incomeLastRes] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "income"),
          sql`${transactions.transactionDate} >= ${lastMonthStart}`,
          sql`${transactions.transactionDate} <= ${lastMonthEnd}`,
        ),
      );

    const [expenseLastRes] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          sql`${transactions.transactionDate} >= ${lastMonthStart}`,
          sql`${transactions.transactionDate} <= ${lastMonthEnd}`,
        ),
      );

    const incomeThisMonth = parseFloat(incomeCurrentRes?.total || "0");
    const expenseThisMonth = parseFloat(expenseCurrentRes?.total || "0");
    const incomeLastMonth = parseFloat(incomeLastRes?.total || "0");
    const expenseLastMonth = parseFloat(expenseLastRes?.total || "0");
    const balance = incomeThisMonth - expenseThisMonth;
    const savingsRate =
      incomeThisMonth > 0
        ? ((incomeThisMonth - expenseThisMonth) / incomeThisMonth) * 100
        : 0;

    const incomeDelta =
      incomeLastMonth > 0
        ? Math.round(
            ((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100,
          )
        : incomeThisMonth > 0
          ? 100
          : 0;

    const expenseDelta =
      expenseLastMonth > 0
        ? Math.round(
            ((expenseThisMonth - expenseLastMonth) / expenseLastMonth) * 100,
          )
        : expenseThisMonth > 0
          ? 100
          : 0;

    summary = {
      balance,
      incomeThisMonth,
      expenseThisMonth,
      incomeDelta,
      expenseDelta,
      savingsRate: Math.max(savingsRate, 0),
    };

    const sixMonthsAgo = format(subMonths(now, 5), "yyyy-MM-01");
    const monthlyBuckets = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(now, 5 - i);
      return { month: format(d, "yyyy-MM"), income: 0, expense: 0 };
    });

    const trendTransactions = await db
      .select({
        amount: transactions.amount,
        type: transactions.type,
        transactionDate: transactions.transactionDate,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`${transactions.transactionDate} >= ${sixMonthsAgo}`,
        ),
      );

    trendTransactions.forEach((t) => {
      const monthStr = (t.transactionDate as string).substring(0, 7);
      const bucket = monthlyBuckets.find((m) => m.month === monthStr);
      if (bucket) {
        if (t.type === "income") bucket.income += parseFloat(t.amount);
        if (t.type === "expense") bucket.expense += parseFloat(t.amount);
      }
    });

    monthlyTrendData = monthlyBuckets;

    const categoryExpensesRaw = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        totalSpent: sum(transactions.amount),
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          sql`${transactions.transactionDate} >= ${currentMonthStart}`,
          sql`${transactions.transactionDate} <= ${currentMonthEnd}`,
        ),
      )
      .groupBy(transactions.categoryId, categories.name, categories.color);

    const mappedCategories = categoryExpensesRaw
      .map((item) => ({
        category_name: item.categoryName || "Lainnya",
        total: parseFloat(item.totalSpent || "0"),
        color: item.categoryColor || "#94a3b8",
      }))
      .sort((a, b) => b.total - a.total);

    if (mappedCategories.length <= 5) {
      categoryBreakdownData = mappedCategories;
    } else {
      const top5 = mappedCategories.slice(0, 5);
      const others = mappedCategories.slice(5);
      const otherTotal = others.reduce((sum, item) => sum + item.total, 0);

      categoryBreakdownData = [
        ...top5,
        {
          category_name: "Lainnya",
          total: otherTotal,
          color: "#94a3b8",
        },
      ];
    }

    const expenseMap = new Map(
      categoryExpensesRaw.map((item) => [
        item.categoryId,
        item.totalSpent || "0",
      ]),
    );

    const rawBudgets = await db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        categoryName: categories.name,
        amount: budgets.amount,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.userId, userId));

    userBudgets = rawBudgets.map((b) => ({
      id: b.id,
      categoryName: b.categoryName || "Category",
      amount: b.amount,
      spent: expenseMap.get(b.categoryId) || "0",
    }));
  } catch (error) {
    console.error("Database query error:", error);
  }

  const totalSpent = userBudgets.reduce(
    (sumVal, b) => sumVal + parseFloat(b.spent || "0"),
    0,
  );
  const totalBudget = userBudgets.reduce(
    (sumVal, b) => sumVal + parseFloat(b.amount || "0"),
    0,
  );
  const aggPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const aggColor =
    aggPct >= 100 ? "#F43F5E" : aggPct >= 70 ? "#F59E0B" : "#10B981";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          An overview of your finances this month
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Balance"
          value={formatCurrency(summary.balance, currency)}
          icon={Wallet}
          accent="emerald"
        />
        <KpiCard
          label="Income"
          value={formatCurrency(summary.incomeThisMonth, currency)}
          delta={summary.incomeDelta}
          icon={TrendingUp}
          accent="orange"
        />
        <KpiCard
          label="Expenses"
          value={formatCurrency(summary.expenseThisMonth, currency)}
          delta={summary.expenseDelta}
          icon={TrendingDown}
          accent="rose"
        />
        <KpiCard
          label="Savings Rate"
          value={`${summary.savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          accent="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Monthly Trend
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Income vs expenses, last 6 months
            </p>
          </div>
          <MonthlyTrendChart data={monthlyTrendData} currency={currency} />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Top Categories
            </h2>
            <p className="text-xs text-slate-500 mt-1">Spending this month</p>
          </div>
          <CategoryBreakdownChart
            data={categoryBreakdownData}
            currency={currency}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Transactions
            </h2>
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryBadge
                      icon={t.categoryIcon || ""}
                      color={t.categoryColor || ""}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {t.description || t.categoryName || "Untitled"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t.categoryName || "Uncategorized"} ·{" "}
                        {formatDate(t.createdAt || t.transactionDate)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      t.type === "income"
                        ? "text-emerald-600"
                        : "text-orange-500"
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

        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Budget Status
            </h2>
            <Link
              href="/dashboard/budgets"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          {userBudgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Target size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-900 mb-1">
                No budgets yet
              </p>
              <Link
                href="/dashboard/budgets"
                className="text-xs text-emerald-600 font-medium hover:text-emerald-700"
              >
                Create one →
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900">
                      {formatCurrency(totalSpent, currency)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      of {formatCurrency(totalBudget, currency)} total
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-sm font-bold"
                      style={{ color: aggColor }}
                    >
                      {aggPct.toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-slate-500">used</div>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(aggPct, 100)}%`,
                      backgroundColor: aggColor,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {userBudgets.slice(0, 4).map((b) => {
                  const spent = parseFloat(b.spent || "0");
                  const total = parseFloat(b.amount || "0");
                  const pct =
                    total > 0 ? Math.min((spent / total) * 100, 100) : 0;
                  const color =
                    pct >= 100 ? "#F43F5E" : pct >= 70 ? "#F59E0B" : "#10B981";
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-700 font-medium truncate">
                          {b.categoryName}
                        </span>
                        <span className="text-slate-500 shrink-0 ml-2 text-[11px]">
                          {formatCurrency(spent, currency)} /{" "}
                          {formatCurrency(total, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
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
