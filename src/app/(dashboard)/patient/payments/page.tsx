'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, DollarSign, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, Receipt, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

type StatusFilter = 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';

export default function PatientPaymentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (session?.user.role !== 'PATIENT') { router.push('/'); return; }
    fetchPayments();
  }, [session, statusFilter, page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'ALL' ? '' : statusFilter;
      const res = await fetch(`/api/payments?status=${status}&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data.payments || []);
        setTotal(data.data.total || 0);
      }
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'REFUNDED': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const statusColor: Record<string, string> = {
    SUCCESS: 'bg-emerald-50 text-emerald-700',
    FAILED: 'bg-red-50 text-red-700',
    PENDING: 'bg-amber-50 text-amber-700',
    REFUNDED: 'bg-blue-50 text-blue-700',
  };

  // Calculate totals
  const totalPaid = payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Payment History</h1>
        <p className="mt-1 text-sm text-shefa-500">Track all your consultation payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card">
          <div className="inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-shefa-900">${totalPaid}</p>
          <p className="text-xs text-shefa-500">Total Paid</p>
        </div>
        <div className="card">
          <div className="inline-flex rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Receipt className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-shefa-900">{payments.length}</p>
          <p className="text-xs text-shefa-500">Transactions</p>
        </div>
        <div className="card">
          <div className="inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-shefa-900">
            {payments.filter(p => p.status === 'SUCCESS').length}
          </p>
          <p className="text-xs text-shefa-500">Successful</p>
        </div>
        <div className="card">
          <div className="inline-flex rounded-xl bg-amber-50 p-2.5 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-shefa-900">
            {payments.filter(p => p.status === 'PENDING').length}
          </p>
          <p className="text-xs text-shefa-500">Pending</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'] as StatusFilter[]).map(status => (
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

      {/* Payments Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-shefa-400">
            <CreditCard className="h-12 w-12 mb-3" />
            <p>No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-shefa-100 text-left text-xs font-medium text-shefa-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Doctor</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shefa-50">
                {payments.map(payment => (
                  <tr key={payment._id} className="hover:bg-shefa-50/50">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-shefa-100 text-xs font-semibold text-shefa-700">
                          {payment.doctorId?.userId?.name?.[0] || 'D'}
                        </div>
                        <span className="font-medium text-shefa-900">
                          Dr. {payment.doctorId?.userId?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-shefa-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pr-4 font-semibold text-shefa-900">
                      ${payment.amount}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor[payment.status] || ''}`}>
                        {statusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-shefa-400 font-mono">
                      {payment.transactionId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="mt-4 flex items-center justify-between border-t border-shefa-100 pt-4">
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
