import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { verify } from "otplib";

export async function POST(request: Request) {
    try {
        const { tempToken, code } = await request.json();

        if (!tempToken || !code) {
            return NextResponse.json({ message: "Token and code are required" }, { status: 400 });
        }

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing.");
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: decoded } = await jwtVerify(tempToken, secretKey);

        if (!decoded.is2FA || typeof decoded.userId !== "string") {
            return NextResponse.json({ message: "Invalid token type" }, { status: 400 });
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, decoded.userId))
            .limit(1);

        if (!user || !user.twoFactorSecret) {
            return NextResponse.json({ message: "Invalid user or 2FA not setup" }, { status: 400 });
        }

        const cleanCode = code.replace(/\s+/g, "");
        const result = await verify({
            token: cleanCode,
            secret: user.twoFactorSecret
        });

        if (!result.valid) {
            return NextResponse.json({ message: "Invalid 6-digit code. Try again." }, { status: 400 });
        }

        const token = await new SignJWT({ userId: user.id, email: user.email })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(secretKey);

        const response = NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                currency: user.currency,
            },
        });

        response.cookies.set({
            name: "token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error: unknown) {
        const isAuthError =
            error instanceof Error &&
            (error.name === 'JWTExpired' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTInvalid');

        if (isAuthError) {
            return NextResponse.json({ message: "Session expired or invalid" }, { status: 401 });
        }

        console.error("Verify Login 2FA Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}