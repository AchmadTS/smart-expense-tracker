import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { tempToken, backupCode } = await request.json();

        if (!tempToken || !backupCode) {
            return NextResponse.json({ message: "Token and backup code are required" }, { status: 400 });
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

        if (!user || !user.twoFactorBackupCodes || !Array.isArray(user.twoFactorBackupCodes)) {
            return NextResponse.json({ message: "Invalid user or backup codes not setup" }, { status: 400 });
        }

        const cleanInput = backupCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

        if (cleanInput.length !== 8) {
            return NextResponse.json({ message: "Invalid backup code format." }, { status: 400 });
        }

        const formattedInputCode = `${cleanInput.slice(0, 4)}-${cleanInput.slice(4, 8)}`;
        const storedCodes = user.twoFactorBackupCodes as string[];
        let validCodeIndex = -1;

        for (let i = 0; i < storedCodes.length; i++) {
            const isValid = await bcrypt.compare(formattedInputCode, storedCodes[i]);
            if (isValid) {
                validCodeIndex = i;
                break;
            }
        }

        if (validCodeIndex === -1) {
            return NextResponse.json({ message: "Invalid backup code. It may have been used or typed incorrectly." }, { status: 400 });
        }

        const newBackupCodes = [...storedCodes];
        newBackupCodes.splice(validCodeIndex, 1);

        await db.update(users)
            .set({ twoFactorBackupCodes: newBackupCodes })
            .where(eq(users.id, user.id));

        const token = await new SignJWT({ userId: user.id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(secretKey);

        const response = NextResponse.json({
            success: true,
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

        console.error("Verify Backup Code Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}