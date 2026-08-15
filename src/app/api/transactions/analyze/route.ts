import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, categories } from "@/schemas/schema";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await request.json();
        const userTransactions = await db
            .select({
                amount: transactions.amount,
                type: transactions.type,
                date: transactions.transactionDate,
                description: transactions.description,
                category: categories.name,
            })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.transactionDate))
            .limit(100);

        if (userTransactions.length === 0) {
            return NextResponse.json({
                highlight: "No Data",
                insight: "You don't have any transactions yet to analyze. Start adding some income or expenses!",
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in .env");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
      You are a smart financial advisor. Analyze the following recent transactions for a user.
      Provide a short, insightful financial analysis. 
      Identify any spending patterns, potential savings, or warnings (e.g., "Spending too much on Food").

      Transactions:
      ${JSON.stringify(userTransactions)}

      You MUST respond ONLY in valid JSON format exactly like this structure, without any markdown formatting or backticks:
      {
        "highlight": "Short phrase (e.g., 'High Food Expense', 'Great Savings', 'Consistent Income')",
        "insight": "A brief 2-3 sentence explanation of the insight."
      }
    `;

        let responseText = "";

        try {
            const result = await model.generateContent(prompt);
            responseText = result.response.text();
        } catch (aiError: unknown) {
            const err = aiError as { status?: number };

            if (err.status === 503) {
                console.log("Server Google sibuk, mencoba ulang dalam 2 detik...");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const retryResult = await model.generateContent(prompt);
                responseText = retryResult.response.text();
            } else {
                throw aiError;
            }
        }

        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const aiData = JSON.parse(responseText);

        return NextResponse.json({
            highlight: aiData.highlight,
            insight: aiData.insight,
        });

    } catch (error: unknown) {
        console.error("AI Analysis Error:", error);
        const err = error as { status?: number };
        if (err.status === 503) {
            return NextResponse.json(
                { message: "Google AI server is currently busy. Please wait a few seconds and try again." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { message: "Failed to generate AI insight. Please try again later." },
            { status: 500 }
        );
    }
}