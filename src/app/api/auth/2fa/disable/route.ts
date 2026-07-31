import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
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

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing from environment variables.");
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        if (!payload.userId || typeof payload.userId !== "string") {
            return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
        }

        await db.update(users)
            .set({
                isTwoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackupCodes: null,
            })
            .where(eq(users.id, payload.userId));

        return NextResponse.json({ success: true, message: "2FA successfully disabled!" });

    } catch (error: unknown) {
        const isAuthError =
            error instanceof Error &&
            (error.name === 'JWTExpired' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTInvalid');

        if (isAuthError) {
            return NextResponse.json({ error: "Session expired or invalid. Please login again." }, { status: 401 });
        }

        console.error("2FA Disable Error:", error);
        return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 });
    }
}