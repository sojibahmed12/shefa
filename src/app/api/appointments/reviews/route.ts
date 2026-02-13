import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Patient from '@/lib/models/Patient';
import Doctor from '@/lib/models/Doctor';
import Appointment from '@/lib/models/Appointment';
import Review from '@/lib/models/Review';
import { requireAuth, successResponse, errorResponse, parsePagination } from '@/lib/utils/api';
import { UserRole, AppointmentStatus } from '@/types';
import { reviewSchema } from '@/lib/validators';

// POST /api/appointments/reviews — patient submits a review
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.PATIENT]);
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();
    const { appointmentId, ...reviewData } = body;

    const validation = reviewSchema.safeParse(reviewData);
    if (!validation.success) return errorResponse(validation.error.errors[0].message);

    const patient = await Patient.findOne({ userId: session!.user.id });
    if (!patient) return errorResponse('Patient not found', 404);

    // Verify appointment is completed and belongs to patient
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: patient._id,
      status: AppointmentStatus.COMPLETED,
    });

    if (!appointment) {
      return errorResponse('Appointment not found or not completed', 404);
    }

    // Check existing review (one per appointment)
    const existing = await Review.findOne({ appointmentId: appointment._id });
    if (existing) return errorResponse('Review already submitted for this appointment');

    const review = await Review.create({
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: patient._id,
      ...validation.data,
    });

    // Update doctor's average rating
    const allReviews = await Review.find({ doctorId: appointment.doctorId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Doctor.findByIdAndUpdate(appointment.doctorId, {
      rating: { average: Math.round(avgRating * 10) / 10, count: allReviews.length },
    });

    return successResponse(review, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// GET /api/appointments/reviews?doctorId= — public doctor reviews
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const doctorId = searchParams.get('doctorId');
    const { page, limit, skip } = parsePagination(searchParams);

    if (!doctorId) return errorResponse('doctorId required');

    const [reviews, total] = await Promise.all([
      Review.find({ doctorId })
        .populate({ path: 'patientId', populate: { path: 'userId', select: 'name image' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ doctorId }),
    ]);

    return successResponse({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
