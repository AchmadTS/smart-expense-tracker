import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import qrcode from "qrcode";
import crypto from "crypto";
import { generateSecret } from "otplib";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secretJwt = process.env.JWT_SECRET || "super-secret-auth-key";
        const decoded = jwt.verify(token, secretJwt) as { userId: string };
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, decoded.userId))
            .limit(1);

        if (user.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentUser = user[0];
        const twoFactorSecret = generateSecret();
        const issuer = "ExpenseAI";
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(currentUser.email)}?secret=${twoFactorSecret}&issuer=${encodeURIComponent(issuer)}`;
        const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
        const backupCodes = Array.from({ length: 8 }, () => {
            return crypto.randomBytes(4).toString("hex").toUpperCase().replace(/(.{4})/, "$1-");
        });

        await db
            .update(users)
            .set({
                twoFactorSecret: twoFactorSecret,
                twoFactorBackupCodes: backupCodes,
                isTwoFactorEnabled: false,
            })
            .where(eq(users.id, currentUser.id));

        return NextResponse.json({
            secret: twoFactorSecret,
            qrCode: qrCodeDataUrl,
            backupCodes: backupCodes,
        });

    } catch (error) {
        console.error("2FA Setup Error:", error);
        return NextResponse.json(
            { error: "Failed to generate 2FA setup" },
            { status: 500 }
        );
    }
}