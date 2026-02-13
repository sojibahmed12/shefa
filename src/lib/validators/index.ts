import { z } from 'zod';

// Auth
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PATIENT', 'DOCTOR']).default('PATIENT'),
});

export const doctorRegisterSchema = registerSchema.extend({
  role: z.literal('DOCTOR'),
  specialization: z.string().min(2),
  qualifications: z.array(z.string()).min(1, 'At least one qualification required'),
  experience: z.number().min(0),
  consultationFee: z.number().min(0),
  licenseNumber: z.string().min(3),
  bio: z.string().optional(),
});

// Doctor profile update
export const doctorProfileSchema = z.object({
  specialization: z.string().min(2).optional(),
  qualifications: z.array(z.string()).optional(),
  experience: z.number().min(0).optional(),
  bio: z.string().optional(),
});

export const doctorFeeSchema = z.object({
  consultationFee: z.number().min(0, 'Fee must be positive'),
});

export const availabilitySchema = z.object({
  availability: z.array(
    z.object({
      day: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:mm'),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:mm'),
      isActive: z.boolean().default(true),
    })
  ),
});

// Patient profile
export const patientProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relation: z.string(),
    })
    .optional(),
});

// Appointment
export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID required'),
  scheduledDate: z.string().min(1, 'Date required'),
  timeSlot: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  reason: z.string().optional(),
});

// Prescription
export const prescriptionSchema = z.object({
  diagnosis: z.string().min(1, 'Diagnosis required'),
  medications: z
    .array(
      z.object({
        name: z.string().min(1),
        dosage: z.string().min(1),
        frequency: z.string().min(1),
        duration: z.string().min(1),
        notes: z.string().optional(),
      })
    )
    .min(1, 'At least one medication required'),
  instructions: z.string().optional(),
  followUpDate: z.string().optional(),
});

// Review
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// Medical Record
export const medicalRecordSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileType: z.string().min(1),
  appointmentId: z.string().optional(),
});
