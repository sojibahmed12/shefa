import { Schema, model, models } from 'mongoose';

const ReviewSchema = new Schema(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

ReviewSchema.index({ appointmentId: 1 }, { unique: true });
ReviewSchema.index({ doctorId: 1, createdAt: -1 });
ReviewSchema.index({ doctorId: 1, rating: -1 });

const Review = models.Review || model('Review', ReviewSchema);
export default Review;
