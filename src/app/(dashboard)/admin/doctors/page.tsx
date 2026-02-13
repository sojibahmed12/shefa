'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  UserCheck, Clock, CheckCircle2, XCircle, Search,
  ChevronLeft, ChevronRight, AlertCircle, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AdminDoctorsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (session?.user.role !== 'ADMIN') { router.push('/'); return; }
    fetchDoctors();
  }, [session, statusFilter, page]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors?status=${statusFilter}&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data.doctors);
        setTotal(data.data.total || 0);
      }
    } catch { toast.error('Failed to load doctors'); }
    finally { setLoading(false); }
  };

  const handleAction = async (doctorId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Doctor ${action}d successfully`);
        fetchDoctors();
      } else toast.error(data.error);
    } catch { toast.error('Action failed'); }
  };

  const filtered = doctors.filter(d =>
    !search || d.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    d.userId?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Doctor Management</h1>
        <p className="mt-1 text-sm text-shefa-500">Review and manage doctor registrations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-shefa-600 text-white'
                  : 'bg-shefa-50 text-shefa-600 hover:bg-shefa-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-shefa-300" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      {/* Doctors List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-shefa-400">
            <UserCheck className="h-12 w-12 mb-3" />
            <p>No doctors found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(doctor => (
              <div key={doctor._id} className="rounded-xl border border-shefa-100 p-5 hover:bg-shefa-50/30 transition-colors">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-shefa-100 text-xl font-bold text-shefa-700">
                    {doctor.userId?.name?.[0] || 'D'}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-shefa-900">{doctor.userId?.name}</h3>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[doctor.isApproved] || ''}`}>
                        {doctor.isApproved}
                      </span>
                    </div>
                    <p className="text-sm text-shefa-600">{doctor.specialization}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-shefa-500">
                      <span>📧 {doctor.userId?.email}</span>
                      <span>🪪 License: {doctor.licenseNumber}</span>
                      <span>🏥 {doctor.experience} years experience</span>
                      <span>💰 ${doctor.consultationFee}</span>
                    </div>
                    {doctor.qualifications?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {doctor.qualifications.map((q: string, i: number) => (
                          <span key={i} className="rounded-md bg-shefa-50 px-2 py-0.5 text-[10px] font-medium text-shefa-600">
                            {q}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {doctor.isApproved === 'PENDING' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(doctor._id, 'approve')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(doctor._id, 'reject')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="mt-6 flex items-center justify-between border-t border-shefa-100 pt-4">
            <p className="text-xs text-shefa-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-shefa-200 p-1.5 text-shefa-500 hover:bg-shefa-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="rounded-lg border border-shefa-200 p-1.5 text-shefa-500 hover:bg-shefa-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
