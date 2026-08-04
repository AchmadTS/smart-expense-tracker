import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, categories } from "@/schemas/schema";
import { eq, desc } from "drizzle-orm";
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
        const limit = parseInt(searchParams.get("limit") || "50");
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
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.transactionDate))
            .limit(limit);

        return NextResponse.json({ data: result }, { status: 200 });
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