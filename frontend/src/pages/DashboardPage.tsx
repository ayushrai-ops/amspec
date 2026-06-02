import { useEffect, useState } from 'react';
import {
  FlaskConical, AlertTriangle, Clock, PackageMinus,
  FileCheck, TrendingUp, AlertCircle, Plus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { STATUS_CONFIG } from '../lib/constants';
import { format } from 'date-fns';
import { useThemeStore } from '../store/themeStore';

interface DashboardStats {
  totalChemicals: number;
  expiredChemicals: number;
  nearExpiryChemicals: number;
  lowStockChemicals: number;
  totalCertificates: number;
  recentlyAdded: number;
  unreadNotifications: number;
}

interface ChartData {
  expiryByMonth: { month: string; count: number }[];
  statusDistribution: { safe: number; nearExpiry: number; expired: number };
  hazardDistribution: { name: string; value: number }[];
  topConsumed: { name: string; consumed: number; unit: string }[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [recentChemicals, setRecentChemicals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes, recentRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts'),
          api.get('/dashboard/recent-chemicals'),
        ]);
        setStats(statsRes.data.data);
        setCharts(chartsRes.data.data);
        setRecentChemicals(recentRes.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid var(--border-primary)',
          borderTopColor: '#06b6d4',
          borderRadius: '50%',
          animation: 'spin-slow 0.8s linear infinite',
        }} />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Chemicals',
      value: stats?.totalChemicals || 0,
      icon: FlaskConical,
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      shadow: 'rgba(6, 182, 212, 0.3)',
    },
    {
      title: 'Expired',
      value: stats?.expiredChemicals || 0,
      icon: AlertCircle,
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      shadow: 'rgba(239, 68, 68, 0.3)',
    },
    {
      title: 'Near Expiry',
      value: stats?.nearExpiryChemicals || 0,
      icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      shadow: 'rgba(245, 158, 11, 0.3)',
    },
    {
      title: 'Low Stock',
      value: stats?.lowStockChemicals || 0,
      icon: PackageMinus,
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      shadow: 'rgba(139, 92, 246, 0.3)',
    },
    {
      title: 'Certificates',
      value: stats?.totalCertificates || 0,
      icon: FileCheck,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      shadow: 'rgba(16, 185, 129, 0.3)',
    },
    {
      title: 'Added This Week',
      value: stats?.recentlyAdded || 0,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      shadow: 'rgba(59, 130, 246, 0.3)',
    },
  ];

  const statusPieData = charts ? [
    { name: 'Safe', value: charts.statusDistribution.safe, color: '#10b981' },
    { name: 'Near Expiry', value: charts.statusDistribution.nearExpiry, color: '#f59e0b' },
    { name: 'Expired', value: charts.statusDistribution.expired, color: '#ef4444' },
  ] : [];

  return (
    <div className="page-enter">
      {/* Page Header */}
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
              Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
              Welcome back! Here's your laboratory overview.
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/chemicals/add')}
          style={{ gap: '8px' }}
        >
          <Plus size={18} />
          Add Chemical
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="glass-card"
              style={{
                padding: '20px',
                animation: `slide-up 0.4s ease-out ${index * 0.05}s both`,
                cursor: 'pointer',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {card.title}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${card.shadow}`,
                }}>
                  <Icon size={18} color="white" />
                </div>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1,
                animation: 'count-up 0.6s ease-out',
              }}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Expiry Timeline */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '20px',
          }}>
            Expiry Timeline (Next 12 Months)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={charts?.expiryByMonth || []}>
              <defs>
                <linearGradient id="expiryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#expiryGradient)"
                name="Chemicals Expiring"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Pie */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '20px',
          }}>
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {statusPieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
            {statusPieData.map((entry) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: entry.color,
                }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Hazard Chart + Top Consumed */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Hazard Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '20px',
          }}>
            Hazard Classification
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts?.hazardDistribution || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="var(--text-tertiary)" fontSize={10} width={120} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Count">
                {(charts?.hazardDistribution || []).map((_entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Consumed */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '20px',
          }}>
            Top Consumed Chemicals
          </h3>
          {charts?.topConsumed && charts.topConsumed.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {charts.topConsumed.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: `${COLORS[index % COLORS.length]}20`,
                    color: COLORS[index % COLORS.length],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    <div style={{
                      height: '4px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '2px',
                      marginTop: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, (item.consumed / (charts.topConsumed[0]?.consumed || 1)) * 100)}%`,
                        background: COLORS[index % COLORS.length],
                        borderRadius: '2px',
                        transition: 'width 1s ease-out',
                      }} />
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}>
                    {item.consumed} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', paddingTop: '40px' }}>
              No consumption data yet
            </p>
          )}
        </div>
      </div>

      {/* Recent Chemicals Table */}
      <div className="glass-card" style={{ padding: '24px', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            Recently Added Chemicals
          </h3>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/inventory')}
            style={{ fontSize: '0.8rem' }}
          >
            View All →
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Chemical Name</th>
                <th>CAS Number</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Expiry Date</th>
                <th>Added By</th>
              </tr>
            </thead>
            <tbody>
              {recentChemicals.map((chem: any) => {
                const statusCfg = STATUS_CONFIG[chem.status as keyof typeof STATUS_CONFIG];
                return (
                  <tr
                    key={chem.id}
                    onClick={() => navigate(`/chemicals/${chem.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 500 }}>{chem.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{chem.casNumber || '—'}</td>
                    <td>{chem.quantity} {chem.unit}</td>
                    <td>
                      <span className={`badge ${statusCfg?.bgClass}`}>
                        {statusCfg?.label}
                      </span>
                    </td>
                    <td>{format(new Date(chem.expiryDate), 'dd MMM yyyy')}</td>
                    <td>{chem.addedBy?.firstName} {chem.addedBy?.lastName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
