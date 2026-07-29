import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passkeys } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "@/services/auth";

export async function GET() {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userPasskeys = await db.select().from(passkeys).where(eq(passkeys.userId, user.id));

    return NextResponse.json({ hasPasskey: userPasskeys.length > 0 });
}