import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-auth-key";
const registerBodySchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    currency: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validationResult = registerBodySchema.safeParse(body);
        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues
                .map((err) => err.message)
                .join(", ");
            return NextResponse.json(
                { message: errorMessages },
                { status: 400 }
            );
        }

        const { name, email, password, currency } = validationResult.data;
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json(
                { message: "Email is already registered" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [newUser] = await db
            .insert(users)
            .values({
                name,
                email,
                passwordHash: hashedPassword,
                currency: currency || "IDR",
            })
            .returning();

        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const response = NextResponse.json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                currency: newUser.currency,
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