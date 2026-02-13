'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Shield, ShieldOff, ChevronLeft, ChevronRight,
  UserCheck, Stethoscope, User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

type RoleFilter = 'ALL' | 'ADMIN' | 'DOCTOR' | 'PATIENT';

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  useEffect(() => {
    if (session?.user.role !== 'ADMIN') { router.push('/'); return; }
    fetchUsers();
  }, [session, roleFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const role = roleFilter === 'ALL' ? '' : roleFilter;
      const res = await fetch(`/api/admin/users?role=${role}&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.data.total || 0);
      }
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleSuspend = async (userId: string, action: 'suspend' | 'unsuspend') => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${action}ed successfully`);
        fetchUsers();
      } else toast.error(data.error);
    } catch { toast.error('Action failed'); }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleIcons: Record<string, any> = {
    ADMIN: Shield,
    DOCTOR: Stethoscope,
    PATIENT: UserIcon,
  };

  const roleBadgeColors: Record<string, string> = {
    ADMIN: 'bg-violet-50 text-violet-700',
    DOCTOR: 'bg-emerald-50 text-emerald-700',
    PATIENT: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">User Management</h1>
        <p className="mt-1 text-sm text-shefa-500">View and manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(['ALL', 'ADMIN', 'DOCTOR', 'PATIENT'] as RoleFilter[]).map(role => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                roleFilter === role
                  ? 'bg-shefa-600 text-white'
                  : 'bg-shefa-50 text-shefa-600 hover:bg-shefa-100'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-shefa-300" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-shefa-400">
            <Users className="h-12 w-12 mb-3" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-shefa-100 text-left text-xs font-medium text-shefa-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Joined</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shefa-50">
                {filtered.map(user => {
                  const RoleIcon = roleIcons[user.role] || UserIcon;
                  return (
                    <tr key={user._id} className="hover:bg-shefa-50/50">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-shefa-100 text-sm font-semibold text-shefa-700">
                            {user.name?.[0] || '?'}
                          </div>
                          <span className="font-medium text-shefa-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-shefa-600">{user.email}</td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadgeColors[user.role] || ''}`}>
                          <RoleIcon className="h-3 w-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        {user.isSuspended ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-shefa-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        {user._id !== session?.user.id && user.role !== 'ADMIN' && (
                          user.isSuspended ? (
                            <button
                              onClick={() => handleSuspend(user._id, 'unsuspend')}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              <UserCheck className="h-3.5 w-3.5" /> Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(user._id, 'suspend')}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                            >
                              <ShieldOff className="h-3.5 w-3.5" /> Suspend
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="mt-4 flex items-center justify-between border-t border-shefa-100 pt-4">
            <p className="text-xs text-shefa-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
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
