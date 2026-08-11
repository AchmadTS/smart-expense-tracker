export interface Transaction {
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

export interface Category {
    id: string;
    name: string;
    type: string;
}