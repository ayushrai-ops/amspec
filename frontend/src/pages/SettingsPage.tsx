import { useState } from 'react';
import { Settings, Mail, Bell, Shield, Save } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    fromEmail: 'noreply@amspec.com',
  });
  const [notifications, setNotifications] = useState({
    emailEnabled: true,
    expiryReminders: true,
    lowStockAlerts: true,
    reminderDays: '30,15,7',
  });

  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
          System configuration and preferences
        </p>
      </div>

      {/* Appearance */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={18} color="#06b6d4" /> Appearance
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Theme</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Toggle between dark and light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--border-primary)',
              background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 500, transition: 'all var(--transition-fast)',
            }}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>

      {/* Email Configuration */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={18} color="#06b6d4" /> Email Configuration
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="form-label">SMTP Host</label>
            <input className="form-input" value={emailSettings.smtpHost} onChange={e => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })} />
          </div>
          <div>
            <label className="form-label">SMTP Port</label>
            <input className="form-input" value={emailSettings.smtpPort} onChange={e => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })} />
          </div>
          <div>
            <label className="form-label">SMTP Username</label>
            <input className="form-input" value={emailSettings.smtpUser} onChange={e => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })} placeholder="your-email@gmail.com" />
          </div>
          <div>
            <label className="form-label">SMTP Password</label>
            <input className="form-input" type="password" value={emailSettings.smtpPass} onChange={e => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })} placeholder="App password" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">From Email</label>
            <input className="form-input" value={emailSettings.fromEmail} onChange={e => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="#06b6d4" /> Notification Preferences
        </h3>
        {[
          { key: 'emailEnabled', label: 'Email Notifications', desc: 'Send automated email alerts' },
          { key: 'expiryReminders', label: 'Expiry Reminders', desc: 'Get alerted before chemicals expire' },
          { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Notify when chemicals run low' },
        ].map(item => (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderBottom: '1px solid var(--border-primary)',
          }}>
            <div>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{item.desc}</p>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, [item.key]: !(notifications as any)[item.key] })}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: (notifications as any)[item.key] ? '#06b6d4' : 'var(--bg-tertiary)',
                position: 'relative', transition: 'background var(--transition-fast)',
              }}
            >
              <span style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '3px',
                left: (notifications as any)[item.key] ? '23px' : '3px',
                transition: 'left var(--transition-fast)',
              }} />
            </button>
          </div>
        ))}
        <div style={{ marginTop: '16px' }}>
          <label className="form-label">Reminder Days (comma-separated)</label>
          <input className="form-input" value={notifications.reminderDays}
            onChange={e => setNotifications({ ...notifications, reminderDays: e.target.value })}
            placeholder="30,15,7" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" style={{ gap: '8px' }}>
          <Save size={16} /> Save Settings
        </button>
      </div>
    </div>
  );
}
