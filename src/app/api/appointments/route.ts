import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import Patient from '@/lib/models/Patient';
import Appointment from '@/lib/models/Appointment';
import Notification from '@/lib/models/Notification';
import { requireAuth, successResponse, errorResponse, parsePagination } from '@/lib/utils/api';
import { UserRole, AppointmentStatus, ApprovalStatus } from '@/types';
import { createAppointmentSchema } from '@/lib/validators';

// POST /api/appointments — patient creates an appointment
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.PATIENT]);
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();
    const validation = createAppointmentSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.errors[0].message);

    const { doctorId, scheduledDate, timeSlot, reason } = validation.data;

    // Verify doctor exists & is approved
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.isApproved !== ApprovalStatus.APPROVED) {
      return errorResponse('Doctor not found or not approved', 404);
    }

    // Get patient profile
    const patient = await Patient.findOne({ userId: session!.user.id });
    if (!patient) return errorResponse('Patient profile not found', 404);

    // Check for time slot conflict
    const existingAppointment = await Appointment.findOne({
      doctorId: doctor._id,
      scheduledDate: new Date(scheduledDate),
      'timeSlot.start': timeSlot.start,
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.PAID, AppointmentStatus.CONFIRMED] },
    });

    if (existingAppointment) {
      return errorResponse('This time slot is already booked');
    }

    const appointment = await Appointment.create({
      doctorId: doctor._id,
      patientId: patient._id,
      scheduledDate: new Date(scheduledDate),
      timeSlot,
      reason,
      consultationFee: doctor.consultationFee,
      status: AppointmentStatus.PENDING,
    });

    // Notify doctor
    await Notification.create({
      userId: doctor.userId,
      title: 'New Appointment Request',
      message: `A patient has booked an appointment for ${scheduledDate}`,
      type: 'APPOINTMENT',
      link: `/doctor/appointments`,
    });

    return successResponse(appointment, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// GET /api/appointments — get appointments (role-based)
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const { page, limit, skip } = parsePagination(searchParams);

    let filter: any = {};

    if (session!.user.role === UserRole.PATIENT) {
      const patient = await Patient.findOne({ userId: session!.user.id });
      if (!patient) return errorResponse('Patient not found', 404);
      filter.patientId = patient._id;
    } else if (session!.user.role === UserRole.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: session!.user.id });
      if (!doctor) return errorResponse('Doctor not found', 404);
      filter.doctorId = doctor._id;
    }

    if (status) filter.status = status;

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email image' } })
        .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email image' } })
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

// PATCH /api/appointments — cancel appointment
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.PATIENT]);
  if (error) return error;

  try {
    await connectDB();
    const { appointmentId } = await req.json();

    const patient = await Patient.findOne({ userId: session!.user.id });
    if (!patient) return errorResponse('Patient not found', 404);

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: patient._id,
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.PAID] },
    });

    if (!appointment) return errorResponse('Appointment not found or cannot be cancelled', 404);

    appointment.status = AppointmentStatus.CANCELLED;
    await appointment.save();

    return successResponse({ appointment, message: 'Appointment cancelled' });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
