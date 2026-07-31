import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-auth-key";

export async function POST(request: Request) {
    try {
        const { tempToken, backupCode } = await request.json();

        if (!tempToken || !backupCode) {
            return NextResponse.json({ message: "Token and backup code are required" }, { status: 400 });
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

        if (!user || !user.twoFactorBackupCodes) {
            return NextResponse.json({ message: "Invalid user or backup codes not setup" }, { status: 400 });
        }

        const normalizedInputCode = backupCode.replace(/-/g, "").toUpperCase();
        const storedCodes = user.twoFactorBackupCodes as string[];
        const validCodeIndex = storedCodes.findIndex(
            (code) => code.replace(/-/g, "").toUpperCase() === normalizedInputCode
        );

        if (validCodeIndex === -1) {
            return NextResponse.json({ message: "Invalid backup code. It may have been used or typed incorrectly." }, { status: 400 });
        }

        const newBackupCodes = [...storedCodes];
        newBackupCodes.splice(validCodeIndex, 1);

        await db.update(users)
            .set({ twoFactorBackupCodes: newBackupCodes })
            .where(eq(users.id, user.id));

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
        console.error("Verify Backup Code Error:", error);
        return NextResponse.json({ message: "Session expired or invalid" }, { status: 401 });
    }
}