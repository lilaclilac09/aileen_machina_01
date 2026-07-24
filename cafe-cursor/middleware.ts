import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Soft gate for admin UI routes.
 * Real protection is still API `isAuthenticated()` — this only avoids
 * rendering the admin shell for anonymous browsers.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/host")) {
    return NextResponse.next();
  }
  // Login page itself must stay public
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.next();
  }

  const session = request.cookies.get("cafe-cursor-admin-session")?.value;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/host/:path*"],
};
