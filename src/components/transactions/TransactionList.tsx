"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Pencil,
  Trash2,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format";
import Button from "@/components/ui/Button";
import CategoryBadge from "@/components/CategoryBadge";
import StatusPill from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import { Transaction, Category } from "@/types/transaction";

interface FilterState {
  search: string;
  type: string;
  categoryId: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  allTransactions: Transaction[];
  categories: Category[];
  currency: string;
  loading: boolean;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onCreate: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({
  transactions,
  allTransactions,
  categories,
  currency,
  loading,
  filters,
  onFilterChange,
  onCreate,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const paginated = transactions.slice(startIdx, startIdx + PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (safePage >= totalPages - 3)
      return [
        1,
        "…",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [1, "…", safePage - 1, safePage, safePage + 1, "…", totalPages];
  };

  const handleFilterUpdate = (newFilters: FilterState) => {
    onFilterChange(newFilters);
    setPage(1);
  };

  const handleTabChange = (newType: string) => {
    let nextCategoryId = filters.categoryId;

    if (newType !== "" && nextCategoryId) {
      const selectedCategory = categories.find((c) => c.id === nextCategoryId);
      if (selectedCategory && selectedCategory.type !== newType) {
        nextCategoryId = "";
      }
    }

    handleFilterUpdate({
      ...filters,
      type: newType,
      categoryId: nextCategoryId,
    });
  };

  const counts = useMemo(
    () => ({
      all: allTransactions.length,
      income: allTransactions.filter((t) => t.type === "income").length,
      expense: allTransactions.filter((t) => t.type === "expense").length,
    }),
    [allTransactions],
  );

  const filteredCategories = useMemo(() => {
    if (!filters.type) return categories;
    return categories.filter((c) => c.type === filters.type);
  }, [categories, filters.type]);

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
              handleFilterUpdate({ ...filters, search: e.target.value })
            }
            placeholder="Search description or notes..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full self-start lg:self-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value || "all"}
              onClick={() => handleTabChange(tab.value)}
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

        <div className="relative shrink-0">
          <select
            value={filters.categoryId}
            onChange={(e) =>
              handleFilterUpdate({ ...filters, categoryId: e.target.value })
            }
            className="px-4 py-2 pr-10 rounded-full border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer w-48 sm:w-52 truncate appearance-none"
          >
            <option
              value=""
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              All categories
            </option>
            {filteredCategories.map((c) => (
              <option
                key={c.id}
                value={c.id}
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
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
          action={<Button onClick={onCreate}>Add Transaction</Button>}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
  );
}
