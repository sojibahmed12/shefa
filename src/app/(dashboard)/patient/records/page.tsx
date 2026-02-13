'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen, Upload, FileText, Download, Trash2, Plus, X,
  Image as ImageIcon, File,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientRecordsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Upload form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState('lab_report');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user.role !== 'PATIENT') { router.push('/'); return; }
    fetchRecords();
  }, [session]);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/patient/records');
      const data = await res.json();
      if (data.success) setRecords(data.data.records || []);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/patient/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          fileType,
          fileUrl: fileUrl || `https://storage.shefa.health/records/${Date.now()}-${title.replace(/\s+/g, '-')}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Record uploaded');
        setShowUpload(false);
        setTitle('');
        setDescription('');
        setFileUrl('');
        fetchRecords();
      } else toast.error(data.error);
    } catch { toast.error('Upload failed'); }
    finally { setSubmitting(false); }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'lab_report': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'imaging': return <ImageIcon className="h-5 w-5 text-violet-500" />;
      case 'prescription': return <FileText className="h-5 w-5 text-emerald-500" />;
      default: return <File className="h-5 w-5 text-shefa-500" />;
    }
  };

  const fileTypeLabels: Record<string, string> = {
    lab_report: 'Lab Report',
    imaging: 'Imaging / Scan',
    prescription: 'Prescription',
    discharge_summary: 'Discharge Summary',
    other: 'Other',
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
          <h1 className="section-heading">Medical Records</h1>
          <p className="mt-1 text-sm text-shefa-500">Upload and manage your medical documents</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-primary text-sm">
          {showUpload ? <><X className="h-4 w-4" /> Cancel</> : <><Upload className="h-4 w-4" /> Upload Record</>}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <form onSubmit={handleUpload} className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-shefa-900">Upload Medical Record</h2>

          <div>
            <label className="label-text">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="input-field" placeholder="e.g., Blood Test Results - Jan 2025" />
          </div>

          <div>
            <label className="label-text">Type</label>
            <select value={fileType} onChange={e => setFileType(e.target.value)} className="input-field">
              {Object.entries(fileTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="input-field min-h-[80px]" placeholder="Optional notes about this record..." />
          </div>

          <div>
            <label className="label-text">File URL (or upload)</label>
            <div className="mt-1 flex items-center justify-center rounded-xl border-2 border-dashed border-shefa-200 p-6 hover:border-shefa-300 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-shefa-300" />
                <p className="mt-2 text-sm text-shefa-500">Drag & drop or click to upload</p>
                <p className="text-xs text-shefa-400">PDF, PNG, JPG up to 10MB</p>
                <input type="text" value={fileUrl} onChange={e => setFileUrl(e.target.value)}
                  placeholder="Or paste file URL..." className="input-field mt-3 text-xs" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Uploading...' : 'Upload Record'}
          </button>
        </form>
      )}

      {/* Records List */}
      <div className="card">
        <h2 className="mb-6 font-display text-lg font-semibold text-shefa-900">
          Your Records ({records.length})
        </h2>
        {records.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-shefa-400">
            <FolderOpen className="h-12 w-12 mb-3" />
            <p>No medical records yet</p>
            <p className="text-xs mt-1">Upload your first medical record above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(record => (
              <div key={record._id} className="flex items-center gap-4 rounded-xl border border-shefa-100 p-4 hover:bg-shefa-50/30 transition-colors">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-shefa-50">
                  {getFileIcon(record.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-shefa-900">{record.title}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-shefa-500">
                      {fileTypeLabels[record.fileType] || record.fileType}
                    </span>
                    <span className="text-xs text-shefa-400">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                    {record.uploadedBy && (
                      <span className="text-xs text-shefa-400">
                        By: {record.uploadedBy === session?.user.id ? 'You' : 'Doctor'}
                      </span>
                    )}
                  </div>
                  {record.description && (
                    <p className="text-xs text-shefa-400 mt-1 line-clamp-1">{record.description}</p>
                  )}
                </div>
                {record.fileUrl && (
                  <a href={record.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-shefa-50 px-3 py-2 text-xs font-semibold text-shefa-700 hover:bg-shefa-100 transition-colors shrink-0">
                    <Download className="h-3.5 w-3.5" /> View
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
