"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TransactionForm from "@/components/transactions/TransactionForm";
import ToastContainer from "@/components/ui/ToastContainer";
import { showToast } from "@/lib/toast";
import TransactionTrendCard from "@/components/transactions/TransactionTrendCard";
import TransactionAIInsight from "@/components/transactions/TransactionAIInsight";
import TransactionList from "@/components/transactions/TransactionList";
import { Transaction, Category } from "@/types/transaction";

export default function TransactionsPage() {
  const { user } = useAuth();
  const currency = user?.currency || "USD";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [counts, setCounts] = useState({ all: 0, income: 0, expense: 0 });

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    categoryId: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>(undefined);
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.search && { search: filters.search }),
      });

      const [tRes, cRes] = await Promise.all([
        fetch(`/api/transactions?${params.toString()}`).then(async (res) => {
          if (!res.ok)
            throw new Error(`API Transactions Error (${res.status})`);
          return res.json();
        }),
        fetch("/api/categories").then(async (res) => {
          if (!res.ok) throw new Error(`API Categories Error (${res.status})`);
          return res.json();
        }),
      ]);

      setTransactions(tRes.data || []);
      setTotalItems(tRes.total || 0);
      setCounts(tRes.counts || { all: 0, income: 0, expense: 0 });
      setCategories(cRes.data || cRes || []);
    } catch (error) {
      console.error("Fetch Data Error Detail:", error);
      showToast("Failed to load transactions", "error");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Transactions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              All your income and expenses
            </p>
          </div>
          <div className="shrink-0 self-start sm:self-auto">
            <Button
              onClick={onCreate}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} /> Add Transaction
            </Button>
          </div>
        </div>

        <TransactionTrendCard currency={currency} />
        <TransactionAIInsight />

        <TransactionList
          transactions={transactions}
          categories={categories}
          currency={currency}
          loading={loading}
          filters={filters}
          counts={counts}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
          onCreate={onCreate}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Transaction" : "New Transaction"}
        >
          <TransactionForm
            initial={editing}
            categories={categories}
            onSaved={() => {
              setModalOpen(false);
              void fetchData();
            }}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      </div>
      <ToastContainer />
    </>
  );
}
