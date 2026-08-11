"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        fetch("/api/transactions?limit=2000").then(async (res) => {
          if (!res.ok)
            throw new Error(`API Transactions Error (${res.status})`);
          return res.json();
        }),
        fetch("/api/categories").then(async (res) => {
          if (!res.ok) throw new Error(`API Categories Error (${res.status})`);
          return res.json();
        }),
      ]);
      setAllTransactions(tRes.data || tRes || []);
      setCategories(cRes.data || cRes || []);
    } catch (error) {
      console.error("Fetch Data Error Detail:", error);
      showToast("Failed to load transactions", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (filters.type && t.type !== filters.type) return false;
      if (filters.categoryId && t.category_id !== filters.categoryId)
        return false;
      if (
        filters.search &&
        !t.description?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !t.notes?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [allTransactions, filters]);

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

        <TransactionTrendCard
          allTransactions={allTransactions}
          currency={currency}
        />

        <TransactionAIInsight transactions={filteredTransactions} />

        <TransactionList
          transactions={filteredTransactions}
          allTransactions={allTransactions}
          categories={categories}
          currency={currency}
          loading={loading}
          filters={filters}
          onFilterChange={setFilters}
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
