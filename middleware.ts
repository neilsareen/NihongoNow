import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSession(request);
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
