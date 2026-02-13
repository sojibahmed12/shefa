import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import Patient from '@/lib/models/Patient';
import Appointment from '@/lib/models/Appointment';
import Prescription from '@/lib/models/Prescription';
import Notification from '@/lib/models/Notification';
import { requireAuth, successResponse, errorResponse } from '@/lib/utils/api';
import { UserRole, AppointmentStatus } from '@/types';
import { prescriptionSchema } from '@/lib/validators';

// POST — doctor creates prescription
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.DOCTOR]);
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();
    const { appointmentId, ...prescriptionData } = body;

    const validation = prescriptionSchema.safeParse(prescriptionData);
    if (!validation.success) return errorResponse(validation.error.errors[0].message);

    const doctor = await Doctor.findOne({ userId: session!.user.id });
    if (!doctor) return errorResponse('Doctor not found', 404);

    // Verify appointment belongs to this doctor and is active
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctor._id,
      status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
    });

    if (!appointment) return errorResponse('Appointment not found or unauthorized', 404);

    const prescription = await Prescription.create({
      appointmentId: appointment._id,
      doctorId: doctor._id,
      patientId: appointment.patientId,
      ...validation.data,
      followUpDate: validation.data.followUpDate
        ? new Date(validation.data.followUpDate)
        : undefined,
    });

    // Notify patient
    const patient = await Patient.findById(appointment.patientId);
    if (patient) {
      await Notification.create({
        userId: patient.userId,
        title: 'New Prescription',
        message: 'Your doctor has issued a new prescription.',
        type: 'PRESCRIPTION',
        link: `/patient/prescriptions`,
      });
    }

    return successResponse(prescription, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// GET — view prescriptions (role-based)
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const appointmentId = searchParams.get('appointmentId');
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

    if (appointmentId) filter.appointmentId = appointmentId;

    const prescriptions = await Prescription.find(filter)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
      .populate('appointmentId', 'scheduledDate status')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({ prescriptions });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
