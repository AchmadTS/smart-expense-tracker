import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { passkeys } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "@/services/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const cookieStore = await cookies();
        const expectedChallenge = cookieStore.get("challenge")?.value;

        if (!expectedChallenge) {
            return NextResponse.json({ message: "No challenge found. Please restart registration." }, { status: 400 });
        }

        const rawDomain = process.env.NEXT_PUBLIC_DOMAIN || "localhost";
        const expectedRPID = rawDomain.replace(/^https?:\/\//, "");
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000",
            expectedRPID,
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

            cookieStore.delete("challenge");
            return NextResponse.json({
                success: true,
                message: "Passkey registered successfully"
            });
        }

        return NextResponse.json({ message: "Verification failed" }, { status: 400 });
    } catch (error: unknown) {
        console.error("Passkey Registration Verify Error:", error);

        return NextResponse.json(
            { message: "Registration failed due to server error" },
            { status: 500 }
        );
    }
}