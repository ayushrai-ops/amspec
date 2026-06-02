import { useState } from 'react';
import { FileText, Download, Calendar, FileSpreadsheet, Shield } from 'lucide-react';
import api from '../lib/api';
import { useThemeStore } from '../store/themeStore';

const REPORT_TYPES = [
  {
    id: 'expiry-pdf',
    title: 'Expiry Report',
    description: 'PDF report of all chemicals sorted by expiry date with status indicators',
    icon: FileText,
    format: 'PDF',
    color: '#ef4444',
    endpoint: '/reports/expiry/pdf',
    filename: 'expiry-report.pdf',
    contentType: 'application/pdf',
  },
  {
    id: 'inventory-excel',
    title: 'Inventory Summary',
    description: 'Complete Excel spreadsheet of all chemicals with all details and auto-filters',
    icon: FileSpreadsheet,
    format: 'XLSX',
    color: '#10b981',
    endpoint: '/reports/inventory/excel',
    filename: 'inventory-report.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  {
    id: 'audit-excel',
    title: 'Audit Trail Report',
    description: 'Excel log of all user actions, modifications, and system events',
    icon: Shield,
    format: 'XLSX',
    color: '#3b82f6',
    endpoint: '/reports/audit/excel',
    filename: 'audit-report.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
];

export default function ReportsPage() {
  const { theme } = useThemeStore();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleDownload = async (report: typeof REPORT_TYPES[0]) => {
    setDownloading(report.id);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const res = await api.get(`${report.endpoint}?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: report.contentType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-primary)',
        paddingBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} style={{ height: '40px', objectFit: 'contain' }} alt="AmSpec Logo" />
          <div style={{ width: '1px', height: '32px', background: 'var(--border-primary)' }} />
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Reports
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
              Generate and download inventory, expiry, and audit reports
            </p>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Calendar size={18} color="var(--text-tertiary)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Date Range:</span>
        <input type="date" className="form-input" style={{ width: '180px' }} value={dateRange.start}
          onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
        <span style={{ color: 'var(--text-tertiary)' }}>to</span>
        <input type="date" className="form-input" style={{ width: '180px' }} value={dateRange.end}
          onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
      </div>

      {/* Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          const isDownloading = downloading === report.id;
          return (
            <div key={report.id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${report.color}15`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: '16px',
              }}>
                <Icon size={24} color={report.color} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {report.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                {report.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                  background: `${report.color}15`, color: report.color, textTransform: 'uppercase',
                }}>
                  {report.format}
                </span>
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(report)}
                  disabled={isDownloading}
                  style={{ gap: '6px', fontSize: '0.85rem' }}
                >
                  {isDownloading ? 'Generating...' : <><Download size={16} /> Download</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
