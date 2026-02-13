'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, User, Stethoscope, Mail, Lock, ArrowRight, ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>(initialRole as any);
  const [loading, setLoading] = useState(false);

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Doctor-specific fields
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState<string[]>(['']);

  const addQualification = () => setQualifications([...qualifications, '']);
  const removeQualification = (i: number) =>
    setQualifications(qualifications.filter((_, idx) => idx !== i));
  const updateQualification = (i: number, val: string) => {
    const updated = [...qualifications];
    updated[i] = val;
    setQualifications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: any = { name, email, password, role };

      if (role === 'DOCTOR') {
        body.specialization = specialization;
        body.experience = parseInt(experience);
        body.consultationFee = parseFloat(consultationFee);
        body.licenseNumber = licenseNumber;
        body.bio = bio;
        body.qualifications = qualifications.filter((q) => q.trim());
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      toast.success(
        role === 'DOCTOR'
          ? 'Registration successful! Please wait for admin approval.'
          : 'Account created! Please sign in.'
      );
      router.push('/auth/login');
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mesh-gradient flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-shefa-600 shadow-lg shadow-shefa-600/30">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-shefa-900">SHEFA</span>
          </Link>
          <p className="mt-3 text-sm text-shefa-500">Create your account</p>
        </div>

        <div className="card-elevated">
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-center font-display text-xl font-semibold text-shefa-900">
                I want to join as
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setRole('PATIENT'); setStep(2); }}
                  className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                    role === 'PATIENT' ? 'border-shefa-500 bg-shefa-50' : 'border-shefa-100 hover:border-shefa-300'
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                    <User className="h-7 w-7" />
                  </div>
                  <span className="font-semibold text-shefa-900">Patient</span>
                  <span className="text-xs text-shefa-500">Book consultations</span>
                </button>

                <button
                  onClick={() => { setRole('DOCTOR'); setStep(2); }}
                  className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                    role === 'DOCTOR' ? 'border-shefa-500 bg-shefa-50' : 'border-shefa-100 hover:border-shefa-300'
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                    <Stethoscope className="h-7 w-7" />
                  </div>
                  <span className="font-semibold text-shefa-900">Doctor</span>
                  <span className="text-xs text-shefa-500">Offer consultations</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (role === 'DOCTOR') setStep(3);
                else handleSubmit(e);
              }}
              className="space-y-5"
            >
              <button type="button" onClick={() => setStep(1)} className="btn-ghost px-0 text-shefa-500">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <div>
                <label className="label-text">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Dr. Sarah Ahmed" required />
              </div>
              <div>
                <label className="label-text">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-shefa-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="label-text">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-shefa-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10" placeholder="Min 6 characters" minLength={6} required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {role === 'DOCTOR' ? (
                  <>Next: Professional Details <ArrowRight className="h-4 w-4" /></>
                ) : loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating...
                  </span>
                ) : (
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          )}

          {/* Step 3: Doctor Details */}
          {step === 3 && role === 'DOCTOR' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <button type="button" onClick={() => setStep(2)} className="btn-ghost px-0 text-shefa-500">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Specialization</label>
                  <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="input-field" placeholder="Cardiology" required />
                </div>
                <div>
                  <label className="label-text">Experience (years)</label>
                  <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className="input-field" placeholder="5" min="0" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Consultation Fee ($)</label>
                  <input type="number" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} className="input-field" placeholder="50" min="0" required />
                </div>
                <div>
                  <label className="label-text">License Number</label>
                  <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="input-field" placeholder="MD-12345" required />
                </div>
              </div>

              <div>
                <label className="label-text">Qualifications</label>
                {qualifications.map((q, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input type="text" value={q} onChange={(e) => updateQualification(i, e.target.value)} className="input-field" placeholder="MBBS, MD, etc." required />
                    {qualifications.length > 1 && (
                      <button type="button" onClick={() => removeQualification(i)} className="text-red-400 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addQualification} className="btn-ghost text-xs mt-1">
                  <Plus className="h-3 w-3" /> Add more
                </button>
              </div>

              <div>
                <label className="label-text">Bio (optional)</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input-field min-h-[80px] resize-none" placeholder="Brief introduction..." />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Registering...
                  </span>
                ) : (
                  <>Submit for Approval <ArrowRight className="h-4 w-4" /></>
                )}
              </button>

              <p className="text-center text-xs text-shefa-400">
                Your profile will be reviewed by an admin before activation.
              </p>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-shefa-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-shefa-600 hover:text-shefa-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
