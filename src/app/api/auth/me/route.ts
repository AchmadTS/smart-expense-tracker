import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";

export async function GET(request: Request) {
    try {
        let token: string | undefined;

        const authHeader = request.headers.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else {
            const cookieStore = await cookies();
            token = cookieStore.get("token")?.value;
        }

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing.");
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: decoded } = await jwtVerify(token, secretKey);

        if (!decoded.userId || typeof decoded.userId !== "string") {
            return NextResponse.json({ message: "Invalid token format" }, { status: 401 });
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, decoded.userId))
            .limit(1);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                currency: user.currency,
                isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
        });
    } catch (error: unknown) {
        const isAuthError =
            error instanceof Error &&
            (error.name === 'JWTExpired' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTInvalid');

        if (isAuthError) {
            return NextResponse.json({ message: "Session expired or invalid" }, { status: 401 });
        }

        console.error("Get Me Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}