import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { verify } from "otplib";

export async function POST(request: Request) {
    try {
        const { token: otpToken } = await request.json();

        if (!otpToken) {
            return NextResponse.json({ error: "6 digit code required" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing.");
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: decoded } = await jwtVerify(token, secretKey);

        if (!decoded.userId || typeof decoded.userId !== "string") {
            return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
        }

        const [currentUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, decoded.userId))
            .limit(1);

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!currentUser.twoFactorSecret) {
            return NextResponse.json({ error: "2FA system has not been initialized" }, { status: 400 });
        }

        if (currentUser.isTwoFactorEnabled) {
            return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
        }

        const cleanOtpToken = otpToken.replace(/\s+/g, "");
        const result = await verify({
            token: cleanOtpToken,
            secret: currentUser.twoFactorSecret,
        });

        if (!result.valid) {
            return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
        }

        await db.update(users)
            .set({ isTwoFactorEnabled: true })
            .where(eq(users.id, currentUser.id));

        return NextResponse.json({ success: true, message: "2FA successfully enabled!" });

    } catch (error: unknown) {
        const isAuthError =
            error instanceof Error &&
            (error.name === 'JWTExpired' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTInvalid');

        if (isAuthError) {
            return NextResponse.json({ error: "Session expired or invalid. Please login again." }, { status: 401 });
        }

        console.error("2FA Verify Setup Error:", error);
        return NextResponse.json({ error: "Failed to verify 2FA setup" }, { status: 500 });
    }
}