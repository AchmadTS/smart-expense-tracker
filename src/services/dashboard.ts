import { db } from "@/lib/db";
import { transactions, budgets, categories } from "@/schemas/schema";
import { desc, eq, and, sum, sql } from "drizzle-orm";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function getDashboardData(userId: string) {
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

    const recentTransactions = rawTransactions.map((t) => ({
        ...t,
        categoryName: t.categoryName || "General",
        categoryIcon: t.categoryIcon || "wallet",
        categoryColor: t.categoryColor || "#059669",
    }));

    const [incomeCurrentRes] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.type, "income"), sql`${transactions.transactionDate} >= ${currentMonthStart}`, sql`${transactions.transactionDate} <= ${currentMonthEnd}`));

    const [expenseCurrentRes] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.type, "expense"), sql`${transactions.transactionDate} >= ${currentMonthStart}`, sql`${transactions.transactionDate} <= ${currentMonthEnd}`));

    const [incomeLastRes] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.type, "income"), sql`${transactions.transactionDate} >= ${lastMonthStart}`, sql`${transactions.transactionDate} <= ${lastMonthEnd}`));

    const [expenseLastRes] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.type, "expense"), sql`${transactions.transactionDate} >= ${lastMonthStart}`, sql`${transactions.transactionDate} <= ${lastMonthEnd}`));

    const incomeThisMonth = parseFloat(incomeCurrentRes?.total || "0");
    const expenseThisMonth = parseFloat(expenseCurrentRes?.total || "0");
    const incomeLastMonth = parseFloat(incomeLastRes?.total || "0");
    const expenseLastMonth = parseFloat(expenseLastRes?.total || "0");
    const balance = incomeThisMonth - expenseThisMonth;
    const savingsRate = incomeThisMonth > 0 ? ((incomeThisMonth - expenseThisMonth) / incomeThisMonth) * 100 : 0;

    const incomeDelta = incomeLastMonth > 0 ? Math.round(((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100) : incomeThisMonth > 0 ? 100 : 0;
    const expenseDelta = expenseLastMonth > 0 ? Math.round(((expenseThisMonth - expenseLastMonth) / expenseLastMonth) * 100) : expenseThisMonth > 0 ? 100 : 0;

    const summary = {
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
        .select({ amount: transactions.amount, type: transactions.type, transactionDate: transactions.transactionDate })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), sql`${transactions.transactionDate} >= ${sixMonthsAgo}`));

    trendTransactions.forEach((t) => {
        const monthStr = (t.transactionDate as string).substring(0, 7);
        const bucket = monthlyBuckets.find((m) => m.month === monthStr);
        if (bucket) {
            if (t.type === "income") bucket.income += parseFloat(t.amount);
            if (t.type === "expense") bucket.expense += parseFloat(t.amount);
        }
    });

    const categoryExpensesRaw = await db
        .select({ categoryId: transactions.categoryId, categoryName: categories.name, categoryColor: categories.color, totalSpent: sum(transactions.amount) })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(eq(transactions.userId, userId), eq(transactions.type, "expense"), sql`${transactions.transactionDate} >= ${currentMonthStart}`, sql`${transactions.transactionDate} <= ${currentMonthEnd}`))
        .groupBy(transactions.categoryId, categories.name, categories.color);

    const mappedCategories = categoryExpensesRaw
        .map((item) => ({ category_name: item.categoryName || "Lainnya", total: parseFloat(item.totalSpent || "0"), color: item.categoryColor || "#94a3b8" }))
        .sort((a, b) => b.total - a.total);

    let categoryBreakdownData = mappedCategories;
    if (mappedCategories.length > 5) {
        const top5 = mappedCategories.slice(0, 5);
        const otherTotal = mappedCategories.slice(5).reduce((sum, item) => sum + item.total, 0);
        categoryBreakdownData = [...top5, { category_name: "Lainnya", total: otherTotal, color: "#94a3b8" }];
    }

    const expenseMap = new Map(categoryExpensesRaw.map((item) => [item.categoryId, item.totalSpent || "0"]));
    const rawBudgets = await db
        .select({ id: budgets.id, categoryId: budgets.categoryId, categoryName: categories.name, amount: budgets.amount })
        .from(budgets)
        .leftJoin(categories, eq(budgets.categoryId, categories.id))
        .where(eq(budgets.userId, userId));

    const userBudgets = rawBudgets.map((b) => ({
        id: b.id,
        categoryName: b.categoryName || "Category",
        amount: b.amount,
        spent: expenseMap.get(b.categoryId) || "0",
    }));

    const totalSpent = userBudgets.reduce((sumVal, b) => sumVal + parseFloat(b.spent || "0"), 0);
    const totalBudget = userBudgets.reduce((sumVal, b) => sumVal + parseFloat(b.amount || "0"), 0);
    const aggPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const aggColor = aggPct >= 100 ? "#F43F5E" : aggPct >= 70 ? "#F59E0B" : "#10B981";

    return {
        recentTransactions,
        summary,
        monthlyTrendData: monthlyBuckets,
        categoryBreakdownData,
        userBudgets,
        totalSpent,
        totalBudget,
        aggPct,
        aggColor,
    };
}