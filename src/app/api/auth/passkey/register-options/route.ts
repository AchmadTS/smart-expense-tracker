import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/services/auth";

export async function GET() {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const rawDomain = process.env.NEXT_PUBLIC_DOMAIN || "localhost";
        const rpID = rawDomain.replace(/^https?:\/\//, "");
        const options = await generateRegistrationOptions({
            rpName: "ExpenseAI",
            rpID,
            userID: new TextEncoder().encode(user.id.toString()),
            userName: user.email,
            attestationType: "none",
            authenticatorSelection: {
                residentKey: "preferred",
                userVerification: "preferred",
            },
        });

        const cookieStore = await cookies();
        cookieStore.set("challenge", options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 5,
            path: "/",
        });

        return NextResponse.json(options);

    } catch (error: unknown) {
        console.error("Passkey Generate Registration Options Error:", error);
        return NextResponse.json(
            { message: "Failed to generate registration options" },
            { status: 500 }
        );
    }
}