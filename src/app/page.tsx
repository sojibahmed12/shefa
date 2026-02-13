'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Shield,
  Video,
  FileText,
  Clock,
  Star,
  Users,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Lock,
  Activity,
  Heart,
} from 'lucide-react';

export default function HomePage() {
  const { data: session } = useSession();

  const getDashboardLink = () => {
    if (!session) return '/auth/login';
    switch (session.user.role) {
      case 'ADMIN': return '/admin';
      case 'DOCTOR': return '/doctor';
      case 'PATIENT': return '/patient';
      default: return '/auth/login';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="glass fixed top-0 z-50 w-full border-b border-shefa-100/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-shefa-600 shadow-lg shadow-shefa-600/30">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-shefa-900">SHEFA</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-shefa-600 hover:text-shefa-800 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-shefa-600 hover:text-shefa-800 transition-colors">
              How It Works
            </a>
            <a href="#trust" className="text-sm font-medium text-shefa-600 hover:text-shefa-800 transition-colors">
              Trust & Security
            </a>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <Link href={getDashboardLink()} className="btn-primary">
                Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mesh-gradient relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-shefa-200 blur-3xl" />
          <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-shefa-100 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-shefa-100 px-4 py-2 text-sm font-medium text-shefa-700">
              <Shield className="h-4 w-4" />
              Secure • Verified • Private
            </div>

            <h1 className="font-display text-5xl font-bold leading-tight text-shefa-950 sm:text-6xl lg:text-7xl">
              Healthcare,
              <br />
              <span className="bg-gradient-to-r from-shefa-600 to-medical-accent bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-shefa-600 sm:text-xl">
              Consult verified doctors from the comfort of your home. Secure video consultations,
              digital prescriptions, and complete medical record management — all in one platform.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth/register" className="btn-primary px-8 py-4 text-base">
                Book a Consultation <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/auth/register?role=DOCTOR" className="btn-secondary px-8 py-4 text-base">
                <Stethoscope className="h-5 w-5" /> Join as Doctor
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-shefa-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-shefa-500" />
                Admin-verified doctors
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-shefa-500" />
                End-to-end encrypted
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-shefa-500" />
                HIPAA-inspired design
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-shefa-900 sm:text-4xl">
              Everything You Need for
              <br />
              Modern Healthcare
            </h2>
            <p className="mt-4 text-lg text-shefa-500">
              A complete telemedicine ecosystem built with security at its core.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Video,
                title: 'In-App Video Calls',
                description: 'Browser-native WebRTC video consultations. No external tools needed.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: FileText,
                title: 'Digital Prescriptions',
                description: 'Structured prescriptions linked to appointments. Downloadable & printable.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                icon: Shield,
                title: 'Strict Access Control',
                description: 'Appointment-based data isolation. No appointment = no access.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: Clock,
                title: 'Smart Scheduling',
                description: 'Doctor-defined availability with real-time slot management.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: Star,
                title: 'Verified Reviews',
                description: 'One review per completed appointment. No spam, no fakes.',
                color: 'bg-rose-50 text-rose-600',
              },
              {
                icon: Activity,
                title: 'Admin Analytics',
                description: 'Real-time platform monitoring, revenue tracking, and user management.',
                color: 'bg-cyan-50 text-cyan-600',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="card group cursor-default"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`inline-flex rounded-xl p-3 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-shefa-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-shefa-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-shefa-50/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-shefa-900 sm:text-4xl">
              How SHEFA Works
            </h2>
            <p className="mt-4 text-lg text-shefa-500">
              From booking to prescription, everything flows through appointments.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-4">
            {[
              { step: '01', title: 'Choose Doctor', desc: 'Browse verified doctors by specialty, rating, or fee.' },
              { step: '02', title: 'Book & Pay', desc: 'Select a time slot and complete secure payment.' },
              { step: '03', title: 'Video Consult', desc: 'Join the in-app video call at your scheduled time.' },
              { step: '04', title: 'Get Prescription', desc: 'Receive a digital prescription and manage records.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-shefa-600 font-display text-xl font-bold text-white shadow-lg shadow-shefa-600/30">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-shefa-900">{item.title}</h3>
                <p className="mt-2 text-sm text-shefa-500">{item.desc}</p>
                {i < 3 && (
                  <div className="absolute right-0 top-8 hidden lg:block">
                    <ArrowRight className="h-5 w-5 text-shefa-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-shefa-900 sm:text-4xl">
                Built on Trust &<br />Privacy-First Design
              </h2>
              <p className="mt-4 text-lg text-shefa-500">
                Every feature in SHEFA is designed with security and compliance awareness at its foundation.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  { icon: Lock, text: 'Encrypted passwords and HTTPS-only communication' },
                  { icon: Shield, text: 'Session-based authentication with JWT tokens' },
                  { icon: Users, text: 'Role-based access control at API, DB & UI levels' },
                  { icon: Activity, text: 'HIPAA-inspired design principles' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-shefa-100">
                      <item.icon className="h-4 w-4 text-shefa-600" />
                    </div>
                    <p className="text-sm leading-relaxed text-shefa-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-elevated p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-shefa-50 p-4">
                  <div className="h-3 w-3 rounded-full bg-shefa-500 animate-pulse-soft" />
                  <span className="text-sm font-medium text-shefa-700">Doctor verified by admin</span>
                  <CheckCircle2 className="ml-auto h-5 w-5 text-shefa-500" />
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-shefa-50 p-4">
                  <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse-soft" />
                  <span className="text-sm font-medium text-shefa-700">Payment confirmed</span>
                  <CheckCircle2 className="ml-auto h-5 w-5 text-shefa-500" />
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-shefa-50 p-4">
                  <div className="h-3 w-3 rounded-full bg-violet-500 animate-pulse-soft" />
                  <span className="text-sm font-medium text-shefa-700">Appointment data isolated</span>
                  <CheckCircle2 className="ml-auto h-5 w-5 text-shefa-500" />
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-shefa-50 p-4">
                  <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse-soft" />
                  <span className="text-sm font-medium text-shefa-700">Video room access-controlled</span>
                  <CheckCircle2 className="ml-auto h-5 w-5 text-shefa-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-shefa-900 py-20">
        <div className="mx-auto max-w-3xl text-center px-6">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready for Better Healthcare?
          </h2>
          <p className="mt-4 text-lg text-shefa-300">
            Join SHEFA today and experience secure, professional telemedicine.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-shefa-900 transition-all hover:bg-shefa-50"
            >
              Start Now <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-shefa-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-shefa-600" />
              <span className="font-display text-lg font-bold text-shefa-900">SHEFA</span>
            </div>
            <p className="text-sm text-shefa-500">
              © {new Date().getFullYear()} SHEFA Telemedicine. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
