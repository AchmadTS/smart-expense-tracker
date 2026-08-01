import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { users, passkeys } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const cookieStore = await cookies();
        const expectedChallenge = cookieStore.get("challenge")?.value;

        if (!expectedChallenge) {
            return NextResponse.json({ message: "No challenge found. Please try again." }, { status: 400 });
        }

        const credentialID = body.id;
        const [dbPasskey] = await db
            .select()
            .from(passkeys)
            .where(eq(passkeys.credentialID, credentialID))
            .limit(1);

        if (!dbPasskey) {
            return NextResponse.json({ message: "Passkey not registered" }, { status: 400 });
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, dbPasskey.userId))
            .limit(1);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const rawDomain = process.env.NEXT_PUBLIC_DOMAIN || "localhost";
        const expectedRPID = rawDomain.replace(/^https?:\/\//, "");
        const expectedOrigin = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";
        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin,
            expectedRPID,
            credential: {
                id: dbPasskey.credentialID,
                publicKey: Buffer.from(dbPasskey.publicKey, 'base64url'),
                counter: dbPasskey.counter,
            },
        });

        if (verification.verified && verification.authenticationInfo) {
            await db.update(passkeys)
                .set({ counter: verification.authenticationInfo.newCounter })
                .where(eq(passkeys.id, dbPasskey.id));

            if (!process.env.JWT_SECRET) {
                console.error("CRITICAL: JWT_SECRET is missing.");
                return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
            }

            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const token = await new SignJWT({ userId: user.id, email: user.email })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("7d")
                .sign(secret);

            cookieStore.set("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
            });

            cookieStore.delete("challenge");
            return NextResponse.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    currency: user.currency,
                }
            });
        }

        return NextResponse.json({ message: "Verification failed" }, { status: 400 });
    } catch (error: unknown) {
        console.error("Passkey Verify Error:", error);
        return NextResponse.json({ message: "Authentication failed" }, { status: 500 });
    }
}