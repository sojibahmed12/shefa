import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import User from '@/lib/models/User';
import Doctor from '@/lib/models/Doctor';
import Appointment from '@/lib/models/Appointment';
import Payment from '@/lib/models/Payment';
import { requireAuth, successResponse, errorResponse } from '@/lib/utils/api';
import { UserRole, ApprovalStatus, AppointmentStatus, PaymentStatus } from '@/types';

export async function GET(req: NextRequest) {
  const { error } = await requireAuth([UserRole.ADMIN]);
  if (error) return error;

  try {
    await connectDB();

    const [
      totalUsers,
      totalDoctors,
      activeDoctors,
      pendingDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      revenueResult,
      recentAppointments,
      monthlyRevenue,
      statusBreakdownRaw,
      monthlyAppointments,
    ] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Doctor.countDocuments({ isApproved: ApprovalStatus.APPROVED }),
      Doctor.countDocuments({ isApproved: ApprovalStatus.PENDING }),
      User.countDocuments({ role: UserRole.PATIENT }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: AppointmentStatus.COMPLETED }),
      Payment.aggregate([
        { $match: { status: PaymentStatus.SUCCESS } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Appointment.find()
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' },
        })
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'name' },
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Payment.aggregate([
        { $match: { status: PaymentStatus.SUCCESS } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      // Status breakdown
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Monthly appointments trend (last 6 months)
      Appointment.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$scheduledDate' },
              month: { $month: '$scheduledDate' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 },
      ]),
    ]);

    // Transform status breakdown into object
    const statusBreakdown: Record<string, number> = {};
    statusBreakdownRaw.forEach((s: any) => { statusBreakdown[s._id] = s.count; });

    // Transform monthly appointments into chart data
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = monthlyAppointments.map((m: any) => ({
      month: monthNames[m._id.month],
      count: m.count,
    }));

    return successResponse({
      totalUsers,
      totalDoctors,
      activeDoctors,
      pendingDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      totalRevenue: revenueResult[0]?.total || 0,
      recentAppointments,
      monthlyRevenue,
      statusBreakdown,
      monthlyTrend,
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
