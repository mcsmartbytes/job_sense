import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the session token using NextAuth's JWT helper
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/sites',
    '/estimates',
    '/jobs',
    '/reports',
    '/profile',
    '/settings',
    '/onboarding',
  ];

  // Auth routes (login, register, etc.)
  const authRoutes = ['/login', '/register', '/reset', '/reset-request', '/verify'];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !token) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages with active session
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sites/:path*',
    '/estimates/:path*',
    '/jobs/:path*',
    '/reports/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/login',
    '/register',
    '/reset',
    '/reset-request',
    '/verify',
  ],
};
