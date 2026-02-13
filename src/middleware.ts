import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check suspension
    if (token?.isSuspended) {
      return NextResponse.redirect(new URL('/auth/login?error=suspended', req.url));
    }

    // Role-based route protection
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (path.startsWith('/doctor') && token?.role !== 'DOCTOR') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (path.startsWith('/patient') && token?.role !== 'PATIENT') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Consultation page - any authenticated doctor/patient can access
    if (path.startsWith('/consultation')) {
      if (token?.role !== 'DOCTOR' && token?.role !== 'PATIENT') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/doctor/:path*',
    '/patient/:path*',
    '/consultation/:path*',
    '/notifications/:path*',
  ],
};
