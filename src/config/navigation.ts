import { LayoutDashboard, ArrowLeftRight, Folder, Target, Sparkles } from "lucide-react";

export const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
    { href: "/dashboard/categories", label: "Categories", icon: Folder },
    { href: "/dashboard/budgets", label: "Budgets", icon: Target },
    { href: "/dashboard/insights", label: "AI Insights", icon: Sparkles },
];