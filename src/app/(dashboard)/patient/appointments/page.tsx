'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, Video, XCircle, DollarSign, Star,
  ChevronDown, MessageSquare, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['ALL', 'PENDING', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function PatientAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      if (data.success) setAppointments(data.data.appointments || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, action: 'cancel' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Appointment cancelled');
        fetchAppointments();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const handlePay = async (id: string) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id }),
      });
      const data = await res.json();
      if (data.success) {
        // Simulate payment success confirmation
        const confirmRes = await fetch('/api/payments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: data.data.paymentId || data.data._id,
            status: 'SUCCESS',
            transactionId: `txn_${Date.now()}`,
          }),
        });
        const confirmData = await confirmRes.json();
        if (confirmData.success) {
          toast.success('Payment successful! Appointment confirmed.');
          fetchAppointments();
        } else {
          toast.error(confirmData.error);
        }
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Payment failed');
    }
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: reviewModal, rating, comment }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Review submitted!');
        setReviewModal(null);
        setRating(5);
        setComment('');
        fetchAppointments();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinVideo = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/video?appointmentId=${appointmentId}`);
      const data = await res.json();
      if (data.success && data.data.roomId) {
        router.push(`/consultation?room=${data.data.roomId}&appointment=${appointmentId}`);
      } else {
        toast.error(data.error || 'Video session not available');
      }
    } catch {
      toast.error('Failed to join');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading">My Appointments</h1>
          <p className="mt-1 text-sm text-shefa-500">Track and manage your consultations</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-shefa-600 text-white'
                : 'bg-shefa-50 text-shefa-600 hover:bg-shefa-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-shefa-400">
          <Calendar className="h-12 w-12 mb-3" />
          <p className="font-medium">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt: any) => (
            <div key={apt._id} className="card">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-shefa-100 text-lg font-bold text-shefa-700">
                  {apt.doctorId?.userId?.name?.[0] || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-shefa-900">
                        Dr. {apt.doctorId?.userId?.name || 'Doctor'}
                      </p>
                      <p className="text-sm text-shefa-500">{apt.doctorId?.specialization}</p>
                    </div>
                    <span className={`status-${apt.status.toLowerCase()} shrink-0`}>{apt.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-shefa-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(apt.scheduledDate).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {apt.timeSlot?.start} - {apt.timeSlot?.end}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${apt.consultationFee}
                    </span>
                  </div>
                  {apt.reason && (
                    <p className="mt-2 text-xs text-shefa-400">Reason: {apt.reason}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {apt.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handlePay(apt._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-shefa-50 px-3 py-1.5 text-xs font-semibold text-shefa-700 hover:bg-shefa-100 transition-colors"
                        >
                          <DollarSign className="h-3.5 w-3.5" /> Pay Now
                        </button>
                        <button
                          onClick={() => handleCancel(apt._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </>
                    )}
                    {apt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleJoinVideo(apt._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Call
                      </button>
                    )}
                    {apt.status === 'COMPLETED' && (
                      <button
                        onClick={() => setReviewModal(apt._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <Star className="h-3.5 w-3.5" /> Leave Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card max-w-md w-full">
            <h3 className="font-display text-lg font-semibold text-shefa-900 mb-4">
              Rate Your Experience
            </h3>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`h-7 w-7 transition-colors ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-shefa-200'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)..."
              className="input-field resize-none mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button onClick={handleReview} disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
