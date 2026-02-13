import { Schema, model, models } from 'mongoose';
import { ApprovalStatus } from '@/types';

const AvailabilitySlotSchema = new Schema(
  {
    day: { type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const DoctorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true, trim: true },
    qualifications: [{ type: String }],
    experience: { type: Number, required: true, min: 0 },
    bio: { type: String, default: '' },
    consultationFee: { type: Number, required: true, min: 0 },
    availability: [AvailabilitySlotSchema],
    isApproved: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    licenseNumber: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
DoctorSchema.index({ userId: 1 }, { unique: true });
DoctorSchema.index({ isApproved: 1, specialization: 1 });
DoctorSchema.index({ 'rating.average': -1 });
DoctorSchema.index({ consultationFee: 1 });

const Doctor = models.Doctor || model('Doctor', DoctorSchema);
export default Doctor;
