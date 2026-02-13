import { Schema, model, models } from 'mongoose';
import { PaymentStatus } from '@/types';

const PaymentSchema = new Schema(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    transactionId: { type: String, unique: true, sparse: true },
    paymentMethod: { type: String },
    stripeSessionId: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

PaymentSchema.index({ appointmentId: 1 }, { unique: true });
PaymentSchema.index({ patientId: 1, createdAt: -1 });
PaymentSchema.index({ doctorId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

const Payment = models.Payment || model('Payment', PaymentSchema);
export default Payment;
