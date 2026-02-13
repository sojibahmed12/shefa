import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import Appointment from '@/lib/models/Appointment';
import VideoSession from '@/lib/models/VideoSession';
import Notification from '@/lib/models/Notification';
import { requireAuth, successResponse, errorResponse, parsePagination, generateRoomId } from '@/lib/utils/api';
import { UserRole, AppointmentStatus, VideoSessionStatus } from '@/types';

// GET /api/doctor/appointments — list doctor's appointments
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.DOCTOR]);
  if (error) return error;

  try {
    await connectDB();
    const doctor = await Doctor.findOne({ userId: session!.user.id });
    if (!doctor) return errorResponse('Doctor profile not found', 404);

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const { page, limit, skip } = parsePagination(searchParams);

    const filter: any = { doctorId: doctor._id };
    if (status) filter.status = status;

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'name email image' },
        })
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return successResponse({
      appointments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// PATCH /api/doctor/appointments — complete appointment or start/end video
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.DOCTOR]);
  if (error) return error;

  try {
    await connectDB();
    const doctor = await Doctor.findOne({ userId: session!.user.id });
    if (!doctor) return errorResponse('Doctor profile not found', 404);

    const { appointmentId, action } = await req.json();

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctor._id,
    });
    if (!appointment) return errorResponse('Appointment not found or unauthorized', 404);

    switch (action) {
      case 'complete': {
        if (appointment.status !== AppointmentStatus.CONFIRMED) {
          return errorResponse('Only confirmed appointments can be completed');
        }
        appointment.status = AppointmentStatus.COMPLETED;
        await appointment.save();

        // End video session if active
        await VideoSession.findOneAndUpdate(
          { appointmentId: appointment._id, status: VideoSessionStatus.ACTIVE },
          { status: VideoSessionStatus.ENDED, endedAt: new Date() }
        );

        // Notify patient
        await Notification.create({
          userId: (appointment.patientId as any).userId || appointment.patientId,
          title: 'Appointment Completed',
          message: 'Your consultation has been marked as completed.',
          type: 'APPOINTMENT',
          link: `/patient/appointments/${appointment._id}`,
        });

        return successResponse({ appointment, message: 'Appointment completed' });
      }

      case 'start-video': {
        if (appointment.status !== AppointmentStatus.CONFIRMED) {
          return errorResponse('Appointment must be confirmed');
        }

        let videoSession = await VideoSession.findOne({ appointmentId: appointment._id });
        if (!videoSession) {
          videoSession = await VideoSession.create({
            appointmentId: appointment._id,
            roomId: generateRoomId(),
            status: VideoSessionStatus.ACTIVE,
            startedAt: new Date(),
          });
        } else {
          videoSession.status = VideoSessionStatus.ACTIVE;
          videoSession.startedAt = new Date();
          await videoSession.save();
        }

        return successResponse({ videoSession, roomId: videoSession.roomId });
      }

      case 'end-video': {
        const videoSession = await VideoSession.findOne({
          appointmentId: appointment._id,
          status: VideoSessionStatus.ACTIVE,
        });
        if (!videoSession) return errorResponse('No active video session');

        videoSession.status = VideoSessionStatus.ENDED;
        videoSession.endedAt = new Date();
        if (videoSession.startedAt) {
          videoSession.duration = Math.floor(
            (videoSession.endedAt.getTime() - videoSession.startedAt.getTime()) / 1000
          );
        }
        await videoSession.save();

        return successResponse({ videoSession, message: 'Video session ended' });
      }

      default:
        return errorResponse('Invalid action');
    }
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
