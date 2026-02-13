import mongoose, { Schema, model, models } from 'mongoose';
import { UserRole } from '@/types';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    image: { type: String, default: '' },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PATIENT,
    },
    isSuspended: { type: Boolean, default: false },
    provider: { type: String, default: 'credentials' },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, isSuspended: 1 });
UserSchema.index({ createdAt: -1 });

const User = models.User || model('User', UserSchema);
export default User;
