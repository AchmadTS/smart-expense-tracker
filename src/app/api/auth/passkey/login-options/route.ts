import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const rawDomain = process.env.NEXT_PUBLIC_DOMAIN || "localhost";
        const rpID = rawDomain.replace(/^https?:\/\//, "");
        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: "preferred",
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
        console.error("Passkey Generate Login Options Error:", error);
        return NextResponse.json(
            { message: "Failed to generate passkey login options" },
            { status: 500 }
        );
    }
}