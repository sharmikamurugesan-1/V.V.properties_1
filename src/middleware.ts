import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Route /admin or /admin/login straight to /index.html
  if (pathname === "/admin" || pathname === "/admin/login") {
    return NextResponse.rewrite(new URL("/index.html", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/login"],
};
