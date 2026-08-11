"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/Spinner";
import { showToast } from "@/lib/toast";
import { Transaction } from "@/types/transaction";

interface AnalysisData {
  highlight?: string;
  insight: string;
}

interface TransactionAIInsightProps {
  transactions: Transaction[];
}

export default function TransactionAIInsight({
  transactions,
}: TransactionAIInsightProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

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

  return (
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
                Get a quick analysis of the {transactions.length} transaction
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
  );
}
