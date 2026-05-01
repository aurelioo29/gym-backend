import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/api/admin"];
const authRoutes = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );

  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);

    loginUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*", "/login", "/register"],
};
