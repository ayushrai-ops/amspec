import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FlaskConical, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import { HAZARD_CLASSES, UNITS } from '../lib/constants';

export default function AddChemicalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLabId = searchParams.get('labId') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [labs, setLabs] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', casNumber: '', batchNumber: '', manufacturer: '',
    quantity: '', unit: 'L', purchaseDate: '', expiryDate: '',
    hazardClass: 'NON_HAZARDOUS', storageLocation: '',
    supplierName: '', supplierContact: '', minStockLevel: '',
    notes: '', labId: initialLabId || '',
  });

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const res = await api.get('/labs');
        setLabs(res.data.data);
      } catch (err) {
        console.error('Failed to fetch labs', err);
      }
    };
    fetchLabs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        quantity: parseFloat(form.quantity),
        minStockLevel: form.minStockLevel ? parseFloat(form.minStockLevel) : 0,
        labId: form.labId || null,
      };
      await api.post('/chemicals', payload);
      if (form.labId) {
        navigate(`/labs/${form.labId}`);
      } else {
        navigate('/inventory');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.details?.map((d: any) => d.message).join(', ') || 'Failed to add chemical');
    } finally {
      setLoading(false);
    }
  };

  const fieldGroup = (label: string, name: string, type = 'text', required = false, placeholder = '') => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label className="form-label" htmlFor={name}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
      <input
        id={name} name={name} type={type}
        className="form-input"
        value={(form as any)[name]}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="page-enter" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Add New Chemical
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Enter the chemical details below
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444', fontSize: '0.875rem', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={18} color="#06b6d4" /> Basic Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {fieldGroup('Chemical Name', 'name', 'text', true, 'e.g., Methanol (HPLC Grade)')}
            {fieldGroup('CAS Number', 'casNumber', 'text', false, 'e.g., 67-56-1')}
            {fieldGroup('Batch Number', 'batchNumber', 'text', false, 'e.g., MET-2024-001')}
            {fieldGroup('Manufacturer', 'manufacturer', 'text', false, 'e.g., Merck')}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="form-label" htmlFor="labId">Laboratory Workspace</label>
              <select id="labId" name="labId" className="form-input" value={form.labId} onChange={handleChange}>
                <option value="">General Inventory (No Specific Lab)</option>
                {labs.map(lab => (
                  <option key={lab.id} value={lab.id}>{lab.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quantity & Classification */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Quantity & Classification
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {fieldGroup('Quantity', 'quantity', 'number', true, 'e.g., 2.5')}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="form-label" htmlFor="unit">Unit <span style={{ color: '#ef4444' }}>*</span></label>
              <select id="unit" name="unit" className="form-input" value={form.unit} onChange={handleChange}>
                {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            {fieldGroup('Min Stock Level', 'minStockLevel', 'number', false, '0')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="form-label" htmlFor="hazardClass">Hazard Classification</label>
              <select id="hazardClass" name="hazardClass" className="form-input" value={form.hazardClass} onChange={handleChange}>
                {HAZARD_CLASSES.map(h => <option key={h.value} value={h.value}>{h.icon} {h.label}</option>)}
              </select>
            </div>
            {fieldGroup('Storage Location', 'storageLocation', 'text', false, 'e.g., Cabinet A-01')}
          </div>
        </div>

        {/* Dates */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Dates
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {fieldGroup('Purchase Date', 'purchaseDate', 'date', true)}
            {fieldGroup('Expiry Date', 'expiryDate', 'date', true)}
          </div>
        </div>

        {/* Supplier */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Supplier Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {fieldGroup('Supplier Name', 'supplierName', 'text', false, 'e.g., Fisher Scientific')}
            {fieldGroup('Supplier Contact', 'supplierContact', 'text', false, '+1-800-766-7000')}
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Additional Notes
          </h3>
          <textarea
            name="notes"
            className="form-input"
            rows={3}
            value={form.notes}
            onChange={handleChange}
            placeholder="Any additional notes about this chemical..."
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: '8px', minWidth: '160px' }}>
            {loading ? 'Saving...' : <><Save size={16} /> Save Chemical</>}
          </button>
        </div>
      </form>
    </div>
  );
}
