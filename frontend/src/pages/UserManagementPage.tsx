import { useEffect, useState } from 'react';
import { Users, Plus, X, Shield, Check, Ban } from 'lucide-react';
import api from '../lib/api';
import { ROLE_LABELS } from '../lib/constants';
import { format } from 'date-fns';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#ef4444',
  LAB_MANAGER: '#06b6d4',
  CHEMIST: '#10b981',
  STORE_KEEPER: '#f59e0b',
  AUDITOR: '#8b5cf6',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'CHEMIST', department: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users?limit=50');
      setUsers(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', addForm);
      setShowAdd(false);
      setAddForm({ email: '', password: '', firstName: '', lastName: '', role: 'CHEMIST', department: '', phone: '' });
      fetchUsers();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const toggleActive = async (user: any) => {
    try {
      if (user.isActive) {
        await api.delete(`/users/${user.id}`);
      } else {
        await api.put(`/users/${user.id}`, { isActive: true });
      }
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>{users.length} registered users</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ gap: '6px' }}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '500px', padding: '28px', animation: 'slide-up 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Add New User</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div><label className="form-label">First Name *</label><input className="form-input" value={addForm.firstName} onChange={e => setAddForm({ ...addForm, firstName: e.target.value })} required /></div>
                <div><label className="form-label">Last Name *</label><input className="form-input" value={addForm.lastName} onChange={e => setAddForm({ ...addForm, lastName: e.target.value })} required /></div>
                <div><label className="form-label">Email *</label><input className="form-input" type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} required /></div>
                <div><label className="form-label">Password *</label><input className="form-input" type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} required minLength={8} /></div>
                <div><label className="form-label">Role *</label><select className="form-input" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>{Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div><label className="form-label">Department</label><input className="form-input" value={addForm.department} onChange={e => setAddForm({ ...addForm, department: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: `${ROLE_COLORS[user.role] || '#64748b'}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: ROLE_COLORS[user.role] || '#64748b', fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <span style={{ fontWeight: 500 }}>{user.firstName} {user.lastName}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                <td>
                  <span style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                    background: `${ROLE_COLORS[user.role] || '#64748b'}15`,
                    color: ROLE_COLORS[user.role] || '#64748b',
                  }}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.department || '—'}</td>
                <td>
                  <span className={`badge ${user.isActive ? 'status-safe' : 'status-danger'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {user.lastLogin ? format(new Date(user.lastLogin), 'dd MMM, HH:mm') : 'Never'}
                </td>
                <td>
                  <button
                    onClick={() => toggleActive(user)}
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: '0.75rem', color: user.isActive ? '#ef4444' : '#10b981' }}
                    title={user.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {user.isActive ? <Ban size={14} /> : <Check size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
