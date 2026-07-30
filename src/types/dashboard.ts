export interface DashboardTransaction {
  id: string;
  description: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  createdAt: Date | null;
  transactionDate: string;
  type: "income" | "expense" | "transfer";
  amount: string;
}

export interface DashboardBudget {
  id: string;
  categoryName: string;
  amount: string;
  spent: string;
}

export interface DashboardSummary {
  balance: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  incomeDelta: number;
  expenseDelta: number;
  savingsRate: number;
}