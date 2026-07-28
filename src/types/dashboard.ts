export interface DashboardTransaction {
  id: number;
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
  id: number;
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