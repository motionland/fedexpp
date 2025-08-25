"use server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken"; // Pastikan jsonwebtoken sudah diinstal

export const middleware = async (request: NextRequest) => {
  const token = request.cookies.get("token")?.value; // Ambil token dari cookies

  const isPublicRoute = ["/login", "/register"].includes(
    request.nextUrl.pathname
  );

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = request.nextUrl.pathname;

  // Dekode token untuk mendapatkan role user
  let userRole = null;
  if (token) {
    try {
      const decoded = jwt.decode(token) as { role?: string } | null;
      userRole = decoded?.role;
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Jika sudah login dan mengakses "/", redirect ke dashboard
  if (token && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
};

// Konfigurasi matcher untuk middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"], // Hindari middleware dipanggil untuk static files
};
