import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Pakai instance NextAuth terpisah yang cuma berisi config edge-safe
// (tanpa bcrypt/Prisma) — supaya middleware bisa jalan di Edge Runtime.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/dev-seed");
  const isPublicPage = pathname === "/offline";

  if (isPublicApi || isPublicPage) return NextResponse.next();

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && pathname !== "/") {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)"],
};
