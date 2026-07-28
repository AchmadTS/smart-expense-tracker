"use server";

import { db } from "@/lib/db";
import { users, passwordResets } from "@/schemas/schema";
import { eq } from "drizzle-orm";

export async function requestPasswordReset(email: string) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (!user) {
        throw new Error("Email is not registered in the system.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await db
        .insert(passwordResets)
        .values({
            userId: user.id,
            otp,
            expiresAt,
        })
        .onConflictDoUpdate({
            target: passwordResets.userId,
            set: {
                otp,
                expiresAt,
                createdAt: new Date(),
            },
        });

    console.log(`[DEV OTP] Kode untuk ${email}: ${otp}`);
    return { success: true, message: "OTP code has been sent!" };
}

export async function verifyPasswordResetOtp(email: string, otpCode: string) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (!user) {
        throw new Error("User not found.");
    }

    const [resetRecord] = await db
        .select()
        .from(passwordResets)
        .where(eq(passwordResets.userId, user.id))
        .limit(1);

    if (!resetRecord) {
        throw new Error("OTP code is invalid or has expired.");
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
        throw new Error("The OTP code has expired. Please resend it.");
    }

    if (resetRecord.otp !== otpCode) {
        throw new Error("Wrong OTP code.");
    }

    await db
        .delete(passwordResets)
        .where(eq(passwordResets.userId, user.id));

    return { success: true, message: "Verification successful!" };
}