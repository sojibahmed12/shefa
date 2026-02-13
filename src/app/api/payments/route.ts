import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import Patient from '@/lib/models/Patient';
import Appointment from '@/lib/models/Appointment';
import Payment from '@/lib/models/Payment';
import Notification from '@/lib/models/Notification';
import { requireAuth, successResponse, errorResponse } from '@/lib/utils/api';
import { UserRole, AppointmentStatus, PaymentStatus } from '@/types';

// POST /api/payments — initiate payment for an appointment
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth([UserRole.PATIENT]);
  if (error) return error;

  try {
    await connectDB();
    const { appointmentId } = await req.json();

    const patient = await Patient.findOne({ userId: session!.user.id });
    if (!patient) return errorResponse('Patient not found', 404);

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: patient._id,
      status: AppointmentStatus.PENDING,
    }).populate('doctorId');

    if (!appointment) {
      return errorResponse('Appointment not found or not in pending state', 404);
    }

    // Check for existing payment
    const existingPayment = await Payment.findOne({ appointmentId: appointment._id });
    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      return errorResponse('Payment already completed');
    }

    // In production, create Stripe checkout session here
    // For now, simulate payment creation
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment = await Payment.create({
      appointmentId: appointment._id,
      patientId: patient._id,
      doctorId: appointment.doctorId,
      amount: appointment.consultationFee,
      currency: 'usd',
      status: PaymentStatus.PENDING,
      transactionId,
      paymentMethod: 'card',
    });

    // In production: return Stripe checkout URL
    // For demo: auto-confirm payment
    return successResponse({
      payment,
      // checkoutUrl: stripeSession.url, // production
      message: 'Payment initiated',
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// PATCH /api/payments — confirm payment (simulates webhook)
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { transactionId, status } = await req.json();

    const payment = await Payment.findOne({ transactionId });
    if (!payment) return errorResponse('Payment not found', 404);

    if (status === 'SUCCESS') {
      payment.status = PaymentStatus.SUCCESS;
      payment.paidAt = new Date();
      await payment.save();

      // Update appointment to CONFIRMED
      await Appointment.findByIdAndUpdate(payment.appointmentId, {
        status: AppointmentStatus.CONFIRMED,
      });

      // Notify both parties
      const appointment = await Appointment.findById(payment.appointmentId)
        .populate('doctorId')
        .populate('patientId');

      if (appointment) {
        await Notification.create([
          {
            userId: (appointment.doctorId as any).userId,
            title: 'Appointment Confirmed',
            message: 'Payment received. Appointment is now confirmed.',
            type: 'PAYMENT',
          },
          {
            userId: (appointment.patientId as any).userId,
            title: 'Payment Successful',
            message: 'Your appointment has been confirmed.',
            type: 'PAYMENT',
          },
        ]);
      }
    } else {
      payment.status = PaymentStatus.FAILED;
      await payment.save();
    }

    return successResponse({ payment });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

// GET /api/payments — get payment history
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    let filter: any = {};

    if (session!.user.role === UserRole.PATIENT) {
      const patient = await Patient.findOne({ userId: session!.user.id });
      if (patient) filter.patientId = patient._id;
    }

    const payments = await Payment.find(filter)
      .populate('appointmentId')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({ payments });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
