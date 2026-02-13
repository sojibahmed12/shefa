// ============================================
// SHEFA Platform - Type Definitions
// ============================================

import { Types } from 'mongoose';

// ---- Enums ----
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum VideoSessionStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

// ---- User ----
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  isSuspended: boolean;
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Doctor ----
export interface IDoctor {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  specialization: string;
  qualifications: string[];
  experience: number; // years
  bio: string;
  consultationFee: number;
  availability: IAvailabilitySlot[];
  isApproved: ApprovalStatus;
  rating: {
    average: number;
    count: number;
  };
  licenseNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvailabilitySlot {
  day: string; // MON, TUE, WED, THU, FRI, SAT, SUN
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isActive: boolean;
}

// ---- Patient ----
export interface IPatient {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  dateOfBirth?: Date;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  phone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ---- Appointment ----
export interface IAppointment {
  _id: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  scheduledDate: Date;
  timeSlot: {
    start: string;
    end: string;
  };
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  consultationFee: number;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Payment ----
export interface IPayment {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId: string;
  paymentMethod?: string;
  stripeSessionId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Video Session ----
export interface IVideoSession {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  roomId: string;
  status: VideoSessionStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

// ---- Prescription ----
export interface IPrescription {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  diagnosis: string;
  medications: IMedication[];
  instructions?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

// ---- Medical Record ----
export interface IMedicalRecord {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Review ----
export interface IReview {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Notification ----
export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- API Response Types ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ---- Session Extension ----
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: UserRole;
      isSuspended: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    isSuspended: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    isSuspended: boolean;
  }
}

// ---- Dashboard Types ----
export interface AdminAnalytics {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  activeDoctors: number;
  pendingDoctors: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  recentAppointments: IAppointment[];
}

export interface DoctorDashboardData {
  upcomingAppointments: IAppointment[];
  totalPatients: number;
  totalEarnings: number;
  rating: { average: number; count: number };
  todayAppointments: number;
}

export interface PatientDashboardData {
  upcomingAppointments: IAppointment[];
  pastAppointments: IAppointment[];
  totalConsultations: number;
  prescriptions: IPrescription[];
}
