import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Beaker, FlaskConical, Package, FolderHeart, Info, X, ShieldCheck, Search, Globe, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

// Continent display config
const CONTINENT_COLORS: Record<string, string> = {
  'North America': '#3b82f6',
  'South America': '#10b981',
  'Europe': '#8b5cf6',
  'Asia': '#f59e0b',
  'Africa': '#ef4444',
  'Oceania': '#06b6d4',
  'Antarctica': '#64748b',
};

export default function LabsPage() {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Create lab form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [continent, setContinent] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/labs');
      const data = res.data.data;
      setLabs(data);

      // Non-admin users with a single lab — auto-redirect
      if (!isAdmin && data.length === 1) {
        navigate(`/labs/${data[0].id}`, { replace: true });
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  // Filter labs by search query
  const filteredLabs = useMemo(() => {
    if (!searchQuery.trim()) return labs;
    const q = searchQuery.toLowerCase();
    return labs.filter(
      (lab) =>
        lab.name.toLowerCase().includes(q) ||
        lab.country?.toLowerCase().includes(q) ||
        lab.continent?.toLowerCase().includes(q) ||
        lab.description?.toLowerCase().includes(q)
    );
  }, [labs, searchQuery]);

  // Group filtered labs by continent → country
  const groupedLabs = useMemo(() => {
    const groups: Record<string, Record<string, any[]>> = {};
    for (const lab of filteredLabs) {
      const cont = lab.continent || 'Unclassified';
      const cntry = lab.country || 'Unknown';
      if (!groups[cont]) groups[cont] = {};
      if (!groups[cont][cntry]) groups[cont][cntry] = [];
      groups[cont][cntry].push(lab);
    }
    // Sort continents and countries alphabetically
    const sorted: { continent: string; countries: { country: string; labs: any[] }[] }[] = [];
    for (const cont of Object.keys(groups).sort()) {
      const countries = Object.keys(groups[cont])
        .sort()
        .map((c) => ({ country: c, labs: groups[cont][c] }));
      sorted.push({ continent: cont, countries });
    }
    return sorted;
  }, [filteredLabs]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/labs', { name, description, continent: continent || undefined, country: country || undefined });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setContinent('');
      setCountry('');
      fetchLabs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create lab');
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setContinent('');
    setCountry('');
    setError('');
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {isAdmin ? 'Global Laboratory Network' : 'My Laboratories'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            {isAdmin
              ? `${labs.length} laboratories across ${groupedLabs.length} regions`
              : 'Laboratories you have access to.'}
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{ gap: '8px', padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}
          >
            <Plus size={18} /> Add Lab
          </button>
        )}
      </div>

      {/* Search Bar */}
      {labs.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          padding: '10px 20px',
          marginBottom: '28px',
          maxWidth: '520px',
          transition: 'border-color 0.2s',
        }}>
          <Search size={18} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search by lab name, country, or continent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              width: '100%',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
          <div className="animate-pulse" style={{ fontSize: '1.2rem', fontWeight: 500 }}>Loading Laboratories...</div>
        </div>
      ) : labs.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <FolderHeart size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {isAdmin ? 'No Laboratories Registered' : 'No Labs Assigned'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 20px' }}>
            {isAdmin
              ? 'Start by creating a laboratory workspace to catalog chemicals, glassware, and consumables.'
              : 'You do not have access to any labs. Please contact your administrator.'}
          </p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Create First Lab
            </button>
          )}
        </div>
      ) : filteredLabs.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <Search size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            No results for "{searchQuery}"
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Try a different search term.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {groupedLabs.map((group) => {
            const contColor = CONTINENT_COLORS[group.continent] || '#64748b';
            const isCollapsed = collapsedGroups.has(group.continent);

            return (
              <div key={group.continent}>
                {/* Continent Header */}
                <button
                  onClick={() => toggleGroup(group.continent)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 0',
                    marginBottom: isCollapsed ? '0' : '16px',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  {isCollapsed ? (
                    <ChevronRight size={18} color={contColor} />
                  ) : (
                    <ChevronDown size={18} color={contColor} />
                  )}
                  <Globe size={18} color={contColor} />
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}>
                    {group.continent}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 10px',
                    borderRadius: '10px',
                    background: `${contColor}15`,
                    color: contColor,
                  }}>
                    {group.countries.reduce((sum, c) => sum + c.labs.length, 0)} labs
                  </span>
                </button>

                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '12px' }}>
                    {group.countries.map((cGroup) => (
                      <div key={cGroup.country}>
                        {/* Country Label */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '12px',
                          paddingLeft: '8px',
                        }}>
                          <MapPin size={14} color="var(--text-tertiary)" />
                          <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}>
                            {cGroup.country}
                          </span>
                        </div>

                        {/* Lab Cards Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                          gap: '16px',
                          paddingLeft: '8px',
                        }}>
                          {cGroup.labs.map((lab: any) => {
                            const chemCount = lab._count?.chemicals || 0;
                            const glassCount = lab._count?.glassware || 0;
                            const consumableCount = lab._count?.consumables || 0;

                            return (
                              <div
                                key={lab.id}
                                className="glass-card hover-glow"
                                onClick={() => navigate(`/labs/${lab.id}`)}
                                style={{
                                  padding: '22px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  minHeight: '185px',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  position: 'relative',
                                  border: '1px solid var(--border-primary)',
                                  borderRadius: '14px',
                                  borderLeft: `3px solid ${contColor}`,
                                }}
                              >
                                {isAdmin && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(6, 182, 212, 0.1)',
                                    color: '#06b6d4',
                                    fontSize: '0.6rem',
                                    fontWeight: 600,
                                  }}>
                                    <ShieldCheck size={10} /> Admin
                                  </div>
                                )}

                                <div>
                                  <h3 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    marginBottom: '6px',
                                    paddingRight: isAdmin ? '60px' : '0',
                                  }}>
                                    {lab.name}
                                  </h3>
                                  <p style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}>
                                    {lab.description || 'No description provided.'}
                                  </p>
                                </div>

                                {/* Stats */}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginTop: '16px',
                                  paddingTop: '12px',
                                  borderTop: '1px solid var(--border-primary)',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#06b6d4' }} title="Chemicals">
                                    <FlaskConical size={14} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{chemCount}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981' }} title="Glassware">
                                    <Beaker size={14} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{glassCount}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f59e0b' }} title="Consumables">
                                    <Package size={14} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{consumableCount}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Lab Modal */}
      {isModalOpen && isAdmin && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '32px',
            borderRadius: '20px',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          }}>
            <button
              onClick={resetModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Add Regional Laboratory
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Create a new lab workspace. Assign geographic region and grant user access after creation.
            </p>

            <form onSubmit={handleCreateLab} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Info size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Laboratory Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Houston Regional Lab"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Continent
                  </label>
                  <select
                    className="form-control"
                    value={continent}
                    onChange={(e) => setContinent(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select continent</option>
                    {Object.keys(CONTINENT_COLORS).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Country
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  className="form-control"
                  placeholder="Describe the lab's primary function, region, or capabilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={resetModal} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Creating...' : 'Create Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
