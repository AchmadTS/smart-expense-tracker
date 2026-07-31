import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-auth-key";
const loginBodySchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

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
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
        }

        if (user.isTwoFactorEnabled) {
            const tempToken = jwt.sign(
                { userId: user.id, is2FA: true },
                JWT_SECRET,
                { expiresIn: "5m" }
            );
            return NextResponse.json({
                requires2FA: true,
                tempToken,
                email: user.email,
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const response = NextResponse.json({
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
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Internal server error";
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}