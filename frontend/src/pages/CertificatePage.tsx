import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Upload, X, File, Download, Trash2, Search } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import api from '../lib/api';
import { CERTIFICATE_TYPES } from '../lib/constants';
import { useEffect } from 'react';

export default function CertificatePage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [uploadForm, setUploadForm] = useState({
    name: '', type: 'COA', expiryDate: '', reminderDays: '30', chemicalId: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', ...(search && { search }), ...(typeFilter && { type: typeFilter }) });
      const res = await api.get(`/certificates?${params}`);
      setCertificates(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCertificates(); }, [typeFilter]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setSelectedFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      Object.entries(uploadForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      await api.post('/certificates', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowUpload(false);
      setSelectedFile(null);
      setUploadForm({ name: '', type: 'COA', expiryDate: '', reminderDays: '30', chemicalId: '' });
      fetchCertificates();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this certificate?')) return;
    try {
      await api.delete(`/certificates/${id}`);
      fetchCertificates();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Certificates</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Manage COA, SDS, ISO, and compliance documents
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)} style={{ gap: '6px' }}>
          <Upload size={16} /> Upload Certificate
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '6px 12px', flex: 1, minWidth: '200px' }}>
          <Search size={16} color="var(--text-tertiary)" />
          <input type="text" placeholder="Search certificates..." value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCertificates()}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', width: '100%', outline: 'none' }} />
        </div>
        {['', ...CERTIFICATE_TYPES.map(t => t.value)].map(type => (
          <button key={type} onClick={() => setTypeFilter(type)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${typeFilter === type ? 'var(--border-accent)' : 'var(--border-primary)'}`,
              background: typeFilter === type ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
              color: typeFilter === type ? '#06b6d4' : 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: typeFilter === type ? 600 : 400 }}>
            {type === '' ? 'All' : CERTIFICATE_TYPES.find(t => t.value === type)?.label}
          </button>
        ))}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '520px', padding: '28px', animation: 'slide-up 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Upload Certificate</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div {...getRootProps()} style={{
                padding: '32px', border: `2px dashed ${isDragActive ? '#06b6d4' : 'var(--border-primary)'}`, borderRadius: '12px',
                textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'rgba(6,182,212,0.05)' : 'var(--bg-tertiary)', marginBottom: '16px', transition: 'all var(--transition-fast)',
              }}>
                <input {...getInputProps()} />
                {selectedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                    <File size={24} color="#06b6d4" />
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{selectedFile.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Drag & drop or click to browse</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '4px' }}>PDF, DOCX, XLSX, PNG, JPG (max 10MB)</p>
                  </>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Certificate Name *</label>
                  <input className="form-input" value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })} required placeholder="e.g., COA - Methanol" />
                </div>
                <div>
                  <label className="form-label">Type *</label>
                  <select className="form-input" value={uploadForm.type} onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })}>
                    {CERTIFICATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Expiry Date</label>
                  <input className="form-input" type="date" value={uploadForm.expiryDate} onChange={e => setUploadForm({ ...uploadForm, expiryDate: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Reminder (days)</label>
                  <input className="form-input" type="number" value={uploadForm.reminderDays} onChange={e => setUploadForm({ ...uploadForm, reminderDays: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !selectedFile} style={{ gap: '6px' }}>
                  {uploading ? 'Uploading...' : <><Upload size={16} /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-tertiary)', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>Loading...</p>
        ) : certificates.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px' }}>
            <FileCheck size={48} color="var(--text-tertiary)" />
            <p style={{ color: 'var(--text-tertiary)', marginTop: '12px' }}>No certificates found</p>
          </div>
        ) : (
          certificates.map((cert: any) => (
            <div key={cert.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck size={18} color="#06b6d4" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{cert.name}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{CERTIFICATE_TYPES.find(t => t.value === cert.type)?.label}</p>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                <p>📄 {cert.originalFilename}</p>
                <p>📅 Uploaded: {format(new Date(cert.uploadDate), 'dd MMM yyyy')}</p>
                {cert.expiryDate && <p>⏰ Expires: {format(new Date(cert.expiryDate), 'dd MMM yyyy')}</p>}
                {cert.chemical && <p>🧪 Linked to: {cert.chemical.name}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`${import.meta.env.VITE_API_URL || '/api'}/certificates/${cert.id}/download`} target="_blank" className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '6px', justifyContent: 'center' }}>
                  <Download size={14} /> Download
                </a>
                <button onClick={() => handleDelete(cert.id)} className="btn btn-ghost" style={{ color: '#ef4444', padding: '6px 10px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
