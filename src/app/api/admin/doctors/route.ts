import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import User from '@/lib/models/User';
import { requireAuth, successResponse, errorResponse, parsePagination } from '@/lib/utils/api';
import { UserRole, ApprovalStatus } from '@/types';

// GET /api/admin/doctors — list doctors with optional status filter
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.ADMIN]);
  if (error) return error;

  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'PENDING';
    const { page, limit, skip } = parsePagination(searchParams);

    const filter: any = {};
    if (status !== 'ALL') {
      filter.isApproved = status;
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate('userId', 'name email image createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(filter),
    ]);

    return successResponse({
      doctors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// PATCH /api/admin/doctors — approve or reject a doctor
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.ADMIN]);
  if (error) return error;

  try {
    await connectDB();
    const { doctorId, action } = await req.json();

    if (!doctorId || !['approve', 'reject'].includes(action)) {
      return errorResponse('Invalid request. Provide doctorId and action (approve/reject)');
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return errorResponse('Doctor not found', 404);

    doctor.isApproved =
      action === 'approve' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
    await doctor.save();

    return successResponse({ doctor, message: `Doctor ${action}d successfully` });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
