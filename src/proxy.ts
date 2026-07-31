import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;
    const isProtectedRoute = pathname.startsWith("/dashboard") ||
        pathname.startsWith("/transactions") ||
        pathname.startsWith("/budgets");

    const isAuthRoute = pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password");

    const wipeCookie = (response: NextResponse) => {
        response.cookies.set("token", "", {
            maxAge: 0,
            path: "/"
        });
        return response;
    };

    if (isProtectedRoute && !token) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return wipeCookie(NextResponse.redirect(url));
    }

    let isExpired = false;
    if (token) {
        try {
            const parts = token.split(".");
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
                if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                    isExpired = true;
                }
            } else {
                isExpired = true;
            }
        } catch {
            isExpired = true;
        }
    }

    if (isExpired) {
        if (isProtectedRoute) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return wipeCookie(NextResponse.redirect(url));
        }
        if (isAuthRoute) {
            return wipeCookie(NextResponse.next());
        }
    }

    if (isAuthRoute && token && !isExpired) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard",
        "/dashboard/:path*",
        "/transactions",
        "/transactions/:path*",
        "/budgets",
        "/budgets/:path*",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
    ],
};