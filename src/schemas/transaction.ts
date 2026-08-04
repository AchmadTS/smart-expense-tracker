import { z } from 'zod';

export const transactionSchema = z.object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    categoryId: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    transactionDate: z.string().min(1, 'Date is required'),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;