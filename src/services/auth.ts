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
            subject: "🔐 Password Reset Verification Code - Smart Expense",
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">                            
                            <tr>
                                <td style="padding: 32px 40px 24px 40px; text-align: left; border-bottom: 1px solid #f1f5f9;">
                                    <table cellpadding="0" cellspacing="0" role="presentation">
                                        <tr>
                                            <td style="width: 36px; height: 36px; background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%); border-radius: 10px; text-align: center; vertical-align: middle;">
                                                <span style="color: #ffffff; font-size: 18px; line-height: 36px;">💳</span>
                                            </td>
                                            <td style="padding-left: 12px;">
                                                <span style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.025em;">Smart Expense</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.025em;">
                                        Password Reset Request
                                    </h1>
                                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                                        Hello <strong>${user.name}</strong>,
                                    </p>
                                    <p style="margin: 0 0 28px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                                        We received a request to reset the password for your Smart Expense account. Use the verification code below to continue:
                                    </p>
                                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 28px;">
                                        <tr>
                                            <td align="center" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px;">
                                                <span style="font-size: 34px; font-weight: 800; color: #0d9488; letter-spacing: 8px; font-family: monospace, monospace;">
                                                    ${otp}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 28px; border-left: 4px solid #0d9488;">
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
                                                    <strong>Security Notice:</strong> This code is valid for <strong>1 minute</strong> only. Never share this code with anyone.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                                        If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;">
                                        &copy; ${new Date().getFullYear()} Smart Expense. All rights reserved.
                                    </p>
                                    <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                                        This is an automated system message, please do not reply.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
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