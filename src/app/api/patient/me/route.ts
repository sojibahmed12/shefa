import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Patient from '@/lib/models/Patient';
import { requireAuth, successResponse, errorResponse } from '@/lib/utils/api';
import { UserRole } from '@/types';
import { patientProfileSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.PATIENT]);
  if (error) return error;

  try {
    await connectDB();
    const patient = await Patient.findOne({ userId: session!.user.id })
      .populate('userId', 'name email image')
      .lean();

    if (!patient) return errorResponse('Patient profile not found', 404);
    return successResponse(patient);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.PATIENT]);
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();
    const validation = patientProfileSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.errors[0].message);

    const patient = await Patient.findOneAndUpdate(
      { userId: session!.user.id },
      { $set: validation.data },
      { new: true }
    ).populate('userId', 'name email image');

    if (!patient) return errorResponse('Patient profile not found', 404);
    return successResponse(patient);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
