'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Settings, DollarSign, Clock, Save, Plus, Trash2,
  Star, Stethoscope, GraduationCap, Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'General Medicine', 'Neurology', 'Obstetrics & Gynecology', 'Oncology',
  'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Surgery', 'Urology',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'fee' | 'availability'>('general');

  // General fields
  const [specialization, setSpecialization] = useState('');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newQualification, setNewQualification] = useState('');
  const [experience, setExperience] = useState(0);
  const [bio, setBio] = useState('');

  // Fee
  const [consultationFee, setConsultationFee] = useState(0);

  // Availability
  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user.role !== 'DOCTOR') { router.push('/'); return; }
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/doctor/me');
      const data = await res.json();
      if (data.success) {
        const p = data.data;
        setProfile(p);
        setSpecialization(p.specialization || '');
        setQualifications(p.qualifications || []);
        setExperience(p.experience || 0);
        setBio(p.bio || '');
        setConsultationFee(p.consultationFee || 0);
        setAvailability(p.availability || []);
      }
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      setQualifications(prev => [...prev, newQualification.trim()]);
      setNewQualification('');
    }
  };

  const removeQualification = (i: number) => {
    setQualifications(prev => prev.filter((_, idx) => idx !== i));
  };

  const addAvailabilitySlot = () => {
    setAvailability(prev => [...prev, { day: 'Monday', startTime: '09:00', endTime: '17:00' }]);
  };

  const updateAvailability = (i: number, field: string, value: string) => {
    setAvailability(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const removeAvailability = (i: number) => {
    setAvailability(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let body: any = {};
      let updateType = '';

      if (activeTab === 'general') {
        body = { specialization, qualifications, experience, bio };
      } else if (activeTab === 'fee') {
        updateType = 'fee';
        body = { consultationFee, updateType };
      } else {
        updateType = 'availability';
        body = { availability, updateType };
      }

      const res = await fetch('/api/doctor/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated');
        fetchProfile();
      } else toast.error(data.error);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
      </div>
    );
  }

  const tabs = [
    { key: 'general', label: 'General', icon: Stethoscope },
    { key: 'fee', label: 'Consultation Fee', icon: DollarSign },
    { key: 'availability', label: 'Availability', icon: Clock },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Profile Settings</h1>
        <p className="mt-1 text-sm text-shefa-500">Manage your professional profile</p>
      </div>

      {/* Profile Header */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-shefa-100 text-2xl font-bold text-shefa-700">
            {session?.user.name?.[0] || 'D'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-shefa-900">Dr. {session?.user.name}</h2>
            <p className="text-sm text-shefa-500">{profile?.specialization}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-shefa-400">⭐ {profile?.rating?.average?.toFixed(1) || '0.0'} ({profile?.rating?.count || 0} reviews)</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                profile?.isApproved === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {profile?.isApproved}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-shefa-100 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-shefa-600 text-shefa-900'
                : 'border-transparent text-shefa-500 hover:text-shefa-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'general' && (
          <div className="space-y-5">
            <div>
              <label className="label-text">Specialization</label>
              <select value={specialization} onChange={e => setSpecialization(e.target.value)} className="input-field">
                <option value="">Select...</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="label-text">Experience (years)</label>
              <input type="number" min={0} value={experience}
                onChange={e => setExperience(parseInt(e.target.value) || 0)} className="input-field" />
            </div>

            <div>
              <label className="label-text">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                className="input-field min-h-[100px]" placeholder="Brief professional bio..." />
            </div>

            <div>
              <label className="label-text">Qualifications</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {qualifications.map((q, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-shefa-50 px-3 py-1.5 text-xs font-medium text-shefa-700">
                    <GraduationCap className="h-3 w-3" />{q}
                    <button onClick={() => removeQualification(i)} className="text-shefa-400 hover:text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newQualification} onChange={e => setNewQualification(e.target.value)}
                  placeholder="e.g., MBBS, MD" className="input-field text-sm flex-1"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addQualification())} />
                <button type="button" onClick={addQualification} className="btn-secondary text-sm">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fee' && (
          <div className="space-y-5">
            <div>
              <label className="label-text">Consultation Fee (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-shefa-400" />
                <input type="number" min={0} value={consultationFee}
                  onChange={e => setConsultationFee(parseInt(e.target.value) || 0)}
                  className="input-field pl-10 text-lg font-semibold" />
              </div>
              <p className="mt-2 text-xs text-shefa-400">
                This fee will be charged to patients when they book a consultation with you.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-shefa-600">Set your available time slots for consultations.</p>
              <button onClick={addAvailabilitySlot} className="inline-flex items-center gap-1 text-xs font-semibold text-shefa-600 hover:text-shefa-700">
                <Plus className="h-3.5 w-3.5" /> Add Slot
              </button>
            </div>
            {availability.length === 0 ? (
              <p className="text-center text-sm text-shefa-400 py-8">No availability slots set. Add one above.</p>
            ) : (
              <div className="space-y-3">
                {availability.map((slot: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-shefa-100 p-3">
                    <select value={slot.day} onChange={e => updateAvailability(i, 'day', e.target.value)}
                      className="input-field text-sm flex-1">
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="time" value={slot.startTime}
                      onChange={e => updateAvailability(i, 'startTime', e.target.value)} className="input-field text-sm" />
                    <span className="text-shefa-400">to</span>
                    <input type="time" value={slot.endTime}
                      onChange={e => updateAvailability(i, 'endTime', e.target.value)} className="input-field text-sm" />
                    <button onClick={() => removeAvailability(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-shefa-100">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
