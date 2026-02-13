import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import { requireAuth, successResponse, errorResponse } from '@/lib/utils/api';
import { UserRole } from '@/types';
import { doctorProfileSchema, doctorFeeSchema, availabilitySchema } from '@/lib/validators';

// GET /api/doctor/me — get own doctor profile
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.DOCTOR]);
  if (error) return error;

  try {
    await connectDB();
    const doctor = await Doctor.findOne({ userId: session!.user.id })
      .populate('userId', 'name email image')
      .lean();

    if (!doctor) return errorResponse('Doctor profile not found', 404);
    return successResponse(doctor);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// PATCH /api/doctor/me — update doctor profile
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.DOCTOR]);
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();
    const { updateType } = body;

    const doctor = await Doctor.findOne({ userId: session!.user.id });
    if (!doctor) return errorResponse('Doctor profile not found', 404);

    if (updateType === 'fee') {
      const validation = doctorFeeSchema.safeParse(body);
      if (!validation.success) return errorResponse(validation.error.errors[0].message);
      doctor.consultationFee = validation.data.consultationFee;
    } else if (updateType === 'availability') {
      const validation = availabilitySchema.safeParse(body);
      if (!validation.success) return errorResponse(validation.error.errors[0].message);
      doctor.availability = validation.data.availability as any;
    } else {
      const validation = doctorProfileSchema.safeParse(body);
      if (!validation.success) return errorResponse(validation.error.errors[0].message);
      Object.assign(doctor, validation.data);
    }

    await doctor.save();
    return successResponse(doctor);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
