import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/connection';
import User from '@/lib/models/User';
import Doctor from '@/lib/models/Doctor';
import Patient from '@/lib/models/Patient';
import { registerSchema, doctorRegisterSchema } from '@/lib/validators';
import { successResponse, errorResponse } from '@/lib/utils/api';
import { UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Determine if doctor or patient registration
    const isDoctor = body.role === 'DOCTOR';
    const validation = isDoctor
      ? doctorRegisterSchema.safeParse(body)
      : registerSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const data = validation.data;

    // Check existing user
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return errorResponse('Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: isDoctor ? UserRole.DOCTOR : UserRole.PATIENT,
    });

    if (isDoctor) {
      const doctorData = data as typeof data & {
        specialization: string;
        qualifications: string[];
        experience: number;
        consultationFee: number;
        licenseNumber: string;
        bio?: string;
      };
      await Doctor.create({
        userId: user._id,
        specialization: doctorData.specialization,
        qualifications: doctorData.qualifications,
        experience: doctorData.experience,
        consultationFee: doctorData.consultationFee,
        licenseNumber: doctorData.licenseNumber,
        bio: doctorData.bio || '',
      });
    } else {
      await Patient.create({ userId: user._id });
    }

    return successResponse(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      201
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return errorResponse(error.message || 'Registration failed', 500);
  }
}
