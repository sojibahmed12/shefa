import { Schema, model, models } from 'mongoose';
import { VideoSessionStatus } from '@/types';

const VideoSessionSchema = new Schema(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    roomId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(VideoSessionStatus),
      default: VideoSessionStatus.WAITING,
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number }, // seconds
  },
  { timestamps: true }
);

VideoSessionSchema.index({ appointmentId: 1 }, { unique: true });
VideoSessionSchema.index({ roomId: 1 }, { unique: true });
VideoSessionSchema.index({ status: 1, createdAt: -1 });

const VideoSession = models.VideoSession || model('VideoSession', VideoSessionSchema);
export default VideoSession;
