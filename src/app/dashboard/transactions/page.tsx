"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Wallet,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate } from "@/utils/format";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CategoryBadge from "@/components/CategoryBadge";
import StatusPill from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionTrendChart from "@/components/charts/TransactionTrendChart";
import { showToast } from "@/lib/toast";
import ToastContainer from "@/components/ui/ToastContainer";

interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number | string;
  category_id?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  description?: string;
  notes?: string;
  transaction_date?: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface AnalysisData {
  highlight?: string;
  insight: string;
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

export default function TransactionsPage() {
  const { user } = useAuth();
  const currency = user?.currency || "USD";
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    categoryId: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>(undefined);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("monthly");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        fetch("/api/transactions?limit=2000").then(async (res) => {
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(
              `API Transactions Error (${res.status}): ${errText}`,
            );
          }
          return res.json();
        }),
        fetch("/api/categories").then(async (res) => {
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API Categories Error (${res.status}): ${errText}`);
          }
          return res.json();
        }),
      ]);
      setAllTransactions(tRes.data || tRes || []);
      setCategories(cRes.data || cRes || []);
    } catch (error) {
      console.error("Fetch Data Error Detail:", error);
      showToast("Failed to load transactions. Check console.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const transactions = useMemo(
    () =>
      filters.type
        ? allTransactions.filter((t) => t.type === filters.type)
        : allTransactions,
    [allTransactions, filters.type],
  );

  const counts = useMemo(
    () => ({
      all: allTransactions.length,
      income: allTransactions.filter((t) => t.type === "income").length,
      expense: allTransactions.filter((t) => t.type === "expense").length,
    }),
    [allTransactions],
  );

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
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const paginated = transactions.slice(startIdx, startIdx + PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (safePage >= totalPages - 3) {
      return [
        1,
        "…",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, "…", safePage - 1, safePage, safePage + 1, "…", totalPages];
  };

  const onEdit = (t: Transaction) => {
    setEditing(t);
    setModalOpen(true);
  };
  const onCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };
  const onDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Transaction deleted", "success");
      await fetchData();
    } catch {
      showToast("Failed to delete", "error");
    }
  };
  const onSaved = () => {
    setModalOpen(false);
    void fetchData();
  };

  const generateInsight = async () => {
    if (transactions.length === 0) {
      showToast("No transactions in view to analyze", "info");
      return;
    }
    setAnalysisLoading(true);
    try {
      const ids = transactions.slice(0, 50).map((t) => t.id);
      const res = await fetch("/api/transactions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to analyze");
      setAnalysis(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze";
      showToast(message, "error");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const tabs = [
    {
      value: "",
      label: "All",
      count: counts.all,
      badge:
        "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    },
    {
      value: "income",
      label: "Income",
      count: counts.income,
      badge:
        "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
    },
    {
      value: "expense",
      label: "Expense",
      count: counts.expense,
      badge: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400",
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Transactions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              All your income and expenses
            </p>
          </div>
          <Button onClick={onCreate}>
            <Plus size={16} /> Add Transaction
          </Button>
        </div>

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

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-colors">
          {!analysis ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/20">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    AI Spending Insight
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    Get a quick analysis of the {transactions.length}{" "}
                    transaction
                    {transactions.length !== 1 ? "s" : ""} in this view
                  </p>
                </div>
              </div>
              <Button
                onClick={generateInsight}
                disabled={analysisLoading || transactions.length === 0}
                size="sm"
              >
                {analysisLoading ? (
                  <>
                    <Spinner size="sm" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/20">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    AI Spending Insight
                  </h3>
                  {analysis.highlight && (
                    <span className="inline-flex items-center bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {analysis.highlight}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {analysis.insight}
                </p>
                <button
                  onClick={generateInsight}
                  disabled={analysisLoading}
                  className="mt-3 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 disabled:opacity-50 cursor-pointer"
                >
                  {analysisLoading ? "Re-analyzing..." : "Re-analyze"}
                </button>
              </div>
              <button
                onClick={() => setAnalysis(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 p-1 cursor-pointer"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={filters.search}
                onChange={(e) =>
                  handleFilterChange({ ...filters, search: e.target.value })
                }
                placeholder="Search description or notes..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full self-start lg:self-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.value || "all"}
                  onClick={() =>
                    handleFilterChange({ ...filters, type: tab.value })
                  }
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-2 cursor-pointer ${
                    filters.type === tab.value
                      ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab.badge}`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <select
              value={filters.categoryId}
              onChange={(e) =>
                handleFilterChange({ ...filters, categoryId: e.target.value })
              }
              className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No transactions"
              description="Try adjusting filters, or add a new transaction."
              action={
                <Button onClick={onCreate}>
                  <Plus size={16} /> Add Transaction
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-4 pr-4">Category</th>
                    <th className="pb-4 pr-4">Description</th>
                    <th className="pb-4 pr-4">Date</th>
                    <th className="pb-4 pr-4">Type</th>
                    <th className="pb-4 pr-4 text-right">Amount</th>
                    <th className="pb-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="py-4 pr-4">
                        <CategoryBadge
                          name={t.category_name || "Uncategorized"}
                          icon={t.category_icon}
                          color={t.category_color}
                          size="sm"
                        />
                      </td>
                      <td className="py-4 pr-4 text-sm text-slate-700 dark:text-slate-300">
                        {t.description || "—"}
                      </td>
                      <td className="py-4 pr-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(t.transaction_date)}
                      </td>
                      <td className="py-4 pr-4">
                        <StatusPill
                          variant={t.type === "income" ? "income" : "expense"}
                        >
                          {t.type}
                        </StatusPill>
                      </td>
                      <td
                        className={`py-4 pr-4 text-sm font-semibold text-right whitespace-nowrap ${
                          t.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatCurrency(t.amount, currency)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(t)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(t.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-500 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {startIdx + 1}–
                      {Math.min(startIdx + PAGE_SIZE, transactions.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {transactions.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {getPageNumbers().map((p, i) =>
                      p === "…" ? (
                        <span
                          key={`gap-${i}`}
                          className="px-1.5 text-slate-400 text-sm"
                        >
                          {p}
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`h-8 min-w-8 px-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                            safePage === p
                              ? "bg-teal-600 text-white shadow-sm shadow-teal-500/30"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={safePage === totalPages}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Transaction" : "New Transaction"}
        >
          <TransactionForm
            initial={editing}
            categories={categories}
            onSaved={onSaved}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      </div>
      <ToastContainer />
    </>
  );
}
