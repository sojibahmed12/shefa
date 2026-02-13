import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Patient from '@/lib/models/Patient';
import Doctor from '@/lib/models/Doctor';
import MedicalRecord from '@/lib/models/MedicalRecord';
import Appointment from '@/lib/models/Appointment';
import { requireAuth, successResponse, errorResponse } from '@/lib/utils/api';
import { UserRole } from '@/types';
import { medicalRecordSchema } from '@/lib/validators';

// POST — upload medical record
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.PATIENT, UserRole.DOCTOR]);
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();
    const validation = medicalRecordSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.errors[0].message);

    let patientId: string;

    if (session!.user.role === UserRole.PATIENT) {
      const patient = await Patient.findOne({ userId: session!.user.id });
      if (!patient) return errorResponse('Patient not found', 404);
      patientId = patient._id.toString();
    } else {
      // Doctor uploading — must have appointment linkage
      if (!validation.data.appointmentId) {
        return errorResponse('Doctor must provide appointmentId');
      }
      const doctor = await Doctor.findOne({ userId: session!.user.id });
      if (!doctor) return errorResponse('Doctor not found', 404);

      const appointment = await Appointment.findOne({
        _id: validation.data.appointmentId,
        doctorId: doctor._id,
      });
      if (!appointment) return errorResponse('Appointment not found or unauthorized', 404);
      patientId = appointment.patientId.toString();
    }

    const record = await MedicalRecord.create({
      ...validation.data,
      patientId,
      uploadedBy: session!.user.id,
    });

    return successResponse(record, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// GET — view medical records
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.PATIENT, UserRole.DOCTOR]);
  if (error) return error;

  try {
    await connectDB();
    let filter: any = {};

    if (session!.user.role === UserRole.PATIENT) {
      const patient = await Patient.findOne({ userId: session!.user.id });
      if (!patient) return errorResponse('Patient not found', 404);
      filter.patientId = patient._id;
    } else {
      // Doctor can only see records linked to their appointments
      const doctor = await Doctor.findOne({ userId: session!.user.id });
      if (!doctor) return errorResponse('Doctor not found', 404);

      const appointments = await Appointment.find({ doctorId: doctor._id }).select('_id patientId');
      const patientIds = [...new Set(appointments.map((a) => a.patientId.toString()))];
      filter.patientId = { $in: patientIds };
    }

    const records = await MedicalRecord.find(filter)
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({ records });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
