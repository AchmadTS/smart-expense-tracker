import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const options = await generateAuthenticationOptions({
            rpID: process.env.NEXT_PUBLIC_DOMAIN || "localhost",
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
    } catch {
        return NextResponse.json({ error: "Failed to generate login options" }, { status: 500 });
    }
}