import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/schemas/schema";
import { eq, and, gte } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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
        const range = searchParams.get("range") || "30d";
        const now = new Date();
        const startDate = new Date();

        if (range === "30d") startDate.setDate(now.getDate() - 30);
        else if (range === "3m") startDate.setMonth(now.getMonth() - 3);
        else if (range === "monthly") startDate.setFullYear(now.getFullYear() - 1);
        else if (range === "yearly") startDate.setFullYear(now.getFullYear() - 5);

        const dateString = startDate.toISOString().split("T")[0];
        const data = await db
            .select({
                type: transactions.type,
                amount: transactions.amount,
                transaction_date: transactions.transactionDate,
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    gte(transactions.transactionDate, dateString)
                )
            );

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error("GET Trend Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}