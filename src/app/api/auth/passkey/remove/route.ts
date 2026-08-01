import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passkeys } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "@/services/auth";

export async function DELETE() {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await db.delete(passkeys).where(eq(passkeys.userId, user.id));

        return NextResponse.json({
            success: true,
            message: "Passkey removed successfully"
        });

    } catch (error: unknown) {
        console.error("Failed to remove passkey:", error);
        return NextResponse.json(
            { message: "Failed to remove passkey" },
            { status: 500 }
        );
    }
}