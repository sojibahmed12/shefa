import { Schema, model, models } from 'mongoose';

const MedicationSchema = new Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    diagnosis: { type: String, required: true },
    medications: [MedicationSchema],
    instructions: { type: String },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

PrescriptionSchema.index({ appointmentId: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });
PrescriptionSchema.index({ patientId: 1, createdAt: -1 });

const Prescription = models.Prescription || model('Prescription', PrescriptionSchema);
export default Prescription;
