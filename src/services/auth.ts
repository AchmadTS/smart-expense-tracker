"use server";

import { db } from "@/lib/db";
import { users, passwordResets } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

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
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 menit

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
                token: null,
                createdAt: new Date(),
            },
        });

    try {
        await transporter.sendMail({
            from: `"Smart Expense" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password Reset Code - Smart Expense",
            html: `
                <div style="font-family: sans-serif; max-w: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #0f172a;">Reset Password</h2>
                    <p style="color: #475569;">Hello ${user.name},</p>
                    <p style="color: #475569;">We received a request to reset the password for your Smart Expense account. Here is your OTP code:</p>
                    
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #0d9488; margin: 0; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
                    </div>
                    
                    <p style="color: #ef4444; font-size: 14px;"><strong>Note:</strong> This code is only valid for 1 minute.</p>
                    <p style="color: #475569; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
                </div>
            `,
        });

        console.log(`[DEV OTP] Email sukses terkirim ke ${email}: ${otp}`);
    } catch (error) {
        console.error("Gagal mengirim email OTP via Nodemailer:", error);
        throw new Error("Failed to send OTP email. Please check server logs.");
    }

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

    if (!resetRecord || !resetRecord.expiresAt) {
        throw new Error("OTP code is invalid or has expired.");
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
        throw new Error("The OTP code has expired. Please resend it.");
    }

    if (resetRecord.otp !== otpCode) {
        throw new Error("Wrong OTP code.");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    await db
        .update(passwordResets)
        .set({
            token: resetToken,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        })
        .where(eq(passwordResets.userId, user.id));

    return { success: true, token: resetToken, message: "Verification successful!" };
}

export async function resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
        throw new Error("Token and new password are required.");
    }

    const [record] = await db
        .select()
        .from(passwordResets)
        .where(eq(passwordResets.token, token))
        .limit(1);

    if (!record || !record.expiresAt) {
        throw new Error("Invalid or expired session token.");
    }

    if (new Date() > new Date(record.expiresAt)) {
        throw new Error("Reset session has expired. Please restart the process.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
        .update(users)
        .set({ passwordHash: hashedPassword })
        .where(eq(users.id, record.userId));

    await db
        .delete(passwordResets)
        .where(eq(passwordResets.userId, record.userId));

    return { success: true, message: "Password updated successfully!" };
}