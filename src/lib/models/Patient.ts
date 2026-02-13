import { Schema, model, models } from 'mongoose';

const PatientSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    allergies: [{ type: String }],
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
  },
  { timestamps: true }
);

PatientSchema.index({ userId: 1 }, { unique: true });

const Patient = models.Patient || model('Patient', PatientSchema);
export default Patient;
