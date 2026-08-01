import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/transactions") ||
        pathname.startsWith("/budgets");

    const isAuthRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password");

    const wipeCookie = (response: NextResponse) => {
        response.cookies.delete("token");
        return response;
    };

    if (isProtectedRoute && !token) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return wipeCookie(NextResponse.redirect(url));
    }

    let isTokenValid = false;

    if (token) {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error("JWT_SECRET is missing");
            }

            const secret = new TextEncoder().encode(jwtSecret);
            await jwtVerify(token, secret);
            isTokenValid = true;
        } catch {
            isTokenValid = false;
        }
    }

    if (token && !isTokenValid) {
        if (isProtectedRoute) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return wipeCookie(NextResponse.redirect(url));
        }
        if (isAuthRoute) {
            return wipeCookie(NextResponse.next());
        }
    }

    if (isAuthRoute && isTokenValid) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};