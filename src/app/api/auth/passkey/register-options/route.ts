import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "@/services/auth";

export async function GET() {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const options = await generateRegistrationOptions({
        rpName: "ExpenseAI",
        rpID: process.env.NEXT_PUBLIC_DOMAIN || "localhost",
        userID: new TextEncoder().encode(user.id.toString()),
        userName: user.email,
        attestationType: "none",
        authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
        },
    });

    await db.update(users).set({ currentChallenge: options.challenge }).where(eq(users.id, user.id));
    return NextResponse.json(options);
}