'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText, Plus, Pill, Trash2, Calendar, X, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

const emptyMed: Medication = { name: '', dosage: '', frequency: '', duration: '', notes: '' };

export default function DoctorPrescriptionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!appointmentId);

  // Form state
  const [formAppointmentId, setFormAppointmentId] = useState(appointmentId || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState<Medication[]>([{ ...emptyMed }]);
  const [instructions, setInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Appointments for dropdown
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user.role !== 'DOCTOR') { router.push('/'); return; }
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const [rxRes, aptRes] = await Promise.all([
        fetch('/api/patient/prescriptions'),
        fetch('/api/doctor/appointments?status=CONFIRMED&limit=50'),
      ]);
      const rxData = await rxRes.json();
      const aptData = await aptRes.json();
      if (rxData.success) setPrescriptions(rxData.data.prescriptions || []);
      if (aptData.success) setAppointments(aptData.data.appointments || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const addMedication = () => setMedications(prev => [...prev, { ...emptyMed }]);
  const removeMedication = (i: number) => setMedications(prev => prev.filter((_, idx) => idx !== i));
  const updateMedication = (i: number, field: keyof Medication, value: string) => {
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAppointmentId) { toast.error('Select an appointment'); return; }
    if (!diagnosis.trim()) { toast.error('Diagnosis is required'); return; }
    if (medications.some(m => !m.name || !m.dosage || !m.frequency || !m.duration)) {
      toast.error('Fill all medication fields'); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/patient/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: formAppointmentId,
          diagnosis,
          medications,
          instructions,
          followUpDate: followUpDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Prescription created');
        setShowForm(false);
        setDiagnosis('');
        setMedications([{ ...emptyMed }]);
        setInstructions('');
        setFollowUpDate('');
        setFormAppointmentId('');
        fetchData();
      } else toast.error(data.error);
    } catch { toast.error('Failed to create'); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading">Prescriptions</h1>
          <p className="mt-1 text-sm text-shefa-500">Create and manage digital prescriptions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> New Prescription</>}
        </button>
      </div>

      {/* Create Prescription Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <h2 className="font-display text-lg font-semibold text-shefa-900">New Prescription</h2>

          {/* Appointment select */}
          <div>
            <label className="label-text">Appointment</label>
            <select value={formAppointmentId} onChange={e => setFormAppointmentId(e.target.value)}
              className="input-field">
              <option value="">Select appointment...</option>
              {appointments.map(a => (
                <option key={a._id} value={a._id}>
                  {a.patientId?.userId?.name} — {new Date(a.scheduledDate).toLocaleDateString()} {a.timeSlot?.start}
                </option>
              ))}
            </select>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="label-text">Diagnosis *</label>
            <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
              className="input-field" placeholder="e.g., Acute bronchitis" />
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label-text mb-0">Medications *</label>
              <button type="button" onClick={addMedication}
                className="inline-flex items-center gap-1 text-xs font-semibold text-shefa-600 hover:text-shefa-700">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="space-y-3">
              {medications.map((med, i) => (
                <div key={i} className="rounded-xl border border-shefa-100 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-shefa-500">Medication #{i + 1}</span>
                    {medications.length > 1 && (
                      <button type="button" onClick={() => removeMedication(i)}
                        className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Medicine name *" value={med.name}
                      onChange={e => updateMedication(i, 'name', e.target.value)} className="input-field text-sm" />
                    <input type="text" placeholder="Dosage (e.g., 500mg) *" value={med.dosage}
                      onChange={e => updateMedication(i, 'dosage', e.target.value)} className="input-field text-sm" />
                    <input type="text" placeholder="Frequency (e.g., 3x daily) *" value={med.frequency}
                      onChange={e => updateMedication(i, 'frequency', e.target.value)} className="input-field text-sm" />
                    <input type="text" placeholder="Duration (e.g., 7 days) *" value={med.duration}
                      onChange={e => updateMedication(i, 'duration', e.target.value)} className="input-field text-sm" />
                  </div>
                  <input type="text" placeholder="Additional notes (optional)" value={med.notes}
                    onChange={e => updateMedication(i, 'notes', e.target.value)} className="input-field text-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Instructions & Follow-up */}
          <div>
            <label className="label-text">General Instructions</label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
              className="input-field min-h-[80px]" placeholder="e.g., Take after meals, drink plenty of water..." />
          </div>

          <div>
            <label className="label-text">Follow-up Date</label>
            <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
              className="input-field" />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating...' : 'Create Prescription'}
          </button>
        </form>
      )}

      {/* Prescriptions List */}
      <div className="card">
        <h2 className="mb-6 font-display text-lg font-semibold text-shefa-900">
          Recent Prescriptions
        </h2>
        {prescriptions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-shefa-400">
            <FileText className="h-12 w-12 mb-3" />
            <p>No prescriptions created yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map(rx => (
              <div key={rx._id} className="rounded-xl border border-shefa-100 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-shefa-900">{rx.diagnosis}</h3>
                    <p className="text-xs text-shefa-500 mt-0.5">
                      Patient: {rx.patientId?.userId?.name || 'N/A'} · {new Date(rx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {rx.followUpDate && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                      <Calendar className="h-3 w-3" />
                      Follow-up: {new Date(rx.followUpDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {rx.medications?.map((med: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-shefa-50/50 p-3">
                      <Pill className="h-4 w-4 mt-0.5 text-shefa-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-shefa-800">{med.name} — {med.dosage}</p>
                        <p className="text-xs text-shefa-500">{med.frequency} · {med.duration}</p>
                        {med.notes && <p className="text-xs text-shefa-400 mt-0.5">{med.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {rx.instructions && (
                  <p className="text-xs text-shefa-600 italic border-t border-shefa-100 pt-2">
                    📋 {rx.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
