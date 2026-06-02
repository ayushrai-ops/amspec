import { useEffect } from 'react';
import { Bell, Check, CheckCheck, AlertCircle, AlertTriangle, Info, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  HIGH: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  MEDIUM: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  LOW: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
};

const TYPE_ICON: Record<string, any> = {
  EXPIRY_ALERT: AlertCircle,
  EXPIRY_WARNING: AlertTriangle,
  LOW_STOCK: Package,
  SYSTEM: Info,
  AUDIT: Info,
};

export default function NotificationsPage() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => { fetchNotifications(); }, []);

  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllAsRead} style={{ gap: '6px' }}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Bell size={48} color="var(--text-tertiary)" />
            <p style={{ color: 'var(--text-tertiary)', marginTop: '12px' }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif: any) => {
            const priority = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.MEDIUM;
            const Icon = TYPE_ICON[notif.type] || Info;
            return (
              <div
                key={notif.id}
                className="glass-card"
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif.id);
                  if (notif.chemicalId) navigate(`/chemicals/${notif.chemicalId}`);
                }}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  opacity: notif.isRead ? 0.7 : 1,
                  borderLeft: `3px solid ${priority.color}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: priority.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={18} color={priority.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{notif.title}</p>
                    {!notif.isRead && (
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4',
                      }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{notif.message}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                    {format(new Date(notif.createdAt), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
                {!notif.isRead && (
                  <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
                    title="Mark as read">
                    <Check size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
