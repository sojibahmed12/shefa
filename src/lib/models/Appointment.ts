import { Schema, model, models } from 'mongoose';
import { AppointmentStatus } from '@/types';

const AppointmentSchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    scheduledDate: { type: Date, required: true },
    timeSlot: {
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING,
    },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
    consultationFee: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Indexes — core query hub
AppointmentSchema.index({ doctorId: 1, scheduledDate: -1 });
AppointmentSchema.index({ patientId: 1, scheduledDate: -1 });
AppointmentSchema.index({ status: 1, scheduledDate: -1 });
AppointmentSchema.index({ doctorId: 1, status: 1, scheduledDate: -1 });
AppointmentSchema.index({ patientId: 1, status: 1, scheduledDate: -1 });

const Appointment = models.Appointment || model('Appointment', AppointmentSchema);
export default Appointment;
