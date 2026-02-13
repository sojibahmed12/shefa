import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import Review from '@/lib/models/Review';
import { successResponse, errorResponse, parsePagination } from '@/lib/utils/api';
import { ApprovalStatus } from '@/types';

// GET /api/doctors — browse verified doctors (public)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(searchParams);

    const specialization = searchParams.get('specialization');
    const minRating = searchParams.get('minRating');
    const q = searchParams.get('q');
    const sortBy = searchParams.get('sort') || 'rating';

    // Only show approved doctors
    const filter: any = { isApproved: ApprovalStatus.APPROVED };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }
    if (minRating) {
      filter['rating.average'] = { $gte: parseFloat(minRating) };
    }

    let userFilter: any = {};
    if (q) {
      userFilter = { name: { $regex: q, $options: 'i' } };
    }

    // Sort options
    const sortOptions: any = {};
    if (sortBy === 'rating') sortOptions['rating.average'] = -1;
    else if (sortBy === 'fee-low') sortOptions.consultationFee = 1;
    else if (sortBy === 'fee-high') sortOptions.consultationFee = -1;
    else if (sortBy === 'experience') sortOptions.experience = -1;
    else sortOptions['rating.average'] = -1;

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate({
          path: 'userId',
          select: 'name email image',
          match: q ? userFilter : undefined,
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(filter),
    ]);

    // Filter out doctors where populate returned null (name search didn't match)
    const filteredDoctors = doctors.filter((d: any) => d.userId !== null);

    return successResponse({
      doctors: filteredDoctors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
