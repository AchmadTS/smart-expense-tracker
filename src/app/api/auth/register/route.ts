import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-auth-key";

export async function POST(request: Request) {
    try {
        const { name, email, password, currency } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Name, email, and password are required" },
                { status: 400 }
            );
        }

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

        return NextResponse.json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                currency: newUser.currency,
            },
        });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Internal server error";
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}