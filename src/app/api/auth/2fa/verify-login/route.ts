import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { verify } from "otplib";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-auth-key";

export async function POST(request: Request) {
    try {
        const { tempToken, code } = await request.json();

        if (!tempToken || !code) {
            return NextResponse.json({ message: "Token and code are required" }, { status: 400 });
        }

        const decoded = jwt.verify(tempToken, JWT_SECRET) as { userId: string; is2FA: boolean };
        if (!decoded.is2FA) {
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

        const result = await verify({
            token: code,
            secret: user.twoFactorSecret
        });

        if (!result.valid) {
            return NextResponse.json({ message: "Invalid 6-digit code. Try again." }, { status: 400 });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

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
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error("Verify Login 2FA Error:", error);
        return NextResponse.json({ message: "Session expired or invalid" }, { status: 401 });
    }
}