'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users, UserCheck, Calendar, DollarSign, TrendingUp,
  Clock, CheckCircle2, XCircle, BarChart3, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user.role !== 'ADMIN') { router.push('/'); return; }
    fetchAnalytics();
  }, [session]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: analytics?.totalUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-600', desc: 'All registered users' },
    { label: 'Active Doctors', value: analytics?.activeDoctors || 0, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600', desc: 'Approved & active' },
    { label: 'Pending Doctors', value: analytics?.pendingDoctors || 0, icon: Clock, color: 'bg-amber-50 text-amber-600', desc: 'Awaiting approval' },
    { label: 'Total Patients', value: analytics?.totalPatients || 0, icon: Users, color: 'bg-violet-50 text-violet-600', desc: 'Registered patients' },
    { label: 'Total Appointments', value: analytics?.totalAppointments || 0, icon: Calendar, color: 'bg-sky-50 text-sky-600', desc: 'All time' },
    { label: 'Completed', value: analytics?.completedAppointments || 0, icon: CheckCircle2, color: 'bg-teal-50 text-teal-600', desc: 'Successful consultations' },
    { label: 'Total Revenue', value: `$${(analytics?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600', desc: 'From payments' },
    { label: 'Avg Revenue/Apt', value: `$${analytics?.completedAppointments ? Math.round(analytics.totalRevenue / analytics.completedAppointments) : 0}`, icon: TrendingUp, color: 'bg-pink-50 text-pink-600', desc: 'Per appointment' },
  ];

  // Calculate appointment status breakdown
  const statusBreakdown = analytics?.statusBreakdown || {};
  const totalApts = analytics?.totalAppointments || 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-heading">Platform Analytics</h1>
        <p className="mt-1 text-sm text-shefa-500">Comprehensive platform statistics and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between">
              <div className={`inline-flex rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-shefa-900">{stat.value}</p>
            <p className="text-sm font-medium text-shefa-700">{stat.label}</p>
            <p className="text-xs text-shefa-400">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Appointment Status Breakdown */}
      <div className="card">
        <h2 className="mb-6 font-display text-lg font-semibold text-shefa-900">
          Appointment Status Breakdown
        </h2>
        <div className="space-y-4">
          {[
            { status: 'CONFIRMED', color: 'bg-blue-500', label: 'Confirmed' },
            { status: 'COMPLETED', color: 'bg-emerald-500', label: 'Completed' },
            { status: 'PAID', color: 'bg-violet-500', label: 'Paid' },
            { status: 'PENDING', color: 'bg-amber-500', label: 'Pending' },
            { status: 'CANCELLED', color: 'bg-red-500', label: 'Cancelled' },
          ].map(item => {
            const count = statusBreakdown[item.status] || 0;
            const pct = Math.round((count / totalApts) * 100) || 0;
            return (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-shefa-700">{item.label}</span>
                  <span className="text-sm text-shefa-500">{count} ({pct}%)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-shefa-100">
                  <div
                    className={`h-2.5 rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trend */}
      {analytics?.monthlyTrend && analytics.monthlyTrend.length > 0 && (
        <div className="card">
          <h2 className="mb-6 font-display text-lg font-semibold text-shefa-900">
            Monthly Appointments
          </h2>
          <div className="flex items-end gap-2 h-48">
            {analytics.monthlyTrend.map((m: any, i: number) => {
              const maxCount = Math.max(...analytics.monthlyTrend.map((x: any) => x.count || 0), 1);
              const height = Math.max(((m.count || 0) / maxCount) * 100, 4);
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-shefa-700">{m.count || 0}</span>
                  <div
                    className="w-full rounded-t-lg bg-shefa-400 hover:bg-shefa-500 transition-colors"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-shefa-400">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Appointments */}
      <div className="card">
        <h2 className="mb-6 font-display text-lg font-semibold text-shefa-900">
          Recent Activity
        </h2>
        {analytics?.recentAppointments?.length > 0 ? (
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
          <p className="text-center text-sm text-shefa-400 py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
}
