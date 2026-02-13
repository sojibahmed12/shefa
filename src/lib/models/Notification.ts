import { Schema, model, models } from 'mongoose';

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['APPOINTMENT', 'PAYMENT', 'APPROVAL', 'VIDEO', 'PRESCRIPTION', 'REVIEW', 'SYSTEM'],
      default: 'SYSTEM',
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = models.Notification || model('Notification', NotificationSchema);
export default Notification;
