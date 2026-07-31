import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isTokenExpired(token: string) {
    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return true;

        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const decodedJson = atob(base64);
        const payload = JSON.parse(decodedJson);
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    } catch {
        return true;
    }
}

export function proxy(request: NextRequest) {
    const tokenCookie = request.cookies.get("token");
    const token = tokenCookie?.value;
    const { pathname } = request.nextUrl;
    const isExpired = token ? isTokenExpired(token) : true;
    const protectedRoutes = ["/dashboard", "/transactions", "/budgets"];
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
    const isAuthRoute = authRoutes.some((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute && (!token || isExpired)) {
        const loginUrl = new URL("/login", request.url);
        const response = NextResponse.redirect(loginUrl);

        if (token) {
            response.cookies.delete("token");
        }
        return response;
    }

    if (isAuthRoute && token && !isExpired) {
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    if (isAuthRoute && token && isExpired) {
        const response = NextResponse.next();
        response.cookies.delete("token");
        return response;
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