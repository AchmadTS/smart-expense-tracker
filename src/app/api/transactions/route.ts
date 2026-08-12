import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, categories } from "@/schemas/schema";
import { eq, desc, and, count, ilike, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { transactionSchema } from "@/schemas/transaction";

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.userId as string;
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const type = searchParams.get("type");
        const categoryId = searchParams.get("categoryId");
        const search = searchParams.get("search");
        const offset = (page - 1) * limit;

        const typeCounts = await db
            .select({
                type: transactions.type,
                count: count(),
            })
            .from(transactions)
            .where(eq(transactions.userId, userId))
            .groupBy(transactions.type);

        let allCount = 0;
        let incomeCount = 0;
        let expenseCount = 0;

        typeCounts.forEach((row) => {
            const c = Number(row.count);
            allCount += c;
            if (row.type === "income") incomeCount = c;
            if (row.type === "expense") expenseCount = c;
        });

        const conditions = [eq(transactions.userId, userId)];

        if (type) {
            conditions.push(eq(transactions.type, type as "income" | "expense" | "transfer"));
        }
        if (categoryId) {
            conditions.push(eq(transactions.categoryId, categoryId));
        }
        if (search) {
            conditions.push(
                or(
                    ilike(transactions.description, `%${search}%`),
                    ilike(transactions.notes, `%${search}%`)
                )!
            );
        }

        const [{ count: filteredTotal }] = await db
            .select({ count: count() })
            .from(transactions)
            .where(and(...conditions.filter(Boolean)));

        const result = await db
            .select({
                id: transactions.id,
                type: transactions.type,
                amount: transactions.amount,
                description: transactions.description,
                notes: transactions.notes,
                transaction_date: transactions.transactionDate,
                category_id: transactions.categoryId,
                category_name: categories.name,
                category_icon: categories.icon,
                category_color: categories.color,
            })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(and(...conditions.filter(Boolean)))
            .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            data: result,
            total: Number(filteredTotal),
            counts: {
                all: allCount,
                income: incomeCount,
                expense: expenseCount,
            },
            pagination: { page, limit }
        }, { status: 200 });
    } catch (error) {
        console.error("GET Transactions Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = transactionSchema.safeParse(body);
        if (!validatedData.success) {
            return NextResponse.json(
                { message: "Invalid input", errors: validatedData.error.format() },
                { status: 400 }
            );
        }

        const { type, amount, categoryId, description, notes, transactionDate } = validatedData.data;
        await db.insert(transactions).values({
            userId,
            type,
            amount: String(amount),
            categoryId: categoryId || null,
            description,
            notes,
            transactionDate,
        });

        return NextResponse.json({ message: "Transaction created successfully" }, { status: 201 });
    } catch (error) {
        console.error("POST Transaction Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}