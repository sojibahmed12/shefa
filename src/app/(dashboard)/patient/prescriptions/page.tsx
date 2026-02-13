'use client';

import { useEffect, useState } from 'react';
import {
  Pill, Calendar, User, FileText, Download, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/patient/prescriptions');
      const data = await res.json();
      if (data.success) setPrescriptions(data.data.prescriptions || []);
    } catch {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
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
      <div>
        <h1 className="section-heading">My Prescriptions</h1>
        <p className="mt-1 text-sm text-shefa-500">Digital prescriptions from your consultations</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-shefa-400">
          <Pill className="h-12 w-12 mb-3" />
          <p className="font-medium">No prescriptions yet</p>
          <p className="text-sm mt-1">Prescriptions will appear after consultations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx: any) => (
            <div key={rx._id} className="card">
              <div
                className="flex items-start gap-4 cursor-pointer"
                onClick={() => setExpanded(expanded === rx._id ? null : rx._id)}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                  <Pill className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-shefa-900">{rx.diagnosis}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-shefa-500">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Dr. {rx.doctorId?.userId?.name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(rx.createdAt).toLocaleDateString()}
                        </span>
                        <span>{rx.medications?.length || 0} medication(s)</span>
                      </div>
                    </div>
                    {expanded === rx._id ? (
                      <ChevronUp className="h-5 w-5 text-shefa-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-shefa-400 shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {expanded === rx._id && (
                <div className="mt-4 pl-15 space-y-4 border-t border-shefa-100 pt-4">
                  {/* Medications */}
                  <div>
                    <h4 className="text-sm font-semibold text-shefa-700 mb-2">Medications</h4>
                    <div className="space-y-2">
                      {rx.medications?.map((med: any, i: number) => (
                        <div key={i} className="rounded-lg bg-shefa-50/50 p-3">
                          <p className="font-medium text-sm text-shefa-900">{med.name}</p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-shefa-500">
                            <span>Dosage: {med.dosage}</span>
                            <span>·</span>
                            <span>Frequency: {med.frequency}</span>
                            <span>·</span>
                            <span>Duration: {med.duration}</span>
                          </div>
                          {med.notes && (
                            <p className="mt-1 text-xs text-shefa-400">{med.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  {rx.instructions && (
                    <div>
                      <h4 className="text-sm font-semibold text-shefa-700 mb-1">Instructions</h4>
                      <p className="text-sm text-shefa-600">{rx.instructions}</p>
                    </div>
                  )}

                  {/* Follow-up */}
                  {rx.followUpDate && (
                    <div>
                      <h4 className="text-sm font-semibold text-shefa-700 mb-1">Follow-up Date</h4>
                      <p className="text-sm text-shefa-600">
                        {new Date(rx.followUpDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
