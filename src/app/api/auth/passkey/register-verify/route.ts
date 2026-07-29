import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { users, passkeys } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "@/services/auth";

export async function POST(req: Request) {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const dbUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const expectedChallenge = dbUser[0].currentChallenge;

    if (!expectedChallenge) return NextResponse.json({ error: "No challenge found" }, { status: 400 });

    try {
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000",
            expectedRPID: process.env.NEXT_PUBLIC_DOMAIN || "localhost",
        });

        if (verification.verified && verification.registrationInfo) {
            const { credential } = verification.registrationInfo;
            const { id, publicKey, counter } = credential;
            const publicKeyBase64 = Buffer.from(publicKey).toString('base64url');
            const [existingPasskey] = await db
                .select()
                .from(passkeys)
                .where(eq(passkeys.userId, user.id))
                .limit(1);

            if (existingPasskey) {
                await db
                    .update(passkeys)
                    .set({
                        credentialID: id,
                        publicKey: publicKeyBase64,
                        counter: counter,
                    })
                    .where(eq(passkeys.userId, user.id));
            } else {
                await db.insert(passkeys).values({
                    userId: user.id,
                    credentialID: id,
                    publicKey: publicKeyBase64,
                    counter,
                });
            }

            await db.update(users).set({ currentChallenge: null }).where(eq(users.id, user.id));

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    } catch (error) {
        console.error("Passkey registration verification error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
}