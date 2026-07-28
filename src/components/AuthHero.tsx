import {
  Wallet,
  TrendingUp,
  Sparkles,
  Utensils,
  ShoppingBag,
  Coffee,
  Plane,
  Calendar,
  Receipt,
  type LucideIcon,
} from "lucide-react";

interface AuthHeroProps {
  headline: string;
  subheadline: string;
}

interface Subscription {
  name: string;
  cost: string;
  initial: string;
  color: string;
}

interface Transaction {
  icon: LucideIcon;
  color: string;
  name: string;
  amount: string;
  positive?: boolean;
}

interface Category {
  name: string;
  value: string;
  color: string;
}

const BalanceCard = () => (
  <div className="bg-linear-to-br from-primary via-primary-hover to-teal-950 rounded-2xl p-5 text-white shadow-xl shadow-teal-900/20 relative overflow-hidden">
    <div className="absolute -top-8 -right-8 h-24 w-24 bg-white/10 rounded-full blur-2xl" />
    <div className="relative flex items-center justify-between mb-4">
      <div className="text-xs font-medium opacity-80">Total Balance</div>
      <Wallet size={16} className="opacity-80" />
    </div>
    <div className="relative text-3xl font-bold tracking-tight">$12,547.30</div>
    <div className="relative flex items-center gap-1.5 mt-2 text-xs">
      <TrendingUp size={11} />
      <span className="font-semibold">+8.2%</span>
      <span className="opacity-70">this month</span>
    </div>
  </div>
);

const AIInsightCard = () => (
  <div className="bg-white rounded-2xl p-4 shadow-lg shadow-teal-50 border border-card-border">
    <div className="flex items-start gap-2.5">
      <div className="h-9 w-9 rounded-xl bg-linear-to-br from-primary-light to-primary flex items-center justify-center shrink-0">
        <Sparkles size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-bold text-primary mb-0.5">
          AI Insight
        </div>
        <div className="text-xs font-semibold text-slate-900 mb-0.5">
          Coffee budget alert
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Cut 2 cups/week → save $32/mo
        </p>
      </div>
    </div>
  </div>
);

const BudgetProgressCard = () => (
  <div className="bg-white rounded-2xl p-4 shadow-md border border-card-border">
    <div className="flex items-center gap-2 mb-3">
      <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
        <Utensils size={14} className="text-warning" />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-900">
          Food & Dining
        </div>
        <div className="text-[10px] text-slate-500">May 2026</div>
      </div>
    </div>
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="text-base font-bold text-slate-900">$320</span>
      <span className="text-[10px] text-slate-500">of $400</span>
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-warning rounded-full"
        style={{ width: "80%" }}
      />
    </div>
    <div className="text-[10px] text-warning font-medium mt-1.5">80% used</div>
  </div>
);

