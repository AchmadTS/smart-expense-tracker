import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import qrcode from "qrcode";
import crypto from "crypto";
import { generateSecret } from "otplib";
import bcrypt from "bcryptjs";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing.");
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }

        const secretJwt = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretJwt);

        if (!payload.userId || typeof payload.userId !== "string") {
            return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
        }

        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, payload.userId))
            .limit(1);

        if (user.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentUser = user[0];
        if (currentUser.isTwoFactorEnabled) {
            return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
        }

        const twoFactorSecret = generateSecret();
        const issuer = "ExpenseAI";
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(currentUser.email)}?secret=${twoFactorSecret}&issuer=${encodeURIComponent(issuer)}`;
        const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

        const plainTextBackupCodes = Array.from({ length: 8 }, () => {
            return crypto.randomBytes(4).toString("hex").toUpperCase().replace(/(.{4})/, "$1-");
        });

        const hashedBackupCodes = await Promise.all(
            plainTextBackupCodes.map(async (code) => {
                return await bcrypt.hash(code, 10);
            })
        );

        await db
            .update(users)
            .set({
                twoFactorSecret: twoFactorSecret,
                twoFactorBackupCodes: hashedBackupCodes,
                isTwoFactorEnabled: false,
            })
            .where(eq(users.id, currentUser.id));

        return NextResponse.json({
            secret: twoFactorSecret,
            qrCode: qrCodeDataUrl,
            backupCodes: plainTextBackupCodes,
        });

    } catch (error: unknown) {
        const isAuthError =
            error instanceof Error &&
            (error.name === 'JWTExpired' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTInvalid');

        if (isAuthError) {
            return NextResponse.json({ error: "Session expired or invalid. Please login again." }, { status: 401 });
        }

        console.error("2FA Setup Error:", error);
        return NextResponse.json(
            { error: "Failed to generate 2FA setup" },
            { status: 500 }
        );
    }
}