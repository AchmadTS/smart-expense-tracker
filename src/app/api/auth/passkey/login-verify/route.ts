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
            return NextResponse.json({ error: "No challenge found" }, { status: 400 });
        }

        const credentialID = body.id;
        const [dbPasskey] = await db
            .select()
            .from(passkeys)
            .where(eq(passkeys.credentialID, credentialID))
            .limit(1);

        if (!dbPasskey) {
            return NextResponse.json({ error: "Passkey not registered" }, { status: 400 });
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, dbPasskey.userId))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000",
            expectedRPID: process.env.NEXT_PUBLIC_DOMAIN || "localhost",
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
                throw new Error("JWT_SECRET is not defined");
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
                sameSite: "strict",
                maxAge: 60 * 60 * 24 * 7, // 7 hari
                path: "/",
            });

            cookieStore.delete("challenge");
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    } catch {
        return NextResponse.json({ error: "Authentication failed" }, { status: 400 });
    }
}