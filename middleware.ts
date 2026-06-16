import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookies = request.cookies.getAll();
  const hasSession = cookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token")
  );

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/lesson") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings");

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/lesson/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};
