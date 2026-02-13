'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Video, CheckCircle2, Clock, FileText,
  ChevronLeft, ChevronRight, Search, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

type StatusFilter = 'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export default function DoctorAppointmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (session?.user.role !== 'DOCTOR') { router.push('/'); return; }
    fetchAppointments();
  }, [session, statusFilter, page]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'ALL' ? '' : statusFilter;
      const res = await fetch(`/api/doctor/appointments?status=${status}&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data.appointments);
        setTotal(data.data.total || 0);
      }
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
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
        toast.success(data.data.message || 'Done');
        if (action === 'start-video' && data.data.roomId) {
          router.push(`/consultation?room=${data.data.roomId}&appointment=${appointmentId}`);
        }
        fetchAppointments();
      } else toast.error(data.error);
    } catch { toast.error('Action failed'); }
  };

  const filtered = appointments.filter(a =>
    !search ||
    a.patientId?.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">My Appointments</h1>
        <p className="mt-1 text-sm text-shefa-500">Manage your consultations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as StatusFilter[]).map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === status ? 'bg-shefa-600 text-white' : 'bg-shefa-50 text-shefa-600 hover:bg-shefa-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-shefa-300" />
          <input type="text" placeholder="Search patients..." value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
        </div>
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-shefa-400">
            <Calendar className="h-12 w-12 mb-3" />
            <p>No appointments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(apt => (
              <div key={apt._id} className="rounded-xl border border-shefa-100 p-4 hover:bg-shefa-50/30 transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                    {apt.patientId?.userId?.name?.[0] || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-shefa-900">{apt.patientId?.userId?.name || 'Patient'}</p>
                      <span className={`status-${apt.status.toLowerCase()}`}>{apt.status}</span>
                    </div>
                    <p className="text-xs text-shefa-500 mt-0.5">
                      📅 {new Date(apt.scheduledDate).toLocaleDateString()} · ⏰ {apt.timeSlot?.start} - {apt.timeSlot?.end} · 💰 ${apt.consultationFee}
                    </p>
                    {apt.reason && <p className="text-xs text-shefa-400 mt-0.5">{apt.reason}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {apt.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleAction(apt._id, 'start-video')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Video className="h-3.5 w-3.5" /> Start Call
                        </button>
                        <button
                          onClick={() => router.push(`/doctor/prescriptions?appointmentId=${apt._id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" /> Prescribe
                        </button>
                        <button
                          onClick={() => handleAction(apt._id, 'complete')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                        </button>
                      </>
                    )}
                    {apt.status === 'COMPLETED' && (
                      <button
                        onClick={() => router.push(`/doctor/prescriptions?appointmentId=${apt._id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-shefa-50 px-3 py-2 text-xs font-semibold text-shefa-700 hover:bg-shefa-100 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Rx
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > limit && (
          <div className="mt-6 flex items-center justify-between border-t border-shefa-100 pt-4">
            <p className="text-xs text-shefa-500">Page {page} of {Math.ceil(total / limit)}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg border border-shefa-200 p-1.5 text-shefa-500 hover:bg-shefa-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}
                className="rounded-lg border border-shefa-200 p-1.5 text-shefa-500 hover:bg-shefa-50 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
