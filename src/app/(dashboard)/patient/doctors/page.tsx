'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Star, MapPin, Clock, DollarSign, Filter, ChevronDown,
  Stethoscope, Award, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  'All', 'General Practice', 'Cardiology', 'Dermatology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Ophthalmology', 'ENT',
  'Gynecology', 'Urology', 'Gastroenterology', 'Pulmonology', 'Oncology',
];

export default function BrowseDoctors() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('All');
  const [sort, setSort] = useState('rating');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
      if (search) params.set('q', search);
      if (specialization !== 'All') params.set('specialization', specialization);

      const res = await fetch(`/api/doctors?${params}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data.doctors);
        setTotal(data.data.total);
      }
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [page, search, specialization, sort]);

  useEffect(() => {
    const debounce = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(debounce);
  }, [fetchDoctors]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Find a Doctor</h1>
        <p className="mt-1 text-sm text-shefa-500">Browse verified specialists and book consultations</p>
      </div>

      {/* Search & Filters */}
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-shefa-400" />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={specialization}
              onChange={(e) => { setSpecialization(e.target.value); setPage(1); }}
              className="input-field min-w-[160px]"
            >
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field min-w-[130px]"
            >
              <option value="rating">Top Rated</option>
              <option value="fee_asc">Fee: Low→High</option>
              <option value="fee_desc">Fee: High→Low</option>
              <option value="experience">Experience</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-shefa-400">
          <Stethoscope className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">No doctors found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-shefa-500">{total} doctor(s) found</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc: any) => (
              <div
                key={doc._id}
                className="card group cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/patient/doctors/${doc._id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-shefa-100 text-xl font-bold text-shefa-700">
                    {doc.userId?.name?.[0] || 'D'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-shefa-900 group-hover:text-shefa-700 transition-colors">
                      Dr. {doc.userId?.name}
                    </h3>
                    <p className="text-sm text-shefa-500">{doc.specialization}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-shefa-500">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    {doc.rating?.average?.toFixed(1) || '0.0'} ({doc.rating?.count || 0})
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    {doc.experience} yrs
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    ${doc.consultationFee}
                  </span>
                </div>

                {doc.qualifications && doc.qualifications.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {doc.qualifications.slice(0, 3).map((q: string, i: number) => (
                      <span key={i} className="rounded-full bg-shefa-50 px-2.5 py-0.5 text-[11px] font-medium text-shefa-600">
                        {q}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-ghost text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-shefa-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-ghost text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
