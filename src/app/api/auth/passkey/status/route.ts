import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passkeys } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "@/services/auth";

export async function GET() {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const [existingPasskey] = await db
            .select()
            .from(passkeys)
            .where(eq(passkeys.userId, user.id))
            .limit(1);

        return NextResponse.json({
            success: true,
            hasPasskey: !!existingPasskey
        });

    } catch (error: unknown) {
        console.error("Get Passkey Status Error:", error);
        return NextResponse.json(
            { message: "Failed to fetch passkey status" },
            { status: 500 }
        );
    }
}