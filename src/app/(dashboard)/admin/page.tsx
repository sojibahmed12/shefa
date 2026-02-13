'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users, UserCheck, Calendar, DollarSign, Clock, TrendingUp,
  AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Analytics {
  totalUsers: number;
  totalDoctors: number;
  activeDoctors: number;
  pendingDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  recentAppointments: any[];
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const [analyticsRes, doctorsRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/admin/doctors?status=PENDING'),
      ]);

      const analyticsData = await analyticsRes.json();
      const doctorsData = await doctorsRes.json();

      if (analyticsData.success) setAnalytics(analyticsData.data);
      if (doctorsData.success) setPendingDoctors(doctorsData.data.doctors);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorAction = async (doctorId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Doctor ${action}d successfully`);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-heading">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-shefa-500">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        {[
          { label: 'Total Users', value: analytics?.totalUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active Doctors', value: analytics?.activeDoctors || 0, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Appointments', value: analytics?.totalAppointments || 0, icon: Calendar, color: 'bg-violet-50 text-violet-600' },
          { label: 'Revenue', value: `$${(analytics?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between">
              <div className={`inline-flex rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <TrendingUp className="h-4 w-4 text-shefa-300" />
            </div>
            <p className="mt-4 text-2xl font-bold text-shefa-900">{stat.value}</p>
            <p className="text-sm text-shefa-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Doctors */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-semibold text-shefa-900">
            Pending Doctor Approvals
          </h2>
          {analytics?.pendingDoctors ? (
            <span className="status-pending">{analytics.pendingDoctors} pending</span>
          ) : null}
        </div>

        {pendingDoctors.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-shefa-400">
            <CheckCircle2 className="h-10 w-10 mb-2" />
            <p>No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingDoctors.map((doctor: any) => (
              <div key={doctor._id} className="flex items-center gap-4 rounded-xl border border-shefa-100 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-shefa-100 text-lg font-semibold text-shefa-700">
                  {doctor.userId?.name?.[0] || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-shefa-900">{doctor.userId?.name}</p>
                  <p className="text-sm text-shefa-500">{doctor.specialization} · {doctor.experience} yrs · License: {doctor.licenseNumber}</p>
                  <p className="text-xs text-shefa-400">{doctor.userId?.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDoctorAction(doctor._id, 'approve')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleDoctorAction(doctor._id, 'reject')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <h2 className="mb-6 font-display text-lg font-semibold text-shefa-900">Recent Appointments</h2>
        {analytics?.recentAppointments && analytics.recentAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-shefa-100 text-left text-xs font-medium text-shefa-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Patient</th>
                  <th className="pb-3 pr-4">Doctor</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shefa-50">
                {analytics.recentAppointments.map((apt: any) => (
                  <tr key={apt._id}>
                    <td className="py-3 pr-4 font-medium text-shefa-900">
                      {apt.patientId?.userId?.name || 'N/A'}
                    </td>
                    <td className="py-3 pr-4 text-shefa-600">
                      {apt.doctorId?.userId?.name || 'N/A'}
                    </td>
                    <td className="py-3 pr-4 text-shefa-500">
                      {new Date(apt.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`status-${apt.status.toLowerCase()}`}>{apt.status}</span>
                    </td>
                    <td className="py-3 font-medium text-shefa-900">${apt.consultationFee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-sm text-shefa-400 py-8">No appointments yet</p>
        )}
      </div>
    </div>
  );
}
