import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/schemas/schema";
import { eq, and } from "drizzle-orm";
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

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const validatedData = transactionSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        const { type, amount, categoryId, description, notes, transactionDate } = validatedData.data;
        await db
            .update(transactions)
            .set({
                type,
                amount: String(amount),
                categoryId: categoryId || null,
                description,
                notes,
                transactionDate,
            })
            .where(and(eq(transactions.id, params.id), eq(transactions.userId, userId)));

        return NextResponse.json({ message: "Transaction updated" }, { status: 200 });
    } catch (error) {
        console.error("PUT Transaction Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await db
            .delete(transactions)
            .where(and(eq(transactions.id, params.id), eq(transactions.userId, userId)));

        return NextResponse.json({ message: "Transaction deleted" }, { status: 200 });
    } catch (error) {
        console.error("DELETE Transaction Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}