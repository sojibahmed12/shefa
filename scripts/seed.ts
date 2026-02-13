/**
 * SHEFA Database Seed Script
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed.ts
 * Or:  npx tsx scripts/seed.ts
 * 
 * Requires: MONGODB_URI in .env
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shefa';

// ---- Schemas (inline to avoid import issues) ----

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  image: String,
  isSuspended: { type: Boolean, default: false },
}, { timestamps: true });

const DoctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  specialization: String,
  qualifications: [String],
  experience: Number,
  consultationFee: Number,
  bio: String,
  licenseNumber: String,
  isApproved: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  availability: [{
    day: String,
    startTime: String,
    endTime: String,
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
}, { timestamps: true });

const PatientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: String,
  allergies: [String],
  phone: String,
  address: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
}, { timestamps: true });

const AppointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  scheduledDate: Date,
  timeSlot: { start: String, end: String },
  status: { type: String, enum: ['PENDING', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] },
  reason: String,
  consultationFee: Number,
}, { timestamps: true });

const PaymentSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  amount: Number,
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] },
  transactionId: String,
  method: String,
}, { timestamps: true });

const PrescriptionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  diagnosis: String,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    notes: String,
  }],
  instructions: String,
  followUpDate: Date,
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', unique: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  rating: Number,
  comment: String,
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  message: String,
  type: { type: String, enum: ['APPOINTMENT', 'PAYMENT', 'VIDEO', 'APPROVAL', 'PRESCRIPTION', 'REVIEW', 'SYSTEM'] },
  isRead: { type: Boolean, default: false },
  link: String,
}, { timestamps: true });

// Models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    Payment.deleteMany({}),
    Prescription.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('✅ Cleared\n');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // ---- CREATE USERS ----
  console.log('👤 Creating users...');

  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@shefa.health',
    password: hashedPassword,
    role: 'ADMIN',
  });

  const doctorUsers = await User.insertMany([
    { name: 'Dr. Sarah Ahmed', email: 'sarah@shefa.health', password: hashedPassword, role: 'DOCTOR' },
    { name: 'Dr. James Wilson', email: 'james@shefa.health', password: hashedPassword, role: 'DOCTOR' },
    { name: 'Dr. Maria Garcia', email: 'maria@shefa.health', password: hashedPassword, role: 'DOCTOR' },
    { name: 'Dr. Ravi Patel', email: 'ravi@shefa.health', password: hashedPassword, role: 'DOCTOR' },
    { name: 'Dr. Emily Chen', email: 'emily@shefa.health', password: hashedPassword, role: 'DOCTOR' },
  ]);

  const patientUsers = await User.insertMany([
    { name: 'John Smith', email: 'john@example.com', password: hashedPassword, role: 'PATIENT' },
    { name: 'Alice Johnson', email: 'alice@example.com', password: hashedPassword, role: 'PATIENT' },
    { name: 'Bob Williams', email: 'bob@example.com', password: hashedPassword, role: 'PATIENT' },
    { name: 'Emma Brown', email: 'emma@example.com', password: hashedPassword, role: 'PATIENT' },
    { name: 'David Lee', email: 'david@example.com', password: hashedPassword, role: 'PATIENT' },
  ]);

  console.log(`  ✅ Created 1 admin, ${doctorUsers.length} doctors, ${patientUsers.length} patients\n`);

  // ---- CREATE DOCTORS ----
  console.log('🩺 Creating doctor profiles...');

  const doctorProfiles = await Doctor.insertMany([
    {
      userId: doctorUsers[0]._id,
      specialization: 'Cardiology',
      qualifications: ['MBBS', 'MD Cardiology', 'FACC'],
      experience: 12,
      consultationFee: 150,
      bio: 'Expert cardiologist with over 12 years of experience in interventional cardiology.',
      licenseNumber: 'MED-2013-001',
      isApproved: 'APPROVED',
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', startTime: '10:00', endTime: '15:00' },
      ],
      rating: { average: 4.8, count: 24 },
    },
    {
      userId: doctorUsers[1]._id,
      specialization: 'Dermatology',
      qualifications: ['MBBS', 'MD Dermatology'],
      experience: 8,
      consultationFee: 120,
      bio: 'Specialized in skin conditions, cosmetic dermatology, and skin cancer screening.',
      licenseNumber: 'MED-2016-042',
      isApproved: 'APPROVED',
      availability: [
        { day: 'Tuesday', startTime: '08:00', endTime: '16:00' },
        { day: 'Thursday', startTime: '08:00', endTime: '16:00' },
      ],
      rating: { average: 4.6, count: 18 },
    },
    {
      userId: doctorUsers[2]._id,
      specialization: 'Pediatrics',
      qualifications: ['MBBS', 'DCH', 'MD Pediatrics'],
      experience: 15,
      consultationFee: 100,
      bio: 'Compassionate pediatrician dedicated to child health and development.',
      licenseNumber: 'MED-2009-078',
      isApproved: 'APPROVED',
      availability: [
        { day: 'Monday', startTime: '08:00', endTime: '14:00' },
        { day: 'Wednesday', startTime: '08:00', endTime: '14:00' },
        { day: 'Friday', startTime: '08:00', endTime: '14:00' },
      ],
      rating: { average: 4.9, count: 32 },
    },
    {
      userId: doctorUsers[3]._id,
      specialization: 'Neurology',
      qualifications: ['MBBS', 'DM Neurology'],
      experience: 10,
      consultationFee: 200,
      bio: 'Neurologist specializing in headache disorders, epilepsy, and movement disorders.',
      licenseNumber: 'MED-2014-156',
      isApproved: 'PENDING', // Still pending
      availability: [
        { day: 'Monday', startTime: '10:00', endTime: '18:00' },
        { day: 'Thursday', startTime: '10:00', endTime: '18:00' },
      ],
      rating: { average: 0, count: 0 },
    },
    {
      userId: doctorUsers[4]._id,
      specialization: 'Psychiatry',
      qualifications: ['MBBS', 'MD Psychiatry', 'Fellowship CBT'],
      experience: 7,
      consultationFee: 180,
      bio: 'Mental health specialist focusing on anxiety, depression, and cognitive behavioral therapy.',
      licenseNumber: 'MED-2017-203',
      isApproved: 'APPROVED',
      availability: [
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
        { day: 'Saturday', startTime: '10:00', endTime: '14:00' },
      ],
      rating: { average: 4.7, count: 15 },
    },
  ]);
  console.log(`  ✅ Created ${doctorProfiles.length} doctor profiles (1 pending)\n`);

  // ---- CREATE PATIENTS ----
  console.log('🧑‍🦱 Creating patient profiles...');

  const patientProfiles = await Patient.insertMany([
    {
      userId: patientUsers[0]._id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
      phone: '+1-555-0101',
      address: '123 Main St, New York, NY 10001',
      emergencyContact: { name: 'Jane Smith', phone: '+1-555-0102', relationship: 'Spouse' },
    },
    {
      userId: patientUsers[1]._id,
      dateOfBirth: new Date('1985-11-22'),
      gender: 'female',
      bloodGroup: 'A+',
      allergies: [],
      phone: '+1-555-0201',
      address: '456 Oak Ave, Los Angeles, CA 90001',
    },
    {
      userId: patientUsers[2]._id,
      dateOfBirth: new Date('1998-03-08'),
      gender: 'male',
      bloodGroup: 'B+',
      allergies: ['Sulfa drugs', 'Latex'],
      phone: '+1-555-0301',
    },
    {
      userId: patientUsers[3]._id,
      dateOfBirth: new Date('1992-07-30'),
      gender: 'female',
      bloodGroup: 'AB-',
      allergies: [],
      phone: '+1-555-0401',
      address: '789 Elm Rd, Chicago, IL 60601',
    },
    {
      userId: patientUsers[4]._id,
      dateOfBirth: new Date('2001-01-12'),
      gender: 'male',
      bloodGroup: 'O-',
      phone: '+1-555-0501',
    },
  ]);
  console.log(`  ✅ Created ${patientProfiles.length} patient profiles\n`);

  // ---- CREATE APPOINTMENTS ----
  console.log('📅 Creating appointments...');

  const now = new Date();
  const futureDate = (days: number) => new Date(now.getTime() + days * 86400000);
  const pastDate = (days: number) => new Date(now.getTime() - days * 86400000);

  const appointments = await Appointment.insertMany([
    // Completed appointments
    { doctorId: doctorProfiles[0]._id, patientId: patientProfiles[0]._id, scheduledDate: pastDate(10), timeSlot: { start: '10:00', end: '10:30' }, status: 'COMPLETED', reason: 'Chest pain evaluation', consultationFee: 150 },
    { doctorId: doctorProfiles[0]._id, patientId: patientProfiles[1]._id, scheduledDate: pastDate(8), timeSlot: { start: '14:00', end: '14:30' }, status: 'COMPLETED', reason: 'Annual heart checkup', consultationFee: 150 },
    { doctorId: doctorProfiles[1]._id, patientId: patientProfiles[2]._id, scheduledDate: pastDate(5), timeSlot: { start: '09:00', end: '09:30' }, status: 'COMPLETED', reason: 'Skin rash treatment', consultationFee: 120 },
    { doctorId: doctorProfiles[2]._id, patientId: patientProfiles[3]._id, scheduledDate: pastDate(3), timeSlot: { start: '11:00', end: '11:30' }, status: 'COMPLETED', reason: 'Child vaccination consultation', consultationFee: 100 },
    { doctorId: doctorProfiles[4]._id, patientId: patientProfiles[0]._id, scheduledDate: pastDate(2), timeSlot: { start: '15:00', end: '15:45' }, status: 'COMPLETED', reason: 'Anxiety management', consultationFee: 180 },
    // Confirmed (upcoming)
    { doctorId: doctorProfiles[0]._id, patientId: patientProfiles[3]._id, scheduledDate: futureDate(2), timeSlot: { start: '10:00', end: '10:30' }, status: 'CONFIRMED', reason: 'Follow-up ECG review', consultationFee: 150 },
    { doctorId: doctorProfiles[1]._id, patientId: patientProfiles[4]._id, scheduledDate: futureDate(3), timeSlot: { start: '11:00', end: '11:30' }, status: 'CONFIRMED', reason: 'Acne treatment', consultationFee: 120 },
    { doctorId: doctorProfiles[4]._id, patientId: patientProfiles[1]._id, scheduledDate: futureDate(4), timeSlot: { start: '14:00', end: '14:45' }, status: 'CONFIRMED', reason: 'Depression follow-up', consultationFee: 180 },
    // Pending / Paid
    { doctorId: doctorProfiles[2]._id, patientId: patientProfiles[0]._id, scheduledDate: futureDate(5), timeSlot: { start: '09:00', end: '09:30' }, status: 'PAID', reason: 'Child fever consultation', consultationFee: 100 },
    { doctorId: doctorProfiles[0]._id, patientId: patientProfiles[4]._id, scheduledDate: futureDate(7), timeSlot: { start: '15:00', end: '15:30' }, status: 'PENDING', reason: 'Heart palpitations', consultationFee: 150 },
    // Cancelled
    { doctorId: doctorProfiles[1]._id, patientId: patientProfiles[3]._id, scheduledDate: pastDate(1), timeSlot: { start: '10:00', end: '10:30' }, status: 'CANCELLED', reason: 'Eczema consultation', consultationFee: 120 },
  ]);
  console.log(`  ✅ Created ${appointments.length} appointments\n`);

  // ---- CREATE PAYMENTS ----
  console.log('💳 Creating payments...');

  const completedApts = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CONFIRMED' || a.status === 'PAID');
  const paymentDocs = completedApts.map((apt, i) => ({
    appointmentId: apt._id,
    patientId: apt.patientId,
    doctorId: apt.doctorId,
    amount: apt.consultationFee,
    status: 'SUCCESS',
    transactionId: `TXN-${Date.now()}-${i.toString().padStart(3, '0')}`,
    method: 'stripe',
  }));
  const payments = await Payment.insertMany(paymentDocs);
  console.log(`  ✅ Created ${payments.length} payments\n`);

  // ---- CREATE PRESCRIPTIONS ----
  console.log('📝 Creating prescriptions...');

  const completedOnly = appointments.filter(a => a.status === 'COMPLETED');
  const prescriptions = await Prescription.insertMany([
    {
      appointmentId: completedOnly[0]._id,
      doctorId: completedOnly[0].doctorId,
      patientId: completedOnly[0].patientId,
      diagnosis: 'Mild angina pectoris',
      medications: [
        { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '30 days', notes: 'Take after breakfast' },
        { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at night', duration: '30 days', notes: '' },
      ],
      instructions: 'Avoid heavy physical activity. Follow up in 4 weeks. Low-sodium diet recommended.',
      followUpDate: futureDate(30),
    },
    {
      appointmentId: completedOnly[2]._id,
      doctorId: completedOnly[2].doctorId,
      patientId: completedOnly[2].patientId,
      diagnosis: 'Contact dermatitis',
      medications: [
        { name: 'Hydrocortisone cream', dosage: '1%', frequency: 'Twice daily', duration: '14 days', notes: 'Apply thin layer to affected area' },
        { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '7 days', notes: 'For itching relief' },
      ],
      instructions: 'Avoid contact with suspected allergens. Keep skin moisturized.',
      followUpDate: futureDate(14),
    },
    {
      appointmentId: completedOnly[4]._id,
      doctorId: completedOnly[4].doctorId,
      patientId: completedOnly[4].patientId,
      diagnosis: 'Generalized anxiety disorder',
      medications: [
        { name: 'Escitalopram', dosage: '10mg', frequency: 'Once daily', duration: '90 days', notes: 'Do not stop abruptly' },
      ],
      instructions: 'Practice breathing exercises. Maintain regular sleep schedule. Weekly CBT sessions recommended.',
      followUpDate: futureDate(30),
    },
  ]);
  console.log(`  ✅ Created ${prescriptions.length} prescriptions\n`);

  // ---- CREATE REVIEWS ----
  console.log('⭐ Creating reviews...');

  const reviews = await Review.insertMany([
    { appointmentId: completedOnly[0]._id, doctorId: completedOnly[0].doctorId, patientId: completedOnly[0].patientId, rating: 5, comment: 'Excellent doctor! Very thorough examination and clear explanation.' },
    { appointmentId: completedOnly[1]._id, doctorId: completedOnly[1].doctorId, patientId: completedOnly[1].patientId, rating: 4, comment: 'Great consultation. Professional and caring.' },
    { appointmentId: completedOnly[2]._id, doctorId: completedOnly[2].doctorId, patientId: completedOnly[2].patientId, rating: 5, comment: 'Quick diagnosis and effective treatment. Highly recommended!' },
    { appointmentId: completedOnly[3]._id, doctorId: completedOnly[3].doctorId, patientId: completedOnly[3].patientId, rating: 5, comment: 'Amazing with children. Very patient and understanding.' },
    { appointmentId: completedOnly[4]._id, doctorId: completedOnly[4].doctorId, patientId: completedOnly[4].patientId, rating: 4, comment: 'Very helpful session. Feeling much better with the treatment plan.' },
  ]);
  console.log(`  ✅ Created ${reviews.length} reviews\n`);

  // ---- CREATE NOTIFICATIONS ----
  console.log('🔔 Creating notifications...');

  const notifications = await Notification.insertMany([
    { userId: patientUsers[0]._id, title: 'Appointment Confirmed', message: 'Your appointment with Dr. Sarah Ahmed has been confirmed.', type: 'APPOINTMENT', link: '/patient/appointments' },
    { userId: patientUsers[0]._id, title: 'Prescription Available', message: 'Dr. Sarah Ahmed has issued a prescription for your recent visit.', type: 'PRESCRIPTION', link: '/patient/prescriptions' },
    { userId: doctorUsers[0]._id, title: 'New Review', message: 'John Smith left a 5-star review for your consultation.', type: 'REVIEW', link: '/doctor/appointments' },
    { userId: doctorUsers[3]._id, title: 'Registration Pending', message: 'Your doctor registration is under review. We\'ll notify you once approved.', type: 'APPROVAL' },
    { userId: adminUser._id, title: 'New Doctor Registration', message: 'Dr. Ravi Patel has submitted a registration request.', type: 'APPROVAL', link: '/admin/doctors' },
    { userId: patientUsers[1]._id, title: 'Payment Successful', message: 'Payment of $150 for Dr. Sarah Ahmed consultation was successful.', type: 'PAYMENT', link: '/patient/payments' },
    { userId: patientUsers[3]._id, title: 'Upcoming Appointment', message: 'Reminder: You have an appointment with Dr. Sarah Ahmed in 2 days.', type: 'APPOINTMENT', link: '/patient/appointments' },
  ]);
  console.log(`  ✅ Created ${notifications.length} notifications\n`);

  // ---- SUMMARY ----
  console.log('═══════════════════════════════════════');
  console.log('🎉 SEED COMPLETE!');
  console.log('═══════════════════════════════════════\n');
  console.log('📋 Test Accounts (password: password123):\n');
  console.log('  👨‍💼 Admin:   admin@shefa.health');
  console.log('  👨‍⚕️ Doctor:  sarah@shefa.health (approved)');
  console.log('  👨‍⚕️ Doctor:  ravi@shefa.health  (pending)');
  console.log('  🧑‍🦱 Patient: john@example.com');
  console.log('  🧑‍🦱 Patient: alice@example.com\n');
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
