"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { transactionSchema, TransactionFormData } from "@/schemas/transaction";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

interface TransactionFormProps {
  initial?: {
    id?: string;
    type?: "income" | "expense" | "transfer";
    amount?: number | string;
    category_id?: string;
    description?: string;
    notes?: string;
    transaction_date?: string;
  };
  categories: Array<{ id: string; name: string; type: string }>;
  onSaved: () => void;
  onCancel: () => void;
}

export default function TransactionForm({
  initial,
  categories,
  onSaved,
  onCancel,
}: TransactionFormProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initial?.type || "expense",
      amount: initial?.amount ?? "",
      categoryId: initial?.category_id || "",
      description: initial?.description || "",
      notes: initial?.notes || "",
      transactionDate:
        initial?.transaction_date?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
    },
  });

  const currentType = useWatch({
    control,
    name: "type",
  });

  const filteredCategories = categories.filter((c) => c.type === currentType);
  const onSubmit = async (data: TransactionFormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        amount: Number(data.amount),
        categoryId: data.categoryId || null,
        description: data.description || null,
        notes: data.notes || null,
      };

      const url = initial?.id
        ? `/api/transactions/${initial.id}`
        : "/api/transactions";
      const method = initial?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save");
      }

      toast.success(initial?.id ? "Transaction updated" : "Transaction added");
      onSaved();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save transaction";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            setValue("type", "expense");
            setValue("categoryId", "");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
            currentType === "expense"
              ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("type", "income");
            setValue("categoryId", "");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
            currentType === "income"
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("type", "transfer");
            setValue("categoryId", "");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
            currentType === "transfer"
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Transfer
        </button>
      </div>

      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0.01"
        required
        error={errors.amount?.message as string}
        {...register("amount")}
      />

      <Select
        label="Category"
        error={errors.categoryId?.message as string}
        {...register("categoryId")}
      >
        <option value="">Uncategorized</option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Input
        label="Description"
        placeholder="e.g. Coffee at Starbucks"
        error={errors.description?.message as string}
        {...register("description")}
      />

      <Input
        label="Date"
        type="date"
        required
        error={errors.transactionDate?.message as string}
        {...register("transactionDate")}
      />

      <Textarea
        label="Notes (optional)"
        rows={3}
        error={errors.notes?.message as string}
        {...register("notes")}
      />

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
