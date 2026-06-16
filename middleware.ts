import { type NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/lesson", "/analytics", "/settings"];
const authPaths = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace("https://", "")
    .replace(".supabase.co", "");
  const cookieName = `sb-${projectRef}-auth-token`;
  const hasSession =
    request.cookies.has(cookieName) ||
    request.cookies.has("sb-access-token") ||
    request.cookies.has(`${cookieName}.0`);

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.includes(pathname);

  if (!hasSession && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
