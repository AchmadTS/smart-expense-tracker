// Lokasi: src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";

const loginBodySchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

// --- IN-MEMORY RATE LIMITER ---
// Struktur: { "email@example.com": { attempts: number, lockoutUntil: number } }
const loginAttempts = new Map<string, { attempts: number; lockoutUntil: number }>();

function handleFailedAttempt(email: string) {
    const now = Date.now();
    const record = loginAttempts.get(email) || { attempts: 0, lockoutUntil: 0 };

    record.attempts += 1;

    let lockoutDuration = 0; // dalam detik
    if (record.attempts >= 9) {
        lockoutDuration = 300; // 5 menit
    } else if (record.attempts >= 6) {
        lockoutDuration = 60; // 1 menit
    } else if (record.attempts >= 3) {
        lockoutDuration = 30; // 30 detik
    }

    if (lockoutDuration > 0) {
        record.lockoutUntil = now + (lockoutDuration * 1000);
    }

    loginAttempts.set(email, record);
    return { attempts: record.attempts, lockoutDuration };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validationResult = loginBodySchema.safeParse(body);

        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues
                .map((err) => err.message)
                .join(", ");
            return NextResponse.json({ message: errorMessages }, { status: 400 });
        }

        const { email, password } = validationResult.data;

        // --- CEK LOCKOUT SEBELUM MEMPROSES DATABASE ---
        const record = loginAttempts.get(email);
        if (record && record.lockoutUntil > Date.now()) {
            const remainingSeconds = Math.ceil((record.lockoutUntil - Date.now()) / 1000);
            return NextResponse.json(
                {
                    message: `Too many failed attempts. Try again in ${remainingSeconds} seconds.`,
                    lockoutDuration: remainingSeconds
                },
                { status: 429 } // 429: Too Many Requests
            );
        }

        // Eksekusi DB
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            // Catat kegagalan
            const { lockoutDuration } = handleFailedAttempt(email);
            if (lockoutDuration > 0) {
                return NextResponse.json(
                    { message: "Too many failed attempts", lockoutDuration },
                    { status: 429 }
                );
            }
            return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            // Catat kegagalan
            const { lockoutDuration } = handleFailedAttempt(email);
            if (lockoutDuration > 0) {
                return NextResponse.json(
                    { message: "Too many failed attempts", lockoutDuration },
                    { status: 429 }
                );
            }
            return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
        }

        // --- JIKA BERHASIL, HAPUS RIWAYAT KEGAGALAN ---
        loginAttempts.delete(email);

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing.");
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

        if (user.isTwoFactorEnabled) {
            const tempToken = await new SignJWT({ userId: user.id, is2FA: true })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("5m")
                .sign(secretKey);

            return NextResponse.json({
                requires2FA: true,
                tempToken,
                email: user.email,
            });
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
        console.error("Login Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}