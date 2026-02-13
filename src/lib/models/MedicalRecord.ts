import { Schema, model, models } from 'mongoose';

const MedicalRecordSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
  },
  { timestamps: true }
);

MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
MedicalRecordSchema.index({ appointmentId: 1, createdAt: -1 });
MedicalRecordSchema.index({ uploadedBy: 1, createdAt: -1 });

const MedicalRecord = models.MedicalRecord || model('MedicalRecord', MedicalRecordSchema);
export default MedicalRecord;
