import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { verify } from "otplib";

export async function POST(request: Request) {
    try {
        const { token: otpToken } = await request.json();

        if (!otpToken) {
            return NextResponse.json({ error: "6 digit code required" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const secretJwt = process.env.JWT_SECRET || "super-secret-auth-key";
        const decoded = jwt.verify(token, secretJwt) as { userId: string };
        const userRecord = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

        if (userRecord.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const currentUser = userRecord[0];

        if (!currentUser.twoFactorSecret) {
            return NextResponse.json({ error: "2FA system has not been initialized" }, { status: 400 });
        }

        const result = await verify({
            token: otpToken,
            secret: currentUser.twoFactorSecret,
        });

        if (!result.valid) {
            return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
        }

        await db.update(users)
            .set({ isTwoFactorEnabled: true })
            .where(eq(users.id, currentUser.id));

        return NextResponse.json({ success: true, message: "2FA successfully enabled!" });

    } catch (error) {
        console.error("2FA Verify Error:", error);
        return NextResponse.json({ error: "Failed to verify 2FA" }, { status: 500 });
    }
}