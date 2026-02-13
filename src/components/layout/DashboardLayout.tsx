'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Heart, LayoutDashboard, Calendar, Users, FileText, Star, Settings, LogOut,
  Bell, Menu, X, ChevronDown, Stethoscope, CreditCard, FolderOpen,
  BarChart3, UserCheck, Shield,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Pending Doctors', href: '/admin/doctors', icon: UserCheck },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

const doctorNav: NavItem[] = [
  { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
  { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
  { label: 'Prescriptions', href: '/doctor/prescriptions', icon: FileText },
  { label: 'Profile', href: '/doctor/profile', icon: Settings },
];

const patientNav: NavItem[] = [
  { label: 'Dashboard', href: '/patient', icon: LayoutDashboard },
  { label: 'Find Doctors', href: '/patient/doctors', icon: Stethoscope },
  { label: 'Appointments', href: '/patient/appointments', icon: Calendar },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: FileText },
  { label: 'Records', href: '/patient/records', icon: FolderOpen },
  { label: 'Payments', href: '/patient/payments', icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!session) return null;

  const navItems =
    session.user.role === 'ADMIN'
      ? adminNav
      : session.user.role === 'DOCTOR'
      ? doctorNav
      : patientNav;

  const roleColor =
    session.user.role === 'ADMIN'
      ? 'from-violet-500 to-purple-600'
      : session.user.role === 'DOCTOR'
      ? 'from-shefa-500 to-shefa-700'
      : 'from-blue-500 to-blue-700';

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-shefa-100/60 bg-white transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-shefa-100/60 px-6">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${roleColor} shadow-md`}>
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-shefa-900">SHEFA</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-shefa-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-6 py-4">
          <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${roleColor} px-3 py-1 text-xs font-semibold text-white`}>
            <Shield className="h-3 w-3" />
            {session.user.role}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-shefa-50 text-shefa-700 shadow-sm'
                    : 'text-shefa-500 hover:bg-gray-50 hover:text-shefa-700'
                )}
              >
                <item.icon className={clsx('h-4.5 w-4.5', isActive ? 'text-shefa-600' : '')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-shefa-100/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-shefa-100 text-sm font-semibold text-shefa-700">
              {session.user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-shefa-900">{session.user.name}</p>
              <p className="truncate text-xs text-shefa-400">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="glass sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-shefa-100/60 px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-shefa-500">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Link href="/notifications" className="relative rounded-lg p-2 text-shefa-500 transition-colors hover:bg-shefa-50">
            <Bell className="h-5 w-5" />
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
