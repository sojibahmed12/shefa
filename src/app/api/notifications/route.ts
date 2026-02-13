import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Notification from '@/lib/models/Notification';
import { requireAuth, successResponse, errorResponse } from '@/lib/utils/api';

// GET /api/notifications — user's notifications
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const notifications = await Notification.find({ userId: session!.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: session!.user.id,
      isRead: false,
    });

    return successResponse({ notifications, unreadCount });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// PATCH /api/notifications — mark as read
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { notificationId, action } = await req.json();

    if (action === 'read-all') {
      await Notification.updateMany(
        { userId: session!.user.id, isRead: false },
        { isRead: true }
      );
      return successResponse({ message: 'All notifications marked as read' });
    }

    if (!notificationId) return errorResponse('notificationId required');

    await Notification.findOneAndUpdate(
      { _id: notificationId, userId: session!.user.id },
      { isRead: true }
    );

    return successResponse({ message: 'Notification marked as read' });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
