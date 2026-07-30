import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secretJwt = process.env.JWT_SECRET || "super-secret-auth-key";
        const decoded = jwt.verify(token, secretJwt) as { userId: string };

        await db.update(users)
            .set({
                isTwoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackupCodes: null,
            })
            .where(eq(users.id, decoded.userId));

        return NextResponse.json({ success: true, message: "2FA successfully disabled!" });
    } catch (error) {
        console.error("2FA Disable Error:", error);
        return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 });
    }
}