'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, FileText, Heart, Clock, Star, Search,
  ArrowRight, Pill, FolderOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user.role !== 'PATIENT') {
      router.push('/');
      return;
    }
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const [profileRes, aptsRes, rxRes] = await Promise.all([
        fetch('/api/patient/me'),
        fetch('/api/appointments?status=CONFIRMED&limit=5'),
        fetch('/api/patient/prescriptions?limit=5'),
      ]);

      const profileData = await profileRes.json();
      const aptsData = await aptsRes.json();
      const rxData = await rxRes.json();

      if (profileData.success) setProfile(profileData.data);
      if (aptsData.success) setAppointments(aptsData.data.appointments || []);
      if (rxData.success) setPrescriptions(rxData.data.prescriptions || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-heading">
          Welcome back, {session?.user.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-shefa-500">
          Manage your health from one place
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Find Doctor', icon: Search, href: '/patient/doctors', color: 'bg-shefa-50 text-shefa-600' },
          { label: 'Appointments', icon: Calendar, href: '/patient/appointments', color: 'bg-blue-50 text-blue-600' },
          { label: 'Prescriptions', icon: Pill, href: '/patient/prescriptions', color: 'bg-violet-50 text-violet-600' },
          { label: 'Records', icon: FolderOpen, href: '/patient/records', color: 'bg-amber-50 text-amber-600' },
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="card group flex flex-col items-center gap-3 py-6 text-center hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex rounded-xl p-3 ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-shefa-700 group-hover:text-shefa-900">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Profile Completion Hint */}
      {profile && !profile.phone && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Heart className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">Complete your profile</p>
              <p className="mt-0.5 text-xs text-amber-700">
                Add your phone number, blood group, and allergies for better consultations.
              </p>
              <Link href="/patient/profile" className="mt-2 inline-block text-xs font-semibold text-amber-800 hover:text-amber-900">
                Update Profile →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-semibold text-shefa-900">
            Upcoming Appointments
          </h2>
          <Link href="/patient/appointments" className="btn-ghost text-xs">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-shefa-400">
            <Calendar className="h-10 w-10 mb-2" />
            <p className="text-sm">No upcoming appointments</p>
            <Link href="/patient/doctors" className="btn-primary mt-4 text-xs">
              Book a Consultation
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt: any) => (
              <div key={apt._id} className="flex items-center gap-4 rounded-xl border border-shefa-100 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-shefa-100 text-sm font-semibold text-shefa-700">
                  {apt.doctorId?.userId?.name?.[0] || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-shefa-900">
                    Dr. {apt.doctorId?.userId?.name || 'Doctor'}
                  </p>
                  <p className="text-xs text-shefa-500">
                    {apt.doctorId?.specialization} · {new Date(apt.scheduledDate).toLocaleDateString()} · {apt.timeSlot?.start}
                  </p>
                </div>
                <span className={`status-${apt.status.toLowerCase()}`}>{apt.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Prescriptions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-semibold text-shefa-900">
            Recent Prescriptions
          </h2>
          <Link href="/patient/prescriptions" className="btn-ghost text-xs">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {prescriptions.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-shefa-400">
            <FileText className="h-10 w-10 mb-2" />
            <p className="text-sm">No prescriptions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx: any) => (
              <div key={rx._id} className="flex items-center gap-4 rounded-xl border border-shefa-100 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                  <Pill className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-shefa-900">{rx.diagnosis}</p>
                  <p className="text-xs text-shefa-500">
                    Dr. {rx.doctorId?.userId?.name} · {new Date(rx.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-shefa-400 mt-0.5">
                    {rx.medications?.length || 0} medication(s)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
