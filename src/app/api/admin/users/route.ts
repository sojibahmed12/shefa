import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import User from '@/lib/models/User';
import { requireAuth, successResponse, errorResponse } from '@/lib/utils/api';
import { UserRole } from '@/types';

// PATCH /api/admin/users — suspend or unsuspend a user
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.ADMIN]);
  if (error) return error;

  try {
    await connectDB();
    const { userId, action } = await req.json();

    if (!userId || !['suspend', 'unsuspend'].includes(action)) {
      return errorResponse('Invalid request');
    }

    // Prevent self-suspension
    if (userId === session!.user.id) {
      return errorResponse('Cannot suspend yourself');
    }

    const user = await User.findById(userId);
    if (!user) return errorResponse('User not found', 404);

    user.isSuspended = action === 'suspend';
    await user.save();

    return successResponse({ message: `User ${action}ed successfully` });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// GET /api/admin/users — list all users
export async function GET(req: NextRequest) {
  const { error } = await requireAuth([UserRole.ADMIN]);
  if (error) return error;

  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get('role');
    const filter: any = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({ users });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
