import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    const url = new URL("/login", request.url);
    const response = NextResponse.redirect(url);
    
    response.cookies.set("token", "", {
        maxAge: 0,
        path: "/",
    });

    return response;
}

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("token");

        return NextResponse.json(
            { success: true, message: "Logged out successfully" },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Logout Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}