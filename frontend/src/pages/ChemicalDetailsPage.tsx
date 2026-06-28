import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FlaskConical, Calendar, MapPin, AlertTriangle,
  Package, FileCheck, QrCode, Truck, Clock, Trash2, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';
import { STATUS_CONFIG, HAZARD_CLASSES } from '../lib/constants';

export default function ChemicalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chemical, setChemical] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'certificates' | 'history'>('details');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/chemicals/${id}`);
        setChemical(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{
          width: '48px', height: '48px', border: '3px solid var(--border-primary)',
          borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!chemical) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <FlaskConical size={48} color="var(--text-tertiary)" />
        <p style={{ color: 'var(--text-tertiary)', marginTop: '12px' }}>Chemical not found</p>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[chemical.status as keyof typeof STATUS_CONFIG];
  const hazard = HAZARD_CLASSES.find(h => h.value === chemical.hazardClass);
  const daysLeft = Math.ceil((new Date(chemical.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const infoItem = (icon: any, label: string, value: string) => {
    const Icon = icon;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0',
        borderBottom: '1px solid var(--border-primary)' }}>
        <Icon size={16} color="#06b6d4" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{label}</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value || '—'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {chemical.name}
            </h1>
            <span className={`badge ${statusCfg?.bgClass}`}>{statusCfg?.label}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            CAS: {chemical.casNumber || 'N/A'} · Batch: {chemical.batchNumber || 'N/A'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/chemicals/${chemical.id}/edit`)} style={{ gap: '6px' }}>
            <Edit size={16} /> Edit
          </button>
          <button className="btn btn-secondary" onClick={async () => {
            if (window.confirm('Are you sure you want to delete this chemical? This action cannot be undone.')) {
              try {
                await api.delete(`/chemicals/${chemical.id}`);
                navigate('/inventory');
              } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to delete chemical');
              }
            }
          }} style={{ gap: '6px', background: '#ef4444', color: 'white', border: 'none' }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Left Column */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {(['details', 'certificates', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: activeTab === tab ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  color: activeTab === tab ? '#06b6d4' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                {infoItem(FlaskConical, 'Manufacturer', chemical.manufacturer)}
                {infoItem(Package, 'Quantity', `${chemical.quantity} ${chemical.unit}`)}
                {infoItem(Calendar, 'Purchase Date', format(new Date(chemical.purchaseDate), 'dd MMM yyyy'))}
                {infoItem(Calendar, 'Expiry Date', format(new Date(chemical.expiryDate), 'dd MMM yyyy'))}
                {infoItem(AlertTriangle, 'Hazard Class', `${hazard?.icon} ${hazard?.label}`)}
                {infoItem(MapPin, 'Storage Location', chemical.storageLocation)}
                {infoItem(Truck, 'Supplier', chemical.supplierName)}
                {infoItem(Package, 'Min Stock Level', `${chemical.minStockLevel} ${chemical.unit}`)}
              </div>
              {chemical.notes && (
                <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Notes</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{chemical.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              {chemical.certificates?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chemical.certificates.map((cert: any) => (
                    <div key={cert.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-primary)',
                      background: 'var(--bg-tertiary)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileCheck size={18} color="#06b6d4" />
                        <div>
                          <p style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{cert.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {cert.type} · {format(new Date(cert.uploadDate), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_API_URL || '/api'}/certificates/${cert.id}/download`}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8rem' }}
                        target="_blank"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px' }}>
                  No certificates linked to this chemical
                </p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              {chemical.transactions?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chemical.transactions.map((tx: any) => (
                    <div key={tx.id} style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '12px 0', borderBottom: '1px solid var(--border-primary)',
                    }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: tx.transactionType === 'PURCHASE' ? '#10b981' :
                          tx.transactionType === 'DISPOSAL' ? '#ef4444' : '#f59e0b',
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {tx.transactionType} — {tx.quantity} {chemical.unit}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {tx.performedBy?.firstName} {tx.performedBy?.lastName} · {format(new Date(tx.createdAt), 'dd MMM yyyy HH:mm')}
                        </p>
                        {tx.reason && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Reason: {tx.reason}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Balance: {tx.balanceAfter} {chemical.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px' }}>
                  No transaction history yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Expiry Card */}
          <div className="glass-card" style={{
            padding: '24px', textAlign: 'center',
            borderColor: statusCfg?.color,
          }}>
            <Clock size={24} color={statusCfg?.color} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {daysLeft > 0 ? 'Expires In' : 'Expired'}
            </p>
            <p style={{
              fontSize: '2.5rem', fontWeight: 800, color: statusCfg?.color, lineHeight: 1,
            }}>
              {Math.abs(daysLeft)}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              {daysLeft > 0 ? 'days remaining' : 'days ago'}
            </p>
          </div>

          {/* QR Code */}
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
            <QrCode size={18} color="#06b6d4" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>QR Code</p>
            <div style={{
              background: 'white', padding: '16px', borderRadius: '12px',
              display: 'inline-block',
            }}>
              <QRCodeSVG
                value={JSON.stringify({
                  id: chemical.id,
                  name: chemical.name,
                  cas: chemical.casNumber,
                  batch: chemical.batchNumber,
                  expiry: chemical.expiryDate,
                  status: chemical.status,
                })}
                size={160}
                level="M"
              />
            </div>
            <p style={{
              fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '8px',
              fontFamily: 'monospace',
            }}>
              {chemical.barcodeData}
            </p>
          </div>

          {/* Stock Level */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Stock Level</p>
            <div style={{
              height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, chemical.minStockLevel > 0 ? (chemical.quantity / chemical.minStockLevel) * 50 : 100)}%`,
                background: chemical.quantity <= chemical.minStockLevel
                  ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                  : 'linear-gradient(90deg, #10b981, #06b6d4)',
                borderRadius: '4px',
                transition: 'width 1s ease-out',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: '8px',
              fontSize: '0.75rem', color: 'var(--text-tertiary)',
            }}>
              <span>Current: {chemical.quantity} {chemical.unit}</span>
              <span>Min: {chemical.minStockLevel} {chemical.unit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
