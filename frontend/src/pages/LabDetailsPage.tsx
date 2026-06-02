import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FlaskConical, Beaker, Package, Plus, Search,
  Trash2, ShieldAlert, X, Info, ShieldCheck, ChevronRight,
  Users, Clock, Eye, Edit3, Lock, UserPlus, Globe, MapPin
} from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';
import { STATUS_CONFIG, HAZARD_CLASSES } from '../lib/constants';
import { useAuthStore } from '../store/authStore';

type TabType = 'chemicals' | 'glassware' | 'consumables' | 'access';

const ACCESS_LEVEL_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  READ: { label: 'Read Only', color: '#3b82f6', icon: Eye, description: 'Can view lab data only' },
  READ_WRITE: { label: 'Read & Write', color: '#10b981', icon: Edit3, description: 'Can view + add/edit items' },
  FULL_ACCESS: { label: 'Full Access', color: '#f59e0b', icon: ShieldCheck, description: 'Can view + add/edit/delete items' },
  NONE: { label: 'No Access', color: '#ef4444', icon: Lock, description: 'Access revoked' },
};

export default function LabDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [lab, setLab] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('chemicals');
  const [searchQuery, setSearchQuery] = useState('');

  // Access control state (admin)
  const [accessRecords, setAccessRecords] = useState<any[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [unassignedUsers, setUnassignedUsers] = useState<any[]>([]);
  const [grantForm, setGrantForm] = useState({
    userId: '',
    accessLevel: 'READ',
    isTemporary: false,
    expiresAt: '',
  });
  const [grantError, setGrantError] = useState('');
  const [grantSubmitting, setGrantSubmitting] = useState(false);

  // Glassware + Consumable modals
  const [isGlasswareModalOpen, setIsGlasswareModalOpen] = useState(false);
  const [isConsumableModalOpen, setIsConsumableModalOpen] = useState(false);
  const [glassForm, setGlassForm] = useState({
    name: '', type: 'Beaker', size: '', quantity: 1, minStockLevel: 2, storageLocation: ''
  });
  const [consumableForm, setConsumableForm] = useState({
    name: '', category: 'Filters', quantity: 1, unit: 'pcs', minStockLevel: 10, storageLocation: ''
  });
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Effective access level for current user
  const userAccessLevel = lab?.userAccessLevel || (isAdmin ? 'FULL_ACCESS' : 'NONE');
  const canWrite = userAccessLevel === 'READ_WRITE' || userAccessLevel === 'FULL_ACCESS';
  const canDelete = userAccessLevel === 'FULL_ACCESS';

  const fetchLabDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/labs/${id}`);
      setLab(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessRecords = async () => {
    if (!isAdmin) return;
    setAccessLoading(true);
    try {
      const res = await api.get(`/labs/${id}/access`);
      setAccessRecords(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAccessLoading(false);
    }
  };

  const fetchUnassignedUsers = async () => {
    try {
      const res = await api.get(`/labs/${id}/access/unassigned`);
      setUnassignedUsers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLabDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'access' && isAdmin) {
      fetchAccessRecords();
    }
  }, [activeTab]);

  // Handlers
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantForm.userId) return;
    setGrantSubmitting(true);
    setGrantError('');
    try {
      await api.post(`/labs/${id}/access`, {
        userId: grantForm.userId,
        accessLevel: grantForm.accessLevel,
        isTemporary: grantForm.isTemporary,
        expiresAt: grantForm.isTemporary && grantForm.expiresAt ? grantForm.expiresAt : null,
      });
      setShowGrantModal(false);
      setGrantForm({ userId: '', accessLevel: 'READ', isTemporary: false, expiresAt: '' });
      fetchAccessRecords();
    } catch (err: any) {
      setGrantError(err.response?.data?.error || 'Failed to grant access');
    } finally {
      setGrantSubmitting(false);
    }
  };

  const handleUpdateAccess = async (userId: string, accessLevel: string) => {
    try {
      await api.post(`/labs/${id}/access`, { userId, accessLevel });
      fetchAccessRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!window.confirm('Are you sure you want to revoke this user\'s access?')) return;
    try {
      await api.delete(`/labs/${id}/access/${userId}`);
      fetchAccessRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGlassware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!glassForm.name) return;
    setModalSubmitting(true);
    setModalError('');
    try {
      await api.post('/glassware', {
        ...glassForm,
        quantity: parseInt(glassForm.quantity as any),
        minStockLevel: parseInt(glassForm.minStockLevel as any),
        labId: id,
      });
      setIsGlasswareModalOpen(false);
      setGlassForm({ name: '', type: 'Beaker', size: '', quantity: 1, minStockLevel: 2, storageLocation: '' });
      fetchLabDetails();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to add glassware');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleAddConsumable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumableForm.name) return;
    setModalSubmitting(true);
    setModalError('');
    try {
      await api.post('/consumables', {
        ...consumableForm,
        quantity: parseFloat(consumableForm.quantity as any),
        minStockLevel: parseFloat(consumableForm.minStockLevel as any),
        labId: id,
      });
      setIsConsumableModalOpen(false);
      setConsumableForm({ name: '', category: 'Filters', quantity: 1, unit: 'pcs', minStockLevel: 10, storageLocation: '' });
      fetchLabDetails();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to add consumable');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteItem = async (type: TabType, itemId: string) => {
    if (!window.confirm(`Are you sure you want to delete this item?`)) return;
    try {
      const endpoint = type === 'glassware' ? `/glassware/${itemId}` : `/consumables/${itemId}`;
      await api.delete(endpoint);
      fetchLabDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (type: TabType, item: any, delta: number) => {
    try {
      const endpoint = type === 'glassware' ? `/glassware/${item.id}` : `/consumables/${item.id}`;
      const newQty = Math.max(0, item.quantity + delta);
      await api.put(endpoint, { quantity: newQty });
      fetchLabDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
        <h3>Loading workspace details...</h3>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h3>Workspace Not Found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/labs')} style={{ marginTop: '16px' }}>
          Back to Workspaces
        </button>
      </div>
    );
  }

  // Filter items
  const filteredChemicals = lab.chemicals?.filter((c: any) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.casNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredGlassware = lab.glassware?.filter((g: any) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredConsumables = lab.consumables?.filter((c: any) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Tabs config
  const tabs = [
    { id: 'chemicals' as TabType, label: 'Chemicals', icon: FlaskConical, count: lab.chemicals?.length || 0, color: '#06b6d4' },
    { id: 'glassware' as TabType, label: 'Glassware', icon: Beaker, count: lab.glassware?.length || 0, color: '#10b981' },
    { id: 'consumables' as TabType, label: 'Consumables', icon: Package, count: lab.consumables?.length || 0, color: '#f59e0b' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'access' as TabType, label: 'Access Control', icon: Users, count: accessRecords.length, color: '#8b5cf6' });
  }

  // Access level badge
  const accessCfg = ACCESS_LEVEL_CONFIG[userAccessLevel];

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/labs')} style={{ padding: '8px', borderRadius: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Labs</span>
            <ChevronRight size={12} />
            {lab.continent && (
              <>
                <Globe size={12} />
                <span>{lab.continent}</span>
                <ChevronRight size={12} />
              </>
            )}
            {lab.country && (
              <>
                <MapPin size={12} />
                <span>{lab.country}</span>
                <ChevronRight size={12} />
              </>
            )}
            <span style={{ color: 'var(--text-primary)' }}>{lab.name}</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px', letterSpacing: '-0.02em' }}>
            {lab.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px', maxWidth: '800px', lineHeight: 1.5 }}>
            {lab.description || 'No description provided for this laboratory workspace.'}
          </p>
        </div>

        {/* Access Level Badge */}
        {!isAdmin && accessCfg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: `${accessCfg.color}12`,
            border: `1px solid ${accessCfg.color}30`,
            color: accessCfg.color,
            fontSize: '0.8rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            <accessCfg.icon size={16} />
            {accessCfg.label}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-primary)',
        marginBottom: '24px',
        gap: '24px',
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 4px',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.95rem',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                paddingBottom: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={18} color={isActive ? tab.color : 'var(--text-tertiary)'} />
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? `${tab.color}22` : 'var(--bg-input)',
                color: isActive ? tab.color : 'var(--text-tertiary)',
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 600,
              }}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Actions (not for access tab) */}
      {activeTab !== 'access' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-primary)',
            borderRadius: '10px',
            padding: '8px 16px',
            width: '320px',
          }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none', background: 'transparent', color: 'var(--text-primary)',
                fontSize: '0.9rem', outline: 'none', width: '100%',
              }}
            />
          </div>

          <div>
            {activeTab === 'chemicals' && canWrite && (
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/chemicals/add?labId=${id}`)}
                style={{ gap: '8px' }}
              >
                <Plus size={16} /> Add Chemical
              </button>
            )}
            {activeTab === 'glassware' && canWrite && (
              <button
                className="btn btn-primary"
                onClick={() => setIsGlasswareModalOpen(true)}
                style={{ gap: '8px', background: '#10b981', borderColor: '#10b981' }}
              >
                <Plus size={16} /> Add Glassware
              </button>
            )}
            {activeTab === 'consumables' && canWrite && (
              <button
                className="btn btn-primary"
                onClick={() => setIsConsumableModalOpen(true)}
                style={{ gap: '8px', background: '#f59e0b', borderColor: '#f59e0b' }}
              >
                <Plus size={16} /> Add Consumable
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="glass-card" style={{ overflow: 'hidden', padding: '0' }}>

        {/* CHEMICALS TAB */}
        {activeTab === 'chemicals' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chemical Name</th>
                  <th>CAS Number</th>
                  <th>Batch</th>
                  <th>Quantity</th>
                  <th>Hazard</th>
                  <th>Location</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredChemicals.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No chemicals registered in this laboratory.
                    </td>
                  </tr>
                ) : (
                  filteredChemicals.map((chem: any) => {
                    const statusCfg = STATUS_CONFIG[chem.status as keyof typeof STATUS_CONFIG];
                    const hazard = HAZARD_CLASSES.find(h => h.value === chem.hazardClass);
                    return (
                      <tr key={chem.id} onClick={() => navigate(`/chemicals/${chem.id}`)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FlaskConical size={14} color="#06b6d4" />
                            {chem.name}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{chem.casNumber || '—'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{chem.batchNumber || '—'}</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{chem.quantity}</span>
                          <span style={{ color: 'var(--text-tertiary)', marginLeft: '4px', fontSize: '0.8rem' }}>{chem.unit}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {hazard?.icon} {hazard?.label?.split(' ')[0]}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{chem.storageLocation || '—'}</td>
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
        )}

        {/* GLASSWARE TAB */}
        {activeTab === 'glassware' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Storage Location</th>
                  <th>Min Stock</th>
                  <th style={{ textAlign: 'center' }}>Quantity</th>
                  {canDelete && <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredGlassware.length === 0 ? (
                  <tr>
                    <td colSpan={canDelete ? 7 : 6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No glassware registered in this laboratory.
                    </td>
                  </tr>
                ) : (
                  filteredGlassware.map((item: any) => {
                    const isLowStock = item.quantity <= item.minStockLevel;
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Beaker size={14} color="#10b981" />
                            {item.name}
                          </div>
                        </td>
                        <td>{item.type}</td>
                        <td style={{ fontWeight: 500 }}>{item.size || '—'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{item.storageLocation || '—'}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.minStockLevel}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            {canWrite && (
                              <button className="btn btn-ghost" onClick={() => updateQuantity('glassware', item, -1)}
                                style={{ padding: '2px 8px', minWidth: 'auto', fontSize: '1rem', height: '24px' }}>-</button>
                            )}
                            <span style={{
                              fontWeight: 700,
                              color: isLowStock ? '#ef4444' : 'var(--text-primary)',
                              background: isLowStock ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                              padding: '2px 8px', borderRadius: '6px',
                            }}>{item.quantity}</span>
                            {canWrite && (
                              <button className="btn btn-ghost" onClick={() => updateQuantity('glassware', item, 1)}
                                style={{ padding: '2px 8px', minWidth: 'auto', fontSize: '1rem', height: '24px' }}>+</button>
                            )}
                          </div>
                        </td>
                        {canDelete && (
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => handleDeleteItem('glassware', item.id)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <Trash2 size={16} className="text-danger" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* CONSUMABLES TAB */}
        {activeTab === 'consumables' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Storage Location</th>
                  <th>Min Stock</th>
                  <th style={{ textAlign: 'center' }}>Quantity / Unit</th>
                  {canDelete && <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredConsumables.length === 0 ? (
                  <tr>
                    <td colSpan={canDelete ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No consumables registered in this laboratory.
                    </td>
                  </tr>
                ) : (
                  filteredConsumables.map((item: any) => {
                    const isLowStock = item.quantity <= item.minStockLevel;
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={14} color="#f59e0b" />
                            {item.name}
                          </div>
                        </td>
                        <td>
                          <span style={{ background: 'var(--bg-input)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem' }}>
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{item.storageLocation || '—'}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.minStockLevel}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            {canWrite && (
                              <button className="btn btn-ghost" onClick={() => updateQuantity('consumables', item, -1)}
                                style={{ padding: '2px 8px', minWidth: 'auto', height: '24px' }}>-</button>
                            )}
                            <span style={{
                              fontWeight: 700,
                              color: isLowStock ? '#ef4444' : 'var(--text-primary)',
                              background: isLowStock ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                              padding: '2px 8px', borderRadius: '6px',
                            }}>{item.quantity} {item.unit}</span>
                            {canWrite && (
                              <button className="btn btn-ghost" onClick={() => updateQuantity('consumables', item, 1)}
                                style={{ padding: '2px 8px', minWidth: 'auto', height: '24px' }}>+</button>
                            )}
                          </div>
                        </td>
                        {canDelete && (
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => handleDeleteItem('consumables', item.id)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <Trash2 size={16} className="text-danger" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ACCESS CONTROL TAB (Admin Only) */}
        {activeTab === 'access' && isAdmin && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  User Access Management
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Control who can view, edit, or fully manage this lab.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => { setShowGrantModal(true); fetchUnassignedUsers(); }}
                style={{ gap: '6px', background: '#8b5cf6', borderColor: '#8b5cf6' }}
              >
                <UserPlus size={16} /> Grant Access
              </button>
            </div>

            {/* Access Level Legend */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}>
              {Object.entries(ACCESS_LEVEL_CONFIG).filter(([k]) => k !== 'NONE').map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: `${cfg.color}10`,
                    border: `1px solid ${cfg.color}25`,
                    fontSize: '0.7rem',
                    color: cfg.color,
                    fontWeight: 600,
                  }}>
                    <Icon size={12} />
                    {cfg.label} — {cfg.description}
                  </div>
                );
              })}
            </div>

            {/* Access Records Table */}
            {accessLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Loading access records...
              </div>
            ) : accessRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>No users have been granted access to this lab yet.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Access Level</th>
                    <th>Type</th>
                    <th>Expires</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessRecords.map((rec: any) => {
                    const cfg = ACCESS_LEVEL_CONFIG[rec.accessLevel];
                    const isExpired = rec.isTemporary && rec.expiresAt && new Date(rec.expiresAt) < new Date();
                    return (
                      <tr key={rec.id} style={{ opacity: isExpired ? 0.5 : 1 }}>
                        <td style={{ fontWeight: 600 }}>
                          {rec.user.firstName} {rec.user.lastName}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rec.user.email}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                            background: 'var(--bg-input)', color: 'var(--text-secondary)',
                          }}>
                            {rec.user.role}
                          </span>
                        </td>
                        <td>
                          <select
                            value={rec.accessLevel}
                            onChange={(e) => handleUpdateAccess(rec.userId, e.target.value)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              border: `1px solid ${cfg?.color || '#64748b'}40`,
                              background: `${cfg?.color || '#64748b'}10`,
                              color: cfg?.color || 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="READ">Read Only</option>
                            <option value="READ_WRITE">Read & Write</option>
                            <option value="FULL_ACCESS">Full Access</option>
                            <option value="NONE">No Access</option>
                          </select>
                        </td>
                        <td>
                          {rec.isTemporary ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                              background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: isExpired ? '#ef4444' : '#f59e0b',
                            }}>
                              <Clock size={10} />
                              {isExpired ? 'Expired' : 'Temporary'}
                            </span>
                          ) : (
                            <span style={{
                              padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                              background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                            }}>Permanent</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {rec.expiresAt ? format(new Date(rec.expiresAt), 'dd MMM yyyy') : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleRevokeAccess(rec.userId)}
                              title="Revoke access"
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* GRANT ACCESS MODAL */}
      {showGrantModal && isAdmin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '32px', borderRadius: '20px', position: 'relative' }}>
            <button onClick={() => setShowGrantModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Grant Lab Access</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Assign a user permission to access <strong>{lab.name}</strong>.
            </p>

            <form onSubmit={handleGrantAccess} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {grantError && (
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Info size={14} />{grantError}
                </div>
              )}

              <div>
                <label className="form-label">Select User *</label>
                <select
                  className="form-control"
                  value={grantForm.userId}
                  onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="">Choose a user...</option>
                  {unassignedUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Access Level *</label>
                <select
                  className="form-control"
                  value={grantForm.accessLevel}
                  onChange={(e) => setGrantForm({ ...grantForm, accessLevel: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="READ">Read Only — Can view lab data</option>
                  <option value="READ_WRITE">Read & Write — Can add/edit items</option>
                  <option value="FULL_ACCESS">Full Access — Can manage everything</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={grantForm.isTemporary}
                    onChange={(e) => setGrantForm({ ...grantForm, isTemporary: e.target.checked, expiresAt: '' })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <Clock size={14} />
                  Temporary access (with expiry date)
                </label>

                {grantForm.isTemporary && (
                  <div style={{ marginTop: '10px' }}>
                    <label className="form-label">Expiry Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={grantForm.expiresAt}
                      onChange={(e) => setGrantForm({ ...grantForm, expiresAt: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required={grantForm.isTemporary}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGrantModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={grantSubmitting} style={{ flex: 1, background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                  {grantSubmitting ? 'Granting...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLASSWARE ADD MODAL */}
      {isGlasswareModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '32px', borderRadius: '20px', position: 'relative' }}>
            <button onClick={() => setIsGlasswareModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Add Glassware</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>Register a glassware device inside this lab.</p>

            <form onSubmit={handleAddGlassware} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {modalError && <div style={{ color: '#ef4444', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '6px' }}>{modalError}</div>}
              <div>
                <label className="form-label">Item Name *</label>
                <input type="text" className="form-control" placeholder="e.g. Borosilicate Beaker" value={glassForm.name} onChange={(e) => setGlassForm({...glassForm, name: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-control" value={glassForm.type} onChange={(e) => setGlassForm({...glassForm, type: e.target.value})} style={{ width: '100%' }}>
                    {['Beaker', 'Flask', 'Pipette', 'Graduated Cylinder', 'Burette', 'Test Tube', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Size (e.g. 250mL)</label>
                  <input type="text" className="form-control" placeholder="250mL" value={glassForm.size} onChange={(e) => setGlassForm({...glassForm, size: e.target.value})} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Initial Quantity *</label>
                  <input type="number" min={0} className="form-control" value={glassForm.quantity} onChange={(e) => setGlassForm({...glassForm, quantity: parseInt(e.target.value) || 0})} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Min Stock Level</label>
                  <input type="number" min={0} className="form-control" value={glassForm.minStockLevel} onChange={(e) => setGlassForm({...glassForm, minStockLevel: parseInt(e.target.value) || 0})} style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <label className="form-label">Storage Location</label>
                <input type="text" className="form-control" placeholder="e.g. Shelf G-02" value={glassForm.storageLocation} onChange={(e) => setGlassForm({...glassForm, storageLocation: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsGlasswareModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting} style={{ flex: 1, background: '#10b981', borderColor: '#10b981' }}>
                  {modalSubmitting ? 'Adding...' : 'Save Glassware'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONSUMABLE ADD MODAL */}
      {isConsumableModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '32px', borderRadius: '20px', position: 'relative' }}>
            <button onClick={() => setIsConsumableModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Add Consumable</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>Register a laboratory consumable resource.</p>

            <form onSubmit={handleAddConsumable} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {modalError && <div style={{ color: '#ef4444', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '6px' }}>{modalError}</div>}
              <div>
                <label className="form-label">Item Name *</label>
                <input type="text" className="form-control" placeholder="e.g. Syringe Filters" value={consumableForm.name} onChange={(e) => setConsumableForm({...consumableForm, name: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-control" value={consumableForm.category} onChange={(e) => setConsumableForm({...consumableForm, category: e.target.value})} style={{ width: '100%' }}>
                    {['Filters', 'Safety Wear', 'Tips', 'Vials', 'Syringes', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Unit (e.g. pcs, boxes)</label>
                  <input type="text" className="form-control" placeholder="pcs" value={consumableForm.unit} onChange={(e) => setConsumableForm({...consumableForm, unit: e.target.value})} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Initial Quantity *</label>
                  <input type="number" step="any" min={0} className="form-control" value={consumableForm.quantity} onChange={(e) => setConsumableForm({...consumableForm, quantity: parseFloat(e.target.value) || 0})} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Min Stock Level</label>
                  <input type="number" step="any" min={0} className="form-control" value={consumableForm.minStockLevel} onChange={(e) => setConsumableForm({...consumableForm, minStockLevel: parseFloat(e.target.value) || 0})} style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <label className="form-label">Storage Location</label>
                <input type="text" className="form-control" placeholder="e.g. Cabinet C-09" value={consumableForm.storageLocation} onChange={(e) => setConsumableForm({...consumableForm, storageLocation: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsConsumableModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting} style={{ flex: 1, background: '#f59e0b', borderColor: '#f59e0b' }}>
                  {modalSubmitting ? 'Adding...' : 'Save Consumable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
