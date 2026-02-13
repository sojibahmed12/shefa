import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import Patient from '@/lib/models/Patient';
import Appointment from '@/lib/models/Appointment';
import VideoSession from '@/lib/models/VideoSession';
import { requireAuth, successResponse, errorResponse } from '@/lib/utils/api';
import { UserRole, AppointmentStatus, VideoSessionStatus } from '@/types';

// GET /api/video?appointmentId= — join video session
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.DOCTOR, UserRole.PATIENT]);
  if (error) return error;

  try {
    await connectDB();
    const appointmentId = req.nextUrl.searchParams.get('appointmentId');
    if (!appointmentId) return errorResponse('appointmentId required');

    // Verify ownership
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return errorResponse('Appointment not found', 404);

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      return errorResponse('Appointment must be confirmed to join video');
    }

    // Check if user is the doctor or patient
    let authorized = false;
    if (session!.user.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: session!.user.id });
      authorized = doctor?._id.toString() === appointment.doctorId.toString();
    } else {
      const patient = await Patient.findOne({ userId: session!.user.id });
      authorized = patient?._id.toString() === appointment.patientId.toString();
    }

    if (!authorized) return errorResponse('You are not part of this appointment', 403);

    // Find video session
    const videoSession = await VideoSession.findOne({
      appointmentId: appointment._id,
      status: { $in: [VideoSessionStatus.WAITING, VideoSessionStatus.ACTIVE] },
    });

    if (!videoSession) {
      return errorResponse('No active video session. Doctor must start the session first.');
    }

    return successResponse({
      roomId: videoSession.roomId,
      status: videoSession.status,
      appointmentId: appointment._id,
      role: session!.user.role,
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
