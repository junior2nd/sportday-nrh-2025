import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get('nrsport_access_token');
  const pathname = request.nextUrl.pathname;
  
  // Don't redirect login page itself
  if (pathname === '/dashboard/login' || pathname.startsWith('/dashboard/login/')) {
    return NextResponse.next();
  }
  
  // Protected routes that require authentication
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/raffle/display');
  
  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/dashboard/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/raffle/display/:path*"],
};

