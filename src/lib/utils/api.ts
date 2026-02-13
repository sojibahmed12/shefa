import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';

// Standard API response helpers
export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Get authenticated session or return error
export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

// Middleware-like role check
export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await getAuthSession();
  if (!session) {
    return { error: errorResponse('Unauthorized', 401), session: null };
  }
  if (session.user.isSuspended) {
    return { error: errorResponse('Account suspended', 403), session: null };
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: errorResponse('Forbidden', 403), session: null };
  }
  return { error: null, session };
}

// Generate unique room ID for video sessions
export function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'shefa-';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Parse pagination params
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
