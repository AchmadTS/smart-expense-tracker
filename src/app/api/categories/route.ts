import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/schemas/schema";
import { eq, or } from "drizzle-orm";
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

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userCategories = await db
            .select({
                id: categories.id,
                name: categories.name,
                type: categories.type,
                icon: categories.icon,
                color: categories.color,
            })
            .from(categories)
            .where(
                or(
                    eq(categories.userId, userId),
                    eq(categories.isDefault, true)
                )
            );

        return NextResponse.json({ data: userCategories }, { status: 200 });
    } catch (error) {
        console.error("GET Categories Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}