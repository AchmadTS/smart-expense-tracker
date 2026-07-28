import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    const protectedRoutes = ["/dashboard", "/transactions", "/budgets"];
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    const authRoutes = ["/login", "/register"];
    const isAuthRoute = authRoutes.some((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute && !token) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthRoute && token) {
        const referer = request.headers.get("referer");

        if (referer) {
            try {
                const refererUrl = new URL(referer);

                if (
                    refererUrl.origin === request.nextUrl.origin &&
                    !authRoutes.some((route) => refererUrl.pathname.startsWith(route))
                ) {
                    return NextResponse.redirect(refererUrl);
                }
            } catch (e) {
            }
        }

        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
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
    ],
};