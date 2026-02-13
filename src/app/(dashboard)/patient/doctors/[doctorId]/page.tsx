'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Star, Award, DollarSign, Clock, Calendar,
  CheckCircle2, Stethoscope, MessageSquare, User,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorDetail() {
  const params = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchDoctor();
  }, [params.doctorId]);

  const fetchDoctor = async () => {
    try {
      const [docRes, revRes] = await Promise.all([
        fetch(`/api/doctors?doctorId=${params.doctorId}`),
        fetch(`/api/appointments/reviews?doctorId=${params.doctorId}`),
      ]);
      const docData = await docRes.json();
      const revData = await revRes.json();

      if (docData.success) setDoctor(docData.data.doctors?.[0] || docData.data);
      if (revData.success) setReviews(revData.data.reviews || []);
    } catch {
      toast.error('Failed to load doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot');
      return;
    }
    setBooking(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: params.doctorId,
          scheduledDate: selectedDate,
          timeSlot: selectedSlot,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Appointment created! Proceed to payment.');
        router.push(`/patient/appointments`);
      } else {
        toast.error(data.error || 'Booking failed');
      }
    } catch {
      toast.error('Booking failed');
    } finally {
      setBooking(false);
    }
  };

  // Generate next 7 days
  const getNextDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  // Filter availability by selected day of week
  const getAvailableSlots = () => {
    if (!selectedDate || !doctor?.availability) return [];
    const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return doctor.availability.filter((a: any) => a.day.toLowerCase() === dayName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center py-20 text-shefa-400">
        <Stethoscope className="h-12 w-12 mb-3" />
        <p>Doctor not found</p>
        <Link href="/patient/doctors" className="btn-primary mt-4 text-sm">Back to Doctors</Link>
      </div>
    );
  }

  const availableSlots = getAvailableSlots();

  return (
    <div className="space-y-6">
      <Link href="/patient/doctors" className="inline-flex items-center gap-1.5 text-sm text-shefa-500 hover:text-shefa-700">
        <ArrowLeft className="h-4 w-4" /> Back to Doctors
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Doctor Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-shefa-100 text-3xl font-bold text-shefa-700">
                {doctor.userId?.name?.[0] || 'D'}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-shefa-900">
                  Dr. {doctor.userId?.name}
                </h1>
                <p className="text-shefa-500 mt-0.5">{doctor.specialization}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-shefa-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500" />
                    {doctor.rating?.average?.toFixed(1) || '0.0'} ({doctor.rating?.count || 0} reviews)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    {doctor.experience} years experience
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    ${doctor.consultationFee} / session
                  </span>
                </div>
              </div>
            </div>

            {doctor.bio && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-shefa-700 mb-2">About</h3>
                <p className="text-sm text-shefa-600 leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            {doctor.qualifications && doctor.qualifications.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-shefa-700 mb-2">Qualifications</h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.qualifications.map((q: string, i: number) => (
                    <span key={i} className="rounded-full bg-shefa-50 px-3 py-1 text-xs font-medium text-shefa-600">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {doctor.licenseNumber && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-shefa-700 mb-1">License</h3>
                <p className="text-sm text-shefa-500">{doctor.licenseNumber}</p>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-shefa-900 mb-4">
              Patient Reviews
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-shefa-400 py-4 text-center">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev: any) => (
                  <div key={rev._id} className="rounded-xl border border-shefa-100 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-shefa-100 text-xs font-semibold text-shefa-700">
                        {rev.patientId?.userId?.name?.[0] || 'P'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-shefa-900">
                          {rev.patientId?.userId?.name || 'Patient'}
                        </p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-shefa-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-shefa-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {rev.comment && <p className="text-sm text-shefa-600">{rev.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Panel */}
        <div className="space-y-4">
          <div className="card sticky top-24">
            <h2 className="font-display text-lg font-semibold text-shefa-900 mb-1">
              Book Appointment
            </h2>
            <p className="text-sm text-shefa-500 mb-5">
              Consultation fee: <span className="font-bold text-shefa-900">${doctor.consultationFee}</span>
            </p>

            {/* Date Selection */}
            <label className="label-text">Select Date</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {getNextDays().map((d) => {
                const dateObj = new Date(d);
                return (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                    className={`rounded-lg border p-2 text-center text-xs transition-colors ${
                      selectedDate === d
                        ? 'border-shefa-500 bg-shefa-50 text-shefa-700 font-semibold'
                        : 'border-shefa-100 text-shefa-500 hover:border-shefa-300'
                    }`}
                  >
                    <div className="font-medium">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div>{dateObj.getDate()}</div>
                  </button>
                );
              })}
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <>
                <label className="label-text">Available Slots</label>
                {availableSlots.length === 0 ? (
                  <p className="text-xs text-shefa-400 py-3">No slots available for this day</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {availableSlots.map((slot: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSlot({ start: slot.startTime, end: slot.endTime })}
                        className={`rounded-lg border p-2 text-xs transition-colors ${
                          selectedSlot?.start === slot.startTime
                            ? 'border-shefa-500 bg-shefa-50 text-shefa-700 font-semibold'
                            : 'border-shefa-100 text-shefa-500 hover:border-shefa-300'
                        }`}
                      >
                        <Clock className="inline h-3 w-3 mr-1" />
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Reason */}
            <label className="label-text">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your concern..."
              className="input-field mb-4 resize-none"
              rows={3}
            />

            <button
              onClick={handleBook}
              disabled={booking || !selectedDate || !selectedSlot}
              className="btn-primary w-full disabled:opacity-50"
            >
              {booking ? 'Booking...' : `Book & Pay $${doctor.consultationFee}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
