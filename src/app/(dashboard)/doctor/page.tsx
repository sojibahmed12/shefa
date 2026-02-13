'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, Users, DollarSign, Star, Clock, Video, FileText,
  AlertCircle, CheckCircle2, ArrowRight, Play,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user.role !== 'DOCTOR') {
      router.push('/');
      return;
    }
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const [profileRes, aptsRes] = await Promise.all([
        fetch('/api/doctor/me'),
        fetch('/api/doctor/appointments?status=CONFIRMED&limit=10'),
      ]);

      const profileData = await profileRes.json();
      const aptsData = await aptsRes.json();

      if (profileData.success) setProfile(profileData.data);
      if (aptsData.success) setAppointments(aptsData.data.appointments);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId: string, action: string) => {
    try {
      const res = await fetch('/api/doctor/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.data.message || 'Action completed');
        if (action === 'start-video' && data.data.roomId) {
          router.push(`/consultation?room=${data.data.roomId}&appointment=${appointmentId}`);
        }
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
      </div>
    );
  }

  // Check approval status
  if (profile && profile.isApproved === 'PENDING') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-2xl bg-amber-50 p-8 text-center max-w-md">
          <Clock className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="font-display text-xl font-semibold text-amber-900">Pending Approval</h2>
          <p className="mt-2 text-sm text-amber-700">
            Your account is under review. You'll be notified once an admin approves your registration.
          </p>
        </div>
      </div>
    );
  }

  if (profile && profile.isApproved === 'REJECTED') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-2xl bg-red-50 p-8 text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="font-display text-xl font-semibold text-red-900">Registration Rejected</h2>
          <p className="mt-2 text-sm text-red-700">
            Unfortunately, your registration was not approved. Please contact support for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-heading">Welcome, Dr. {session?.user.name?.split(' ').pop()}</h1>
        <p className="mt-1 text-sm text-shefa-500">Here's your practice overview</p>
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        {[
          { label: 'Consultation Fee', value: `$${profile?.consultationFee || 0}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Average Rating', value: profile?.rating?.average?.toFixed(1) || '0.0', icon: Star, color: 'bg-amber-50 text-amber-600' },
          { label: 'Total Reviews', value: profile?.rating?.count || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Upcoming', value: appointments.length, icon: Calendar, color: 'bg-violet-50 text-violet-600' },
        ].map((stat, i) => (
          <div key={i} className="card">
            <div className={`inline-flex rounded-xl p-2.5 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-bold text-shefa-900">{stat.value}</p>
            <p className="text-sm text-shefa-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Confirmed Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-semibold text-shefa-900">Confirmed Appointments</h2>
          <Link href="/doctor/appointments" className="btn-ghost text-xs">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-shefa-400">
            <Calendar className="h-10 w-10 mb-2" />
            <p>No confirmed appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt: any) => (
              <div key={apt._id} className="flex items-center gap-4 rounded-xl border border-shefa-100 p-4 hover:bg-shefa-50/50 transition-colors">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                  {apt.patientId?.userId?.name?.[0] || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-shefa-900">{apt.patientId?.userId?.name || 'Patient'}</p>
                  <p className="text-xs text-shefa-500">
                    {new Date(apt.scheduledDate).toLocaleDateString()} · {apt.timeSlot?.start} - {apt.timeSlot?.end}
                  </p>
                  {apt.reason && <p className="mt-1 text-xs text-shefa-400">{apt.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(apt._id, 'start-video')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Video className="h-3.5 w-3.5" /> Start Call
                  </button>
                  <button
                    onClick={() => handleAction(apt._id, 'complete')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
