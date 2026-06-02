import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Download, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import { STATUS_CONFIG, HAZARD_CLASSES } from '../lib/constants';

export default function InventoryPage() {
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchChemicals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await api.get(`/chemicals?${params}`);
      setChemicals(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChemicals(); }, [pagination.page, sortBy, sortOrder, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchChemicals();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/reports/inventory/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory-report.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-enter">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Chemical Inventory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            {pagination.total} chemicals in inventory
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleExport} style={{ gap: '6px' }}>
            <Download size={16} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/chemicals/add')} style={{ gap: '6px' }}>
            <Plus size={16} /> Add Chemical
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{
        padding: '16px 20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-primary)',
          borderRadius: '8px',
          padding: '6px 12px',
          flex: 1,
          minWidth: '250px',
        }}>
          <Search size={16} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search by name, CAS, batch, manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none', background: 'transparent', color: 'var(--text-primary)',
              fontSize: '0.85rem', width: '100%', outline: 'none',
            }}
          />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-tertiary)" />
          {['', 'SAFE', 'NEAR_EXPIRY', 'EXPIRED'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPagination(prev => ({ ...prev, page: 1 })); }}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: `1px solid ${statusFilter === status ? 'var(--border-accent)' : 'var(--border-primary)'}`,
                background: statusFilter === status ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                color: statusFilter === status ? '#06b6d4' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: statusFilter === status ? 600 : 400,
                transition: 'all var(--transition-fast)',
              }}
            >
              {status === '' ? 'All' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Chemical Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>CAS Number</th>
                <th>Batch</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('quantity')}>
                  Quantity {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Hazard</th>
                <th>Location</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('expiryDate')}>
                  Expiry Date {sortBy === 'expiryDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    Loading...
                  </td>
                </tr>
              ) : chemicals.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    <FlaskConical size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: 'var(--text-tertiary)' }}>No chemicals found</p>
                  </td>
                </tr>
              ) : (
                chemicals.map((chem: any) => {
                  const statusCfg = STATUS_CONFIG[chem.status as keyof typeof STATUS_CONFIG];
                  const hazard = HAZARD_CLASSES.find(h => h.value === chem.hazardClass);
                  return (
                    <tr
                      key={chem.id}
                      onClick={() => navigate(`/chemicals/${chem.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FlaskConical size={14} color="#06b6d4" />
                          {chem.name}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {chem.casNumber || '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {chem.batchNumber || '—'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{chem.quantity}</span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: '4px', fontSize: '0.8rem' }}>{chem.unit}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem' }}>
                          {hazard?.icon} {hazard?.label?.split(' ')[0]}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {chem.storageLocation || '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {format(new Date(chem.expiryDate), 'dd MMM yyyy')}
                      </td>
                      <td>
                        <span className={`badge ${statusCfg?.bgClass}`}>
                          {statusCfg?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderTop: '1px solid var(--border-primary)',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn btn-ghost"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                style={{ padding: '6px 10px' }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: pagination.page === page ? '#06b6d4' : 'transparent',
                      color: pagination.page === page ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: pagination.page === page ? 600 : 400,
                    }}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                className="btn btn-ghost"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                style={{ padding: '6px 10px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