const SubscriptionsCard = () => {
  const subscriptions: Subscription[] = [
    { name: "Netflix", cost: "$15.99", initial: "N", color: "bg-danger" },
    { name: "Spotify", cost: "$10.99", initial: "S", color: "bg-success" },
    { name: "iCloud+", cost: "$2.99", initial: "i", color: "bg-accent-blue" },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-card-border">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">
        Subscriptions
      </div>
      <div className="space-y-2.5">
        {subscriptions.map((s) => (
          <div key={s.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-lg ${s.color} flex items-center justify-center text-white text-[11px] font-bold`}
              >
                {s.initial}
              </div>
              <span className="text-[11px] font-medium text-slate-900">
                {s.name}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-700">
              {s.cost}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const IncomeExpenseCard = () => (
  <div className="bg-white rounded-2xl p-4 shadow-md border border-card-border">
    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
      Income vs Expense
    </div>
    <div className="grid grid-cols-2 gap-3 mb-3">
      <div>
        <div className="text-[10px] text-slate-500">Income</div>
        <div className="text-base font-bold text-primary">$6.3k</div>
      </div>
      <div>
        <div className="text-[10px] text-slate-500">Expense</div>
        <div className="text-base font-bold text-accent-orange">$2.4k</div>
      </div>
    </div>
    <div className="flex items-end gap-1 h-10">
      {[55, 70, 45, 80, 65, 75].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end">
          <div
            className="bg-primary-light rounded-sm"
            style={{ height: `${h}%`, minHeight: "4px" }}
          />
          <div
            className="bg-accent-orange rounded-sm"
            style={{ height: `${h * 0.45}%`, minHeight: "2px" }}
          />
        </div>
      ))}
    </div>
  </div>
);

const MonthlySummaryCard = () => (
  <div className="bg-white rounded-2xl p-4 shadow-md border border-card-border">
    <div className="flex items-center justify-between mb-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
        May 2026
      </div>
      <span className="text-[10px] text-success bg-emerald-50 px-1.5 py-0.5 rounded-full font-bold">
        Healthy
      </span>
    </div>
    <div className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
      $3,936
    </div>
    <div className="text-[10px] text-slate-500">Net this month</div>
    <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-linear-to-r from-primary-light to-primary-hover rounded-full"
        style={{ width: "62%" }}
      />
    </div>
    <div className="text-[10px] text-slate-500 mt-1.5">62% savings rate</div>
  </div>
);

const RecentTransactionsCard = () => {
  const transactions: Transaction[] = [
    {
      icon: ShoppingBag,
      color: "bg-blue-50 text-accent-blue",
      name: "Whole Foods",
      amount: "-$87.00",
    },
    {
      icon: Coffee,
      color: "bg-amber-50 text-warning",
      name: "Starbucks",
      amount: "-$6.45",
    },
    {
      icon: TrendingUp,
      color: "bg-emerald-50 text-success",
      name: "Salary",
      amount: "+$5,500",
      positive: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-card-border">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">
        Recent
      </div>
      <div className="space-y-2.5">
        {transactions.map((t, i) => {
          const IconComponent = t.icon;
          return (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`h-7 w-7 rounded-lg ${t.color} flex items-center justify-center shrink-0`}
                >
                  <IconComponent size={12} />
                </div>
                <span className="text-[11px] font-medium text-slate-900 truncate">
                  {t.name}
                </span>
              </div>
              <span
                className={`text-[11px] font-semibold ${t.positive ? "text-success" : "text-slate-700"}`}
              >
                {t.amount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CategoryDonutCard = () => {
  const categories: Category[] = [
    { name: "Food", value: "$320", color: "bg-primary-light" },
    { name: "Rent", value: "$1.8k", color: "bg-accent-orange" },
    { name: "Travel", value: "$240", color: "bg-accent-blue" },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-card-border">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">
        Top Categories
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="6"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="6"
              strokeDasharray="35 88"
              strokeLinecap="round"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="var(--accent-orange)"
              strokeWidth="6"
              strokeDasharray="22 88"
              strokeDashoffset="-37"
              strokeLinecap="round"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="var(--accent-blue)"
              strokeWidth="6"
              strokeDasharray="16 88"
              strokeDashoffset="-61"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          {categories.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between text-[10px]"
            >
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${c.color}`} />
                <span className="text-slate-600 font-medium">{c.name}</span>
              </div>
              <span className="text-slate-900 font-semibold">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SavingsGoalCard = () => (
  <div className="bg-linear-to-br from-emerald-50 via-white to-blue-50 rounded-2xl p-4 shadow-md border border-card-border">
    <div className="flex items-center gap-2 mb-3">
      <div className="h-8 w-8 rounded-lg bg-linear-to-br from-emerald-400 to-success flex items-center justify-center">
        <Plane size={14} className="text-white" />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-900">
          Vacation Fund
        </div>
        <div className="text-[10px] text-slate-500">Goal: $5,000</div>
      </div>
    </div>
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="text-lg font-bold tracking-tight text-slate-900">
        $3,240
      </span>
      <span className="text-[10px] text-success font-bold">65%</span>
    </div>
    <div className="h-1.5 bg-white rounded-full overflow-hidden">
      <div
        className="h-full bg-linear-to-r from-emerald-400 to-accent-blue rounded-full"
        style={{ width: "65%" }}
      />
    </div>
  </div>
);

const UpcomingBillCard = () => (
  <div className="bg-white rounded-2xl p-4 shadow-md border border-card-border">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
        <Calendar size={16} className="text-danger" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-danger font-bold">
          Due in 2 days
        </div>
        <div className="text-xs font-semibold text-slate-900">Rent payment</div>
      </div>
      <div className="text-sm font-bold text-slate-900">$1,800</div>
    </div>
  </div>
);

const PortfolioCard = () => (
  <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-xl">
    <div className="flex items-center justify-between mb-3">
      <div className="text-[10px] uppercase tracking-wider opacity-60 font-bold">
        Investments
      </div>
      <Receipt size={12} className="opacity-60" />
    </div>
    <div className="text-2xl font-bold tracking-tight mb-1">$8,420.55</div>
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="text-success font-semibold">+$182.30</span>
      <span className="opacity-50">today</span>
    </div>
    <div className="mt-3 h-10">
      <svg
        viewBox="0 0 100 30"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <path
          d="M0,20 L15,18 L30,22 L45,15 L60,12 L75,8 L100,5"
          stroke="#34D399"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0,20 L15,18 L30,22 L45,15 L60,12 L75,8 L100,5 L100,30 L0,30 Z"
          fill="url(#sparkGradient)"
        />
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

const column1 = [
  <BalanceCard key="balance" />,
  <AIInsightCard key="ai" />,
  <BudgetProgressCard key="budget" />,
  <SubscriptionsCard key="subs" />,
  <IncomeExpenseCard key="incexp" />,
];

const column2 = [
  <MonthlySummaryCard key="monthly" />,
  <RecentTransactionsCard key="recent" />,
  <CategoryDonutCard key="cats" />,
  <SavingsGoalCard key="savings" />,
  <UpcomingBillCard key="bill" />,
  <PortfolioCard key="portfolio" />,
];

export default function AuthHero({ headline, subheadline }: AuthHeroProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-linear-to-br from-teal-100 via-primary-subtle to-white">
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute inset-0 overflow-hidden z-10">
        <div
          className="absolute -inset-40 flex gap-4"
          style={{ transform: "rotate(-7deg)" }}
        >
          <div className="flex-1 min-w-0">
            <div style={{ animation: "scrollUp 45s linear infinite" }}>
              {[...column1, ...column1, ...column2].map((card, i) => (
                <div key={i} className="pb-4">
                  {card}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div style={{ animation: "scrollDown 45s linear infinite" }}>
              {[...column2, ...column2, ...column2].map((card, i) => (
                <div key={i} className="pb-4">
                  {card}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div style={{ animation: "scrollUp 45s linear infinite" }}>
              {[...column1, ...column1, ...column2].map((card, i) => (
                <div key={i} className="pb-4">
                  {card}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-64 bg-linear-to-b from-teal-100 via-teal-50/95 to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none z-20" />
      <div className="absolute top-10 left-10 xl:top-14 xl:left-14 z-30 max-w-[70%]">
        <h1 className="text-5xl xl:text-6xl font-semibold tracking-tight text-teal-950 mb-2">
          {headline}
        </h1>
        <p className="text-base text-teal-800 font-medium">{subheadline}</p>
      </div>
    </div>
  );
}
